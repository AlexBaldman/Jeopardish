(function initSessionManager(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../contracts/events.js'));
  } else {
    root.JeoPARODYSession = factory(root.JeopardishContracts);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function sessionManagerFactory(contracts) {
  'use strict';

  if (!contracts) {
    throw new Error('JeoPARODYSession requires JeopardishContracts.');
  }

  const { GameEvents } = contracts;
  const SESSION_VERSION = 1;
  const DEFAULT_EPISODE_ID = 'season-zero-pilot';
  const DEFAULT_STORAGE_KEY = 'jeoparody.session.season-zero';

  function getClueId(clue) {
    if (!clue) return null;
    if (clue.id) return String(clue.id);
    return [clue.category || 'unknown', clue.value || 'unknown', clue.question || 'unknown'].join('|');
  }

  function stableHash(value) {
    let hash = 2166136261;
    const input = String(value || '');
    for (let index = 0; index < input.length; index += 1) {
      hash ^= input.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  class SessionManager {
    constructor({
      eventBus = null,
      storage = globalThis.localStorage,
      storageKey = DEFAULT_STORAGE_KEY,
      episodeId = DEFAULT_EPISODE_ID,
      episodeLength = 10,
      now = () => new Date().toISOString(),
    } = {}) {
      this.eventBus = eventBus;
      this.storage = storage;
      this.storageKey = storageKey;
      this.episodeId = episodeId;
      this.episodeLength = episodeLength;
      this.now = now;
      this.entries = [];
      this.entryById = new Map();
      this.session = null;
    }

    start(questionBank = []) {
      this.entries = questionBank
        .map((clue, index) => {
          const id = getClueId(clue);
          return { clue, index, id, rank: stableHash(`${this.episodeId}|${id}`) };
        })
        .filter(({ clue, id }) => id && clue?.question && clue?.answer)
        .sort((left, right) => left.rank - right.rank || left.index - right.index);
      this.entryById = new Map(this.entries.map((entry) => [entry.id, entry]));

      const restored = this.read();
      if (this.isRestorable(restored)) {
        this.session = restored;
        this.emit(GameEvents.SESSION_RESUMED, this.getProgress());
        return { resumed: true, ...this.getProgress() };
      }

      this.session = this.createSession();
      this.persist();
      this.emit(GameEvents.SESSION_STARTED, this.getProgress());
      return { resumed: false, ...this.getProgress() };
    }

    createSession() {
      const timestamp = this.now();
      return {
        version: SESSION_VERSION,
        episodeId: this.episodeId,
        clueIds: this.entries.slice(0, this.episodeLength).map(({ id }) => id),
        cursor: 0,
        results: [],
        status: 'active',
        startedAt: timestamp,
        updatedAt: timestamp,
      };
    }

    isRestorable(candidate) {
      if (!candidate || candidate.version !== SESSION_VERSION || candidate.episodeId !== this.episodeId) {
        return false;
      }
      if (!Array.isArray(candidate.clueIds) || !Array.isArray(candidate.results)) return false;
      if (candidate.clueIds.length === 0 || candidate.clueIds.some((id) => !this.entryById.has(id))) return false;
      return Number.isInteger(candidate.cursor)
        && candidate.cursor >= 0
        && candidate.cursor <= candidate.clueIds.length
        && candidate.results.length === candidate.cursor;
    }

    getCandidates(limit = 8) {
      if (!this.session || this.isComplete()) return [];
      const currentId = this.session.clueIds[this.session.cursor];
      const reserved = new Set([
        ...this.session.clueIds,
        ...this.session.results.map(({ clueId }) => clueId),
      ]);
      const candidates = [];
      const current = this.entryById.get(currentId);
      if (current) candidates.push(current);
      for (const entry of this.entries) {
        if (candidates.length >= limit) break;
        if (!reserved.has(entry.id)) candidates.push(entry);
      }
      return candidates.map(({ clue, index }) => ({ clue, index }));
    }

    adoptPlayable(clue) {
      if (!this.session || this.isComplete()) return;
      const clueId = getClueId(clue);
      if (!clueId || !this.entryById.has(clueId)) return;
      if (this.session.clueIds[this.session.cursor] !== clueId) {
        this.session.clueIds[this.session.cursor] = clueId;
        this.touch();
        this.persist();
      }
    }

    recordResult({ outcome, clue, score = 0, currentStreak = 0, bestStreak = 0 } = {}) {
      if (!this.session || this.isComplete()) return this.getProgress();
      const clueId = getClueId(clue) || this.session.clueIds[this.session.cursor];
      if (clueId !== this.session.clueIds[this.session.cursor]) return this.getProgress();

      this.session.results.push({
        clueId,
        outcome: String(outcome || 'skipped'),
        score: Number(score) || 0,
        currentStreak: Number(currentStreak) || 0,
        bestStreak: Number(bestStreak) || 0,
        completedAt: this.now(),
      });
      this.session.cursor += 1;
      this.session.status = this.session.cursor >= this.session.clueIds.length ? 'complete' : 'active';
      this.touch();
      this.persist();
      const progress = this.getProgress();
      this.emit(this.isComplete() ? GameEvents.SESSION_COMPLETED : GameEvents.SESSION_PROGRESS, progress);
      return progress;
    }

    reset() {
      try {
        this.storage?.removeItem?.(this.storageKey);
      } catch (error) {
        this.emit(GameEvents.ERROR_REPORTED, { message: `Session reset could not be persisted: ${error.message}` });
      }
      this.session = this.createSession();
      this.persist();
      this.emit(GameEvents.SESSION_STARTED, this.getProgress());
      return this.getProgress();
    }

    getResumeState() {
      const latest = this.session?.results?.at?.(-1) || this.session?.results?.[this.session.results.length - 1];
      return latest ? {
        score: latest.score,
        currentStreak: latest.currentStreak,
        bestStreak: latest.bestStreak,
        answeredClueIds: this.session.results.map(({ clueId }) => clueId),
      } : null;
    }

    getProgress() {
      const total = this.session?.clueIds?.length || 0;
      const answered = this.session?.cursor || 0;
      const counts = { correct: 0, incorrect: 0, revealed: 0, skipped: 0 };
      for (const result of this.session?.results || []) {
        if (Object.hasOwn(counts, result.outcome)) counts[result.outcome] += 1;
      }
      return {
        episodeId: this.episodeId,
        title: 'Season Zero: Pilot Broadcast',
        current: Math.min(answered + 1, total),
        answered,
        total,
        complete: this.isComplete(),
        counts,
        score: this.getResumeState()?.score || 0,
      };
    }

    getCurrentClue() {
      const id = this.session?.clueIds?.[this.session.cursor];
      return this.entryById.get(id)?.clue || null;
    }

    isComplete() {
      return this.session?.status === 'complete';
    }

    touch() {
      this.session.updatedAt = this.now();
    }

    read() {
      try {
        return JSON.parse(this.storage?.getItem?.(this.storageKey) || 'null');
      } catch {
        return null;
      }
    }

    persist() {
      try {
        this.storage?.setItem?.(this.storageKey, JSON.stringify(this.session));
      } catch (error) {
        this.emit(GameEvents.ERROR_REPORTED, { message: `Session progress could not be saved: ${error.message}` });
      }
    }

    emit(type, payload) {
      this.eventBus?.emit?.(type, payload, { source: 'SessionManager' });
    }
  }

  return {
    DEFAULT_EPISODE_ID,
    DEFAULT_STORAGE_KEY,
    SESSION_VERSION,
    SessionManager,
    getClueId,
    stableHash,
  };
}));
