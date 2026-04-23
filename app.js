'use strict';

const QUESTION_SOURCE = './questions/jeopardy-questions.json';
const FETCH_TIMEOUT_MS = 10000;

const jeopardyErrors = [
  {
    category: 'TECHNICAL DIFFICULTIES',
    question: "This term describes what happens when your app can't load the local question database.",
    answer: "What is 'a file reading error'?",
    value: '$0',
  },
  {
    category: 'OOOPS!',
    question: "This famous line was uttered by every programmer ever when their code didn't work as expected.",
    answer: "What is 'It works on my machine'?",
    value: '$0',
  },
  {
    category: 'MYSTERY OF CODING',
    question: "It's the spooky thing that happens when your API call goes into the void and never returns.",
    answer: "What is 'the ghost in the machine'?",
    value: '$0',
  },
  {
    category: 'SOFTWARE SNAFUS',
    question: 'This phrase is often said when an application stops working right as you show it to someone.',
    answer: "What is 'demo demon'?",
    value: '$0',
  },
];

const state = {
  questions: [],
  currentClue: null,
  currentStreak: 0,
  bestStreak: 0,
  score: 0,
  lastClueIndex: -1,
  currentClueValue: 100,
};

const dom = {};
const BEST_STREAK_KEY = 'jeopardish.bestStreak';

const logic = globalThis.JeopardishLogic || null;
if (!logic) {
  throw new Error('JeopardishLogic failed to load. Ensure game-logic.js is included before app.js.');
}

function setText(el, text) {
  el.textContent = text;
}

function loadPersistedBestStreak() {
  try {
    const value = globalThis.localStorage?.getItem(BEST_STREAK_KEY);
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      state.bestStreak = parsed;
    }
  } catch (error) {
    console.warn('Unable to read persisted best streak.', error);
  }
}

function persistBestStreak() {
  try {
    globalThis.localStorage?.setItem(BEST_STREAK_KEY, String(state.bestStreak));
  } catch (error) {
    console.warn('Unable to persist best streak.', error);
  }
}

function setStatus(message) {
  setText(dom.statusMessage, message || '');
}

function setControlsEnabled(enabled) {
  dom.checkButton.disabled = !enabled;
  dom.answerButton.disabled = !enabled;
}

function setCategory(category, value) {
  dom.categoryBox.textContent = '';

  const categoryLine = document.createElement('strong');
  categoryLine.textContent = category;

  const valueLine = document.createElement('span');
  valueLine.textContent = ` for ${value}`;

  dom.categoryBox.append(categoryLine, valueLine);
}

function toggleAnswer(show) {
  dom.answerBox.style.display = show ? 'flex' : 'none';
}

function renderScoreboard() {
  setText(dom.currentStreak, `Current Streak: ${state.currentStreak}`);
  setText(dom.bestStreak, `Best Streak: ${state.bestStreak}`);
  setText(dom.score, `Score: $${state.score}`);
}

function displayErrorMessage(message) {
  setStatus(message);
  setText(dom.categoryBox, 'Error');
  setText(dom.questionBox, message);
  setText(dom.answerBox, '');
  toggleAnswer(true);
}

function displayErrorJoke() {
  const randomError = jeopardyErrors[Math.floor(Math.random() * jeopardyErrors.length)];
  setStatus('There was a problem loading a normal clue. Showing fallback clue.');
  setCategory(randomError.category, randomError.value);
  setText(dom.questionBox, randomError.question);
  setText(dom.answerBox, randomError.answer);
  toggleAnswer(true);
  setControlsEnabled(true);
}

function getRandomQuestion() {
  if (state.questions.length === 0) return null;

  let idx = Math.floor(Math.random() * state.questions.length);
  if (state.questions.length > 1 && idx === state.lastClueIndex) {
    idx = (idx + 1) % state.questions.length;
  }
  state.lastClueIndex = idx;
  return state.questions[idx] ?? null;
}

function renderClue(clue) {
  if (!clue) {
    displayErrorJoke();
    return;
  }

  state.currentClue = clue;
  state.currentClueValue = logic.parseClueValue(clue.value, 100);
  setCategory(
    String(clue.category || 'Unknown Category').toUpperCase(),
    `$${state.currentClueValue}`,
  );
  setText(dom.questionBox, clue.question || 'No question available.');
  setText(dom.answerBox, clue.answer || 'No answer available.');
  setStatus('New clue loaded. Enter your answer and press Check Answer.');
  toggleAnswer(false);
  setControlsEnabled(true);
  dom.userInput.value = '';
  dom.userInput.focus();
}

function getNewQuestion() {
  renderClue(getRandomQuestion());
}

function displayCorrectAnswerMessage() {
  setText(dom.categoryBox, '');
  setText(dom.questionBox, `Correct! Your streak is now: ${state.currentStreak}`);
  setText(dom.answerBox, `Correct answer streak is now ${state.currentStreak}`);
  toggleAnswer(true);
}

function displayIncorrectAnswerMessage(correctAnswer) {
  setText(dom.categoryBox, '');
  setText(dom.questionBox, `Incorrect! The correct answer was: ${correctAnswer}`);
  setText(dom.answerBox, 'STREAK RESET!');
  setStatus('Incorrect. Load a new clue to continue.');
  toggleAnswer(true);
}

function checkAnswer() {
  if (!state.currentClue) {
    displayErrorMessage('No question available yet. Please load one first.');
    return;
  }

  const userAnswerCleaned = logic.cleanAnswer(dom.userInput.value);
  const correctAnswer = logic.cleanAnswer(state.currentClue.answer || '');

  if (!userAnswerCleaned) {
    displayErrorMessage('Please enter an answer before checking.');
    return;
  }

  if (logic.compareAnswers(userAnswerCleaned, correctAnswer)) {
    state.currentStreak += 1;
    state.score += state.currentClueValue;
    state.bestStreak = Math.max(state.bestStreak, state.currentStreak);
    persistBestStreak();
    displayCorrectAnswerMessage();
    setStatus(`Correct. +$${state.currentClueValue}. Load a new clue to continue your streak.`);
  } else {
    state.currentStreak = 0;
    state.score = 0;
    displayIncorrectAnswerMessage(correctAnswer || 'Unknown');
  }

  state.currentClue = null;
  setControlsEnabled(false);
  renderScoreboard();
  dom.userInput.value = '';
}

function showHideAnswer() {
  toggleAnswer(dom.answerBox.style.display === 'none');
}

async function loadQuestions() {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), FETCH_TIMEOUT_MS);

  try {
    setControlsEnabled(false);
    setStatus('Loading question bank…');
    setText(dom.questionBox, 'Loading questions...');
    const response = await fetch(QUESTION_SOURCE, { signal: abort.signal });
    if (!response.ok) {
      throw new Error(`Failed to load questions: ${response.status}`);
    }

    const data = await response.json();
    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Question dataset is empty or invalid.');
    }

    state.questions = data;
    setStatus(`Loaded ${data.length.toLocaleString()} clues.`);
    getNewQuestion();
  } catch (error) {
    console.error('Error loading questions:', error);
    displayErrorJoke();
  } finally {
    clearTimeout(timer);
  }
}

function bindDom() {
  dom.checkButton = document.getElementById('checkButton');
  dom.answerButton = document.getElementById('answerButton');
  dom.questionButton = document.getElementById('questionButton');
  dom.userInput = document.getElementById('inputbox');
  dom.categoryBox = document.getElementById('categoryBox');
  dom.statusMessage = document.getElementById('statusMessage');
  dom.questionBox = document.getElementById('questionBox');
  dom.answerBox = document.getElementById('answerBox');
  dom.currentStreak = document.getElementById('currentStreak');
  dom.bestStreak = document.getElementById('bestStreak');
  dom.score = document.getElementById('score');
  dom.hamburgerMenu = document.getElementById('hamburgerMenu');
  dom.navMenu = document.getElementById('navMenu');
}

function bindEvents() {
  dom.hamburgerMenu.addEventListener('click', () => {
    dom.navMenu.classList.toggle('active');
  });

  dom.answerButton.addEventListener('click', showHideAnswer);
  dom.questionButton.addEventListener('click', getNewQuestion);
  dom.checkButton.addEventListener('click', checkAnswer);
  dom.userInput.addEventListener('keydown', (event) => {
    if (event.key === 'Enter') {
      checkAnswer();
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  loadPersistedBestStreak();
  bindDom();
  bindEvents();
  setControlsEnabled(false);
  setStatus('Initializing game…');
  renderScoreboard();

  console.log('Welcome to Jeopardish!');
  await loadQuestions();
});
