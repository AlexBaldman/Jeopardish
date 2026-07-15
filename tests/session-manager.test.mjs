import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { SessionManager, getClueId } = require('../src/session/session-manager.js');

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

function createBank(count = 14) {
  return Array.from({ length: count }, (_, index) => ({
    id: `clue-${index}`,
    category: `Category ${index % 3}`,
    value: `$${(index + 1) * 100}`,
    question: `Question ${index}`,
    answer: `Answer ${index}`,
  }));
}

test('SessionManager creates a deterministic ten-clue episode', () => {
  const bank = createBank();
  const first = new SessionManager({ storage: createStorage() });
  const second = new SessionManager({ storage: createStorage() });

  first.start(bank);
  second.start([...bank].reverse());

  assert.equal(first.getProgress().total, 10);
  assert.deepEqual(
    first.getCandidates(10).map(({ clue }) => getClueId(clue)),
    second.getCandidates(10).map(({ clue }) => getClueId(clue)),
  );
});

test('SessionManager persists outcomes and resumes score and cursor', () => {
  const storage = createStorage();
  const bank = createBank();
  const first = new SessionManager({ storage });
  first.start(bank);
  const clue = first.getCurrentClue();
  first.recordResult({
    outcome: 'correct',
    clue,
    score: 400,
    currentStreak: 1,
    bestStreak: 3,
  });

  const resumed = new SessionManager({ storage });
  const result = resumed.start(bank);

  assert.equal(result.resumed, true);
  assert.equal(resumed.getProgress().answered, 1);
  assert.deepEqual(resumed.getResumeState(), {
    score: 400,
    currentStreak: 1,
    bestStreak: 3,
    answeredClueIds: [getClueId(clue)],
  });
});

test('SessionManager substitutes an unavailable current clue without consuming progress', () => {
  const manager = new SessionManager({ storage: createStorage(), episodeLength: 3 });
  manager.start(createBank(8));
  const [, replacement] = manager.getCandidates(2);

  manager.adoptPlayable(replacement.clue);

  assert.equal(manager.getProgress().answered, 0);
  assert.equal(getClueId(manager.getCurrentClue()), getClueId(replacement.clue));
});

test('SessionManager produces a complete results summary', () => {
  const manager = new SessionManager({ storage: createStorage(), episodeLength: 2 });
  manager.start(createBank(5));
  manager.recordResult({ outcome: 'correct', clue: manager.getCurrentClue(), score: 200 });
  manager.recordResult({ outcome: 'revealed', clue: manager.getCurrentClue(), score: 200 });

  assert.equal(manager.isComplete(), true);
  assert.deepEqual(manager.getProgress().counts, {
    correct: 1,
    incorrect: 0,
    revealed: 1,
    skipped: 0,
  });
  assert.equal(manager.getProgress().score, 200);
});
