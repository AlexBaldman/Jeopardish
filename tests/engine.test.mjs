import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { EventBus } = require('../src/core/event-bus.js');
const { GameEvents } = require('../src/contracts/events.js');
const { GameEngine } = require('../src/core/game-engine.js');

function createEngine() {
  const eventBus = new EventBus({
    now: () => '2026-05-22T00:00:00.000Z',
  });
  const events = [];
  eventBus.on('*', (event) => events.push(event));

  return {
    eventBus,
    events,
    engine: new GameEngine({
      eventBus,
      bestStreak: 2,
      now: () => '2026-05-22T00:00:00.000Z',
    }),
  };
}

const clue = {
  category: 'History',
  question: 'This city hosted the 1893 World Columbian Exposition.',
  answer: 'What is Chicago?',
  value: '$400',
};

test('EventBus emits targeted and wildcard events', () => {
  const bus = new EventBus({ now: () => 'now' });
  const targeted = [];
  const wildcard = [];

  bus.on('PING', (event) => targeted.push(event));
  bus.on('*', (event) => wildcard.push(event));

  bus.emit('PING', { ok: true }, { source: 'test' });

  assert.equal(targeted.length, 1);
  assert.equal(wildcard.length, 1);
  assert.equal(targeted[0].payload.ok, true);
  assert.equal(targeted[0].meta.source, 'test');
});

test('GameEngine initializes and marks the game ready', () => {
  const { engine, events } = createEngine();

  engine.init();
  engine.ready();

  assert.equal(engine.getState().phase, 'board');
  assert.deepEqual(
    events.map((event) => event.type),
    [
      GameEvents.GAME_INIT,
      GameEvents.PHASE_CHANGED,
      GameEvents.PHASE_CHANGED,
      GameEvents.GAME_READY,
    ],
  );
});

test('GameEngine scores a correct answer and preserves best streak', () => {
  const { engine, events } = createEngine();

  engine.init();
  engine.loadClue(clue);
  const result = engine.submitAnswer('Chicago');

  assert.equal(result.isCorrect, true);
  assert.equal(result.scoreDelta, 400);
  assert.equal(result.newScore, 400);
  assert.equal(result.currentStreak, 1);
  assert.equal(result.bestStreak, 2);
  assert.equal(result.answerMatch.reason, 'exact');
  assert.equal(engine.getActiveClue(), null);
  assert.equal(events.some((event) => event.type === GameEvents.ANSWER_CORRECT), true);
});

test('GameEngine retains readable answers and detailed fuzzy match results', () => {
  const { engine } = createEngine();

  engine.init();
  engine.loadClue({
    category: 'Presidents',
    question: 'This president appears on the dollar bill.',
    answer: '(George) Washington',
    value: '$400',
  });
  const fuzzyResult = engine.submitAnswer('Washngton');

  assert.equal(fuzzyResult.isCorrect, true);
  assert.equal(fuzzyResult.answerMatch.reason, 'fuzzy');
  assert.equal(fuzzyResult.answerMatch.correctAnswer, 'washington');

  engine.loadClue({
    category: 'Geography',
    question: 'This nation has Tehran as its capital.',
    answer: 'Iran',
    value: '$400',
  });
  const incorrectResult = engine.submitAnswer('Iraq');

  assert.equal(incorrectResult.isCorrect, false);
  assert.equal(incorrectResult.correctAnswer, 'Iran');
  assert.equal(incorrectResult.answerMatch.reason, 'mismatch');
});

test('GameEngine accepts a localized answer without replacing canonical truth', () => {
  const { engine } = createEngine();
  engine.init();
  engine.loadClue({
    id: 77,
    category: 'Geography',
    question: 'This city is the capital of Italy.',
    answer: 'Rome',
    value: 400,
  });

  const result = engine.submitAnswer('Roma', { acceptedAnswers: ['Roma'] });

  assert.equal(result.isCorrect, true);
  assert.equal(result.correctAnswer, 'Rome');
  assert.equal(result.answerMatch.matchedAnswer, 'Roma');
});

test('GameEngine resets score and streak on incorrect answer to match existing behavior', () => {
  const { engine, events } = createEngine();

  engine.init();
  engine.loadClue(clue);
  engine.submitAnswer('Chicago');
  engine.loadClue({ ...clue, value: '$800' });
  const result = engine.submitAnswer('Boston');

  assert.equal(result.isCorrect, false);
  assert.equal(result.newScore, 0);
  assert.equal(result.currentStreak, 0);
  assert.equal(engine.getState().score, 0);
  assert.equal(events.some((event) => event.type === GameEvents.ANSWER_INCORRECT), true);
});
