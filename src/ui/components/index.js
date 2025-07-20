/**
 * UI Components Index
 * 
 * Central export point for all UI components.
 * Following Carmack's principle: "Make interfaces minimal and obvious"
 * 
 * This file provides a clean import interface for component consumers.
 */

// Core UI Components
export { default as App } from './App.js';
export { default as ScoreBoard } from './ScoreBoard.js';
export { default as QuestionDisplay } from './QuestionDisplay.js';
export { default as GameControls } from './GameControls.js';

// Modal Components
export { Stats } from './Stats.js';
export { HelpModal } from './HelpModal.js';
export { AchievementsModal } from './AchievementsModal.js';
export { LeaderboardModal } from './LeaderboardModal.js';
export { ProfileModal } from './ProfileModal.js';

// Re-export base components for extension
export { Component } from '../Component.js';
export { ConnectedComponent } from '../ConnectedComponent.js';
