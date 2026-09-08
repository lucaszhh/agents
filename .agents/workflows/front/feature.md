---
name: wf-front-feature
description: Pipeline de subagentes para el desarrollo completo de features frontend en producción (Figma -> Arquitectura -> Implementación -> QA)
---

# Workflow: Frontend Feature Pipeline

Pipeline de desarrollo frontend estandarizado para el proyecto Enterprise Production Platform.
Orquesta la ingesta de diseño, planificación técnica, auditoría de gaps de negocio/consistencia, codificación desacoplada y auditoría de calidad mediante roles especializados, compuertas de interacción y handoff de artefactos.

## 👥 Roles y Modelos Recomendados

| Rol | Subagente | Modelo Sugerido | Herramientas | Modo |
|---|---|---|---|---|
| **Context Scout** | `@explorer` | Gemini Flash / Haiku | MCP Figma, codebase-memory / graphify, read_file | Solo lectura |
| **Tech Lead** | `@architect` | Claude Sonnet / Gemini Pro | read_file, write_file (solo `docs/*.md`) | Planificación |
| **Implementador** | `@coder` | Claude Sonnet / Gemini Pro | read_file, write_file, edit_file, terminal | Código |
| **Auditor / QA** | `@reviewer` | Gemini Flash / Sonnet | read_file, terminal (`pnpm run lint`), edit | Auditoría y QA |

---

## 🔄 Fases del Pipeline

```
[MCP Figma + Swagger + Diffs]
           │
           ▼ (Gemini Flash)
      🔍 @explorer (Context Scout & Figma Ingest)
           │
           │ 📄 Genera: docs/context_<feature>.md (transitorio)
           ▼ (Claude Sonnet / Gemini Pro)
      📐 @architect (Tech Lead — architecture-review + design-craft + Gaps Audit)
           │
           │ 📄 Genera: docs/plan_<feature>.md (con sección Oportunidades y Gaps)
           ▼ ⏸️ [COMPUERTA 1: APROBACIÓN DE ARQUITECTURA Y DECISIÓN DE GAPS]
           │ (Claude Sonnet / Gemini Pro)
      💻 @coder (Implementador Frontend)
           │
           │ 🔨 Escribe componentes, hooks, services, domain
           ▼ (Gemini Flash / Sonnet)
      🔎 @reviewer (QA Visual & Code Health — design-audit + code-review + code-health)
           │
           │ 📄 Genera: Matriz de QA (Happy path, Edge cases, Negativos, Regresión)
           ▼ ⏸️ [COMPUERTA 2: VALIDACIÓN DE QA Y TESTING]
           │
           ▼ 🧹 Limpieza automática de temporales (docs/context_*, docs/plan_*, qa_checklist.md)
```

---

### Etapa 1: Ingesta y Extracción de Contexto (Protocolo Bulk-Reader)
- **Responsable**: `@explorer` (Modelo ligero: Gemini Flash / Claude Haiku)
- **Reglas de Shunting y Grafo de Conocimiento**:
  - Para inspeccionar módulos o archivos existentes (> 350 líneas), usar el grafo del proyecto:
    - **Si el proyecto usa `codebase-memory-mcp`**: `search_graph`, `get_code_snippet`, `trace_path`.
    - **Si el proyecto usa `graphify`** (con `graphify-out/`): `graphify query`, `graphify path` o wiki.
  - Alternativamente, usar lecturas quirúrgicas (`StartLine`/`EndLine`). Prohibido volcar archivos completos.
  - La respuesta de Figma MCP y Swagger debe sintetizarse estrictamente en viñetas estructuradas.
- **Acciones**:
  1. Extraer del MCP de Figma las especificaciones de diseño esenciales (tokens, espaciados, componentes Mobile y Desktop).
  2. Mapear endpoints de backend/firmadores y contratos necesarios.
  3. Identificar módulos similares en `src/modules/` para replicar patrones existentes mediante consultas al grafo semántico.
- **Salida**: Genera `docs/context_<feature>.md` (documento transitorio de análisis, **estricto < 150 líneas**, estilo *bulk-reader*).

---

### Etapa 2: Revisión de Arquitectura, Craft y Auditoría de Gaps
- **Responsable**: `@architect` (Modelo de razonamiento: Claude Sonnet / Gemini Pro)
- **Skills a invocar**: **`architecture-review`** + **`design-craft`**
- **Lectura previa obligatoria**: `docs/context_<feature>.md`, `AGENTS.md`, `package.json`.
- **Acciones**:
  1. Diseñar la estructura de carpetas en `src/modules/<dominio>/`:
     - `domain/` $\rightarrow$ entidades, tipos TypeScript, mapeos
     - `services/` $\rightarrow$ llamadas HTTP encapsuladas (prohibido `fetch` directo en componentes)
     - `query/keys.ts` $\rightarrow$ centralización de React Query Keys
     - `hooks/` $\rightarrow$ `useQuery` / `useMutation`
     - `components/` $\rightarrow$ UI desacoplada consumiendo `@desingSystem/*`
     - `pages/` $\rightarrow$ entrypoints y contenedores de ruta
  2. Definir esquemas de validación Zod y tipado TypeScript estricto.
  3. Asegurar que los formularios usen `react-hook-form` + `zod` en componentes dumb.
  4. Prohibir el uso directo de `@mui/*` fuera de `src/modules/desingSystem/`.
  5. **Auditoría Proactiva de Cobertura y Gaps (OBLIGATORIO)**:
     - Analizar si el requerimiento funcional deja elementos adyacentes o simétricos sin cubrir (ej. enlaces del sidebar sin tracking, estados de error no contemplados, botones secundarios sin acción).
     - Documentar explícitamente estas oportunidades de mejora para que el desarrollador decida si incluirlas antes de codificar.
- **Salida**: Genera `docs/plan_<feature>.md` conteniendo obligatoriamente:
  - Desglose técnico de componentes y hooks.
  - **Sección "Oportunidades de Mejora y Gaps Detectados"** (análisis de consistencia y elementos omitidos en el requerimiento original).
  - **Sección "Preguntas de Negocio"** (consultas explícitas de alcance al usuario).

---

### 🛑 COMPUERTA 1: VALIDACIÓN HUMANA DE ARQUITECTURA Y GAPS
> **Pausa obligatoria**: El desarrollador revisa `docs/plan_<feature>.md`, responde las preguntas de negocio, decide sobre las oportunidades/gaps planteados y aprueba formalmente el inicio de la implementación.

---

### Etapa 3: Implementación Frontend
- **Responsable**: `@coder` (Modelo implementador: Claude Sonnet / Gemini Pro)
- **Entrada**: `docs/plan_<feature>.md` aprobado + decisiones de gaps y negocio.
- **Reglas mandatorias**:
  - Prohibido importar `@mui/*` directamente fuera de `src/modules/desingSystem/`.
  - Prohibido hardcodear colores (`#fff`, `#0284c7`, etc.) — usar siempre tokens del DS.
  - Cubrir siempre los 4 estados de UI: `loading`, `empty`, `error`, `success`.
  - Formularios desacoplados con `react-hook-form` + `zod` en componentes dumb.
  - Toda llamada HTTP debe residir en `services/` y consumirse vía `hooks/`.
- **Salida**: Código implementado en `src/modules/<dominio>/`.

---

### Etapa 4: Auditoría, Code Review y QA (Direct-to-Disk Writing)
- **Responsable**: `@reviewer` (Modelo auditor: Gemini Flash / Claude Sonnet)
- **Skills a invocar**: **`design-audit`** + **`code-review`** + **`code-health`** + **`generate-qa-checklist`**
- **Regla Direct-to-Disk**: La matriz de QA se escribe directamente en `qa_checklist.md`. `@reviewer` solo presenta en el chat un reporte sintético con métricas de cobertura y resumen de flujos, sin imprimir tablas exhaustivas.
- **Acciones**:
  1. Ejecutar **`code-health`** (`pnpm run lint` y validación de tipos `tsc --noEmit`).
  2. Ejecutar **`design-audit`** para verificar consistencia visual, paddings, jerarquía tipográfica y tokens.
  3. Ejecutar **`code-review`** sobre el diff pre-merge contra `develop`.
  4. Ejecutar **`generate-qa-checklist`** (escribe directo a disco `qa_checklist.md`).
  5. **Compuerta de Validación de QA**: Presentar al desarrollador el reporte sintético de verificación y métricas de testing, esperando su interacción.
  6. **Limpieza estricta de temporales**: Al concluir la verificación y presentar el reporte, eliminar de forma obligatoria todos los archivos temporales generados en el ciclo (`docs/context_<feature>.md`, `docs/plan_<feature>.md`, `qa_checklist.md`, reportes locales) para dejar el árbol de Git (`git status`) 100% limpio.
- **Salida**: Reporte de QA sintético, matriz de pruebas para el equipo de testing y workspace limpio de temporales.
