import fs from 'node:fs';

const paths = process.argv.slice(2);
const targets = paths.length
  ? paths
  : ['questions/jeopardy-questions.json', 'questions/runtime-bank.json'];

for (const questionPath of targets) {
  const raw = fs.readFileSync(questionPath, 'utf-8');
  const data = JSON.parse(raw);

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`${questionPath} must be a non-empty array`);
  }

  let bad = 0;
  for (const [index, item] of data.entries()) {
    const hasCategory = typeof item.category === 'string' && item.category.trim().length > 0;
    const hasQuestion = typeof item.question === 'string' && item.question.trim().length > 0;
    const hasAnswer = typeof item.answer === 'string' && item.answer.trim().length > 0;

    if (!hasCategory || !hasQuestion || !hasAnswer) {
      bad += 1;
      console.error(`${questionPath}: invalid question at index ${index}`);
    }
  }

  if (bad > 0) {
    throw new Error(`${questionPath}: ${bad} malformed question objects.`);
  }

  console.log(`Validated ${data.length} questions in ${questionPath}.`);
}
