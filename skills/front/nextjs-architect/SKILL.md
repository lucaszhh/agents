---
name: nextjs-architect
description: Planificación arquitectónica frontend antes de codificar. Define data flow, matriz RSC (Server vs Client Components), servicios HTTP, hooks de React Query y schemas zod. Escribe directo a .agents/plans/<feature>.md. Usar con "revisá la arquitectura", "planificá esta feature", "cómo estructuro X", "armame el plan".
---

# Revisión de Arquitectura

Planificación técnica antes de escribir código. El objetivo es tener un plan claro
de: qué archivos se crean/modifican, qué servicios se necesitan, qué hooks, qué rutas,
qué tipos y qué estados de UI se cubren.

## Lectura previa obligatoria

- **`AGENTS.md`** — reglas del proyecto, aliases, convenciones
- **`README.md`** — stack completo, estructura de módulos
- **`package.json`** — dependencias (React Query, zod, MUI, next-auth, react-hook-form)
- **`tsconfig.json`** — paths y aliases
- **`src/app/`** — rutas actuales y layout
- **`src/modules/`** — estructura de módulos existentes
- **`docs/architecture.md`** si existe

Si hay un módulo similar al que se va a crear, leerlo completo para replicar el patrón.

## Cuándo usar esta skill

- "revisá la arquitectura de esta feature"
- "planificá el cambio"
- "cómo estructuro este módulo nuevo"
- "armame el plan de implementación"
- "validá el diseño técnico"
- "esto está bien armado?"
- Antes de empezar cualquier feature que toque >1 módulo
- Antes de crear un módulo nuevo

## Cuándo NO usar esta skill

- **Cambio menor (< 10 líneas, hotfix cosmético o fix trivial)** → Fast-Path: aplicar el cambio directo y usar `nextjs-code-review`. Prohibido redactar planes ceremoniales para tareas chicas.
- **Cambio solo visual** → `nextjs-design-audit`
- **Bug funcional** → `nextjs-debug-flow`
- **No sabés qué código existe** → usar `grep` o explorar `src/modules/` directamente
- **Ya hay un plan y solo querés code review** → `nextjs-code-review`

---

## Metodología

### Fase 1 — Entender el stack y las convenciones

1. Leer `AGENTS.md` completo — esto define las reglas
2. Leer `package.json` — ¿qué versión de React/Next? ¿qué librerías ya están?
3. Identificar el patrón de módulos del proyecto:
   - ¿Estructura típica? (`domain/`, `services/`, `hooks/`, `query/`, `components/`, `pages/`)
   - ¿Cómo se nombran los archivos? (`kebab-case.ts`, `camelCase.tsx`)
   - ¿Cómo se exportan? (barrel `index.ts` o imports directos)
4. Revisar un módulo existente como referencia (ej: `src/modules/procedures/`)

### Fase 2 — Mapear los módulos afectados

Ejecutar comandos concretos de inspección para evitar lecturas ciegas:
```bash
# Árbol de rutas y layouts de Next.js
find src/app -name "page.tsx" -o -name "layout.tsx"
# o si tree está instalado:
tree src/app

# Módulos y dominios existentes
find src/modules -maxdepth 2 -type d
```

Responder:

- ¿Qué módulos nuevos se crean?
- ¿Qué módulos existentes se modifican?
- ¿Qué servicios nuevos se necesitan? (endpoints HTTP)
- ¿Qué hooks nuevos se necesitan? (useQuery, useMutation)
- ¿Qué rutas nuevas o modificadas en `src/app/`?
- ¿Qué tipos de TypeScript nuevos? (interfaces, tipos de request/response)

### Fase 3 — Diseñar el data flow y matriz RSC para cada feature

1. **Matriz Server Components vs Client Components (RSC)**:
   Construir obligatoriamente la tabla de decisión RSC para cada componente/página nueva o modificada:

   | Componente / Archivo | Tipo (RSC / "use client") | Justificación Técnica (Interactividad / Bundle size / SSR) |
   |---|:---:|---|
   | `src/app/[ruta]/page.tsx` | **Server Component** | Fetch inicial SSR, reduce bundle JS en cliente, optimiza SEO. |
   | `src/modules/[mod]/components/[View]Container.tsx` | **Client Component** (`"use client"`) | Interactividad, estado (`useState`), hooks de React Query, forms. |
   | `src/modules/[mod]/components/[Card]Display.tsx` | **Server Component** | Presentacional puro, sin hooks ni interactividad requerida. |

   - Identificar qué partes del árbol requieren interactividad (`useState`, `useEffect`, `useQuery`, formularios) para marcar con `"use client"`.
   - Mantener las páginas `src/app/**/page.tsx` como Server Components cuando sea posible para SSR y reducir bundle cliente.

2. **Trazar Data Flow**:
Para cada pantalla o funcionalidad, trazar:

```
Componente/Página (src/app/...)
  → Hook (src/modules/<dominio>/hooks/use<Feature>.ts)
    → useQuery / useMutation
      → queryFn / mutationFn
        → Servicio (src/modules/<dominio>/services/<feature>.ts)
          → HTTP request (GET/POST/PUT/DELETE)
        → Query Key (src/modules/<dominio>/query/keys.ts)
```

Para escritura (mutations):

```
Componente → dispara hook de mutación
  → useMutation con mutationFn → servicio
  → onSuccess: invalidar queries relacionadas
  → feedback: meta.successSnackbarMessage / meta.errorSnackbarMessage
```

### Fase 4 — Validar contra patrones del proyecto

Checklist de validación del plan:

- [ ] ¿La lógica está en `src/modules/<dominio>/`, no en `src/app/`?
- [ ] ¿Los servicios son funciones exportables que reciben params y retornan datos?
- [ ] ¿Los hooks usan `useQuery`/`useMutation` de React Query?
- [ ] ¿Las query keys están en `query/keys.ts` centralizadas?
- [ ] ¿Los forms usan `react-hook-form` + `zod`?
- [ ] ¿La UI usa `@desingSystem/*` (o el design system del proyecto)?
- [ ] ¿No se proponen imports de `@mui/*` fuera del design system?
- [ ] ¿Se reutilizan helpers comunes? (fechas, env, snackbar)
- [ ] ¿Se respetan los aliases del proyecto? (`@/`, `@desingSystem/`, `@env`)
- [ ] ¿El plan no introduce librerías nuevas innecesarias?

### Fase 5 — Entregar el plan (.agents/plans/<nombre>.md)

#### Protocolo de Entrega Direct-to-Disk OBLIGATORIO

El entregable completo de arquitectura **NUNCA se responde ni se vuelca en el hilo de chat**. Debe persistirse directamente en disco utilizando la plantilla oficial:

1. **Plantilla oficial**: Utilizar la estructura definida en [`templates/architecture-plan.template.md`](./templates/architecture-plan.template.md).
2. **Destino del entregable**: Escribir el plan completo en `.agents/plans/<nombre>.md` (crear la carpeta `.agents/plans/` si no existe).
   - `<nombre>` debe ser el nombre de la feature o módulo en formato `kebab-case` (ej. `.agents/plans/solicitudes-pago.md`, `.agents/plans/tramites-layout.md`).
3. **Prohibido volcar el plan en el chat**: No imprimir el documento técnico completo, especificaciones extensas ni esquemas exhaustivos en la respuesta de la conversación para no saturar la ventana de contexto.
4. **Contenido obligatorio del archivo `.agents/plans/<nombre>.md`**:
   - **Objetivo y Contexto**: resumen de la feature/módulo y módulos afectados (nuevos vs modificados).
   - **Archivos a crear y modificar**: rutas completas de cada archivo nuevo y existente.
   - **Matriz RSC**: Server Components vs Client Components con justificación técnica.
   - **Data Flow y Servicios**: endpoints HTTP, tipos de retorno y llamadas encapsuladas.
   - **Hooks y React Query**: keys centralizadas en `query/keys.ts`, tipo de query/mutation y servicio que consume.
   - **Tipos de TypeScript y Schemas Zod**: contratos, interfaces y validaciones.
   - **Rutas y Layouts**: nuevas rutas en `src/app/` y consideraciones de layout/auth.
   - **Estados de UI**: loading, empty, error, success, edge cases por pantalla.
   - **Oportunidades de Mejora y Gaps Detectados**: análisis proactivo de inconsistencias o elementos omitidos en el requerimiento original.
   - **Preguntas de Negocio**: dudas de alcance o trade-offs que requieren validación del usuario.

5. **Respuesta en el hilo de chat (Reporte Sintético)**:
   En el hilo de la conversación, el agente **únicamente** debe responder con un reporte sintético conciso:
   - **Ruta del entregable**: enlace/ruta al archivo generado (`.agents/plans/<nombre>.md`).
   - **Resumen ejecutivo**: síntesis breve (1-2 párrafos) de la estrategia arquitectónica y módulos afectados.
   - **Preguntas de Negocio y Gaps**: lista de preguntas o puntos de decisión críticos para el usuario antes de iniciar la implementación.
   - **Siguiente paso recomendado**: sugerir la siguiente skill (ej. `nextjs-design-craft` para UI o pasar a implementación siguiendo el plan tras la aprobación humana).

---

## Reglas de lo que SÍ debe hacer

- Escribir obligatoriamente el plan completo en `.agents/plans/<nombre>.md` (`write_to_file`)
- Reportar en el chat únicamente el resumen sintético, ruta del archivo y preguntas de negocio / gaps
- Leer `AGENTS.md`, `README.md` y `package.json` antes de planificar
- Proponer rutas de archivo concretas: `src/modules/<dominio>/services/<nombre>.ts`
- Validar que el plan usa las dependencias que YA están en el proyecto
- Identificar hooks existentes que se pueden reutilizar
- Listar explícitamente los tipos de TypeScript necesarios
- Para cada pantalla nueva, pensar en: loading, empty, error, success, edge cases
- Si hay formularios, especificar el schema de zod
- Usar como referencia la estructura de un módulo existente del proyecto
- Considerar si el cambio afecta autenticación, navegación o providers globales
- Si el cambio toca providers globales, la cadena en `src/app/layout.tsx` es:
  `AuthProvider` → `DesignSystemProviders` → `SnackbarProvider` →
  `QueryErrorResetBoundaryProvider` → `QueryProvider`

## Reglas de lo que NO debe hacer

- NO volcar el plan técnico completo ni especificaciones largas en la respuesta del chat
- NO omitir la escritura del entregable en `.agents/plans/<nombre>.md`
- NO proponer lógica de negocio en `src/app/*` — siempre en `src/modules/*`
- NO hacer fetch directo en componentes — siempre delegar a services
- NO proponer imports directos de librerías de UI fuera del design system del proyecto
- NO inventar nuevas convenciones de carpetas si el proyecto ya tiene un patrón establecido
- NO proponer librerías nuevas sin verificar que no existe algo similar en `package.json`
- NO hardcodear query keys — siempre centralizar en `query/keys.ts`
- NO ignorar el design system existente del proyecto
- NO planificar sin haber leído el código actual (no planear en el vacío)
- NO saltarse los edge cases en el plan
- NO entregar un plan sin estados (loading/empty/error)
- NO proponer estructura de módulo inconsistente con los módulos existentes
- NO asumir que el proyecto usa una herramienta sin verificarlo en `package.json`

---

## Verificación

El plan responde todas estas preguntas:

- ¿Se escribió el archivo en `.agents/plans/<nombre>.md`?
- ¿El chat contiene solo el reporte sintético con preguntas de negocio y gaps?
- ¿Qué archivos se crean/modifican? (rutas completas)
- ¿Qué servicios se necesitan? (endpoint, método HTTP, tipo de respuesta)
- ¿Qué hooks? (useQuery/useMutation, query keys)
- ¿Qué rutas de Next.js? (src/app/...)
- ¿Qué tipos de TypeScript?
- ¿Qué estados de UI cubre cada pantalla?
- ¿Respeta las convenciones del proyecto? (aliases, carpetas, naming)
- ¿No introduce dependencias nuevas innecesarias?

## Al terminar

Confirmar que el plan quedó guardado en `.agents/plans/<nombre>.md`. Reportar en el chat el resumen sintético y las preguntas de negocio pendientes de validación. Sugerir al usuario la siguiente skill según el contexto tras la aprobación del plan:

- Si hay UI nueva para diseñar → **nextjs-design-craft**
- Si hay que implementar directamente → empezar a codear siguiendo el plan
- Si hay que explorar más el código existente → usar `grep` o navegar `src/modules/`
