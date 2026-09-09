# 📊 Reporte de Salud del Código (Code Health)

> **Archivo generado en**: `.agents/health/health-report.md`  
> **Historial acumulado en**: `.health-history.jsonl`  
> **Fecha**: YYYY-MM-DD  
> **Score Final**: `8.5 / 10` (`Buen estado`) <!-- 0-3: Crítico | 4-6: Aceptable | 7-8: Buen estado | 9-10: Excelente -->  
> **Tendencia**: `+1.0 vs anterior` (Anterior: 7.5 | Promedio histórico: 7.8)

---

## 1. Desglose de Checks (0 - 10)

| Check | Puntos | Obtenido | Estado / Métricas |
|---|:---:|:---:|---|
| **1. Linter (ESLint)** | 3.0 | **3.0** | `0 errores`, `2 warnings` (`pnpm run lint`) |
| **2. TypeScript** | 3.0 | **3.0** | `0 errores de tipo` (`pnpm run typecheck`) |
| **3. Estructura Modular** | 2.0 | **2.0** | Sin lógica en `src/app/`, imports de `@mui/*` encapsulados |
| **4. Deuda Técnica** | 1.0 | **1.0** | `0 console.log`, `1 TODO` documentado |
| **Penalizaciones** | - | **-0.5** | 1 archivo > 1000 líneas (`src/modules/[mod]/legacy.ts: 1042 líneas`) |
| **TOTAL** | **10.0** | **8.5** | **Aprobado para Release / Merge** |

---

## 2. Ejecución Automatizada

Comando multiplataforma ejecutado:
```bash
node scripts/check_code_health.mjs
```

### JSON Estructurado Registrado
```json
{
  "date": "YYYY-MM-DD",
  "score": 8.5,
  "lint": { "errors": 0, "warnings": 2 },
  "typescript": { "errors": 0 },
  "structure": { "violations": 0 },
  "debt": { "issues": 1 },
  "penalties": 0.5
}
```

---

## 3. Archivos Monolíticos Detectados (> 500 líneas)

| Archivo | Líneas | Severidad | Acción Recomendada |
|---|:---:|:---:|---|
| `src/modules/[mod]/views/LegacyTable.tsx` | 1042 | `CRÍTICO` (-0.5 pts) | Particionar en subcomponentes (`TableHeader`, `TableRowActions`, `TableFilters`). |
| `src/modules/[mod]/services/apiService.ts` | 620 | `MEDIO` | Separar endpoints por sub-recurso. |

---

## 4. Plan de Acción y Fixes Prioritarios

1. **Prioridad 1 (Monolito)**: Crear issue técnico para particionar `LegacyTable.tsx`.
2. **Prioridad 2 (Warnings de Lint)**:
   - `src/modules/[mod]/components/Card.tsx:32`: Eliminar variable no utilizada `isLoading`.
3. **Prioridad 3 (TODOs)**:
   - `src/modules/[mod]/hooks/useData.ts:15`: Resolver TODO sobre cache invalidation de mutación.
