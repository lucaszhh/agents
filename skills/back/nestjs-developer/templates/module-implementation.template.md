# 💻 Reporte de Implementación Backend NestJS — [Nombre de la Feature]

> **Archivo generado en**: `.agents/specs/[feature-kebab-case]-implementation.md`  
> **Fecha**: YYYY-MM-DD  
> **Desarrollador / Rol**: `@coder-back`  
> **Estado**: `Implementado / Listo para Pruebas Unitarias`

---

## 1. Archivos Generados y Modificados

### Capa de Dominio (`src/modules/[modulo]/domain/`)
- `[NEW]` `interfaces/[singular].interface.ts` — Contrato de la entidad.
- `[NEW]` `services/i-[singular].service.ts` — Token de abstracción `abstract class I...Service`.
- `[NEW]` `services/[singular].service.ts` — Implementación de negocio retornando `Result<T, E>`.

### Capa de Presentación (`src/modules/[modulo]/presentation/`)
- `[NEW]` `dtos/[action]-request.dto.ts` — DTO de entrada con validadores `class-validator`.
- `[NEW]` `dtos/[action]-response.dto.ts` — DTO de salida tipado.
- `[NEW]` `mappers/[feature].mapper.ts` — Mappers estáticos `ToDomain()` y `ToPresentation()`.
- `[NEW]` `controllers/[feature].controller.ts` — `@Controller` con `@TraceBreadcrumb` y manejo de `Result`.

### Capa de Datos e Infraestructura (`src/modules/[modulo]/data/`)
- `[NEW]` `interfaces/i-[singular].repository.ts` — Token `abstract class I...Repository`.
- `[NEW]` `repositories/[singular].entity.ts` — TypeORM `@Entity()` con columnas e índices.
- `[NEW]` `repositories/[singular].repository.ts` — Implementación concreta de persistencia.

---

## 2. Catálogo de Errores de Dominio y Mapeo HTTP

| Error de Dominio | Causa / Condición | Mapeo HTTP (`ErrorMapperToHttp`) | Status Code |
|---|---|---|:---:|
| `NotFoundDomainError` | Recurso no encontrado por ID o criterios de búsqueda | `NotFoundException` | `404 Not Found` |
| `ValidationDomainError` | Datos inválidos o invariantes de negocio violadas | `BadRequestException` | `400 Bad Request` |
| `ConflictDomainError` | Registro duplicado (ej. email o documento ya existente) | `ConflictException` | `409 Conflict` |
| `UnauthorizedDomainError` | Permisos insuficientes o token no válido | `UnauthorizedException` | `401 Unauthorized` |
| `UnexpectedDomainError` | Fallo técnico imprevisto (BD caída, timeout) | `InternalServerErrorException` | `500 Internal Server Error` |

---

## 3. Endpoints Expuestos y Auditoría

| Método | Ruta | Decoradores de Auditoría y Seguridad | Resumen Funcional |
|:---:|---|---|---|
| `POST` | `/api/v1/[recurso]` | `@TraceBreadcrumb('controller', 'CREATE', ...)` | Crea un nuevo registro validando DTO. |
| `GET` | `/api/v1/[recurso]/:id` | `@TraceBreadcrumb('controller', 'READ', ...)` | Obtiene el detalle por UUID. |

---

## 4. Envoltura X-Road (Si aplica)

- **Servicio publicado en X-Road**: `[NombreServicio]`
- **Subsystem**: `[SubsystemCode]`
- **Mapeo de cabeceras**:
  - `xRoadInstance`: Extraído y validado por guard.
  - `userId`: `@CurrentUser()` inyectado en el controlador.

---

## 5. Verificación de Compilación y Calidad

- **Compilación TypeScript**:
  ```bash
  pnpm run build
  ```
  *Estado*: `0 errores de compilación`.
- **Linter**:
  ```bash
  pnpm run lint
  ```
  *Estado*: `0 errores / 0 warnings`.
- **Siguiente paso**: Invocar **nestjs-unit-tester** para crear la suite de pruebas `*.spec.ts`.
