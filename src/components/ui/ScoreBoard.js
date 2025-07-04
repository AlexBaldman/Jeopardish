/**
 * ScoreBoard Component
 * Manages the display and animation of game scores and streaks
 */

import { subscribeToState } from '@store/gameState.js';

export class ScoreBoard {
  constructor(containerId = 'scoreboard') {
    this.container = document.getElementById(containerId);
    if (!this.container) {
      console.error(`ScoreBoard: Container with ID '${containerId}' not found`);
      return;
    }
    
    this.elements = {
      score: null,
      streak: null,
      topScore: null,
      maxStreak: null
    };
    
    this.init();
  }
  
  init() {
    // Get element references
    this.elements.score = document.getElementById('score');
    this.elements.streak = document.getElementById('streak');
    this.elements.topScore = document.getElementById('top-score');
    this.elements.maxStreak = document.getElementById('max-streak');
    
    // Subscribe to state changes
    this.unsubscribe = subscribeToState(this.handleStateChange.bind(this));
    
    // Set initial display
    this.container.style.display = 'block';
    this.container.style.visibility = 'visible';
    this.container.style.opacity = '1';
    
    // Add hover behavior
    this.setupHoverBehavior();
    
    console.log('✅ ScoreBoard initialized');
  }
  
  handleStateChange({ property, value, state }) {
    switch (property) {
      case 'score':
        this.updateScore(value.current, value.best);
        break;
      case 'streak':
        this.updateStreak(value.current, value.best);
        break;
      case 'reset':
        this.resetDisplay();
        break;
    }
  }
  
  updateScore(current, best) {
    if (this.elements.score) {
      const oldValue = parseInt(this.elements.score.textContent) || 0;
      if (oldValue !== current) {
        this.elements.score.textContent = current;
        this.animateUpdate(this.elements.score);
      }
    }
    
    if (this.elements.topScore) {
      const oldBest = parseInt(this.elements.topScore.textContent) || 0;
      if (oldBest !== best) {
        this.elements.topScore.textContent = best;
        this.animateUpdate(this.elements.topScore);
      }
    }
  }
  
  updateStreak(current, best) {
    if (this.elements.streak) {
      const oldValue = parseInt(this.elements.streak.textContent) || 0;
      if (oldValue !== current) {
        this.elements.streak.textContent = current;
        this.animateUpdate(this.elements.streak);
      }
    }
    
    if (this.elements.maxStreak) {
      const oldBest = parseInt(this.elements.maxStreak.textContent) || 0;
      if (oldBest !== best) {
        this.elements.maxStreak.textContent = best;
        this.animateUpdate(this.elements.maxStreak);
      }
    }
  }
  
  animateUpdate(element) {
    if (!element) return;
    
    element.classList.add('score-updated');
    setTimeout(() => {
      element.classList.remove('score-updated');
    }, 300);
  }
  
  setupHoverBehavior() {
    let hoverTimeout;
    
    this.container.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimeout);
      this.container.classList.add('show');
    });
    
    this.container.addEventListener('mouseleave', () => {
      hoverTimeout = setTimeout(() => {
        this.container.classList.remove('show');
      }, 3000);
    });
  }
  
  resetDisplay() {
    Object.values(this.elements).forEach(element => {
      if (element && element.textContent !== '0') {
        element.textContent = '0';
        this.animateUpdate(element);
      }
    });
  }
  
  destroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
  }
}
