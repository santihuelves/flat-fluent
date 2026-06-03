-- =====================================================================
-- Reset de datos de producto para usuarioh
-- =====================================================================
-- Mantiene la cuenta de auth para poder iniciar sesion de nuevo.
-- Borra perfil, onboarding, intenciones, respuestas de test, anuncios,
-- consentimientos, compatibilidad, chats, mensajes y notificaciones
-- asociadas a usuarioh.
--
-- Ejecutar en Supabase SQL Editor / Lovable con permisos de editor.

BEGIN;

CREATE TEMP TABLE target_user ON COMMIT DROP AS
SELECT DISTINCT cp.user_id
FROM public.convinter_profiles cp
LEFT JOIN public.profiles p ON p.id = cp.user_id
LEFT JOIN auth.users au ON au.id = cp.user_id
WHERE lower(coalesce(cp.handle, '')) = 'usuarioh'
   OR lower(coalesce(cp.display_name, '')) = 'usuarioh'
   OR lower(coalesce(p.name, '')) = 'usuarioh'
   OR lower(coalesce(au.email, '')) LIKE 'usuarioh%';

DO $$
DECLARE
  target_count integer;
BEGIN
  SELECT count(*) INTO target_count FROM target_user;

  IF target_count = 0 THEN
    RAISE EXCEPTION 'No se encontro usuarioh. No se ha borrado nada.';
  END IF;

  IF target_count > 1 THEN
    RAISE EXCEPTION 'Hay mas de un usuario coincidente con usuarioh. No se ha borrado nada.';
  END IF;
END $$;

CREATE TEMP TABLE target_listings ON COMMIT DROP AS
SELECT id
FROM public.convinter_listings
WHERE owner_id IN (SELECT user_id FROM target_user);

CREATE TEMP TABLE target_chats ON COMMIT DROP AS
SELECT id
FROM public.convinter_chats
WHERE user_a IN (SELECT user_id FROM target_user)
   OR user_b IN (SELECT user_id FROM target_user);

DELETE FROM public.convinter_messages
WHERE chat_id IN (SELECT id FROM target_chats)
   OR sender_id IN (SELECT user_id FROM target_user);

DELETE FROM public.convinter_chat_reads
WHERE chat_id IN (SELECT id FROM target_chats)
   OR user_id IN (SELECT user_id FROM target_user);

DELETE FROM public.convinter_chats
WHERE id IN (SELECT id FROM target_chats);

DELETE FROM public.convinter_notifications
WHERE user_id IN (SELECT user_id FROM target_user);

DELETE FROM public.convinter_consent_requests
WHERE from_user IN (SELECT user_id FROM target_user)
   OR to_user IN (SELECT user_id FROM target_user);

DELETE FROM public.convinter_pair_consent
WHERE user_a IN (SELECT user_id FROM target_user)
   OR user_b IN (SELECT user_id FROM target_user);

DELETE FROM public.convinter_compat_cache
WHERE user_a IN (SELECT user_id FROM target_user)
   OR user_b IN (SELECT user_id FROM target_user);

DELETE FROM public.convinter_answers
WHERE user_id IN (SELECT user_id FROM target_user);

DELETE FROM public.convinter_profile_intentions
WHERE profile_id IN (SELECT user_id FROM target_user);

DELETE FROM public.convinter_listing_verification_requests
WHERE user_id IN (SELECT user_id FROM target_user)
   OR listing_id IN (SELECT id FROM target_listings);

DELETE FROM public.convinter_verification_requests
WHERE user_id IN (SELECT user_id FROM target_user);

DELETE FROM public.convinter_reports
WHERE reporter_id IN (SELECT user_id FROM target_user)
   OR target_user_id IN (SELECT user_id FROM target_user)
   OR target_listing_id IN (SELECT id FROM target_listings);

DELETE FROM public.convinter_blocks
WHERE blocker_id IN (SELECT user_id FROM target_user)
   OR blocked_id IN (SELECT user_id FROM target_user);

DELETE FROM public.convinter_rate_limits
WHERE user_id IN (SELECT user_id FROM target_user);

DELETE FROM public.convinter_user_restrictions
WHERE user_id IN (SELECT user_id FROM target_user);

DELETE FROM public.convinter_listings
WHERE id IN (SELECT id FROM target_listings);

DELETE FROM public.convinter_profiles
WHERE user_id IN (SELECT user_id FROM target_user);

DELETE FROM public.profiles
WHERE id IN (SELECT user_id FROM target_user);

COMMIT;

-- Verificacion:
-- SELECT * FROM public.convinter_profiles WHERE lower(handle) = 'usuarioh';
-- SELECT * FROM public.profiles WHERE lower(name) = 'usuarioh';
