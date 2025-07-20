/**
 * Question Management Module
 * 
 * Carmack's principle: "Data structures should be simple and efficient.
 * Don't over-engineer when a simple solution works."
 */

import { validateQuestion } from '../utils/validators.js';
import { shuffleArray, generateId } from '../utils/helpers.js';
import { ERRORS } from '../utils/constants.js';

/**
 * Question data structure
 */
export class Question {
  constructor(data) {
    this.id = data.id || generateId();
    this.question = data.question;
    this.answer = data.answer;
    this.category = data.category || 'General Knowledge';
    this.value = data.value || 200;
    this.difficulty = data.difficulty || this.calculateDifficulty();
    this.airdate = data.airdate || null;
    this.source = data.source || 'unknown';
    this.alternateAnswers = data.alternateAnswers || [];
    this.metadata = data.metadata || {};
  }

  /**
   * Calculate difficulty based on value
   * @returns {string} Difficulty level
   */
  calculateDifficulty() {
    if (this.value <= 200) return 'easy';
    if (this.value <= 600) return 'medium';
    if (this.value <= 1000) return 'hard';
    return 'expert';
  }

  /**
   * Validate question data
   * @returns {{valid: boolean, error?: string}} Validation result
   */
  validate() {
    return validateQuestion(this);
  }

  /**
   * Normalize question for display
   * @returns {Object} Normalized question data
   */
  normalize() {
    return {
      id: this.id,
      question: this.cleanText(this.question),
      answer: this.cleanText(this.answer),
      category: this.category,
      value: this.value,
      difficulty: this.difficulty
    };
  }

  /**
   * Clean text for display
   * @param {string} text - Text to clean
   * @returns {string} Cleaned text
   */
  cleanText(text) {
    return text
      // Fix HTML entities
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#039;/g, "'")
      .replace(/&nbsp;/g, ' ')
      // Fix quotes
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"')
      // Trim whitespace
      .trim();
  }

  /**
   * Export question data
   * @returns {Object} Question data
   */
  export() {
    return {
      id: this.id,
      question: this.question,
      answer: this.answer,
      category: this.category,
      value: this.value,
      difficulty: this.difficulty,
      airdate: this.airdate,
      source: this.source,
      alternateAnswers: this.alternateAnswers,
      metadata: this.metadata
    };
  }
}

/**
 * Question Bank
 * Manages a collection of questions
 */
export class QuestionBank {
  constructor() {
    this.questions = new Map();
    this.categories = new Set();
    this.usedQuestions = new Set();
    this.currentIndex = 0;
  }

  /**
   * Add a question to the bank
   * @param {Object} questionData - Question data
   * @returns {Question} Added question
   */
  addQuestion(questionData) {
    const question = new Question(questionData);
    const validation = question.validate();
    
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    this.questions.set(question.id, question);
    this.categories.add(question.category);
    
    return question;
  }

  /**
   * Add multiple questions
   * @param {Array} questionsData - Array of question data
   * @returns {number} Number of questions added
   */
  addQuestions(questionsData) {
    let added = 0;
    
    for (const data of questionsData) {
      try {
        this.addQuestion(data);
        added++;
      } catch (error) {
        console.warn(`Failed to add question: ${error.message}`);
      }
    }
    
    return added;
  }

  /**
   * Get a random question
   * @param {Object} options - Filter options
   * @returns {Question|null} Random question
   */
  getRandomQuestion(options = {}) {
    const availableQuestions = this.getAvailableQuestions(options);
    
    if (availableQuestions.length === 0) {
      return null;
    }
    
    const randomIndex = Math.floor(Math.random() * availableQuestions.length);
    const question = availableQuestions[randomIndex];
    
    this.usedQuestions.add(question.id);
    
    return question;
  }

  /**
   * Get next question in sequence
   * @param {Object} options - Filter options
   * @returns {Question|null} Next question
   */
  getNextQuestion(options = {}) {
    const availableQuestions = this.getAvailableQuestions(options);
    
    if (availableQuestions.length === 0) {
      return null;
    }
    
    const question = availableQuestions[this.currentIndex % availableQuestions.length];
    this.currentIndex++;
    this.usedQuestions.add(question.id);
    
    return question;
  }

  /**
   * Get available questions
   * @param {Object} options - Filter options
   * @returns {Array<Question>} Available questions
   */
  getAvailableQuestions(options = {}) {
    let questions = Array.from(this.questions.values());
    
    // Filter by category
    if (options.category) {
      questions = questions.filter(q => q.category === options.category);
    }
    
    // Filter by difficulty
    if (options.difficulty) {
      questions = questions.filter(q => q.difficulty === options.difficulty);
    }
    
    // Filter by value range
    if (options.minValue !== undefined) {
      questions = questions.filter(q => q.value >= options.minValue);
    }
    if (options.maxValue !== undefined) {
      questions = questions.filter(q => q.value <= options.maxValue);
    }
    
    // Filter out used questions unless specified
    if (!options.includeUsed) {
      questions = questions.filter(q => !this.usedQuestions.has(q.id));
    }
    
    // Shuffle if requested
    if (options.shuffle) {
      questions = shuffleArray(questions);
    }
    
    return questions;
  }

  /**
   * Reset used questions
   */
  resetUsed() {
    this.usedQuestions.clear();
    this.currentIndex = 0;
  }

  /**
   * Get question by ID
   * @param {string} id - Question ID
   * @returns {Question|null} Question
   */
  getQuestionById(id) {
    return this.questions.get(id) || null;
  }

  /**
   * Get all categories
   * @returns {Array<string>} Categories
   */
  getCategories() {
    return Array.from(this.categories).sort();
  }

  /**
   * Get statistics
   * @returns {Object} Bank statistics
   */
  getStats() {
    const questions = Array.from(this.questions.values());
    const valueSum = questions.reduce((sum, q) => sum + q.value, 0);
    
    return {
      total: this.questions.size,
      categories: this.categories.size,
      used: this.usedQuestions.size,
      remaining: this.questions.size - this.usedQuestions.size,
      averageValue: Math.round(valueSum / this.questions.size),
      difficulties: {
        easy: questions.filter(q => q.difficulty === 'easy').length,
        medium: questions.filter(q => q.difficulty === 'medium').length,
        hard: questions.filter(q => q.difficulty === 'hard').length,
        expert: questions.filter(q => q.difficulty === 'expert').length
      }
    };
  }

  /**
   * Clear the question bank
   */
  clear() {
    this.questions.clear();
    this.categories.clear();
    this.usedQuestions.clear();
    this.currentIndex = 0;
  }
}

/**
 * Create error question for fallback
 * @param {string} message - Error message
 * @returns {Question} Error question
 */
export function createErrorQuestion(message = 'Question unavailable') {
  const errorJokes = [
    {
      question: "What do you call a trivia API that's not working?",
      answer: "A trivial problem!",
      category: "Error Humor"
    },
    {
      question: "Why did the trivia question cross the road?",
      answer: "To get to the other API!",
      category: "Tech Humor"
    },
    {
      question: "What's a programmer's favorite trivia category?",
      answer: "Null and void!",
      category: "Programming Humor"
    },
    {
      question: "How many APIs does it take to load a question?",
      answer: "Apparently more than we have!",
      category: "Tech Problems"
    }
  ];
  
  const joke = errorJokes[Math.floor(Math.random() * errorJokes.length)];
  
  return new Question({
    ...joke,
    value: 0,
    source: 'error',
    metadata: { error: message }
  });
}
