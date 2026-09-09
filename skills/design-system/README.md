# Skills — Design System

Skills para el desarrollo del monorepo `design-system` (Enterprise Platform):
tokens, componentes de `@design-system/react`, íconos y Storybook.

## Las 3 skills

| Skill | Para qué | Invocar con |
|---|---|---|
| `design-token-sync` | Sincronizar tokens desde Figma (o JSON exportado) | "sincronizá los tokens", "cambió un color en Figma" |
| `component-migrator` | Migrar un componente del legacy al DS | "migrá este componente", "traé el Button al DS" |
| `component-qa` | QA de un componente del DS (build, tokens, variantes, a11y) | "hacé QA del componente", "validá el Button" |

## Estructura del monorepo

```
design-system/
  packages/
    tokens/        → Style Dictionary: colors.json, semantico.json, spacing.json, ...
    react/         → @design-system/react: componentes + theme MUI tipado
    icons/         → @design-system/icons
  apps/docs/       → Storybook con las stories de todos los componentes
```

**Comandos clave:**
- `pnpm build` — buildea todos los packages
- `pnpm build:tokens` — compila los tokens a `tokens.css` + `tokens.json`
- `pnpm build:react` — compila el package react (incluye typecheck)
- `pnpm storybook` — http://localhost:6006
- `pnpm test-storybook` — corre Storybook Test Runner (smoke/render visual + a11y axe-core)

**Stack:** pnpm workspaces, Style Dictionary (tokens), Vite library (react/icons),
Storybook (docs), MUI con theme propio y module augmentation en `types/`.

## Cadenas de skills y Workflows

Las cadenas de desarrollo del Design System pueden ejecutarse de forma automatizada mediante los workflows de subagentes en [`workflows/design-system/`](../../workflows/design-system/):

### Migración de Componente Legacy ([`workflows/design-system/component-migration.md`](../../workflows/design-system/component-migration.md))
```
@explorer (Legacy Scout) → @architect (component-migrator) → 🛑 Pausa Humana → @coder [crea componente + story] → @reviewer (component-qa + nextjs-code-review)
```

### Sincronización de Tokens ([`workflows/design-system/token-sync.md`](../../workflows/design-system/token-sync.md))
```
@explorer (design-token-sync) → @architect (Impact Mapping) → @coder [pnpm build:tokens] → @reviewer (pnpm build)
```

### Componente Nuevo desde Figma ([`workflows/design-system/component-new.md`](../../workflows/design-system/component-new.md))
```
@explorer (Figma Scout) → @architect (nextjs-design-craft) → 🛑 Pausa Humana → @coder [implementación + story] → @reviewer (component-qa)
```



**Skills compartidas:** `nextjs-code-review` y `nextjs-code-health` viven en
`front/` pero se usan también en este flujo. `nextjs-debug-flow` para bugs del DS.

**Nota sobre Figma:** `design-token-sync` documenta cómo configurar el MCP de
Figma (oficial para Claude, libre para OpenCode) pero **no depende de él** — si
no está configurado se trabaja con el JSON exportado por diseño.