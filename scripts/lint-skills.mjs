#!/usr/bin/env node

/**
 * scripts/lint-skills.mjs
 * 
 * Validador de Agent Skills para CI (pnpm run lint:skills).
 * 
 * Criterios evaluados:
 * 1. Frontmatter YAML válido con delimitadores '---' al inicio, sintaxis YAML correcta
 *    y campo 'name' idéntico al nombre de la carpeta contenedora.
 * 2. Presencia de secciones obligatorias (H2):
 *    - Cuándo usar
 *    - Cuándo NO usar
 *    - Metodología (o Flujo de trabajo)
 *    - Reglas SÍ/NO (ambas secciones SÍ / NO, o sección unificada SÍ/NO)
 *    - Verificación
 *    - Al terminar
 * 3. Ausencia de comandos con two-dot diff sin justificación (ej. 'git diff <branch>' o
 *    'git diff A..B' sin '...' ni comentario de justificación '# justificación: ...').
 */

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { resolve, relative, basename, dirname, join } from 'node:path';
import process from 'node:process';

// Carga opcional / dinámica de YAML
let YAML;
try {
  YAML = await import('yaml');
} catch {
  // Fallback si no está instalado
  YAML = null;
}

// Colores ANSI para terminal
const isColorSupported = !process.env.NO_COLOR && process.stdout.isTTY !== false;
const colors = {
  reset: isColorSupported ? '\x1b[0m' : '',
  bold: isColorSupported ? '\x1b[1m' : '',
  red: isColorSupported ? '\x1b[31m' : '',
  green: isColorSupported ? '\x1b[32m' : '',
  yellow: isColorSupported ? '\x1b[33m' : '',
  blue: isColorSupported ? '\x1b[34m' : '',
  dim: isColorSupported ? '\x1b[2m' : '',
};

/**
 * Encuentra recursivamente todos los archivos SKILL.md
 */
function findSkillsFiles(dir, fileList = []) {
  const entries = readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== 'node_modules' && entry.name !== '.git' && entry.name !== '.agents') {
        findSkillsFiles(fullPath, fileList);
      }
    } else if (entry.isFile() && entry.name === 'SKILL.md') {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

/**
 * Parsea y valida el frontmatter YAML
 */
function validateFrontmatter(content, filePath, errors) {
  const parentFolder = basename(dirname(filePath));
  const lines = content.split(/\r?\n/);

  if (lines[0]?.trim() !== '---') {
    errors.push({
      rule: 'frontmatter-delimiters',
      message: 'El archivo debe comenzar con delimitador frontmatter "---" en la línea 1.'
    });
    return null;
  }

  const endFmIndex = lines.slice(1).findIndex(line => line.trim() === '---');
  if (endFmIndex === -1) {
    errors.push({
      rule: 'frontmatter-delimiters',
      message: 'No se encontró el delimitador de cierre "---" del frontmatter.'
    });
    return null;
  }

  const fmContent = lines.slice(1, endFmIndex + 1).join('\n');
  let data = {};

  if (YAML) {
    try {
      data = YAML.parse(fmContent) || {};
    } catch (err) {
      errors.push({
        rule: 'frontmatter-yaml-valid',
        message: `Frontmatter YAML inválido: ${err.message}`
      });
      return null;
    }
  } else {
    // Parser fallback básico
    const nameMatch = fmContent.match(/^name:\s*(.+)$/m);
    if (nameMatch) data.name = nameMatch[1].trim();
    const descMatch = fmContent.match(/^description:\s*(.+)$/m);
    if (descMatch) data.description = descMatch[1].trim();
  }

  if (typeof data !== 'object' || data === null) {
    errors.push({
      rule: 'frontmatter-yaml-valid',
      message: 'El frontmatter YAML debe ser un objeto clave-valor.'
    });
    return null;
  }

  if (!data.name || typeof data.name !== 'string') {
    errors.push({
      rule: 'frontmatter-name',
      message: 'El frontmatter debe incluir la propiedad "name" como string no vacío.'
    });
  } else if (data.name !== parentFolder) {
    errors.push({
      rule: 'frontmatter-name-match',
      message: `El campo "name" ("${data.name}") no coincide con el nombre de la carpeta contenedora ("${parentFolder}").`
    });
  }

  if (!data.description || typeof data.description !== 'string' || !data.description.trim()) {
    errors.push({
      rule: 'frontmatter-description',
      message: 'El frontmatter debe incluir una propiedad "description" válida y no vacía.'
    });
  }

  return {
    data,
    body: lines.slice(endFmIndex + 2).join('\n'),
    bodyStartLine: endFmIndex + 3
  };
}

/**
 * Valida la presencia de las secciones obligatorias
 */
function validateMandatorySections(content, errors) {
  const h2Matches = [...content.matchAll(/^##\s+(.+)$/gm)].map(m => m[1].trim());

  // 1. Cuándo usar (y no es 'cuándo no usar')
  const hasCuandoUsar = h2Matches.some(h => 
    /cu[aá]ndo\s+usar/i.test(h) && !/no\s+usar/i.test(h)
  );
  if (!hasCuandoUsar) {
    errors.push({
      rule: 'section-cuando-usar',
      message: 'Falta la sección obligatoria "## Cuándo usar" (ej. "## Cuándo usar esta skill").'
    });
  }

  // 2. Cuándo NO usar
  const hasCuandoNoUsar = h2Matches.some(h => 
    /cu[aá]ndo\s+no\s+usar/i.test(h)
  );
  if (!hasCuandoNoUsar) {
    errors.push({
      rule: 'section-cuando-no-usar',
      message: 'Falta la sección obligatoria "## Cuándo NO usar" (ej. "## Cuándo NO usar esta skill").'
    });
  }

  // 3. Metodología (o Flujo de trabajo)
  const hasMetodologia = h2Matches.some(h => 
    /metodolog[ií]a/i.test(h) || /flujo\s+de\s+trabajo/i.test(h)
  );
  if (!hasMetodologia) {
    errors.push({
      rule: 'section-metodologia',
      message: 'Falta la sección obligatoria "## Metodología" (o "## Flujo de trabajo").'
    });
  }

  // 4. Reglas SÍ/NO
  const hasReglasSi = h2Matches.some(h => /reglas.*s[ií]/i.test(h));
  const hasReglasNo = h2Matches.some(h => /reglas.*no/i.test(h));
  const hasReglasUnificadas = h2Matches.some(h => /reglas.*s[ií]\s*\/\s*no/i.test(h));

  if (!((hasReglasSi && hasReglasNo) || hasReglasUnificadas)) {
    errors.push({
      rule: 'section-reglas-si-no',
      message: 'Faltan las secciones de "Reglas SÍ/NO" (debe tener "## Reglas de lo que SÍ debe hacer" y "## Reglas de lo que NO debe hacer", o "## Reglas SÍ/NO").'
    });
  }

  // 5. Verificación
  const hasVerificacion = h2Matches.some(h => /verificaci[oó]n/i.test(h));
  if (!hasVerificacion) {
    errors.push({
      rule: 'section-verificacion',
      message: 'Falta la sección obligatoria "## Verificación".'
    });
  }

  // 6. Al terminar
  const hasAlTerminar = h2Matches.some(h => /al\s+terminar/i.test(h));
  if (!hasAlTerminar) {
    errors.push({
      rule: 'section-al-terminar',
      message: 'Falta la sección obligatoria "## Al terminar".'
    });
  }
}

/**
 * Valida la ausencia de comandos con two-dot diff sin justificación.
 */
function validateTwoDotDiff(content, errors) {
  const lines = content.split(/\r?\n/);
  let inCodeBlock = false;
  let codeBlockLang = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNum = i + 1;

    // Control de bloques de código
    const codeBlockMatch = line.match(/^```(\w*)/);
    if (codeBlockMatch) {
      if (inCodeBlock) {
        inCodeBlock = false;
        codeBlockLang = '';
      } else {
        inCodeBlock = true;
        codeBlockLang = codeBlockMatch[1].toLowerCase();
      }
      continue;
    }

    if (inCodeBlock) {
      // Analizamos comandos dentro de bloques de shell/bash o sin especificar
      const isShell = !codeBlockLang || ['bash', 'sh', 'zsh', 'shell', 'console'].includes(codeBlockLang);
      if (!isShell) continue;

      // Buscar comandos git diff que usen two-dot diff:
      // Caso 1: 'git diff' seguido de dos puntos explícitos sin tercer punto: A..B (no A...B)
      // Caso 2: 'git diff' directamente contra una rama/ref base: ej. 'git diff develop', 'git diff main', 'git diff $BASE', 'git diff origin/develop'
      const hasGitDiff = /\bgit\s+diff\b/.test(line);
      if (!hasGitDiff) continue;

      // Descartar three-dot diff explícito (A...B)
      const hasThreeDot = /\.\.\./.test(line);

      // Detectar two-dot explícito: A..B pero no A...B
      const hasTwoDotRange = /(?<!\.)\.\.(?!\.)/.test(line);

      // Detectar diff directo contra rama base (ej: git diff develop, git diff "$BASE", git diff origin/main) sin tres puntos
      const hasDirectBranchDiff = /\bgit\s+diff\b(?:\s+-[A-Za-z0-9-]+)*\s+(?:"?\$?[A-Za-z0-9_/-]+"?)(\s+HEAD|\s+"?\$?[A-Za-z0-9_/-]+"?|\s*$)/.test(line) 
        && !hasThreeDot 
        && !/\b(?:--staged|--cached|--stat|--name-only|--name-status|--check|-M|-w)\s*$/.test(line.trim());

      const isTwoDotDiff = (hasTwoDotRange || hasDirectBranchDiff) && !hasThreeDot;

      if (isTwoDotDiff) {
        // Verificar si existe justificación explícita
        // 1. En la misma línea (comentario con # justificación: o similar)
        // 2. En la línea previa o anterior en el bloque
        const prevLine = i > 0 ? lines[i - 1] : '';
        const prevPrevLine = i > 1 ? lines[i - 2] : '';

        const hasJustificationComment = 
          /#\s*(?:justificaci[oó]n|justificado|motivo|raz[oó]n|two-dot)/i.test(line) ||
          /#\s*(?:justificaci[oó]n|justificado|motivo|raz[oó]n|two-dot)/i.test(prevLine) ||
          /#\s*(?:justificaci[oó]n|justificado|motivo|raz[oó]n|two-dot)/i.test(prevPrevLine);

        if (!hasJustificationComment) {
          errors.push({
            rule: 'no-unjustified-two-dot-diff',
            line: lineNum,
            message: `Línea ${lineNum}: Comando con two-dot diff sin justificación: "${line.trim()}". Use three-dot diff ("git diff <base>...HEAD") o proporcione un comentario explícito con "# justificación: <motivo>".`
          });
        }
      }
    } else {
      // Fuera de bloques de código: verificar comandos ejecutables en inline backticks
      // Si hay un `git diff develop` o `git diff A..B` suelto sin contexto explicativo
      const inlineCmdMatch = line.match(/`git\s+diff\s+([^`]+)`/);
      if (inlineCmdMatch) {
        const cmdArgs = inlineCmdMatch[1];
        const isThreeDot = cmdArgs.includes('...');
        const isTwoDotRange = /(?<!\.)\.\.(?!\.)/.test(cmdArgs);
        const isBranchDiff = /^(develop|main|master|origin\/|\$BASE)/i.test(cmdArgs.trim());

        if ((isTwoDotRange || isBranchDiff) && !isThreeDot) {
          // Si la línea explica explícitamente el concepto (ej: "(two-dot)", "ajenos", "no usar", "justificación", "evitar")
          const isExplanatory = /(?:\(two-dot\)|two-dot|ajenos|no\s+usar|evit|justificaci[oó]n|motivo|advertencia)/i.test(line);
          if (!isExplanatory) {
            errors.push({
              rule: 'no-unjustified-two-dot-diff',
              line: lineNum,
              message: `Línea ${lineNum}: Comando inline con two-dot diff sin justificación: "${inlineCmdMatch[0]}". Use three-dot diff o aclare la justificación en el texto.`
            });
          }
        }
      }
    }
  }
}

/**
 * Valida un archivo de skill individual
 */
function validateSkill(filePath) {
  const relativePath = relative(process.cwd(), filePath);
  const errors = [];
  let content = '';

  try {
    content = readFileSync(filePath, 'utf8');
  } catch (err) {
    return {
      filePath,
      relativePath,
      name: basename(dirname(filePath)),
      valid: false,
      errors: [{ rule: 'file-read', message: `No se pudo leer el archivo: ${err.message}` }]
    };
  }

  // 1. Validar Frontmatter YAML
  const fmResult = validateFrontmatter(content, filePath, errors);

  // 2. Validar Secciones Obligatorias
  validateMandatorySections(content, errors);

  // 3. Validar Comandos Two-Dot Diff
  validateTwoDotDiff(content, errors);

  return {
    filePath,
    relativePath,
    name: fmResult?.data?.name || basename(dirname(filePath)),
    valid: errors.length === 0,
    errors
  };
}

/**
 * Punto de entrada principal
 */
function main() {
  const rootDir = process.cwd();
  const skillsDir = join(rootDir, 'skills');

  if (!existsSync(skillsDir) || !statSync(skillsDir).isDirectory()) {
    console.error(`${colors.red}${colors.bold}[ERROR]${colors.reset} No se encontró la carpeta 'skills/' en ${rootDir}`);
    process.exit(1);
  }

  const skillFiles = findSkillsFiles(skillsDir);
  if (skillFiles.length === 0) {
    console.error(`${colors.yellow}${colors.bold}[WARN]${colors.reset} No se encontraron archivos SKILL.md en ${skillsDir}`);
    process.exit(1);
  }

  console.log(`\n${colors.bold}${colors.blue}🔍 Validando Agent Skills (${skillFiles.length} skills encontradas)...${colors.reset}\n`);

  let passedCount = 0;
  let failedCount = 0;
  const failureDetails = [];

  for (const filePath of skillFiles) {
    const result = validateSkill(filePath);

    if (result.valid) {
      passedCount++;
      console.log(`  ${colors.green}✓${colors.reset} ${colors.bold}${result.name}${colors.reset} ${colors.dim}(${result.relativePath})${colors.reset}`);
    } else {
      failedCount++;
      console.log(`  ${colors.red}✗${colors.reset} ${colors.bold}${result.name}${colors.reset} ${colors.dim}(${result.relativePath})${colors.reset}`);
      for (const err of result.errors) {
        console.log(`    ${colors.red}↳ [${err.rule}]${colors.reset} ${err.message}`);
      }
      failureDetails.push(result);
    }
  }

  console.log('\n' + '─'.repeat(60));
  if (failedCount === 0) {
    console.log(`${colors.green}${colors.bold}✨ Todas las skills (${passedCount}) superaron la validación con éxito.${colors.reset}\n`);
    process.exit(0);
  } else {
    console.log(`${colors.red}${colors.bold}❌ Falló la validación: ${failedCount} con errores, ${passedCount} aprobadas de ${skillFiles.length} skills.${colors.reset}\n`);
    process.exit(1);
  }
}

main();
