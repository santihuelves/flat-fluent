# Renombrar "Convinder" → "Convinter"

La memoria del proyecto ya indica que el nombre interno es **CONVINTER**, así que esto alinea la UI con la marca real. He localizado **37 ocurrencias en 16 archivos** y las clasifico por tipo para aplicar el reemplazo correcto en cada caso.

## Alcance del cambio

### 1. Marca visible en UI (reemplazo directo `Convinder` → `Convinter`)
- `src/components/layout/Header.tsx` — logo del header
- `src/components/layout/Footer.tsx` — logo y copyright
- `src/components/SafetyActions.tsx` — texto de moderación
- `src/pages/FAQ.tsx` — 4 menciones en preguntas y subtítulo
- `src/pages/Privacy.tsx` — texto legal
- `src/pages/Terms.tsx` — 4 menciones en texto legal
- `src/pages/Settings.tsx` — 2 menciones en textos de UI
- `src/components/ui/button.tsx` — comentario de código
- `src/index.css` — comentario de tokens de marca

### 2. Traducciones i18n
- `src/i18n/locales/es.json` — "¿Por qué Convinder?", "Únete a Convinder"
- `src/i18n/locales/en.json` — "Why Convinder?", "Join Convinder"

### 3. Emails de contacto (dominio)
Cambiar el dominio en los mailtos/textos:
- `src/pages/Contact.tsx` → `hola@convinter.com`
- `src/pages/Privacy.tsx` → `privacidad@convinter.com`
- `src/pages/Terms.tsx` → `legal@convinter.com`

### 4. Claves de almacenamiento (localStorage / sessionStorage)
Estas son claves técnicas; las renombro también para coherencia. Implica que usuarios actuales perderán el valor guardado (idioma preferido, ajustes de notificaciones, flag de reload). Es aceptable porque:
- El idioma vuelve al default `es` con fallback automático
- Los ajustes de notificaciones se regeneran con valores por defecto
- El flag de reload es transitorio

Archivos:
- `src/App.tsx` — `convinder-stale-chunk-reload` → `convinter-stale-chunk-reload` (3 ocurrencias)
- `src/components/LanguageSwitcher.tsx` — `convinder-lang` → `convinter-lang`
- `src/i18n/index.ts` — `convinder-lang` → `convinter-lang`
- `src/pages/Settings.tsx`:
  - `NOTIFICATIONS_KEY = 'convinder-notification-settings'` → `'convinter-notification-settings'`
  - Nombre de archivo de descarga: `convinder-datos-...json` → `convinter-datos-...json`

### 5. Documentación de desarrollo
- `TESTING_LOG.md` — título y emails de ejemplo (`test@convinter.com`, `maria@convinter.com`)

### 6. Metadatos del sitio
- `index.html` — actualizar `<title>` y `og:title` de "Lovable App" a **"Convinter"** y la descripción a algo coherente con la marca (mejora SEO/OG y aprovecha el cambio).

## Fuera de alcance (no se tocan)
- Migraciones SQL en `migrations_manual/` — los identificadores de BBDD ya usan el prefijo `convinter_*`, no hay nada que cambiar.
- Referencias a "Convinter" ya existentes (memoria, RPCs, tablas).
- Logos/iconos: se mantiene el icono actual de `Home` en Header/Footer; sólo cambia el texto.

## Detalles técnicos
- Reemplazo respetando capitalización: `Convinder` → `Convinter`, `convinder` → `convinter`.
- No hay `CONVINDER` en mayúsculas en el código.
- Total de archivos modificados: **17** (16 con la marca + `index.html`).
- No requiere migración de BBDD.
- No afecta a tipos generados de Supabase.

## Verificación posterior
Tras aplicar los cambios, ejecutar `grep -rin "convinder" src/ index.html` y confirmar que devuelve 0 resultados.
