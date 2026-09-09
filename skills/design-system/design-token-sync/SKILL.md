---
name: design-token-sync
description: Sincroniza design tokens entre Figma y el monorepo de design-system (packages/tokens/src/*.json). Valida sintaxis JSON, detecta variables modificadas o eliminadas y compila Style Dictionary. Usar con "sincronizá los tokens", "actualizá los tokens desde Figma", "sync tokens", "cambió el color en Figma".
---

# Sincronización de Design Tokens

Mantiene los tokens del repo (`packages/tokens/src/*.json`) alineados con la
fuente de verdad en Figma. El resultado final es que `pnpm build:tokens` genera
`tokens.css` y `tokens.json` correctos y el theme de `@design-system/react` refleja
los cambios.

## Lectura previa obligatoria

- `packages/tokens/src/*.json` — estado actual de los tokens (colors, spacing,
  border-radius, typography, strokes, shadows, breakpoints)
- `AGENTS.md` del repo — reglas y stack
- `DESIGN.md` — decisiones de diseño que explican POR QUÉ los tokens son así

## Cuándo usar esta skill

- "sincronizá los tokens"
- "actualizá los tokens desde Figma"
- "cambió un color en Figma"
- "necesito el nuevo spacing/radius que definió diseño"
- Antes de migrar un componente nuevo (para que el componente use los tokens al día)
- Después de que diseño comunique cambios de variables en Figma

## Cuándo NO usar esta skill

- **Crear un token nuevo que no está en Figma** → pedirle a diseño que lo agregue
  primero a Figma, esta skill solo sincroniza
- **Editar el theme de MUI** (`packages/react/src/theme/`) → eso es parte de
  `component-migrator` o del trabajo directo sobre el package react
- **Diseñar un componente** → `nextjs-design-craft`
- **Auditar visualmente un componente ya codeado** → `component-qa`

---

## El MCP de Figma

Existe un MCP de Figma que permite leer variables y nodos del archivo
directamente desde el agente. **Esta skill no lo exige**: es un acelerador
opcional. Si no está configurado, se trabaja con el JSON exportado.

### Cómo configurarlo (si se quiere)

- **Claude (oficial):** hay un MCP oficial de Figma (`figma-developer-mcp`
  vía `npx -y figma-developer-mcp --stdio`) con la variable de entorno
  `FIGMA_API_KEY`.
- **OpenCode (libre):** el equipo usa el mismo `figma-developer-mcp` libre,
  configurado en `.opencode/mcp.json`:

```json
{
  "mcpServers": {
    "Figma": {
      "command": "npx",
      "args": ["-y", "figma-developer-mcp", "--stdio"],
      "env": { "FIGMA_API_KEY": "<figma-token>" }
    }
  }
}
```

El token se obtiene desde Figma: perfil → Settings → Security → Personal access tokens.

### Si el MCP NO está disponible

1. Avisar al usuario que no hay MCP de Figma configurado
2. Pedir el JSON de variables exportado desde Figma (o el screenshot si alcanza)
3. Continuar con el flujo manual de abajo

---

## Flujo de trabajo

### 1 — Obtener el estado actual de Figma

- Si el MCP está disponible: leer las variables/estilos del archivo (colores,
  espaciado, radius, tipografía, strokes, sombras).
- Si no: pedir el JSON exportado de variables a diseño.

### 2 — Comparar con el estado actual del repo

Leer cada archivo de `packages/tokens/src/`:

| Archivo | Qué contiene |
|---|---|
| `colors.json` | Colores primitivos (Violeta, Amarillo, Verde, Verde Azulado, Neutro, Rojo) |
| `semantico.json` | Tokens semánticos (button, text, background, icon, border, status, navbar) |
| `spacing.json` | Escala de espaciado (0, 1, xxs, s, xs, sr, re, me, l, xl, xxl) |
| `border-radius.json` | Radios (xs, s, m, l, full) |
| `typography.json` | Escala tipográfica (heading1-5, bodyLarge, bodySmall) |
| `strokes.json` | Grosores de borde |
| `shadows.json` | Sombras |
| `breakpoints.json` | Breakpoints responsive |

Detectar:
- Valores cambiados (hex, px, rem)
- Tokens nuevos (agregar)
- Tokens eliminados (avisar — nunca borrar sin confirmar)

### 3 — Aplicar los cambios

- Editar SOLO los archivos de `packages/tokens/src/*.json`
- Mantener el formato y las claves existentes (no renombrar keys sin avisar)
- Respetar el patrón de nombres ya establecido

### 3b — Validación de Schema y Sintaxis JSON Previa al Build
Antes de compilar con Style Dictionary, validar sintaxis y formato para evitar fallos sin contexto:
```bash
# Validación con Prettier
npx prettier --check packages/tokens/src/*.json

# Validación determinista de parseo JSON en Node.js
node -e 'const fs=require("fs"); fs.readdirSync("packages/tokens/src").filter(f=>f.endsWith(".json")).forEach(f=>{ JSON.parse(fs.readFileSync("packages/tokens/src/"+f)); console.log("✓", f); });'
```

### 3c — Diff Semántico de Variables y Alerta de Ruptura
Examinar los tokens modificados mediante el diff de git:
- **Alerta ALTA de Ruptura**: Si se eliminó o renombró un token de color o espaciado semántico en uso activo por `@design-system/react`, alertar inmediatamente.
- Prohibido borrar tokens sin confirmación explícita de diseño/producto.

### 4 — Verificar

1. `pnpm build:tokens` — debe compilar sin errores
2. Abrir `packages/tokens/dist/tokens.css` (o `tokens.json`) y confirmar que los
   valores nuevos están
3. Si cambió un color semántico: verificar que el theme de react lo consuma bien
   (`pnpm build:react`)

### 5 — Reportar (Direct-to-Disk Writing)

- **Escribir directamente a disco**: Editar los archivos JSON y compilar con `pnpm build:tokens` en el monorepo sin volcar el JSON completo en la conversación.
- **Plantilla oficial de reporte**: Utilizar [`templates/token-sync-report.template.md`](./templates/token-sync-report.template.md) y guardar el informe en `.agents/tokens/token-sync-report.md` (`write_to_file`).
- **Prohibido volcar JSONs extensos al chat**: Evitar saturar el contexto con estructuras de tokens completas.
- **Formato obligatorio de reporte en chat (Sintético)**:
  - **Ruta del informe**: enlace a `.agents/tokens/token-sync-report.md`.
  - **Archivos JSON modificados**: lista de archivos en `packages/tokens/src/`.
  - **Diff semántico resumido**: tabla breve con los tokens clave modificados o agregados (`token`: `valor`).
  - **Tokens huérfanos/deprecados**: advertencia explícita si se encontraron tokens que requieren confirmación humana.
  - **Resultado de compilación**: confirmación de `pnpm build:tokens` exitoso.

---

## Reglas de lo que SÍ debe hacer

- Guardar el reporte completo en `.agents/tokens/token-sync-report.md` (`write_to_file`)
- Reportar en el chat únicamente el resumen sintético y tokens que requieren confirmación
- Validar formato y sintaxis JSON con `npx prettier --check packages/tokens/src/*.json`
- Comparar contra Figma (o el JSON exportado), no contra opinión
- Actualizar el token exacto con el valor exacto de Figma
- Verificar con `pnpm build:tokens` después de tocar cualquier JSON
- Avisar claramente los tokens que cambiaron de valor para que diseño confirme
- Mantener keys y estructura de archivos existentes

## Reglas de lo que NO debe hacer

- NO volcar JSONs completos de tokens en la respuesta de chat
- NO omitir la persistencia del reporte en `.agents/tokens/token-sync-report.md`
- NO inventar valores: todo valor debe venir de Figma o del JSON exportado
- NO borrar tokens sin confirmar con el usuario/diseño
- NO tocar el theme de MUI en esta skill — es sincronización de tokens
- NO hardcodear el token de Figma en el repo ni en archivos commiteables
- NO cambiar `semantico.json` de forma arbitraria — los mapeos a primitivos
  deben reflejar la decisión de diseño
- NO modificar tipografía si el cambio no viene de Figma
- NO reordenar keys solo por estética — mantener el diff mínimo

## Verificación

- Confirmar persistencia del reporte en `.agents/tokens/token-sync-report.md`.
- Validar sintaxis de JSON con `npx prettier --check packages/tokens/src/*.json`.
- Compilar los tokens (`pnpm build:tokens` o `pnpm build`) para asegurar que no haya errores de sintaxis JSON ni en los transformadores de Style Dictionary.
- Comprobar que los archivos generados en `packages/tokens/dist/` (o equivalentes) reflejan exactamente las modificaciones de diseño.
- Validar que no se rompan las dependencias en `@design-system/react` (`pnpm build:react`).

## Al terminar

Confirmar persistencia del reporte en `.agents/tokens/token-sync-report.md`. Si se agregaron tokens nuevos que un componente debería usar, sugerir
**component-migrator** para migrar el componente con los tokens al día.
Si ya hay componentes migrados, sugerir **component-qa** para verificar que no
se rompieron con el cambio de tokens.