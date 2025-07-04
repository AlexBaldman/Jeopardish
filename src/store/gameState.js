/**
 * Game State Management Module
 * Manages all game-related state including scores, streaks, and current question
 */

// Initial game state
const initialState = {
  currentScore: 0,
  currentStreak: 0,
  bestScore: 0,
  bestStreak: 0,
  currentQuestion: null,
  answerWasRevealed: false,
  showingMessage: false,
  peekTokens: 5,
  questions: [],
  currentQuestionIndex: 0,
};

// Create a reactive state object
export const gameState = { ...initialState };

// State update functions
export function updateScore(points) {
  gameState.currentScore += points;
  if (gameState.currentScore > gameState.bestScore) {
    gameState.bestScore = gameState.currentScore;
    saveToLocalStorage('bestScore', gameState.bestScore);
  }
  notifyStateChange('score', { current: gameState.currentScore, best: gameState.bestScore });
}

export function updateStreak(correct) {
  if (correct) {
    gameState.currentStreak++;
    if (gameState.currentStreak > gameState.bestStreak) {
      gameState.bestStreak = gameState.currentStreak;
      saveToLocalStorage('bestStreak', gameState.bestStreak);
    }
  } else {
    gameState.currentStreak = 0;
  }
  notifyStateChange('streak', { current: gameState.currentStreak, best: gameState.bestStreak });
}

export function setCurrentQuestion(question) {
  gameState.currentQuestion = question;
  gameState.answerWasRevealed = false;
  gameState.showingMessage = false;
  notifyStateChange('question', question);
}

export function revealAnswer() {
  gameState.answerWasRevealed = true;
  if (gameState.peekTokens > 0) {
    gameState.peekTokens--;
  }
  notifyStateChange('answerRevealed', true);
}

export function setShowingMessage(showing) {
  gameState.showingMessage = showing;
  notifyStateChange('showingMessage', showing);
}

export function resetGame() {
  gameState.currentScore = 0;
  gameState.currentStreak = 0;
  gameState.currentQuestion = null;
  gameState.answerWasRevealed = false;
  gameState.showingMessage = false;
  gameState.peekTokens = 5;
  notifyStateChange('reset', true);
}

// Load saved state from localStorage
export function loadSavedState() {
  const savedBestScore = storage.getItem('jeopardish_bestScore');
  const savedBestStreak = storage.getItem('jeopardish_bestStreak');
  
  if (savedBestScore) {
    gameState.bestScore = parseInt(savedBestScore, 10);
  }
  if (savedBestStreak) {
    gameState.bestStreak = parseInt(savedBestStreak, 10);
  }
}

// Storage wrapper for easier testing
const storage = {
  getItem: (key) => localStorage.getItem(key),
  setItem: (key, value) => localStorage.setItem(key, value)
};

// Save to localStorage with prefix
function saveToLocalStorage(key, value) {
  storage.setItem(`jeopardish_${key}`, value.toString());
}

// Export for testing
export { storage };

// State change notification system
const stateListeners = new Set();

export function subscribeToState(callback) {
  stateListeners.add(callback);
  return () => stateListeners.delete(callback);
}

function notifyStateChange(property, value) {
  stateListeners.forEach(listener => {
    listener({ property, value, state: gameState });
  });
}

// Note: loadSavedState() should be called by the application during initialization
