# Workflows — Backend

Workflows de orquestación de subagentes para el desarrollo backend (NestJS, Clean Architecture / DDD, TypeORM, X-Road, Jest) en Enterprise Production Platform.

---

## 📂 Pipelines Disponibles

| Workflow | Para qué sirve | Roles involucrados | Skills que orquesta |
|---|---|---|---|
| [`bugfix.md`](./bugfix.md) | Diagnóstico root-cause y corrección con tests de regresión | `@debugger`, `@coder`, `@reviewer` | `nestjs-unit-tester`, `generate-qa-checklist` |

---

## 🔄 Cadenas de Ejecución

### Feature Nueva (`feature.md`)
```
```

### Bugfix (`bugfix.md`)
```
@debugger (Root Cause) → @coder [fix con Result] → @reviewer (nestjs-unit-tester con test de regresión)
```

### Migración de Base de Datos (`migration.md`)
```
```

