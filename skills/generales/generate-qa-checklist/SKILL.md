---
name: generate-qa-checklist
description: Usá esta skill para generar un archivo qa_checklist.md con casos de prueba para el equipo de QA, basándose en el diff de la rama actual contra develop. Identifica los flujos afectados directa e indirectamente, genera una tabla de happy path, edge cases y casos negativos por flujo, y agrega una sección de regresión con los flujos que conviene smoketestear aunque no hayan sido el objetivo del cambio. El archivo es autocontenido — el QA no necesita leer el diff ni el reporte de issue para usarlo.
---

# Generar QA Checklist desde Diff a Develop

Esta skill genera un archivo `qa_checklist.md` para el equipo de QA a partir del análisis del diff de la rama actual contra `develop`. El archivo debe poder leerse de forma independiente, sin necesidad de conocer el código ni el reporte de issue.

## Cuándo usar esta skill
- El usuario quiere comunicarle al QA qué flujos verificar tras los cambios de la rama.
- Se necesita un checklist estructurado con casos de prueba listos para ejecutar.

---

## Instrucciones Paso a Paso

### Paso 1: Analizar cambios con Git

1. Obtén el nombre de la rama actual:
   ```bash
   git branch --show-current
   ```

2. Compará la rama actual con la rama base:
   ```bash
   git diff develop
   ```
   *Si `develop` no existe localmente, usá `origin/develop`.*

3. A partir del diff, identificá:
   - **Flujos directos**: acciones del usuario o llamadas al sistema tocadas directamente por los cambios.
     - Un componente de selección modificado → flujo: "seleccionar un representado".
     - Un guard o validación nueva → flujo: "acceso a ruta restringida".
     - Un endpoint con response type cambiado → flujo: "llamada API y lectura de respuesta".
     - Un modal nuevo o modificado → flujo: "visualización y acción en el modal".
   - **Flujos de regresión**: componentes o módulos que no fueron el objetivo del cambio pero que consumen los mismos tipos, utilities o servicios modificados. Buscalos en los imports del diff.

4. Para cada flujo, identificá también:
   - Qué **precondiciones** necesita (tipo de usuario, nivel, sesión activa, datos cargados, etc.).
   - Qué **variantes de usuario** son relevantes (menor de edad, sin nivel, con hijos, entidad legal, etc.).

---

### Paso 2: Construir la Checklist

Para cada flujo directo, creá una subsección con:

#### Título del flujo
```
### Flujo: Nombre descriptivo en lenguaje de usuario
```

#### Precondiciones
Un bloque de texto antes de la tabla describiendo el estado inicial necesario. Si no hay precondiciones especiales, omitirlo.

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

1. **Escribir directamente a disco**: Escribí la checklist en `qa_checklist.md` usando la herramienta de escritura de archivos (`write_to_file`).
2. **Asegurar Markdown válido**: Verificá que las tablas incluyan la fila separadora `|---|---|---|---|`.
3. **Fecha**: La fecha en el encabezado debe ser la del día actual.
4. **Prohibido volcar las tablas completas en el chat**: NO imprimas todas las tablas de casos de prueba en la respuesta conversacional para evitar sobrecargar el contexto.
5. **Formato obligatorio de reporte final**:
   - **Archivo**: confirmación de creación de `qa_checklist.md`.
   - **Métricas de cobertura**: total de flujos directos y cantidad de casos (Happy path, Edge cases, Negativos).
   - **Flujos de regresión**: lista breve de los flujos sugeridos para smoketest.

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
