---
name: wf-ds-token-sync
description: Pipeline de subagentes para sincronizar design tokens desde Figma hacia Style Dictionary y compilar packages/tokens
---

# Workflow: Design System Token Sync

Pipeline para mantener los tokens del monorepo `design-system` alineados con Figma (`packages/tokens/src/*.json`), auditar variables no asignadas o huérfanas, compilar con Style Dictionary y sincronizar el theme de `@design-system/react`.

## 👥 Roles y Modelos Recomendados

| Rol | Subagente | Modelo Sugerido | Herramientas | Modo |
|---|---|---|---|---|
| **Token Scout** | `@explorer` | Gemini Flash | MCP Figma, read_file | Solo lectura |
| **Theme Architect** | `@architect` | Claude Sonnet / Gemini Pro | read_file, write_file (`docs/*.md`) | Planificación |
| **Token Implementer**| `@coder` | Gemini Flash / Claude Sonnet | read_file, edit_file, terminal (`pnpm build:tokens`) | Edición y Build |
| **Monorepo QA** | `@reviewer` | Gemini Flash | read_file, terminal (`pnpm build`) | Auditoría y QA |

---

## 🔄 Fases del Pipeline

```
[Variables de Figma / JSON exportado]
                  │
                  ▼ (Gemini Flash)
            🔍 @explorer (Figma Token Scout — design-token-sync)
                  │
                  │ 📄 Genera: docs/token_sync_diff.md (transitorio)
                  ▼ (Claude Sonnet / Gemini Pro)
            📐 @architect (Impact Evaluator & Gaps Audit)
                  │
                  │ 📄 Genera: docs/token_sync_plan.md (con Oportunidades y Gaps)
                  ▼ ⏸️ [COMPUERTA 1: APROBACIÓN DE IMPACTO Y GAPS]
                  │ (Gemini Flash / Claude Sonnet)
            💻 @coder (Token Compiler — pnpm build:tokens)
                  │
                  │ 🔨 Actualiza: packages/tokens/src/*.json + theme
                  ▼ (Gemini Flash)
            🔎 @reviewer (Monorepo QA — pnpm build)
                  │
                  │ 📄 Genera: Diff de Tokens + Verificación de Build
                  ▼ ⏸️ [COMPUERTA 2: VALIDACIÓN DE QA Y THEME]
                  │
                  ▼ 🧹 Limpieza automática de temporales (docs/token_sync_*)
```

---

### Etapa 1: Extracción de Variables desde Figma (Bulk-Reader)
- **Responsable**: `@explorer`
- **Skill a invocar**: **`design-token-sync`**
- **Regla de Shunting**: La extracción de Figma debe filtrarse para extraer únicamente variables modificadas o añadidas. Prohibido volcar el JSON completo de Figma al chat.
- **Acciones**:
  1. Consultar el MCP de Figma (o leer el JSON exportado por diseño).
  2. Mapear cambios en variables: `colors`, `spacing`, `border-radius`, `typography`, `strokes`, `shadows`.
  3. Comparar contra `packages/tokens/src/*.json` y generar el diff sintetizado.
- **Salida**: Genera `docs/token_sync_diff.md` (documento transitorio de análisis, **estricto < 150 líneas**).

---

### Etapa 2: Validación de Impacto, Theme Mapping y Auditoría de Gaps
- **Responsable**: `@architect`
- **Acciones**:
  1. Verificar si los cambios son destructivos o si renombran tokens semánticos existentes.
  2. Definir actualizaciones requeridas en `packages/react/src/theme/` si se agregaron nuevas escalas.
  3. **Auditoría Proactiva de Cobertura y Gaps (OBLIGATORIO)**:
     - Identificar tokens en Figma que carecen de equivalente en Style Dictionary o tokens huérfanos que ya no se usan en el diseño.
     - Documentar estas inconsistencias en el plan.
- **Salida**: Genera `docs/token_sync_plan.md` conteniendo obligatoriamente:
  - Plan de sincronización y mapping al theme.
  - **Sección "Oportunidades de Mejora y Gaps Detectados"** (tokens huérfanos, faltantes o inconsistencias de nomenclatura).
  - **Sección "Preguntas de Decisión"**.

---

### 🛑 COMPUERTA 1: VALIDACIÓN HUMANA DE IMPACTO Y GAPS
> **Pausa obligatoria**: Revisión del impacto en el theme, decisión sobre gaps/tokens huérfanos y aprobación del desarrollador antes de regenerar tokens.

---

### Etapa 3: Actualización y Compilación de Tokens (Direct-to-Disk Writing)
- **Responsable**: `@coder`
- **Regla Direct-to-Disk**: Editar los JSONs de tokens y compilar directo a disco. Prohibido volcar los JSONs completos en el chat; reportar solo los tokens modificados/agregados.
- **Acciones**:
  1. Actualizar los archivos correspondientes en `packages/tokens/src/` (`colors.json`, `semantico.json`, `spacing.json`, etc.).
  2. Ejecutar en `packages/tokens/`: `pnpm build:tokens` (genera `tokens.css` y `tokens.json`).
  3. Actualizar `packages/react/src/theme/` si aplica.
- **Salida**: Archivos de tokens actualizados y compilados en disco.

---

### Etapa 4: Verificación de Build General y QA
- **Responsable**: `@reviewer`
- **Acciones**:
  1. Ejecutar `pnpm build` en la raíz del monorepo `design-system`.
  2. Ejecutar `component-qa` sobre componentes clave para verificar que no haya regresiones visuales.
  3. **Compuerta de Validación de QA**: Presentar al desarrollador el reporte sintético de compilación y los tokens actualizados, esperando su interacción.
  4. **Limpieza estricta de temporales**: Al concluir la verificación y presentar el reporte, eliminar de forma obligatoria los archivos temporales (`docs/token_sync_diff.md`, `docs/token_sync_plan.md`, reportes locales) para mantener el repositorio 100% limpio.
- **Salida**: Build general exitoso, reporte sintético de consistencia y workspace limpio de temporales.
