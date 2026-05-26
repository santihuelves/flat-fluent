CREATE OR REPLACE FUNCTION public.convinter_invalidate_compat_cache_on_answer_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected_user uuid := COALESCE(NEW.user_id, OLD.user_id);
BEGIN
  IF affected_user IS NOT NULL THEN
    DELETE FROM public.convinter_compat_cache
    WHERE user_a = affected_user
       OR user_b = affected_user;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS convinter_answers_invalidate_compat_cache ON public.convinter_answers;

CREATE TRIGGER convinter_answers_invalidate_compat_cache
AFTER INSERT OR UPDATE OR DELETE ON public.convinter_answers
FOR EACH ROW
EXECUTE FUNCTION public.convinter_invalidate_compat_cache_on_answer_change();