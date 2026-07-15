(function initGameEngine(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('../../game-logic.js'),
      require('../contracts/events.js'),
    );
  } else {
    root.JeopardishEngine = factory(root.JeopardishLogic, root.JeopardishContracts);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function gameEngineFactory(logic, contracts) {
  'use strict';

  if (!logic) {
    throw new Error('JeopardishEngine requires JeopardishLogic.');
  }

  if (!contracts) {
    throw new Error('JeopardishEngine requires JeopardishContracts.');
  }

  const {
    AudioStates,
    GameEvents,
    GamePhases,
    NetworkStates,
    ScoreRules,
  } = contracts;

  class GameEngine {
    constructor({
      eventBus,
      bestStreak = 0,
      scoreRules = ScoreRules,
      now = () => new Date().toISOString(),
    } = {}) {
      if (!eventBus) {
        throw new Error('GameEngine requires an eventBus.');
      }

      this.eventBus = eventBus;
      this.scoreRules = scoreRules;
      this.now = now;
      this.activeClue = null;
      this.state = this.createInitialState({ bestStreak });
    }

    createInitialState({ bestStreak = 0 } = {}) {
      return {
        phase: GamePhases.IDLE,
        score: 0,
        currentStreak: 0,
        bestStreak,
        answeredClueIds: [],
        activeClueId: null,
        currentClueValue: 100,
        selectedCategory: null,
        networkState: NetworkStates.ONLINE,
        audioState: AudioStates.READY,
        startedAt: null,
        updatedAt: null,
      };
    }

    init() {
      this.state = {
        ...this.createInitialState({ bestStreak: this.state.bestStreak }),
        startedAt: this.now(),
        updatedAt: this.now(),
      };
      this.activeClue = null;
      this.emit(GameEvents.GAME_INIT, { state: this.getState() });
      this.setPhase(GamePhases.LOADING, 'game-init');
    }

    ready() {
      this.setPhase(GamePhases.BOARD, 'game-ready');
      this.emit(GameEvents.GAME_READY, { state: this.getState() });
    }

    restoreProgress({ score = 0, currentStreak = 0, bestStreak = 0, answeredClueIds = [] } = {}) {
      this.state = {
        ...this.state,
        score: Math.max(0, Number(score) || 0),
        currentStreak: Math.max(0, Number(currentStreak) || 0),
        bestStreak: Math.max(this.state.bestStreak, Number(bestStreak) || 0),
        answeredClueIds: Array.isArray(answeredClueIds) ? [...answeredClueIds] : [],
        updatedAt: this.now(),
      };
      return this.getState();
    }

    loadClue(clue) {
      const clueValue = logic.parseClueValue(clue?.value, 100);
      this.activeClue = clue || null;
      this.state = {
        ...this.state,
        activeClueId: getClueId(clue),
        currentClueValue: clueValue,
        selectedCategory: clue?.category || null,
        updatedAt: this.now(),
      };

      this.emit(GameEvents.CLUE_LOADED, {
        clue,
        clueValue,
      });
      this.setPhase(GamePhases.ANSWERING, 'clue-loaded');
      return this.getState();
    }

    submitAnswer(answer, { acceptedAnswers = [] } = {}) {
      if (!this.activeClue) {
        const error = {
          code: 'answer-without-active-clue',
          message: 'Cannot submit an answer without an active clue.',
        };
        this.emit(GameEvents.ERROR_REPORTED, error);
        return {
          ok: false,
          error,
        };
      }

      const submittedAnswer = String(answer || '');
      const correctAnswer = String(this.activeClue.answer || '').trim();

      this.emit(GameEvents.ANSWER_SUBMITTED, {
        clueId: getClueId(this.activeClue),
        submittedAnswer,
        submittedAt: this.now(),
      });

      const answerCandidates = [
        this.activeClue.answer || '',
        ...acceptedAnswers,
      ].filter((candidate, index, values) => candidate && values.indexOf(candidate) === index);
      if (answerCandidates.length === 0) {
        answerCandidates.push('');
      }
      const answerMatches = answerCandidates.map((candidate) => ({
        candidate,
        match: logic.compareAnswersDetailed(submittedAnswer, candidate),
      }));
      const selectedMatch = answerMatches.find(({ match }) => match.isCorrect) || answerMatches[0];
      const answerMatch = {
        ...selectedMatch.match,
        matchedAnswer: selectedMatch.candidate,
      };
      const isCorrect = answerMatch.isCorrect;
      const previousScore = this.state.score;
      const previousStreak = this.state.currentStreak;
      const nextScore = isCorrect
        ? this.state.score + this.state.currentClueValue
        : this.getIncorrectScore();
      const nextStreak = isCorrect ? this.state.currentStreak + 1 : 0;
      const nextBestStreak = Math.max(this.state.bestStreak, nextStreak);
      const scoreDelta = nextScore - previousScore;

      this.state = {
        ...this.state,
        score: nextScore,
        currentStreak: nextStreak,
        bestStreak: nextBestStreak,
        answeredClueIds: [...this.state.answeredClueIds, getClueId(this.activeClue)],
        activeClueId: null,
        updatedAt: this.now(),
      };

      const result = {
        ok: true,
        isCorrect,
        clue: this.activeClue,
        clueId: getClueId(this.activeClue),
        submittedAnswer,
        correctAnswer,
        answerMatch,
        scoreDelta,
        previousScore,
        newScore: nextScore,
        previousStreak,
        currentStreak: nextStreak,
        bestStreak: nextBestStreak,
      };

      this.emit(GameEvents.SCORE_CHANGED, {
        previousScore,
        newScore: nextScore,
        scoreDelta,
      });
      this.emit(GameEvents.STREAK_CHANGED, {
        previousStreak,
        currentStreak: nextStreak,
        bestStreak: nextBestStreak,
      });
      this.emit(isCorrect ? GameEvents.ANSWER_CORRECT : GameEvents.ANSWER_INCORRECT, result);

      if (isCorrect && this.scoreRules.streakMilestones.includes(nextStreak)) {
        this.emit(GameEvents.STREAK_MILESTONE, {
          streak: nextStreak,
          score: nextScore,
        });
      }

      this.activeClue = null;
      this.setPhase(GamePhases.REVEALING, 'answer-submitted');
      return result;
    }

    getIncorrectScore() {
      if (this.scoreRules.incorrectScoreMode === 'subtract') {
        const nextScore = this.state.score - this.state.currentClueValue;
        return this.scoreRules.allowNegativeScore ? nextScore : Math.max(0, nextScore);
      }

      return 0;
    }

    getState() {
      return {
        ...this.state,
        answeredClueIds: [...this.state.answeredClueIds],
      };
    }

    getActiveClue() {
      return this.activeClue;
    }

    setPhase(nextPhase, reason) {
      const previousPhase = this.state.phase;
      this.state = {
        ...this.state,
        phase: nextPhase,
        updatedAt: this.now(),
      };
      this.emit(GameEvents.PHASE_CHANGED, {
        previousPhase,
        nextPhase,
        reason,
      });
    }

    emit(type, payload = {}) {
      return this.eventBus.emit(type, payload, { source: 'GameEngine' });
    }
  }

  function getClueId(clue) {
    if (!clue) return null;
    if (clue.id) return String(clue.id);
    return [
      clue.category || 'unknown',
      clue.value || 'unknown',
      clue.question || 'unknown',
    ].join('|');
  }

  return {
    GameEngine,
  };
}));
