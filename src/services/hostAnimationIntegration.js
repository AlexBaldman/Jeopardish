/**
 * Host Animation Integration
 * Connects game events to host animations
 */

import { store } from '../state/store.js';
import { GAME_STATES } from '../utils/constants.js';
import eventBus from '../utils/events.js';

class HostAnimationIntegration {
    constructor() {
        this.hostAnimationManager = null;
        this.isInitialized = false;
        this.lastState = null;
        this.lastScore = 0;
        this.lastStreak = 0;
    }

    init() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else {
            this.setup();
        }
    }

    setup() {
        // Get reference to host animation manager
        this.hostAnimationManager = window.hostAnimationManager;
        
        if (!this.hostAnimationManager) {
            console.warn('Host Animation Manager not found, retrying in 1s...');
            setTimeout(() => this.setup(), 1000);
            return;
        }

        // Get reference to host image cycler
        this.hostImageCycler = window.hostImageCycler;
        if (!this.hostImageCycler) {
            console.warn('Host Image Cycler not found');
        }

        // Subscribe to store changes
        this.unsubscribe = store.subscribe(() => this.handleStateChange());
        
        // Listen for game events
        this.setupEventListeners();
        
        this.isInitialized = true;
        console.log('Host Animation Integration initialized');
    }

    setupEventListeners() {
        // Listen for correct answer events
        eventBus.on('answer:correct', (event) => {
            this.handleCorrectAnswer(event.detail);
        });

        // Listen for incorrect answer events
        eventBus.on('answer:incorrect', (event) => {
            this.handleIncorrectAnswer(event.detail);
        });

        // Listen for streak milestones
        eventBus.on('streak:milestone', (event) => {
            this.handleStreakMilestone(event.detail);
        });

        // Listen for game state changes
        eventBus.on('game:stateChange', (event) => {
            this.handleGameStateChange(event.detail);
        });

        // Legacy event listeners for compatibility
        document.addEventListener('correctAnswer', () => {
            this.handleCorrectAnswer({ legacy: true });
        });

        document.addEventListener('incorrectAnswer', () => {
            this.handleIncorrectAnswer({ legacy: true });
        });
    }

    handleStateChange() {
        const state = store.getState();
        const currentScore = state.game.score;
        const currentStreak = state.game.streak;

        // Check for score changes
        if (currentScore > this.lastScore) {
            this.triggerScoreAnimation(currentScore - this.lastScore);
        }

        // Check for streak changes
        if (currentStreak > this.lastStreak && currentStreak > 0) {
            this.triggerStreakAnimation(currentStreak);
        } else if (currentStreak === 0 && this.lastStreak > 0) {
            // Streak broken
            this.triggerStreakBrokenAnimation();
        }

        this.lastScore = currentScore;
        this.lastStreak = currentStreak;
    }

    handleCorrectAnswer(data) {
        if (!this.hostAnimationManager || !this.isInitialized) return;

        const animations = ['stairs', 'duckAndScare', 'moonwalk'];
        const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
        
        // Play animation
        this.hostAnimationManager.playAnimation(randomAnimation);

        // Play sound if available
        if (window.soundManager) {
            window.soundManager.play('correctAnswer');
        }

        // Occasionally cycle host image on correct answers
        if (this.hostImageCycler && Math.random() > 0.7) {
            setTimeout(() => {
                this.hostImageCycler.cycleNext();
                console.log('🎭 Host image cycled on correct answer');
            }, 1000);
        }

        console.log('Triggered correct answer animation:', randomAnimation);
    }

    handleIncorrectAnswer(data) {
        if (!this.hostAnimationManager || !this.isInitialized) return;

        const animations = ['hideLeft', 'duckAndScare'];
        const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
        
        // Play animation
        this.hostAnimationManager.playAnimation(randomAnimation);

        // Play sound if available
        if (window.soundManager) {
            window.soundManager.play('incorrectAnswer');
        }

        console.log('Triggered incorrect answer animation:', randomAnimation);
    }

    handleStreakMilestone(data) {
        if (!this.hostAnimationManager || !this.isInitialized) return;

        const streak = data.streak || 0;

        // Special animations for streak milestones
        if (streak === 5) {
            this.hostAnimationManager.playAnimation('moonwalk');
            // Change host image on first milestone
            if (this.hostImageCycler) {
                this.hostImageCycler.cycleNext();
                console.log('🎉 Host image changed for 5-streak milestone!');
            }
        } else if (streak === 10) {
            this.hostAnimationManager.playAnimation('stairs');
            // Change host image on big milestone
            if (this.hostImageCycler) {
                this.hostImageCycler.cycleNext();
                console.log('🎊 Host image changed for 10-streak milestone!');
            }
        } else if (streak % 5 === 0) {
            this.hostAnimationManager.playAnimation('duckAndScare');
        }
    }

    handleGameStateChange(data) {
        if (!this.hostAnimationManager || !this.isInitialized) return;

        const newState = data.newState;
        const oldState = data.oldState;

        // Game start animation
        if (newState === GAME_STATES.PLAYING && oldState === GAME_STATES.READY) {
            this.hostAnimationManager.playAnimation('stairs');
            // Reset to first host image on new game
            if (this.hostImageCycler) {
                this.hostImageCycler.setHost(0);
                console.log('🎮 Host image reset for new game');
            }
        }

        // Game over animation
        if (newState === GAME_STATES.GAME_OVER) {
            this.hostAnimationManager.playAnimation('moonwalk');
        }
    }

    triggerScoreAnimation(scoreIncrease) {
        if (!this.hostAnimationManager || !this.isInitialized) return;

        // Big score increase gets special animation
        if (scoreIncrease >= 1000) {
            this.hostAnimationManager.playAnimation('moonwalk');
        }
    }

    triggerStreakAnimation(streak) {
        if (!this.hostAnimationManager || !this.isInitialized) return;

        // Milestone streaks
        if (streak % 5 === 0) {
            this.hostAnimationManager.playAnimation('stairs');
        }
    }

    triggerStreakBrokenAnimation() {
        if (!this.hostAnimationManager || !this.isInitialized) return;

        this.hostAnimationManager.playAnimation('hideLeft');
    }

    // Method to manually trigger random animation
    triggerRandomAnimation() {
        if (!this.hostAnimationManager || !this.isInitialized) return;

        const animations = ['hideLeft', 'duckAndScare', 'stairs', 'moonwalk'];
        const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
        this.hostAnimationManager.playAnimation(randomAnimation);
    }

    destroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }
}

// Create and export singleton instance
const hostAnimationIntegration = new HostAnimationIntegration();
export default hostAnimationIntegration;

// Auto-initialize
hostAnimationIntegration.init();
