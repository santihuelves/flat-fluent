-- =====================================================================
-- BLOQUE 3 — RPCs críticos + Realtime
-- =====================================================================

-- 1) Estado de test de un usuario --------------------------------------
CREATE OR REPLACE FUNCTION public.convinter_get_test_status(p_user uuid DEFAULT NULL)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid := auth.uid();
  target_user uuid;
  profile record;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  target_user := COALESCE(p_user, me);

  IF target_user <> me THEN
    PERFORM public.convinter_assert_not_blocked(target_user);
  END IF;

  SELECT * INTO profile FROM public.convinter_profiles WHERE user_id = target_user;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'PROFILE_NOT_FOUND');
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'user_id', target_user,
    'test_completed', profile.test_completed,
    'quick_test_completed', COALESCE(profile.quick_test_completed, false),
    'quick_test_completed_at', profile.quick_test_completed_at,
    'full_test_completed', COALESCE(profile.full_test_completed, false),
    'full_test_completed_at', profile.full_test_completed_at,
    'full_test_requested_at', profile.full_test_requested_at,
    'full_test_requested_by', profile.full_test_requested_by
  );
END; $$;

GRANT EXECUTE ON FUNCTION public.convinter_get_test_status(uuid) TO authenticated;

-- 2) Matches del usuario actual ----------------------------------------
CREATE OR REPLACE FUNCTION public.convinter_get_my_matches(
  p_limit int DEFAULT 50,
  p_offset int DEFAULT 0
) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  me uuid := auth.uid();
  matches_array jsonb := '[]'::jsonb;
  match_record record;
  compatibility_data record;
  last_msg record;
  unread_count int;
  chat_id_val uuid;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  FOR match_record IN
    SELECT
      CASE WHEN pc.user_a = me THEN pc.user_b ELSE pc.user_a END AS other_user,
      pc.consent_level,
      pc.updated_at AS consent_at
    FROM public.convinter_pair_consent pc
    WHERE (pc.user_a = me OR pc.user_b = me)
      AND pc.consent_level >= 1
    ORDER BY pc.updated_at DESC
    LIMIT p_limit OFFSET p_offset
  LOOP
    SELECT user_id, display_name, handle, photo_url, city, province_code,
           bio, trust_score, trust_badge, selfie_verified
      INTO match_record
      FROM public.convinter_profiles
     WHERE user_id = match_record.other_user;
    IF NOT FOUND THEN CONTINUE; END IF;

    SELECT score, breakdown INTO compatibility_data
      FROM public.convinter_compat_cache
     WHERE (user_a = me AND user_b = match_record.user_id)
        OR (user_a = match_record.user_id AND user_b = me)
     ORDER BY computed_at DESC
     LIMIT 1;

    SELECT c.id INTO chat_id_val
      FROM public.convinter_chats c
     WHERE (c.user_a = me AND c.user_b = match_record.user_id)
        OR (c.user_a = match_record.user_id AND c.user_b = me);

    last_msg := NULL;
    unread_count := 0;
    IF chat_id_val IS NOT NULL THEN
      SELECT m.body, m.created_at, m.sender_id INTO last_msg
        FROM public.convinter_messages m
       WHERE m.chat_id = chat_id_val
       ORDER BY m.created_at DESC LIMIT 1;

      SELECT COUNT(*) INTO unread_count
        FROM public.convinter_messages m
       WHERE m.chat_id = chat_id_val
         AND m.sender_id = match_record.user_id
         AND m.created_at > COALESCE(
           (SELECT MAX(created_at) FROM public.convinter_messages
             WHERE chat_id = chat_id_val AND sender_id = me),
           '1970-01-01'::timestamptz);
    END IF;

    matches_array := matches_array || jsonb_build_object(
      'user_id', match_record.user_id,
      'display_name', match_record.display_name,
      'handle', match_record.handle,
      'photo_url', match_record.photo_url,
      'city', match_record.city,
      'province_code', match_record.province_code,
      'bio', match_record.bio,
      'trust_score', match_record.trust_score,
      'trust_badge', match_record.trust_badge,
      'selfie_verified', match_record.selfie_verified,
      'compatibility_score', COALESCE(compatibility_data.score, 0),
      'compatibility_reasons', COALESCE(compatibility_data.breakdown->'reasons', '[]'::jsonb),
      'consent_level', match_record.consent_level,
      'matched_at', match_record.consent_at,
      'chat_id', chat_id_val,
      'last_message', CASE WHEN last_msg IS NOT NULL THEN jsonb_build_object(
          'body', last_msg.body,
          'created_at', last_msg.created_at,
          'is_mine', last_msg.sender_id = me
        ) ELSE NULL END,
      'unread_count', unread_count
    );
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'matches', matches_array,
                            'count', jsonb_array_length(matches_array));
END; $$;

GRANT EXECUTE ON FUNCTION public.convinter_get_my_matches(int, int) TO authenticated;

-- 3) Realtime ----------------------------------------------------------
ALTER PUBLICATION supabase_realtime ADD TABLE public.convinter_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.convinter_notifications;

-- 4) Marcar chat como leído (placeholder) ------------------------------
CREATE OR REPLACE FUNCTION public.convinter_mark_chat_read(p_chat_id uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := auth.uid(); chat record;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;
  SELECT * INTO chat FROM public.convinter_chats WHERE id = p_chat_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'CHAT_NOT_FOUND');
  END IF;
  IF me <> chat.user_a AND me <> chat.user_b THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_A_PARTICIPANT');
  END IF;
  RETURN jsonb_build_object('ok', true, 'chat_id', p_chat_id);
END; $$;

GRANT EXECUTE ON FUNCTION public.convinter_mark_chat_read(uuid) TO authenticated;
