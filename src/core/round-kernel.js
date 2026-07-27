(function initRoundKernel(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../contracts/events.js'));
  } else {
    root.JeoPARODYRoundKernel = factory(root.JeopardishContracts);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function roundKernelFactory(contracts) {
  'use strict';

  if (!contracts) {
    throw new Error('JeoPARODYRoundKernel requires JeopardishContracts.');
  }

  const { GameEvents } = contracts;

  const RoundPhases = Object.freeze({
    IDLE: 'idle',
    LOADING_CLUE: 'loading-clue',
    CLUE_INTRO: 'clue-intro',
    ANSWERING: 'answering',
    JUDGING: 'judging',
    REVEAL: 'reveal',
    CORRECT: 'correct',
    INCORRECT: 'incorrect',
    ADVANCE_READY: 'advance-ready',
    PAUSING: 'pausing',
    PAUSED: 'paused',
    RESUMING: 'resuming',
  });

  const DefaultTimings = Object.freeze({
    clueIntro: 180,
    judging: 220,
    reveal: 180,
    resultHold: 620,
  });

  const LegalTransitions = Object.freeze({
    [RoundPhases.IDLE]: Object.freeze([RoundPhases.LOADING_CLUE]),
    [RoundPhases.LOADING_CLUE]: Object.freeze([
      RoundPhases.LOADING_CLUE,
      RoundPhases.CLUE_INTRO,
      RoundPhases.IDLE,
    ]),
    [RoundPhases.CLUE_INTRO]: Object.freeze([
      RoundPhases.ANSWERING,
      RoundPhases.LOADING_CLUE,
      RoundPhases.IDLE,
    ]),
    [RoundPhases.ANSWERING]: Object.freeze([
      RoundPhases.JUDGING,
      RoundPhases.REVEAL,
      RoundPhases.PAUSING,
      RoundPhases.LOADING_CLUE,
      RoundPhases.IDLE,
    ]),
    [RoundPhases.JUDGING]: Object.freeze([
      RoundPhases.ANSWERING,
      RoundPhases.CORRECT,
      RoundPhases.INCORRECT,
      RoundPhases.ADVANCE_READY,
      RoundPhases.LOADING_CLUE,
      RoundPhases.IDLE,
    ]),
    [RoundPhases.REVEAL]: Object.freeze([
      RoundPhases.ANSWERING,
      RoundPhases.ADVANCE_READY,
      RoundPhases.LOADING_CLUE,
      RoundPhases.IDLE,
    ]),
    [RoundPhases.CORRECT]: Object.freeze([
      RoundPhases.ADVANCE_READY,
      RoundPhases.LOADING_CLUE,
      RoundPhases.IDLE,
    ]),
    [RoundPhases.INCORRECT]: Object.freeze([
      RoundPhases.ADVANCE_READY,
      RoundPhases.LOADING_CLUE,
      RoundPhases.IDLE,
    ]),
    [RoundPhases.ADVANCE_READY]: Object.freeze([
      RoundPhases.PAUSING,
      RoundPhases.LOADING_CLUE,
      RoundPhases.IDLE,
    ]),
    [RoundPhases.PAUSING]: Object.freeze([
      RoundPhases.PAUSED,
      RoundPhases.LOADING_CLUE,
      RoundPhases.IDLE,
    ]),
    [RoundPhases.PAUSED]: Object.freeze([
      RoundPhases.RESUMING,
      RoundPhases.LOADING_CLUE,
      RoundPhases.IDLE,
    ]),
    [RoundPhases.RESUMING]: Object.freeze([
      RoundPhases.ANSWERING,
      RoundPhases.ADVANCE_READY,
      RoundPhases.PAUSED,
      RoundPhases.LOADING_CLUE,
      RoundPhases.IDLE,
    ]),
  });

  class RoundKernel {
    constructor({
      audio = null,
      eventBus = null,
      onPhase = () => {},
      timings = DefaultTimings,
      reducedMotion = false,
      scheduler = (...args) => globalThis.setTimeout(...args),
      clearScheduler = (...args) => globalThis.clearTimeout(...args),
    } = {}) {
      this.audio = audio;
      this.eventBus = eventBus;
      this.onPhase = onPhase;
      this.timings = { ...DefaultTimings, ...timings };
      this.reducedMotion = reducedMotion;
      this.scheduler = scheduler;
      this.clearScheduler = clearScheduler;
      this.phase = RoundPhases.IDLE;
      this.roundSequence = 0;
      this.roundId = null;
      this.generation = 0;
      this.pending = new Map();
      this.busy = false;
      this.pausedState = null;
    }

    getState() {
      return Object.freeze({
        version: 1,
        phase: this.phase,
        roundId: this.roundId,
        busy: this.busy,
        paused: this.phase === RoundPhases.PAUSED,
      });
    }

    canTransition(nextPhase) {
      return LegalTransitions[this.phase]?.includes(nextPhase) || false;
    }

    transition(nextPhase, reason, { force = false } = {}) {
      if (nextPhase === this.phase) return this.phase;
      if (!force && !this.canTransition(nextPhase)) {
        const error = new Error(`Illegal round transition: ${this.phase} -> ${nextPhase}`);
        this.emit(GameEvents.ERROR_REPORTED, {
          code: 'illegal-round-transition',
          message: error.message,
          previousPhase: this.phase,
          nextPhase,
          roundId: this.roundId,
        });
        throw error;
      }

      const previousPhase = this.phase;
      this.phase = nextPhase;
      const transition = Object.freeze({
        previousPhase,
        nextPhase,
        reason: reason || 'unspecified',
        roundId: this.roundId,
      });
      this.onPhase(nextPhase, transition);
      this.emit(GameEvents.ROUND_PHASE_CHANGED, transition);
      return nextPhase;
    }

    abortPending() {
      this.generation += 1;
      this.pending.forEach((resolve, timer) => {
        this.clearScheduler(timer);
        resolve(false);
      });
      this.pending.clear();
      this.busy = false;
      this.pausedState = null;
    }

    beginClueLoad() {
      this.abortPending();
      this.roundSequence += 1;
      this.roundId = `round-${this.roundSequence}`;
      this.transition(RoundPhases.LOADING_CLUE, 'clue-requested', { force: true });
      this.emit(GameEvents.ROUND_STARTED, { roundId: this.roundId });
      return this.getState();
    }

    cancel(nextPhase = RoundPhases.IDLE, reason = 'cancelled') {
      this.abortPending();
      return this.transition(nextPhase, reason, { force: true });
    }

    isBusy() {
      return this.busy;
    }

    isAdvanceReady() {
      return this.phase === RoundPhases.ADVANCE_READY;
    }

    canPause() {
      return !this.busy && [RoundPhases.ANSWERING, RoundPhases.ADVANCE_READY].includes(this.phase);
    }

    isPaused() {
      return this.phase === RoundPhases.PAUSED;
    }

    pause(reason = 'study') {
      if (!this.canPause()) return null;
      const snapshot = Object.freeze({
        version: 1,
        phase: this.phase,
        roundId: this.roundId,
        reason,
      });
      this.pausedState = snapshot;
      this.transition(RoundPhases.PAUSING, reason);
      this.transition(RoundPhases.PAUSED, reason);
      this.emit(GameEvents.ROUND_PAUSED, {
        reason,
        pausedFromPhase: snapshot.phase,
        roundId: this.roundId,
      });
      return snapshot;
    }

    resume(snapshot = this.pausedState) {
      if (!this.isPaused() || !snapshot || snapshot.version !== 1) return false;
      if (snapshot.roundId !== this.roundId) return false;
      if (![RoundPhases.ANSWERING, RoundPhases.ADVANCE_READY].includes(snapshot.phase)) return false;
      this.transition(RoundPhases.RESUMING, snapshot.reason);
      this.pausedState = null;
      this.transition(snapshot.phase, snapshot.reason);
      this.emit(GameEvents.ROUND_RESUMED, {
        reason: snapshot.reason,
        resumedPhase: snapshot.phase,
        roundId: this.roundId,
      });
      return true;
    }

    delay(milliseconds, token) {
      if (this.reducedMotion || milliseconds <= 0) {
        return Promise.resolve(token === this.generation);
      }
      return new Promise((resolve) => {
        const timer = this.scheduler(() => {
          this.pending.delete(timer);
          resolve(token === this.generation);
        }, milliseconds);
        this.pending.set(timer, resolve);
      });
    }

    async introduceClue(render) {
      if (this.phase !== RoundPhases.LOADING_CLUE) {
        this.beginClueLoad();
      }
      const token = this.generation;
      this.busy = true;
      this.transition(RoundPhases.CLUE_INTRO, 'clue-ready');
      try {
        render();
        this.audio?.play?.('clue');
        if (await this.delay(this.timings.clueIntro, token)) {
          this.transition(RoundPhases.ANSWERING, 'clue-presented');
        }
      } catch (error) {
        if (token === this.generation) {
          this.transition(RoundPhases.IDLE, 'clue-presentation-failed', { force: true });
        }
        throw error;
      } finally {
        if (token === this.generation) this.busy = false;
      }
    }

    async reveal(render) {
      if (this.busy || this.phase !== RoundPhases.ANSWERING) return false;
      const token = this.generation;
      this.busy = true;
      try {
        this.transition(RoundPhases.REVEAL, 'answer-revealed');
        this.audio?.play?.('reveal');
        render();
        if (await this.delay(this.timings.reveal, token)) {
          this.transition(RoundPhases.ADVANCE_READY, 'reveal-complete');
        }
        return true;
      } catch (error) {
        if (token === this.generation) {
          this.transition(RoundPhases.ANSWERING, 'reveal-failed');
        }
        throw error;
      } finally {
        if (token === this.generation) this.busy = false;
      }
    }

    async judge(resolveResult, presentResult) {
      if (this.busy || this.phase !== RoundPhases.ANSWERING) return null;
      const token = this.generation;
      let result = null;
      let resultResolved = false;
      this.busy = true;
      try {
        this.transition(RoundPhases.JUDGING, 'answer-submitted');
        this.audio?.play?.('lock');
        if (!(await this.delay(this.timings.judging, token))) return null;

        result = resolveResult();
        resultResolved = Boolean(result);
        if (!result || token !== this.generation) return result || null;

        const resultPhase = result.isCorrect ? RoundPhases.CORRECT : RoundPhases.INCORRECT;
        this.transition(resultPhase, 'answer-judged');
        presentResult(result);
        this.audio?.play?.(result.isCorrect && result.currentStreak >= 3 ? 'streak' : resultPhase);

        if (await this.delay(this.timings.resultHold, token)) {
          this.transition(RoundPhases.ADVANCE_READY, 'payoff-complete');
        }
        return result;
      } catch (error) {
        if (token === this.generation) {
          this.transition(
            resultResolved ? RoundPhases.ADVANCE_READY : RoundPhases.ANSWERING,
            'judgment-failed',
          );
        }
        throw error;
      } finally {
        if (token === this.generation) this.busy = false;
      }
    }

    emit(type, payload) {
      return this.eventBus?.emit?.(type, payload, { source: 'RoundKernel' });
    }
  }

  return {
    DefaultTimings,
    LegalTransitions,
    RoundKernel,
    RoundPhases,
  };
}));
