-- ================================================
-- CREAR USUARIO FICTICIO PARA TESTING
-- ================================================

-- 1. Crear usuario en auth.users (ficticio)
-- Nota: Este usuario tiene credenciales ficticias para testing
DO $$
DECLARE
  test_user_id uuid := '00000000-0000-0000-0000-000000000001'::uuid;
  test_email text := 'test.user@convinter.test';
BEGIN
  -- Verificar si el usuario ya existe
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = test_user_id) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      confirmation_token,
      email_change,
      email_change_token_new,
      recovery_token
    ) VALUES (
      test_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      test_email,
      crypt('TestPassword123!', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"María García Test"}',
      now(),
      now(),
      '',
      '',
      '',
      ''
    );
    
    RAISE NOTICE 'Usuario de test creado con ID: %', test_user_id;
  ELSE
    RAISE NOTICE 'Usuario de test ya existe';
  END IF;
END $$;

-- 2. Crear perfil en convinter_profiles
INSERT INTO public.convinter_profiles (
  user_id,
  handle,
  display_name,
  bio,
  languages,
  province_code,
  city,
  trust_score,
  trust_badge,
  selfie_verified,
  visibility
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'maria_garcia_test',
  'María García',
  'Hola! Soy María, profesora de inglés de 28 años. Me encanta cocinar, hacer yoga y los planes tranquilos en casa. Busco compañeros de piso responsables y limpios. 🧘‍♀️📚',
  ARRAY['es', 'en'],
  'M',  -- Madrid
  'Madrid',
  75,
  'bronze',
  true,
  'public'
) ON CONFLICT (user_id) DO UPDATE SET
  display_name = EXCLUDED.display_name,
  bio = EXCLUDED.bio,
  languages = EXCLUDED.languages,
  province_code = EXCLUDED.province_code,
  city = EXCLUDED.city,
  trust_score = EXCLUDED.trust_score,
  updated_at = now();

-- 3. Crear múltiples intenciones para el usuario
-- Intención principal: Busca habitación
INSERT INTO public.convinter_profile_intentions (
  profile_id,
  intention_type,
  is_primary,
  urgency,
  priority,
  details
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'seek_room',
  true,
  'soon',
  10,
  '{"budget_min": 400, "budget_max": 700, "preferred_neighborhoods": ["Malasaña", "Chueca", "Lavapiés"]}'::jsonb
) ON CONFLICT (profile_id, intention_type, active) DO UPDATE SET
  is_primary = EXCLUDED.is_primary,
  urgency = EXCLUDED.urgency,
  details = EXCLUDED.details,
  updated_at = now();

-- Intención secundaria: Busca compañero para piso completo
INSERT INTO public.convinter_profile_intentions (
  profile_id,
  intention_type,
  is_primary,
  urgency,
  priority,
  details
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'seek_flatmate',
  false,
  'flexible',
  5,
  '{"desired_flat_size": 3, "people_committed": 1}'::jsonb
) ON CONFLICT (profile_id, intention_type, active) DO UPDATE SET
  is_primary = EXCLUDED.is_primary,
  urgency = EXCLUDED.urgency,
  details = EXCLUDED.details,
  updated_at = now();

-- 4. Verificar resultados
DO $$
DECLARE
  intentions_count int;
BEGIN
  SELECT COUNT(*) INTO intentions_count
  FROM public.convinter_profile_intentions
  WHERE profile_id = '00000000-0000-0000-0000-000000000001'::uuid
    AND active = true;
  
  RAISE NOTICE '✅ Usuario de test creado exitosamente!';
  RAISE NOTICE '📧 Email: test.user@convinter.test';
  RAISE NOTICE '🔑 Password: TestPassword123!';
  RAISE NOTICE '👤 Nombre: María García';
  RAISE NOTICE '🎯 Intenciones activas: %', intentions_count;
  RAISE NOTICE '';
  RAISE NOTICE '🚀 Puedes iniciar sesión con estas credenciales';
END $$;
