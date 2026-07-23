import crypto from 'node:crypto';
import fs from 'node:fs/promises';
import path from 'node:path';
import { runtimeEntries } from './runtime-manifest.mjs';

const root = process.cwd();
const assetRoot = path.join(root, 'assets');
const sourceExtensions = new Set(['.css', '.html', '.js', '.json', '.mjs']);
const ignoredSourceRoots = new Set(['backups', 'dist', 'docs', 'node_modules', 'reports', 'screenshots']);
const ignoredSourceFiles = new Set([
  'scripts/audit-assets.mjs',
  'scripts/build-static.mjs',
  'scripts/runtime-manifest.mjs',
]);

async function walk(relativeDirectory) {
  const absoluteDirectory = path.join(root, relativeDirectory);
  const entries = await fs.readdir(absoluteDirectory, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === '.DS_Store') continue;
    const relativePath = path.posix.join(relativeDirectory, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walk(relativePath));
    } else {
      files.push(relativePath);
    }
  }

  return files;
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
}

function isRuntimeEntry(assetPath) {
  return runtimeEntries.some((entry) => assetPath === entry || assetPath.startsWith(`${entry}/`));
}

const [assetFiles, allFiles] = await Promise.all([
  walk('assets'),
  walk('.'),
]);

const sourceFiles = allFiles.filter((file) => {
  const firstSegment = file.replace(/^\.\//, '').split('/')[0];
  const normalized = file.replace(/^\.\//, '');
  return !ignoredSourceRoots.has(firstSegment)
    && !ignoredSourceFiles.has(normalized)
    && sourceExtensions.has(path.extname(file));
});

const sourceText = (await Promise.all(sourceFiles.map(async (file) => {
  try {
    return await fs.readFile(path.join(root, file), 'utf8');
  } catch {
    return '';
  }
}))).join('\n');

const records = await Promise.all(assetFiles.map(async (assetPath) => {
  const buffer = await fs.readFile(path.join(root, assetPath));
  return {
    assetPath,
    bytes: buffer.byteLength,
    extension: path.extname(assetPath).toLowerCase() || '(none)',
    hash: crypto.createHash('sha256').update(buffer).digest('hex'),
    referenced: sourceText.includes(assetPath),
    packaged: isRuntimeEntry(assetPath),
    packagedDirectly: runtimeEntries.includes(assetPath),
  };
}));

const totalBytes = records.reduce((sum, record) => sum + record.bytes, 0);
const packagedRecords = records.filter((record) => record.packaged);
const packagedBytes = packagedRecords.reduce((sum, record) => sum + record.bytes, 0);
const unreferencedPackaged = packagedRecords.filter((record) => record.packagedDirectly && !record.referenced);
const researchRecords = records.filter((record) => !record.packaged);

const extensionTotals = new Map();
for (const record of records) {
  const current = extensionTotals.get(record.extension) || { count: 0, bytes: 0 };
  current.count += 1;
  current.bytes += record.bytes;
  extensionTotals.set(record.extension, current);
}

const duplicateGroups = new Map();
for (const record of records) {
  const group = duplicateGroups.get(record.hash) || [];
  group.push(record);
  duplicateGroups.set(record.hash, group);
}
const duplicates = [...duplicateGroups.values()].filter((group) => group.length > 1);

console.log('Asset architecture audit');
console.log(`  ${records.length} files | ${formatBytes(totalBytes)} source library`);
console.log(`  ${packagedRecords.length} files | ${formatBytes(packagedBytes)} packaged artwork`);
console.log(`  ${researchRecords.length} files | ${formatBytes(totalBytes - packagedBytes)} research/archive artwork`);
console.log(`  ${duplicates.length} byte-identical duplicate groups`);
console.log('');
console.log('By file type');
for (const [extension, totals] of [...extensionTotals.entries()].sort((a, b) => b[1].bytes - a[1].bytes)) {
  console.log(`  ${extension.padEnd(8)} ${String(totals.count).padStart(3)} files  ${formatBytes(totals.bytes).padStart(9)}`);
}

if (unreferencedPackaged.length) {
  console.log('');
  console.log('Packaged files without a direct source reference');
  for (const record of unreferencedPackaged) {
    console.log(`  ${record.assetPath} (${formatBytes(record.bytes)})`);
  }
}

if (duplicates.length) {
  console.log('');
  console.log('Byte-identical groups');
  for (const group of duplicates) {
    console.log(`  ${group.map((record) => record.assetPath).join(' | ')}`);
  }
}

if (unreferencedPackaged.length) {
  process.exitCode = 1;
}
