# Workflows — Frontend

Workflows de orquestación de subagentes para el desarrollo de frontend en Enterprise Production Platform.

---

## 📂 Pipelines Disponibles

| Workflow | Para qué sirve | Roles involucrados | Skills que orquesta |
|---|---|---|---|
| [`feature.md`](./feature.md) | Desarrollo completo de una feature desde Figma hasta QA | `@explorer`, `@architect`, `@coder`, `@reviewer` | `nextjs-architect`, `nextjs-design-craft`, `nextjs-design-audit`, `nextjs-code-review`, `nextjs-code-health`, `generate-qa-checklist` |
| [`bugfix.md`](./bugfix.md) | Diagnóstico root-cause y corrección quirúrgica de bugs | `@debugger`, `@coder`, `@reviewer` | `nextjs-debug-flow`, `nextjs-code-review`, `nextjs-code-health`, `generate-qa-checklist` |

---

## 🔄 Cadenas de Ejecución

### Feature Nueva (`feature.md`)
```
@explorer (Figma/Context) → @architect (nextjs-architect → nextjs-design-craft) → 🛑 Pausa Humana → @coder [codeás] → @reviewer (nextjs-design-audit → nextjs-code-review → nextjs-code-health → generate-qa-checklist)
```

### Bugfix (`bugfix.md`)
```
@debugger (nextjs-debug-flow) → @coder [arreglás] → @reviewer (nextjs-code-review → nextjs-code-health → generate-qa-checklist)
```

