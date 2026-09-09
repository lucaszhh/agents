---
name: nestjs-architect
description: Define y evalúa la arquitectura del proyecto NestJS. Estructuración modular, separación de conceptos en presentación/dominio/datos (Clean Architecture / DDD) e integración de infraestructura técnica de manera desacoplada.
---

# NestJS Architect — Arquitectura y Scaffolding

Define, evalúa y valida la arquitectura de proyectos NestJS. Asegura un diseño modular robusto, desacoplado, que cumpla con Clean Architecture y DDD.

## Lectura previa obligatoria

- Estructura de carpetas del proyecto (`src/`, `modules/`, `infraestructure/`, `common/`)
- `package.json` — dependencias (TypeORM, X-Road, etc.)
- Módulos existentes como referencia de patrones

## Cuándo usar esta skill

- "creá un módulo nuevo"
- "diseñá la estructura de X feature"
- "evaluá si esta arquitectura está bien"
- "organizá las capas de este módulo"
- "planificá la integración con X-Road"
- Antes de crear un módulo nuevo o reorganizar uno existente

## Cuándo NO usar esta skill

- **Implementar controladores/servicios** → `nestjs-developer`
- **Escribir tests** → `nestjs-unit-tester`
- **Fix de un bug concreto** → buscar la causa directamente

---

## Metodología

### Paso 1 — Entender el contexto

- ¿Qué dominio de negocio cubre el módulo?
- ¿Qué entidades involucra?
- ¿Qué casos de uso necesita?
- ¿Requiere publicación X-Road?

### Paso 2 — Definir la estructura de capas

La estructura del código se organiza bajo una división estricta entre **infraestructura global**, **elementos comunes**, y **módulos de negocio modularizados**:

1. **`src/infraestructure/`**: implementaciones de detalles técnicos compartidos (base de datos, almacenamiento, monitoreo).
2. **`src/common/`**: decoradores, filtros de excepción, interceptores, pipes, utilitarios y definiciones de error comunes.
3. **`src/modules/<feature>/`**: cada módulo representa un dominio de negocio auto-contenido:
   - `<feature>.module.ts` — módulo NestJS (importaciones, controladores, providers)
   - `presentation/` — controllers, dtos, mappers
   - `domain/` — interfaces de servicio (abstractas), interfaces de entidades
   - `data/` — interfaces de repositorio (abstractas), implementaciones de persistencia

### Paso 3 — Definir inyección de dependencias

- **Desacoplamiento estricto**: las capas superiores NUNCA dependen de implementaciones concretas
- **Tokens**: usar clases abstractas como `abstract class IDemandService` (TypeScript no conserva interfaces en runtime)
- **Registro en módulo**:
  ```typescript
  @Module({
    providers: [
      { provide: IDemandService, useClass: DemandService },
      { provide: IDemandRepository, useClass: DemandRepository },
    ],
    controllers: [DemandController],
  })
  export class FeatureModule {}
  ```

### Paso 4 — Generar los archivos (scaffolding)

Orden de generación para evitar dependencias circulares:

1. **Interfaz de entidad** → `domain/interfaces/<singular>.interface.ts`
2. **Contrato de servicio** → `domain/services/i-<singular>.service.ts`
3. **Contrato de repositorio** → `data/repositories/i-<singular>.repository.ts`
4. **Módulo NestJS** → `<plural>.module.ts`

---

## Reglas de lo que SÍ debe hacer

- Separar estrictamente las capas (presentation, domain, data)
- Usar clases abstractas como tokens de inyección
- Registrar implementaciones concretas en el módulo
- Seguir el orden de scaffolding (interfaces antes que implementaciones)
- Verificar que no haya dependencias circulares

## Reglas de lo que NO debe hacer

- NO poner lógica de negocio en controladores
- NO importar implementaciones concretas de repositorios en servicios
- NO usar interfaces como tokens de DI (usar clases abstractas)
- NO crear módulos sin declarar dependencias explícitamente
- NO saltarse el orden de generación de archivos

## Al terminar

Sugerir al usuario: **nestjs-developer** para implementar controladores, servicios, DTOs y mappers del módulo creado.
