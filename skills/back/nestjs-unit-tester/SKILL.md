---
name: nestjs-unit-tester
description: Desarrolla y ejecuta pruebas unitarias para proyectos NestJS. Testing con Jest, inyección de mocks en TestingModule, patrón AAA (Arrange-Act-Assert) y validación del patrón Result.
---

# NestJS Unit Tester — Pruebas Unitarias

Diseña, estructura e implementa pruebas unitarias (`*.spec.ts`) para controladores, servicios y repositorios de NestJS, garantizando cobertura y consistencia.

## Lectura previa obligatoria

- Código que se va a testear (servicio, controlador, repositorio)
- `package.json` — verificar que Jest está configurado
- Patrón Result del proyecto (`src/common/errors/result.mapper.ts`)

## Cuándo usar esta skill

- "escribí tests para este servicio"
- "testear el controlador de X"
- "agregá coverage para esta feature"
- "depurá este test que falla"
- Después de `nestjs-developer` haya implementado el código

## Cuándo NO usar esta skill

- **Diseñar la arquitectura** → `nestjs-architect`
- **Implementar código** → `nestjs-developer`
- **Corregir bugs de producción** → buscar la causa directamente

---

## Metodología

### Paso 1 — Preparar el entorno

1. Crear el archivo `*.spec.ts` junto al archivo que se testea
2. Importar `Test` y `TestingModule` de `@nestjs/testing`
3. Definir mocks de todas las dependencias del constructor

### Paso 2 — Configurar TestingModule

```typescript
const module: TestingModule = await Test.createTestingModule({
    providers: [
        MyService,
        { provide: IMyRepository, useValue: mockRepository },
    ],
}).compile();

service = module.get<MyService>(MyService);
repository = module.get(IMyRepository);
jest.clearAllMocks();
```

### Paso 3 — Escribir tests con patrón AAA

Cada test se organiza en:

- **Arrange**: configurar datos de entrada, mocks y respuestas
- **Act**: ejecutar el método bajo prueba
- **Assert**: validar con `expect()` que los resultados sean los esperados

### Paso 4 — Validar cobertura

- Probar caminos de éxito (`isSuccess`) Y de fracaso (`isFailure`)
- Verificar que el controlador mapea errores a HttpException
- Verificar que los mocks se llaman con los argumentos correctos

---

## Prácticas clave

### Validación del patrón Result

```typescript
// Caso de éxito
it('should return success', async () => {
    const result = await service.execute(mockInput);
    expect(result.isSuccess).toBe(true);
    expect(result.getValue()).toEqual(expectedOutput);
});

// Caso de fallo
it('should return failure', async () => {
    const result = await service.execute(invalidInput);
    expect(result.isFailure).toBe(true);
    expect(result.getError()).toBeInstanceOf(NotFound);
});
```

### Mockeo de dependencias

```typescript
// TypeORM
mockRepository.findOne.mockResolvedValue(mockEntity);
mockRepository.save.mockResolvedValue(mockEntity);

// HttpClient
httpClient.post.mockResolvedValue({
    data: { id: '123', status: 'Success' },
    error: undefined,
    status: 200,
});
```

### Test de controlador

```typescript
it('should throw HttpException if service fails', async () => {
    service.execute.mockResolvedValue(Result.fail(new NotFound('No encontrado')));
    await expect(controller.handler(mockDto)).rejects.toThrow(HttpException);
});
```

---

## Checklist de calidad

- [ ] TestingModule aislado con mocks de todas las dependencias
- [ ] `jest.clearAllMocks()` en `beforeEach`
- [ ] Patrón AAA claro en cada test (Arrange/Act/Assert)
- [ ] Tests de éxito Y de fracaso (isSuccess/isFailure)
- [ ] Mocks verificados con argumentos correctos
- [ ] Controlador mapea errores a HttpException

---

---

## Protocolo de Escritura Directa a Disco (Direct-to-Disk Writing)

Para optimizar el consumo de tokens y no saturar la ventana de contexto:
1. **Escribir directamente a disco**: Generar o editar el archivo `*.spec.ts` usando la herramienta de escritura de archivos (`write_to_file`).
2. **Prohibido volcar el código completo en la conversación**: NO imprimir el código fuente de los tests en la respuesta del chat.
3. **Formato obligatorio de reporte final**:
   - **Archivo**: ruta relativa del `*.spec.ts` creado/modificado.
   - **Resumen de casos**: lista con viñetas de las signaturas de tests implementados (camino feliz y casos de fallo del patrón `Result`).
   - **Resultado de ejecución**: estado de `npm test` o `jest` y porcentaje de cobertura.

---

## Reglas de lo que SÍ debe hacer

- Escribir directamente el archivo `*.spec.ts` a disco (`write_to_file`)
- Reportar únicamente signaturas y métricas de ejecución, sin volcar el código en el chat
- Usar TestingModule aislado (no importar módulos reales)
- Mockear todas las dependencias del constructor
- Limpiar mocks con `jest.clearAllMocks()`
- Probar tanto éxito como fracaso
- Usar patrón AAA con comentarios estructurados
- Verificar que los mocks se llaman con los argumentos correctos

## Reglas de lo que NO debe hacer

- NO volcar el código fuente del spec en la respuesta de chat
- NO importar implementaciones concretas (usar mocks)
- NO olvidar limpiar mocks entre tests
- NO probar solo el happy path
- NO hacer tests que dependan de otros tests
- NO usar `any` innecesariamente en mocks

## Al terminar

Reportar coverage, métricas y tests que fallaron (sin imprimir el código fuente). Si hay tests rotos, sugerir **nestjs-developer** para corregir el código.
