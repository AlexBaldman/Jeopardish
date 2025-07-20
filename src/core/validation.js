/**
 * Answer Validation Module
 * 
 * Carmack's principle: "The core game logic should be bulletproof.
 * This is where the game's integrity lives."
 */

import { checkAnswer as checkAnswerUtil } from '../utils/validators.js';
import { generateId } from '../utils/helpers.js';

/**
 * Answer Validator
 * Handles answer validation with detailed feedback
 */
export class AnswerValidator {
  constructor() {
    this.validationHistory = [];
  }

  /**
   * Validate an answer
   * @param {string} userAnswer - User's answer
   * @param {string} correctAnswer - Correct answer
   * @param {Object} options - Validation options
   * @returns {Object} Validation result
   */
  validate(userAnswer, correctAnswer, options = {}) {
    const startTime = Date.now();
    
    // Use utility function for core validation
    const isCorrect = checkAnswerUtil(userAnswer, correctAnswer, options.threshold);
    
    // Generate detailed result
    const result = {
      id: generateId(),
      isCorrect,
      userAnswer,
      correctAnswer,
      timestamp: startTime,
      processingTime: Date.now() - startTime,
      confidence: this.calculateConfidence(userAnswer, correctAnswer),
      feedback: this.generateFeedback(isCorrect, userAnswer, correctAnswer)
    };

    // Track validation
    this.validationHistory.push(result);
    
    return result;
  }

  /**
   * Calculate confidence in the answer match
   * @param {string} userAnswer - User's answer
   * @param {string} correctAnswer - Correct answer
   * @returns {number} Confidence score (0-1)
   */
  calculateConfidence(userAnswer, correctAnswer) {
    // Exact match = 100% confidence
    if (userAnswer.toLowerCase().trim() === correctAnswer.toLowerCase().trim()) {
      return 1.0;
    }

    // Use string similarity for confidence
    const similarity = this.calculateSimilarity(userAnswer, correctAnswer);
    return Math.round(similarity * 100) / 100;
  }

  /**
   * Calculate string similarity
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {number} Similarity score (0-1)
   */
  calculateSimilarity(a, b) {
    // Simple character-based similarity
    const longer = a.length > b.length ? a : b;
    const shorter = a.length > b.length ? b : a;
    
    if (longer.length === 0) return 1.0;
    
    let matches = 0;
    for (let i = 0; i < shorter.length; i++) {
      if (longer.includes(shorter[i])) {
        matches++;
      }
    }
    
    return matches / longer.length;
  }

  /**
   * Generate feedback for the answer
   * @param {boolean} isCorrect - Whether answer was correct
   * @param {string} userAnswer - User's answer
   * @param {string} correctAnswer - Correct answer
   * @returns {Object} Feedback object
   */
  generateFeedback(isCorrect, userAnswer, correctAnswer) {
    if (isCorrect) {
      return this.generateCorrectFeedback();
    } else {
      return this.generateIncorrectFeedback(userAnswer, correctAnswer);
    }
  }

  /**
   * Generate feedback for correct answers
   * @returns {Object} Feedback
   */
  generateCorrectFeedback() {
    const messages = [
      "Correctamundo!",
      "Nailed it!",
      "You're on fire!",
      "Excellent!",
      "Outstanding!",
      "Brilliant!",
      "Perfect!",
      "Spot on!",
      "Well done!",
      "Impressive!"
    ];

    const funMessages = [
      "Correctamundo and cowabunga, my friend!",
      "You must have a brain the size of a planet!",
      "Are you secretly a trivia champion?",
      "Someone's been eating their Wheaties!",
      "Your neurons are firing on all cylinders!",
      "Did you just Google that? Just kidding, great job!",
      "You're making this look too easy!",
      "The force is strong with this one!",
      "Alert the media - we have a genius here!",
      "You're crushing it like a boss!"
    ];

    const usesFun = Math.random() < 0.3; // 30% chance of fun message
    const pool = usesFun ? funMessages : messages;
    const message = pool[Math.floor(Math.random() * pool.length)];

    return {
      type: 'correct',
      message,
      tone: usesFun ? 'playful' : 'encouraging'
    };
  }

  /**
   * Generate feedback for incorrect answers
   * @param {string} userAnswer - User's answer
   * @param {string} correctAnswer - Correct answer
   * @returns {Object} Feedback
   */
  generateIncorrectFeedback(userAnswer, correctAnswer) {
    const similarity = this.calculateSimilarity(userAnswer, correctAnswer);
    
    let message;
    let hint = null;

    if (similarity > 0.7) {
      // Very close
      message = "So close! You were on the right track.";
      hint = this.generateHint(userAnswer, correctAnswer);
    } else if (similarity > 0.4) {
      // Somewhat close
      message = "Not quite, but I see where you were going.";
    } else {
      // Not close
      message = this.getRandomIncorrectMessage();
    }

    return {
      type: 'incorrect',
      message,
      hint,
      similarity: Math.round(similarity * 100)
    };
  }

  /**
   * Get random incorrect message
   * @returns {string} Message
   */
  getRandomIncorrectMessage() {
    const messages = [
      "Incorrect, but don't give up!",
      "Not this time, try again!",
      "Oops, that's not it!",
      "Wrong answer, but keep going!",
      "Nice try, but no cigar!",
      "That's a swing and a miss!",
      "Back to the drawing board!",
      "Not quite what we were looking for!",
      "Close, but no daily double!",
      "Better luck next time!"
    ];

    const funMessages = [
      "Incorrect, you fool! Your streak is now reset!",
      "Wrong! Did you even read the question?",
      "That answer is wronger than pineapple on pizza!",
      "Nope! That's not even in the same zip code!",
      "Wrong! My grandmother could have gotten that!",
      "Incorrect! Time to hit the books!",
      "That's so wrong it's almost impressive!",
      "Wrong! Are you even trying?",
      "Negative, Ghost Rider!",
      "That's a Texas-sized 10-4 on the WRONG!"
    ];

    const usesFun = Math.random() < 0.2; // 20% chance of fun message
    const pool = usesFun ? funMessages : messages;
    
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /**
   * Generate a hint based on the answers
   * @param {string} userAnswer - User's answer
   * @param {string} correctAnswer - Correct answer
   * @returns {string|null} Hint
   */
  generateHint(userAnswer, correctAnswer) {
    const userLower = userAnswer.toLowerCase();
    const correctLower = correctAnswer.toLowerCase();

    // Check if it's a spelling issue
    if (this.isLikelySpellingError(userLower, correctLower)) {
      return "Check your spelling!";
    }

    // Check if it's a plural issue
    if (userLower + 's' === correctLower || userLower === correctLower + 's') {
      return "Think about singular vs plural.";
    }

    // Check if missing a word
    const userWords = userLower.split(' ');
    const correctWords = correctLower.split(' ');
    if (correctWords.length > userWords.length) {
      return `The answer has ${correctWords.length} words.`;
    }

    return null;
  }

  /**
   * Check if likely spelling error
   * @param {string} a - First string
   * @param {string} b - Second string
   * @returns {boolean} Likely spelling error
   */
  isLikelySpellingError(a, b) {
    // Simple check: similar length and high similarity
    const lengthDiff = Math.abs(a.length - b.length);
    const similarity = this.calculateSimilarity(a, b);
    
    return lengthDiff <= 2 && similarity > 0.8;
  }

  /**
   * Get validation statistics
   * @returns {Object} Stats
   */
  getStats() {
    const total = this.validationHistory.length;
    const correct = this.validationHistory.filter(v => v.isCorrect).length;
    const avgProcessingTime = total > 0
      ? this.validationHistory.reduce((sum, v) => sum + v.processingTime, 0) / total
      : 0;

    return {
      totalValidations: total,
      correctAnswers: correct,
      accuracy: total > 0 ? Math.round((correct / total) * 100) : 0,
      averageProcessingTime: Math.round(avgProcessingTime * 10) / 10
    };
  }

  /**
   * Clear validation history
   */
  clearHistory() {
    this.validationHistory = [];
  }
}
