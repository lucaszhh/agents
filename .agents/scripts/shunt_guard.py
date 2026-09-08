#!/usr/bin/env python3
"""
Deterministic Shunting Guard - PreToolUse Hook para Enterprise Production Platform.
Protección determinista contra desperdicio de tokens y context bloat en modelos de frontera.

Bloquea lecturas masivas de archivos (>350 líneas) forzando el uso de herramientas de grafo
semántico (codebase-memory-mcp o graphify), lecturas quirúrgicas o delegación a subagentes Flash.
"""

import sys
import json
import os

SHUNT_THRESHOLD_LINES = 350
SURGICAL_MAX_RANGE = 250

def parse_input():
    try:
        raw = sys.stdin.read()
        if not raw.strip():
            return {}
        return json.loads(raw)
    except Exception:
        return {}

def count_lines(filepath):
    try:
        with open(filepath, 'rb') as f:
            lines = 0
            buf_size = 1024 * 1024
            read_buf = f.raw.read if hasattr(f, 'raw') else f.read
            buf = read_buf(buf_size)
            while buf:
                lines += buf.count(b'\n')
                buf = read_buf(buf_size)
            return lines
    except Exception:
        return 0

def detect_graph_flavor(target_path, workspace_paths=None):
    """
    Detecta si el proyecto utiliza graphify (presencia de graphify-out/)
    o codebase-memory-mcp para adaptar el mensaje de asistencia.
    """
    candidates = []
    if workspace_paths:
        candidates.extend(workspace_paths)
    if target_path:
        # Walk up from target_path to find graphify-out
        cur = os.path.dirname(os.path.abspath(target_path))
        while cur and cur != os.path.dirname(cur):
            candidates.append(cur)
            cur = os.path.dirname(cur)
    candidates.append(os.getcwd())

    for path in candidates:
        if not path or not os.path.isdir(path):
            continue
        g_out = os.path.join(path, "graphify-out")
        if os.path.exists(g_out) and os.path.isdir(g_out):
            return "graphify"

    return "codebase-memory"

def build_graph_guidance(flavor):
    if flavor == "graphify":
        return (
            "1. Grafo detectado (Graphify):\n"
            "   - Ejecutá 'graphify query \"<pregunta o símbolo>\"' o 'query_graph' (MCP).\n"
            "   - Usá 'graphify path \"<A>\" \"<B>\"' para relaciones y 'graphify explain \"<concepto>\"'.\n"
            "   - Si existe 'graphify-out/wiki/index.md', navegá la wiki en lugar de leer el archivo completo."
        )
    else:
        return (
            "1. Grafo de Código (codebase-memory-mcp):\n"
            "   - Usá 'search_graph' para ubicar funciones, clases y rutas por patrón.\n"
            "   - Usá 'get_code_snippet' para extraer únicamente la función o clase requerida.\n"
            "   - Usá 'trace_path' para verificar quién llama al componente sin leer el archivo entero.\n"
            "   *(Si el repo usa graphify en graphify-out/, usá 'graphify query' o 'query_graph')*."
        )

def evaluate_view_file(args, workspace_paths=None):
    path = args.get("AbsolutePath") or args.get("target_file") or args.get("path")
    if not path or not os.path.isabs(path) or not os.path.exists(path):
        return {"decision": "allow"}

    # Exclude directories
    if os.path.isdir(path):
        return {"decision": "allow"}

    line_count = count_lines(path)
    if line_count <= SHUNT_THRESHOLD_LINES:
        return {"decision": "allow"}

    # File is larger than threshold (>350 lines)
    start_line = args.get("StartLine") or args.get("start_line")
    end_line = args.get("EndLine") or args.get("end_line")

    if start_line is not None and end_line is not None:
        try:
            start_val = int(start_line)
            end_val = int(end_line)
            span = end_val - start_val + 1
            if span <= SURGICAL_MAX_RANGE:
                return {"decision": "allow"}
        except (ValueError, TypeError):
            pass

    filename = os.path.basename(path)
    flavor = detect_graph_flavor(path, workspace_paths)
    graph_advice = build_graph_guidance(flavor)

    reason = (
        f"🚨 [Enterprise Shunting Policy]: El archivo '{filename}' tiene {line_count} líneas (supera el límite de {SHUNT_THRESHOLD_LINES} líneas de Enterprise).\n"
        f"Para preservar el contexto y evitar consumo innecesario de tokens en modelos de frontera:\n\n"
        f"{graph_advice}\n"
        f"2. Lectura quirúrgica: Especificá 'StartLine' y 'EndLine' (rango recomendado \u2264 {SURGICAL_MAX_RANGE} líneas).\n"
        f"3. Ingesta masiva: Si requerís analizar el módulo completo, delegá en un subagente @explorer (modelo Flash/ligero) para sintetizar en docs/context_*.md (< 150 líneas)."
    )
    return {
        "decision": "deny",
        "reason": reason
    }

def evaluate_run_command(args, workspace_paths=None):
    cmd = args.get("CommandLine") or args.get("command") or ""
    if not cmd.strip():
        return {"decision": "allow"}

    raw_tokens = cmd.strip().split()
    if not raw_tokens:
        return {"decision": "allow"}

    first_cmd = os.path.basename(raw_tokens[0])
    has_pipe = "|" in cmd or ">" in cmd

    if first_cmd in ("cat", "more", "less") and not has_pipe:
        for arg in raw_tokens[1:]:
            if arg.startswith("-"):
                continue
            if os.path.isfile(arg):
                lines = count_lines(arg)
                if lines > SHUNT_THRESHOLD_LINES:
                    filename = os.path.basename(arg)
                    flavor = detect_graph_flavor(arg, workspace_paths)
                    graph_tool = "graphify query" if flavor == "graphify" else "codebase-memory-mcp"
                    return {
                        "decision": "deny",
                        "reason": (
                            f"🚨 [Enterprise Shunting Policy]: Se intentó volcar '{filename}' ({lines} líneas) en consola.\n"
                            f"Evitá comandos masivos sin filtrado. Usá tuberías ('grep', 'head -n 50') o consultá el grafo con {graph_tool}."
                        )
                    }

    return {"decision": "allow"}

def main():
    try:
        payload = parse_input()
        tool_call = payload.get("toolCall", {})
        tool_name = tool_call.get("name", "")
        tool_args = tool_call.get("args", {})
        workspace_paths = payload.get("workspacePaths", [])

        if tool_name in ("view_file", "read_file", "read_file_contents"):
            result = evaluate_view_file(tool_args, workspace_paths)
        elif tool_name == "run_command":
            result = evaluate_run_command(tool_args, workspace_paths)
        else:
            result = {"decision": "allow"}

        sys.stdout.write(json.dumps(result))
        sys.stdout.flush()
    except Exception:
        sys.stdout.write(json.dumps({"decision": "allow"}))
        sys.stdout.flush()

if __name__ == "__main__":
    main()
