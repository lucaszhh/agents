# 📌 Feat: Pipelines de Workflows de Subagentes, Shunting Guard y Templates de GitLab

## 📝 Descripción
Se implementó de manera integral la infraestructura de orquestación de subagentes para Enterprise Production Platform, coEnterprise Engineeringndo las Agent Skills del repositorio en pipelines estandarizados por dominio funcional (**Frontend**, **Backend** y **Design System**). 

Adicionalmente, se incorporó una arquitectura determinista de **Shunting Guard** (vía Lifecycle Hooks `PreToolUse`), ingesta sintética (*bulk-reader* con límite estricto < 150 líneas) y el protocolo de **Direct-to-Disk Writing** en skills mecánicas (tests, migraciones, tokens y checklists) para evitar el desperdicio de tokens y saturación de la ventana de contexto en modelos de frontera (Claude Sonnet / Gemini Pro), adaptándose dinámicamente según si el proyecto cuenta con `codebase-memory-mcp` o `graphify`. Se añadieron también las plantillas oficiales de issues de GitLab en `.gitlab/issue_templates/`.

---

## 🔎 Contexto adicional
- **Módulos / directorios involucrados**:
  - `workflows/` y `.agents/workflows/` (pipelines frontend, backend y design-system).
  - `.agents/hooks.json` y `.agents/scripts/shunt_guard.py` (motor de hooks y shunting policy).
  - `skills/` (skills backend, design-system y generales actualizadas con direct-to-disk).
  - `.gitlab/issue_templates/` (plantillas oficiales de issue y re-test para GitLab).
  - `scripts/sync_agents.sh` (sincronización hacia configuraciones locales y globales).
- **Documentación asociada**:
  - [`README.md`](./README.md) (documentación general de arquitectura y sincronización).
  - [`workflows/README.md`](./README.md) (contratos de handoff, compuertas de decisión y shunting policy).
- **Impacto funcional o técnico**:
  - Estandariza el ciclo de desarrollo asistido por agentes dividiendo el trabajo por complejidad cognitiva (`@explorer` $\rightarrow$ `@architect` $\rightarrow$ `@coder` $\rightarrow$ `@reviewer`).
  - Introduce compuertas obligatorias de validación humana para aprobar arquitectura y auditar gaps antes de codificar.
  - Bloquea físicamente lecturas totales de archivos de más de 350 líneas, promoviendo el uso del grafo semántico y lecturas quirúrgicas.
  - Erradica el volcado masivo de código fuente repetitivo en las respuestas de chat mediante escritura directa en disco.

---

## 🪜 Pasos para reproducir (si aplica)
*N/A (incorporación de nuevas capacidades, pipelines y guardrails).*

---

## 📥 Request de prueba (si aplica)
*N/A (configuraciones de agentes, especificaciones markdown y scripts locales).*

---

## ✅ Resultado esperado
1. **Pipelines de Subagentes Disponibles**: Posibilidad de orquestar flujos de desarrollo completos en frontend (`feature`, `bugfix`), backend (`feature`, `bugfix`, `migration`) y design system (`component-migration`, `token-sync`, `component-new`).
2. **Shunting Guard Activo**: Ante cualquier intento de `view_file` sobre archivos $> 350$ líneas o comandos `cat` directos, el hook intercepta la llamada y sugiere:
   - Consultas al grafo vía `codebase-memory-mcp` (`search_graph`, `get_code_snippet`, `trace_path`).
   - Consultas a `graphify` (`graphify query`, `graphify path` o navegación de wiki) si se detecta `graphify-out/`.
   - Lecturas quirúrgicas acotadas ($\le 250$ líneas con `StartLine`/`EndLine`).
3. **Escritura Directa a Disco**: `nestjs-unit-tester`, `generate-migration`, `generate-qa-checklist`, `design-token-sync` y `component-extractor` generan sus archivos directamente en disco (`write_to_file`) y reportan exclusivamente métricas y signaturas sintéticas en el chat.
4. **Sincronización Automática**: El script `scripts/sync_agents.sh` sincroniza de forma segura todas las skills y workflows locales a `~/.gemini/config/skills/` y `.agents/workflows/`.
5. **Plantillas de GitLab**: Disponibilidad de `reporteTemplate.md` y `reTestTemplate.md` para estandarizar reportes de testing y de issues en GitLab.

---

## ❌ Resultado actual (si es bug)
*N/A (la funcionalidad anterior carecía de workflows estructurados de subagentes, guardrails deterministas de lectura y plantillas de issue centralizadas).*

---

## 📎 Cambios realizados

### Orquestación y Pipelines (`workflows/` y `.agents/workflows/`)
| Archivo | Cambio |
|---|---|
| `workflows/README.md` | **Nuevo**: Guía central de orquestación, contrato de handoff por artefactos y reglas de Shunting y Direct-to-Disk. |
| `workflows/front/feature.md` | **Nuevo**: Pipeline frontend completo (`@explorer` $\rightarrow$ `@architect` $\rightarrow$ `@coder` $\rightarrow$ `@reviewer`). |
| `workflows/front/bugfix.md` | **Nuevo**: Pipeline frontend para diagnóstico root-cause, fix quirúrgico y QA checklist. |
| `workflows/back/feature.md` | **Nuevo**: Pipeline backend NestJS con Clean Architecture, inyección desacoplada, patrón Result y migraciones. |
| `workflows/back/bugfix.md` | **Nuevo**: Pipeline backend para aislamiento de fallos, corrección limpia y test de regresión con Jest. |
| `workflows/back/migration.md` | **Nuevo**: Pipeline especializado para migraciones manuales en TypeORM con simetría estricta de rollback. |
| `workflows/design-system/component-migration.md` | **Nuevo**: Pipeline para migrar componentes legacy al monorepo `design-system` con Storybook. |
| `workflows/design-system/token-sync.md` | **Nuevo**: Pipeline para sincronizar variables de Figma con Style Dictionary y compilar tokens. |
| `workflows/design-system/component-new.md` | **Nuevo**: Pipeline para crear componentes nuevos con accesibilidad y variants desde Figma. |
| `.agents/workflows/*` | **Nuevo**: Espejo local de todos los workflows para interoperabilidad entre harnesses. |

### Motor de Shunting y Lifecycle Hooks (`.agents/`)
| Archivo | Cambio |
|---|---|
| `.agents/hooks.json` | **Nuevo**: Configuración de hook `PreToolUse` para herramientas `view_file` y `run_command`. |
| `.agents/scripts/shunt_guard.py` | **Nuevo**: Interceptor en Python 3 que bloquea lecturas de archivos $> 350$ líneas sin rango acotado, bloquea `cat` masivo y detecta dinámicamente si el proyecto usa `graphify` o `codebase-memory-mcp`. |

### Skills con Protocolo Direct-to-Disk (`skills/`)
| Archivo | Cambio |
|---|---|
| `skills/back/nestjs-unit-tester/SKILL.md` | Incorpora protocolo Direct-to-Disk Writing: escribe `*.spec.ts` a disco y prohíbe volcar código fuente al chat. |
| `skills/generales/generate-migration/SKILL.md` | Incorpora protocolo Direct-to-Disk Writing: escribe migración TypeORM a disco y reporta resumen de operaciones. |
| `skills/generales/generate-qa-checklist/SKILL.md` | Incorpora protocolo Direct-to-Disk Writing: genera `qa_checklist.md` y reporta métricas de cobertura en el chat. |
| `skills/design-system/design-token-sync/SKILL.md` | Incorpora compilación y edición directa a disco, prohibiendo volcar JSONs masivos de tokens. |
| `skills/design-system/component-extractor/SKILL.md` | Incorpora regla de escritura directa a disco para componentes, barrel exports y stories. |

### Configuración, Sincronización y Plantillas (`scripts/`, `.gitlab/`, `README.md`)
| Archivo | Cambio |
|---|---|
| `scripts/sync_agents.sh` | **Nuevo**: Script ejecutable de sincronización con soporte seguro para hard links (`cp --remove-destination` e inodos). |
| `.gitlab/issue_templates/reporteTemplate.md` | **Nuevo**: Plantilla oficial de issue description para GitLab. |
| `.gitlab/issue_templates/reTestTemplate.md` | **Nuevo**: Plantilla oficial para verificación y re-test de correcciones. |
| `README.md` | Documenta la arquitectura de Shunting de Enterprise, protocolo Direct-to-Disk y script de sincronización. |

---

## ⚠️ Notas / Gaps detectados (si aplica)
- **Persistencia en nuevas máquinas**: Al clonar el repositorio en una nueva máquina, es necesario ejecutar `./scripts/sync_agents.sh` una vez para propagar las skills y workflows al directorio global `~/.gemini/config/skills/`.
- **Independencia de Harnesses**: Los workflows y skills están diseñados bajo especificación estándar markdown (`SKILL.md`), siendo 100% compatibles con Antigravity, OpenCode y Claude Code.

---

## 🖥️ Entorno (si aplica)
- **Stack**: Markdown / Bash / Python 3 / Antigravity Lifecycle Hooks / GitLab
- **Rama**: `feat/agregar-workflows`
- **Base**: `main`
- **Commits incluidos**:
  - `1e6564b` feat(gitlab): agregar issue templates para re-test y reporte de issues
  - `0543004` improve(workflows): incorporar reglas de shunting, bulk-reader y soporte codebase/graphify
  - `3b31f0b` improve(skills): incorporar protocolo direct-to-disk writing y reportes sinteticos
  - `eb244fb` feat(shunting): implementar motor de hooks determinista y script de sincronizacion
  - `9395c6a` feat: estandarizar compuertas de decision, auditoria de gaps y limpieza de temporales
  - `2002eec` improve: naming para los workflows
  - `cb78fd9` feat(workflows): agregar pipelines de backend y documentacion central de workflows
  - `568b690` feat(workflows): agregar pipelines para design system (migracion, tokens y componente nuevo)
  - `cab405a` feat(workflows): agregar pipelines de subagentes para frontend (feature y bugfix)
