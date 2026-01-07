/* =========================================================
   CONVINTER — MEGA CHUNKS A/B/C
   ========================================================= */

-- ================================================
-- MEGA CHUNK A/3: Triggers, compat cache, consent & search RPCs
-- ================================================

-- updated_at trigger helper
CREATE OR REPLACE FUNCTION public.convinter_touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF tg_op = 'UPDATE' THEN
    new.updated_at := now();
  END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS convinter_profiles_touch ON public.convinter_profiles;
CREATE TRIGGER convinter_profiles_touch
BEFORE UPDATE ON public.convinter_profiles
FOR EACH ROW EXECUTE FUNCTION public.convinter_touch_updated_at();

DROP TRIGGER IF EXISTS convinter_listings_touch ON public.convinter_listings;
CREATE TRIGGER convinter_listings_touch
BEFORE UPDATE ON public.convinter_listings
FOR EACH ROW EXECUTE FUNCTION public.convinter_touch_updated_at();

DROP TRIGGER IF EXISTS convinter_answers_touch ON public.convinter_answers;
CREATE TRIGGER convinter_answers_touch
BEFORE UPDATE ON public.convinter_answers
FOR EACH ROW EXECUTE FUNCTION public.convinter_touch_updated_at();

-- Compatibility cache table
CREATE TABLE IF NOT EXISTS public.convinter_compat_cache (
  user_a uuid NOT NULL,
  user_b uuid NOT NULL,
  detail_level int NOT NULL CHECK (detail_level IN (1,2)),
  score int NOT NULL CHECK (score BETWEEN 0 AND 100),
  breakdown jsonb NOT NULL DEFAULT '{}'::jsonb,
  computed_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT convinter_compat_cache_order CHECK (user_a < user_b),
  PRIMARY KEY (user_a, user_b, detail_level)
);

ALTER TABLE public.convinter_compat_cache ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "compat_cache_select_participants" ON public.convinter_compat_cache;
CREATE POLICY "compat_cache_select_participants"
  ON public.convinter_compat_cache
  FOR SELECT
  USING (auth.uid() = user_a OR auth.uid() = user_b);

-- Handle resolver
CREATE OR REPLACE FUNCTION public.convinter_resolve_handle(p_handle text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid uuid;
BEGIN
  IF p_handle IS NULL OR length(trim(p_handle)) < 3 THEN
    RETURN NULL;
  END IF;
  SELECT user_id INTO uid
  FROM public.convinter_profiles
  WHERE lower(handle) = lower(trim(p_handle))
  LIMIT 1;
  RETURN uid;
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_resolve_handle(text) TO authenticated;

-- Consent request RPC
CREATE OR REPLACE FUNCTION public.convinter_request_consent(
  p_to_user uuid,
  p_requested_level int DEFAULT 1
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  lvl int;
  a uuid;
  b uuid;
  rid bigint;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  PERFORM public.convinter_guard('chat');
  PERFORM public.convinter_check_rate_limit('consent_request', 10, 86400);

  IF p_to_user IS NULL OR p_to_user = me THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_TARGET');
  END IF;

  PERFORM public.convinter_assert_not_blocked(p_to_user);

  lvl := CASE WHEN p_requested_level IN (1,2) THEN p_requested_level ELSE 1 END;

  IF EXISTS (
    SELECT 1 FROM public.convinter_consent_requests
    WHERE from_user = me AND to_user = p_to_user AND status='pending'
  ) THEN
    RETURN jsonb_build_object('ok', true, 'already_pending', true);
  END IF;

  INSERT INTO public.convinter_consent_requests(from_user, to_user, requested_level)
  VALUES (me, p_to_user, lvl)
  RETURNING id INTO rid;

  a := least(me, p_to_user);
  b := greatest(me, p_to_user);
  INSERT INTO public.convinter_pair_consent(user_a, user_b, consent_level)
  VALUES (a, b, 0)
  ON CONFLICT DO NOTHING;

  PERFORM public.convinter_notify(p_to_user, 'CONSENT_REQUEST_RECEIVED',
    jsonb_build_object('request_id', rid, 'from_user', me, 'requested_level', lvl)
  );

  RETURN jsonb_build_object('ok', true, 'request_id', rid);
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_request_consent(uuid,int) TO authenticated;

-- Consent respond RPC
CREATE OR REPLACE FUNCTION public.convinter_respond_consent_request(
  p_request_id bigint,
  p_accept boolean
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  r record;
  a uuid;
  b uuid;
  new_level int;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  PERFORM public.convinter_check_rate_limit('consent_respond', 30, 86400);

  SELECT * INTO r
  FROM public.convinter_consent_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  END IF;

  IF r.to_user <> me THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_ALLOWED');
  END IF;

  IF r.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_PENDING', 'status', r.status);
  END IF;

  IF p_accept THEN
    UPDATE public.convinter_consent_requests
    SET status='accepted', responded_at=now()
    WHERE id = p_request_id;

    a := least(r.from_user, r.to_user);
    b := greatest(r.from_user, r.to_user);
    new_level := r.requested_level;

    INSERT INTO public.convinter_pair_consent(user_a, user_b, consent_level, updated_at)
    VALUES (a, b, new_level, now())
    ON CONFLICT (user_a, user_b)
    DO UPDATE SET
      consent_level = greatest(public.convinter_pair_consent.consent_level, excluded.consent_level),
      updated_at = now();

    PERFORM public.convinter_notify(r.from_user, 'CONSENT_REQUEST_ACCEPTED',
      jsonb_build_object('request_id', r.id, 'by_user', me, 'consent_level', new_level)
    );

    RETURN jsonb_build_object('ok', true, 'accepted', true, 'consent_level', new_level);
  ELSE
    UPDATE public.convinter_consent_requests
    SET status='rejected', responded_at=now()
    WHERE id = p_request_id;

    PERFORM public.convinter_notify(r.from_user, 'CONSENT_REQUEST_REJECTED',
      jsonb_build_object('request_id', r.id, 'by_user', me)
    );

    RETURN jsonb_build_object('ok', true, 'accepted', false);
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_respond_consent_request(bigint,boolean) TO authenticated;

-- Compatibility compute RPC
CREATE OR REPLACE FUNCTION public.convinter_compute_and_cache_guarded(
  p_other_user uuid,
  p_detail_level int DEFAULT 1
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  a uuid;
  b uuid;
  lvl int;
  consent_lvl int := 0;
  cached record;
  score_num int := 0;
  common_n int := 0;
  mismatches jsonb := '[]'::jsonb;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  PERFORM public.convinter_guard('view_detail');
  PERFORM public.convinter_check_rate_limit('compat_compute', 30, 86400);

  IF p_other_user IS NULL OR p_other_user = me THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_TARGET');
  END IF;

  PERFORM public.convinter_assert_not_blocked(p_other_user);

  lvl := CASE WHEN p_detail_level IN (1,2) THEN p_detail_level ELSE 1 END;

  a := least(me, p_other_user);
  b := greatest(me, p_other_user);

  SELECT consent_level INTO consent_lvl
  FROM public.convinter_pair_consent
  WHERE user_a = a AND user_b = b;
  consent_lvl := coalesce(consent_lvl, 0);

  IF consent_lvl < lvl THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', CASE WHEN consent_lvl = 0 THEN 'CONSENT_REQUIRED' ELSE 'CONSENT_UPGRADE_REQUIRED' END,
      'consent_level', consent_lvl,
      'required_level', lvl
    );
  END IF;

  SELECT * INTO cached
  FROM public.convinter_compat_cache
  WHERE user_a=a AND user_b=b AND detail_level=lvl
    AND computed_at > now() - interval '7 days';

  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', true,
      'cached', true,
      'score', cached.score,
      'detail_level', lvl,
      'breakdown', cached.breakdown,
      'computed_at', cached.computed_at
    );
  END IF;

  WITH
  aa AS (
    SELECT question_id,
           coalesce(answer_value->>'value', trim(both '"' from answer_value::text)) AS v
    FROM public.convinter_answers
    WHERE user_id = me AND test_id = 'convinter_v2'
  ),
  bb AS (
    SELECT question_id,
           coalesce(answer_value->>'value', trim(both '"' from answer_value::text)) AS v
    FROM public.convinter_answers
    WHERE user_id = p_other_user AND test_id = 'convinter_v2'
  ),
  j AS (
    SELECT aa.question_id,
           aa.v AS a_v,
           bb.v AS b_v,
           CASE WHEN aa.v ~ '^[0-9]+(\.[0-9]+)?$' THEN aa.v::float ELSE NULL END AS a_num,
           CASE WHEN bb.v ~ '^[0-9]+(\.[0-9]+)?$' THEN bb.v::float ELSE NULL END AS b_num
    FROM aa JOIN bb USING (question_id)
  ),
  s AS (
    SELECT question_id,
           CASE
             WHEN a_num IS NOT NULL AND b_num IS NOT NULL THEN greatest(0, 1 - abs(a_num - b_num)/4.0)
             ELSE CASE WHEN lower(coalesce(a_v,'')) = lower(coalesce(b_v,'')) THEN 1 ELSE 0 END
           END AS sim,
           a_v, b_v
    FROM j
  ),
  agg AS (
    SELECT count(*) AS common_cnt, avg(sim) AS avg_sim FROM s
  ),
  mm AS (
    SELECT jsonb_agg(
      jsonb_build_object('question_id', question_id, 'a', a_v, 'b', b_v, 'sim', round(sim::numeric, 3))
      ORDER BY sim ASC
    ) AS items
    FROM (SELECT * FROM s ORDER BY sim ASC LIMIT 8) t
  )
  SELECT
    coalesce(agg.common_cnt, 0),
    coalesce(round(100 * coalesce(agg.avg_sim, 0))::int, 0),
    coalesce(mm.items, '[]'::jsonb)
  INTO common_n, score_num, mismatches
  FROM agg, mm;

  INSERT INTO public.convinter_compat_cache(user_a, user_b, detail_level, score, breakdown, computed_at)
  VALUES (
    a, b, lvl, score_num,
    jsonb_build_object(
      'common_questions', common_n,
      'mismatches', CASE WHEN lvl = 2 THEN mismatches ELSE '[]'::jsonb END
    ),
    now()
  )
  ON CONFLICT (user_a, user_b, detail_level)
  DO UPDATE SET
    score = excluded.score,
    breakdown = excluded.breakdown,
    computed_at = excluded.computed_at;

  RETURN jsonb_build_object(
    'ok', true,
    'cached', false,
    'score', score_num,
    'detail_level', lvl,
    'breakdown', jsonb_build_object(
      'common_questions', common_n,
      'mismatches', CASE WHEN lvl = 2 THEN mismatches ELSE '[]'::jsonb END
    ),
    'computed_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_compute_and_cache_guarded(uuid,int) TO authenticated;

-- Search profiles RPC
CREATE OR REPLACE FUNCTION public.convinter_search_profiles(
  p_province_code text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_verified_only boolean DEFAULT false,
  p_trust_min int DEFAULT NULL,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  lim int := least(greatest(coalesce(p_limit, 20), 1), 50);
  off int := greatest(coalesce(p_offset, 0), 0);
  items jsonb;
  total_count int;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  PERFORM public.convinter_guard('search');
  PERFORM public.convinter_check_rate_limit('search_profiles', 120, 3600);

  WITH base AS (
    SELECT p.*
    FROM public.convinter_profiles p
    WHERE p.user_id <> me
      AND p.visibility IN ('public','registered_only')
      AND (p_province_code IS NULL OR p.province_code = p_province_code)
      AND (p_city IS NULL OR lower(p.city) LIKE lower('%' || p_city || '%'))
      AND (NOT p_verified_only OR p.selfie_verified = true)
      AND (p_trust_min IS NULL OR p.trust_score >= p_trust_min)
      AND NOT public.convinter_is_blocked(me, p.user_id)
  ),
  counted AS (SELECT count(*)::int AS c FROM base),
  page AS (
    SELECT user_id, handle, display_name, bio, languages, province_code, city,
           trust_score, trust_badge, selfie_verified, photo_url
    FROM base
    ORDER BY trust_score DESC, updated_at DESC
    LIMIT lim OFFSET off
  )
  SELECT (SELECT c FROM counted),
         coalesce(jsonb_agg(
           jsonb_build_object(
             'user_id', user_id, 'handle', handle, 'display_name', display_name,
             'bio', left(coalesce(bio,''), 240), 'languages', languages,
             'province_code', province_code, 'city', city,
             'trust_score', trust_score, 'trust_badge', trust_badge,
             'selfie_verified', selfie_verified, 'photo_url', photo_url
           )
         ), '[]'::jsonb)
  INTO total_count, items
  FROM page;

  RETURN jsonb_build_object(
    'ok', true, 'total', total_count, 'limit', lim, 'offset', off,
    'has_more', (off + lim) < total_count, 'items', items
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_search_profiles(text,text,boolean,int,int,int) TO authenticated;

-- Search listings RPC
CREATE OR REPLACE FUNCTION public.convinter_search_listings(
  p_province_code text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_listing_type text DEFAULT NULL,
  p_price_min int DEFAULT NULL,
  p_price_max int DEFAULT NULL,
  p_bills_included boolean DEFAULT NULL,
  p_verified_only boolean DEFAULT false,
  p_listing_verified_only boolean DEFAULT false,
  p_trust_min int DEFAULT NULL,
  p_limit int DEFAULT 20,
  p_offset int DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  lim int := least(greatest(coalesce(p_limit, 20), 1), 50);
  off int := greatest(coalesce(p_offset, 0), 0);
  items jsonb;
  total_count int;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  PERFORM public.convinter_guard('search');
  PERFORM public.convinter_check_rate_limit('search_listings', 120, 3600);

  WITH base AS (
    SELECT l.*, p.handle, p.display_name, p.trust_score, p.trust_badge, p.selfie_verified
    FROM public.convinter_listings l
    JOIN public.convinter_profiles p ON p.user_id = l.owner_id
    WHERE l.status = 'active'
      AND l.owner_id <> me
      AND p.visibility IN ('public','registered_only')
      AND (p_province_code IS NULL OR l.province_code = p_province_code)
      AND (p_city IS NULL OR lower(l.city) LIKE lower('%' || p_city || '%'))
      AND (p_listing_type IS NULL OR l.listing_type::text = p_listing_type)
      AND (p_price_min IS NULL OR l.price_monthly >= p_price_min)
      AND (p_price_max IS NULL OR l.price_monthly <= p_price_max)
      AND (p_bills_included IS NULL OR l.bills_included = p_bills_included)
      AND (NOT p_verified_only OR p.selfie_verified = true)
      AND (NOT p_listing_verified_only OR l.listing_verified = true)
      AND (p_trust_min IS NULL OR p.trust_score >= p_trust_min)
      AND NOT public.convinter_is_blocked(me, l.owner_id)
  ),
  counted AS (SELECT count(*)::int AS c FROM base),
  page AS (
    SELECT id, listing_type, title, description, province_code, city,
           price_monthly, bills_included, available_from, min_stay_months,
           listing_verified, listing_verification_level, thumbnail_url,
           owner_id, handle, display_name, trust_score, trust_badge, selfie_verified
    FROM base
    ORDER BY listing_verified DESC, trust_score DESC, updated_at DESC
    LIMIT lim OFFSET off
  )
  SELECT (SELECT c FROM counted),
         coalesce(jsonb_agg(
           jsonb_build_object(
             'id', id, 'listing_type', listing_type, 'title', title,
             'description', left(coalesce(description,''), 260),
             'province_code', province_code, 'city', city,
             'price_monthly', price_monthly, 'bills_included', bills_included,
             'available_from', available_from, 'min_stay_months', min_stay_months,
             'listing_verified', listing_verified, 'listing_verification_level', listing_verification_level,
             'thumbnail_url', thumbnail_url,
             'owner', jsonb_build_object(
               'user_id', owner_id, 'handle', handle, 'display_name', display_name,
               'trust_score', trust_score, 'trust_badge', trust_badge, 'selfie_verified', selfie_verified
             )
           )
         ), '[]'::jsonb)
  INTO total_count, items
  FROM page;

  RETURN jsonb_build_object(
    'ok', true, 'total', total_count, 'limit', lim, 'offset', off,
    'has_more', (off + lim) < total_count, 'items', items
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_search_listings(text,text,text,int,int,boolean,boolean,boolean,int,int,int) TO authenticated;

-- ================================================
-- MEGA CHUNK B/3: Detail, chat, message RPCs
-- ================================================

-- Profile detail RPC
CREATE OR REPLACE FUNCTION public.convinter_get_profile_detail(
  p_user uuid,
  p_locale text DEFAULT 'es'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  p record;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  PERFORM public.convinter_guard('view_detail');
  PERFORM public.convinter_check_rate_limit('get_profile_detail', 240, 3600);

  IF p_user IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_TARGET');
  END IF;

  PERFORM public.convinter_assert_not_blocked(p_user);

  SELECT * INTO p FROM public.convinter_profiles WHERE user_id = p_user;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  END IF;

  IF p.visibility = 'hidden' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'HIDDEN');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'user', jsonb_build_object(
      'user_id', p.user_id, 'handle', p.handle, 'display_name', p.display_name,
      'bio', p.bio, 'languages', p.languages, 'province_code', p.province_code,
      'city', p.city, 'photo_url', p.photo_url, 'selfie_verified', p.selfie_verified,
      'trust_score', p.trust_score, 'trust_badge', p.trust_badge
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_get_profile_detail(uuid,text) TO authenticated;

-- Listing detail RPC
CREATE OR REPLACE FUNCTION public.convinter_get_listing_detail(p_listing_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  l record;
  p record;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  PERFORM public.convinter_guard('view_detail');
  PERFORM public.convinter_check_rate_limit('get_listing_detail', 240, 3600);

  IF p_listing_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_TARGET');
  END IF;

  SELECT * INTO l FROM public.convinter_listings WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  END IF;

  IF l.status <> 'active' AND l.owner_id <> me THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AVAILABLE');
  END IF;

  PERFORM public.convinter_assert_not_blocked(l.owner_id);

  SELECT * INTO p FROM public.convinter_profiles WHERE user_id = l.owner_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'OWNER_NOT_FOUND');
  END IF;

  IF p.visibility = 'hidden' AND l.owner_id <> me THEN
    RETURN jsonb_build_object('ok', false, 'code', 'HIDDEN');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'listing', jsonb_build_object(
      'id', l.id, 'owner_id', l.owner_id, 'listing_type', l.listing_type,
      'title', l.title, 'description', l.description, 'province_code', l.province_code,
      'city', l.city, 'price_monthly', l.price_monthly, 'bills_included', l.bills_included,
      'available_from', l.available_from, 'min_stay_months', l.min_stay_months,
      'smoking_allowed', l.smoking_allowed, 'pets_allowed', l.pets_allowed,
      'thumbnail_url', l.thumbnail_url, 'listing_verified', l.listing_verified,
      'listing_verified_at', l.listing_verified_at, 'listing_verification_level', l.listing_verification_level,
      'status', l.status
    ),
    'owner', jsonb_build_object(
      'user_id', p.user_id, 'handle', p.handle, 'display_name', p.display_name,
      'photo_url', p.photo_url, 'selfie_verified', p.selfie_verified,
      'trust_score', p.trust_score, 'trust_badge', p.trust_badge,
      'province_code', p.province_code, 'city', p.city
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_get_listing_detail(uuid) TO authenticated;

-- Create chat RPC
CREATE OR REPLACE FUNCTION public.convinter_create_chat(p_other uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  a uuid;
  b uuid;
  cid uuid;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  PERFORM public.convinter_guard('chat');
  PERFORM public.convinter_check_rate_limit('create_chat', 60, 3600);

  IF p_other IS NULL OR p_other = me THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_TARGET');
  END IF;

  PERFORM public.convinter_assert_not_blocked(p_other);

  a := least(me, p_other);
  b := greatest(me, p_other);

  INSERT INTO public.convinter_chats(user_a, user_b, created_at, last_message_at)
  VALUES (a, b, now(), NULL)
  ON CONFLICT (user_a, user_b) DO NOTHING;

  SELECT id INTO cid FROM public.convinter_chats WHERE user_a = a AND user_b = b;

  RETURN jsonb_build_object('ok', true, 'chat_id', cid);
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_create_chat(uuid) TO authenticated;

-- Send message RPC
CREATE OR REPLACE FUNCTION public.convinter_send_message(p_chat_id uuid, p_body text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  c record;
  other uuid;
  a uuid;
  b uuid;
  consent_lvl int := 0;
  msg_id bigint;
  body_clean text;
  looks_like_contact boolean := false;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  PERFORM public.convinter_guard('message');
  PERFORM public.convinter_check_rate_limit('send_message', 120, 3600);

  IF p_chat_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_CHAT');
  END IF;

  body_clean := trim(coalesce(p_body,''));
  IF length(body_clean) < 1 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'EMPTY_MESSAGE');
  END IF;
  IF length(body_clean) > 2000 THEN
    body_clean := left(body_clean, 2000);
  END IF;

  SELECT * INTO c FROM public.convinter_chats WHERE id = p_chat_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'CHAT_NOT_FOUND');
  END IF;

  IF me <> c.user_a AND me <> c.user_b THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_A_PARTICIPANT');
  END IF;

  other := CASE WHEN me = c.user_a THEN c.user_b ELSE c.user_a END;

  PERFORM public.convinter_assert_not_blocked(other);

  a := least(me, other);
  b := greatest(me, other);
  SELECT consent_level INTO consent_lvl FROM public.convinter_pair_consent WHERE user_a=a AND user_b=b;
  consent_lvl := coalesce(consent_lvl, 0);

  looks_like_contact := (
    body_clean ~* '(@|\bmail\b|\bgmail\b|\bhotmail\b|\byahoo\b)' OR
    body_clean ~* '(\+?\d[\d\s\-]{7,}\d)' OR
    body_clean ~* '(whatsapp|telegram|insta|instagram|t\.me|wa\.me)' OR
    body_clean ~* '([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})'
  );

  IF looks_like_contact AND consent_lvl < 2 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'CONTACT_INFO_NOT_ALLOWED', 'required_level', 2, 'consent_level', consent_lvl);
  END IF;

  INSERT INTO public.convinter_messages(chat_id, sender_id, body)
  VALUES (p_chat_id, me, body_clean)
  RETURNING id INTO msg_id;

  UPDATE public.convinter_chats SET last_message_at = now() WHERE id = p_chat_id;

  PERFORM public.convinter_notify(other, 'NEW_MESSAGE', jsonb_build_object('chat_id', p_chat_id, 'from', me, 'message_id', msg_id));

  RETURN jsonb_build_object('ok', true, 'message_id', msg_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_send_message(uuid,text) TO authenticated;

-- Get my trust RPC
CREATE OR REPLACE FUNCTION public.convinter_get_my_trust()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  p record;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  SELECT * INTO p FROM public.convinter_profiles WHERE user_id = me;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NO_PROFILE');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'trust_score', p.trust_score,
    'trust_badge', p.trust_badge,
    'selfie_verified', p.selfie_verified
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_get_my_trust() TO authenticated;

-- ================================================
-- MEGA CHUNK C/3: Trust triggers, mod RPCs, permissions
-- ================================================

-- Trust refresh trigger
CREATE OR REPLACE FUNCTION public.convinter_after_answers_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.convinter_refresh_trust_score(new.user_id);
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS convinter_answers_refresh_trust_ins ON public.convinter_answers;
CREATE TRIGGER convinter_answers_refresh_trust_ins
AFTER INSERT ON public.convinter_answers
FOR EACH ROW EXECUTE FUNCTION public.convinter_after_answers_change();

DROP TRIGGER IF EXISTS convinter_answers_refresh_trust_upd ON public.convinter_answers;
CREATE TRIGGER convinter_answers_refresh_trust_upd
AFTER UPDATE ON public.convinter_answers
FOR EACH ROW EXECUTE FUNCTION public.convinter_after_answers_change();

-- Mod list reports
CREATE OR REPLACE FUNCTION public.convinter_mod_list_reports(
  p_status text DEFAULT 'pending',
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  lim int := least(greatest(coalesce(p_limit, 50), 1), 100);
  off int := greatest(coalesce(p_offset, 0), 0);
  items jsonb;
  total_count int;
BEGIN
  IF me IS NULL OR NOT public.convinter_is_moderator(me) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_MODERATOR');
  END IF;

  WITH base AS (
    SELECT * FROM public.convinter_reports WHERE (p_status IS NULL OR status::text = p_status)
  ),
  counted AS (SELECT count(*)::int AS c FROM base),
  page AS (
    SELECT id, reporter_id, target_user_id, target_listing_id, target_message_id,
           category, reason, detail, status, created_at
    FROM base ORDER BY created_at DESC LIMIT lim OFFSET off
  )
  SELECT (SELECT c FROM counted),
         coalesce(jsonb_agg(jsonb_build_object(
           'id', id, 'reporter_id', reporter_id, 'target_user_id', target_user_id,
           'target_listing_id', target_listing_id, 'target_message_id', target_message_id,
           'category', category, 'reason', reason, 'detail', detail, 'status', status, 'created_at', created_at
         )), '[]'::jsonb)
  INTO total_count, items FROM page;

  RETURN jsonb_build_object('ok', true, 'total', total_count, 'limit', lim, 'offset', off, 'has_more', (off + lim) < total_count, 'items', items);
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_mod_list_reports(text,int,int) TO authenticated;

-- Mod resolve report
CREATE OR REPLACE FUNCTION public.convinter_mod_resolve_report(
  p_report_id bigint,
  p_action text,
  p_note text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  r record;
  until_ts timestamptz;
  target uuid;
BEGIN
  IF me IS NULL OR NOT public.convinter_is_moderator(me) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_MODERATOR');
  END IF;

  SELECT * INTO r FROM public.convinter_reports WHERE id = p_report_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  END IF;

  IF r.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_PENDING', 'status', r.status);
  END IF;

  target := r.target_user_id;

  IF p_action = 'dismiss' THEN
    UPDATE public.convinter_reports
    SET status='dismissed', resolved_at=now(), resolved_by=me, resolution_action=p_action, resolution_note=p_note
    WHERE id = p_report_id;
    RETURN jsonb_build_object('ok', true);

  ELSIF p_action = 'warn' THEN
    UPDATE public.convinter_reports
    SET status='resolved', resolved_at=now(), resolved_by=me, resolution_action=p_action, resolution_note=p_note
    WHERE id = p_report_id;

    IF target IS NOT NULL THEN
      PERFORM public.convinter_notify(target, 'MOD_WARNING', jsonb_build_object('note', p_note));
    END IF;
    RETURN jsonb_build_object('ok', true);

  ELSIF p_action IN ('restrict_7d','restrict_14d') THEN
    until_ts := CASE WHEN p_action='restrict_14d' THEN now() + interval '14 days' ELSE now() + interval '7 days' END;

    IF target IS NOT NULL THEN
      INSERT INTO public.convinter_user_restrictions(user_id, restriction, until_at, reason)
      VALUES (target, 'chat', until_ts, 'mod_action:'||p_action)
      ON CONFLICT (user_id, restriction) DO UPDATE SET until_at=excluded.until_at, reason=excluded.reason, created_at=now();

      INSERT INTO public.convinter_user_restrictions(user_id, restriction, until_at, reason)
      VALUES (target, 'message', until_ts, 'mod_action:'||p_action)
      ON CONFLICT (user_id, restriction) DO UPDATE SET until_at=excluded.until_at, reason=excluded.reason, created_at=now();
    END IF;

    UPDATE public.convinter_reports
    SET status='resolved', resolved_at=now(), resolved_by=me, resolution_action=p_action, resolution_note=p_note
    WHERE id = p_report_id;

    IF target IS NOT NULL THEN
      PERFORM public.convinter_notify(target, 'MOD_RESTRICTION', jsonb_build_object('until', until_ts, 'note', p_note));
    END IF;
    RETURN jsonb_build_object('ok', true);

  ELSE
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_ACTION');
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_mod_resolve_report(bigint,text,text) TO authenticated;

-- Mod refresh trust
CREATE OR REPLACE FUNCTION public.convinter_mod_refresh_trust_for_user(p_user uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
BEGIN
  IF me IS NULL OR NOT public.convinter_is_moderator(me) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_MODERATOR');
  END IF;

  PERFORM public.convinter_refresh_trust_score(p_user);
  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_mod_refresh_trust_for_user(uuid) TO authenticated;

-- Revoke direct access to internal tables
REVOKE ALL ON TABLE public.convinter_rate_limits FROM anon, authenticated;
REVOKE ALL ON TABLE public.convinter_deletion_queue FROM anon, authenticated;