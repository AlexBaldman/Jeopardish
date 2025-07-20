/**
 * Input Validators
 * 
 * Carmack's principle: "Validate early, validate often.
 * Never trust external input."
 */

import { RULES } from './constants.js';
import { stringSimilarity } from './helpers.js';

/**
 * Validate answer input
 * @param {string} answer - Answer to validate
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export function validateAnswer(answer) {
  if (!answer || answer.trim().length === 0) {
    return { valid: false, error: 'Answer cannot be empty' };
  }
  
  if (answer.length > RULES.MAX_ANSWER_LENGTH) {
    return { valid: false, error: `Answer must be ${RULES.MAX_ANSWER_LENGTH} characters or less` };
  }
  
  // Check for potentially harmful input
  if (containsScriptTags(answer)) {
    return { valid: false, error: 'Invalid characters in answer' };
  }
  
  return { valid: true };
}

/**
 * Normalize answer for comparison
 * @param {string} answer - Answer to normalize
 * @returns {string} Normalized answer
 */
export function normalizeAnswer(answer) {
  return answer
    .toLowerCase()
    .trim()
    // Remove articles
    .replace(/^(a|an|the)\s+/i, '')
    // Remove punctuation
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '')
    // Normalize whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if user answer matches correct answer
 * @param {string} userAnswer - User's answer
 * @param {string} correctAnswer - Correct answer
 * @param {number} threshold - Similarity threshold (0-1)
 * @returns {boolean} Whether answers match
 */
export function checkAnswer(userAnswer, correctAnswer, threshold = RULES.FUZZY_MATCH_THRESHOLD) {
  // Normalize both answers
  const normalizedUser = normalizeAnswer(userAnswer);
  const normalizedCorrect = normalizeAnswer(correctAnswer);
  
  // Exact match
  if (normalizedUser === normalizedCorrect) {
    return true;
  }
  
  // Check for common variations
  if (checkCommonVariations(normalizedUser, normalizedCorrect)) {
    return true;
  }
  
  // Fuzzy match
  const similarity = stringSimilarity(normalizedUser, normalizedCorrect);
  return similarity >= threshold;
}

/**
 * Check for common answer variations
 * @param {string} userAnswer - Normalized user answer
 * @param {string} correctAnswer - Normalized correct answer
 * @returns {boolean} Whether variation matches
 */
function checkCommonVariations(userAnswer, correctAnswer) {
  // Handle numeric answers
  if (isNumericAnswer(correctAnswer)) {
    return checkNumericVariations(userAnswer, correctAnswer);
  }
  
  // Handle abbreviations
  if (checkAbbreviations(userAnswer, correctAnswer)) {
    return true;
  }
  
  // Handle plurals
  if (checkPlurals(userAnswer, correctAnswer)) {
    return true;
  }
  
  return false;
}

/**
 * Check if answer is numeric
 * @param {string} answer - Answer to check
 * @returns {boolean} Whether answer is numeric
 */
function isNumericAnswer(answer) {
  return /^\d+$/.test(answer.replace(/[,\s]/g, ''));
}

/**
 * Check numeric answer variations
 * @param {string} userAnswer - User's answer
 * @param {string} correctAnswer - Correct answer
 * @returns {boolean} Whether numeric answers match
 */
function checkNumericVariations(userAnswer, correctAnswer) {
  const userNum = parseFloat(userAnswer.replace(/[,\s]/g, ''));
  const correctNum = parseFloat(correctAnswer.replace(/[,\s]/g, ''));
  
  return !isNaN(userNum) && !isNaN(correctNum) && userNum === correctNum;
}

/**
 * Check for abbreviation matches
 * @param {string} userAnswer - User's answer
 * @param {string} correctAnswer - Correct answer
 * @returns {boolean} Whether abbreviation matches
 */
function checkAbbreviations(userAnswer, correctAnswer) {
  const commonAbbreviations = {
    'united states': ['us', 'usa'],
    'united kingdom': ['uk', 'britain'],
    'doctor': ['dr'],
    'mister': ['mr'],
    'missus': ['mrs'],
    'miss': ['ms'],
    'saint': ['st'],
    'mount': ['mt'],
    'number': ['no', '#']
  };
  
  for (const [full, abbrevs] of Object.entries(commonAbbreviations)) {
    if (correctAnswer.includes(full) && abbrevs.some(abbr => userAnswer.includes(abbr))) {
      return true;
    }
    if (abbrevs.some(abbr => correctAnswer.includes(abbr)) && userAnswer.includes(full)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Check for plural variations
 * @param {string} userAnswer - User's answer
 * @param {string} correctAnswer - Correct answer
 * @returns {boolean} Whether plural variation matches
 */
function checkPlurals(userAnswer, correctAnswer) {
  // Simple plural check
  if (userAnswer + 's' === correctAnswer || userAnswer === correctAnswer + 's') {
    return true;
  }
  
  // Check for 'es' plurals
  if (userAnswer + 'es' === correctAnswer || userAnswer === correctAnswer + 'es') {
    return true;
  }
  
  // Check for 'ies' plurals (city/cities)
  if (userAnswer.endsWith('y') && correctAnswer === userAnswer.slice(0, -1) + 'ies') {
    return true;
  }
  if (correctAnswer.endsWith('y') && userAnswer === correctAnswer.slice(0, -1) + 'ies') {
    return true;
  }
  
  return false;
}

/**
 * Check for potentially harmful script tags
 * @param {string} input - Input to check
 * @returns {boolean} Whether input contains script tags
 */
function containsScriptTags(input) {
  const scriptPattern = /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi;
  return scriptPattern.test(input);
}

/**
 * Validate question data from API
 * @param {Object} question - Question object
 * @returns {{valid: boolean, error?: string}} Validation result
 */
export function validateQuestion(question) {
  if (!question || typeof question !== 'object') {
    return { valid: false, error: 'Invalid question format' };
  }
  
  if (!question.question || typeof question.question !== 'string') {
    return { valid: false, error: 'Question text is missing' };
  }
  
  if (!question.answer || typeof question.answer !== 'string') {
    return { valid: false, error: 'Answer is missing' };
  }
  
  if (question.question.length > RULES.MAX_QUESTION_LENGTH) {
    return { valid: false, error: 'Question is too long' };
  }
  
  if (!question.value || typeof question.value !== 'number' || question.value < 0) {
    return { valid: false, error: 'Invalid question value' };
  }
  
  return { valid: true };
}
