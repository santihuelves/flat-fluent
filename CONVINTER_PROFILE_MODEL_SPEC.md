# Convinter Profile And Intentions Spec

## Objective

Define a profile model that separates:

- who the person is,
- what they are looking for,
- what kind of home rules they need or offer,
- and which parts belong to the person versus the household.

This is the baseline for onboarding, profile editing, public profile display, and future matching logic.

## Product principles

1. A user profile is not the same as a listing.
2. A person who is looking for a room does not need the same fields as someone offering one.
3. Person traits and home rules must be stored separately.
4. Public profile should feel useful, not bureaucratic.
5. Sensitive details should be taggable as public, registered-only, or matching-only later.

## Intention types

Current supported intentions:

- `seek_room`
- `seek_flatmate`
- `offer_room`

Future possible intention:

- `seek_home_together`

For now, `seek_flatmate` can cover users who want to find someone first and then rent together.

## Fuente principal y alcance de producto

Reglas de producto para este modelo:

1. El perfil representa a la persona.
2. Las intenciones representan lo que esa persona busca ahora.
3. Los listings representan publicaciones concretas, por ejemplo una habitacion disponible o una busqueda activa de companero/a.
4. `convinter_profile_intentions` es la fuente principal para los datos especificos de intencion.
5. `profiles.user_type` debe tratarse como legacy / compatibilidad temporal.

## Significado de cada intencion

### `seek_room`

Significado:

- La persona busca una habitacion que ya existe y que ya esta disponible, o que lo estara pronto, dentro de una vivienda existente.

Interpretacion de producto:

- La persona necesita un lugar concreto al que mudarse.
- La compatibilidad importa, pero la oferta de vivienda ya existe.
- El lado de listing suele ser una habitacion ofertada o un hogar ya montado.

### `offer_room`

Significado:

- La persona ofrece una habitacion en una vivienda, piso o casa familiar ya existente.

Interpretacion de producto:

- El contexto del hogar ya existe.
- La persona define reglas de convivencia, ocupacion actual y quien puede entrar.
- El lado de listing es una oferta concreta de habitacion.

### `seek_flatmate`

Significado:

- La persona busca companero/a para alquilar una vivienda juntos desde cero, no simplemente para entrar en una habitacion ya disponible.

Interpretacion de producto:

- El objetivo compartido es construir una futura busqueda de vivienda juntos.
- La compatibilidad importa antes de que exista una habitacion concreta.
- El lado de listing puede representar una busqueda activa de futuro companero/a, no una habitacion ya disponible.

## Data blocks

### 1. Core identity

These fields apply to all users.

| Field | Type | Required | Public | Notes |
| --- | --- | --- | --- | --- |
| `display_name` | string | yes | yes | 2-80 chars |
| `bio` | text | yes | yes | 20-500 chars |
| `photos` | string[] | yes | yes | 1-2 photos max |
| `photo_url` | string | yes | yes | First photo, cover image |
| `languages` | string[] | yes | yes | Stored as canonical codes |
| `occupation` | string | yes | yes | 2-80 chars |
| `autonomous_community` | string | yes | yes | Display value |
| `province` | string | yes | yes | Display value |
| `city` | string | yes | yes | Display value |
| `budget_min` | number | yes | partially | Public as range |
| `budget_max` | number | yes | partially | Public as range |
| `move_in_date` | date | yes | yes | Expected move-in |
| `min_stay_months` | number | yes | yes | Minimum stay |
| `verification_level` | enum | no | yes | Already present in `profiles` |
| `selfie_verified` | boolean | no | yes | Already present in `convinter_profiles` |

### 2. Personal living traits

These are traits of the user, not the home.

| Field | Type | Required | Public | Applies to |
| --- | --- | --- | --- | --- |
| `is_smoker` | boolean | yes | yes | all |
| `has_pet` | boolean | yes | yes | all |
| `pet_details` | string | no | registered-only | all |
| `household_size` | enum | yes | yes | seekers only |
| `includes_minor` | boolean | yes | yes | seekers only |
| `sleep_schedule` | enum | no | yes | all |
| `guest_frequency` | enum | no | yes | all |
| `cleanliness_level` | enum | no | yes | all |
| `noise_level` | enum | no | yes | all |

Suggested enums:

- `household_size`: `solo`, `pair`, `group_3_plus`
- `sleep_schedule`: `early`, `mixed`, `late`
- `guest_frequency`: `rarely`, `sometimes`, `often`
- `cleanliness_level`: `low`, `medium`, `high`
- `noise_level`: `quiet`, `normal`, `social`

### 3. Seeker-specific needs

These fields apply to `seek_room` and `seek_flatmate`.

| Field | Type | Required | Public | Applies to |
| --- | --- | --- | --- | --- |
| `seeker_goal` | enum | yes | yes | `seek_room`, `seek_flatmate` |
| `room_type_needed` | enum | no | yes | `seek_room` |
| `needs_private_bathroom` | enum | no | yes | `seek_room` |
| `preferred_zones` | string[] | no | yes | seekers |
| `urgency_level` | enum | yes | yes | seekers |
| `accepts_smoking_home` | boolean | yes | yes | seekers |
| `accepts_pets_home` | boolean | yes | yes | seekers |
| `accepts_couples_home` | boolean | yes | yes | seekers |
| `accepts_students_home` | boolean | yes | yes | seekers |
| `accepts_workers_home` | boolean | yes | yes | seekers |

Suggested enums:

- `seeker_goal`:
  - `need_room_now`
  - `want_flatmate_then_home`
  - `open_to_both`
- `room_type_needed`:
  - `single`
  - `double`
  - `either`
- `needs_private_bathroom`:
  - `yes`
  - `no`
  - `nice_to_have`
- `urgency_level`:
  - `immediate`
  - `this_month`
  - `flexible`

## Campos compartidos entre `seek_room` y `seek_flatmate`

Estos campos pueden compartirse razonablemente entre ambas intenciones de busqueda porque describen compatibilidad, tiempos y reglas de aceptacion.

### MVP actual / recomendado ahora

- `seeker_goal`
- `preferred_zones`
- `urgency_level`
- `accepts_smoking_home`
- `accepts_pets_home`
- `accepts_couples_home`
- `accepts_students_home`
- `accepts_workers_home`

### Principio compartido

- ambas siguen siendo intenciones de busqueda;
- ambas necesitan tiempos, compatibilidad y preferencias de zona;
- pero no deben tratarse automaticamente como si fueran el mismo producto.

## Campos especificos de `seek_room`

Estos campos son especificos de una persona que necesita una habitacion que ya existe.

### MVP actual / recomendado ahora

- `room_type_needed`
- `needs_private_bathroom`

### Fase futura

- `furnished_required`
- `max_existing_household_count`
- `preferred_home_type`

### Razon

- `seek_room` trata sobre entrar en una vivienda ya existente;
- por eso importan mas las caracteristicas de la habitacion y las condiciones del hogar ya montado que la dinamica de co-busqueda.

## Campos especificos de `seek_flatmate`

Estos campos son especificos de una persona que quiere encontrar primero a otra persona y alquilar despues juntos.

### MVP actual / recomendado ahora

No es necesario implementar inmediatamente todos los campos diferenciales. En MVP basta con dejar clara la separacion conceptual respecto a `seek_room` y reutilizar solo los campos compartidos estrictamente necesarios.

### Fase futura

- `co_search_readiness`
- `target_household_size`
- `search_scope`
- `shared_search_commitment`

Significado sugerido:

- `co_search_readiness`: si la persona esta lista para empezar ya o aun esta explorando
- `target_household_size`: si quiere alquilar entre 2 o construir un grupo mayor
- `search_scope`: si quiere buscar solo en una zona o de forma mas amplia
- `shared_search_commitment`: si busca una persona realmente comprometida o una exploracion mas casual

Ejemplos de enums recomendados para una fase futura:

- `co_search_readiness`: `ready_now`, `soon`, `exploring`
- `target_household_size`: `two_people`, `three_people`, `open_group`
- `search_scope`: `single_area`, `multi_area`, `open_city`
- `shared_search_commitment`: `serious_only`, `moderate`, `exploratory`

### Razon

- `seek_flatmate` no es simplemente "buscar habitacion con otra etiqueta";
- es un flujo de alianza futura para buscar vivienda juntos;
- por eso el modelo deberia capturar mejor la co-busqueda, la seriedad y el tipo de acuerdo deseado.

### 4. Offerer-specific household rules

These fields apply to `offer_room`.

| Field | Type | Required | Public | Applies to |
| --- | --- | --- | --- | --- |
| `property_context` | enum | yes | yes | `offer_room` |
| `current_household_count` | number | yes | yes | `offer_room` |
| `owner_lives_here` | boolean | yes | yes | `offer_room` |
| `allows_couples` | boolean | yes | yes | `offer_room` |
| `allows_two_people` | boolean | yes | yes | `offer_room` |
| `allows_minors` | boolean | yes | yes | `offer_room` |
| `allows_pets` | boolean | yes | yes | `offer_room` |
| `allows_smoking` | boolean | yes | yes | `offer_room` |
| `preferred_tenant_type` | enum | no | yes | `offer_room` |
| `house_rules_summary` | text | no | yes | `offer_room` |

Suggested enums:

- `property_context`:
  - `shared_flat`
  - `family_home`
  - `owner_occupied_flat`
- `preferred_tenant_type`:
  - `student`
  - `worker`
  - `either`

## Campos especificos de `offer_room`

Estos campos son especificos de una persona que ofrece una habitacion en un contexto de vivienda ya existente.

### MVP actual / recomendado ahora

- `property_context`
- `current_household_count`
- `owner_lives_here`
- `allows_couples`
- `allows_two_people`
- `allows_minors`
- `allows_pets`
- `allows_smoking`
- `preferred_tenant_type`
- `house_rules_summary`

### Fase futura

No es obligatorio ampliar mas este bloque en esta fase documental. Si hiciera falta, los refinamientos vendrian despues de validar manualmente el flujo MVP.

### Razon

- `offer_room` trata sobre un hogar que ya existe;
- por eso las reglas de convivencia y la ocupacion son datos de primer nivel;
- y no deben mezclarse conceptualmente con rasgos que describen solo a la persona.

## Person fields vs home fields

This split must stay explicit in the UI and in storage.

### Person fields

- `is_smoker`
- `has_pet`
- `pet_details`
- `household_size`
- `includes_minor`
- `sleep_schedule`
- `guest_frequency`
- `cleanliness_level`
- `noise_level`

### Home or household rule fields

- `allows_couples`
- `allows_two_people`
- `allows_minors`
- `allows_pets`
- `allows_smoking`
- `owner_lives_here`
- `current_household_count`
- `property_context`
- `preferred_tenant_type`

### Seeker acceptance fields

- `accepts_smoking_home`
- `accepts_pets_home`
- `accepts_couples_home`
- `accepts_students_home`
- `accepts_workers_home`

## Nota temporal de MVP sobre `lifestyle_tags`

Durante MVP, `profiles.lifestyle_tags` puede usarse como mecanismo temporal para guardar rasgos estructurados de convivencia como:

- smoker / non-smoker
- has pet / no pet
- household size
- includes minor

Pero esto debe tratarse como una estrategia temporal y controlada, no como un sistema abierto de tags libres sin gobierno.

Regla:

- los rasgos gestionados dentro de `lifestyle_tags` deben seguir una convencion controlada;
- no deben mezclarse sin control con tags libres no relacionados;
- y una futura limpieza deberia mantener clara la diferencia entre rasgos estructurados y etiquetado libre.

## Public profile structure

### Header

- photos
- display name
- primary intention
- verification badges

### About

- bio
- occupation
- languages

### Practical summary

- city
- province
- autonomous community
- budget range
- move-in date
- minimum stay

### Living situation

- smoker / non-smoker
- has pet / no pet
- solo / pair / group
- includes minor / no minor

### Looking for

For seekers:

- goal
- room type needed
- preferred zones
- urgency
- compatibility acceptance tags

### Offering

For offerers:

- household count
- owner lives there or not
- allows pets / smoking / couples / minors
- preferred tenant type
- house rules summary

## Dynamic onboarding structure

### Step 1: identity

- display name
- photos
- bio

### Step 2: location and timing

- autonomous community
- province
- city
- move-in date
- minimum stay

### Step 3: work and budget

- occupation
- languages
- budget min
- budget max

### Step 4: core intention

- primary intention
- optional secondary intention

### Step 5: living traits

- smoker
- pet
- pet details if needed
- household size
- includes minor
- sleep schedule
- guests
- cleanliness
- noise

### Step 6A: seeker needs

Shown only for `seek_room` and `seek_flatmate`.

### Step 6B: offerer rules

Shown only for `offer_room`.

## Editing strategy

Profile editing should be split in sections:

1. Identity
2. About and practical details
3. Living traits
4. What I am looking for / what I offer
5. Photos

This avoids one giant form and makes intention-specific blocks easier to maintain.

## Storage recommendation

### Keep in `profiles`

Store all base profile and practical fields here:

- identity
- bio
- photos
- budget
- move-in
- minimum stay
- occupation
- location
- personal living traits

### Keep in `convinter_profiles`

Keep lightweight matching-facing projection here:

- `display_name`
- `bio`
- `photo_url`
- `languages`
- `city`
- `province_code`
- `visibility`
- trust and verification state

### Keep in `convinter_profile_intentions`

Keep intention-specific details in `details` JSON until we decide to normalize further.

Recommended `details` JSON examples:

#### `seek_room`

```json
{
  "seeker_goal": "need_room_now",
  "room_type_needed": "single",
  "needs_private_bathroom": "nice_to_have",
  "preferred_zones": ["Gracia", "Eixample"],
  "urgency_level": "this_month",
  "accepts_smoking_home": false,
  "accepts_pets_home": true,
  "accepts_couples_home": false,
  "accepts_students_home": true,
  "accepts_workers_home": true
}
```

#### `seek_flatmate`

```json
{
  "seeker_goal": "want_flatmate_then_home",
  "preferred_zones": ["Sants", "Poblenou"],
  "urgency_level": "flexible",
  "accepts_smoking_home": false,
  "accepts_pets_home": true,
  "accepts_couples_home": true,
  "accepts_students_home": true,
  "accepts_workers_home": true
}
```

#### `offer_room`

```json
{
  "property_context": "shared_flat",
  "current_household_count": 2,
  "owner_lives_here": false,
  "allows_couples": false,
  "allows_two_people": false,
  "allows_minors": false,
  "allows_pets": true,
  "allows_smoking": false,
  "preferred_tenant_type": "worker",
  "house_rules_summary": "Buscamos convivencia tranquila, limpieza semanal y respeto por el descanso."
}
```

## Recommended implementation order

1. Add the new fields to the profile data model.
2. Extend onboarding with dynamic intention-specific steps.
3. Extend profile editing with the same sections.
4. Update own profile display.
5. Update public profile display.
6. Update discover and compatibility logic to use the new fields.
7. Revisit listings so listing-level details do not duplicate person-level details unnecessarily.

## Immediate next task

Implement phase 1 only:

- add the missing profile fields to the data model,
- expose them in the editor,
- and update the profile screen to render them cleanly.

Do not redesign matching logic in the same step.

## Implementation note for the current MVP phase

Current phase:

- document and consolidate the conceptual model only.

Next phase:

- adjust the UI of `EditProfileSheet` so `seek_room` and `seek_flatmate` are separated more clearly instead of sharing the same seeker block too loosely.

Not part of the current phase:

- no database changes yet;
- no SQL changes yet;
- no migration changes yet.
