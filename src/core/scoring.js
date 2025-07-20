/**
 * Scoring System Module
 * 
 * Carmack's principle: "Make the math obvious. 
 * Complex scoring systems often hide bugs."
 */

import { SCORING, RULES } from '../utils/constants.js';
import { clamp } from '../utils/helpers.js';
import { emitGameEvent, GAME_EVENTS } from '../utils/events.js';

/**
 * Score Calculator
 * Handles all score calculations with clear, predictable rules
 */
export class ScoreCalculator {
  /**
   * Calculate score for a correct answer
   * @param {Object} params - Scoring parameters
   * @returns {number} Calculated score
   */
  static calculateCorrectScore(params) {
    const {
      baseValue = 200,
      timeElapsed = 0,
      streak = 0,
      difficulty = 'medium',
      peekUsed = false
    } = params;

    // No points if answer was revealed
    if (peekUsed) {
      return 0;
    }

    // Base score
    let score = baseValue * SCORING.CORRECT_MULTIPLIER;

    // Time bonus
    const timeBonus = this.calculateTimeBonus(timeElapsed);
    score += timeBonus;

    // Streak bonus
    const streakBonus = this.calculateStreakBonus(streak, baseValue);
    score += streakBonus;

    // Difficulty multiplier
    const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);
    score = Math.round(score * difficultyMultiplier);

    return Math.max(0, score);
  }

  /**
   * Calculate score for an incorrect answer
   * @param {Object} params - Scoring parameters
   * @returns {number} Calculated penalty
   */
  static calculateIncorrectScore(params) {
    const {
      baseValue = 200,
      peekUsed = false
    } = params;

    // Different penalty if peek was used
    if (peekUsed) {
      return -Math.round(baseValue * SCORING.INCORRECT_PENALTY * 2);
    }

    return -Math.round(baseValue * SCORING.INCORRECT_PENALTY);
  }

  /**
   * Calculate time bonus
   * @param {number} timeElapsed - Time in milliseconds
   * @returns {number} Time bonus
   */
  static calculateTimeBonus(timeElapsed) {
    const secondsElapsed = Math.floor(timeElapsed / 1000);
    const timeBonus = SCORING.TIME_BONUS_MAX - (secondsElapsed * SCORING.TIME_BONUS_DECAY);
    return Math.max(0, timeBonus);
  }

  /**
   * Calculate streak bonus
   * @param {number} streak - Current streak
   * @param {number} baseValue - Base question value
   * @returns {number} Streak bonus
   */
  static calculateStreakBonus(streak, baseValue) {
    let multiplier = 0;

    // Find the highest applicable streak bonus
    for (const [threshold, bonus] of Object.entries(SCORING.STREAK_BONUS)) {
      if (streak >= parseInt(threshold)) {
        multiplier = bonus;
      }
    }

    return Math.round(baseValue * (multiplier - 1));
  }

  /**
   * Get difficulty multiplier
   * @param {string} difficulty - Difficulty level
   * @returns {number} Multiplier
   */
  static getDifficultyMultiplier(difficulty) {
    const multipliers = {
      easy: 0.8,
      medium: 1.0,
      hard: 1.5,
      expert: 2.0
    };

    return multipliers[difficulty] || 1.0;
  }

  /**
   * Calculate round score summary
   * @param {Object} roundData - Round data
   * @returns {Object} Score breakdown
   */
  static calculateRoundScore(roundData) {
    const {
      isCorrect,
      baseValue,
      timeElapsed,
      streak,
      difficulty,
      peekUsed
    } = roundData;

    if (!isCorrect) {
      const penalty = this.calculateIncorrectScore({ baseValue, peekUsed });
      return {
        total: penalty,
        breakdown: {
          base: 0,
          timeBonus: 0,
          streakBonus: 0,
          difficultyBonus: 0,
          penalty
        }
      };
    }

    const params = {
      baseValue,
      timeElapsed,
      streak,
      difficulty,
      peekUsed
    };

    const total = this.calculateCorrectScore(params);
    const timeBonus = peekUsed ? 0 : this.calculateTimeBonus(timeElapsed);
    const streakBonus = peekUsed ? 0 : this.calculateStreakBonus(streak, baseValue);
    const difficultyMultiplier = this.getDifficultyMultiplier(difficulty);

    return {
      total,
      breakdown: {
        base: peekUsed ? 0 : baseValue,
        timeBonus,
        streakBonus,
        difficultyBonus: Math.round((baseValue * difficultyMultiplier) - baseValue),
        penalty: 0
      }
    };
  }
}

/**
 * Score Tracker
 * Tracks scores, streaks, and achievements
 */
export class ScoreTracker {
  constructor() {
    this.currentScore = 0;
    this.highScore = 0;
    this.currentStreak = 0;
    this.bestStreak = 0;
    this.totalCorrect = 0;
    this.totalQuestions = 0;
    this.scoreHistory = [];
    this.achievements = new Set();
  }

  /**
   * Add score
   * @param {number} points - Points to add
   * @param {Object} metadata - Score metadata
   */
  addScore(points, metadata = {}) {
    const previousScore = this.currentScore;
    this.currentScore = Math.max(0, this.currentScore + points);

    // Track history
    this.scoreHistory.push({
      timestamp: Date.now(),
      points,
      total: this.currentScore,
      ...metadata
    });

    // Check for high score
    if (this.currentScore > this.highScore) {
      this.highScore = this.currentScore;
      emitGameEvent(GAME_EVENTS.HIGH_SCORE_ACHIEVED, {
        score: this.highScore,
        previous: previousScore
      });
    }

    // Emit score update
    emitGameEvent(GAME_EVENTS.SCORE_UPDATED, {
      current: this.currentScore,
      high: this.highScore,
      change: points
    });

    // Check achievements
    this.checkAchievements();
  }

  /**
   * Update streak
   * @param {boolean} correct - Whether answer was correct
   */
  updateStreak(correct) {
    if (correct) {
      this.currentStreak++;
      this.totalCorrect++;
      
      if (this.currentStreak > this.bestStreak) {
        this.bestStreak = this.currentStreak;
      }

      // Check streak achievements
      this.checkStreakAchievements();
    } else {
      this.currentStreak = 0;
    }

    this.totalQuestions++;

    emitGameEvent(GAME_EVENTS.STREAK_UPDATED, {
      current: this.currentStreak,
      best: this.bestStreak
    });
  }

  /**
   * Get accuracy percentage
   * @returns {number} Accuracy percentage
   */
  getAccuracy() {
    if (this.totalQuestions === 0) return 0;
    return Math.round((this.totalCorrect / this.totalQuestions) * 100);
  }

  /**
   * Check for achievements
   */
  checkAchievements() {
    const achievements = [
      { id: 'first_correct', condition: () => this.totalCorrect === 1 },
      { id: 'score_1000', condition: () => this.currentScore >= 1000 },
      { id: 'score_5000', condition: () => this.currentScore >= 5000 },
      { id: 'score_10000', condition: () => this.currentScore >= 10000 },
      { id: 'perfect_10', condition: () => this.getAccuracy() === 100 && this.totalQuestions >= 10 }
    ];

    for (const achievement of achievements) {
      if (!this.achievements.has(achievement.id) && achievement.condition()) {
        this.achievements.add(achievement.id);
        emitGameEvent(GAME_EVENTS.ACHIEVEMENT_UNLOCKED, {
          id: achievement.id,
          timestamp: Date.now()
        });
      }
    }
  }

  /**
   * Check streak achievements
   */
  checkStreakAchievements() {
    const streakAchievements = [
      { id: 'streak_3', threshold: 3 },
      { id: 'streak_5', threshold: 5 },
      { id: 'streak_10', threshold: 10 },
      { id: 'streak_20', threshold: 20 }
    ];

    for (const achievement of streakAchievements) {
      if (!this.achievements.has(achievement.id) && this.currentStreak >= achievement.threshold) {
        this.achievements.add(achievement.id);
        emitGameEvent(GAME_EVENTS.ACHIEVEMENT_UNLOCKED, {
          id: achievement.id,
          streak: this.currentStreak
        });
      }
    }
  }

  /**
   * Get statistics
   * @returns {Object} Score statistics
   */
  getStats() {
    return {
      currentScore: this.currentScore,
      highScore: this.highScore,
      currentStreak: this.currentStreak,
      bestStreak: this.bestStreak,
      totalCorrect: this.totalCorrect,
      totalQuestions: this.totalQuestions,
      accuracy: this.getAccuracy(),
      achievements: Array.from(this.achievements),
      averageScore: this.calculateAverageScore()
    };
  }

  /**
   * Calculate average score per question
   * @returns {number} Average score
   */
  calculateAverageScore() {
    if (this.totalQuestions === 0) return 0;
    return Math.round(this.currentScore / this.totalQuestions);
  }

  /**
   * Reset tracker
   */
  reset() {
    this.currentScore = 0;
    this.currentStreak = 0;
    this.totalCorrect = 0;
    this.totalQuestions = 0;
    this.scoreHistory = [];
    // Keep high score and achievements
  }

  /**
   * Export score data
   * @returns {Object} Score data
   */
  export() {
    return {
      ...this.getStats(),
      history: this.scoreHistory
    };
  }
}
