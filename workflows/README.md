# Workflows — Pipelines de Subagentes (Enterprise)

Esta carpeta contiene los **Workflows** de desarrollo de Enterprise Production Platform organizados por dominio. Un workflow es una guía de orquestación paso a paso que coEnterprise Architecture múltiples **Skills** y asigna roles de **Subagentes** con perfiles de modelos de IA optimizados para cada etapa.

---

## 🗂️ Estructura por Dominios

| Dominio | Carpeta | Para qué | Workflows |
|---|---|---|---|
| **Frontend** | [`front/`](./front/) | Desarrollo en `frontend-nextjs` (features, refactors, bugfixes) | [`feature.md`](./front/feature.md), [`bugfix.md`](./front/bugfix.md) |
| **Design System** | [`design-system/`](./design-system/) | Desarrollo en monorepo `design-system` (tokens, componentes, QA) | [`component-migration.md`](./design-system/component-migration.md), [`token-sync.md`](./design-system/token-sync.md), [`component-new.md`](./design-system/component-new.md) |


---

## 🤖 Estrategia de Subagentes y Model Routing

El pipeline divide el trabajo según la complejidad cognitiva de cada tarea para **ahorrar costos y evitar la saturación de la ventana de contexto**:

```
[Ingesta Masiva / MCPs]      [Razonamiento & Arquitectura]       [Implementación]          [Auditoría / QA]
       @explorer                        @architect                    @coder                  @reviewer
 ─────────────────────       ─────────────────────────────       ──────────────────       ─────────────────
  Gemini Flash / Haiku        Claude Sonnet / Gemini Pro          Claude Sonnet / Pro       Gemini Flash / Haiku
  (Tokens baratos/rápidos)   (Alta precisión de diseño)          (Código limpio/zod)      (Chequeos y lint)
```

---

## 📑 Contrato de Handoff por Artefactos

Para mantener el control y evitar alucinaciones, la información viaja entre etapas mediante archivos Markdown estructurados:

1. `docs/context_<feature>.md`: Resumen técnico generado por `@explorer` a partir de Figma y contratos de backend (**estricto < 150 líneas**, estilo *bulk-reader*).
2. `.agents/plans/<feature>.md`: Plan técnico y preguntas de negocio generado por `@architect` (escritura directa a disco, sin volcar el plan en el chat).
3. **Pausa de validación**: El desarrollador responde las dudas y aprueba el plan.
4. Código en `src/modules/<dominio>/` o `packages/react/`: Implementación realizada por `@coder`.
5. `qa_checklist.md`: Matriz de pruebas y regresión generada por `@reviewer` para el equipo de QA.

---

## ⚡ Protocolo de Shunting y Direct-to-Disk (Enterprise Architecture)

Para evitar el desperdicio de tokens en modelos de frontera (Sonnet / Pro) por tareas puramente mecánicas de I/O o código repetitivo, los workflows siguen estas reglas mandatorias:

1. **Shunting Determinista (Umbral 350 líneas)**:
   - Todo archivo de más de **350 líneas** tiene bloqueada la lectura total (`view_file`).
   - Para navegación y comprensión del código, se debe priorizar el grafo semántico según la herramienta disponible en el proyecto:
     - **Si el proyecto usa `codebase-memory-mcp`**: usar `search_graph` para ubicar clases/métodos, `get_code_snippet` para extraer la implementación puntual y `trace_path` para mapear dependientes.
     - **Si el proyecto usa `graphify`** (existe `graphify-out/`): ejecutar `graphify query "<pregunta o símbolo>"`, `graphify path "<A>" "<B>"` para relaciones, o navegar `graphify-out/wiki/index.md`.
   - Si se requiere inspección directa del archivo, hacer lecturas quirúrgicas (`StartLine`/`EndLine` con rango $\le 250$ líneas).
   - Si se requiere análisis masivo de múltiples archivos, delegar al rol `@explorer` (con modelo ligero **Gemini Flash**).
   - Este comportamiento está blindado físicamente mediante hooks ([`.agents/hooks.json`](../.agents/hooks.json) y [`.agents/scripts/shunt_guard.py`](../.agents/scripts/shunt_guard.py)).

2. **Ingesta Sintética (`bulk-reader` / `@explorer`)**:
   - `@explorer` extrae variables de Figma MCP o Swagger y **debe resumir el contexto en viñetas concisas**, sin saludos ni prosa.
   - El artefacto `docs/context_*.md` no puede superar las **150 líneas**. El arquitecto nunca inhala árboles JSON masivos de Figma.

3. **Escritura Directa a Disco (`code-writer` / `@architect`, `@reviewer` & `@coder`)**:
   - Los planes de arquitectura (`nextjs-architect`, `nestjs-architect`) se escriben **directamente en disco** en `.agents/plans/<nombre>.md` sin volcar el documento completo en el chat.
   - La generación o edición de artefactos (código backend NestJS, pruebas unitarias `*.spec.ts`, changelogs, tokens de diseño y checklists) se escribe **directamente en el disco** con `write_to_file` o `replace_file_content`.
   - **Prohibido volcar el código fuente completo o especificaciones de diseño en el chat**: el subagente solo reporta la ruta del archivo generado/modificado, métricas de ejecución (tests passing, tablas alteradas, desglose de cambios), signaturas clave y preguntas de negocio pendientes.

4. **Limpieza Estricta de Temporales**:
   - Al finalizar el ciclo y validar con QA, todos los artefactos de handoff intermedios (`docs/context_*`, `.agents/plans/*`, `qa_checklist.md`) se eliminan obligatoriamente para mantener el árbol de Git limpio.

---

## 🛠️ Cómo Ejecutar un Workflow

Podés pedirle a tu asistente (Antigravity, OpenCode, Claude Code, Roo Code):

```text
"Ejecutá el workflow front/feature para la pantalla de Firma Digital con frame de Figma <URL/ID>"
```
```text
"Ejecutá el workflow design-system/component-migration para migrar el Button del legacy al DS"
```

El agente coordinará las etapas respetando las pausas de validación y las reglas del repositorio.
