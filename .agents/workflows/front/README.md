# Workflows — Frontend

Workflows de orquestación de subagentes para el desarrollo de frontend en Enterprise Production Platform.

---

## 📂 Pipelines Disponibles

| Workflow | Para qué sirve | Roles involucrados | Skills que orquesta |
|---|---|---|---|
| [`feature.md`](./feature.md) | Desarrollo completo de una feature desde Figma hasta QA | `@explorer`, `@architect`, `@coder`, `@reviewer` | `architecture-review`, `design-craft`, `design-audit`, `code-review`, `code-health`, `generate-qa-checklist` |
| [`bugfix.md`](./bugfix.md) | Diagnóstico root-cause y corrección quirúrgica de bugs | `@debugger`, `@coder`, `@reviewer` | `debug-flow`, `code-review`, `code-health`, `generate-qa-checklist` |

---

## 🔄 Cadenas de Ejecución

### Feature Nueva (`feature.md`)
```
@explorer (Figma/Context) → @architect (architecture-review → design-craft) → 🛑 Pausa Humana → @coder [codeás] → @reviewer (design-audit → code-review → code-health → generate-qa-checklist)
```

### Bugfix (`bugfix.md`)
```
@debugger (debug-flow) → @coder [arreglás] → @reviewer (code-review → code-health → generate-qa-checklist)
```

