-- Keep active compatibility connections visible even when the other profile is hidden or incomplete.

CREATE OR REPLACE FUNCTION public.convinter_get_my_consent_overview()
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  incoming jsonb := '[]'::jsonb;
  outgoing jsonb := '[]'::jsonb;
  connections jsonb := '[]'::jsonb;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'request_id', cr.id,
        'from_user', cr.from_user,
        'requested_level', cr.requested_level,
        'status', cr.status,
        'created_at', cr.created_at,
        'profile', jsonb_build_object(
          'user_id', COALESCE(p.user_id, cr.from_user),
          'display_name', COALESCE(p.display_name, 'Usuario'),
          'handle', p.handle,
          'photo_url', p.photo_url,
          'city', p.city,
          'province_code', p.province_code,
          'bio', p.bio,
          'trust_score', COALESCE(p.trust_score, 0),
          'trust_badge', p.trust_badge,
          'selfie_verified', COALESCE(p.selfie_verified, false)
        ),
        'compatibility_score', COALESCE(cc.score, 0),
        'compatibility_reasons', COALESCE(cc.breakdown->'reasons', '[]'::jsonb)
      )
      ORDER BY cr.created_at DESC
    ),
    '[]'::jsonb
  )
  INTO incoming
  FROM public.convinter_consent_requests cr
  LEFT JOIN public.convinter_profiles p ON p.user_id = cr.from_user
  LEFT JOIN LATERAL (
    SELECT score, breakdown
    FROM public.convinter_compat_cache
    WHERE user_a = LEAST(me, cr.from_user)
      AND user_b = GREATEST(me, cr.from_user)
    ORDER BY computed_at DESC
    LIMIT 1
  ) cc ON true
  WHERE cr.to_user = me
    AND cr.status = 'pending'
    AND NOT EXISTS (
      SELECT 1
      FROM public.convinter_pair_consent pc
      WHERE pc.user_a = LEAST(me, cr.from_user)
        AND pc.user_b = GREATEST(me, cr.from_user)
        AND COALESCE(pc.consent_level, 0) >= cr.requested_level
    );

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'request_id', cr.id,
        'to_user', cr.to_user,
        'requested_level', cr.requested_level,
        'status', cr.status,
        'created_at', cr.created_at,
        'profile', jsonb_build_object(
          'user_id', COALESCE(p.user_id, cr.to_user),
          'display_name', COALESCE(p.display_name, 'Usuario'),
          'handle', p.handle,
          'photo_url', p.photo_url,
          'city', p.city,
          'province_code', p.province_code,
          'bio', p.bio,
          'trust_score', COALESCE(p.trust_score, 0),
          'trust_badge', p.trust_badge,
          'selfie_verified', COALESCE(p.selfie_verified, false)
        ),
        'compatibility_score', COALESCE(cc.score, 0),
        'compatibility_reasons', COALESCE(cc.breakdown->'reasons', '[]'::jsonb)
      )
      ORDER BY cr.created_at DESC
    ),
    '[]'::jsonb
  )
  INTO outgoing
  FROM public.convinter_consent_requests cr
  LEFT JOIN public.convinter_profiles p ON p.user_id = cr.to_user
  LEFT JOIN LATERAL (
    SELECT score, breakdown
    FROM public.convinter_compat_cache
    WHERE user_a = LEAST(me, cr.to_user)
      AND user_b = GREATEST(me, cr.to_user)
    ORDER BY computed_at DESC
    LIMIT 1
  ) cc ON true
  WHERE cr.from_user = me
    AND cr.status = 'pending'
    AND NOT EXISTS (
      SELECT 1
      FROM public.convinter_pair_consent pc
      WHERE pc.user_a = LEAST(me, cr.to_user)
        AND pc.user_b = GREATEST(me, cr.to_user)
        AND COALESCE(pc.consent_level, 0) >= cr.requested_level
    );

  SELECT COALESCE(
    jsonb_agg(
      jsonb_build_object(
        'user_id', c.other_user,
        'consent_level', c.consent_level,
        'connected_at', c.updated_at,
        'chat_id', ch.id,
        'profile', jsonb_build_object(
          'user_id', COALESCE(p.user_id, c.other_user),
          'display_name', COALESCE(p.display_name, 'Usuario'),
          'handle', p.handle,
          'photo_url', p.photo_url,
          'city', p.city,
          'province_code', p.province_code,
          'bio', p.bio,
          'trust_score', COALESCE(p.trust_score, 0),
          'trust_badge', p.trust_badge,
          'selfie_verified', COALESCE(p.selfie_verified, false)
        ),
        'compatibility_score', COALESCE(cc.score, 0),
        'compatibility_reasons', COALESCE(cc.breakdown->'reasons', '[]'::jsonb)
      )
      ORDER BY c.updated_at DESC
    ),
    '[]'::jsonb
  )
  INTO connections
  FROM (
    SELECT
      CASE WHEN pc.user_a = me THEN pc.user_b ELSE pc.user_a END AS other_user,
      COALESCE(pc.consent_level, 0) AS consent_level,
      pc.updated_at
    FROM public.convinter_pair_consent pc
    WHERE (pc.user_a = me OR pc.user_b = me)
      AND COALESCE(pc.consent_level, 0) >= 1
  ) c
  LEFT JOIN public.convinter_profiles p ON p.user_id = c.other_user
  LEFT JOIN LATERAL (
    SELECT score, breakdown
    FROM public.convinter_compat_cache
    WHERE user_a = LEAST(me, c.other_user)
      AND user_b = GREATEST(me, c.other_user)
    ORDER BY computed_at DESC
    LIMIT 1
  ) cc ON true
  LEFT JOIN LATERAL (
    SELECT id
    FROM public.convinter_chats
    WHERE user_a = LEAST(me, c.other_user)
      AND user_b = GREATEST(me, c.other_user)
    LIMIT 1
  ) ch ON true;

  RETURN jsonb_build_object(
    'ok', true,
    'incoming', incoming,
    'outgoing', outgoing,
    'connections', connections
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_get_my_consent_overview() TO authenticated;
