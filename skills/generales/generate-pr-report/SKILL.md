---
name: generate-pr-report
description: Use esta skill para generar un reporte del issue en formato de descripción de Pull Request (GitHub) o Merge Request / Issue (GitLab) basándose en el diff de la rama actual contra la rama develop. La skill compara con el merge-base (diff three-dot) para evitar que el reporte incluya cambios de otras ramas mergeadas a develop cuando la rama está desactualizada, lee el archivo .gitlab/issue_templates/reporteTemplate.md para armar la estructura, completa las secciones correspondientes y omite el diff de código en bruto en la evidencia. Detecta variables de entorno nuevas (stack-aware: Next.js, LoopBack/Nest, Go, Vite) y las reporta como alerta de máxima prioridad al tope del reporte. El reporte final debe incluir tablas de cambios agrupadas por capa arquitectónica y notas de gaps o advertencias detectadas.
---

# Generar Reporte de PR / MR desde Diff a Develop

Esta skill define los pasos que debe seguir el agente para analizar los cambios de código realizados en la rama de funcionalidad actual contra la rama base (`develop`), y estructurar una descripción detallada para el Pull Request (GitHub) o Merge Request / Issue (GitLab) siguiendo la plantilla oficial.

## Cuándo usar esta skill
- El usuario solicita reportar, documentar o generar la descripción del issue para GitLab sobre los cambios implementados en la rama.
- Se requiere comparar la rama actual de funcionalidad contra la rama base `develop`.

---

## Instrucciones Paso a Paso

### Paso 1: Analizar cambios con Git

1. Obtén el nombre de la rama actual:
   ```bash
   git branch --show-current
   ```

2. Resuelve la rama base y el **merge-base** (punto de divergencia). Usa `develop`; si no existe localmente, cae a `origin/develop`:
   ```bash
   BASE="develop"
   [ -z "$(git rev-parse --verify -q "$BASE")" ] && BASE="origin/develop"
   MB="$(git merge-base "$BASE" HEAD)"
   echo "BASE=$BASE MB=$MB"
   ```
   *Opcional: si querés que `develop` esté actualizado, corré `git fetch origin develop` antes de resolver el merge-base.*

3. Compara la rama actual contra el **merge-base**, NO contra el puntero actual de `develop` (**diff three-dot**). Esto es crítico: si tu rama está desactualizada y otras ramas ya se mergearon a `develop`, `git diff develop` (two-dot) incluye cambios **ajenos** y el reporte parece decir que agregaste cosas que no agregaste.
   ```bash
   git diff --stat "$BASE"...HEAD
   git diff "$BASE"...HEAD
   git diff "$BASE"...HEAD -M   # con detección de renames (mover archivos)
   ```
   *El diff three-dot (`A...B`) compara B contra el merge-base de A y B: muestra SOLO los cambios propios de la rama.*
   *Si el diff queda vacío, la rama no tiene cambios propios contra `develop` (ya fue mergeada o es ancestro): avisá al usuario en lugar de generar un reporte vacío.*

4. Extrae los commits propios de la rama para informar el título y la descripción:
   ```bash
   git log --oneline "$MB"..HEAD
   ```

5. A partir del diff (three-dot), identifica y clasifica:
   - **Archivos nuevos** (creaciones): presta atención a utilities, tipos, interfaces, providers, modales nuevos.
   - **Archivos modificados**: qué lógica cambió, qué tipos se corrigieron, qué bugs se resolvieron.
   - **Archivos eliminados o renombrados** (usá el diff con `-M` para distinguir renames de borrados+creados).
   - **Capas arquitectónicas tocadas**: dominio, servicios, controladores, hooks, componentes UI, pages, providers, modelos, configuración.
   - **Bugs implícitos resueltos**: busca cambios en comparaciones (`===`), tipos (`string` vs objeto), guards, condicionales o lógica de negocio que sugieran un fix.
   - **Gaps o inconsistencias detectadas**: código que no rompe pero queda incompleto, parsers que no leen todos los campos, métodos que no cubren casos nuevos, TODOs implícitos.
   - **Variables de entorno nuevas**: claves que el diff introduce y que no existían en el merge-base (detalle en el Paso 1b).

6. Agrupa mentalmente los archivos por capa antes de escribir el reporte. Ejemplos de capas:
   - Core — modelo de dominio / tipos / utilities
   - Data layer — servicios, repositorios, hooks de data fetching
   - Bug fixes en UI — componentes que corregían comportamiento incorrecto
   - Consumidores actualizados — componentes que adoptan la nueva API interna
   - Controllers / Services (backend)
   - Configuración / Constants

---

### Paso 1b: Detectar variables de entorno nuevas (stack-aware)

Las variables de entorno nuevas son la alerta de máxima prioridad del reporte: si no se crean en los ambientes, los servicios no arrancan o los builds rompen. Detectalas sobre el **diff three-dot** del Paso 1.

#### 1b-1. Detecta el stack del repo (cómo se leen y configuran las env vars aquí)

Identifica la convención según `package.json`, estructura de carpetas o lenguaje:

| Stack | Cómo se detecta | Convención de env vars |
|---|---|---|
| **Next.js** | dep `next` en `package.json` | `process.env.X` (server) / `NEXT_PUBLIC_X` (client). Centralizado en `config/envServer.ts` / `config/envClient.ts` (schemas zod). `.env`/`.env.example`, `ecosystem.config.js` (PM2), `docker-compose*.yml`. |
| **LoopBack 4** (backend, turner, cronjob, files…) | deps `@loopback/*` en `package.json` | `process.env.MXM_*` leídos en `src/config/keys.ts` y validados por `src/config/env.ts` (`EnvLoader`). Cada servicio en un subdirectorio con `.env` propio. |
| **NestJS** | dep `@nestjs/config` en `package.json` | `process.env.*` leídos vía `ConfigModule.forRoot` / `configService.get`. `.env`, `docker-compose*.yml`. |
| **Go** | `.go` en la raíz / `go.mod` | `os.Getenv("X")`. Configuración vía `docker-compose*.yml`, `.gitlab-ci.yml` o archivos `config/*`. |
| **Vite** | dep `vite` en `package.json` | `import.meta.env.VITE_X` (solo prefijo `VITE_` se expone al client). |

**Repo multi-servicio**: si la raíz no tiene `package.json` propio sino subdirectorios con servicios (`backend/`, `turner/`, `cronjob/`, `files/`…), cada servicio tiene sus propias env vars y su `.env`. Anotá a qué servicio pertenece cada variable.

#### 1b-2. Fuentes a escanear (sobre el diff three-dot)

1. **Archivos de entorno trackeados** que cambiaron en el diff:
   ```bash
   git diff "$BASE"...HEAD -- .env.example .env* docker-compose*.yml ecosystem.config.js .gitlab-ci.yml src/config
   ```
   - En `docker-compose*.yml` y `ecosystem.config.js` (PM2): fijate en bloques `environment:`, `env_file:`, `env:`.
   - En `.gitlab-ci.yml`: sección `variables:`.
2. **Referencias de código nuevas** en el diff: escaneá la salida del diff three-dot en busca de `process.env.X`, `NEXT_PUBLIC_X`, `import.meta.env.VITE_X`, `os.Getenv("X")`.
   ```bash
   git diff "$BASE"...HEAD | grep -E "process\.env\.|NEXT_PUBLIC_|VITE_|os\.Getenv"
   ```
3. **LoopBack / config centralizada**: compará `src/config/keys.ts` y `src/config/env.ts` entre el merge-base y HEAD. Toda clave nueva que entre a `keys.ts` es validada por `EnvLoader` al boot (ver 1b-3).
4. **Detectá renames de claves**: si el diff (o un commit del `git log "$MB"..HEAD`) renombra una variable, compará las claves presentes en el merge-base vs HEAD. Patrón típico: una clave desaparece y aparece otra con el mismo prefijo/base (`MXM_KEYCLOAK_FRONTEND_CLIENT_ID` → `MXM_KEYCLOAK_PUBLIC_CLIENT_ID`). Un rename **NO se descarta**: requiere actualizar el nombre en el `.env` de todos los ambientes (el valor se reutiliza), y si la clave entra a `keys.ts` el servicio falla al boot mientras el `.env` tenga el nombre viejo.
5. **Descartá falsos positivos reales**: variables de entorno comunes (`NODE_ENV`, `PWD`, `HOST`, `PORT`), claves que se **movieron entre archivos sin cambio de nombre** (verificable comparando merge-base vs HEAD), y comentarios/strings que contengan el patrón sin ser uso real.

#### 1b-3. Clasificá cada variable detectada

- **Servicio / Archivo**: subdirectorio del servicio (en repos multi-servicio) y el archivo donde se define o se lee (`turner/src/config/keys.ts`, `config/envClient.ts`, `docker-compose.yml`, etc.).
- **Tipo**:
  - `Server`: `process.env.*`.
  - `Client`: `NEXT_PUBLIC_*` (Next.js) o `VITE_*` (Vite). *Nota: `NEXT_PUBLIC_*` se inyecta en tiempo de build → requiere rebuild del frontend, no alcanza con recargar.*
  - `Renombrada`: clave que ya existía en el merge-base y cambió de nombre (ej `MXM_KEYCLOAK_FRONTEND_CLIENT_ID` → `MXM_KEYCLOAK_PUBLIC_CLIENT_ID`). **No se crea valor nuevo: se renombra la clave en el `.env` de todos los ambientes.** Sigue siendo crítica si entra a `keys.ts` (el servicio no arranca con el nombre viejo).
- **¿Obligatoria?**:
  - `Sí — falla arranque`: LoopBack, clave nueva en `keys.ts` → `EnvLoader` lanza excepción y el servicio **no inicia**. También cuando el código hace `throw` si la variable falta.
  - `Sí — sin fallback`: se usa `process.env.X` sin `?? valor` ni default.
  - `No — tiene default`: hay `?? fallback`, default en schema (zod `.default(...)`) o solo activa/desactiva una feature.
- **Impacto si falta**: qué rompe concretamente (servicio X no arranca, login roto, feature deshabilitada, build falla).

> ⚠️ **`.env` suele estar en `.gitignore`** y no aparece en el diff. El reporte debe recordar que la variable hay que crearla **manualmente** en el `.env` de cada servicio (dev / test / prod) además de cualquier `.env.example`, `docker-compose*.yml` o `ecosystem.config.js` (PM2) que se haya tocado en la rama.

---

### Paso 2: Leer la Plantilla de GitLab

1. Localiza y lee el archivo de plantilla del proyecto:
   `.gitlab/issue_templates/reporteTemplate.md`
2. Respeta la estructura y emojis de sección tal como están en la plantilla. Si la plantilla tiene secciones extra (ej: "Request de prueba", "Impacto funcional"), completalas también.

---

### Paso 3: Completar las Secciones del Reporte

#### 🚨 ACCIÓN REQUERIDA — Variables de entorno nuevas (si aplica)
**Sección de máxima prioridad: va SIEMPRE primero, inmediatamente después del título.** Si el Paso 1b detectó variables nuevas, esta sección es lo primero que debe leer quien despliega. Si las variables no se crean, los servicios no arrancan o los builds rompen (rompe todo el ecosistema).

> ⚠️ **ACCIÓN REQUERIDA:** crear las siguientes variables de entorno en los ambientes antes del deploy. Se detectaron como nuevas contra el merge-base de `develop`.

| Variable | Servicio / Archivo | Tipo | ¿Obligatoria? | Impacto si falta |
|---|---|---|---|---|
| `MXM_KEY_TURNER` | `turner/` — `src/config/keys.ts` | Server | Sí — falla arranque | `turner` no inicia (`EnvLoader` lanza excepción) |
| `NEXT_PUBLIC_IFRAME_ANP` | `config/envClient.ts` | Client | Sí — sin fallback | Home de ANP rompe; requiere rebuild del frontend |

- **Variable**: nombre exacto de la variable con backticks.
- **Servicio / Archivo**: subdirectorio del servicio en repos multi-servicio y el archivo donde se define o se lee.
- **Tipo**: `Server` / `Client` (`NEXT_PUBLIC_` / `VITE_`) / `Renombrada`.
- **¿Obligatoria?**: `Sí — falla arranque` (LoopBack: clave nueva en `keys.ts` validada por `EnvLoader`) / `Sí — sin fallback` / `No — tiene default`. Para `Renombrada`: `Sí — renombrar en .env` (el valor se reutiliza).
- **Impacto si falta**: qué rompe concretamente (servicio que no arranca, login roto, feature deshabilitada, build falla). Para `Renombrada`: si el `.env` queda con el nombre viejo, el servicio lee `undefined` y falla.
- Si hay variables **renombradas**, agregá debajo de la tabla una línea que aclare: "la clave `Vieja` se renombró a `Nueva`: actualizar el nombre en el `.env` de todos los ambientes (el valor se reutiliza)".
- Agregá una línea recordando que `.env` suele estar gitignoreado: la variable hay que crearla a mano en el `.env` de cada servicio (dev/test/prod), además de actualizar `.env.example`, `docker-compose*.yml` o `ecosystem.config.js` si corresponde.
- Si no hay variables nuevas, omití la sección completa.

#### 📌 Título del Issue
- Formato: `Tipo: Descripción concisa` (ej: `Feat:`, `Fix:`, `Refactor:`, `Chore:`).
- Debe identificar la funcionalidad o corrección principal, no listar todos los archivos.
- Ejemplos buenos: `Refactor: representación de personas (children / entidad legal)`, `Fix: protección de rutas por nivel y edad`.

#### 📝 Descripción
- Párrafo(s) de alto nivel explicando **qué cambia** y **por qué** (el motivo técnico o el problema que resolvía el estado anterior).
- Si había un problema de tipos, menciona el tipo incorrecto y el correcto.
- Si había un bug de comportamiento, menciona brevemente cuál era el síntoma.
- No listar archivos aquí.

#### 🔎 Contexto adicional
- Lista los **módulos** afectados (no archivos individuales), por ejemplo: `associates`, `core`, `home`, `turns`.
- Si hay un issue relacionado, menciona el número o indica N/A.
- Si hay documentación o una utility nueva que sirve de referencia central, mencionala con su path.
- Si aplica, el endpoint y método HTTP.
- Si el cambio tiene un frontend y un backend relacionados, mencionarlos con su rama.

#### 🪜 Pasos para reproducir (si aplica)
- Si el diff resuelve uno o más bugs, describe los pasos exactos para reproducir el comportamiento **previo** al fix. Sé específico: qué pantalla, qué acción, qué ocurría.
- Si hay múltiples bugs, puedes numerarlos en bloques separados.
- Si no aplica (solo nueva funcionalidad): indica `N/A (nueva funcionalidad/refactorización)`.

#### ✅ Resultado esperado
- Bullets técnicos y precisos de qué debe ocurrir tras aplicar los cambios.
- Menciona tipos, nombres de funciones, campos o comportamientos concretos cuando sea relevante.
- Ejemplos: `` `user.owner` es un string consistente con la respuesta del API ``, `` `getOwnerInfo()` retorna `OwnerInfo | null` (no string vacío) ``.

#### ❌ Resultado actual (antes del fix)
- Si aplica: describe el estado roto **antes** del cambio. Menciona errores de tipo concretos, comportamientos incorrectos, casts forzados, comparaciones fallidas.
- Si no aplica: indica `N/A`.

#### 📎 Cambios realizados
**Esta sección reemplaza y enriquece la sección "Evidencia" de la plantilla base cuando los cambios son de código.**

- Organiza los cambios en **tablas por capa arquitectónica**, con el encabezado de la capa como subtítulo H3 (`### Nombre — descripción de capa`).
- Cada tabla tiene dos columnas: `| Archivo | Cambio |`.
  - En `Archivo`: solo el nombre relativo desde `src/` o desde el módulo (sin path completo).
  - En `Cambio`: descripción concisa del cambio específico en ese archivo. Usa backticks para nombres de tipos, funciones o campos. Usa `**Nuevo**` si el archivo es creado desde cero.
- Si un cambio introduce un nuevo formato de string, protocolo o estructura de datos, agrégalo como bloque de código separado debajo de la tabla correspondiente.
- **REGLA CRÍTICA:** No incluyas el diff del código fuente en bruto. Las tablas describen conceptualmente qué cambió, no muestran el código.

Ejemplo de estructura de esta sección:

```markdown
### Core — modelo de dominio
| Archivo | Cambio |
|---|---|
| `domain/UserInit.ts` | `owner: AssociatedPerson` → `owner: string` |
| `utils/parseOwnerString.ts` | **Nuevo**: `parseOwnerString`, `getOwnerInfo`, `buildOwnerString` |

### Data layer
| Archivo | Cambio |
|---|---|
| `services/updateRepresentAccount.ts` | Response type `{ status: boolean }` → `{ owner: string }` |

### Bug fixes en UI
| Archivo | Cambio |
|---|---|
| `RepresentSelectField.tsx` | Usa `child_id` (no `id`) para selección de hijos |
```

#### ⚠️ Notas / Gaps detectados (si aplica)
**Esta sección es opcional pero debe incluirse cuando el análisis del diff revela inconsistencias, deuda técnica o trabajo incompleto.**

- Describe el gap de forma técnica: qué método, archivo o índice no fue actualizado y por qué importa.
- Aclara si rompe o no rompe algo actualmente.
- Indica si es algo a resolver en un issue futuro.
- Ejemplo: `renderOwner() en util.service.ts parsea el owner string pero solo lee hasta el índice 5. No extrae name/lastname (índices 6 y 7) que ahora escribe resolveChildOwner(). No rompe nada actualmente, pero es un gap si algún consumidor necesita esos campos.`

#### 🖥️ Entorno (si aplica)
- **Stack**: menciona el framework/lenguaje principal (ej: `Next.js (TypeScript)`, `Node.js / TypeScript / LoopBack 4 / PostgreSQL / Redis`).
- **Rama**: nombre de la rama obtenido en el Paso 1.
- **Endpoint** (si aplica): método + ruta.
- **Base de datos / Migraciones**: si hay cambios de esquema, colecciones o seeds.
- **Servicios afectados** (si es repo multi-servicio): subdirectorios tocados (ej: `backend/`, `turner/`, `cronjob/`).

---

### Paso 4: Generar el archivo del Reporte

1. Escribe el reporte completo en un archivo markdown en la ruta indicada por el usuario, o por defecto en el directorio de trabajo actual como `reporte_issue.md`.
2. Asegúrate de que el Markdown sea válido y renderice correctamente en GitLab (las tablas deben tener la fila de separación `|---|---|`).
3. No incluyas el diff en bruto en ninguna sección del archivo.

---

## Referencia: Estructura completa del reporte

```markdown
# 📌 Tipo: Título descriptivo

> ⚠️ **ACCIÓN REQUERIDA:** variables de entorno nuevas — crear antes del deploy (si aplica).

## 🚨 ACCIÓN REQUERIDA — Variables de entorno nuevas (si aplica)
| Variable | Servicio / Archivo | Tipo | ¿Obligatoria? | Impacto si falta |
|---|---|---|---|---|
| `VAR` | servicio — archivo | Server/Client | Sí — falla arranque | qué rompe |

---

## 📝 Descripción
...

---

## 🔎 Contexto adicional
- **Módulos afectados**: ...
- **Rama**: ...
- **Issue relacionado**: ...
- **Documentación asociada**: ...

---

## 🪜 Pasos para reproducir (si aplica)
1. ...

---

## ✅ Resultado esperado
- ...

---

## ❌ Resultado actual (antes del fix)
- ...

---

## 📎 Cambios realizados

### Capa — descripción
| Archivo | Cambio |
|---|---|
| `archivo.ts` | Descripción del cambio |

---

## ⚠️ Notas / Gaps detectados (si aplica)
...

---

## 🖥️ Entorno
- **Stack**: ...
- **Rama**: ...
```
