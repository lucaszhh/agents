---
name: nextjs-code-health
description: |
  Dashboard de calidad de código. Ejecuta linter y type checker del proyecto,
  analiza estructura de módulos y detecta deuda técnica. Computa un score
  compuesto 0-10. Usar con "health check", "cómo está el código", "code quality",
  "quality score", "run all checks", al final de cada cadena de skills.
---

# Code Health — Dashboard de Calidad

Ejecuta las herramientas de calidad del proyecto y computa un score 0-10.
Detecta automáticamente los scripts disponibles en `package.json`.

## Lectura previa obligatoria

1. `package.json` — detectar scripts: `lint`, `typecheck`, `test`, `build`
2. `AGENTS.md` — reglas y convenciones del proyecto
3. `tsconfig.json` — configuración de TypeScript
4. `eslint.config.mjs` — reglas custom del linter (si existe)

## Cuándo usar esta skill

- "health check"
- "cómo está el código"
- "code quality"
- "quality score"
- "run all checks"
- Al final de cualquier cadena de skills
- Antes de un release

## Cuándo NO usar esta skill

- **Solo correr lint** → ejecutar `pnpm run lint` directo, no hace falta la skill
- **Debuggear un bug** → `nextjs-debug-flow`
- **Revisar un diff específico** → `nextjs-code-review`

---

## Metodología

### Paso 0 — Detectar el entorno

Antes de ejecutar, detectar:

1. **Package manager**: `pnpm`, `npm`, o `yarn` (mirar lock file o `package.json`)
2. **Scripts disponibles**: leer `package.json` → `scripts`
3. **Reglas del linter**: si existe `eslint.config.mjs`, leerlo para entender qué se verifica

```bash
# Detectar package manager
ls pnpm-lock.yaml && echo "pnpm" || ls yarn.lock && echo "yarn" || echo "npm"

# Detectar scripts
cat package.json | grep -A 20 '"scripts"'
```

### Paso 1 — Ejecutar checks reales

El método preferido y multiplataforma es ejecutar el script de salud sin dependencias de tuberías bash:

```bash
# Ejecución completa con resumen en terminal y colores ANSI
node scripts/check_code_health.mjs

# Para agentes y pipelines CI/CD (emite JSON estructurado de métricas)
node scripts/check_code_health.mjs --json

# Guardar métricas automáticamente en .health-history.jsonl
node scripts/check_code_health.mjs --save
```

Si se ejecutan las herramientas manualmente, evitar pipes dependientes de GNU bash (`tee /tmp/...`):

```bash
# Linter
pnpm run lint

# TypeScript
pnpm run typecheck

# Tests (si existe)
pnpm run test

# Build (opcional, para verificar que compila)
pnpm run build
```

Si un script no existe, reportarlo y continuar con los demás. NO fallar silenciosamente.

---

### Check 1 — Linter (3 puntos)

1. Ejecutar `pnpm run lint` y capturar salida
2. Contar errores (E) y warnings (W)
3. Si hay errores: listar los 5 más frecuentes (archivo:línea)
4. **Reglas del eslint.config.mjs**: si el lint falla, revisar qué reglas están activas. En el frontend-nextjs las reglas más comunes son: `semi: always`, `quotes: single`, `indent: 2`, `comma-dangle: never`, `camelcase` (excepto `UNSAFE_`), `@mui/*` restringido.

Scoring:

| Errores | Warnings | Puntos |
|---|---|---|
| 0 | 0 | **3** |
| 0 | >0 | **2** |
| 1-5 | - | **1** |
| 6-20 | - | **0.5** |
| >20 | - | **0** |

### Fix suggestions

Si el lint falla, sugerir fixes concretos:
- `semi` → agregar punto y coma al final de statements
- `quotes` → cambiar comillas dobles a simples
- `indent` →-indentar con 2 espacios
- `comma-dangle` → quitar trailing commas
- `camelcase` → renombrar variables a camelCase
- `@mui/*` → importar desde `@desingSystem/*` en vez de `@mui/material` directo

---

### Check 2 — TypeScript (3 puntos)

1. Ejecutar `pnpm run typecheck` o `npx tsc --noEmit`
2. Contar errores de tipo
3. Agrupar por tipo de error (props incompatibles, imports rotos, etc.)
4. Scoring:

| Errores | Puntos |
|---|---|
| 0 | **3** |
| 1-5 | **1** |
| >5 | **0** |

### Fix suggestions

- `Type 'X' is not assignable to type 'Y'` → revisar tipado de props/return
- `Cannot find module` → verificar alias en tsconfig.json o包不存在
- `Property 'X' does not exist on type 'Y'` → revisar tipos o usar type assertion

---

### Check 3 — Estructura de módulos (2 puntos)

Según el `AGENTS.md` y `docs/architecture.md` del repo, **NO todos los módulos tienen el set completo** de carpetas (`domain/`, `services/`, `hooks/`, `query/`, `components/`, `pages/`). Algunos usan nombres irregulares (`hook` singular, `componentes`). Respetar la convención local.

Verificar SOLO las violaciones reales:

1. ¿Hay lógica de negocio en `src/app/` que debería estar en `src/modules/`?
2. ¿Hay imports de `@mui/*` (sin subpath) fuera del design system?
3. ¿Hay imports de `date-fns/format` en vez de `src/modules/core/utils/date.ts`?
4. ¿Los módulos que usan React Query tienen `query/keys.ts` o siguen la convención local?

Scoring:

| Violaciones | Puntos |
|---|---|
| Ninguna | **2** |
| Menores (1-2 `date-fns/format`, `@mui/*` puntuales) | **1** |
| Graves (lógica en app/, `@mui/*` directo fuera del DS, query keys hardcodeadas) | **0** |

### Fix suggestions

- Lógica en `src/app/` → mover a `src/modules/[nombre]/domain/` o `services/`
- `@mui/material` directo → importar desde `@desingSystem/*`
- `date-fns/format` → usar `src/modules/core/utils/date.ts`
- Query keys hardcodeadas → mover a `src/modules/[nombre]/query/keys.ts`

---

### Check 4 — Deuda técnica (1 punto)

`scripts/check_code_health.mjs` realiza el análisis estático de código sin pipes bash. Si se desea auditar patrones manualmente:

```bash
# Console logs y debugger
grep -rn "console\.\(log\|debug\|info\)" src/ --include="*.ts" --include="*.tsx"
grep -rn "debugger" src/ --include="*.ts" --include="*.tsx"

# TODOs sin resolver
grep -rn "TODO\|FIXME\|HACK\|XXX" src/ --include="*.ts" --include="*.tsx"
```

Scoring:

| Issues | Puntos |
|---|---|
| Ninguno | **1** |
| Menores (1-3 console.log, 1-2 TODOs) | **0.5** |
| Muchos o código comentado grande | **0** |

---

### Bonus — Archivos grandes (-1 punto si aplica)

`scripts/check_code_health.mjs` cuenta las líneas de todos los archivos fuente automáticamente.
Para inspección manual:

- Archivos > 500 líneas: listarlos
- Archivos > 1000 líneas: flaggear como crítico
- Penalización: **-1 punto** si hay archivos > 1000 líneas

---

## Score final (0-10)

Sumar los puntos de los 4 checks, restar penalizaciones. Mínimo 0, máximo 10.

| Score | Interpretación | Acción |
|---|---|---|
| 0-3 | Deuda técnica crítica | No mergeable. Fix inmediato. |
| 4-6 | Aceptable | Hay cosas para mejorar antes del próximo release. |
| 7-8 | Buen estado | Issues menores, se puede mergear. |
| 9-10 | Excelente | Código limpio y consistente. |

---

## Protocolo Direct-to-Disk OBLIGATORIO

1. **Plantilla oficial**: Utilizar la estructura definida en [`templates/code-health.template.md`](./templates/code-health.template.md).
2. **Destino del reporte**: Escribir el informe detallado en `.agents/health/health-report.md` (`write_to_file`).
3. **Registro histórico**: Apendear la entrada de score en `.health-history.jsonl`.
4. **Prohibido volcar logs masivos en chat**: No imprimir listas exhaustivas de warnings ni volcados de terminal. Si se detectan más de 10 violaciones o errores masivos (>50), truncar el listado en el chat a los 5 errores más frecuentes y remitir al informe detallado en `.agents/health/health-report.md`.
5. **Reporte Sintético en Chat**:
   - **Ruta del informe**: enlace a `.agents/health/health-report.md`.
   - **Score final**: puntaje 0-10 con desglose de checks y tendencia histórica.
   - **Monolitos y acciones inmediatas**: lista de archivos >1000 líneas y fixes prioritarios recomendados.

---

## Reglas de lo que SÍ debe hacer

- Guardar el reporte completo en `.agents/health/health-report.md` (`write_to_file`)
- Apendear el resultado en `.health-history.jsonl`
- Reportar en el chat únicamente el resumen sintético, score y tendencia
- Ejecutar los checks REALES con `node scripts/check_code_health.mjs` (no adivinar)
- Detectar automáticamente los scripts del `package.json` (no hardcodear `pnpm`)
- Reportar tendencia si hay health checks anteriores
- Dar fixes concretos para cada problema encontrado
- Priorizar: errores de tipo > errores de lint > estructura > deuda
- Reportar el score con interpretación clara
- Guardar historial para comparar en futuras corridas

## Reglas de lo que NO debe hacer

- NO volcar logs completos ni salidas masivas de linter en la respuesta de chat
- NO omitir la escritura del informe en `.agents/health/health-report.md`
- NO cambiar código para "arreglar" el score durante el health check
- NO ignorar errores de tipo aunque el lint pase
- NO reportar como "saludable" si hay >10 errores de cualquier tipo
- NO sugerir cambios de arquitectura masivos — esto es diagnóstico, no plan
- NO modificar `package.json` para cambiar scripts de lint/typecheck
- NO ejecutar `lint --fix` sin preguntar
- NO instalar dependencias nuevas para los checks
- NO fallar silenciosamente si un script no existe — reportarlo

## Verificación

- Confirmar persistencia del reporte en `.agents/health/health-report.md` y de la entrada en `.health-history.jsonl`.
- Ejecutar el runner de Code Health (`node scripts/check_code_health.mjs` o `pnpm health`).
- Validar que el puntaje final calculado sea >= 8/10 y que los checks bloqueantes (Linter y TypeScript) tengan 0 errores.
- Confirmar que el resumen y el historial `.health-history.jsonl` reflejen fielmente el estado actual del repositorio.

## Al terminar

Confirmar la persistencia del reporte en `.agents/health/health-report.md`. Mostrar score final con breakdown por categoría y tendencia (si hay historial).
Si el score es < 6, sugerir fixes concretos por prioridad y recomendar volver a correr
`nextjs-code-review` después de los arreglos.

No hay siguiente skill obligatoria — `nextjs-code-health` es el final de la cadena.
