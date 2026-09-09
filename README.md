# Agents Skills Repository

Este repositorio contiene una colección de **Agent Skills** (habilidades para agentes de IA) diseñadas para automatizar tareas repetitivas y estandarizar flujos de trabajo.

## 🗂️ Estructura

Las skills viven en `skills/`, organizadas por dominio:

| Carpeta | Para qué | Skills |
|---|---|---|
| `skills/front/` | Desarrollo frontend (Next.js, React Query, design system) | architecture-review, design-craft, design-audit, debug-flow, code-review, code-health |
| `skills/back/` | Desarrollo backend (NestJS, Clean Architecture, X-Road) | nestjs-architect, nestjs-backend-developer, nestjs-unit-tester |
| `skills/design-system/` | Monorepo design-system (tokens, componentes, QA) | design-token-sync, component-extractor, component-qa |
| `skills/generales/` | Tareas transversales | generate-changelog, generate-gitlab-issue-report, generate-qa-checklist |

Cada skill es un `SKILL.md` autocontenido en español. Ver `skills/README.md`
para el formato, las cadenas de flujos y las instrucciones de instalación por harness.

## 🛠️ Cómo instalar las Skills

Tanto **OpenCode** como **Antigravity** permiten descubrir y cargar de forma dinámica estas instrucciones (Skills). Puedes configurarlas de forma **Global** (para todos tus proyectos) o **Por Repositorio** (Workspace-specific).

### 🚀 Instalación en Antigravity CLI

Antigravity soporta dos ubicaciones principales para las skills:

| Alcance (Scope)                  | Ubicación                                            |
| -------------------------------- | ---------------------------------------------------- |
| **Global** (Todos los proyectos) | `~/.gemini/antigravity-cli/skills/<nombre-de-skill>/`         |
| **Por Repositorio** (Workspace)  | `<workspace-root>/.agents/skills/<nombre-de-skill>/` |

**Ejemplo para instalar una skill de forma Global:**

```bash
```

_(Antigravity las detectará automáticamente de forma transparente)._

### 🛠️ Instalación en OpenCode

OpenCode sigue un esquema de carpetas muy similar:

| Alcance (Scope)                  | Ubicación                                                             |
| -------------------------------- | --------------------------------------------------------------------- |
| **Global** (Todos los proyectos) | `~/.config/opencode/skills/<nombre-de-skill>/`                        |
| **Por Repositorio** (Workspace)  | `<workspace-root>/.opencode/skills/<nombre-de-skill>/` (o `.agents/`) |

**Ejemplo para instalar una skill de forma Global:**

```bash
```

### ⚡ Instalación universal

```bash
npx skills add <repo>
```

## 📦 Skills Disponibles

### Frontend (`skills/front/`)

- **`architecture-review`**: Planear arquitectura antes de codear.
- **`design-craft`**: Diseñar/rediseñar UI con craft.
- **`design-audit`**: QA visual sobre lo codeado.
- **`debug-flow`**: Debugging con root cause.
- **`code-review`**: Code review del diff pre-merge.
- **`code-health`**: Dashboard de calidad (lint, tipos).

### Backend (`skills/back/`)

- **`nestjs-architect`**: Diseñar la estructura de un módulo NestJS.
- **`nestjs-backend-developer`**: Implementar controladores, servicios, DTOs.
- **`nestjs-unit-tester`**: Escribir pruebas unitarias con Jest.

### Design System (`skills/design-system/`)

- **`design-token-sync`**: Sincronizar tokens desde Figma.
- **`component-extractor`**: Migrar un componente del legacy al DS.
- **`component-qa`**: QA de un componente del DS.

### Generales (`skills/generales/`)

- **`generate-changelog`**: Genera o actualiza el archivo CHANGELOG.md basado en notas de release.
- **`generate-gitlab-issue-report`**: Genera un reporte de issue para GitLab basado en las diferencias con la rama develop.
- **`generate-qa-checklist`**: Genera checklists de pruebas para QA basados en los flujos afectados.

## 🔄 Pipelines y Workflows (`workflows/`)

Los workflows coEnterprise Engineeringn múltiples skills asignando roles de subagentes con modelos optimizados:

### Frontend ([`workflows/front/`](workflows/front/))
| Workflow | Propósito | Roles / Modelos |
|---|---|---|
| **[`feature`](workflows/front/feature.md)** | Pipeline completo de desarrollo frontend | `@explorer` (Flash) $\rightarrow$ `@architect` (Sonnet/Pro) $\rightarrow$ `@coder` (Sonnet/Pro) $\rightarrow$ `@reviewer` (Flash) |
| **[`bugfix`](workflows/front/bugfix.md)** | Diagnóstico root-cause y fix quirúrgico | `@debugger` (Flash/Sonnet) $\rightarrow$ `@coder` (Sonnet/Flash) $\rightarrow$ `@reviewer` (Flash) |

### Backend ([`workflows/back/`](workflows/back/))
| Workflow | Propósito | Roles / Modelos |
|---|---|---|
| **[`feature`](workflows/back/feature.md)** | Pipeline de módulo NestJS con Clean Architecture | `@explorer` (Flash) $\rightarrow$ `@architect` (Sonnet/Pro) $\rightarrow$ `@coder` (Sonnet/Pro) $\rightarrow$ `@reviewer` (Flash/Sonnet) |
| **[`bugfix`](workflows/back/bugfix.md)** | Diagnóstico root-cause y fix con tests de regresión | `@debugger` (Flash/Sonnet) $\rightarrow$ `@coder` (Sonnet/Flash) $\rightarrow$ `@reviewer` (Flash/Sonnet) |

### Design System ([`workflows/design-system/`](workflows/design-system/))
| Workflow | Propósito | Roles / Modelos |
|---|---|---|
| **[`component-migration`](workflows/design-system/component-migration.md)** | Migrar componentes del legacy al monorepo DS | `@explorer` (Flash) $\rightarrow$ `@architect` (Sonnet/Pro) $\rightarrow$ `@coder` (Sonnet/Pro) $\rightarrow$ `@reviewer` (Flash) |
| **[`token-sync`](workflows/design-system/token-sync.md)** | Sincronizar tokens de Figma y compilar | `@explorer` (Flash) $\rightarrow$ `@architect` (Sonnet/Pro) $\rightarrow$ `@coder` (Flash/Sonnet) $\rightarrow$ `@reviewer` (Flash) |
| **[`component-new`](workflows/design-system/component-new.md)** | Crear componente nuevo en el DS con Storybook | `@explorer` (Flash) $\rightarrow$ `@architect` (Sonnet/Pro) $\rightarrow$ `@coder` (Sonnet/Pro) $\rightarrow$ `@reviewer` (Flash) |

---

## ⚡ Shunting y Optimización de Tokens (Enterprise Architecture)

El repositorio implementa una estrategia de reducción de tokens y desacople de contexto para maximizar la eficiencia y precisión en el desarrollo de Enterprise Production Platform:

1. **Shunting Guard Determinista ([`.agents/hooks.json`](.agents/hooks.json))**:
   - Interceptor físico de ciclo de vida `PreToolUse` respaldado por [`.agents/scripts/shunt_guard.py`](.agents/scripts/shunt_guard.py).
   - Bloquea lecturas indiscriminadas sobre archivos de más de **350 líneas** (`view_file`), redirigiendo al agente a:
     - **Si el proyecto usa `codebase-memory-mcp`**: invocar herramientas MCP (`search_graph`, `get_code_snippet`, `trace_path`).
     - **Si el proyecto usa `graphify`** (con `graphify-out/`): ejecutar `graphify query`, `graphify path` o navegar la wiki local.
     - Realizar lecturas quirúrgicas acotadas especificando `StartLine` y `EndLine` ($\le 250$ líneas).
     - Delegar la ingesta o análisis masivo al subagente `@explorer` (modelo Flash/ligero).
   - Bloquea volcados de archivos grandes mediante comandos `cat/tail/head` directos sin tuberías de filtrado (`grep`, `head -n 50`).

2. **Protocolo de Escritura Directa a Disco (Direct-to-Disk Writing)**:
   - Los subagentes generan artefactos repetitivos (pruebas Jest `*.spec.ts`, tokens compilados y checklists de QA) escribiendo directamente en disco (`write_to_file`).
   - Prohibido volcar el código fuente completo en las respuestas conversacionales, evitando quemar miles de tokens de salida y saturación del contexto.
   - Los subagentes solo reportan métricas sintéticas (rutas, cantidad de tests passing, signaturas, cobertura).

3. **Ingesta Sintética (< 150 líneas)**:
   - El rol `@explorer` actúa como un extractor sintetizado estricto, resumiendo contratos de Figma y backend en viñetas concisas dentro de `docs/context_*.md`.

---

## 🔄 Sincronización de Skills y Workflows

Para sincronizar automáticamente todas las skills y workflows de este repositorio con la configuración global de **Antigravity** (`~/.gemini/config/skills/`) o harnesses compatibles, ejecutá:

```bash
./scripts/sync_agents.sh
```

---

## 🧩 Ecosistema y Herramientas Complementarias

Este repositorio forma parte de una arquitectura integral de ingeniería asistida por IA:
- 🧰 [**lucaszarandon-agent-toolkit**](https://github.com/lucaszhh/lucaszarandon-agent-toolkit): Servidor MCP en TypeScript, skills de migración y tooling ejecutable.
- 🌐 [**Portfolio Web**](https://lucaszarandon.vercel.app): Portafolio y trayectoria profesional.

---

## 👤 Autor

Desarrollado y mantenido por **Lucas Zarandón** ([@lucaszhh](https://github.com/lucaszhh))  
Frontend Developer SSR & AI-Assisted Engineering · Mendoza, Argentina  
[Portfolio](https://lucaszarandon.vercel.app) · [LinkedIn](https://www.linkedin.com/in/lucas-zarandon) · 📫 lzarandon.dev@gmail.com
