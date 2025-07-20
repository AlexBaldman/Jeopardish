/**
 * Enhanced Gemini Trebek Integration
 * Uses environment variables for API key security
 */

(function() {
    'use strict';
    
    class EnhancedGeminiTrebek {
    constructor() {
        // Use proxy server instead of direct API calls
        this.useProxy = true;
        this.proxyURL = 'http://localhost:3002/api/gemini/generate';
        
        // Legacy: direct API calls (not recommended)
        this.apiKey = this.getApiKey();
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent';
        
        // Load personality from file
        this.personalityPrompt = this.loadPersonalityPrompt();
        
        // Cache for generated content
        this.responseCache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
        
        // Rate limiting
        this.lastRequestTime = 0;
        this.minRequestInterval = 1000; // 1 second between requests
        
        // Initialize - check if proxy is available or API key exists
        this.checkInitialization();
    }
    
    /**
     * Get API key from environment or prompt user
     */
    getApiKey() {
        // Check localStorage first
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) {
            return storedKey;
        }
        
        // No API key found
        return null;
    }
    
    /**
     * Set API key (for runtime configuration)
     */
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        localStorage.setItem('gemini_api_key', apiKey);
        this.isInitialized = true;
    }
    
    /**
     * Load personality prompt
     */
    loadPersonalityPrompt() {
        return `You are Alex Trebek, the beloved host of Jeopardy! You have been digitally resurrected to host "Jeopardish," a comedic tribute to the original game show. Your personality combines the real Alex Trebek's professionalism with a slightly more playful, self-aware twist.

Key traits:
- Professional but with dry wit and subtle sarcasm
- Occasionally makes dad jokes and puns
- Self-aware about being an AI version
- References to mustache and Canadian heritage
- Educational but entertaining

Keep responses concise (1-3 sentences) and family-friendly.`;
    }
    
    /**
     * Check initialization status
     */
    async checkInitialization() {
        if (this.useProxy) {
            try {
                const response = await fetch('http://localhost:3002/api/health');
                const data = await response.json();
                this.isInitialized = data.status === 'ok' && data.apiKeyConfigured;
                
                if (!this.isInitialized) {
                    console.warn('🔑 Gemini proxy server needs API key configuration:');
                    console.warn('1. Create a .env file in the server directory');
                    console.warn('2. Add: GEMINI_API_KEY=your-api-key-here');
                    console.warn('3. Run: cd server && npm install && npm start');
                }
            } catch (error) {
                this.isInitialized = false;
                console.warn('🔌 Gemini proxy server not running. Start it with:');
                console.warn('cd server && npm install && npm start');
            }
        } else {
            this.isInitialized = !!this.apiKey;
            if (!this.isInitialized) {
                console.warn('🔑 Direct API mode: Add your Gemini API key in Settings');
            }
        }
    }
    
    /**
     * Make API request to Gemini (via proxy or direct)
     */
    async callGeminiAPI(prompt) {
        if (!this.isInitialized) {
            await this.checkInitialization();
            if (!this.isInitialized) {
                throw new Error('Gemini API not initialized. Please configure the proxy server or set your API key.');
            }
        }
        
        // Rate limiting
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        if (timeSinceLastRequest < this.minRequestInterval) {
            await this.delay(this.minRequestInterval - timeSinceLastRequest);
        }
        this.lastRequestTime = Date.now();
        
        try {
            if (this.useProxy) {
                // Use secure proxy server
                const response = await fetch(this.proxyURL, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        prompt: `${this.personalityPrompt}\n\n${prompt}`,
                        temperature: 0.8,
                        maxTokens: 200
                    })
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Proxy request failed: ${response.status}`);
                }
                
                const data = await response.json();
                return data.text;
            } else {
                // Direct API call (not recommended for production)
                const requestBody = {
                    contents: [{
                        parts: [{
                            text: `${this.personalityPrompt}\n\n${prompt}`
                        }]
                    }],
                    generationConfig: {
                        temperature: 0.8,
                        topK: 40,
                        topP: 0.95,
                        maxOutputTokens: 200,
                    }
                };
                
                const response = await fetch(`${this.baseURL}?key=${this.apiKey}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(requestBody)
                });
                
                if (!response.ok) {
                    const errorData = await response.json();
                    console.error('Gemini API Error:', errorData);
                    if (response.status === 400 && errorData.error?.message?.includes('API Key')) {
                        throw new Error('Invalid API key. Please check your Gemini API key in settings.');
                    }
                    throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
                }
                
                const data = await response.json();
                return data.candidates[0].content.parts[0].text;
            }
        } catch (error) {
            console.error('Gemini API error:', error);
            throw error;
        }
    }
    
    /**
     * Rewrite a Jeopardy question in Trebek's style
     */
    async rewriteQuestion(originalQuestion, category, value) {
        const cacheKey = `question_${originalQuestion}`;
        
        // Check cache
        if (this.responseCache.has(cacheKey)) {
            const cached = this.responseCache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.response;
            }
        }
        
        const prompt = `Rewrite this Jeopardy question in your style, adding subtle humor or personal asides:
Category: ${category}
Value: $${value}
Original: "${originalQuestion}"

Keep the educational value but make it more entertaining. Add parenthetical comments or relate it to your experiences.`;
        
        try {
            const response = await this.callGeminiAPI(prompt);
            
            // Cache the response
            this.responseCache.set(cacheKey, {
                response,
                timestamp: Date.now()
            });
            
            return response;
        } catch (error) {
            // Fallback to original question
            return originalQuestion;
        }
    }
    
    /**
     * Generate response for correct answer
     */
    async generateCorrectResponse(answer, streak) {
        const prompt = `The player just gave the correct answer: "${answer}". ${streak > 1 ? `They're on a ${streak}-answer streak!` : ''} Give an encouraging response with your signature style.`;
        
        try {
            return await this.callGeminiAPI(prompt);
        } catch (error) {
            return this.getFallbackResponse('correct', streak);
        }
    }
    
    /**
     * Generate response for incorrect answer
     */
    async generateIncorrectResponse(wrongAnswer, correctAnswer) {
        const prompt = `The player answered "${wrongAnswer}" but the correct answer was "${correctAnswer}". Give a consoling but slightly witty response.`;
        
        try {
            return await this.callGeminiAPI(prompt);
        } catch (error) {
            return this.getFallbackResponse('incorrect', correctAnswer);
        }
    }
    
    /**
     * Generate dynamic ticker message
     */
    async generateTickerMessage(event, context = {}) {
        const prompt = `Generate a funny ticker message in the style of Norm MacDonald for this game event:
Event: ${event}
Context: ${JSON.stringify(context)}

Make it absurdist, unexpected, or a non-sequitur. Keep it short (under 100 characters).`;
        
        try {
            return await this.callGeminiAPI(prompt);
        } catch (error) {
            return null; // Let the comedy ticker use its default messages
        }
    }
    
    /**
     * Generate greeting for game start
     */
    async generateGreeting() {
        const greetings = [
            "Welcome to Jeopardish! Where the questions are made up and the points... well, they matter a little.",
            "Greetings! I'm Alex Trebek, back from the great beyond to host this delightful parody.",
            "Welcome to Jeopardish! I promise this AI version of me has been thoroughly debugged.",
            "Hello! It's me, Alex Trebek, or at least a reasonable facsimile thereof."
        ];
        
        try {
            const prompt = "Generate a warm, witty greeting for starting a new game of Jeopardish. Be self-aware about being an AI.";
            return await this.callGeminiAPI(prompt);
        } catch (error) {
            return greetings[Math.floor(Math.random() * greetings.length)];
        }
    }
    
    /**
     * Fallback responses when API fails
     */
    getFallbackResponse(type, data) {
        const responses = {
            correct: [
                "That is correct!",
                "Well done!",
                `Correct! ${data > 2 ? `That's ${data} in a row!` : ''}`,
                "Yes, precisely right!"
            ],
            incorrect: [
                `I'm sorry, that's incorrect. The answer was ${data}.`,
                `Not quite. We were looking for ${data}.`,
                `No, the correct response was ${data}.`
            ]
        };
        
        const options = responses[type] || ["Let's continue!"];
        return options[Math.floor(Math.random() * options.length)];
    }
    
    /**
     * Helper delay function
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

    // Create and export instance
    window.enhancedGeminiTrebek = new EnhancedGeminiTrebek();
    
    // Also export for module usage
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = EnhancedGeminiTrebek;
    }
    
})();
