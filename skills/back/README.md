# Skills — Backend

Skills para el desarrollo backend (NestJS, Clean Architecture / DDD, X-Road).

## Las 3 skills

| Skill | Para qué | Invocar con |
|---|---|---|
| `nestjs-architect` | Diseñar la estructura de un módulo | "creá un módulo", "diseñá la arquitectura" |
| `nestjs-backend-developer` | Implementar controladores, servicios, DTOs | "implementá el endpoint", "creá el servicio" |
| `nestjs-unit-tester` | Escribir pruebas unitarias | "escribí tests", "testear esta feature" |

## Cadenas de skills y Workflows

Las cadenas de desarrollo backend pueden ejecutarse de forma automatizada mediante los workflows de subagentes en [`workflows/back/`](../../workflows/back/):

### Feature nueva ([`workflows/back/feature.md`](../../workflows/back/feature.md))
```
@explorer (Domain Scout) → @architect (nestjs-architect) → 🛑 Pausa Humana → @coder (nestjs-backend-developer + generate-migration) → @reviewer (nestjs-unit-tester + code-review + generate-qa-checklist)
```

### Bug fix ([`workflows/back/bugfix.md`](../../workflows/back/bugfix.md))
```
@debugger (Root Cause) → @coder [fix con Result] → @reviewer (nestjs-unit-tester con test de regresión)
```

### Migración de Base de Datos ([`workflows/back/migration.md`](../../workflows/back/migration.md))
```
@explorer (Entity Diff) → @coder (generate-migration con QueryRunner) → @reviewer (Simetría up/down)
```

