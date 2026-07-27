import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { EventBus } = require('../src/core/event-bus.js');
const { GameEvents } = require('../src/contracts/events.js');
const { RoundKernel, RoundPhases } = require('../src/core/round-kernel.js');
const { StudyController } = require('../src/application/study-controller.js');
const { LearningLedger } = require('../src/learning/learning-ledger.js');

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

function createHarness({ locale = 'en', renderFailure = false, reviewed = false } = {}) {
  const eventBus = new EventBus({ now: () => 'now' });
  const events = [];
  eventBus.on('*', (event) => events.push(event));
  const roundKernel = new RoundKernel({ eventBus, reducedMotion: true });
  const score = { score: 400, currentStreak: 2, bestStreak: 3 };
  const calls = [];
  const renderer = {
    captureRoundView: () => ({
      userAnswer: 'Chi',
      answerVisible: true,
      gameMoment: 'reveal',
      focusedElementId: 'inputbox',
    }),
    renderStudyPanel: (packet, actions) => {
      if (renderFailure) throw new Error('study panel unavailable');
      calls.push(['panel', packet, actions]);
    },
    renderStudyResponse: (response) => calls.push(['response', response]),
    renderStudyReinforcement: (reinforcement, language) => (
      calls.push(['reinforcement', reinforcement, language])
    ),
    renderStudyReinforcementResult: (result) => calls.push(['reinforcement-result', result]),
    setStudyOpen: (open) => calls.push(['open', open]),
    setControlsEnabled: (enabled) => calls.push(['controls', enabled]),
    setStudyAvailable: (available) => calls.push(['available', available]),
    restoreRoundView: (view) => calls.push(['restore', view]),
  };
  const context = {
    sourceClue: {
      id: 'clue-42',
      category: 'Geography',
      question: 'Capital of Italy',
      answer: 'Rome',
      value: '$400',
      acceptedAnswers: ['Roma'],
      explanation: reviewed ? 'Rome is Italy’s capital city.' : '',
      sources: reviewed ? [{
        title: 'Reviewed geography source',
        url: 'https://example.com/rome',
      }] : [],
      learning: reviewed ? {
        backstory: 'Rome became the capital of a unified Italy in 1871.',
        connections: ['Vatican City is an enclave within Rome.'],
        reinforcement: {
          prompt: 'Which country has Rome as its capital?',
          answer: 'Italy',
          acceptedAnswers: ['the country of Italy'],
          explanation: 'Rome is the capital of Italy.',
          promptPt: 'De qual país Roma é a capital?',
          answerPt: 'Itália',
          acceptedAnswersPt: ['Italia'],
          explanationPt: 'Roma é a capital da Itália.',
        },
      } : {},
    },
    displayClue: locale === 'pt-BR' ? {
      id: 'clue-42',
      category: 'Geografia',
      question: 'Capital da Itália',
      answer: 'Roma',
      value: '$400',
    } : null,
    locale,
    episode: reviewed
      ? { id: 'reviewed-episode', reviewStatus: 'reviewed' }
      : { id: 'archive-episode', reviewStatus: 'archive' },
  };
  const learningLedger = new LearningLedger({
    storage: createStorage(),
    now: () => '2026-07-27T00:00:00.000Z',
  });
  const controller = new StudyController({
    roundKernel,
    getGameState: () => ({ ...score }),
    renderer,
    eventBus,
    learningLedger,
    getContext: () => context,
    extractContent: (clue) => ({
      questionText: clue.question,
      media: [{ type: 'image', url: '/rome.jpg' }],
    }),
    revealAnswer: () => roundKernel.reveal(() => calls.push(['reveal'])),
    renderHost: (expression) => calls.push(['host', expression]),
    speak: (message) => calls.push(['speak', message]),
  });
  return { controller, roundKernel, score, calls, events, learningLedger };
}

test('StudyController owns entry, grounded actions, and exact round resume', async () => {
  const harness = createHarness({ locale: 'pt-BR' });
  await harness.roundKernel.introduceClue(() => {});

  assert.equal(await harness.controller.enter(), true);
  assert.equal(harness.controller.isOpen(), true);
  assert.equal(harness.roundKernel.phase, RoundPhases.PAUSED);
  assert.deepEqual(harness.controller.getState(), {
    open: true,
    clueId: 'clue-42',
    grounding: 'canonical-only',
    reinforcement: false,
    mastery: 'studying',
  });

  const panel = harness.calls.find(([name]) => name === 'panel');
  assert.equal(panel[1].canonical.answer, 'Rome');
  assert.equal(panel[1].presentation.answer, 'Roma');
  assert.equal(panel[2][0].label, 'Explique de forma simples');

  const response = harness.controller.selectAction('why');
  assert.match(response, /resposta canônica.*Roma/i);
  assert.equal(harness.controller.selectAction('invent-facts'), null);

  assert.equal(harness.controller.exit(), true);
  assert.equal(harness.controller.isOpen(), false);
  assert.equal(harness.roundKernel.phase, RoundPhases.ADVANCE_READY);
  assert.ok(harness.calls.some(([name]) => name === 'restore'));
  assert.ok(harness.events.some((event) => event.type === GameEvents.STUDY_ENTERED));
  assert.ok(harness.events.some((event) => event.type === GameEvents.STUDY_ACTION_SELECTED));
  assert.ok(harness.events.some((event) => (
    event.type === GameEvents.STUDY_EXITED
      && event.payload.scoreIntegrity === true
  )));
});

test('StudyController carries reviewed explanations, sources, and learning context into the packet', async () => {
  const harness = createHarness({ reviewed: true });
  await harness.roundKernel.introduceClue(() => {});

  assert.equal(await harness.controller.enter(), true);
  const packet = harness.calls.find(([name]) => name === 'panel')[1];

  assert.equal(packet.grounding, 'reviewed');
  assert.equal(packet.explanation, 'Rome is Italy’s capital city.');
  assert.equal(packet.citations[0].title, 'Reviewed geography source');
  assert.match(packet.backstory, /1871/);
  assert.equal(packet.connections.length, 1);
  assert.ok(packet.canonical.acceptedAnswers.includes('roma'));
  assert.equal(packet.reinforcement.answer, 'Italy');
});

test('StudyController records a fuzzy-matched reinforcement without touching score', async () => {
  const harness = createHarness({ reviewed: true });
  await harness.roundKernel.introduceClue(() => {});
  await harness.controller.enter();

  const prompt = harness.controller.selectAction('quiz');
  const result = harness.controller.submitReinforcement('Itali');

  assert.match(prompt, /Which country/i);
  assert.deepEqual(result, {
    correct: true,
    reason: 'fuzzy',
    mastery: 'reinforced',
  });
  assert.deepEqual(harness.score, { score: 400, currentStreak: 2, bestStreak: 3 });
  assert.equal(
    harness.learningLedger.getEntry('reviewed-episode', 'clue-42').mastery,
    'reinforced',
  );
  assert.ok(harness.events.some((event) => (
    event.type === GameEvents.STUDY_REINFORCEMENT_ANSWERED
      && event.payload.correct === true
      && !Object.hasOwn(event.payload, 'answer')
  )));
});

test('StudyController detects score mutation without losing the resumable round', async () => {
  const harness = createHarness();
  await harness.roundKernel.introduceClue(() => {});
  await harness.controller.enter();
  harness.score.score = 9999;

  assert.equal(harness.controller.exit(), true);
  assert.equal(harness.roundKernel.phase, RoundPhases.ADVANCE_READY);
  assert.ok(harness.events.some((event) => (
    event.type === GameEvents.ERROR_REPORTED
      && event.payload.code === 'study-mutated-score'
  )));
  assert.ok(harness.events.some((event) => (
    event.type === GameEvents.STUDY_EXITED
      && event.payload.scoreIntegrity === false
  )));
});

test('StudyController rolls back the round when study presentation fails', async () => {
  const harness = createHarness({ renderFailure: true });
  await harness.roundKernel.introduceClue(() => {});

  assert.equal(await harness.controller.enter(), false);
  assert.equal(harness.controller.isOpen(), false);
  assert.equal(harness.roundKernel.phase, RoundPhases.ADVANCE_READY);
  assert.ok(harness.calls.some(([name, open]) => name === 'open' && open === false));
  assert.ok(harness.events.some((event) => (
    event.type === GameEvents.ERROR_REPORTED
      && event.payload.code === 'study-entry-failed'
  )));
});

test('StudyController refuses entry without a clue or a pausable round', async () => {
  const harness = createHarness();

  assert.equal(await harness.controller.enter(), false);
  assert.equal(harness.controller.isOpen(), false);
  assert.equal(harness.controller.selectAction('why'), null);
  assert.equal(harness.controller.exit(), false);
});
