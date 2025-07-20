/**
 * Question Service Module
 * Handles fetching questions from API and local storage
 * 
 * Now prioritizes local questions for reliability and performance
 * API calls are optional and used to supplement local data
 */

import { eventBus } from '../../utils/events.js';

// Configuration
const CONFIG = {
  API_URL: 'https://cluebase.lukelav.in/clues/random',
  CHUNK_SIZE: 500,
  USE_API: false, // Disabled by default since API is down
  API_TIMEOUT: 5000, // 5 seconds timeout for API calls
  PRELOAD_ON_INIT: true,
  CACHE_DURATION: 24 * 60 * 60 * 1000 // 24 hours
};

// Local question storage
let allQuestions = [];
let questions = [];
let isInitialized = false;
let lastLoadTime = null;

/**
 * Initialize the question service
 * Pre-loads local questions if configured
 * @returns {Promise<boolean>} Success status
 */
export async function initialize() {
  if (isInitialized) {
    console.log('✅ Question service already initialized');
    return true;
  }

  console.log('🚀 Initializing question service...');
  
  if (CONFIG.PRELOAD_ON_INIT) {
    const success = await loadLocalQuestions();
    if (!success) {
      console.error('❌ Failed to initialize question service');
      return false;
    }
  }
  
  isInitialized = true;
  eventBus.emit('questionService:initialized');
  return true;
}

/**
 * Get available categories from loaded questions
 * @returns {Array<string>} List of unique categories
 */
export function getAvailableCategories() {
  if (!allQuestions.length) {
    return [];
  }
  
  const categories = new Set();
  allQuestions.forEach(q => {
    const category = q.category?.title || q.category || 'General Knowledge';
    categories.add(category);
  });
  
  return Array.from(categories).sort();
}

/**
 * Get all questions from a specific category
 * @param {string} category - Category name
 * @returns {Array<Object>} Questions from the category
 */
export function getQuestionsByCategory(category) {
  if (!allQuestions.length) {
    return [];
  }
  
  return allQuestions
    .filter(q => {
      const qCategory = q.category?.title || q.category || 'General Knowledge';
      return qCategory === category;
    })
    .map(q => normalizeQuestionData(q));
}

/**
 * Get a random category with at least minQuestions
 * @param {number} minQuestions - Minimum number of questions required
 * @returns {Object|null} Category info with name and question count
 */
export function getRandomCategory(minQuestions = 5) {
  const categories = getAvailableCategories();
  const eligibleCategories = [];
  
  for (const category of categories) {
    const questions = getQuestionsByCategory(category);
    if (questions.length >= minQuestions) {
      eligibleCategories.push({
        name: category,
        questionCount: questions.length
      });
    }
  }
  
  if (eligibleCategories.length === 0) {
    return null;
  }
  
  return eligibleCategories[Math.floor(Math.random() * eligibleCategories.length)];
}

/**
 * Get a question (prioritizes local, optionally tries API)
 * @returns {Promise<Object|null>} Question data or null if failed
 */
export async function getQuestion() {
  console.log('🎯 getQuestion() called');
  
  // Ensure we're initialized
  if (!isInitialized) {
    console.log('⚠️ Service not initialized, initializing now...');
    const initSuccess = await initialize();
    if (!initSuccess) {
      console.error('❌ Failed to initialize question service');
      return getErrorJoke();
    }
  }

  console.log(`📊 Current state: ${questions.length} questions in buffer, ${allQuestions.length} total questions`);

  // Try local questions first
  const localQuestion = getNextLocalQuestion();
  if (localQuestion) {
    console.log('✅ Returning question from buffer:', localQuestion.category);
    return localQuestion;
  }

  // Reload local questions if we've run out
  console.log('🔄 Local questions exhausted, reloading...');
  const reloaded = await loadLocalQuestions();
  if (reloaded) {
    const question = getNextLocalQuestion();
    if (question) {
      console.log('✅ Returning question after reload:', question.category);
      return question;
    }
  }

  // Optionally try API as last resort
  if (CONFIG.USE_API) {
    console.log('🌐 Trying API as fallback...');
    const apiQuestion = await fetchQuestionFromAPI();
    if (apiQuestion) {
      console.log('✅ Returning question from API:', apiQuestion.category);
      return apiQuestion;
    }
  }

  // If all else fails, return an error joke
  console.log('😅 All question sources failed, returning error joke');
  const errorJoke = getErrorJoke();
  console.log('🎭 Error joke:', errorJoke);
  return errorJoke;
}

/**
 * Fetch a question from the external API (with timeout)
 * @returns {Promise<Object|null>} Question data or null if failed
 */
async function fetchQuestionFromAPI() {
  if (!CONFIG.USE_API) return null;
  
  console.log('🌐 Attempting to fetch question from API...');
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.API_TIMEOUT);
    
    const response = await fetch(CONFIG.API_URL, {
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ API fetch successful:', data);
    return normalizeQuestionData(data);
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error('❌ API timeout after', CONFIG.API_TIMEOUT, 'ms');
    } else {
      console.error('❌ API Error:', error.message);
    }
    return null;
  }
}

/**
 * Load questions from local JSON files
 * @returns {Promise<boolean>} Success status
 */
async function loadLocalQuestions() {
  console.log('📚 Loading local questions...');
  
  // Check if we need to reload based on cache duration
  if (allQuestions.length > 0 && lastLoadTime && 
      (Date.now() - lastLoadTime) < CONFIG.CACHE_DURATION) {
    console.log('📚 Using cached questions');
    console.log(`📊 Cache stats: ${allQuestions.length} total questions, loaded ${new Date(lastLoadTime).toLocaleTimeString()}`);
    // Just reshuffle and get new chunk
    shuffleArray(allQuestions);
    questions = allQuestions.slice(0, CONFIG.CHUNK_SIZE);
    console.log(`✅ Prepared ${questions.length} questions from cache`);
    return true;
  }
  
  const questionPaths = [
    '/questions/questions.json',
    '/src/questions/questions.json',
    '/public/questions/questions.json',
    './questions/questions.json'
  ];
  
  let data = null;
  let successPath = null;
  
  // Try each path
  for (const path of questionPaths) {
    console.log(`🔍 Trying to fetch questions from: ${path}`);
    try {
      const response = await fetch(path);
      console.log(`📡 Response status for ${path}: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        data = await response.json();
        successPath = path;
        console.log(`✅ Successfully loaded from ${path}`);
        break;
      } else {
        console.log(`❌ Failed to load from ${path}: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.log(`❌ Error fetching from ${path}:`, error.message);
    }
  }
  
  if (!data) {
    console.error('❌ Failed to load questions from any path');
    console.log('📂 Current location:', window.location.href);
    console.log('🔍 Attempted paths:', questionPaths);
    eventBus.emit('questions:error', { error: 'No question file found' });
    return false;
  }
  
  try {
    console.log(`📊 Parsing question data from ${successPath}...`);
    console.log(`📋 Data type: ${typeof data}, Is Array: ${Array.isArray(data)}`);
    
    if (Array.isArray(data)) {
      console.log(`✅ Loaded ${data.length.toLocaleString()} questions from ${successPath}`);
    } else if (data.questions && Array.isArray(data.questions)) {
      console.log('📦 Found questions in data.questions property');
      data = data.questions;
      console.log(`✅ Loaded ${data.length.toLocaleString()} questions from ${successPath}`);
    } else {
      console.error('❌ Invalid data structure:', data);
      throw new Error('Invalid or empty question data');
    }
    
    // Sample first few questions to verify structure
    console.log('🔍 Sample questions:');
    for (let i = 0; i < Math.min(3, data.length); i++) {
      console.log(`  Question ${i + 1}:`, {
        category: data[i].category?.title || data[i].category,
        question: data[i].question?.substring(0, 50) + '...',
        answer: data[i].answer?.substring(0, 30) + '...',
        value: data[i].value
      });
    }
    
    allQuestions = data;
    lastLoadTime = Date.now();
    
    // Emit event for other parts of the app
    eventBus.emit('questions:loaded', { count: data.length });
    console.log(`✅ Question service loaded successfully with ${data.length} questions`);
    
  } catch (error) {
    console.error('❌ Error processing questions:', error);
    console.error('Stack trace:', error.stack);
    eventBus.emit('questions:error', { error: error.message });
    return false;
  }
  
  if (allQuestions.length === 0) {
    console.log('📚 Our local question library seems to be on vacation. Time for some improv!');
    return false;
  }
  
  console.log('🎲 Shuffling questions...');
  shuffleArray(allQuestions);
  questions = allQuestions.slice(0, CONFIG.CHUNK_SIZE);
  console.log(`✅ Prepared ${questions.length} random questions for use`);
  return true;
}

/**
 * Get the next question from the loaded questions
 * @returns {Object|null} Next question or null if none available
 */
function getNextLocalQuestion() {
  if (questions.length === 0) {
    return null;
  }
  
  const question = questions.shift();
  console.log(`📤 Serving question (${questions.length} remaining in buffer)`);
  
  // Preload more questions when running low
  if (questions.length < 50 && allQuestions.length > CONFIG.CHUNK_SIZE) {
    console.log('🔄 Buffer running low, preparing more questions...');
    const startIdx = Math.floor(Math.random() * (allQuestions.length - CONFIG.CHUNK_SIZE));
    const newQuestions = allQuestions.slice(startIdx, startIdx + CONFIG.CHUNK_SIZE);
    shuffleArray(newQuestions);
    questions.push(...newQuestions.slice(0, 100));
  }
  
  return normalizeQuestionData(question);
}

/**
 * Parse CSV format questions
 * @param {string} text - CSV text content
 * @returns {Array} Parsed questions
 */
export function parseCSV(text) {
  const lines = text.split('\n');
  const headers = lines[0].split(',');
  return lines.slice(1).map(line => {
    const values = line.split(',');
    return headers.reduce((obj, header, index) => {
      obj[header.trim()] = values[index]?.trim() || '';
      return obj;
    }, {});
  });
}

/**
 * Normalize question data from various sources
 * @param {Object} question - Raw question data
 * @returns {Object} Normalized question
 */
export function normalizeQuestionData(question) {
  return {
    category: question.category?.title || question.category || 'General Knowledge',
    question: question.question || question.clue || '',
    answer: question.answer || '',
    value: question.value || 200,
    airdate: question.airdate || new Date().toISOString(),
    difficulty: question.difficulty || 'Medium',
    times_used: question.times_used || 1,
    contestant: question.contestant || 'Unknown',
    season: question.season || 'Unknown',
    episode: question.episode || 'Unknown'
  };
}

/**
 * Fisher-Yates shuffle algorithm
 * @param {Array} array - Array to shuffle
 */
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

/**
 * Get error joke questions for when things go wrong
 * @returns {Object} Random error joke question
 */
function getErrorJoke() {
  const jeopardyErrors = [
    {
      category: "TECHNICAL DIFFICULTIES",
      question: "This term describes what happens when your app can't load the local question database.",
      answer: "What is 'a file reading error'?",
      value: "$0"
    },
    {
      category: "OOOPS!",
      question: "This famous line was uttered by every programmer ever when their code didn't work as expected.",
      answer: "What is 'It works on my machine'?",
      value: "$0"
    },
    {
      category: "MYSTERY OF CODING",
      question: "It's the spooky thing that happens when your API call goes into the void and never returns.",
      answer: "What is 'the ghost in the machine'?",
      value: "$0"
    },
    {
      category: "SOFTWARE SNAFUS",
      question: "This phrase is often said when an application stops working right as you show it to someone.",
      answer: "What is 'demo demon'?",
      value: "$0"
    }
  ];
  
  return jeopardyErrors[Math.floor(Math.random() * jeopardyErrors.length)];
}

/**
 * Get service statistics
 * @returns {Object} Statistics about the question service
 */
export function getStats() {
  return {
    isInitialized,
    totalQuestions: allQuestions.length,
    remainingQuestions: questions.length,
    lastLoadTime,
    config: CONFIG
  };
}

/**
 * Update configuration
 * @param {Object} newConfig - Configuration updates
 */
export function updateConfig(newConfig) {
  Object.assign(CONFIG, newConfig);
  console.log('⚙️ Question service config updated:', CONFIG);
}

/**
 * Export public API
 */
export default {
  initialize,
  getQuestion,
  getStats,
  updateConfig,
  normalizeQuestionData,
  parseCSV,
  getAvailableCategories,
  getQuestionsByCategory,
  getRandomCategory
};
