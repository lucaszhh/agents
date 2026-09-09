# 🏛️ Plan de Arquitectura Backend NestJS — [Nombre del Módulo]

> **Archivo generado en**: `.agents/plans/[modulo-kebab-case]-backend.md`  
> **Fecha**: YYYY-MM-DD  
> **Autor / Rol**: `@architect-back`  
> **Estado**: `Pendiente de Aprobación` <!-- Opciones: Pendiente de Aprobación | Aprobado | En Implementación -->

---

## 1. Contexto de Negocio y Bounded Context

- **Dominio / Módulo**: `src/modules/[modulo]/`
- **Responsabilidad única**: Descripción del bounded context y reglas de negocio principales.
- **Interoperabilidad / Integraciones**: ¿Requiere exposición X-Road SOAP/REST? `[Sí / No]`

---

## 2. Estructura Modular y Separación de Capas (Clean Architecture)

```
src/modules/[modulo]/
├── [modulo].module.ts                       # Definición de módulo y providers
├── presentation/
│   ├── controllers/
│   │   └── [feature].controller.ts          # @Controller con @TraceBreadcrumb
│   ├── dtos/
│   │   ├── [action]-request.dto.ts          # class-validator decorators
│   │   └── [action]-response.dto.ts
│   └── mappers/
│       └── [feature].mapper.ts              # Mappers estáticos DTO <-> Domain
├── domain/
│   ├── interfaces/
│   │   ├── [entity].interface.ts            # Contrato de entidad de dominio
│   │   └── i-[feature].service.ts           # abstract class I...Service
│   └── services/
│       └── [feature].service.ts             # Implementación retornando Result<T, E>
└── data/
    ├── interfaces/
    │   └── i-[feature].repository.ts        # abstract class I...Repository
    └── repositories/
        ├── [entity].entity.ts               # TypeORM Entity
        └── [feature].repository.ts          # Implementación de persistencia
```

---

## 3. Inyección de Dependencias y Tokens Desacoplados

Las capas superiores no conocen las implementaciones concretas. Se emplean clases abstractas como tokens de inyección:

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([[Entity]Entity])],
  controllers: [[Feature]Controller],
  providers: [
    { provide: I[Feature]Service, useClass: [Feature]Service },
    { provide: I[Feature]Repository, useClass: [Feature]Repository },
  ],
  exports: [I[Feature]Service],
})
export class [Feature]Module {}
```

---

## 4. Persistencia, Transacciones y Unit of Work

- **Entidad TypeORM**: `[entity].entity.ts` mapeada a la tabla `[tabla_db]`.
- **Estrategia Transaccional**:
  - Para operaciones que toquen múltiples repositorios o emitan eventos:
  ```typescript
  // Uso de QueryRunner para transacciones atómicas
  const queryRunner = this.dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  try {
    // ... operaciones
    await queryRunner.commitTransaction();
  } catch (err) {
    await queryRunner.rollbackTransaction();
    throw err;
  } finally {
    await queryRunner.release();
  }
  ```
- **Migraciones requeridas**: `src/migrations/YYYYMMDD-[create-table].ts`.

---

## 5. Contratos del Patrón Result y Manejo de Errores

El servicio de dominio retorna `Result<T, E>` y **nunca lanza excepciones**:

```typescript
export abstract class I[Feature]Service {
  abstract execute(input: [Feature]DomainInput): Promise<Result<[Feature]DomainOutput, DomainError>>;
}
```

- Mapeo de errores en controlador vía `ErrorMapperToHttp(output.getError())`:
  - `NotFoundError` $\rightarrow$ `404 Not Found`
  - `ValidationError` $\rightarrow$ `400 Bad Request`
  - `ConflictError` $\rightarrow$ `409 Conflict`

---

## 6. Verificación Arquitectónica y Dependencias Circulares

Comando para validar ausencia de dependencias circulares:
```bash
npx madge --circular src/modules/[modulo]/
```

---

## 7. Gaps Detectados y Preguntas de Negocio

- [ ] **Gap 1**: ¿La tabla requiere soft-delete (`deleted_at`) o borrado físico?
- [ ] **Pregunta 1**: ¿Cuál es la política de retención de auditoría para `@TraceBreadcrumb`?
