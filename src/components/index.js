/**
 * Components Index
 * 
 * Central export for all UI components
 * Provides clean imports for the rest of the application
 */

// Base components
export { Component } from './Component.js';
export { ConnectedComponent } from './ConnectedComponent.js';

// Game components
export { ScoreBoard, createScoreBoard } from './ScoreBoard.js';
export { QuestionDisplay, createQuestionDisplay } from './QuestionDisplay.js';
export { GameControls, createGameControls } from './GameControls.js';

// Re-export component utilities
export { createElement } from '../utils/helpers.js';
