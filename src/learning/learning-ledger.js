(function initLearningLedger(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYLearning = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function learningLedgerFactory() {
  'use strict';

  const LEDGER_VERSION = 1;
  const DEFAULT_STORAGE_KEY = 'jeoparody.learning.v1';
  const MASTERY_STATES = Object.freeze({
    UNSEEN: 'unseen',
    STUDYING: 'studying',
    PRACTICING: 'practicing',
    REINFORCED: 'reinforced',
  });

  function count(value) {
    return Math.max(0, Math.trunc(Number(value) || 0));
  }

  function safeId(value) {
    const id = String(value || '').trim();
    return id && id.length <= 256 ? id : null;
  }

  function createEmptyLedger() {
    return {
      version: LEDGER_VERSION,
      entries: {},
    };
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function freezeClone(value) {
    const copy = clone(value);
    Object.freeze(copy.actionCounts || {});
    return Object.freeze(copy);
  }

  class LearningLedger {
    constructor({
      storage = globalThis.localStorage,
      storageKey = DEFAULT_STORAGE_KEY,
      now = () => new Date().toISOString(),
    } = {}) {
      this.storage = storage;
      this.storageKey = storageKey;
      this.now = now;
      this.ledger = this.read();
    }

    getKey(episodeId, clueId) {
      const episode = safeId(episodeId);
      const clue = safeId(clueId);
      return episode && clue ? `${episode}::${clue}` : null;
    }

    getEntry(episodeId, clueId) {
      const key = this.getKey(episodeId, clueId);
      const entry = key ? this.ledger.entries[key] : null;
      return entry ? freezeClone(entry) : null;
    }

    recordStudy({ episodeId, clueId, grounding = 'unknown' } = {}) {
      return this.update(episodeId, clueId, (entry) => {
        entry.studyCount += 1;
        entry.grounding = String(grounding || 'unknown');
        if (entry.mastery === MASTERY_STATES.UNSEEN) {
          entry.mastery = MASTERY_STATES.STUDYING;
        }
      });
    }

    recordAction({ episodeId, clueId, actionId } = {}) {
      const action = safeId(actionId);
      if (!action) return null;
      return this.update(episodeId, clueId, (entry) => {
        entry.actionCounts[action] = count(entry.actionCounts[action]) + 1;
      });
    }

    recordReinforcement({
      episodeId,
      clueId,
      correct = false,
      reason = 'unspecified',
    } = {}) {
      return this.update(episodeId, clueId, (entry) => {
        entry.reinforcementAttempts += 1;
        entry.lastReinforcementReason = String(reason || 'unspecified');
        if (correct) {
          entry.reinforcementCorrect += 1;
          entry.mastery = MASTERY_STATES.REINFORCED;
          entry.reinforcedAt = this.now();
        } else if (entry.mastery !== MASTERY_STATES.REINFORCED) {
          entry.mastery = MASTERY_STATES.PRACTICING;
        }
      });
    }

    getSummary({ episodeId, reviewClueIds = [] } = {}) {
      const episode = safeId(episodeId);
      const uniqueReviewIds = [...new Set(reviewClueIds.map(safeId).filter(Boolean))];
      const entries = Object.values(this.ledger.entries)
        .filter((entry) => entry.episodeId === episode);
      const reinforcedReviewIds = uniqueReviewIds.filter((clueId) => (
        this.getEntry(episode, clueId)?.mastery === MASTERY_STATES.REINFORCED
      ));
      return Object.freeze({
        studied: entries.filter(({ studyCount }) => studyCount > 0).length,
        practiced: entries.filter(({ reinforcementAttempts }) => reinforcementAttempts > 0).length,
        reinforced: entries.filter(({ mastery }) => mastery === MASTERY_STATES.REINFORCED).length,
        reviewTotal: uniqueReviewIds.length,
        reviewReinforced: reinforcedReviewIds.length,
        due: Math.max(0, uniqueReviewIds.length - reinforcedReviewIds.length),
      });
    }

    update(episodeId, clueId, mutate) {
      const key = this.getKey(episodeId, clueId);
      if (!key || typeof mutate !== 'function') return null;
      const existing = this.ledger.entries[key];
      const timestamp = this.now();
      const entry = existing || {
        episodeId: String(episodeId),
        clueId: String(clueId),
        mastery: MASTERY_STATES.UNSEEN,
        studyCount: 0,
        actionCounts: {},
        reinforcementAttempts: 0,
        reinforcementCorrect: 0,
        grounding: 'unknown',
        firstStudiedAt: timestamp,
        updatedAt: timestamp,
      };
      mutate(entry);
      entry.updatedAt = timestamp;
      this.ledger.entries[key] = entry;
      this.persist();
      return freezeClone(entry);
    }

    read() {
      try {
        const parsed = JSON.parse(this.storage?.getItem?.(this.storageKey) || 'null');
        if (parsed?.version === LEDGER_VERSION && parsed.entries && !Array.isArray(parsed.entries)) {
          return parsed;
        }
      } catch {
        // Corrupt local learning data should never block a round.
      }
      return createEmptyLedger();
    }

    persist() {
      try {
        this.storage?.setItem?.(this.storageKey, JSON.stringify(this.ledger));
        return true;
      } catch {
        return false;
      }
    }
  }

  return {
    DEFAULT_STORAGE_KEY,
    LEDGER_VERSION,
    LearningLedger,
    MASTERY_STATES,
  };
}));
