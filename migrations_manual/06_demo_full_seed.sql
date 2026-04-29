-- =====================================================================
-- BLOQUE DEMO 6 - Datos ficticios completos para pruebas manuales
-- =====================================================================
-- Uso recomendado:
-- 1) Aplicar SOLO en entorno de desarrollo/Lovable preview.
-- 2) Ejecutar desde la tool de migraciones de Lovable Cloud.
-- 3) Antes de produccion, ejecutar 07_demo_cleanup.sql.
--
-- Usuarios principales:
-- - demo.busca@covinter.test / Test1234!
-- - demo.ofrece@covinter.test / Test1234!
--
-- Todos los usuarios demo usan password: Test1234!
--
-- Este seed inserta auth.users porque el esquema actual tiene claves
-- foraneas desde perfiles, anuncios, chats y mensajes hacia auth.users.
-- Es intencional para demo, reversible, y no debe formar parte de prod.

BEGIN;

CREATE TEMP TABLE covinter_demo_seed_users ON COMMIT DROP AS
WITH raw AS (
  SELECT
    n,
    ('00000000-0000-4000-8000-' || lpad(n::text, 12, '0'))::uuid AS user_id,
    CASE
      WHEN n = 1 THEN 'demo.busca@covinter.test'
      WHEN n = 2 THEN 'demo.ofrece@covinter.test'
      ELSE 'demo.user' || lpad(n::text, 2, '0') || '@covinter.test'
    END AS email,
    (ARRAY[
      'Santi Demo Busca','Santi Demo Ofrece','Lucia Rivas','Marco Vidal',
      'Nora Campos','Diego Navarro','Claudia Leon','Iker Molina',
      'Paula Santos','Hugo Ortega','Alba Marin','Mateo Ferrer',
      'Irene Soler','Lucas Romero','Elena Pardo','Adrian Vega',
      'Celia Fuentes','Javier Costa','Sara Montes','Pablo Luna',
      'Marta Prieto','Bruno Cano','Aitana Gil','Leo Torres',
      'Vera Rubio','Dario Medina','Noa Cabrera','Gael Serrano',
      'Ines Lozano','Teo Aguilar','Eva Pastor','Joel Benitez'
    ])[n] AS display_name,
    'demo_' || (ARRAY[
      'busca','ofrece','lucia','marco','nora','diego','claudia','iker',
      'paula','hugo','alba','mateo','irene','lucas','elena','adrian',
      'celia','javier','sara','pablo','marta','bruno','aitana','leo',
      'vera','dario','noa','gael','ines','teo','eva','joel'
    ])[n] AS handle,
    (ARRAY[
      'Madrid','Madrid','Barcelona','Madrid','Valencia','Madrid','Sevilla','Barcelona',
      'Madrid','Malaga','Valencia','Madrid','Barcelona','Sevilla','Madrid','Valencia',
      'Madrid','Barcelona','Malaga','Madrid','Sevilla','Valencia','Madrid','Barcelona',
      'Madrid','Valencia','Sevilla','Madrid','Barcelona','Malaga','Madrid','Valencia'
    ])[n] AS city,
    (ARRAY[
      'M','M','B','M','V','M','SE','B','M','MA','V','M','B','SE','M','V',
      'M','B','MA','M','SE','V','M','B','M','V','SE','M','B','MA','M','V'
    ])[n] AS province_code,
    CASE WHEN n % 2 = 0 THEN 'offer_room' ELSE 'seek_room' END AS intention_type,
    CASE WHEN n % 2 = 0 THEN 'room' ELSE 'flatmate' END AS listing_type,
    55 + ((n * 7) % 43) AS trust_score,
    CASE
      WHEN n % 7 = 0 THEN 'verified'
      WHEN n % 5 = 0 THEN 'gold'
      WHEN n % 3 = 0 THEN 'silver'
      ELSE 'bronze'
    END AS trust_badge,
    (n % 3 <> 1) AS selfie_verified,
    (ARRAY[
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=900&q=80',
      'https://images.unsplash.com/photo-1507591064344-4c6ce005b128?auto=format&fit=crop&w=900&q=80'
    ])[1 + ((n - 1) % 8)] AS photo_url,
    (ARRAY[
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1493809842364-78817add7ffb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=1200&q=80'
    ])[1 + ((n - 1) % 6)] AS listing_photo
  FROM generate_series(1, 32) AS gs(n)
)
SELECT * FROM raw;

-- Limpieza previa idempotente del propio paquete demo.
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
    OR user_a IN (SELECT user_id FROM covinter_demo_seed_users)
    OR user_b IN (SELECT user_id FROM covinter_demo_seed_users);

DELETE FROM public.convinter_notifications
 WHERE user_id IN (SELECT user_id FROM covinter_demo_seed_users)
    OR notification_type LIKE 'DEMO_%';

DELETE FROM public.convinter_pair_consent
 WHERE user_a IN (SELECT user_id FROM covinter_demo_seed_users)
    OR user_b IN (SELECT user_id FROM covinter_demo_seed_users);

DELETE FROM public.convinter_compat_cache
 WHERE user_a IN (SELECT user_id FROM covinter_demo_seed_users)
    OR user_b IN (SELECT user_id FROM covinter_demo_seed_users)
    OR breakdown->>'demo_seed' = 'true';

DELETE FROM public.convinter_answers
 WHERE user_id IN (SELECT user_id FROM covinter_demo_seed_users);

DELETE FROM public.convinter_profile_intentions
 WHERE profile_id IN (SELECT user_id FROM covinter_demo_seed_users)
    OR details->>'demo_seed' = 'true';

DELETE FROM public.convinter_listings
 WHERE owner_id IN (SELECT user_id FROM covinter_demo_seed_users)
    OR title LIKE '[DEMO]%';

DELETE FROM public.convinter_profiles
 WHERE user_id IN (SELECT user_id FROM covinter_demo_seed_users)
    OR handle LIKE 'demo_%';

DELETE FROM public.profiles
 WHERE id IN (SELECT user_id FROM covinter_demo_seed_users);

DELETE FROM auth.identities
 WHERE user_id IN (SELECT user_id FROM covinter_demo_seed_users);

DELETE FROM auth.users
 WHERE id IN (SELECT user_id FROM covinter_demo_seed_users)
    OR email LIKE 'demo.%@covinter.test'
    OR email LIKE 'demo.user%@covinter.test';

-- Auth demo.
INSERT INTO auth.users (
  id, instance_id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at, confirmation_token, email_change,
  email_change_token_new, recovery_token
)
SELECT
  user_id,
  '00000000-0000-0000-0000-000000000000'::uuid,
  'authenticated',
  'authenticated',
  email,
  crypt('Test1234!', gen_salt('bf')),
  now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('name', display_name),
  now(),
  now(),
  '',
  '',
  '',
  ''
FROM covinter_demo_seed_users;

INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id,
  last_sign_in_at, created_at, updated_at
)
SELECT
  gen_random_uuid(),
  user_id,
  jsonb_build_object(
    'sub', user_id::text,
    'email', email,
    'email_verified', true,
    'phone_verified', false
  ),
  'email',
  user_id::text,
  now(),
  now(),
  now()
FROM covinter_demo_seed_users
ON CONFLICT DO NOTHING;

INSERT INTO public.profiles (
  id, name, bio, user_type, autonomous_community, province, city,
  neighborhoods, budget_min, budget_max, move_in_date, min_stay_months,
  occupation, lifestyle_tags, languages, photos, onboarding_completed,
  test_completed, verification_level, created_at, updated_at
)
SELECT
  user_id,
  display_name,
  CASE
    WHEN intention_type = 'offer_room'
      THEN 'Perfil demo con habitacion disponible. Persona ordenada, comunicativa y acostumbrada a convivir.'
    ELSE 'Perfil demo buscando habitacion o companero compatible. Valora limpieza, respeto y buena comunicacion.'
  END,
  CASE
    WHEN intention_type = 'offer_room' THEN 'offering_room'::public.user_type
    ELSE 'seeking_room'::public.user_type
  END,
  CASE province_code WHEN 'M' THEN 'Madrid' WHEN 'B' THEN 'Cataluna' WHEN 'V' THEN 'Comunidad Valenciana' ELSE 'Andalucia' END,
  province_code,
  city,
  ARRAY['Centro','Norte','Zona tranquila'],
  350 + n * 10,
  650 + n * 18,
  (current_date + ((n % 45) || ' days')::interval)::date,
  3 + (n % 9),
  (ARRAY['Producto digital','Enfermeria','Diseno UX','Marketing','Ingenieria','Profesorado','Hosteleria','Consultoria'])[1 + ((n - 1) % 8)],
  ARRAY['limpieza','respeto','vida tranquila','planes ocasionales'],
  ARRAY['es','en'],
  ARRAY[photo_url],
  true,
  true,
  CASE WHEN selfie_verified THEN 'document'::public.verification_level ELSE 'email'::public.verification_level END,
  now(),
  now()
FROM covinter_demo_seed_users
ON CONFLICT (id) DO UPDATE SET
  name = excluded.name,
  bio = excluded.bio,
  user_type = excluded.user_type,
  autonomous_community = excluded.autonomous_community,
  province = excluded.province,
  city = excluded.city,
  neighborhoods = excluded.neighborhoods,
  budget_min = excluded.budget_min,
  budget_max = excluded.budget_max,
  move_in_date = excluded.move_in_date,
  min_stay_months = excluded.min_stay_months,
  occupation = excluded.occupation,
  lifestyle_tags = excluded.lifestyle_tags,
  languages = excluded.languages,
  photos = excluded.photos,
  onboarding_completed = excluded.onboarding_completed,
  test_completed = excluded.test_completed,
  verification_level = excluded.verification_level,
  updated_at = now();

INSERT INTO public.convinter_profiles (
  user_id, handle, display_name, bio, photo_url, languages,
  province_code, city, visibility, selfie_verified, selfie_verified_at,
  trust_score, trust_badge, test_completed, quick_test_completed,
  quick_test_completed_at, full_test_completed, full_test_completed_at,
  dealbreakers, created_at, updated_at
)
SELECT
  user_id,
  handle,
  display_name,
  CASE
    WHEN intention_type = 'offer_room'
      THEN 'Perfil demo: ofrece una habitacion cuidada, busca convivencia estable, comunicacion clara y respeto por los descansos.'
    ELSE 'Perfil demo: busca una habitacion luminosa o una persona compatible para compartir piso con normas claras desde el principio.'
  END,
  photo_url,
  ARRAY['es','en'],
  province_code,
  city,
  'public'::public.convinter_visibility,
  selfie_verified,
  CASE WHEN selfie_verified THEN now() ELSE NULL END,
  trust_score,
  trust_badge::public.convinter_trust_badge,
  true,
  true,
  now(),
  n % 4 <> 0,
  CASE WHEN n % 4 <> 0 THEN now() ELSE NULL END,
  ARRAY['ruido nocturno','falta de limpieza'],
  now(),
  now()
FROM covinter_demo_seed_users;

INSERT INTO public.convinter_profile_intentions (
  profile_id, intention_type, is_primary, priority, urgency, details, active,
  created_at, updated_at
)
SELECT
  user_id,
  intention_type::public.convinter_intention_type,
  true,
  100 - n,
  CASE
    WHEN n % 5 = 0 THEN 'urgent'
    WHEN n % 3 = 0 THEN 'soon'
    ELSE 'flexible'
  END::public.convinter_urgency_level,
  CASE
    WHEN intention_type = 'offer_room' THEN jsonb_build_object(
      'demo_seed', true,
      'room_size_m2', 8 + (n % 9),
      'deposit_months', 1,
      'preferred_tenant', 'Persona responsable, tranquila y comunicativa'
    )
    ELSE jsonb_build_object(
      'demo_seed', true,
      'budget_max', 520 + n * 18,
      'preferred_area', city || ' centro',
      'move_in_window', '1-8 semanas'
    )
  END,
  true,
  now(),
  now()
FROM covinter_demo_seed_users
ON CONFLICT (profile_id, intention_type, active) DO UPDATE SET
  is_primary = excluded.is_primary,
  priority = excluded.priority,
  urgency = excluded.urgency,
  details = excluded.details,
  updated_at = now();

INSERT INTO public.convinter_listings (
  id, owner_id, listing_type, title, description, province_code, city,
  price_monthly, bills_included, available_from, min_stay_months,
  smoking_allowed, pets_allowed, photos, thumbnail_url, status,
  listing_verified, listing_verification_level, listing_verified_at,
  created_at, updated_at
)
SELECT
  ('00000000-0000-4001-8000-' || lpad(n::text, 12, '0'))::uuid,
  user_id,
  listing_type::public.convinter_listing_type,
  CASE
    WHEN listing_type = 'room' THEN '[DEMO] Habitacion luminosa en ' || city
    ELSE '[DEMO] Busco companero compatible en ' || city
  END,
  CASE
    WHEN listing_type = 'room'
      THEN 'Anuncio demo para probar busqueda, detalle, fotos, contacto y acciones de seguridad. Habitacion amueblada, buena luz, gastos claros y convivencia tranquila.'
    ELSE 'Anuncio demo para probar perfiles que buscan compartir. Busco piso o companero con habitos compatibles, limpieza semanal y comunicacion sencilla.'
  END,
  province_code,
  city,
  CASE WHEN listing_type = 'room' THEN 430 + n * 17 ELSE 380 + n * 12 END,
  n % 3 <> 0,
  (current_date + ((n % 50) || ' days')::interval)::date,
  2 + (n % 10),
  n % 9 = 0,
  n % 4 = 0,
  ARRAY[
    listing_photo,
    'https://images.unsplash.com/photo-1560448075-bb485b067938?auto=format&fit=crop&w=1200&q=80',
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1200&q=80'
  ],
  listing_photo,
  'active',
  n % 3 <> 1,
  CASE WHEN n % 3 <> 1 THEN 1 + (n % 2) ELSE 0 END,
  CASE WHEN n % 3 <> 1 THEN now() ELSE NULL END,
  now() - ((32 - n) || ' hours')::interval,
  now()
FROM covinter_demo_seed_users;

INSERT INTO public.convinter_answers (user_id, test_id, question_id, answer_value, created_at, updated_at)
SELECT user_id, 'quick', 'cleanliness', jsonb_build_object('value', 3 + (n % 3)), now(), now()
FROM covinter_demo_seed_users
UNION ALL
SELECT user_id, 'quick', 'sleep_schedule', jsonb_build_object('value', CASE WHEN n % 2 = 0 THEN 'early' ELSE 'late' END), now(), now()
FROM covinter_demo_seed_users
UNION ALL
SELECT user_id, 'quick', 'guests', jsonb_build_object('value', CASE WHEN n % 4 = 0 THEN 'often' ELSE 'rarely' END), now(), now()
FROM covinter_demo_seed_users;

WITH demo_pairs AS (
  SELECT LEAST(a.user_id, b.user_id) AS user_a, GREATEST(a.user_id, b.user_id) AS user_b, 2 AS consent_level
  FROM covinter_demo_seed_users a
  JOIN covinter_demo_seed_users b ON b.n IN (2,4,6,8,10,12,14,16)
  WHERE a.n = 1
  UNION ALL
  SELECT LEAST(a.user_id, b.user_id), GREATEST(a.user_id, b.user_id), 1
  FROM covinter_demo_seed_users a
  JOIN covinter_demo_seed_users b ON b.n IN (3,5,7,9,11,13,15)
  WHERE a.n = 2
)
INSERT INTO public.convinter_pair_consent (user_a, user_b, consent_level, updated_at)
SELECT user_a, user_b, consent_level, now()
FROM demo_pairs
ON CONFLICT (user_a, user_b) DO UPDATE SET
  consent_level = excluded.consent_level,
  updated_at = now();

WITH demo_pairs AS (
  SELECT LEAST(a.user_id, b.user_id) AS user_a, GREATEST(a.user_id, b.user_id) AS user_b, 2 AS detail_level, 82 + ((b.n * 3) % 16) AS score
  FROM covinter_demo_seed_users a
  JOIN covinter_demo_seed_users b ON b.n IN (2,4,6,8,10,12,14,16)
  WHERE a.n = 1
  UNION ALL
  SELECT LEAST(a.user_id, b.user_id), GREATEST(a.user_id, b.user_id), 1, 70 + ((b.n * 5) % 20)
  FROM covinter_demo_seed_users a
  JOIN covinter_demo_seed_users b ON b.n IN (3,5,7,9,11,13,15)
  WHERE a.n = 2
)
INSERT INTO public.convinter_compat_cache (user_a, user_b, detail_level, score, breakdown, computed_at)
SELECT
  user_a,
  user_b,
  detail_level,
  score,
  jsonb_build_object(
    'demo_seed', true,
    'reasons', jsonb_build_array(
      'Compatibilidad alta en limpieza y horarios',
      'Presupuesto y zona razonablemente alineados',
      'Preferencias de convivencia compatibles'
    ),
    'risks', jsonb_build_array('Validar visitas y normas de ruido')
  ),
  now()
FROM demo_pairs
ON CONFLICT (user_a, user_b, detail_level) DO UPDATE SET
  score = excluded.score,
  breakdown = excluded.breakdown,
  computed_at = now();

INSERT INTO public.convinter_chats (id, user_a, user_b, created_at, last_message_at)
VALUES
  ('00000000-0000-4002-8000-000000000001', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000002', now() - interval '3 hours', now() - interval '15 minutes'),
  ('00000000-0000-4002-8000-000000000002', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000004', now() - interval '2 hours', now() - interval '40 minutes'),
  ('00000000-0000-4002-8000-000000000003', '00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000003', now() - interval '90 minutes', now() - interval '8 minutes')
ON CONFLICT (user_a, user_b) DO UPDATE SET
  last_message_at = excluded.last_message_at;

INSERT INTO public.convinter_messages (chat_id, sender_id, body, created_at)
VALUES
  ('00000000-0000-4002-8000-000000000001', '00000000-0000-4000-8000-000000000001', '[DEMO] Hola, me interesa la habitacion. Sigue disponible?', now() - interval '55 minutes'),
  ('00000000-0000-4002-8000-000000000001', '00000000-0000-4000-8000-000000000002', '[DEMO] Si, sigue disponible. Busco alguien tranquilo y ordenado.', now() - interval '45 minutes'),
  ('00000000-0000-4002-8000-000000000001', '00000000-0000-4000-8000-000000000001', '[DEMO] Perfecto. Puedo contarte mi rutina y vemos si encaja.', now() - interval '15 minutes'),
  ('00000000-0000-4002-8000-000000000002', '00000000-0000-4000-8000-000000000004', '[DEMO] Tengo una habitacion parecida a lo que buscas.', now() - interval '70 minutes'),
  ('00000000-0000-4002-8000-000000000002', '00000000-0000-4000-8000-000000000001', '[DEMO] Gracias, la reviso y te digo algo.', now() - interval '40 minutes'),
  ('00000000-0000-4002-8000-000000000003', '00000000-0000-4000-8000-000000000003', '[DEMO] Me encaja tu anuncio, podemos hablar por aqui?', now() - interval '25 minutes'),
  ('00000000-0000-4002-8000-000000000003', '00000000-0000-4000-8000-000000000002', '[DEMO] Claro, preguntame lo que necesites.', now() - interval '8 minutes');

INSERT INTO public.convinter_notifications (user_id, notification_type, payload, created_at)
VALUES
  ('00000000-0000-4000-8000-000000000001', 'DEMO_MATCH_READY', '{"message":"Tienes varios matches demo para probar."}'::jsonb, now()),
  ('00000000-0000-4000-8000-000000000002', 'DEMO_MATCH_READY', '{"message":"Tienes chats demo para probar."}'::jsonb, now());

COMMIT;

-- Verificacion rapida:
-- SELECT count(*) FROM auth.users WHERE email LIKE 'demo.%@covinter.test' OR email LIKE 'demo.user%@covinter.test';
-- SELECT count(*) FROM public.convinter_listings WHERE title LIKE '[DEMO]%';
-- SELECT count(*) FROM public.convinter_messages WHERE body LIKE '[DEMO]%';
