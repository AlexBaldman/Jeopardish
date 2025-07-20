/**
 * Browser-Compatible Gemini Trebek Integration
 * Works with proxy server or direct browser API
 */

export class BrowserGeminiTrebek {
    constructor() {
        // Configuration
        this.config = {
            useProxy: true, // Prefer proxy for security
            proxyURL: 'http://localhost:3002/api/gemini',
            directAPIKey: null, // Only for development/testing
            personality: this.getPersonalityPrompt()
        };
        
        // State
        this.isInitialized = false;
        this.responseCache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
        
        // Rate limiting
        this.lastRequestTime = 0;
        this.minRequestInterval = 1000; // 1 second
        
        // Initialize on construction
        this.init();
    }
    
    async init() {
        await this.checkConnection();
        
        // If proxy not available, check for direct API key
        if (!this.isInitialized && !this.config.useProxy) {
            const storedKey = localStorage.getItem('gemini_api_key');
            if (storedKey) {
                await this.initDirectAPI(storedKey);
            }
        }
    }
    
    /**
     * Check proxy server connection
     */
    async checkConnection() {
        if (!this.config.useProxy) return;
        
        try {
            const response = await fetch(`${this.config.proxyURL}/health`);
            const data = await response.json();
            
            if (data.status === 'ok' && data.apiKeyConfigured) {
                this.isInitialized = true;
                console.log('✅ Connected to Gemini proxy server');
            } else {
                console.warn('⚠️ Proxy server needs API key configuration');
                this.showSetupInstructions();
            }
        } catch (error) {
            console.warn('❌ Proxy server not running');
            this.showSetupInstructions();
            this.config.useProxy = false;
        }
    }
    
    /**
     * Initialize direct browser API (for development only)
     */
    async initDirectAPI(apiKey) {
        try {
            // Dynamically import the browser SDK
            const { GoogleGenerativeAI } = await import('@google/generative-ai');
            this.genAI = new GoogleGenerativeAI(apiKey);
            this.model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });
            this.config.directAPIKey = apiKey;
            this.isInitialized = true;
            console.log('✅ Direct API initialized (development mode)');
        } catch (error) {
            console.error('Failed to initialize direct API:', error);
        }
    }
    
    /**
     * Show setup instructions
     */
    showSetupInstructions() {
        console.log(`
🤖 Gemini AI Setup Instructions:
================================
1. Navigate to the server directory: cd server
2. Create a .env file with your API key:
   echo "GEMINI_API_KEY=your-api-key-here" > .env
3. Start the proxy server: npm start
4. Get a free API key at: https://makersuite.google.com/app/apikey

For development, you can also use direct API mode in Settings.
        `);
    }
    
    /**
     * Get personality prompt
     */
    getPersonalityPrompt() {
        return `You are Alex Trebek, the beloved host of Jeopardy! Your personality combines professionalism with dry wit and subtle humor. You occasionally make dad jokes and are self-aware about being an AI version. Keep responses concise (1-3 sentences) and family-friendly.`;
    }
    
    /**
     * Generate content using Gemini
     */
    async generate(prompt, options = {}) {
        if (!this.isInitialized) {
            throw new Error('Gemini API not initialized');
        }
        
        // Check cache
        const cacheKey = `${prompt}_${JSON.stringify(options)}`;
        const cached = this.getCached(cacheKey);
        if (cached) return cached;
        
        // Rate limiting
        await this.enforceRateLimit();
        
        try {
            let response;
            
            if (this.config.useProxy) {
                // Use proxy server
                response = await this.callProxy(prompt, options);
            } else {
                // Use direct API
                response = await this.callDirect(prompt, options);
            }
            
            // Cache the response
            this.cache(cacheKey, response);
            
            return response;
        } catch (error) {
            console.error('Generation error:', error);
            // Return a fallback response
            return this.getFallbackResponse(prompt);
        }
    }
    
    /**
     * Call proxy server
     */
    async callProxy(prompt, options) {
        const response = await fetch(`${this.config.proxyURL}/generate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt: `${this.config.personality}\n\n${prompt}`,
                temperature: options.temperature || 0.8,
                maxTokens: options.maxTokens || 200
            })
        });
        
        if (!response.ok) {
            throw new Error(`Proxy error: ${response.status}`);
        }
        
        const data = await response.json();
        return data.text;
    }
    
    /**
     * Call direct API (browser)
     */
    async callDirect(prompt, options) {
        const result = await this.model.generateContent({
            contents: [{
                parts: [{
                    text: `${this.config.personality}\n\n${prompt}`
                }]
            }],
            generationConfig: {
                temperature: options.temperature || 0.8,
                maxOutputTokens: options.maxTokens || 200,
                topK: 40,
                topP: 0.95,
            }
        });
        
        const response = await result.response;
        return response.text();
    }
    
    /**
     * Rate limiting
     */
    async enforceRateLimit() {
        const now = Date.now();
        const timeSince = now - this.lastRequestTime;
        if (timeSince < this.minRequestInterval) {
            await new Promise(resolve => 
                setTimeout(resolve, this.minRequestInterval - timeSince)
            );
        }
        this.lastRequestTime = Date.now();
    }
    
    /**
     * Cache management
     */
    cache(key, value) {
        this.responseCache.set(key, {
            value,
            timestamp: Date.now()
        });
    }
    
    getCached(key) {
        const cached = this.responseCache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            return cached.value;
        }
        return null;
    }
    
    /**
     * Fallback responses when API is unavailable
     */
    getFallbackResponse(prompt) {
        const fallbacks = [
            "Well, that's an interesting question!",
            "Let me think about that for a moment...",
            "Ah, a classic Jeopardy moment!",
            "My mustache and I are pondering this one.",
            "As they say in Canada, that's a tough one, eh?"
        ];
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }
    
    // Specific methods for game integration
    
    /**
     * Generate a greeting
     */
    async generateGreeting() {
        return this.generate(
            "Generate a warm greeting for Jeopardish players. Mention that you're the AI version of Alex Trebek."
        );
    }
    
    /**
     * Rewrite a question in Trebek's style
     */
    async rewriteQuestion(question, category, value) {
        return this.generate(
            `Rewrite this Jeopardy question with subtle humor:\nCategory: ${category}\nValue: $${value}\nQuestion: ${question}`
        );
    }
    
    /**
     * Generate a response to correct answer
     */
    async respondToCorrect(answer, score) {
        return this.generate(
            `The contestant got the correct answer: "${answer}". Their score is now $${score}. Give an encouraging response.`
        );
    }
    
    /**
     * Generate a response to incorrect answer
     */
    async respondToIncorrect(userAnswer, correctAnswer) {
        return this.generate(
            `The contestant answered "${userAnswer}" but the correct answer was "${correctAnswer}". Give a gentle, encouraging response.`
        );
    }
    
    /**
     * Generate a witty comment
     */
    async generateComment(context) {
        return this.generate(
            `Make a brief, witty comment about: ${context}`
        );
    }
}

// Create singleton instance
export const geminiTrebek = new BrowserGeminiTrebek();

// Make it available globally for legacy code
window.browserGeminiTrebek = geminiTrebek;
