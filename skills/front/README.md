# Skills — Frontend

Skills para el desarrollo de frontend (Next.js, React Query, zod,
react-hook-form, módulos por dominio, design system propio).

## Las 6 skills

| Skill | Para qué | Invocar con |
|---|---|---|
| `nextjs-architect` | Planear arquitectura antes de codear | "revisá la arquitectura", "planificá la feature" |
| `nextjs-design-craft` | Diseñar/rediseñar UI con craft | "diseñá este componente", "rediseñá la landing" |
| `nextjs-design-audit` | QA visual sobre lo codeado | "auditá el diseño", "visual QA" |
| `nextjs-debug-flow` | Debuggear con root cause | "debuggeá este error", "por qué falla" |
| `nextjs-code-review` | Code review del diff pre-merge | "revisá el diff", "code review" |
| `nextjs-code-health` | Dashboard de calidad (lint, tipos) | "health check", "cómo está el código" |

## Patrones de arquitectura

Estos patrones son los que las skills esperan encontrar en el repositorio:

```
src/modules/<dominio>/
  domain/          → tipos, entidades, mapeos
  services/        → llamadas HTTP (nunca fetch en componentes)
  query/keys.ts    → centralizar query keys de React Query
  hooks/           → useQuery / useMutation que consumen services
  components/      → UI con el design system del proyecto
  pages/           → entrypoints que consumen hooks del módulo
```

**Forms:** `react-hook-form` + `zod` en contenedores. Componentes dumb.

**Design system:** el frontend consume `@desingSystem/*` (en `src/modules/desingSystem/`).
Nada de `@mui/*` importado directo fuera del design system.

**Estados de UI:** toda pantalla debe cubrir loading, empty, error, success.

**Calidad:** el proyecto debe tener script de lint (`pnpm run lint` o equivalente).

## Cadenas de skills y Workflows

Cada skill al terminar **siempre** sugiere la siguiente de la cadena correspondiente. Podés ejecutar estas cadenas de forma automatizada mediante los workflows de subagentes en [`workflows/front/`](../../workflows/front/):

### Feature nueva ([`workflows/front/feature.md`](../../workflows/front/feature.md))
```
@explorer (Figma/Context) → @architect (nextjs-architect → nextjs-design-craft) → 🛑 Pausa Humana → @coder [codeás] → @reviewer (nextjs-design-audit → nextjs-code-review → nextjs-code-health → generate-qa-checklist)
```

### Bug fix ([`workflows/front/bugfix.md`](../../workflows/front/bugfix.md))
```
@debugger (nextjs-debug-flow) → @coder [arreglás] → @reviewer (nextjs-code-review → nextjs-code-health → generate-qa-checklist)
```


