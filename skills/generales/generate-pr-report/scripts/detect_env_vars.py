#!/usr/bin/env python3
"""
detect_env_vars.py — Escáner Automatizado de Variables de Entorno (Stack-Aware)
=============================================================================
Herramienta de extracción, clasificación y reporte de variables de entorno
para Enterprise Production Platform, diseñada para la skill `generate-pr-report`.

Analiza el diff three-dot (BASE...HEAD) para detectar:
  - Variables de entorno nuevas agregadas en código (Next.js, LoopBack 4, NestJS, Go, Vite, Python).
  - Variables en archivos de entorno y despliegue (.env*, docker-compose, ecosystem PM2, CI/CD).
  - Renombres de claves existentes (ej. MXM_KEYCLOAK_FRONTEND_CLIENT_ID -> MXM_KEYCLOAK_PUBLIC_CLIENT_ID).
  - Detección de fallbacks (??, ||, zod .default(), .optional()) y criticidad de arranque.
  - Generación de tabla Markdown oficial para el reporte de PR/MR y salida estructurada JSON.

Uso:
  python scripts/detect_env_vars.py [opciones]

Opciones:
  --base <rama>        Rama base de comparación (por defecto: develop, fallback a origin/develop o main)
  --head <ref>         Puntero HEAD o commit a evaluar (por defecto: HEAD)
  --repo <path>        Ruta del repositorio Git a escanear (por defecto: directorio actual)
  --diff-file <path>   Archivo con el diff o '-' para leer de stdin (omite invocación de git)
  --format <formato>   Formato de salida: 'markdown' (por defecto) o 'json'
  --output <path>      Guardar el reporte en un archivo en vez de stdout
  --ignore <vars>      Lista separada por comas de variables adicionales a ignorar
  --test               Ejecutar suite interna de pruebas unitarias
"""

import sys
import os
import re
import json
import argparse
import subprocess
import difflib
from typing import List, Dict, Tuple, Optional, Set

# --- Constantes y Variables del Sistema a Ignorar ---

SYSTEM_ENV_VARS: Set[str] = {
    "NODE_ENV", "PORT", "HOST", "PWD", "HOME", "USER", "HOSTNAME",
    "PATH", "SHELL", "TERM", "LANG", "LC_ALL", "TZ", "CI",
    "DEBUG", "VERBOSE", "SHLVL", "_", "EDITOR", "TMPDIR", "TEMP"
}

CODE_EXTENSIONS = {
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".go", ".py", ".rb", ".php", ".java", ".cs", ".rs"
}

CONFIG_FILENAMES = {
    ".env", ".env.example", ".env.sample", ".env.template",
    ".env.local", ".env.development", ".env.test", ".env.production",
    ".env.staging", ".gitlab-ci.yml", "ecosystem.config.js"
}


# --- Estructura de Datos de Variable Detectada ---

class DetectedVar:
    def __init__(
        self,
        name: str,
        file_path: str,
        service: str = "",
        var_type: str = "Server",
        required: str = "Sí — sin fallback",
        impact: str = "Funcionalidad afectada o error en runtime si no se define en .env",
        renamed_from: Optional[str] = None,
        has_fallback: bool = False,
        line_content: str = "",
        line_num: int = 0
    ):
        self.name = name.strip()
        self.file_path = file_path.replace("\\", "/")
        self.service = service.replace("\\", "/")
        self.var_type = var_type
        self.required = required
        self.impact = impact
        self.renamed_from = renamed_from
        self.has_fallback = has_fallback
        self.line_content = line_content.strip()
        self.line_num = line_num

    @property
    def display_source(self) -> str:
        clean_path = self.file_path
        if self.service:
            srv_prefix = self.service.rstrip("/") + "/"
            if clean_path.startswith(srv_prefix):
                rel_file = clean_path[len(srv_prefix):]
            else:
                rel_file = clean_path
            return f"`{self.service}` — `{rel_file}`"
        return f"`{clean_path}`"

    def to_dict(self) -> Dict:
        return {
            "name": self.name,
            "service": self.service or None,
            "file": self.file_path,
            "display_source": self.display_source.replace("`", ""),
            "type": self.var_type,
            "required": self.required,
            "impact": self.impact,
            "renamed_from": self.renamed_from,
            "has_fallback": self.has_fallback,
            "line": self.line_num,
            "snippet": self.line_content
        }


# --- Extracción de Servicio en Repositorios Multi-Servicio ---

def extract_service_prefix(file_path: str, repo_root: Optional[str] = None) -> Tuple[str, str]:
    """
    Identifica si un archivo pertenece a un subdirectorio de servicio
    (ej: turner/src/config/keys.ts -> ('turner/', 'src/config/keys.ts')).
    """
    normalized = file_path.replace("\\", "/").lstrip("./")
    parts = normalized.split("/")

    if len(parts) > 1:
        first_dir = parts[0]
        known_service_indicators = {
            "backend", "turner", "cronjob", "files", "frontend",
            "client", "server", "api", "auth", "gateway", "notification",
            "reporting", "worker", "services", "apps", "packages"
        }

        if repo_root:
            candidate_pkg = os.path.join(repo_root, first_dir, "package.json")
            if os.path.isfile(candidate_pkg):
                return f"{first_dir}/", "/".join(parts[1:])

        if first_dir.lower() in known_service_indicators or first_dir.endswith("-service"):
            return f"{first_dir}/", "/".join(parts[1:])

    return "", normalized


# --- Parser de Diff Unificado ---

class DiffParser:
    """
    Parsea diffs unified de git extrayendo archivos, adiciones (+) y eliminaciones (-).
    """
    def __init__(self, diff_text: str):
        self.diff_text = diff_text
        self.files_added_lines: Dict[str, List[Tuple[int, str]]] = {}
        self.files_deleted_lines: Dict[str, List[Tuple[int, str]]] = {}

    def parse(self):
        current_file = None
        line_num = 0

        for raw_line in self.diff_text.splitlines():
            if raw_line.startswith("diff --git "):
                match = re.search(r"diff --git a/(.*?) b/(.*)", raw_line)
                if match:
                    current_file = match.group(2)
                else:
                    current_file = None
                continue

            if raw_line.startswith("+++ b/"):
                current_file = raw_line[6:].strip()
                if current_file.startswith("dev/null"):
                    current_file = None
                continue

            if raw_line.startswith("--- a/") and not current_file:
                current_file = raw_line[6:].strip()
                continue

            if raw_line.startswith("@@"):
                match = re.search(r"\+(\d+)", raw_line)
                if match:
                    line_num = int(match.group(1)) - 1
                continue

            if not current_file:
                continue

            if raw_line.startswith("+") and not raw_line.startswith("+++"):
                line_num += 1
                content = raw_line[1:]
                if current_file not in self.files_added_lines:
                    self.files_added_lines[current_file] = []
                self.files_added_lines[current_file].append((line_num, content))

            elif raw_line.startswith("-") and not raw_line.startswith("---"):
                content = raw_line[1:]
                if current_file not in self.files_deleted_lines:
                    self.files_deleted_lines[current_file] = []
                self.files_deleted_lines[current_file].append((line_num, content))

            elif not raw_line.startswith("\\"):
                line_num += 1


# --- Analizador de Variables de Entorno ---

class EnvVarScanner:
    """
    Escanea adiciones y eliminaciones en el diff para clasificar variables según stack.
    """
    def __init__(
        self,
        diff_parser: DiffParser,
        repo_root: Optional[str] = None,
        custom_ignores: Optional[Set[str]] = None
    ):
        self.parser = diff_parser
        self.repo_root = repo_root
        self.ignores = set(SYSTEM_ENV_VARS)
        if custom_ignores:
            self.ignores.update(custom_ignores)

    def _is_comment(self, line: str, filename: str) -> bool:
        """Determina si una línea es un comentario en el lenguaje respectivo."""
        stripped = line.strip()
        if not stripped:
            return True

        if stripped.startswith("//") or stripped.startswith("/*") or stripped.startswith("*"):
            return True

        if stripped.startswith("#"):
            return True

        if stripped.startswith("<!--"):
            return True

        return False

    def _has_fallback(self, line: str) -> bool:
        """Heurística para detectar si la variable cuenta con valor por defecto o fallback."""
        if "??" in line or "||" in line:
            return True

        if re.search(r"\.(?:default|optional)\s*\(", line):
            return True

        if re.search(r"\?\s*[^:]+\s*:", line):
            return True

        if re.search(r'os\.(?:environ\.get|getenv)\s*\([^,)]+,\s*[^)]+\)', line):
            return True

        if re.search(r'config(?:Service)?\.get(?:<[^>]+>)?\s*\([^,)]+,\s*[^)]+\)', line):
            return True

        return False

    def _has_explicit_throw(self, line: str) -> bool:
        """Determina si la línea lanza excepción explícita si falta la variable."""
        return bool(re.search(r'\bthrow\s+(?:new\s+)?(?:Error|[A-Z]\w*Exception)\b', line))

    def _extract_vars_from_line(self, line: str, filename: str) -> List[str]:
        """Extrae nombres de variables de entorno de una línea de código o configuración."""
        found = set()
        basename = os.path.basename(filename)

        if basename.startswith(".env"):
            match = re.match(r"^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=", line)
            if match:
                found.add(match.group(1))
            return list(found)

        if "docker-compose" in basename or "compose" in basename:
            match_item = re.match(r"^\s*-\s*([A-Za-z_][A-Za-z0-9_]*)(?:=.*)?$", line)
            if match_item:
                found.add(match_item.group(1))
            match_kv = re.match(r"^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*.*$", line)
            if match_kv:
                candidate = match_kv.group(1)
                compose_keys = {"version", "services", "networks", "volumes", "environment", "env_file", "ports", "build", "image", "restart", "command"}
                if candidate not in compose_keys:
                    found.add(candidate)
            return list(found)

        if "ecosystem" in basename:
            for match in re.finditer(r"([A-Za-z_][A-Za-z0-9_]*)\s*:\s*['\"`]", line):
                candidate = match.group(1)
                if candidate not in {"NODE_ENV", "name", "script", "instances", "autorestart", "watch", "max_memory_restart", "env", "env_production"}:
                    found.add(candidate)

        if basename.endswith(".yml") or basename.endswith(".yaml"):
            match_var = re.match(r"^\s*([A-Z_][A-Z0-9_]*)\s*:", line)
            if match_var:
                candidate = match_var.group(1)
                if candidate.isupper() and len(candidate) > 2:
                    found.add(candidate)

        for m in re.finditer(r"process\.env\.([A-Za-z_][A-Za-z0-9_]*)", line):
            found.add(m.group(1))

        for m in re.finditer(r"process\.env\[['\"]([A-Za-z_][A-Za-z0-9_]*)['\"]\]", line):
            found.add(m.group(1))

        for m in re.finditer(r"\b(NEXT_PUBLIC_[A-Za-z0-9_]+)\b", line):
            found.add(m.group(1))

        for m in re.finditer(r"import\.meta\.env\.([A-Za-z_][A-Za-z0-9_]*)", line):
            found.add(m.group(1))

        for m in re.finditer(r'os\.(?:Getenv|LookupEnv)\s*\(\s*["\']([A-Za-z_][A-Za-z0-9_]*)["\']\s*\)', line):
            found.add(m.group(1))

        for m in re.finditer(r'os\.(?:environ\.get|getenv)\s*\(\s*["\']([A-Za-z_][A-Za-z0-9_]*)["\']', line):
            found.add(m.group(1))
        for m in re.finditer(r'os\.environ\s*\[\s*["\']([A-Za-z_][A-Za-z0-9_]*)["\']\s*\]', line):
            found.add(m.group(1))

        for m in re.finditer(r'config(?:Service)?\.get(?:<[^>]+>)?\s*\(\s*["\']([A-Za-z_][A-Za-z0-9_]*)["\']', line):
            found.add(m.group(1))

        if "envServer" in filename or "envClient" in filename or ("config" in filename and ("env" in basename or "schema" in basename)):
            match_zod = re.search(r"^\s*([A-Za-z_][A-Za-z0-9_]*)\s*:\s*z\.", line)
            if match_zod:
                found.add(match_zod.group(1))

        if "config/keys.ts" in filename or "config/keys.js" in filename:
            for m in re.finditer(r"export\s+const\s+([A-Za-z_][A-Za-z0-9_]*)\s*=", line):
                candidate = m.group(1)
                if candidate.isupper() or candidate.startswith("MXM_") or "KEY" in candidate:
                    found.add(candidate)
            for m in re.finditer(r"BindingKey\.create(?:<[^>]+>)?\s*\(\s*['\"]([^'\"]+)['\"]", line):
                candidate = m.group(1)
                if candidate.isupper() or "keys." in candidate.lower():
                    clean_k = candidate.split(".")[-1]
                    if clean_k.isupper():
                        found.add(clean_k)

        return list(found)

    def scan(self) -> List[DetectedVar]:
        """Realiza el escaneo completo y clasificación."""
        added_candidates: List[Tuple[str, str, int, str]] = []
        deleted_candidates: List[Tuple[str, str, int, str]] = []

        for file_path, lines in self.parser.files_added_lines.items():
            for line_num, content in lines:
                if self._is_comment(content, file_path):
                    continue
                extracted = self._extract_vars_from_line(content, file_path)
                for var_name in extracted:
                    if var_name not in self.ignores:
                        added_candidates.append((var_name, file_path, line_num, content))

        for file_path, lines in self.parser.files_deleted_lines.items():
            for line_num, content in lines:
                if self._is_comment(content, file_path):
                    continue
                extracted = self._extract_vars_from_line(content, file_path)
                for var_name in extracted:
                    if var_name not in self.ignores:
                        deleted_candidates.append((var_name, file_path, line_num, content))

        deleted_var_names = {c[0] for c in deleted_candidates}

        renamed_map: Dict[str, str] = {}
        remaining_deleted = set(deleted_var_names)

        added_unique_names = {c[0] for c in added_candidates}
        for added_name in added_unique_names:
            if added_name in deleted_var_names:
                continue

            best_match = None
            best_score = 0.0

            for del_name in remaining_deleted:
                if del_name in added_unique_names:
                    continue
                
                tokens_add = set(added_name.split("_"))
                tokens_del = set(del_name.split("_"))
                common_tokens = tokens_add.intersection(tokens_del)

                seq_ratio = difflib.SequenceMatcher(None, added_name, del_name).ratio()

                score = seq_ratio
                if len(common_tokens) >= 2:
                    score += 0.25

                if score > 0.60 and score > best_score:
                    best_score = score
                    best_match = del_name

            if best_match:
                renamed_map[added_name] = best_match
                remaining_deleted.remove(best_match)

        results_by_var: Dict[str, DetectedVar] = {}

        for var_name, file_path, line_num, content in added_candidates:
            service, rel_file = extract_service_prefix(file_path, self.repo_root)

            is_priority_file = any(p in file_path for p in ["keys.ts", "envClient.ts", "envServer.ts", ".env.example", "docker-compose"])
            if var_name in results_by_var:
                existing = results_by_var[var_name]
                if not any(p in existing.file_path for p in ["keys.ts", "envClient.ts", "envServer.ts"]) and is_priority_file:
                    pass
                else:
                    continue

            if var_name in renamed_map:
                var_type = "Renombrada"
            elif var_name.startswith("NEXT_PUBLIC_") or var_name.startswith("VITE_"):
                var_type = "Client"
            else:
                var_type = "Server"

            has_fb = self._has_fallback(content)
            has_throw = self._has_explicit_throw(content)
            is_loopback_key = "keys.ts" in file_path or ("config" in file_path and service.startswith("turner"))

            if var_type == "Renombrada":
                required = "Sí — renombrar en .env"
                old_name = renamed_map[var_name]
                impact = f"El servicio lee `undefined` si mantiene `{old_name}`; actualizar clave en `.env` (el valor se reutiliza)"
                renamed_from = old_name
            elif is_loopback_key:
                required = "Sí — falla arranque"
                srv_name = service.rstrip("/") or "servicio"
                impact = f"`{srv_name}` no inicia (`EnvLoader` lanza excepción al boot si falta la clave)"
                renamed_from = None
            elif has_throw:
                required = "Sí — falla arranque"
                srv_name = service.rstrip("/") or "servicio"
                impact = f"`{srv_name}` falla al iniciar o ejecutar (lanzamiento explícito de excepción)"
                renamed_from = None
            elif var_type == "Client":
                if has_fb:
                    required = "No — tiene default"
                    impact = "Usa valor por defecto en cliente; requiere rebuild del frontend si se personaliza"
                else:
                    required = "Sí — sin fallback"
                    impact = "Funcionalidad rota en frontend; requiere rebuild del bundle (inyección en build-time)"
                renamed_from = None
            else:
                if has_fb:
                    required = "No — tiene default"
                    impact = "Comportamiento por defecto activo; no bloquea arranque"
                else:
                    required = "Sí — sin fallback"
                    srv_name = service.rstrip("/") or "servicio"
                    impact = f"Funcionalidad o servicio afectado en runtime si `{var_name}` no se define en `.env`"
                renamed_from = None

            results_by_var[var_name] = DetectedVar(
                name=var_name,
                file_path=file_path,
                service=service,
                var_type=var_type,
                required=required,
                impact=impact,
                renamed_from=renamed_from,
                has_fallback=has_fb,
                line_content=content,
                line_num=line_num
            )

        priority_order = {
            "Sí — falla arranque": 0,
            "Sí — renombrar en .env": 1,
            "Sí — sin fallback": 2,
            "No — tiene default": 3
        }

        return sorted(
            results_by_var.values(),
            key=lambda v: (priority_order.get(v.required, 99), v.service, v.name)
        )


# --- Resolución con Git ---

class GitResolver:
    """Gestiona la interacción con git (merge-base, diff three-dot)."""
    def __init__(self, repo_dir: str = "."):
        self.repo_dir = repo_dir

    def _run_git(self, args: List[str]) -> Tuple[int, str]:
        try:
            cmd = ["git"] + args
            res = subprocess.run(
                cmd,
                cwd=self.repo_dir,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                encoding="utf-8",
                errors="replace"
            )
            return res.returncode, res.stdout.strip()
        except Exception as e:
            return 1, str(e)

    def resolve_base_branch(self, requested_base: str = "develop") -> str:
        """Encuentra la rama base válida (develop, origin/develop, main, origin/main)."""
        candidates = [
            requested_base,
            f"origin/{requested_base}",
            "develop",
            "origin/develop",
            "main",
            "origin/main",
            "master",
            "origin/master"
        ]

        for cand in candidates:
            code, _ = self._run_git(["rev-parse", "--verify", "-q", cand])
            if code == 0:
                return cand

        return requested_base

    def get_merge_base(self, base: str, head: str = "HEAD") -> Optional[str]:
        code, output = self._run_git(["merge-base", base, head])
        if code == 0 and output:
            return output
        return None

    def get_three_dot_diff(self, base: str, head: str = "HEAD") -> Tuple[int, str]:
        """Ejecuta git diff base...HEAD -M."""
        return self._run_git(["diff", f"{base}...{head}", "-M"])


# --- Formateo y Generación de Reportes ---

class ReportFormatter:
    """Formatea la lista de variables detectadas en Markdown o JSON."""

    @staticmethod
    def to_markdown(variables: List[DetectedVar], base_branch: str = "develop") -> str:
        if not variables:
            return f"*No se detectaron nuevas variables de entorno en el diff contra `{base_branch}`.*"

        lines = [
            "## 🚨 ACCIÓN REQUERIDA — Variables de entorno nuevas (si aplica)",
            "",
            f"> ⚠️ **ACCIÓN REQUERIDA:** crear las siguientes variables de entorno en los ambientes antes del deploy. Se detectaron como nuevas contra el merge-base de `{base_branch}`.",
            "",
            "| Variable | Servicio / Archivo | Tipo | ¿Obligatoria? | Impacto si falta |",
            "|---|---|---|---|---|"
        ]

        renamed_vars = []
        for v in variables:
            lines.append(f"| `{v.name}` | {v.display_source} | {v.var_type} | {v.required} | {v.impact} |")
            if v.renamed_from:
                renamed_vars.append((v.renamed_from, v.name))

        lines.append("")

        if renamed_vars:
            lines.append("> ℹ️ **Variables renombradas:**")
            for old_name, new_name in renamed_vars:
                lines.append(f"> - La clave `{old_name}` se renombró a `{new_name}`: actualizar el nombre en el `.env` de todos los ambientes (el valor se reutiliza).")
            lines.append("")

        lines.append("> ⚠️ **Nota:** Recordá que el archivo `.env` suele estar en `.gitignore`. Las variables deben crearse manualmente en el `.env` de cada servicio (dev / test / prod), además de actualizar `.env.example`, `docker-compose*.yml` o `ecosystem.config.js` si corresponde.")

        return "\n".join(lines)

    @staticmethod
    def to_json(variables: List[DetectedVar], base_branch: str = "develop", head: str = "HEAD") -> str:
        data = {
            "base": base_branch,
            "head": head,
            "count": len(variables),
            "variables": [v.to_dict() for v in variables]
        }
        return json.dumps(data, indent=2, ensure_ascii=False)


# --- Suite de Pruebas Unitarias Embebida (`--test`) ---

def run_internal_tests():
    """Ejecuta pruebas unitarias integradas sobre diffs sintéticos."""
    import unittest

    class TestDetectEnvVars(unittest.TestCase):
        def test_nextjs_detection(self):
            sample_diff = """diff --git a/config/envClient.ts b/config/envClient.ts
index 0000000..1111111 100644
--- a/config/envClient.ts
+++ b/config/envClient.ts
@@ -10,2 +10,4 @@ export const clientEnv = {
+  NEXT_PUBLIC_IFRAME_ANP: z.string(),
+  NEXT_PUBLIC_FEATURE_FLAG: z.string().default('false'),
"""
            parser = DiffParser(sample_diff)
            parser.parse()
            scanner = EnvVarScanner(parser)
            vars_found = scanner.scan()

            self.assertEqual(len(vars_found), 2)
            v1 = next(v for v in vars_found if v.name == "NEXT_PUBLIC_IFRAME_ANP")
            self.assertEqual(v1.var_type, "Client")
            self.assertEqual(v1.required, "Sí — sin fallback")

            v2 = next(v for v in vars_found if v.name == "NEXT_PUBLIC_FEATURE_FLAG")
            self.assertEqual(v2.var_type, "Client")
            self.assertEqual(v2.required, "No — tiene default")

        def test_loopback_detection(self):
            sample_diff = """diff --git a/turner/src/config/keys.ts b/turner/src/config/keys.ts
index 0000000..2222222 100644
--- a/turner/src/config/keys.ts
+++ b/turner/src/config/keys.ts
@@ -5,2 +5,3 @@ export namespace TurnerConfigKeys {
+  export const MXM_KEY_TURNER = BindingKey.create<string>('keys.MXM_KEY_TURNER');
"""
            parser = DiffParser(sample_diff)
            parser.parse()
            scanner = EnvVarScanner(parser)
            vars_found = scanner.scan()

            self.assertEqual(len(vars_found), 1)
            v = vars_found[0]
            self.assertEqual(v.name, "MXM_KEY_TURNER")
            self.assertEqual(v.service, "turner/")
            self.assertEqual(v.required, "Sí — falla arranque")
            self.assertIn("EnvLoader", v.impact)

        def test_rename_detection(self):
            sample_diff = """diff --git a/backend/src/config/keys.ts b/backend/src/config/keys.ts
index 0000000..3333333 100644
--- a/backend/src/config/keys.ts
+++ b/backend/src/config/keys.ts
@@ -12,2 +12,2 @@
-  export const MXM_KEYCLOAK_FRONTEND_CLIENT_ID = 'old';
+  export const MXM_KEYCLOAK_PUBLIC_CLIENT_ID = 'new';
"""
            parser = DiffParser(sample_diff)
            parser.parse()
            scanner = EnvVarScanner(parser)
            vars_found = scanner.scan()

            self.assertEqual(len(vars_found), 1)
            v = vars_found[0]
            self.assertEqual(v.name, "MXM_KEYCLOAK_PUBLIC_CLIENT_ID")
            self.assertEqual(v.var_type, "Renombrada")
            self.assertEqual(v.renamed_from, "MXM_KEYCLOAK_FRONTEND_CLIENT_ID")
            self.assertEqual(v.required, "Sí — renombrar en .env")

        def test_ignore_system_and_comments(self):
            sample_diff = """diff --git a/server.js b/server.js
index 0000000..4444444 100644
--- a/server.js
+++ b/server.js
@@ -1,2 +1,4 @@
+// process.env.SHOULD_BE_IGNORED_COMMENT
+const port = process.env.PORT || 3000;
+const customVar = process.env.MY_CUSTOM_SECRET;
"""
            parser = DiffParser(sample_diff)
            parser.parse()
            scanner = EnvVarScanner(parser)
            vars_found = scanner.scan()

            self.assertEqual(len(vars_found), 1)
            self.assertEqual(vars_found[0].name, "MY_CUSTOM_SECRET")

    suite = unittest.TestLoader().loadTestsFromTestCase(TestDetectEnvVars)
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    sys.exit(0 if result.wasSuccessful() else 1)


# --- CLI Principal ---

def main():
    parser = argparse.ArgumentParser(
        description="Escaneo automatizado de variables de entorno para generate-pr-report."
    )
    parser.add_argument("--base", default="develop", help="Rama base (por defecto: develop)")
    parser.add_argument("--head", default="HEAD", help="Commit/rama actual (por defecto: HEAD)")
    parser.add_argument("--repo", default=".", help="Ruta al repositorio Git (por defecto: .)")
    parser.add_argument("--diff-file", help="Ruta a archivo con el git diff o '-' para leer de stdin")
    parser.add_argument("--format", choices=["markdown", "json"], default="markdown", help="Formato de salida")
    parser.add_argument("--output", help="Ruta de archivo para guardar el reporte")
    parser.add_argument("--ignore", help="Variables adicionales a ignorar (separadas por comas)")
    parser.add_argument("--test", action="store_true", help="Ejecutar suite de pruebas internas")

    args = parser.parse_args()

    if args.test:
        run_internal_tests()
        return

    diff_text = ""
    effective_base = args.base

    if args.diff_file:
        if args.diff_file == "-":
            diff_text = sys.stdin.read()
        else:
            with open(args.diff_file, "r", encoding="utf-8", errors="replace") as f:
                diff_text = f.read()
    else:
        git_res = GitResolver(args.repo)
        effective_base = git_res.resolve_base_branch(args.base)
        mb = git_res.get_merge_base(effective_base, args.head)

        if not mb:
            sys.stderr.write(f"[WARN] No se pudo resolver merge-base entre '{effective_base}' y '{args.head}'.\n")
            code, diff_text = git_res._run_git(["diff", f"{effective_base}..{args.head}", "-M"])
        else:
            code, diff_text = git_res.get_three_dot_diff(effective_base, args.head)

        if code != 0:
            sys.stderr.write(f"[ERROR] Falló git diff: {diff_text}\n")
            sys.exit(1)

    if not diff_text.strip():
        if args.format == "json":
            print(json.dumps({"base": effective_base, "head": args.head, "count": 0, "variables": []}))
        else:
            print(f"*No se detectaron cambios en el diff contra `{effective_base}`.*")
        return

    custom_ignores = set()
    if args.ignore:
        custom_ignores = {item.strip() for item in args.ignore.split(",") if item.strip()}

    diff_parser = DiffParser(diff_text)
    diff_parser.parse()

    scanner = EnvVarScanner(diff_parser, repo_root=args.repo, custom_ignores=custom_ignores)
    detected = scanner.scan()

    if args.format == "json":
        output_str = ReportFormatter.to_json(detected, base_branch=effective_base, head=args.head)
    else:
        output_str = ReportFormatter.to_markdown(detected, base_branch=effective_base)

    if args.output:
        with open(args.output, "w", encoding="utf-8") as f:
            f.write(output_str + "\n")
        print(f"Reporte de variables guardado exitosamente en: {args.output}")
    else:
        print(output_str)


if __name__ == "__main__":
    main()
