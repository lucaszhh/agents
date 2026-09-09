---
name: nestjs-architect
description: Define y evalúa la arquitectura del proyecto NestJS. Estructuración modular, separación de conceptos en presentación/dominio/datos (Clean Architecture / DDD) e integración de infraestructura técnica de manera desacoplada. Escribe su entregable en .agents/plans/<nombre>.md en lugar de responder en el hilo de chat.
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

- **Añadir un método o parámetro a un servicio existente** → Fast-Path: implementar directo con `nestjs-developer` sin redactar un nuevo plan arquitectónico.
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

### Paso 3b — Manejo de Transacciones y Persistencia (Unit of Work)

Para casos de uso que requieren atomicidad sobre la base de datos (múltiples repositorios, persistencia coordinada o compensaciones):
- **Contrato de Unit of Work en Dominio**:
  ```typescript
  // domain/services/i-unit-of-work.service.ts
  export abstract class IUnitOfWork {
    abstract runInTransaction<T>(work: () => Promise<T>): Promise<T>;
  }
  ```
- **Implementación con TypeORM QueryRunner en Data/Infra**:
  ```typescript
  // data/repositories/typeorm-unit-of-work.ts
  import { Injectable } from '@nestjs/common';
  import { DataSource } from 'typeorm';
  import { IUnitOfWork } from '../../domain/services/i-unit-of-work.service';

  @Injectable()
  export class TypeOrmUnitOfWork implements IUnitOfWork {
    constructor(private readonly dataSource: DataSource) {}

    async runInTransaction<T>(work: () => Promise<T>): Promise<T> {
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        const result = await work();
        await queryRunner.commitTransaction();
        return result;
      } catch (error) {
        await queryRunner.rollbackTransaction();
        throw error;
      } finally {
        await queryRunner.release();
      }
    }
  }
  ```

### Paso 4 — Generar los archivos (scaffolding automatizado)

Ejecutar el script de scaffolding para crear la estructura de capas estandarizada con un solo comando:
```bash
bash scripts/scaffold_module.sh <nombre-modulo>
# Ejemplo: bash scripts/scaffold_module.sh payment-requests
```

Orden de generación respetado por el script para evitar dependencias circulares:
1. **Interfaz de entidad** → `domain/interfaces/<singular>.interface.ts`
2. **Contrato de servicio** → `domain/services/i-<singular>.service.ts`
3. **Contrato de repositorio** → `data/repositories/i-<singular>.repository.ts`
4. **Módulo NestJS** → `<plural>.module.ts`

Tras generar el scaffolding, verificar inmediatamente la ausencia de dependencias circulares:
```bash
npx madge --circular src/modules/
```
> ℹ️ **Degradación Elegante (Fallback si madge no está disponible)**:  
> Si `npx madge` no puede ejecutarse en el entorno, verificar manualmente la regla de capas: confirmar que `domain/` no importe nada de `presentation/` ni de `data/`, y que no existan dependencias circulares entre los `*.module.ts`.

### Paso 5 — Entregar el diseño técnico (.agents/plans/<nombre>.md)

#### Protocolo de Entrega Direct-to-Disk OBLIGATORIO

El entregable arquitectónico completo **NUNCA se responde ni se vuelca en el hilo de chat**. Debe persistirse directamente en disco utilizando la plantilla oficial:

1. **Plantilla oficial**: Utilizar la estructura definida en [`templates/backend-architecture-plan.template.md`](./templates/backend-architecture-plan.template.md).
2. **Destino del entregable**: Escribir el documento de diseño arquitectónico completo en `.agents/plans/<nombre>.md` (crear la carpeta `.agents/plans/` si no existe).
   - `<nombre>` debe ser el nombre del módulo o feature en formato `kebab-case` (ej. `.agents/plans/solicitudes-pago.md`, `.agents/plans/demand-requests.md`).
3. **Prohibido volcar el diseño en el chat**: No imprimir el documento técnico completo, interfaces detalladas, contratos exhaustivos ni especificaciones largas en la respuesta de la conversación. Esto previene la saturación de tokens y preserva el contexto del asistente.
4. **Contenido obligatorio del archivo `.agents/plans/<nombre>.md`**:
   - **Objetivo y Contexto de Negocio**: dominio cubierto, entidades clave y casos de uso principales.
   - **Estructura de Carpetas y Capas**: detalle de archivos a crear en `presentation/`, `domain/`, `data/` y `infraestructure/`.
   - **Inyección de Dependencias y Tokens**: clases abstractas (`abstract class I...Service`, `abstract class I...Repository`), registro de providers y desacoplamiento estricto.
   - **Contratos de Dominio y Datos**: signaturas de métodos, DTOs con validación (`class-validator`), mappers estáticos y manejo de retorno tipado con `Result<T, E>`.
   - **Persistencia, Transacciones y Unit of Work**: entidades TypeORM, tablas/relaciones, migraciones y estrategia transaccional (`QueryRunner`).
   - **Oportunidades de Mejora y Gaps Detectados**: análisis proactivo de endpoints CRUD omitidos, validaciones de seguridad/roles, índices de BD o casos de error no contemplados.
   - **Preguntas de Negocio**: dudas funcionales, reglas de negocio o decisiones de alcance que requieren validación explícita del usuario.

5. **Respuesta en el hilo de chat (Reporte Sintético)**:
   En la conversación de chat, el agente **únicamente** debe responder con un reporte sintético conciso:
   - **Ruta del entregable**: enlace/ruta al archivo generado (`.agents/plans/<nombre>.md`).
   - **Resumen ejecutivo**: síntesis breve (1-2 párrafos) del diseño del módulo y la estrategia de capas adoptada.
   - **Archivos creados (scaffolding)**: si se ejecutó el Paso 4 generando interfaces/contratos base, listar las rutas relativas generadas en disco.
   - **Preguntas de Negocio y Gaps**: lista de preguntas o puntos de decisión críticos para el usuario antes de proceder a la implementación.
   - **Siguiente paso recomendado**: sugerir invocar **nestjs-developer** para implementar controladores, servicios, DTOs y mappers una vez aprobado el plan.

---

## Reglas de lo que SÍ debe hacer

- Escribir obligatoriamente el entregable de diseño/arquitectura en `.agents/plans/<nombre>.md` (`write_to_file`)
- Reportar en el chat únicamente el resumen sintético, ruta del archivo y preguntas de negocio / gaps
- Separar estrictamente las capas (presentation, domain, data)
- Usar clases abstractas como tokens de inyección
- Registrar implementaciones concretas en el módulo
- Seguir el orden de scaffolding (interfaces antes que implementaciones)
- Verificar que no haya dependencias circulares ejecutando `npx madge --circular src/modules/`

## Reglas de lo que NO debe hacer

- NO volcar el diseño arquitectónico completo ni especificaciones extensas en la respuesta del chat
- NO omitir la persistencia del entregable en `.agents/plans/<nombre>.md`
- NO poner lógica de negocio en controladores
- NO importar implementaciones concretas de repositorios en servicios
- NO usar interfaces como tokens de DI (usar clases abstractas)
- NO crear módulos sin declarar dependencias explícitamente
- NO saltarse el orden de generación de archivos

---

## Verificación

El diseño técnico responde todas estas preguntas:

- ¿Se escribió el archivo en `.agents/plans/<nombre>.md` siguiendo el template oficial?
- ¿El chat contiene solo el reporte sintético con preguntas de negocio y gaps?
- ¿Se respetan las 3 capas estrictas (presentation, domain, data)?
- ¿Se usan clases abstractas para los tokens de inyección?
- ¿Están identificadas las entidades, servicios y repositorios?
- ¿Se contempló la integración con infraestructura (TypeORM, transacciones, X-Road)?
- ¿Se verificó la ausencia de dependencias circulares con `npx madge --circular`?

## Al terminar

Confirmar que el diseño arquitectónico quedó guardado en `.agents/plans/<nombre>.md`. Reportar en el chat el resumen sintético y las preguntas de negocio pendientes de validación. Tras la aprobación humana, sugerir al usuario: **nestjs-developer** para implementar controladores, servicios, DTOs y mappers del módulo creado.
