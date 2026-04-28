-- Include the full listing photo array in the listing detail RPC.
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
