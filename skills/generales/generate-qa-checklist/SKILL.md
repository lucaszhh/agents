---
name: generate-qa-checklist
description: Genera qa_checklist.md para QA desde el three-dot diff contra develop. Mapea flujos directos, indirectos y de regresión con matrices de happy path, edge cases y negativos. Incluye precondiciones de ambiente y env vars. Usar con "generar qa checklist", "casos de prueba", "checklist de qa".
---

# Generar QA Checklist desde Diff a Develop

Esta skill genera un archivo `qa_checklist.md` para el equipo de QA a partir del análisis del diff de la rama actual contra `develop`. El archivo debe poder leerse de forma independiente, sin necesidad de conocer el código ni el reporte de issue.

## Cuándo usar esta skill
- El usuario quiere comunicarle al QA qué flujos verificar tras los cambios de la rama.
- Se necesita un checklist estructurado con casos de prueba listos para ejecutar.

## Cuándo NO usar esta skill
- **Generar el reporte o descripción técnica de PR / MR** → `generate-pr-report`
- **Actualizar o generar notas de release en CHANGELOG.md** → `generate-changelog`
- **Ejecutar pruebas unitarias automatizadas** → `nestjs-unit-tester` o `component-qa`

---

## Metodología

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

3. Compara la rama actual contra el **merge-base**, NO contra el puntero actual de `develop` (**diff three-dot**). Esto es crítico: si tu rama está desactualizada y otras ramas ya se mergearon a `develop`, `git diff develop` (two-dot) incluye cambios **ajenos** y la checklist incluiría flujos que no corresponden a tu trabajo.
   ```bash
   git diff --stat "$BASE"...HEAD
   git diff "$BASE"...HEAD
   git diff "$BASE"...HEAD -M   # con detección de renames (mover archivos)
   ```
   *El diff three-dot (`A...B`) compara B contra el merge-base de A y B: muestra SOLO los cambios propios de la rama.*
   *Si el diff queda vacío, la rama no tiene cambios propios contra `develop` (ya fue mergeada o es ancestro): avisá al usuario en lugar de generar una checklist vacía.*

4. Extrae los commits propios de la rama para informar el título y la descripción:
   ```bash
   git log --oneline "$MB"..HEAD
   ```

5. A partir del diff (three-dot), identificá:
   - **Flujos directos**: acciones del usuario o llamadas al sistema tocadas directamente por los cambios.
     - Un componente de selección modificado → flujo: "seleccionar un representado".
     - Un guard o validación nueva → flujo: "acceso a ruta restringida".
     - Un endpoint con response type cambiado → flujo: "llamada API y lectura de respuesta".
     - Un modal nuevo o modificado → flujo: "visualización y acción en el modal".
   - **Flujos de regresión**: componentes o módulos que no fueron el objetivo del cambio pero que consumen los mismos tipos, utilities o servicios modificados. Buscalos en los imports del diff.

6. Para cada flujo, identificá también:
   - Qué **precondiciones** necesita (tipo de usuario, nivel, sesión activa, datos cargados, etc.).
   - Qué **variantes de usuario** son relevantes (menor de edad, sin nivel, con hijos, entidad legal, etc.).
   - **Variables de Entorno y Configuración (Precondiciones de Ambiente)**:
     Si el diff introduce variables de entorno (`.env.example`), feature flags o flags booleanos (detectables con `python scripts/detect_env_vars.py`), es obligatorio declararlas explícitamente como precondiciones de infraestructura para que el QA configure su entorno antes de iniciar la prueba (ej: `Precondición: FEATURE_PAYMENTS_ENABLED=true en .env`).

---

### Paso 2: Construir la Checklist

Para cada flujo directo, creá una subsección con:

#### Título del flujo
```
### Flujo: Nombre descriptivo en lenguaje de usuario
```

#### Precondiciones
Un bloque de texto antes de la tabla describiendo el estado inicial necesario, roles requeridos y variables de entorno/flags activas. Si no hay precondiciones especiales, omitirlo.

#### Tabla de casos
```
| # | Caso | Tipo | Esperado |
|---|---|---|---|
```

Columnas:
- `#`: número de caso dentro del flujo.
- `Caso`: descripción concisa del escenario. En lenguaje de usuario, no de código.
- `Tipo`: uno de `✅ Happy path`, `⚠️ Edge case`, `❌ Caso negativo`.
- `Esperado`: lo que el QA **ve o puede verificar** — texto en pantalla, URL de redirección, modal que aparece, dato mostrado, ausencia de error. No describir implementación interna.

#### Tipos de casos a cubrir por flujo

Siempre intentá cubrir los cuatro tipos cuando apliquen:

| Tipo | Qué cubrir |
|---|---|
| ✅ Happy path | El caso base funciona correctamente con datos y usuario válidos |
| ⚠️ Edge case | Valores límite (exactamente la edad/nivel mínimo), campos vacíos, listas sin datos, usuario en el borde de la condición |
| ❌ Caso negativo | Usuario sin permisos, datos inválidos, flujo interrumpido, acceso directo por URL sin cumplir condiciones |
| 🔁 Regresión | Flujo no modificado que usa los mismos componentes o tipos — verificar que no se rompió |

---

### Paso 3: Agregar Flujos de Regresión

Al final del archivo, agregá una sección:

```markdown
## 🔁 Flujos de regresión sugeridos
```

Listá brevemente (sin tabla) los flujos que no fueron modificados directamente pero que conviene smoketestear:
- Indicá el nombre del flujo.
- Explicá en una línea por qué podría verse afectado (qué utility, tipo o componente comparte con los cambios).

---

### Paso 4: Reglas de escritura

- **Lenguaje de usuario, no de código**: evitá nombres de funciones, tipos o variables internas a menos que el QA los vea en pantalla (ej: un mensaje de error que incluya un campo).
- **`Esperado` siempre verificable**: el QA debe poder confirmar o refutar sin leer código. "Se redirige a `/inicio`", "aparece el modal con el texto 'Edad mínima requerida'", "el botón queda deshabilitado".
- **Autocontenido**: el archivo debe funcionar solo. Incluí contexto suficiente en las precondiciones y descripciones de caso para que el QA no necesite consultar el diff ni el reporte de issue.
- **Una fila por escenario**: no agrupés múltiples variantes en una sola fila de la tabla.

---

### Paso 5: Generar el archivo (Direct-to-Disk Writing)

1. **Plantilla oficial**: Utilizar la estructura definida en [`templates/qa-checklist.template.md`](./templates/qa-checklist.template.md).
2. **Escribir directamente a disco**: Escribir la checklist completa en `qa_checklist.md` usando la herramienta de escritura de archivos (`write_to_file`).
3. **Asegurar Markdown válido**: Verificar que las tablas incluyan la fila separadora `|---|---|---|---|`.
4. **Fecha y Metadata**: La fecha en el encabezado debe ser la del día actual y reflejar el commit hash del merge-base.
5. **Prohibido volcar las tablas completas en el chat**: NO imprimas todas las tablas de casos de prueba en la respuesta conversacional para evitar sobrecargar el contexto.
6. **Formato obligatorio de reporte final en chat (Sintético)**:
   - **Archivo**: confirmación y enlace a `qa_checklist.md`.
   - **Métricas de cobertura**: total de flujos directos identificados y desglose de casos (Happy path, Edge cases, Negativos).
   - **Flujos de regresión**: lista sintética de los flujos sugeridos para smoketest y justificación.

---

## Referencia: Estructura completa

```markdown
# 🧪 QA Checklist — Tipo: Título del issue

> **Rama**: `nombre-de-rama`
> **Fecha**: YYYY-MM-DD

---

## Flujos a verificar

### Flujo: Nombre del flujo

**Precondiciones**: usuario autenticado con hijos asociados, nivel ≥ 2, etc.

| # | Caso | Tipo | Esperado |
|---|---|---|---|
| 1 | Caso base con datos válidos | ✅ Happy path | Descripción de lo que debe verse |
| 2 | Usuario exactamente en el límite de edad | ⚠️ Edge case | Descripción de lo que debe verse |
| 3 | Usuario sin permisos accede directo por URL | ❌ Caso negativo | Descripción de lo que debe verse |

---

### Flujo: Otro flujo

**Precondiciones**: ...

| # | Caso | Tipo | Esperado |
|---|---|---|---|
| 1 | ... | ✅ Happy path | ... |

---

## 🔁 Flujos de regresión sugeridos

- **Nombre del flujo**: por qué podría verse afectado.
- **Nombre del flujo**: por qué podría verse afectado.
```

---

## Reglas de lo que SÍ debe hacer

- Usar siempre diff three-dot (`"$BASE"...HEAD`) para comparar exclusivamente los cambios propios de la rama.
- Identificar flujos directos y flujos de regresión a partir de los componentes y dependencias modificadas.
- Incluir tablas completas con Happy Path, Edge Cases y Casos Negativos.
- Escribir `qa_checklist.md` directamente en disco (`write_to_file`) reportando únicamente el balance sintético en el chat.

## Reglas de lo que NO debe hacer

- NO usar two-dot diff sin justificación para evitar reportar flujos correspondientes a cambios ajenos.
- NO escribir descripciones que requieran que el tester deba consultar el código fuente o los PRs.
- NO volcar el archivo completo o tablas masivas en la respuesta de chat.
- NO omitir precondiciones críticas para los casos de prueba.

## Verificación

- Validar que el archivo `qa_checklist.md` generado cubra todos los flujos directos impactados por el diff.
- Comprobar que la sección de flujos de regresión sugiera las áreas con dependencias compartidas.
- Asegurar que la sintaxis de las tablas markdown sea correcta y renderizable.

## Al terminar

Notificar al usuario y compartir el archivo `qa_checklist.md` generado para su distribución al equipo de QA.
