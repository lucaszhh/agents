# 📐 Plan de Arquitectura Frontend — [Nombre de la Feature]

> **Archivo generado en**: `.agents/plans/[feature-kebab-case].md`  
> **Fecha**: YYYY-MM-DD  
> **Autor / Rol**: `@architect`  
> **Estado**: `Pendiente de Aprobación` <!-- Opciones: Pendiente de Aprobación | Aprobado | En Implementación -->

---

## 1. Resumen Ejecutivo y Alcance

- **Objetivo**: Breve descripción técnica de qué resuelve la feature y su impacto en la plataforma.
- **Módulos Afectados**:
  - `src/modules/[modulo-principal]/` (Modificado / Nuevo)
  - `src/modules/[modulo-secundario]/` (Modificado)
  - `src/app/[ruta]/` (Rutas y layouts afectados)

---

## 2. Inspección del Código Base Existente

Comandos ejecutados para mapear el estado previo:
```bash
find src/app/[ruta] -maxdepth 3 -name "page.tsx" -o -name "layout.tsx"
find src/modules/[modulo] -type f
```

- **Patrón de referencia identificado**: `src/modules/[modulo-existente]/`
- **Aliases utilizados**: `@/`, `@desingSystem/*`, `@env`, `@envClient`

---

## 3. Matriz de Decisión: Server Components vs Client Components (RSC)

| Componente / Archivo | Tipo | Justificación Técnica |
|---|:---:|---|
| `src/app/[ruta]/page.tsx` | **Server Component** | Fetch inicial de datos SSR, reducción de JS cliente, SEO/performance. |
| `src/modules/[mod]/components/[View]Container.tsx` | **Client Component** (`"use client"`) | Manejo de formularios (`react-hook-form`), mutaciones de React Query e interactividad. |
| `src/modules/[mod]/components/[Card]Display.tsx` | **Server Component** | Componente puramente presentacional sin hooks ni interactividad. |

---

## 4. Archivos a Crear y Modificar

### Archivos Nuevos
- `[NEW]` `src/modules/[modulo]/domain/[feature].types.ts`
- `[NEW]` `src/modules/[modulo]/services/[feature].service.ts`
- `[NEW]` `src/modules/[modulo]/hooks/use[Feature].ts`
- `[NEW]` `src/modules/[modulo]/components/[Feature]Form.tsx`

### Archivos Modificados
- `[MODIFY]` `src/modules/[modulo]/query/keys.ts` (Incorporación de nuevas query keys)
- `[MODIFY]` `src/app/[ruta]/page.tsx` (Integración del nuevo contenedor)

---

## 5. Data Flow y Servicios

### Diagrama de Flujo
```
Página / Componente (src/app/... o src/modules/.../components/...)
  → Hook (src/modules/<dominio>/hooks/use<Feature>.ts)
    → React Query (useQuery / useMutation con keys centralizadas)
      → Servicio HTTP (src/modules/<dominio>/services/<feature>.service.ts)
        → Backend Endpoint
```

### Contrato de Servicios
| Servicio | Método | Endpoint | Request Type | Response Type |
|---|:---:|---|---|---|
| `get[Feature]Data` | `GET` | `/api/v1/[recurso]` | `void` | `Promise<FeatureResponse>` |
| `submit[Feature]` | `POST` | `/api/v1/[recurso]` | `CreateFeatureDto` | `Promise<FeatureResponse>` |

---

## 6. React Query & Cache Management

- **Query Keys Centralizadas (`src/modules/[modulo]/query/keys.ts`)**:
  ```typescript
  export const featureKeys = {
    all: ['feature'] as const,
    lists: () => [...featureKeys.all, 'list'] as const,
    list: (filters: FeatureFilter) => [...featureKeys.lists(), filters] as const,
    details: () => [...featureKeys.all, 'detail'] as const,
    detail: (id: string) => [...featureKeys.details(), id] as const,
  };
  ```
- **Invalidaciones en Mutaciones**:
  - `onSuccess`: Invalida `featureKeys.lists()` y despacha snackbar informativo (`meta.successSnackbarMessage`).

---

## 7. Tipos TypeScript y Schemas Zod

```typescript
import { z } from 'zod';

export const featureFormSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
  // ...
});

export type FeatureFormValues = z.infer<typeof featureFormSchema>;
```

---

## 8. Estados de UI por Pantalla

| Pantalla / Componente | Loading | Empty | Error | Success / Interacción | Edge Cases |
|---|---|---|---|---|---|
| `[Feature]ListView` | Skeleton cards (`@desingSystem/Skeleton`) | EmptyState con CTA para crear | Banner de error con botón de retry | Grilla de items con paginación | Lista con >100 elementos, strings con overflow |
| `[Feature]FormModal` | Spinner en botón de submit | N/A | Feedback por campo (Zod) + Alert general | Cierre de modal + Snackbar de éxito | Pérdida de conexión durante el submit |

---

## 9. Gaps Detectados y Preguntas de Negocio

### Gaps / Inconsistencias Detectadas
1. `[Gap 1]`: Descripción técnica de la inconsistencia en el diseño o requerimiento y su impacto.
2. `[Gap 2]`: Dependencia no existente o endpoint que requiere cambio en backend.

### Preguntas para el Usuario / Negocio
- [ ] **Pregunta 1**: ¿El usuario debe poder cancelar la solicitud una vez emitida?
- [ ] **Pregunta 2**: ¿Qué rol de Keycloak tiene permiso para editar este formulario?
