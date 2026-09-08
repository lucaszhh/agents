---
name: design-audit
description: |
  QA visual sobre lo ya codeado. Encuentra inconsistencias de espaciado, jerarquía,
  tipografía, color, responsive y motion. Arregla iterativamente cada issue
  con screenshots before/after y commits atómicos. Usar con "auditá el diseño",
  "visual QA", "revisá la UI", "design polish", después de implementar cambios
  visuales o nuevos componentes.
---

# Revisión de Diseño — QA Visual

Auditoría visual de la interfaz implementada. Se navega la app, se detectan
inconsistencias, se arreglan una por una y se re-verifica cada fix.

## Lectura previa obligatoria

- `AGENTS.md` — design system del proyecto, aliases, convenciones de UI
- `src/modules/desingSystem/` — componentes y tokens del design system (si existe)
- Componentes modificados en el diff actual
- `package.json` — qué librería de UI usa el proyecto

## Cuándo usar esta skill

- "auditá el diseño"
- "visual QA"
- "revisá la UI de esta pantalla"
- "chequeá si se ve bien"
- "design polish"
- "encontrá inconsistencias visuales"
- "cómo está el responsive"
- Después de `design-craft`
- Después de cualquier cambio visual

## Cuándo NO usar esta skill

- **Bug funcional** → `debug-flow`
- **Diseñar desde cero** → `design-craft`
- **Revisar lógica/diff** → `code-review`
- **Cambios que no son de UI** → `code-review`

---

## Niveles de auditoría

### Rápido (~5 min)
- Navegar 3-5 páginas clave
- Checks: espaciado consistente, tipografía correcta, colores del design system, nada roto
- Ideal para: cambios chicos, PRs rápidos, iteraciones frecuentes

### Estándar (~15 min)
- Navegar 5-8 páginas
- Agrega: responsive (3 breakpoints), interacciones (hover, focus, active), estados (loading, empty, error)
- Ideal para: features medianas, componentes nuevos, antes de mergear a develop

### Exhaustivo (~30 min)
- Navegar 10+ páginas, todos los flujos
- Agrega: accesibilidad completa, performance visual, motion, UX copy, edge cases
- Ideal para: pre-lanzamiento, redesigns, features grandes

---

## Checklist de auditoría

### Espaciado
- [ ] Padding/margin consistentes entre elementos del mismo tipo
- [ ] Gap en grids y stacks consistente
- [ ] Alineación vertical y horizontal correcta
- [ ] Sin elementos pegados a los bordes sin padding
- [ ] Espaciado responsive (más compacto en mobile)

### Tipografía
- [ ] Jerarquía clara (h1-h6, body, caption)
- [ ] Font sizes, line heights y weights consistentes con el design system
- [ ] Sin saltos bruscos entre niveles de jerarquía
- [ ] Texto legible en todos los breakpoints
- [ ] Sin texto cortado o con overflow

### Color
- [ ] Paleta del design system respetada
- [ ] Contraste texto/fondo mínimo 4.5:1 (normal) y 3:1 (large text)
- [ ] Estados visuales correctos: hover, active, focus, disabled
- [ ] Sin colores "fuera de paleta" sin justificación
- [ ] Dark mode consistente (si aplica)

### Layout y Responsive
- [ ] 3 breakpoints: mobile (< 768px), tablet (768-1024px), desktop (> 1024px)
- [ ] Sin overflow horizontal en ningún breakpoint
- [ ] Sin elementos cortados o fuera de vista
- [ ] Navegación usable en mobile
- [ ] Tablas/datos que se adaptan en pantallas chicas

### Componentes
- [ ] Consistencia visual entre páginas (mismo componente se ve igual)
- [ ] Reutilización de componentes del design system (no reinventar)
- [ ] Estados de componentes: default, hover, active, focus, disabled, loading
- [ ] Sin divergence de estilo entre componentes similares

### Estados de UI
- [ ] **Loading:** skeleton o spinner, no pantalla en blanco
- [ ] **Empty:** mensaje claro + ilustración/CTA, no solo "no hay datos"
- [ ] **Error:** mensaje descriptivo + botón de retry/intentar de nuevo
- [ ] **Success:** feedback visual (snackbar, toast, animación sutil)
- [ ] **Edge cases:** strings muy largos, arrays vacíos, datos nulos, permisos denegados

### Accesibilidad
- [ ] Focus visible en elementos interactivos (no `outline: none` sin alternativa)
- [ ] Labels en inputs y botones (aria-label si es solo ícono)
- [ ] Roles correctos en componentes custom
- [ ] Navegación por teclado funcional
- [ ] Contraste suficiente

---

## Scoring (0-100)

Puntuar cada categoría de 0 a 20:

| Categoría | Peso |
|---|---|
| Espaciado | 20 |
| Tipografía | 20 |
| Color | 20 |
| Layout/Responsive | 20 |
| Componentes/Estados | 20 |

**Total:** suma de las 5 categorías.

| Score | Interpretación |
|---|---|
| 0-29 | Deuda UX crítica. No shipeable sin fixes mayores. |
| 30-59 | Necesita trabajo. Varios issues por resolver. |
| 60-84 | Aceptable. Issues menores, se puede mergear. |
| 85-100 | Excelente. Listo para producción. |

---

## Metodología de fix

Por cada issue encontrado:

1. **Documentar:** screenshot, descripción, severidad (CRÍTICO/ALTO/MEDIO/BAJO), archivo:línea afectado
2. **Arreglar:** fix mínimo en el source
3. **Commit atómico:** un commit por fix
4. **Re-verificar:** screenshot after, confirmar que el issue desapareció
5. **Siguiente issue:** repetir

Prioridad de fixes: CRÍTICO > ALTO > MEDIO > BAJO.

---

## Reglas de lo que SÍ debe hacer

- Comparar contra el design system del proyecto, no contra opinión personal
- Screenshotear antes y después de cada fix
- Dar puntuación objetiva con justificación por categoría
- Arreglar los issues encontrados (no solo reportarlos)
- Priorizar severidad: CRÍTICO > ALTO > MEDIO > BAJO
- Revisar responsive en TODOS los breakpoints, no solo desktop
- Verificar estados de UI (loading, empty, error) — no solo el happy path
- Usar los componentes del design system para los fixes

## Reglas de lo que NO debe hacer

- NO auditar subjetivamente — usar el design system como referencia objetiva
- NO revisar solo en desktop — siempre verificar mobile (375px) y tablet (768px)
- NO revisar solo el happy path — forzar estados de error, vacío y carga
- NO hacer cambios grandes de diseño — para eso está `design-craft`
- NO dejar issues sin fix o sin justificación de por qué no se arreglan
- NO saltarse la re-verificación después de arreglar
- NO cambiar la paleta de colores del design system
- NO introducir nuevos patrones de diseño inconsistentes con el proyecto
- NO modificar lógica de negocio — esto es solo visual
- NO ignorar la accesibilidad (focus, contraste, labels)

## Verificación

- Issues encontrados → documentados
- Issues arreglados → commit atómico por fix
- Re-verificados → screenshot after
- Score final > 60
- Reporte con: issues encontrados, fixes aplicados, score antes/después

## Al terminar

Sugerir al usuario: **code-review** para code review del diff acumulado (los commits de los fixes).
