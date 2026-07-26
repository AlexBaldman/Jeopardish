(function initRoundDirector(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYRoundDirector = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function roundDirectorFactory() {
  'use strict';

  const RoundPhases = Object.freeze({
    IDLE: 'idle',
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

  class RoundDirector {
    constructor({
      audio = null,
      onPhase = () => {},
      timings = DefaultTimings,
      reducedMotion = false,
      scheduler = (...args) => globalThis.setTimeout(...args),
      clearScheduler = (...args) => globalThis.clearTimeout(...args),
    } = {}) {
      this.audio = audio;
      this.onPhase = onPhase;
      this.timings = { ...DefaultTimings, ...timings };
      this.reducedMotion = reducedMotion;
      this.scheduler = scheduler;
      this.clearScheduler = clearScheduler;
      this.phase = RoundPhases.IDLE;
      this.generation = 0;
      this.pending = new Map();
      this.busy = false;
      this.pausedState = null;
    }

    setPhase(phase) {
      this.phase = phase;
      this.onPhase(phase);
      return phase;
    }

    cancel(nextPhase = RoundPhases.IDLE) {
      this.generation += 1;
      this.pending.forEach((resolve, timer) => {
        this.clearScheduler(timer);
        resolve(false);
      });
      this.pending.clear();
      this.busy = false;
      this.pausedState = null;
      return this.setPhase(nextPhase);
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

    pause() {
      if (!this.canPause()) return null;
      const snapshot = Object.freeze({ version: 1, phase: this.phase });
      this.pausedState = snapshot;
      this.setPhase(RoundPhases.PAUSING);
      this.setPhase(RoundPhases.PAUSED);
      return snapshot;
    }

    resume(snapshot = this.pausedState) {
      if (!this.isPaused() || !snapshot || snapshot.version !== 1) return false;
      if (![RoundPhases.ANSWERING, RoundPhases.ADVANCE_READY].includes(snapshot.phase)) return false;
      this.setPhase(RoundPhases.RESUMING);
      this.pausedState = null;
      this.setPhase(snapshot.phase);
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
      this.cancel(RoundPhases.CLUE_INTRO);
      const token = this.generation;
      this.busy = true;
      try {
        render();
        this.audio?.play?.('clue');
        if (await this.delay(this.timings.clueIntro, token)) {
          this.setPhase(RoundPhases.ANSWERING);
        }
      } catch (error) {
        if (token === this.generation) this.setPhase(RoundPhases.IDLE);
        throw error;
      } finally {
        if (token === this.generation) this.busy = false;
      }
    }

    async reveal(render) {
      if (this.busy) {
        return false;
      }
      const token = this.generation;
      const previousPhase = this.phase;
      this.busy = true;
      try {
        this.setPhase(RoundPhases.REVEAL);
        this.audio?.play?.('reveal');
        render();
        if (await this.delay(this.timings.reveal, token)) {
          this.setPhase(RoundPhases.ADVANCE_READY);
        }
        return true;
      } catch (error) {
        if (token === this.generation) this.setPhase(previousPhase);
        throw error;
      } finally {
        if (token === this.generation) this.busy = false;
      }
    }

    async judge(resolveResult, presentResult) {
      if (this.busy) {
        return null;
      }
      const token = this.generation;
      const previousPhase = this.phase;
      let result = null;
      let resultResolved = false;
      this.busy = true;
      try {
        this.setPhase(RoundPhases.JUDGING);
        this.audio?.play?.('lock');
        if (!(await this.delay(this.timings.judging, token))) {
          return null;
        }

        result = resolveResult();
        resultResolved = Boolean(result);
        if (!result || token !== this.generation) {
          return result || null;
        }

        const resultPhase = result.isCorrect ? RoundPhases.CORRECT : RoundPhases.INCORRECT;
        this.setPhase(resultPhase);
        presentResult(result);
        this.audio?.play?.(result.isCorrect && result.currentStreak >= 3 ? 'streak' : resultPhase);

        if (await this.delay(this.timings.resultHold, token)) {
          this.setPhase(RoundPhases.ADVANCE_READY);
        }
        return result;
      } catch (error) {
        if (token === this.generation) {
          this.setPhase(resultResolved ? RoundPhases.ADVANCE_READY : previousPhase);
        }
        throw error;
      } finally {
        if (token === this.generation) this.busy = false;
      }
    }
  }

  return {
    DefaultTimings,
    RoundDirector,
    RoundPhases,
  };
}));
