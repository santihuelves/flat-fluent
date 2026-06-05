-- Include living-profile traits in the public profile detail RPC.
-- This lets /u/:id show optional coexistence traits such as cleaning, quiet profile,
-- early schedule, visits, smoking/pets preferences and basic public context.

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
  base_p record;
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

  SELECT * INTO p
  FROM public.convinter_profiles
  WHERE user_id = p_user;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_FOUND');
  END IF;

  IF p.visibility = 'hidden' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'HIDDEN');
  END IF;

  SELECT * INTO base_p
  FROM public.profiles
  WHERE id = p_user;

  RETURN jsonb_build_object(
    'ok', true,
    'user', jsonb_build_object(
      'user_id', p.user_id,
      'handle', p.handle,
      'display_name', COALESCE(p.display_name, base_p.name),
      'bio', COALESCE(p.bio, base_p.bio),
      'languages', COALESCE(p.languages, base_p.languages, ARRAY[]::text[]),
      'province_code', COALESCE(p.province_code, base_p.province),
      'city', COALESCE(p.city, base_p.city),
      'photo_url', COALESCE(p.photo_url, CASE WHEN base_p.photos IS NOT NULL AND array_length(base_p.photos, 1) > 0 THEN base_p.photos[1] ELSE NULL END),
      'selfie_verified', p.selfie_verified,
      'trust_score', p.trust_score,
      'trust_badge', p.trust_badge,
      'occupation', base_p.occupation,
      'lifestyle_tags', COALESCE(base_p.lifestyle_tags, ARRAY[]::text[]),
      'autonomous_community', base_p.autonomous_community
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_get_profile_detail(uuid,text) TO authenticated;

-- Verification:
-- SELECT public.convinter_get_profile_detail(auth.uid(), 'es')->'user' ? 'lifestyle_tags' AS has_lifestyle_tags;
