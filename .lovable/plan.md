## Problema

`EditProfileSheet` ya tiene el bloque "Rasgos e intereses" con 6 categorías (Cómo eres, Estilo de vida, Planes e intereses, Música, Deportes y un sexto grupo) y límite global de 25 etiquetas, usando `PROFILE_INTEREST_CATEGORIES`, `PROFILE_INTEREST_TAG_LIMIT` y `encodeProfileInterestTags` de `src/lib/profileTraits.ts`.

`Onboarding.tsx` (4 pasos) **no** lo expone. Cuando alguien crea perfil por primera vez, no puede rellenar esos rasgos — solo aparecen al editar luego. Hay que añadirlo también en el onboarding.

## Cambios

### 1. `src/pages/Onboarding.tsx`

- Importar de `@/lib/profileTraits`: `PROFILE_INTEREST_CATEGORIES`, `PROFILE_INTEREST_TAG_LIMIT`, `encodeProfileInterestTags`.
- Añadir `interestTags: string[]` a `OnboardingData` (inicial `[]`).
- Insertar un nuevo **paso 4 "Rasgos e intereses"** y desplazar el actual paso 4 (resumen/elegir destino) a paso 5. Subir `totalSteps` de 4 a 5.
  - Reutilizar el mismo UI del editor: cabecera sticky con contador `X/25`, barra de progreso, tarjetas por categoría con badges togglables y deshabilitadas al llegar al límite.
  - Helper de validación: paso opcional, `canProceed(4)` siempre `true`; mensaje "Puedes elegir hasta 25 etiquetas o saltar este paso."
- `handleComplete`:
  - Combinar las etiquetas seleccionadas con las automáticas usando `encodeProfileInterestTags(currentTags, data.interestTags)`.
  - Guardar el resultado en `lifestyle_tags` tanto del `upsert` de `profiles` como añadirlo al `upsert` de `convinter_profiles` (la columna existe — `EditProfileSheet` ya la usa).
- Ajustar índices `case` de `renderStep`, mensajes de validación, y la lógica del botón "Siguiente" / "Ver progreso" para los 5 pasos.

### 2. Sin cambios de backend

`convinter_profiles.lifestyle_tags` y `profiles.lifestyle_tags` ya existen; el editor escribe ahí mismo. Solo unificamos el flujo de alta.

### 3. Sin cambios en `EditProfileSheet`

Sigue funcionando igual — leerá esas etiquetas codificadas al abrir.

## Fuera de alcance

- Cambiar `Tus hábitos y tu manera de convivir` del editor (ya está cubierto en onboarding por el paso de estilo de convivencia).
- Tocar `PublicProfile` (ya pinta los tags decodificados).
- Migraciones SQL.
