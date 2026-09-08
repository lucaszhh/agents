---
name: wf-back-migration
description: Pipeline de subagentes para generar y validar migraciones manuales de base de datos en TypeORM usando QueryRunner
---

# Workflow: Database Migration Pipeline

Pipeline especializado para generar migraciones manuales en PostgreSQL / TypeORM utilizando `QueryRunner`, garantizando simetría estricta de rollback y aislamiento de dominios de base de datos en Enterprise.

## 👥 Roles y Modelos Recomendados

| Rol | Subagente | Modelo Sugerido | Herramientas | Modo |
|---|---|---|---|---|
| **Entity Scout** | `@explorer` | Gemini Flash | read_file, git diff | Solo lectura |
| **Migration Developer** | `@coder` | Claude Sonnet / Gemini Flash | read_file, write_file | Generación |
| **Migration QA** | `@reviewer` | Gemini Flash | read_file, code review | Verificación |

---

## 🔄 Fases del Pipeline

```
[Entidades Modificadas en src/entities/<dominio>/]
                         │
                         ▼ (Gemini Flash)
                   🔍 @explorer (Entity Diff & Datasource Scout)
                         │
                         │ 📄 Genera: docs/migration_spec_<dominio>.md (transitorio)
                         ▼ (Claude Sonnet / Gemini Flash)
                   💻 @coder (Migration Generator — generate-migration)
                         │
                         │ 🔨 Genera: src/migrations/<dominio>/<timestamp>-<Name>.ts
                         ▼ (Gemini Flash)
                   🔎 @reviewer (Migration QA — Simetría up/down)
                         │
                         │ 📄 Genera: Migración Validada + Rollback Simétrico
                         ▼ ⏸️ [COMPUERTA: VALIDACIÓN DE MIGRACIÓN]
                         │
                         ▼ 🧹 Limpieza automática de temporales (docs/migration_spec_*)
```

---

### Etapa 1: Análisis de Cambios en Entidades (Bulk-Reader)
- **Responsable**: `@explorer`
- **Regla de Shunting**: Usar `git diff` quirúrgico sobre la entidad modificada en lugar de leer archivos de base de datos enteros.
- **Acciones**:
  1. Analizar el `git diff` de `src/entities/<dominio>/` contra la rama base.
  2. Listar columnas, tipos, índices, claves foráneas o tablas nuevas/modificadas.
  3. Identificar el datasource y base de datos correspondiente (`src/datasources/<dominio>/`).
- **Salida**: Genera `docs/migration_spec_<dominio>.md` (documento transitorio de análisis, **estricto < 150 líneas**).

---

### Etapa 2: Generación con QueryRunner (Direct-to-Disk Writing)
- **Responsable**: `@coder`
- **Skill a invocar**: **`generate-migration`**
- **Regla Direct-to-Disk**:
  - Escribir el archivo `<unix_timestamp_ms>-<DescripcionPascalCase>.ts` directamente en `src/migrations/<dominio>/` con `write_to_file`.
  - Prohibido volcar el archivo de migración completo en el chat; solo reportar la ruta del archivo, tablas/columnas alteradas y validación de `down`.
- **Acciones**:
  1. Crear archivo `<unix_timestamp_ms>-<DescripcionPascalCase>.ts` en `src/migrations/<dominio>/` usando `write_to_file`.
  2. Implementar `up(queryRunner)` con la API programática (`createTable`, `addColumn`, `changeColumn`, etc.).
  3. Implementar `down(queryRunner)` con la operación inversa exacta (simetría estricta para rollback).
  4. Incluir chequeos de existencia de tablas/columnas antes de operar.
  5. Actualizar el datasource correspondiente en `src/datasources/<dominio>/` si requiere registro explícito.
- **Salida**: Archivo de migración TypeScript generado en disco y reporte sintético.

---

### Etapa 3: Verificación de Simetría y Calidad
- **Responsable**: `@reviewer`
- **Acciones**:
  1. Validar que no haya SQL raw innecesario (`queryRunner.query()`) salvo casos excepcionales.
  2. Verificar que cada paso de `up` tenga su contraparte inversa en `down`.
  3. Verificar que no se mezclen entidades o datasources de otros dominios.
  4. **Compuerta de Validación de Migración**: Presentar al desarrollador el reporte sintético de la migración (ruta, cambios aplicados, simetría de rollback y entidades afectadas), esperando su interacción.
  5. **Limpieza estricta de temporales**: Al concluir la verificación, eliminar de forma obligatoria los archivos de especificación temporales (`docs/migration_spec_<dominio>.md`) para mantener el árbol de Git limpio.
- **Salida**: Migración validada, lista para dev review y workspace limpio de temporales.
