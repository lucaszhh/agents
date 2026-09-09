---
name: wf-back-feature
description: Pipeline de subagentes para el desarrollo completo de un módulo/feature backend en NestJS (Clean Architecture / DDD -> Implementación -> Migración -> Tests)
---

# Workflow: Backend Feature Pipeline

Pipeline estandarizado para el desarrollo de módulos backend en NestJS bajo los lineamientos de Enterprise Production Platform: Clean Architecture / DDD, inyección de dependencias desacoplada, patrón Result, persistencia aislada con TypeORM, integración X-Road y pruebas unitarias con Jest.

## 👥 Roles y Modelos Recomendados

| Rol | Subagente | Modelo Sugerido | Herramientas | Modo |
|---|---|---|---|---|
| **Domain Scout** | `@explorer` | Gemini Flash / Haiku | read_file, codebase-memory / graphify | Solo lectura |
| **Backend Architect** | `@architect` | Claude Sonnet / Gemini Pro | read_file, write_file (solo `docs/*.md`) | Planificación |
| **Backend Developer** | `@coder` | Claude Sonnet / Gemini Pro | read_file, write_file, edit_file, terminal | Implementación |
| **Tester & QA** | `@reviewer` | Gemini Flash / Sonnet | read_file, write_file (`*.spec.ts`), terminal (`npm test`) | Testing & QA |

---

## 🔄 Fases del Pipeline

```
[Requerimiento / Contrato X-Road / Entidades]
                   │
                   ▼ (Gemini Flash)
             🔍 @explorer (Domain Scout & Entity Analysis)
                   │
                   │ 📄 Genera: docs/back_context_<feature>.md (transitorio)
                   ▼ (Claude Sonnet / Gemini Pro)
             📐 @architect (Backend Architect — nestjs-architect + Gaps Audit)
                   │
                   │ 📄 Genera: docs/back_plan_<feature>.md (con Oportunidades y Gaps)
                   ▼ ⏸️ [COMPUERTA 1: APROBACIÓN DE ARQUITECTURA Y GAPS]
                   │ (Claude Sonnet / Gemini Pro)
                   │
                   │ 🔨 Implementa: domain/ + data/ + presentation/ + Migración
                   ▼ (Gemini Flash / Sonnet)
             🔎 @reviewer (nestjs-unit-tester + nextjs-code-review + Jest OK)
                   │
                   │ 📄 Genera: *.spec.ts + Matriz de QA Checklist
                   ▼ ⏸️ [COMPUERTA 2: VALIDACIÓN DE TESTS Y QA]
                   │
                   ▼ 🧹 Limpieza automática de temporales (docs/back_context_*, docs/back_plan_*, qa_checklist.md)
```

---

### Etapa 1: Ingesta y Análisis de Dominio (Protocolo Bulk-Reader)
- **Responsable**: `@explorer` (Modelo ligero: Gemini Flash)
- **Reglas de Shunting y Grafo de Conocimiento**:
  - Prohibido leer archivos > 350 líneas completos. Usar el grafo semántico disponible:
    - **Si el proyecto usa `codebase-memory-mcp`**: `search_graph`, `get_code_snippet`, `trace_path`.
    - **Si el proyecto usa `graphify`** (con `graphify-out/`): `graphify query`, `graphify path` o navegar la wiki.
  - Alternativamente, usar lecturas quirúrgicas acotadas (`StartLine`/`EndLine`).
  - Los contratos Swagger / X-Road deben resumirse estrictamente en viñetas estructuradas.
- **Acciones**:
  1. Identificar el dominio de negocio, entidades requeridas y casos de uso.
  2. Mapear requerimientos de integración técnica (servicios externos, publicación/consumo X-Road).
  3. Analizar módulos existentes en `src/modules/` para replicar patrones de persistencia y servicios mediante consultas al grafo semántico.
- **Salida**: Genera `docs/back_context_<feature>.md` (documento transitorio de análisis, **estricto < 150 líneas**, estilo *bulk-reader*).

---

### Etapa 2: Diseño de Arquitectura, Capas y Auditoría de Gaps
- **Responsable**: `@architect` (Modelo de razonamiento: Claude Sonnet / Gemini Pro)
- **Skill a invocar**: **`nestjs-architect`**
- **Lectura previa obligatoria**: `docs/back_context_<feature>.md`, estructura de `src/modules/`, `package.json`.
- **Acciones**:
  1. Diseñar la estructura de carpetas bajo `src/modules/<feature>/`:
     - `<feature>.module.ts`: Definición de imports, controllers y providers con DI desacoplada.
     - `domain/`: Interfaces abstractas de servicios (`abstract class IFeatureService`) e interfaces de entidades.
     - `data/`: Interfaces de repositorio (`abstract class IFeatureRepository`) e implementaciones de persistencia TypeORM.
     - `presentation/`: Controllers, DTOs (con validadores `class-validator`) y mappers estáticos.
  2. Definir contratos de métodos y tipos de error del patrón `Result<T, E>`.
  3. **Auditoría Proactiva de Cobertura y Gaps (OBLIGATORIO)**:
     - Detectar si el requerimiento omite endpoints CRUD naturales, validaciones de seguridad/roles, índices de base de datos o casos de error no contemplados en contratos de terceros.
     - Documentar explícitamente estas oportunidades de mejora para decisión del desarrollador.
- **Salida**: Genera `docs/back_plan_<feature>.md` conteniendo obligatoriamente:
  - Diseño de capas e interfaces abstractas.
  - **Sección "Oportunidades de Mejora y Gaps Detectados"** (análisis de contratos adyacentes, índices y validaciones adicionales).
  - **Sección "Preguntas de Negocio"** (consultas de alcance y negocio).

---

### 🛑 COMPUERTA 1: VALIDACIÓN HUMANA DE ARQUITECTURA Y GAPS
> **Pausa obligatoria**: El desarrollador valida el diseño de capas, interfaces abstractas, responde las dudas de negocio y decide sobre las oportunidades/gaps antes de codificar.

---

### Etapa 3: Implementación Backend y Migraciones (Direct-to-Disk Writing)
- **Responsable**: `@coder` (Modelo implementador: Claude Sonnet / Gemini Pro)
- **Entrada**: `docs/back_plan_<feature>.md` aprobado + decisiones de gaps y negocio.
- **Reglas mandatorias**:
  - **Patrón Result**: Los servicios de dominio devuelven `Result<T, E>` y no lanzan excepciones no controladas para errores de negocio.
  - **Controladores**: Mapean `Result` a HTTP usando `ErrorMapperToHttp`, inyectan `@CurrentUser()` e incluyen decoradores de trazabilidad `@TraceBreadcrumb`.
  - **Mappers estáticos**: Conversión explícita entre DTOs y entidades en `presentation/dtos/`.
  - **Migración Direct-to-Disk**: Si se crearon o modificaron entidades en `src/entities/<dominio>/`, generar la migración manual directamente en `src/migrations/<dominio>/` usando `write_to_file`. Prohibido volcar el archivo TypeScript de migración completo en el chat; reportar solo el resumen (tablas/columnas agregadas y rollback simétrico).
- **Salida**: Código del módulo implementado y registrado en NestJS con migración escrita en disco.

---

### Etapa 4: Unit Testing y QA de Integración (Direct-to-Disk Writing)
- **Responsable**: `@reviewer` (Modelo tester/auditor: Gemini Flash / Sonnet)
- **Skills a invocar**: **`nestjs-unit-tester`** + **`nextjs-code-review`** + **`generate-qa-checklist`**
- **Regla Direct-to-Disk**:
  - Los archivos `*.spec.ts` y `qa_checklist.md` se escriben **directamente a disco** (`write_to_file`).
  - Prohibido volcar el código fuente de los tests o tablas completas de QA en el chat.
  - `@reviewer` únicamente reporta: suites de tests creadas (signaturas básicas de éxito y fallo), resultado de `npm test`, coverage y resumen de casos de QA.
- **Acciones**:
  1. Escribir pruebas unitarias `*.spec.ts` para controladores, servicios y repositorios usando Jest y `TestingModule` directamente a disco.
  2. Aplicar el patrón AAA (Arrange-Act-Assert) y testear tanto el camino feliz como los casos de fallo del patrón `Result`.
  3. Ejecutar la suite de tests (`npm test` o `pnpm test`) y verificar que todos pasen con cobertura adecuada.
  4. Ejecutar `nextjs-code-review` sobre el diff contra `develop`.
  5. Ejecutar `generate-qa-checklist` (escribe directo a disco `qa_checklist.md`).
  6. **Compuerta de Validación de Tests y QA**: Presentar al desarrollador el reporte sintético de ejecución de tests y la matriz de pruebas de QA, esperando su interacción.
  7. **Limpieza estricta de temporales**: Al concluir la verificación y presentar el reporte, eliminar de forma obligatoria todos los archivos temporales generados en el ciclo (`docs/back_context_<feature>.md`, `docs/back_plan_<feature>.md`, `qa_checklist.md`, logs transitorios) para dejar el árbol de Git (`git status`) 100% limpio.
- **Salida**: Tests unitarios passing (`*.spec.ts`), reporte sintético de verificación, matriz de pruebas de QA y workspace limpio de temporales.
