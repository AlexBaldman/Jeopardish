'use strict';

const QUESTION_SOURCE = './questions/questions.json';
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
};

const dom = {};

const logic = globalThis.JeopardishLogic || null;
if (!logic) {
  throw new Error('JeopardishLogic failed to load. Ensure game-logic.js is included before app.js.');
}

function setText(el, text) {
  el.textContent = text;
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
  setText(dom.categoryBox, 'Error');
  setText(dom.questionBox, message);
  setText(dom.answerBox, '');
  toggleAnswer(true);
}

function displayErrorJoke() {
  const randomError = jeopardyErrors[Math.floor(Math.random() * jeopardyErrors.length)];
  setCategory(randomError.category, randomError.value);
  setText(dom.questionBox, randomError.question);
  setText(dom.answerBox, randomError.answer);
  toggleAnswer(true);
}

function getRandomQuestion() {
  if (state.questions.length === 0) return null;

  const idx = Math.floor(Math.random() * state.questions.length);
  return state.questions[idx] ?? null;
}

function renderClue(clue) {
  if (!clue) {
    displayErrorJoke();
    return;
  }

  state.currentClue = clue;
  setCategory(String(clue.category || 'Unknown Category').toUpperCase(), clue.value || '$0');
  setText(dom.questionBox, clue.question || 'No question available.');
  setText(dom.answerBox, clue.answer || 'No answer available.');
  toggleAnswer(false);
  dom.userInput.value = '';
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
    state.score += 100;
    state.bestStreak = Math.max(state.bestStreak, state.currentStreak);
    displayCorrectAnswerMessage();
  } else {
    state.currentStreak = 0;
    state.score = 0;
    displayIncorrectAnswerMessage(correctAnswer || 'Unknown');
  }

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
  bindDom();
  bindEvents();
  renderScoreboard();

  console.log('Welcome to Jeopardish!');
  await loadQuestions();
});
