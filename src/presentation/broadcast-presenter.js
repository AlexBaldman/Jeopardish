(function initBroadcastPresenter(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYBroadcastPresenter = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function broadcastPresenterFactory() {
  'use strict';

  function requireMethod(owner, name) {
    if (typeof owner?.[name] !== 'function') {
      throw new Error(`BroadcastPresenter requires ${name}().`);
    }
  }

  class BroadcastPresenter {
    constructor({
      renderer,
      hostManager,
      hostPerformanceDirector,
      preferenceStore,
      voiceController,
      hostBeats,
      getCopy,
    } = {}) {
      requireMethod(renderer, 'renderHost');
      requireMethod(hostManager, 'getActiveHost');
      requireMethod(hostPerformanceDirector, 'direct');
      requireMethod(preferenceStore, 'get');
      if (!hostBeats?.CLUE || typeof getCopy !== 'function') {
        throw new Error('BroadcastPresenter requires host beats and localized copy.');
      }

      this.renderer = renderer;
      this.hostManager = hostManager;
      this.hostPerformanceDirector = hostPerformanceDirector;
      this.preferenceStore = preferenceStore;
      this.voiceController = voiceController;
      this.hostBeats = hostBeats;
      this.getCopy = getCopy;
      this.currentCluePerformance = null;
    }

    getLocale() {
      return this.preferenceStore.get('language') === 'pt-BR' ? 'pt-BR' : 'en';
    }

    renderHost(expression = 'idle', directedPerformance = null) {
      const host = this.hostManager.getActiveHost();
      const performance = this.hostManager.getPerformance(expression);
      if (!performance) return false;

      const cue = this.getCopy().hostCues?.[performance.cueKey] || performance.state;
      this.renderer.renderHost(
        host,
        performance.state,
        performance.visual,
        performance.skin,
        {
          ...performance,
          hostPackId: directedPerformance?.pack?.id
            || this.hostPerformanceDirector.getActivePack()?.id
            || '',
          hostDisplayName: directedPerformance?.pack?.displayName
            || this.hostPerformanceDirector.getActivePack()?.displayName
            || host.displayName,
          motion: directedPerformance?.motion || null,
          animation: directedPerformance?.animation || null,
          intensity: directedPerformance?.motion?.intensity || performance.intensity,
          cue,
          accessibleLabel: cue,
        },
      );
      return true;
    }

    speak(message, speech = {}) {
      return this.voiceController?.speak?.(message, {
        language: speech.locale || (this.getLocale() === 'pt-BR' ? 'pt-BR' : 'en-US'),
        rate: speech.rate,
        pitch: speech.pitch,
        styleId: speech.styleId,
        seed: speech.seed || message,
      }) || false;
    }

    directHostBeat(beat, {
      facts = {},
      authoredLine = '',
    } = {}) {
      return this.hostPerformanceDirector.direct(beat, {
        locale: this.getLocale(),
        facts,
        authoredLine,
      });
    }

    performHostBeat(beat, options = {}) {
      const performance = this.directHostBeat(beat, options);
      this.renderHost(performance.expression, performance);
      return performance;
    }

    clearCluePerformance() {
      this.currentCluePerformance = null;
    }

    presentClue({
      sourceClue,
      displayClue = sourceClue,
      gameState,
      sequence,
    } = {}) {
      if (!sourceClue) return null;
      this.currentCluePerformance = this.performHostBeat(this.hostBeats.CLUE, {
        facts: {
          clueId: sourceClue.id,
          sequence,
        },
        authoredLine: sourceClue.performance?.hostLine,
      });
      this.renderer.renderClue(displayClue, gameState?.currentClueValue || 0);
      return this.currentCluePerformance;
    }

    narrateClue({
      sourceClue,
      displayClue = sourceClue,
      value = 0,
      sequence,
      questionText = '',
    } = {}) {
      if (!sourceClue || !displayClue) return false;
      const locale = this.getLocale();
      const cached = this.currentCluePerformance;
      const performance = (
        cached?.beat === this.hostBeats.CLUE
        && cached?.receipt?.clueId === sourceClue.id
        && cached?.dialogue?.locale === locale
      ) ? cached : this.directHostBeat(this.hostBeats.CLUE, {
          facts: {
            clueId: sourceClue.id,
            sequence,
          },
          authoredLine: locale === 'en' ? sourceClue.performance?.hostLine : '',
        });
      this.currentCluePerformance = performance;
      return this.speak([
        performance.dialogue.line,
        this.getCopy().voiceClue(displayClue.category || '', value, questionText),
      ].filter(Boolean).join(' '), performance.speech);
    }

    presentEmptyAnswer({ clueId } = {}) {
      const performance = this.performHostBeat(this.hostBeats.EMPTY, {
        facts: { clueId },
      });
      this.renderer.displayEmptyAnswerQuip(
        performance.dialogue.line || this.getCopy().emptyAnswerFallback,
      );
      return performance;
    }

    presentJudgment(result, { displayClue } = {}) {
      if (!result?.ok) {
        this.renderer.displayErrorMessage(result?.error?.message || 'Answer unavailable.');
        return null;
      }

      const correct = Boolean(result.isCorrect);
      const performance = this.performHostBeat(
        correct && result.currentStreak >= 3
          ? this.hostBeats.STREAK
          : correct
            ? this.hostBeats.CORRECT
            : this.hostBeats.INCORRECT,
        {
          facts: {
            clueId: result.clue?.id,
            outcome: correct ? 'correct' : 'incorrect',
            streak: result.currentStreak,
            score: result.newScore,
          },
        },
      );
      const correctAnswer = displayClue?.answer || result.correctAnswer || 'Unknown';
      if (correct) {
        this.renderer.displayCorrectAnswerMessage({ ...result, correctAnswer });
        this.renderer.setStatus(this.getCopy().correctStatus(
          result.scoreDelta,
          performance.dialogue.line,
        ));
      } else {
        this.renderer.displayIncorrectAnswerMessage({ ...result, correctAnswer });
        this.renderer.setStatus(this.getCopy().incorrectStatus(performance.dialogue.line));
      }
      return performance;
    }

    narrateJudgment(judgment, performance, { displayClue } = {}) {
      if (!judgment?.ok) return false;
      return this.speak([
        performance?.dialogue?.line,
        judgment.isCorrect
          ? this.getCopy().voiceCorrect(judgment.scoreDelta, judgment.currentStreak)
          : this.getCopy().voiceIncorrect(
            displayClue?.answer || judgment.correctAnswer || 'Unknown',
          ),
      ].filter(Boolean).join(' '), performance?.speech);
    }

    presentReveal({ sourceClue } = {}) {
      return this.performHostBeat(this.hostBeats.REVEAL, {
        facts: {
          clueId: sourceClue?.id,
          outcome: 'revealed',
        },
      });
    }

    narrateReveal(revealedAnswer, performance) {
      return this.speak([
        performance?.dialogue?.line,
        this.getCopy().voiceReveal(revealedAnswer),
      ].filter(Boolean).join(' '), performance?.speech);
    }

    presentEpisodeComplete(progress) {
      const performance = this.performHostBeat(this.hostBeats.EPISODE_COMPLETE, {
        facts: {
          outcome: 'complete',
          sequence: progress.total,
          score: progress.score,
        },
        authoredLine: progress.finale?.hostLine,
      });
      this.renderer.renderSessionProgress(progress);
      this.renderer.renderEpisodeComplete(progress);
      this.speak([
        performance.dialogue.line,
        this.getCopy().voiceComplete(progress.score, progress.counts.correct, progress.total),
        progress.finale?.teaser,
      ].filter(Boolean).join(' '), performance.speech);
      return performance;
    }
  }

  return {
    BroadcastPresenter,
  };
}));
