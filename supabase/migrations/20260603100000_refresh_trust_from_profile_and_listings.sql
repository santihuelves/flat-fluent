-- Recalcula confianza cuando cambian perfil, tests o anuncios.
-- Evita que usuarios con perfil/anuncio completos se queden en 0/100.

CREATE OR REPLACE FUNCTION public.convinter_calc_trust_score(p_user uuid)
RETURNS int
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  score int := 0;
  p record;
  answer_count int := 0;
  active_listing_count int := 0;
  complete_listing_count int := 0;
  verified_listing_count int := 0;
BEGIN
  SELECT * INTO p FROM public.convinter_profiles WHERE user_id = p_user;
  IF NOT FOUND THEN
    RETURN 0;
  END IF;

  -- Perfil personal visible.
  IF nullif(trim(coalesce(p.display_name, p.handle, '')), '') IS NOT NULL THEN
    score := score + 5;
  END IF;

  IF nullif(trim(coalesce(p.bio, '')), '') IS NOT NULL AND length(trim(p.bio)) > 20 THEN
    score := score + 10;
  END IF;

  IF nullif(trim(coalesce(p.photo_url, '')), '') IS NOT NULL THEN
    score := score + 10;
  END IF;

  IF array_length(p.languages, 1) > 0 THEN
    score := score + 5;
  END IF;

  -- Verificacion fuerte de persona.
  IF coalesce(p.selfie_verified, false) THEN
    score := score + 30;
  END IF;

  -- Test de compatibilidad: cuenta respuestas, con tope.
  SELECT count(DISTINCT question_id)
    INTO answer_count
  FROM public.convinter_answers
  WHERE user_id = p_user;

  score := score + least(answer_count * 2, 30);

  -- Actividad de producto: tener anuncio activo tambien aporta confianza,
  -- sin sustituir a una verificacion real.
  SELECT
    count(*) FILTER (WHERE coalesce(status, 'active') = 'active'),
    count(*) FILTER (
      WHERE coalesce(status, 'active') = 'active'
        AND nullif(trim(coalesce(title, '')), '') IS NOT NULL
        AND nullif(trim(coalesce(description, '')), '') IS NOT NULL
        AND nullif(trim(coalesce(city, '')), '') IS NOT NULL
        AND price_monthly IS NOT NULL
    ),
    count(*) FILTER (
      WHERE coalesce(status, 'active') = 'active'
        AND coalesce(listing_verified, false)
    )
    INTO active_listing_count, complete_listing_count, verified_listing_count
  FROM public.convinter_listings
  WHERE owner_id = p_user;

  IF active_listing_count > 0 THEN
    score := score + 10;
  END IF;

  IF complete_listing_count > 0 THEN
    score := score + 5;
  END IF;

  IF verified_listing_count > 0 THEN
    score := score + 10;
  END IF;

  RETURN least(score, 100);
END;
$$;

CREATE OR REPLACE FUNCTION public.convinter_refresh_trust_score(p_user uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_score int;
  new_badge public.convinter_trust_badge;
BEGIN
  IF p_user IS NULL THEN
    RETURN;
  END IF;

  new_score := public.convinter_calc_trust_score(p_user);

  new_badge := CASE
    WHEN new_score >= 80 THEN 'gold'::public.convinter_trust_badge
    WHEN new_score >= 60 THEN 'silver'::public.convinter_trust_badge
    WHEN new_score >= 40 THEN 'bronze'::public.convinter_trust_badge
    ELSE 'none'::public.convinter_trust_badge
  END;

  UPDATE public.convinter_profiles
  SET trust_score = new_score,
      trust_badge = new_badge,
      updated_at = now()
  WHERE user_id = p_user;
END;
$$;

CREATE OR REPLACE FUNCTION public.convinter_after_answers_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.convinter_refresh_trust_score(coalesce(new.user_id, old.user_id));

  IF tg_op = 'DELETE' THEN
    RETURN old;
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS convinter_answers_refresh_trust_ins ON public.convinter_answers;
CREATE TRIGGER convinter_answers_refresh_trust_ins
AFTER INSERT ON public.convinter_answers
FOR EACH ROW EXECUTE FUNCTION public.convinter_after_answers_change();

DROP TRIGGER IF EXISTS convinter_answers_refresh_trust_upd ON public.convinter_answers;
CREATE TRIGGER convinter_answers_refresh_trust_upd
AFTER UPDATE ON public.convinter_answers
FOR EACH ROW EXECUTE FUNCTION public.convinter_after_answers_change();

DROP TRIGGER IF EXISTS convinter_answers_refresh_trust_del ON public.convinter_answers;
CREATE TRIGGER convinter_answers_refresh_trust_del
AFTER DELETE ON public.convinter_answers
FOR EACH ROW EXECUTE FUNCTION public.convinter_after_answers_change();

CREATE OR REPLACE FUNCTION public.convinter_after_profile_trust_fields_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.convinter_refresh_trust_score(new.user_id);
  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS convinter_profiles_refresh_trust_fields ON public.convinter_profiles;
CREATE TRIGGER convinter_profiles_refresh_trust_fields
AFTER INSERT OR UPDATE OF display_name, handle, bio, photo_url, languages, selfie_verified
ON public.convinter_profiles
FOR EACH ROW EXECUTE FUNCTION public.convinter_after_profile_trust_fields_change();

CREATE OR REPLACE FUNCTION public.convinter_after_listing_trust_fields_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.convinter_refresh_trust_score(coalesce(new.owner_id, old.owner_id));

  IF tg_op = 'UPDATE' AND old.owner_id IS DISTINCT FROM new.owner_id THEN
    PERFORM public.convinter_refresh_trust_score(old.owner_id);
  END IF;

  IF tg_op = 'DELETE' THEN
    RETURN old;
  END IF;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS convinter_listings_refresh_owner_trust_ins ON public.convinter_listings;
CREATE TRIGGER convinter_listings_refresh_owner_trust_ins
AFTER INSERT ON public.convinter_listings
FOR EACH ROW EXECUTE FUNCTION public.convinter_after_listing_trust_fields_change();

DROP TRIGGER IF EXISTS convinter_listings_refresh_owner_trust_upd ON public.convinter_listings;
CREATE TRIGGER convinter_listings_refresh_owner_trust_upd
AFTER UPDATE OF owner_id, status, title, description, city, price_monthly, thumbnail_url, listing_verified
ON public.convinter_listings
FOR EACH ROW EXECUTE FUNCTION public.convinter_after_listing_trust_fields_change();

DROP TRIGGER IF EXISTS convinter_listings_refresh_owner_trust_del ON public.convinter_listings;
CREATE TRIGGER convinter_listings_refresh_owner_trust_del
AFTER DELETE ON public.convinter_listings
FOR EACH ROW EXECUTE FUNCTION public.convinter_after_listing_trust_fields_change();

-- Recalculo inmediato para todos los perfiles existentes.
WITH recalculated AS (
  SELECT
    user_id,
    public.convinter_calc_trust_score(user_id) AS score
  FROM public.convinter_profiles
)
UPDATE public.convinter_profiles p
SET trust_score = r.score,
    trust_badge = CASE
      WHEN r.score >= 80 THEN 'gold'::public.convinter_trust_badge
      WHEN r.score >= 60 THEN 'silver'::public.convinter_trust_badge
      WHEN r.score >= 40 THEN 'bronze'::public.convinter_trust_badge
      ELSE 'none'::public.convinter_trust_badge
    END,
    updated_at = now()
FROM recalculated r
WHERE p.user_id = r.user_id;
