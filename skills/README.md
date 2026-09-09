# Skills — Enterprise

Colección de **Agent Skills** del equipo de Enterprise Platform. Cada skill es un
`SKILL.md` autocontenido en español, sin dependencias externas. Solo se
referencian entre skills de esta colección.

## Estructura

| Carpeta | Para qué | Skills |
|---|---|---|
| `front/` | Desarrollo de frontend (Next.js, React Query, zod, design system) | 6 skills |
| `back/` | Desarrollo de backend (NestJS, Clean Architecture, X-Road) | 3 skills |
| `design-system/` | Desarrollo del monorepo `design-system` (tokens, componentes, QA) | 3 skills |
| `generales/` | Tareas transversales (changelog, QA checklist, migraciones, issues) | 4 skills |

## Formato de una skill

Cada skill es **un solo `SKILL.md`** con:

1. **Frontmatter YAML** obligatorio:
   ```yaml
   ---
   name: nombre-de-skill
   description: |
     Qué hace y con qué frases se invoca. Multilínea, en español.
   ---
   ```
2. **Lectura previa obligatoria** — qué archivos leer antes de arrancar
3. **Cuándo usar / Cuándo NO usar** — con referencia a otras skills de la colección
4. **Metodología** — los pasos concretos
5. **Reglas de lo que SÍ / NO debe hacer**
6. **Verificación** — cómo saber que la tarea quedó bien
7. **Al terminar** — la siguiente skill de la cadena (en negrita)

### Reglas de la colección

- Una skill = un archivo `SKILL.md`. Nada de scripts, assets ni referencias externas.
- Español rioplatense, directo.
- Nombres de skills en inglés, kebab-case, descriptivos, máximo 4 palabras.
- Referencias entre skills por su `name`, en negrita (`**nextjs-code-review**`) o `code`.
- Las skills NO dependen de gstack ni de MCPs de terceros. Herramientas: comandos
  del repo, git, y MCPs propios del proyecto si están documentados en la skill.

### Validación en CI

Todas las skills son validadas en CI mediante:
```bash
pnpm run lint:skills
```
Verifica frontmatter válido, coincidencia de `name` con el directorio, presencia de las 6 secciones obligatorias y ausencia de two-dot diff sin justificar.

## Instalación

Las skills se instalan copiando la carpeta `<nombre>/` con su `SKILL.md` a la
ruta que espera cada harness:

| Herramienta | Global | Por repositorio |
|---|---|---|
| OpenCode | `~/.config/opencode/skills/<nombre>/` | `<repo>/.opencode/skills/<nombre>/` |
| Claude Code | `~/.claude/skills/<nombre>/` | `<repo>/.claude/skills/<nombre>/` |
| Antigravity | `~/.gemini/antigravity-cli/skills/<nombre>/` | `<repo>/.agents/skills/<nombre>/` |
| Codex | `~/.codex/skills/<nombre>/` | `<repo>/.agents/skills/<nombre>/` |
| Instalador universal | `npx skills add <repo>` | — |

**Ejemplo (OpenCode global):**
```bash
mkdir -p ~/.config/opencode/skills/nextjs-code-review
cp skills/front/nextjs-code-review/SKILL.md ~/.config/opencode/skills/nextjs-code-review/
```

## Cadenas de skills

Cada carpeta tiene su README con los flujos de cadenas:

- **front/** → flujo de desarrollo frontend (feature, bug, dependencia UI)
- **back/** → flujo de desarrollo backend (feature, bug, tests)
- **design-system/** → flujo del monorepo (tokens, componente, QA)
- **generales/** → tareas transversales

Ver los READMEs de cada carpeta para las cadenas completas.