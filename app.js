'use strict';

import { cleanAnswer, compareAnswersDetailed, parseClueValue } from './game-logic.js';
import { createSession, calculateAccuracy, recordAnswer, getCategoryStreak, getAllBadges, getCategoryBadgeCount, getDailySeed } from './game-session.js';
import { QuestionBank } from './question-bank.js';
import { bindDom, setTicker, setControlsEnabled, setStatus, renderStats, renderMode, renderClue, renderResult, showAnswer, toggleMenu, renderBadges, renderHeatmap } from './view.js';
import { DateSpinner } from './date-spinner.js';
import { SoundManager } from './sound-manager.js';
import { CategoryTracker } from './category-tracker.js';
import { CategorySpinner } from './category-spinner.js';
import { getHostEra, getHostDescription } from './host-eras.js';
import { seededRandom } from './utils.js';

const STORAGE_KEY = 'jeopardish.session.v2';

const fallbackClues = [
  {
    id: 'fallback-1',
    category: 'TECHNICAL DIFFICULTIES',
    question: "This describes the moment a game can't load its question bank.",
    answer: 'a loading error',
    value: '$100',
  },
  {
    id: 'fallback-2',
    category: 'SOFTWARE SNAFUS',
    question: 'This phrase is often said when a demo breaks in front of another person.',
    answer: 'it worked on my machine',
    value: '$200',
  },
];

const state = {
  session: null,
  currentClue: null,
  currentClueValue: 100,
  answerRevealed: false,
  questionBank: null,
  dateSpinner: null,
  categorySpinner: null,
  selectedDate: null,
  currentCategory: null,
  categoryClues: [],
  categoryIndex: 0,
  dailyQuestions: [],
  dailyIndex: 0,
  dailySeed: null,
  soundManager: null,
  lightningTimer: null,
  lightningTimeLeft: 60,
  lightningStartTime: null,
  currentClueStartTime: null,
  categoryTracker: null,
  rouletteQuestions: [],
  rouletteIndex: 0,
  rouletteMultiplier: 2,
  cachedTimerElements: null,
};

const dom = bindDom();

function loadSavedSession() {
  try {
    return JSON.parse(globalThis.localStorage?.getItem(STORAGE_KEY) || '{}');
  } catch (error) {
    console.warn('Unable to read saved session.', error);
    return {};
  }
}

function persistSession() {
  try {
    globalThis.localStorage?.setItem(STORAGE_KEY, JSON.stringify({
      bestStreak: state.session.bestStreak,
      highScore: state.session.highScore,
      missedClueIds: state.session.missedClueIds,
      categoryBestStreaks: Object.fromEntries(state.session.categoryBestStreaks),
      badges: state.session.badges,
    }));
  } catch (error) {
    console.warn('Unable to persist session.', error);
  }
}

function updateStats() {
  renderStats(dom, state.session, calculateAccuracy(state.session));
  renderBadges(dom, getAllBadges(state.session));
  renderHeatmap(dom, state.categoryTracker.getHeatmapData());
}

function explainResult(match) {
  if (match.reason === 'exact') return 'Exact match.';
  if (match.reason === 'fuzzy') return 'Accepted with a small typo allowance.';
  if (match.reason === 'empty') return 'Type a response before checking.';
  return 'Not close enough for the judges.';
}

async function getNextClue() {
  if (state.session.mode === 'review') {
    const reviewClue = state.questionBank.getRandomLoadedQuestion(state.session.missedClueIds);
    if (reviewClue) return reviewClue;

    setTicker(dom, 'review', 'No loaded review misses yet. Quick Play is back on.');
    state.session.mode = 'quick';
    renderMode(dom, state.session.mode);
  }

  if (state.session.mode === 'category-run' || state.session.mode === 'episode-run') {
    if (state.categoryIndex < state.categoryClues.length) {
      return state.categoryClues[state.categoryIndex];
    }
    state.session.mode = 'quick';
    renderMode(dom, 'quick');
  }

  if (state.session.mode === 'daily') {
    if (state.dailyIndex < state.dailyQuestions.length) {
      return state.dailyQuestions[state.dailyIndex];
    }
    state.session.mode = 'quick';
    renderMode(dom, 'quick');
  }

  return state.questionBank.getRandomQuestion() || fallbackClues[0];
}

async function renderNewClue() {
  const clue = await getNextClue();
  state.currentClue = clue;
  state.currentClueValue = parseClueValue(clue.value, 100);
  state.answerRevealed = false;
  state.session.lastClueId = clue.id;
  state.currentClueStartTime = Date.now();

  renderClue(dom, clue, state.currentClueValue, state.session.mode);
  updateStats();
  state.questionBank.warmNextShard();
}

function checkAnswer(event) {
  event?.preventDefault();

  if (!state.currentClue) {
    setStatus(dom, 'Load a clue first.');
    return;
  }

  const match = compareAnswersDetailed(dom.userInput.value, state.currentClue.answer);

  if (match.reason === 'empty') {
    setStatus(dom, explainResult(match));
    return;
  }

  const recorded = recordAnswer(state.session, {
    clueId: state.currentClue.id,
    clueValue: state.currentClueValue,
    category: state.currentClue.category,
    isCorrect: match.isCorrect,
    peekUsed: state.answerRevealed,
  });

  state.categoryTracker.recordAnswer(state.currentClue.category, match.isCorrect);

  if (state.session.mode === 'lightning' && match.isCorrect && !state.answerRevealed) {
    const timeSpent = (Date.now() - state.currentClueStartTime) / 1000;
    const bonus = calculateLightningBonus(timeSpent);
    state.session.score += bonus;
    recorded.delta += bonus;
  }

  state.session = recorded.session;
  persistSession();
  updateStats();
  showAnswer(dom, true);
  renderResult(dom, {
    isCorrect: match.isCorrect,
    peekUsed: state.answerRevealed,
  });

  if (match.isCorrect) {
    const scoreText = recorded.delta > 0 ? `+$${recorded.delta}.` : 'No points after reveal.';
    const categoryStreak = getCategoryStreak(state.session, state.currentClue.category);
    const newBadges = recorded.newBadges || 0;
    
    let statusMsg = `Correct. ${scoreText} ${explainResult(match)}`;
    if (categoryStreak >= 3) {
      statusMsg += ` ${state.currentClue.category} streak: ${categoryStreak}!`;
    }
    if (newBadges > 0) {
      statusMsg += ` 🎉 Badge earned!`;
    }
    setStatus(dom, statusMsg);
    
    state.soundManager?.playCorrect();
    
    if (newBadges > 0) {
      state.soundManager?.playBadgeEarned();
      showBadgeNotification(state.session);
    }
    
    setTicker(dom, state.session.currentStreak >= 3 ? 'streak' : 'correct');
  } else {
    setStatus(dom, `Incorrect. ${explainResult(match)} Saved for review.`);
    state.soundManager?.playIncorrect();
    setTicker(dom, 'incorrect');
  }

  if (state.session.mode === 'category-run' || state.session.mode === 'episode-run') {
    state.categoryIndex += 1;
    setTimeout(() => renderCategoryClue(), 1500);
  } else if (state.session.mode === 'daily') {
    state.dailyIndex += 1;
    setTimeout(() => renderDailyClue(), 1500);
  } else if (state.session.mode === 'roulette') {
    if (!match.isCorrect) {
      setTimeout(() => endRouletteRound(), 1500);
    } else {
      state.rouletteIndex += 1;
      setTimeout(() => renderRouletteClue(), 1500);
    }
  } else if (state.session.mode === 'lightning') {
    setTimeout(() => renderNewClue(), 1500);
  } else {
    state.currentClue = null;
  }

  dom.checkButton.disabled = true;
  dom.answerButton.disabled = true;
  dom.userInput.value = '';
}

function toggleAnswer() {
  if (!state.currentClue) return;

  state.answerRevealed = !state.answerRevealed;
  showAnswer(dom, state.answerRevealed);
  dom.clueCard.classList.toggle('peeked', state.answerRevealed);

  if (state.answerRevealed) {
    setStatus(dom, 'Answer revealed. You can still answer for practice, but not for points.');
    setTicker(dom, 'peek');
  } else {
    setStatus(dom, 'Answer hidden.');
  }
}

async function setMode(mode) {
  state.session.mode = mode;
  renderMode(dom, mode);
  setTicker(dom, mode === 'review' ? 'review' : mode === 'date-spin' ? 'date-spin' : mode === 'daily' ? 'daily' : mode === 'lightning' ? 'lightning' : mode === 'roulette' ? 'roulette' : 'welcome');

  if (mode === 'review' && state.session.missedClueIds.length > 0) {
    setStatus(dom, 'Loading your review clues...');
    await state.questionBank.ensureQuestions(state.session.missedClueIds);
  }

  if (mode === 'date-spin') {
    showDateSpinner();
  } else if (mode === 'daily') {
    await startDailyChallenge();
  } else if (mode === 'lightning') {
    await startLightningRound();
  } else if (mode === 'roulette') {
    await startCategoryRoulette();
  } else {
    hideDateSpinner();
    hideCategorySpinner();
    stopLightningTimer();
    await renderNewClue();
  }
}

async function resetRun() {
  const saved = {
    bestStreak: state.session.bestStreak,
    highScore: state.session.highScore,
    missedClueIds: state.session.missedClueIds,
  };
  state.session = createSession(saved);
  persistSession();
  updateStats();
  setTicker(dom, 'welcome', 'Run reset. The archive kept your highs and misses.');
  await renderNewClue();
}

async function loadQuestions() {
  state.questionBank = new QuestionBank();
  state.soundManager = new SoundManager();
  state.categoryTracker = new CategoryTracker();

  try {
    setControlsEnabled(dom, false);
    setStatus(dom, 'Loading starter pack...');
    const summary = await state.questionBank.init();

    setTicker(
      dom,
      'welcome',
      `Starter pack loaded. ${summary.totalQuestions.toLocaleString()} clues are available through ${summary.shardCount} shards.`,
    );
    await renderNewClue();
  } catch (error) {
    console.error('Error loading question bank:', error);
    state.questionBank.addQuestions(fallbackClues);
    setTicker(dom, 'welcome', 'Question bank missed the bus, so the emergency clues are on stage.');
    await renderNewClue();
  }

  state.dateSpinner = new DateSpinner({
    minYear: 1984,
    maxYear: new Date().getFullYear(),
    onSpinComplete: handleDateSpinComplete,
    onSpinStart: () => state.soundManager?.playWheelSpin(),
    onSpinStop: () => state.soundManager?.playWheelStop(),
  });
  state.dateSpinner.init('dateSpinner');

  state.categorySpinner = new CategorySpinner({
    onSpinComplete: handleCategorySpinComplete,
    onSpinStart: () => state.soundManager?.playWheelSpin(),
    onSpinStop: () => state.soundManager?.playWheelStop(),
  });
  state.categorySpinner.init('categorySpinner');
}

function showDateSpinner() {
  dom.dateSpinner.hidden = false;
  dom.clueCard.hidden = true;
  setControlsEnabled(dom, false);
  setStatus(dom, 'Spin the wheels to select a Jeopardy episode date!');
}

function hideDateSpinner() {
  dom.dateSpinner.hidden = true;
  dom.clueCard.hidden = false;
  setControlsEnabled(dom, true);
  
  // Reset era styling when leaving date-spin mode
  document.body.classList.remove('host-era-80s', 'host-era-90s', 'host-era-2000s', 'host-era-2010s', 'host-era-modern');
  if (dom.hostImage) {
    dom.hostImage.classList.remove('era-80s', 'era-90s', 'era-2000s', 'era-2010s', 'era-modern');
    dom.hostImage.alt = 'Host';
  }
}

function showCategorySpinner() {
  dom.categorySpinner.hidden = false;
  dom.clueCard.hidden = true;
  setControlsEnabled(dom, false);
  setStatus(dom, 'Spin the wheel to select a category for your 5-question challenge!');
}

function hideCategorySpinner() {
  dom.categorySpinner.hidden = true;
  dom.clueCard.hidden = false;
  setControlsEnabled(dom, true);
}

async function handleDateSpinComplete(date) {
  state.selectedDate = date;
  const dateStr = `${date.year}-${String(date.month).padStart(2, '0')}-${String(date.day).padStart(2, '0')}`;
  
  const era = getHostEra(date.year);
  setStatus(dom, `${getHostDescription(date.year)} Loading questions from ${dateStr}...`);
  
  const questions = state.questionBank.getQuestionsByDate(date.year, date.month, date.day);
  
  if (questions.length === 0) {
    setStatus(dom, `No questions found for ${dateStr}. Try another spin!`);
    setTicker(dom, 'welcome', 'No questions for that date. Spin again!');
    return;
  }

  const categories = state.questionBank.getCategoriesForDate(date.year, date.month, date.day);
  
  if (categories.length === 0) {
    setStatus(dom, `No categories found for ${dateStr}. Try another spin!`);
    return;
  }

  setStatus(dom, `${getHostDescription(date.year)} Found ${questions.length} questions from ${categories.length} categories!`);
  setTicker(dom, 'date-spin', `Spin complete! ${categories.length} categories available. Host is ${era.outfit}!`);
  
  showCategorySelection(categories, questions);
  updateHostEraStyling(era);
}

function showCategorySelection(categories, questions) {
  const categorySelect = document.createElement('div');
  categorySelect.className = 'category-selection';
  
  categorySelect.innerHTML = `
    <h3>Select a Category</h3>
    <div class="category-list">
      ${categories.map(cat => `
        <button class="category-button" data-category="${cat}">
          ${cat} (${questions.filter(q => q.category === cat).length} clues)
        </button>
      `).join('')}
    </div>
    <button class="play-episode-button">Play All from Episode</button>
  `;

  dom.dateSpinner.innerHTML = '';
  dom.dateSpinner.appendChild(categorySelect);

  // Use event delegation instead of individual listeners
  categorySelect.addEventListener('click', (e) => {
    if (e.target.classList.contains('category-button')) {
      const category = e.target.dataset.category;
      startCategoryRun(category, questions.filter(q => q.category === category));
    } else if (e.target.classList.contains('play-episode-button')) {
      startEpisodeRun(questions);
    }
  });
}

function updateHostEraStyling(era) {
  if (!dom.hostImage) return;
  
  // Remove all era classes from host
  dom.hostImage.classList.remove('era-80s', 'era-90s', 'era-2000s', 'era-2010s', 'era-modern');
  
  // Add current era class to host
  dom.hostImage.classList.add(`era-${era.era}`);
  
  // Remove all era classes from body
  document.body.classList.remove('host-era-80s', 'host-era-90s', 'host-era-2000s', 'host-era-2010s', 'host-era-modern');
  
  // Add current era class to body for theme-wide styling
  document.body.classList.add(`host-era-${era.era}`);
  
  // Update host image alt text with era info
  dom.hostImage.alt = `Host from ${era.decade} - ${era.outfit}`;
  
  // You could also update the host image source if you have era-specific images
  // dom.hostImage.src = `assets/images/host-${era.era}.png`;
}

function startCategoryRun(category, categoryQuestions) {
  state.currentCategory = category;
  state.categoryClues = categoryQuestions;
  state.categoryIndex = 0;
  
  hideDateSpinner();
  state.session.mode = 'category-run';
  renderCategoryClue();
}

function startEpisodeRun(episodeQuestions) {
  state.categoryClues = episodeQuestions;
  state.categoryIndex = 0;
  state.currentCategory = null;
  
  hideDateSpinner();
  state.session.mode = 'episode-run';
  renderCategoryClue();
}

function renderCategoryClue() {
  if (state.categoryIndex >= state.categoryClues.length) {
    setStatus(dom, `Category ${state.currentCategory || 'episode'} complete!`);
    setTicker(dom, 'welcome', 'Great job! Spin again for another date.');
    state.session.mode = 'quick';
    renderMode(dom, 'quick');
    return;
  }

  const clue = state.categoryClues[state.categoryIndex];
  state.currentClue = clue;
  state.currentClueValue = parseClueValue(clue.value, 100);
  state.answerRevealed = false;
  state.session.lastClueId = clue.id;

  const progress = `${state.categoryIndex + 1}/${state.categoryClues.length}`;
  const categoryStreak = getCategoryStreak(state.session, clue.category);
  setStatus(dom, `${state.currentCategory ? `Category: ${state.currentCategory}` : 'Episode'} - Clue ${progress} (Streak: ${categoryStreak})`);
  
  renderClue(dom, clue, state.currentClueValue, state.session.mode);
  updateStats();
}

async function startDailyChallenge() {
  state.dailySeed = getDailySeed();
  const today = new Date().toLocaleDateString();
  
  setStatus(dom, `Loading Daily Challenge for ${today}...`);
  
  state.dailyQuestions = state.questionBank.getDailyQuestions(state.dailySeed, 5);
  state.dailyIndex = 0;
  
  if (state.dailyQuestions.length === 0) {
    setStatus(dom, 'No questions available for daily challenge. Try Quick Play.');
    state.session.mode = 'quick';
    renderMode(dom, 'quick');
    await renderNewClue();
    return;
  }
  
  hideDateSpinner();
  setTicker(dom, 'daily', `Daily Challenge: ${state.dailyQuestions.length} questions. Same for everyone today!`);
  renderDailyClue();
}

function renderDailyClue() {
  if (state.dailyIndex >= state.dailyQuestions.length) {
    const score = state.session.score;
    const accuracy = calculateAccuracy(state.session);
    setStatus(dom, `Daily Challenge complete! Score: $${score}, Accuracy: ${accuracy}%`);
    setTicker(dom, 'welcome', 'Come back tomorrow for a new challenge!');
    state.session.mode = 'quick';
    renderMode(dom, 'quick');
    return;
  }

  const clue = state.dailyQuestions[state.dailyIndex];
  state.currentClue = clue;
  state.currentClueValue = parseClueValue(clue.value, 100);
  state.answerRevealed = false;
  state.session.lastClueId = clue.id;

  const progress = `${state.dailyIndex + 1}/${state.dailyQuestions.length}`;
  setStatus(dom, `Daily Challenge - Clue ${progress}`);
  
  renderClue(dom, clue, state.currentClueValue, state.session.mode);
  updateStats();
}

function showBadgeNotification(session) {
  const badges = getAllBadges(session);
  if (badges.length === 0) return;
  
  const latestBadge = badges[badges.length - 1];
  const notification = document.createElement('div');
  notification.className = 'badge-notification';
  notification.innerHTML = `
    <div class="badge-notification-content">
      <span class="badge-icon">${latestBadge.icon}</span>
      <div class="badge-text">
        <div class="badge-title">Badge Earned!</div>
        <div class="badge-name">${latestBadge.name}</div>
      </div>
    </div>
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.classList.add('show');
  }, 100);
  
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 500);
  }, 3000);
}

function toggleSound() {
  if (state.soundManager) {
    const enabled = state.soundManager.toggleMute();
    dom.soundToggle.textContent = enabled ? '🔊' : '🔇';
    dom.soundToggle.setAttribute('aria-label', enabled ? 'Sound on' : 'Sound off');
  }
}

async function startLightningRound() {
  state.lightningTimeLeft = 60;
  state.lightningStartTime = Date.now();
  
  // Cache timer DOM elements
  state.cachedTimerElements = {
    display: dom.lightningTimer.querySelector('.timer-display'),
    bar: dom.lightningTimer.querySelector('.timer-bar'),
  };
  
  hideDateSpinner();
  dom.lightningTimer.style.display = 'block';
  updateLightningTimer();
  
  setTicker(dom, 'lightning', '⚡ 60 seconds of rapid-fire trivia! Points scale with speed!');
  
  startLightningTimer();
  await renderNewClue();
}

function startLightningTimer() {
  stopLightningTimer();
  
  state.lightningTimer = setInterval(() => {
    state.lightningTimeLeft -= 1;
    updateLightningTimer();
    
    if (state.lightningTimeLeft <= 0) {
      endLightningRound();
    }
  }, 1000);
}

function stopLightningTimer() {
  if (state.lightningTimer) {
    clearInterval(state.lightningTimer);
    state.lightningTimer = null;
  }
  dom.lightningTimer.style.display = 'none';
  state.cachedTimerElements = null;
}

function updateLightningTimer() {
  const timerDisplay = state.cachedTimerElements?.display || dom.lightningTimer.querySelector('.timer-display');
  const timerBar = state.cachedTimerElements?.bar || dom.lightningTimer.querySelector('.timer-bar');
  
  if (timerDisplay) {
    timerDisplay.textContent = state.lightningTimeLeft;
  }
  
  if (timerBar) {
    const percentage = (state.lightningTimeLeft / 60) * 100;
    timerBar.style.width = `${percentage}%`;
    
    if (state.lightningTimeLeft <= 10) {
      timerBar.style.background = '#e94560';
    } else if (state.lightningTimeLeft <= 30) {
      timerBar.style.background = '#f39c12';
    } else {
      timerBar.style.background = '#2ecc71';
    }
  }
}

function endLightningRound() {
  stopLightningTimer();
  
  const score = state.session.score;
  const accuracy = calculateAccuracy(state.session);
  const questionsAnswered = state.session.totalAnswered;
  
  setStatus(dom, `⚡ Lightning Round complete! Score: $${score}, Accuracy: ${accuracy}%, ${questionsAnswered} questions`);
  setTicker(dom, 'welcome', 'Great job! Try again to beat your score.');
  
  state.session.mode = 'quick';
  renderMode(dom, 'quick');
  
  const saved = {
    bestStreak: state.session.bestStreak,
    highScore: Math.max(state.session.highScore, score),
    missedClueIds: state.session.missedClueIds,
    categoryBestStreaks: Object.fromEntries(state.session.categoryBestStreaks),
    badges: state.session.badges,
  };
  state.session = createSession(saved);
  persistSession();
  updateStats();
}

function calculateLightningBonus(timeSpentSeconds) {
  if (timeSpentSeconds <= 3) return 50;
  if (timeSpentSeconds <= 5) return 25;
  if (timeSpentSeconds <= 8) return 10;
  return 0;
}

async function startCategoryRoulette() {
  const categories = state.questionBank.getAvailableCategories();
  
  if (categories.length < 5) {
    setStatus(dom, 'Not enough categories available for roulette. Try Quick Play.');
    state.session.mode = 'quick';
    renderMode(dom, 'quick');
    await renderNewClue();
    return;
  }

  const shuffledCategories = categories.sort(() => Math.random() - 0.5).slice(0, 8);
  state.categorySpinner.setCategories(shuffledCategories);
  
  hideDateSpinner();
  showCategorySpinner();
  setTicker(dom, 'roulette', '🎲 Category Roulette: Spin to pick a category, then answer 5 questions for 2x points!');
}

function handleCategorySpinComplete(category) {
  setStatus(dom, `Category selected: ${category}. Loading 5 questions...`);
  
  const categoryQuestions = state.questionBank.getQuestionsByCategory(category);
  state.rouletteQuestions = categoryQuestions.slice(0, 5);
  state.rouletteIndex = 0;
  state.currentCategory = category;
  
  if (state.rouletteQuestions.length === 0) {
    setStatus(dom, 'No questions available for this category. Try again.');
    showCategorySpinner();
    return;
  }
  
  hideCategorySpinner();
  state.categorySpinner.reset();
  renderRouletteClue();
}

function renderRouletteClue() {
  if (state.rouletteIndex >= state.rouletteQuestions.length) {
    endRouletteRound();
    return;
  }

  const clue = state.rouletteQuestions[state.rouletteIndex];
  state.currentClue = clue;
  state.currentClueValue = parseClueValue(clue.value, 100) * state.rouletteMultiplier;
  state.answerRevealed = false;
  state.session.lastClueId = clue.id;
  state.currentClueStartTime = Date.now();

  const progress = `${state.rouletteIndex + 1}/${state.rouletteQuestions.length}`;
  setStatus(dom, `🎲 ${state.currentCategory} Roulette - Clue ${progress} (2x points!)`);
  
  renderClue(dom, clue, state.currentClueValue, state.session.mode);
  updateStats();
}

function endRouletteRound() {
  const score = state.session.score;
  const accuracy = calculateAccuracy(state.session);
  const questionsAnswered = state.rouletteIndex;
  
  setStatus(dom, `🎲 Roulette complete! Score: $${score}, Accuracy: ${accuracy}%, ${questionsAnswered}/5 questions`);
  setTicker(dom, 'welcome', 'Great job! Spin again for another category challenge.');
  
  state.session.mode = 'quick';
  renderMode(dom, 'quick');
  
  const saved = {
    bestStreak: state.session.bestStreak,
    highScore: Math.max(state.session.highScore, score),
    missedClueIds: state.session.missedClueIds,
    categoryBestStreaks: Object.fromEntries(state.session.categoryBestStreaks),
    badges: state.session.badges,
  };
  state.session = createSession(saved);
  persistSession();
  updateStats();
}

function bindEvents() {
  dom.answerForm.addEventListener('submit', checkAnswer);
  dom.answerButton.addEventListener('click', toggleAnswer);
  dom.questionButton.addEventListener('click', () => renderNewClue());
  dom.resetButton.addEventListener('click', () => resetRun());
  dom.quickModeButton.addEventListener('click', () => setMode('quick'));
  dom.reviewModeButton.addEventListener('click', () => setMode('review'));
  dom.dailyModeButton.addEventListener('click', () => setMode('daily'));
  dom.lightningModeButton.addEventListener('click', () => setMode('lightning'));
  dom.rouletteModeButton.addEventListener('click', () => setMode('roulette'));
  dom.dateSpinModeButton.addEventListener('click', () => setMode('date-spin'));
  dom.menuToggle.addEventListener('click', () => toggleMenu(dom));
  dom.soundToggle.addEventListener('click', toggleSound);
}

document.addEventListener('DOMContentLoaded', async () => {
  state.session = createSession(loadSavedSession());
  bindEvents();
  updateStats();
  renderMode(dom, state.session.mode);
  setTicker(dom, 'welcome');
  
  // Initialize sound manager on first user interaction
  document.addEventListener('click', () => {
    if (state.soundManager && !state.soundManager.audioContext) {
      state.soundManager.init();
    }
  }, { once: true });
  
  await loadQuestions();
});
