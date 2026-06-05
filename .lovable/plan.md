# Fix: 100% de compatibilidad con perfiles casi vacíos

## Problema real (verificado en el caché)

Para usuarioj ↔ usuarioa1 el sistema devuelve `score=100, source=profile_only` porque:

- **usuarioa1 no ha hecho el test exhaustivo** (0 respuestas en `convinter_answers`), así que el blending 40/60 no entra.
- De los 6 bloques de perfil, solo 2 tienen datos para comparar:
  - `location` = 1.0 (misma ciudad)
  - `languages` = 1.0 (mismo idioma)
  - `lifestyle`, `intentions`, `budget` → `has: false` (A1 no los rellenó)
  - `dealbreakers` → sin conflictos (penalización 0)
- La media ponderada sobre solo 25 pts de peso (de 90 posibles) da 100%.

Resultado: "habláis español y vivís en la misma ciudad" → 100%. Engañoso.

## Solución

Modificar **`convinter_score_profile_pair`** y, ligeramente, el wrapper `convinter_compute_and_cache_guarded`, en una nueva migración (`migrations_manual/21_profile_score_confidence.sql` + equivalente Lovable Cloud).

### Cambios en `convinter_score_profile_pair`

1. **Cobertura mínima**: si el peso total de bloques con datos es `< 40` (de 90 posibles), devolver `score = NULL` y `signals_used = N`. La RPC superior lo traducirá a `INSUFFICIENT_PROFILE_DATA` si tampoco hay test exhaustivo.
   - Ejemplo: solo location (15) + languages (10) = 25 → no llega.
   - lifestyle (30) + languages (10) = 40 → sí cuenta.
   - intentions (25) + location (15) = 40 → sí cuenta.

2. **Bloque obligatorio**: al menos uno de `lifestyle` o `intentions` debe tener datos. Son los bloques que realmente diferencian convivencia/objetivos. Sin ninguno de los dos, todo lo demás es decorativo.

3. **Factor de confianza** sobre el score crudo:
   ```
   confidence = weight_sum / 90        // entre 0 y 1
   score_calibrado = round(score_crudo * (0.6 + 0.4 * confidence))
   ```
   - Con cobertura total (90/90): factor 1.0 → no cambia.
   - Con cobertura 40/90 (mínimo): factor 0.78 → un 100% crudo se queda en 78.
   - Esto refleja que pocos datos = menos certeza, sin penalizar de más cuando hay buena cobertura.

4. **Tope para `profile_only`**: aplicar el factor de confianza siempre que el resultado se vaya a usar como `profile_only`. (El wrapper sigue mezclando 40/60 con test cuando exista test.)

5. **No contar `dealbreakers` en `signals_used`**: es un modificador, no una señal positiva. Mantener `has` y `penalty` en `parts` para diagnóstico.

### Cambio en `convinter_compute_and_cache_guarded`

- Si `profile_score = NULL` (por no llegar al mínimo) y tampoco hay test (`common_n < 8`), devolver `INSUFFICIENT_PROFILE_DATA` con mensaje claro: "Aún faltan datos en uno de los perfiles para calcular compatibilidad. Pídele que complete sus hábitos de convivencia y objetivo de búsqueda, o rellena el test exhaustivo."
- Si hay test exhaustivo pero el perfil base no llega al mínimo, usar solo `test_score` (source `test_only`) sin penalizar.
- Invalidar caché previa borrando filas con `scoring_model = 'convinter_profile_v1+test_v3'` para que se recalculen con el modelo nuevo (`'convinter_profile_v2+test_v3'`).

### Frontend

- En `src/pages/PublicProfile.tsx`, mejorar el mensaje cuando `code === 'INSUFFICIENT_PROFILE_DATA'`: "Aún faltan datos del perfil de la otra persona para calcular compatibilidad. Si os ponéis en contacto o aceptáis el test exhaustivo, podréis ver un porcentaje más fiable."
- Sin más cambios estructurales (el badge "Basado en perfil" y la nota ya están).

## Resultado esperado

- usuarioj ↔ usuarioa1: el perfil de A1 está casi vacío → ahora devolverá `INSUFFICIENT_PROFILE_DATA` (faltan lifestyle/intentions y solo suma 25 de peso).
- Dos usuarios con perfiles completos y mismos hábitos → siguen pudiendo llegar a 95–100%.
- Dos usuarios con perfiles completos pero discrepancias reales (smoker vs no_smoker dealbreaker, intenciones incompatibles) → score realista, no inflado.
- Cuando el perfil tiene cobertura intermedia (50–70 puntos de peso), el % se calibra hacia abajo para reflejar la incertidumbre.

## Fuera de alcance

- No se toca el scoring del test exhaustivo (sigue v3).
- No se cambian pesos individuales de bloques.
- No se modifica UI ni flujos de consentimiento/match.
