---
name: wf-front-bugfix
description: Pipeline de subagentes para diagnóstico, corrección y verificación de bugs en el frontend de producción
---

# Workflow: Frontend Bugfix Pipeline

Pipeline ágil para investigar la causa raíz de un error en frontend, auditar posibles patrones repetidos o efectos colaterales en componentes similares, aplicar un fix quirúrgico y verificar calidad antes de integrar.

## 👥 Roles y Modelos Recomendados

| Rol | Subagente | Modelo Sugerido | Herramientas | Modo |
|---|---|---|---|---|
| **Diagnóstico** | `@debugger` | Gemini Flash / Claude Sonnet | read_file, codebase-memory, terminal | Diagnóstico |
| **Implementador** | `@coder` | Claude Sonnet / Gemini Flash | read_file, write_file, edit_file | Código |
| **Auditor / QA** | `@reviewer` | Gemini Flash | read_file, terminal, edit | Auditoría y QA |

---

## 🔄 Fases del Pipeline

```
[Reporte del Bug / Logs / Sentry]
                │
                ▼ (Gemini Flash / Claude Sonnet)
          🐞 @debugger (Root Cause Analysis + Gaps & Side Effects Audit)
                │
                │ 📄 Aísla causa raíz & documenta oportunidades/gaps
                ▼ ⏸️ [COMPUERTA 1: VALIDACIÓN DE DIAGNÓSTICO Y ALCANCE]
                │ (Claude Sonnet / Gemini Flash)
          💻 @coder (Fix Quirúrgico)
                │
                │ 🔨 Aplica cambio mínimo sin efectos colaterales
                ▼ (Gemini Flash)
          🔎 @reviewer (code-review + code-health + generate-qa-checklist)
                │
                │ 📄 Genera: Casos de prueba del fix y regresión
                ▼ ⏸️ [COMPUERTA 2: VALIDACIÓN DE QA Y TESTING]
                │
                ▼ 🧹 Limpieza automática de temporales (qa_checklist.md, reportes)
```

---

### Etapa 1: Diagnóstico de Causa Raíz y Auditoría de Gaps
- **Responsable**: `@debugger`
- **Skill a invocar**: **`debug-flow`**
- **Regla de Shunting**: No leer archivos de más de 350 líneas completos. Usar el grafo semántico disponible (`codebase-memory-mcp` o `graphify query` si existe `graphify-out/`), o lecturas quirúrgicas (`StartLine`/`EndLine`).
- **Acciones**:
  1. Aislar y reproducir el bug a partir de la traza de error, payload o pasos del usuario.
  2. Trazar el flujo de datos: `pages/` $\rightarrow$ `hooks/` $\rightarrow$ `services/` $\rightarrow$ API / Backend.
  3. Identificar la causa raíz exacta (ej. condición de carrera en React Query, schema de Zod que rechaza nulls inesperados, mutación de estado directa).
  4. **Auditoría de Gaps y Riesgos**: Analizar si el mismo patrón defectuoso se repite en otros componentes o módulos similares del proyecto y señalar si conviene prevenirlo.
- **Salida**: Diagnóstico confirmado, propuesta de fix mínimo y sección de **Oportunidades de Mejora / Gaps Detectados**.

---

### 🛑 COMPUERTA 1: VALIDACIÓN DE DIAGNÓSTICO Y ALCANCE
> **Pausa obligatoria**: El desarrollador valida la causa raíz identificada y decide si resolver solo el punto puntual o incluir fixes preventivos sugeridos.

---

### Etapa 2: Corrección Quirúrgica
- **Responsable**: `@coder`
- **Entrada**: Diagnóstico y decisiones de `@debugger`.
- **Reglas mandatorias**:
  - Aplicar exclusivamente el cambio mínimo necesario acordado.
  - Asegurar que los fallbacks y estados de error no queden en blanco.
  - No refactorizar código no relacionado dentro del mismo commit/fix.
- **Salida**: Fix aplicado en el workspace.

---

### Etapa 3: Verificación, Code Review y QA (Direct-to-Disk Writing)
- **Responsable**: `@reviewer`
- **Skills a invocar**: **`code-review`** + **`code-health`** + **`generate-qa-checklist`**
- **Regla Direct-to-Disk**: `qa_checklist.md` se escribe directo en disco. Solo se reportan métricas de flujos y casos en el chat sin imprimir tablas exhaustivas.
- **Acciones**:
  1. Ejecutar **`code-health`** (`pnpm run lint` y `tsc --noEmit`).
  2. Ejecutar **`code-review`** sobre el diff para verificar que no haya regresiones ni variables no utilizadas.
  3. Ejecutar **`generate-qa-checklist`** (escribe directo a disco `qa_checklist.md`).
  4. **Compuerta de Validación de QA**: Presentar al desarrollador el reporte sintético de verificación y la matriz de pruebas, esperando su interacción.
  5. **Limpieza estricta de temporales**: Al concluir la verificación y presentar el reporte, eliminar cualquier archivo temporal (`qa_checklist.md`, logs o reportes transitorios) para mantener el workspace de Git completamente limpio.
- **Salida**: Reporte sintético de verificación y testing presentado al usuario con workspace limpio de archivos temporales.
