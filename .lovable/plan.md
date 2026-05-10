## Aplicar migración: fix_delete_listing_status

Aplicar el SQL de `supabase/migrations/20260510093000_fix_delete_listing_status.sql` al backend Lovable Cloud (`iahjepkbjapxqsdsgiob`).

### Cambio
`CREATE OR REPLACE` de la RPC `public.convinter_delete_listing(uuid)` para que el soft delete use `status = 'deleted'` en vez de `status = 'inactive'`.

### Se mantiene
- `SECURITY DEFINER` con `SET search_path = public`
- Validación `auth.uid() IS NULL` → `NOT_AUTHENTICATED`
- Comprobación `owner_id = me` → `NOT_OWNER`
- Respuesta JSON `{ok, code}` / `{ok: true}`
- `GRANT EXECUTE ... TO authenticated`

### No se toca
- UI, otros archivos, schema, otras RPCs, estados (`active`/`paused`/`deleted`).

### Verificación posterior
Consulta a `pg_proc` para confirmar que el cuerpo de la función contiene `'deleted'` y no `'inactive'`.