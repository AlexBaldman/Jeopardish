/**
 * Host Animation Manager Service
 * Manages host animations triggered by game events
 */
import eventBus from '../utils/events.js';

class HostAnimationManager {
    constructor() {
        this.animations = {
            idle: {
                class: 'idle',
                duration: 60000
            },
            thinking: {
                class: 'thinking',
                duration: 3000
            },
            excited: {
                class: 'excited',
                duration: 2000
            },
            disappointed: {
                class: 'disappointed',
                duration: 2000
            },
            celebrating: {
                class: 'celebrating',
                duration: 3000
            },
            talking: {
                class: 'talking',
                duration: 2000
            },
            waving: {
                class: 'waving',
                duration: 2000
            },
            confused: {
                class: 'confused',
                duration: 2000
            },
            pointing: {
                class: 'pointing',
                duration: 2000
            },
            nodding: {
                class: 'nodding',
                duration: 2000
            },
            shaking: {
                class: 'shaking',
                duration: 2000
            }
        };
        
        this.hostElement = null;
        this.currentAnimation = null;
        this.animationTimeout = null;
        this.idleTimeout = null;
        this.isInitialized = false;
    }
    
    init() {
        // Find host element
        this.hostElement = document.querySelector('.host');
        if (!this.hostElement) {
            console.error('Host element not found');
            return;
        }
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start with idle animation
        this.playAnimation('idle');
        
        this.isInitialized = true;
        console.log('Host Animation Manager initialized');
    }
    
    setupEventListeners() {
        // Listen for game events
        eventBus.on('questionDisplayed', () => {
            this.playAnimation('thinking');
        });
        
        eventBus.on('correctAnswer', () => {
            this.playAnimation('celebrating');
        });
        
        eventBus.on('incorrectAnswer', () => {
            this.playAnimation('disappointed');
        });
        
        eventBus.on('timeUp', () => {
            this.playAnimation('shaking');
        });
        
        eventBus.on('hint', () => {
            this.playAnimation('pointing');
        });
        
        eventBus.on('streakMilestone', (e) => {
            if (e.detail && e.detail.streak >= 5) {
                this.playAnimation('excited');
            }
        });
        
        eventBus.on('gameStart', () => {
            this.playAnimation('waving');
        });
        
        eventBus.on('gameEnd', () => {
            this.playAnimation('waving');
        });
        
        // Listen for direct animation requests
        eventBus.on('playHostAnimation', (e) => {
            if (e.detail && e.detail.animation) {
                this.playAnimation(e.detail.animation);
            }
        });
        
        // Listen for sound-related animations
        eventBus.on('soundPlayed', (e) => {
            if (e.detail && e.detail.soundType === 'dailyDouble') {
                this.playAnimation('excited');
            }
        });
    }
    
    playAnimation(animationName, immediate = false) {
        if (!this.hostElement || !this.animations[animationName]) {
            console.warn(`Animation '${animationName}' not found or host element missing`);
            return;
        }
        
        const animation = this.animations[animationName];
        
        // Clear any existing timeouts
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
            this.animationTimeout = null;
        }
        if (this.idleTimeout) {
            clearTimeout(this.idleTimeout);
            this.idleTimeout = null;
        }
        
        // If not immediate and already playing an animation (not idle), queue this one
        if (!immediate && this.currentAnimation && this.currentAnimation !== 'idle') {
            // Queue the animation to play after current one
            this.animationTimeout = setTimeout(() => {
                this.playAnimation(animationName, true);
            }, this.animations[this.currentAnimation].duration);
            return;
        }
        
        // Remove all animation classes
        Object.keys(this.animations).forEach(name => {
            this.hostElement.classList.remove(this.animations[name].class);
        });
        
        // Add new animation class
        this.hostElement.classList.add(animation.class);
        this.currentAnimation = animationName;
        
        console.log(`Host animation: ${animationName}`);
        
        // Return to idle after animation duration (unless it's idle itself)
        if (animationName !== 'idle') {
            this.animationTimeout = setTimeout(() => {
                this.returnToIdle();
            }, animation.duration);
        }
    }
    
    returnToIdle() {
        // Add a small delay before returning to idle
        this.idleTimeout = setTimeout(() => {
            this.playAnimation('idle', true);
        }, 500);
    }
    
    // Method to stop all animations
    stopAll() {
        if (this.animationTimeout) {
            clearTimeout(this.animationTimeout);
            this.animationTimeout = null;
        }
        if (this.idleTimeout) {
            clearTimeout(this.idleTimeout);
            this.idleTimeout = null;
        }
        
        if (this.hostElement) {
            Object.keys(this.animations).forEach(name => {
                this.hostElement.classList.remove(this.animations[name].class);
            });
        }
        
        this.currentAnimation = null;
    }
    
    // Method to check if an animation is currently playing
    isPlaying(animationName) {
        return this.currentAnimation === animationName;
    }
    
    // Method to get current animation
    getCurrentAnimation() {
        return this.currentAnimation;
    }
    
    // Method to add custom animations at runtime
    addAnimation(name, className, duration = 2000) {
        this.animations[name] = {
            class: className,
            duration: duration
        };
    }
}

export default HostAnimationManager;
