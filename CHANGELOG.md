# Changelog

## [0.3.0] — 2026-09-08

### Mejorado (Consolidación Tier-S y Blindaje Multi-Entorno)
- **skills/**: Optimización integral del catálogo de 15 skills bajo el estándar Tier-S con protocolo universal Direct-to-Disk Writing y descripciones concisas (< 50 palabras).
- **front/**: Matriz RSC en `nextjs-architect`, Fase 3.5 TDD obligatoria en `nextjs-debug-flow`, Playwright CLI headless con degradación elegante en `nextjs-design-craft` y `nextjs-design-audit`, script agnóstico de SO `check_code_health.mjs` con capping en `nextjs-code-health`.
- **back/**: Soporte de Unit of Work (`QueryRunner`) en `nestjs-architect`, generador `scaffold_module.sh`, catálogo formal de errores y plantilla X-Road en `nestjs-developer`, y umbral estricto $\ge 85\%$ de cobertura en `nestjs-unit-tester`.
- **design-system/**: Validación previa de esquema en `design-token-sync`, Storybook Test Runner con axe-core y regex anti-hardcoding en `component-qa`, validación determinista de barrel export en `component-migrator`.
- **generales/**: Homologación a three-dot diff en `generate-qa-checklist`, protección contra duplicados e inyección directa en `generate-changelog`.
- **workflows/**: Alineación de contratos de handoff y permisos de escritura en `.agents/plans/` y `.agents/components/`.

---

## [0.2.0] — 2026-09-08

### Agregadas
- **scripts/detect_env_vars.py**: Herramienta CLI de extracción, clasificación y reporte de variables de entorno stack-aware (Next.js, LoopBack 4, NestJS, Go, Vite, Python) para automatizar el Paso 1b en `generate-pr-report`.
- **generate-pr-report**: Paquetización de `detect_env_vars.py` en la skill y sincronización automática hacia directorios globales en `sync_agents.sh`.

---

## 0.1.0 — 2026-08-24

### Agregadas

**Frontend (6):**
- nextjs-architect
- nextjs-design-craft
- nextjs-design-audit
- nextjs-debug-flow
- nextjs-code-review
- nextjs-code-health

**Backend (3):**
- nestjs-architect
- nestjs-developer
- nestjs-unit-tester

**Design System (3):**
- design-token-sync
- component-migrator
- component-qa

**Generales (3):**
- generate-changelog
- generate-pr-report
- generate-qa-checklist
