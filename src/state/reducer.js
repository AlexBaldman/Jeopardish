/**
 * Main Reducer
 * 
 * Carmack's principle: "State transitions should be pure and predictable.
 * Given the same state and action, always produce the same result."
 */

import { ACTION_TYPES } from './actions.js';
import { deepClone } from '../utils/helpers.js';

/**
 * Initial state structure
 */
export const initialState = {
  game: {
    status: 'idle', // idle, loading, playing, paused, ended
    currentQuestion: null,
    session: {
      id: null,
      startTime: null,
      roundStartTime: null,
      answerRevealed: false,
      attemptCount: 0,
      peekTokensUsed: 0
    },
    isPaused: false
  },
  
  score: {
    current: 0,
    high: 0,
    streak: 0,
    bestStreak: 0,
    history: []
  },
  
  user: {
    current: null,
    profile: {
      displayName: null,
      avatar: null
    },
    stats: {
      gamesPlayed: 0,
      totalScore: 0,
      favoriteCategory: null
    }
  },
  
  ui: {
    theme: 'light',
    language: 'en',
    openModals: [],
    loading: {},
    notifications: []
  },
  
  settings: {
    soundEnabled: true,
    difficulty: 'medium',
    autoAdvance: true,
    animationsEnabled: true
  },
  
  statistics: {
    totalGames: 0,
    totalQuestions: 0,
    correctAnswers: 0,
    totalPlayTime: 0,
    achievements: [],
    categoryStats: {}
  },
  
  errors: []
};

/**
 * Root reducer
 * Delegates to sub-reducers for each state slice
 */
export function rootReducer(state = initialState, action) {
  return {
    game: gameReducer(state.game, action),
    score: scoreReducer(state.score, action),
    user: userReducer(state.user, action),
    ui: uiReducer(state.ui, action),
    settings: settingsReducer(state.settings, action),
    statistics: statisticsReducer(state.statistics, action),
    errors: errorReducer(state.errors, action)
  };
}

/**
 * Game reducer
 */
function gameReducer(state = initialState.game, action) {
  switch (action.type) {
    case ACTION_TYPES.GAME_START:
      return {
        ...state,
        status: 'playing',
        session: {
          ...state.session,
          id: action.payload.sessionId,
          startTime: action.payload.startTime,
          peekTokensUsed: 0
        }
      };
    
    case ACTION_TYPES.GAME_END:
      return {
        ...state,
        status: 'ended',
        currentQuestion: null
      };
    
    case ACTION_TYPES.GAME_PAUSE:
      return {
        ...state,
        isPaused: true
      };
    
    case ACTION_TYPES.GAME_RESUME:
      return {
        ...state,
        isPaused: false
      };
    
    case ACTION_TYPES.GAME_RESET:
      return initialState.game;
    
    case ACTION_TYPES.QUESTION_LOAD:
      return {
        ...state,
        status: 'playing',
        currentQuestion: action.payload.question,
        session: {
          ...state.session,
          roundStartTime: Date.now(),
          answerRevealed: false,
          attemptCount: 0
        }
      };
    
    case ACTION_TYPES.QUESTION_ANSWER_REVEAL:
      return {
        ...state,
        session: {
          ...state.session,
          answerRevealed: true,
          peekTokensUsed: state.session.peekTokensUsed + 1
        }
      };
    
    case ACTION_TYPES.ANSWER_SUBMIT:
      return {
        ...state,
        session: {
          ...state.session,
          attemptCount: state.session.attemptCount + 1
        }
      };
    
    default:
      return state;
  }
}

/**
 * Score reducer
 */
function scoreReducer(state = initialState.score, action) {
  switch (action.type) {
    case ACTION_TYPES.SCORE_UPDATE:
      const newScore = Math.max(0, state.current + action.payload.points);
      const newHistory = [...state.history, {
        points: action.payload.points,
        reason: action.payload.reason,
        timestamp: action.payload.timestamp,
        total: newScore
      }];
      
      return {
        ...state,
        current: newScore,
        high: Math.max(newScore, state.high),
        history: newHistory.slice(-100) // Keep last 100 entries
      };
    
    case ACTION_TYPES.STREAK_UPDATE:
      return {
        ...state,
        streak: action.payload.streak,
        bestStreak: Math.max(action.payload.streak, state.bestStreak)
      };
    
    case ACTION_TYPES.HIGH_SCORE_UPDATE:
      return {
        ...state,
        high: action.payload.score
      };
    
    case ACTION_TYPES.GAME_RESET:
      return {
        ...initialState.score,
        high: state.high,
        bestStreak: state.bestStreak
      };
    
    default:
      return state;
  }
}

/**
 * User reducer
 */
function userReducer(state = initialState.user, action) {
  switch (action.type) {
    case ACTION_TYPES.USER_LOGIN:
      return {
        ...state,
        current: action.payload.user
      };
    
    case ACTION_TYPES.USER_LOGOUT:
      return initialState.user;
    
    case ACTION_TYPES.USER_UPDATE_PROFILE:
      return {
        ...state,
        profile: {
          ...state.profile,
          ...action.payload.updates
        }
      };
    
    default:
      return state;
  }
}

/**
 * UI reducer
 */
function uiReducer(state = initialState.ui, action) {
  switch (action.type) {
    case ACTION_TYPES.UI_MODAL_OPEN:
      return {
        ...state,
        openModals: [...state.openModals, action.payload.modalId]
      };
    
    case ACTION_TYPES.UI_MODAL_CLOSE:
      return {
        ...state,
        openModals: state.openModals.filter(id => id !== action.payload.modalId)
      };
    
    case ACTION_TYPES.UI_THEME_CHANGE:
      return {
        ...state,
        theme: action.payload.theme
      };
    
    case ACTION_TYPES.UI_LANGUAGE_CHANGE:
      return {
        ...state,
        language: action.payload.language
      };
    
    case ACTION_TYPES.UI_LOADING_START:
      return {
        ...state,
        loading: {
          ...state.loading,
          [action.payload.loadingId]: true
        }
      };
    
    case ACTION_TYPES.UI_LOADING_END:
      const newLoading = { ...state.loading };
      delete newLoading[action.payload.loadingId];
      return {
        ...state,
        loading: newLoading
      };
    
    default:
      return state;
  }
}

/**
 * Settings reducer
 */
function settingsReducer(state = initialState.settings, action) {
  switch (action.type) {
    case ACTION_TYPES.SETTINGS_UPDATE:
      return {
        ...state,
        ...action.payload.settings
      };
    
    case ACTION_TYPES.SETTINGS_RESET:
      return initialState.settings;
    
    default:
      return state;
  }
}

/**
 * Statistics reducer
 */
function statisticsReducer(state = initialState.statistics, action) {
  switch (action.type) {
    case ACTION_TYPES.STATS_UPDATE:
      return {
        ...state,
        ...action.payload.stats
      };
    
    case ACTION_TYPES.STATS_ACHIEVEMENT_UNLOCK:
      const achievement = {
        id: action.payload.achievementId,
        unlockedAt: action.payload.unlockedAt,
        unlocked: true
      };
      
      return {
        ...state,
        achievements: [
          ...state.achievements.filter(a => a.id !== achievement.id),
          achievement
        ]
      };
    
    case ACTION_TYPES.ANSWER_RESULT:
      const isCorrect = action.payload.isCorrect;
      return {
        ...state,
        totalQuestions: state.totalQuestions + 1,
        correctAnswers: state.correctAnswers + (isCorrect ? 1 : 0)
      };
    
    case ACTION_TYPES.GAME_END:
      return {
        ...state,
        totalGames: state.totalGames + 1
      };
    
    default:
      return state;
  }
}

/**
 * Error reducer
 */
function errorReducer(state = initialState.errors, action) {
  switch (action.type) {
    case ACTION_TYPES.ERROR_SET:
      return [...state, {
        message: action.payload.error,
        context: action.payload.context,
        timestamp: action.payload.timestamp
      }].slice(-10); // Keep last 10 errors
    
    case ACTION_TYPES.ERROR_CLEAR:
      return [];
    
    default:
      return state;
  }
}

/**
 * Combine reducers helper
 * Similar to Redux's combineReducers but simpler
 */
export function combineReducers(reducers) {
  return (state = {}, action) => {
    const nextState = {};
    let hasChanged = false;
    
    for (const key in reducers) {
      const reducer = reducers[key];
      const previousStateForKey = state[key];
      const nextStateForKey = reducer(previousStateForKey, action);
      
      nextState[key] = nextStateForKey;
      hasChanged = hasChanged || nextStateForKey !== previousStateForKey;
    }
    
    return hasChanged ? nextState : state;
  };
}

/**
 * Create reducer with initial state
 */
export function createReducer(initialState, handlers) {
  return (state = initialState, action) => {
    if (handlers.hasOwnProperty(action.type)) {
      return handlers[action.type](state, action);
    }
    return state;
  };
}
