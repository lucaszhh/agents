---
name: component-qa
description: QA de componentes de @design-system/react con Storybook Test Runner. Valida compilación, a11y automatizado (axe-core WCAG 2.1 AA), paridad visual, variantes y cero tokens hex/px hardcodeados. Usar con "hacé QA del componente", "validá el Button", "corré el test runner".
---

# QA de Componentes del Design System

Auditoría de calidad de un componente de `@design-system/react`. Verifica que el
componente cumple el estándar del DS: compila, pasa tests automatizados con
Storybook Test Runner (render visual y accesibilidad con axe-core), usa tokens, cubre
variantes y estados, y tiene story completa. No arregla el componente — detecta
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

## Metodología

### Comandos de Storybook Test Runner (Testing Automatizado)

Storybook Test Runner (`@storybook/test-runner`) ejecuta las stories en un navegador
headless (Playwright) para validar renderizado visual, ausencia de errores en runtime
y cumplimiento automático de reglas de accesibilidad (`axe-core` / `@storybook/addon-a11y`).

### Requisitos previos
Para ejecutar los tests contra Storybook local, Storybook debe estar corriendo:
```bash
# Terminal 1 (o proceso en segundo plano)
pnpm storybook
# Storybook disponible en http://localhost:6006
```

### 1. Ejecución focalizada por componente (recomendado en QA individual)
```bash
# Ejecutar test-runner especificando la URL del Storybook local
pnpm test-storybook --url http://localhost:6006 --stories="**/<Nombre>.stories.*"

# O mediante filtro por nombre de suite/story
pnpm test-storybook --url http://localhost:6006 --filter="<Nombre>"
```

### 2. Ejecución completa del Test Runner
```bash
# Corre todas las stories del proyecto contra la URL activa
pnpm test-storybook --url http://localhost:6006
```

### 3. Ejecución en CI / Headless (sin Storybook previo)
```bash
# Compilar Storybook estático y correr test-runner contra servidor local
pnpm test-storybook:ci
# Equivalente manual:
# pnpm build-storybook && npx concurrently -k -s first -n "SB,TEST" "npx http-server storybook-static -p 6006 --silent" "npx wait-on tcp:127.0.0.1:6006 && pnpm test-storybook"
```

> ℹ️ **Degradación Elegante (Fallback si Storybook no está activo)**:  
> Si Storybook no está corriendo en `http://localhost:6006` ni es posible compilarlo en el entorno, no bloquear la auditoría: ejecutar `pnpm build:react`, verificar la ausencia de valores hardcodeados con el comando regex de tokens y validar la story estáticamente, dejando constancia en el scorecard.

### Qué valida automáticamente el Test Runner:
1. **Smoke & Visual Render**: Cada historia y variante del componente monta en el DOM sin lanzar excepciones JavaScript no controladas ni errores en la consola. Valida también las interacciones definidas en las funciones `play`.
2. **Accesibilidad Automatizada (a11y con axe-core)**: Mediante el hook `postVisit` configurado con `axe-playwright`, audita el árbol DOM renderizado bajo estándares WCAG 2.1 AA:
   - Contraste de color (`color-contrast`)
   - Nombres accesibles en controles interactivos (`button-name`, `link-name`, `aria-label`)
   - Atributos ARIA válidos y roles pertinentes (`aria-roles`, `aria-valid-attr`)
   - Jerarquía de encabezados, foco visible y ausencia de IDs duplicados

---

## Checklist de QA

### 1 — Compilación (bloqueante)

- [ ] `pnpm build:react` compila sin errores
- [ ] No hay `any` injustificado ni casts que rompan tipos en runtime
- [ ] Los types se exportan desde el barrel correctamente

### 2 — Uso de tokens y theme

- [ ] Sin hex/px/rem hardcodeados — todo valor de color, spacing y radius viene de tokens o del theme.
      Ejecutar verificación determinista de código fuente:
      ```bash
      grep -En "#[0-9a-fA-F]{3,6}|[0-9]+px" packages/react/src/components/<Nombre>/<Nombre>.tsx
      ```
      *(Cualquier coincidencia fuera de comentarios o casos justificados es un fallo bloqueante)*
- [ ] Las variantes usadas (ej: `color="chatbot"`) están declaradas en el theme
      tipado (module augmentation) — si no, es un issue
- [ ] No hay estilos inline que deberían estar en el theme
- [ ] `semantico.json` tiene los tokens que el componente necesita

### 3 — Variantes y estados

- [ ] Todas las variantes del componente legacy (si migrado) están presentes
- [ ] Estados cubiertos: default, hover, active, focus, disabled, loading (si aplica)
- [ ] Estados de UI donde corresponde: loading/empty/error/success

### 4 — Accesibilidad (a11y)

- [ ] **Storybook Test Runner (a11y)**: `pnpm test-storybook` corre sin violaciones de `axe-core` en ninguna variante ni estado
- [ ] Roles correctos en componentes custom
- [ ] aria-label en botones solo-ícono
- [ ] Focus visible (no `outline: none` sin alternativa)
- [ ] Navegación por teclado funcional
- [ ] Contraste texto/fondo ≥ 4.5:1 (o 3:1 en texto grande)

### 5 — Story completa y Test Runner Visual

- [ ] La story cubre todas las variantes del componente
- [ ] **Storybook Test Runner (Smoke/Visual)**: `pnpm test-storybook` pasa en verde sin errores de consola ni fallos de render
- [ ] Interacciones (`play` functions) pasan exitosamente si están definidas
- [ ] Cada variante se ve en Storybook sin warnings en consola
- [ ] No faltan controles (controls / args) para las props clave

### 6 — Integridad de la migración (si aplica)

- [ ] Sin imports del frontend legacy ni de lógica de negocio
- [ ] API pública equivalente al componente original

---

## Scoring y Protocolo Direct-to-Disk OBLIGATORIO

1. **Plantilla oficial**: Utilizar [`templates/component-qa-scorecard.template.md`](./templates/component-qa-scorecard.template.md).
2. **Destino del scorecard**: Escribir el informe detallado en `.agents/qa/<Componente>-qa-scorecard.md` (`write_to_file`).
3. **Puntuación cuantitativa (0 - 12)**:
   Puntuar cada categoría 0-2 (0 = no cumple, 1 = parcial, 2 = cumple) sobre las 6 categorías del checklist $\rightarrow$ máximo 12.

| Score | Interpretación |
|---|---|
| 0-6 | No listo. Issues bloqueantes o grandes brechas. |
| 7-10 | Casi. Issues puntuales a corregir antes de mergear. |
| 11-12 | Listo. Cumple el estándar del DS. |

4. **Reporte Sintético en Chat**:
   - **Ruta del scorecard**: enlace a `.agents/qa/<Componente>-qa-scorecard.md`.
   - **Score final**: puntaje 0-12 con desglose por categoría.
   - **Issues bloqueantes**: listado de hallazgos críticos (archivo:línea y fix sugerido).
   - **Próximo paso**: sugerir `nextjs-code-review` si score $\ge 11$, o `nextjs-debug-flow` / `design-token-sync` si hay fallos.

---

## Reglas de lo que SÍ debe hacer

- Guardar el scorecard completo en `.agents/qa/<Componente>-qa-scorecard.md` (`write_to_file`)
- Reportar en el chat únicamente el resumen sintético y puntaje sin volcar el documento entero
- Correr `pnpm build:react` real (no asumir que compila)
- Ejecutar chequeo grep para descartar hex/px hardcodeados (`grep -rnE "#[0-9a-fA-F]{3,6}|[0-9]+px" packages/react/src/components/<Nombre>/`)
- Ejecutar Storybook Test Runner (`pnpm test-storybook --stories="**/<Nombre>.stories.*"`) para validar render visual y a11y automatizado
- Reportar cualquier fallo de Storybook Test Runner o violación de axe-core indicando la regla infringida, severidad y selector DOM
- Comparar contra el theme declarado — no contra opinión
- Citar archivo:línea para cada hallazgo
- Probar los estados, no solo el happy path
- Verificar que la story se ve en Storybook y pasa el test runner, no solo que existe el archivo
- Clasificar severidad: CRÍTICO > ALTO > MEDIO > BAJO

## Reglas de lo que NO debe hacer

- NO volcar el scorecard completo ni logs de testing en la respuesta de chat
- NO omitir la persistencia del scorecard en `.agents/qa/<Componente>-qa-scorecard.md`
- NO aprobar si Storybook Test Runner falla en render visual o lanza violaciones de accesibilidad (axe-core)
- NO omitir la ejecución de comandos automatizados de testeo
- NO arreglar el componente durante el QA — reportar, después se corrige
- NO aprobar si hay valores hardcodeados que deberían ser tokens
- NO aprobar variantes que no están declaradas en el theme tipado
- NO evaluar solo la estética — el QA es técnico y automatizado (build, test-runner, tokens, a11y, story)
- NO inventar checklists de a11y — verificar cada punto
- NO reportar "todo bien" sin haber corrido el build y el test runner

## Verificación

- Confirmar persistencia del scorecard en `.agents/qa/<Componente>-qa-scorecard.md`.
- Build corre sin errores (`pnpm build:react`).
- Chequeo grep de tokens hardcodeados da 0 resultados.
- Storybook Test Runner corre en verde (`pnpm test-storybook`) para visual y a11y.
- Checklist completo respondido con score 0-12.
- Issues con severidad, archivo:línea y fix sugerido.
- Recomendación clara: listo para merge o requiere fixes.

## Al terminar

Confirmar persistencia del scorecard en `.agents/qa/<Componente>-qa-scorecard.md`. Si el score es ≥ 11: sugerir **nextjs-code-review** sobre el diff del componente
para validar estructura y convenciones antes de mergear.
Si hay issues: sugerir **nextjs-debug-flow** si es un bug funcional, o arreglar los
issues de tokens con `design-token-sync` y volver a correr este QA.