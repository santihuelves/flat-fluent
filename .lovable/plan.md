# Compatibilidad en dos niveles: perfil primero, test después

## Problema

Hoy `convinter_compute_and_cache_guarded` solo sabe puntuar a partir de las respuestas del test exhaustivo (`convinter_answers` con `test_id = 'convinter_full'`). Si uno de los dos no lo ha rellenado (o hay menos de 8 respuestas en común), la API devuelve `INSUFFICIENT_COMMON_ANSWERS` y la UI muestra "No hay suficientes respuestas comunes para calcular la compatibilidad detallada" — el usuario nunca ve un porcentaje, aunque ambos tengan perfil completo.

## Objetivo

Que **siempre** haya un porcentaje de compatibilidad visible en cuanto ambos tengan perfil mínimamente relleno, calculado a partir de los datos del perfil. El test exhaustivo deja de ser un requisito y pasa a ser un **refinamiento** que sube la fiabilidad y aporta el desglose detallado.

## Qué se va a cambiar

### 1. Backend (nueva migración `migrations_manual/20_profile_compatibility.sql` + equivalente Lovable Cloud)

**Nueva función `convinter_score_profile_pair(a uuid, b uuid)`** (security definer, interna):

- Lee de `convinter_profiles` + `profiles` + `convinter_profile_intentions` para cada usuario.
- Calcula un score 0–100 a partir de señales del perfil con pesos fijos:
  - **Estilo de vida / convivencia** (peso 30): tags `trait_smoker_*`, `trait_pet_*`, `trait_household_*`, `trait_minor_*` + `lifestyle_tags` solapados.
  - **Intenciones** (peso 25): compatibilidad entre `convinter_profile_intentions.intention_type` (ej. `seek_room` ↔ `offer_room`, `seek_flatmate` ↔ `seek_flatmate`) y `urgency` similar.
  - **Ubicación** (peso 15): misma provincia/ciudad o comunidad autónoma.
  - **Idiomas** (peso 10): proporción de idiomas en común sobre la unión.
  - **Presupuesto y estancia** (peso 10): solape entre rangos `budget_min/budget_max` y `min_stay_months` compatible con disponibilidad.
  - **Dealbreakers** (peso 10, restador fuerte): si un dealbreaker de A coincide con un trait declarado de B (p. ej. A no quiere fumadores y B es `trait_smoker_yes`), penalización dura.
- Devuelve `jsonb` con `score`, `signals_used` (cuántos de los 6 bloques tenían datos para puntuar) y `breakdown` por bloque.

**Modificar `convinter_compute_and_cache_guarded(p_other_user, p_detail_level)`:**

- Calcular siempre primero `profile_score` con la función nueva.
- Calcular `test_score` y `common_n` como hoy (lógica v3 ya existente, sin tocarla).
- Lógica de salida:
  - Si `common_n >= 8` → `final_score = round(0.4 * profile_score + 0.6 * test_score)`, `source = 'profile+test'`.
  - Si `common_n < 8` → `final_score = profile_score`, `source = 'profile_only'`, `can_show_score = true` (ya no devuelve `INSUFFICIENT_COMMON_ANSWERS`).
  - Si `profile_score` no se puede calcular por perfiles vacíos (< 2 señales con datos en ambos) → entonces sí `code = 'INSUFFICIENT_PROFILE_DATA'`.
- El `breakdown` devuelto incluye: `source`, `profile_score`, `test_score` (puede ser `null`), `common_questions`, `profile_signals_used`, `mismatches` del test (vacío si no hay test), y un campo `test_available: boolean` para que la UI sepa si invitar al test exhaustivo.
- Cacheado se mantiene en `convinter_compat_cache` con `scoring_model = 'convinter_profile_v1+test_v3'`. Se invalida automáticamente porque el modelo cambia y el código ya borra cachés con modelo distinto (ver migración 16, líneas finales).

### 2. Frontend (`src/pages/PublicProfile.tsx`)

- Quitar el caso "INSUFFICIENT_COMMON_ANSWERS" como bloqueo: ahora la RPC ya devuelve score base. Mantener `INSUFFICIENT_PROFILE_DATA` como el nuevo estado vacío ("Aún no hay datos suficientes en el perfil para calcular compatibilidad").
- Cuando `breakdown.source === 'profile_only'`, mostrar el porcentaje + una nota tipo: "Esta compatibilidad se calcula con los datos del perfil. Para un análisis más detallado, pídele que rellene el test exhaustivo." con un botón para `convinter_request_full_test` (ya existe).
- Cuando `breakdown.source === 'profile+test'`, mostrar el porcentaje como ahora + el desglose de mismatches del test exhaustivo.
- Pequeño badge/leyenda con el origen ("Basado en perfil" vs "Perfil + test exhaustivo") para que el usuario entienda la diferencia.

### 3. Fuera de alcance

- No se toca el flujo del test exhaustivo en sí (`/test`).
- No se cambian los pesos del scoring del test (v3 sigue igual).
- No se tocan los gates de consentimiento, ni la nueva restricción de match para chat (migración 19).

## Resultado esperado

- Cualquier visita a `/u/:id` muestra siempre un porcentaje en cuanto ambos perfiles tienen datos mínimos (≈2 de los 6 bloques).
- Si ninguno ha hecho el test exhaustivo: porcentaje "base perfil" + CTA para pedir el test.
- Si uno o ambos lo han hecho y hay ≥8 respuestas comunes: porcentaje combinado (40% perfil + 60% test) + desglose detallado actual.
- Solo se ve el mensaje "datos insuficientes" cuando los perfiles realmente están casi vacíos.
