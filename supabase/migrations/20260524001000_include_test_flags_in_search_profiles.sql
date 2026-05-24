-- Include test completion flags in Discover profile cards.

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
           trust_score, trust_badge, selfie_verified, photo_url,
           quick_test_completed, full_test_completed
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
             'selfie_verified', selfie_verified, 'photo_url', photo_url,
             'quick_test_completed', coalesce(quick_test_completed, false),
             'full_test_completed', coalesce(full_test_completed, false)
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
