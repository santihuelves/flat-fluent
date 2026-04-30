# Migración manual al backend de Lovable Cloud

Pega los 5 bloques **en orden** en el SQL Editor del dashboard de Supabase del proyecto `iahjepkbjapxqsdsgiob` (Lovable → Cloud → Open Backend → SQL Editor → New query). Pulsa **Run** entre cada uno.

| Orden | Archivo | Qué hace |
|---|---|---|
| 1 | `01_test_flags.sql` | Columnas `quick_test_*` / `full_test_*` en `convinter_profiles` + RPC `convinter_request_full_test` |
| 2 | `02_storage_buckets.sql` | Buckets `listing-photos`, `verification-selfies`, `verification-docs` + policies |
| 3 | `03_critical_rpcs.sql` | RPCs `convinter_get_test_status`, `convinter_get_my_matches`, `convinter_mark_chat_read` + Realtime para `convinter_messages` y `convinter_notifications` |
| 4 | `04_listing_helpers.sql` | RPCs `convinter_create_listing`, `convinter_update_listing`, `convinter_delete_listing` |
| 5 | `05_intentions.sql` | Enums + tabla `convinter_profile_intentions` + RPCs `convinter_set_intention`, `convinter_remove_intention`, `convinter_get_intentions` |

## Datos demo para pruebas manuales

Estos bloques no son migraciones de producto. Son un paquete reversible para poblar el preview con usuarios, perfiles, anuncios, matches, compatibilidad, chats, mensajes y notificaciones ficticias.

| Archivo | Que hace |
|---|---|
| `06_demo_full_seed.sql` | Crea 32 usuarios demo, 32 perfiles, 32 anuncios, intenciones, respuestas, matches, compatibilidad, chats, mensajes y notificaciones |
| `07_demo_cleanup.sql` | Borra por completo el paquete demo antes de produccion |
| `08_fix_get_my_matches.sql` | Reinstala la RPC correcta para que la pantalla Matches cargue los consentimientos demo |
| `09_chat_read_receipts.sql` | Anade recibos de lectura reales para que los mensajes sin leer se limpien al abrir un chat |
| `10_consent_connections_overview.sql` | Anade la RPC de resumen para solicitudes recibidas, solicitudes enviadas y conexiones activas |
| `11_filter_resolved_consent_requests.sql` | Oculta solicitudes pendientes que ya tienen una conexion activa suficiente |

Credenciales demo principales:

```text
demo.busca@covinter.test / Test1234!
demo.ofrece@covinter.test / Test1234!
```

Todos los usuarios demo usan la misma contrasena `Test1234!`.

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
