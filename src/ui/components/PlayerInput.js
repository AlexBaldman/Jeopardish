/**
 * PlayerInput Component
 * 
 * Handles user input for answering questions in Jeopardish
 * Features:
 * - Smart input handling with debouncing
 * - Auto-submit on timer expiration
 * - Visual feedback for input state
 * - Accessibility support
 * 
 * Carmack's wisdom:
 * "The user interface is the last thing to be designed,
 *  but the first thing the user notices."
 */

import ConnectedComponent from '../base/ConnectedComponent.js';
import { createElement, debounce } from '../../utils/helpers.js';
import { selectors } from '../../state/selectors.js';
import { getStore } from '../../state/index.js';
import { GAME_STATES, TIMING } from '../../utils/constants.js';

export class PlayerInput extends ConnectedComponent {
    constructor(container) {
        super(container, {
            className: 'player-input',
            styles: {
                default: 'input-default',
                focused: 'input-focused',
                disabled: 'input-disabled',
                correct: 'input-correct',
                incorrect: 'input-incorrect'
            },
            animations: {
                shake: 'shake-animation',
                pulse: 'pulse-animation'
            }
        });
        
        this.input = null;
        this.submitButton = null;
        this.charCount = null;
        this.timer = null;
        
        // Debounced input handler for performance
        this.handleInputDebounced = debounce(
            this.handleInputChange.bind(this),
            TIMING.INPUT_DEBOUNCE || 300
        );
        
        this.init();
    }
    
    mapStateToProps(state) {
        return {
            currentAnswer: selectors.getCurrentAnswer(state),
            gameState: selectors.getGameState(state),
            currentQuestion: selectors.getCurrentQuestion(state),
            timeRemaining: selectors.getTimeRemaining(state),
            isAnswerSubmitted: selectors.isAnswerSubmitted(state),
            lastAnswerCorrect: selectors.getLastAnswerCorrect(state)
        };
    }
    
    render() {
        const {
            currentAnswer,
            gameState,
            currentQuestion,
            timeRemaining,
            isAnswerSubmitted,
            lastAnswerCorrect
        } = this.props;
        
        const isDisabled = gameState !== GAME_STATES.PLAYING || 
                          isAnswerSubmitted ||
                          !currentQuestion;
        
        const inputClass = this.getInputClass(isAnswerSubmitted, lastAnswerCorrect);
        
        const element = createElement('div', {
            className: this.className,
            children: [
                // Input container
                createElement('div', {
                    className: 'input-container',
                    children: [
                        // Main input field
                        createElement('input', {
                            type: 'text',
                            className: inputClass,
                            placeholder: isDisabled ? '' : 'What is...',
                            value: currentAnswer || '',
                            disabled: isDisabled,
                            maxLength: 200,
                            autocomplete: 'off',
                            'aria-label': 'Your answer',
                            'aria-describedby': 'char-count timer-display'
                        }),
                        
                        // Character counter
                        createElement('span', {
                            id: 'char-count',
                            className: 'char-count',
                            'aria-live': 'polite',
                            textContent: `${(currentAnswer || '').length}/200`
                        })
                    ]
                }),
                
                // Submit button and timer
                createElement('div', {
                    className: 'input-actions',
                    children: [
                        // Submit button
                        createElement('button', {
                            className: 'submit-button',
                            textContent: 'Submit',
                            disabled: isDisabled || !currentAnswer,
                            'aria-label': 'Submit answer'
                        }),
                        
                        // Timer display
                        timeRemaining !== null && createElement('div', {
                            id: 'timer-display',
                            className: 'timer-display',
                            'aria-live': 'assertive',
                            'aria-label': `Time remaining: ${timeRemaining} seconds`,
                            children: [
                                createElement('span', {
                                    className: 'timer-icon',
                                    textContent: '⏱'
                                }),
                                createElement('span', {
                                    className: this.getTimerClass(timeRemaining),
                                    textContent: `${timeRemaining}s`
                                })
                            ]
                        })
                    ]
                }),
                
                // Feedback message
                isAnswerSubmitted && createElement('div', {
                    className: 'answer-feedback',
                    'aria-live': 'assertive',
                    children: [
                        createElement('span', {
                            className: lastAnswerCorrect ? 'correct-icon' : 'incorrect-icon',
                            textContent: lastAnswerCorrect ? '✓' : '✗'
                        }),
                        createElement('span', {
                            className: 'feedback-text',
                            textContent: lastAnswerCorrect ? 
                                'Correct!' : 
                                `The correct answer was: ${currentQuestion?.answer}`
                        })
                    ]
                })
            ]
        });
        
        this.container.innerHTML = '';
        this.container.appendChild(element);
        
        // Cache references
        this.input = this.container.querySelector('input');
        this.submitButton = this.container.querySelector('.submit-button');
        this.charCount = this.container.querySelector('.char-count');
        this.timer = this.container.querySelector('.timer-display');
        
        // Re-attach event listeners
        this.attachEventListeners();
        
        // Focus management
        if (gameState === GAME_STATES.PLAYING && !isAnswerSubmitted && currentQuestion) {
            this.input?.focus();
        }
    }
    
    attachEventListeners() {
        if (this.input) {
            this.input.addEventListener('input', this.handleInputDebounced);
            this.input.addEventListener('keydown', this.handleKeyDown.bind(this));
        }
        
        if (this.submitButton) {
            this.submitButton.addEventListener('click', this.handleSubmit.bind(this));
        }
    }
    
    handleInputChange(event) {
        const value = event.target.value;
        
        const store = getStore();
        store.dispatch({
            type: 'UPDATE_ANSWER',
            payload: { answer: value }
        });
        
        // Update character count immediately (not through state)
        if (this.charCount) {
            this.charCount.textContent = `${value.length}/200`;
        }
    }
    
    handleKeyDown(event) {
        // Submit on Enter
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            this.handleSubmit();
        }
        
        // Clear on Escape
        if (event.key === 'Escape') {
            event.preventDefault();
            store.dispatch({
                type: 'UPDATE_ANSWER',
                payload: { answer: '' }
            });
        }
    }
    
    handleSubmit() {
        const { currentAnswer, gameState, currentQuestion, isAnswerSubmitted } = this.props;
        
        if (!currentAnswer || 
            gameState !== GAME_STATES.PLAYING || 
            isAnswerSubmitted ||
            !currentQuestion) {
            return;
        }
        
        store.dispatch({
            type: 'SUBMIT_ANSWER',
            payload: {
                answer: currentAnswer,
                timestamp: Date.now()
            }
        });
        
        // Visual feedback
        this.animateSubmit();
    }
    
    animateSubmit() {
        if (this.submitButton) {
            this.submitButton.classList.add('submit-animation');
            setTimeout(() => {
                this.submitButton.classList.remove('submit-animation');
            }, 300);
        }
    }
    
    getInputClass(isSubmitted, isCorrect) {
        const classes = ['player-input-field'];
        
        if (isSubmitted) {
            classes.push(isCorrect ? 'input-correct' : 'input-incorrect');
            classes.push(isCorrect ? this.animations.pulse : this.animations.shake);
        }
        
        return classes.join(' ');
    }
    
    getTimerClass(timeRemaining) {
        const classes = ['timer-value'];
        
        if (timeRemaining <= 10) {
            classes.push('timer-warning');
        }
        if (timeRemaining <= 5) {
            classes.push('timer-critical');
            classes.push(this.animations.pulse);
        }
        
        return classes.join(' ');
    }
    
    destroy() {
        // Clean up event listeners
        if (this.input) {
            this.input.removeEventListener('input', this.handleInputDebounced);
            this.input.removeEventListener('keydown', this.handleKeyDown);
        }
        
        if (this.submitButton) {
            this.submitButton.removeEventListener('click', this.handleSubmit);
        }
        
        // Clear references
        this.input = null;
        this.submitButton = null;
        this.charCount = null;
        this.timer = null;
        
        super.destroy();
    }
}

// Factory function for creating player input
export function createPlayerInput(container) {
    return new PlayerInput(container);
}
