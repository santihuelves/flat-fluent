-- =====================================================================
-- BLOQUE 27 - Test detallado con modelo S/N/G
-- =====================================================================

CREATE OR REPLACE FUNCTION public.convinter_test_question_kind(p_question_id text)
RETURNS text
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_question_id
    WHEN 'scenario_room_privacy'            THEN 'gate'
    WHEN 'scenario_partner_sleepover'       THEN 'gate'
    WHEN 'scenario_food_without_permission' THEN 'gate'
    WHEN 'scenario_smoking_balcony'         THEN 'gate'
    WHEN 'scenario_unplanned_visit'         THEN 'gate'
    WHEN 'scenario_cleaning_turn'           THEN 'signal'
    WHEN 'scenario_pet_in_common_area'      THEN 'signal'
    WHEN 'scenario_expenses_delay'          THEN 'signal'
    WHEN 'scenario_conflict_message'        THEN 'signal'
    WHEN 'scenario_remote_study'            THEN 'signal'
    WHEN 'scenario_kitchen_mess'            THEN 'signal'
    WHEN 'scenario_shared_order'            THEN 'signal'
    WHEN 'scenario_bathroom_peak'           THEN 'signal'
    WHEN 'scenario_late_call'               THEN 'style'
    WHEN 'scenario_social_energy'           THEN 'style'
    WHEN 'scenario_boundaries'              THEN 'style'
    ELSE 'style'
  END
$$;

CREATE OR REPLACE FUNCTION public.convinter_test_question_block(p_question_id text)
RETURNS text
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE p_question_id
    WHEN 'scenario_late_call'               THEN 'descanso'
    WHEN 'scenario_unplanned_visit'         THEN 'limites_personales'
    WHEN 'scenario_pet_in_common_area'      THEN 'responsabilidad_compartida'
    WHEN 'scenario_smoking_balcony'         THEN 'limites_personales'
    WHEN 'scenario_kitchen_mess'            THEN 'espacios_comunes'
    WHEN 'scenario_social_energy'           THEN 'flexibilidad'
    WHEN 'scenario_cleaning_turn'           THEN 'responsabilidad_compartida'
    WHEN 'scenario_shared_order'            THEN 'espacios_comunes'
    WHEN 'scenario_remote_study'            THEN 'comunicacion'
    WHEN 'scenario_expenses_delay'          THEN 'gestion_economica'
    WHEN 'scenario_conflict_message'        THEN 'comunicacion'
    WHEN 'scenario_boundaries'              THEN 'flexibilidad'
    WHEN 'scenario_bathroom_peak'           THEN 'espacios_comunes'
    WHEN 'scenario_partner_sleepover'       THEN 'privacidad'
    WHEN 'scenario_food_without_permission' THEN 'limites_personales'
    WHEN 'scenario_room_privacy'            THEN 'privacidad'
    ELSE 'otros'
  END
$$;

CREATE OR REPLACE FUNCTION public.convinter_test_question_weight(p_question_id text)
RETURNS numeric
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE public.convinter_test_question_kind(p_question_id)
    WHEN 'gate'   THEN 1.5
    WHEN 'signal' THEN 1.0
    WHEN 'style'  THEN 0.8
    ELSE 0.8
  END::numeric
$$;

GRANT EXECUTE ON FUNCTION public.convinter_test_question_kind(text)   TO authenticated;
GRANT EXECUTE ON FUNCTION public.convinter_test_question_block(text)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.convinter_test_question_weight(text) TO authenticated;


CREATE OR REPLACE FUNCTION public.convinter_test_answer_similarity(
  p_question_id text,
  p_a_value text,
  p_b_value text
) RETURNS numeric
LANGUAGE plpgsql IMMUTABLE
SET search_path = public
AS $$
DECLARE
  a_num float;
  b_num float;
  a_norm text;
  b_norm text;
  pair text;
BEGIN
  IF p_a_value IS NULL OR p_b_value IS NULL THEN
    RETURN 0;
  END IF;

  IF p_a_value ~ '^[0-9]+(\.[0-9]+)?$' AND p_b_value ~ '^[0-9]+(\.[0-9]+)?$' THEN
    a_num := p_a_value::float;
    b_num := p_b_value::float;
    RETURN greatest(0, 1 - abs(a_num - b_num) / 4.0)::numeric;
  END IF;

  a_norm := lower(trim(p_a_value));
  b_norm := lower(trim(p_b_value));

  IF a_norm = b_norm THEN
    RETURN 1;
  END IF;

  IF a_norm < b_norm THEN
    pair := a_norm || '|' || b_norm;
  ELSE
    pair := b_norm || '|' || a_norm;
  END IF;

  RETURN CASE pair
    WHEN 'clear_limit|system'             THEN 0.85
    WHEN 'occasional_flex|system'         THEN 0.80
    WHEN 'high_tolerance|occasional_flex' THEN 0.80
    WHEN 'clear_limit|occasional_flex'    THEN 0.50
    WHEN 'high_tolerance|system'          THEN 0.50
    WHEN 'clear_limit|high_tolerance'     THEN 0.15
    ELSE 0
  END::numeric;
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_test_answer_similarity(text,text,text) TO authenticated;


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
  scoring_model text := 'convinter_profile_v4+test_sng_v6';
  min_common_questions integer := 8;
  prof_jsonb jsonb;
  profile_score int;
  profile_signals int := 0;
  test_score int := NULL;
  raw_test_score int := NULL;
  common_n integer := 0;
  mismatches jsonb := '[]'::jsonb;
  oriented_mismatches jsonb := '[]'::jsonb;
  test_parts jsonb := '{}'::jsonb;
  test_gate_penalty int := 0;
  style_score numeric := NULL;  style_n int := 0;
  signal_score numeric := NULL; signal_n int := 0;
  gate_score numeric := NULL;   gate_n int := 0;
  weighted_total numeric := 0;
  weight_sum numeric := 0;
  final_score int;
  source_str text;
  test_available boolean;
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

  IF cache_hit AND cached.breakdown->>'scoring_model' = scoring_model THEN
    cached_common_n := CASE WHEN cached.breakdown->>'common_questions' ~ '^[0-9]+$'
      THEN (cached.breakdown->>'common_questions')::int ELSE 0 END;

    SELECT coalesce(jsonb_agg(
      CASE
        WHEN me = a THEN item
        ELSE jsonb_set(
          jsonb_set(item, '{a}', coalesce(item->'b','null'::jsonb), false),
          '{b}', coalesce(item->'a','null'::jsonb), false
        )
      END ORDER BY ord
    ), '[]'::jsonb)
    INTO oriented_mismatches
    FROM jsonb_array_elements(coalesce(cached.breakdown->'mismatches','[]'::jsonb)) WITH ORDINALITY AS mm(item, ord);

    RETURN jsonb_build_object(
      'ok', true,
      'cached', true,
      'can_show_score', true,
      'score', cached.score,
      'detail_level', lvl,
      'common_questions', cached_common_n,
      'breakdown', cached.breakdown || jsonb_build_object('mismatches', oriented_mismatches),
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

  WITH
  aa AS (SELECT question_id,
                coalesce(answer_value->>'value', trim(both '"' from answer_value::text)) AS v
         FROM public.convinter_answers
         WHERE user_id = a AND test_id = 'convinter_full'),
  bb AS (SELECT question_id,
                coalesce(answer_value->>'value', trim(both '"' from answer_value::text)) AS v
         FROM public.convinter_answers
         WHERE user_id = b AND test_id = 'convinter_full'),
  j AS (SELECT aa.question_id, aa.v AS a_v, bb.v AS b_v
        FROM aa JOIN bb USING (question_id)),
  s AS (SELECT question_id, a_v, b_v,
          public.convinter_test_answer_similarity(question_id, a_v, b_v) AS sim,
          public.convinter_test_question_kind(question_id)   AS kind,
          public.convinter_test_question_block(question_id)  AS block,
          public.convinter_test_question_weight(question_id) AS w
        FROM j),
  by_kind AS (
    SELECT kind,
           sum(sim * w) / NULLIF(sum(w),0) AS k_score,
           count(*) AS k_n
    FROM s GROUP BY kind
  ),
  mm AS (
    SELECT jsonb_agg(jsonb_build_object(
             'question_id', question_id, 'a', a_v, 'b', b_v,
             'sim', round(sim::numeric,3), 'kind', kind, 'block', block
           ) ORDER BY sim ASC, w DESC) AS items
    FROM (SELECT * FROM s ORDER BY sim ASC, w DESC LIMIT 8) t
  ),
  totals AS (SELECT count(*) AS cnt FROM s)
  SELECT
    coalesce(totals.cnt, 0),
    coalesce(mm.items, '[]'::jsonb),
    max(CASE WHEN by_kind.kind = 'style'  THEN by_kind.k_score END),
    coalesce(max(CASE WHEN by_kind.kind = 'style'  THEN by_kind.k_n END), 0),
    max(CASE WHEN by_kind.kind = 'signal' THEN by_kind.k_score END),
    coalesce(max(CASE WHEN by_kind.kind = 'signal' THEN by_kind.k_n END), 0),
    max(CASE WHEN by_kind.kind = 'gate'   THEN by_kind.k_score END),
    coalesce(max(CASE WHEN by_kind.kind = 'gate'   THEN by_kind.k_n END), 0)
  INTO common_n, mismatches,
       style_score, style_n,
       signal_score, signal_n,
       gate_score, gate_n
  FROM totals
  LEFT JOIN by_kind ON true
  LEFT JOIN mm ON true
  GROUP BY totals.cnt, mm.items;

  IF style_score IS NOT NULL THEN
    weighted_total := weighted_total + 0.35 * style_score;
    weight_sum := weight_sum + 0.35;
  END IF;
  IF signal_score IS NOT NULL THEN
    weighted_total := weighted_total + 0.40 * signal_score;
    weight_sum := weight_sum + 0.40;
  END IF;
  IF gate_score IS NOT NULL THEN
    weighted_total := weighted_total + 0.25 * gate_score;
    weight_sum := weight_sum + 0.25;
  END IF;

  IF weight_sum > 0 THEN
    raw_test_score := round(100 * weighted_total / weight_sum)::int;
  END IF;

  IF gate_score IS NOT NULL AND gate_score < 0.7 THEN
    test_gate_penalty := round((0.7 - gate_score) * (40.0 / 0.7))::int;
  END IF;

  IF raw_test_score IS NOT NULL THEN
    test_score := greatest(0, raw_test_score - test_gate_penalty);
  END IF;

  test_parts := jsonb_build_object(
    'style',   jsonb_build_object('score', round(coalesce(style_score, 0)::numeric, 3),  'count', style_n,  'has', style_score IS NOT NULL),
    'signals', jsonb_build_object('score', round(coalesce(signal_score,0)::numeric, 3),  'count', signal_n, 'has', signal_score IS NOT NULL),
    'gates',   jsonb_build_object('score', round(coalesce(gate_score,  0)::numeric, 3),  'count', gate_n,   'has', gate_score IS NOT NULL),
    'raw_test_score', raw_test_score,
    'weights', jsonb_build_object('style', 0.35, 'signals', 0.40, 'gates', 0.25)
  );

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
    RETURN jsonb_build_object(
      'ok', false, 'code', 'INSUFFICIENT_PROFILE_DATA',
      'can_show_score', false, 'common_questions', common_n,
      'profile_signals_used', profile_signals,
      'message', 'Aún no hay datos suficientes en los perfiles para calcular la compatibilidad.'
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
      'test_score', test_score,
      'test_parts', test_parts,
      'test_gate_penalty', test_gate_penalty,
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
      'test_score', test_score,
      'test_parts', test_parts,
      'test_gate_penalty', test_gate_penalty,
      'common_questions', common_n,
      'test_available', test_available,
      'mismatches', oriented_mismatches
    ),
    'computed_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_compute_and_cache_guarded(uuid,integer) TO authenticated;

DELETE FROM public.convinter_compat_cache
WHERE coalesce(breakdown->>'scoring_model','') <> 'convinter_profile_v4+test_sng_v6';

NOTIFY pgrst, 'reload schema';