# 📌 [Tipo]: [Descripción concisa de la funcionalidad o corrección]

> **Rama**: `[nombre-de-rama]`  
> **Base**: `develop` (Three-dot merge-base: `[commit-hash]`)  
> **Fecha**: YYYY-MM-DD  
> **Autor**: `@coder`

---

## 🚨 ACCIÓN REQUERIDA — Variables de Entorno Nuevas (Si aplica)

> ⚠️ **ACCIÓN REQUERIDA:** Las siguientes variables de entorno deben crearse o actualizarse en los ambientes de despliegue antes de poner en marcha el servicio.

| Variable | Servicio / Archivo | Tipo | ¿Obligatoria? | Impacto si falta |
|---|---|:---:|:---:|---|
| `[NOMBRE_VARIABLE]` | `[servicio/ o ruta]` | `Server` / `Client` | `Sí — falla arranque` | El servicio no inicia (`EnvLoader` lanza excepción). |

*Nota: `.env` está excluido del control de versiones (`.gitignore`). La variable debe configurarse manualmente en cada ambiente (dev/qa/prod).*

---

## 📝 Descripción

Párrafo de alto nivel que sintetiza **qué cambia** y **por qué** (el motivo técnico o funcional que motivó la implementación).

---

## 🔎 Contexto Adicional

- **Módulos Afectados**: `[modulo1]`, `[modulo2]`
- **Issue Relacionado**: `#123` (o `N/A`)
- **Endpoints Modificados**: `[MÉTODO] /api/v1/[recurso]`

---

## 🪜 Pasos para Reproducir (Si aplica a un Bugfix)

1. Ingresar a `/[ruta]`.
2. Realizar acción `[X]`.
3. Comportamiento previo: fallo o estado incorrecto.

---

## ✅ Resultado Esperado

- El comportamiento se ajusta a las invariantes de negocio.
- No se producen errores en runtime ni advertencias de consola.

---

## ❌ Resultado Actual (Antes del Fix)

- Descripción concisa de la falla previa resuelta por este cambio.

---

## 📎 Cambios Realizados por Capa Arquitectónica

### Core — Dominio y Tipos
| Archivo | Cambio |
|---|---|
| `src/modules/[mod]/domain/types.ts` | **Nuevo**: contratos e interfaces tipadas. |

### Data Layer — Servicios y Repositorios
| Archivo | Cambio |
|---|---|
| `src/modules/[mod]/services/api.ts` | Integración con nuevo endpoint y manejo de `Result`. |

### UI & Componentes
| Archivo | Cambio |
|---|---|
| `src/modules/[mod]/components/View.tsx` | Adopción de nuevos hooks y skeletons de carga. |

---

## ⚠️ Notas y Gaps Detectados (Opcional)

- `[Nota 1]`: Detalle de deuda técnica remanente o mejoras sugeridas para un issue futuro.

---

## 🖥️ Entorno de Ejecución

- **Stack**: Next.js / NestJS / TypeScript
- **Dependencias Nuevas**: `Ninguna`
