import fs from 'node:fs';

const paths = [
  'questions/jeopardy-questions.json',
  'questions/starter-pack.json',
];

let total = 0;

for (const path of paths) {
  const raw = fs.readFileSync(path, 'utf-8');
  const data = JSON.parse(raw);

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`${path} must be a non-empty array`);
  }

  let bad = 0;
  for (const [index, item] of data.entries()) {
    const hasCategory = typeof item.category === 'string' && item.category.trim().length > 0;
    const hasQuestion = typeof item.question === 'string' && item.question.trim().length > 0;
    const hasAnswer = typeof item.answer === 'string' && item.answer.trim().length > 0;

    if (!hasCategory || !hasQuestion || !hasAnswer) {
      bad += 1;
      console.error(`Invalid question at ${path} index ${index}`);
    }
  }

  if (bad > 0) {
    throw new Error(`Validation failed: ${bad} malformed question objects in ${path}.`);
  }

  total += data.length;
  console.log(`Validated ${data.length} questions in ${path}.`);
}

const manifestPath = 'questions/manifest.json';
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));
  const hasValidManifest = manifest
    && Number.isInteger(manifest.shardCount)
    && manifest.shardCount > 0
    && Number.isInteger(manifest.totalQuestions)
    && Array.isArray(manifest.shards)
    && manifest.shards.length === manifest.shardCount;

  if (!hasValidManifest) {
    throw new Error(`${manifestPath} is malformed.`);
  }

  const shardTotal = manifest.shards.reduce((sum, shard) => {
    if (!shard.file || !Number.isInteger(shard.count)) {
      throw new Error(`${manifestPath} contains a malformed shard entry.`);
    }

    const shardPath = `questions/${shard.file}`;
    if (!fs.existsSync(shardPath)) {
      throw new Error(`Missing question shard: ${shardPath}`);
    }

    const shardData = JSON.parse(fs.readFileSync(shardPath, 'utf-8'));
    if (!Array.isArray(shardData) || shardData.length !== shard.count) {
      throw new Error(`${shardPath} contains ${shardData.length} questions, expected ${shard.count}.`);
    }

    return sum + shard.count;
  }, 0);

  if (shardTotal !== manifest.totalQuestions) {
    throw new Error(`Shard counts (${shardTotal}) do not match manifest total (${manifest.totalQuestions}).`);
  }

  console.log(`Validated ${manifest.shardCount} question shards in ${manifestPath}.`);
}

console.log(`Validated ${total} questions successfully.`);
