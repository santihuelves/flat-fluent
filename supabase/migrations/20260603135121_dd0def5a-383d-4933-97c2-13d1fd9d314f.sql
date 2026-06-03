-- ============================================================
-- 1) 20260601090000_enforce_single_current_intention.sql
-- ============================================================
CREATE OR REPLACE FUNCTION public.convinter_set_intention(
  p_intention_type text,
  p_is_primary boolean DEFAULT true,
  p_urgency text DEFAULT 'flexible',
  p_details jsonb DEFAULT '{}'::jsonb
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  intention_id uuid;
  valid_intention_type public.convinter_intention_type;
  valid_urgency public.convinter_urgency_level;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;
  IF p_intention_type NOT IN ('seek_room', 'offer_room') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_INTENTION_TYPE');
  END IF;
  valid_intention_type := p_intention_type::public.convinter_intention_type;
  IF p_urgency NOT IN ('urgent', 'soon', 'flexible', 'exploring') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_URGENCY');
  END IF;
  valid_urgency := p_urgency::public.convinter_urgency_level;

  DELETE FROM public.convinter_profile_intentions inactive
  USING public.convinter_profile_intentions active_row
  WHERE inactive.profile_id = me
    AND active_row.profile_id = me
    AND inactive.intention_type = active_row.intention_type
    AND inactive.active = false
    AND active_row.active = true
    AND active_row.intention_type <> valid_intention_type;

  UPDATE public.convinter_profile_intentions
  SET active = false, is_primary = false, updated_at = now()
  WHERE profile_id = me AND active = true AND intention_type <> valid_intention_type;

  INSERT INTO public.convinter_profile_intentions (
    profile_id, intention_type, is_primary, urgency, details, active
  ) VALUES (me, valid_intention_type, true, valid_urgency, p_details, true)
  ON CONFLICT (profile_id, intention_type, active)
  DO UPDATE SET is_primary = true, urgency = EXCLUDED.urgency, details = EXCLUDED.details, updated_at = now()
  RETURNING id INTO intention_id;

  RETURN jsonb_build_object('ok', true, 'intention_id', intention_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_set_intention(text, boolean, text, jsonb) TO authenticated;

WITH ranked AS (
  SELECT id, profile_id, intention_type,
    row_number() OVER (PARTITION BY profile_id ORDER BY is_primary DESC, updated_at DESC, created_at DESC) AS rn
  FROM public.convinter_profile_intentions WHERE active = true
),
rows_to_deactivate AS (SELECT id, profile_id, intention_type FROM ranked WHERE rn > 1)
DELETE FROM public.convinter_profile_intentions inactive
USING rows_to_deactivate stale
WHERE inactive.profile_id = stale.profile_id
  AND inactive.intention_type = stale.intention_type
  AND inactive.active = false;

WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY profile_id ORDER BY is_primary DESC, updated_at DESC, created_at DESC) AS rn
  FROM public.convinter_profile_intentions WHERE active = true
)
UPDATE public.convinter_profile_intentions pi
SET active = false, is_primary = false, updated_at = now()
FROM ranked r WHERE pi.id = r.id AND r.rn > 1;

WITH ranked AS (
  SELECT id, row_number() OVER (PARTITION BY profile_id ORDER BY is_primary DESC, updated_at DESC, created_at DESC) AS rn
  FROM public.convinter_profile_intentions WHERE active = true
)
UPDATE public.convinter_profile_intentions pi
SET is_primary = true, updated_at = now()
FROM ranked r WHERE pi.id = r.id AND r.rn = 1 AND pi.is_primary IS DISTINCT FROM true;

COMMENT ON TABLE public.convinter_profile_intentions IS
'Current Convinter housing mode per profile: seek_room or offer_room. seek_flatmate rows are legacy/history and must not be active.';

-- ============================================================
-- 2) 20260602100000_backfill_offer_room_intentions_from_listings.sql
-- ============================================================
DELETE FROM public.convinter_profile_intentions inactive
USING public.convinter_profile_intentions active_row
WHERE inactive.profile_id = active_row.profile_id
  AND inactive.intention_type = 'seek_flatmate'::public.convinter_intention_type
  AND active_row.intention_type = 'seek_flatmate'::public.convinter_intention_type
  AND inactive.active = false
  AND active_row.active = true;

UPDATE public.convinter_profile_intentions
SET active = false, is_primary = false, updated_at = now(),
    details = coalesce(details, '{}'::jsonb) || jsonb_build_object('deprecated_by', '20260602100000_backfill_listing_intentions')
WHERE active = true AND intention_type = 'seek_flatmate'::public.convinter_intention_type;

WITH room_listing_owners AS (
  SELECT owner_id, max(updated_at) AS latest_listing_at, count(*)::int AS active_room_listing_count
  FROM public.convinter_listings
  WHERE listing_type = 'room'::public.convinter_listing_type AND status = 'active'
  GROUP BY owner_id
)
INSERT INTO public.convinter_profile_intentions (
  profile_id, intention_type, is_primary, urgency, priority, details, active, created_at, updated_at
)
SELECT owner_id, 'offer_room'::public.convinter_intention_type, true, 'flexible', 5,
  jsonb_build_object('source','backfill_active_room_listing','active_room_listing_count',active_room_listing_count,'latest_listing_at',latest_listing_at),
  true, now(), now()
FROM room_listing_owners
ON CONFLICT (profile_id, intention_type, active)
DO UPDATE SET is_primary = true, active = true, updated_at = now(),
  details = coalesce(public.convinter_profile_intentions.details, '{}'::jsonb)
    || jsonb_build_object('source','backfill_active_room_listing',
        'active_room_listing_count', EXCLUDED.details->'active_room_listing_count',
        'latest_listing_at', EXCLUDED.details->'latest_listing_at');

UPDATE public.profiles p
SET user_type = 'offering_room'::public.user_type
WHERE EXISTS (
  SELECT 1 FROM public.convinter_listings l
  WHERE l.owner_id = p.id AND l.listing_type = 'room'::public.convinter_listing_type AND l.status = 'active'
);

WITH seeker_profiles AS (
  SELECT p.id AS profile_id FROM public.profiles p
  WHERE p.user_type = 'seeking_room'::public.user_type
    AND NOT EXISTS (
      SELECT 1 FROM public.convinter_profile_intentions existing
      WHERE existing.profile_id = p.id AND existing.active = true
        AND existing.intention_type IN ('seek_room'::public.convinter_intention_type, 'offer_room'::public.convinter_intention_type)
    )
)
INSERT INTO public.convinter_profile_intentions (
  profile_id, intention_type, is_primary, urgency, priority, details, active, created_at, updated_at
)
SELECT profile_id, 'seek_room'::public.convinter_intention_type, true, 'flexible', 5,
  jsonb_build_object('source','backfill_seeking_room_profile'), true, now(), now()
FROM seeker_profiles
ON CONFLICT (profile_id, intention_type, active)
DO UPDATE SET is_primary = true, active = true, updated_at = now(),
  details = coalesce(public.convinter_profile_intentions.details, '{}'::jsonb)
    || jsonb_build_object('source','backfill_seeking_room_profile');

UPDATE public.profiles p
SET user_type = 'seeking_room'::public.user_type
WHERE EXISTS (
  SELECT 1 FROM public.convinter_profile_intentions pi
  WHERE pi.profile_id = p.id AND pi.intention_type = 'seek_room'::public.convinter_intention_type AND pi.active = true
);

-- ============================================================
-- 3) 20260603100000_refresh_trust_from_profile_and_listings.sql
-- ============================================================
CREATE OR REPLACE FUNCTION public.convinter_calc_trust_score(p_user uuid)
RETURNS int LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  score int := 0; p record; answer_count int := 0;
  active_listing_count int := 0; complete_listing_count int := 0; verified_listing_count int := 0;
BEGIN
  SELECT * INTO p FROM public.convinter_profiles WHERE user_id = p_user;
  IF NOT FOUND THEN RETURN 0; END IF;

  IF nullif(trim(coalesce(p.display_name, p.handle, '')), '') IS NOT NULL THEN score := score + 5; END IF;
  IF nullif(trim(coalesce(p.bio, '')), '') IS NOT NULL AND length(trim(p.bio)) > 20 THEN score := score + 10; END IF;
  IF nullif(trim(coalesce(p.photo_url, '')), '') IS NOT NULL THEN score := score + 10; END IF;
  IF array_length(p.languages, 1) > 0 THEN score := score + 5; END IF;
  IF coalesce(p.selfie_verified, false) THEN score := score + 30; END IF;

  SELECT count(DISTINCT question_id) INTO answer_count FROM public.convinter_answers WHERE user_id = p_user;
  score := score + least(answer_count * 2, 30);

  SELECT
    count(*) FILTER (WHERE coalesce(status,'active')='active'),
    count(*) FILTER (WHERE coalesce(status,'active')='active'
      AND nullif(trim(coalesce(title,'')),'') IS NOT NULL
      AND nullif(trim(coalesce(description,'')),'') IS NOT NULL
      AND nullif(trim(coalesce(city,'')),'') IS NOT NULL
      AND price_monthly IS NOT NULL),
    count(*) FILTER (WHERE coalesce(status,'active')='active' AND coalesce(listing_verified,false))
  INTO active_listing_count, complete_listing_count, verified_listing_count
  FROM public.convinter_listings WHERE owner_id = p_user;

  IF active_listing_count > 0 THEN score := score + 10; END IF;
  IF complete_listing_count > 0 THEN score := score + 5; END IF;
  IF verified_listing_count > 0 THEN score := score + 10; END IF;

  RETURN least(score, 100);
END;
$$;

CREATE OR REPLACE FUNCTION public.convinter_refresh_trust_score(p_user uuid)
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE new_score int; new_badge public.convinter_trust_badge;
BEGIN
  IF p_user IS NULL THEN RETURN; END IF;
  new_score := public.convinter_calc_trust_score(p_user);
  new_badge := CASE
    WHEN new_score >= 80 THEN 'gold'::public.convinter_trust_badge
    WHEN new_score >= 60 THEN 'silver'::public.convinter_trust_badge
    WHEN new_score >= 40 THEN 'bronze'::public.convinter_trust_badge
    ELSE 'none'::public.convinter_trust_badge END;
  UPDATE public.convinter_profiles
  SET trust_score = new_score, trust_badge = new_badge, updated_at = now()
  WHERE user_id = p_user;
END;
$$;

CREATE OR REPLACE FUNCTION public.convinter_after_answers_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.convinter_refresh_trust_score(coalesce(new.user_id, old.user_id));
  IF tg_op = 'DELETE' THEN RETURN old; END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS convinter_answers_refresh_trust_ins ON public.convinter_answers;
CREATE TRIGGER convinter_answers_refresh_trust_ins AFTER INSERT ON public.convinter_answers
FOR EACH ROW EXECUTE FUNCTION public.convinter_after_answers_change();

DROP TRIGGER IF EXISTS convinter_answers_refresh_trust_upd ON public.convinter_answers;
CREATE TRIGGER convinter_answers_refresh_trust_upd AFTER UPDATE ON public.convinter_answers
FOR EACH ROW EXECUTE FUNCTION public.convinter_after_answers_change();

DROP TRIGGER IF EXISTS convinter_answers_refresh_trust_del ON public.convinter_answers;
CREATE TRIGGER convinter_answers_refresh_trust_del AFTER DELETE ON public.convinter_answers
FOR EACH ROW EXECUTE FUNCTION public.convinter_after_answers_change();

CREATE OR REPLACE FUNCTION public.convinter_after_profile_trust_fields_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.convinter_refresh_trust_score(new.user_id);
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS convinter_profiles_refresh_trust_fields ON public.convinter_profiles;
CREATE TRIGGER convinter_profiles_refresh_trust_fields
AFTER INSERT OR UPDATE OF display_name, handle, bio, photo_url, languages, selfie_verified
ON public.convinter_profiles
FOR EACH ROW EXECUTE FUNCTION public.convinter_after_profile_trust_fields_change();

CREATE OR REPLACE FUNCTION public.convinter_after_listing_trust_fields_change()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.convinter_refresh_trust_score(coalesce(new.owner_id, old.owner_id));
  IF tg_op = 'UPDATE' AND old.owner_id IS DISTINCT FROM new.owner_id THEN
    PERFORM public.convinter_refresh_trust_score(old.owner_id);
  END IF;
  IF tg_op = 'DELETE' THEN RETURN old; END IF;
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS convinter_listings_refresh_owner_trust_ins ON public.convinter_listings;
CREATE TRIGGER convinter_listings_refresh_owner_trust_ins AFTER INSERT ON public.convinter_listings
FOR EACH ROW EXECUTE FUNCTION public.convinter_after_listing_trust_fields_change();

DROP TRIGGER IF EXISTS convinter_listings_refresh_owner_trust_upd ON public.convinter_listings;
CREATE TRIGGER convinter_listings_refresh_owner_trust_upd
AFTER UPDATE OF owner_id, status, title, description, city, price_monthly, thumbnail_url, listing_verified
ON public.convinter_listings
FOR EACH ROW EXECUTE FUNCTION public.convinter_after_listing_trust_fields_change();

DROP TRIGGER IF EXISTS convinter_listings_refresh_owner_trust_del ON public.convinter_listings;
CREATE TRIGGER convinter_listings_refresh_owner_trust_del AFTER DELETE ON public.convinter_listings
FOR EACH ROW EXECUTE FUNCTION public.convinter_after_listing_trust_fields_change();

WITH recalculated AS (
  SELECT user_id, public.convinter_calc_trust_score(user_id) AS score FROM public.convinter_profiles
)
UPDATE public.convinter_profiles p
SET trust_score = r.score,
    trust_badge = CASE
      WHEN r.score >= 80 THEN 'gold'::public.convinter_trust_badge
      WHEN r.score >= 60 THEN 'silver'::public.convinter_trust_badge
      WHEN r.score >= 40 THEN 'bronze'::public.convinter_trust_badge
      ELSE 'none'::public.convinter_trust_badge END,
    updated_at = now()
FROM recalculated r WHERE p.user_id = r.user_id;