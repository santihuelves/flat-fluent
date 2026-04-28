DO $$ BEGIN
  CREATE TYPE public.convinter_intention_type AS ENUM ('seek_room','offer_room','seek_flatmate');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.convinter_urgency_level AS ENUM ('urgent','soon','flexible','exploring');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.convinter_profile_intentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  intention_type public.convinter_intention_type NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  priority int NOT NULL DEFAULT 0,
  urgency public.convinter_urgency_level NOT NULL DEFAULT 'flexible',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, intention_type, active)
);

ALTER TABLE public.convinter_profile_intentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "intentions_select_public"
  ON public.convinter_profile_intentions FOR SELECT
  TO authenticated USING (active = true);

CREATE POLICY "intentions_insert_own"
  ON public.convinter_profile_intentions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = profile_id);

CREATE POLICY "intentions_update_own"
  ON public.convinter_profile_intentions FOR UPDATE
  TO authenticated USING (auth.uid() = profile_id);

CREATE POLICY "intentions_delete_own"
  ON public.convinter_profile_intentions FOR DELETE
  TO authenticated USING (auth.uid() = profile_id);

CREATE OR REPLACE FUNCTION public.convinter_set_intention(
  p_intention_type text,
  p_is_primary boolean DEFAULT false,
  p_urgency text DEFAULT 'flexible',
  p_details jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid := auth.uid();
  intention_id uuid;
  valid_intention_type public.convinter_intention_type;
  valid_urgency public.convinter_urgency_level;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;
  IF p_intention_type NOT IN ('seek_room','offer_room','seek_flatmate') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_INTENTION_TYPE');
  END IF;
  valid_intention_type := p_intention_type::public.convinter_intention_type;
  IF p_urgency NOT IN ('urgent','soon','flexible','exploring') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_URGENCY');
  END IF;
  valid_urgency := p_urgency::public.convinter_urgency_level;

  IF p_is_primary THEN
    UPDATE public.convinter_profile_intentions
       SET is_primary = false
     WHERE profile_id = me AND is_primary = true;
  END IF;

  INSERT INTO public.convinter_profile_intentions (
    profile_id, intention_type, is_primary, urgency, details, active
  ) VALUES (
    me, valid_intention_type, p_is_primary, valid_urgency, p_details, true
  )
  ON CONFLICT (profile_id, intention_type, active)
  DO UPDATE SET
    is_primary = EXCLUDED.is_primary,
    urgency = EXCLUDED.urgency,
    details = EXCLUDED.details,
    updated_at = now()
  RETURNING id INTO intention_id;

  RETURN jsonb_build_object('ok', true, 'intention_id', intention_id);
END; $$;

GRANT EXECUTE ON FUNCTION public.convinter_set_intention(text, boolean, text, jsonb) TO authenticated;

CREATE OR REPLACE FUNCTION public.convinter_remove_intention(p_intention_type text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid := auth.uid();
  valid_intention_type public.convinter_intention_type;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;
  IF p_intention_type NOT IN ('seek_room','offer_room','seek_flatmate') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_INTENTION_TYPE');
  END IF;
  valid_intention_type := p_intention_type::public.convinter_intention_type;

  UPDATE public.convinter_profile_intentions
     SET active = false, updated_at = now()
   WHERE profile_id = me
     AND intention_type = valid_intention_type
     AND active = true;

  RETURN jsonb_build_object('ok', true);
END; $$;

GRANT EXECUTE ON FUNCTION public.convinter_remove_intention(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.convinter_get_intentions(p_profile_id uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  target_profile uuid;
  intentions jsonb;
BEGIN
  target_profile := COALESCE(p_profile_id, auth.uid());
  IF target_profile IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  SELECT jsonb_agg(jsonb_build_object(
    'id', pi.id,
    'intention_type', pi.intention_type,
    'is_primary', pi.is_primary,
    'priority', pi.priority,
    'urgency', pi.urgency,
    'details', pi.details,
    'created_at', pi.created_at
  ) ORDER BY pi.is_primary DESC, pi.priority DESC)
  INTO intentions
  FROM public.convinter_profile_intentions pi
  WHERE pi.profile_id = target_profile AND pi.active = true;

  RETURN jsonb_build_object('ok', true,
                            'intentions', COALESCE(intentions, '[]'::jsonb));
END; $$;

GRANT EXECUTE ON FUNCTION public.convinter_get_intentions(uuid) TO authenticated;