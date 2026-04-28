-- =====================================================================
-- BLOQUE 1 — Flags de test rápido / exhaustivo
-- =====================================================================

ALTER TABLE public.convinter_profiles
  ADD COLUMN IF NOT EXISTS quick_test_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS quick_test_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS full_test_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS full_test_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS full_test_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS full_test_requested_by uuid;

CREATE OR REPLACE FUNCTION public.convinter_request_full_test(p_target uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := auth.uid();
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;
  IF p_target IS NULL OR p_target = me THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_TARGET');
  END IF;
  PERFORM public.convinter_assert_not_blocked(p_target);
  UPDATE public.convinter_profiles
     SET full_test_requested_at = now(),
         full_test_requested_by = me
   WHERE user_id = p_target;
  PERFORM public.convinter_notify(p_target, 'REQUEST_FULL_TEST', jsonb_build_object('from', me));
  RETURN jsonb_build_object('ok', true);
END; $$;

GRANT EXECUTE ON FUNCTION public.convinter_request_full_test(uuid) TO authenticated;
