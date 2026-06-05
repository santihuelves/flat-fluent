
CREATE OR REPLACE FUNCTION public.convinter_create_chat(p_other uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  a uuid;
  b uuid;
  cid uuid;
  consent_lvl int := 0;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  PERFORM public.convinter_guard('chat');
  PERFORM public.convinter_check_rate_limit('create_chat', 60, 3600);

  IF p_other IS NULL OR p_other = me THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_TARGET');
  END IF;

  PERFORM public.convinter_assert_not_blocked(p_other);

  a := least(me, p_other);
  b := greatest(me, p_other);

  SELECT consent_level INTO consent_lvl
    FROM public.convinter_pair_consent
   WHERE user_a = a AND user_b = b;
  consent_lvl := coalesce(consent_lvl, 0);

  IF consent_lvl < 1 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NO_MATCH');
  END IF;

  INSERT INTO public.convinter_chats(user_a, user_b, created_at, last_message_at)
  VALUES (a, b, now(), NULL)
  ON CONFLICT (user_a, user_b) DO NOTHING;

  SELECT id INTO cid FROM public.convinter_chats WHERE user_a = a AND user_b = b;

  RETURN jsonb_build_object('ok', true, 'chat_id', cid);
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_create_chat(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.convinter_send_message(p_chat_id uuid, p_body text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  c record;
  other uuid;
  a uuid;
  b uuid;
  consent_lvl int := 0;
  msg_id bigint;
  body_clean text;
  looks_like_contact boolean := false;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  PERFORM public.convinter_guard('message');
  PERFORM public.convinter_check_rate_limit('send_message', 120, 3600);

  IF p_chat_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_CHAT');
  END IF;

  body_clean := trim(coalesce(p_body,''));
  IF length(body_clean) < 1 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'EMPTY_MESSAGE');
  END IF;
  IF length(body_clean) > 2000 THEN
    body_clean := left(body_clean, 2000);
  END IF;

  SELECT * INTO c FROM public.convinter_chats WHERE id = p_chat_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'CHAT_NOT_FOUND');
  END IF;

  IF me <> c.user_a AND me <> c.user_b THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_A_PARTICIPANT');
  END IF;

  other := CASE WHEN me = c.user_a THEN c.user_b ELSE c.user_a END;

  PERFORM public.convinter_assert_not_blocked(other);

  a := least(me, other);
  b := greatest(me, other);
  SELECT consent_level INTO consent_lvl FROM public.convinter_pair_consent WHERE user_a=a AND user_b=b;
  consent_lvl := coalesce(consent_lvl, 0);

  IF consent_lvl < 1 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NO_MATCH');
  END IF;

  looks_like_contact := (
    body_clean ~* '(@|\bmail\b|\bgmail\b|\bhotmail\b|\byahoo\b)' OR
    body_clean ~* '(\+?\d[\d\s\-]{7,}\d)' OR
    body_clean ~* '(whatsapp|telegram|insta|instagram|t\.me|wa\.me)' OR
    body_clean ~* '([A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,})'
  );

  IF looks_like_contact AND consent_lvl < 2 THEN
    RETURN jsonb_build_object('ok', false, 'code', 'CONTACT_INFO_NOT_ALLOWED', 'required_level', 2, 'consent_level', consent_lvl);
  END IF;

  INSERT INTO public.convinter_messages(chat_id, sender_id, body)
  VALUES (p_chat_id, me, body_clean)
  RETURNING id INTO msg_id;

  UPDATE public.convinter_chats SET last_message_at = now() WHERE id = p_chat_id;

  PERFORM public.convinter_notify(other, 'NEW_MESSAGE', jsonb_build_object('chat_id', p_chat_id, 'from', me, 'message_id', msg_id));

  RETURN jsonb_build_object('ok', true, 'message_id', msg_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_send_message(uuid,text) TO authenticated;
