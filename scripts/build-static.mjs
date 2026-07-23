import fs from 'node:fs/promises';
import path from 'node:path';
import { runtimeEntries } from './runtime-manifest.mjs';

const root = process.cwd();
const outDir = path.join(root, 'dist');

async function exists(filePath) {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function copyEntry(entry) {
  const source = path.join(root, entry);
  const destination = path.join(outDir, entry);

  if (!(await exists(source))) {
    throw new Error(`Missing runtime entry: ${entry}`);
  }

  await fs.mkdir(path.dirname(destination), { recursive: true });
  await fs.cp(source, destination, {
    recursive: true,
    filter: (src) => !src.endsWith('.DS_Store'),
  });
}

async function getDirectorySize(dir) {
  let total = 0;
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      total += await getDirectorySize(fullPath);
    } else {
      total += (await fs.stat(fullPath)).size;
    }
  }

  return total;
}

await fs.rm(outDir, { recursive: true, force: true });
await fs.mkdir(outDir, { recursive: true });

for (const entry of runtimeEntries) {
  await copyEntry(entry);
}

await fs.writeFile(path.join(outDir, '.nojekyll'), '');

const bytes = await getDirectorySize(outDir);
const megabytes = (bytes / 1024 / 1024).toFixed(1);
console.log(`Built static preview in dist/ (${megabytes} MB).`);
