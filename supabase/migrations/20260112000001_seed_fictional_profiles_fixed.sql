-- ================================================
-- CREAR PERFILES FICTICIOS PARA TESTING (COMPLETO)
-- 10 perfiles por cada tipo de intención (30 total)
-- Password para todos: Test1234!
-- ================================================

-- ========================================
-- PERFILES QUE BUSCAN HABITACIÓN (seek_room) - 10 perfiles
-- ========================================

-- Perfil 1: Carlos - Estudiante de Medicina
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'carlos.martin@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Carlos Martín"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Carlos Martín') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'carlos_martin', 'Carlos Martín', 'Estudiante de medicina de 22 años. Ordenado, tranquilo y responsable. Me gusta estudiar en casa pero también salir los fines de semana. 🏥📚', ARRAY['es', 'en'], 'M', 'Madrid', 70, 'bronze', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'seek_room', true, 'urgent', 10, '{"budget_min": 350, "budget_max": 550, "preferred_neighborhoods": ["Moncloa", "Ciudad Universitaria"]}'::jsonb);
END $$;

-- Perfil 2: Laura - Diseñadora Gráfica
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'laura.fernandez@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Laura Fernández"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Laura Fernández') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'laura_fernandez', 'Laura Fernández', 'Diseñadora gráfica freelance de 26 años. Creativa, sociable y amante del arte. Busco un ambiente relajado y respetuoso. 🎨✨', ARRAY['es', 'en', 'fr'], 'B', 'Barcelona', 80, 'silver', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'seek_room', true, 'soon', 9, '{"budget_min": 400, "budget_max": 650, "preferred_neighborhoods": ["Gràcia", "Eixample", "Poblenou"]}'::jsonb);
END $$;

-- Perfil 3: Javier - Desarrollador Software
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'javier.lopez@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Javier López"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Javier López') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'javier_lopez', 'Javier López', 'Developer de 29 años. Trabajo en remoto. Tranquilo, limpio y geek. Me encantan los videojuegos y las series. 🎮💻', ARRAY['es', 'en'], 'V', 'Valencia', 75, 'bronze', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'seek_room', true, 'flexible', 7, '{"budget_min": 450, "budget_max": 700, "preferred_neighborhoods": ["Ruzafa", "Benimaclet"]}'::jsonb);
END $$;

-- Perfil 4: Ana - Estudiante de Bellas Artes
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ana.ruiz@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Ana Ruiz"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Ana Ruiz') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'ana_ruiz', 'Ana Ruiz', 'Estudiante de Bellas Artes de 21 años. Creativa, abierta y alegre. Me encanta pintar y conocer gente nueva. 🎨🌈', ARRAY['es', 'en', 'it'], 'SE', 'Sevilla', 65, 'bronze', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'seek_room', true, 'urgent', 10, '{"budget_min": 250, "budget_max": 400, "preferred_neighborhoods": ["Triana", "Centro"]}'::jsonb);
END $$;

-- Perfil 5: Miguel - Ingeniero Industrial
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'miguel.garcia@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Miguel García"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Miguel García') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'miguel_garcia', 'Miguel García', 'Ingeniero industrial de 27 años. Metódico, organizado y tranquilo. Trabajo de 9 a 6. Busco ambiente serio. 🔧📊', ARRAY['es', 'en', 'de'], 'BI', 'Bilbao', 85, 'silver', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'seek_room', true, 'soon', 8, '{"budget_min": 350, "budget_max": 500, "preferred_neighborhoods": ["Abando", "Indautxu"]}'::jsonb);
END $$;

-- Perfil 6: Sofia - Enfermera
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sofia.gonzalez@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Sofía González"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Sofía González') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'sofia_gonzalez', 'Sofía González', 'Enfermera de 25 años. Responsable, empática y trabajadora. Turnos rotativos. Busco ambiente tranquilo. 👩‍⚕️💙', ARRAY['es', 'en'], 'M', 'Madrid', 90, 'gold', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'seek_room', true, 'urgent', 10, '{"budget_min": 400, "budget_max": 600, "preferred_neighborhoods": ["Retiro", "Arganzuela"]}'::jsonb);
END $$;

-- Perfil 7: Pablo - Profesor de Inglés
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pablo.sanchez@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Pablo Sánchez"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Pablo Sánchez') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'pablo_sanchez', 'Pablo Sánchez', 'Profesor de inglés de 30 años. Comunicativo, ordenado y respetuoso. Me gusta leer y hacer deporte. 📚🏃', ARRAY['es', 'en'], 'B', 'Barcelona', 78, 'silver', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'seek_room', true, 'flexible', 6, '{"budget_min": 450, "budget_max": 600, "preferred_neighborhoods": ["Sarrià", "Les Corts"]}'::jsonb);
END $$;

-- Perfil 8: Elena - Arquitecta
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'elena.ramirez@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Elena Ramírez"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Elena Ramírez') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'elena_ramirez', 'Elena Ramírez', 'Arquitecta de 28 años. Creativa, organizada y minimalista. Me encanta el diseño y la fotografía. 🏛️📸', ARRAY['es', 'en', 'pt'], 'V', 'Valencia', 82, 'silver', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'seek_room', true, 'soon', 8, '{"budget_min": 400, "budget_max": 650, "preferred_neighborhoods": ["Ciutat Vella", "Russafa"]}'::jsonb);
END $$;

-- Perfil 9: David - Marketing Digital
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'david.torres@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"David Torres"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'David Torres') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'david_torres', 'David Torres', 'Especialista en marketing digital de 26 años. Dinámico, social y tecnológico. Me gusta viajar y conocer culturas. 🌍💻', ARRAY['es', 'en'], 'M', 'Madrid', 73, 'bronze', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'seek_room', true, 'flexible', 7, '{"budget_min": 500, "budget_max": 750, "preferred_neighborhoods": ["Malasaña", "Chueca"]}'::jsonb);
END $$;

-- Perfil 10: Maria - Periodista
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'maria.diaz@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"María Díaz"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'María Díaz') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'maria_diaz', 'María Díaz', 'Periodista de 24 años. Curiosa, comunicativa y apasionada por las noticias. Busco ambiente intelectual y acogedor. 📰✍️', ARRAY['es', 'en', 'fr'], 'B', 'Barcelona', 76, 'bronze', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'seek_room', true, 'soon', 9, '{"budget_min": 450, "budget_max": 650, "preferred_neighborhoods": ["Gràcia", "Sant Antoni"]}'::jsonb);
END $$;

-- ========================================
-- PERFILES QUE OFRECEN HABITACIÓN (offer_room) - 10 perfiles
-- ========================================

-- Perfil 11: Roberto - Propietario Jubilado
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'roberto.castro@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Roberto Castro"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Roberto Castro') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'roberto_castro', 'Roberto Castro', 'Jubilado de 65 años. Tranquilo, respetuoso y sociable. Ofrezco habitación en piso amplio. Busco compañía agradable. 🏠☕', ARRAY['es'], 'M', 'Madrid', 88, 'gold', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'offer_room', true, 'flexible', 5, '{"rent_price": 450, "available_from": "2026-02-01", "furnished": true, "bills_included": false}'::jsonb);
END $$;

-- Perfil 12: Carmen - Profesora Universitaria
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'carmen.moreno@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Carmen Moreno"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Carmen Moreno') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'carmen_moreno', 'Carmen Moreno', 'Profesora universitaria de 45 años. Culta, ordenada y responsable. Piso céntrico cerca de universidades. 📚🎓', ARRAY['es', 'en'], 'B', 'Barcelona', 92, 'gold', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'offer_room', true, 'soon', 7, '{"rent_price": 550, "available_from": "2026-02-15", "furnished": true, "bills_included": true}'::jsonb);
END $$;

-- Perfil 13: Antonio - Ingeniero
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'antonio.jimenez@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Antonio Jiménez"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Antonio Jiménez') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'antonio_jimenez', 'Antonio Jiménez', 'Ingeniero de 35 años. Ordenado, serio y trabajador. Piso nuevo con todas las comodidades. Busco inquilino responsable. 🏢🔑', ARRAY['es', 'en'], 'V', 'Valencia', 85, 'silver', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'offer_room', true, 'urgent', 9, '{"rent_price": 400, "available_from": "2026-01-20", "furnished": true, "bills_included": false}'::jsonb);
END $$;

-- Perfil 14: Isabel - Médica
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'isabel.herrera@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Isabel Herrera"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Isabel Herrera') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'isabel_herrera', 'Isabel Herrera', 'Médica de 38 años. Responsable, limpia y tranquila. Piso amplio cerca del hospital. Prefiero ambiente silencioso. 👩‍⚕️🏥', ARRAY['es', 'en'], 'SE', 'Sevilla', 90, 'gold', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'offer_room', true, 'soon', 8, '{"rent_price": 380, "available_from": "2026-02-01", "furnished": true, "bills_included": true}'::jsonb);
END $$;

-- Perfil 15: Fernando - Arquitecto
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'fernando.vega@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Fernando Vega"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Fernando Vega') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'fernando_vega', 'Fernando Vega', 'Arquitecto de 42 años. Diseñador, ordenado y creativo. Piso renovado con estilo moderno. Busco persona con gustos similares. 🏗️✨', ARRAY['es', 'en', 'it'], 'M', 'Madrid', 87, 'silver', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'offer_room', true, 'flexible', 6, '{"rent_price": 650, "available_from": "2026-03-01", "furnished": true, "bills_included": false}'::jsonb);
END $$;

-- Perfil 16: Lucia - Abogada
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lucia.mendez@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Lucía Méndez"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Lucía Méndez') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'lucia_mendez', 'Lucía Méndez', 'Abogada de 33 años. Profesional, seria y organizada. Piso céntrico bien comunicado. Busco persona responsable y limpia. ⚖️💼', ARRAY['es', 'en', 'fr'], 'B', 'Barcelona', 91, 'gold', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'offer_room', true, 'soon', 8, '{"rent_price": 600, "available_from": "2026-02-10", "furnished": true, "bills_included": true}'::jsonb);
END $$;

-- Perfil 17: Jorge - Empresario
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'jorge.navarro@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Jorge Navarro"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Jorge Navarro') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'jorge_navarro', 'Jorge Navarro', 'Empresario de 40 años. Viajero, sociable y flexible. Piso con terraza en zona premium. Busco persona independiente. 🌟🏙️', ARRAY['es', 'en'], 'M', 'Málaga', 84, 'silver', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'offer_room', true, 'flexible', 5, '{"rent_price": 500, "available_from": "2026-02-15", "furnished": true, "bills_included": false}'::jsonb);
END $$;

-- Perfil 18: Rosa - Traductora
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rosa.flores@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Rosa Flores"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Rosa Flores') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'rosa_flores', 'Rosa Flores', 'Traductora de 31 años. Políglota, tranquila y culta. Piso luminoso con biblioteca. Perfecto para estudiantes o profesionales. 📚🌍', ARRAY['es', 'en', 'fr', 'de'], 'V', 'Valencia', 89, 'silver', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'offer_room', true, 'soon', 7, '{"rent_price": 420, "available_from": "2026-02-05", "furnished": true, "bills_included": true}'::jsonb);
END $$;

-- Perfil 19: Manuel - Fotógrafo
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'manuel.ortiz@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Manuel Ortiz"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Manuel Ortiz') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'manuel_ortiz', 'Manuel Ortiz', 'Fotógrafo de 36 años. Creativo, relajado y bohemio. Piso con mucha luz natural. Busco compañero con mente abierta. 📷🎨', ARRAY['es', 'en'], 'B', 'Barcelona', 79, 'bronze', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'offer_room', true, 'flexible', 6, '{"rent_price": 520, "available_from": "2026-03-01", "furnished": true, "bills_included": false}'::jsonb);
END $$;

-- Perfil 20: Beatriz - Psicóloga
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'beatriz.romero@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Beatriz Romero"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Beatriz Romero') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'beatriz_romero', 'Beatriz Romero', 'Psicóloga de 34 años. Empática, serena y organizada. Piso tranquilo y acogedor. Busco ambiente de respeto mutuo. 🧠💚', ARRAY['es', 'en'], 'M', 'Madrid', 93, 'gold', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'offer_room', true, 'soon', 8, '{"rent_price": 580, "available_from": "2026-02-01", "furnished": true, "bills_included": true}'::jsonb);
END $$;

-- ========================================
-- PERFILES QUE BUSCAN COMPAÑERO (seek_flatmate) - 10 perfiles
-- ========================================

-- Perfil 21: Adrián - Estudiante de Derecho
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'adrian.reyes@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Adrián Reyes"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Adrián Reyes') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'adrian_reyes', 'Adrián Reyes', 'Estudiante de derecho de 23 años. Serio, estudioso y responsable. Busco compañero para compartir piso cerca de la universidad. ⚖️📖', ARRAY['es', 'en'], 'M', 'Madrid', 68, 'bronze', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'seek_flatmate', true, 'urgent', 10, '{"budget_total": 900, "preferred_area": "Universidad", "looking_for_flat": true}'::jsonb);
END $$;

-- Perfil 22: Cristina - Diseñadora UX
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'cristina.vazquez@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Cristina Vázquez"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Cristina Vázquez') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'cristina_vazquez', 'Cristina Vázquez', 'Diseñadora UX de 27 años. Creativa, organizada y tech-savvy. Busco compañera para compartir piso moderno. 💻🎨', ARRAY['es', 'en'], 'B', 'Barcelona', 82, 'silver', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'seek_flatmate', true, 'soon', 9, '{"budget_total": 1200, "preferred_area": "Eixample", "looking_for_flat": true}'::jsonb);
END $$;

-- Perfil 23: Raúl - Músico
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'raul.pena@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Raúl Peña"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Raúl Peña') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'raul_pena', 'Raúl Peña', 'Músico de 25 años. Artista, relajado y nocturno. Busco compañero tolerante para compartir piso con buen rollo. 🎸🎵', ARRAY['es', 'en'], 'V', 'Valencia', 71, 'bronze', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'seek_flatmate', true, 'flexible', 6, '{"budget_total": 800, "preferred_area": "Ruzafa", "looking_for_flat": true}'::jsonb);
END $$;

-- Perfil 24: Natalia - Bióloga
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'natalia.cruz@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Natalia Cruz"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Natalia Cruz') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'natalia_cruz', 'Natalia Cruz', 'Bióloga de 28 años. Científica, metódica y amante de la naturaleza. Busco compañero/a para compartir piso tranquilo. 🔬🌿', ARRAY['es', 'en'], 'SE', 'Sevilla', 86, 'silver', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'seek_flatmate', true, 'soon', 8, '{"budget_total": 750, "preferred_area": "Nervión", "looking_for_flat": true}'::jsonb);
END $$;

-- Perfil 25: Sergio - Chef
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'sergio.delgado@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Sergio Delgado"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Sergio Delgado') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'sergio_delgado', 'Sergio Delgado', 'Chef de 30 años. Cocinero, sociable y foodie. Busco compañero que disfrute de buena comida casera. 👨‍🍳🍝', ARRAY['es', 'en', 'it'], 'M', 'Madrid', 77, 'bronze', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'seek_flatmate', true, 'soon', 8, '{"budget_total": 1000, "preferred_area": "Chamberí", "looking_for_flat": true}'::jsonb);
END $$;

-- Perfil 26: Patricia - Fisioterapeuta
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'patricia.santos@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Patricia Santos"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Patricia Santos') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'patricia_santos', 'Patricia Santos', 'Fisioterapeuta de 26 años. Deportista, saludable y activa. Busco compañera con estilo de vida similar. 🏃‍♀️💪', ARRAY['es', 'en'], 'B', 'Barcelona', 84, 'silver', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'seek_flatmate', true, 'urgent', 9, '{"budget_total": 1100, "preferred_area": "Les Corts", "looking_for_flat": true}'::jsonb);
END $$;

-- Perfil 27: Alberto - Economista
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'alberto.ramos@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Alberto Ramos"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Alberto Ramos') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'alberto_ramos', 'Alberto Ramos', 'Economista de 32 años. Analítico, ordenado y profesional. Busco compañero responsable para compartir piso céntrico. 📊💼', ARRAY['es', 'en'], 'V', 'Valencia', 88, 'silver', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'seek_flatmate', true, 'flexible', 7, '{"budget_total": 950, "preferred_area": "Centro", "looking_for_flat": true}'::jsonb);
END $$;

-- Perfil 28: Marta - Veterinaria
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'marta.iglesias@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Marta Iglesias"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Marta Iglesias') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'marta_iglesias', 'Marta Iglesias', 'Veterinaria de 29 años. Amante de los animales, empática y responsable. Busco compañero pet-friendly. 🐾❤️', ARRAY['es', 'en'], 'M', 'Madrid', 91, 'gold', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'seek_flatmate', true, 'soon', 8, '{"budget_total": 1050, "preferred_area": "Retiro", "looking_for_flat": true, "pets_allowed": true}'::jsonb);
END $$;

-- Perfil 29: Iván - Consultor
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'ivan.serrano@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Iván Serrano"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Iván Serrano') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'ivan_serrano', 'Iván Serrano', 'Consultor de 31 años. Viajero frecuente, flexible y organizado. Busco compañero independiente para piso céntrico. ✈️💼', ARRAY['es', 'en'], 'B', 'Barcelona', 83, 'silver', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'seek_flatmate', true, 'flexible', 6, '{"budget_total": 1150, "preferred_area": "Sant Gervasi", "looking_for_flat": true}'::jsonb);
END $$;

-- Perfil 30: Silvia - Farmacéutica
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'silvia.molina@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Silvia Molina"}', now(), now(), '', '', '', '');
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Silvia Molina') ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'silvia_molina', 'Silvia Molina', 'Farmacéutica de 27 años. Organizada, responsable y sociable. Busco compañera para compartir piso tranquilo y limpio. 💊🏥', ARRAY['es', 'en'], 'V', 'Valencia', 85, 'silver', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'seek_flatmate', true, 'soon', 9, '{"budget_total": 900, "preferred_area": "Benimaclet", "looking_for_flat": true}'::jsonb);
END $$;

-- ========================================
-- MENSAJE FINAL
-- ========================================
DO $$
DECLARE
  total_profiles int;
  seek_room_count int;
  offer_room_count int;
  seek_flatmate_count int;
BEGIN
  SELECT COUNT(*) INTO total_profiles FROM public.convinter_profiles;
  SELECT COUNT(*) INTO seek_room_count FROM public.convinter_profile_intentions WHERE intention_type = 'seek_room' AND active = true;
  SELECT COUNT(*) INTO offer_room_count FROM public.convinter_profile_intentions WHERE intention_type = 'offer_room' AND active = true;
  SELECT COUNT(*) INTO seek_flatmate_count FROM public.convinter_profile_intentions WHERE intention_type = 'seek_flatmate' AND active = true;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ 30 PERFILES FICTICIOS CREADOS EXITOSAMENTE!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Total de perfiles: %', total_profiles;
  RAISE NOTICE 'Buscan habitación (seek_room): %', seek_room_count;
  RAISE NOTICE 'Ofrecen habitación (offer_room): %', offer_room_count;
  RAISE NOTICE 'Buscan compañero (seek_flatmate): %', seek_flatmate_count;
  RAISE NOTICE '';
  RAISE NOTICE '🔑 Password para TODOS: Test1234!';
  RAISE NOTICE '📧 Formato email: nombre.apellido@test.com';
  RAISE NOTICE '================================================';
END $$;
