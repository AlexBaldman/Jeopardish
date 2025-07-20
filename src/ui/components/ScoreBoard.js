/**
 * ScoreBoard Component
 * 
 * Carmack's principle: "UI components should be dumb.
 * They display state, they don't manage it."
 */

import ConnectedComponent from '../base/ConnectedComponent.js';
import { 
  getCurrentScore, 
  getHighScore, 
  getCurrentStreak, 
  getBestStreak,
  getFormattedScore 
} from '../../state/selectors.js';
import { formatCurrency } from '../../utils/helpers.js';

/**
 * ScoreBoard component
 * Displays current score, high score, streak, etc.
 */
export class ScoreBoard extends ConnectedComponent {
  init() {
    // Component state
    this.state = {
      isExpanded: false,
      showAnimation: false
    };
  }

  /**
   * Map store state to component
   */
  mapStateToProps(state) {
    return {
      currentScore: getCurrentScore(state),
      highScore: getHighScore(state),
      currentStreak: getCurrentStreak(state),
      bestStreak: getBestStreak(state),
      formattedScore: getFormattedScore(state)
    };
  }

  /**
   * Render the scoreboard
   */
  render() {
    const { currentScore, highScore, currentStreak, bestStreak } = this.storeState;
    const { isExpanded, showAnimation } = this.state;

    return `
      <div class="scoreboard ${isExpanded ? 'expanded' : ''} ${showAnimation ? 'animating' : ''}" 
           data-ref="root">
        <div class="scoreboard-header" data-on-click="toggleExpanded">
          <h2>SCOREBOARD</h2>
          <span class="toggle-icon">${isExpanded ? '−' : '+'}</span>
        </div>
        
        <div class="scoreboard-content">
          <div class="score-item primary">
            <label>SCORE</label>
            <span class="score-value" data-ref="currentScore">
              ${formatCurrency(currentScore || 0)}
            </span>
          </div>
          
          <div class="score-item">
            <label>STREAK</label>
            <span class="score-value" data-ref="currentStreak">
              ${currentStreak || 0}
            </span>
          </div>
          
          ${isExpanded ? `
            <div class="score-item">
              <label>TOP SCORE</label>
              <span class="score-value">
                ${formatCurrency(highScore || 0)}
              </span>
            </div>
            
            <div class="score-item">
              <label>MAX STREAK</label>
              <span class="score-value">
                ${bestStreak || 0}
              </span>
            </div>
          ` : ''}
        </div>
        
        <div class="scoreboard-peek">
          <span>Score</span>
        </div>
      </div>
    `;
  }

  /**
   * Component mounted
   */
  onMount() {
    super.onMount();
    
    // Add hover behavior
    this.setupHoverBehavior();
    
    // Subscribe to score changes for animations
    this.on('state:changed', this.handleStateChange.bind(this));
  }

  /**
   * Handle state changes from store
   */
  onStateChange(prevState, newState) {
    // Animate score changes
    if (prevState.currentScore !== newState.currentScore) {
      this.animateScoreChange(prevState.currentScore, newState.currentScore);
    }
    
    // Animate streak changes
    if (prevState.currentStreak !== newState.currentStreak) {
      this.animateStreakChange(prevState.currentStreak, newState.currentStreak);
    }
  }

  /**
   * Toggle expanded state
   */
  toggleExpanded() {
    this.setState({ isExpanded: !this.state.isExpanded });
  }

  /**
   * Setup hover behavior
   */
  setupHoverBehavior() {
    const root = this.ref('root');
    let hoverTimeout;
    
    root.addEventListener('mouseenter', () => {
      clearTimeout(hoverTimeout);
      root.classList.add('hover');
    });
    
    root.addEventListener('mouseleave', () => {
      hoverTimeout = setTimeout(() => {
        root.classList.remove('hover');
      }, 3000);
    });
  }

  /**
   * Animate score change
   */
  animateScoreChange(oldScore, newScore) {
    const element = this.ref('currentScore');
    if (!element) return;
    
    // Add animation class
    element.classList.add('score-updated');
    
    // Animate number
    const duration = 500;
    const start = Date.now();
    const diff = newScore - oldScore;
    
    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const eased = 1 - Math.pow(1 - progress, 3);
      
      const current = Math.round(oldScore + (diff * eased));
      element.textContent = formatCurrency(current);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Remove animation class
        setTimeout(() => {
          element.classList.remove('score-updated');
        }, 300);
      }
    };
    
    requestAnimationFrame(animate);
  }

  /**
   * Animate streak change
   */
  animateStreakChange(oldStreak, newStreak) {
    const element = this.ref('currentStreak');
    if (!element) return;
    
    // Add animation class
    element.classList.add('score-updated');
    
    // Simple update for streak
    element.textContent = newStreak;
    
    // Pulse effect for streak increases
    if (newStreak > oldStreak) {
      element.classList.add('streak-increased');
      setTimeout(() => {
        element.classList.remove('streak-increased');
      }, 600);
    } else if (newStreak === 0 && oldStreak > 0) {
      // Streak broken animation
      element.classList.add('streak-broken');
      setTimeout(() => {
        element.classList.remove('streak-broken');
      }, 600);
    }
    
    // Remove animation class
    setTimeout(() => {
      element.classList.remove('score-updated');
    }, 300);
  }

  /**
   * Handle global state changes
   */
  handleStateChange({ action }) {
    // Show scoreboard temporarily on score changes
    if (action.type === 'SCORE_UPDATE' || action.type === 'STREAK_UPDATE') {
      const root = this.ref('root');
      root.classList.add('show');
      
      setTimeout(() => {
        root.classList.remove('show');
      }, 3000);
    }
  }
}

/**
 * Factory function for creating scoreboard
 */
export function createScoreBoard(containerId) {
  const scoreBoard = new ScoreBoard();
  scoreBoard.mount(containerId);
  return scoreBoard;
}
