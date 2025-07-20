/**
 * Game Constants
 * 
 * Carmack's principle: "Constants should be self-documenting and grouped logically.
 * If you need to explain what a constant does, make its name clearer."
 */

// Game State
export const GAME_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  QUESTION_DISPLAY: 'question_display',
  AWAITING_ANSWER: 'awaiting_answer',
  ANSWER_REVEALED: 'answer_revealed',
  CHECKING_ANSWER: 'checking_answer',
  ROUND_END: 'round_end'
};

// Scoring
export const SCORING = {
  CORRECT_MULTIPLIER: 1,
  INCORRECT_PENALTY: 0.5,
  STREAK_BONUS: {
    3: 1.5,
    5: 2,
    10: 3
  },
  TIME_BONUS_MAX: 500,
  TIME_BONUS_DECAY: 10 // points per second
};

// API Configuration
export const API_CONFIG = {
  TRIVIA: {
    JSERVICE: 'https://jservice.io/api',
    CLUEBASE: 'https://cluebase.readthedocs.io/en/latest/',
    TIMEOUT: 5000,
    RETRY_ATTEMPTS: 3,
    RETRY_DELAY: 1000
  },
  AI: {
    GEMINI_ENDPOINT: '/api/gemini',
    MODEL: 'gemini-pro',
    MAX_TOKENS: 150,
    TEMPERATURE: 0.9
  }
};

// UI Timing
export const TIMING = {
  ANIMATION: {
    FAST: 200,
    NORMAL: 400,
    SLOW: 600
  },
  TRANSITIONS: {
    FADE: 300,
    SLIDE: 400,
    BOUNCE: 600
  },
  DELAYS: {
    AFTER_ANSWER: 2000,
    BEFORE_NEXT: 1000,
    AI_RESPONSE: 500
  }
};

// Local Storage Keys
export const STORAGE_KEYS = {
  GAME_STATE: 'jeopardish_game_state',
  USER_PREFS: 'jeopardish_user_prefs',
  HIGH_SCORES: 'jeopardish_high_scores',
  STATISTICS: 'jeopardish_statistics'
};

// Audio Files
export const AUDIO = {
  THEME: '/sounds/theme.mp3',
  CORRECT: '/sounds/correct.mp3',
  INCORRECT: '/sounds/incorrect.mp3',
  DAILY_DOUBLE: '/sounds/daily-double.mp3',
  TIME_WARNING: '/sounds/time-warning.mp3',
  BUTTON_CLICK: '/sounds/button-click.mp3'
};

// Game Rules
export const RULES = {
  MAX_QUESTION_LENGTH: 500,
  MIN_ANSWER_LENGTH: 1,
  MAX_ANSWER_LENGTH: 100,
  ANSWER_TIME_LIMIT: 30000, // 30 seconds
  FUZZY_MATCH_THRESHOLD: 0.8
};

// Error Messages
export const ERRORS = {
  API: {
    NETWORK: 'Network error. Please check your connection.',
    TIMEOUT: 'Request timed out. Please try again.',
    NO_QUESTIONS: 'No questions available. Please try again later.',
    INVALID_RESPONSE: 'Invalid response from server.'
  },
  VALIDATION: {
    EMPTY_ANSWER: 'Please enter an answer.',
    ANSWER_TOO_LONG: 'Answer is too long.',
    INVALID_CHARACTERS: 'Answer contains invalid characters.'
  },
  STORAGE: {
    SAVE_FAILED: 'Failed to save game state.',
    LOAD_FAILED: 'Failed to load game state.',
    QUOTA_EXCEEDED: 'Storage quota exceeded.'
  }
};

// Debug Flags (Carmack: "Always have debug flags, but make them obvious")
export const DEBUG = {
  LOG_STATE_CHANGES: false,
  LOG_API_CALLS: false,
  MOCK_API_RESPONSES: false,
  SHOW_PERFORMANCE_METRICS: false,
  BYPASS_ANIMATIONS: false
};
