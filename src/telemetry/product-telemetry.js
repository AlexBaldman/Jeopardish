(function initProductTelemetry(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../contracts/events.js'));
  } else {
    root.JeoPARODYTelemetry = factory(root.JeopardishContracts);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function productTelemetryFactory(
  contracts,
) {
  'use strict';

  const GameEvents = contracts?.GameEvents || {};
  const TELEMETRY_SCHEMA = 'jeoparody.product-event';
  const TELEMETRY_VERSION = 1;
  const ProductEventNames = Object.freeze({
    ACTIVATED: 'player_activated',
    EPISODE_COMPLETED: 'episode_completed',
    JUDGMENT_DISPUTED: 'judgment_disputed',
    STUDY_ENTERED: 'study_entered',
    STUDY_RESUMED: 'study_resumed',
    REINFORCEMENT_ANSWERED: 'reinforcement_answered',
    EPISODE_REPLAYED: 'episode_replayed',
    RECOVERABLE_FAILURE: 'recoverable_failure',
  });

  function count(value) {
    return Math.max(0, Math.trunc(Number(value) || 0));
  }

  function safeCode(value, fallback = 'unspecified') {
    const code = String(value || '').toLowerCase();
    return /^[a-z0-9][a-z0-9-]{0,63}$/.test(code) ? code : fallback;
  }

  class NoopTelemetrySink {
    record() {
      return false;
    }
  }

  class ProductTelemetry {
    constructor({
      eventBus,
      sink = new NoopTelemetrySink(),
      now = () => new Date().toISOString(),
    } = {}) {
      if (!eventBus?.on) {
        throw new Error('ProductTelemetry requires an event bus.');
      }
      if (!sink?.record) {
        throw new Error('ProductTelemetry requires a sink with record(event).');
      }
      this.eventBus = eventBus;
      this.sink = sink;
      this.now = now;
      this.unsubscribe = null;
      this.activated = false;
    }

    start() {
      if (this.unsubscribe) return false;
      this.unsubscribe = this.eventBus.on('*', (event) => this.handle(event));
      return true;
    }

    stop() {
      if (!this.unsubscribe) return false;
      this.unsubscribe();
      this.unsubscribe = null;
      return true;
    }

    handle(event = {}) {
      const payload = event.payload || {};
      switch (event.type) {
        case GameEvents.ANSWER_SUBMITTED:
          if (this.activated) return null;
          this.activated = true;
          return this.record(ProductEventNames.ACTIVATED, {
            method: 'answer',
          });

        case GameEvents.SESSION_COMPLETED:
          return this.record(ProductEventNames.EPISODE_COMPLETED, {
            total: count(payload.total),
            correct: count(payload.counts?.correct),
            incorrect: count(payload.counts?.incorrect),
            revealed: count(payload.counts?.revealed),
            skipped: count(payload.counts?.skipped),
            reviewCount: count(payload.review?.total),
            disputeCount: count(payload.disputes),
          });

        case GameEvents.SESSION_RESULT_ANNOTATED:
          return payload.disputed
            ? this.record(ProductEventNames.JUDGMENT_DISPUTED)
            : null;

        case GameEvents.STUDY_ENTERED:
          return this.record(ProductEventNames.STUDY_ENTERED, {
            grounding: safeCode(payload.grounding, 'unknown'),
          });

        case GameEvents.STUDY_EXITED:
          return this.record(ProductEventNames.STUDY_RESUMED, {
            scoreIntegrity: payload.scoreIntegrity !== false,
          });

        case GameEvents.STUDY_REINFORCEMENT_ANSWERED:
          return this.record(ProductEventNames.REINFORCEMENT_ANSWERED, {
            correct: Boolean(payload.correct),
            mastery: safeCode(payload.mastery, 'unknown'),
            grounding: safeCode(payload.grounding, 'unknown'),
            attemptCount: count(payload.attemptCount),
          });

        case GameEvents.EPISODE_RESTARTED:
          this.activated = false;
          return this.record(ProductEventNames.EPISODE_REPLAYED);

        case GameEvents.EPISODE_FALLBACK_ACTIVATED:
          return this.record(ProductEventNames.RECOVERABLE_FAILURE, {
            kind: 'episode-source',
          });

        case GameEvents.MEDIA_RUNTIME_FAILED:
          return this.record(ProductEventNames.RECOVERABLE_FAILURE, {
            kind: 'media-runtime',
            mediaType: safeCode(payload.type, 'unknown'),
          });

        case GameEvents.ERROR_REPORTED:
          return this.record(ProductEventNames.RECOVERABLE_FAILURE, {
            kind: 'runtime',
            code: safeCode(payload.code),
          });

        default:
          return null;
      }
    }

    record(name, properties = {}) {
      const productEvent = Object.freeze({
        schema: TELEMETRY_SCHEMA,
        version: TELEMETRY_VERSION,
        name,
        occurredAt: this.now(),
        properties: Object.freeze({ ...properties }),
      });
      try {
        const result = this.sink.record(productEvent);
        result?.catch?.(() => {});
      } catch {
        return null;
      }
      return productEvent;
    }
  }

  return {
    NoopTelemetrySink,
    ProductEventNames,
    ProductTelemetry,
    TELEMETRY_SCHEMA,
    TELEMETRY_VERSION,
  };
}));
