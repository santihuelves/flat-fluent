/* =========================================================
   CONVINTER — SCHEMA BASE (reconstruido) + MEGA CHUNKS A/B/C
   ========================================================= */

-- ================================================
-- PART 0: ENUM TYPES
-- ================================================
DO $$ BEGIN
  CREATE TYPE public.convinter_visibility AS ENUM ('public', 'registered_only', 'hidden');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.convinter_trust_badge AS ENUM ('none', 'bronze', 'silver', 'gold', 'verified');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.convinter_listing_type AS ENUM ('room', 'flatmate');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.convinter_report_status AS ENUM ('pending', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.convinter_consent_status AS ENUM ('pending', 'accepted', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE TYPE public.convinter_verification_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ================================================
-- PART 1: BASE TABLES
-- ================================================

-- 1. convinter_profiles
CREATE TABLE IF NOT EXISTS public.convinter_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle text UNIQUE,
  display_name text,
  bio text,
  photo_url text,
  languages text[] DEFAULT '{}',
  province_code text,
  city text,
  visibility public.convinter_visibility DEFAULT 'public',
  selfie_verified boolean DEFAULT false,
  selfie_verified_at timestamptz,
  trust_score int DEFAULT 0 CHECK (trust_score BETWEEN 0 AND 100),
  trust_badge public.convinter_trust_badge DEFAULT 'none',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.convinter_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.convinter_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_insert_own" ON public.convinter_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "profiles_update_own" ON public.convinter_profiles FOR UPDATE USING (auth.uid() = user_id);

-- 2. convinter_listings
CREATE TABLE IF NOT EXISTS public.convinter_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_type public.convinter_listing_type NOT NULL DEFAULT 'room',
  title text NOT NULL,
  description text,
  province_code text,
  city text,
  price_monthly int,
  bills_included boolean DEFAULT false,
  available_from date,
  min_stay_months int,
  smoking_allowed boolean DEFAULT false,
  pets_allowed boolean DEFAULT false,
  thumbnail_url text,
  photos text[] DEFAULT '{}',
  listing_verified boolean DEFAULT false,
  listing_verified_at timestamptz,
  listing_verification_level int DEFAULT 0,
  status text DEFAULT 'active' CHECK (status IN ('active', 'paused', 'deleted')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.convinter_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listings_select_own" ON public.convinter_listings FOR SELECT USING (auth.uid() = owner_id);
CREATE POLICY "listings_insert_own" ON public.convinter_listings FOR INSERT WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "listings_update_own" ON public.convinter_listings FOR UPDATE USING (auth.uid() = owner_id);
CREATE POLICY "listings_delete_own" ON public.convinter_listings FOR DELETE USING (auth.uid() = owner_id);

-- 3. convinter_blocks
CREATE TABLE IF NOT EXISTS public.convinter_blocks (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  blocker_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  blocked_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (blocker_id, blocked_id)
);
ALTER TABLE public.convinter_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocks_select_own" ON public.convinter_blocks FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "blocks_insert_own" ON public.convinter_blocks FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "blocks_delete_own" ON public.convinter_blocks FOR DELETE USING (auth.uid() = blocker_id);

-- 4. convinter_chats
CREATE TABLE IF NOT EXISTS public.convinter_chats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  last_message_at timestamptz,
  CONSTRAINT chats_order CHECK (user_a < user_b),
  UNIQUE (user_a, user_b)
);
ALTER TABLE public.convinter_chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chats_select_participant" ON public.convinter_chats FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

-- 5. convinter_messages
CREATE TABLE IF NOT EXISTS public.convinter_messages (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  chat_id uuid NOT NULL REFERENCES public.convinter_chats(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.convinter_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "messages_select_participant" ON public.convinter_messages FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.convinter_chats c
    WHERE c.id = chat_id AND (auth.uid() = c.user_a OR auth.uid() = c.user_b)
  ));

-- 6. convinter_notifications
CREATE TABLE IF NOT EXISTS public.convinter_notifications (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type text NOT NULL,
  payload jsonb DEFAULT '{}',
  read_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.convinter_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "notifications_select_own" ON public.convinter_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON public.convinter_notifications FOR UPDATE USING (auth.uid() = user_id);

-- 7. convinter_pair_consent
CREATE TABLE IF NOT EXISTS public.convinter_pair_consent (
  user_a uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  user_b uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_level int DEFAULT 0 CHECK (consent_level IN (0, 1, 2)),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT pair_consent_order CHECK (user_a < user_b),
  PRIMARY KEY (user_a, user_b)
);
ALTER TABLE public.convinter_pair_consent ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pair_consent_select_participant" ON public.convinter_pair_consent FOR SELECT USING (auth.uid() = user_a OR auth.uid() = user_b);

-- 8. convinter_consent_requests
CREATE TABLE IF NOT EXISTS public.convinter_consent_requests (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  from_user uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  to_user uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  requested_level int NOT NULL CHECK (requested_level IN (1, 2)),
  status public.convinter_consent_status DEFAULT 'pending',
  responded_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.convinter_consent_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "consent_requests_select_own" ON public.convinter_consent_requests FOR SELECT USING (auth.uid() = from_user OR auth.uid() = to_user);

-- 9. convinter_answers
CREATE TABLE IF NOT EXISTS public.convinter_answers (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id text NOT NULL,
  question_id text NOT NULL,
  answer_value jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, test_id, question_id)
);
ALTER TABLE public.convinter_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "answers_select_own" ON public.convinter_answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "answers_insert_own" ON public.convinter_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "answers_update_own" ON public.convinter_answers FOR UPDATE USING (auth.uid() = user_id);

-- 10. convinter_rate_limits (internal, no client access)
CREATE TABLE IF NOT EXISTS public.convinter_rate_limits (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_key text NOT NULL,
  count int DEFAULT 1,
  window_start timestamptz DEFAULT now(),
  UNIQUE (user_id, action_key)
);
ALTER TABLE public.convinter_rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies = no client access

-- 11. convinter_user_restrictions
CREATE TABLE IF NOT EXISTS public.convinter_user_restrictions (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restriction text NOT NULL,
  until_at timestamptz,
  reason text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, restriction)
);
ALTER TABLE public.convinter_user_restrictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "restrictions_select_own" ON public.convinter_user_restrictions FOR SELECT USING (auth.uid() = user_id);

-- 12. convinter_moderators
CREATE TABLE IF NOT EXISTS public.convinter_moderators (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  added_at timestamptz DEFAULT now(),
  added_by uuid
);
ALTER TABLE public.convinter_moderators ENABLE ROW LEVEL SECURITY;
-- No policies = only RPCs can read

-- 13. convinter_reports
CREATE TABLE IF NOT EXISTS public.convinter_reports (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  reporter_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  target_listing_id uuid REFERENCES public.convinter_listings(id) ON DELETE SET NULL,
  target_message_id bigint,
  category text NOT NULL,
  reason text NOT NULL,
  detail text,
  status public.convinter_report_status DEFAULT 'pending',
  created_at timestamptz DEFAULT now(),
  resolved_at timestamptz,
  resolved_by uuid,
  resolution_action text,
  resolution_note text
);
ALTER TABLE public.convinter_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "reports_select_own" ON public.convinter_reports FOR SELECT USING (auth.uid() = reporter_id);

-- 14. convinter_deletion_queue (internal)
CREATE TABLE IF NOT EXISTS public.convinter_deletion_queue (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  bucket text NOT NULL,
  path text NOT NULL,
  queued_at timestamptz DEFAULT now(),
  done_at timestamptz
);
ALTER TABLE public.convinter_deletion_queue ENABLE ROW LEVEL SECURITY;
-- No policies

-- 15. convinter_verification_requests (selfie)
CREATE TABLE IF NOT EXISTS public.convinter_verification_requests (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  selfie_url text NOT NULL,
  status public.convinter_verification_status DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  note text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.convinter_verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "selfie_verify_select_own" ON public.convinter_verification_requests FOR SELECT USING (auth.uid() = user_id);

-- 16. convinter_listing_verification_requests
CREATE TABLE IF NOT EXISTS public.convinter_listing_verification_requests (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  listing_id uuid NOT NULL REFERENCES public.convinter_listings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  doc_type text NOT NULL,
  doc_path text NOT NULL,
  status public.convinter_verification_status DEFAULT 'pending',
  reviewed_by uuid,
  reviewed_at timestamptz,
  approved_level int,
  note text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.convinter_listing_verification_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "listing_verify_select_own" ON public.convinter_listing_verification_requests FOR SELECT USING (auth.uid() = user_id);

-- ================================================
-- PART 2: HELPER FUNCTIONS
-- ================================================

-- convinter_is_moderator
CREATE OR REPLACE FUNCTION public.convinter_is_moderator(p_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.convinter_moderators WHERE user_id = p_user);
$$;

-- convinter_check_rate_limit
CREATE OR REPLACE FUNCTION public.convinter_check_rate_limit(
  p_action_key text,
  p_max_count int,
  p_window_seconds int
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  r record;
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  SELECT * INTO r FROM public.convinter_rate_limits
  WHERE user_id = me AND action_key = p_action_key
  FOR UPDATE;

  IF NOT FOUND THEN
    INSERT INTO public.convinter_rate_limits (user_id, action_key, count, window_start)
    VALUES (me, p_action_key, 1, now());
    RETURN;
  END IF;

  IF r.window_start < now() - (p_window_seconds || ' seconds')::interval THEN
    UPDATE public.convinter_rate_limits
    SET count = 1, window_start = now()
    WHERE user_id = me AND action_key = p_action_key;
    RETURN;
  END IF;

  IF r.count >= p_max_count THEN
    RAISE EXCEPTION 'RATE_LIMIT_EXCEEDED';
  END IF;

  UPDATE public.convinter_rate_limits
  SET count = count + 1
  WHERE user_id = me AND action_key = p_action_key;
END;
$$;

-- convinter_guard (checks restrictions)
CREATE OR REPLACE FUNCTION public.convinter_guard(p_action text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  restricted boolean := false;
BEGIN
  IF me IS NULL THEN
    RAISE EXCEPTION 'NOT_AUTHENTICATED';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.convinter_user_restrictions
    WHERE user_id = me AND restriction = p_action AND (until_at IS NULL OR until_at > now())
  ) INTO restricted;

  IF restricted THEN
    RAISE EXCEPTION 'ACTION_RESTRICTED';
  END IF;
END;
$$;

-- convinter_is_blocked
CREATE OR REPLACE FUNCTION public.convinter_is_blocked(p_user_a uuid, p_user_b uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.convinter_blocks
    WHERE (blocker_id = p_user_a AND blocked_id = p_user_b)
       OR (blocker_id = p_user_b AND blocked_id = p_user_a)
  );
$$;

-- convinter_assert_not_blocked
CREATE OR REPLACE FUNCTION public.convinter_assert_not_blocked(p_other uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
BEGIN
  IF public.convinter_is_blocked(me, p_other) THEN
    RAISE EXCEPTION 'USER_BLOCKED';
  END IF;
END;
$$;

-- convinter_notify
CREATE OR REPLACE FUNCTION public.convinter_notify(
  p_user uuid,
  p_type text,
  p_payload jsonb
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.convinter_notifications (user_id, notification_type, payload)
  VALUES (p_user, p_type, p_payload);
END;
$$;

-- convinter_make_fingerprint (simple hash for dedup)
CREATE OR REPLACE FUNCTION public.convinter_make_fingerprint(p_text text)
RETURNS text
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT md5(lower(trim(coalesce(p_text, ''))));
$$;

-- convinter_apply_auto_restrictions (placeholder)
CREATE OR REPLACE FUNCTION public.convinter_apply_auto_restrictions(p_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Placeholder for auto-moderation logic
  NULL;
END;
$$;

-- convinter_calc_trust_score
CREATE OR REPLACE FUNCTION public.convinter_calc_trust_score(p_user uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  score int := 0;
  p record;
  answer_count int := 0;
BEGIN
  SELECT * INTO p FROM public.convinter_profiles WHERE user_id = p_user;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Base points
  IF p.display_name IS NOT NULL THEN score := score + 5; END IF;
  IF p.bio IS NOT NULL AND length(p.bio) > 20 THEN score := score + 10; END IF;
  IF p.photo_url IS NOT NULL THEN score := score + 10; END IF;
  IF p.selfie_verified THEN score := score + 30; END IF;

  -- Answer points
  SELECT count(*) INTO answer_count FROM public.convinter_answers WHERE user_id = p_user;
  score := score + least(answer_count * 2, 30);

  -- Languages
  IF array_length(p.languages, 1) > 0 THEN score := score + 5; END IF;

  RETURN least(score, 100);
END;
$$;

-- convinter_refresh_trust_score
CREATE OR REPLACE FUNCTION public.convinter_refresh_trust_score(p_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_score int;
  new_badge public.convinter_trust_badge;
BEGIN
  new_score := public.convinter_calc_trust_score(p_user);

  new_badge := CASE
    WHEN new_score >= 80 THEN 'gold'::public.convinter_trust_badge
    WHEN new_score >= 60 THEN 'silver'::public.convinter_trust_badge
    WHEN new_score >= 40 THEN 'bronze'::public.convinter_trust_badge
    ELSE 'none'::public.convinter_trust_badge
  END;

  UPDATE public.convinter_profiles
  SET trust_score = new_score, trust_badge = new_badge, updated_at = now()
  WHERE user_id = p_user;
END;
$$;

-- ================================================
-- PART 3: REPORT RPCs
-- ================================================

CREATE OR REPLACE FUNCTION public.convinter_report_user(
  p_target_user uuid,
  p_reason text,
  p_category text,
  p_detail text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  rid bigint;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  PERFORM public.convinter_check_rate_limit('report', 10, 86400);

  IF p_target_user IS NULL OR p_target_user = me THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_TARGET');
  END IF;

  INSERT INTO public.convinter_reports (reporter_id, target_user_id, category, reason, detail)
  VALUES (me, p_target_user, p_category, p_reason, p_detail)
  RETURNING id INTO rid;

  RETURN jsonb_build_object('ok', true, 'report_id', rid);
END;
$$;
GRANT EXECUTE ON FUNCTION public.convinter_report_user(uuid, text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.convinter_report_listing(
  p_target_listing uuid,
  p_reason text,
  p_category text,
  p_detail text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  rid bigint;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  PERFORM public.convinter_check_rate_limit('report', 10, 86400);

  IF p_target_listing IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_TARGET');
  END IF;

  INSERT INTO public.convinter_reports (reporter_id, target_listing_id, category, reason, detail)
  VALUES (me, p_target_listing, p_category, p_reason, p_detail)
  RETURNING id INTO rid;

  RETURN jsonb_build_object('ok', true, 'report_id', rid);
END;
$$;
GRANT EXECUTE ON FUNCTION public.convinter_report_listing(uuid, text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.convinter_report_message(
  p_target_message bigint,
  p_reason text,
  p_category text,
  p_detail text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  rid bigint;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  PERFORM public.convinter_check_rate_limit('report', 10, 86400);

  IF p_target_message IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_TARGET');
  END IF;

  INSERT INTO public.convinter_reports (reporter_id, target_message_id, category, reason, detail)
  VALUES (me, p_target_message, p_category, p_reason, p_detail)
  RETURNING id INTO rid;

  RETURN jsonb_build_object('ok', true, 'report_id', rid);
END;
$$;
GRANT EXECUTE ON FUNCTION public.convinter_report_message(bigint, text, text, text) TO authenticated;

-- ================================================
-- PART 4: VERIFICATION RPCs
-- ================================================

CREATE OR REPLACE FUNCTION public.convinter_submit_selfie_verification(p_selfie_url text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  rid bigint;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  PERFORM public.convinter_check_rate_limit('selfie_submit', 3, 86400);

  IF p_selfie_url IS NULL OR length(p_selfie_url) < 10 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_URL');
  END IF;

  IF EXISTS (SELECT 1 FROM public.convinter_verification_requests WHERE user_id = me AND status = 'pending') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'ALREADY_PENDING');
  END IF;

  INSERT INTO public.convinter_verification_requests (user_id, selfie_url)
  VALUES (me, p_selfie_url)
  RETURNING id INTO rid;

  RETURN jsonb_build_object('ok', true, 'request_id', rid);
END;
$$;
GRANT EXECUTE ON FUNCTION public.convinter_submit_selfie_verification(text) TO authenticated;

CREATE OR REPLACE FUNCTION public.convinter_mod_review_selfie(
  p_request_id bigint,
  p_approve boolean,
  p_note text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  r record;
BEGIN
  IF me IS NULL OR NOT public.convinter_is_moderator(me) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_MODERATOR');
  END IF;

  SELECT * INTO r FROM public.convinter_verification_requests WHERE id = p_request_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  END IF;

  IF r.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_PENDING');
  END IF;

  UPDATE public.convinter_verification_requests
  SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
      reviewed_by = me,
      reviewed_at = now(),
      note = p_note
  WHERE id = p_request_id;

  IF p_approve THEN
    UPDATE public.convinter_profiles
    SET selfie_verified = true, selfie_verified_at = now()
    WHERE user_id = r.user_id;

    PERFORM public.convinter_refresh_trust_score(r.user_id);
    PERFORM public.convinter_notify(r.user_id, 'SELFIE_APPROVED', '{}'::jsonb);
  ELSE
    PERFORM public.convinter_notify(r.user_id, 'SELFIE_REJECTED', jsonb_build_object('note', p_note));
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.convinter_mod_review_selfie(bigint, boolean, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.convinter_submit_listing_verification(
  p_listing_id uuid,
  p_doc_type text,
  p_doc_path text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  l record;
  rid bigint;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  PERFORM public.convinter_check_rate_limit('listing_verify_submit', 5, 86400);

  SELECT * INTO l FROM public.convinter_listings WHERE id = p_listing_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'LISTING_NOT_FOUND');
  END IF;

  IF l.owner_id <> me THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_OWNER');
  END IF;

  INSERT INTO public.convinter_listing_verification_requests (listing_id, user_id, doc_type, doc_path)
  VALUES (p_listing_id, me, p_doc_type, p_doc_path)
  RETURNING id INTO rid;

  RETURN jsonb_build_object('ok', true, 'request_id', rid);
END;
$$;
GRANT EXECUTE ON FUNCTION public.convinter_submit_listing_verification(uuid, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.convinter_mod_review_listing_verification(
  p_request_id bigint,
  p_approve boolean,
  p_level int DEFAULT 1,
  p_note text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  r record;
BEGIN
  IF me IS NULL OR NOT public.convinter_is_moderator(me) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_MODERATOR');
  END IF;

  SELECT * INTO r FROM public.convinter_listing_verification_requests WHERE id = p_request_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  END IF;

  IF r.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_PENDING');
  END IF;

  UPDATE public.convinter_listing_verification_requests
  SET status = CASE WHEN p_approve THEN 'approved' ELSE 'rejected' END,
      reviewed_by = me,
      reviewed_at = now(),
      approved_level = CASE WHEN p_approve THEN p_level ELSE NULL END,
      note = p_note
  WHERE id = p_request_id;

  IF p_approve THEN
    UPDATE public.convinter_listings
    SET listing_verified = true, listing_verified_at = now(), listing_verification_level = p_level
    WHERE id = r.listing_id;

    PERFORM public.convinter_notify(r.user_id, 'LISTING_VERIFIED', jsonb_build_object('listing_id', r.listing_id, 'level', p_level));
  ELSE
    PERFORM public.convinter_notify(r.user_id, 'LISTING_VERIFICATION_REJECTED', jsonb_build_object('listing_id', r.listing_id, 'note', p_note));
  END IF;

  RETURN jsonb_build_object('ok', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.convinter_mod_review_listing_verification(bigint, boolean, int, text) TO authenticated;

-- ================================================
-- PART 5: RETENTION / DELETION QUEUE
-- ================================================

CREATE OR REPLACE FUNCTION public.convinter_enqueue_selfie_deletions()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cnt int := 0;
BEGIN
  INSERT INTO public.convinter_deletion_queue (bucket, path)
  SELECT 'selfies', selfie_url
  FROM public.convinter_verification_requests
  WHERE status IN ('approved', 'rejected')
    AND reviewed_at < now() - interval '30 days'
    AND selfie_url NOT IN (SELECT path FROM public.convinter_deletion_queue WHERE bucket = 'selfies');

  GET DIAGNOSTICS cnt = ROW_COUNT;
  RETURN cnt;
END;
$$;

CREATE OR REPLACE FUNCTION public.convinter_enqueue_listing_doc_deletions()
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cnt int := 0;
BEGIN
  INSERT INTO public.convinter_deletion_queue (bucket, path)
  SELECT 'listing-docs', doc_path
  FROM public.convinter_listing_verification_requests
  WHERE status IN ('approved', 'rejected')
    AND reviewed_at < now() - interval '30 days'
    AND doc_path NOT IN (SELECT path FROM public.convinter_deletion_queue WHERE bucket = 'listing-docs');

  GET DIAGNOSTICS cnt = ROW_COUNT;
  RETURN cnt;
END;
$$;

CREATE OR REPLACE FUNCTION public.convinter_mark_deletion_done(p_id bigint)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.convinter_deletion_queue SET done_at = now() WHERE id = p_id;
END;
$$;

-- ================================================
-- PART 6: BLOCK/UNBLOCK RPCs
-- ================================================

CREATE OR REPLACE FUNCTION public.convinter_block_user(p_target uuid, p_reason text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  IF p_target IS NULL OR p_target = me THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_TARGET');
  END IF;

  INSERT INTO public.convinter_blocks (blocker_id, blocked_id, reason)
  VALUES (me, p_target, p_reason)
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('ok', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.convinter_block_user(uuid, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.convinter_unblock_user(p_target uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  DELETE FROM public.convinter_blocks WHERE blocker_id = me AND blocked_id = p_target;

  RETURN jsonb_build_object('ok', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.convinter_unblock_user(uuid) TO authenticated;

-- ================================================
-- PART 7: SAVE ANSWER RPC
-- ================================================

CREATE OR REPLACE FUNCTION public.convinter_save_answer(
  p_test_id text,
  p_question_id text,
  p_answer_value jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  INSERT INTO public.convinter_answers (user_id, test_id, question_id, answer_value)
  VALUES (me, p_test_id, p_question_id, p_answer_value)
  ON CONFLICT (user_id, test_id, question_id)
  DO UPDATE SET answer_value = EXCLUDED.answer_value, updated_at = now();

  RETURN jsonb_build_object('ok', true);
END;
$$;
GRANT EXECUTE ON FUNCTION public.convinter_save_answer(text, text, jsonb) TO authenticated;