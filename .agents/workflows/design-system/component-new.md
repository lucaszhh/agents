---
name: wf-ds-component-new
description: Pipeline de subagentes para crear un componente nuevo en el Design System desde Figma (@design-system/react + Storybook)
---

# Workflow: Design System New Component

Pipeline para diseñar, implementar y documentar un componente nuevo en `@design-system/react` a partir de especificaciones de Figma, auditando consistencia de tokens y variantes omitidas.

## 👥 Roles y Modelos Recomendados

| Rol | Subagente | Modelo Sugerido | Herramientas | Modo |
|---|---|---|---|---|
| **Figma Scout** | `@explorer` | Gemini Flash | MCP Figma, read_file | Solo lectura |
| **Craft Architect** | `@architect` | Claude Sonnet / Gemini Pro | read_file, write_file (`docs/*.md`) | Planificación |
| **DS Implementer** | `@coder` | Claude Sonnet / Gemini Pro | read_file, write_file, edit_file, terminal | Implementación |
| **Component QA** | `@reviewer` | Gemini Flash / Sonnet | read_file, terminal (`pnpm build:react`), edit | Auditoría y QA |

---

## 🔄 Fases del Pipeline

```
[Frame de Figma / Especificación Visual]
                   │
                   ▼ (Gemini Flash)
             🔍 @explorer (Figma Component Scout)
                   │
                   │ 📄 Genera: docs/ds_new_<component>_spec.md (transitorio)
                   ▼ (Claude Sonnet / Gemini Pro)
             📐 @architect (Craft Architect — nextjs-design-craft + Gaps Audit)
                   │
                   │ 📄 Genera: docs/ds_plan_<component>.md (con Oportunidades y Gaps)
                   ▼ ⏸️ [COMPUERTA 1: APROBACIÓN DE API CONTRACT Y GAPS]
                   │ (Claude Sonnet / Gemini Pro)
             💻 @coder (DS Implementer)
                   │
                   │ 🔨 Crea: Componente + Storybook Stories + Barrel Export
                   ▼ (Gemini Flash / Sonnet)
             🔎 @reviewer (Component QA — component-qa)
                   │
                   │ 📄 Genera: Checklist QA + Storybook + a11y
                   ▼ ⏸️ [COMPUERTA 2: VALIDACIÓN DE QA Y ACCESIBILIDAD]
                   │
                   ▼ 🧹 Limpieza automática de temporales (docs/ds_new_*, docs/ds_plan_*)
```

---

### Etapa 1: Ingesta de Diseño desde Figma (Bulk-Reader)
- **Responsable**: `@explorer`
- **Regla de Shunting**: Sintetizar los datos del nodo de Figma en viñetas estructuradas. Prohibido volcar el JSON masivo de Figma al chat.
- **Acciones**:
  1. Consultar el MCP de Figma para extraer el frame del componente nuevo, sus variantes (size, color, state) y tokens asociados.
  2. Mapear requisitos de interacción (hover, focus, disabled, active).
- **Salida**: Genera `docs/ds_new_<component>_spec.md` (documento transitorio de análisis, **estricto < 150 líneas**).

---

### Etapa 2: Arquitectura del Componente, Craft y Auditoría de Gaps
- **Responsable**: `@architect`
- **Skills a invocar**: **`nextjs-design-craft`** + **`nextjs-architect`**
- **Acciones**:
  1. Definir la jerarquía de props (`<Nombre>Props`), slots y eventos.
  2. Diseñar el wrapper sobre MUI con el theme propio.
  3. Estructurar la Story en Storybook con controles de accesibilidad y variantes.
  4. **Auditoría Proactiva de Cobertura y Gaps (OBLIGATORIO)**:
     - Detectar si faltan estados interactivos esenciales (`loading`, `error`, `focus-visible`, `read-only`), variantes de color faltantes respecto a la paleta global o props de accesibilidad (`aria-label`, `role`).
     - Documentar estas propuestas de mejora en el plan.
- **Salida**: Genera `docs/ds_plan_<component>.md` conteniendo obligatoriamente:
  - Definición de API del componente y stories.
  - **Sección "Oportunidades de Mejora y Gaps Detectados"** (estados o variantes ausentes en el diseño original).
  - **Sección "Preguntas de Negocio / Craft"**.

---

### 🛑 COMPUERTA 1: VALIDACIÓN HUMANA DE API Y GAPS
> **Pausa obligatoria**: Revisión de la API de props, decisiones sobre variantes/gaps y aprobación del desarrollador antes de codear.

---

### Etapa 3: Implementación (Direct-to-Disk Writing)
- **Responsable**: `@coder`
- **Regla Direct-to-Disk**: Escribir los archivos del componente, barrel export y story directamente a disco con `write_to_file`. Prohibido volcar el código fuente completo en el chat.
- **Acciones**:
  1. Escribir el componente en `packages/react/src/components/<Nombre>/`.
  2. Exportar en el barrel `packages/react/src/index.ts`.
  3. Crear story completa en `apps/docs/src/stories/<Nombre>.stories.tsx` con todas sus variantes.
- **Salida**: Código, tipados y story implementados en disco.

---

### Etapa 4: QA, Accesibilidad y Build
- **Responsable**: `@reviewer`
- **Skill a invocar**: **`component-qa`** + **`nextjs-code-review`**
- **Acciones**:
  1. Ejecutar `pnpm build:react` y asegurar compilación limpia.
  2. Verificar estándares a11y (ARIA, contraste, navegación por teclado, focus rings).
  3. Ejecutar `nextjs-code-review` sobre el diff.
  4. **Compuerta de Validación de QA**: Presentar al desarrollador el reporte sintético de QA del componente, verificación de accesibilidad y cobertura de Storybook, esperando su interacción.
  5. **Limpieza estricta de temporales**: Al concluir la verificación y presentar el reporte, eliminar de forma obligatoria los archivos temporales (`docs/ds_new_<component>_spec.md`, `docs/ds_plan_<component>.md`, reportes locales) para mantener el repositorio 100% limpio.
- **Salida**: Componente validado, Storybook verificado, reporte sintético y workspace limpio de temporales.
