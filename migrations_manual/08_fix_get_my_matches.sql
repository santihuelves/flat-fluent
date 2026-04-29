-- =====================================================================
-- BLOQUE 8 - Reparar carga de Matches
-- =====================================================================
-- Reinstala convinter_get_my_matches con registros separados para evitar
-- errores de PL/pgSQL al mezclar la fila de consentimiento con el perfil.

CREATE OR REPLACE FUNCTION public.convinter_get_my_matches(
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  matches_array jsonb := '[]'::jsonb;
  consent_record record;
  profile_record record;
  compatibility_data record;
  last_msg record;
  unread_count int;
  chat_id_val uuid;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  FOR consent_record IN
    SELECT
      CASE
        WHEN pc.user_a = me THEN pc.user_b
        ELSE pc.user_a
      END AS other_user,
      pc.consent_level,
      pc.updated_at AS consent_at
    FROM public.convinter_pair_consent pc
    WHERE (pc.user_a = me OR pc.user_b = me)
      AND pc.consent_level >= 1
    ORDER BY pc.updated_at DESC
    LIMIT least(greatest(coalesce(p_limit, 50), 1), 100)
    OFFSET greatest(coalesce(p_offset, 0), 0)
  LOOP
    SELECT
      user_id,
      display_name,
      handle,
      photo_url,
      city,
      province_code,
      bio,
      trust_score,
      trust_badge,
      selfie_verified
    INTO profile_record
    FROM public.convinter_profiles
    WHERE user_id = consent_record.other_user
      AND visibility IN ('public', 'registered_only');

    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    SELECT score, breakdown
    INTO compatibility_data
    FROM public.convinter_compat_cache
    WHERE user_a = least(me, consent_record.other_user)
      AND user_b = greatest(me, consent_record.other_user)
    ORDER BY computed_at DESC
    LIMIT 1;

    SELECT c.id
    INTO chat_id_val
    FROM public.convinter_chats c
    WHERE c.user_a = least(me, consent_record.other_user)
      AND c.user_b = greatest(me, consent_record.other_user);

    last_msg := NULL;
    unread_count := 0;

    IF chat_id_val IS NOT NULL THEN
      SELECT
        m.body,
        m.created_at,
        m.sender_id
      INTO last_msg
      FROM public.convinter_messages m
      WHERE m.chat_id = chat_id_val
      ORDER BY m.created_at DESC
      LIMIT 1;

      SELECT count(*)::int
      INTO unread_count
      FROM public.convinter_messages m
      WHERE m.chat_id = chat_id_val
        AND m.sender_id = consent_record.other_user
        AND m.created_at > coalesce(
          (
            SELECT max(created_at)
            FROM public.convinter_messages
            WHERE chat_id = chat_id_val
              AND sender_id = me
          ),
          '1970-01-01'::timestamptz
        );
    END IF;

    matches_array := matches_array || jsonb_build_object(
      'user_id', profile_record.user_id,
      'display_name', profile_record.display_name,
      'handle', profile_record.handle,
      'photo_url', profile_record.photo_url,
      'city', profile_record.city,
      'province_code', profile_record.province_code,
      'bio', profile_record.bio,
      'trust_score', profile_record.trust_score,
      'trust_badge', profile_record.trust_badge,
      'selfie_verified', profile_record.selfie_verified,
      'compatibility_score', coalesce(compatibility_data.score, 0),
      'compatibility_reasons', coalesce(compatibility_data.breakdown->'reasons', '[]'::jsonb),
      'consent_level', consent_record.consent_level,
      'matched_at', consent_record.consent_at,
      'chat_id', chat_id_val,
      'last_message', CASE
        WHEN last_msg IS NOT NULL THEN jsonb_build_object(
          'body', last_msg.body,
          'created_at', last_msg.created_at,
          'is_mine', last_msg.sender_id = me
        )
        ELSE NULL
      END,
      'unread_count', unread_count
    );
  END LOOP;

  RETURN jsonb_build_object(
    'ok', true,
    'matches', matches_array,
    'count', jsonb_array_length(matches_array)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_get_my_matches(int, int) TO authenticated;

-- Verificacion rapida despues de aplicar:
-- SELECT public.convinter_get_my_matches(5, 0);
