/**
 * Dialog Manager
 * Centralized system for managing all host dialog, messages, and AI interactions
 * 
 * Architecture:
 * - Unified message queue system
 * - Priority-based message handling
 * - AI integration hooks
 * - State-aware context management
 */

import { store } from '../state/store.js';
import { eventBus } from '../utils/events.js';

class DialogManager {
    constructor() {
        this.messageQueue = [];
        this.currentMessage = null;
        this.isProcessing = false;
        this.aiEnabled = false;
        this.conversationMode = false;
        this.messageHistory = [];
        
        // Dialog types with priorities
        this.dialogTypes = {
            CORRECT: { priority: 2, duration: 3000 },
            INCORRECT: { priority: 2, duration: 3500 },
            HINT: { priority: 3, duration: 2500 },
            TAUNT: { priority: 4, duration: 2000 },
            ENCOURAGEMENT: { priority: 4, duration: 2000 },
            CONVERSATION: { priority: 1, duration: null }, // No auto-dismiss
            SYSTEM: { priority: 5, duration: 2000 }
        };
        
        // Correct answer messages
        this.correctMessages = [
            "Correctamundo! You're on fire! 🔥",
            "Absolutely right! The crowd goes wild!",
            "Brilliant! Your brain is working overtime today!",
            "That's correct! You're making this look easy!",
            "Outstanding! Keep that streak alive!",
            "Nailed it! You're a trivia master!",
            "Spot on! I'm impressed!",
            "Yes! That's what I'm talking about!"
        ];
        
        // Incorrect answer messages
        this.incorrectMessages = [
            "Oh, so close! But not quite right.",
            "Not this time, but don't give up!",
            "Incorrect, but a valiant effort!",
            "That's not it, but keep trying!",
            "Wrong answer, but you're learning!",
            "Nope! But hey, nobody's perfect!",
            "Not quite! The correct answer was a bit trickier.",
            "Sorry, that's incorrect. Better luck next time!"
        ];
        
        // Streak messages
        this.streakMessages = {
            5: "Five in a row! You're on a roll! 🎲",
            10: "TEN CORRECT! You're unstoppable! 🚀",
            15: "FIFTEEN! Are you cheating? (Just kidding!) 🏆",
            20: "TWENTY IN A ROW! Call the Hall of Fame! 🌟",
            25: "25 STREAK! You're a LEGEND! 👑"
        };
        
        // Taunt messages for idle time
        this.tauntMessages = [
            "Cat got your tongue? 🐱",
            "The clock is ticking... ⏰",
            "Need a hint? Just kidding, figure it out! 😏",
            "I've seen glaciers move faster! 🧊",
            "Take your time... I'm just a host, standing here... 🎤",
            "Did you fall asleep? 😴",
            "The answer won't type itself! ⌨️"
        ];
    }

    init() {
        this.setupEventListeners();
        this.checkAIAvailability();
        console.log('🎭 Dialog Manager initialized');
    }

    setupEventListeners() {
        // Game events
        eventBus.on('answer:correct', (event) => this.handleCorrectAnswer(event.detail));
        eventBus.on('answer:incorrect', (event) => this.handleIncorrectAnswer(event.detail));
        eventBus.on('streak:milestone', (event) => this.handleStreakMilestone(event.detail));
        eventBus.on('game:idle', () => this.handleIdlePlayer());
        
        // AI conversation events
        eventBus.on('conversation:start', () => this.startConversation());
        eventBus.on('conversation:end', () => this.endConversation());
        eventBus.on('conversation:message', (event) => this.handleConversationMessage(event.detail));
        
        // UI events
        eventBus.on('dialog:dismiss', () => this.dismissCurrentMessage());
    }

    checkAIAvailability() {
        // Check if AI services are available
        this.aiEnabled = window.geminiGameIntegration?.isEnabled || false;
        if (this.aiEnabled) {
            console.log('🤖 AI services detected and enabled');
        }
    }

    // Message Queue Management
    queueMessage(type, content, options = {}) {
        const message = {
            id: Date.now() + Math.random(),
            type,
            content,
            priority: this.dialogTypes[type]?.priority || 5,
            duration: options.duration || this.dialogTypes[type]?.duration,
            callback: options.callback,
            animate: options.animate !== false,
            ...options
        };
        
        this.messageQueue.push(message);
        this.messageQueue.sort((a, b) => a.priority - b.priority);
        
        if (!this.isProcessing) {
            this.processNextMessage();
        }
    }

    async processNextMessage() {
        if (this.messageQueue.length === 0) {
            this.isProcessing = false;
            return;
        }
        
        this.isProcessing = true;
        const message = this.messageQueue.shift();
        this.currentMessage = message;
        
        await this.displayMessage(message);
        
        // Auto-dismiss if duration is set
        if (message.duration && !this.conversationMode) {
            setTimeout(() => {
                this.dismissCurrentMessage();
            }, message.duration);
        }
    }

    async displayMessage(message) {
        const elements = this.getDialogElements();
        if (!elements.speechBubble) return;
        
        // Clear previous content
        this.clearDialogElements();
        
        // Add to history
        this.messageHistory.push({
            timestamp: Date.now(),
            ...message
        });
        
        // Display based on message type
        if (message.type === 'CONVERSATION') {
            await this.displayConversationMessage(message);
        } else {
            await this.displayGameMessage(message);
        }
        
        // Trigger animations
        if (message.animate) {
            this.animateMessage(message);
        }
        
        // Emit event for other systems
        eventBus.emit('dialog:displayed', message);
    }

    async displayGameMessage(message) {
        const elements = this.getDialogElements();
        
        // Main message
        if (elements.questionBox) {
            elements.questionBox.innerHTML = message.content;
            elements.questionBox.classList.add('dialog-message', `dialog-${message.type.toLowerCase()}`);
        }
        
        // Additional info (like correct answer)
        if (message.additionalInfo && elements.answerBox) {
            elements.answerBox.innerHTML = message.additionalInfo;
            elements.answerBox.style.display = 'block';
        }
        
        // Update speech bubble state
        elements.speechBubble.classList.add('showing-message');
        elements.speechBubble.dataset.messageType = message.type;
    }

    async displayConversationMessage(message) {
        const elements = this.getDialogElements();
        
        // Create conversation UI if needed
        if (!document.querySelector('.conversation-ui')) {
            this.createConversationUI();
        }
        
        // Add message to conversation
        const conversationContainer = document.querySelector('.conversation-messages');
        const messageEl = document.createElement('div');
        messageEl.className = `conversation-message ${message.sender || 'host'}`;
        messageEl.innerHTML = `
            <div class="message-content">${message.content}</div>
            <div class="message-time">${new Date().toLocaleTimeString()}</div>
        `;
        conversationContainer.appendChild(messageEl);
        
        // Scroll to bottom
        conversationContainer.scrollTop = conversationContainer.scrollHeight;
    }

    // Game Event Handlers
    handleCorrectAnswer(data) {
        const message = this.getRandomMessage(this.correctMessages);
        const streak = store.getState().game.streak;
        
        // Check for streak milestone
        if (this.streakMessages[streak]) {
            this.queueMessage('CORRECT', this.streakMessages[streak], {
                animate: true,
                sound: 'milestone'
            });
        } else {
            this.queueMessage('CORRECT', message, {
                animate: true,
                sound: 'correct'
            });
        }
        
        // Trigger host animation
        eventBus.emit('host:animate', { type: 'celebrate' });
    }

    handleIncorrectAnswer(data) {
        const message = this.getRandomMessage(this.incorrectMessages);
        
        this.queueMessage('INCORRECT', message, {
            additionalInfo: `The correct answer was: ${data.correctAnswer}`,
            animate: true,
            sound: 'incorrect'
        });
        
        // Trigger host animation
        eventBus.emit('host:animate', { type: 'disappointed' });
    }

    handleStreakMilestone(data) {
        const milestone = data.streak;
        if (this.streakMessages[milestone]) {
            this.queueMessage('ENCOURAGEMENT', this.streakMessages[milestone], {
                priority: 1, // High priority
                animate: true,
                sound: 'fanfare'
            });
        }
    }

    handleIdlePlayer() {
        const message = this.getRandomMessage(this.tauntMessages);
        this.queueMessage('TAUNT', message, {
            animate: true,
            sound: 'taunt'
        });
    }

    // Conversation Mode
    async startConversation() {
        this.conversationMode = true;
        
        // Pause the game
        eventBus.emit('game:pause');
        
        // Create conversation UI
        this.createConversationUI();
        
        // Initial greeting
        const greeting = this.aiEnabled ? 
            "Hello! I'm your host. What would you like to know? I can tell you more about the last question, share some trivia, or just chat!" :
            "Let's have a chat! What's on your mind?";
            
        this.queueMessage('CONVERSATION', greeting, {
            sender: 'host'
        });
    }

    async handleConversationMessage(data) {
        const userMessage = data.message;
        
        // Add user message to conversation
        this.queueMessage('CONVERSATION', userMessage, {
            sender: 'user',
            animate: false
        });
        
        // Process with AI if available
        if (this.aiEnabled && window.geminiGameIntegration) {
            try {
                // Show typing indicator
                this.showTypingIndicator();
                
                // Get AI response
                const response = await window.geminiGameIntegration.getConversationalResponse(
                    userMessage,
                    this.getConversationContext()
                );
                
                // Hide typing indicator
                this.hideTypingIndicator();
                
                // Display AI response
                this.queueMessage('CONVERSATION', response, {
                    sender: 'host',
                    animate: true
                });
            } catch (error) {
                console.error('AI conversation error:', error);
                this.queueMessage('CONVERSATION', 
                    "I'm having trouble thinking right now. Let me just say - that's a great question!", {
                    sender: 'host'
                });
            }
        } else {
            // Fallback responses without AI
            const fallbackResponses = [
                "That's an interesting point! Tell me more.",
                "I see what you mean. Have you considered another angle?",
                "Fascinating! You know, that reminds me of a similar question we had earlier.",
                "Great observation! Want to try another question?",
                "You're really thinking deeply about this. I like that!"
            ];
            
            this.queueMessage('CONVERSATION', 
                this.getRandomMessage(fallbackResponses), {
                sender: 'host',
                animate: true
            });
        }
    }

    endConversation() {
        this.conversationMode = false;
        
        // Remove conversation UI
        const conversationUI = document.querySelector('.conversation-ui');
        if (conversationUI) {
            conversationUI.classList.add('closing');
            setTimeout(() => conversationUI.remove(), 300);
        }
        
        // Resume game
        eventBus.emit('game:resume');
        
        // Farewell message
        this.queueMessage('SYSTEM', "Back to the game! Ready for your next question?", {
            duration: 2000
        });
    }

    // UI Creation
    createConversationUI() {
        const container = document.createElement('div');
        container.className = 'conversation-ui';
        container.innerHTML = `
            <div class="conversation-header">
                <h3>Chat with your Host</h3>
                <button class="conversation-close" aria-label="End conversation">×</button>
            </div>
            <div class="conversation-messages"></div>
            <div class="conversation-input">
                <input type="text" 
                       placeholder="Ask me anything..." 
                       class="conversation-input-field">
                <button class="conversation-send">Send</button>
            </div>
            <div class="conversation-suggestions">
                <button class="suggestion-chip">Tell me more about that answer</button>
                <button class="suggestion-chip">Give me a hint for the next one</button>
                <button class="suggestion-chip">Share a fun fact</button>
            </div>
        `;
        
        // Add to speech bubble or modal
        const speechBubble = document.querySelector('.speechBubble');
        if (speechBubble) {
            speechBubble.appendChild(container);
        }
        
        // Set up event handlers
        this.setupConversationHandlers(container);
    }

    setupConversationHandlers(container) {
        const input = container.querySelector('.conversation-input-field');
        const sendBtn = container.querySelector('.conversation-send');
        const closeBtn = container.querySelector('.conversation-close');
        const suggestions = container.querySelectorAll('.suggestion-chip');
        
        // Send message
        const sendMessage = () => {
            const message = input.value.trim();
            if (message) {
                eventBus.emit('conversation:message', { message });
                input.value = '';
            }
        };
        
        sendBtn.addEventListener('click', sendMessage);
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') sendMessage();
        });
        
        // Close conversation
        closeBtn.addEventListener('click', () => {
            eventBus.emit('conversation:end');
        });
        
        // Suggestion chips
        suggestions.forEach(chip => {
            chip.addEventListener('click', () => {
                eventBus.emit('conversation:message', { 
                    message: chip.textContent 
                });
            });
        });
    }

    // Helper Methods
    getDialogElements() {
        return {
            speechBubble: document.getElementById('speechBubble'),
            categoryBox: document.getElementById('categoryBox'),
            valueBox: document.getElementById('valueBox'),
            questionBox: document.getElementById('questionBox'),
            answerBox: document.getElementById('answerBox')
        };
    }

    clearDialogElements() {
        const elements = this.getDialogElements();
        if (elements.categoryBox) elements.categoryBox.innerHTML = '';
        if (elements.valueBox) elements.valueBox.innerHTML = '';
        // Don't clear question/answer boxes if in conversation mode
        if (!this.conversationMode) {
            if (elements.questionBox) {
                elements.questionBox.classList.remove('dialog-message', 
                    'dialog-correct', 'dialog-incorrect', 'dialog-hint', 
                    'dialog-taunt', 'dialog-encouragement');
            }
            if (elements.answerBox) elements.answerBox.style.display = 'none';
        }
    }

    animateMessage(message) {
        const elements = this.getDialogElements();
        if (!elements.speechBubble) return;
        
        // Add animation class
        elements.speechBubble.classList.add('message-animate');
        
        // Remove after animation
        setTimeout(() => {
            elements.speechBubble.classList.remove('message-animate');
        }, 500);
    }

    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'typing-indicator';
        indicator.innerHTML = '<span></span><span></span><span></span>';
        
        const messagesContainer = document.querySelector('.conversation-messages');
        if (messagesContainer) {
            messagesContainer.appendChild(indicator);
            messagesContainer.scrollTop = messagesContainer.scrollHeight;
        }
    }

    hideTypingIndicator() {
        const indicator = document.querySelector('.typing-indicator');
        if (indicator) indicator.remove();
    }

    getConversationContext() {
        const state = store.getState();
        const recentMessages = this.messageHistory.slice(-10);
        
        return {
            currentQuestion: state.game.currentQuestion,
            score: state.game.score,
            streak: state.game.streak,
            recentMessages,
            gameMode: state.game.mode,
            difficulty: state.game.difficulty
        };
    }

    dismissCurrentMessage() {
        if (this.currentMessage && !this.conversationMode) {
            this.currentMessage = null;
            this.processNextMessage();
        }
    }

    getRandomMessage(messages) {
        return messages[Math.floor(Math.random() * messages.length)];
    }
}

// Create singleton instance
const dialogManager = new DialogManager();
export default dialogManager;
