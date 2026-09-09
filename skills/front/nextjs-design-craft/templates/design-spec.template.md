# 🎨 Especificación de Diseño UI / Craft — [Nombre de Pantalla / Componente]

> **Archivo generado en**: `.agents/designs/[screen-kebab-case]-spec.md`  
> **Fecha**: YYYY-MM-DD  
> **Diseñador / Rol**: `@craft`  
> **Modo de Superficie**: `Operar` <!-- Opciones: Persuadir | Operar | Leer | Experimentar -->

---

## 1. Contexto de la Superficie

- **Superficie**: `src/modules/[modulo]/components/[Componente].tsx`
- **Usuario objetivo**: `[Usuario Final / Administrador]`
- **Propósito clave**: Tarea o decisión principal que el usuario debe ejecutar.

---

## 2. Tokens del Design System Utilizados

| Elemento | Token / Clave `@desingSystem/*` | Valor Resuelto | Justificación |
|---|---|---|---|
| Color primario | `theme.palette.primary.main` | Variable DS | Botón de acción principal (CTA) |
| Background contenedor | `theme.palette.background.paper` | Variable DS | Tarjeta con elevación sutil |
| Espaciado interno | `theme.spacing(3)` | `24px` | Padding interno consistente (múltiplo 8px) |
| Gap entre elementos | `theme.spacing(2)` | `16px` | Ritmo vertical entre campos |
| Radio de borde | `theme.shape.borderRadius` | `8px` | Consistencia con componentes de entrada |
| Tipografía Título | `theme.typography.h2` | `24px / 600` | Jerarquía visual clara |
| Tipografía Body | `theme.typography.body1` | `16px / 400` | Legibilidad (line-height 1.5) |

---

## 3. Anatomía y Jerarquía de Componentes

```
[Contenedor: Card / Paper max-width: 1200px]
  ├── [Header: Title (h2) + Badge de Estado]
  ├── [Body: Grid responsive 1 col (mobile) -> 3 cols (desktop)]
  │     ├── [ItemCard / FormField]
  │     └── [ItemCard / FormField]
  └── [Footer: Actions Bar sticky en mobile]
        ├── [Button variant="text" (Cancelar)]
        └── [Button variant="contained" (Confirmar)]
```

---

## 4. Adaptabilidad Responsive (Breakpoints)

- **Mobile (< 768px - Base 375px)**:
  - Layout en columna única (`flex-direction: column`).
  - Botones ocupan ancho completo (`width: 100%`).
  - Padding de contenedor reducido a `16px`.
- **Tablet (768px - 1024px)**:
  - Grilla de 2 columnas.
  - Navegación condensada.
- **Desktop (> 1024px - Base 1200px)**:
  - Grilla de 3 o 4 columnas con `max-width: 1200px` centrado.
  - Hover states enriquecidos.

---

## 5. Matriz de Estados de UI

| Estado | Comportamiento Visual | Copy Contextual |
|---|---|---|
| **Default** | Estilos base con tokens del DS | Datos y etiquetas estándar |
| **Hover / Focus** | `outline: 2px solid`, elevación +1 | N/A (Accesible vía teclado) |
| **Loading** | Skeleton pulsante del tamaño exacto del contenido | N/A (Sin spinners aislados) |
| **Empty** | Ilustración/Icono + mensaje empático + CTA primario | "Aún no tienes solicitudes registradas." |
| **Error** | Borde rojo semántico + icono alert + mensaje descriptivo | "No pudimos conectar con el servicio. [Reintentar]" |

---

## 6. Micro-interacciones y Motion

- **Transiciones**: Solo en propiedades compuestas (`transform`, `opacity`) con `transition: all 0.2s ease-in-out`.
- **Feedback**: El botón entra en estado loading deshabilitado con spinner interno durante el submit para evitar doble click.
