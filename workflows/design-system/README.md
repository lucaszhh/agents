# Workflows — Design System

Workflows de orquestación de subagentes para el monorepo `design-system` (`@design-system/tokens`, `@design-system/react`, `@design-system/icons`, Storybook) de Enterprise Platform.

---

## 📂 Pipelines Disponibles

| Workflow | Para qué sirve | Roles involucrados | Skills que orquesta |
|---|---|---|---|
| [`component-migration.md`](./component-migration.md) | Migrar componente del legacy (`desingSystem/`) a `@design-system/react` | `@explorer`, `@architect`, `@coder`, `@reviewer` | `component-migrator`, `component-qa`, `nextjs-code-review` |
| [`token-sync.md`](./token-sync.md) | Sincronizar tokens de Figma con Style Dictionary y compilar | `@explorer`, `@architect`, `@coder`, `@reviewer` | `design-token-sync`, `component-qa` |
| [`component-new.md`](./component-new.md) | Crear componente nuevo en el DS desde Figma con Storybook | `@explorer`, `@architect`, `@coder`, `@reviewer` | `nextjs-design-craft`, `nextjs-architect`, `component-qa` |

---

## 🔄 Cadenas de Ejecución

### Migración de Componente (`component-migration.md`)
```
@explorer (Legacy Scout) → @architect (component-migrator) → 🛑 Pausa Humana → @coder [crea componente + story] → @reviewer (component-qa + nextjs-code-review)
```

### Sincronización de Tokens (`token-sync.md`)
```
@explorer (design-token-sync) → @architect (Impact Mapping) → @coder [pnpm build:tokens] → @reviewer (pnpm build)
```

### Componente Nuevo (`component-new.md`)
```
@explorer (Figma Scout) → @architect (nextjs-design-craft) → 🛑 Pausa Humana → @coder [implementación + story] → @reviewer (component-qa)
```

