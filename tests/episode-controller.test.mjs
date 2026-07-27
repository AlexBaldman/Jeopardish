import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { EventBus } = require('../src/core/event-bus.js');
const { GameEngine } = require('../src/core/game-engine.js');
const { GameEvents } = require('../src/contracts/events.js');
const { SessionManager } = require('../src/session/session-manager.js');
const {
  EpisodeController,
  createOutcomeFacts,
} = require('../src/application/episode-controller.js');

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
    removeItem: (key) => values.delete(key),
  };
}

function createBank(count = 4) {
  return Array.from({ length: count }, (_, index) => ({
    id: `clue-${index}`,
    category: `Category ${index}`,
    value: `$${(index + 1) * 200}`,
    question: `Question ${index}`,
    answer: `Answer ${index}`,
  }));
}

function createHarness({
  source = createBank(),
  episodeLength = 2,
  failPrimary = false,
  fallbackSource = createBank(),
} = {}) {
  const eventBus = new EventBus({ now: () => 'now' });
  const events = [];
  eventBus.on('*', (event) => events.push(event));
  const gameEngine = new GameEngine({ eventBus });
  const sessionManager = new SessionManager({
    eventBus,
    storage: createStorage(),
    now: () => '2026-07-27T00:00:00.000Z',
  });
  const calls = [];
  const dataLoader = {
    async loadEpisodeSource(url, { signal } = {}) {
      calls.push(['source', url, signal]);
      if (failPrimary && url === './primary.json') {
        throw new Error('primary transport unavailable');
      }
      return url === './fallback.json' ? fallbackSource : source;
    },
  };
  const cluePipeline = {
    cancelled: 0,
    async load(options) {
      calls.push(['pipeline']);
      options.onLoading();
      const candidates = options.getCandidates(8);
      const selected = candidates[0];
      if (!selected) {
        options.onEmpty();
        return null;
      }
      options.onCandidate({ clue: selected.clue, candidate: selected });
      const display = await options.prepareDisplay(selected.clue, { signal: {} });
      options.commit(selected.clue, display);
      options.onReady(selected.clue, display);
      return selected.clue;
    },
    cancel() {
      this.cancelled += 1;
    },
  };
  const mediaPreflight = {
    failures: [],
    markUnavailable(item, reason) {
      this.failures.push({ item, reason });
    },
  };
  const roundKernel = {
    cancellations: [],
    cancel(phase, reason) {
      this.cancellations.push({ phase, reason });
    },
  };
  const controller = new EpisodeController({
    dataLoader,
    sessionManager,
    cluePipeline,
    gameEngine,
    roundKernel,
    mediaPreflight,
    eventBus,
    sourceUrl: failPrimary ? './primary.json' : undefined,
    fallbackSourceUrl: failPrimary ? './fallback.json' : null,
    legacyEpisode: {
      id: 'test-episode',
      title: 'The Test Broadcast',
      episodeLength,
    },
    timeoutMs: 1000,
    scheduler: () => 1,
    clearScheduler: () => {},
    getMedia: () => [],
    prepareDisplay: async (clue) => ({ ...clue, category: `${clue.category} Display` }),
    onEpisodeLoading: () => calls.push(['episode-loading']),
    onEpisodeLoaded: (detail) => calls.push(['episode-loaded', detail]),
    onClueLoading: () => calls.push(['clue-loading']),
    onClueCommitted: (detail) => calls.push(['clue-committed', detail]),
    onClueReady: () => calls.push(['clue-ready']),
    onProgress: (progress) => calls.push(['progress', progress]),
    onComplete: (progress) => calls.push(['complete', progress]),
    onRestart: () => calls.push(['restart']),
    onError: (error) => calls.push(['error', error]),
  });
  return {
    calls,
    cluePipeline,
    controller,
    eventBus,
    events,
    gameEngine,
    mediaPreflight,
    roundKernel,
    sessionManager,
  };
}

test('EpisodeController loads a legacy source into a versioned episode and commits the first clue', async () => {
  const harness = createHarness();

  const pack = await harness.controller.start();

  assert.equal(pack.id, 'test-episode');
  assert.equal(pack.kind, 'legacy-adapter');
  assert.equal(pack.episodeLength, 2);
  assert.equal(harness.controller.getState().started, true);
  assert.equal(harness.controller.getCurrentContext().displayClue.category.endsWith('Display'), true);
  assert.equal(harness.gameEngine.getActiveClue().id, harness.controller.getCurrentContext().sourceClue.id);
  assert.equal(harness.sessionManager.getProgress().title, 'The Test Broadcast');
  assert.ok(harness.events.some((event) => (
    event.type === GameEvents.EPISODE_READY
    && event.payload.kind === 'legacy-adapter'
  )));
});

test('EpisodeController falls back only when the primary source transport fails', async () => {
  const fallbackSource = createBank(3);
  const harness = createHarness({
    failPrimary: true,
    fallbackSource,
    episodeLength: 2,
  });

  const pack = await harness.controller.start();

  assert.equal(pack.kind, 'legacy-adapter');
  assert.deepEqual(
    harness.calls.filter(([name]) => name === 'source').map(([, url]) => url),
    ['./primary.json', './fallback.json'],
  );
  assert.ok(harness.events.some((event) => (
    event.type === GameEvents.EPISODE_FALLBACK_ACTIVATED
      && event.payload.fallbackSourceUrl === './fallback.json'
  )));
  const loaded = harness.calls.find(([name]) => name === 'episode-loaded')[1];
  assert.equal(loaded.fallback, true);
});

test('EpisodeController persists correctness separately from competitive credit', async () => {
  const harness = createHarness();
  await harness.controller.start();

  harness.controller.recordOutcome('correct', {
    judgment: {
      isCorrect: true,
      creditEligible: false,
      reason: 'correct-after-reveal',
      scoreDelta: 0,
    },
  });
  harness.controller.recordOutcome('incorrect');

  assert.equal(harness.sessionManager.session.results.length, 1);
  assert.deepEqual(
    Object.fromEntries(
      ['outcome', 'isCorrect', 'creditEligible', 'reason', 'scoreDelta']
        .map((key) => [key, harness.sessionManager.session.results[0][key]]),
    ),
    {
      outcome: 'correct',
      isCorrect: true,
      creditEligible: false,
      reason: 'correct-after-reveal',
      scoreDelta: 0,
    },
  );
  assert.deepEqual(harness.sessionManager.getProgress().credit, {
    eligibleAttempts: 0,
    earned: 0,
  });
});

test('EpisodeController completes an episode with distinct missed and revealed review queues', async () => {
  const harness = createHarness({ episodeLength: 2 });
  await harness.controller.start();

  harness.controller.recordOutcome('incorrect', {
    judgment: { isCorrect: false, creditEligible: true, reason: 'wrong-answer' },
  });
  await harness.controller.nextClue();
  harness.controller.recordOutcome('revealed');
  const progress = await harness.controller.nextClue();
  const queues = harness.controller.getReviewQueues();

  assert.equal(progress.complete, true);
  assert.deepEqual(progress.review, {
    missed: 1,
    revealed: 1,
    shaky: 0,
    total: 2,
  });
  assert.equal(queues.missed.length, 1);
  assert.equal(queues.revealed.length, 1);
  assert.equal(harness.controller.getState().completeVisible, true);
  assert.equal(harness.roundKernel.cancellations.at(-1).reason, 'episode-complete');
  assert.ok(harness.calls.some(([name]) => name === 'complete'));
});

test('EpisodeController decorates progress with finale data and persists player annotations', async () => {
  const source = {
    schemaVersion: 1,
    id: 'authored-broadcast',
    title: 'Authored Broadcast',
    kind: 'authored',
    sequenceMode: 'authored-order',
    contentRevision: 2,
    reviewStatus: 'reviewed',
    episodeLength: 1,
    finale: {
      artifactTitle: 'BROADCAST O',
      artifactBody: 'A decoded signal.',
    },
    clues: [{
      id: 'authored-1',
      category: 'Signals',
      value: 200,
      clue: 'This is a reviewed clue.',
      answer: 'Signal',
      explanation: 'The explanation is reviewed.',
      sources: [{ title: 'Example', url: 'https://example.com/' }],
    }],
  };
  const harness = createHarness({ source, episodeLength: 1 });
  await harness.controller.start();
  harness.controller.recordOutcome('correct');
  const progress = harness.controller.annotateCurrentResult({
    confidence: 'shaky',
    disputed: true,
  });

  assert.equal(progress.finale.artifactTitle, 'BROADCAST O');
  assert.equal(progress.episode.contentRevision, 2);
  assert.equal(progress.latestResult.confidence, 'shaky');
  assert.equal(progress.latestResult.disputed, true);
  assert.equal(progress.review.total, 1);
});

test('EpisodeController replaces runtime media failures without consuming progress', async () => {
  const harness = createHarness();
  await harness.controller.start();
  const before = harness.sessionManager.getProgress().answered;

  await harness.controller.replaceFailedMedia({
    item: { type: 'image', url: 'https://example.test/broken.jpg' },
    reason: 'load-error',
  });

  assert.equal(harness.sessionManager.getProgress().answered, before);
  assert.equal(harness.mediaPreflight.failures.length, 1);
  assert.ok(harness.events.some((event) => event.type === GameEvents.MEDIA_RUNTIME_FAILED));
});

test('EpisodeController contains invalid source failures and cancels owned work', async () => {
  const harness = createHarness({ source: { schemaVersion: 99, clues: [] } });

  assert.equal(await harness.controller.start(), null);
  assert.equal(harness.controller.getState().started, false);
  assert.ok(harness.events.some((event) => (
    event.type === GameEvents.ERROR_REPORTED
    && event.payload.code === 'episode-start-failed'
  )));
  assert.equal(harness.controller.destroy(), true);
  assert.equal(harness.cluePipeline.cancelled, 1);
  assert.equal(harness.controller.getState().destroyed, true);
  assert.equal(await harness.controller.start(), null);
});

test('EpisodeController refuses an authored pack that has not passed review', async () => {
  const harness = createHarness({
    source: {
      schemaVersion: 1,
      id: 'draft-broadcast',
      title: 'Draft Broadcast',
      kind: 'authored',
      reviewStatus: 'draft',
      episodeLength: 1,
      clues: [{
        id: 'draft-1',
        category: 'Drafts',
        value: 200,
        clue: 'This content has not passed review.',
        answer: 'A draft',
        explanation: 'Still true, still not approved for production.',
        sources: [{ title: 'Example', url: 'https://example.com/' }],
      }],
    },
    episodeLength: 1,
  });

  assert.equal(await harness.controller.start(), null);
  assert.ok(harness.events.some((event) => (
    event.type === GameEvents.ERROR_REPORTED
    && event.payload.message.includes('reviewStatus')
  )));
});

test('outcome facts provide safe defaults for judged and revealed responses', () => {
  assert.deepEqual(createOutcomeFacts('incorrect'), {
    outcome: 'incorrect',
    isCorrect: false,
    creditEligible: true,
    reason: 'incorrect',
    scoreDelta: 0,
  });
  assert.deepEqual(createOutcomeFacts('revealed'), {
    outcome: 'revealed',
    isCorrect: null,
    creditEligible: false,
    reason: 'answer-revealed',
    scoreDelta: 0,
  });
});
