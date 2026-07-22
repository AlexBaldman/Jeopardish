(function initRoundSnapshot(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYRoundSnapshot = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function roundSnapshotFactory() {
  'use strict';

  const SNAPSHOT_VERSION = 1;

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  class RoundSnapshotStore {
    constructor({ tokenFactory } = {}) {
      this.sequence = 0;
      this.tokenFactory = tokenFactory || (() => `resume-${Date.now()}-${++this.sequence}`);
      this.active = null;
    }

    capture(context) {
      if (this.active) throw new Error('A round snapshot is already active.');
      const snapshot = deepFreeze({
        schema: 'jeoparody.round-snapshot',
        version: SNAPSHOT_VERSION,
        resumeToken: this.tokenFactory(),
        ...context,
      });
      this.active = snapshot;
      return snapshot;
    }

    peek() {
      return this.active;
    }

    consume(resumeToken) {
      if (!this.active || this.active.resumeToken !== resumeToken) {
        throw new Error('Round snapshot is missing, expired, or already consumed.');
      }
      const snapshot = this.active;
      this.active = null;
      return snapshot;
    }

    clear() {
      this.active = null;
    }
  }

  return { SNAPSHOT_VERSION, RoundSnapshotStore };
}));
