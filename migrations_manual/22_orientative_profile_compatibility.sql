-- =====================================================================
-- BLOQUE 22 - Compatibilidad orientativa basada solo en perfil
-- =====================================================================
-- Expone una RPC publica `convinter_compute_profile_compatibility(uuid)`
-- que devuelve el % orientativo calculado con `convinter_score_profile_pair`,
-- SIN requerir consentimiento ni match. Solo necesita autenticacion y que
-- ninguno haya bloqueado al otro. No cachea ni gasta rate-limit del flujo
-- detallado.

CREATE OR REPLACE FUNCTION public.convinter_compute_profile_compatibility(
  p_other_user uuid
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  prof jsonb;
  score_val int;
  signals int := 0;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  IF p_other_user IS NULL OR p_other_user = me THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_TARGET');
  END IF;

  -- Respetar bloqueos en ambos sentidos
  IF EXISTS (
    SELECT 1 FROM public.convinter_blocks
    WHERE (blocker_id = me AND blocked_id = p_other_user)
       OR (blocker_id = p_other_user AND blocked_id = me)
  ) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'USER_BLOCKED');
  END IF;

  prof := public.convinter_score_profile_pair(me, p_other_user);
  score_val := NULLIF(prof->>'score','')::int;
  signals := coalesce((prof->>'signals_used')::int, 0);

  IF score_val IS NULL THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'INSUFFICIENT_PROFILE_DATA',
      'can_show_score', false,
      'signals_used', signals,
      'source', 'profile_only',
      'message', 'Aun no hay datos suficientes en los perfiles para una compatibilidad orientativa.'
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'can_show_score', true,
    'score', score_val,
    'signals_used', signals,
    'source', 'profile_only',
    'breakdown', jsonb_build_object(
      'scoring_model', 'convinter_profile_orientative_v1',
      'source', 'profile_only',
      'profile_score', score_val,
      'profile_signals_used', signals,
      'parts', prof->'parts'
    ),
    'computed_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_compute_profile_compatibility(uuid) TO authenticated;

-- Forzar refresco del schema cache de PostgREST para que la RPC aparezca al instante.
NOTIFY pgrst, 'reload schema';
