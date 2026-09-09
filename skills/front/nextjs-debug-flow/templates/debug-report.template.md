# 🩺 Reporte de Depuración y Causa Raíz — [ID / Nombre del Bug]

> **Archivo generado en**: `.agents/debug/[issue-kebab-case]-debug.md`  
> **Fecha**: YYYY-MM-DD  
> **Investigador / Rol**: `@debugger`  
> **Estado**: `Resuelto` <!-- Opciones: En Investigación | Hipótesis Validada | Resuelto -->

---

## 1. Identificación del Problema

- **Descripción del síntoma**: Qué comportamiento anómalo experimenta el usuario o el sistema.
- **Módulo afectado**: `src/modules/[modulo]/`
- **Severidad funcional**: `Bloqueante` / `Degradación Parcial` / `Visual o Datos`

---

## 2. Fase 1: Evidencia y Reproducción

### Pasos de Reproducción
1. Ingresar a `/[ruta]` con usuario autenticado (rol: `[rol]`).
2. Ejecutar la acción `[acción]`.
3. Observar fallo o pantalla en blanco.

### Error y Stack Trace
```text
[Mensaje de error exacto sin truncar]
    at Service.method (src/modules/[mod]/services/[serv].ts:45)
    at Hook.use[Feature] (src/modules/[mod]/hooks/use[Feature].ts:22)
```

### Contexto de Red / Payload HTTP
- **Endpoint**: `GET /api/v1/[recurso]`
- **Status Code**: `500 Internal Server Error` (o `204 No Content` no manejado)
- **Response**: `{"message": "..."}`

---

## 3. Fase 2: Trazado del Flujo de Datos

```
[Componente] → Parámetros enviados: { id: "123" }
  ↓
[Hook: useFeature] → Query Key: ['feature', '123'] (¿Caché stale? No)
  ↓
[Servicio: featureService] → URL resuelta: /api/v1/feature/123
  ↓
[Respuesta Backend] → Recibido: null
  ↓
[Punto de ruptura] → Componente asume response.data.items no nulo (TypeError: Cannot read property 'items' of undefined)
```

---

## 4. Fase 3: Hipótesis de Causa Raíz (Regla de Hierro)

> **Causa Raíz en una oración**:  
> *"El hook `useFeature` crashea el componente porque el servicio `getFeature` no maneja el caso en que el backend responde 200 con payload `{ data: null }` cuando no existen registros asociados."*

- **¿Explica el 100% de los síntomas?**: `SÍ`

---

## 5. Fase 3.5: Test de Regresión (TDD)

- **Test de reproducción creado/modificado**: `src/modules/[mod]/services/[serv].spec.ts`
- **Resultado antes del fix**: `FALLA (Rojo)` - confirma que el test atrapa exactamente el bug.
- **Resultado tras el fix**: `PASA (Verde)` - asegura que el bug no volverá a ocurrir.

---

## 6. Fase 4: Fix Quirúrgico Aplicado

- **Archivos modificados**:
  - `src/modules/[modulo]/services/[feature].service.ts`
  - `src/modules/[modulo]/components/[Feature]List.tsx`
- **Explicación del cambio**: Fix defensivo con valor por defecto `items: data?.items ?? []` sin refactorizar código ajeno.

---

## 7. Barrido de Patrón (Pattern Sweep)

- ¿El mismo error de desestructuración insegura existe en otros servicios del módulo?
  - `src/modules/[mod]/services/otherService.ts`: Revisado, implementa guard correctamente.
- **Veredicto**: Patrón aislado, sin réplicas en el módulo.
