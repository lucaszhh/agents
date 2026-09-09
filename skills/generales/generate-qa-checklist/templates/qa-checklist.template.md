# 🧪 QA Checklist — [Tipo]: [Título del Issue / PR]

> **Rama**: `[nombre-de-rama]`  
> **Base**: `develop` (Three-dot merge-base)  
> **Fecha**: YYYY-MM-DD  
> **Autor**: `@qa-engineer`

---

## ⚙️ Precondiciones de Entorno y Configuración

- **Variables de entorno / Flags requeridas**: `[VARIABLE_NAME=valor]` (o `N/A`)
- **Sesión y Roles requeridos**: Usuario autenticado con rol `[Rol]` (ej. `Ciudadano`, `Administrador`).

---

## 📋 Flujos a Verificar

### Flujo 1: [Nombre descriptivo en lenguaje de usuario]

**Precondiciones específicas**: Usuario con al menos un trámite previo en estado `Pendiente`.

| # | Caso de Prueba | Tipo | Resultado Esperado (Verificable en Pantalla) |
|---|---|:---:|---|
| 1 | Completar el formulario con todos los campos obligatorios válidos | `✅ Happy path` | Se muestra snackbar de confirmación y se redirige a la lista con el nuevo registro visible. |
| 2 | Dejar campos obligatorios vacíos e intentar enviar | `⚠️ Edge case` | El botón de submit permanece deshabilitado o se muestran mensajes de validación en rojo debajo de cada campo. |
| 3 | Ingresar valor con caracteres especiales en el campo de texto | `⚠️ Edge case` | El sistema sanea el texto o muestra error de validación sin romper la interfaz. |
| 4 | Usuario sin permisos intenta acceder directamente por URL | `❌ Caso negativo` | Se redirige a `/403` o se muestra pantalla de permisos insuficientes sin exponer datos. |

---

### Flujo 2: [Segundo flujo tocado por los cambios]

**Precondiciones específicas**: Navegador en vista mobile (< 768px).

| # | Caso de Prueba | Tipo | Resultado Esperado (Verificable en Pantalla) |
|---|---|:---:|---|
| 1 | Abrir modal en pantalla chica | `✅ Happy path` | El modal ocupa el 100% del viewport o incluye scroll interno sin cortar los botones de acción. |
| 2 | Cerrar modal presionando tecla `Escape` o backdrop | `✅ Happy path` | El modal se cierra limpiamente y el foco regresa al botón disparador. |

---

## 🔁 Flujos de Regresión Sugeridos (Smoketest)

Listado de componentes o vistas que no fueron modificadas intencionalmente pero que comparten tipos, utilitarios o servicios afectados por la rama:

- **[Nombre del Flujo A]**: Comparte el helper de formateo de fechas modificado; verificar que las tablas sigan mostrando `DD/MM/YYYY`.
- **[Nombre del Flujo B]**: Consume el mismo servicio HTTP actualizado; verificar que la carga de listado no lance error 500.
