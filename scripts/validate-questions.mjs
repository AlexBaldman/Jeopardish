import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const questionsPath = resolve(__dirname, '../questions/questions.json');
const raw = fs.readFileSync(questionsPath, 'utf-8');
const data = JSON.parse(raw);

if (!Array.isArray(data) || data.length === 0) {
  throw new Error(`${questionsPath} must be a non-empty array`);
}

let bad = 0;
for (const [index, item] of data.entries()) {
  const hasCategory = typeof item.category === 'string' && item.category.trim().length > 0;
  const hasQuestion = typeof item.question === 'string' && item.question.trim().length > 0;
  const hasAnswer = typeof item.answer === 'string' && item.answer.trim().length > 0;

  if (!hasCategory || !hasQuestion || !hasAnswer) {
    bad += 1;
    console.error(`Invalid question at index ${index}`);
  }
}

if (bad > 0) {
  throw new Error(`Validation failed: ${bad} malformed question objects.`);
}

console.log(`Validated ${data.length} questions successfully.`);