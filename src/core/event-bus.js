(function initEventBus(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeopardishEventBus = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function eventBusFactory() {
  'use strict';

  class EventBus {
    constructor({ now = () => new Date().toISOString() } = {}) {
      this.listeners = new Map();
      this.now = now;
    }

    on(type, listener) {
      if (!this.listeners.has(type)) {
        this.listeners.set(type, new Set());
      }

      this.listeners.get(type).add(listener);
      return () => this.off(type, listener);
    }

    off(type, listener) {
      this.listeners.get(type)?.delete(listener);
    }

    emit(type, payload = {}, meta = {}) {
      const event = {
        type,
        payload,
        meta: {
          emittedAt: this.now(),
          source: meta.source || 'unknown',
          ...meta,
        },
      };

      for (const listener of this.listeners.get(type) || []) {
        listener(event);
      }

      for (const listener of this.listeners.get('*') || []) {
        listener(event);
      }

      return event;
    }

    clear() {
      this.listeners.clear();
    }
  }

  return {
    EventBus,
  };
}));
