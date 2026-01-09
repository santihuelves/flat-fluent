-- Helper RPC to create listings from frontend
-- This allows CreateListing.tsx to save listings to the database

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
  p_photos text[] DEFAULT NULL
)
RETURNS jsonb
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
  PERFORM public.convinter_check_rate_limit('create_listing', 10, 86400); -- 10 per day

  -- Validate listing type
  IF p_listing_type NOT IN ('room', 'flatmate') THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_LISTING_TYPE');
  END IF;

  valid_listing_type := p_listing_type::public.convinter_listing_type;

  -- Validate required fields
  IF p_title IS NULL OR trim(p_title) = '' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'TITLE_REQUIRED');
  END IF;

  IF length(trim(p_title)) < 10 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'TITLE_TOO_SHORT');
  END IF;

  IF p_description IS NOT NULL AND length(trim(p_description)) < 20 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'DESCRIPTION_TOO_SHORT');
  END IF;

  -- Insert listing
  INSERT INTO public.convinter_listings (
    owner_id,
    listing_type,
    title,
    description,
    city,
    province_code,
    price_monthly,
    bills_included,
    available_from,
    min_stay_months,
    smoking_allowed,
    pets_allowed,
    photos,
    thumbnail_url,
    status,
    created_at,
    updated_at
  ) VALUES (
    me,
    valid_listing_type,
    trim(p_title),
    NULLIF(trim(p_description), ''),
    NULLIF(trim(p_city), ''),
    NULLIF(trim(p_province_code), ''),
    p_price_monthly,
    COALESCE(p_bills_included, false),
    p_available_from,
    p_min_stay_months,
    COALESCE(p_smoking_allowed, false),
    COALESCE(p_pets_allowed, false),
    p_photos,
    CASE WHEN p_photos IS NOT NULL AND array_length(p_photos, 1) > 0 
         THEN p_photos[1] 
         ELSE NULL 
    END,
    'active',
    now(),
    now()
  ) RETURNING id INTO new_listing_id;

  RETURN jsonb_build_object(
    'ok', true,
    'listing_id', new_listing_id
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_create_listing(
  text, text, text, text, text, numeric, boolean, date, int, boolean, boolean, text[]
) TO authenticated;

-- Helper to update listing
CREATE OR REPLACE FUNCTION public.convinter_update_listing(
  p_listing_id uuid,
  p_title text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_province_code text DEFAULT NULL,
  p_price_monthly numeric DEFAULT NULL,
  p_bills_included boolean DEFAULT NULL,
  p_available_from date DEFAULT NULL,
  p_min_stay_months int DEFAULT NULL,
  p_smoking_allowed boolean DEFAULT NULL,
  p_pets_allowed boolean DEFAULT NULL,
  p_photos text[] DEFAULT NULL,
  p_status text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  listing record;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  SELECT * INTO listing FROM public.convinter_listings WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'LISTING_NOT_FOUND');
  END IF;

  IF listing.owner_id <> me THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_OWNER');
  END IF;

  -- Update only provided fields
  UPDATE public.convinter_listings
  SET
    title = COALESCE(NULLIF(trim(p_title), ''), title),
    description = COALESCE(NULLIF(trim(p_description), ''), description),
    city = COALESCE(NULLIF(trim(p_city), ''), city),
    province_code = COALESCE(NULLIF(trim(p_province_code), ''), province_code),
    price_monthly = COALESCE(p_price_monthly, price_monthly),
    bills_included = COALESCE(p_bills_included, bills_included),
    available_from = COALESCE(p_available_from, available_from),
    min_stay_months = COALESCE(p_min_stay_months, min_stay_months),
    smoking_allowed = COALESCE(p_smoking_allowed, smoking_allowed),
    pets_allowed = COALESCE(p_pets_allowed, pets_allowed),
    photos = COALESCE(p_photos, photos),
    thumbnail_url = CASE 
      WHEN p_photos IS NOT NULL AND array_length(p_photos, 1) > 0 
      THEN p_photos[1]
      ELSE thumbnail_url
    END,
    status = COALESCE(p_status, status),
    updated_at = now()
  WHERE id = p_listing_id;

  RETURN jsonb_build_object('ok', true, 'listing_id', p_listing_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_update_listing(
  uuid, text, text, text, text, numeric, boolean, date, int, boolean, boolean, text[], text
) TO authenticated;

-- Helper to delete/deactivate listing
CREATE OR REPLACE FUNCTION public.convinter_delete_listing(p_listing_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  listing record;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  SELECT * INTO listing FROM public.convinter_listings WHERE id = p_listing_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'LISTING_NOT_FOUND');
  END IF;

  IF listing.owner_id <> me THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_OWNER');
  END IF;

  -- Soft delete: mark as inactive instead of deleting
  UPDATE public.convinter_listings
  SET status = 'inactive', updated_at = now()
  WHERE id = p_listing_id;

  RETURN jsonb_build_object('ok', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_delete_listing(uuid) TO authenticated;
