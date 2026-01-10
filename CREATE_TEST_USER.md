# 🧪 Crear Usuario de Prueba

## Opción 1: Registro Normal (RECOMENDADO)

La forma más sencilla es registrar un nuevo usuario desde la aplicación:

1. **Abre el navegador** en: http://localhost:8080/signup
2. **Registra un nuevo usuario**:
   - Email: `test@test.com`
   - Password: `Test123456`
   - Nombre: `María García Test`
3. **Completa el Onboarding**:
   - Selecciona **"Busco habitación"** ✅ (Principal)
   - Selecciona **"Busco compañero/a para alquilar piso"** ✅
   - Completa los demás pasos
4. **¡Listo!** Ya puedes probar en Discover con los filtros

---

## Opción 2: SQL Directo (Si quieres datos pre-poblados)

Si prefieres crear el usuario desde la base de datos:

1. Ve a tu **Dashboard de Supabase**: https://supabase.com/dashboard/project/glsyzczyisengwwieuvt/sql/new

2. **Copia y pega este SQL**:

```sql
-- Primero, registra el usuario manualmente en la app (http://localhost:8080/signup)
-- con email: test@test.com y password: Test123456
-- Luego ejecuta este script para añadir sus intenciones:

-- SUSTITUYE 'USER_ID_AQUI' por el ID real del usuario después de registrarte
DO $$
DECLARE
  user_uuid uuid := 'USER_ID_AQUI'::uuid; -- ⚠️ CAMBIAR ESTO
BEGIN
  -- Crear perfil completo
  INSERT INTO public.convinter_profiles (
    user_id,
    display_name,
    bio,
    languages,
    province_code,
    city,
    trust_score,
    selfie_verified
  ) VALUES (
    user_uuid,
    'María García',
    'Profesora de inglés, amante del yoga y la cocina. Busco ambiente tranquilo y responsable. 🧘‍♀️',
    ARRAY['es', 'en'],
    'M',
    'Madrid',
    75,
    true
  ) ON CONFLICT (user_id) DO UPDATE SET
    display_name = EXCLUDED.display_name,
    bio = EXCLUDED.bio,
    updated_at = now();

  -- Intención 1: Busco habitación (Principal)
  INSERT INTO public.convinter_profile_intentions (
    profile_id,
    intention_type,
    is_primary,
    urgency,
    priority
  ) VALUES (
    user_uuid,
    'seek_room',
    true,
    'soon',
    10
  ) ON CONFLICT (profile_id, intention_type, active) DO UPDATE SET
    is_primary = true,
    updated_at = now();

  -- Intención 2: Busco compañero
  INSERT INTO public.convinter_profile_intentions (
    profile_id,
    intention_type,
    is_primary,
    urgency,
    priority
  ) VALUES (
    user_uuid,
    'seek_flatmate',
    false,
    'flexible',
    5
  ) ON CONFLICT (profile_id, intention_type, active) DO UPDATE SET
    urgency = 'flexible',
    updated_at = now();

  RAISE NOTICE '✅ Perfil e intenciones creados!';
END $$;
```

---

## 🎯 Qué Probar

Una vez tengas el usuario:

1. **Login**: Inicia sesión con las credenciales
2. **Perfil**: Ve a /profile y verifica que se muestren los badges de intención
3. **Discover**: 
   - Abre /discover
   - Click en el filtro "Todas"
   - Verifica que aparecen las 3 opciones con iconos
   - Filtra por "Busca habitación"
4. **Onboarding** (si creaste otro usuario):
   - Ve a /onboarding
   - Prueba seleccionar múltiples intenciones
   - Verifica que aparece el badge "Principal"

---

## 📝 Credenciales Sugeridas

```
Email: test@test.com
Password: Test123456
Nombre: María García
```
