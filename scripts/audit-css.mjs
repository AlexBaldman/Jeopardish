import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const maxDuplicatesArg = args.find((arg) => arg.startsWith('--max-duplicates='));
const maxImportantArg = args.find((arg) => arg.startsWith('--max-important='));
const maxDuplicates = maxDuplicatesArg ? Number(maxDuplicatesArg.split('=')[1]) : Infinity;
const maxImportant = maxImportantArg ? Number(maxImportantArg.split('=')[1]) : Infinity;
const files = args.filter((arg) => !arg.startsWith('--'));
const targets = files.length
  ? files
  : ['styles/base.css', 'styles/tokens.css', 'style.css', 'styles/game/legacy.css', 'creative-room.css'];

function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, '');
}

function splitSelectors(header) {
  const selectors = [];
  let depth = 0;
  let start = 0;

  for (let index = 0; index < header.length; index += 1) {
    const character = header[index];
    if (character === '(' || character === '[') depth += 1;
    if (character === ')' || character === ']') depth = Math.max(0, depth - 1);
    if (character === ',' && depth === 0) {
      selectors.push(header.slice(start, index).trim());
      start = index + 1;
    }
  }

  selectors.push(header.slice(start).trim());
  return selectors.filter(Boolean);
}

function collectRules(css, source, context = [], findings = []) {
  let cursor = 0;

  while (cursor < css.length) {
    const open = css.indexOf('{', cursor);
    if (open === -1) break;

    const header = css.slice(cursor, open).trim();
    let depth = 1;
    let close = open + 1;

    while (close < css.length && depth > 0) {
      if (css[close] === '{') depth += 1;
      if (css[close] === '}') depth -= 1;
      close += 1;
    }

    if (depth !== 0) throw new Error(`${source}: unbalanced CSS block near ${header}`);

    const body = css.slice(open + 1, close - 1);
    if (header.startsWith('@media') || header.startsWith('@supports') || header.startsWith('@layer') || header.startsWith('@container')) {
      collectRules(body, source, [...context, header], findings);
    } else if (!header.startsWith('@keyframes') && !header.startsWith('@font-face') && !header.startsWith('@property')) {
      for (const selector of splitSelectors(header)) {
        findings.push({ selector, source, context: context.join(' > ') || 'root', body });
      }
    }

    cursor = close;
  }

  return findings;
}

const rules = [];
const sourceMetrics = [];
let importantCount = 0;
let lineCount = 0;

for (const target of targets) {
  const absolute = path.resolve(target);
  if (!fs.existsSync(absolute)) throw new Error(`Missing stylesheet: ${target}`);
  const css = fs.readFileSync(absolute, 'utf8');
  const sourceLines = css.split('\n').length;
  const sourceImportant = (css.match(/!important\b/g) || []).length;
  const ruleStart = rules.length;
  lineCount += sourceLines;
  importantCount += sourceImportant;
  collectRules(stripComments(css), target, [], rules);
  sourceMetrics.push({
    source: target,
    lines: sourceLines,
    rules: rules.length - ruleStart,
    important: sourceImportant,
  });
}

const occurrences = new Map();
for (const rule of rules) {
  const key = `${rule.context} :: ${rule.selector}`;
  const entry = occurrences.get(key) || { selector: rule.selector, context: rule.context, sources: [] };
  entry.sources.push(rule.source);
  occurrences.set(key, entry);
}

const duplicates = [...occurrences.values()]
  .filter((entry) => entry.sources.length > 1)
  .sort((a, b) => b.sources.length - a.sources.length || a.selector.localeCompare(b.selector));

console.log(`CSS audit: ${targets.join(', ')}`);
console.log(`  ${lineCount} lines | ${rules.length} selector rules | ${importantCount} !important declarations`);
console.log(`  ${duplicates.length} duplicate selectors in the same cascade context`);
console.log('');
console.log('  Ownership by source');
for (const metric of sourceMetrics) {
  console.log(
    `  ${metric.source.padEnd(34)} `
    + `${String(metric.lines).padStart(5)} lines | `
    + `${String(metric.rules).padStart(4)} rules | `
    + `${metric.important} !important`,
  );
}

if (duplicates.length) console.log('');
for (const entry of duplicates) {
  console.log(`  x${entry.sources.length} ${entry.selector} [${entry.context}]`);
}

if (duplicates.length > maxDuplicates || importantCount > maxImportant) {
  console.error(`CSS debt ceiling exceeded (duplicates <= ${maxDuplicates}, !important <= ${maxImportant}).`);
  process.exitCode = 1;
}
