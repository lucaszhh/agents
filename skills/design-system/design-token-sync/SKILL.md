---
name: design-token-sync
description: |
  Sincronizar los design tokens del repo design-system con el archivo fuente de
  Figma. Actualiza colors, spacing, border-radius, typography, strokes y shadows
  en packages/tokens/src/*.json. Usar con "sincronizá los tokens", "actualizá
  los tokens desde Figma", "sync tokens", "cambió el color en Figma", cuando
  el equipo de diseño cambia variables o estilos en Figma.
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
  `component-extractor` o del trabajo directo sobre el package react
- **Diseñar un componente** → `design-craft`
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

### 4 — Verificar

1. `pnpm build:tokens` — debe compilar sin errores
2. Abrir `packages/tokens/dist/tokens.css` (o `tokens.json`) y confirmar que los
   valores nuevos están
3. Si cambió un color semántico: verificar que el theme de react lo consuma bien
   (`pnpm build:react`)

### 5 — Reportar (Direct-to-Disk Writing)

- **Escribir directamente a disco**: Editar los archivos JSON y compilar con `pnpm build:tokens` en el monorepo sin volcar el JSON completo en la conversación.
- **Prohibido volcar JSONs extensos al chat**: Evitar saturar el contexto con estructuras de tokens completas.
- **Formato obligatorio de reporte**:
  - Archivos JSON modificados en `packages/tokens/src/`.
  - Tabla breve o lista con los tokens específicos modificados o agregados (`token`: `valor`).
  - Tokens huérfanos o eliminados en Figma que requieren confirmación humana.
  - Resultado de la compilación (`pnpm build:tokens`).

---

## Reglas de lo que SÍ debe hacer

- Comparar contra Figma (o el JSON exportado), no contra opinión
- Actualizar el token exacto con el valor exacto de Figma
- Verificar con `pnpm build:tokens` después de tocar cualquier JSON
- Avisar claramente los tokens que cambiaron de valor para que diseño confirme
- Mantener keys y estructura de archivos existentes

## Reglas de lo que NO debe hacer

- NO inventar valores: todo valor debe venir de Figma o del JSON exportado
- NO borrar tokens sin confirmar con el usuario/diseño
- NO tocar el theme de MUI en esta skill — es sincronización de tokens
- NO hardcodear el token de Figma en el repo ni en archivos commiteables
- NO cambiar `semantico.json` de forma arbitraria — los mapeos a primitivos
  deben reflejar la decisión de diseño
- NO modificar tipografía si el cambio no viene de Figma
- NO reordenar keys solo por estética — mantener el diff mínimo

## Al terminar

Si se agregaron tokens nuevos que un componente debería usar, sugerir
**component-extractor** para migrar el componente con los tokens al día.
Si ya hay componentes migrados, sugerir **component-qa** para verificar que no
se rompieron con el cambio de tokens.