import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  AUTHORED_SEQUENCE_MODE,
  RANDOM_SEQUENCE_MODE,
  ConfidenceRatings,
  DEFAULT_STORAGE_KEY,
  SESSION_VERSION,
  SessionManager,
  getClueId,
} = require('../src/session/session-manager.js');

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

test('SessionManager shuffles classic clues without repeats', () => {
  const bank = createBank(12);
  const manager = new SessionManager({
    storage: createStorage(),
    episodeLength: 12,
    random: () => 0,
  });

  manager.start(bank, {
    id: 'classic-random',
    sequenceMode: RANDOM_SEQUENCE_MODE,
    episodeLength: 12,
  });

  assert.equal(manager.getProgress().sequenceMode, RANDOM_SEQUENCE_MODE);
  assert.equal(new Set(manager.session.clueIds).size, 12);
  assert.notDeepEqual(manager.session.clueIds, bank.map(({ id }) => id));
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
  manager.recordResult({
    outcome: 'correct',
    clue: manager.getCurrentClue(),
    isCorrect: true,
    creditEligible: false,
    reason: 'correct-after-coaching',
    score: 200,
  });
  manager.recordResult({ outcome: 'revealed', clue: manager.getCurrentClue(), score: 200 });

  assert.equal(manager.isComplete(), true);
  assert.deepEqual(manager.getProgress().counts, {
    correct: 1,
    incorrect: 0,
    revealed: 1,
    skipped: 0,
  });
  assert.equal(manager.getProgress().score, 200);
  assert.deepEqual(manager.getProgress().credit, {
    eligibleAttempts: 0,
    earned: 0,
  });
  assert.deepEqual(manager.getProgress().review, {
    missed: 0,
    revealed: 1,
    shaky: 0,
    total: 1,
  });
  assert.equal(manager.getReviewQueues().revealed.length, 1);
  assert.equal(manager.session.results[0].isCorrect, true);
  assert.equal(manager.session.results[0].creditEligible, false);
});

test('SessionManager preserves authored clue order and invalidates stale content revisions', () => {
  const storage = createStorage();
  const bank = createBank(5);
  const first = new SessionManager({ storage });
  first.start(bank, {
    id: 'authored-pilot',
    sequenceMode: AUTHORED_SEQUENCE_MODE,
    contentRevision: 1,
    episodeLength: 3,
  });

  assert.deepEqual(
    first.session.clueIds,
    ['clue-0', 'clue-1', 'clue-2'],
  );
  first.recordResult({ outcome: 'correct', clue: first.getCurrentClue(), score: 200 });

  const revised = new SessionManager({ storage });
  const result = revised.start(bank, {
    id: 'authored-pilot',
    sequenceMode: AUTHORED_SEQUENCE_MODE,
    contentRevision: 2,
    episodeLength: 3,
  });

  assert.equal(result.resumed, false);
  assert.equal(revised.getProgress().answered, 0);
  assert.equal(revised.getProgress().contentRevision, 2);
});

test('SessionManager records confidence and disputes without changing competitive facts', () => {
  const manager = new SessionManager({ storage: createStorage(), episodeLength: 2 });
  manager.start(createBank(4));
  const clue = manager.getCurrentClue();
  manager.recordResult({
    outcome: 'correct',
    clue,
    score: 200,
    currentStreak: 1,
  });
  const annotated = manager.annotateLatestResult({
    clueId: clue.id,
    confidence: ConfidenceRatings.SHAKY,
    disputed: true,
  });

  assert.equal(annotated.score, 200);
  assert.equal(annotated.counts.correct, 1);
  assert.equal(annotated.confidence.shaky, 1);
  assert.equal(annotated.disputes, 1);
  assert.equal(annotated.review.shaky, 1);
  assert.equal(annotated.review.total, 1);
  assert.equal(manager.getReviewQueues().shaky[0].clueId, clue.id);
});

test('SessionManager adopts authored episode identity and length', () => {
  const manager = new SessionManager({ storage: createStorage() });
  manager.start(createBank(6), {
    id: 'authored-pilot',
    title: 'The Authored Pilot',
    episodeLength: 3,
  });

  assert.equal(manager.getProgress().episodeId, 'authored-pilot');
  assert.equal(manager.getProgress().title, 'The Authored Pilot');
  assert.equal(manager.getProgress().total, 3);
});

test('SessionManager migrates version-one outcomes into explicit judgment facts', () => {
  const storage = createStorage();
  const bank = createBank();
  const original = new SessionManager({ storage });
  original.start(bank);
  original.recordResult({
    outcome: 'incorrect',
    clue: original.getCurrentClue(),
    score: 0,
  });

  const legacy = JSON.parse(storage.getItem(DEFAULT_STORAGE_KEY));
  legacy.version = 1;
  delete legacy.results[0].isCorrect;
  delete legacy.results[0].creditEligible;
  delete legacy.results[0].reason;
  delete legacy.results[0].scoreDelta;
  storage.setItem(DEFAULT_STORAGE_KEY, JSON.stringify(legacy));

  const resumed = new SessionManager({ storage });
  assert.equal(resumed.start(bank).resumed, true);
  assert.equal(resumed.session.version, SESSION_VERSION);
  assert.deepEqual(
    Object.fromEntries(
      ['isCorrect', 'creditEligible', 'reason', 'scoreDelta']
        .map((key) => [key, resumed.session.results[0][key]]),
    ),
    {
      isCorrect: false,
      creditEligible: true,
      reason: 'legacy-incorrect',
      scoreDelta: 0,
    },
  );
});
