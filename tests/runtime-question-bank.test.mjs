import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const runtimeBank = JSON.parse(
  await readFile(new URL('../questions/runtime-bank.json', import.meta.url), 'utf8'),
);

test('runtime question bank is a bounded, playable browser payload', () => {
  assert.equal(runtimeBank.length, 10_000);
  for (const clue of runtimeBank) {
    assert.ok(clue.category?.trim());
    assert.ok(clue.question?.trim());
    assert.ok(clue.answer?.trim());
    assert.doesNotMatch(JSON.stringify(clue), /http:\/\/[^"'<>\\\s]+/i);
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
