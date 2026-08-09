import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';

const require = createRequire(import.meta.url);
const { DefaultXanderAvatarPack } = require('../src/host/host-avatar.js');

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
const REQUIRED_WIDTH = 720;
const REQUIRED_HEIGHT = 900;
const MAX_BOTTOM_GAP = 16;
const PROVENANCE_PATH = 'assets/hosts/xander/v1/provenance.json';

function issue(message) {
  return message;
}

function parsePng(buffer, assetPath) {
  const failures = [];
  if (buffer.length < 8 || !buffer.subarray(0, 8).equals(PNG_SIGNATURE)) {
    return { failures: [issue(`${assetPath}: invalid PNG signature`)] };
  }

  let offset = 8;
  let header;
  const imageData = [];
  let sawIend = false;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const chunkStart = offset + 8;
    const chunkEnd = chunkStart + length;
    if (chunkEnd + 4 > buffer.length) {
      failures.push(`${assetPath}: truncated PNG chunk`);
      break;
    }
    const type = buffer.toString('ascii', chunkStart - 4, chunkStart);
    const data = buffer.subarray(chunkStart, chunkEnd);
    if (type === 'IHDR') {
      if (length !== 13 || header) failures.push(`${assetPath}: invalid IHDR`);
      else {
        header = {
          width: data.readUInt32BE(0),
          height: data.readUInt32BE(4),
          bitDepth: data[8],
          colorType: data[9],
          compression: data[10],
          filter: data[11],
          interlace: data[12],
        };
      }
    } else if (type === 'IDAT') {
      imageData.push(data);
    } else if (type === 'IEND') {
      sawIend = true;
      break;
    }
    offset = chunkEnd + 4;
  }

  if (!header) failures.push(`${assetPath}: missing IHDR`);
  if (!sawIend) failures.push(`${assetPath}: missing IEND`);
  if (!imageData.length) failures.push(`${assetPath}: missing IDAT`);
  if (failures.length || !header) return { failures, header };

  if (header.width !== REQUIRED_WIDTH || header.height !== REQUIRED_HEIGHT) {
    failures.push(`${assetPath}: expected ${REQUIRED_WIDTH}x${REQUIRED_HEIGHT}, got ${header.width}x${header.height}`);
  }
  if (header.bitDepth !== 8 || header.colorType !== 6) {
    failures.push(`${assetPath}: expected 8-bit RGBA PNG (bit depth ${header.bitDepth}, color type ${header.colorType})`);
  }
  if (header.compression !== 0 || header.filter !== 0 || header.interlace !== 0) {
    failures.push(`${assetPath}: unsupported PNG encoding (compression/filter/interlace must be 0)`);
  }
  if (failures.length) return { failures, header };

  let raw;
  try {
    raw = zlib.inflateSync(Buffer.concat(imageData));
  } catch {
    return { failures: [`${assetPath}: IDAT data cannot be decompressed`], header };
  }

  const stride = header.width * 4;
  const expectedLength = header.height * (stride + 1);
  if (raw.length !== expectedLength) {
    return { failures: [`${assetPath}: decoded pixel data has unexpected length`], header };
  }

  const pixels = Buffer.alloc(header.width * header.height * 4);
  let cursor = 0;
  let previous = Buffer.alloc(stride);
  let minX = header.width;
  let minY = header.height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < header.height; y += 1) {
    const filter = raw[cursor++];
    const row = Buffer.alloc(stride);
    if (filter > 4) return { failures: [`${assetPath}: invalid scanline filter ${filter}`], header };
    for (let x = 0; x < stride; x += 1) {
      const left = x >= 4 ? row[x - 4] : 0;
      const above = previous[x];
      const upperLeft = x >= 4 ? previous[x - 4] : 0;
      const value = raw[cursor++];
      if (filter === 0) row[x] = value;
      else if (filter === 1) row[x] = (value + left) & 255;
      else if (filter === 2) row[x] = (value + above) & 255;
      else if (filter === 3) row[x] = (value + Math.floor((left + above) / 2)) & 255;
      else {
        const estimate = left + above - upperLeft;
        const pa = Math.abs(estimate - left);
        const pb = Math.abs(estimate - above);
        const pc = Math.abs(estimate - upperLeft);
        row[x] = (value + (pa <= pb && pa <= pc ? left : pb <= pc ? above : upperLeft)) & 255;
      }
    }
    row.copy(pixels, y * stride);
    previous = row;
    for (let x = 0; x < header.width; x += 1) {
      if (row[x * 4 + 3] !== 0) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }
  }

  const corners = [
    pixels[3],
    pixels[(header.width - 1) * 4 + 3],
    pixels[(header.height - 1) * stride + 3],
    pixels[pixels.length - 1],
  ];
  if (corners.some((alpha) => alpha !== 0)) failures.push(`${assetPath}: all four corners must be transparent`);
  if (maxX < 0) failures.push(`${assetPath}: visible bounds are empty`);
  else if (header.height - 1 - maxY > MAX_BOTTOM_GAP) {
    failures.push(`${assetPath}: visible bounds float ${header.height - 1 - maxY}px above the bottom`);
  }
  return { failures, header, bounds: { minX, minY, maxX, maxY } };
}

function runtimeLookReferences(pack) {
  return pack.looks.flatMap((look) => [
    ...Object.values(look.visuals),
    ...Object.values(look.layers),
  ]).filter((assetPath) => assetPath.toLowerCase().endsWith('.png'));
}

function sha256(buffer) {
  return createHash('sha256').update(buffer).digest('hex');
}

async function auditProvenance(pack, canonicalPaths, failures) {
  let manifest;
  try {
    manifest = JSON.parse(await fs.readFile(path.join(root, PROVENANCE_PATH), 'utf8'));
  } catch {
    failures.push(`${PROVENANCE_PATH}: missing or invalid provenance manifest`);
    return { sourceCount: 0, outputCount: 0 };
  }
  if (manifest.packId !== pack.id) failures.push(`${PROVENANCE_PATH}: packId must match ${pack.id}`);
  if (manifest.lineage?.status !== 'complete' && manifest.rights?.commercialUse !== 'hold') {
    failures.push(`${PROVENANCE_PATH}: incomplete lineage must keep commercial use on hold`);
  }
  const entries = [...(manifest.sources || []), ...(manifest.outputs || [])];
  for (const entry of entries) {
    if (!entry?.path?.startsWith('assets/') || !/^[a-f0-9]{64}$/.test(entry?.sha256 || '')) {
      failures.push(`${PROVENANCE_PATH}: every entry requires a local asset path and SHA-256`);
      continue;
    }
    try {
      const buffer = await fs.readFile(path.join(root, entry.path));
      if (sha256(buffer) !== entry.sha256) failures.push(`${entry.path}: provenance hash mismatch`);
    } catch {
      failures.push(`${entry.path}: provenance source does not exist`);
    }
  }
  const outputPaths = new Set((manifest.outputs || []).map(({ path: assetPath }) => assetPath));
  canonicalPaths.forEach((assetPath) => {
    if (!outputPaths.has(assetPath)) failures.push(`${assetPath}: missing from provenance outputs`);
  });
  return {
    sourceCount: Array.isArray(manifest.sources) ? manifest.sources.length : 0,
    outputCount: Array.isArray(manifest.outputs) ? manifest.outputs.length : 0,
  };
}

export async function auditHostProduction(pack = DefaultXanderAvatarPack) {
  const failures = [];
  const ids = pack.looks.map(({ id }) => id);
  const labels = pack.looks.map(({ label }) => label);
  const references = runtimeLookReferences(pack);
  const canonicalPaths = pack.looks.map((look) => look.visuals.idle);
  const paths = [...new Set(references)];

  if (new Set(ids).size !== ids.length) failures.push('look ids must be unique');
  if (new Set(labels).size !== labels.length) failures.push('look names must be unique');
  if (new Set(canonicalPaths).size !== canonicalPaths.length) failures.push('look asset paths must be unique');

  const provenance = await auditProvenance(pack, canonicalPaths, failures);

  const expectedDimensions = { width: REQUIRED_WIDTH, height: REQUIRED_HEIGHT };
  for (const assetPath of paths) {
    const absolutePath = path.join(root, assetPath);
    let buffer;
    try {
      buffer = await fs.readFile(absolutePath);
    } catch {
      failures.push(`${assetPath}: referenced PNG does not exist`);
      continue;
    }
    const result = parsePng(buffer, assetPath);
    failures.push(...result.failures);
    if (result.header && (result.header.width !== expectedDimensions.width || result.header.height !== expectedDimensions.height)) {
      failures.push(`${assetPath}: dimensions differ from required pack dimensions`);
    }
  }
  return {
    packId: pack.id,
    lookCount: pack.looks.length,
    assetCount: paths.length,
    provenance,
    failures,
  };
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const result = await auditHostProduction();
  if (result.failures.length) {
    console.error(`Host production audit failed (${result.failures.length} issue${result.failures.length === 1 ? '' : 's'})`);
    result.failures.forEach((failure) => console.error(`  - ${failure}`));
    process.exitCode = 1;
  } else {
    console.log(`Host production audit passed: ${result.lookCount} canonical looks, ${result.assetCount} unique PNGs, ${result.provenance.sourceCount} hashed sources`);
  }
}
