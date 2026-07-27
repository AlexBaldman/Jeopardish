import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { HostBeats } = require('../src/host/host-pack.js');
const { BroadcastPresenter } = require('../src/presentation/broadcast-presenter.js');

function createHarness({ language = 'en' } = {}) {
  const calls = [];
  const renderer = new Proxy({}, {
    get(target, name) {
      if (!target[name]) {
        target[name] = (...args) => calls.push([name, ...args]);
      }
      return target[name];
    },
  });
  const hostManager = {
    getActiveHost: () => ({ id: 'visual-host', displayName: 'Visual Host' }),
    getPerformance: (expression) => ({
      state: expression,
      visual: `/host-${expression}.webp`,
      skin: { id: 'skin-1' },
      cueKey: expression,
    }),
  };
  const hostPerformanceDirector = {
    getActivePack: () => ({ id: 'vera-static', displayName: 'Vera Static' }),
    direct(beat, options) {
      calls.push(['direct', beat, options]);
      return {
        beat,
        expression: beat,
        pack: { id: 'vera-static', displayName: 'Vera Static' },
        motion: { primitive: 'react', intensity: 'medium' },
        dialogue: { line: `line:${beat}`, locale: options.locale },
        speech: { locale: options.locale === 'pt-BR' ? 'pt-BR' : 'en-US' },
        receipt: Object.freeze({
          clueId: String(options.facts?.clueId || ''),
        }),
      };
    },
  };
  const preferenceStore = {
    get: (key) => (key === 'language' ? language : null),
  };
  const voiceController = {
    speak(message, options) {
      calls.push(['speak', message, options]);
      return true;
    },
  };
  const copy = {
    hostCues: {},
    emptyAnswerFallback: 'Please answer.',
    voiceClue: (category, value, question) => `${category} ${value}: ${question}`,
    correctStatus: (delta, line) => `+${delta} ${line}`,
    incorrectStatus: (line) => `No. ${line}`,
    voiceCorrect: (delta, streak) => `Correct ${delta} ${streak}`,
    voiceIncorrect: (answer) => `Incorrect ${answer}`,
    voiceReveal: (answer) => `Answer ${answer}`,
    voiceComplete: (score, correct, total) => `Complete ${score} ${correct}/${total}`,
  };
  const presenter = new BroadcastPresenter({
    renderer,
    hostManager,
    hostPerformanceDirector,
    preferenceStore,
    voiceController,
    hostBeats: HostBeats,
    getCopy: () => copy,
  });
  return { calls, presenter };
}

test('BroadcastPresenter presents and narrates one clue performance', () => {
  const { calls, presenter } = createHarness();
  const sourceClue = {
    id: 'clue-1',
    category: 'History',
    performance: { hostLine: 'Authored introduction.' },
  };

  const performance = presenter.presentClue({
    sourceClue,
    displayClue: sourceClue,
    gameState: { currentClueValue: 400 },
    sequence: 2,
  });
  assert.equal(performance.beat, HostBeats.CLUE);
  assert.ok(calls.some(([name, clue, value]) => (
    name === 'renderClue' && clue === sourceClue && value === 400
  )));

  presenter.narrateClue({
    sourceClue,
    displayClue: sourceClue,
    value: 400,
    sequence: 2,
    questionText: 'The reviewed clue.',
  });
  assert.equal(calls.filter(([name]) => name === 'direct').length, 1);
  assert.ok(calls.some(([name, message]) => (
    name === 'speak' && message.includes('History 400: The reviewed clue.')
  )));
});

test('BroadcastPresenter localizes a fresh clue narration when language changes', () => {
  const { calls, presenter } = createHarness({ language: 'pt-BR' });
  const sourceClue = { id: 'clue-2', performance: { hostLine: 'English only.' } };

  presenter.narrateClue({
    sourceClue,
    displayClue: { ...sourceClue, category: 'Historia' },
    value: 200,
    sequence: 1,
    questionText: 'Pergunta',
  });

  const directCall = calls.find(([name]) => name === 'direct');
  assert.equal(directCall[2].locale, 'pt-BR');
  assert.equal(directCall[2].authoredLine, '');
  const speechCall = calls.find(([name]) => name === 'speak');
  assert.equal(speechCall[2].language, 'pt-BR');
});

test('BroadcastPresenter renders judgments without owning scoring or progress', () => {
  const { calls, presenter } = createHarness();
  const result = {
    ok: true,
    isCorrect: true,
    clue: { id: 'clue-3' },
    currentStreak: 3,
    newScore: 1200,
    scoreDelta: 600,
    correctAnswer: 'Canonical',
  };

  const performance = presenter.presentJudgment(result, {
    displayClue: { answer: 'Localized' },
  });
  assert.equal(performance.beat, HostBeats.STREAK);
  assert.ok(calls.some(([name, payload]) => (
    name === 'displayCorrectAnswerMessage' && payload.correctAnswer === 'Localized'
  )));
  assert.equal(calls.some(([name]) => name === 'recordOutcome'), false);
});

test('BroadcastPresenter presents reveal and finale as deterministic scenes', () => {
  const { calls, presenter } = createHarness();
  const reveal = presenter.presentReveal({ sourceClue: { id: 'clue-4' } });
  presenter.narrateReveal('Saturn', reveal);
  const finale = presenter.presentEpisodeComplete({
    score: 1800,
    total: 10,
    counts: { correct: 8 },
    finale: {
      hostLine: 'That concludes the unauthorized transmission.',
      teaser: 'Return tomorrow.',
    },
  });

  assert.equal(reveal.beat, HostBeats.REVEAL);
  assert.equal(finale.beat, HostBeats.EPISODE_COMPLETE);
  assert.ok(calls.some(([name]) => name === 'renderEpisodeComplete'));
  assert.ok(calls.some(([name, message]) => (
    name === 'speak' && message.includes('Complete 1800 8/10')
  )));
});
