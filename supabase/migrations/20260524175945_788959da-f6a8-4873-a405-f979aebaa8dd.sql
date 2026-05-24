-- Harden compatibility consent state to avoid duplicate requests and notification loops.

CREATE OR REPLACE FUNCTION public.convinter_get_consent_state(
  p_other_user uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  a uuid;
  b uuid;
  current_level int := 0;
  req record;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  IF p_other_user IS NULL OR p_other_user = me THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_TARGET');
  END IF;

  PERFORM public.convinter_assert_not_blocked(p_other_user);

  a := LEAST(me, p_other_user);
  b := GREATEST(me, p_other_user);

  SELECT COALESCE(consent_level, 0)
  INTO current_level
  FROM public.convinter_pair_consent
  WHERE user_a = a AND user_b = b;

  current_level := COALESCE(current_level, 0);

  IF current_level >= 1 THEN
    RETURN jsonb_build_object(
      'ok', true,
      'state', 'active',
      'request_id', NULL,
      'consent_level', current_level
    );
  END IF;

  SELECT id, requested_level, created_at
  INTO req
  FROM public.convinter_consent_requests
  WHERE from_user = me
    AND to_user = p_other_user
    AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', true,
      'state', 'outgoing_pending',
      'request_id', req.id,
      'consent_level', current_level,
      'requested_level', req.requested_level
    );
  END IF;

  SELECT id, requested_level, created_at
  INTO req
  FROM public.convinter_consent_requests
  WHERE from_user = p_other_user
    AND to_user = me
    AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', true,
      'state', 'incoming_pending',
      'request_id', req.id,
      'consent_level', current_level,
      'requested_level', req.requested_level
    );
  END IF;

  SELECT id, requested_level, responded_at, created_at
  INTO req
  FROM public.convinter_consent_requests
  WHERE ((from_user = me AND to_user = p_other_user)
      OR (from_user = p_other_user AND to_user = me))
    AND status = 'rejected'
  ORDER BY responded_at DESC NULLS LAST, created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', true,
      'state', 'rejected',
      'request_id', req.id,
      'consent_level', current_level,
      'requested_level', req.requested_level
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'state', 'none',
    'request_id', NULL,
    'consent_level', current_level
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_get_consent_state(uuid) TO authenticated;

CREATE OR REPLACE FUNCTION public.convinter_request_consent(
  p_to_user uuid,
  p_requested_level int DEFAULT 1
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  lvl int;
  a uuid;
  b uuid;
  rid bigint;
  current_level int := 0;
  req record;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  PERFORM public.convinter_guard('chat');
  PERFORM public.convinter_check_rate_limit('consent_request', 10, 86400);

  IF p_to_user IS NULL OR p_to_user = me THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_TARGET');
  END IF;

  PERFORM public.convinter_assert_not_blocked(p_to_user);

  lvl := CASE WHEN p_requested_level IN (1, 2) THEN p_requested_level ELSE 1 END;
  a := LEAST(me, p_to_user);
  b := GREATEST(me, p_to_user);

  SELECT COALESCE(consent_level, 0)
  INTO current_level
  FROM public.convinter_pair_consent
  WHERE user_a = a AND user_b = b;

  current_level := COALESCE(current_level, 0);

  IF current_level >= lvl THEN
    RETURN jsonb_build_object(
      'ok', true,
      'code', 'ALREADY_CONNECTED',
      'state', 'active',
      'consent_level', current_level
    );
  END IF;

  SELECT id, requested_level
  INTO req
  FROM public.convinter_consent_requests
  WHERE from_user = me
    AND to_user = p_to_user
    AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', true,
      'code', 'PENDING_OUTGOING',
      'state', 'outgoing_pending',
      'request_id', req.id,
      'requested_level', req.requested_level,
      'consent_level', current_level
    );
  END IF;

  SELECT id, requested_level
  INTO req
  FROM public.convinter_consent_requests
  WHERE from_user = p_to_user
    AND to_user = me
    AND status = 'pending'
  ORDER BY created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', true,
      'code', 'PENDING_INCOMING',
      'state', 'incoming_pending',
      'request_id', req.id,
      'requested_level', req.requested_level,
      'consent_level', current_level
    );
  END IF;

  SELECT id, requested_level
  INTO req
  FROM public.convinter_consent_requests
  WHERE ((from_user = me AND to_user = p_to_user)
      OR (from_user = p_to_user AND to_user = me))
    AND status = 'rejected'
  ORDER BY responded_at DESC NULLS LAST, created_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', true,
      'code', 'PREVIOUSLY_REJECTED',
      'state', 'rejected',
      'request_id', req.id,
      'requested_level', req.requested_level,
      'consent_level', current_level
    );
  END IF;

  INSERT INTO public.convinter_consent_requests(from_user, to_user, requested_level)
  VALUES (me, p_to_user, lvl)
  RETURNING id INTO rid;

  INSERT INTO public.convinter_pair_consent(user_a, user_b, consent_level)
  VALUES (a, b, 0)
  ON CONFLICT DO NOTHING;

  PERFORM public.convinter_notify(p_to_user, 'CONSENT_REQUEST_RECEIVED',
    jsonb_build_object('request_id', rid, 'from_user', me, 'requested_level', lvl)
  );

  RETURN jsonb_build_object(
    'ok', true,
    'state', 'outgoing_pending',
    'request_id', rid,
    'requested_level', lvl,
    'consent_level', 0
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_request_consent(uuid, int) TO authenticated;