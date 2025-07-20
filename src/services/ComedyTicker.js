/**
 * Comedy Ticker Service
 * Displays humorous scrolling messages based on game events
 */
import eventBus from '../utils/events.js';

class ComedyTicker {
    constructor() {
        this.messages = {};
        this.currentMessage = '';
        this.isInitialized = false;
        this.tickerElement = null;
        this.contentElement = null;
        this.messageQueue = [];
        this.isAnimating = false;
    }
    
    async init() {
        // Load messages from JSON
        await this.loadMessages();
        
        // Find ticker elements
        this.tickerElement = document.querySelector('.ticker-content');
        if (!this.tickerElement) {
            console.error('Ticker content element not found');
            return;
        }
        
        // Set up event listeners for game events
        this.setupEventListeners();
        
        // Show welcome message
        this.showRandomMessage('welcome');
        
        // Start random message timer
        this.startRandomMessageTimer();
        
        this.isInitialized = true;
        console.log('Comedy Ticker initialized');
    }
    
    async loadMessages() {
        try {
            const response = await fetch('ticker-messages.json');
            this.messages = await response.json();
            console.log('Ticker messages loaded:', Object.keys(this.messages).length, 'categories');
        } catch (error) {
            console.error('Failed to load ticker messages:', error);
            // Fallback messages
            this.messages = {
                positive: ["Great job!", "Well done!"],
                negative: ["Oops!", "Try again!"],
                random: ["Jeopardish is fun!", "Keep playing!"],
                streak: ["Nice streak!"],
                welcome: ["Welcome to Jeopardish!"]
            };
        }
    }
    
    setupEventListeners() {
        // Listen for game events
        eventBus.on('correctAnswer', () => {
            this.showRandomMessage('positive');
        });
        
        eventBus.on('incorrectAnswer', () => {
            this.showRandomMessage('negative');
        });

        eventBus.on('streakMilestone', (e) => {
            if (e.detail && e.detail.streak >= 3) {
                this.showRandomMessage('streak');
            }
        });

        eventBus.on('tickerMessage', (e) => {
            if (e.detail && e.detail.category) {
                this.showRandomMessage(e.detail.category);
            }
        });
    }
    
    showRandomMessage(category) {
        if (!this.messages[category]) {
            console.warn(`Unknown ticker category: ${category}`);
            return;
        }
        
        const messages = this.messages[category];
        const randomIndex = Math.floor(Math.random() * messages.length);
        const message = messages[randomIndex];
        
        this.displayMessage(message);
    }
    
    displayMessage(message) {
        if (!this.tickerElement) return;
        
        // Add to queue if currently animating
        if (this.isAnimating) {
            this.messageQueue.push(message);
            return;
        }
        
        this.currentMessage = message;
        this.tickerElement.textContent = message;
        
        // Reset animation by removing and re-adding the element
        const parent = this.tickerElement.parentNode;
        const newTicker = this.tickerElement.cloneNode(true);
        parent.replaceChild(newTicker, this.tickerElement);
        this.tickerElement = newTicker;
        
        // Mark as animating
        this.isAnimating = true;
        
        // Clear animation flag after animation completes (30s)
        setTimeout(() => {
            this.isAnimating = false;
            // Process queue if any
            if (this.messageQueue.length > 0) {
                const nextMessage = this.messageQueue.shift();
                this.displayMessage(nextMessage);
            }
        }, 30000);
        
        console.log(`Ticker: ${message}`);
    }
    
    startRandomMessageTimer() {
        // Show a random message every 45-90 seconds
        setInterval(() => {
            // Only show random message if not currently animating
            if (!this.isAnimating && Math.random() > 0.5) {
                this.showRandomMessage('random');
            }
        }, 45000 + Math.random() * 45000);
    }
    
    // Method to manually trigger a message
    trigger(category, message = null) {
        if (message) {
            this.displayMessage(message);
        } else {
            this.showRandomMessage(category);
        }
    }
    
    // Method to add custom messages at runtime
    addMessage(category, message) {
        if (!this.messages[category]) {
            this.messages[category] = [];
        }
        this.messages[category].push(message);
    }
}

export default ComedyTicker;
