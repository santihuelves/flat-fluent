ALTER TABLE public.convinter_listings
ADD COLUMN IF NOT EXISTS details jsonb NOT NULL DEFAULT '{}'::jsonb;

DROP FUNCTION IF EXISTS public.convinter_create_listing(
  text, text, text, text, text, numeric, boolean, date, int, boolean, boolean, text[]
);

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
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
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
    smoking_allowed, pets_allowed, photos, thumbnail_url, details, status,
    created_at, updated_at
  ) VALUES (
    me, valid_listing_type, trim(p_title),
    NULLIF(trim(p_description), ''),
    NULLIF(trim(p_city), ''),
    NULLIF(trim(p_province_code), ''),
    p_price_monthly,
    COALESCE(p_bills_included, false),
    p_available_from, p_min_stay_months,
    COALESCE(p_smoking_allowed, false),
    COALESCE(p_pets_allowed, false),
    p_photos,
    CASE WHEN p_photos IS NOT NULL AND array_length(p_photos, 1) > 0
         THEN p_photos[1] ELSE NULL END,
    COALESCE(p_details, '{}'::jsonb),
    'active', now(), now()
  ) RETURNING id INTO new_listing_id;

  RETURN jsonb_build_object('ok', true, 'listing_id', new_listing_id);
END; $$;

GRANT EXECUTE ON FUNCTION public.convinter_create_listing(
  text, text, text, text, text, numeric, boolean, date, int, boolean, boolean, text[], jsonb
) TO authenticated;

DROP FUNCTION IF EXISTS public.convinter_update_listing(
  uuid, text, text, text, text, numeric, boolean, date, int, boolean, boolean, text[], text
);

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
  p_status text DEFAULT NULL,
  p_details jsonb DEFAULT NULL
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := auth.uid(); listing record;
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

  UPDATE public.convinter_listings SET
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
      THEN p_photos[1] ELSE thumbnail_url END,
    status = COALESCE(p_status, status),
    details = COALESCE(p_details, details),
    updated_at = now()
   WHERE id = p_listing_id;

  RETURN jsonb_build_object('ok', true, 'listing_id', p_listing_id);
END; $$;

GRANT EXECUTE ON FUNCTION public.convinter_update_listing(
  uuid, text, text, text, text, numeric, boolean, date, int, boolean, boolean, text[], text, jsonb
) TO authenticated;

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
      'id', l.id,
      'owner_id', l.owner_id,
      'listing_type', l.listing_type,
      'title', l.title,
      'description', l.description,
      'province_code', l.province_code,
      'city', l.city,
      'price_monthly', l.price_monthly,
      'bills_included', l.bills_included,
      'available_from', l.available_from,
      'min_stay_months', l.min_stay_months,
      'smoking_allowed', l.smoking_allowed,
      'pets_allowed', l.pets_allowed,
      'thumbnail_url', l.thumbnail_url,
      'photos', coalesce(l.photos, ARRAY[]::text[]),
      'details', coalesce(l.details, '{}'::jsonb),
      'listing_verified', l.listing_verified,
      'listing_verified_at', l.listing_verified_at,
      'listing_verification_level', l.listing_verification_level,
      'status', l.status
    ),
    'owner', jsonb_build_object(
      'user_id', p.user_id,
      'handle', p.handle,
      'display_name', p.display_name,
      'photo_url', p.photo_url,
      'selfie_verified', p.selfie_verified,
      'trust_score', p.trust_score,
      'trust_badge', p.trust_badge,
      'province_code', p.province_code,
      'city', p.city
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_get_listing_detail(uuid) TO authenticated;
