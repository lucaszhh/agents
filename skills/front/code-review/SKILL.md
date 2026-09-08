---
name: code-review
description: |
  Code review del diff contra la branch base. Analiza estructura, convenciones,
  estados de UI, tipos y seguridad. Cada hallazgo clasificado por severidad
  (CRÍTICO/ALTO/MEDIO/BAJO). Usar con "revisá el diff", "code review",
  "checkeá mis cambios", "revisame este PR", antes de mergear.
---

# Review — Code Review del Diff

Análisis del diff contra la branch base para detectar problemas estructurales que
los tests no atrapan. Cada hallazgo con severidad, línea específica y fix sugerido.

## Lectura previa obligatoria

- `AGENTS.md` — convenciones, aliases, reglas del proyecto
- `README.md` — stack y estructura modular
- `package.json` — dependencias, scripts
- `git diff` contra la branch base (develop/main)

## Cuándo usar esta skill

- "revisá el diff"
- "code review de estos cambios"
- "checkeá mis cambios antes de mergear"
- "revisame este PR"
- Antes de cualquier merge
- Después de `debug-flow` (fix de bug)
- Después de `design-audit` (cambios visuales)

## Cuándo NO usar esta skill

- **Bug sin arreglar** → primero `debug-flow`, después `code-review`
- **Cambios solo visuales sin revisar diseño** → primero `design-audit`
- **Menos de 5 líneas de cambio trivial** → opcional, se puede skipear
- **Planificar una feature** → `architecture-review`

---

## Paso 1 — Entender qué cambió

1. `git diff <base>...HEAD` o `git diff origin/develop...HEAD`
2. Identificar:
   - ¿Qué módulos de `src/modules/` se tocan?
   - ¿Cuántos archivos? (+50 archivos = señal de alerta)
   - ¿Cuántas líneas? (+500 líneas = revisar granularidad)
3. Leer los commits para entender la intención del cambio
4. Si hay PR description/template, leerla

---

## Paso 2 — Verificar intención vs implementación

- ¿El diff hace lo que los commits/PR dicen que hace?
- ¿Hay cambios colaterales no mencionados? (archivos tocados sin relación aparente)
- ¿Se agregaron archivos que no deberían estar? (.env, secrets, node_modules, logs)
- ¿Se modificaron archivos de configuración sin justificación?

---

## Paso 3 — Checklist estructural

Revisar CADA archivo modificado contra estas reglas:

### Arquitectura
- [ ] ¿La lógica de negocio está en `src/modules/<dominio>/` y no en `src/app/`?
- [ ] ¿Las páginas del router son livianas (delegan a hooks/pages del módulo)?
- [ ] ¿Los servicios están separados de los hooks (no hace fetch el hook directo)?
- [ ] ¿Las query keys están en `query/keys.ts` (no hardcodeadas en el hook)?
- [ ] ¿Los hooks exponen comportamiento declarativo (useQuery/useMutation)?

### Convenciones
- [ ] ¿Se usan los aliases correctos? (`@/`, `@desingSystem/`, `@env`, `@envClient`)
- [ ] ¿No hay imports directos de `@mui/*` fuera del design system (`@desingSystem/*` / `src/modules/desingSystem/`)?
- [ ] ¿Los nombres de archivo siguen la convención del módulo?
- [ ] ¿Se respetan las carpetas existentes? (no crear `utils/` si el módulo usa `helpers/`)

### Forms
- [ ] ¿Los formularios nuevos usan `react-hook-form` + `zod`?
- [ ] ¿El schema de zod está definido a nivel contenedor (no en el componente)?
- [ ] ¿Los componentes de form son dumb (reciben `control`, `errors`, `register` por props)?

### React Query
- [ ] ¿Las query keys son descriptivas y están en `query/keys.ts`?
- [ ] ¿Los mutations usan `onSuccess`/`onSettled` para invalidar queries relacionadas?
- [ ] ¿Se usa `meta.successSnackbarMessage` / `meta.errorSnackbarMessage` para feedback?

---

## Paso 4 — Calidad de código

- **Tipos de TypeScript:** ¿hay `any` injustificado? ¿los tipos son precisos? ¿se usan genéricos cuando corresponde?
- **Naming:** ¿nombres de variables/funciones descriptivos? ¿sin abreviaturas oscuras?
- **Funciones puras:** ¿los helpers son exportables y testeables?
- **Manejo de errores:** ¿los servicios tienen try/catch? ¿los hooks manejan `isError`?
- **Limpieza:** ¿sin `console.log`, `debugger`, comentarios de debug, código comentado?
- **Secrets:** ¿sin API keys, tokens o passwords hardcodeados?
- **Imports:** ¿sin imports no usados?

---

## Paso 4b — Reglas del linter (eslint.config.mjs)

El repo tiene reglas ESLint custom que el diff debe respetar. Verificarlas además
de correr `pnpm run lint`:

- **`no-restricted-imports` global** con patrón `^@mui/[^/]+$`: prohibido importar
  `@mui/material`, `@mui/system`, etc. **sin subpath** en TODO el proyecto
  (incluido desingSystem). Solo se permite el subpath (`@mui/material/Button`).
- **En `src/**`** (excepto `src/modules/desingSystem/**` y `src/modules/core/utils/date.ts`):
  bloqueado `@mui/system`, `@mui/material`, `@mui/icons-material`,
  `@mui/x-date-pickers` (imports directos). Todo pasa por `@desingSystem/*`.
- **`date-fns`/`date-fns/format`**: prohibido importar `format` directo — usar
  `src/modules/core/utils/date.ts`.
- **`react-hooks/refs` y `react-hooks/set-state-in-effect`**: están **OFF
  intencionalmente** (dan false positives). NO marcar como issue.
- **Estilo obligatorio:** `semi` always, `comma-dangle: never`, `quotes: single`
  (sin template literals innecesarios), `indent: 2`, `camelcase` (solo `^UNSAFE_`
  permitido), `eqeqeq` always, `no-console` (solo `warn`/`error`), `prefer-const`.
- **`no-throw-literal`**: solo lanzar instancias de `Error`.
- **`require-await`**: no marcar funciones como `async` sin `await`.

---

## Paso 5 — Estados de UI

Para cada componente nuevo o modificado que renderiza datos:

- [ ] **Loading:** ¿se muestra skeleton/spinner mientras carga?
- [ ] **Empty:** ¿hay mensaje e ilustración/CTA cuando no hay datos?
- [ ] **Error:** ¿se muestra el error y hay botón de retry?
- [ ] **Success:** ¿los datos se renderizan correctamente?
- [ ] **Edge cases:** ¿valores nulos, arrays vacíos, strings muy largos, datos inesperados?

---

## Severidad

| Nivel | Significado | Ejemplos |
|---|---|---|
| **CRÍTICO** | Bloquea el merge | Lógica en `app/`, secret expuesto, `@mui/*` fuera del design system, `any` que rompe tipos en runtime |
| **ALTO** | Debería arreglarse antes de mergear | Falta estado de error, query keys hardcodeadas, tipos débiles, form sin zod |
| **MEDIO** | Mejorable, no bloquea | Naming poco claro, archivo >300 líneas, hook sin separación clara |
| **BAJO** | Sugerencia | Comentario faltante, formato, orden de imports |

---

## Reglas de lo que SÍ debe hacer

- Leer el diff completo antes de emitir juicio
- Citar archivo y línea específica para cada hallazgo
- Clasificar cada hallazgo con severidad (CRÍTICO/ALTO/MEDIO/BAJO)
- Proponer fix concreto para cada issue
- Verificar que el cambio no rompe convenciones del proyecto
- Revisar archivos fuera del diff que puedan verse afectados
- Leer AGENTS.md antes de empezar para conocer las reglas del proyecto
- Reportar hallazgos positivos también ("buen manejo de estados", "tipos correctos")

## Reglas de lo que NO debe hacer

- NO aprobar si hay lógica de negocio en `src/app/`
- NO aprobar si hay imports de `@mui/*` fuera del design system (`@desingSystem/*` / `src/modules/desingSystem/`)
- NO hacer review de espaciado/colores/visual — eso es `design-audit`
- NO sugerir reescribir todo si el cambio es funcionalmente correcto
- NO dejar pasar `any` sin justificación
- NO aprobar código que no maneja estados de error
- NO aprobar si hay `console.log` o código de debug
- NO asumir que "funciona" sin revisar el flujo de datos completo
- NO ignorar la estructura de módulos — cada cambio debe estar en el módulo correcto
- NO hacer review sin leer AGENTS.md primero (cada proyecto tiene sus reglas)

## Al terminar

Sugerir al usuario: **code-health** para correr lint y typecheck, y verificar score de calidad.
