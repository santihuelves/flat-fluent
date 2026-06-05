-- Allow new room listings to keep smoking/pets unspecified.
-- Previously convinter_create_listing converted NULL to false, so an empty answer
-- became "No permite fumar" / "No permite mascotas" in the public detail.

CREATE OR REPLACE FUNCTION public.convinter_create_listing(
  p_listing_type text,
  p_title text,
  p_description text,
  p_city text,
  p_province_code text DEFAULT NULL,
  p_price_monthly numeric DEFAULT NULL,
  p_bills_included boolean DEFAULT NULL,
  p_available_from date DEFAULT NULL,
  p_min_stay_months int DEFAULT NULL,
  p_smoking_allowed boolean DEFAULT NULL,
  p_pets_allowed boolean DEFAULT NULL,
  p_photos text[] DEFAULT NULL,
  p_details jsonb DEFAULT '{}'::jsonb
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  new_listing_id uuid;
  valid_listing_type public.convinter_listing_type;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  PERFORM public.convinter_guard('create_listing');
  PERFORM public.convinter_check_rate_limit('create_listing', 10, 86400);

  IF p_listing_type NOT IN ('room', 'flatmate') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_LISTING_TYPE');
  END IF;

  valid_listing_type := p_listing_type::public.convinter_listing_type;

  IF p_title IS NULL OR trim(p_title) = '' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'TITLE_REQUIRED');
  END IF;

  IF length(trim(p_title)) < 10 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'TITLE_TOO_SHORT');
  END IF;

  IF p_description IS NOT NULL AND length(trim(p_description)) < 20 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'DESCRIPTION_TOO_SHORT');
  END IF;

  INSERT INTO public.convinter_listings (
    owner_id, listing_type, title, description, city, province_code,
    price_monthly, bills_included, available_from, min_stay_months,
    smoking_allowed, pets_allowed, photos, thumbnail_url, details,
    status, created_at, updated_at
  ) VALUES (
    me, valid_listing_type, trim(p_title), NULLIF(trim(p_description), ''),
    NULLIF(trim(p_city), ''), NULLIF(trim(p_province_code), ''),
    p_price_monthly, COALESCE(p_bills_included, false), p_available_from,
    p_min_stay_months, p_smoking_allowed, p_pets_allowed,
    p_photos,
    CASE WHEN p_photos IS NOT NULL AND array_length(p_photos, 1) > 0 THEN p_photos[1] ELSE NULL END,
    COALESCE(p_details, '{}'::jsonb),
    'active', now(), now()
  ) RETURNING id INTO new_listing_id;

  RETURN jsonb_build_object('ok', true, 'listing_id', new_listing_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_create_listing(
  text, text, text, text, text, numeric, boolean, date, int, boolean, boolean, text[], jsonb
) TO authenticated;

-- Verification after applying:
-- SELECT routine_name
-- FROM information_schema.routines
-- WHERE routine_schema = 'public'
--   AND routine_name = 'convinter_create_listing';
