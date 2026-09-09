# 📦 Especificación de Migración de Componente — [NombreComponente]

> **Archivo generado en**: `.agents/components/[Componente]-migration.md`  
> **Fecha**: YYYY-MM-DD  
> **Migrador / Rol**: `@component-migrator`  
> **Origen Legacy**: `frontend-nextjs/src/modules/desingSystem/[Componente]/`  
> **Destino Monorepo**: `packages/react/src/components/[Componente]/`  
> **Estado**: `Migrado / Pendiente de QA`

---

## 1. Análisis del Componente Legacy

- **Props públicas originales**:
  ```typescript
  interface LegacyProps {
    variant?: 'primary' | 'secondary' | 'chatbot';
    size?: 'small' | 'medium';
    disabled?: boolean;
    // ...
  }
  ```
- **Dependencias de negocio detectadas**: `Ninguna` (o separadas y excluidas de la migración).
- **Estilos inline o hex detectados**: Removidos y reemplazados por tokens de `@desingSystem/*`.

---

## 2. Adaptación al Theme y Module Augmentation

Variantes incorporadas a `packages/react/src/theme/types/`:
```typescript
declare module '@mui/material/Button' {
  interface ButtonPropsColorOverrides {
    chatbot: true;
  }
}
```

---

## 3. Archivos Creados en el Monorepo (Direct-to-Disk)

- `packages/react/src/components/[Componente]/`
  - `[NEW]` `index.ts` — Export del componente y types.
  - `[NEW]` `[Componente].tsx` — Implementación pura sobre MUI + theme propio.
  - `[NEW]` `types.ts` — Contratos de props estrictamente tipados.
- `apps/docs/src/stories/`
  - `[NEW]` `[Componente].stories.tsx` — Storybook con controles interactivos y matriz de variantes.

---

## 4. Verificación de Barrel Export

Línea agregada a `packages/react/src/index.ts`:
```typescript
export * from './components/[Componente]';
```

---

## 5. Checklist de Regresión Visual y de API

- [x] La API pública de props es compatible o superconjunto tipado del legacy.
- [x] Se eliminaron todos los colores hex y espaciados hardcodeados.
- [x] La Story cubre: Default, Hover, Focus visible, Disabled y todas las variantes.
- [x] Compilación limpia con `pnpm build:react`.
- [x] Storybook levanta sin warnings en consola con `pnpm storybook`.

---

## 6. Siguientes Pasos

Invocar **component-qa** para auditar el componente en Storybook (accesibilidad, tokens, variantes y compilación).
