---
name: nestjs-backend-developer
description: Desarrolla e implementa el código backend para proyectos NestJS. Programación limpia, DI desacoplada, mappers estáticos, patrón Result y especificaciones de empaquetado X-Road.
---

# NestJS Backend Developer — Codificación

Implementa controladores, servicios, repositorios, DTOs y mappers de NestJS, siguiendo los lineamientos de arquitectura modular limpia y el estándar X-Road.

## Lectura previa obligatoria

- Estructura del módulo que se va a implementar (`nestjs-architect` ya la definió)
- Módulos existentes como referencia de patrones
- `src/common/errors/result.mapper.ts` — patrón Result
- `src/common/errors/error.mapper.ts` — mapeo a HttpException

## Cuándo usar esta skill

- "implementá el controlador de X"
- "creá el servicio de X"
- "generá los DTOs y mappers de esta feature"
- "escribí el endpoint para X"
- Después de `nestjs-architect` haya definido la estructura

## Cuándo NO usar esta skill

- **Diseñar la arquitectura del módulo** → `nestjs-architect`
- **Escribir tests** → `nestjs-unit-tester`
- **Corregir bugs** → buscar la causa directamente

---

## Metodología

### Paso 1 — Entender el contrato

- ¿Qué caso de uso se va a implementar?
- ¿Qué DTOs de entrada/salida necesita?
- ¿Qué errores puede devolver?
- ¿Requiere publicación X-Road?

### Paso 2 — Implementar la capa de dominio

1. Definir la interfaz de entidad en `domain/interfaces/`
2. Implementar el servicio en `domain/services/`:
   - Devolver `Result<T, E>` en vez de lanzar excepciones
   - El controlador evalúa el resultado y mapea errores

### Paso 3 — Implementar la capa de presentación

1. **DTOs**: usar `class-validator` y `class-transformer` para validación
2. **Mappers**: estáticos, en `presentation/dtos/`, convertir entre DTO y entidad
3. **Controladores**:
   - Usar `@TraceBreadcrumb` para auditoría
   - Inyectar `@CurrentUser()` cuando corresponda
   - Evaluar `Result` y mapear errores con `ErrorMapperToHttp`

### Paso 4 — Verificar

- ¿El servicio devuelve `Result` y no lanza excepciones?
- ¿El controlador evalúa `isFailure` antes de acceder al valor?
- ¿Los DTOs tienen decoradores de validación?
- ¿Los mappers son estáticos?

---

## Buenas prácticas

### Patrón Result

```typescript
// En el servicio — devolver Result, no lanzar excepciones
const output = await this.featureService.execute(input);
if (output.isFailure) {
    throw ErrorMapperToHttp(output.getError());
}
return FeatureMapper.ToPresentation(output.getValue());
```

### Nomenclatura de archivos

| Tipo | Formato | Ejemplo |
|---|---|---|
| Interfaz de servicio | `i-<feature>.service.ts` | `i-demand.service.ts` |
| Servicio | `<feature>.service.ts` | `demand.service.ts` |
| Interfaz de repositorio | `i-<feature>.repository.ts` | `i-demand.repository.ts` |
| Repositorio | `<feature>.repository.ts` | `demand.repository.ts` |
| Controlador | `<feature>.controller.ts` | `demand.controller.ts` |
| DTO | `<feature>-<action>.dto.ts` | `demand-create.dto.ts` |

### Plantilla de DTO + Mapper

```typescript
export class CreateDemandRequest {
    @IsNotEmpty()
    @IsString()
    attribute: string;
}

export class CreateDemandMapper {
    static ToDomain(input: CreateDemandRequest): any {
        return { attribute: input.attribute };
    }
    static ToPresentation(output: DemandInterface): CreateDemandResponse {
        return { id: output.id, attribute: output.attribute };
    }
}
```

### Plantilla de Controlador

```typescript
@Controller('demand')
export class DemandController {
    constructor(private readonly service: IDemandService) {}

    @Post()
    @TraceBreadcrumb('controller', 'CREATE', 'Crear demanda', 'DEMAND', ['DEMAND', 'CREATE'])
    async create(@Body() reqBody: CreateDemandRequest): Promise<CreateDemandResponse> {
        const output = await this.service.create(CreateDemandMapper.ToDomain(reqBody));
        if (output.isFailure) {
            throw ErrorMapperToHttp(output.getError());
        }
        return CreateDemandMapper.ToPresentation(output.getValue());
    }
}
```

---

## Reglas de lo que SÍ debe hacer

- Devolver `Result<T, E>` desde servicios (no lanzar excepciones)
- Evaluar `isFailure` en controladores antes de acceder al valor
- Usar decoradores de `class-validator` en DTOs
- Hacer mappers estáticos
- Usar `@TraceBreadcrumb` en controladores
- Inyectar `@CurrentUser()` cuando se necesite el usuario logueado

## Reglas de lo que NO debe hacer

- NO poner lógica de negocio en controladores
- NO lanzar excepciones HTTP desde servicios (usar Result)
- NO crear DTOs sin decoradores de validación
- NO hacer mappers con estado (deben ser estáticos)
- NO olvidar `ErrorMapperToHttp` para mapear errores

## Al terminar

Sugerir al usuario: **nestjs-unit-tester** para escribir las pruebas unitarias de los controladores y servicios implementados.
