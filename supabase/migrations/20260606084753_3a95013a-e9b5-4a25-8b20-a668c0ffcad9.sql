CREATE OR REPLACE FUNCTION public.convinter_test_answer_similarity(
  p_question_id text,
  p_a_value text,
  p_b_value text
) RETURNS numeric
LANGUAGE plpgsql
IMMUTABLE
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
    WHEN 'occasional_flex|system'         THEN 0.75
    WHEN 'high_tolerance|occasional_flex' THEN 0.8
    WHEN 'clear_limit|occasional_flex'    THEN 0.5
    WHEN 'high_tolerance|system'          THEN 0.45
    WHEN 'clear_limit|high_tolerance'     THEN 0.15
    ELSE 0
  END::numeric;
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_test_answer_similarity(text, text, text) TO authenticated;


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
  scoring_model text := 'convinter_profile_v3+test_similarity_v4';
  min_common_questions integer := 8;
  prof_jsonb jsonb;
  profile_score int;
  profile_signals int := 0;
  test_score int := NULL;
  common_n integer := 0;
  mismatches jsonb := '[]'::jsonb;
  oriented_mismatches jsonb := '[]'::jsonb;
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
  aa AS (SELECT question_id, coalesce(answer_value->>'value', trim(both '"' from answer_value::text)) AS v
         FROM public.convinter_answers WHERE user_id = a AND test_id = 'convinter_full'),
  bb AS (SELECT question_id, coalesce(answer_value->>'value', trim(both '"' from answer_value::text)) AS v
         FROM public.convinter_answers WHERE user_id = b AND test_id = 'convinter_full'),
  j AS (SELECT aa.question_id, aa.v AS a_v, bb.v AS b_v
        FROM aa JOIN bb USING (question_id)),
  s AS (SELECT question_id,
          public.convinter_test_answer_similarity(question_id, a_v, b_v) AS sim,
          a_v, b_v
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
WHERE coalesce(breakdown->>'scoring_model','') <> 'convinter_profile_v3+test_similarity_v4';
