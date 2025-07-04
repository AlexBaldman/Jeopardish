/**
 * ai-trebek-ui.js
 * 
 * This file handles the UI components for displaying AI-generated responses
 * from Alex Trebek in the Jeopardish game.
 */

/**
 * AI Trebek UI Controller
 * Manages the display and animations for AI Trebek's responses
 */
class AITrebekUI {
    constructor() {
        // DOM elements (will be created if they don't exist)
        this.host = document.querySelector('.trebek');
        this.gameContainer = document.querySelector('.game-container');
        this.aiResponseBubble = null;
        this.aiResponseText = null;
        
        // Configuration
        this.typingSpeed = 30; // ms per character for typing animation
        this.bubbleHideDelay = 5000; // ms to keep bubble visible before auto-hiding
        this.isActive = false;
        this.typingInterval = null;
        this.hideTimeout = null;
        
        // Response queue for sequential processing
        this.responseQueue = [];
        this.isProcessingQueue = false;
        
        // Initialize after DOM is fully loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    /**
     * Initialize the UI component
     */
    init() {
        // Create UI elements if they don't exist
        this.createUIElements();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Reference the host animation manager if available
        this.hostAnimationManager = window.hostAnimationManager;
        
        // Try to get geminiTrebek reference
        this.aiTrebek = window.geminiTrebek;
        
        console.log('AI Trebek UI initialized');
    }
    
    /**
     * Create the necessary UI elements for the AI response bubble
     */
    createUIElements() {
        // Check if elements already exist
        const existingBubble = document.getElementById('ai-trebek-bubble');
        if (existingBubble) {
            this.aiResponseBubble = existingBubble;
            this.aiResponseText = document.getElementById('ai-trebek-text');
            return;
        }
        
        // Create the speech bubble container
        this.aiResponseBubble = document.createElement('div');
        this.aiResponseBubble.id = 'ai-trebek-bubble';
        this.aiResponseBubble.className = 'ai-trebek-bubble';
        
        // Create the text container
        this.aiResponseText = document.createElement('div');
        this.aiResponseText.id = 'ai-trebek-text';
        this.aiResponseText.className = 'ai-trebek-text';
        
        // Create the close button
        const closeButton = document.createElement('button');
        closeButton.className = 'ai-trebek-close';
        closeButton.innerHTML = '&times;';
        closeButton.setAttribute('aria-label', 'Close AI response');
        closeButton.title = 'Dismiss';
        
        // Create thinking indicator
        const thinkingIndicator = document.createElement('div');
        thinkingIndicator.id = 'ai-trebek-thinking';
        thinkingIndicator.className = 'ai-trebek-thinking';
        thinkingIndicator.innerHTML = '<span></span><span></span><span></span>';
        
        // Append elements to the bubble
        this.aiResponseBubble.appendChild(this.aiResponseText);
        this.aiResponseBubble.appendChild(thinkingIndicator);
        this.aiResponseBubble.appendChild(closeButton);
        
        // Add to the game container
        this.gameContainer.appendChild(this.aiResponseBubble);
        
        // Add the styles if they don't exist
        this.addStyles();
    }
    
    /**
     * Add necessary CSS styles if not already in the stylesheet
     */
    addStyles() {
        // Check if styles already exist
        if (document.getElementById('ai-trebek-styles')) return;
        
        const styleSheet = document.createElement('style');
        styleSheet.id = 'ai-trebek-styles';
        styleSheet.innerHTML = `
            .ai-trebek-bubble {
                position: absolute;
                left: 20vw;
                bottom: 32vh;
                width: 35vw;
                min-height: 10vh;
                max-height: 30vh;
                background: linear-gradient(135deg, #000080 0%, #0000a0 40%, #0000c6 100%);
                border: 3px solid #ffffff;
                border-radius: 4vmin;
                padding: 15px;
                box-shadow: 0 0 10px rgba(0, 0, 0, 0.7);
                z-index: 5;
                opacity: 0;
                transform: translateY(20px) scale(0.9);
                transition: all 0.3s cubic-bezier(0.68, -0.6, 0.32, 1.6);
                pointer-events: none;
                overflow-y: auto;
                display: flex;
                flex-direction: column;
            }
            
            .ai-trebek-bubble::before {
                content: '';
                position: absolute;
                left: -25px;
                bottom: 20px;
                width: 0;
                height: 0;
                border-style: solid;
                border-width: 0 25px 25px 0;
                border-color: transparent #ffffff transparent transparent;
                z-index: 1;
            }
            
            .ai-trebek-bubble::after {
                content: '';
                position: absolute;
                left: -18px;
                bottom: 23px;
                width: 0;
                height: 0;
                border-style: solid;
                border-width: 0 18px 18px 0;
                border-color: transparent #000080 transparent transparent;
                z-index: 2;
            }
            
            .ai-trebek-bubble.active {
                opacity: 1;
                transform: translateY(0) scale(1);
                pointer-events: auto;
            }
            
            .ai-trebek-text {
                font-family: "Korinna", "KorinnaBold", "Times New Roman", serif;
                font-size: 2.2vmin;
                color: #ffffff;
                text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.7);
                line-height: 1.4;
                flex-grow: 1;
            }
            
            .ai-trebek-close {
                position: absolute;
                top: 5px;
                right: 5px;
                width: 25px;
                height: 25px;
                background: transparent;
                border: none;
                color: #ffffff;
                font-size: 20px;
                cursor: pointer;
                display: flex;
                justify-content: center;
                align-items: center;
                transition: all 0.2s ease;
                z-index: 10;
            }
            
            .ai-trebek-close:hover {
                color: #ff9900;
                transform: scale(1.2);
            }
            
            .ai-trebek-thinking {
                display: none;
                justify-content: center;
                align-items: center;
                margin-top: 10px;
                height: 20px;
            }
            
            .ai-trebek-thinking.active {
                display: flex;
            }
            
            .ai-trebek-thinking span {
                display: inline-block;
                width: 8px;
                height: 8px;
                margin: 0 3px;
                background-color: #ffffff;
                border-radius: 50%;
                animation: ai-trebek-thinking-dots 1.4s infinite ease-in-out both;
            }
            
            .ai-trebek-thinking span:nth-child(1) {
                animation-delay: -0.32s;
            }
            
            .ai-trebek-thinking span:nth-child(2) {
                animation-delay: -0.16s;
            }
            
            @keyframes ai-trebek-thinking-dots {
                0%, 80%, 100% { transform: scale(0); }
                40% { transform: scale(1); }
            }
            
            /* Media queries for responsive design */
            @media (max-width: 768px) {
                .ai-trebek-bubble {
                    left: 10vw;
                    width: 60vw;
                    font-size: 2vmin;
                }
            }
            
            @media (max-width: 480px) {
                .ai-trebek-bubble {
                    left: 5vw;
                    width: 70vw;
                    bottom: 35vh;
                    font-size: 3vmin;
                }
            }
        `;
        
        document.head.appendChild(styleSheet);
    }
    
    /**
     * Set up event listeners for the UI component
     */
    setupEventListeners() {
        // Close button event
        const closeButton = this.aiResponseBubble.querySelector('.ai-trebek-close');
        if (closeButton) {
            closeButton.addEventListener('click', (e) => {
                e.stopPropagation();
                this.hideResponse();
            });
        }
        
        // Add click event on the bubble to dismiss
        this.aiResponseBubble.addEventListener('click', (e) => {
            // Don't trigger if clicking on close button
            if (e.target.closest('.ai-trebek-close')) return;
            
            // If typing is in progress, complete it immediately
            if (this.typingInterval) {
                this.completeTypingImmediately();
            } else {
                // Otherwise hide the response
                this.hideResponse();
            }
        });
        
        // Add global keyboard handler for dismissing with Escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isActive) {
                this.hideResponse();
            }
        });
        
        // Add game event listeners for integration with game events
        this.addGameEventListeners();
    }
    
    /**
     * Add event listeners for integration with game events
     */
    addGameEventListeners() {
        // Listen for question button click to potentially show a greeting
        const questionButton = document.getElementById('questionButton');
        if (questionButton) {
            questionButton.addEventListener('click', () => {
                // Occasionally show a greeting when new question is requested
                if (Math.random() < 0.3 && this.aiTrebek) { // 30% chance
                    this.showAIGreeting();
                }
            });
        }
        
        // Listen for answer button click to potentially show a comment
        const answerButton = document.getElementById('answerButton');
        if (answerButton) {
            answerButton.addEventListener('click', () => {
                // Occasionally comment when answer is revealed
                if (Math.random() < 0.4 && this.aiTrebek) { // 40% chance
                    this.showRandomQuip();
                }
            });
        }
    }
    
    /**
     * Show a thinking indicator while waiting for AI response
     */
    showThinking() {
        const thinkingIndicator = document.getElementById('ai-trebek-thinking');
        if (thinkingIndicator) {
            thinkingIndicator.classList.add('active');
        }
    }
    
    /**
     * Hide the thinking indicator
     */
    hideThinking() {
        const thinkingIndicator = document.getElementById('ai-trebek-thinking');
        if (thinkingIndicator) {
            thinkingIndicator.classList.remove('active');
        }
    }
    
    /**
     * Display an AI-generated response with typing animation
     * @param {string} response - The response text to display
     * @param {boolean} animate - Whether to animate the typing effect
     * @param {boolean} autoHide - Whether to automatically hide after a delay
     */
    async showResponse(response, animate = true, autoHide = true) {
        if (!response) return;
        
        // Add to queue if already showing a response
        if (this.isActive) {
            this.responseQueue.push({ response, animate, autoHide });
            return;
        }
        
        // Clear any existing timeouts
        this.clearTimeouts();
        
        // Show the bubble and activate it
        this.isActive = true;
        this.aiResponseBubble.classList.add('active');
        
        // Clear previous text
        this.aiResponseText.textContent = '';
        
        // Animate the host if possible
        if (this.hostAnimationManager) {
            // Use a random animation from the manager
            const animations = ['stairs', 'duckAndScare'];
            const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
            this.hostAnimationManager.playAnimation(randomAnimation);
        } else {
            // Simple animation fallback
            this.animateHost();
        }
        
        if (animate) {
            // Type out the text character by character
            let i = 0;
            this.typingInterval = setInterval(() => {
                if (i < response.length) {
                    this.aiResponseText.textContent += response.charAt(i);
                    i++;
                    
                    // Scroll to bottom as text is added
                    this.aiResponseBubble.scrollTop = this.aiResponseBubble.scrollHeight;
                } else {
                    // Typing complete
                    this.completeTyping(autoHide);
                }
            }, this.typingSpeed);
        } else {
            // Just set the text immediately
            this.aiResponseText.textContent = response;
            
            // Set timeout for auto-hide if enabled
            if (autoHide) {
                this.hideTimeout = setTimeout(() => {
                    this.hideResponse();
                }, this.bubbleHideDelay);
            }
        }
    }
    
    /**
     * Complete the typing animation and set up auto-hide if enabled
     * @param {boolean} autoHide - Whether to automatically hide after a delay
     */
    completeTyping(autoHide = true) {
        // Clear typing interval
        clearInterval(this.typingInterval);
        this.typingInterval = null;
        
        // Set timeout for auto-hide if enabled
        if (autoHide) {
            this.hideTimeout = setTimeout(() => {
                this.hideResponse();
            }, this.bubbleHideDelay);
        }
    }
    
    /**
     * Complete typing immediately (when user clicks to skip animation)
     */
    completeTypingImmediately() {
        // If we have AI Trebek and there's a full response to show
        if (this.typingInterval && this.aiTrebek) {
            // Clear the typing interval
            clearInterval(this.typingInterval);
            this.typingInterval = null;
            
            // Show the complete text immediately
            const responseQueue = [...this.responseQueue];
            this.responseQueue = []; // Clear the queue
            
            // Get the current response (it was being typed)
            const currentResponse = this.aiResponseBubble.getAttribute('data-full-response');
            if (currentResponse) {
                this.aiResponseText.textContent = currentResponse;
                
                // Set timeout for auto-hide
                this.hideTimeout = setTimeout(() => {
                    this.hideResponse();
                    
                    // Process any queued responses
                    this.responseQueue = responseQueue;
                    setTimeout(() => {
                        this.processQueue();
                    }, 500);
                }, this.bubbleHideDelay);
            }
        }
    }
    
    /**
     * Animate the host with a simple animation if host animation manager is not available
     */
    animateHost() {
        if (!this.host) return;
        
        // Add a simple bounce animation
        this.host.style.transition = 'transform 0.5s ease-in-out';
        this.host.style.transform = 'translateY(-10px)';
        
        setTimeout(() => {
            this.host.style.transform = 'translateY(0)';
        }, 500);
    }
    
    /**
     * Hide the AI response bubble
     */
    hideResponse() {
        if (!this.isActive) return;
        
        // Clear any timeouts
        this.clearTimeouts();
        
        // Hide the bubble
        this.aiResponseBubble.classList.remove('active');
        
        // Reset state
        this.isActive = false;
        
        // Process next response in queue after a short delay
        setTimeout(() => {
            this.processQueue();
        }, 500);
    }
    
    /**
     * Clear all timeouts and intervals
     */
    clearTimeouts() {
        if (this.typingInterval) {
            clearInterval(this.typingInterval);
            this.typingInterval = null;
        }
        
        if (this.hideTimeout) {
            clearTimeout(this.hideTimeout);
            this.hideTimeout = null;
        }
    }
    
    /**
     * Process the next response in the queue
     */
    async processQueue() {
        if (this.responseQueue.length === 0 || this.isProcessingQueue) return;
        
        this.isProcessingQueue = true;
        const { response, animate, autoHide } = this.responseQueue.shift();
        await this.showResponse(response, animate, autoHide);
        this.isProcessingQueue = false;
    }
    
    /**
     * Show a random quip from the canned responses
     */
    showRandomQuip() {
        const quips = [
            "Remember, in Jeopardy, we need your response in the form of a question!",
            "That's not the correct response, but don't worry, this is just practice.",
            "Ah, the daily double! Except... every question is special here.",
            "I've been hosting Jeopardy for decades, and I'm still amazed by the breadth of knowledge contestants bring.",
            "Let's see if you can maintain your winning streak!",
            "Knowledge is power, especially when it comes with a cash prize.",
            "This would be a good time for a commercial break, but we'll press on!",
            "I'll take 'Random Trebek Quips' for $800, Alex!"
        ];
        
        const randomQuip = quips[Math.floor(Math.random() * quips.length)];
        this.showResponse(randomQuip);
    }
    
    /**
     * Show an AI-generated greeting
     */
    async showAIGreeting() {
        if (!this.aiTrebek) return;
        
        // Show the bubble with thinking indicator
        this.isActive = true;
        this.aiResponseBubble.classList.add('active');
        this.aiResponseText.textContent = '';
        this.showThinking();
        
        try {
            // Get greeting from AI Trebek
            const greeting = await this.aiTrebek.generateGreeting();
            
            // Hide thinking indicator and show the response
            this.hideThinking();
            
            // Store the full response for immediate completion if needed
            this.aiResponseBubble.setAttribute('data-full-response', greeting);
            
            // Show the response with typing animation
            this.showResponse(greeting);
        } catch (error) {
            console.error('Error generating AI greeting:', error);
            this.hideThinking();
            this.isActive = false;
            this.aiResponseBubble.classList.remove('active');
        }
    }
    
    /**
     * React to a correct answer
     * @param {string} question - The question that was answered
     * @param {string} answer - The answer that was provided
     */
    async reactToCorrectAnswer(question, answer) {
        if (!this.aiTrebek) return;
        
        // Show the bubble with thinking indicator
        this.isActive = true;
        this.aiResponseBubble.classList.add('active');
        this.aiResponseText.textContent = '';
        this.showThinking();
        
        try {
            // Get response from AI Trebek
            const response = await this.aiTrebek.generateCorrectResponse(question, answer);
            
            // Hide thinking indicator and show the response
            this.hideThinking();
            
            // Store the full response for immediate completion if needed
            this.aiResponseBubble.setAttribute('data-full-response', response);
            
            // Show the response with typing animation
            this.showResponse(response);
        } catch (error) {
            console.error('Error generating correct answer response:', error);
            this.hideThinking();
            this.isActive = false;
            this.aiResponseBubble.classList.remove('active');
        }
    }
    
    /**
     * React to an incorrect answer
     * @param {string} question - The question that was answered
     * @param {string} playerAnswer - The incorrect answer provided
     * @param {string} correctAnswer - The correct answer
     */
    async reactToIncorrectAnswer(question, playerAnswer, correctAnswer) {
        if (!this.aiTrebek) return;
        
        // Show the bubble with thinking indicator
        this.isActive = true;
        this.aiResponseBubble.classList.add('active');
        this.aiResponseText.textContent = '';
        this.showThinking();
        
        try {
            // Get response from AI Trebek
            const response = await this.aiTrebek.generateIncorrectResponse(question, playerAnswer, correctAnswer);
            
            // Hide thinking indicator and show the response
            this.hideThinking();
            
            // Store the full response for immediate completion if needed
            this.aiResponseBubble.setAttribute('data-full-response', response);
            
            // Show the response with typing animation
            this.showResponse(response);
        } catch (error) {
            console.error('Error generating incorrect answer response:', error);
            this.hideThinking();
            this.isActive = false;
            this.aiResponseBubble.classList.remove('active');
        }
    }
    
    /**
     * Comment on a streak of correct answers
     * @param {number} streakCount - The current streak count
     */
    async commentOnStreak(streakCount) {
        if (!this.aiTrebek || streakCount < 3) return; // Only comment on streaks of 3 or more
        
        // Show the bubble with thinking indicator
        this.isActive = true;
        this.aiResponseBubble.classList.add('active');
        this.aiResponseText.textContent = '';
        this.showThinking();
        
        try {
            // Get streak comment from AI Trebek
            const response = await this.aiTrebek.generateStreakComment(streakCount);
            
            // Hide thinking indicator and show the response
            this.hideThinking();
            
            // Store the full response for immediate completion if needed
            this.aiResponseBubble.setAttribute('data-full-response', response);
            
            // Show the response with typing animation
            this.showResponse(response);
        } catch (error) {
            console.error('Error generating streak comment:', error);
            this.hideThinking();
            this.isActive = false;
            this.aiResponseBubble.classList.remove('active');
        }
    }
    
    /**
     * Provide a hint for the current question
     * @param {string} question - The current question
     * @param {string} answer - The answer to the question
     */
    async provideHint(question, answer) {
        if (!this.aiTrebek) return;
        
        // Show the bubble with thinking indicator
        this.isActive = true;
        this.aiResponseBubble.classList.add('active');
        this.aiResponseText.textContent = '';
        this.showThinking();
        
        try {
            // Get hint from AI Trebek
            const hint = await this.aiTrebek.generateHint(question, answer);
            
            // Hide thinking indicator and show the response
            this.hideThinking();
            
            // Store the full response for immediate completion if needed
            this.aiResponseBubble.setAttribute('data-full-response', hint);
            
            // Show the response with typing animation and don't auto-hide (user needs time to read hint)
            this.showResponse(hint, true, false);
        } catch (error) {
            console.error('Error generating hint:', error);
            this.hideThinking();
            this.isActive = false;
            this.aiResponseBubble.classList.remove('active');
        }
    }
}

// Create a global instance
const aiTrebekUI = new AITrebekUI();

// Export for use in other modules
export default aiTrebekUI;

// Make available globally for browser use
window.aiTrebekUI = aiTrebekUI;

