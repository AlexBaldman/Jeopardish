/**
 * Question Service Module
 * Handles fetching questions from API and local storage
 */

const API_URL = 'https://cluebase.lukelav.in/clues/random';
const CHUNK_SIZE = 500;

// Local question storage
let allQuestions = [];
let questions = [];

/**
 * Fetch a question from the external API
 * @returns {Promise<Object|null>} Question data or null if failed
 */
export async function fetchQuestionFromAPI() {
  console.log('🌐 Attempting to fetch question from API...');
  try {
    const response = await fetch(API_URL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    console.log('✅ API fetch successful:', data);
    return normalizeQuestionData(data);
  } catch (error) {
    console.error('❌ API Error:', error.message);
    console.log('🎭 Falling back to local questions...');
    return null;
  }
}

/**
 * Load questions from local JSON files
 * @returns {Promise<boolean>} Success status
 */
export async function loadLocalQuestions() {
  console.log('📚 Starting local questions load...');
  
  if (allQuestions.length === 0) {
    try {
      const response = await fetch('/questions/questions.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`✅ Loaded ${data.length} questions from local file`);
      allQuestions = data;
    } catch (error) {
      console.error('❌ Error loading local questions:', error);
      return false;
    }
  }
  
  if (allQuestions.length === 0) {
    console.log('📚 Our local question library seems to be on vacation. Time for some improv!');
    return false;
  }
  
  console.log('🎲 Shuffling questions...');
  shuffleArray(allQuestions);
  questions = allQuestions.slice(0, CHUNK_SIZE);
  console.log(`✅ Prepared ${questions.length} random questions for use`);
  return true;
}

/**
 * Get the next question from the loaded questions
 * @returns {Object|null} Next question or null if none available
 */
export function getNextLocalQuestion() {
  if (questions.length === 0) {
    return null;
  }
  return questions.shift();
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
export function getErrorJoke() {
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
