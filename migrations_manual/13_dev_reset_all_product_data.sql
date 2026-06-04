-- =====================================================================
-- Reset DEV: vaciar datos de producto de Convinter
-- =====================================================================
-- Uso previsto:
-- - Solo para entorno de pruebas/desarrollo.
-- - Deja vacias las tablas principales de perfiles y anuncios.
-- - Borra tambien datos relacionados que ensucian pruebas manuales:
--   mensajes, chats, consentimientos, compatibilidad, respuestas de test,
--   intenciones, bloqueos, reportes, verificaciones, notificaciones, etc.
--
-- Importante:
-- - NO borra usuarios de auth.users por defecto.
-- - Si quieres borrar tambien cuentas de autenticacion, usa el bloque
--   opcional comentado al final desde Supabase, con mucha precaucion.
-- - No ejecutar en produccion.

BEGIN;

-- Dependencias directas de anuncios, chats y perfiles.
TRUNCATE TABLE
  public.convinter_messages,
  public.convinter_chat_reads,
  public.convinter_chats,
  public.convinter_notifications,
  public.convinter_consent_requests,
  public.convinter_pair_consent,
  public.convinter_compat_cache,
  public.convinter_answers,
  public.convinter_profile_intentions,
  public.convinter_listing_verification_requests,
  public.convinter_verification_requests,
  public.convinter_reports,
  public.convinter_blocks,
  public.convinter_rate_limits,
  public.convinter_user_restrictions,
  public.convinter_deletion_queue,
  public.convinter_listings,
  public.convinter_profiles,
  public.profiles
RESTART IDENTITY CASCADE;

COMMIT;

-- =====================================================================
-- Verificacion rapida despues de ejecutar
-- =====================================================================
SELECT 'convinter_profiles' AS table_name, count(*) AS rows FROM public.convinter_profiles
UNION ALL SELECT 'profiles', count(*) FROM public.profiles
UNION ALL SELECT 'convinter_listings', count(*) FROM public.convinter_listings
UNION ALL SELECT 'convinter_profile_intentions', count(*) FROM public.convinter_profile_intentions
UNION ALL SELECT 'convinter_answers', count(*) FROM public.convinter_answers
UNION ALL SELECT 'convinter_compat_cache', count(*) FROM public.convinter_compat_cache
UNION ALL SELECT 'convinter_consent_requests', count(*) FROM public.convinter_consent_requests
UNION ALL SELECT 'convinter_chats', count(*) FROM public.convinter_chats
UNION ALL SELECT 'convinter_messages', count(*) FROM public.convinter_messages
ORDER BY table_name;

-- =====================================================================
-- OPCIONAL: borrar tambien usuarios de autenticacion
-- =====================================================================
-- Ejecutar SOLO si quieres que Supabase Authentication quede tambien vacio.
-- Ojo: esto elimina las cuentas. Si prefieres probar con cuentas nuevas,
-- puedes borrarlas manualmente desde Authentication > Users en Supabase.
--
-- BEGIN;
-- DELETE FROM auth.identities;
-- DELETE FROM auth.users;
-- COMMIT;
--
-- Verificacion auth opcional:
-- SELECT count(*) AS auth_users FROM auth.users;
