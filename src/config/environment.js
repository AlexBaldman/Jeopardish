/**
 * Environment Configuration Module
 * Manages environment variables and configuration settings
 */

// Default configuration
const defaultConfig = {
  api: {
    questionsUrl: 'https://cluebase.lukelav.in/clues/random',
    timeout: 10000
  },
  ai: {
    provider: 'gemini',
    model: 'gemini-1.5-pro',
    apiKey: import.meta.env.VITE_GOOGLE_AI_API_KEY || ''
  },
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || '',
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || '',
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || '',
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
    appId: import.meta.env.VITE_FIREBASE_APP_ID || ''
  },
  game: {
    defaultQuestionValue: 200,
    defaultPeekTokens: 5,
    autoAdvanceDelay: 3000,
    chunkSize: 500
  },
  ui: {
    animationDuration: 300,
    typingSpeed: 30,
    tickerUpdateInterval: 15000
  }
};

// Environment-specific overrides
const environmentConfig = {
  development: {
    debug: true,
    logLevel: 'debug'
  },
  production: {
    debug: false,
    logLevel: 'error'
  }
};

// Get current environment
const environment = import.meta.env.MODE || 'development';

// Merge configurations
export const config = {
  ...defaultConfig,
  ...environmentConfig[environment],
  environment
};

// Helper function to check if required configuration is present
export function validateConfig() {
  const errors = [];
  
  // Check for AI configuration
  if (!config.ai.apiKey) {
    console.warn('⚠️ Google AI API key not configured. AI features will be limited.');
  }
  
  // Check for Firebase configuration
  if (!config.firebase.apiKey) {
    console.warn('⚠️ Firebase not configured. Authentication and data persistence will be unavailable.');
  }
  
  return errors;
}

// Initialize configuration validation
validateConfig();
