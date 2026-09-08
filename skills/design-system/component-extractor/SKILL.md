---
name: component-extractor
description: |
  Migrar un componente del design system legacy (frontend-nextjs) al monorepo
  de design-system. Lee la implementación original, la adapta a MUI sobre el
  theme propio, crea el barrel export y la story. Usar con "migrá este
  componente", "extraé X al design system", "traé el Button al DS", "mover
  componente legacy", cuando hay que portar componentes del módulo desingSystem
  al package @design-system/react.
---

# Extracción de Componentes al Design System

Porta un componente desde el design system legacy (`frontend-nextjs/src/modules/desingSystem/`)
hacia el monorepo `design-system` (packages `@design-system/react` + `@design-system/icons`).
El componente resultante vive en `packages/react/src/components/<Nombre>/`, se
exporta desde el barrel y tiene su story en `apps/docs/src/stories/`.

## Lectura previa obligatoria

- `AGENTS.md` del repo design-system — reglas, stack, build
- `DESIGN.md` — decisiones de diseño que el componente debe respetar
- El componente legacy completo en `frontend-nextjs/src/modules/desingSystem/<Componente>/`
- Un componente ya migrado similar (para replicar el patrón de tema y exports)
- El theme de MUI en `packages/react/src/theme/` — para conocer las variantes ya declaradas

## Cuándo usar esta skill

- "migrá este componente al design system"
- "extraé el Button del legacy"
- "traé la Modal al DS"
- "movamos el TextField al monorepo"
- Cuando diseño pide componentizar algo que todavía vive en el frontend

## Cuándo NO usar esta skill

- **Diseñar un componente nuevo desde cero** (no existe en el legacy) → `design-craft`
- **Solo actualizar tokens** → `design-token-sync`
- **Auditar un componente ya migrado** → `component-qa`
- **Debuggear un bug en la migración** → `debug-flow`
- **Planificar una migración grande (>5 componentes)** → `architecture-review` primero

---

## Flujo de trabajo

### Fase 1 — Entender el componente legacy

1. Leer la implementación original (componente + sus dependencias)
2. Identificar:
   - Props públicas (API del componente)
   - Qué MUI usa internamente (Button, Menu, etc.)
   - Variantes y estados propios (ej: color="chatbot", variant="selectedMenu")
   - Si tiene íconos, textos o tokens hardcodeados
   - Estilos inline vs sx vs theme
3. Detectar dependencias del negocio (turns, procedures, users) — NO se migran

### Fase 2 — Diseñar el componente en el DS

1. Decidir el patrón: wrapper fino sobre MUI con el theme propio, o compound
2. Mapear las variantes propias a las variantes del theme de MUI:
   - Si el theme no declara la variante (ej: `color="chatbot"`), agregarla al
     theme en `packages/react/src/theme/` (module augmentation en `types/`)
3. Identificar tokens a usar (colors, spacing, border-radius) — si faltan, anotar
   para `design-token-sync`
4. Si hay iconos: chequear `@design-system/icons`; si no existe, crearlo o avisar

### Fase 3 — Implementar

1. Crear `packages/react/src/components/<Nombre>/`
   - `index.ts` — export del componente y tipos
   - `<Nombre>.tsx` — implementación
   - `types.ts` — props con TypeScript estricto
2. Usar el theme (`useTheme` / `sx` con tokens), nunca colores hardcodeados
3. Mantener componentes presentacionales — sin lógica de negocio
4. Actualizar el barrel `packages/react/src/index.ts` (o `components/index.ts`)
5. Crear la story en `apps/docs/src/stories/<Nombre>.stories.tsx` cubriendo
   todas las variantes y estados del componente legacy

### Fase 4 — Verificar

1. `pnpm build:react` — compila sin errores (incluye typecheck)
2. `pnpm storybook` — la story renderiza todas las variantes
3. Comparar contra el componente legacy: ¿tiene todo lo que el original tenía?
4. Si algo del theme faltaba y se agregó: verificar que no rompe otros componentes

---

## Reglas de lo que SÍ debe hacer

- Replicar la API pública del componente legacy (props iguales o mejor tipadas)
- Escribir directamente a disco (`write_to_file`) el componente, types y la story sin volcar el código fuente completo en la conversación
- Usar los tokens y el theme del DS — nunca hex/px hardcodeados
- Crear story con todas las variantes y estados (default, hover, disabled, etc.)
- Correr `pnpm build:react` antes de dar por terminado
- Agregar al theme cualquier variante nueva declarada (con module augmentation)
- Mantener el componente dumb — la lógica queda en el frontend

## Reglas de lo que NO debe hacer

- NO volcar archivos de código completos de componentes o stories en la respuesta de chat
- NO migrar lógica de negocio (turns, procedures, users, queries) al DS
- NO importar de `frontend-nextjs` desde el package react
- NO hardcodear colores, radios o spacing — usar tokens
- NO modificar el componente legacy original (la migración es aditiva)
- NO renombrar la API pública sin consultar al usuario
- NO commitear sin que `pnpm build` (todo el monorepo) pase
- NO crear variantes ad-hoc sin declararlas en el theme tipado
- NO olvidar la story — sin story el componente no se considera migrado
- NO copiar estilos inline legacy — traducirlos al theme

## Verificación

- `pnpm build:react` OK
- Story renderiza todas las variantes del legacy
- Sin imports de negocio ni del frontend legacy
- Sin valores hardcodeados que deberían ser tokens
- API pública equivalente al original

## Al terminar

Sugerir al usuario: **component-qa** para auditar el componente migrado
(calidad, variantes cubiertas, a11y, comparación con Figma).
Después de QA, la cadena continúa con **code-review** sobre el diff.