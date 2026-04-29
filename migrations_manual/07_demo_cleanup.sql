-- =====================================================================
-- BLOQUE DEMO 7 - Limpieza completa de datos ficticios
-- =====================================================================
-- Ejecutar antes de produccion para dejar fuera el paquete demo.
-- Borra SOLO usuarios y datos con ids/emails/handles/titulos demo.

BEGIN;

CREATE TEMP TABLE covinter_demo_seed_ids ON COMMIT DROP AS
SELECT ('00000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid AS user_id
FROM generate_series(1, 32) AS gs(n);

DELETE FROM public.convinter_messages
 WHERE chat_id IN (
   '00000000-0000-4002-8000-000000000001',
   '00000000-0000-4002-8000-000000000002',
   '00000000-0000-4002-8000-000000000003'
 )
    OR body LIKE '[DEMO]%';

DELETE FROM public.convinter_chats
 WHERE id IN (
   '00000000-0000-4002-8000-000000000001',
   '00000000-0000-4002-8000-000000000002',
   '00000000-0000-4002-8000-000000000003'
 )
    OR user_a IN (SELECT user_id FROM covinter_demo_seed_ids)
    OR user_b IN (SELECT user_id FROM covinter_demo_seed_ids);

DELETE FROM public.convinter_notifications
 WHERE user_id IN (SELECT user_id FROM covinter_demo_seed_ids)
    OR notification_type LIKE 'DEMO_%';

DELETE FROM public.convinter_pair_consent
 WHERE user_a IN (SELECT user_id FROM covinter_demo_seed_ids)
    OR user_b IN (SELECT user_id FROM covinter_demo_seed_ids);

DELETE FROM public.convinter_compat_cache
 WHERE user_a IN (SELECT user_id FROM covinter_demo_seed_ids)
    OR user_b IN (SELECT user_id FROM covinter_demo_seed_ids)
    OR breakdown->>'demo_seed' = 'true';

DELETE FROM public.convinter_answers
 WHERE user_id IN (SELECT user_id FROM covinter_demo_seed_ids);

DELETE FROM public.convinter_profile_intentions
 WHERE profile_id IN (SELECT user_id FROM covinter_demo_seed_ids)
    OR details->>'demo_seed' = 'true';

DELETE FROM public.convinter_listings
 WHERE owner_id IN (SELECT user_id FROM covinter_demo_seed_ids)
    OR title LIKE '[DEMO]%';

DELETE FROM public.convinter_profiles
 WHERE user_id IN (SELECT user_id FROM covinter_demo_seed_ids)
    OR handle LIKE 'demo_%';

DELETE FROM public.profiles
 WHERE id IN (SELECT user_id FROM covinter_demo_seed_ids);

DELETE FROM auth.identities
 WHERE user_id IN (SELECT user_id FROM covinter_demo_seed_ids);

DELETE FROM auth.users
 WHERE id IN (SELECT user_id FROM covinter_demo_seed_ids)
    OR email LIKE 'demo.%@covinter.test'
    OR email LIKE 'demo.user%@covinter.test';

COMMIT;

-- Verificacion rapida:
-- SELECT count(*) FROM auth.users WHERE email LIKE 'demo.%@covinter.test' OR email LIKE 'demo.user%@covinter.test';
-- SELECT count(*) FROM public.convinter_listings WHERE title LIKE '[DEMO]%';
