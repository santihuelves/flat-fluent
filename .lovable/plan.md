
# Migración manual al backend de Lovable Cloud

## Cómo abrir el SQL Editor

Tu app usa el backend de **Lovable Cloud** (no el proyecto `glsyzczyisengwwieuvt` que aparece en `supabase/config.toml`, ese está desconectado). Para entrar al SQL Editor del backend correcto:

1. En Lovable, barra lateral → **Cloud** → botón **Open Backend** (te lleva al dashboard de Supabase del proyecto `iahjepkbjapxqsdsgiob`).
2. Dentro del dashboard → **SQL Editor** → **New query**.
3. Pegar cada bloque de abajo, **uno por uno y en orden**, pulsando **Run** entre cada uno.

Estado verificado del backend ahora mismo:
- Tablas `convinter_*`: 17 (faltan columnas de test y la tabla `convinter_profile_intentions`)
- Buckets: solo `profile-photos`
- Realtime: ninguna tabla en `supabase_realtime`
- RPCs pendientes (test_status, my_matches, create_listing, set_intention, …): **ninguno existe**

---

## Bloque 1 — Flags de test rápido / exhaustivo

Añade columnas a `convinter_profiles` y crea `convinter_request_full_test`. Sin esto, el test no guarda el estado de "completado".

```sql
ALTER TABLE public.convinter_profiles
  ADD COLUMN IF NOT EXISTS quick_test_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS quick_test_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS full_test_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS full_test_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS full_test_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS full_test_requested_by uuid;

CREATE OR REPLACE FUNCTION public.convinter_request_full_test(p_target uuid)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE me uuid := auth.uid();
BEGIN
  IF me IS NULL THEN RETURN jsonb_build_object('ok', false, 'code', 'NOT_AUTHENTICATED'); END IF;
  IF p_target IS NULL OR p_target = me THEN RETURN jsonb_build_object('ok', false, 'code', 'INVALID_TARGET'); END IF;
  PERFORM public.convinter_assert_not_blocked(p_target);
  UPDATE public.convinter_profiles
    SET full_test_requested_at = now(), full_test_requested_by = me
    WHERE user_id = p_target;
  PERFORM public.convinter_notify(p_target, 'REQUEST_FULL_TEST', jsonb_build_object('from', me));
  RETURN jsonb_build_object('ok', true);
END; $$;

GRANT EXECUTE ON FUNCTION public.convinter_request_full_test(uuid) TO authenticated;
```

---

## Bloque 2 — Buckets de Storage (`listing-photos`, verificación)

`profile-photos` ya existe, así que solo creamos los que faltan + sus políticas RLS. Contenido literal de `supabase/migrations/20260110000000_create_storage_buckets.sql` quitando el bucket ya creado y sus policies. Pega tal cual.

```sql
-- listing-photos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('listing-photos','listing-photos', true, 5242880,
        ARRAY['image/jpeg','image/jpg','image/png','image/webp'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for listing photos"
  ON storage.objects FOR SELECT USING (bucket_id = 'listing-photos');
CREATE POLICY "Authenticated users can upload listing photos"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'listing-photos' AND auth.role() = 'authenticated');
CREATE POLICY "Users can update own listing photos"
  ON storage.objects FOR UPDATE USING (
    bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can delete own listing photos"
  ON storage.objects FOR DELETE USING (
    bucket_id = 'listing-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- verification-selfies (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('verification-selfies','verification-selfies', false, 3145728,
        ARRAY['image/jpeg','image/jpg','image/png'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own verification selfies"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'verification-selfies' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can read own verification selfies"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'verification-selfies' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Moderators can read all verification selfies"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'verification-selfies'
    AND EXISTS (SELECT 1 FROM public.convinter_moderators WHERE user_id = auth.uid()));

-- verification-docs (privado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('verification-docs','verification-docs', false, 10485760,
        ARRAY['image/jpeg','image/jpg','image/png','application/pdf'])
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload own verification docs"
  ON storage.objects FOR INSERT WITH CHECK (
    bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Users can read own verification docs"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'verification-docs' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "Moderators can read all verification docs"
  ON storage.objects FOR SELECT USING (
    bucket_id = 'verification-docs'
    AND EXISTS (SELECT 1 FROM public.convinter_moderators WHERE user_id = auth.uid()));
```

Si ya hay alguna policy con el mismo nombre, Postgres dará error en esa sentencia y podrás continuar ignorándola.

---

## Bloque 3 — RPCs críticos + Realtime

Crea `convinter_get_test_status`, `convinter_get_my_matches`, `convinter_mark_chat_read` y activa Realtime. Es el contenido de `20260110000001_add_critical_rpcs.sql` (ya lo tienes en el repo, pégalo entero). Resumen de lo que añade:

- `convinter_get_test_status(p_user)` → estado de test rápido / exhaustivo de un usuario.
- `convinter_get_my_matches(limit, offset)` → matches reales con consent + score + último mensaje + unread.
- `convinter_mark_chat_read(chat_id)` → placeholder para marcar leído.
- `ALTER PUBLICATION supabase_realtime ADD TABLE convinter_messages, convinter_notifications`.

Copia el archivo `supabase/migrations/20260110000001_add_critical_rpcs.sql` completo y ejecútalo.

---

## Bloque 4 — RPCs de listings

Contenido de `supabase/migrations/20260110000002_create_listing_helper.sql`: crea `convinter_create_listing`, `convinter_update_listing`, `convinter_delete_listing`. Copia el archivo entero y ejecútalo.

---

## Bloque 5 — Sistema de intenciones (tabla + enums + RPCs)

`fix_rpcs_intentions.sql` asume que existen el enum `convinter_intention_type`, el enum `convinter_urgency_level` y la tabla `convinter_profile_intentions`. **Ninguno existe**, así que hay que crearlos antes de los RPCs. Pega esto:

```sql
-- Enums
DO $$ BEGIN
  CREATE TYPE public.convinter_intention_type AS ENUM ('seek_room','offer_room','seek_flatmate');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.convinter_urgency_level AS ENUM ('urgent','soon','flexible','exploring');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tabla
CREATE TABLE IF NOT EXISTS public.convinter_profile_intentions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL,
  intention_type public.convinter_intention_type NOT NULL,
  is_primary boolean NOT NULL DEFAULT false,
  priority int NOT NULL DEFAULT 0,
  urgency public.convinter_urgency_level NOT NULL DEFAULT 'flexible',
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profile_id, intention_type, active)
);

ALTER TABLE public.convinter_profile_intentions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "intentions_select_public"
  ON public.convinter_profile_intentions FOR SELECT
  TO authenticated USING (active = true);
CREATE POLICY "intentions_insert_own"
  ON public.convinter_profile_intentions FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = profile_id);
CREATE POLICY "intentions_update_own"
  ON public.convinter_profile_intentions FOR UPDATE
  TO authenticated USING (auth.uid() = profile_id);
CREATE POLICY "intentions_delete_own"
  ON public.convinter_profile_intentions FOR DELETE
  TO authenticated USING (auth.uid() = profile_id);
```

Y a continuación, el contenido íntegro del archivo `fix_rpcs_intentions.sql` (los 3 `CREATE OR REPLACE FUNCTION convinter_set_intention / remove_intention / get_intentions` + sus `GRANT`).

---

## Verificación post-migración

Después de ejecutar los 5 bloques, en SQL Editor corre:

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

Deberías ver: 6 columnas de test, 4 buckets, 2 tablas en realtime, 6 funciones.

---

## Detalles técnicos

- Los SQL son **idempotentes** en lo posible (`IF NOT EXISTS`, `CREATE OR REPLACE`, `ON CONFLICT DO NOTHING`), pero las `CREATE POLICY` no lo son: si re-ejecutas el bloque 2 fallará con "policy already exists". Es esperable.
- Bloque 5 añade tabla nueva → tras ejecutarlo, en Lovable se regenerará automáticamente `src/integrations/supabase/types.ts` la próxima vez que entres en modo build.
- Realtime requiere además que en el dashboard, **Database → Replication**, la publicación `supabase_realtime` aparezca activa para `convinter_messages` y `convinter_notifications` (lo hace el `ALTER PUBLICATION`).
- `supabase/config.toml` apunta a `glsyzczyisengwwieuvt` (proyecto externo) — eso es solo para la CLI local; no afecta a estos SQL porque los pegas en el dashboard del proyecto correcto.

---

## Lo que **no** hace este plan

- No migra datos de `glsyzczyisengwwieuvt` → Lovable Cloud (lo descartaste).
- No toca código frontend. Cuando apliques los SQL, los componentes que ya esperan estos RPCs (Profile, Discover, Test, EditProfileSheet con intenciones) empezarán a funcionar, pero `Matches.tsx` y `CreateListing.tsx` siguen siendo mock — para conectarlos hace falta una segunda tanda de cambios en modo build (puedo encadenarla después si quieres).

Cuando pulses "Approve plan", paso a modo build solo para dejarte estos mismos SQL guardados como archivos `.sql` consolidados en `/migrations_manual/` para que los copies cómodamente, sin aplicar nada automáticamente.
