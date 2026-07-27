import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { validateEpisodePack } = require('../src/content/episode-contract.js');

const paths = process.argv.slice(2);
const targets = paths.length
  ? paths
  : [
    'questions/jeopardy-questions.json',
    'questions/runtime-bank.json',
    'questions/episodes/season-zero-001.json',
  ];

for (const questionPath of targets) {
  const raw = fs.readFileSync(questionPath, 'utf-8');
  const data = JSON.parse(raw);

  if (!Array.isArray(data)) {
    const episode = validateEpisodePack(data, { requireReviewed: true });
    let missingMedia = 0;
    for (const clue of episode.clues) {
      for (const media of clue.media) {
        if (/^(?:\.{0,2}\/|\/)/.test(media.url)) {
          const mediaPath = path.resolve(media.url.replace(/^\.\//, ''));
          if (!fs.existsSync(mediaPath)) {
            missingMedia += 1;
            console.error(`${questionPath}: missing local media ${media.url}`);
          }
        }
      }
    }
    if (missingMedia) {
      throw new Error(`${questionPath}: ${missingMedia} local media file(s) missing.`);
    }
    console.log(
      `Validated reviewed episode ${episode.id}: ${episode.clues.length} clues, revision ${episode.contentRevision}.`,
    );
    continue;
  }

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error(`${questionPath} must be a non-empty array`);
  }

  let bad = 0;
  let insecureMedia = 0;
  for (const [index, item] of data.entries()) {
    const hasCategory = typeof item.category === 'string' && item.category.trim().length > 0;
    const hasQuestion = typeof item.question === 'string' && item.question.trim().length > 0;
    const hasAnswer = typeof item.answer === 'string' && item.answer.trim().length > 0;

    if (!hasCategory || !hasQuestion || !hasAnswer) {
      bad += 1;
      console.error(`${questionPath}: invalid question at index ${index}`);
    }
    if (questionPath.endsWith('runtime-bank.json') && /http:\/\/[^"'<>\\\s]+/i.test(JSON.stringify(item))) {
      insecureMedia += 1;
    }
  }

  if (bad > 0 || insecureMedia > 0) {
    throw new Error(
      `${questionPath}: ${bad} malformed question objects, ${insecureMedia} clues with insecure media.`,
    );
  }

  console.log(`Validated ${data.length} questions in ${questionPath}.`);
}
