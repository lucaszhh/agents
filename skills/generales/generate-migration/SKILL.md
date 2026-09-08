---
name: generate-migration
description: Genera migraciones de base de datos manuales usando QueryRunner para el proyecto de producción, detectando cambios en las entidades.
---

# Skill de Generación de Migraciones

Eres un asistente experto en migraciones de base de datos. Tu tarea es automatizar el proceso de crear migraciones manuales de base de datos usando `QueryRunner` en TypeORM, basándote en los cambios realizados en las entidades del sistema.

## Contexto del Repositorio Enterprise

Stack: NestJS + TypeORM + PostgreSQL. Cada base de datos es un dominio independiente:
`alarms`, `audiences-news`, `notification`, `obras`, `statistics`.

Siempre ten en cuenta esta estructura principal al trabajar con migraciones:

1. **Configuración de Bases de Datos**: Definida en `src/config/const.ts`.
2. **Variables de Entorno**: El migrador lee de `src/config/names.env.ts`. Asegúrate de que las variables necesarias estén presentes.
3. **Datasources**: Ubicados en `src/datasources/` (ej: `src/datasources/obras/obras.datasource.ts`). Cada conexión es por base.
4. **Entidades**: Ubicadas en `src/entities/` (ej: `src/entities/obras/`). Éstas dictan el esquema deseado.
5. **Migraciones**: Ubicadas en `src/migrations/` (ej: `src/migrations/obras/`).

## Reglas Críticas

- **Dominio Aislado**: Nunca importar una entidad o datasource de otra base. Cada dominio es autónomo.
- **Comentarios**: Sin comentarios superfluos (ni `// Cambio de fecha`, ni `// Acá va float por que hace referencia a plata`).
- **Control de Versiones**: No hacer `git push` o `git pull`. Solo hacer `git diff` sobre el archivo de la entidad modificada para detectar cambios.
- **Revisión**: Las migraciones son sometidas a Dev Review y luego se corren manualmente en la base de datos correspondiente.

## Flujo de Trabajo: Creando una Nueva Migración

Cuando el usuario pida crear una nueva migración (ej: "Cambié la entidad XXX, creame una migración nueva"):

1. **Analizar Cambios en Entidades**:
   - Identifica qué entidad fue modificada.
   - Usa `git diff` o `git log` sobre el archivo de la entidad en `src/entities/` para entender exactamente qué campos, tipos o relaciones se agregaron, modificaron o eliminaron en comparación con la última migración.

2. **Crear Estructura de la Migración**:
   - Genera un nuevo archivo de migración en la carpeta del módulo correspondiente bajo `src/migrations/` (ej: `src/migrations/obras/`).
   - **Formato del archivo**: `<unix_ms_en_milisegundos>-<DescripcionPascalCase>.ts`. (Usa el timestamp Unix actual en milisegundos).
   - La clase de la migración debe implementar `MigrationInterface` de TypeORM.

3. **Implementar Lógica con QueryRunner**:
   - Usar la API programática de TypeORM (`queryRunner.getTable()`, `TableColumn`, `TableForeignKey`, `TableIndex`, etc.) mediante métodos como `createTable`, `addColumn`, `changeColumn`, `dropColumn`, `renameColumn`, `dropTable`.
   - **IMPORTANTE**: SQL directo (`queryRunner.query()`) debe usarse **solo como última alternativa** para consultas muy complejas o migraciones de datos.
   - **`up(queryRunner: QueryRunner)`**: Escribe las sentencias para aplicar los cambios (ej: `await queryRunner.addColumn('nombre_tabla', new TableColumn({ ... }))`).
   - **`down(queryRunner: QueryRunner)`**: Escribe las sentencias inversas exactas para revertir los cambios si se necesita un rollback (ej: `await queryRunner.dropColumn('nombre_tabla', 'nombre_columna')`). Siempre debe ser simétrico al `up`.
   - **Chequeo de existencia**: Siempre verifica si la tabla o columna existe antes de operarla, si corresponde.

4. **Actualizar Datasource (Si es necesario)**:
   - Verifica si la nueva entidad o migración necesita ser registrada explícitamente en el archivo del datasource correspondiente (ej: `src/datasources/obras/obras.datasource.ts`).
   - Valida que las configuraciones en `src/config/const.ts` y `src/config/names.env.ts` estén al día con los nuevos requerimientos.

## Ejemplo de Referencia

A continuación se muestra un ejemplo del estilo esperado usando la API de `QueryRunner`. Siempre mantén la simetría entre `up` y `down` y verifica la existencia de tablas/columnas:

```typescript
import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddPhoneNumberToUsers1780670400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("users");

    if (table && !table.findColumnByName("phone_number")) {
      await queryRunner.addColumn(
        "users",
        new TableColumn({
          name: "phone_number",
          type: "varchar",
          isNullable: true,
        }),
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable("users");

    if (table && table.findColumnByName("phone_number")) {
      await queryRunner.dropColumn("users", "phone_number");
    }
  }
}
```

## Protocolo de Escritura Directa a Disco (Direct-to-Disk Writing)

Para optimizar el consumo de tokens y no saturar la ventana de contexto:
1. **Escribir directamente a disco**: Generar el archivo de migración en `src/migrations/<dominio>/<timestamp>-<Nombre>.ts` usando la herramienta de escritura de archivos (`write_to_file`).
2. **Prohibido volcar el código completo en la conversación**: NO imprimir el código TypeScript de la migración en la respuesta del chat.
3. **Formato obligatorio de reporte final**:
   - **Archivo**: ruta relativa del archivo de migración generado.
   - **Dominio / Base de datos**: base afectada y datasource actualizado (si aplica).
   - **Operaciones en `up`**: viñetas breves con tablas, columnas o índices creados/modificados.
   - **Validación de `down`**: confirmación de simetría estricta para rollback seguro.

---

## Comandos CLI Útiles (Solo para información)

```bash
pnpm run migration:show --db=<nombre>
pnpm run migration:run --db=<nombre>
pnpm run migration:revert --db=<nombre>
pnpm run migration:generate --db=<nombre>
```

_Nota: `generate` crea migración automática desde entities. Para cambios manuales, crear el archivo a mano usando este skill._
