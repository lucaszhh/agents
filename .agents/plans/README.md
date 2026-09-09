# Planes de Arquitectura (.agents/plans/)

Carpeta de destino obligatoria para los entregables de diseño técnico y planificación generados por las skills de arquitectura:
- `nextjs-architect` (Frontend)
- `nestjs-architect` (Backend)

## Protocolo Direct-to-Disk
- Cada plan se genera como `.agents/plans/<nombre>.md` (en `kebab-case`).
- Los agentes **no vuelcan el plan completo en el chat**, sino que escriben el archivo aquí y reportan en la conversación un resumen sintético con las preguntas de negocio y gaps a validar.
