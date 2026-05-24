-- Use the current advanced compatibility test while keeping legacy answers available.
-- Current compatibility test: convinter_full
-- Legacy fallback: convinter_v2

CREATE OR REPLACE FUNCTION public.convinter_compute_and_cache_guarded(
  p_other_user uuid,
  p_detail_level int DEFAULT 1
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  me uuid := auth.uid();
  a uuid;
  b uuid;
  lvl int;
  consent_lvl int := 0;
  cached record;
  score_num int := 0;
  common_n int := 0;
  mismatches jsonb := '[]'::jsonb;
BEGIN
  IF me IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED');
  END IF;

  PERFORM public.convinter_guard('view_detail');
  PERFORM public.convinter_check_rate_limit('compat_compute', 30, 86400);

  IF p_other_user IS NULL OR p_other_user = me THEN
    RETURN jsonb_build_object('ok', false, 'code', 'INVALID_TARGET');
  END IF;

  PERFORM public.convinter_assert_not_blocked(p_other_user);

  lvl := CASE WHEN p_detail_level IN (1,2) THEN p_detail_level ELSE 1 END;

  a := least(me, p_other_user);
  b := greatest(me, p_other_user);

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

  SELECT * INTO cached
  FROM public.convinter_compat_cache
  WHERE user_a=a AND user_b=b AND detail_level=lvl
    AND computed_at > now() - interval '7 days';

  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', true,
      'cached', true,
      'score', cached.score,
      'detail_level', lvl,
      'breakdown', cached.breakdown,
      'computed_at', cached.computed_at
    );
  END IF;

  WITH
  answer_source AS (
    SELECT CASE
      WHEN EXISTS (
        SELECT 1
        FROM public.convinter_answers me_answer
        JOIN public.convinter_answers other_answer
          ON other_answer.question_id = me_answer.question_id
        WHERE me_answer.user_id = me
          AND other_answer.user_id = p_other_user
          AND me_answer.test_id = 'convinter_full'
          AND other_answer.test_id = 'convinter_full'
      )
      THEN 'convinter_full'
      ELSE 'convinter_v2'
    END AS test_id
  ),
  aa AS (
    SELECT question_id,
           coalesce(answer_value->>'value', trim(both '"' from answer_value::text)) AS v
    FROM public.convinter_answers, answer_source
    WHERE user_id = me AND convinter_answers.test_id = answer_source.test_id
  ),
  bb AS (
    SELECT question_id,
           coalesce(answer_value->>'value', trim(both '"' from answer_value::text)) AS v
    FROM public.convinter_answers, answer_source
    WHERE user_id = p_other_user AND convinter_answers.test_id = answer_source.test_id
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
             ELSE CASE WHEN lower(coalesce(a_v,'')) = lower(coalesce(b_v,'')) THEN 1 ELSE 0 END
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
    coalesce(round(100 * coalesce(agg.avg_sim, 0))::int, 0),
    coalesce(mm.items, '[]'::jsonb)
  INTO common_n, score_num, mismatches
  FROM agg, mm;

  INSERT INTO public.convinter_compat_cache(user_a, user_b, detail_level, score, breakdown, computed_at)
  VALUES (
    a, b, lvl, score_num,
    jsonb_build_object(
      'common_questions', common_n,
      'mismatches', CASE WHEN lvl = 2 THEN mismatches ELSE '[]'::jsonb END
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
    'score', score_num,
    'detail_level', lvl,
    'breakdown', jsonb_build_object(
      'common_questions', common_n,
      'mismatches', CASE WHEN lvl = 2 THEN mismatches ELSE '[]'::jsonb END
    ),
    'computed_at', now()
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.convinter_compute_and_cache_guarded(uuid,int) TO authenticated;

DELETE FROM public.convinter_compat_cache;
