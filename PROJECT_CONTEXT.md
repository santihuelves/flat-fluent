# PROJECT_CONTEXT

## 1. Qué es Convinter

Convinter es una aplicación web para ayudar a conectar personas que:
- buscan habitación,
- ofrecen habitación,
- o buscan compañero/a para alquilar un piso juntos.

El perfil representa a la persona. Las intenciones representan lo que esa persona busca en este momento.

## 2. Estado actual

Convinter está en fase activa de desarrollo/MVP.

No está listo para producción.

El objetivo actual es avanzar con orden, seguir construyendo funcionalidad, validar flujos reales de uso y no bloquear el desarrollo con limpiezas prematuras o cambios estructurales arriesgados.

Al estar en fase MVP, este documento describe el criterio operativo actual del proyecto, no una arquitectura definitiva cerrada.

## 3. Stack técnico general

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Supabase:
  - Auth
  - Postgres
  - Storage
  - Realtime

## 4. Supabase actual

Project ref actual esperado por este proyecto:

- `iahjepkbjapxqsdsgiob`

## 5. Migraciones

Regla actual del repo:

- `supabase/migrations` es la fuente canónica del repo.
- `migrations_manual` es legacy/runbook/manual.

Importante:

- no hacer limpieza destructiva todavía;
- no borrar migraciones sin aprobación;
- y no reinterpretar `migrations_manual` como una segunda historia oficial del esquema.

## 6. Seeds demo/testing

Los seeds demo/testing:

- están permitidos para desarrollo y pruebas manuales;
- no deben confundirse con datos reales;
- no deben ejecutarse en un entorno real sin revisión explícita;
- y deben tratarse como datos reversibles o controlados mientras el producto siga en fase MVP.

## 7. Sistema de perfiles

Regla conceptual actual:

- el perfil representa a la persona;
- las intenciones representan lo que busca ahora;
- los anuncios/listings representan publicaciones concretas, por ejemplo una habitación disponible o una búsqueda de compañero/a para alquilar juntos;
- `convinter_profile_intentions` debe ser la fuente principal para modelar la intención activa o las intenciones del usuario;
- `profiles.user_type` queda como legacy/compatibilidad temporal mientras exista código que aún dependa de ese campo.

## 8. Intenciones

Mapa de intenciones actual:

- `seek_room` = busca habitación
- `offer_room` = ofrece habitación
- `seek_flatmate` = busca compañero/a para alquilar juntos

## 9. Reglas de trabajo

- avanzar por fases pequeñas;
- no borrar migraciones sin aprobación;
- no tocar SQL operativo sin una fase separada;
- no mezclar limpieza backend/documental con cambios frontend;
- no tocar `client.ts` sin aprobación explícita;
- los cambios grandes deben dividirse en fases pequeñas y revisables, indicando archivos afectados y riesgos;
- antes de cada fase, entregar `git status` y `git diff --stat`.

## Nota de uso

Este archivo existe para mantener contexto operativo común entre sesiones y ayudar a que el proyecto avance con coherencia mientras siga en construcción.
