## Sincronización y aplicación

He confirmado que los 4 archivos pedidos ya están sincronizados en `supabase/migrations/`. El primero (`20260528170000_reapply_similarity_scoring_and_invalidate_cache.sql`) ya está aplicado en Lovable Cloud (sesión anterior, espejo `20260528201250_*`), así que solo quedan los 3 nuevos.

## Migraciones a aplicar (en orden)

### 1. `20260601090000_enforce_single_current_intention.sql`
- `CREATE OR REPLACE FUNCTION convinter_set_intention(text, boolean, text, jsonb)`: solo acepta `seek_room`/`offer_room`; al elegir un modo, desactiva el anterior; limpia filas inactivas que bloqueaban el UNIQUE legacy.
- `GRANT EXECUTE ... TO authenticated`.
- Normaliza datos existentes: deja una sola intención activa por perfil (la más reciente/primaria).
- `COMMENT ON TABLE` documentando que `seek_flatmate` es legacy.

### 2. `20260602100000_backfill_offer_room_intentions_from_listings.sql`
- Re-crea `convinter_set_intention` (igual firma) — versión backfill.
- Desactiva todas las intenciones activas `seek_flatmate` y las marca `deprecated_by`.
- Inserta `offer_room` activa para cada owner con listing `room` activo (source = `backfill_active_room_listing`).
- Inserta `seek_room` activa para perfiles legacy `user_type = seeking_room` sin intención activa.
- Sincroniza `profiles.user_type` (`offering_room` / `seeking_room`) según intenciones derivadas.

### 3. `20260603100000_refresh_trust_from_profile_and_listings.sql`
- `convinter_calc_trust_score(uuid)`: suma puntos por display_name, bio>20, foto, idiomas, selfie verificado (30), respuestas test (×2, tope 30), listings activos/completos/verificados. Tope 100.
- `convinter_refresh_trust_score(uuid)`: recalcula y asigna badge gold/silver/bronze/none.
- Triggers AFTER INSERT/UPDATE/DELETE en `convinter_answers`.
- Trigger AFTER INSERT OR UPDATE OF (display_name, handle, bio, photo_url, languages, selfie_verified) en `convinter_profiles`.
- Triggers AFTER INSERT/UPDATE/DELETE en `convinter_listings` (recalcula owner antiguo y nuevo en UPDATE).
- Recalcula trust_score y trust_badge para todos los perfiles existentes.

## Verificaciones tras aplicar

1. **Intenciones únicas**
   ```sql
   select profile_id, count(*) 
   from convinter_profile_intentions 
   where active = true 
   group by profile_id having count(*) > 1;
   ```
   Debe devolver 0 filas.

2. **Backfill offer_room desde listings**
   ```sql
   select l.owner_id, count(distinct l.id) as listings,
          bool_or(pi.active and pi.intention_type='offer_room') as has_offer_intent
   from convinter_listings l
   left join convinter_profile_intentions pi on pi.profile_id = l.owner_id
   where l.listing_type='room' and l.status='active'
   group by l.owner_id;
   ```

3. **Trust recalculado**
   ```sql
   select user_id, display_name, trust_score, trust_badge 
   from convinter_profiles 
   order by updated_at desc limit 20;
   ```
   Verificar especialmente usuarioJ.

4. **Compatibilidad**
   Llamar `convinter_compute_and_cache_guarded` para un par con 8+ respuestas comunes y consentimiento, confirmar `scoring_model = convinter_full_similarity_v2` y `mismatches` presentes.

## Riesgos / notas

- Las 3 migraciones son idempotentes (CREATE OR REPLACE, DROP TRIGGER IF EXISTS, ON CONFLICT DO UPDATE).
- No tocan frontend, algoritmo de scoring, ni consent.
- Los triggers de trust pueden encarecer ligeramente updates masivos en `convinter_listings`/`convinter_answers`, pero no hay inserts en bulk previstos.
- El `UPDATE profiles.user_type` toca la tabla legacy; está alineado con `PROJECT_CONTEXT.md` (compatibilidad temporal).

Lo aplico en una sola llamada `supabase--migration` con los 3 bloques consecutivos, y luego corro las 4 verificaciones.