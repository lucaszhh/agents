---
name: generate-changelog
description: Genera o actualiza CHANGELOG.md basándose en release-notes/*.md siguiendo SemVer y Keep a Changelog en español. Protegido contra duplicados e inyección directa a disco. Usar con "generar changelog", "actualizar changelog", "procesar release notes", "changelog de la versión".
---

# Generar y Actualizar Changelog desde Notas de Versión

Esta skill describe el proceso para añadir de manera estructurada las nuevas entradas de una versión al archivo `CHANGELOG.md` de un repositorio, basándose en los archivos de notas de versión en formato markdown almacenados dentro de la carpeta `release-notes/`.

## Cuándo usar esta skill
- El usuario solicita generar un changelog, actualizar el changelog, o procesar notas de versión (`release-notes/`).
- Hay nuevos archivos de notas de versión (ej. `backend-release-notes.md`, `release-notes.md`) y se requiere añadir esas entradas al archivo `CHANGELOG.md` existente en la raíz del proyecto.

## Cuándo NO usar esta skill
- **Generar descripción o plantilla para PR / MR** → `generate-pr-report`
- **Generar matriz de casos de prueba para QA** → `generate-qa-checklist`
- **Documentar código o APIs directamente**

## Metodología

### Paso 1: Localizar los Archivos del Proyecto
1. Busca el archivo `CHANGELOG.md` en la raíz del repositorio.
   - Si no existe un archivo `CHANGELOG.md`, créalo utilizando el formato de Keep a Changelog.
2. Identifica la carpeta `release-notes/` en el proyecto.
3. **Manejo de carpeta ausente o vacía**:
   - Si la carpeta `release-notes/` no existe o no contiene archivos `.md`:
     - Alertar de inmediato: `⚠️ No se encontraron notas de versión en release-notes/`.
     - Ofrecer como alternativa procesar los commits de la rama actual contra develop (`git log "$BASE"..HEAD --oneline`) o solicitar la ruta del archivo de notas. No continuar a ciegas.
4. Si existen notas, localizar el archivo correspondiente (ej. `*release-notes.md` o `*notes.md`).

### Paso 2: Identificar la Versión y Fecha Objetivos
1. Lee el archivo de notas de versión.
2. Determina el rango de versión que se está lanzando (por ejemplo: `# Notas de Versión: v6.21.0 hasta v6.22.0`). En este caso, la nueva versión a documentar es `6.22.0`.
3. Determina la fecha de lanzamiento. Usa la fecha actual (`YYYY-MM-DD`) a menos que el usuario especifique otra.

### Paso 3: Analizar y Clasificar los Cambios (Merge Requests y Commits)
1. Lee los títulos de los Merge Requests y/o mensajes de commits en el archivo de notas de versión.
2. Clasifica cada cambio de manera profesional, técnica y clara en una de las siguientes categorías estándares de **Keep a Changelog** en español:
   - **Añadido**: Para nuevas características o funcionalidades implementadas.
   - **Cambiado**: Para cambios en funcionalidades ya existentes, optimizaciones o refactorizaciones.
   - **Corregido**: Para la solución de cualquier error, bug o fallo.
   - **Eliminado**: Para funcionalidades, logs de depuración o código deprecado que ha sido removido del sistema.
3. **Reglas de Redacción:**
   - **Agrupación por Módulo/Área:** Agrupa los cambios relacionados bajo una misma área o módulo utilizando el formato:
     ```markdown
     * **Nombre del Módulo o Componente**
       * Descripción clara del cambio.
     ```
   - **No uses hashes de commits ni nombres de ramas directamente** (ej. `0a488f62` o `Merge branch 'fix/...'`). En su lugar, resume el cambio real en una descripción semántica e inteligible para seres humanos.
   - **Idioma:** Todo el contenido debe estar redactado en español neutral y formal.

### Paso 4: Actualizar el Archivo `CHANGELOG.md` (Direct-to-Disk Writing)
1. **Plantilla oficial**: Seguir la estructura estandarizada en [`templates/changelog-entry.template.md`](./templates/changelog-entry.template.md).
2. **Protección contra duplicados**: Antes de escribir, verificar que la versión no haya sido agregada previamente:
   ```bash
   grep -F "## [$VERSION]" CHANGELOG.md
   ```
   Si la versión ya existe, alertar al usuario y solicitar confirmación para actualizar la entrada existente en vez de duplicarla.
3. **Inserción Segura sin Corrupción de Historial**:
   Insertar la nueva versión directamente **debajo del título principal** y antes de la primera versión existente, separando con `---`.
   Se puede emplear un runner seguro en Node.js o `replace_file_content`:
   ```bash
   # Verificación previa de unicidad
   node -e 'const fs=require("fs"); const c=fs.readFileSync("CHANGELOG.md","utf8"); if (c.includes("## [" + process.argv[1] + "]")) { console.error("Versión duplicada"); process.exit(1); }' "$VERSION"
   ```
4. **Prohibido volcar el changelog completo en la conversación**: NO imprimir el contenido íntegro del `CHANGELOG.md` en el chat. Limitar la respuesta a un resumen sintético de 5 líneas.

## Verificación
1. Asegúrate de que el formato markdown sea válido y cumpla la especificación Keep a Changelog.
2. Confirmar que no exista duplicación de la versión ejecutando `grep -c "## \[$VERSION\]" CHANGELOG.md` (debe retornar 1).
3. Revisa que no se haya modificado el historial previo de versiones de manera accidental.
4. No borres los archivos de notas de versión a menos que el usuario lo solicite expresamente.

---

## Protocolo de Escritura Directa a Disco (Direct-to-Disk Writing)

Para optimizar el consumo de tokens y no saturar la ventana de contexto:
1. **Escribir directamente a disco**: Actualizar `CHANGELOG.md` usando las herramientas de archivos (`write_to_file` o `replace_file_content`).
2. **Prohibido volcar el changelog completo en la conversación**: NO imprimir el archivo completo ni la versión íntegra en la respuesta del chat.
3. **Formato obligatorio de reporte final**:
   - **Archivo actualizado**: ruta y confirmación de actualización de `CHANGELOG.md`.
   - **Versión y fecha**: versión registrada y fecha de lanzamiento (ej. `[6.22.0] - 2026-09-08`).
   - **Métricas cuantitativas**: conteo sintético de cambios por categoría (**Añadido**, **Cambiado**, **Corregido**, **Eliminado**).
   - **Módulos/Componentes impactados**: lista breve de módulos o áreas cubiertas.
   - **Archivo fuente**: notas de versión procesadas (ej. `release-notes/backend-release-notes.md`).

---

## Reglas de lo que SÍ debe hacer

- Escribir o actualizar `CHANGELOG.md` directamente en disco (`write_to_file`, `replace_file_content`)
- Reportar únicamente métricas cuantitativas y resumen de módulos afectados en el chat, sin volcar el changelog
- Seguir la estructura estricta de Keep a Changelog y SemVer en español
- Preservar todo el historial previo de versiones intacto
- Agrupar cambios por módulo o componente con viñetas claras
- Redactar mensajes semánticos y comprensibles sin hashes ni nombres de ramas crudos

## Reglas de lo que NO debe hacer

- NO volcar el contenido íntegro de `CHANGELOG.md` ni la versión generada en la respuesta de chat
- NO sobreescribir o borrar versiones anteriores del changelog
- NO usar hashes de commit (`0a488f62`) ni nombres de rama (`fix/...`) en las descripciones
- NO inventar cambios que no provengan de las notas de versión o historial analizado
- NO eliminar los archivos de notas de versión salvo indicación expresa del usuario

## Al terminar

Confirmar la actualización del changelog en disco y reportar el balance cuantitativo de cambios al usuario sin volcar el texto del changelog en el chat.
