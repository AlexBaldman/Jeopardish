/**
 * Core Game Engine
 * 
 * Carmack's principle: "The game loop should be simple and predictable.
 * Complex behavior emerges from simple rules applied consistently."
 */

import { GAME_STATES, TIMING } from '../utils/constants.js';
import { emitGameEvent, GAME_EVENTS } from '../utils/events.js';
import { generateId } from '../utils/helpers.js';

/**
 * Game State Machine
 * Manages the core game state and transitions
 */
export class GameEngine {
  constructor() {
    this.state = GAME_STATES.IDLE;
    this.previousState = null;
    this.stateData = {};
    this.stateTimestamp = Date.now();
    this.gameId = generateId();
    this.isPaused = false;
  }

  /**
   * Get current state
   * @returns {string} Current game state
   */
  getState() {
    return this.state;
  }

  /**
   * Get time in current state
   * @returns {number} Milliseconds in current state
   */
  getStateTime() {
    return Date.now() - this.stateTimestamp;
  }

  /**
   * Transition to a new state
   * @param {string} newState - New state to transition to
   * @param {Object} data - Optional state data
   * @returns {boolean} Success of transition
   */
  transition(newState, data = {}) {
    if (!this.canTransition(this.state, newState)) {
      console.warn(`Invalid transition from ${this.state} to ${newState}`);
      return false;
    }

    // Exit current state
    this.exitState(this.state);

    // Update state
    this.previousState = this.state;
    this.state = newState;
    this.stateData = data;
    this.stateTimestamp = Date.now();

    // Enter new state
    this.enterState(newState, data);

    // Emit state change event
    emitGameEvent(GAME_EVENTS.STATE_CHANGED, {
      from: this.previousState,
      to: this.state,
      data: this.stateData
    });

    return true;
  }

  /**
   * Check if transition is valid
   * @param {string} from - Current state
   * @param {string} to - Target state
   * @returns {boolean} Whether transition is allowed
   */
  canTransition(from, to) {
    // Define valid state transitions
    const validTransitions = {
      [GAME_STATES.IDLE]: [
        GAME_STATES.LOADING,
        GAME_STATES.QUESTION_DISPLAY
      ],
      [GAME_STATES.LOADING]: [
        GAME_STATES.QUESTION_DISPLAY,
        GAME_STATES.IDLE
      ],
      [GAME_STATES.QUESTION_DISPLAY]: [
        GAME_STATES.AWAITING_ANSWER,
        GAME_STATES.ANSWER_REVEALED,
        GAME_STATES.IDLE
      ],
      [GAME_STATES.AWAITING_ANSWER]: [
        GAME_STATES.CHECKING_ANSWER,
        GAME_STATES.ANSWER_REVEALED,
        GAME_STATES.IDLE
      ],
      [GAME_STATES.CHECKING_ANSWER]: [
        GAME_STATES.ANSWER_REVEALED,
        GAME_STATES.ROUND_END
      ],
      [GAME_STATES.ANSWER_REVEALED]: [
        GAME_STATES.ROUND_END,
        GAME_STATES.IDLE
      ],
      [GAME_STATES.ROUND_END]: [
        GAME_STATES.IDLE,
        GAME_STATES.LOADING
      ]
    };

    return validTransitions[from]?.includes(to) || false;
  }

  /**
   * Handle state entry
   * @param {string} state - State being entered
   * @param {Object} data - State data
   */
  enterState(state, data) {
    switch (state) {
      case GAME_STATES.LOADING:
        console.log('🔄 Loading new question...');
        break;
      
      case GAME_STATES.QUESTION_DISPLAY:
        console.log('📋 Displaying question');
        this.startTimer();
        break;
      
      case GAME_STATES.AWAITING_ANSWER:
        console.log('⏳ Awaiting player answer...');
        break;
      
      case GAME_STATES.CHECKING_ANSWER:
        console.log('🔍 Checking answer...');
        this.stopTimer();
        break;
      
      case GAME_STATES.ANSWER_REVEALED:
        console.log('💡 Answer revealed');
        break;
      
      case GAME_STATES.ROUND_END:
        console.log('🏁 Round complete');
        break;
    }
  }

  /**
   * Handle state exit
   * @param {string} state - State being exited
   */
  exitState(state) {
    // Clean up any state-specific resources
    if (state === GAME_STATES.AWAITING_ANSWER || state === GAME_STATES.QUESTION_DISPLAY) {
      this.stopTimer();
    }
  }

  /**
   * Start answer timer
   */
  startTimer() {
    this.timerStart = Date.now();
  }

  /**
   * Stop answer timer
   * @returns {number} Elapsed time in milliseconds
   */
  stopTimer() {
    if (!this.timerStart) return 0;
    const elapsed = Date.now() - this.timerStart;
    this.timerStart = null;
    return elapsed;
  }

  /**
   * Get elapsed time
   * @returns {number} Elapsed time in milliseconds
   */
  getElapsedTime() {
    if (!this.timerStart) return 0;
    return Date.now() - this.timerStart;
  }

  /**
   * Pause game
   */
  pause() {
    if (!this.isPaused) {
      this.isPaused = true;
      this.pauseTime = Date.now();
      emitGameEvent(GAME_EVENTS.GAME_PAUSED);
    }
  }

  /**
   * Resume game
   */
  resume() {
    if (this.isPaused) {
      this.isPaused = false;
      // Adjust timer if it was running
      if (this.timerStart) {
        const pauseDuration = Date.now() - this.pauseTime;
        this.timerStart += pauseDuration;
      }
      emitGameEvent(GAME_EVENTS.GAME_RESUMED);
    }
  }

  /**
   * Reset game engine
   */
  reset() {
    this.state = GAME_STATES.IDLE;
    this.previousState = null;
    this.stateData = {};
    this.stateTimestamp = Date.now();
    this.gameId = generateId();
    this.isPaused = false;
    this.timerStart = null;
  }
}

/**
 * Game Session
 * Tracks a complete game session with multiple rounds
 */
export class GameSession {
  constructor() {
    this.sessionId = generateId();
    this.startTime = Date.now();
    this.rounds = [];
    this.currentRound = null;
    this.totalScore = 0;
    this.totalQuestions = 0;
    this.correctAnswers = 0;
  }

  /**
   * Start a new round
   * @param {Object} question - Question data
   * @returns {Object} Round object
   */
  startRound(question) {
    const round = {
      id: generateId(),
      questionId: question.id,
      question: question.question,
      answer: question.answer,
      category: question.category,
      value: question.value,
      startTime: Date.now(),
      endTime: null,
      userAnswer: null,
      isCorrect: false,
      timeElapsed: 0,
      score: 0,
      peekUsed: false
    };

    this.currentRound = round;
    this.rounds.push(round);
    this.totalQuestions++;

    return round;
  }

  /**
   * Complete current round
   * @param {Object} result - Round result data
   */
  completeRound(result) {
    if (!this.currentRound) return;

    this.currentRound.endTime = Date.now();
    this.currentRound.timeElapsed = this.currentRound.endTime - this.currentRound.startTime;
    this.currentRound.userAnswer = result.userAnswer;
    this.currentRound.isCorrect = result.isCorrect;
    this.currentRound.score = result.score;
    this.currentRound.peekUsed = result.peekUsed;

    if (result.isCorrect) {
      this.correctAnswers++;
    }

    this.totalScore += result.score;
    this.currentRound = null;
  }

  /**
   * Get session statistics
   * @returns {Object} Session stats
   */
  getStats() {
    const accuracy = this.totalQuestions > 0 
      ? (this.correctAnswers / this.totalQuestions) * 100 
      : 0;

    const averageTime = this.rounds.length > 0
      ? this.rounds.reduce((sum, r) => sum + r.timeElapsed, 0) / this.rounds.length
      : 0;

    return {
      sessionId: this.sessionId,
      duration: Date.now() - this.startTime,
      totalScore: this.totalScore,
      totalQuestions: this.totalQuestions,
      correctAnswers: this.correctAnswers,
      accuracy: Math.round(accuracy),
      averageResponseTime: Math.round(averageTime),
      rounds: this.rounds.length
    };
  }

  /**
   * Export session data
   * @returns {Object} Complete session data
   */
  export() {
    return {
      ...this.getStats(),
      startTime: this.startTime,
      endTime: Date.now(),
      rounds: this.rounds
    };
  }
}
