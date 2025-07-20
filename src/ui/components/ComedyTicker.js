import Component from './Component.js';
import eventBus from '../../utils/eventBus.js';
import { createElement } from '../../utils/domHelpers.js';

/**
 * Comedy Ticker Component
 * Displays scrolling humorous messages during gameplay
 */
export default class ComedyTicker extends Component {
    constructor() {
        super();
        
        this.state = {
            messages: [],
            isActive: false,
            currentMessage: null
        };
        
        this.randomMessages = [
            "Breaking: Contestant mistakes daily double for coffee order",
            "Study shows 73% of wrong answers involve confident shouting",
            "Local genius forgets to phrase answer as question, loses everything",
            "Scientists discover perfect Jeopardy strategy: Actually knowing things",
            "Weather update: 100% chance of feeling dumb about geography questions",
            "Sports news: Viewers nationwide yell at screens, contestants unmoved",
            "Breaking: Art history continues to baffle everyone except that one guy",
            "Update: Shakespeare questions remain everyone's daily double nightmare"
        ];
        
        this.messageQueue = [];
        this.animationTimer = null;
        this.randomTimer = null;
    }

    render() {
        const { isActive, currentMessage } = this.state;
        
        return createElement('div', {
            className: `comedy-ticker ${isActive ? 'active' : ''}`
        }, [
            createElement('div', { className: 'ticker-content' }, [
                currentMessage && createElement('span', {
                    className: 'ticker-message',
                    ref: 'message'
                }, currentMessage)
            ])
        ]);
    }

    mount() {
        super.mount();
        this.setupEventListeners();
        this.startRandomMessages();
    }

    unmount() {
        this.stopAllTimers();
        super.unmount();
    }

    setupEventListeners() {
        // Game events that trigger special messages
        eventBus.on('answer:correct', () => {
            this.addMessage("Correct! The crowd goes mild!");
        });
        
        eventBus.on('answer:incorrect', () => {
            this.addMessage("Wrong answer! But you tried, and that's what counts.");
        });
        
        eventBus.on('game:dailyDouble', () => {
            this.addMessage("DAILY DOUBLE! Time to bet it all and immediately regret it!");
        });
        
        eventBus.on('game:finalJeopardy', () => {
            this.addMessage("Final Jeopardy! Where confident people become humble.");
        });
        
        // UI events
        eventBus.on('ticker:addMessage', (message) => {
            this.addMessage(message);
        });
        
        eventBus.on('ticker:stop', () => {
            this.stopAllTimers();
        });
        
        eventBus.on('ticker:start', () => {
            this.startRandomMessages();
        });
    }

    addMessage(message) {
        this.messageQueue.push(message);
        if (!this.state.isActive) {
            this.showNextMessage();
        }
    }

    showNextMessage() {
        if (this.messageQueue.length === 0) {
            this.setState({ isActive: false, currentMessage: null });
            return;
        }
        
        const message = this.messageQueue.shift();
        this.setState({ isActive: true, currentMessage: message });
        
        // Start scrolling animation
        if (this.refs.message) {
            const messageEl = this.refs.message;
            const tickerWidth = this.element.offsetWidth;
            const messageWidth = messageEl.offsetWidth;
            
            // Reset position
            messageEl.style.transform = `translateX(${tickerWidth}px)`;
            
            // Animate across screen
            const duration = (tickerWidth + messageWidth) * 10; // Adjust speed here
            messageEl.style.transition = `transform ${duration}ms linear`;
            
            // Force reflow
            messageEl.offsetHeight;
            
            // Start animation
            messageEl.style.transform = `translateX(-${messageWidth}px)`;
            
            // Queue next message
            this.animationTimer = setTimeout(() => {
                this.showNextMessage();
            }, duration);
        }
    }

    startRandomMessages() {
        // Show a random message every 30-60 seconds
        const showRandomMessage = () => {
            const randomIndex = Math.floor(Math.random() * this.randomMessages.length);
            this.addMessage(this.randomMessages[randomIndex]);
            
            // Schedule next random message
            const delay = 30000 + Math.random() * 30000; // 30-60 seconds
            this.randomTimer = setTimeout(showRandomMessage, delay);
        };
        
        // Start after initial delay
        this.randomTimer = setTimeout(showRandomMessage, 15000);
    }

    stopAllTimers() {
        if (this.animationTimer) {
            clearTimeout(this.animationTimer);
            this.animationTimer = null;
        }
        
        if (this.randomTimer) {
            clearTimeout(this.randomTimer);
            this.randomTimer = null;
        }
        
        this.messageQueue = [];
        this.setState({ isActive: false, currentMessage: null });
    }
}
