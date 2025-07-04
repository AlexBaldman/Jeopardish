import '@testing-library/jest-dom';

// Mock environment variables
process.env.VITE_GOOGLE_AI_API_KEY = 'test-api-key';
process.env.VITE_FIREBASE_API_KEY = 'test-firebase-key';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
