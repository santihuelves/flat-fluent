-- Keep Convinter intentions separated and prevent legacy combinations.
-- Current product modes are seek_room and offer_room.
-- seek_flatmate remains only as legacy database history.

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

  -- Remove stale inactive rows that could block deactivating old active rows
  -- because of the legacy UNIQUE(profile_id, intention_type, active) constraint.
  DELETE FROM public.convinter_profile_intentions inactive
  USING public.convinter_profile_intentions active_row
  WHERE inactive.profile_id = me
    AND active_row.profile_id = me
    AND inactive.intention_type = active_row.intention_type
    AND inactive.active = false
    AND active_row.active = true
    AND active_row.intention_type <> valid_intention_type;

  -- Current product model: choosing a mode replaces any previous active mode.
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

-- Normalize existing data: keep only the latest/primary active intention per profile.
WITH ranked AS (
  SELECT
    id,
    profile_id,
    intention_type,
    row_number() OVER (
      PARTITION BY profile_id
      ORDER BY is_primary DESC, updated_at DESC, created_at DESC
    ) AS rn
  FROM public.convinter_profile_intentions
  WHERE active = true
),
rows_to_deactivate AS (
  SELECT id, profile_id, intention_type
  FROM ranked
  WHERE rn > 1
)
DELETE FROM public.convinter_profile_intentions inactive
USING rows_to_deactivate stale
WHERE inactive.profile_id = stale.profile_id
  AND inactive.intention_type = stale.intention_type
  AND inactive.active = false;

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY profile_id
      ORDER BY is_primary DESC, updated_at DESC, created_at DESC
    ) AS rn
  FROM public.convinter_profile_intentions
  WHERE active = true
)
UPDATE public.convinter_profile_intentions pi
SET active = false,
    is_primary = false,
    updated_at = now()
FROM ranked r
WHERE pi.id = r.id
  AND r.rn > 1;

WITH ranked AS (
  SELECT
    id,
    row_number() OVER (
      PARTITION BY profile_id
      ORDER BY is_primary DESC, updated_at DESC, created_at DESC
    ) AS rn
  FROM public.convinter_profile_intentions
  WHERE active = true
)
UPDATE public.convinter_profile_intentions pi
SET is_primary = true,
    updated_at = now()
FROM ranked r
WHERE pi.id = r.id
  AND r.rn = 1
  AND pi.is_primary IS DISTINCT FROM true;

COMMENT ON TABLE public.convinter_profile_intentions IS
'Current Convinter housing mode per profile: seek_room or offer_room. seek_flatmate rows are legacy/history and must not be active.';
