---
name: component-qa
description: |
  QA de un componente del design system. Verifica que compila, que las variantes
  y estados están cubiertos, que usa tokens y theme correctamente, que cumple
  accesibilidad y que la story es completa. Usar con "hacé QA del componente",
  "chequeá el componente X", "validá el Button", "está bien migrado este
  componente", después de extraer un componente o de modificar el theme.
---

# QA de Componentes del Design System

Auditoría de calidad de un componente de `@design-system/react`. Verifica que el
componente cumple el estándar del DS: compila, usa tokens, cubre variantes y
estados, es accesible y tiene story completa. No arregla el componente — detecta
y reporta issues con severidad para que se corrijan.

## Lectura previa obligatoria

- `AGENTS.md` y `DESIGN.md` del repo design-system
- El componente en `packages/react/src/components/<Nombre>/`
- El theme en `packages/react/src/theme/` — variantes declaradas y tokens disponibles
- La story en `apps/docs/src/stories/<Nombre>.stories.tsx` (si existe)
- El componente original legacy (si aplica) en `frontend-nextjs/src/modules/desingSystem/`

## Cuándo usar esta skill

- "hacé QA del componente X"
- "validá el componente migrado"
- "está completo este componente?"
- "chequeá si el Button usa bien los tokens"
- Después de `component-migrator`
- Después de cambios en el theme que puedan afectar componentes
- Antes de publicar una versión del DS

## Cuándo NO usar esta skill

- **Componente todavía sin migrar** → `component-migrator`
- **Bug funcional (crash, runtime)** → `nextjs-debug-flow`
- **Revisar el diff de una feature** → `nextjs-code-review`
- **Diseñar variantes nuevas** → `nextjs-design-craft`
- **Solo build del monorepo** → correr `pnpm build` directo

---

## Checklist de QA

### 1 — Compilación (bloqueante)

- [ ] `pnpm build:react` compila sin errores
- [ ] No hay `any` injustificado ni casts que rompan tipos en runtime
- [ ] Los types se exportan desde el barrel correctamente

### 2 — Uso de tokens y theme

- [ ] Sin hex/px/rem hardcodeados — todo valor de color, spacing y radius viene
      de tokens o del theme
- [ ] Las variantes usadas (ej: `color="chatbot"`) están declaradas en el theme
      tipado (module augmentation) — si no, es un issue
- [ ] No hay estilos inline que deberían estar en el theme
- [ ] `semantico.json` tiene los tokens que el componente necesita

### 3 — Variantes y estados

- [ ] Todas las variantes del componente legacy (si migrado) están presentes
- [ ] Estados cubiertos: default, hover, active, focus, disabled, loading (si aplica)
- [ ] Estados de UI donde corresponde: loading/empty/error/success

### 4 — Accesibilidad

- [ ] Roles correctos en componentes custom
- [ ] aria-label en botones solo-ícono
- [ ] Focus visible (no `outline: none` sin alternativa)
- [ ] Navegación por teclado funcional
- [ ] Contraste texto/fondo ≥ 4.5:1 (o 3:1 en texto grande)

### 5 — Story completa

- [ ] La story cubre todas las variantes del componente
- [ ] Cada variante se ve en Storybook sin warnings en consola
- [ ] No faltan controles (controls) para las props clave

### 6 — Integridad de la migración (si aplica)

- [ ] Sin imports del frontend legacy ni de lógica de negocio
- [ ] API pública equivalente al componente original

---

## Scoring

Puntuar cada categoría 0-2 (0 = no cumple, 1 = parcial, 2 = cumple) sobre las 6
categorías del checklist → máximo 12.

| Score | Interpretación |
|---|---|
| 0-6 | No listo. Issues bloqueantes o grandes brechas. |
| 7-10 | Casi. Issues puntuales a corregir antes de mergear. |
| 11-12 | Listo. Cumple el estándar del DS. |

Reportar por cada issue: severidad (CRÍTICO/ALTO/MEDIO/BAJO), archivo:línea y
fix sugerido.

---

## Reglas de lo que SÍ debe hacer

- Correr `pnpm build:react` real (no asumir que compila)
- Comparar contra el theme declarado — no contra opinión
- Citar archivo:línea para cada hallazgo
- Probar los estados, no solo el happy path
- Verificar que la story se ve en Storybook, no solo que existe el archivo
- Clasificar severidad: CRÍTICO > ALTO > MEDIO > BAJO

## Reglas de lo que NO debe hacer

- NO arreglar el componente durante el QA — reportar, después se corrige
- NO aprobar si hay valores hardcodeados que deberían ser tokens
- NO aprobar variantes que no están declaradas en el theme tipado
- NO evaluar solo la estética — el QA es técnico (build, tokens, a11y, story)
- NO inventar checklists de a11y — verificar cada punto
- NO reportar "todo bien" sin haber corrido el build

## Verificación

- Build corre sin errores
- Checklist completo respondido
- Score 0-12 con interpretación
- Issues con severidad, archivo:línea y fix sugerido
- Recomendación clara: listo para merge o requiere fixes

## Al terminar

Si el score es ≥ 11: sugerir **nextjs-code-review** sobre el diff del componente
para validar estructura y convenciones antes de mergear.
Si hay issues: sugerir **nextjs-debug-flow** si es un bug funcional, o arreglar los
issues de tokens con `design-token-sync` y volver a correr este QA.