import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const {
  LEDGER_VERSION,
  LearningLedger,
  MASTERY_STATES,
} = require('../src/learning/learning-ledger.js');

function createStorage(initial = null) {
  const values = new Map(initial ? [['learning', initial]] : []);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    value: (key) => values.get(key),
  };
}

test('LearningLedger persists study actions and mastery separately from episode score', () => {
  const storage = createStorage();
  const first = new LearningLedger({
    storage,
    storageKey: 'learning',
    now: () => 'first',
  });
  first.recordStudy({
    episodeId: 'episode-1',
    clueId: 'clue-1',
    grounding: 'reviewed',
  });
  first.recordAction({
    episodeId: 'episode-1',
    clueId: 'clue-1',
    actionId: 'quiz',
  });
  first.recordReinforcement({
    episodeId: 'episode-1',
    clueId: 'clue-1',
    correct: true,
    reason: 'fuzzy',
  });

  const resumed = new LearningLedger({
    storage,
    storageKey: 'learning',
    now: () => 'second',
  });
  const entry = resumed.getEntry('episode-1', 'clue-1');

  assert.equal(entry.mastery, MASTERY_STATES.REINFORCED);
  assert.equal(entry.studyCount, 1);
  assert.equal(entry.actionCounts.quiz, 1);
  assert.equal(entry.reinforcementAttempts, 1);
  assert.equal(entry.reinforcementCorrect, 1);
  assert.equal(Object.hasOwn(entry, 'score'), false);
  assert.equal(JSON.parse(storage.value('learning')).version, LEDGER_VERSION);
});

test('LearningLedger keeps missed reinforcement due and deduplicates review ids', () => {
  const ledger = new LearningLedger({
    storage: createStorage(),
    storageKey: 'learning',
    now: () => 'now',
  });
  ledger.recordStudy({ episodeId: 'episode-1', clueId: 'clue-1' });
  ledger.recordReinforcement({
    episodeId: 'episode-1',
    clueId: 'clue-1',
    correct: false,
    reason: 'mismatch',
  });
  ledger.recordStudy({ episodeId: 'episode-1', clueId: 'clue-2' });
  ledger.recordReinforcement({
    episodeId: 'episode-1',
    clueId: 'clue-2',
    correct: true,
    reason: 'exact',
  });

  assert.deepEqual(ledger.getSummary({
    episodeId: 'episode-1',
    reviewClueIds: ['clue-1', 'clue-1', 'clue-2'],
  }), {
    studied: 2,
    practiced: 2,
    reinforced: 1,
    reviewTotal: 2,
    reviewReinforced: 1,
    due: 1,
  });
});

test('LearningLedger contains corrupt or unavailable local storage', () => {
  const storage = {
    getItem: () => '{broken',
    setItem: () => { throw new Error('quota'); },
  };
  const ledger = new LearningLedger({ storage, storageKey: 'learning' });

  assert.equal(ledger.getEntry('episode', 'clue'), null);
  assert.equal(ledger.recordStudy({ episodeId: 'episode', clueId: 'clue' }).studyCount, 1);
});
