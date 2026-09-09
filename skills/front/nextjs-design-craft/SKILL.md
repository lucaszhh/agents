---
name: nextjs-design-craft
description: |
  Diseñar, rediseñar, pulir, auditar o mejorar interfaces frontend. Cubre
  landing pages, dashboards, componentes, formularios, settings, onboarding,
  empty states. Maneja UX, jerarquía visual, accesibilidad, performance,
  responsive, tipografía, color, motion, micro-interacciones y design systems.
  Usar con "diseñá este componente", "rediseñá la landing", "mejorá la UI",
  "puli esta pantalla", "hacelo más premium".
---

# Design Craft — Diseño de Interfaces

Esta skill te da las herramientas y el permiso para crear diseño con craft excepcional.
Como director de diseño, abordás cada tarea con: código calidad producción, creatividad
máxima, punto de vista claro, comprensión profunda del cliente y usuarios, y craft impecable.

## Cuándo usar esta skill

- "diseñá este componente"
- "rediseñá la landing"
- "mejorá la UI"
- "pulí esta pantalla"
- "hacelo más premium"
- Al crear o refinar interfaces frontend, dashboards, componentes, formularios o estados vacíos con altos estándares visuales, UX y accesibilidad.

## Cuándo NO usar esta skill

- **QA visual sobre componentes ya implementados** → `nextjs-design-audit`
- **Auditar arquitectura frontend o data flow** → `nextjs-architect`
- **Revisar el diff de código pre-merge** → `nextjs-code-review`
- **Resolver bugs funcionales o excepciones** → `nextjs-debug-flow`

## Principios de diseño

### Espaciado

- Todo espaciado múltiplo de **8px** (4px para gaps internos muy chicos)
- Padding mínimo de componentes: 8px. Entre secciones: 24-32px
- Consistencia: mismo tipo de espaciado para mismo tipo de elemento
- Responsive: mobile más compacto (16px entre secciones), desktop más abierto (32px)
- Nada pegado a bordes — siempre padding

### Tipografía

- Máximo **3 tamaños de fuente** por pantalla
- Jerarquía clara: título > subtítulo > body > caption
- Line height: 1.4-1.6 para body, 1.2-1.3 para títulos
- Sin texto cortado o con overflow
- Pesos: 700 para títulos, 600 para subtítulos, 400 para body

### Color

- Contraste texto/fondo **≥ 4.5:1** (texto normal), **≥ 3:1** (texto grande >18px)
- Usar tokens del design system (`@desingSystem/*`), nunca hex hardcodeado
- Estados visuales correctos: hover, active, focus, disabled
- Sin colores "fuera de paleta" sin justificación

### Layout

- Alineación vertical y horizontal consistente
- Grid o flexbox para estructura
- Contenedores con max-width para desktop (> 1200px)
- Sin overflow horizontal en ningún breakpoint

### Responsive

- **Mobile first**: diseñar para 375px primero
- 3 breakpoints: mobile (<768px), tablet (768-1024px), desktop (>1024px)
- Adaptar no solo tamaños sino también densidad de información
- Tablas: scroll horizontal o cards en mobile

---

## Principios del método

- **Ir a fondo.** Sin atajos, sin excusas. El entregable debe ser completo.
- **Soñar en grande.** Trabajo distinto, hermoso, sobresaliente y altamente inspirador.
- **Iterar** con las herramientas disponibles (comprensión visual, screenshots) hasta que el resultado alcance el estándar.

---

## Metodología

### Paso 1 — Entender el contexto

- ¿Qué es la superficie? (pantalla, componente, landing, dashboard)
- ¿Quién la usa? (usuarios finales, administradores, etc.)
- ¿Qué necesita hacer? (completar un trámite, ver información, etc.)
- ¿Qué modo corresponde? → ver sección Modos

### Paso 2 — Leer el design system

- `src/modules/desingSystem/` — componentes y tokens existentes
- `DESIGN.md` si existe — decisiones de diseño
- Un componente similar como referencia de patrones
- Los aliases: `@desingSystem/*`, `@/`, `@env`, `@envClient`

### Paso 3 — Mirar pantallas similares y captura visual

- Buscar 2-3 pantallas del mismo módulo o tipo en el proyecto
- Copiar patrones de espaciado, tipografía, colores
- No inventar si ya existe un patrón — mantener consistencia

#### Captura e Inspección Visual Automatizada (Playwright CLI)
Para no diseñar a ciegas y evaluar la superficie visual real antes y durante el refactor:
```bash
# Mobile (375x667)
pnpm exec playwright screenshot --viewport-size=375,667 --url http://localhost:3000/[ruta] .agents/designs/screenshots/mobile-design.png

# Tablet (768x1024)
pnpm exec playwright screenshot --viewport-size=768,1024 --url http://localhost:3000/[ruta] .agents/designs/screenshots/tablet-design.png

# Desktop (1280x800)
pnpm exec playwright screenshot --viewport-size=1280,800 --url http://localhost:3000/[ruta] .agents/designs/screenshots/desktop-design.png
```
Inspeccionar los screenshots generados antes de ajustar espaciados, fuentes o contrastes.

> ℹ️ **Degradación Elegante (Fallback si Playwright no está configurado)**:  
> Si `playwright` no está instalado en el proyecto o faltan los navegadores de prueba, no interrumpir el flujo ni ciclar en reintentos. Proceder con la inspección estática del código JSX/TSX y tokens de diseño, indicando en el reporte sintético que la verificación visual final queda delegada a la revisión manual del usuario en el navegador local.

### Paso 4 — Diseñar con el modo correcto

| Modo | Qué significa éxito | Ejemplo |
|---|---|---|
| Persuadir | El visitante decide y actúa | Landing pages, campañas, CTAs |
| Operar | El visitante completa una tarea | Dashboards, forms, settings, admin |
| Leer | El visitante entiende algo | Docs, artículos, guías, changelogs |
| Experimentar | El visitante está dentro de la obra | Portfolios, galerías |

Elegir el modo desde la superficie, no desde el producto. Una landing de herramienta sigue siendo Persuadir; documentación de casa de moda sigue siendo Leer.

### Paso 5 — Iterar al menos 2 veces

1. **Primera pasada**: estructura, layout, funcionalidad
2. **Segunda pasada**: pulido visual, spacing, tipografía, estados, copy

Si no iterás, no estás seguro de que está bien.

### Paso 6 — Verificar estados y responsive

- **Loading**: skeleton o spinner, no pantalla en blanco
- **Empty**: mensaje claro + ilustración/CTA, no solo "no hay datos"
- **Error**: mensaje descriptivo + botón de retry
- **Success**: feedback visual (snackbar, toast, animación sutil)
- **Edge cases**: strings largos, arrays vacíos, datos nulos
- **Responsive**: probar en 375px, 768px, 1200px+

---

## Comandos disponibles

Cada comando es autocontenido. Aplicar los principios de diseño y el modo que
corresponda a la superficie.

### Evaluar

| Comando | Para qué | Cómo aplicarlo |
|---|---|---|
| `critique [target]` | UX review con scoring | Revisar: claridad del CTA, flujo de información, consistencia, accesibilidad. Score 0-100 por categoría (espaciado 20, tipografía 20, color 20, layout 20, componentes 20) |
| `audit [target]` | Checks técnicos | Verificar: contraste (4.5:1), focus visible, aria-labels, responsive (3 breakpoints), estados UI (loading/empty/error/success) |

### Refinar

| Comando | Para qué | Cómo aplicarlo |
|---|---|---|
| `polish [target]` | Pase final de calidad | Revisar: espaciado consistente, tipografía correcta, colores del DS, nada roto, responsive, todos los estados |
| `bolder [target]` | Amplificar diseño tímido | Agregar: whitespace generoso, tipografía más grande, color más saturado, animaciones sutiles. Sin romper el DS |
| `quieter [target]` | Bajar tono agresivo | Reducir: whitespace excesivo, tipografía sobredimensionada, animaciones innecesarias, color saturado |
| `distill [target]` | Reducir a la esencia | Quitar: elementos decorativos, duplicación, complejidad innecesaria. Mantener: funcionalidad core |
| `harden [target]` | Producción-ready | Agregar: estados de error, loading, empty, edge cases, aria-labels, focus management, keyboard nav |

### Mejorar

| Comando | Para qué | Cómo aplicarlo |
|---|---|---|
| `animate [target]` | Motion con propósito | Usar: transiciones de entrada/salida, feedback visual, loading states. NO: animaciones decorativas innecesarias |
| `colorize [target]` | Color estratégico | Agregar color: CTAs activos, estados de éxito/error, jerarquía visual. Mantener paleta del DS |
| `typeset [target]` | Jerarquía tipográfica | Verificar: títulos claros, body legible, captions presentes. Usar tokens de tipografía del DS |
| `layout [target]` | Espaciado y ritmo | Corregir: alineación, gaps consistentes, padding/margin del DS, responsive |
| `delight [target]` | Personalidad sutil | Agregar: micro-interacciones, empty states con personalidad, copy amigable. Sin exagerar |

### Arreglar

| Comando | Para qué | Cómo aplicarlo |
|---|---|---|
| `clarify [target]` | UX copy | Revisar: labels claros, mensajes de error específicos, CTAs descriptivos, tooltips útiles |
| `adapt [target]` | Responsive | Verificar: mobile (375px), tablet (768px), desktop (1200px+). Adaptar densidad de información, no solo tamaños |
| `optimize [target]` | Performance UI | Revisar: lazy loading, virtualización, memo innecesario, re-renders excesivos, bundle size |

---

## Reglas de lo que SÍ debe hacer

- Leer el design system del proyecto antes de diseñar
- Respetar paleta de colores, tipografía y espaciado existentes
- Diseñar todos los estados: loading, empty, error, success, edge cases
- Probar en mobile, tablet y desktop (3 breakpoints mínimo)
- Seguir la convención de componentes del proyecto
- Usar los aliases de import del proyecto (`@desingSystem/*`, `@/`)
- Mantener componentes presentacionales dumb — la lógica en hooks
- Preferir componentes del design system antes que crear nuevos
- Mantener consistencia visual con el resto de la app
- Iterar al menos 2 veces antes de entregar

## Reglas de lo que NO debe hacer

- NO ignorar el design system existente — es la fuente de verdad visual
- NO importar librerías de UI directamente si el proyecto tiene design system
- NO diseñar sin haber visto cómo se ven componentes similares en el proyecto
- NO crear componentes con lógica de negocio adentro — separar en hooks
- NO hacer fetch en componentes — delegar a servicios
- NO usar estilos inconsistentes con el proyecto (CSS modules vs styled vs Tailwind)
- NO ignorar accesibilidad (aria labels, focus visible, contraste mínimo 4.5:1)
- NO diseñar solo el happy path — pensar en vacío, error, carga, permisos, bordes
- NO cambiar la paleta de colores sin consultar
- NO sobrecargar de animaciones — cada motion debe comunicar algo
- NO usar texto genérico de placeholder — el copy debe ser real y contextual
- NO entregar diseño sin haber iterado al menos una vez
- NO crear valores hardcodeados — usar tokens del design system
- NO volcar código JSX/TSX completo de componentes en la respuesta de chat — usar `write_to_file`

---

## Protocolo de Entrega Direct-to-Disk OBLIGATORIO

1. **Especificación técnica**: Registrar la arquitectura de diseño en `.agents/designs/<screen-kebab-case>-spec.md` (`write_to_file`) siguiendo la plantilla oficial [`templates/design-spec.template.md`](./templates/design-spec.template.md).
2. **Código de componentes**: Crear o editar los archivos de componentes directamente en `src/modules/<dominio>/components/` con `write_to_file`.
3. **Reporte sintético en chat**: Reportar únicamente el enlace al archivo de spec, componentes creados y confirmación de los 3 breakpoints verificados.

---

## Verificación

- Confirmar persistencia de la especificación en `.agents/designs/<screen-kebab-case>-spec.md`.
- El diseño respeta el design system del proyecto (`@desingSystem/*`).
- Funciona en 3 breakpoints (mobile 375px, tablet 768px, desktop 1200px+).
- Cubre todos los estados (loading, empty, error, success, edge cases).
- No tiene imports de librerías de UI fuera del design system.
- La lógica está separada en hooks, los componentes son dumb.
- Iteró al menos 2 veces.
- Espaciado múltiplo de 8px, contraste ≥ 4.5:1.

## Al terminar

Confirmar la creación del spec en `.agents/designs/<screen-kebab-case>-spec.md` y de los componentes en disco. Sugerir al usuario: **nextjs-design-audit** para QA visual de lo implementado.
