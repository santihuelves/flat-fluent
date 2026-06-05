
-- =====================================================================
-- BLOQUE 22 - Explicación de por qué el score no llega a 100%
-- =====================================================================
-- Cambios:
--  * convinter_score_profile_pair: añade objeto `explanation` con:
--      - coverage_pct, confidence_pct
--      - present_blocks: [{key,label,weight,score,lost_points}]
--      - missing_blocks: [{key,label,weight}]
--      - missing_fields_a / missing_fields_b: lista de campos pendientes
--      - dealbreaker_penalty_pts
--      - reasons: lista de strings legibles
--  * convinter_compute_and_cache_guarded: bump scoring_model a v3 y
--    propaga `profile_explanation` en el breakdown.

CREATE OR REPLACE FUNCTION public.convinter_score_profile_pair(
  a_user uuid,
  b_user uuid
) RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  cp_a record;
  cp_b record;
  bp_a record;
  bp_b record;
  ints_a jsonb;
  ints_b jsonb;
  lifestyle_score float := 0;  lifestyle_has boolean := false;
  intention_score float := 0;  intention_has boolean := false;
  location_score float := 0;   location_has  boolean := false;
  language_score float := 0;   language_has  boolean := false;
  budget_score   float := 0;   budget_has    boolean := false;
  dealbreak_pen  float := 0;   dealbreak_has boolean := false;
  signals_used int := 0;
  weighted_sum float := 0;
  weight_sum   float := 0;
  raw_score    float := 0;
  final_score  int := 0;
  confidence   float := 0;
  min_weight   constant float := 40;
  max_weight   constant float := 90;
  v_a text;
  langs_a text[];
  langs_b text[];
  inter_n int;
  union_n int;
  bmin_a int; bmax_a int; bmin_b int; bmax_b int;
  overlap_lo int; overlap_hi int;
  mins_a int; mins_b int;
  -- explanation
  present_blocks jsonb := '[]'::jsonb;
  missing_blocks jsonb := '[]'::jsonb;
  missing_a jsonb := '[]'::jsonb;
  missing_b jsonb := '[]'::jsonb;
  reasons jsonb := '[]'::jsonb;
  dealbreaker_pts int := 0;
  coverage_pct int := 0;
  confidence_pct int := 0;
  -- helpers para campos faltantes
  tags_a_all text[];
  tags_b_all text[];
BEGIN
  IF a_user IS NULL OR b_user IS NULL OR a_user = b_user THEN
    RETURN jsonb_build_object('score', NULL, 'signals_used', 0);
  END IF;

  SELECT * INTO cp_a FROM public.convinter_profiles WHERE user_id = a_user;
  SELECT * INTO cp_b FROM public.convinter_profiles WHERE user_id = b_user;
  SELECT * INTO bp_a FROM public.profiles WHERE id = a_user;
  SELECT * INTO bp_b FROM public.profiles WHERE id = b_user;

  SELECT coalesce(jsonb_agg(jsonb_build_object('t', intention_type, 'u', urgency)), '[]'::jsonb)
    INTO ints_a
    FROM public.convinter_profile_intentions WHERE profile_id = a_user AND active = true;
  SELECT coalesce(jsonb_agg(jsonb_build_object('t', intention_type, 'u', urgency)), '[]'::jsonb)
    INTO ints_b
    FROM public.convinter_profile_intentions WHERE profile_id = b_user AND active = true;

  -- (1) LIFESTYLE
  IF cp_a IS NOT NULL AND cp_b IS NOT NULL THEN
    DECLARE
      tags_a text[] := coalesce(bp_a.lifestyle_tags, ARRAY[]::text[]);
      tags_b text[] := coalesce(bp_b.lifestyle_tags, ARRAY[]::text[]);
      sub_score float := 0;
      sub_w float := 0;
    BEGIN
      FOR v_a IN SELECT unnest(ARRAY['trait_smoker_','trait_pet_','trait_household_','trait_minor_'])
      LOOP
        DECLARE
          ta text := (SELECT t FROM unnest(tags_a) t WHERE t LIKE v_a || '%' LIMIT 1);
          tb text := (SELECT t FROM unnest(tags_b) t WHERE t LIKE v_a || '%' LIMIT 1);
        BEGIN
          IF ta IS NOT NULL AND tb IS NOT NULL THEN
            sub_w := sub_w + 1;
            IF ta = tb THEN sub_score := sub_score + 1; END IF;
          END IF;
        END;
      END LOOP;

      DECLARE
        clean_a text[] := ARRAY(SELECT t FROM unnest(tags_a) t WHERE t NOT LIKE 'trait\_%' ESCAPE '\' AND t NOT LIKE 'auto\_%' ESCAPE '\');
        clean_b text[] := ARRAY(SELECT t FROM unnest(tags_b) t WHERE t NOT LIKE 'trait\_%' ESCAPE '\' AND t NOT LIKE 'auto\_%' ESCAPE '\');
        inter int; uni int;
      BEGIN
        IF array_length(clean_a, 1) IS NOT NULL AND array_length(clean_b, 1) IS NOT NULL THEN
          SELECT count(*) INTO inter FROM (SELECT unnest(clean_a) INTERSECT SELECT unnest(clean_b)) z;
          SELECT count(*) INTO uni   FROM (SELECT unnest(clean_a) UNION     SELECT unnest(clean_b)) z;
          IF uni > 0 THEN
            sub_w := sub_w + 1;
            sub_score := sub_score + (inter::float / uni::float);
          END IF;
        END IF;
      END;

      IF sub_w > 0 THEN
        lifestyle_score := sub_score / sub_w;
        lifestyle_has := true;
      END IF;
    END;
  END IF;

  -- (2) INTENCIONES
  IF jsonb_array_length(ints_a) > 0 AND jsonb_array_length(ints_b) > 0 THEN
    DECLARE
      best float := 0;
      ia jsonb; ib jsonb;
      ta text; tb text; ua text; ub text;
      pair_s float;
    BEGIN
      FOR ia IN SELECT jsonb_array_elements(ints_a) LOOP
        FOR ib IN SELECT jsonb_array_elements(ints_b) LOOP
          ta := ia->>'t'; tb := ib->>'t';
          ua := ia->>'u'; ub := ib->>'u';
          pair_s := CASE
            WHEN (ta='seek_room'    AND tb='offer_room')    THEN 1.0
            WHEN (ta='offer_room'   AND tb='seek_room')     THEN 1.0
            WHEN (ta='seek_flatmate' AND tb='seek_flatmate') THEN 0.9
            WHEN (ta='seek_room'    AND tb='seek_flatmate') THEN 0.6
            WHEN (ta='seek_flatmate' AND tb='seek_room')    THEN 0.6
            WHEN (ta='offer_room'   AND tb='seek_flatmate') THEN 0.6
            WHEN (ta='seek_flatmate' AND tb='offer_room')   THEN 0.6
            WHEN (ta='seek_room'    AND tb='seek_room')     THEN 0.2
            WHEN (ta='offer_room'   AND tb='offer_room')    THEN 0.2
            ELSE 0.0
          END;
          IF ua IS NOT NULL AND ub IS NOT NULL AND ua = ub THEN
            pair_s := least(1.0, pair_s + 0.05);
          END IF;
          IF pair_s > best THEN best := pair_s; END IF;
        END LOOP;
      END LOOP;
      intention_score := best;
      intention_has := true;
    END;
  END IF;

  -- (3) UBICACIÓN
  DECLARE
    city_a text := lower(coalesce(cp_a.city, bp_a.city, ''));
    city_b text := lower(coalesce(cp_b.city, bp_b.city, ''));
    prov_a text := lower(coalesce(cp_a.province_code, bp_a.province, ''));
    prov_b text := lower(coalesce(cp_b.province_code, bp_b.province, ''));
    auto_a text := lower(coalesce(bp_a.autonomous_community, ''));
    auto_b text := lower(coalesce(bp_b.autonomous_community, ''));
  BEGIN
    IF (city_a <> '' AND city_b <> '') OR (prov_a <> '' AND prov_b <> '') OR (auto_a <> '' AND auto_b <> '') THEN
      location_has := true;
      IF city_a <> '' AND city_a = city_b THEN location_score := 1.0;
      ELSIF prov_a <> '' AND prov_a = prov_b THEN location_score := 0.75;
      ELSIF auto_a <> '' AND auto_a = auto_b THEN location_score := 0.4;
      ELSE location_score := 0.1;
      END IF;
    END IF;
  END;

  -- (4) IDIOMAS
  langs_a := coalesce(cp_a.languages, bp_a.languages, ARRAY[]::text[]);
  langs_b := coalesce(cp_b.languages, bp_b.languages, ARRAY[]::text[]);
  IF array_length(langs_a, 1) IS NOT NULL AND array_length(langs_b, 1) IS NOT NULL THEN
    SELECT count(*) INTO inter_n FROM (SELECT unnest(langs_a) INTERSECT SELECT unnest(langs_b)) z;
    SELECT count(*) INTO union_n FROM (SELECT unnest(langs_a) UNION     SELECT unnest(langs_b)) z;
    IF union_n > 0 THEN
      language_has := true;
      language_score := inter_n::float / union_n::float;
    END IF;
  END IF;

  -- (5) PRESUPUESTO + estancia
  bmin_a := bp_a.budget_min; bmax_a := bp_a.budget_max;
  bmin_b := bp_b.budget_min; bmax_b := bp_b.budget_max;
  IF bmin_a IS NOT NULL AND bmax_a IS NOT NULL AND bmin_b IS NOT NULL AND bmax_b IS NOT NULL THEN
    overlap_lo := greatest(bmin_a, bmin_b);
    overlap_hi := least(bmax_a, bmax_b);
    budget_has := true;
    IF overlap_hi >= overlap_lo THEN
      DECLARE narrow int := least(bmax_a - bmin_a, bmax_b - bmin_b);
      BEGIN
        IF narrow <= 0 THEN budget_score := 1.0;
        ELSE budget_score := least(1.0, (overlap_hi - overlap_lo)::float / narrow::float);
        END IF;
      END;
    ELSE
      budget_score := 0.0;
    END IF;
  END IF;

  mins_a := bp_a.min_stay_months; mins_b := bp_b.min_stay_months;
  IF mins_a IS NOT NULL AND mins_b IS NOT NULL THEN
    budget_has := true;
    DECLARE stay_s float := greatest(0, 1 - abs(mins_a - mins_b)::float / 12.0);
    BEGIN
      IF budget_score = 0 AND (bmin_a IS NULL OR bmin_b IS NULL) THEN
        budget_score := stay_s;
      ELSE
        budget_score := 0.7 * budget_score + 0.3 * stay_s;
      END IF;
    END;
  END IF;

  -- (6) DEALBREAKERS
  DECLARE
    db_a text[] := coalesce(cp_a.dealbreakers, ARRAY[]::text[]);
    db_b text[] := coalesce(cp_b.dealbreakers, ARRAY[]::text[]);
    tags_a text[] := coalesce(bp_a.lifestyle_tags, ARRAY[]::text[]);
    tags_b text[] := coalesce(bp_b.lifestyle_tags, ARRAY[]::text[]);
    hits int := 0;
    db text;
  BEGIN
    IF array_length(db_a, 1) IS NOT NULL OR array_length(db_b, 1) IS NOT NULL THEN
      dealbreak_has := true;
      FOREACH db IN ARRAY db_a LOOP
        IF (db = 'no_smokers' AND 'trait_smoker_yes' = ANY (tags_b))
        OR (db = 'no_pets'    AND 'trait_pet_yes'    = ANY (tags_b))
        OR (db = 'no_minors'  AND 'trait_minor_yes'  = ANY (tags_b))
        THEN hits := hits + 1; END IF;
      END LOOP;
      FOREACH db IN ARRAY db_b LOOP
        IF (db = 'no_smokers' AND 'trait_smoker_yes' = ANY (tags_a))
        OR (db = 'no_pets'    AND 'trait_pet_yes'    = ANY (tags_a))
        OR (db = 'no_minors'  AND 'trait_minor_yes'  = ANY (tags_a))
        THEN hits := hits + 1; END IF;
      END LOOP;
      dealbreak_pen := least(1.0, hits * 0.5);
    END IF;
  END;

  -- Composición ponderada
  IF lifestyle_has THEN weighted_sum := weighted_sum + 30 * lifestyle_score; weight_sum := weight_sum + 30; signals_used := signals_used + 1; END IF;
  IF intention_has THEN weighted_sum := weighted_sum + 25 * intention_score; weight_sum := weight_sum + 25; signals_used := signals_used + 1; END IF;
  IF location_has  THEN weighted_sum := weighted_sum + 15 * location_score;  weight_sum := weight_sum + 15; signals_used := signals_used + 1; END IF;
  IF language_has  THEN weighted_sum := weighted_sum + 10 * language_score;  weight_sum := weight_sum + 10; signals_used := signals_used + 1; END IF;
  IF budget_has    THEN weighted_sum := weighted_sum + 10 * budget_score;    weight_sum := weight_sum + 10; signals_used := signals_used + 1; END IF;

  -- ----- EXPLICACIÓN: bloques presentes y faltantes -----
  -- Presentes
  IF lifestyle_has THEN
    present_blocks := present_blocks || jsonb_build_object('key','lifestyle','label','Hábitos de convivencia','weight',30,'score',round(lifestyle_score::numeric,3),'lost_points', round((30*(1-lifestyle_score))::numeric,1));
  ELSE
    missing_blocks := missing_blocks || jsonb_build_object('key','lifestyle','label','Hábitos de convivencia','weight',30);
  END IF;
  IF intention_has THEN
    present_blocks := present_blocks || jsonb_build_object('key','intentions','label','Objetivo de búsqueda','weight',25,'score',round(intention_score::numeric,3),'lost_points', round((25*(1-intention_score))::numeric,1));
  ELSE
    missing_blocks := missing_blocks || jsonb_build_object('key','intentions','label','Objetivo de búsqueda','weight',25);
  END IF;
  IF location_has THEN
    present_blocks := present_blocks || jsonb_build_object('key','location','label','Ubicación','weight',15,'score',round(location_score::numeric,3),'lost_points', round((15*(1-location_score))::numeric,1));
  ELSE
    missing_blocks := missing_blocks || jsonb_build_object('key','location','label','Ubicación','weight',15);
  END IF;
  IF language_has THEN
    present_blocks := present_blocks || jsonb_build_object('key','languages','label','Idiomas','weight',10,'score',round(language_score::numeric,3),'lost_points', round((10*(1-language_score))::numeric,1));
  ELSE
    missing_blocks := missing_blocks || jsonb_build_object('key','languages','label','Idiomas','weight',10);
  END IF;
  IF budget_has THEN
    present_blocks := present_blocks || jsonb_build_object('key','budget','label','Presupuesto y estancia','weight',10,'score',round(budget_score::numeric,3),'lost_points', round((10*(1-budget_score))::numeric,1));
  ELSE
    missing_blocks := missing_blocks || jsonb_build_object('key','budget','label','Presupuesto y estancia','weight',10);
  END IF;

  -- Campos faltantes por usuario
  tags_a_all := coalesce(bp_a.lifestyle_tags, ARRAY[]::text[]);
  tags_b_all := coalesce(bp_b.lifestyle_tags, ARRAY[]::text[]);

  IF coalesce(array_length(tags_a_all,1),0) = 0 THEN missing_a := missing_a || to_jsonb('Hábitos de convivencia (lifestyle)'::text); END IF;
  IF jsonb_array_length(ints_a) = 0 THEN missing_a := missing_a || to_jsonb('Objetivo de búsqueda (intenciones)'::text); END IF;
  IF coalesce(bp_a.city,'') = '' AND coalesce(cp_a.city,'') = '' THEN missing_a := missing_a || to_jsonb('Ciudad'::text); END IF;
  IF coalesce(array_length(langs_a,1),0) = 0 THEN missing_a := missing_a || to_jsonb('Idiomas'::text); END IF;
  IF bp_a.budget_min IS NULL OR bp_a.budget_max IS NULL THEN missing_a := missing_a || to_jsonb('Presupuesto'::text); END IF;
  IF bp_a.min_stay_months IS NULL THEN missing_a := missing_a || to_jsonb('Estancia mínima'::text); END IF;

  IF coalesce(array_length(tags_b_all,1),0) = 0 THEN missing_b := missing_b || to_jsonb('Hábitos de convivencia (lifestyle)'::text); END IF;
  IF jsonb_array_length(ints_b) = 0 THEN missing_b := missing_b || to_jsonb('Objetivo de búsqueda (intenciones)'::text); END IF;
  IF coalesce(bp_b.city,'') = '' AND coalesce(cp_b.city,'') = '' THEN missing_b := missing_b || to_jsonb('Ciudad'::text); END IF;
  IF coalesce(array_length(langs_b,1),0) = 0 THEN missing_b := missing_b || to_jsonb('Idiomas'::text); END IF;
  IF bp_b.budget_min IS NULL OR bp_b.budget_max IS NULL THEN missing_b := missing_b || to_jsonb('Presupuesto'::text); END IF;
  IF bp_b.min_stay_months IS NULL THEN missing_b := missing_b || to_jsonb('Estancia mínima'::text); END IF;

  coverage_pct := round(weight_sum / max_weight * 100)::int;

  -- Sin datos suficientes
  IF weight_sum < min_weight OR NOT (lifestyle_has OR intention_has) THEN
    RETURN jsonb_build_object(
      'score', NULL,
      'signals_used', signals_used,
      'weight_sum', weight_sum,
      'parts', jsonb_build_object(
        'lifestyle',  jsonb_build_object('has', lifestyle_has, 'score', round(lifestyle_score::numeric, 3)),
        'intentions', jsonb_build_object('has', intention_has, 'score', round(intention_score::numeric, 3)),
        'location',   jsonb_build_object('has', location_has,  'score', round(location_score::numeric, 3)),
        'languages',  jsonb_build_object('has', language_has,  'score', round(language_score::numeric, 3)),
        'budget',     jsonb_build_object('has', budget_has,    'score', round(budget_score::numeric, 3)),
        'dealbreakers', jsonb_build_object('has', dealbreak_has, 'penalty', round(dealbreak_pen::numeric, 3))
      ),
      'explanation', jsonb_build_object(
        'coverage_pct', coverage_pct,
        'max_weight', max_weight,
        'weight_used', weight_sum,
        'missing_weight', max_weight - weight_sum,
        'present_blocks', present_blocks,
        'missing_blocks', missing_blocks,
        'missing_fields_a', missing_a,
        'missing_fields_b', missing_b,
        'reason_no_score', CASE
          WHEN NOT (lifestyle_has OR intention_has) THEN 'Falta al menos un bloque fuerte (hábitos u objetivo) en uno de los perfiles.'
          ELSE 'Cobertura insuficiente: se necesita rellenar más campos clave en los perfiles.'
        END
      )
    );
  END IF;

  raw_score := weighted_sum / weight_sum * 100;
  confidence := 0.6 + 0.4 * least(1.0, weight_sum / max_weight);
  confidence_pct := round(confidence * 100)::int;
  final_score := round(raw_score * confidence)::int;

  IF dealbreak_has AND dealbreak_pen > 0 THEN
    dealbreaker_pts := round(dealbreak_pen * 40)::int;
    final_score := greatest(0, final_score - dealbreaker_pts);
  END IF;

  final_score := greatest(0, least(100, final_score));

  -- Razones legibles del por qué no llega a 100
  IF coverage_pct < 100 THEN
    reasons := reasons || to_jsonb(format('Cobertura del perfil %s%% (de 100%%). El factor de confianza aplicado es %s%%.', coverage_pct, confidence_pct)::text);
  END IF;
  IF jsonb_array_length(missing_blocks) > 0 THEN
    reasons := reasons || to_jsonb('Faltan bloques sin datos comunes que no suman al cálculo.'::text);
  END IF;
  IF dealbreaker_pts > 0 THEN
    reasons := reasons || to_jsonb(format('Penalización por dealbreakers: -%s puntos.', dealbreaker_pts)::text);
  END IF;
  IF lifestyle_has AND lifestyle_score < 1 THEN
    reasons := reasons || to_jsonb(format('Coincidencia en hábitos: %s%%.', round(lifestyle_score*100)::int)::text);
  END IF;
  IF intention_has AND intention_score < 1 THEN
    reasons := reasons || to_jsonb(format('Coincidencia en objetivos: %s%%.', round(intention_score*100)::int)::text);
  END IF;

  RETURN jsonb_build_object(
    'score', final_score,
    'raw_score', round(raw_score::numeric, 1),
    'confidence', round(confidence::numeric, 3),
    'signals_used', signals_used,
    'weight_sum', weight_sum,
    'parts', jsonb_build_object(
      'lifestyle',  jsonb_build_object('has', lifestyle_has, 'score', round(lifestyle_score::numeric, 3)),
      'intentions', jsonb_build_object('has', intention_has, 'score', round(intention_score::numeric, 3)),
      'location',   jsonb_build_object('has', location_has,  'score', round(location_score::numeric, 3)),
      'languages',  jsonb_build_object('has', language_has,  'score', round(language_score::numeric, 3)),
      'budget',     jsonb_build_object('has', budget_has,    'score', round(budget_score::numeric, 3)),
      'dealbreakers', jsonb_build_object('has', dealbreak_has, 'penalty', round(dealbreak_pen::numeric, 3))
    ),
    'explanation', jsonb_build_object(
      'coverage_pct', coverage_pct,
      'confidence_pct', confidence_pct,
      'max_weight', max_weight,
      'weight_used', weight_sum,
      'missing_weight', max_weight - weight_sum,
      'present_blocks', present_blocks,
      'missing_blocks', missing_blocks,
      'missing_fields_a', missing_a,
      'missing_fields_b', missing_b,
      'dealbreaker_penalty_pts', dealbreaker_pts,
      'raw_score', round(raw_score::numeric, 1),
      'final_score', final_score,
      'reasons', reasons
    )
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_score_profile_pair(uuid, uuid) TO authenticated;


-- Wrapper: bump scoring_model y propagar explanation
CREATE OR REPLACE FUNCTION public.convinter_compute_and_cache_guarded(
  p_other_user uuid,
  p_detail_level integer DEFAULT 1
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  a uuid;
  b uuid;
  lvl integer;
  consent_lvl integer := 0;
  cached record;
  cache_hit boolean := false;
  cached_common_n integer := 0;
  scoring_model text := 'convinter_profile_v3+test_v3';
  min_common_questions integer := 8;
  prof_jsonb jsonb;
  profile_score int;
  profile_signals int := 0;
  profile_explanation jsonb;
  test_score int := NULL;
  common_n integer := 0;
  mismatches jsonb := '[]'::jsonb;
  oriented_mismatches jsonb := '[]'::jsonb;
  final_score int;
  source_str text;
  test_available boolean;
  oriented_explanation jsonb;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  IF p_other_user IS NULL OR p_other_user = me THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_TARGET');
  END IF;

  lvl := CASE WHEN p_detail_level IN (1,2) THEN p_detail_level ELSE 1 END;
  a := least(me, p_other_user);
  b := greatest(me, p_other_user);

  SELECT * INTO cached
  FROM public.convinter_compat_cache
  WHERE user_a = a AND user_b = b AND detail_level = lvl
    AND computed_at > now() - interval '7 days';
  cache_hit := FOUND;

  BEGIN
    PERFORM public.convinter_guard('view_detail');
    PERFORM public.convinter_assert_not_blocked(p_other_user);
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', CASE WHEN SQLERRM IN ('NOT_AUTHENTICATED','ACTION_RESTRICTED','USER_BLOCKED') THEN SQLERRM ELSE SQLSTATE END
    );
  END;

  SELECT consent_level INTO consent_lvl
  FROM public.convinter_pair_consent WHERE user_a = a AND user_b = b;
  consent_lvl := coalesce(consent_lvl, 0);

  IF consent_lvl < lvl THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', CASE WHEN consent_lvl = 0 THEN 'CONSENT_REQUIRED' ELSE 'CONSENT_UPGRADE_REQUIRED' END,
      'consent_level', consent_lvl,
      'required_level', lvl
    );
  END IF;

  -- Helper: orientar missing_fields_a/_b al viewer (me = a → a/b igual; si no, swap)
  IF cache_hit AND cached.breakdown->>'scoring_model' = scoring_model THEN
    cached_common_n := CASE WHEN cached.breakdown->>'common_questions' ~ '^[0-9]+$'
      THEN (cached.breakdown->>'common_questions')::int ELSE 0 END;

    SELECT coalesce(jsonb_agg(
      CASE WHEN me = a THEN item
      ELSE jsonb_set(jsonb_set(item, '{a}', coalesce(item->'b','null'::jsonb), false),
                     '{b}', coalesce(item->'a','null'::jsonb), false)
      END ORDER BY ord), '[]'::jsonb)
    INTO oriented_mismatches
    FROM jsonb_array_elements(coalesce(cached.breakdown->'mismatches','[]'::jsonb)) WITH ORDINALITY AS mm(item, ord);

    -- Orient profile_explanation missing_fields per viewer
    oriented_explanation := cached.breakdown->'profile_explanation';
    IF oriented_explanation IS NOT NULL AND me <> a THEN
      oriented_explanation := jsonb_set(
        jsonb_set(oriented_explanation, '{missing_fields_a}', coalesce(cached.breakdown->'profile_explanation'->'missing_fields_b','[]'::jsonb), false),
        '{missing_fields_b}', coalesce(cached.breakdown->'profile_explanation'->'missing_fields_a','[]'::jsonb), false
      );
    END IF;

    RETURN jsonb_build_object(
      'ok', true, 'cached', true, 'can_show_score', true,
      'score', cached.score, 'detail_level', lvl,
      'common_questions', cached_common_n,
      'breakdown', cached.breakdown
        || jsonb_build_object('mismatches', oriented_mismatches)
        || jsonb_build_object('profile_explanation', oriented_explanation),
      'computed_at', cached.computed_at
    );
  END IF;

  IF cache_hit THEN
    DELETE FROM public.convinter_compat_cache WHERE user_a = a AND user_b = b AND detail_level = lvl;
  END IF;

  BEGIN
    PERFORM public.convinter_check_rate_limit('compat_compute', 30, 86400);
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('ok', false, 'code', SQLERRM);
  END;

  prof_jsonb := public.convinter_score_profile_pair(a, b);
  profile_score := NULLIF(prof_jsonb->>'score','')::int;
  profile_signals := coalesce((prof_jsonb->>'signals_used')::int, 0);
  profile_explanation := prof_jsonb->'explanation';

  WITH
  aa AS (SELECT question_id, coalesce(answer_value->>'value', trim(both '"' from answer_value::text)) AS v
         FROM public.convinter_answers WHERE user_id = a AND test_id = 'convinter_full'),
  bb AS (SELECT question_id, coalesce(answer_value->>'value', trim(both '"' from answer_value::text)) AS v
         FROM public.convinter_answers WHERE user_id = b AND test_id = 'convinter_full'),
  j AS (SELECT aa.question_id, aa.v AS a_v, bb.v AS b_v,
               CASE WHEN aa.v ~ '^[0-9]+(\.[0-9]+)?$' THEN aa.v::float ELSE NULL END AS a_num,
               CASE WHEN bb.v ~ '^[0-9]+(\.[0-9]+)?$' THEN bb.v::float ELSE NULL END AS b_num
        FROM aa JOIN bb USING (question_id)),
  s AS (SELECT question_id,
          CASE
            WHEN a_num IS NOT NULL AND b_num IS NOT NULL THEN greatest(0, 1 - abs(a_num - b_num)/4.0)
            WHEN lower(coalesce(a_v,'')) = lower(coalesce(b_v,'')) THEN 1
            ELSE 0
          END AS sim, a_v, b_v
        FROM j),
  agg AS (SELECT count(*) AS cnt, avg(sim) AS avg_sim FROM s),
  mm AS (SELECT jsonb_agg(jsonb_build_object('question_id', question_id, 'a', a_v, 'b', b_v, 'sim', round(sim::numeric,3)) ORDER BY sim ASC) AS items
         FROM (SELECT * FROM s ORDER BY sim ASC LIMIT 8) t)
  SELECT coalesce(agg.cnt,0), coalesce(round(100 * coalesce(agg.avg_sim,0))::int, 0), coalesce(mm.items,'[]'::jsonb)
  INTO common_n, test_score, mismatches
  FROM agg, mm;

  test_available := common_n >= min_common_questions;

  IF test_available AND profile_score IS NOT NULL THEN
    final_score := round(0.4 * profile_score + 0.6 * test_score)::int;
    source_str := 'profile+test';
  ELSIF test_available THEN
    final_score := test_score; source_str := 'test_only';
  ELSIF profile_score IS NOT NULL THEN
    final_score := profile_score; source_str := 'profile_only';
    test_score := NULL;
  ELSE
    -- Orient explanation for viewer
    oriented_explanation := profile_explanation;
    IF oriented_explanation IS NOT NULL AND me <> a THEN
      oriented_explanation := jsonb_set(
        jsonb_set(oriented_explanation, '{missing_fields_a}', coalesce(profile_explanation->'missing_fields_b','[]'::jsonb), false),
        '{missing_fields_b}', coalesce(profile_explanation->'missing_fields_a','[]'::jsonb), false
      );
    END IF;
    RETURN jsonb_build_object(
      'ok', false, 'code', 'INSUFFICIENT_PROFILE_DATA',
      'can_show_score', false, 'common_questions', common_n,
      'profile_signals_used', profile_signals,
      'profile_parts', prof_jsonb->'parts',
      'profile_explanation', oriented_explanation,
      'message', 'Aún faltan datos clave en uno de los perfiles (hábitos de convivencia u objetivo de búsqueda). Cuando esa persona los complete o cuando alguno de los dos haga el test exhaustivo, podréis ver un porcentaje fiable.'
    );
  END IF;

  INSERT INTO public.convinter_compat_cache(user_a, user_b, detail_level, score, breakdown, computed_at)
  VALUES (a, b, lvl, final_score,
    jsonb_build_object(
      'scoring_model', scoring_model,
      'source', source_str,
      'profile_score', profile_score,
      'profile_signals_used', profile_signals,
      'profile_parts', prof_jsonb->'parts',
      'profile_confidence', prof_jsonb->'confidence',
      'profile_weight_sum', prof_jsonb->'weight_sum',
      'profile_explanation', profile_explanation,
      'test_score', test_score,
      'common_questions', common_n,
      'test_available', test_available,
      'mismatches', mismatches
    ), now())
  ON CONFLICT (user_a, user_b, detail_level) DO UPDATE
    SET score = excluded.score, breakdown = excluded.breakdown, computed_at = excluded.computed_at;

  SELECT coalesce(jsonb_agg(
    CASE WHEN me = a THEN item
    ELSE jsonb_set(jsonb_set(item, '{a}', coalesce(item->'b','null'::jsonb), false),
                   '{b}', coalesce(item->'a','null'::jsonb), false)
    END ORDER BY ord), '[]'::jsonb)
  INTO oriented_mismatches
  FROM jsonb_array_elements(mismatches) WITH ORDINALITY AS mm(item, ord);

  -- Orient explanation for viewer
  oriented_explanation := profile_explanation;
  IF oriented_explanation IS NOT NULL AND me <> a THEN
    oriented_explanation := jsonb_set(
      jsonb_set(oriented_explanation, '{missing_fields_a}', coalesce(profile_explanation->'missing_fields_b','[]'::jsonb), false),
      '{missing_fields_b}', coalesce(profile_explanation->'missing_fields_a','[]'::jsonb), false
    );
  END IF;

  RETURN jsonb_build_object(
    'ok', true, 'cached', false, 'can_show_score', true,
    'score', final_score, 'detail_level', lvl,
    'common_questions', common_n,
    'breakdown', jsonb_build_object(
      'scoring_model', scoring_model,
      'source', source_str,
      'profile_score', profile_score,
      'profile_signals_used', profile_signals,
      'profile_parts', prof_jsonb->'parts',
      'profile_confidence', prof_jsonb->'confidence',
      'profile_weight_sum', prof_jsonb->'weight_sum',
      'profile_explanation', oriented_explanation,
      'test_score', test_score,
      'common_questions', common_n,
      'test_available', test_available,
      'mismatches', oriented_mismatches
    ),
    'computed_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_compute_and_cache_guarded(uuid,integer) TO authenticated;

-- Invalidar cachés del modelo anterior
DELETE FROM public.convinter_compat_cache
WHERE coalesce(breakdown->>'scoring_model','') <> 'convinter_profile_v3+test_v3';
