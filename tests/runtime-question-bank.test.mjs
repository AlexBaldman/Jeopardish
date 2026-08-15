import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { adaptLegacyQuestionBank } = require('../src/content/episode-contract.js');
const runtimeBank = JSON.parse(
  await readFile(new URL('../questions/runtime-bank.json', import.meta.url), 'utf8'),
);

test('runtime question bank is a bounded, playable browser payload', () => {
  assert.equal(runtimeBank.length, 10_000);
  const visibleClues = new Set();
  for (const clue of runtimeBank) {
    assert.ok(clue.category?.trim());
    assert.ok(clue.question?.trim());
    assert.ok(clue.answer?.trim());
    assert.doesNotMatch(JSON.stringify(clue), /http:\/\/[^"'<>\\\s]+/i);
    const visibleKey = `${clue.question.trim().toLowerCase()}\u0000${clue.answer.trim().toLowerCase()}`;
    assert.equal(visibleClues.has(visibleKey), false, 'runtime bank contains a visible duplicate clue');
    visibleClues.add(visibleKey);
  }
});

test('runtime question bank preserves broad historical and round coverage', () => {
  const years = runtimeBank
    .map((clue) => Number.parseInt(clue.air_date, 10))
    .filter(Number.isFinite);
  const rounds = new Set(runtimeBank.map((clue) => clue.round));

  assert.ok(Math.min(...years) <= 1985);
  assert.ok(Math.max(...years) >= 2010);
  assert.ok(rounds.has('Jeopardy!'));
  assert.ok(rounds.has('Double Jeopardy!'));
  assert.ok(rounds.has('Final Jeopardy!'));
});

test('the complete runtime bank adapts into one immutable compatibility episode', () => {
  const episode = adaptLegacyQuestionBank(runtimeBank, {
    id: 'season-zero-pilot',
    title: 'Season Zero: Pilot Broadcast',
    episodeLength: 10,
  });

  assert.equal(episode.kind, 'legacy-adapter');
  assert.equal(episode.reviewStatus, 'archive');
  assert.equal(episode.clues.length, 10_000);
  assert.equal(episode.episodeLength, 10);
  assert.equal(new Set(episode.clues.map(({ id }) => id)).size, 10_000);
  assert.equal(Object.isFrozen(episode.clues.at(-1)), true);
});
