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
```

### Bug fix ([`workflows/back/bugfix.md`](../../workflows/back/bugfix.md))
```
@debugger (Root Cause) → @coder [fix con Result] → @reviewer (nestjs-unit-tester con test de regresión)
```

```
```

