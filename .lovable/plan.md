## Objetivo

Hoy el corazón de `/discover` es decorativo: solo anima la tarjeta. Lo convertimos en un **like real** con detección de **match mutuo**: si A y B se dan like, se crea consent nivel 1 automático, ambos reciben notificación y aparecen en `/matches`. Mientras sea unilateral, el otro **no se entera** (coherente con el modelo de privacidad de Convinter).

## Comportamiento

- A pulsa ❤ sobre B → se guarda el like en backend. B no recibe ninguna notificación.
- Si B ya había dado like a A (o lo da más tarde) → se detecta el match:
  - Se crea/actualiza `convinter_pair_consent` a `consent_level = 1`.
  - Se inserta notificación `match_created` para ambos.
  - Aparecen en `/matches` y pueden ver score de compatibilidad y abrir chat.
- ✕ (pass) sigue siendo solo visual (descartar tarjeta); opcionalmente lo guardamos para no volver a mostrar el perfil — lo dejo fuera de este plan salvo que lo pidas.
- Si A ya tenía consent ≥ 1 con B por la vía clásica ("Solicitar contacto"), el like simplemente no hace nada nuevo.

## Cambios de backend (RPC + tabla, en `migrations_manual/18_discover_likes.sql`)

Nueva tabla `convinter_likes`:

```text
liker_id uuid, liked_id uuid, created_at timestamptz
PK (liker_id, liked_id)
RLS: SELECT/INSERT/DELETE solo del propio liker_id
GRANT a authenticated + service_role
```

Nuevo RPC `convinter_like_profile(p_target uuid) returns jsonb`:

1. `auth.uid()` obligatorio; `convinter_guard('like')` (rate limit).
2. `convinter_assert_not_blocked(p_target)`.
3. `INSERT ... ON CONFLICT DO NOTHING` en `convinter_likes`.
4. Comprobar si existe el like recíproco (B → A).
5. Si **sí** → match:
   - `UPSERT` en `convinter_pair_consent` con `(least, greatest)` y `consent_level = greatest(actual, 1)`.
   - Insertar notificación `match_created` para A y B (payload con el otro `user_id`).
   - Invalidar / recomputar `convinter_compat_cache` si hace falta.
   - Devolver `{ ok: true, matched: true, other_user, consent_level }`.
6. Si **no** → devolver `{ ok: true, matched: false }`.

Toda la lógica vive en el RPC (regla del proyecto: business logic en server).

## Cambios de frontend

**`src/pages/Discover.tsx`**
- `handleLike` async: llama `supabase.rpc('convinter_like_profile', { p_target: currentProfile.user_id })` antes de avanzar tarjeta.
- Si `matched: true` → `toast.success('¡Match con ' + nombre + '!')` con acción "Abrir chat" que navega a `/matches` (o directo al chat si ya existe).
- Manejo de errores: si falla, mostrar toast pero no bloquear el swipe.
- Estado local `likedIds: Set<string>` para no permitir doble like en la misma sesión.

**`src/components/layout/NotificationsMenu.tsx`** (y/o `useNotifications`)
- Añadir render del tipo `match_created`: "Has hecho match con {nombre}" → enlaza a `/matches`.

**`src/pages/Matches.tsx`**
- Ningún cambio funcional necesario: `convinter_get_my_matches` ya lista por `pair_consent` ≥ 1.

## Detalles técnicos

- Tabla `convinter_likes` sin trigger; toda la detección de match va dentro del RPC para mantener transacción atómica.
- Notificación: usar helper existente `convinter_notify(user_id, type, payload)` si está disponible; si no, INSERT directo en `convinter_notifications`.
- Rate limit: registrar `like` en `convinter_guard` con un techo razonable (p. ej. 100/día) para evitar spam.
- No tocar el flujo existente de "Solicitar contacto" — los dos caminos coexisten y ambos producen `consent_level ≥ 1`.

## Fuera de alcance

- Guardar pasadas (✕).
- Subir consent a nivel 2 automáticamente (sigue requiriendo solicitud explícita).
- UI nueva de "likes recibidos" — por diseño se mantienen privados hasta que sean mutuos.
