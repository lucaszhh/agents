#!/usr/bin/env bash
set -euo pipefail

# Script de sincronización de Agent Skills y Workflows para Enterprise Production Platform
REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
GLOBAL_SKILLS_DIR="${HOME}/.gemini/config/skills"

echo "🔄 Sincronizando repositorio agents..."

# 1. Asegurar permisos de ejecución en scripts de hooks y herramientas
chmod +x "${REPO_ROOT}/.agents/scripts/shunt_guard.py" 2>/dev/null || true
[ -f "${REPO_ROOT}/scripts/detect_env_vars.py" ] && chmod +x "${REPO_ROOT}/scripts/detect_env_vars.py"
[ -f "${REPO_ROOT}/skills/generales/generate-pr-report/scripts/detect_env_vars.py" ] && chmod +x "${REPO_ROOT}/skills/generales/generate-pr-report/scripts/detect_env_vars.py"
[ -f "${REPO_ROOT}/scripts/scaffold_module.sh" ] && chmod +x "${REPO_ROOT}/scripts/scaffold_module.sh"
[ -f "${REPO_ROOT}/skills/back/nestjs-architect/scripts/scaffold_module.sh" ] && chmod +x "${REPO_ROOT}/skills/back/nestjs-architect/scripts/scaffold_module.sh"

# 2. Sincronizar workflows a .agents/workflows
mkdir -p "${REPO_ROOT}/.agents/workflows"
cp -r "${REPO_ROOT}/workflows/"* "${REPO_ROOT}/.agents/workflows/"
echo "✅ Workflows locales sincronizados en .agents/workflows/"

# 3. Sincronizar skills atómicas a ~/.gemini/config/skills/
mkdir -p "${GLOBAL_SKILLS_DIR}"

sync_skill() {
  local skill_name="$1"
  local skill_file="$2"
  local dest_dir="${GLOBAL_SKILLS_DIR}/${skill_name}"
  local dest_file="${dest_dir}/SKILL.md"
  mkdir -p "${dest_dir}"
  if ! ([[ -f "${dest_file}" ]] && [[ "${skill_file}" -ef "${dest_file}" ]]); then
    cp --remove-destination "${skill_file}" "${dest_file}"
  fi
  local skill_src_dir="$(dirname "${skill_file}")"
  if [[ -d "${skill_src_dir}/scripts" ]]; then
    mkdir -p "${dest_dir}/scripts"
    cp -r "${skill_src_dir}/scripts/"* "${dest_dir}/scripts/"
  fi
  if [[ -d "${skill_src_dir}/templates" ]]; then
    mkdir -p "${dest_dir}/templates"
    cp -r "${skill_src_dir}/templates/"* "${dest_dir}/templates/"
  fi
}

# Skills de frontend
for s in "${REPO_ROOT}/skills/front"/*/; do
  skill_name="$(basename "$s")"
  if [[ -f "$s/SKILL.md" ]]; then
    sync_skill "$skill_name" "$s/SKILL.md"
  fi
done

# Skills de backend
for s in "${REPO_ROOT}/skills/back"/*/; do
  skill_name="$(basename "$s")"
  if [[ -f "$s/SKILL.md" ]]; then
    sync_skill "$skill_name" "$s/SKILL.md"
  fi
done

# Skills de design-system
for s in "${REPO_ROOT}/skills/design-system"/*/; do
  skill_name="$(basename "$s")"
  if [[ -f "$s/SKILL.md" ]]; then
    sync_skill "$skill_name" "$s/SKILL.md"
  fi
done

# Skills generales
for s in "${REPO_ROOT}/skills/generales"/*/; do
  skill_name="$(basename "$s")"
  if [[ -f "$s/SKILL.md" ]]; then
    sync_skill "$skill_name" "$s/SKILL.md"
  fi
done

echo "✅ Skills individuales sincronizadas en ${GLOBAL_SKILLS_DIR}"

# 4. Sincronizar workflows como skills globales (wf-*)
sync_skill "wf-front-feature" "${REPO_ROOT}/workflows/front/feature.md"
sync_skill "wf-front-bugfix" "${REPO_ROOT}/workflows/front/bugfix.md"
sync_skill "wf-back-feature" "${REPO_ROOT}/workflows/back/feature.md"
sync_skill "wf-back-bugfix" "${REPO_ROOT}/workflows/back/bugfix.md"
sync_skill "wf-ds-component-migration" "${REPO_ROOT}/workflows/design-system/component-migration.md"
sync_skill "wf-ds-token-sync" "${REPO_ROOT}/workflows/design-system/token-sync.md"
sync_skill "wf-ds-component-new" "${REPO_ROOT}/workflows/design-system/component-new.md"

echo "✅ Pipelines wf-* sincronizados en ${GLOBAL_SKILLS_DIR}"
echo "🎉 ¡Sincronización completa!"

