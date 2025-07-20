/**
 * Game Controller
 * 
 * Carmack's principle: "The controller should be thin.
 * It orchestrates but doesn't implement game logic."
 */

import { GameEngine, GameSession } from './game.js';
import { QuestionBank, createErrorQuestion } from './question.js';
import { ScoreCalculator, ScoreTracker } from './scoring.js';
import { AnswerValidator } from './validation.js';
import { GAME_STATES, TIMING, DEBUG } from '../utils/constants.js';
import { emitGameEvent, GAME_EVENTS, onGameEvent } from '../utils/events.js';
import { delay } from '../utils/helpers.js';
import { getRandomCategory, getQuestionsByCategory } from '../services/api/questionService.js';

/**
 * Main Game Controller
 * Coordinates all game systems
 */
export class GameController {
  constructor(config = {}) {
    // Core systems
    this.engine = new GameEngine();
    this.session = new GameSession();
    this.questionBank = new QuestionBank();
    this.scoreTracker = new ScoreTracker();
    this.validator = new AnswerValidator();
    
    // Configuration
    this.config = {
      autoAdvance: true,
      autoAdvanceDelay: TIMING.DELAYS.BEFORE_NEXT,
      peekTokens: 5,
      ...config
    };
    
    // State
    this.currentQuestion = null;
    this.peekTokensUsed = 0;
    this.isInitialized = false;
    
    // Category mode state
    this.categoryMode = {
      active: false,
      currentCategory: null,
      questions: [],
      currentIndex: 0,
      completedCount: 0
    };
    
    // Bind methods
    this.handleStateChange = this.handleStateChange.bind(this);
  }

  /**
   * Initialize the game controller
   */
  async initialize() {
    if (this.isInitialized) return;
    
    console.log('🎮 Initializing Game Controller...');
    
    // Subscribe to state changes
    onGameEvent(GAME_EVENTS.STATE_CHANGED, this.handleStateChange);
    
    // Initialize subsystems
    await this.loadQuestions();
    
    this.isInitialized = true;
    console.log('✅ Game Controller initialized');
  }

  /**
   * Load questions into the bank
   */
  async loadQuestions() {
    // This would typically load from API or local storage
    // For now, we'll add some sample questions
    const sampleQuestions = [
      {
        question: "What is the capital of France?",
        answer: "Paris",
        category: "Geography",
        value: 200
      },
      {
        question: "Who wrote 'Romeo and Juliet'?",
        answer: "William Shakespeare",
        category: "Literature",
        value: 400
      },
      {
        question: "What is the largest planet in our solar system?",
        answer: "Jupiter",
        category: "Science",
        value: 600
      }
    ];
    
    const added = this.questionBank.addQuestions(sampleQuestions);
    console.log(`📚 Loaded ${added} questions`);
  }

  /**
   * Start a new game
   */
  startGame() {
    console.log('🎯 Starting new game...');
    
    // Reset systems
    this.engine.reset();
    this.session = new GameSession();
    this.scoreTracker.reset();
    this.validator.clearHistory();
    this.questionBank.resetUsed();
    this.peekTokensUsed = 0;
    
    // Reset category mode
    this.resetCategoryMode();
    
    // Start game
    this.engine.transition(GAME_STATES.IDLE);
    emitGameEvent(GAME_EVENTS.GAME_STARTED, {
      sessionId: this.session.sessionId
    });
  }

  /**
   * Start category mode with a random category
   * @param {number} minQuestions - Minimum questions required for category
   */
  async startCategoryMode(minQuestions = 5) {
    console.log('🎲 Starting category mode...');
    
    try {
      // Get a random category with enough questions
      const category = await getRandomCategory(minQuestions);
      
      if (!category) {
        console.warn('No categories available with enough questions');
        emitGameEvent(GAME_EVENTS.ERROR_OCCURRED, {
          error: 'No categories available with enough questions',
          context: 'category_mode_start'
        });
        return false;
      }
      
      // Load all questions for the category
      const questions = await getQuestionsByCategory(category);
      
      if (!questions || questions.length === 0) {
        console.warn('No questions found for category:', category);
        return false;
      }
      
      // Set up category mode
      this.categoryMode = {
        active: true,
        currentCategory: category,
        questions: questions,
        currentIndex: 0,
        completedCount: 0
      };
      
      console.log(`📚 Started category mode: "${category}" with ${questions.length} questions`);
      
      // Emit category mode started event
      emitGameEvent(GAME_EVENTS.CATEGORY_MODE_STARTED, {
        category: category,
        totalQuestions: questions.length
      });
      
      return true;
      
    } catch (error) {
      console.error('❌ Error starting category mode:', error);
      this.handleError(error);
      return false;
    }
  }

  /**
   * Reset category mode state
   */
  resetCategoryMode() {
    this.categoryMode = {
      active: false,
      currentCategory: null,
      questions: [],
      currentIndex: 0,
      completedCount: 0
    };
  }

  /**
   * Check if category mode is complete
   * @returns {boolean} True if all questions in category are completed
   */
  isCategoryComplete() {
    return this.categoryMode.active && 
           this.categoryMode.currentIndex >= this.categoryMode.questions.length;
  }

  /**
   * Get category mode progress
   * @returns {Object} Progress information
   */
  getCategoryProgress() {
    if (!this.categoryMode.active) return null;
    
    return {
      category: this.categoryMode.currentCategory,
      current: this.categoryMode.currentIndex + 1,
      total: this.categoryMode.questions.length,
      completed: this.categoryMode.completedCount,
      remaining: this.categoryMode.questions.length - this.categoryMode.currentIndex
    };
  }

  /**
   * Load next question
   */
  async loadNextQuestion() {
    // Transition to loading state
    this.engine.transition(GAME_STATES.LOADING);
    
    try {
      let question;
      
      // Check if we're in category mode
      if (this.categoryMode.active) {
        // Check if category is complete
        if (this.isCategoryComplete()) {
          // Emit category complete event
          emitGameEvent(GAME_EVENTS.CATEGORY_COMPLETED, {
            category: this.categoryMode.currentCategory,
            completedCount: this.categoryMode.completedCount,
            totalQuestions: this.categoryMode.questions.length,
            stats: this.session.getStats()
          });
          
          // Reset category mode
          this.resetCategoryMode();
          
          // Fall back to random question
          question = this.questionBank.getRandomQuestion();
        } else {
          // Get next question from category
          question = this.categoryMode.questions[this.categoryMode.currentIndex];
          
          // Ensure question has required properties
          if (!question.id) {
            question.id = `category_${this.categoryMode.currentCategory}_${this.categoryMode.currentIndex}`;
          }
          if (!question.value) {
            question.value = 200; // Default value
          }
          if (!question.difficulty) {
            question.difficulty = 'medium';
          }
          
          console.log(`📖 Loading category question ${this.categoryMode.currentIndex + 1}/${this.categoryMode.questions.length}: ${question.question}`);
        }
      } else {
        // Get random question from bank
        question = this.questionBank.getRandomQuestion();
      }
      
      // If no questions available, use error question
      if (!question) {
        question = createErrorQuestion('No more questions available');
      }
      
      // Normalize and set current question
      this.currentQuestion = question.normalize ? question.normalize() : question;
      
      // Start new round
      this.session.startRound(this.currentQuestion);
      
      // Emit event with category context
      emitGameEvent(GAME_EVENTS.QUESTION_LOADED, {
        question: this.currentQuestion,
        categoryMode: this.categoryMode.active,
        categoryProgress: this.getCategoryProgress()
      });
      
      // Transition to display state
      await delay(DEBUG.BYPASS_ANIMATIONS ? 0 : TIMING.ANIMATION.FAST);
      this.engine.transition(GAME_STATES.QUESTION_DISPLAY, {
        question: this.currentQuestion
      });
      
    } catch (error) {
      console.error('❌ Error loading question:', error);
      this.handleError(error);
    }
  }

  /**
   * Submit answer
   * @param {string} answer - User's answer
   */
  async submitAnswer(answer) {
    if (this.engine.getState() !== GAME_STATES.AWAITING_ANSWER) {
      console.warn('Cannot submit answer in current state');
      return;
    }
    
    // Transition to checking state
    this.engine.transition(GAME_STATES.CHECKING_ANSWER);
    
    // Stop timer and get elapsed time
    const timeElapsed = this.engine.stopTimer();
    
    // Validate answer
    const validation = this.validator.validate(
      answer,
      this.currentQuestion.answer
    );
    
    // Calculate score
    const scoreData = ScoreCalculator.calculateRoundScore({
      isCorrect: validation.isCorrect,
      baseValue: this.currentQuestion.value,
      timeElapsed,
      streak: this.scoreTracker.currentStreak,
      difficulty: this.currentQuestion.difficulty,
      peekUsed: this.session.currentRound?.peekUsed || false
    });
    
    // Update score and streak
    this.scoreTracker.addScore(scoreData.total, {
      questionId: this.currentQuestion.id,
      breakdown: scoreData.breakdown
    });
    this.scoreTracker.updateStreak(validation.isCorrect);
    
    // Complete round
    this.session.completeRound({
      userAnswer: answer,
      isCorrect: validation.isCorrect,
      score: scoreData.total,
      peekUsed: this.session.currentRound?.peekUsed || false
    });
    
    // Emit events
    emitGameEvent(GAME_EVENTS.ANSWER_SUBMITTED, {
      answer,
      validation,
      score: scoreData
    });
    
    emitGameEvent(GAME_EVENTS.ANSWER_CHECKED, {
      isCorrect: validation.isCorrect,
      feedback: validation.feedback
    });
    
    // Transition to answer revealed
    await delay(DEBUG.BYPASS_ANIMATIONS ? 0 : TIMING.ANIMATION.NORMAL);
    this.engine.transition(GAME_STATES.ANSWER_REVEALED, {
      validation,
      score: scoreData
    });
    
    // Auto-advance if enabled
    if (this.config.autoAdvance) {
      await delay(this.config.autoAdvanceDelay);
      this.endRound();
    }
  }

  /**
   * Reveal answer (peek)
   */
  revealAnswer() {
    const canPeek = this.peekTokensUsed < this.config.peekTokens;
    const inCorrectState = [
      GAME_STATES.QUESTION_DISPLAY,
      GAME_STATES.AWAITING_ANSWER
    ].includes(this.engine.getState());
    
    if (!canPeek || !inCorrectState) {
      console.warn('Cannot reveal answer');
      return false;
    }
    
    // Mark peek used
    this.peekTokensUsed++;
    if (this.session.currentRound) {
      this.session.currentRound.peekUsed = true;
    }
    
    // Emit event
    emitGameEvent(GAME_EVENTS.ANSWER_REVEALED, {
      answer: this.currentQuestion.answer,
      peekTokensRemaining: this.config.peekTokens - this.peekTokensUsed
    });
    
    return true;
  }

  /**
   * End current round
   */
  endRound() {
    this.engine.transition(GAME_STATES.ROUND_END);
    
    // Update category mode progress if active
    if (this.categoryMode.active) {
      this.categoryMode.currentIndex++;
      this.categoryMode.completedCount++;
      
      console.log(`✅ Category progress: ${this.categoryMode.completedCount}/${this.categoryMode.questions.length} questions completed`);
    }
    
    // Clear current question
    this.currentQuestion = null;
    
    // Emit round end event with category context
    emitGameEvent(GAME_EVENTS.ROUND_ENDED, {
      stats: this.session.getStats(),
      categoryMode: this.categoryMode.active,
      categoryProgress: this.getCategoryProgress()
    });
    
    // Return to idle
    this.engine.transition(GAME_STATES.IDLE);
  }

  /**
   * Handle state changes
   * @param {Object} event - State change event
   */
  handleStateChange(event) {
    const { to } = event;
    
    switch (to) {
      case GAME_STATES.QUESTION_DISPLAY:
        // Automatically transition to awaiting answer
        setTimeout(() => {
          if (this.engine.getState() === GAME_STATES.QUESTION_DISPLAY) {
            this.engine.transition(GAME_STATES.AWAITING_ANSWER);
          }
        }, DEBUG.BYPASS_ANIMATIONS ? 0 : TIMING.ANIMATION.NORMAL);
        break;
    }
  }

  /**
   * Handle errors
   * @param {Error} error - Error object
   */
  handleError(error) {
    console.error('Game error:', error);
    
    emitGameEvent(GAME_EVENTS.ERROR_OCCURRED, {
      error: error.message,
      state: this.engine.getState()
    });
    
    // Try to recover by returning to idle
    this.engine.transition(GAME_STATES.IDLE);
  }

  /**
   * Get game statistics
   * @returns {Object} Game stats
   */
  getStats() {
    return {
      engine: {
        state: this.engine.getState(),
        gameId: this.engine.gameId
      },
      session: this.session.getStats(),
      score: this.scoreTracker.getStats(),
      questions: this.questionBank.getStats(),
      validation: this.validator.getStats(),
      peekTokens: {
        used: this.peekTokensUsed,
        remaining: this.config.peekTokens - this.peekTokensUsed
      },
      categoryMode: {
        active: this.categoryMode.active,
        category: this.categoryMode.currentCategory,
        progress: this.getCategoryProgress()
      }
    };
  }

  /**
   * Export game data
   * @returns {Object} Complete game data
   */
  exportGameData() {
    return {
      timestamp: Date.now(),
      session: this.session.export(),
      score: this.scoreTracker.export(),
      config: this.config
    };
  }

  /**
   * Pause game
   */
  pause() {
    this.engine.pause();
  }

  /**
   * Resume game
   */
  resume() {
    this.engine.resume();
  }

  /**
   * Cleanup
   */
  destroy() {
    // Remove event listeners
    this.engine.reset();
    this.isInitialized = false;
  }
}
