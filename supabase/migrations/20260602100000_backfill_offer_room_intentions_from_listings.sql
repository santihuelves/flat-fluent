-- Keep Discover aligned with the current product model:
-- - active room listings imply "Ofrezco habitacion";
-- - seeker profiles imply "Busco habitacion";
-- - legacy "Busco companero/a" intentions stop being visible.

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
  SET active = false,
      is_primary = false,
      updated_at = now()
  WHERE profile_id = me
    AND active = true
    AND intention_type <> valid_intention_type;

  INSERT INTO public.convinter_profile_intentions (
    profile_id, intention_type, is_primary, urgency, details, active
  ) VALUES (
    me, valid_intention_type, true, valid_urgency, p_details, true
  )
  ON CONFLICT (profile_id, intention_type, active)
  DO UPDATE SET
    is_primary = true,
    urgency = EXCLUDED.urgency,
    details = EXCLUDED.details,
    updated_at = now()
  RETURNING id INTO intention_id;

  RETURN jsonb_build_object('ok', true, 'intention_id', intention_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_set_intention(text, boolean, text, jsonb) TO authenticated;

DELETE FROM public.convinter_profile_intentions inactive
USING public.convinter_profile_intentions active_row
WHERE inactive.profile_id = active_row.profile_id
  AND inactive.intention_type = 'seek_flatmate'::public.convinter_intention_type
  AND active_row.intention_type = 'seek_flatmate'::public.convinter_intention_type
  AND inactive.active = false
  AND active_row.active = true;

UPDATE public.convinter_profile_intentions
SET active = false,
    is_primary = false,
    updated_at = now(),
    details = coalesce(details, '{}'::jsonb)
      || jsonb_build_object('deprecated_by', '20260602100000_backfill_listing_intentions')
WHERE active = true
  AND intention_type = 'seek_flatmate'::public.convinter_intention_type;

WITH room_listing_owners AS (
  SELECT
    owner_id,
    max(updated_at) AS latest_listing_at,
    count(*)::int AS active_room_listing_count
  FROM public.convinter_listings
  WHERE listing_type = 'room'::public.convinter_listing_type
    AND status = 'active'
  GROUP BY owner_id
)
INSERT INTO public.convinter_profile_intentions (
  profile_id,
  intention_type,
  is_primary,
  urgency,
  priority,
  details,
  active,
  created_at,
  updated_at
)
SELECT
  owner_id,
  'offer_room'::public.convinter_intention_type,
  true,
  'flexible',
  5,
  jsonb_build_object(
    'source', 'backfill_active_room_listing',
    'active_room_listing_count', active_room_listing_count,
    'latest_listing_at', latest_listing_at
  ),
  true,
  now(),
  now()
FROM room_listing_owners
ON CONFLICT (profile_id, intention_type, active)
DO UPDATE SET
  is_primary = true,
  active = true,
  updated_at = now(),
  details = coalesce(public.convinter_profile_intentions.details, '{}'::jsonb)
    || jsonb_build_object(
      'source', 'backfill_active_room_listing',
      'active_room_listing_count', EXCLUDED.details->'active_room_listing_count',
      'latest_listing_at', EXCLUDED.details->'latest_listing_at'
    );

UPDATE public.profiles p
SET user_type = 'offering_room'::public.user_type
WHERE EXISTS (
  SELECT 1
  FROM public.convinter_listings l
  WHERE l.owner_id = p.id
    AND l.listing_type = 'room'::public.convinter_listing_type
    AND l.status = 'active'
);

WITH seeker_profiles AS (
  SELECT p.id AS profile_id
  FROM public.profiles p
  WHERE p.user_type = 'seeking_room'::public.user_type
    AND NOT EXISTS (
      SELECT 1
      FROM public.convinter_profile_intentions existing
      WHERE existing.profile_id = p.id
        AND existing.active = true
        AND existing.intention_type IN (
          'seek_room'::public.convinter_intention_type,
          'offer_room'::public.convinter_intention_type
        )
    )
)
INSERT INTO public.convinter_profile_intentions (
  profile_id,
  intention_type,
  is_primary,
  urgency,
  priority,
  details,
  active,
  created_at,
  updated_at
)
SELECT
  profile_id,
  'seek_room'::public.convinter_intention_type,
  true,
  'flexible',
  5,
  jsonb_build_object('source', 'backfill_seeking_room_profile'),
  true,
  now(),
  now()
FROM seeker_profiles
ON CONFLICT (profile_id, intention_type, active)
DO UPDATE SET
  is_primary = true,
  active = true,
  updated_at = now(),
  details = coalesce(public.convinter_profile_intentions.details, '{}'::jsonb)
    || jsonb_build_object('source', 'backfill_seeking_room_profile');

UPDATE public.profiles p
SET user_type = 'seeking_room'::public.user_type
WHERE EXISTS (
  SELECT 1
  FROM public.convinter_profile_intentions pi
  WHERE pi.profile_id = p.id
    AND pi.intention_type = 'seek_room'::public.convinter_intention_type
    AND pi.active = true
);
