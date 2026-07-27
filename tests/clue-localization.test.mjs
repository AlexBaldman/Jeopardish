import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { ClueLocalization } = require('../src/application/clue-localization.js');

function deferred() {
  let resolve;
  const promise = new Promise((done) => { resolve = done; });
  return { promise, resolve };
}

function createHarness({ language = 'pt-BR', translateClue } = {}) {
  const calls = [];
  const sourceClue = {
    id: 'clue-1',
    category: 'Science',
    question: 'This planet has rings.',
    answer: 'Saturn',
    media: [{ type: 'image', src: '/original.png' }],
  };
  const renderer = {
    showTranslationLoading: () => calls.push(['loading']),
    captureRoundView: () => ({ answerVisible: true, input: 'Saturn' }),
    renderClue: (clue, value) => calls.push(['render', clue, value]),
    setRoundPhase: (phase) => calls.push(['phase', phase]),
    restoreRoundView: (view) => calls.push(['restore', view]),
    setControlsEnabled: (enabled) => calls.push(['controls', enabled]),
  };
  const localization = new ClueLocalization({
    translationService: {
      translateClue: translateClue || (async (clue) => ({
        ...clue,
        category: 'Ciência',
        question: 'Este planeta tem anéis.',
        answer: 'Saturno',
      })),
    },
    preferenceStore: { get: (key) => (key === 'language' ? language : null) },
    renderer,
    extractContent: () => ({
      questionText: 'This planet has rings.',
      media: [{ type: 'video', src: '/embedded.mp4' }],
    }),
    getCurrentContext: () => ({ sourceClue }),
    hasActiveClue: () => true,
    getRoundPresentation: () => ({ phase: 'answering', canAnswer: true }),
    getClueValue: () => 400,
    updateDisplayClue: (clue) => calls.push(['update', clue]),
    narrateCurrentClue: () => calls.push(['narrate']),
    warn: (...args) => calls.push(['warn', ...args]),
  });
  return { calls, localization, sourceClue };
}

test('ClueLocalization prepares a translated display clue without changing canonical truth', async () => {
  const { calls, localization, sourceClue } = createHarness();
  const displayClue = await localization.prepare(sourceClue);

  assert.equal(displayClue.category, 'Ciência');
  assert.equal(displayClue.answer, 'Saturno');
  assert.equal(displayClue.media.length, 2);
  assert.equal(sourceClue.category, 'Science');
  assert.equal(sourceClue.answer, 'Saturn');
  assert.ok(calls.some(([name]) => name === 'loading'));
});

test('ClueLocalization restores the exact round presentation after a language refresh', async () => {
  const { calls, localization } = createHarness();
  assert.equal(await localization.refreshCurrent(), true);

  assert.ok(calls.some(([name, clue, value]) => (
    name === 'render' && clue.category === 'Ciência' && value === 400
  )));
  assert.ok(calls.some(([name, phase]) => name === 'phase' && phase === 'answering'));
  assert.ok(calls.some(([name, view]) => name === 'restore' && view.input === 'Saturn'));
  assert.ok(calls.some(([name, enabled]) => name === 'controls' && enabled === true));
  assert.equal(calls.filter(([name]) => name === 'narrate').length, 1);
});

test('ClueLocalization prevents stale refreshes from repainting a newer language request', async () => {
  const first = deferred();
  let request = 0;
  const { calls, localization } = createHarness({
    translateClue: async (clue) => {
      request += 1;
      if (request === 1) return first.promise;
      return { ...clue, category: 'Segunda' };
    },
  });

  const stale = localization.refreshCurrent();
  const current = localization.refreshCurrent();
  assert.equal(await current, true);
  first.resolve({ category: 'Primeira' });
  assert.equal(await stale, false);

  const renders = calls.filter(([name]) => name === 'render');
  assert.equal(renders.length, 1);
  assert.equal(renders[0][1].category, 'Segunda');
});

test('ClueLocalization falls back safely when a provider fails', async () => {
  const { calls, localization, sourceClue } = createHarness({
    translateClue: async () => { throw new Error('provider offline'); },
  });
  const displayClue = await localization.prepare(sourceClue, { showLoading: false });

  assert.equal(displayClue.translationFallback, true);
  assert.equal(displayClue.answer, 'Saturn');
  assert.equal(calls.some(([name]) => name === 'loading'), false);
  assert.equal(calls.filter(([name]) => name === 'warn').length, 1);
});
