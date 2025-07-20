/**
 * State Selectors
 * 
 * Carmack's principle: "Compute once, use everywhere.
 * Memoized selectors prevent redundant calculations."
 */

/**
 * Memoization helper
 * Creates a memoized selector that only recomputes when inputs change
 */
function createSelector(inputSelectors, resultFunc) {
  let lastInputs = [];
  let lastResult;
  
  return (state) => {
    const inputs = inputSelectors.map(selector => selector(state));
    
    // Check if inputs changed
    const inputsChanged = inputs.some((input, index) => {
      return JSON.stringify(input) !== JSON.stringify(lastInputs[index]);
    });
    
    if (inputsChanged || lastResult === undefined) {
      lastInputs = inputs;
      lastResult = resultFunc(...inputs);
    }
    
    return lastResult;
  };
}

/**
 * Base Selectors
 * Direct state accessors
 */

// Game selectors
export const getGameState = (state) => state.game || {};
export const getCurrentQuestion = (state) => getGameState(state).currentQuestion;
export const getGameStatus = (state) => getGameState(state).status || 'idle';
export const getGameSession = (state) => getGameState(state).session || {};
export const isPaused = (state) => getGameState(state).isPaused || false;

// Score selectors
export const getScoreState = (state) => state.score || {};
export const getCurrentScore = (state) => getScoreState(state).current || 0;
export const getHighScore = (state) => getScoreState(state).high || 0;
export const getCurrentStreak = (state) => getScoreState(state).streak || 0;
export const getBestStreak = (state) => getScoreState(state).bestStreak || 0;
export const getScoreHistory = (state) => getScoreState(state).history || [];

// User selectors
export const getUserState = (state) => state.user || {};
export const getCurrentUser = (state) => getUserState(state).current;
export const isAuthenticated = (state) => !!getCurrentUser(state);
export const getUserProfile = (state) => getUserState(state).profile || {};
export const getUserStats = (state) => getUserState(state).stats || {};

// UI selectors
export const getUIState = (state) => state.ui || {};
export const getTheme = (state) => getUIState(state).theme || 'light';
export const getLanguage = (state) => getUIState(state).language || 'en';
export const getOpenModals = (state) => getUIState(state).openModals || [];
export const getLoadingStates = (state) => getUIState(state).loading || {};

// Settings selectors
export const getSettings = (state) => state.settings || {};
export const getSoundEnabled = (state) => getSettings(state).soundEnabled !== false;
export const getDifficulty = (state) => getSettings(state).difficulty || 'medium';
export const getAutoAdvance = (state) => getSettings(state).autoAdvance !== false;

// Error selectors
export const getErrors = (state) => state.errors || [];
export const hasErrors = (state) => getErrors(state).length > 0;
export const getLatestError = (state) => {
  const errors = getErrors(state);
  return errors[errors.length - 1];
};

// Statistics selectors
export const getStatistics = (state) => state.statistics || {};
export const getTotalGames = (state) => getStatistics(state).totalGames || 0;
export const getTotalQuestions = (state) => getStatistics(state).totalQuestions || 0;
export const getCorrectAnswers = (state) => getStatistics(state).correctAnswers || 0;
export const getAchievements = (state) => getStatistics(state).achievements || [];

/**
 * Computed Selectors
 * Derive complex values from state
 */

// Calculate accuracy percentage
export const getAccuracy = createSelector(
  [getTotalQuestions, getCorrectAnswers],
  (total, correct) => {
    if (total === 0) return 0;
    return Math.round((correct / total) * 100);
  }
);

// Calculate average score per question
export const getAverageScore = createSelector(
  [getCurrentScore, getTotalQuestions],
  (score, questions) => {
    if (questions === 0) return 0;
    return Math.round(score / questions);
  }
);

// Check if current score is a new high score
export const isNewHighScore = createSelector(
  [getCurrentScore, getHighScore],
  (current, high) => current > high
);

// Get current question with metadata
export const getCurrentQuestionWithMetadata = createSelector(
  [getCurrentQuestion, getGameSession],
  (question, session) => {
    if (!question) return null;
    
    return {
      ...question,
      timeElapsed: session.roundStartTime 
        ? Date.now() - session.roundStartTime 
        : 0,
      isRevealed: session.answerRevealed || false,
      attemptCount: session.attemptCount || 0
    };
  }
);

// Get loading status for specific operation
export const isLoading = (operation) => createSelector(
  [getLoadingStates],
  (loadingStates) => !!loadingStates[operation]
);

// Check if any loading operation is active
export const isAnyLoading = createSelector(
  [getLoadingStates],
  (loadingStates) => Object.values(loadingStates).some(Boolean)
);

// Get user display name
export const getUserDisplayName = createSelector(
  [getCurrentUser, getUserProfile],
  (user, profile) => {
    if (profile.displayName) return profile.displayName;
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    return 'Anonymous';
  }
);

// Get formatted current score
export const getFormattedScore = createSelector(
  [getCurrentScore],
  (score) => `$${score.toLocaleString()}`
);

// Get achievement progress
export const getAchievementProgress = createSelector(
  [getAchievements],
  (achievements) => {
    const totalAchievements = 20; // Define based on your achievements
    const unlockedCount = achievements.filter(a => a.unlocked).length;
    
    return {
      unlocked: unlockedCount,
      total: totalAchievements,
      percentage: Math.round((unlockedCount / totalAchievements) * 100)
    };
  }
);

// Get next achievement milestone
export const getNextMilestone = createSelector(
  [getCurrentScore, getCurrentStreak, getTotalQuestions],
  (score, streak, questions) => {
    const milestones = [
      { type: 'score', value: 1000, current: score },
      { type: 'score', value: 5000, current: score },
      { type: 'score', value: 10000, current: score },
      { type: 'streak', value: 5, current: streak },
      { type: 'streak', value: 10, current: streak },
      { type: 'questions', value: 50, current: questions },
      { type: 'questions', value: 100, current: questions }
    ];
    
    // Find the next unachieved milestone
    const next = milestones
      .filter(m => m.current < m.value)
      .sort((a, b) => {
        const aProgress = a.current / a.value;
        const bProgress = b.current / b.value;
        return bProgress - aProgress;
      })[0];
    
    if (!next) return null;
    
    return {
      ...next,
      progress: Math.round((next.current / next.value) * 100),
      remaining: next.value - next.current
    };
  }
);

// Get game session summary
export const getSessionSummary = createSelector(
  [getGameSession, getCurrentScore, getCurrentStreak, getTotalQuestions, getCorrectAnswers],
  (session, score, streak, totalQuestions, correctAnswers) => {
    const duration = session.startTime 
      ? Date.now() - session.startTime 
      : 0;
    
    return {
      duration,
      score,
      streak,
      questionsAnswered: totalQuestions,
      correctAnswers,
      accuracy: totalQuestions > 0 
        ? Math.round((correctAnswers / totalQuestions) * 100) 
        : 0,
      averageResponseTime: session.averageResponseTime || 0
    };
  }
);

// Check if modal is open
export const isModalOpen = (modalId) => createSelector(
  [getOpenModals],
  (openModals) => openModals.includes(modalId)
);

// Get difficulty settings
export const getDifficultySettings = createSelector(
  [getDifficulty],
  (difficulty) => {
    const settings = {
      easy: { timeLimit: 45, hintEnabled: true, peekTokens: 5 },
      medium: { timeLimit: 30, hintEnabled: false, peekTokens: 3 },
      hard: { timeLimit: 20, hintEnabled: false, peekTokens: 1 }
    };
    
    return settings[difficulty] || settings.medium;
  }
);

// Get leaderboard position
export const getLeaderboardPosition = createSelector(
  [getCurrentScore, getHighScore],
  (current, high) => {
    // This would normally check against other players
    // For now, just compare with personal best
    if (current >= high) return 1;
    return null;
  }
);

/**
 * Selector Factory
 * Creates parameterized selectors
 */
export const createParameterizedSelector = (paramFunc) => {
  const cache = new Map();
  
  return (...params) => {
    const key = JSON.stringify(params);
    
    if (!cache.has(key)) {
      cache.set(key, paramFunc(...params));
    }
    
    return cache.get(key);
  };
};

// Example: Get specific achievement status
export const getAchievementStatus = createParameterizedSelector((achievementId) =>
  createSelector(
    [getAchievements],
    (achievements) => achievements.find(a => a.id === achievementId) || { unlocked: false }
  )
);

/**
 * Debug Selectors
 * For development and debugging
 */
export const getStateSnapshot = (state) => {
  return {
    game: getGameState(state),
    score: getScoreState(state),
    user: getUserState(state),
    ui: getUIState(state),
    settings: getSettings(state),
    errors: getErrors(state),
    statistics: getStatistics(state)
  };
};

export const getPerformanceMetrics = createSelector(
  [getGameSession, getTotalQuestions],
  (session, questions) => {
    return {
      averageResponseTime: session.averageResponseTime || 0,
      questionsPerMinute: session.startTime 
        ? (questions / ((Date.now() - session.startTime) / 60000)) 
        : 0,
      sessionDuration: session.startTime 
        ? Date.now() - session.startTime 
        : 0
    };
  }
);

/**
 * Grouped selectors for easier imports
 */
export const selectors = {
  // Game selectors
  game: {
    getState: getGameState,
    getCurrentQuestion: getCurrentQuestion,
    getStatus: getGameStatus,
    getSession: getGameSession,
    isPaused: isPaused,
    hasCurrentQuestion: (state) => !!getCurrentQuestion(state),
    isShowingAnswer: (state) => getGameSession(state).answerRevealed || false,
    getPhase: (state) => getGameStatus(state)
  },
  
  // Score selectors
  score: {
    getCurrent: getCurrentScore,
    getHigh: getHighScore,
    getCurrentStreak: getCurrentStreak,
    getBestStreak: getBestStreak,
    getHistory: getScoreHistory,
    getFormatted: getFormattedScore
  },
  
  // User selectors
  user: {
    getCurrent: getCurrentUser,
    isAuthenticated: isAuthenticated,
    getProfile: getUserProfile,
    getStats: getUserStats,
    getDisplayName: getUserDisplayName
  },
  
  // UI selectors
  ui: {
    getState: getUIState,
    getTheme: getTheme,
    getLanguage: getLanguage,
    getOpenModals: getOpenModals,
    getLoadingStates: getLoadingStates,
    isLoading: (state) => isAnyLoading(state),
    isModalOpen: isModalOpen
  },
  
  // Settings selectors
  settings: {
    getAll: getSettings,
    getSoundEnabled: getSoundEnabled,
    getDifficulty: getDifficulty,
    getAutoAdvance: getAutoAdvance,
    getDifficultySettings: getDifficultySettings
  },
  
  // Statistics selectors
  statistics: {
    getTotalGames: getTotalGames,
    getTotalQuestions: getTotalQuestions,
    getCorrectAnswers: getCorrectAnswers,
    getAchievements: getAchievements,
    getAccuracy: getAccuracy,
    getAverageScore: getAverageScore,
    getAchievementProgress: getAchievementProgress,
    getNextMilestone: getNextMilestone
  },
  
  // Error selectors
  errors: {
    getAll: getErrors,
    hasErrors: hasErrors,
    getLatest: getLatestError
  }
};
