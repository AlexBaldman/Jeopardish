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
    answerMatch: { reason: 'fuzzy' },
  }, { source: 'test' });

  assert.equal(messages.length, 4);
  assert.match(messages[0], /^\[JeoPARODY \/ Channel O\] 📺 Welcome to JeoPARODY/);
  assert.match(messages[1], /216,930 clues/);
  assert.match(messages[2], /HISTORY for \$400/);
  assert.match(messages[3], /Correct for \+\$400/);
  assert.match(messages[3], /allow the tiny typo/);
});

test('ConsoleNarrator can unsubscribe cleanly', () => {
  const { eventBus, messages, narrator } = createNarrator();

  narrator.start();
  narrator.stop();
  eventBus.emit(GameEvents.ERROR_REPORTED, { message: 'Nope' }, { source: 'test' });

  assert.equal(messages.length, 1);
});

test('ConsoleNarrator makes episode loading and validation legible', () => {
  const { eventBus, messages, narrator } = createNarrator();

  narrator.start();
  eventBus.emit(GameEvents.EPISODE_SOURCE_REQUESTED, {
    url: '/episode.json',
  }, { source: 'DataLoader' });
  eventBus.emit(GameEvents.EPISODE_SOURCE_LOADED, {
    format: 'episode-pack',
    count: 24,
  }, { source: 'DataLoader' });
  eventBus.emit(GameEvents.EPISODE_READY, {
    title: 'Pilot Broadcast',
    clueCount: 10,
    sourceCount: 24,
    kind: 'authored',
    resumed: false,
  }, { source: 'EpisodeController' });
  eventBus.emit(GameEvents.EPISODE_RESTARTED, {
    episodeId: 'pilot-broadcast',
  }, { source: 'EpisodeController' });

  assert.match(messages[1], /episode desk is opening/i);
  assert.match(messages[2], /episode-pack with 24 clues/i);
  assert.match(messages[3], /Pilot Broadcast/);
  assert.match(messages[3], /10 clues from 24 available/);
  assert.match(messages[4], /rewound to the opening clue/i);
});

test('ConsoleNarrator explains fallback transport and learning annotations', () => {
  const { eventBus, messages, narrator } = createNarrator();

  narrator.start();
  eventBus.emit(GameEvents.EPISODE_FALLBACK_ACTIVATED, {
    fallbackSourceUrl: './questions/runtime-bank.json',
    reason: 'authored pack offline',
  }, { source: 'EpisodeController' });
  eventBus.emit(GameEvents.SESSION_RESULT_ANNOTATED, {
    clueId: 's0e1-08-saturn',
    confidence: 'shaky',
    disputed: true,
  }, { source: 'SessionManager' });

  assert.match(messages[1], /archive understudy/i);
  assert.match(messages[1], /runtime-bank\.json/);
  assert.match(messages[2], /shaky; ruling disputed/);
  assert.match(messages[2], /score remains untouched/i);
});

test('ConsoleNarrator explains voice capability and transcript flow', () => {
  const { eventBus, messages, narrator } = createNarrator();

  narrator.start();
  eventBus.emit(GameEvents.VOICE_ENABLED, {
    capabilities: { narration: true, recognition: true },
  }, { source: 'test' });
  eventBus.emit(GameEvents.VOICE_TRANSCRIPT, {
    transcript: 'Who is Marie Curie',
  }, { source: 'test' });
  eventBus.emit(GameEvents.VOICE_COMMAND, {
    type: 'answer',
    answer: 'Marie Curie',
  }, { source: 'test' });

  assert.match(messages[1], /Narration ready; recognition ready/);
  assert.match(messages[2], /Who is Marie Curie/);
  assert.match(messages[3], /same fair judge/);
});

test('ConsoleNarrator distinguishes host personality from factual authority', () => {
  const { eventBus, messages, narrator } = createNarrator();

  narrator.start();
  eventBus.emit(GameEvents.HOST_PACK_CHANGED, {
    packId: 'vera-static',
    displayName: 'Vera Static',
  }, { source: 'HostPerformanceDirector' });
  eventBus.emit(GameEvents.HOST_PERFORMANCE_DIRECTED, {
    packId: 'vera-static',
    beat: 'correct',
    expression: 'correct',
    source: 'line-bank',
    locale: 'en',
  }, { source: 'HostPerformanceDirector' });

  assert.match(messages[1], /Vera Static has taken the desk/);
  assert.match(messages[1], /facts remain under separate management/);
  assert.match(messages[2], /Host cue correct/);
  assert.match(messages[2], /No scoring privileges issued/);
});

test('ConsoleNarrator identifies routed and rejected input commands', () => {
  const { eventBus, messages, narrator } = createNarrator();

  narrator.start();
  eventBus.emit(GameEvents.INPUT_COMMAND_DISPATCHED, {
    command: 'new-clue',
    source: 'keyboard',
  }, { source: 'InputController' });
  eventBus.emit(GameEvents.INPUT_COMMAND_REJECTED, {
    command: 'invent-rule',
    source: 'voice',
  }, { source: 'InputController' });

  assert.match(messages[1], /keyboard routed “new-clue”/);
  assert.match(messages[2], /voice requested “invent-rule”/);
});

test('ConsoleNarrator marks application lifecycle boundaries', () => {
  const { eventBus, messages, narrator } = createNarrator();

  narrator.start();
  eventBus.emit(GameEvents.APPLICATION_STARTED, {
    voiceEnabled: false,
  }, { source: 'ApplicationComposition' });
  eventBus.emit(GameEvents.APPLICATION_STOPPED, {
    reason: 'test-complete',
  }, { source: 'ApplicationComposition' });

  assert.match(messages[1], /Composition root online/);
  assert.match(messages[2], /signing off \(test-complete\)/);
});

test('ConsoleNarrator exposes useful round-kernel transitions without narrating every animation beat', () => {
  const { eventBus, messages, narrator } = createNarrator();

  narrator.start();
  eventBus.emit(GameEvents.ROUND_STARTED, { roundId: 'round-7' }, { source: 'RoundKernel' });
  eventBus.emit(GameEvents.ROUND_PHASE_CHANGED, {
    previousPhase: 'clue-intro',
    nextPhase: 'answering',
    reason: 'clue-presented',
    roundId: 'round-7',
  }, { source: 'RoundKernel' });
  eventBus.emit(GameEvents.ROUND_PHASE_CHANGED, {
    previousPhase: 'answering',
    nextPhase: 'judging',
    reason: 'answer-submitted',
    roundId: 'round-7',
  }, { source: 'RoundKernel' });
  eventBus.emit(GameEvents.ROUND_PHASE_CHANGED, {
    previousPhase: 'judging',
    nextPhase: 'correct',
    reason: 'answer-judged',
    roundId: 'round-7',
  }, { source: 'RoundKernel' });

  assert.equal(messages.length, 4);
  assert.match(messages[1], /round-7 has the floor/);
  assert.match(messages[2], /Input is live/);
  assert.match(messages[3], /deterministic judge/);
});
