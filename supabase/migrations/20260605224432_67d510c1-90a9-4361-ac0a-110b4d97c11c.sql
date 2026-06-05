CREATE TABLE IF NOT EXISTS public.convinter_likes (
  liker_id   uuid NOT NULL,
  liked_id   uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (liker_id, liked_id),
  CHECK (liker_id <> liked_id)
);

CREATE INDEX IF NOT EXISTS convinter_likes_liked_idx
  ON public.convinter_likes (liked_id);

GRANT SELECT, INSERT, DELETE ON public.convinter_likes TO authenticated;
GRANT ALL ON public.convinter_likes TO service_role;

ALTER TABLE public.convinter_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS likes_select_own ON public.convinter_likes;
CREATE POLICY likes_select_own ON public.convinter_likes
  FOR SELECT TO authenticated USING (auth.uid() = liker_id);

DROP POLICY IF EXISTS likes_insert_own ON public.convinter_likes;
CREATE POLICY likes_insert_own ON public.convinter_likes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = liker_id);

DROP POLICY IF EXISTS likes_delete_own ON public.convinter_likes;
CREATE POLICY likes_delete_own ON public.convinter_likes
  FOR DELETE TO authenticated USING (auth.uid() = liker_id);

CREATE OR REPLACE FUNCTION public.convinter_like_profile(p_target uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  a uuid;
  b uuid;
  reciprocal boolean;
  existing_consent integer;
  new_consent integer;
  other_name text;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  IF p_target IS NULL OR p_target = me THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_TARGET');
  END IF;

  PERFORM public.convinter_guard('like');
  PERFORM public.convinter_assert_not_blocked(p_target);

  INSERT INTO public.convinter_likes(liker_id, liked_id)
  VALUES (me, p_target)
  ON CONFLICT (liker_id, liked_id) DO NOTHING;

  SELECT EXISTS (
    SELECT 1 FROM public.convinter_likes
    WHERE liker_id = p_target AND liked_id = me
  ) INTO reciprocal;

  IF NOT reciprocal THEN
    RETURN jsonb_build_object('ok', true, 'matched', false);
  END IF;

  a := least(me, p_target);
  b := greatest(me, p_target);

  SELECT consent_level INTO existing_consent
    FROM public.convinter_pair_consent
   WHERE user_a = a AND user_b = b;

  new_consent := greatest(coalesce(existing_consent, 0), 1);

  INSERT INTO public.convinter_pair_consent(user_a, user_b, consent_level, updated_at)
  VALUES (a, b, new_consent, now())
  ON CONFLICT (user_a, user_b)
  DO UPDATE SET consent_level = EXCLUDED.consent_level,
                updated_at    = now();

  IF coalesce(existing_consent, 0) < 1 THEN
    PERFORM public.convinter_notify(
      me, 'MATCH_CREATED', jsonb_build_object('with', p_target)
    );
    PERFORM public.convinter_notify(
      p_target, 'MATCH_CREATED', jsonb_build_object('with', me)
    );
  END IF;

  SELECT display_name INTO other_name
    FROM public.convinter_profiles
   WHERE user_id = p_target;

  RETURN jsonb_build_object(
    'ok', true,
    'matched', true,
    'other_user', p_target,
    'other_name', other_name,
    'consent_level', new_consent
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_like_profile(uuid) TO authenticated;