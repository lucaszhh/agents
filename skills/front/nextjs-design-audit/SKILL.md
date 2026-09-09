---
name: nextjs-design-audit
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
- Después de `nextjs-design-craft`
- Después de cualquier cambio visual

## Cuándo NO usar esta skill

- **Bug funcional** → `nextjs-debug-flow`
- **Diseñar desde cero** → `nextjs-design-craft`
- **Revisar lógica/diff** → `nextjs-code-review`
- **Cambios que no son de UI** → `nextjs-code-review`

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

1. **Documentar:** captura de pantalla en 3 breakpoints o inspección DOM, descripción, severidad (CRÍTICO/ALTO/MEDIO/BAJO), archivo:línea afectado:
   ```bash
   # Captura automatizada en 3 breakpoints con Playwright CLI
   npx playwright screenshot --url http://localhost:3000/[ruta] --viewport-size=375,667 .agents/audits/screenshots/[screen]-mobile-before.png
   npx playwright screenshot --url http://localhost:3000/[ruta] --viewport-size=768,1024 .agents/audits/screenshots/[screen]-tablet-before.png
   npx playwright screenshot --url http://localhost:3000/[ruta] --viewport-size=1200,800 .agents/audits/screenshots/[screen]-desktop-before.png

   # Chequeo automatizado de accesibilidad (a11y / axe / WCAG 2.1 AA)
   npx pa11y http://localhost:3000/[ruta]
   # O si se auditan componentes en Storybook:
   pnpm test-storybook --stories="**/[Componente].stories.*"
   ```
   > ℹ️ **Degradación Elegante (Fallback de captura y a11y)**:  
   > - Si `playwright` no está disponible o el servidor dev no está activo, documentar el issue mediante inspección estática del código JSX/tokens sin generar archivos PNG.  
   > - Si `pa11y` falla o no está instalado, auditar accesibilidad manualmente con el checklist de accesibilidad (contraste 4.5:1, `aria-label`, foco y semántica HTML) sin interrumpir el flujo.
2. **Arreglar:** fix mínimo en el source
3. **Commit atómico:** un commit por fix
4. **Re-verificar:** screenshot after, confirmar que el issue desapareció
5. **Siguiente issue:** repetir

Prioridad de fixes: CRÍTICO > ALTO > MEDIO > BAJO.

---

## Protocolo Direct-to-Disk OBLIGATORIO

1. **Plantilla oficial**: Utilizar la estructura definida en [`templates/visual-audit.template.md`](./templates/visual-audit.template.md).
2. **Destino del informe**: Guardar el reporte en `.agents/audits/<screen-kebab-case>-audit.md` (`write_to_file`).
3. **Prohibido volcar el informe completo en el chat**: No imprimir tablas completas de issues resueltos ni logs extensos.
4. **Reporte Sintético en Chat**:
   - **Ruta del reporte**: enlace a `.agents/audits/<screen-kebab-case>-audit.md`.
   - **Score final**: puntaje 0-100 antes y después de los fixes.
   - **Fixes aplicados**: lista con los commits atómicos generados.
   - **Próximo paso**: sugerir invocar `nextjs-code-review`.

---

## Reglas de lo que SÍ debe hacer

- Guardar el reporte completo en `.agents/audits/<screen-kebab-case>-audit.md` (`write_to_file`)
- Reportar en el chat únicamente el resumen sintético, score antes/después y commits atómicos
- Comparar contra el design system del proyecto, no contra opinión personal
- Capturar evidencia antes y después de cada fix
- Dar puntuación objetiva con justificación por categoría
- Arreglar los issues encontrados (no solo reportarlos)
- Priorizar severidad: CRÍTICO > ALTO > MEDIO > BAJO
- Revisar responsive en TODOS los breakpoints, no solo desktop
- Verificar estados de UI (loading, empty, error) — no solo el happy path
- Usar los componentes del design system para los fixes

## Reglas de lo que NO debe hacer

- NO volcar el reporte completo de auditoría en la conversación de chat
- NO auditar subjetivamente — usar el design system como referencia objetiva
- NO revisar solo en desktop — siempre verificar mobile (375px) y tablet (768px)
- NO revisar solo el happy path — forzar estados de error, vacío y carga
- NO hacer cambios grandes de diseño — para eso está `nextjs-design-craft`
- NO dejar issues sin fix o sin justificación de por qué no se arreglan
- NO saltarse la re-verificación después de arreglar
- NO cambiar la paleta de colores del design system
- NO introducir nuevos patrones de diseño inconsistentes con el proyecto
- NO modificar lógica de negocio — esto es solo visual
- NO ignorar la accesibilidad (focus, contraste, labels)

## Verificación

- Confirmar persistencia del reporte en `.agents/audits/<screen-kebab-case>-audit.md`.
- Issues encontrados → documentados
- Issues arreglados → commit atómico por fix
- Re-verificados → evidencia after confirmada
- Score final > 60
- Reporte con: issues encontrados, fixes aplicados, score antes/después

## Al terminar

Confirmar persistencia del reporte en `.agents/audits/<screen-kebab-case>-audit.md`. Sugerir al usuario: **nextjs-code-review** para code review del diff acumulado (los commits de los fixes).
