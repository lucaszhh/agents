# 🧪 Scorecard de QA de Componente — [NombreComponente]

> **Archivo generado en**: `.agents/qa/[Componente]-qa-scorecard.md`  
> **Fecha**: YYYY-MM-DD  
> **Auditor / Rol**: `@component-qa`  
> **Score Final**: `12 / 12` (`Listo para merge`) <!-- 0-6: No listo | 7-10: Casi | 11-12: Listo -->

---

## 1. Evaluación Técnica por Categorías (0 - 12)

| # | Categoría de Evaluación | Puntaje (0-2) | Estado / Observaciones |
|---|---|:---:|---|
| 1 | **Compilación y Tipos** | **2** | `pnpm build:react` compila sin errores ni casts `any`. |
| 2 | **Tokens y Theme** | **2** | Grep hex/px dio 0 coincidencias; variantes declaradas en theme tipado. |
| 3 | **Variantes y Estados** | **2** | Todas las variantes cubiertas: default, hover, active, focus, disabled, loading. |
| 4 | **Accesibilidad (a11y)** | **2** | Roles ARIA correctos, focus visible y contraste texto/fondo $\ge 4.5:1$. |
| 5 | **Storybook y Test Runner** | **2** | `pnpm test-storybook` pasó 100% de los tests de interacción y a11y. |
| 6 | **Integridad de Migración** | **2** | Sin imports de negocio ni acoplamientos al legacy; API pública equivalente. |
| | **TOTAL** | **12 / 12** | **Aprobado para merge** |

---

## 2. Ejecución Automatizada y Herramientas

```bash
# 1. Chequeo de tokens hardcodeados (hex / px)
grep -rnE "#[0-9a-fA-F]{3,6}|[0-9]+px" packages/react/src/components/[Componente]/

# 2. Compilación del package
pnpm build:react

# 3. Test Runner de Storybook
pnpm test-storybook --url http://localhost:6006 --stories="components/[Componente]/**/*.stories.tsx"
```

---

## 3. Hallazgos y Observaciones

### Hallazgos Críticos o Altos
*(Ninguno — Listo para merge)*

### Observaciones Menores
1. **Controls de Storybook**: Se sugiere documentar en JSDoc la prop `customIcon` para que Storybook genere la descripción de la tabla de propiedades automáticamente.

---

## 4. Veredicto y Siguientes Pasos

- **Veredicto**: `Listo para merge`. Cumple el estándar de calidad técnica del Design System.
- **Siguiente Skill**: Invocar **nextjs-code-review** para revisar el pull request antes de mergear a `develop`.
