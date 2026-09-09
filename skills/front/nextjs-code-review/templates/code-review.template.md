# 🔍 Reporte de Code Review — [Rama / PR]

> **Archivo generado en**: `.agents/reviews/[branch-o-pr]-review.md`  
> **Fecha**: YYYY-MM-DD  
> **Revisor / Rol**: `@reviewer`  
> **Veredicto**: `REQUIERE CAMBIOS` <!-- Opciones: APROBADO | REQUIERE CAMBIOS | APROBADO CON OBSERVACIONES -->

---

## 1. Resumen Ejecutivo del Diff

- **Rama analizada**: `feature/[nombre]` contra `develop` (Three-dot merge-base)
- **Archivos modificados**: `N` archivos (+`X` / -`Y` líneas)
- **Módulos principales afectados**: `src/modules/[dominio]/`
- **Pre-check de Linter / TypeCheck**:
  - `pnpm run lint`: `0 errores / 0 warnings`
  - `pnpm run typecheck`: `0 errores`

---

## 2. Hallazgos por Nivel de Severidad

### 🔴 CRÍTICO (Bloquea el Merge)
*Problemas que rompen la arquitectura, violan seguridad o causan runtime crashes.*

| # | Archivo y Línea | Problema Detectado | Fix Sugerido |
|---|---|---|---|
| 1 | `src/app/[ruta]/page.tsx:45` | Lógica de negocio / fetch directo en router de Next.js en lugar de delegar al módulo. | Mover lógica a `src/modules/[mod]/services/` y consumir vía hook. |
| 2 | `src/modules/[mod]/Component.tsx:12` | Import directo de `@mui/material/Button` fuera de `@desingSystem/*`. | Reemplazar por import desde `@desingSystem/Button`. |

---

### 🟠 ALTO (Debe corregirse antes de mergear)
*Falta de manejo de errores, query keys hardcodeadas o tipos deficientes.*

| # | Archivo y Línea | Problema Detectado | Fix Sugerido |
|---|---|---|---|
| 1 | `src/modules/[mod]/hooks/useItem.ts:18` | Query key hardcodeada `['item', id]`. | Centralizar en `src/modules/[mod]/query/keys.ts`. |
| 2 | `src/modules/[mod]/components/View.tsx:30` | No se renderiza estado de error ni botón de reintento. | Agregar bloque condicional `if (isError) return <ErrorState onRetry={refetch} />;`. |

---

### 🟡 MEDIO (Deuda técnica / Mejorable)
*Inconsistencias menores de nomenclatura, archivos extensos o refactors convenientes.*

| # | Archivo y Línea | Observación | Recomendación |
|---|---|---|---|
| 1 | `src/modules/[mod]/helpers/utils.ts:15` | Función helper de más de 80 líneas con múltiples responsabilidades. | Separar en dos utilitarios puros y tipar explícitamente el retorno. |

---

### 🟢 BAJO (Sugerencias de estilo / Nitpicks)
*Comentarios, orden de imports o formato menor.*

| # | Archivo y Línea | Detalle |
|---|---|---|
| 1 | `src/modules/[mod]/domain/types.ts:4` | Tipos auxiliares sin JSDoc explicativo para campos opcionales. |

---

## 3. Aspectos Positivos Destacados

- [x] Excelente separación de responsabilidades entre el servicio y el hook de React Query.
- [x] Tipado estricto con schemas Zod compartidos entre formularios y contratos.
- [x] Manejo limpio de loading states con skeletons del Design System.

---

## 4. Conclusión y Siguientes Pasos

- **Acción requerida**: El desarrollador debe resolver los `2` hallazgos Críticos y `2` Altos.
- **Siguiente comando**: Ejecutar `nextjs-code-health` tras corregir los puntos para validar el score final.
