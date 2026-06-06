-- =====================================================================
-- BLOQUE 26 - Spread orientative profile score (affinity v3)
-- =====================================================================
-- Reemplaza `convinter_compute_profile_compatibility(uuid)` introduciendo
-- un bloque propio "traits_interests" de peso 25, calculado sobre los
-- tags de afinidad del perfil (interest_*, trait_* no-auto, inclusive_*).
-- Esto evita que perfiles distintos converjan en el mismo 45-46%.
-- Mantiene el cap orientativo y el modelo automatico por perfil visitado.

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
  legacy_score_val int;
  signals int := 0;
  orientative_cap int := 94;
  capped_reason text := NULL;

  tags_a text[];
  tags_b text[];
  aff_a text[];
  aff_b text[];
  inter_n int := 0;
  union_n int := 0;
  traits_score numeric := NULL;
  traits_has boolean := false;

  combined_score numeric;
  raw_score_val int;
  capped_score_val int;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  IF p_other_user IS NULL OR p_other_user = me THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_TARGET');
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.convinter_blocks
    WHERE (blocker_id = me AND blocked_id = p_other_user)
       OR (blocker_id = p_other_user AND blocked_id = me)
  ) THEN
    RETURN jsonb_build_object('ok', false, 'code', 'USER_BLOCKED');
  END IF;

  prof := public.convinter_score_profile_pair(me, p_other_user);
  legacy_score_val := NULLIF(prof->>'score','')::int;
  signals := coalesce((prof->>'signals_used')::int, 0);

  -- Bloque propio: rasgos / intereses (afinidad personal)
  SELECT coalesce(lifestyle_tags, ARRAY[]::text[]) INTO tags_a FROM public.profiles WHERE id = me;
  SELECT coalesce(lifestyle_tags, ARRAY[]::text[]) INTO tags_b FROM public.profiles WHERE id = p_other_user;

  SELECT array_agg(t) INTO aff_a FROM (
    SELECT DISTINCT unnest(tags_a) AS t
  ) s WHERE t LIKE 'interest_%' OR t LIKE 'inclusive_%' OR (t LIKE 'trait_%' AND t NOT LIKE 'auto_%');

  SELECT array_agg(t) INTO aff_b FROM (
    SELECT DISTINCT unnest(tags_b) AS t
  ) s WHERE t LIKE 'interest_%' OR t LIKE 'inclusive_%' OR (t LIKE 'trait_%' AND t NOT LIKE 'auto_%');

  aff_a := coalesce(aff_a, ARRAY[]::text[]);
  aff_b := coalesce(aff_b, ARRAY[]::text[]);

  IF array_length(aff_a, 1) IS NOT NULL OR array_length(aff_b, 1) IS NOT NULL THEN
    traits_has := true;
    SELECT count(*) INTO inter_n FROM (SELECT unnest(aff_a) INTERSECT SELECT unnest(aff_b)) i;
    SELECT count(*) INTO union_n FROM (SELECT unnest(aff_a) UNION SELECT unnest(aff_b)) u;
    IF union_n = 0 THEN
      traits_score := 0;
    ELSE
      -- Jaccard + suavizado para repartir mejor el rango (sqrt expande valores bajos)
      traits_score := round( (sqrt(inter_n::numeric / union_n::numeric)) * 100 );
    END IF;
  END IF;

  IF legacy_score_val IS NULL AND NOT traits_has THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'INSUFFICIENT_PROFILE_DATA',
      'can_show_score', false,
      'signals_used', signals,
      'source', 'profile_only',
      'message', 'Aun no hay datos suficientes en los perfiles para una compatibilidad orientativa.'
    );
  END IF;

  -- Combinacion ponderada: legacy peso 75, traits peso 25
  IF legacy_score_val IS NOT NULL AND traits_has THEN
    combined_score := (legacy_score_val::numeric * 75 + traits_score * 25) / 100;
    signals := signals + 1;
  ELSIF legacy_score_val IS NOT NULL THEN
    combined_score := legacy_score_val::numeric;
  ELSE
    combined_score := traits_score;
    signals := signals + 1;
  END IF;

  raw_score_val := round(combined_score)::int;

  IF raw_score_val > orientative_cap THEN
    capped_score_val := orientative_cap;
    capped_reason := 'Resultado orientativo limitado: el test completo puede confirmar o afinar el encaje.';
  ELSE
    capped_score_val := raw_score_val;
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'can_show_score', true,
    'score', capped_score_val,
    'raw_profile_score', raw_score_val,
    'legacy_profile_score', legacy_score_val,
    'signals_used', signals,
    'source', 'profile_only',
    'breakdown', jsonb_build_object(
      'scoring_model', 'convinter_profile_orientative_v3_affinity_spread',
      'source', 'profile_only',
      'orientative_cap', orientative_cap,
      'profile_score', raw_score_val,
      'legacy_profile_score', legacy_score_val,
      'capped_score', capped_score_val,
      'capped_reason', capped_reason,
      'profile_signals_used', signals,
      'parts', prof->'parts',
      'profile_parts', jsonb_build_object(
        'legacy', jsonb_build_object(
          'score', legacy_score_val,
          'weight', 75,
          'parts', prof->'parts'
        ),
        'traits_interests', jsonb_build_object(
          'score', traits_score,
          'weight', 25,
          'has_signal', traits_has,
          'intersection', inter_n,
          'union', union_n,
          'tags_a_count', coalesce(array_length(aff_a,1),0),
          'tags_b_count', coalesce(array_length(aff_b,1),0)
        )
      )
    ),
    'computed_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_compute_profile_compatibility(uuid) TO authenticated;

NOTIFY pgrst, 'reload schema';
