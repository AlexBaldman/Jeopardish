import fs from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const sourcePath = path.join(root, 'questions', 'jeopardy-questions.json');
const outputPath = path.join(root, 'questions', 'runtime-bank.json');
const requestedCount = Number(process.argv[2] || 10_000);

function isPlayableQuestion(question) {
  return question
    && typeof question.category === 'string'
    && question.category.trim()
    && typeof question.question === 'string'
    && question.question.trim()
    && typeof question.answer === 'string'
    && question.answer.trim()
    && !hasInsecureMedia(question);
}

function hasInsecureMedia(question) {
  return /http:\/\/[^"'<>\\\s]+/i.test(JSON.stringify(question));
}

function sampleEvenly(items, count) {
  if (items.length <= count) return items;
  return Array.from({ length: count }, (_, index) => {
    const sourceIndex = Math.floor((index * items.length) / count);
    return items[sourceIndex];
  });
}

function dedupeByClue(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = `${item.question.trim().toLowerCase()}\u0000${item.answer.trim().toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

const archive = JSON.parse(await fs.readFile(sourcePath, 'utf8'));
if (!Array.isArray(archive)) {
  throw new Error('Historical question archive must be an array.');
}
if (!Number.isInteger(requestedCount) || requestedCount < 100) {
  throw new Error('Runtime question count must be an integer of at least 100.');
}

const playable = dedupeByClue(archive.filter(isPlayableQuestion));
const runtimeBank = sampleEvenly(playable, requestedCount);
await fs.writeFile(outputPath, `${JSON.stringify(runtimeBank)}\n`);

const sourceBytes = (await fs.stat(sourcePath)).size;
const outputBytes = (await fs.stat(outputPath)).size;
const reduction = 100 - ((outputBytes / sourceBytes) * 100);
console.log(
  `Built ${runtimeBank.length} runtime clues from ${archive.length} historical clues `
  + `(${(outputBytes / 1024 / 1024).toFixed(1)} MB, ${reduction.toFixed(1)}% smaller).`,
);
