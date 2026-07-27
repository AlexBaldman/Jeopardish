import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import test from 'node:test';

const require = createRequire(import.meta.url);
const { GameEvents } = require('../src/contracts/events.js');
const { EventBus } = require('../src/core/event-bus.js');
const {
  NoopTelemetrySink,
  ProductEventNames,
  ProductTelemetry,
  TELEMETRY_SCHEMA,
} = require('../src/telemetry/product-telemetry.js');

function createHarness(sink = { events: [], record(event) { this.events.push(event); } }) {
  const eventBus = new EventBus({ now: () => 'event-time' });
  const telemetry = new ProductTelemetry({
    eventBus,
    sink,
    now: () => 'product-time',
  });
  telemetry.start();
  return { eventBus, sink, telemetry };
}

test('NoopTelemetrySink performs no storage or network work', () => {
  assert.equal(new NoopTelemetrySink().record({ name: 'anything' }), false);
});

test('ProductTelemetry records one privacy-safe activation without answer content', () => {
  const { eventBus, sink, telemetry } = createHarness();
  eventBus.emit(GameEvents.ANSWER_SUBMITTED, {
    clueId: 'private-clue-id',
    submittedAnswer: 'private player answer',
    question: 'private clue text',
  });
  eventBus.emit(GameEvents.ANSWER_SUBMITTED, {
    submittedAnswer: 'second private answer',
  });

  assert.equal(sink.events.length, 1);
  assert.deepEqual(sink.events[0], {
    schema: TELEMETRY_SCHEMA,
    version: 1,
    name: ProductEventNames.ACTIVATED,
    occurredAt: 'product-time',
    properties: { method: 'answer' },
  });
  assert.doesNotMatch(JSON.stringify(sink.events), /private|answer text|clue-id/i);
  assert.equal(telemetry.stop(), true);
  assert.equal(telemetry.stop(), false);
});

test('ProductTelemetry maps learning and completion facts without content payloads', () => {
  const { eventBus, sink } = createHarness();
  eventBus.emit(GameEvents.STUDY_ENTERED, {
    clueId: 'hidden-clue',
    grounding: 'reviewed',
  });
  eventBus.emit(GameEvents.STUDY_EXITED, {
    clueId: 'hidden-clue',
    scoreIntegrity: true,
  });
  eventBus.emit(GameEvents.STUDY_REINFORCEMENT_ANSWERED, {
    clueId: 'hidden-clue',
    answer: 'private learning answer',
    correct: true,
    reason: 'exact',
    mastery: 'reinforced',
    grounding: 'reviewed',
    attemptCount: 1,
  });
  eventBus.emit(GameEvents.SESSION_RESULT_ANNOTATED, {
    clueId: 'hidden-clue',
    confidence: 'shaky',
    disputed: true,
  });
  eventBus.emit(GameEvents.SESSION_COMPLETED, {
    episodeId: 'hidden-episode',
    title: 'hidden title',
    total: 10,
    counts: { correct: 7, incorrect: 1, revealed: 1, skipped: 1 },
    review: { total: 3 },
    disputes: 1,
  });

  assert.deepEqual(sink.events.map(({ name }) => name), [
    ProductEventNames.STUDY_ENTERED,
    ProductEventNames.STUDY_RESUMED,
    ProductEventNames.REINFORCEMENT_ANSWERED,
    ProductEventNames.JUDGMENT_DISPUTED,
    ProductEventNames.EPISODE_COMPLETED,
  ]);
  assert.doesNotMatch(JSON.stringify(sink.events), /hidden|shaky|episodeId|clueId/);
  assert.doesNotMatch(JSON.stringify(sink.events), /private learning answer/);
  assert.deepEqual(sink.events.at(-1).properties, {
    total: 10,
    correct: 7,
    incorrect: 1,
    revealed: 1,
    skipped: 1,
    reviewCount: 3,
    disputeCount: 1,
  });
});

test('ProductTelemetry reduces failures to bounded codes and isolates sink errors', async () => {
  const rejected = Promise.reject(new Error('collector offline'));
  rejected.catch(() => {});
  const sink = {
    calls: 0,
    record() {
      this.calls += 1;
      if (this.calls === 1) throw new Error('collector failed');
      return rejected;
    },
  };
  const { eventBus } = createHarness(sink);
  eventBus.emit(GameEvents.ERROR_REPORTED, {
    code: 'episode-clue-failed',
    message: 'private stack and query text',
  });
  eventBus.emit(GameEvents.MEDIA_RUNTIME_FAILED, {
    url: 'https://private.example/media.png',
    type: 'image',
    reason: 'private error message',
  });

  assert.equal(sink.calls, 2);
  await Promise.resolve();
});

test('ProductTelemetry resets activation only when the episode is replayed', () => {
  const { eventBus, sink } = createHarness();
  eventBus.emit(GameEvents.ANSWER_SUBMITTED, { submittedAnswer: 'one' });
  eventBus.emit(GameEvents.EPISODE_RESTARTED, { episodeId: 'private' });
  eventBus.emit(GameEvents.ANSWER_SUBMITTED, { submittedAnswer: 'two' });

  assert.deepEqual(sink.events.map(({ name }) => name), [
    ProductEventNames.ACTIVATED,
    ProductEventNames.EPISODE_REPLAYED,
    ProductEventNames.ACTIVATED,
  ]);
});
