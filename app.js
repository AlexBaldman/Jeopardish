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
  lastClueIndex: -1,
  bestStreak: 0,
};

const BEST_STREAK_KEY = 'jeopardish.bestStreak';

const logic = globalThis.JeopardishLogic || null;
if (!logic) {
  throw new Error('JeopardishLogic failed to load. Ensure game-logic.js is included before app.js.');
}

const contracts = globalThis.JeopardishContracts || null;
const eventBusModule = globalThis.JeopardishEventBus || null;
const engineModule = globalThis.JeopardishEngine || null;
const dataModule = globalThis.JeopardishData || null;
const rendererModule = globalThis.JeopardishRenderer || null;
const narratorModule = globalThis.JeopardishConsoleNarrator || null;
const hostModule = globalThis.JeopardishHost || null;

if (!contracts || !eventBusModule || !engineModule || !dataModule || !rendererModule || !narratorModule || !hostModule) {
  throw new Error('Jeopardish engine modules failed to load. Ensure src modules are included before app.js.');
}

let eventBus;
let gameEngine;
let dataLoader;
let renderer;
let consoleNarrator;
let hostManager;

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

function renderScoreboard() {
  const gameState = gameEngine?.getState() || {
    currentStreak: 0,
    bestStreak: state.bestStreak,
    score: 0,
  };

  renderer.renderScoreboard(gameState);
}

function renderHost(expression = 'neutral') {
  const host = hostManager.getActiveHost();
  renderer.renderHost(host, expression, hostManager.getVisual(expression));
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
    renderer.displayErrorJoke(jeopardyErrors);
    return;
  }

  const gameState = gameEngine.loadClue(clue);
  renderHost('thinking');
  renderer.renderClue(clue, gameState.currentClueValue);
}

function getNewQuestion() {
  renderClue(getRandomQuestion());
}

function checkAnswer() {
  if (!gameEngine.getActiveClue()) {
    if (gameEngine.getState().phase === contracts.GamePhases.REVEALING) {
      getNewQuestion();
      return;
    }

    renderer.displayErrorMessage('No question available yet. Please load one first.');
    return;
  }

  const userAnswer = renderer.getUserAnswer();
  const userAnswerCleaned = logic.cleanAnswer(userAnswer);

  if (!userAnswerCleaned) {
    renderer.displayErrorMessage('Please enter an answer before checking.');
    return;
  }

  const result = gameEngine.submitAnswer(userAnswer);
  if (!result.ok) {
    renderer.displayErrorMessage(result.error.message);
    return;
  }

  if (result.isCorrect) {
    state.bestStreak = result.bestStreak;
    persistBestStreak();
    renderHost('happy');
    renderer.displayCorrectAnswerMessage(result.currentStreak);
    renderer.setStatus(`Correct. +$${result.scoreDelta}. ${hostManager.selectQuip('correct')} Load a new clue to continue your streak.`);
  } else {
    renderHost('sad');
    renderer.displayIncorrectAnswerMessage(result.correctAnswer || 'Unknown');
    renderer.setStatus(`Incorrect. ${hostManager.selectQuip('incorrect')} Load a new clue to continue.`);
  }

  renderer.setControlsEnabled(false);
  renderScoreboard();
  renderer.clearUserAnswer();
}

function showHideAnswer() {
  renderer.toggleAnswer(!renderer.isAnswerVisible());
}

async function loadQuestions() {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), FETCH_TIMEOUT_MS);

  try {
    renderer.showLoading();
    const data = await dataLoader.loadQuestionBank(QUESTION_SOURCE, { signal: abort.signal });

    state.questions = data;
    renderer.setStatus(`Loaded ${data.length.toLocaleString()} clues.`);
    gameEngine.ready();
    getNewQuestion();
  } catch (error) {
    console.error('Error loading questions:', error);
    renderer.displayErrorJoke(jeopardyErrors);
  } finally {
    clearTimeout(timer);
  }
}

function bindEvents() {
  renderer.bindEvents({
    onToggleAnswer: showHideAnswer,
    onNewQuestion: getNewQuestion,
    onCheckAnswer: checkAnswer,
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  loadPersistedBestStreak();
  eventBus = new eventBusModule.EventBus();
  gameEngine = new engineModule.GameEngine({
    eventBus,
    bestStreak: state.bestStreak,
  });
  dataLoader = new dataModule.DataLoader({ eventBus });
  renderer = new rendererModule.Renderer();
  consoleNarrator = new narratorModule.ConsoleNarrator({ eventBus });
  hostManager = new hostModule.HostManager();
  consoleNarrator.start();

  renderer.bindDom();
  renderHost('neutral');
  bindEvents();
  renderer.setControlsEnabled(false);
  renderer.setStatus('Initializing game…');
  renderScoreboard();

  gameEngine.init();
  await loadQuestions();
});
