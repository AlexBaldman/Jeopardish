(function initDataLoader(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../contracts/events.js'));
  } else {
    root.JeopardishData = factory(root.JeopardishContracts);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function dataLoaderFactory(contracts) {
  'use strict';

  if (!contracts) {
    throw new Error('JeopardishData requires JeopardishContracts.');
  }

  const { GameEvents } = contracts;

  class DataLoader {
    constructor({ eventBus, fetcher = (...args) => globalThis.fetch(...args) } = {}) {
      if (!eventBus) {
        throw new Error('DataLoader requires an eventBus.');
      }

      if (!fetcher) {
        throw new Error('DataLoader requires a fetcher.');
      }

      this.eventBus = eventBus;
      this.fetcher = fetcher;
    }

    async loadQuestionBank(url, options = {}) {
      const startedAt = getNow();
      this.emit(GameEvents.QUESTIONS_REQUESTED, { url });

      try {
        const response = await this.fetcher(url, options);
        if (!response.ok) {
          throw new Error(`Failed to load questions: ${response.status}`);
        }

        const data = await response.json();
        if (!Array.isArray(data) || data.length === 0) {
          throw new Error('Question dataset is empty or invalid.');
        }

        this.emit(GameEvents.QUESTIONS_LOADED, {
          url,
          count: data.length,
          latencyMs: Math.round(getNow() - startedAt),
        });
        return data;
      } catch (error) {
        this.emit(GameEvents.QUESTIONS_FAILED, {
          url,
          message: error.message,
          latencyMs: Math.round(getNow() - startedAt),
        });
        throw error;
      }
    }

    emit(type, payload = {}) {
      return this.eventBus.emit(type, payload, { source: 'DataLoader' });
    }
  }

  function getNow() {
    if (typeof performance !== 'undefined' && performance.now) {
      return performance.now();
    }

    return Date.now();
  }

  return {
    DataLoader,
  };
}));
