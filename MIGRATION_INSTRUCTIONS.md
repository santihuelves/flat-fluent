# Instrucciones Para Aplicar Migraciones

## Estado Actual

El frontend ya usa backend real para:

- `Listings.tsx` con `convinter_search_listings`
- `ListingDetail.tsx` con `convinter_get_listing_detail`
- `CreateListing.tsx` con `convinter_create_listing` y Storage `listing-photos`
- `Matches.tsx` con `convinter_get_my_matches`
- `PublicProfile.tsx` con `convinter_get_profile_detail`

Para que todo funcione, esas funciones y buckets tienen que existir en la base de datos que usa Lovable/Supabase.

## Camino Recomendado: Lovable Cloud

Si el proyecto esta desplegado/gestionado en Lovable Cloud, la opcion recomendada es aplicar los cambios con la herramienta de migraciones de Lovable, no pegando SQL manualmente en Supabase Dashboard.

Motivos:

- Lovable aplica el SQL en el proyecto correcto.
- Regenera `src/integrations/supabase/types.ts` despues de los cambios.
- Los cambios quedan trazados dentro del flujo de Lovable.
- Si una policy, funcion o tipo ya existe, Lovable devuelve el error en el flujo de migracion y se puede corregir alli.

Mensaje recomendado para Lovable:

```text
Aplica las migraciones pendientes con la herramienta de migracion de Lovable, una a una y verificando despues de cada bloque.
No las voy a pegar manualmente en Supabase SQL Editor.
```

Si Lovable ha creado una carpeta `migrations_manual/` con bloques consolidados y verificados contra el backend real, usa esos bloques en el orden que indique Lovable.

Nota: en esta copia local del repo no existe `migrations_manual/` ahora mismo. Si Lovable la crea en su entorno, conviene sincronizar despues esos cambios hacia este repo para que no haya dos fuentes de verdad.

## Lovable Y La Base De Datos

Aunque el proyecto se gestione desde Lovable, la app esta usando Supabase como backend real:

```text
VITE_SUPABASE_PROJECT_ID
VITE_SUPABASE_URL
VITE_SUPABASE_PUBLISHABLE_KEY
```

Eso significa que las migraciones no se aplican "en React", sino en la base de datos conectada al proyecto de Lovable. Puedes hacerlo de dos maneras:

- Recomendado: desde Lovable, usando su herramienta de migraciones.
- Alternativa: desde Supabase Dashboard, entrando al proyecto conectado a Lovable y usando SQL Editor.

`supabase/config.toml` en esta copia local esta alineado con el project ref usado por el frontend. No subas `.env` al repositorio.

## Alternativa Manual: SQL Editor

Usa esta ruta solo si Lovable no puede aplicar las migraciones por su herramienta.

Supabase Dashboard -> SQL Editor -> New query

Pega y ejecuta cada archivo en este orden:

1. `supabase/migrations/20260108120000_add_test_flags.sql`
2. `supabase/migrations/20260110000000_create_storage_buckets.sql`
3. `supabase/migrations/20260110000001_add_critical_rpcs.sql`
4. `supabase/migrations/20260110000002_create_listing_helper.sql`
5. `supabase/migrations/20260111000000_add_profile_intentions.sql`
6. `supabase/migrations/20260113000000_include_listing_photos_in_detail.sql`
7. `supabase/migrations/20260113000001_fix_get_my_matches.sql`

Si Lovable te permite ejecutar SQL directamente, usa el mismo orden ahi. Si Lovable propone bloques consolidados en `migrations_manual/`, prioriza esos bloques porque estaran ajustados al estado real del backend.

## Que Desbloquea Cada Bloque

`20260108120000_add_test_flags.sql`
Anade flags del test rapido/completo y `convinter_request_full_test`.

`20260110000000_create_storage_buckets.sql`
Crea buckets de fotos:

- `profile-photos`
- `listing-photos`
- `verification-selfies`
- `verification-docs`

`20260110000001_add_critical_rpcs.sql`
Anade:

- `convinter_get_test_status`
- `convinter_get_my_matches`
- `convinter_mark_chat_read`
- Realtime para mensajes/notificaciones

`20260110000002_create_listing_helper.sql`
Anade:

- `convinter_create_listing`
- `convinter_update_listing`
- `convinter_delete_listing`

`20260111000000_add_profile_intentions.sql`
Anade intenciones de perfil y RPCs relacionadas.

`20260113000000_include_listing_photos_in_detail.sql`
Actualiza `convinter_get_listing_detail` para devolver `photos`.

`20260113000001_fix_get_my_matches.sql`
Corrige `convinter_get_my_matches` para no mezclar datos del consentimiento con datos del perfil.

## Verificacion

Storage:

- Existe bucket publico `profile-photos`
- Existe bucket publico `listing-photos`
- Puedes subir una imagen autenticado a `listing-photos/<user-id>/...`

Database Functions:

- `convinter_create_listing`
- `convinter_search_listings`
- `convinter_get_listing_detail`
- `convinter_get_my_matches`
- `convinter_get_profile_detail`
- `convinter_compute_and_cache_guarded`

Prueba minima despues de aplicar:

1. Inicia sesion en la app.
2. Ve a `/create-listing`.
3. Crea un anuncio con una foto.
4. Comprueba que navega a `/listing/<id>`.
5. Comprueba que `/listings` muestra el anuncio.

## CLI Opcional

Si instalas Supabase CLI y haces login, tambien podrias aplicar con:

```sh
supabase db push
```

Pero para este proyecto, prioriza Lovable Cloud si esta disponible. La CLI local solo conviene si el `project_id` y la sesion apuntan con certeza al mismo proyecto que usa Lovable.
