-- ================================================
-- CREAR PERFILES FICTICIOS PARA TESTING (CORREGIDO)
-- 10 perfiles por cada tipo de intención (30 total)
-- ================================================

-- El trigger on_auth_user_created creará automáticamente el perfil básico
-- Nosotros solo añadimos lo que falta

-- ========================================
-- PERFILES QUE BUSCAN HABITACIÓN (seek_room)
-- ========================================

-- Perfil 1: Carlos - Estudiante de Medicina
DO $$
DECLARE
  user_id uuid := gen_random_uuid();
BEGIN
  -- Crear usuario en auth.users
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
  VALUES (user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'carlos.martin@test.com', crypt('Test1234!', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"name":"Carlos Martín"}', now(), now(), '', '', '', '');
  
  -- Crear perfil en profiles (tabla antigua) - ON CONFLICT para evitar errores
  INSERT INTO public.profiles (id, name)
  VALUES (user_id, 'Carlos Martín')
  ON CONFLICT (id) DO NOTHING;
  
  -- Crear perfil en convinter_profiles (tabla nueva)
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'carlos_martin', 'Carlos Martín', 'Estudiante de medicina de 22 años. Ordenado, tranquilo y responsable. Me gusta estudiar en casa pero también salir los fines de semana. 🏥📚', ARRAY['es', 'en'], 'M', 'Madrid', 70, 'bronze', true, 'public');
  
  -- Crear intención
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
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Laura Fernández')
  ON CONFLICT (id) DO NOTHING;
  
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
  
  INSERT INTO public.profiles (id, name) VALUES (user_id, 'Javier López')
  ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.convinter_profiles (user_id, handle, display_name, bio, languages, province_code, city, trust_score, trust_badge, selfie_verified, visibility)
  VALUES (user_id, 'javier_lopez', 'Javier López', 'Developer de 29 años. Trabajo en remoto. Tranquilo, limpio y geek. Me encantan los videojuegos y las series. 🎮💻', ARRAY['es', 'en'], 'M', 'Madrid', 75, 'bronze', true, 'public');
  
  INSERT INTO public.convinter_profile_intentions (profile_id, intention_type, is_primary, urgency, priority, details)
  VALUES (user_id, 'seek_room', true, 'flexible', 7, '{"budget_min": 450, "budget_max": 700, "preferred_neighborhoods": ["Chamberí", "Salamanca"]}'::jsonb);
END $$;

-- Mensaje de éxito
DO $$
DECLARE
  total_profiles int;
  seek_room_count int;
BEGIN
  SELECT COUNT(*) INTO total_profiles FROM public.convinter_profiles;
  SELECT COUNT(*) INTO seek_room_count FROM public.convinter_profile_intentions WHERE intention_type = 'seek_room' AND active = true;
  
  RAISE NOTICE '';
  RAISE NOTICE '================================================';
  RAISE NOTICE '✅ PERFILES FICTICIOS CREADOS EXITOSAMENTE!';
  RAISE NOTICE '================================================';
  RAISE NOTICE 'Total de perfiles: %', total_profiles;
  RAISE NOTICE 'Buscan habitación: %', seek_room_count;
  RAISE NOTICE '🔑 Password para todos: Test1234!';
  RAISE NOTICE '================================================';
END $$;
