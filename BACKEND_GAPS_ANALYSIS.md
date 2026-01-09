# Análisis de Gaps Backend - Convinter

## Estado Actual
- ✅ 17 tablas Convinter + 1 profiles legacy
- ✅ ~40 RPCs implementados
- ❌ 0 Edge Functions
- ❌ 0 Storage buckets configurados
- ❌ Realtime no configurado
- ⚠️ Migración `20260108120000_add_test_flags.sql` creada pero NO aplicada

---

## 1. STORAGE BUCKETS (CRÍTICO - Bloqueante)

### Buckets necesarios:

#### `profile-photos` (URGENTE)
- **Estado**: ❌ No existe
- **Usado en**: `EditProfileSheet.tsx` (línea 97)
- **Propósito**: Fotos de perfil de usuario
- **Políticas RLS necesarias**:
  - `SELECT`: público (authenticated puede ver)
  - `INSERT`: solo owner (auth.uid() = user_id del path)
  - `UPDATE`: solo owner
  - `DELETE`: solo owner
- **Configuración**:
  ```sql
  INSERT INTO storage.buckets (id, name, public) VALUES ('profile-photos', 'profile-photos', true);
  
  CREATE POLICY "Public read access" ON storage.objects FOR SELECT USING (bucket_id = 'profile-photos');
  CREATE POLICY "Users can upload own photos" ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'profile-photos' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );
  CREATE POLICY "Users can update own photos" ON storage.objects FOR UPDATE USING (
    bucket_id = 'profile-photos' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );
  CREATE POLICY "Users can delete own photos" ON storage.objects FOR DELETE USING (
    bucket_id = 'profile-photos' AND 
    (storage.foldername(name))[1] = auth.uid()::text
  );
  ```

#### `listing-photos` (ALTA PRIORIDAD)
- **Estado**: ❌ No existe
- **Usado en**: `CreateListing.tsx` (actualmente mock, pero necesario para implementar)
- **Propósito**: Fotos de anuncios de pisos/habitaciones
- **Políticas RLS**: Similar a profile-photos

#### `verification-selfies` (MEDIA PRIORIDAD)
- **Estado**: ❌ No existe
- **Usado en**: Flujo de verificación de identidad
- **Propósito**: Selfies para verificación de usuario
- **Políticas RLS**: 
  - Solo owner puede subir
  - Solo moderadores pueden ver

#### `verification-docs` (MEDIA PRIORIDAD)
- **Estado**: ❌ No existe
- **Usado en**: Flujo de verificación de listings
- **Propósito**: Documentos de verificación de propiedad (contrato, escrituras)
- **Políticas RLS**:
  - Solo owner puede subir
  - Solo moderadores pueden ver

---

## 2. MIGRACIONES PENDIENTES (CRÍTICO)

### `20260108120000_add_test_flags.sql`
- **Estado**: ⚠️ Creada pero NO aplicada en DB
- **Impacto**: Al completar test, el frontend intenta actualizar columnas que no existen → falla silencioso
- **Columnas que añade**:
  - `quick_test_completed`, `quick_test_completed_at`
  - `full_test_completed`, `full_test_completed_at`
  - `full_test_requested_at`, `full_test_requested_by`
- **RPC que añade**:
  - `convinter_request_full_test(p_target uuid)`
- **Acción**: Aplicar YA en Supabase SQL Editor

---

## 3. REALTIME (ALTA PRIORIDAD)

### Chat realtime
- **Estado**: ❌ No configurado
- **Tabla**: `convinter_messages`
- **Necesario para**: Recibir mensajes nuevos sin refrescar
- **Configuración**:
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE convinter_messages;
  ```
- **Frontend**: Añadir suscripción en `Chat.tsx`:
  ```ts
  supabase.channel('messages')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'convinter_messages',
      filter: `chat_id=eq.${chatId}`
    }, (payload) => { /* añadir mensaje */ })
    .subscribe();
  ```

### Notificaciones realtime
- **Estado**: ❌ No configurado
- **Tabla**: `convinter_notifications`
- **Necesario para**: Notificaciones instantáneas (solicitud de test exhaustivo, consent, etc.)
- **Configuración**: Similar a messages

---

## 4. EDGE FUNCTIONS (MEDIA-BAJA PRIORIDAD)

### `verify-selfie` (Opcional pero recomendado)
- **Estado**: ❌ No existe
- **Propósito**: Verificación automática de selfie (face matching con ML)
- **Trigger**: Webhook cuando se sube a `verification-selfies`
- **Alternativa**: Verificación 100% manual por moderadores

### `process-image` (Opcional)
- **Estado**: ❌ No existe
- **Propósito**: Redimensionar/optimizar fotos de perfil y listings
- **Trigger**: Webhook al subir a `profile-photos` / `listing-photos`
- **Alternativa**: Subir tal cual (más lento, más storage)

### `send-email-notification` (Opcional)
- **Estado**: ❌ No existe
- **Propósito**: Enviar emails de notificaciones importantes
- **Trigger**: Llamada desde RPCs (`convinter_notify` podría disparar)
- **Alternativa**: Solo notificaciones in-app

---

## 5. FEATURES FRONTEND NO CONECTADOS

### `CreateListing.tsx`
- **Estado**: ❌ 100% mock
- **Falta**:
  1. RPC o INSERT directo a `convinter_listings`
  2. Upload de fotos a `listing-photos`
  3. Manejo de errores y validación
- **RPC existente**: `convinter_search_listings` (ya funciona)
- **Acción**: Conectar formulario a DB

### `Matches.tsx`
- **Estado**: ⚠️ Mock parcial
- **Falta**:
  1. RPC para listar matches reales (basado en `convinter_pair_consent` + compatibility)
  2. Integración con chat (link a `/chat/{userId}` ya existe)
- **RPC a crear**: `convinter_get_my_matches()` que devuelva usuarios con consent mutuo + score

### Admin panel (`Admin.tsx`)
- **Estado**: ⚠️ Probablemente sin conectar
- **Falta**: Verificar si usa los RPCs `convinter_mod_*` correctamente

---

## 6. RPCS FALTANTES

### `convinter_get_my_matches()`
- **Propósito**: Listar usuarios con consent mutuo y compatibilidad calculada
- **Retorno**: Lista de perfiles + score + último mensaje si hay chat
- **Prioridad**: ALTA

### `convinter_list_messages(p_chat_id uuid, p_limit int, p_offset int)`
- **Propósito**: Paginación de mensajes (actualmente carga todos con `.select()`)
- **Prioridad**: MEDIA (solo si hay chats muy largos)

### `convinter_mark_messages_read(p_chat_id uuid)`
- **Propósito**: Marcar mensajes como leídos
- **Prioridad**: BAJA (nice to have)

### `convinter_get_test_status(p_user uuid)`
- **Propósito**: Ver qué test completó otro usuario (quick/full/ninguno)
- **Prioridad**: ALTA (necesario para completar TODO-d)

---

## 7. OTROS AJUSTES MENORES

### Tabla `profiles` legacy
- **Estado**: Coexiste con `convinter_profiles`
- **Problema**: Duplicación de datos
- **Acción recomendada**: Migrar todo a `convinter_profiles` y deprecar `profiles`

### Rate limits
- **Estado**: Implementado en RPCs con `convinter_check_rate_limit`
- **Problema**: No hay cleanup automático de `convinter_rate_limits` (puede crecer infinito)
- **Acción**: Añadir cron job o trigger para borrar filas antiguas

### Deletion queue
- **Estado**: Cola implementada pero no hay worker
- **Problema**: `convinter_deletion_queue` se llena pero nadie borra archivos
- **Acción**: Edge Function o cron que ejecute `convinter_enqueue_*_deletions` y borre de Storage

---

## PRIORIDADES DE IMPLEMENTACIÓN

### 🔴 CRÍTICO (Bloqueante)
1. ✅ Aplicar migración `20260108120000_add_test_flags.sql`
2. ✅ Crear bucket `profile-photos` con políticas RLS
3. ✅ Crear RPC `convinter_get_test_status()`
4. ✅ Conectar `CreateListing.tsx` a DB (crear bucket `listing-photos`)

### 🟡 ALTA PRIORIDAD
5. ✅ Configurar Realtime para `convinter_messages`
6. ✅ Crear RPC `convinter_get_my_matches()`
7. ✅ Completar TODO-d: mostrar estado test en Profile/Discover

### 🟢 MEDIA PRIORIDAD
8. Configurar Realtime para `convinter_notifications`
9. Crear buckets de verificación (`verification-selfies`, `verification-docs`)
10. Edge Function `process-image` para optimización

### ⚪ BAJA PRIORIDAD (Nice to have)
11. Edge Function `verify-selfie` (ML face matching)
12. Cleanup automático de `convinter_rate_limits` y `convinter_deletion_queue`
13. Migración de `profiles` → `convinter_profiles`

---

## PRÓXIMOS PASOS INMEDIATOS

1. **Aplicar migración pendiente** (SQL Editor en Supabase)
2. **Crear buckets críticos** (profile-photos, listing-photos)
3. **Crear RPCs faltantes** (get_test_status, get_my_matches)
4. **Configurar Realtime** (messages + notifications)
5. **Conectar CreateListing** a DB
6. **Completar TODO-d** (Profile/Discover mostrar test status)
