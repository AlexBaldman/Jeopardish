import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { EventBus } = require('../src/core/event-bus.js');
const { GameEvents } = require('../src/contracts/events.js');
const { DefaultHostPacks, HostBeats } = require('../src/host/host-pack.js');
const {
  HostPerformanceDirector,
  PERFORMANCE_SCHEMA,
} = require('../src/host/host-performance-director.js');

test('HostPerformanceDirector emits one immutable deterministic presentation command', () => {
  const eventBus = new EventBus({ now: () => 'now' });
  const events = [];
  eventBus.on('*', (event) => events.push(event));
  const director = new HostPerformanceDirector({ eventBus });
  const options = {
    locale: 'en',
    facts: {
      clueId: 'clue-7',
      streak: 3,
      submittedAnswer: 'private player response',
    },
    authoredLine: 'An approved authored line.',
  };

  const first = director.direct(HostBeats.CLUE, options);
  const second = director.direct(HostBeats.CLUE, options);

  assert.equal(first.schema, PERFORMANCE_SCHEMA);
  assert.equal(first.expression, 'clue');
  assert.equal(first.motion.primitive, 'enter');
  assert.equal(first.dialogue.line, 'An approved authored line.');
  assert.equal(first.dialogue.source, 'authored');
  assert.deepEqual(first, second);
  assert.equal(Object.isFrozen(first), true);
  assert.equal(JSON.stringify(first).includes('private player response'), false);
  const directed = events.find(({ type }) => type === GameEvents.HOST_PERFORMANCE_DIRECTED);
  assert.deepEqual(directed.payload, {
    packId: 'xander-trefleck',
    beat: 'clue',
    expression: 'clue',
    locale: 'en',
    source: 'authored',
  });
});

test('three HostPacks perform the same beat distinctly without changing supplied facts', () => {
  const facts = Object.freeze({
    clueId: 'same-clue',
    streak: 4,
    score: 1200,
    canonicalAnswer: 'Saturn',
  });
  const lines = DefaultHostPacks.map((pack) => {
    const director = new HostPerformanceDirector({
      packs: DefaultHostPacks,
      activePackId: pack.id,
    });
    const command = director.direct(HostBeats.CORRECT, { facts });
    assert.deepEqual(facts, {
      clueId: 'same-clue',
      streak: 4,
      score: 1200,
      canonicalAnswer: 'Saturn',
    });
    assert.deepEqual(command.receipt, { clueId: 'same-clue', streak: '4' });
    assert.equal(Object.hasOwn(command, 'score'), false);
    return command.dialogue.line;
  });

  assert.equal(new Set(lines).size, 3);
});

test('HostPerformanceDirector cycles packs and keeps Portuguese performance local', () => {
  const eventBus = new EventBus({ now: () => 'now' });
  const events = [];
  eventBus.on('*', (event) => events.push(event));
  const director = new HostPerformanceDirector({ eventBus });

  assert.equal(director.cyclePack(1).id, 'vera-static');
  const performance = director.direct(HostBeats.INCORRECT, {
    locale: 'pt-BR',
    authoredLine: 'This English line must not leak into Portuguese.',
    facts: { clueId: 'local-clue' },
  });

  assert.equal(performance.pack.id, 'vera-static');
  assert.equal(performance.speech.locale, 'pt-BR');
  assert.equal(performance.dialogue.source, 'line-bank');
  assert.equal(performance.dialogue.line.includes('evidência'), true);
  assert.ok(events.some(({ type }) => type === GameEvents.HOST_PACK_CHANGED));
});
