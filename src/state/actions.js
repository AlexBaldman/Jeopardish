/**
 * State Actions
 * 
 * Carmack's principle: "Actions should be descriptive and atomic.
 * Each action does one thing. Compose complex behaviors from simple actions."
 */

// Action Types
export const ACTION_TYPES = {
  // Game Flow
  GAME_START: 'GAME_START',
  GAME_END: 'GAME_END',
  GAME_PAUSE: 'GAME_PAUSE',
  GAME_RESUME: 'GAME_RESUME',
  GAME_RESET: 'GAME_RESET',
  
  // Question Management
  QUESTION_LOAD: 'QUESTION_LOAD',
  QUESTION_DISPLAY: 'QUESTION_DISPLAY',
  QUESTION_ANSWER_REVEAL: 'QUESTION_ANSWER_REVEAL',
  QUESTION_COMPLETE: 'QUESTION_COMPLETE',
  
  // Answer Handling
  ANSWER_SUBMIT: 'ANSWER_SUBMIT',
  ANSWER_CHECK: 'ANSWER_CHECK',
  ANSWER_RESULT: 'ANSWER_RESULT',
  
  // Scoring
  SCORE_UPDATE: 'SCORE_UPDATE',
  STREAK_UPDATE: 'STREAK_UPDATE',
  HIGH_SCORE_UPDATE: 'HIGH_SCORE_UPDATE',
  
  // User Actions
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  USER_UPDATE_PROFILE: 'USER_UPDATE_PROFILE',
  
  // UI State
  UI_MODAL_OPEN: 'UI_MODAL_OPEN',
  UI_MODAL_CLOSE: 'UI_MODAL_CLOSE',
  UI_THEME_CHANGE: 'UI_THEME_CHANGE',
  UI_LANGUAGE_CHANGE: 'UI_LANGUAGE_CHANGE',
  UI_LOADING_START: 'UI_LOADING_START',
  UI_LOADING_END: 'UI_LOADING_END',
  
  // Settings
  SETTINGS_UPDATE: 'SETTINGS_UPDATE',
  SETTINGS_RESET: 'SETTINGS_RESET',
  
  // Errors
  ERROR_SET: 'ERROR_SET',
  ERROR_CLEAR: 'ERROR_CLEAR',
  
  // Statistics
  STATS_UPDATE: 'STATS_UPDATE',
  STATS_ACHIEVEMENT_UNLOCK: 'STATS_ACHIEVEMENT_UNLOCK'
};

/**
 * Action Creators
 * Functions that create action objects
 */

// Game Flow Actions
export const gameActions = {
  start: (sessionId) => ({
    type: ACTION_TYPES.GAME_START,
    payload: { sessionId, startTime: Date.now() }
  }),
  
  end: (stats) => ({
    type: ACTION_TYPES.GAME_END,
    payload: { stats, endTime: Date.now() }
  }),
  
  pause: () => ({
    type: ACTION_TYPES.GAME_PAUSE,
    payload: { pauseTime: Date.now() }
  }),
  
  resume: () => ({
    type: ACTION_TYPES.GAME_RESUME,
    payload: { resumeTime: Date.now() }
  }),
  
  reset: () => ({
    type: ACTION_TYPES.GAME_RESET,
    payload: {}
  })
};

// Question Actions
export const questionActions = {
  load: (question) => ({
    type: ACTION_TYPES.QUESTION_LOAD,
    payload: { question }
  }),
  
  display: (questionId) => ({
    type: ACTION_TYPES.QUESTION_DISPLAY,
    payload: { questionId, displayTime: Date.now() }
  }),
  
  revealAnswer: () => ({
    type: ACTION_TYPES.QUESTION_ANSWER_REVEAL,
    payload: { revealTime: Date.now() }
  }),
  
  complete: (result) => ({
    type: ACTION_TYPES.QUESTION_COMPLETE,
    payload: { result, completeTime: Date.now() }
  })
};

// Answer Actions
export const answerActions = {
  submit: (answer) => ({
    type: ACTION_TYPES.ANSWER_SUBMIT,
    payload: { answer, submitTime: Date.now() }
  }),
  
  check: (answer, correctAnswer) => ({
    type: ACTION_TYPES.ANSWER_CHECK,
    payload: { answer, correctAnswer }
  }),
  
  result: (isCorrect, details) => ({
    type: ACTION_TYPES.ANSWER_RESULT,
    payload: { isCorrect, details }
  })
};

// Score Actions
export const scoreActions = {
  update: (points, reason) => ({
    type: ACTION_TYPES.SCORE_UPDATE,
    payload: { points, reason, timestamp: Date.now() }
  }),
  
  updateStreak: (streak, isCorrect) => ({
    type: ACTION_TYPES.STREAK_UPDATE,
    payload: { streak, isCorrect }
  }),
  
  updateHighScore: (score) => ({
    type: ACTION_TYPES.HIGH_SCORE_UPDATE,
    payload: { score, achievedAt: Date.now() }
  })
};

// User Actions
export const userActions = {
  login: (user) => ({
    type: ACTION_TYPES.USER_LOGIN,
    payload: { user, loginTime: Date.now() }
  }),
  
  logout: () => ({
    type: ACTION_TYPES.USER_LOGOUT,
    payload: { logoutTime: Date.now() }
  }),
  
  updateProfile: (updates) => ({
    type: ACTION_TYPES.USER_UPDATE_PROFILE,
    payload: { updates }
  })
};

// UI Actions
export const uiActions = {
  openModal: (modalId) => ({
    type: ACTION_TYPES.UI_MODAL_OPEN,
    payload: { modalId }
  }),
  
  closeModal: (modalId) => ({
    type: ACTION_TYPES.UI_MODAL_CLOSE,
    payload: { modalId }
  }),
  
  changeTheme: (theme) => ({
    type: ACTION_TYPES.UI_THEME_CHANGE,
    payload: { theme }
  }),
  
  changeLanguage: (language) => ({
    type: ACTION_TYPES.UI_LANGUAGE_CHANGE,
    payload: { language }
  }),
  
  startLoading: (loadingId) => ({
    type: ACTION_TYPES.UI_LOADING_START,
    payload: { loadingId }
  }),
  
  endLoading: (loadingId) => ({
    type: ACTION_TYPES.UI_LOADING_END,
    payload: { loadingId }
  })
};

// Settings Actions
export const settingsActions = {
  update: (settings) => ({
    type: ACTION_TYPES.SETTINGS_UPDATE,
    payload: { settings }
  }),
  
  reset: () => ({
    type: ACTION_TYPES.SETTINGS_RESET,
    payload: {}
  })
};

// Error Actions
export const errorActions = {
  set: (error, context) => ({
    type: ACTION_TYPES.ERROR_SET,
    payload: { 
      error: error.message || error, 
      context,
      timestamp: Date.now()
    }
  }),
  
  clear: () => ({
    type: ACTION_TYPES.ERROR_CLEAR,
    payload: {}
  })
};

// Statistics Actions
export const statsActions = {
  update: (stats) => ({
    type: ACTION_TYPES.STATS_UPDATE,
    payload: { stats }
  }),
  
  unlockAchievement: (achievementId) => ({
    type: ACTION_TYPES.STATS_ACHIEVEMENT_UNLOCK,
    payload: { 
      achievementId, 
      unlockedAt: Date.now() 
    }
  })
};

/**
 * Batch Actions
 * For complex operations that require multiple state changes
 */
export const batchActions = {
  /**
   * Handle correct answer
   */
  correctAnswer: (question, answer, score, streak) => [
    answerActions.result(true, { question, answer }),
    scoreActions.update(score, 'correct_answer'),
    scoreActions.updateStreak(streak, true),
    questionActions.complete({ correct: true })
  ],
  
  /**
   * Handle incorrect answer
   */
  incorrectAnswer: (question, answer, correctAnswer) => [
    answerActions.result(false, { question, answer, correctAnswer }),
    scoreActions.updateStreak(0, false),
    questionActions.complete({ correct: false })
  ],
  
  /**
   * Start new round
   */
  newRound: (question) => [
    questionActions.load(question),
    questionActions.display(question.id),
    uiActions.endLoading('question')
  ],
  
  /**
   * End game session
   */
  endSession: (finalScore, stats) => [
    gameActions.end(stats),
    statsActions.update(stats),
    finalScore.isHighScore && scoreActions.updateHighScore(finalScore.score)
  ].filter(Boolean)
};

/**
 * Action Validator Middleware
 * Ensures actions have required fields
 */
export function createActionValidator() {
  return (store, action) => {
    if (!action.type) {
      console.error('Action missing type:', action);
      return false;
    }
    
    if (!Object.values(ACTION_TYPES).includes(action.type)) {
      console.warn('Unknown action type:', action.type);
    }
    
    return true;
  };
}

/**
 * Action Logger Middleware
 * Logs all actions for debugging
 */
export function createActionLogger() {
  return (store, action) => {
    console.group(`🎬 Action: ${action.type}`);
    console.log('Payload:', action.payload);
    console.log('Time:', new Date(action.timestamp).toLocaleTimeString());
    console.groupEnd();
    return true;
  };
}
