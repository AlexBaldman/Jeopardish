/**
 * Gemini Game Integration
 * Connects the Gemini AI to game events and UI
 */

class GeminiGameIntegration {
    constructor() {
        this.trebek = window.enhancedGeminiTrebek;
        this.isEnabled = false;
        this.init();
    }
    
    async init() {
        // Wait for DOM ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupIntegration());
        } else {
            this.setupIntegration();
        }
    }
    
    setupIntegration() {
        // Add API key input to settings if not configured
        if (!this.trebek.isInitialized) {
            this.addApiKeySettings();
        } else {
            this.enableAIFeatures();
        }
    }
    
    /**
     * Add API key input to settings modal
     */
    addApiKeySettings() {
        const settingsModal = document.getElementById('settings-modal');
        if (!settingsModal) return;
        
        const modalBody = settingsModal.querySelector('.modal-body');
        if (!modalBody) return;
        
        // Create AI settings section
        const aiSection = document.createElement('div');
        aiSection.className = 'settings-section';
        aiSection.innerHTML = `
            <h3>AI Host Settings</h3>
            <div class="setting-item">
                <label for="gemini-api-key">Gemini API Key:</label>
                <input type="password" id="gemini-api-key" placeholder="Enter your API key">
                <button id="save-api-key" style="margin-left: 10px;">Save</button>
            </div>
            <div class="setting-item">
                <label for="ai-host-toggle">Enable AI Host:</label>
                <input type="checkbox" id="ai-host-toggle" ${this.isEnabled ? 'checked' : ''}>
            </div>
            <p style="font-size: 0.8em; color: #888; margin-top: 10px;">
                Get your free API key at <a href="https://makersuite.google.com/app/apikey" target="_blank" style="color: #ffd700;">Google AI Studio</a>
            </p>
        `;
        
        modalBody.appendChild(aiSection);
        
        // Add event listeners
        document.getElementById('save-api-key').addEventListener('click', () => {
            const apiKey = document.getElementById('gemini-api-key').value;
            if (apiKey) {
                this.trebek.setApiKey(apiKey);
                this.enableAIFeatures();
                alert('API key saved! AI features are now enabled.');
            }
        });
        
        document.getElementById('ai-host-toggle').addEventListener('change', (e) => {
            this.isEnabled = e.target.checked;
            localStorage.setItem('ai_host_enabled', this.isEnabled);
        });
    }
    
    /**
     * Enable AI features in the game
     */
    enableAIFeatures() {
        this.isEnabled = localStorage.getItem('ai_host_enabled') !== 'false';
        
        // Show greeting when game loads
        this.showAIGreeting();
        
        // Override question display to rewrite questions
        this.overrideQuestionDisplay();
        
        // Override response messages
        this.overrideResponseMessages();
        
        // Add AI ticker messages
        this.enhanceTickerMessages();
        
        console.log('Gemini AI features enabled!');
    }
    
    /**
     * Show AI greeting on game start
     */
    async showAIGreeting() {
        if (!this.isEnabled) return;
        
        const greeting = await this.trebek.generateGreeting();
        
        // Display in speech bubble temporarily
        const questionBox = document.getElementById('questionBox');
        if (questionBox) {
            questionBox.innerHTML = greeting;
            
            // Show AI response in bubble if available
            if (window.aiTrebekUI) {
                window.aiTrebekUI.displayResponse(greeting);
            }
        }
    }
    
    /**
     * Override question display to rewrite in Trebek's voice
     */
    overrideQuestionDisplay() {
        const originalDisplayQuestion = window.displayQuestion;
        
        window.displayQuestion = async (question) => {
            if (!this.isEnabled || !question) {
                // Use original function if AI is disabled
                if (originalDisplayQuestion) {
                    return originalDisplayQuestion.call(window, question);
                }
                return;
            }
            
            // Get question details
            const category = question.category?.title || 'General Knowledge';
            const value = question.value || 200;
            const originalText = question.question;
            
            // Rewrite question with AI
            const rewrittenQuestion = await this.trebek.rewriteQuestion(
                originalText,
                category,
                value
            );
            
            // Update question object with rewritten text
            const enhancedQuestion = {
                ...question,
                question: rewrittenQuestion,
                originalQuestion: originalText
            };
            
            // Call original display function with enhanced question
            if (originalDisplayQuestion) {
                originalDisplayQuestion.call(window, enhancedQuestion);
            }
            
            // Also display in AI bubble if available
            if (window.aiTrebekUI) {
                window.aiTrebekUI.displayResponse(rewrittenQuestion);
            }
        };
    }
    
    /**
     * Override response messages with AI-generated ones
     */
    overrideResponseMessages() {
        // Override correct answer message
        const originalCorrectMessage = window.displayCorrectAnswerMessage;
        window.displayCorrectAnswerMessage = async () => {
            if (!this.isEnabled) {
                if (originalCorrectMessage) {
                    return originalCorrectMessage.call(window);
                }
                return;
            }
            
            const streak = window.currentStreak || 0;
            const answer = window.currentQuestion?.answer || '';
            
            const aiResponse = await this.trebek.generateCorrectResponse(answer, streak);
            
            // Display AI response
            const questionBox = document.getElementById('questionBox');
            if (questionBox) {
                questionBox.innerHTML = aiResponse;
            }
            
            // Show in AI bubble
            if (window.aiTrebekUI) {
                window.aiTrebekUI.displayResponse(aiResponse);
            }
            
            // Clear other boxes
            const categoryBox = document.getElementById('categoryBox');
            const valueBox = document.getElementById('valueBox');
            const answerBox = document.getElementById('answerBox');
            
            if (categoryBox) categoryBox.innerHTML = '';
            if (valueBox) valueBox.innerHTML = '';
            if (answerBox) {
                answerBox.innerHTML = '';
                answerBox.style.display = 'flex';
            }
            
            window.showingMessage = true;
        };
        
        // Override incorrect answer message
        const originalIncorrectMessage = window.displayIncorrectAnswerMessage;
        window.displayIncorrectAnswerMessage = async (correctAnswer) => {
            if (!this.isEnabled) {
                if (originalIncorrectMessage) {
                    return originalIncorrectMessage.call(window, correctAnswer);
                }
                return;
            }
            
            const userAnswer = document.getElementById('inputBox')?.value || 'your answer';
            const aiResponse = await this.trebek.generateIncorrectResponse(userAnswer, correctAnswer);
            
            // Display AI response
            const questionBox = document.getElementById('questionBox');
            if (questionBox) {
                questionBox.innerHTML = aiResponse;
            }
            
            // Show in AI bubble
            if (window.aiTrebekUI) {
                window.aiTrebekUI.displayResponse(aiResponse);
            }
            
            // Clear other boxes
            const categoryBox = document.getElementById('categoryBox');
            const valueBox = document.getElementById('valueBox');
            const answerBox = document.getElementById('answerBox');
            
            if (categoryBox) categoryBox.innerHTML = '';
            if (valueBox) valueBox.innerHTML = '';
            if (answerBox) {
                answerBox.innerHTML = `The correct answer was: ${correctAnswer}`;
                answerBox.style.display = 'flex';
            }
            
            window.showingMessage = true;
        };
    }
    
    /**
     * Enhance ticker messages with AI-generated content
     */
    enhanceTickerMessages() {
        if (!window.comedyTicker) return;
        
        // Add AI message generation to ticker events
        document.addEventListener('correctAnswer', async () => {
            if (!this.isEnabled) return;
            
            const aiMessage = await this.trebek.generateTickerMessage('correct_answer', {
                streak: window.currentStreak || 0,
                score: window.currentScore || 0
            });
            
            if (aiMessage) {
                window.comedyTicker.displayMessage(aiMessage);
            }
        });
        
        document.addEventListener('incorrectAnswer', async () => {
            if (!this.isEnabled) return;
            
            const aiMessage = await this.trebek.generateTickerMessage('incorrect_answer', {
                answer: window.currentQuestion?.answer || ''
            });
            
            if (aiMessage) {
                window.comedyTicker.displayMessage(aiMessage);
            }
        });
    }
}

// Initialize the integration
window.geminiGameIntegration = new GeminiGameIntegration();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeminiGameIntegration;
}
