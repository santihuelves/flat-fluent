# Migración manual al backend de Lovable Cloud

Pega los 5 bloques **en orden** en el SQL Editor del dashboard de Supabase del proyecto `iahjepkbjapxqsdsgiob` (Lovable → Cloud → Open Backend → SQL Editor → New query). Pulsa **Run** entre cada uno.

| Orden | Archivo | Qué hace |
|---|---|---|
| 1 | `01_test_flags.sql` | Columnas `quick_test_*` / `full_test_*` en `convinter_profiles` + RPC `convinter_request_full_test` |
| 2 | `02_storage_buckets.sql` | Buckets `listing-photos`, `verification-selfies`, `verification-docs` + policies |
| 3 | `03_critical_rpcs.sql` | RPCs `convinter_get_test_status`, `convinter_get_my_matches`, `convinter_mark_chat_read` + Realtime para `convinter_messages` y `convinter_notifications` |
| 4 | `04_listing_helpers.sql` | RPCs `convinter_create_listing`, `convinter_update_listing`, `convinter_delete_listing` |
| 5 | `05_intentions.sql` | Enums + tabla `convinter_profile_intentions` + RPCs `convinter_set_intention`, `convinter_remove_intention`, `convinter_get_intentions` |

## Notas

- Todos los SQL son lo más idempotentes posible (`IF NOT EXISTS`, `CREATE OR REPLACE`, `ON CONFLICT DO NOTHING`), pero `CREATE POLICY` no lo es: si re-ejecutas el bloque 2, fallará en las políticas ya creadas. Es esperable.
- Tras aplicar el bloque 5 (tabla nueva), Lovable regenerará `src/integrations/supabase/types.ts` automáticamente.
- Realtime: el `ALTER PUBLICATION` ya activa la replicación. Puedes verificar en Database → Replication.

## Verificación

```sql
SELECT column_name FROM information_schema.columns
 WHERE table_name='convinter_profiles' AND column_name LIKE '%test%';
SELECT id FROM storage.buckets;
SELECT tablename FROM pg_publication_tables WHERE pubname='supabase_realtime';
SELECT routine_name FROM information_schema.routines
 WHERE routine_schema='public'
   AND routine_name IN ('convinter_get_test_status','convinter_get_my_matches',
                        'convinter_create_listing','convinter_request_full_test',
                        'convinter_set_intention','convinter_mark_chat_read');
```

Esperado: 6 columnas de test, 4 buckets, 2 tablas en realtime, 6 funciones.
