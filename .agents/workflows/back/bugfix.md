---
name: wf-back-bugfix
description: Pipeline de subagentes para diagnóstico, corrección y blindaje con tests unitarios de bugs en backend NestJS
---

# Workflow: Backend Bugfix Pipeline

Pipeline ágil para investigar la causa raíz de un fallo en el backend de NestJS, aplicar una corrección limpia respetando el patrón Result y agregar cobertura de pruebas de regresión.

## 👥 Roles y Modelos Recomendados

| Rol | Subagente | Modelo Sugerido | Herramientas | Modo |
|---|---|---|---|---|
| **Diagnóstico** | `@debugger` | Gemini Flash / Sonnet | read_file, codebase-memory, terminal | Diagnóstico |
| **Implementador** | `@coder` | Claude Sonnet / Gemini Flash | read_file, write_file, edit_file | Código |
| **Tester / QA** | `@reviewer` | Gemini Flash / Sonnet | read_file, write_file (`*.spec.ts`), terminal (`npm test`) | Testing & QA |

---

## 🔄 Fases del Pipeline

```
[Reporte de Error / Sentry / Logs]
                │
                ▼ (Gemini Flash / Sonnet)
          🐞 @debugger (Root Cause Analysis)
                │
                │ 📄 Aísla causa raíz en Controller/Service/Repository
                ▼ (Claude Sonnet / Gemini Flash)
          💻 @coder (Fix Quirúrgico con Patrón Result)
                │
                │ 🔨 Aplica corrección limpia
                ▼ (Gemini Flash / Sonnet)
          🔎 @reviewer (nestjs-unit-tester + Jest Regression Test)
                │
                │ 📄 Genera: *.spec.ts + qa_checklist.md (Regresión)
                ▼ ⏸️ [COMPUERTA: VALIDACIÓN DE TESTS Y QA]
                │
                ▼ 🧹 Limpieza automática de temporales (qa_checklist.md, logs)
```

---

### Etapa 1: Diagnóstico de Causa Raíz
- **Responsable**: `@debugger`
- **Regla de Shunting**: No volcar archivos grandes (> 350 líneas). Usar el grafo semántico disponible (`codebase-memory-mcp` o `graphify query` si existe `graphify-out/`), o lecturas quirúrgicas (`StartLine`/`EndLine`).
- **Acciones**:
  1. Analizar la traza de error, payload o logs del endpoint afectado.
  2. Trazar el flujo de ejecución: `controller` $\rightarrow$ `service` $\rightarrow$ `repository` $\rightarrow$ DB / X-Road.
  3. Identificar la causa raíz exacta (ej: error no mapeado en Result, query TypeORM que no contempla registros nulos, validación de DTO incompleta).
- **Salida**: Diagnóstico confirmado y propuesta del fix mínimo.

---

### Etapa 2: Corrección Quirúrgica
- **Responsable**: `@coder`
- **Acciones**:
  1. Aplicar la corrección sin modificar contratos ni romper interfaces abstractas.
  2. Asegurar que los errores se capturen y devuelvan a través de `Result`.
- **Salida**: Fix implementado en el workspace.

---

### Etapa 3: Test Unitario de Regresión y QA (Direct-to-Disk Writing)
- **Responsable**: `@reviewer`
- **Skill a invocar**: **`nestjs-unit-tester`** + **`generate-qa-checklist`**
- **Regla Direct-to-Disk**:
  - Escribir `*.spec.ts` y `qa_checklist.md` directamente a disco con `write_to_file`.
  - Prohibido volcar el código fuente completo en el chat; solo reportar el spec creado/modificado, signatura del test de regresión, resultado de Jest y resumen de casos de QA.
- **Acciones**:
  1. Escribir o actualizar el test unitario en `*.spec.ts` directamente a disco para reproducir el bug y blindar el caso.
  2. Ejecutar la suite de Jest (`npm test` o `pnpm test`) verificando que el fix resuelva el error.
  3. Ejecutar `generate-qa-checklist` (escribe directo a disco `qa_checklist.md`).
  4. **Compuerta de Validación de Tests y QA**: Presentar al desarrollador el reporte sintético de ejecución de tests y la matriz de pruebas, esperando su interacción.
  5. **Limpieza estricta de temporales**: Al concluir la verificación y presentar el reporte, eliminar cualquier archivo temporal (`qa_checklist.md`, reportes o logs transitorios) para dejar el repositorio completamente limpio.
- **Salida**: Test pasando (`*.spec.ts`), matriz de pruebas sintética y workspace limpio de temporales.
