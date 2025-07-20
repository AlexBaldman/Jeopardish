/**
 * QuestionDisplay Component
 * 
 * Carmack's principle: "Complex UI should be built from simple parts.
 * Each part does one thing well."
 */

import ConnectedComponent from '../base/ConnectedComponent.js';
import { 
  getCurrentQuestion,
  getGameStatus,
  isLoading
} from '../../state/selectors.js';
import { GAME_STATES } from '../../utils/constants.js';

/**
 * QuestionDisplay component
 * Shows category, value, question, and answer
 */
export class QuestionDisplay extends ConnectedComponent {
  init() {
    this.state = {
      showAnswer: false,
      speechBubbleStyle: 'default'
    };
    
    // Speech bubble styles
    this.bubbleStyles = ['default', 'comic', 'thought', 'retro'];
    this.currentStyleIndex = 0;
  }

  /**
   * Map store state to component
   */
  mapStateToProps(state) {
    return {
      question: getCurrentQuestion(state),
      gameStatus: getGameStatus(state),
      isLoading: isLoading('question')(state)
    };
  }

  /**
   * Render the question display
   */
  render() {
    const { question, gameStatus, isLoading } = this.storeState;
    const { showAnswer, speechBubbleStyle } = this.state;
    
    const isAnswerRevealed = gameStatus === GAME_STATES.ANSWER_REVEALED || showAnswer;

    return `
      <div class="speech-bubble ${speechBubbleStyle}" 
           data-ref="root"
           title="Click on left or right edge to change speech bubble style">
        
        <div class="bubble-left-zone" data-on-click="previousStyle"></div>
        <div class="bubble-right-zone" data-on-click="nextStyle"></div>
        
        ${isLoading ? this.renderLoading() : ''}
        
        ${question ? `
          <div class="question-content" data-ref="content">
            <div class="category-box" data-ref="categoryBox">
              ${question.category || ''}
            </div>
            
            <div class="value-box" data-ref="valueBox">
              ${question.value ? `for ${question.value}` : ''}
            </div>
            
            <div class="question-box" data-ref="questionBox">
              ${question.question || ''}
            </div>
            
            <div class="answer-box ${isAnswerRevealed ? 'visible' : ''}" 
                 data-ref="answerBox">
              ${question.answer || ''}
            </div>
          </div>
        ` : this.renderEmpty()}
      </div>
    `;
  }

  /**
   * Render loading state
   */
  renderLoading() {
    return `
      <div class="loading-state">
        <div class="loading-spinner"></div>
        <p>Loading question...</p>
      </div>
    `;
  }

  /**
   * Render empty state
   */
  renderEmpty() {
    return `
      <div class="empty-state">
        <p>Click "New Question" to begin!</p>
      </div>
    `;
  }

  /**
   * Component mounted
   */
  onMount() {
    super.onMount();
    
    // Subscribe to game events
    this.on('game:answer:revealed', this.handleAnswerRevealed.bind(this));
    this.on('game:question:loaded', this.handleQuestionLoaded.bind(this));
  }

  /**
   * Previous bubble style
   */
  previousStyle() {
    this.currentStyleIndex = (this.currentStyleIndex - 1 + this.bubbleStyles.length) % this.bubbleStyles.length;
    this.setState({ speechBubbleStyle: this.bubbleStyles[this.currentStyleIndex] });
    this.animateStyleChange();
  }

  /**
   * Next bubble style
   */
  nextStyle() {
    this.currentStyleIndex = (this.currentStyleIndex + 1) % this.bubbleStyles.length;
    this.setState({ speechBubbleStyle: this.bubbleStyles[this.currentStyleIndex] });
    this.animateStyleChange();
  }

  /**
   * Animate style change
   */
  animateStyleChange() {
    const root = this.ref('root');
    root.classList.add('style-changing');
    
    setTimeout(() => {
      root.classList.remove('style-changing');
    }, 300);
  }

  /**
   * Handle answer revealed
   */
  handleAnswerRevealed() {
    this.setState({ showAnswer: true });
    this.animateAnswerReveal();
  }

  /**
   * Handle new question loaded
   */
  handleQuestionLoaded() {
    this.setState({ showAnswer: false });
    this.animateQuestionLoad();
  }

  /**
   * Animate answer reveal
   */
  animateAnswerReveal() {
    const answerBox = this.ref('answerBox');
    if (!answerBox) return;
    
    answerBox.classList.add('revealing');
    
    setTimeout(() => {
      answerBox.classList.remove('revealing');
    }, 600);
  }

  /**
   * Animate question load
   */
  animateQuestionLoad() {
    const content = this.ref('content');
    if (!content) return;
    
    // Fade in animation
    content.style.opacity = '0';
    content.style.transform = 'translateY(20px)';
    
    requestAnimationFrame(() => {
      content.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      content.style.opacity = '1';
      content.style.transform = 'translateY(0)';
    });
  }

  /**
   * Get speech bubble class based on style
   */
  getSpeechBubbleClass() {
    const styleClasses = {
      default: 'speech-bubble-default',
      comic: 'speech-bubble-comic',
      thought: 'speech-bubble-thought',
      retro: 'speech-bubble-retro'
    };
    
    return styleClasses[this.state.speechBubbleStyle] || 'speech-bubble-default';
  }
}

/**
 * Factory function for creating question display
 */
export function createQuestionDisplay(containerId) {
  const display = new QuestionDisplay();
  display.mount(containerId);
  return display;
}
