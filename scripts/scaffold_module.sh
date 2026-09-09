#!/usr/bin/env bash
set -euo pipefail

# Scaffold de módulo para NestJS Clean Architecture
# Uso: ./scripts/scaffold_module.sh <nombre-modulo>

if [ -z "${1:-}" ]; then
  echo "Uso: $0 <nombre-modulo-kebab-case>"
  echo "Ejemplo: $0 payment-requests"
  exit 1
fi

MODULE_NAME="$1"
FEATURE_KEBAB="$(echo "$MODULE_NAME" | tr '[:upper:]' '[:lower:]')"
FEATURE_CAMEL="$(echo "$FEATURE_KEBAB" | perl -pe 's/-(.)/\u$1/g')"
FEATURE_PASCAL="$(echo "$FEATURE_CAMEL" | perl -pe 's/^(.)/\u$1/g')"

BASE_DIR="src/modules/${FEATURE_KEBAB}"

echo "🚀 Creando estructura para el módulo '${FEATURE_KEBAB}' en '${BASE_DIR}'..."

mkdir -p "${BASE_DIR}/presentation/controllers"
mkdir -p "${BASE_DIR}/presentation/dtos"
mkdir -p "${BASE_DIR}/presentation/mappers"
mkdir -p "${BASE_DIR}/domain/interfaces"
mkdir -p "${BASE_DIR}/domain/services"
mkdir -p "${BASE_DIR}/data/repositories"
mkdir -p "${BASE_DIR}/data/entities"

# 1. Interfaz de Dominio
cat <<EOF > "${BASE_DIR}/domain/interfaces/${FEATURE_KEBAB}.interface.ts"
export interface I${FEATURE_PASCAL} {
  id: string;
  createdAt: Date;
  updatedAt: Date;
}
EOF

# 2. Contrato Abstracto de Servicio
cat <<EOF > "${BASE_DIR}/domain/services/i-${FEATURE_KEBAB}.service.ts"
import { Result } from '@/common/errors/result.mapper';
import { I${FEATURE_PASCAL} } from '../interfaces/${FEATURE_KEBAB}.interface';

export abstract class I${FEATURE_PASCAL}Service {
  abstract findById(id: string): Promise<Result<I${FEATURE_PASCAL}, Error>>;
}
EOF

# 3. Contrato Abstracto de Repositorio
cat <<EOF > "${BASE_DIR}/data/repositories/i-${FEATURE_KEBAB}.repository.ts"
import { I${FEATURE_PASCAL} } from '../../domain/interfaces/${FEATURE_KEBAB}.interface';

export abstract class I${FEATURE_PASCAL}Repository {
  abstract findById(id: string): Promise<I${FEATURE_PASCAL} | null>;
}
EOF

# 4. Módulo NestJS
cat <<EOF > "${BASE_DIR}/${FEATURE_KEBAB}.module.ts"
import { Module } from '@nestjs/common';
import { I${FEATURE_PASCAL}Service } from './domain/services/i-${FEATURE_KEBAB}.service';
import { I${FEATURE_PASCAL}Repository } from './data/repositories/i-${FEATURE_KEBAB}.repository';

@Module({
  controllers: [],
  providers: [
    // Registrar implementaciones concretas aquí
  ],
  exports: [I${FEATURE_PASCAL}Service],
})
export class ${FEATURE_PASCAL}Module {}
EOF

echo "✅ Módulo '${FEATURE_KEBAB}' creado exitosamente."
echo "Estructura generada:"
echo "  - ${BASE_DIR}/domain/interfaces/${FEATURE_KEBAB}.interface.ts"
echo "  - ${BASE_DIR}/domain/services/i-${FEATURE_KEBAB}.service.ts"
echo "  - ${BASE_DIR}/data/repositories/i-${FEATURE_KEBAB}.repository.ts"
echo "  - ${BASE_DIR}/${FEATURE_KEBAB}.module.ts"
