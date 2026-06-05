-- Allow a user to cancel their own pending compatibility request.
-- This is intentionally different from rejection: the receiver has not responded,
-- and the sender can request compatibility again later.
ALTER TYPE public.convinter_consent_status ADD VALUE IF NOT EXISTS 'cancelled';

CREATE OR REPLACE FUNCTION public.convinter_cancel_consent_request(
  p_request_id bigint
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  r record;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  SELECT * INTO r
  FROM public.convinter_consent_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'code', 'REQUEST_NOT_FOUND');
  END IF;

  IF r.from_user <> me THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_ALLOWED');
  END IF;

  IF r.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_PENDING', 'status', r.status);
  END IF;

  UPDATE public.convinter_consent_requests
  SET status = 'cancelled', responded_at = now()
  WHERE id = p_request_id;

  UPDATE public.convinter_notifications
  SET read_at = COALESCE(read_at, now())
  WHERE user_id = r.to_user
    AND notification_type = 'CONSENT_REQUEST_RECEIVED'
    AND payload->>'request_id' = p_request_id::text;

  RETURN jsonb_build_object('ok', true, 'cancelled', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_cancel_consent_request(bigint) TO authenticated;