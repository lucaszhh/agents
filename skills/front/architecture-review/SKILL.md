---
name: architecture-review
description: |
  Revisión de arquitectura antes de implementar. Define estructura de carpetas,
  data flow, servicios, hooks, tipos y estados de UI. Valida contra los patrones
  del proyecto (React Query, zod, módulos por dominio). Usar con "revisá la
  arquitectura", "planificá esta feature", "cómo estructuro X", "armame el plan",
  antes de empezar cualquier feature que toque más de un módulo.
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

- **Cambio de 1 archivo o fix trivial** → `code-review` directo
- **Cambio solo visual** → `design-audit`
- **Bug** → `debug-flow`
- **No sabés qué código existe** → usar `grep` o explorar `src/modules/` directamente
- **Ya hay un plan y solo querés code review** → `code-review`

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

Responder:

- ¿Qué módulos nuevos se crean?
- ¿Qué módulos existentes se modifican?
- ¿Qué servicios nuevos se necesitan? (endpoints HTTP)
- ¿Qué hooks nuevos se necesitan? (useQuery, useMutation)
- ¿Qué rutas nuevas o modificadas en `src/app/`?
- ¿Qué tipos de TypeScript nuevos? (interfaces, tipos de request/response)

### Fase 3 — Diseñar el data flow para cada feature

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

### Fase 5 — Entregar el plan

El plan debe incluir:

1. **Módulos afectados:** lista de módulos y si son nuevos o modificados
2. **Archivos a crear:** ruta completa de cada archivo nuevo
3. **Archivos a modificar:** ruta completa de cada archivo existente
4. **Servicios:** cada servicio con endpoint HTTP y tipo de retorno
5. **Hooks:** cada hook con query key, tipo de query/mutation y servicio que consume
6. **Tipos:** interfaces/types nuevos necesarios
7. **Rutas:** nuevas rutas en `src/app/`
8. **Estados de UI:** para cada pantalla: loading, empty, error, success, edge cases

---

## Reglas de lo que SÍ debe hacer

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

- ¿Qué archivos se crean/modifican? (rutas completas)
- ¿Qué servicios se necesitan? (endpoint, método HTTP, tipo de respuesta)
- ¿Qué hooks? (useQuery/useMutation, query keys)
- ¿Qué rutas de Next.js? (src/app/...)
- ¿Qué tipos de TypeScript?
- ¿Qué estados de UI cubre cada pantalla?
- ¿Respeta las convenciones del proyecto? (aliases, carpetas, naming)
- ¿No introduce dependencias nuevas innecesarias?

## Al terminar

Sugerir al usuario la siguiente skill según el contexto:

- Si hay UI nueva para diseñar → **design-craft**
- Si hay que implementar directamente → empezar a codear siguiendo el plan
- Si hay que explorar más el código existente → usar `grep` o navegar `src/modules/`
