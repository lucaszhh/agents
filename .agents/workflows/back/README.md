# Workflows — Backend

Workflows de orquestación de subagentes para el desarrollo backend (NestJS, Clean Architecture / DDD, TypeORM, X-Road, Jest) en Enterprise Production Platform.

---

## 📂 Pipelines Disponibles

| Workflow | Para qué sirve | Roles involucrados | Skills que orquesta |
|---|---|---|---|
| [`feature.md`](./feature.md) | Desarrollo completo de un módulo backend con Clean Architecture | `@explorer`, `@architect`, `@coder`, `@reviewer` | `nestjs-architect`, `nestjs-backend-developer`, `generate-migration`, `nestjs-unit-tester`, `code-review`, `generate-qa-checklist` |
| [`bugfix.md`](./bugfix.md) | Diagnóstico root-cause y corrección con tests de regresión | `@debugger`, `@coder`, `@reviewer` | `nestjs-unit-tester`, `generate-qa-checklist` |
| [`migration.md`](./migration.md) | Generación y verificación de migraciones de base de datos con QueryRunner | `@explorer`, `@coder`, `@reviewer` | `generate-migration` |

---

## 🔄 Cadenas de Ejecución

### Feature Nueva (`feature.md`)
```
@explorer (Domain Scout) → @architect (nestjs-architect) → 🛑 Pausa Humana → @coder (nestjs-backend-developer + generate-migration) → @reviewer (nestjs-unit-tester + Jest)
```

### Bugfix (`bugfix.md`)
```
@debugger (Root Cause) → @coder [fix con Result] → @reviewer (nestjs-unit-tester con test de regresión)
```

### Migración de Base de Datos (`migration.md`)
```
@explorer (Entity Diff) → @coder (generate-migration con QueryRunner) → @reviewer (Simetría up/down)
```

