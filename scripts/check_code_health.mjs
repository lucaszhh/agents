#!/usr/bin/env node

/**
 * check_code_health.mjs
 * 
 * Script multiplataforma (Node.js ES Module) para ejecutar los 4 checks de Code Health
 * de proyectos Next.js / TypeScript sin depender de pipes de bash (grep, awk, xargs, tee, etc.).
 * 
 * Checks:
 *   1. Linter (ESLint) — 3 puntos
 *   2. TypeScript (tsc / typecheck) — 3 puntos
 *   3. Estructura de módulos — 2 puntos
 *   4. Deuda técnica (console, debugger, TODOs) — 1 punto
 *   Bonus / Penalización: Archivos grandes (>1000 líneas -> -1 punto)
 * 
 * Score total: 0 - 10 puntos
 * Soporta output en terminal con colores ANSI y modo puro JSON (--json).
 */

import { existsSync, readFileSync, writeFileSync, appendFileSync, statSync, readdirSync } from 'node:fs';
import { resolve, join, relative, extname, basename } from 'node:path';
import { spawnSync } from 'node:child_process';
import process from 'node:process';

// --- Configuración y Argumentos CLI ---

const args = process.argv.slice(2);

const options = {
  json: args.includes('--json') || args.includes('-j'),
  save: args.includes('--save') || args.includes('-s'),
  help: args.includes('--help') || args.includes('-h'),
  skipLint: args.includes('--no-lint'),
  skipTypecheck: args.includes('--no-typecheck'),
  verbose: args.includes('--verbose') || args.includes('-v'),
  dir: process.cwd()
};

const dirIndex = args.findIndex(arg => arg === '--dir' || arg === '-d');
if (dirIndex !== -1 && args[dirIndex + 1]) {
  options.dir = resolve(args[dirIndex + 1]);
}

if (options.help) {
  console.log(`
Uso: node scripts/check_code_health.mjs [opciones]

Opciones:
  -j, --json          Emite el resultado en formato JSON estándar a stdout
  -s, --save          Guarda el resultado en .health-history.jsonl
  -d, --dir <path>    Directorio raíz del proyecto a evaluar (por defecto: cwd)
  --no-lint           Omitir check de linter
  --no-typecheck      Omitir check de TypeScript
  -v, --verbose       Mostrar detalles de archivos y violaciones encontradas
  -h, --help          Muestra este mensaje de ayuda
`);
  process.exit(0);
}

const rootDir = options.dir;

// --- Funciones de utilidad ---

const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  gray: '\x1b[90m'
};

function colorize(color, text) {
  if (options.json) return text;
  return `${colors[color] || ''}${text}${colors.reset}`;
}

function normalizePath(p) {
  return p.replace(/\\/g, '/');
}

// --- Detección de Entorno ---

function detectEnvironment(dir) {
  const pkgPath = join(dir, 'package.json');
  let pkg = null;
  if (existsSync(pkgPath)) {
    try {
      pkg = JSON.parse(readFileSync(pkgPath, 'utf-8'));
    } catch {
      // Ignorar error de parsing
    }
  }

  let packageManager = 'npm';
  if (existsSync(join(dir, 'pnpm-lock.yaml'))) {
    packageManager = 'pnpm';
  } else if (existsSync(join(dir, 'yarn.lock'))) {
    packageManager = 'yarn';
  } else if (existsSync(join(dir, 'bun.lockb')) || existsSync(join(dir, 'bun.lock'))) {
    packageManager = 'bun';
  } else if (existsSync(join(dir, 'package-lock.json'))) {
    packageManager = 'npm';
  } else if (pkg && pkg.packageManager) {
    if (pkg.packageManager.startsWith('pnpm')) packageManager = 'pnpm';
    else if (pkg.packageManager.startsWith('yarn')) packageManager = 'yarn';
    else if (pkg.packageManager.startsWith('bun')) packageManager = 'bun';
  }

  const scripts = (pkg && pkg.scripts) ? pkg.scripts : {};

  return {
    packageManager,
    scripts,
    hasLint: Boolean(scripts.lint),
    hasTypecheck: Boolean(scripts.typecheck || scripts['type-check']),
    hasTest: Boolean(scripts.test),
    hasBuild: Boolean(scripts.build)
  };
}

// --- Ejecución Segura de Comandos ---

function runCommand(cmd, dir) {
  try {
    const isWindows = process.platform === 'win32';
    const result = spawnSync(cmd, {
      cwd: dir,
      shell: isWindows ? true : '/bin/bash',
      encoding: 'utf-8',
      maxBuffer: 10 * 1024 * 1024,
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const output = (result.stdout || '') + (result.stderr || '');
    return {
      status: result.status ?? 1,
      output: output.trim()
    };
  } catch (err) {
    return {
      status: 1,
      output: err.message || String(err)
    };
  }
}

// --- Check 1: Linter (3 puntos) ---

function checkLinter(dir, env) {
  if (options.skipLint) {
    return {
      status: 'skipped',
      points: 0,
      maxPoints: 3,
      errors: 0,
      warnings: 0,
      command: null,
      topRules: [],
      topIssues: []
    };
  }

  let command = null;
  if (env.hasLint) {
    command = `${env.packageManager} run lint`;
  } else if (existsSync(join(dir, 'eslint.config.mjs')) || existsSync(join(dir, '.eslintrc.json')) || existsSync(join(dir, '.eslintrc.js'))) {
    command = 'npx eslint .';
  }

  if (!command) {
    return {
      status: 'not_configured',
      points: 3, // No penalizar si el proyecto no tiene linter configurado
      maxPoints: 3,
      errors: 0,
      warnings: 0,
      command: null,
      topRules: [],
      topIssues: []
    };
  }

  const { status, output } = runCommand(command, dir);

  let errors = 0;
  let warnings = 0;
  const topIssues = [];
  const ruleCounts = {};

  // Intentar parsear resumen estándar de ESLint
  // Ej: "✖ 5 problems (2 errors, 3 warnings)" o "5 errors and 3 warnings"
  const summaryMatch = output.match(/(\d+)\s+problems?\s*\((?:(\d+)\s+errors?)?(?:[,\s]+)?(?:(\d+)\s+warnings?)?\)/i)
    || output.match(/(\d+)\s+errors?(?:\s+and\s+(\d+)\s+warnings?)?/i);

  if (summaryMatch) {
    if (summaryMatch[2] !== undefined) {
      errors = parseInt(summaryMatch[2] || '0', 10);
      warnings = parseInt(summaryMatch[3] || '0', 10);
    } else {
      errors = parseInt(summaryMatch[1] || '0', 10);
      warnings = parseInt(summaryMatch[2] || '0', 10);
    }
  }

  // Parsear líneas individuales de error / warning para extraer reglas y archivos
  const lines = output.split('\n');
  const lineRegex = /^\s*(\d+):(\d+)\s+(error|warning)\s+(.*?)\s{2,}([@\w\-\/]+)$/;
  let currentFile = '';

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.startsWith('>') || line.startsWith('$')) continue; // Ignorar ecos de npm/pnpm/yarn

    if (line.startsWith('/') || /^[A-Za-z]:\\/.test(line) || (line.endsWith('.ts') || line.endsWith('.tsx') || line.endsWith('.js') || line.endsWith('.jsx'))) {
      currentFile = normalizePath(relative(dir, line.split(' ')[0]));
      continue;
    }

    const match = rawLine.match(lineRegex);
    if (match) {
      const [, lineNum, colNum, severity, message, rule] = match;
      ruleCounts[rule] = (ruleCounts[rule] || 0) + 1;
      if (topIssues.length < 5) {
        topIssues.push({
          file: currentFile,
          line: parseInt(lineNum, 10),
          column: parseInt(colNum, 10),
          severity,
          message,
          rule
        });
      }
    }
  }

  // Si no se encontró un resumen explícito pero el comando falló o tuvo salida
  if (errors === 0 && warnings === 0 && status !== 0) {
    const errorMatches = output.match(/\berror\b/gi);
    const warnMatches = output.match(/\bwarning\b/gi);
    if (errorMatches) errors = errorMatches.length;
    if (warnMatches) warnings = warnMatches.length;
  }

  // Ordenar reglas por frecuencia
  const topRules = Object.entries(ruleCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([rule, count]) => ({ rule, count }));

  // Cálculo de puntos según especificación
  let points = 0;
  if (errors === 0 && warnings === 0) {
    points = 3;
  } else if (errors === 0 && warnings > 0) {
    points = 2;
  } else if (errors >= 1 && errors <= 5) {
    points = 1;
  } else if (errors >= 6 && errors <= 20) {
    points = 0.5;
  } else {
    points = 0;
  }

  return {
    status: errors === 0 ? 'passed' : 'failed',
    points,
    maxPoints: 3,
    errors,
    warnings,
    command,
    topRules,
    topIssues
  };
}

// --- Check 2: TypeScript (3 puntos) ---

function checkTypeScript(dir, env) {
  if (options.skipTypecheck) {
    return {
      status: 'skipped',
      points: 0,
      maxPoints: 3,
      errors: 0,
      command: null,
      topErrors: [],
      errorGroups: {}
    };
  }

  let command = null;
  if (env.hasTypecheck) {
    const scriptName = env.scripts.typecheck ? 'typecheck' : 'type-check';
    command = `${env.packageManager} run ${scriptName}`;
  } else if (existsSync(join(dir, 'tsconfig.json'))) {
    command = 'npx tsc --noEmit';
  }

  if (!command) {
    return {
      status: 'not_configured',
      points: 3,
      maxPoints: 3,
      errors: 0,
      command: null,
      topErrors: [],
      errorGroups: {}
    };
  }

  const { status, output } = runCommand(command, dir);

  let errors = 0;
  const topErrors = [];
  const errorGroups = {};

  // Formato tsc: "path/file.ts(12,5): error TS2322: Type 'X' is not assignable to type 'Y'."
  // o "path/file.ts:12:5 - error TS2322: Type..."
  const tsLines = output.split('\n');
  const tsErrorRegex = /^(.+?)(?:\((\d+),(\d+)\)|:(\d+):(\d+))\s*[-:]\s*error\s*(TS\d+):\s*(.+)$/;

  for (const rawLine of tsLines) {
    const line = rawLine.trim();
    if (line.startsWith('>') || line.startsWith('$')) continue;

    const match = line.match(tsErrorRegex);
    if (match) {
      errors++;
      const file = normalizePath(relative(dir, match[1].trim()));
      const lineNum = parseInt(match[2] || match[4] || '0', 10);
      const col = parseInt(match[3] || match[5] || '0', 10);
      const code = match[6];
      const message = match[7].trim();

      errorGroups[code] = (errorGroups[code] || 0) + 1;

      if (topErrors.length < 5) {
        topErrors.push({ file, line: lineNum, col, code, message });
      }
    }
  }

  // Si no capturó por regex pero el output indica errores
  if (errors === 0 && status !== 0) {
    const summaryMatch = output.match(/Found (\d+) errors?/i);
    if (summaryMatch) {
      errors = parseInt(summaryMatch[1], 10);
    } else {
      const errCount = (output.match(/error TS/g) || []).length;
      if (errCount > 0) errors = errCount;
    }
  }

  let points = 0;
  if (errors === 0) {
    points = 3;
  } else if (errors >= 1 && errors <= 5) {
    points = 1;
  } else {
    points = 0;
  }

  return {
    status: errors === 0 ? 'passed' : 'failed',
    points,
    maxPoints: 3,
    errors,
    command,
    topErrors,
    errorGroups
  };
}

// --- Recorrido de archivos fuente ---

function collectSourceFiles(dir, currentDir = dir) {
  const ignoredDirs = new Set([
    'node_modules', '.git', '.next', 'dist', 'build', 'out',
    'coverage', '.turbo', '.agents', '.gemini'
  ]);

  const validExts = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs']);
  let results = [];

  try {
    const entries = readdirSync(currentDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        if (!ignoredDirs.has(entry.name)) {
          results = results.concat(collectSourceFiles(dir, join(currentDir, entry.name)));
        }
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();
        if (validExts.has(ext)) {
          results.push(join(currentDir, entry.name));
        }
      }
    }
  } catch {
    // Si no se puede leer, continuar
  }

  return results;
}

// --- Check 3: Estructura de Módulos (2 puntos) ---

function checkModuleStructure(dir, files) {
  const violations = {
    appLogic: [],
    muiDirect: [],
    dateFnsFormat: [],
    queryKeys: []
  };

  const srcDir = join(dir, 'src');
  const hasSrc = existsSync(srcDir);

  // Archivos estándar de Next.js App Router
  const standardAppFiles = new Set([
    'page.tsx', 'page.jsx', 'page.js', 'page.ts',
    'layout.tsx', 'layout.jsx', 'layout.js', 'layout.ts',
    'loading.tsx', 'loading.jsx', 'loading.js', 'loading.ts',
    'error.tsx', 'error.jsx', 'error.js', 'error.ts',
    'not-found.tsx', 'not-found.jsx', 'not-found.js', 'not-found.ts',
    'route.ts', 'route.js',
    'template.tsx', 'template.jsx', 'template.js', 'template.ts',
    'default.tsx', 'default.jsx', 'default.js', 'default.ts',
    'global-error.tsx', 'global-error.jsx',
    'middleware.ts', 'middleware.js',
    'robots.ts', 'sitemap.ts', 'manifest.ts',
    'opengraph-image.tsx', 'twitter-image.tsx', 'icon.tsx', 'apple-icon.tsx'
  ]);

  for (const filePath of files) {
    const relPath = normalizePath(relative(dir, filePath));
    const filename = basename(filePath);

    // 1. ¿Hay lógica de negocio en src/app/ que debería estar en src/modules/?
    if (relPath.startsWith('src/app/') || relPath.startsWith('app/')) {
      const isHook = filename.startsWith('use') && (filename.endsWith('.ts') || filename.endsWith('.tsx'));
      const isService = /service|api|client/i.test(filename) && (filename.endsWith('.ts') || filename.endsWith('.tsx'));
      const isDomain = /domain|model|schema|dto/i.test(filename) && (filename.endsWith('.ts') || filename.endsWith('.tsx'));

      if (isHook || isService || isDomain) {
        violations.appLogic.push({
          file: relPath,
          reason: `Lógica de negocio/servicio/hook detectada en el router: '${filename}'. Debe residir en src/modules/`
        });
      }
    }

    // Leer contenido para verificaciones de código
    let content = '';
    try {
      content = readFileSync(filePath, 'utf-8');
    } catch {
      continue;
    }

    const lines = content.split('\n');

    // 2. ¿Hay imports de @mui/* directos o sin subpath fuera del design system?
    // Excluir módulos de design system del repo si existen (src/modules/desingSystem, etc.)
    const isDesignSystemDir = relPath.includes('desingSystem') || relPath.includes('design-system') || relPath.startsWith('packages/');
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;

      // Import de @mui sin subpath (prohibido globalmente: import ... from '@mui/material')
      const rootMuiMatch = line.match(/from\s+['"]@mui\/(material|system|icons-material|x-date-pickers)['"]/);
      if (rootMuiMatch) {
        violations.muiDirect.push({
          file: relPath,
          line: lineNum,
          snippet: line.trim(),
          reason: `Import de '@mui/${rootMuiMatch[1]}' sin subpath. Debe especificar subpath o usar @desingSystem/*`
        });
      } else if (!isDesignSystemDir && /from\s+['"]@mui\//.test(line)) {
        // En src/** fuera de desingSystem, prohibido importar de @mui directo
        violations.muiDirect.push({
          file: relPath,
          line: lineNum,
          snippet: line.trim(),
          reason: `Import directo de '@mui/*' fuera del design system. Debe importarse desde '@desingSystem/*'`
        });
      }

      // 3. ¿Hay imports de date-fns/format en vez de src/modules/core/utils/date.ts?
      const isDateUtil = relPath.endsWith('utils/date.ts') || relPath.endsWith('utils/date.js');
      if (!isDateUtil) {
        if (/from\s+['"]date-fns\/format['"]/.test(line) || (/from\s+['"]date-fns['"]/.test(line) && /\bformat\b/.test(line))) {
          violations.dateFnsFormat.push({
            file: relPath,
            line: lineNum,
            snippet: line.trim(),
            reason: `Uso directo de date-fns format. Debe usarse el helper centralizado 'src/modules/core/utils/date.ts'`
          });
        }
      }

      // 4. Query keys hardcodeadas en React Query
      if (/useQuery\s*\(\s*\{[^}]*queryKey\s*:\s*\[\s*['"`]/.test(line) || /useQuery\s*\(\s*\[\s*['"`]/.test(line)) {
        if (!relPath.includes('query/keys') && !relPath.includes('.spec.') && !relPath.includes('.test.')) {
          violations.queryKeys.push({
            file: relPath,
            line: lineNum,
            snippet: line.trim(),
            reason: `Query key hardcodeada en llamada useQuery. Debe centralizarse en query/keys.ts`
          });
        }
      }
    }
  }

  const totalViolations = violations.appLogic.length + violations.muiDirect.length + violations.dateFnsFormat.length + violations.queryKeys.length;

  let points = 2;
  const isCritical = violations.appLogic.length > 0 || violations.queryKeys.length > 2 || violations.muiDirect.length > 3;

  if (totalViolations === 0) {
    points = 2;
  } else if (!isCritical && totalViolations <= 2) {
    points = 1;
  } else {
    points = 0;
  }

  return {
    status: totalViolations === 0 ? 'passed' : totalViolations <= 2 ? 'warning' : 'failed',
    points,
    maxPoints: 2,
    violations: totalViolations,
    details: violations
  };
}

// --- Check 4: Deuda Técnica (1 punto) ---

function checkTechnicalDebt(dir, files) {
  const details = {
    consoles: [],
    debuggers: [],
    todos: []
  };

  const consoleRegex = /\bconsole\.(log|debug|info)\s*\(/;
  const debuggerRegex = /\bdebugger\b/;
  const todoRegex = /\b(TODO|FIXME|HACK|XXX)\b/i;

  for (const filePath of files) {
    const relPath = normalizePath(relative(dir, filePath));

    // Excluir archivos de test o scripts del conteo estricto
    if (relPath.includes('.spec.') || relPath.includes('.test.') || relPath.startsWith('scripts/')) {
      continue;
    }

    let content = '';
    try {
      content = readFileSync(filePath, 'utf-8');
    } catch {
      continue;
    }

    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const lineNum = i + 1;
      const trimmed = line.trim();

      const isComment = /^\s*(\/\/|\/\*|\*)/.test(line);

      if (!isComment && consoleRegex.test(trimmed)) {
        details.consoles.push({ file: relPath, line: lineNum, snippet: trimmed });
      }

      if (!isComment && debuggerRegex.test(trimmed)) {
        details.debuggers.push({ file: relPath, line: lineNum, snippet: trimmed });
      }

      if (todoRegex.test(trimmed)) {
        details.todos.push({ file: relPath, line: lineNum, snippet: trimmed });
      }
    }
  }

  const totalIssues = details.consoles.length + details.debuggers.length + details.todos.length;

  let points = 1;
  if (totalIssues === 0) {
    points = 1;
  } else if (totalIssues <= 5 && details.debuggers.length === 0) {
    points = 0.5;
  } else {
    points = 0;
  }

  return {
    status: totalIssues === 0 ? 'passed' : totalIssues <= 5 ? 'warning' : 'failed',
    points,
    maxPoints: 1,
    issues: totalIssues,
    details
  };
}

// --- Bonus / Penalización: Archivos Grandes ---

function checkLargeFiles(dir, files) {
  const over500 = [];
  const over1000 = [];

  for (const filePath of files) {
    const relPath = normalizePath(relative(dir, filePath));
    if (relPath.includes('node_modules') || relPath.includes('.next') || relPath.includes('dist')) {
      continue;
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      const lineCount = content.split('\n').length;

      if (lineCount > 1000) {
        over1000.push({ file: relPath, lines: lineCount });
      } else if (lineCount > 500) {
        over500.push({ file: relPath, lines: lineCount });
      }
    } catch {
      // Ignorar errores de lectura
    }
  }

  over500.sort((a, b) => b.lines - a.lines);
  over1000.sort((a, b) => b.lines - a.lines);

  const penalty = over1000.length > 0 ? 1 : 0;

  return {
    over500,
    over1000,
    penalty
  };
}

// --- Historial y Tendencias (.health-history.jsonl) ---

function getHistoryAndTrends(dir, currentScore) {
  const historyPath = join(dir, '.health-history.jsonl');
  let history = [];

  if (existsSync(historyPath)) {
    try {
      const lines = readFileSync(historyPath, 'utf-8').trim().split('\n');
      for (const line of lines) {
        if (!line.trim()) continue;
        history.push(JSON.parse(line));
      }
    } catch {
      // Si falla lectura, ignorar
    }
  }

  if (history.length === 0) {
    return {
      previousScore: null,
      diff: null,
      average: null,
      direction: 'neutral'
    };
  }

  const lastEntry = history[history.length - 1];
  const recentEntries = history.slice(-10);
  const avg = recentEntries.reduce((sum, h) => sum + (h.score || 0), 0) / recentEntries.length;
  const diff = Math.round((currentScore - lastEntry.score) * 10) / 10;

  let direction = 'same';
  if (diff > 0) direction = 'improved';
  else if (diff < 0) direction = 'regressed';

  return {
    previousScore: lastEntry.score,
    diff,
    average: Math.round(avg * 10) / 10,
    direction
  };
}

function saveHistory(dir, metrics) {
  const historyPath = join(dir, '.health-history.jsonl');
  const record = {
    date: new Date().toISOString(),
    score: metrics.score,
    lint: { errors: metrics.checks.lint.errors, warnings: metrics.checks.lint.warnings },
    typescript: { errors: metrics.checks.typescript.errors },
    structure: { violations: metrics.checks.structure.violations },
    debt: { issues: metrics.checks.debt.issues },
    penalties: metrics.largeFiles.penalty
  };

  appendFileSync(historyPath, JSON.stringify(record) + '\n', 'utf-8');
}

// --- Generador de Sugerencias de Fix ---

function generateSuggestions(checks, largeFiles) {
  const suggestions = [];

  if (checks.lint.errors > 0 || checks.lint.warnings > 0) {
    for (const ruleItem of checks.lint.topRules) {
      const r = ruleItem.rule;
      if (r === 'semi') suggestions.push('Linter: agregar punto y coma al final de las sentencias faltantes.');
      else if (r === 'quotes') suggestions.push('Linter: reemplazar comillas dobles por simples.');
      else if (r === 'indent') suggestions.push('Linter: indentar con 2 espacios.');
      else if (r === 'comma-dangle') suggestions.push('Linter: quitar comas al final (trailing commas).');
      else if (r === 'camelcase') suggestions.push('Linter: renombrar identificadores a camelCase.');
      else if (r.includes('@mui')) suggestions.push('Linter: reemplazar imports directos de @mui/* por @desingSystem/*.');
      else suggestions.push(`Linter: corregir violaciones de la regla '${r}' (${ruleItem.count} ocurrencias).`);
    }
  }

  if (checks.typescript.errors > 0) {
    if (checks.typescript.errorGroups['TS2322']) {
      suggestions.push('TypeScript (TS2322): revisar compatibilidad de tipos en props y valores de retorno.');
    }
    if (checks.typescript.errorGroups['TS2307']) {
      suggestions.push('TypeScript (TS2307): módulo no encontrado, verificar paths/alias en tsconfig.json.');
    }
    if (checks.typescript.errorGroups['TS2339']) {
      suggestions.push('TypeScript (TS2339): propiedad inexistente en el tipo, extender interfaz o verificar tipado.');
    }
    if (suggestions.length === 0) {
      suggestions.push(`TypeScript: resolver ${checks.typescript.errors} error(es) de compilación reportados.`);
    }
  }

  if (checks.structure.violations > 0) {
    if (checks.structure.details.appLogic.length > 0) {
      suggestions.push('Estructura: mover lógica de negocio/servicios/hooks desde src/app/ hacia src/modules/<dominio>/.');
    }
    if (checks.structure.details.muiDirect.length > 0) {
      suggestions.push('Estructura: importar componentes visuales desde @desingSystem/* en vez de @mui/* directo.');
    }
    if (checks.structure.details.dateFnsFormat.length > 0) {
      suggestions.push('Estructura: reemplazar imports directos de date-fns/format por src/modules/core/utils/date.ts.');
    }
    if (checks.structure.details.queryKeys.length > 0) {
      suggestions.push('Estructura: centralizar query keys de React Query en query/keys.ts.');
    }
  }

  if (checks.debt.issues > 0) {
    if (checks.debt.details.consoles.length > 0) {
      suggestions.push(`Deuda técnica: remover ${checks.debt.details.consoles.length} llamada(s) a console.(log|debug|info).`);
    }
    if (checks.debt.details.debuggers.length > 0) {
      suggestions.push(`Deuda técnica: eliminar ${checks.debt.details.debuggers.length} sentencia(s) de debugger.`);
    }
    if (checks.debt.details.todos.length > 0) {
      suggestions.push(`Deuda técnica: resolver o documentar ${checks.debt.details.todos.length} comentario(s) TODO/FIXME.`);
    }
  }

  if (largeFiles.over1000.length > 0) {
    suggestions.push(`Archivos grandes: modularizar ${largeFiles.over1000.length} archivo(s) con más de 1000 líneas para eliminar penalización.`);
  }

  return suggestions;
}

// --- Impresión en Consola ---

function printReport(metrics) {
  console.log('\n' + colorize('bold', '======================================================='));
  console.log(colorize('bold', ` 🏥 Code Health Dashboard — ${metrics.project}`));
  console.log(colorize('bold', '=======================================================') + '\n');

  // Tabla de checks
  console.log(colorize('dim', 'Categoría             Estado    Puntos   Detalles'));
  console.log(colorize('dim', '--------------------  --------  -------  --------------------------------'));

  const printRow = (name, check, maxPts, detail) => {
    let statusText = colorize('green', 'PASSED  ');
    if (check.status === 'warning') statusText = colorize('yellow', 'WARNING ');
    if (check.status === 'failed') statusText = colorize('red', 'FAILED  ');
    if (check.status === 'skipped') statusText = colorize('gray', 'SKIPPED ');

    const pts = `${check.points}/${maxPts}`.padEnd(7);
    console.log(`${name.padEnd(20)}  ${statusText}  ${pts}  ${detail}`);
  };

  printRow('1. Linter', metrics.checks.lint, 3, `${metrics.checks.lint.errors} err, ${metrics.checks.lint.warnings} warn`);
  printRow('2. TypeScript', metrics.checks.typescript, 3, `${metrics.checks.typescript.errors} errores de tipo`);
  printRow('3. Estructura', metrics.checks.structure, 2, `${metrics.checks.structure.violations} violaciones`);
  printRow('4. Deuda técnica', metrics.checks.debt, 1, `${metrics.checks.debt.issues} issues (log/todo)`);

  if (metrics.largeFiles.penalty > 0) {
    console.log(colorize('red', `Penalización tamaño   CRÍTICO   -${metrics.largeFiles.penalty}      ${metrics.largeFiles.over1000.length} archivos > 1000 líneas`));
  }

  console.log('\n' + colorize('dim', '-------------------------------------------------------'));
  
  // Score final
  let scoreColor = 'green';
  if (metrics.score < 4) scoreColor = 'red';
  else if (metrics.score < 7) scoreColor = 'yellow';
  else if (metrics.score < 9) scoreColor = 'cyan';

  console.log(`${colorize('bold', 'SCORE FINAL:')} ${colorize(scoreColor, colorize('bold', `${metrics.score}/10`))} — ${colorize(scoreColor, metrics.status)}`);
  console.log(colorize('dim', metrics.summary));

  // Tendencia
  if (metrics.trend.previousScore !== null) {
    const sign = metrics.trend.diff > 0 ? '+' : '';
    const trendText = `${sign}${metrics.trend.diff} vs anterior (${metrics.trend.previousScore}) | Promedio: ${metrics.trend.average}`;
    if (metrics.trend.direction === 'improved') {
      console.log(`📈 Tendencia: ${colorize('green', trendText)}`);
    } else if (metrics.trend.direction === 'regressed') {
      console.log(`📉 Tendencia: ${colorize('red', trendText)}`);
    } else {
      console.log(`➡️ Tendencia: ${colorize('gray', trendText)}`);
    }
  }

  // Sugerencias
  if (metrics.suggestions.length > 0) {
    console.log('\n' + colorize('bold', '💡 Sugerencias de acción:'));
    for (const sug of metrics.suggestions) {
      console.log(` - ${sug}`);
    }
  }

  console.log('\n' + colorize('bold', '=======================================================\n'));
}

// --- Orquestación Principal ---

function main() {
  const env = detectEnvironment(rootDir);
  const sourceFiles = collectSourceFiles(rootDir);

  // Ejecutar los 4 checks
  const lintCheck = checkLinter(rootDir, env);
  const tsCheck = checkTypeScript(rootDir, env);
  const structCheck = checkModuleStructure(rootDir, sourceFiles);
  const debtCheck = checkTechnicalDebt(rootDir, sourceFiles);
  const largeFiles = checkLargeFiles(rootDir, sourceFiles);

  // Computar Score
  const rawScore = lintCheck.points + tsCheck.points + structCheck.points + debtCheck.points - largeFiles.penalty;
  const finalScore = Math.max(0, Math.min(10, Math.round(rawScore * 10) / 10));

  let status = 'Excelente';
  let summary = 'Código limpio y consistente.';
  if (finalScore < 4) {
    status = 'Deuda técnica crítica';
    summary = 'No mergeable. Fix inmediato requerido.';
  } else if (finalScore < 7) {
    status = 'Aceptable';
    summary = 'Hay cosas para mejorar antes del próximo release.';
  } else if (finalScore < 9) {
    status = 'Buen estado';
    summary = 'Issues menores, se puede mergear.';
  }

  const trend = getHistoryAndTrends(rootDir, finalScore);

  const checks = {
    lint: lintCheck,
    typescript: tsCheck,
    structure: structCheck,
    debt: debtCheck
  };

  const suggestions = generateSuggestions(checks, largeFiles);

  const pkgName = basename(rootDir);

  const metrics = {
    date: new Date().toISOString(),
    project: pkgName,
    score: finalScore,
    status,
    summary,
    environment: {
      packageManager: env.packageManager,
      filesScanned: sourceFiles.length
    },
    checks,
    largeFiles: {
      over500Count: largeFiles.over500.length,
      over1000Count: largeFiles.over1000.length,
      penalty: largeFiles.penalty,
      over500: largeFiles.over500.slice(0, 10),
      over1000: largeFiles.over1000
    },
    trend,
    suggestions
  };

  if (options.save) {
    saveHistory(rootDir, metrics);
  }

  if (options.json) {
    process.stdout.write(JSON.stringify(metrics, null, 2) + '\n');
  } else {
    printReport(metrics);
  }

  // Código de salida: si el score es crítico (<4), devolver código 1 para CI/CD
  if (finalScore < 4) {
    process.exitCode = 1;
  }
}

main();
