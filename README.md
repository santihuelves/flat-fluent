# Convinter

Convinter es una aplicacion web para conectar personas que buscan habitacion, companero de piso o convivencia compatible, y personas que ofrecen una habitacion o un hogar compartido.

Este repositorio contiene:
- el frontend React/Vite de la app,
- la integracion con Supabase,
- el historial de migraciones SQL,
- y documentacion operativa y de testing.

## Estado del proyecto

El proyecto se edita desde dos entornos:
- **Lovable** para cambios asistidos en la nube y sincronizacion con GitHub.
- **Local/IDE** para desarrollo manual, revision y mantenimiento.

Ambos flujos pueden convivir, pero conviene mantener claras las responsabilidades:
- el **codigo de producto** vive en este repo;
- la **historia canonica del esquema SQL** vive en `supabase/migrations`;
- los **scripts y notas manuales/legacy** no deben interpretarse como una segunda fuente de verdad.

## Stack principal

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Supabase (Auth, Postgres, Storage, Realtime)

## Supabase actual

Proyecto Supabase actual esperado por este repo:
- **Project ref**: `iahjepkbjapxqsdsgiob`

Archivos que hoy apuntan a ese proyecto:
- [supabase/config.toml](C:/Users/Santi/Documents/Codex/2026-04-27/https-github-com-santihuelves-flat-fluent/supabase/config.toml)
- [.env](C:/Users/Santi/Documents/Codex/2026-04-27/https-github-com-santihuelves-flat-fluent/.env)
- [src/integrations/supabase/client.ts](C:/Users/Santi/Documents/Codex/2026-04-27/https-github-com-santihuelves-flat-fluent/src/integrations/supabase/client.ts)

Notas:
- `client.ts` usa actualmente URL y anon key publicables hardcodeadas. Eso **no se cambia en esta fase**.
- Existen documentos legacy que todavia mencionan el ref antiguo `glsyzczyisengwwieuvt`. Esos documentos se deben tratar como historicos, no como fuente operativa actual.

## Regla de fuente de verdad

### Esquema y funciones SQL canonicas

La carpeta canonica del backend SQL en el repo es:
- [supabase/migrations](C:/Users/Santi/Documents/Codex/2026-04-27/https-github-com-santihuelves-flat-fluent/supabase/migrations)

Debe considerarse la fuente principal para:
- tablas,
- enums,
- policies,
- functions / RPCs,
- triggers,
- seeds incluidos como parte del historial del proyecto.

### Carpeta manual / legado

La carpeta:
- [migrations_manual](C:/Users/Santi/Documents/Codex/2026-04-27/https-github-com-santihuelves-flat-fluent/migrations_manual)

**no es la historia canonica del esquema**. Se conserva como:
- runbook historico,
- referencia de aplicacion manual en Lovable Cloud,
- y apoyo para entender que bloques se ejecutaron manualmente en el pasado.

Si hay discrepancias entre ambas carpetas, la revision debe partir de `supabase/migrations` y no de `migrations_manual`.

## Estructura relevante del repo

```text
src/                        Frontend React
src/integrations/supabase/  Cliente y tipos de Supabase
supabase/migrations/        Historial canonico SQL
supabase/config.toml        Configuracion Supabase del repo
migrations_manual/          Runbooks/manual SQL legacy
public/                     Assets publicos
```

Otros archivos relevantes:
- [fix_rpcs_intentions.sql](C:/Users/Santi/Documents/Codex/2026-04-27/https-github-com-santihuelves-flat-fluent/fix_rpcs_intentions.sql): script SQL suelto de contexto historico; no tratar como migracion canonica.
- [CREATE_TEST_USER.md](C:/Users/Santi/Documents/Codex/2026-04-27/https-github-com-santihuelves-flat-fluent/CREATE_TEST_USER.md): documentacion legacy de testing.
- [TESTING_LOG.md](C:/Users/Santi/Documents/Codex/2026-04-27/https-github-com-santihuelves-flat-fluent/TESTING_LOG.md): bitacora legacy de pruebas.

## Demo, testing y seeds

### Archivos de demo/testing/seeds que requieren revision antes de usarse

Estos archivos existen para testing manual, poblacion demo o contexto historico. **No deben ejecutarse en produccion sin revision explicita**:

- [supabase/seed_test_user.sql](C:/Users/Santi/Documents/Codex/2026-04-27/https-github-com-santihuelves-flat-fluent/supabase/seed_test_user.sql)
- [supabase/migrations/20260112000001_seed_fictional_profiles_fixed.sql](C:/Users/Santi/Documents/Codex/2026-04-27/https-github-com-santihuelves-flat-fluent/supabase/migrations/20260112000001_seed_fictional_profiles_fixed.sql)
- [migrations_manual/06_demo_full_seed.sql](C:/Users/Santi/Documents/Codex/2026-04-27/https-github-com-santihuelves-flat-fluent/migrations_manual/06_demo_full_seed.sql)
- [migrations_manual/07_demo_cleanup.sql](C:/Users/Santi/Documents/Codex/2026-04-27/https-github-com-santihuelves-flat-fluent/migrations_manual/07_demo_cleanup.sql)
- [CREATE_TEST_USER.md](C:/Users/Santi/Documents/Codex/2026-04-27/https-github-com-santihuelves-flat-fluent/CREATE_TEST_USER.md)
- [TESTING_LOG.md](C:/Users/Santi/Documents/Codex/2026-04-27/https-github-com-santihuelves-flat-fluent/TESTING_LOG.md)

### Archivos operativos pero nacidos de fixes/manuales

Estos archivos pueden describir SQL util, pero su presencia en `migrations_manual` no los convierte en fuente canonica:

- `08_fix_get_my_matches.sql`
- `09_chat_read_receipts.sql`
- `10_consent_connections_overview.sql`
- `11_filter_resolved_consent_requests.sql`

Su equivalente canonico debe buscarse en `supabase/migrations`.

## Desarrollo local

Instalacion:

```sh
npm install
```

Servidor de desarrollo:

```sh
npm run dev
```

Build:

```sh
npm run build
```

Lint:

```sh
npm run lint
```

## Reglas practicas para no romper el orden

1. No crear nuevas migraciones operativas en `migrations_manual`.
2. No tratar scripts SQL sueltos como si fueran parte del historial oficial.
3. No ejecutar seeds/demo en produccion sin revisar alcance y limpieza.
4. Antes de tocar credenciales o `client.ts`, confirmar impacto en Lovable Cloud y en el arranque local.
5. Si Lovable aplica SQL manualmente, reflejar luego esa historia de forma clara en la documentacion y en la carpeta canonica correspondiente.

## Que no hace esta fase documental

Esta fase **no**:
- cambia logica de negocio,
- cambia funciones SQL,
- borra migraciones,
- mueve archivos,
- ni modifica el frontend.

Su objetivo es solo dejar claro:
- que carpeta es canonica,
- que archivos son legacy,
- y que artefactos son de demo/testing.
