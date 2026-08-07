import fs from 'node:fs/promises';
import path from 'node:path';
import { productionPageEntries } from './runtime-manifest.mjs';

const root = process.cwd();
const distRoot = path.join(root, 'dist');
const forbiddenSegments = new Set([
  '.git',
  '__misc',
  'backups',
  'node_modules',
  'reports',
  'screenshots',
]);
const references = [];
const missing = [];

async function walk(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await walk(absolutePath));
    else files.push(absolutePath);
  }
  return files;
}

function isLocalReference(value) {
  return value
    && !value.startsWith('#')
    && !/^(?:data|https?|mailto|tel):/i.test(value);
}

function normalizeReference(sourceFile, value) {
  const withoutQuery = value.split(/[?#]/, 1)[0];
  const relativePath = withoutQuery.startsWith('/')
    ? withoutQuery.replace(/^\/+/, '')
    : path.relative(distRoot, path.resolve(path.dirname(sourceFile), withoutQuery));
  return relativePath.split(path.sep).join('/');
}

function extractReferences(file, source) {
  const values = [];
  if (file.endsWith('.html')) {
    for (const match of source.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)) {
      values.push(match[1]);
    }
  }
  if (file.endsWith('.css')) {
    for (const match of source.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/gi)) {
      values.push(match[1]);
    }
  }
  return values.filter(isLocalReference);
}

const files = await walk(distRoot);
const relativeFiles = new Set(files.map((file) => path.relative(distRoot, file).split(path.sep).join('/')));
const forbidden = [...relativeFiles].filter((file) => (
  file.split('/').some((segment) => forbiddenSegments.has(segment))
  || file === 'questions/jeopardy-questions.json'
  || file === 'questions/runtime-bank.json'
  || file.startsWith('visual-fixtures.')
));

for (const page of productionPageEntries) {
  if (!relativeFiles.has(page)) missing.push(`${page} (production entry)`);
}

const [rootPage, cabinetPage] = await Promise.all([
  fs.readFile(path.join(distRoot, 'index.html'), 'utf8'),
  fs.readFile(path.join(distRoot, 'game.html'), 'utf8'),
]);
if (rootPage !== cabinetPage) {
  missing.push('index.html must be the promoted standalone game cabinet');
}

for (const file of files.filter((candidate) => /\.(?:css|html)$/i.test(candidate))) {
  const source = await fs.readFile(file, 'utf8');
  for (const value of extractReferences(file, source)) {
    const target = normalizeReference(file, value);
    references.push(target);
    if (!relativeFiles.has(target)) {
      missing.push(`${target} (referenced by ${path.relative(distRoot, file)})`);
    }
  }
}

if (forbidden.length || missing.length) {
  if (forbidden.length) {
    console.error(`Forbidden production files:\n${forbidden.map((file) => `  ${file}`).join('\n')}`);
  }
  if (missing.length) {
    console.error(`Missing production references:\n${[...new Set(missing)].map((file) => `  ${file}`).join('\n')}`);
  }
  process.exitCode = 1;
} else {
  console.log(
    `Production artifact audit passed: ${relativeFiles.size} files, `
    + `${new Set(references).size} local page/style references, no archive leakage.`,
  );
}
