-- Re-apply the detailed compatibility similarity model and invalidate scores
-- computed by older matchers. The active consent level now returns the
-- conversation points whenever there are enough shared full-test answers.
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
  scoring_model text := 'convinter_full_similarity_v2';
  score_num integer := 0;
  common_n integer := 0;
  min_common_questions integer := 8;
  mismatches jsonb := '[]'::jsonb;
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

  IF cache_hit THEN
    cached_common_n := CASE
      WHEN cached.breakdown->>'common_questions' ~ '^[0-9]+$'
        THEN (cached.breakdown->>'common_questions')::integer
      ELSE 0
    END;
  END IF;

  BEGIN
    PERFORM public.convinter_guard('view_detail');
    PERFORM public.convinter_assert_not_blocked(p_other_user);
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', CASE
        WHEN SQLERRM IN ('NOT_AUTHENTICATED', 'ACTION_RESTRICTED', 'USER_BLOCKED') THEN SQLERRM
        ELSE SQLSTATE
      END,
      'message', CASE SQLERRM
        WHEN 'NOT_AUTHENTICATED' THEN 'Necesitas iniciar sesion para ver esta compatibilidad.'
        WHEN 'ACTION_RESTRICTED' THEN 'Tu cuenta no puede ver esta compatibilidad ahora mismo.'
        WHEN 'USER_BLOCKED' THEN 'No puedes ver compatibilidad con este usuario.'
        ELSE SQLERRM
      END
    );
  END;

  SELECT consent_level INTO consent_lvl
  FROM public.convinter_pair_consent
  WHERE user_a = a AND user_b = b;
  consent_lvl := coalesce(consent_lvl, 0);

  IF consent_lvl < lvl THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', CASE WHEN consent_lvl = 0 THEN 'CONSENT_REQUIRED' ELSE 'CONSENT_UPGRADE_REQUIRED' END,
      'consent_level', consent_lvl,
      'required_level', lvl
    );
  END IF;

  IF cache_hit
    AND cached_common_n >= min_common_questions
    AND cached.breakdown->>'scoring_model' = scoring_model
  THEN
    RETURN jsonb_build_object(
      'ok', true,
      'cached', true,
      'can_show_score', true,
      'score', cached.score,
      'detail_level', lvl,
      'common_questions', cached_common_n,
      'breakdown', cached.breakdown,
      'computed_at', cached.computed_at
    );
  END IF;

  IF cache_hit THEN
    DELETE FROM public.convinter_compat_cache
    WHERE user_a = a AND user_b = b AND detail_level = lvl;
  END IF;

  BEGIN
    PERFORM public.convinter_check_rate_limit('compat_compute', 30, 86400);
  EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', CASE
        WHEN SQLERRM IN ('NOT_AUTHENTICATED', 'RATE_LIMIT_EXCEEDED') THEN SQLERRM
        ELSE SQLSTATE
      END,
      'message', CASE SQLERRM
        WHEN 'NOT_AUTHENTICATED' THEN 'Necesitas iniciar sesion para calcular compatibilidad.'
        WHEN 'RATE_LIMIT_EXCEEDED' THEN 'Has alcanzado el limite temporal de calculos de compatibilidad. Vuelve a intentarlo mas tarde.'
        ELSE SQLERRM
      END
    );
  END;

  WITH
  aa AS (
    SELECT question_id,
           coalesce(answer_value->>'value', trim(both '"' from answer_value::text)) AS v
    FROM public.convinter_answers
    WHERE user_id = me AND test_id = 'convinter_full'
  ),
  bb AS (
    SELECT question_id,
           coalesce(answer_value->>'value', trim(both '"' from answer_value::text)) AS v
    FROM public.convinter_answers
    WHERE user_id = p_other_user AND test_id = 'convinter_full'
  ),
  j AS (
    SELECT aa.question_id,
           aa.v AS a_v,
           bb.v AS b_v,
           CASE WHEN aa.v ~ '^[0-9]+(\.[0-9]+)?$' THEN aa.v::float ELSE NULL END AS a_num,
           CASE WHEN bb.v ~ '^[0-9]+(\.[0-9]+)?$' THEN bb.v::float ELSE NULL END AS b_num
    FROM aa JOIN bb USING (question_id)
  ),
  s AS (
    SELECT question_id,
           CASE
             WHEN a_num IS NOT NULL AND b_num IS NOT NULL THEN greatest(0, 1 - abs(a_num - b_num)/4.0)
             WHEN lower(coalesce(a_v,'')) = lower(coalesce(b_v,'')) THEN 1
             WHEN (
               (lower(coalesce(a_v,'')) = 'clear_limit' AND lower(coalesce(b_v,'')) = 'system') OR
               (lower(coalesce(a_v,'')) = 'system' AND lower(coalesce(b_v,'')) = 'clear_limit')
             ) THEN 0.85
             WHEN (
               (lower(coalesce(a_v,'')) = 'system' AND lower(coalesce(b_v,'')) = 'occasional_flex') OR
               (lower(coalesce(a_v,'')) = 'occasional_flex' AND lower(coalesce(b_v,'')) = 'system')
             ) THEN 0.75
             WHEN (
               (lower(coalesce(a_v,'')) = 'occasional_flex' AND lower(coalesce(b_v,'')) = 'high_tolerance') OR
               (lower(coalesce(a_v,'')) = 'high_tolerance' AND lower(coalesce(b_v,'')) = 'occasional_flex')
             ) THEN 0.8
             WHEN (
               (lower(coalesce(a_v,'')) = 'clear_limit' AND lower(coalesce(b_v,'')) = 'occasional_flex') OR
               (lower(coalesce(a_v,'')) = 'occasional_flex' AND lower(coalesce(b_v,'')) = 'clear_limit')
             ) THEN 0.5
             WHEN (
               (lower(coalesce(a_v,'')) = 'system' AND lower(coalesce(b_v,'')) = 'high_tolerance') OR
               (lower(coalesce(a_v,'')) = 'high_tolerance' AND lower(coalesce(b_v,'')) = 'system')
             ) THEN 0.45
             WHEN (
               (lower(coalesce(a_v,'')) = 'clear_limit' AND lower(coalesce(b_v,'')) = 'high_tolerance') OR
               (lower(coalesce(a_v,'')) = 'high_tolerance' AND lower(coalesce(b_v,'')) = 'clear_limit')
             ) THEN 0.15
             ELSE 0
           END AS sim,
           a_v, b_v
    FROM j
  ),
  agg AS (
    SELECT count(*) AS common_cnt, avg(sim) AS avg_sim FROM s
  ),
  mm AS (
    SELECT jsonb_agg(
      jsonb_build_object('question_id', question_id, 'a', a_v, 'b', b_v, 'sim', round(sim::numeric, 3))
      ORDER BY sim ASC
    ) AS items
    FROM (SELECT * FROM s ORDER BY sim ASC LIMIT 8) t
  )
  SELECT
    coalesce(agg.common_cnt, 0),
    coalesce(round(100 * coalesce(agg.avg_sim, 0))::integer, 0),
    coalesce(mm.items, '[]'::jsonb)
  INTO common_n, score_num, mismatches
  FROM agg, mm;

  IF common_n < min_common_questions THEN
    RETURN jsonb_build_object(
      'ok', false,
      'code', 'INSUFFICIENT_COMMON_ANSWERS',
      'score', NULL,
      'can_show_score', false,
      'common_questions', common_n,
      'required_common_questions', min_common_questions,
      'detail_level', lvl,
      'cached', false,
      'message', 'No hay suficientes respuestas comunes para calcular la compatibilidad detallada.'
    );
  END IF;

  INSERT INTO public.convinter_compat_cache(user_a, user_b, detail_level, score, breakdown, computed_at)
  VALUES (
    a, b, lvl, score_num,
    jsonb_build_object(
      'scoring_model', scoring_model,
      'common_questions', common_n,
      'mismatches', mismatches
    ),
    now()
  )
  ON CONFLICT (user_a, user_b, detail_level)
  DO UPDATE SET
    score = excluded.score,
    breakdown = excluded.breakdown,
    computed_at = excluded.computed_at;

  RETURN jsonb_build_object(
    'ok', true,
    'cached', false,
    'can_show_score', true,
    'score', score_num,
    'detail_level', lvl,
    'common_questions', common_n,
    'breakdown', jsonb_build_object(
      'scoring_model', scoring_model,
      'common_questions', common_n,
      'mismatches', mismatches
    ),
    'computed_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_compute_and_cache_guarded(uuid,integer) TO authenticated;

DELETE FROM public.convinter_compat_cache
WHERE breakdown->>'scoring_model' IS DISTINCT FROM 'convinter_full_similarity_v2'
   OR COALESCE(
        CASE
          WHEN breakdown->>'common_questions' ~ '^[0-9]+$'
            THEN (breakdown->>'common_questions')::integer
          ELSE 0
        END,
        0
      ) < 8;
