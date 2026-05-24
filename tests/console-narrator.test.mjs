import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { EventBus } = require('../src/core/event-bus.js');
const { GameEvents } = require('../src/contracts/events.js');
const { ConsoleNarrator } = require('../src/render/console-narrator.js');

function createNarrator() {
  const messages = [];
  const eventBus = new EventBus({ now: () => 'now' });
  const narrator = new ConsoleNarrator({
    eventBus,
    consoleRef: {
      log(message) {
        messages.push(message);
      },
    },
    random: () => 0,
  });

  return { eventBus, messages, narrator };
}

test('ConsoleNarrator logs a concise game transcript from event bus events', () => {
  const { eventBus, messages, narrator } = createNarrator();

  narrator.start();
  eventBus.emit(GameEvents.QUESTIONS_LOADED, { count: 216930 }, { source: 'test' });
  eventBus.emit(GameEvents.CLUE_LOADED, {
    clueValue: 400,
    clue: {
      category: 'History',
      question: 'This city hosted the 1893 World Columbian Exposition.',
    },
  }, { source: 'test' });
  eventBus.emit(GameEvents.ANSWER_CORRECT, {
    scoreDelta: 400,
    currentStreak: 1,
    newScore: 400,
  }, { source: 'test' });

  assert.equal(messages.length, 4);
  assert.match(messages[0], /^\[Jeopardish\] 🎬 Welcome to Jeopardish/);
  assert.match(messages[1], /216,930 clues/);
  assert.match(messages[2], /HISTORY for \$400/);
  assert.match(messages[3], /Correct for \+\$400/);
});

test('ConsoleNarrator can unsubscribe cleanly', () => {
  const { eventBus, messages, narrator } = createNarrator();

  narrator.start();
  narrator.stop();
  eventBus.emit(GameEvents.ERROR_REPORTED, { message: 'Nope' }, { source: 'test' });

  assert.equal(messages.length, 1);
});
