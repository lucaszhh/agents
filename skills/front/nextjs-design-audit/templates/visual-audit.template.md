# 🔬 Reporte de Auditoría Visual y QA de Diseño — [Pantalla / Componente]

> **Archivo generado en**: `.agents/audits/[screen-kebab-case]-audit.md`  
> **Fecha**: YYYY-MM-DD  
> **Auditor / Rol**: `@design-auditor`  
> **Nivel de Auditoría**: `Estándar` <!-- Opciones: Rápido (~5 min) | Estándar (~15 min) | Exhaustivo (~30 min) -->  
> **Score Total**: `85 / 100` (`Excelente`) <!-- 0-29: Crítico | 30-59: Necesita trabajo | 60-84: Aceptable | 85-100: Excelente -->

---

## 1. Scorecard Cuantitativo (0 - 100)

| Categoría | Puntos Obtenidos | Máximo | Observaciones |
|---|:---:|:---:|---|
| **Espaciado y Ritmo** | 18 | 20 | Gaps múltiplos de 8px; detalle menor en padding mobile. |
| **Jerarquía Tipográfica** | 19 | 20 | Escala correcta con tokens de Design System; no hay overflows. |
| **Color y Contraste** | 20 | 20 | Contraste texto/fondo $\ge 4.5:1$ en todos los elementos. |
| **Layout y Responsive** | 15 | 20 | Desborde horizontal resuelto en breakpoint 375px. |
| **Componentes y Estados** | 13 | 20 | Loading skeletons presentes; faltaba botón de retry en error. |
| **TOTAL** | **85** | **100** | **Listo para Producción** |

---

## 2. Herramientas Automatizadas y Capturas

```bash
# Captura de pantalla headless con Playwright
npx playwright screenshot --url http://localhost:3000/[ruta] --viewport-size=375,667 .agents/audits/screenshots/mobile-before.png
npx playwright screenshot --url http://localhost:3000/[ruta] --viewport-size=1280,800 .agents/audits/screenshots/desktop-before.png

# Auditoría automática de accesibilidad
npx pa11y http://localhost:3000/[ruta] --threshold 0
```

- **Resultados a11y**: 0 errores de contraste WCAG AA detectados.
- **Ruta de capturas**: `.agents/audits/screenshots/`

---

## 3. Hallazgos y Fixes Aplicados (Commits Atómicos)

### Issue 1: Desborde horizontal en mobile (375px)
- **Severidad**: `ALTO`
- **Archivo**: `src/modules/[modulo]/components/[Componente].tsx:42`
- **Fix**: Reemplazar ancho fijo `width: 500px` por `width: '100%', maxWidth: 500`.
- **Commit Atómico**: `fix(ui): evitar desborde horizontal en mobile para [Componente]`
- **Evidencia**: Captura before vs after en `.agents/audits/screenshots/issue-1-after.png`.

### Issue 2: Ausencia de botón de retry en estado de error
- **Severidad**: `MEDIO`
- **Archivo**: `src/modules/[modulo]/components/[Componente].tsx:88`
- **Fix**: Agregar acción `onRetry` al banner de alerta.
- **Commit Atómico**: `fix(ui): agregar retry button en estado de error`

---

## 4. Conclusión y Siguientes Pasos

- **Score Inicial**: `68 / 100` $\rightarrow$ **Score Final**: `85 / 100` (+17 puntos tras fixes).
- **Veredicto**: Componente pulido y listo para mergear.
- **Siguiente Skill**: Invocar **nextjs-code-review** para validar el diff acumulado.
