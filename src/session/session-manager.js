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
  const SESSION_VERSION = 3;
  const DEFAULT_EPISODE_ID = 'season-zero-pilot';
  const DEFAULT_EPISODE_TITLE = 'Season Zero: Pilot Broadcast';
  const DEFAULT_STORAGE_KEY = 'jeoparody.session.season-zero';
  const DEFAULT_SEQUENCE_MODE = 'deterministic-sample';
  const AUTHORED_SEQUENCE_MODE = 'authored-order';
  const RANDOM_SEQUENCE_MODE = 'random-sample';
  const ConfidenceRatings = Object.freeze({
    KNEW_IT: 'knew-it',
    SHAKY: 'shaky',
    LEARNED_IT: 'learned-it',
  });
  const CONFIDENCE_VALUES = new Set(Object.values(ConfidenceRatings));

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
      episodeTitle = DEFAULT_EPISODE_TITLE,
      episodeLength = 10,
      sequenceMode = DEFAULT_SEQUENCE_MODE,
      contentRevision = 1,
      now = () => new Date().toISOString(),
      random = Math.random,
    } = {}) {
      this.eventBus = eventBus;
      this.storage = storage;
      this.storageKey = storageKey;
      this.episodeId = episodeId;
      this.episodeTitle = episodeTitle;
      this.episodeLength = episodeLength;
      this.sequenceMode = sequenceMode;
      this.contentRevision = contentRevision;
      this.now = now;
      this.random = random;
      this.entries = [];
      this.entryById = new Map();
      this.session = null;
    }

    start(questionBank = [], episode = {}) {
      this.configureEpisode(episode);
      this.entries = questionBank
        .map((clue, index) => {
          const id = getClueId(clue);
          return { clue, index, id, rank: stableHash(`${this.episodeId}|${id}`) };
        })
        .filter(({ clue, id }) => id && clue?.question && clue?.answer);
      if (this.sequenceMode === RANDOM_SEQUENCE_MODE) {
        this.shuffleEntries();
      } else if (this.sequenceMode !== AUTHORED_SEQUENCE_MODE) {
        this.entries.sort((left, right) => left.rank - right.rank || left.index - right.index);
      }
      this.entryById = new Map(this.entries.map((entry) => [entry.id, entry]));

      const restored = this.migrateSession(this.read());
      if (this.isRestorable(restored)) {
        this.session = restored;
        this.persist();
        this.emit(GameEvents.SESSION_RESUMED, this.getProgress());
        return { resumed: true, ...this.getProgress() };
      }

      this.session = this.createSession();
      this.persist();
      this.emit(GameEvents.SESSION_STARTED, this.getProgress());
      return { resumed: false, ...this.getProgress() };
    }

    configureEpisode({
      id,
      title,
      episodeLength,
      sequenceMode,
      contentRevision,
    } = {}) {
      if (id) this.episodeId = String(id);
      if (title) this.episodeTitle = String(title);
      if (Number.isInteger(episodeLength) && episodeLength > 0) {
        this.episodeLength = episodeLength;
      }
      if ([DEFAULT_SEQUENCE_MODE, AUTHORED_SEQUENCE_MODE, RANDOM_SEQUENCE_MODE].includes(sequenceMode)) {
        this.sequenceMode = sequenceMode;
      }
      if (Number.isInteger(contentRevision) && contentRevision > 0) {
        this.contentRevision = contentRevision;
      }
    }

    createSession() {
      const timestamp = this.now();
      return {
        version: SESSION_VERSION,
        episodeId: this.episodeId,
        contentRevision: this.contentRevision,
        sequenceMode: this.sequenceMode,
        clueIds: this.entries.slice(0, this.episodeLength).map(({ id }) => id),
        cursor: 0,
        results: [],
        status: 'active',
        startedAt: timestamp,
        updatedAt: timestamp,
      };
    }

    shuffleEntries() {
      for (let index = this.entries.length - 1; index > 0; index -= 1) {
        const target = Math.floor(this.random() * (index + 1));
        [this.entries[index], this.entries[target]] = [this.entries[target], this.entries[index]];
      }
    }

    isRestorable(candidate) {
      if (
        !candidate
        || candidate.version !== SESSION_VERSION
        || candidate.episodeId !== this.episodeId
        || candidate.contentRevision !== this.contentRevision
        || candidate.sequenceMode !== this.sequenceMode
      ) {
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

    recordResult({
      outcome,
      clue,
      score = 0,
      currentStreak = 0,
      bestStreak = 0,
      isCorrect = null,
      creditEligible = null,
      reason = '',
      scoreDelta = 0,
    } = {}) {
      if (!this.session || this.isComplete()) return this.getProgress();
      const clueId = getClueId(clue) || this.session.clueIds[this.session.cursor];
      if (clueId !== this.session.clueIds[this.session.cursor]) return this.getProgress();
      const normalizedOutcome = String(outcome || 'skipped');
      const judgedOutcome = normalizedOutcome === 'correct' || normalizedOutcome === 'incorrect';
      const normalizedIsCorrect = typeof isCorrect === 'boolean'
        ? isCorrect
        : normalizedOutcome === 'correct'
          ? true
          : normalizedOutcome === 'incorrect'
            ? false
            : null;

      this.session.results.push({
        clueId,
        outcome: normalizedOutcome,
        isCorrect: normalizedIsCorrect,
        creditEligible: typeof creditEligible === 'boolean' ? creditEligible : judgedOutcome,
        reason: String(reason || normalizedOutcome),
        scoreDelta: Number(scoreDelta) || 0,
        score: Number(score) || 0,
        currentStreak: Number(currentStreak) || 0,
        bestStreak: Number(bestStreak) || 0,
        confidence: null,
        disputed: false,
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

    annotateLatestResult({
      clueId = null,
      confidence,
      disputed,
    } = {}) {
      if (!this.session?.results?.length) return this.getProgress();
      const result = this.session.results[this.session.results.length - 1];
      if (clueId && String(clueId) !== result.clueId) return this.getProgress();
      if (confidence !== undefined) {
        const normalizedConfidence = String(confidence || '');
        if (!CONFIDENCE_VALUES.has(normalizedConfidence)) return this.getProgress();
        result.confidence = normalizedConfidence;
      }
      if (typeof disputed === 'boolean') result.disputed = disputed;
      this.touch();
      this.persist();
      const progress = this.getProgress();
      this.emit(GameEvents.SESSION_RESULT_ANNOTATED, {
        clueId: result.clueId,
        confidence: result.confidence,
        disputed: result.disputed,
        progress,
      });
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
      const results = this.session?.results || [];
      const confidence = {
        [ConfidenceRatings.KNEW_IT]: 0,
        [ConfidenceRatings.SHAKY]: 0,
        [ConfidenceRatings.LEARNED_IT]: 0,
        unrated: 0,
      };
      for (const result of results) {
        if (Object.hasOwn(counts, result.outcome)) counts[result.outcome] += 1;
        if (result.confidence && Object.hasOwn(confidence, result.confidence)) {
          confidence[result.confidence] += 1;
        } else {
          confidence.unrated += 1;
        }
      }
      const reviewQueues = this.getReviewQueues();
      const latestResult = results.at?.(-1) || results[results.length - 1] || null;
      const reviewIds = new Set([
        ...reviewQueues.missed.map(({ clueId }) => clueId),
        ...reviewQueues.revealed.map(({ clueId }) => clueId),
        ...reviewQueues.shaky.map(({ clueId }) => clueId),
      ]);
      return {
        episodeId: this.episodeId,
        title: this.episodeTitle,
        contentRevision: this.contentRevision,
        sequenceMode: this.sequenceMode,
        current: Math.min(answered + 1, total),
        answered,
        total,
        complete: this.isComplete(),
        counts,
        score: this.getResumeState()?.score || 0,
        credit: {
          eligibleAttempts: results
            .filter(({ creditEligible }) => creditEligible).length,
          earned: results
            .filter(({ creditEligible, isCorrect }) => creditEligible && isCorrect).length,
        },
        confidence,
        disputes: results.filter(({ disputed }) => disputed).length,
        latestResult: latestResult ? Object.freeze({ ...latestResult }) : null,
        review: {
          missed: reviewQueues.missed.length,
          revealed: reviewQueues.revealed.length,
          shaky: reviewQueues.shaky.length,
          total: reviewIds.size,
        },
      };
    }

    getReviewQueues() {
      const queues = { missed: [], revealed: [], shaky: [] };
      for (const result of this.session?.results || []) {
        const clue = this.entryById.get(result.clueId)?.clue || null;
        const item = Object.freeze({ clueId: result.clueId, clue, result: Object.freeze({ ...result }) });
        if (result.outcome === 'incorrect') queues.missed.push(item);
        if (result.outcome === 'revealed') queues.revealed.push(item);
        if (result.confidence === ConfidenceRatings.SHAKY) queues.shaky.push(item);
      }
      return Object.freeze({
        missed: Object.freeze(queues.missed),
        revealed: Object.freeze(queues.revealed),
        shaky: Object.freeze(queues.shaky),
      });
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

    migrateSession(candidate) {
      if (!candidate || candidate.version === SESSION_VERSION) return candidate;
      if (![1, 2].includes(candidate.version) || !Array.isArray(candidate.results)) return null;
      return {
        ...candidate,
        version: SESSION_VERSION,
        contentRevision: 1,
        sequenceMode: DEFAULT_SEQUENCE_MODE,
        results: candidate.results.map((result) => {
          const outcome = String(result.outcome || 'skipped');
          const judged = outcome === 'correct' || outcome === 'incorrect';
          return {
            ...result,
            isCorrect: typeof result.isCorrect === 'boolean'
              ? result.isCorrect
              : outcome === 'correct' ? true : outcome === 'incorrect' ? false : null,
            creditEligible: typeof result.creditEligible === 'boolean'
              ? result.creditEligible
              : judged,
            reason: result.reason || `legacy-${outcome}`,
            scoreDelta: Number(result.scoreDelta) || 0,
            confidence: CONFIDENCE_VALUES.has(result.confidence) ? result.confidence : null,
            disputed: Boolean(result.disputed),
          };
        }),
      };
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
    DEFAULT_EPISODE_TITLE,
    DEFAULT_SEQUENCE_MODE,
    DEFAULT_STORAGE_KEY,
    AUTHORED_SEQUENCE_MODE,
    RANDOM_SEQUENCE_MODE,
    ConfidenceRatings,
    SESSION_VERSION,
    SessionManager,
    getClueId,
    stableHash,
  };
}));
