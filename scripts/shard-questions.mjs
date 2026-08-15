import fs from 'node:fs';
import path from 'node:path';

const SOURCE_PATH = 'questions/jeopardy-questions.json';
const OUTPUT_DIR = 'questions/shards';
const MANIFEST_PATH = 'questions/manifest.json';
const SHARD_COUNT = 128;

function stableHash(value) {
  let hash = 2166136261;
  const input = String(value);

  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function normalizeShardClue(clue, index) {
  const id = clue.id ?? `${clue.category || 'clue'}-${index}`;

  return {
    id,
    category: clue.category || 'Unknown Category',
    question: clue.question || '',
    answer: clue.answer || '',
    value: clue.value ?? null,
    airdate: clue.airdate ?? null,
  };
}

const raw = fs.readFileSync(SOURCE_PATH, 'utf-8');
const questions = JSON.parse(raw);

if (!Array.isArray(questions) || questions.length === 0) {
  throw new Error(`${SOURCE_PATH} must contain a non-empty question array.`);
}

fs.rmSync(OUTPUT_DIR, { force: true, recursive: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

const shards = Array.from({ length: SHARD_COUNT }, (_, id) => ({
  id,
  file: `shards/${String(id).padStart(3, '0')}.json`,
  count: 0,
  categories: new Map(),
  minValue: null,
  maxValue: null,
  questions: [],
}));

for (const [index, rawClue] of questions.entries()) {
  const clue = normalizeShardClue(rawClue, index);
  const shard = shards[stableHash(clue.id) % SHARD_COUNT];
  const value = typeof clue.value === 'number' ? clue.value : Number(String(clue.value || '').replace(/[^0-9]/g, ''));

  shard.questions.push(clue);
  shard.count += 1;
  shard.categories.set(clue.category, (shard.categories.get(clue.category) || 0) + 1);

  if (Number.isFinite(value) && value > 0) {
    shard.minValue = shard.minValue === null ? value : Math.min(shard.minValue, value);
    shard.maxValue = shard.maxValue === null ? value : Math.max(shard.maxValue, value);
  }
}

for (const shard of shards) {
  const outPath = path.join('questions', shard.file);
  fs.writeFileSync(outPath, `${JSON.stringify(shard.questions)}\n`);
}

const manifest = {
  generatedAt: new Date().toISOString(),
  source: SOURCE_PATH,
  strategy: 'fnv1a-id-hash',
  shardCount: SHARD_COUNT,
  totalQuestions: questions.length,
  shards: shards.map((shard) => ({
    id: shard.id,
    file: shard.file,
    count: shard.count,
    minValue: shard.minValue,
    maxValue: shard.maxValue,
    topCategories: Array.from(shard.categories.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([category, count]) => ({ category, count })),
  })),
};

fs.writeFileSync(MANIFEST_PATH, `${JSON.stringify(manifest, null, 2)}\n`);

console.log(`Wrote ${SHARD_COUNT} shards for ${questions.length} questions.`);
console.log(`Manifest: ${MANIFEST_PATH}`);
