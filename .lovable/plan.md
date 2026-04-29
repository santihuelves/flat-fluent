## Objetivo

Aplicar `migrations_manual/06_demo_full_seed.sql` (seed demo reversible, 434 líneas) contra el backend de Lovable Cloud usando la tool oficial de migraciones, y reportar el resultado.

## Qué hace el seed (resumen)

Es un paquete demo idempotente y reversible que crea:

- 32 usuarios en `auth.users` + `auth.identities` (password `Test1234!` para todos)
  - Principales: `demo.busca@covinter.test` y `demo.ofrece@covinter.test`
- 32 filas en `public.profiles` y `public.convinter_profiles`
- 32 intenciones en `convinter_profile_intentions`
- 32 anuncios en `convinter_listings` (prefijo `[DEMO]` en el título)
- Respuestas del test rápido (`convinter_answers`, test_id `quick`)
- Consents y compatibilidad cacheada para el usuario 1 y 2
- 3 chats demo + mensajes con prefijo `[DEMO]`
- 2 notificaciones `DEMO_MATCH_READY`

Antes de insertar hace `DELETE` de cualquier rastro previo del propio paquete (matching por UUIDs `00000000-0000-4000-...`, emails `demo.*@covinter.test`, handles `demo_%`, títulos `[DEMO]%`), por lo que es seguro re-ejecutar.

Todo va dentro de `BEGIN; ... COMMIT;`.

## Plan de ejecución

1. Llamar a la tool de migraciones con el contenido íntegro de `migrations_manual/06_demo_full_seed.sql`.
2. Esperar la confirmación del usuario en el panel de migraciones (paso obligatorio del flujo).
3. Una vez aplicada, ejecutar las verificaciones rápidas que vienen al final del propio archivo:
   ```sql
   SELECT count(*) FROM auth.users
    WHERE email LIKE 'demo.%@covinter.test'
       OR email LIKE 'demo.user%@covinter.test';   -- esperado: 32
   SELECT count(*) FROM public.convinter_listings
    WHERE title LIKE '[DEMO]%';                    -- esperado: 32
   SELECT count(*) FROM public.convinter_messages
    WHERE body LIKE '[DEMO]%';                     -- esperado: 7
   ```
4. Reportar los conteos al usuario.

## Manejo de errores

Si la migración falla (por ejemplo por una columna o enum que no exista en el esquema actual, o por una FK), **no se intentará arreglar nada automáticamente**. Mostraré:

- El mensaje de error exacto devuelto por Postgres.
- El bloque `INSERT`/`DELETE` concreto que ha fallado.
- Una sugerencia mínima del posible motivo (sin tocar nada todavía).

Esperaré nuevas instrucciones tuyas antes de seguir.

## Riesgos conocidos

- El seed escribe en `auth.users` y `auth.identities` directamente. Es intencional (las FKs del esquema apuntan ahí) y reversible vía `07_demo_cleanup.sql`. **No usar nunca en producción.**
- Si alguna columna del seed (`quick_test_completed`, intenciones, listing verification) no existe, significaría que faltan migraciones previas (01–05). En ese caso pararé y avisaré.
- El `ON CONFLICT (profile_id, intention_type, active)` requiere que exista esa restricción única en `convinter_profile_intentions` (creada en `05_intentions.sql`). Si no existe, fallará y lo reportaré literal.

## Reversión

`migrations_manual/07_demo_cleanup.sql` ya existe en el repo y revierte todo el paquete. No se ejecuta en este plan.