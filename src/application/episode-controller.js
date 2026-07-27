(function initEpisodeController(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('../contracts/events.js'),
      require('../content/episode-contract.js'),
      require('../core/round-kernel.js'),
    );
  } else {
    root.JeoPARODYEpisodeController = factory(
      root.JeopardishContracts,
      root.JeoPARODYEpisodeContract,
      root.JeoPARODYRoundKernel,
    );
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function episodeControllerFactory(
  contracts,
  episodeContract,
  roundKernelModule,
) {
  'use strict';

  if (!contracts || !episodeContract || !roundKernelModule) {
    throw new Error('EpisodeController requires contracts, EpisodeContract, and RoundKernel.');
  }

  const { GameEvents } = contracts;
  const { RoundPhases } = roundKernelModule;
  const DEFAULT_SOURCE_URL = './questions/episodes/season-zero-001.json';
  const DEFAULT_LEGACY_EPISODE = Object.freeze({
    id: 'season-zero-pilot',
    title: 'Season Zero: Pilot Broadcast',
    episodeLength: 10,
    locale: 'en',
  });

  function createOutcomeFacts(outcome, judgment = {}) {
    const normalized = String(outcome || 'skipped');
    const judged = normalized === 'correct' || normalized === 'incorrect';
    const defaultCorrect = normalized === 'correct'
      ? true
      : normalized === 'incorrect'
        ? false
        : null;
    return Object.freeze({
      outcome: normalized,
      isCorrect: typeof judgment.isCorrect === 'boolean'
        ? judgment.isCorrect
        : defaultCorrect,
      creditEligible: typeof judgment.creditEligible === 'boolean'
        ? judgment.creditEligible
        : judged,
      reason: String(
        judgment.reason
        || judgment.answerMatch?.reason
        || (normalized === 'revealed' ? 'answer-revealed' : normalized),
      ),
      scoreDelta: Number(judgment.scoreDelta) || 0,
    });
  }

  class EpisodeController {
    constructor({
      dataLoader,
      sessionManager,
      cluePipeline,
      gameEngine,
      roundKernel,
      mediaPreflight,
      eventBus,
      learningLedger,
      sourceUrl = DEFAULT_SOURCE_URL,
      fallbackSourceUrl = null,
      legacyEpisode = DEFAULT_LEGACY_EPISODE,
      requireReviewedAuthored = true,
      timeoutMs = 30000,
      createAbortController = () => new AbortController(),
      scheduler = (...args) => globalThis.setTimeout(...args),
      clearScheduler = (...args) => globalThis.clearTimeout(...args),
      isBlocked = () => false,
      getMedia = () => [],
      prepareDisplay = async (clue) => clue,
      onEpisodeLoading = () => {},
      onEpisodeLoaded = () => {},
      onClueLoading = () => {},
      onClueCommitted = () => {},
      onClueReady = () => {},
      onEmpty = () => {},
      onError = () => {},
      onProgress = () => {},
      onComplete = () => {},
      onRestart = () => {},
    } = {}) {
      const required = {
        dataLoader,
        sessionManager,
        cluePipeline,
        gameEngine,
        roundKernel,
        mediaPreflight,
        eventBus,
        learningLedger,
      };
      const missing = Object.entries(required)
        .filter(([, value]) => !value)
        .map(([name]) => name);
      if (missing.length) {
        throw new Error(`EpisodeController requires: ${missing.join(', ')}.`);
      }

      this.dataLoader = dataLoader;
      this.sessionManager = sessionManager;
      this.cluePipeline = cluePipeline;
      this.gameEngine = gameEngine;
      this.roundKernel = roundKernel;
      this.mediaPreflight = mediaPreflight;
      this.eventBus = eventBus;
      this.learningLedger = learningLedger;
      this.sourceUrl = sourceUrl;
      this.fallbackSourceUrl = fallbackSourceUrl;
      this.legacyEpisode = { ...DEFAULT_LEGACY_EPISODE, ...legacyEpisode };
      this.requireReviewedAuthored = requireReviewedAuthored;
      this.timeoutMs = timeoutMs;
      this.createAbortController = createAbortController;
      this.scheduler = scheduler;
      this.clearScheduler = clearScheduler;
      this.isBlocked = isBlocked;
      this.getMedia = getMedia;
      this.prepareDisplay = prepareDisplay;
      this.onEpisodeLoading = onEpisodeLoading;
      this.onEpisodeLoaded = onEpisodeLoaded;
      this.onClueLoading = onClueLoading;
      this.onClueCommitted = onClueCommitted;
      this.onClueReady = onClueReady;
      this.onEmpty = onEmpty;
      this.onError = onError;
      this.onProgress = onProgress;
      this.onComplete = onComplete;
      this.onRestart = onRestart;
      this.pack = null;
      this.currentSourceClue = null;
      this.currentDisplayClue = null;
      this.outcomeRecorded = false;
      this.completeVisible = false;
      this.started = false;
      this.startPromise = null;
      this.loadAbortController = null;
      this.loadTimer = null;
      this.destroyed = false;
    }

    async start() {
      if (this.destroyed) return null;
      if (this.startPromise) return this.startPromise;
      if (this.started && this.pack) return this.pack;

      this.started = true;
      this.onEpisodeLoading();
      this.gameEngine.init();
      this.loadAbortController = this.createAbortController();
      this.loadTimer = this.scheduler(
        () => this.loadAbortController?.abort(),
        this.timeoutMs,
      );
      this.startPromise = this.loadAndBegin(this.loadAbortController.signal)
        .catch((error) => {
          if (this.destroyed && error?.name === 'AbortError') return null;
          this.started = false;
          this.reportError('episode-start-failed', error);
          return null;
        })
        .finally(() => {
          if (this.loadTimer != null) this.clearScheduler(this.loadTimer);
          this.loadTimer = null;
          this.loadAbortController = null;
          this.startPromise = null;
        });
      return this.startPromise;
    }

    async loadAndBegin(signal) {
      const loaded = await this.loadSource(signal);
      const { source } = loaded;
      this.pack = episodeContract.normalizeEpisodeSource(source, this.legacyEpisode, {
        requireReviewed: !Array.isArray(source) && this.requireReviewedAuthored,
      });
      const sessionState = this.sessionManager.start(this.pack.clues, {
        id: this.pack.id,
        title: this.pack.title,
        episodeLength: this.pack.episodeLength,
        sequenceMode: this.pack.sequenceMode,
        contentRevision: this.pack.contentRevision,
      });
      const resumeState = this.sessionManager.getResumeState();
      if (sessionState.resumed && resumeState) {
        this.gameEngine.restoreProgress(resumeState);
      }
      this.gameEngine.ready();
      const progress = this.getProgress();
      this.onEpisodeLoaded({
        pack: this.pack,
        progress,
        resumed: sessionState.resumed,
        sourceCount: this.pack.clues.length,
        fallback: loaded.fallback,
        sourceUrl: loaded.url,
      });
      this.onProgress(progress);
      this.emit(GameEvents.EPISODE_READY, {
        episodeId: this.pack.id,
        title: this.pack.title,
        kind: this.pack.kind,
        clueCount: this.pack.episodeLength,
        sourceCount: this.pack.clues.length,
        resumed: sessionState.resumed,
        fallback: loaded.fallback,
      });
      if (this.sessionManager.isComplete()) {
        this.showComplete();
        return this.pack;
      }
      await this.nextClue({ recordSkip: false });
      return this.pack;
    }

    async loadSource(signal) {
      try {
        return {
          source: await this.dataLoader.loadEpisodeSource(this.sourceUrl, { signal }),
          url: this.sourceUrl,
          fallback: false,
        };
      } catch (error) {
        if (!this.fallbackSourceUrl || error?.name === 'AbortError') throw error;
        this.emit(GameEvents.EPISODE_FALLBACK_ACTIVATED, {
          sourceUrl: this.sourceUrl,
          fallbackSourceUrl: this.fallbackSourceUrl,
          reason: error?.message || String(error),
        });
        return {
          source: await this.dataLoader.loadEpisodeSource(this.fallbackSourceUrl, { signal }),
          url: this.fallbackSourceUrl,
          fallback: true,
        };
      }
    }

    async nextClue({ recordSkip = true } = {}) {
      if (this.destroyed) return null;
      if (this.isBlocked()) return null;
      if (!this.started) return this.start();
      if (this.completeVisible) return this.restart();
      if (this.sessionManager.isComplete()) return this.showComplete();

      if (recordSkip && this.currentSourceClue && !this.outcomeRecorded) {
        const progress = this.recordOutcome('skipped');
        if (progress?.complete) return this.showComplete();
      }

      return this.cluePipeline.load({
        getCandidates: (limit) => this.sessionManager.getCandidates(limit),
        getMedia: this.getMedia,
        onLoading: () => this.onClueLoading(),
        onCandidate: (selected) => this.sessionManager.adoptPlayable(selected.clue),
        prepareDisplay: this.prepareDisplay,
        commit: (sourceClue, displayClue) => {
          const gameState = this.gameEngine.loadClue(sourceClue);
          this.currentSourceClue = sourceClue;
          this.currentDisplayClue = displayClue;
          this.outcomeRecorded = false;
          this.completeVisible = false;
          this.onClueCommitted({ sourceClue, displayClue, gameState });
        },
        onReady: (sourceClue, displayClue) => {
          this.onClueReady({ sourceClue, displayClue });
        },
        onEmpty: this.onEmpty,
        onError: (error) => {
          this.reportError('episode-clue-failed', error);
        },
      });
    }

    recordOutcome(outcome, {
      clue = this.currentSourceClue,
      judgment = {},
    } = {}) {
      if (!clue || this.outcomeRecorded) return this.getProgress();
      const gameState = this.gameEngine.getState();
      const facts = createOutcomeFacts(outcome, judgment);
      this.outcomeRecorded = true;
      const progress = this.decorateProgress(this.sessionManager.recordResult({
        ...facts,
        clue,
        score: gameState.score,
        currentStreak: gameState.currentStreak,
        bestStreak: gameState.bestStreak,
      }));
      this.onProgress(progress);
      return progress;
    }

    annotateCurrentResult(annotation = {}) {
      if (!this.currentSourceClue || !this.outcomeRecorded) return this.getProgress();
      const progress = this.decorateProgress(this.sessionManager.annotateLatestResult({
        ...annotation,
        clueId: this.currentSourceClue.id,
      }));
      this.onProgress(progress);
      return progress;
    }

    replaceFailedMedia({ item, reason } = {}) {
      this.mediaPreflight.markUnavailable(item, reason);
      this.emit(GameEvents.MEDIA_RUNTIME_FAILED, {
        url: item?.url,
        type: item?.type,
        reason,
      });
      this.outcomeRecorded = true;
      return this.nextClue({ recordSkip: false });
    }

    showComplete() {
      const progress = this.getProgress();
      this.completeVisible = true;
      this.roundKernel.cancel(RoundPhases.ADVANCE_READY, 'episode-complete');
      this.onProgress(progress);
      this.onComplete(progress);
      return progress;
    }

    restart() {
      this.completeVisible = false;
      this.outcomeRecorded = false;
      this.currentSourceClue = null;
      this.currentDisplayClue = null;
      this.gameEngine.init();
      const progress = this.decorateProgress(this.sessionManager.reset());
      this.gameEngine.ready();
      this.onRestart(progress);
      this.onProgress(progress);
      this.emit(GameEvents.EPISODE_RESTARTED, {
        episodeId: this.pack?.id || this.legacyEpisode.id,
      });
      return this.nextClue({ recordSkip: false });
    }

    getCurrentContext() {
      return Object.freeze({
        sourceClue: this.currentSourceClue,
        displayClue: this.currentDisplayClue,
        episode: this.pack ? Object.freeze({
          id: this.pack.id,
          title: this.pack.title,
          kind: this.pack.kind,
          reviewStatus: this.pack.reviewStatus,
          contentRevision: this.pack.contentRevision,
          finale: this.pack.finale,
        }) : null,
      });
    }

    updateCurrentDisplayClue(displayClue) {
      if (!this.currentSourceClue || !displayClue) return null;
      this.currentDisplayClue = displayClue;
      return this.getCurrentContext();
    }

    getProgress() {
      return this.decorateProgress(this.sessionManager.getProgress());
    }

    getReviewQueues() {
      return this.sessionManager.getReviewQueues();
    }

    getReviewItems({ dueOnly = false } = {}) {
      const queues = this.sessionManager.getReviewQueues();
      const seen = new Set();
      const items = [];
      [...queues.missed, ...queues.revealed, ...queues.shaky].forEach((item) => {
        if (seen.has(item.clueId)) return;
        seen.add(item.clueId);
        if (dueOnly && !item.clue?.learning?.reinforcement) return;
        const learning = this.learningLedger.getEntry(this.pack?.id, item.clueId);
        if (dueOnly && learning?.mastery === 'reinforced') return;
        items.push(Object.freeze({ ...item, learning }));
      });
      return Object.freeze(items);
    }

    getNextReviewContext() {
      const item = this.getReviewItems({ dueOnly: true })[0];
      if (!item?.clue || !this.pack) return null;
      return Object.freeze({
        sourceClue: item.clue,
        displayClue: null,
        episode: Object.freeze({
          id: this.pack.id,
          title: this.pack.title,
          kind: this.pack.kind,
          reviewStatus: this.pack.reviewStatus,
          contentRevision: this.pack.contentRevision,
          finale: this.pack.finale,
        }),
      });
    }

    getState() {
      return Object.freeze({
        started: this.started,
        loading: Boolean(this.startPromise),
        destroyed: this.destroyed,
        episodeId: this.pack?.id || null,
        kind: this.pack?.kind || null,
        currentClueId: this.currentSourceClue?.id || null,
        outcomeRecorded: this.outcomeRecorded,
        completeVisible: this.completeVisible,
      });
    }

    decorateProgress(progress) {
      const reviewQueues = this.sessionManager.getReviewQueues();
      const reviewClueIds = [...new Set([
        ...reviewQueues.missed.map(({ clueId }) => clueId),
        ...reviewQueues.revealed.map(({ clueId }) => clueId),
        ...reviewQueues.shaky.map(({ clueId }) => clueId),
      ])].filter((clueId) => (
        this.pack?.clues?.find(({ id }) => id === clueId)?.learning?.reinforcement
      ));
      return Object.freeze({
        ...progress,
        episode: this.pack ? Object.freeze({
          id: this.pack.id,
          title: this.pack.title,
          kind: this.pack.kind,
          reviewStatus: this.pack.reviewStatus,
          contentRevision: this.pack.contentRevision,
        }) : null,
        finale: this.pack?.finale || null,
        reviewQueues,
        learning: this.learningLedger.getSummary({
          episodeId: this.pack?.id,
          reviewClueIds,
        }),
      });
    }

    destroy() {
      this.destroyed = true;
      this.loadAbortController?.abort();
      if (this.loadTimer != null) this.clearScheduler(this.loadTimer);
      this.loadTimer = null;
      this.loadAbortController = null;
      this.cluePipeline.cancel();
      this.started = false;
      return true;
    }

    reportError(code, error) {
      this.emit(GameEvents.ERROR_REPORTED, {
        code,
        message: error?.message || String(error),
      });
      this.onError(error);
    }

    emit(type, payload = {}) {
      return this.eventBus.emit(type, payload, { source: 'EpisodeController' });
    }
  }

  return {
    DEFAULT_LEGACY_EPISODE,
    DEFAULT_SOURCE_URL,
    EpisodeController,
    createOutcomeFacts,
  };
}));
