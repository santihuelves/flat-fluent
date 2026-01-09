# Instrucciones para Aplicar Migraciones Críticas

## Resumen
He creado 3 migraciones SQL que resuelven los puntos críticos del backend:

1. **20260110000000_create_storage_buckets.sql** - Crea buckets de Storage
2. **20260110000001_add_critical_rpcs.sql** - Añade RPCs para test status y matches
3. **20260110000002_create_listing_helper.sql** - RPCs para crear/editar listings

Además, necesitas aplicar la migración pendiente del test:
4. **20260108120000_add_test_flags.sql** - Flags de test rápido/exhaustivo

---

## Pasos para Aplicar (en orden)

### 1. Aplicar migración de flags de test (CRÍTICO - ya existe pero no aplicada)

1. Ve a Supabase Dashboard → SQL Editor
2. Pega el contenido de `supabase/migrations/20260108120000_add_test_flags.sql`
3. Ejecuta

**Qué hace:**
- Añade columnas `quick_test_completed`, `full_test_completed`, etc. a `convinter_profiles`
- Crea RPC `convinter_request_full_test(p_target uuid)`

**Impacto:** Sin esto, el test falla al guardar (ya lo parcheamos en frontend pero es temporal)

---

### 2. Crear Storage Buckets (CRÍTICO - bloqueante para fotos)

1. Ve a Supabase Dashboard → SQL Editor
2. Pega el contenido de `supabase/migrations/20260110000000_create_storage_buckets.sql`
3. Ejecuta

**Qué hace:**
- Crea bucket `profile-photos` (URGENTE - EditProfileSheet ya lo usa)
- Crea bucket `listing-photos` (para CreateListing)
- Crea buckets de verificación (`verification-selfies`, `verification-docs`)
- Configura políticas RLS para cada bucket

**Impacto:** Sin esto, no se pueden subir fotos de perfil ni de anuncios

---

### 3. Añadir RPCs críticos (ALTA PRIORIDAD)

1. Ve a Supabase Dashboard → SQL Editor
2. Pega el contenido de `supabase/migrations/20260110000001_add_critical_rpcs.sql`
3. Ejecuta

**Qué hace:**
- Crea `convinter_get_test_status(p_user uuid)` - ver qué test completó un usuario
- Crea `convinter_get_my_matches()` - listar matches reales con scores y últimos mensajes
- Habilita Realtime para `convinter_messages` y `convinter_notifications`
- Crea `convinter_mark_chat_read(p_chat_id uuid)` - marcar mensajes como leídos

**Impacto:** 
- Matches.tsx dejará de ser mock
- Profile/Discover podrán mostrar estado de test
- Chat recibirá mensajes en tiempo real

---

### 4. RPCs para Listings (ALTA PRIORIDAD)

1. Ve a Supabase Dashboard → SQL Editor
2. Pega el contenido de `supabase/migrations/20260110000002_create_listing_helper.sql`
3. Ejecuta

**Qué hace:**
- Crea `convinter_create_listing(...)` - crear anuncio desde frontend
- Crea `convinter_update_listing(...)` - editar anuncio
- Crea `convinter_delete_listing(p_listing_id)` - desactivar anuncio

**Impacto:** CreateListing.tsx dejará de ser mock y guardará en DB real

---

## Verificación Post-Migración

### Storage Buckets
En Supabase Dashboard → Storage, deberías ver:
- ✅ `profile-photos` (público)
- ✅ `listing-photos` (público)
- ✅ `verification-selfies` (privado)
- ✅ `verification-docs` (privado)

### Database Functions
En Supabase Dashboard → Database → Functions, busca:
- ✅ `convinter_get_test_status`
- ✅ `convinter_get_my_matches`
- ✅ `convinter_create_listing`
- ✅ `convinter_update_listing`
- ✅ `convinter_delete_listing`
- ✅ `convinter_request_full_test`
- ✅ `convinter_mark_chat_read`

### Realtime
En Supabase Dashboard → Database → Replication:
- ✅ `convinter_messages` debe estar en la publicación `supabase_realtime`
- ✅ `convinter_notifications` debe estar en la publicación `supabase_realtime`

---

## Siguiente Paso: Actualizar Frontend

Después de aplicar las migraciones, necesito actualizar el código frontend para usar las nuevas RPCs:

1. **Matches.tsx** - conectar a `convinter_get_my_matches()`
2. **Profile.tsx / Discover.tsx** - mostrar estado de test con `convinter_get_test_status()`
3. **Chat.tsx** - añadir suscripción Realtime para mensajes
4. **CreateListing.tsx** - conectar a `convinter_create_listing()`
5. **Actualizar types.ts** - añadir nuevas funciones

¿Quieres que continúe con la actualización del frontend ahora o prefieres aplicar primero las migraciones y verificar que funcionan?

---

## Troubleshooting

### Error: "relation storage.buckets does not exist"
- Tu instancia de Supabase no tiene Storage habilitado. Ve a Dashboard → Storage y actívalo.

### Error: "permission denied for table storage.objects"
- Las políticas RLS no se aplicaron correctamente. Re-ejecuta la migración de buckets.

### Error: "function convinter_get_test_status does not exist"
- La migración 20260110000001 no se aplicó. Vuelve a ejecutarla.

### Realtime no funciona
- Ve a Dashboard → Database → Replication
- Verifica que `supabase_realtime` incluye `convinter_messages` y `convinter_notifications`
- Si no aparecen, ejecuta manualmente:
  ```sql
  ALTER PUBLICATION supabase_realtime ADD TABLE public.convinter_messages;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.convinter_notifications;
  ```

---

## Notas Importantes

1. **Orden de ejecución**: Aplicar en el orden listado (1 → 2 → 3 → 4)
2. **Backup**: Si tu DB tiene datos importantes, haz backup antes
3. **Testing**: Después de aplicar, prueba subir una foto de perfil para verificar que el bucket funciona
4. **Realtime**: Puede tardar 1-2 minutos en activarse después de la migración

---

¿Todo listo? Avísame cuando hayas aplicado las migraciones y continúo con la actualización del frontend.
