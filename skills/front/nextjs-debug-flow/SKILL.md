---
name: nextjs-debug-flow
description: |
  Debugging sistemático en 4 fases: investigar, analizar, hipotetizar, implementar.
  Regla de hierro: no se aplica ningún fix sin identificar la causa raíz.
  Usar con "debuggeá esto", "por qué falla", "investigá el error", "root cause",
  "arreglá este bug", "antes funcionaba y ahora no".
---

# Investigar — Debugging con Root Cause

Debugging sistemático para encontrar y arreglar bugs. Cuatro fases secuenciales.
**Nunca se saltea una fase.** Nunca se arregla sin entender la causa raíz.

## Lectura previa obligatoria

- `AGENTS.md` — patrón de módulos, convenciones del proyecto
- `README.md` — stack (React Query, zod, react-hook-form, MUI)
- Estructura de `src/modules/` — identificar el módulo dueño del área del bug
- Servicios relevantes en `src/modules/<dominio>/services/`
- Hooks que consumen esos servicios en `src/modules/<dominio>/hooks/`
- `src/modules/<dominio>/query/keys.ts` — query keys del módulo

## Cuándo usar esta skill

- "debuggeá este error"
- "por qué falla X"
- "investigá el bug"
- "encontrá la causa raíz"
- "arreglá este comportamiento"
- "antes funcionaba y ahora no"
- Errores 500, stack traces, comportamiento inesperado
- **Siempre usar esta skill para bugs. NUNCA debuggear directo.**

## Cuándo NO usar esta skill

- **Typo evidente o fix obvio de 1 línea** → Fast-Path: corregir directamente y verificar con `nextjs-code-review` sin ejecutar el ciclo forense de 4 fases.
- **Error de diseño/visual** (espaciado, color, tipografía) → `nextjs-design-audit`
- **Error de tipos o lint** → `nextjs-code-health`
- **Revisar código sin bug concreto** → `nextjs-code-review`
- **Planificar una feature nueva** → `nextjs-architect`
- **Problema de infraestructura/deploy** → no es debugging de código

---

## Metodología

### Fase 1 — INVESTIGAR

Recolectar toda la información antes de tocar código.

### Pasos

1. **Reproducir el bug** — pasos exactos para triggerearlo
2. **Capturar el error**:
   - Mensaje de error completo (sin truncar)
   - Stack trace completo
   - Request y response del servicio HTTP (network tab, payload, status code)
   - Estado del componente al momento del error (props, state, contexto)
3. **Clasificar el bug**:
   - ¿Frontend o backend? (si el error viene del servidor, el fix puede estar en backend)
   - ¿De datos o de UI? (datos incorrectos vs renderizado roto)
   - ¿Consistente o intermitente? (siempre falla vs a veces)
4. **Contexto del bug**:
   - ¿Qué usuario/hora/condición lo triggeró?
   - ¿Hay pasos previos necesarios?
   - ¿Se puede reproducir en incógnito / con caché limpia?

### Qué buscar según el stack

- **React Query:** ¿la query está stale? ¿se invalidó correctamente? ¿el `queryFn` está tirando error?
- **React Hook Form + Zod:** ¿el schema de validación rechaza datos válidos? ¿el error es de zod o del servicio?
- **Servicios HTTP:** ¿el endpoint es correcto? ¿el payload matchea lo que espera el backend? ¿el status code es el esperado?
- **Componentes:** ¿condicional de renderizado incorrecto? ¿prop no definida? ¿key duplicada en lista?

---

## Fase 2 — ANALIZAR

Trazar el flujo de datos para aislar dónde se rompe.

### Trazado del flujo

1. **Componente → Hook:** ¿el hook está recibiendo los parámetros correctos? ¿se está llamando?
2. **Hook → Servicio:** ¿el hook está usando el servicio correcto? ¿los argumentos son los esperados?
3. **Servicio → HTTP:** ¿la URL, método y payload son correctos? ¿los headers de auth están presentes?
4. **Respuesta → Hook:** ¿la respuesta tiene la forma que espera el hook? ¿el status code se maneja correctamente?
5. **Hook → Query Key:** ¿la query key es correcta? ¿staleTime/gcTime están causando datos viejos?

### Puntos críticos a revisar

- **Caché de React Query:** ¿datos stale? ¿la invalidación (`queryClient.invalidateQueries`) se está ejecutando?
- **Tipos de TypeScript:** ¿hay un `as` o `any` escondiendo un mismatch?
- **Zod schema:** ¿el schema de validación coincide con lo que manda el backend?
- **Estados no manejados:** ¿el componente asume que los datos siempre vienen? ¿maneja `undefined`, `null`, array vacío?
- **Efectos secundarios:** ¿un `useEffect` está disparando en el momento incorrecto?

### Trazabilidad e Inspección de Caché (React Query)
Cuando el bug involucre datos desactualizados, queries que no refrescan o mutaciones sin efecto:
1. **Identificar la query key exacta**: localizar la definición en `src/modules/<dominio>/query/keys.ts`.
2. **Volcado del estado de la query**:
   ```typescript
   // Inspeccionar estado en runtime o en spec de reproducción
   console.log(queryClient.getQueryState(featureKeys.detail(id)));
   console.log(queryClient.getQueryData(featureKeys.detail(id)));
   ```
   Verificar campos críticos: `status`, `fetchStatus`, `isStale`, `dataUpdatedAt`, y `error`.
3. **Verificar invalidación**: Confirmar que las mutaciones ejecutan `await queryClient.invalidateQueries({ queryKey: ... })` y que los tags/keys coincidan en profundidad.

---

## Fase 3 — HIPOTETIZAR

Formular la causa raíz ANTES de tocar código.

### Cómo formular la hipótesis

1. Escribir la causa raíz en **una oración**:
   > "El hook `useProcedures` devuelve `undefined` porque el servicio `getProcedures` no maneja el status 204 que el backend retorna cuando la lista está vacía."
2. **Validar:** ¿esta causa explica TODOS los síntomas observados?
3. **Si no los explica todos**, hay más de un bug o la hipótesis es incorrecta → volver a Fase 1.

### Regla de hierro
**No se avanza a Fase 4 sin hipótesis validada.** Si no podés formular la causa en una oración, no entendiste el bug.

---

## Fase 3.5 — TEST DE REGRESIÓN OBLIGATORIO (TDD)

**Regla estricta**: Antes de modificar cualquier línea de código productivo:
1. Crear o actualizar un test unitario (`*.spec.ts`) o script mínimo de reproducción en scratchpad que reproduzca el error.
2. Ejecutar el test con el runner del proyecto:
   ```bash
   pnpm test -- <path-al-spec>.spec.ts
   ```
3. Confirmar que el test **falla (en rojo)** verificando la hipótesis de la Fase 3.
4. Solo entonces avanzar a la Fase 4. El fix se considerará completo únicamente cuando este test pase a verde.

---

## Fase 4 — IMPLEMENTAR Y REGISTRAR

Fix mínimo, verificado, sin efectos colaterales.

### Pasos

1. **Fix mínimo** — arreglar solo lo necesario, no refactorizar de paso
2. **Verificar el fix**:
   - Ejecutar el test de regresión de la Fase 3.5 → ahora pasa a verde
   - Reproducir manualmente → el bug ya no ocurre
   - Probar al menos 2 escenarios: happy path + edge case
3. **Verificar no romper nada**:
   - Si el fix fue en un hook: revisar todos los componentes que lo consumen
   - Si el fix fue en un servicio: revisar todos los hooks que lo usan
   - Si el fix fue en un tipo: revisar todos los lugares donde se usa ese tipo
4. **Buscar el mismo patrón** — si el bug fue por un error común, revisar si existe en otros hooks/servicios
5. **Generar reporte Direct-to-Disk**:
   - Utilizar la plantilla oficial [`templates/debug-report.template.md`](./templates/debug-report.template.md).
   - Escribir el informe completo en `.agents/debug/<issue-kebab-case>-debug.md` (`write_to_file`).
   - Reportar en el chat únicamente la hipótesis en una oración, archivos modificados y el status del test de regresión.

---

## Reglas de lo que SÍ debe hacer

- Escribir el reporte completo en `.agents/debug/<issue-kebab-case>-debug.md` (`write_to_file`)
- Escribir un test o caso de regresión reproducible que falle antes del fix
- Reproducir el bug antes de tocar una sola línea de código
- Trazar el flujo completo de datos (componente → hook → servicio → query key)
- Verificar el fix con reproducción negativa (el bug ya no ocurre)
- Documentar la causa raíz encontrada (una oración)
- Revisar si el mismo patrón de bug existe en otros lugares del módulo
- Leer los servicios y hooks relevantes antes de tocar código
- Verificar el response real del backend (no asumir)

## Reglas de lo que NO debe hacer

- NO volcar el reporte extenso ni logs masivos en la respuesta de chat
- NO aplicar un fix sin haber identificado la causa raíz
- NO omitir el test de regresión previo al fix
- NO hacer fixes "a ver si funciona" (trial and error)
- NO modificar código que no está relacionado con el bug (refactors en otro commit)
- NO ignorar la caché de React Query — es causa frecuente de bugs sutiles
- NO asumir que el backend devuelve lo que esperás — verificar el response real
- NO cerrar el bug sin verificar al menos 2 escenarios (happy + edge case)
- NO usar `as any` o `@ts-ignore` para "arreglar" un error de tipos
- NO ignorar errores silenciosos (promesas sin catch, try/catch vacíos)
- NO committear console.log ni código de debug
- NO hacer refactors en el mismo commit del fix

## Verificación

- Confirmar persistencia del reporte en `.agents/debug/<issue-kebab-case>-debug.md`.
- Bug reproducido en Fase 1 y en test de regresión Fase 3.5.
- Causa raíz identificada en Fase 3 en una sola oración.
- Fix aplicado en Fase 4 y test de regresión pasando a verde.
- Bug ya no ocurre y no se rompió nada relacionado.

## Al terminar

Confirmar persistencia del reporte en `.agents/debug/<issue-kebab-case>-debug.md`. Sugerir al usuario: **nextjs-code-review** para validar el fix con code review.
