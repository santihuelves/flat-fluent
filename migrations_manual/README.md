# migrations_manual

## Estado de esta carpeta

Esta carpeta se conserva como **runbook/manual historico** de cambios SQL aplicados en Lovable Cloud.

### Importante

`migrations_manual` **no es la fuente canonica del esquema**.

La fuente canonica del backend SQL en este repo es:
- [supabase/migrations](C:/Users/Santi/Documents/Codex/2026-04-27/https-github-com-santihuelves-flat-fluent/supabase/migrations)

Por tanto, esta carpeta debe leerse como:
- registro de bloques ejecutados manualmente,
- ayuda para reconstruir contexto operativo,
- y documentacion de demo/testing.

No debe tratarse como una segunda linea oficial de migraciones.

## Proyecto Supabase al que apunta este runbook

Los bloques de esta carpeta se redactaron para el proyecto Supabase:
- `iahjepkbjapxqsdsgiob`

Antes de ejecutar cualquier SQL manual:
1. confirma el project ref activo;
2. revisa si el equivalente canonico ya existe en `supabase/migrations`;
3. evita re-ejecutar SQL en produccion sin una revision de impacto.

## Bloques manuales historicos

Estos archivos documentan una aplicacion manual historica al backend de Lovable Cloud:

| Orden | Archivo | Contexto |
|---|---|---|
| 1 | `01_test_flags.sql` | Flags de test en `convinter_profiles` y RPC `convinter_request_full_test` |
| 2 | `02_storage_buckets.sql` | Buckets de storage y policies |
| 3 | `03_critical_rpcs.sql` | RPCs criticas iniciales y activacion de realtime |
| 4 | `04_listing_helpers.sql` | Helpers RPC de anuncios |
| 5 | `05_intentions.sql` | Intenciones de perfil y RPCs relacionadas |

### Regla de lectura

Si necesitas localizar la version canonica de estos cambios, buscala en:
- [supabase/migrations](C:/Users/Santi/Documents/Codex/2026-04-27/https-github-com-santihuelves-flat-fluent/supabase/migrations)

No asumas que el archivo de esta carpeta es la unica o ultima version valida.

## Demo, testing y seeds

Los siguientes archivos **no son migraciones de producto**. Sirven para testing manual, poblacion demo o fixes asociados a ese entorno:

| Archivo | Uso | Riesgo si se ejecuta sin revisar |
|---|---|---|
| `06_demo_full_seed.sql` | Crea usuarios, perfiles, anuncios, matches, compatibilidad, chats, mensajes y notificaciones demo | Introduce datos ficticios en la base |
| `07_demo_cleanup.sql` | Limpia el paquete demo | Puede borrar datos demo si se ejecuta en el entorno equivocado |
| `08_fix_get_my_matches.sql` | Fix manual de RPC para matches demo | Puede redefinir una funcion ya versionada en migraciones canonicas |
| `09_chat_read_receipts.sql` | Fix manual de recibos de lectura | Redefine SQL operativo si se reaplica sin revisar |
| `10_consent_connections_overview.sql` | RPC manual de resumen de conexiones | Puede solaparse con migraciones canonicas |
| `11_filter_resolved_consent_requests.sql` | Ajuste manual de filtros en conexiones | Puede solaparse con migraciones canonicas |

### Credenciales demo historicas

```text
demo.busca@covinter.test / Test1234!
demo.ofrece@covinter.test / Test1234!
```

Todos los usuarios demo usan la misma contrasena `Test1234!`.

## No ejecutar en produccion sin revision

No ejecutes automaticamente en produccion:
- ningun seed demo,
- ningun cleanup demo,
- ningun fix manual de RPCs,
- ni ningun bloque de esta carpeta si no confirmas antes su equivalente en `supabase/migrations`.

## Notas operativas historicas

- Muchos bloques intentan ser idempotentes (`IF NOT EXISTS`, `CREATE OR REPLACE`, `ON CONFLICT DO NOTHING`), pero no todos los objetos SQL lo son.
- `CREATE POLICY` puede fallar si la policy ya existe.
- Tras cambios de esquema aplicados desde Lovable, `src/integrations/supabase/types.ts` puede regenerarse automaticamente.

## Verificacion historica

Estas consultas se dejan como referencia de comprobacion manual:

```sql
SELECT column_name FROM information_schema.columns
 WHERE table_name='convinter_profiles' AND column_name LIKE '%test%';

SELECT id FROM storage.buckets;

SELECT tablename FROM pg_publication_tables
 WHERE pubname='supabase_realtime';

SELECT routine_name FROM information_schema.routines
 WHERE routine_schema='public'
   AND routine_name IN (
     'convinter_get_test_status',
     'convinter_get_my_matches',
     'convinter_create_listing',
     'convinter_request_full_test',
     'convinter_set_intention',
     'convinter_mark_chat_read'
   );
```

Esperado historico:
- 6 columnas de test
- 4 buckets
- 2 tablas en realtime
- funciones clave presentes
