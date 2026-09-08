---
name: generate-changelog
description: Use this skill to generate or update repository changelogs based on release notes. It identifies new release notes files inside the 'release-notes' directory, processes their contents (Merge Requests and Commits), groups them semantically following SemVer and Keep a Changelog in Spanish, and prepends them to the existing CHANGELOG.md file.
---

# Generar y Actualizar Changelog desde Notas de Versión

Esta skill describe el proceso para añadir de manera estructurada las nuevas entradas de una versión al archivo `CHANGELOG.md` de un repositorio, basándose en los archivos de notas de versión en formato markdown almacenados dentro de la carpeta `release-notes/`.

## Cuándo usar esta skill
- El usuario solicita generar un changelog, actualizar el changelog, o procesar notas de versión (`release-notes/`).
- Hay nuevos archivos de notas de versión (ej. `backend-release-notes.md`, `release-notes.md`) y se requiere añadir esas entradas al archivo `CHANGELOG.md` existente en la raíz del proyecto.

## Instrucciones Paso a Paso

### Paso 1: Localizar los Archivos del Proyecto
1. Busca el archivo `CHANGELOG.md` en la raíz del repositorio.
   - Si no existe un archivo `CHANGELOG.md`, créalo utilizando el formato de Keep a Changelog.
2. Identifica la carpeta `release-notes/` en el proyecto.
3. Busca archivos de notas de versión dentro de dicha carpeta (generalmente tienen nombres como `*release-notes.md` o `*notes.md`).

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

### Paso 4: Actualizar el Archivo `CHANGELOG.md`
1. Abre el archivo `CHANGELOG.md` existente.
2. No sobreescribas el historial anterior. Inserta la nueva versión directamente **debajo del título principal** (ej. `# Changelog Backend - Enterprise` o `# Changelog`) y antes de la primera versión existente.
3. El formato de la nueva sección de la versión debe seguir la estructura exacta de Keep a Changelog y SemVer:
   ```markdown
   ## [X.Y.Z] - YYYY-MM-DD

   ### Añadido
   * **Nombre del Componente**
     * Descripción...

   ### Cambiado
   ...

   ### Corregido
   ...

   ### Eliminado
   ...

   ---
   ```
4. Asegúrate de añadir una regla horizontal `---` para separar la nueva versión de la versión anterior que quedó abajo.

### Paso 5: Verificación
1. Asegúrate de que el formato markdown sea válido.
2. Revisa que no se haya modificado el historial previo de versiones de manera accidental.
3. No borres los archivos de notas de versión a menos que el usuario lo solicite expresamente.
