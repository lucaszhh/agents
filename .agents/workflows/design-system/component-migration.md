---
name: wf-ds-component-migration
description: Pipeline de subagentes para migrar componentes del legacy al monorepo design-system (@design-system/react + Storybook)
---

# Workflow: Design System Component Migration

Pipeline estandarizado para portar componentes desde el frontend legacy (`frontend-nextjs/src/modules/desingSystem/`) hacia el monorepo `design-system` (`packages/react/src/components/<Nombre>/`), auditando mejoras de API, generando su tipado en el theme, export en el barrel y story en Storybook.

## 👥 Roles y Modelos Recomendados

| Rol | Subagente | Modelo Sugerido | Herramientas | Modo |
|---|---|---|---|---|
| **Legacy Scout** | `@explorer` | Gemini Flash / Haiku | read_file, codebase-memory | Solo lectura |
| **Theme Architect** | `@architect` | Claude Sonnet / Gemini Pro | read_file, write_file (solo `docs/*.md`) | Planificación |
| **DS Implementer** | `@coder` | Claude Sonnet / Gemini Pro | read_file, write_file, edit_file, terminal | Implementación |
| **Component QA** | `@reviewer` | Gemini Flash / Sonnet | read_file, terminal (`pnpm build:react`), edit | Auditoría y QA |

---

## 🔄 Fases del Pipeline

```
[Componente Legacy en frontend-nextjs]
                 │
                 ▼ (Gemini Flash)
           🔍 @explorer (Legacy Scout & Props Extractor)
                 │
                 │ 📄 Genera: docs/ds_migration_<component>.md (transitorio)
                 ▼ (Claude Sonnet / Gemini Pro)
           📐 @architect (Theme Architect — component-migrator + Gaps Audit)
                 │
                 │ 📄 Genera: docs/ds_plan_<component>.md (API Contract + Gaps)
                 ▼ ⏸️ [COMPUERTA 1: APROBACIÓN DE MIGRACIÓN Y GAPS]
                 │ (Claude Sonnet / Gemini Pro)
           💻 @coder (DS Implementer)
                 │
                 │ 🔨 Crea: Componente + Theme Augmentation + Storybook Story
                 ▼ (Gemini Flash / Sonnet)
           🔎 @reviewer (Component QA — component-qa + build:react)
                 │
                 │ 📄 Genera: Reporte de QA + Paridad Visual Verificada
                 ▼ ⏸️ [COMPUERTA 2: VALIDACIÓN DE QA Y PARIDAD]
                 │
                 ▼ 🧹 Limpieza automática de temporales (docs/ds_migration_*, docs/ds_plan_*)
```

---

### Etapa 1: Análisis del Componente Legacy (Bulk-Reader)
- **Responsable**: `@explorer` (Modelo ligero: Gemini Flash)
- **Reglas de Shunting**:
  - Si el componente legacy supera las 350 líneas, hacer lecturas quirúrgicas (`StartLine`/`EndLine`) enfocadas en interface/props y retorno JSX principal.
- **Acciones**:
  1. Leer la implementación original en `frontend-nextjs/src/modules/desingSystem/<Componente>/`.
  2. Mapear props públicas (API del componente), estados internos y componentes MUI base que utiliza.
  3. Identificar estilos inline / hardcodeados y verificar si existen tokens correspondientes en `packages/tokens/src/`.
  4. Detectar y filtrar dependencias de negocio (turns, procedures, users) — **prohibido migrarlas al DS**.
- **Salida**: Genera `docs/ds_migration_<component>.md` (documento transitorio de análisis, **estricto < 150 líneas**, estilo *bulk-reader*).

---

### Etapa 2: Diseño de API, Theme Augmentation y Auditoría de Gaps
- **Responsable**: `@architect` (Modelo de razonamiento: Claude Sonnet / Gemini Pro)
- **Skill a invocar**: **`component-migrator`**
- **Lectura previa obligatoria**: `docs/ds_migration_<component>.md`, `AGENTS.md` y `DESIGN.md` de `design-system`.
- **Acciones**:
  1. Diseñar el wrapper sobre MUI o compound component en `packages/react/src/components/<Nombre>/`.
  2. Definir si requiere nuevas variantes en el theme de MUI y diseñar el module augmentation en `packages/react/src/types/`.
  3. Planificar la Story de Storybook con todas las variantes y controles (`args`).
  4. **Auditoría Proactiva de Cobertura y Gaps (OBLIGATORIO)**:
     - Identificar deuda técnica del componente legacy (props inconsistentes, falta de tipado estricto, estilos inline que no tenían tokens).
     - Proponer mejoras de refactor para sanear la API durante la migración sin romper compatibilidad básica.
- **Salida**: Genera `docs/ds_plan_<component>.md` conteniendo obligatoriamente:
  - API propuesta y checklist de migración.
  - **Sección "Oportunidades de Mejora y Gaps Detectados"** (refactors, tokens faltantes, mejoras de accesibilidad).
  - **Sección "Preguntas de Decisión"**.

---

### 🛑 COMPUERTA 1: VALIDACIÓN HUMANA DE API Y GAPS
> **Pausa obligatoria**: El desarrollador valida la API de props propuesta, aprueba los refactors/gaps planteados antes de escribir código.

---

### Etapa 3: Implementación en Monorepo (Direct-to-Disk Writing)
- **Responsable**: `@coder` (Modelo implementador: Claude Sonnet / Gemini Pro)
- **Entrada**: `docs/ds_plan_<component>.md` aprobado.
- **Regla Direct-to-Disk**:
  - Escribir los archivos del componente, types y storybook directamente a disco con `write_to_file`.
  - Prohibido volcar el archivo completo de código fuente en la conversación; solo reportar archivos creados y exportados.
- **Reglas mandatorias**:
  - Prohibido importar tipos de negocio (`turns`, `procedures`, `users`).
  - Nunca usar hex/px hardcodeados — consumir tokens y theme de MUI.
  - Crear el componente en `packages/react/src/components/<Nombre>/`.
  - Exportar tipos y componente en `packages/react/src/index.ts`.
  - Crear story exhaustiva en `apps/docs/src/stories/<Nombre>.stories.tsx` cubriendo todos los estados (`default`, `hover`, `disabled`, `focus`, `loading`).
- **Salida**: Componente, types y Story creados en disco.

---

### Etapa 4: QA de Componente, Paridad y Build (Direct-to-Disk Writing)
- **Responsable**: `@reviewer` (Modelo auditor: Gemini Flash / Sonnet)
- **Skill a invocar**: **`component-qa`** + **`nextjs-code-review`**
- **Acciones**:
  1. Ejecutar `pnpm build:react` en `design-system/` para garantizar compilación y tipos limpios.
  2. Auditar checklist de `component-qa`: uso estricto de tokens, a11y (labels, contrast, focus rings), cobertura de variantes.
  3. Ejecutar `nextjs-code-review` sobre el diff pre-merge para verificar paridad funcional con el componente legacy.
  4. **Compuerta de Validación de QA**: Presentar al desarrollador el reporte sintético de QA, estado de Storybook y paridad de props, esperando su interacción.
  5. **Limpieza estricta de temporales**: Al concluir la verificación y presentar el reporte, eliminar de forma obligatoria los archivos temporales (`docs/ds_migration_<component>.md`, `docs/ds_plan_<component>.md`, reportes locales) para mantener el repositorio 100% limpio.
- **Salida**: Componente migrado, build exitoso, reporte sintético de paridad y workspace limpio de temporales.
