/**
 * Multi-Provider AI Integration for Jeopardish
 * Supports multiple AI providers with automatic fallback
 */

class MultiAIProvider {
    constructor() {
        // Provider configurations
        this.providers = {
            gemini: {
                name: 'Google Gemini',
                endpoint: 'http://localhost:3002/api/gemini/generate',
                healthEndpoint: 'http://localhost:3002/api/health',
                priority: 1,
                enabled: true,
                rateLimit: { requests: 60, window: 60000 }, // 60 req/min
            },
            huggingface: {
                name: 'Hugging Face',
                endpoint: 'http://localhost:3003/api/huggingface/generate',
                healthEndpoint: 'http://localhost:3003/api/health',
                priority: 2,
                enabled: true,
                rateLimit: { requests: 100, window: 3600000 }, // 100 req/hour
            },
            cohere: {
                name: 'Cohere',
                endpoint: 'http://localhost:3004/api/cohere/generate',
                healthEndpoint: 'http://localhost:3004/api/health',
                priority: 3,
                enabled: false, // Enable when proxy is set up
                rateLimit: { requests: 100, window: 60000 }, // 100 req/min
            }
        };
        
        // Current provider selection
        this.currentProvider = 'gemini';
        this.lastHealthCheck = new Map();
        this.providerHealth = new Map();
        this.requestCounts = new Map();
        
        // Cache configuration
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
        
        // Initialize
        this.init();
    }
    
    async init() {
        // Check health of all providers
        await this.checkAllProviders();
        
        // Select best available provider
        this.selectBestProvider();
        
        // Schedule periodic health checks
        setInterval(() => this.checkAllProviders(), 60000); // Every minute
    }
    
    /**
     * Check health of all providers
     */
    async checkAllProviders() {
        const checks = Object.entries(this.providers).map(async ([key, provider]) => {
            if (!provider.enabled) return;
            
            try {
                const response = await fetch(provider.healthEndpoint);
                const data = await response.json();
                
                this.providerHealth.set(key, {
                    status: response.ok && data.status === 'ok',
                    apiKeyConfigured: data.apiKeyConfigured,
                    lastCheck: Date.now()
                });
            } catch (error) {
                this.providerHealth.set(key, {
                    status: false,
                    error: error.message,
                    lastCheck: Date.now()
                });
            }
        });
        
        await Promise.all(checks);
    }
    
    /**
     * Select the best available provider
     */
    selectBestProvider() {
        const availableProviders = Object.entries(this.providers)
            .filter(([key, provider]) => {
                const health = this.providerHealth.get(key);
                return provider.enabled && health?.status && health?.apiKeyConfigured;
            })
            .sort((a, b) => a[1].priority - b[1].priority);
        
        if (availableProviders.length > 0) {
            this.currentProvider = availableProviders[0][0];
            console.log(`Selected AI provider: ${this.providers[this.currentProvider].name}`);
        } else {
            console.warn('No AI providers available!');
            this.currentProvider = null;
        }
    }
    
    /**
     * Check if provider is rate limited
     */
    isRateLimited(providerKey) {
        const provider = this.providers[providerKey];
        const counts = this.requestCounts.get(providerKey) || [];
        const now = Date.now();
        
        // Filter recent requests
        const recentRequests = counts.filter(time => 
            now - time < provider.rateLimit.window
        );
        
        return recentRequests.length >= provider.rateLimit.requests;
    }
    
    /**
     * Track request for rate limiting
     */
    trackRequest(providerKey) {
        const counts = this.requestCounts.get(providerKey) || [];
        const now = Date.now();
        const provider = this.providers[providerKey];
        
        // Keep only recent requests
        const recentRequests = counts.filter(time => 
            now - time < provider.rateLimit.window
        );
        
        recentRequests.push(now);
        this.requestCounts.set(providerKey, recentRequests);
    }
    
    /**
     * Generate response with automatic fallback
     */
    async generateResponse(prompt, options = {}) {
        // Check cache first
        const cacheKey = this.getCacheKey(prompt);
        const cached = this.cache.get(cacheKey);
        
        if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
            console.log('Returning cached response');
            return cached.response;
        }
        
        // Try providers in order of priority
        const sortedProviders = Object.entries(this.providers)
            .filter(([key, provider]) => {
                const health = this.providerHealth.get(key);
                return provider.enabled && health?.status && !this.isRateLimited(key);
            })
            .sort((a, b) => a[1].priority - b[1].priority);
        
        for (const [key, provider] of sortedProviders) {
            try {
                console.log(`Trying ${provider.name}...`);
                
                const response = await fetch(provider.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        prompt,
                        temperature: options.temperature || 0.8,
                        maxTokens: options.maxTokens || 200,
                    }),
                });
                
                if (!response.ok) {
                    const error = await response.json();
                    throw new Error(error.message || `HTTP ${response.status}`);
                }
                
                const data = await response.json();
                const text = data.text;
                
                // Track successful request
                this.trackRequest(key);
                
                // Cache the response
                this.cache.set(cacheKey, {
                    response: text,
                    timestamp: Date.now(),
                    provider: key
                });
                
                return text;
            } catch (error) {
                console.error(`${provider.name} failed:`, error.message);
                
                // Mark provider as unhealthy if it fails
                const health = this.providerHealth.get(key) || {};
                health.status = false;
                health.lastError = error.message;
                this.providerHealth.set(key, health);
                
                continue; // Try next provider
            }
        }
        
        // All providers failed - return fallback
        return this.getFallbackResponse(prompt);
    }
    
    /**
     * Get cache key for prompt
     */
    getCacheKey(prompt) {
        // Create a simple hash of the prompt
        return prompt.substring(0, 50).replace(/\s+/g, '_');
    }
    
    /**
     * Fallback responses when all providers fail
     */
    getFallbackResponse(prompt) {
        const fallbacks = {
            greeting: [
                "Welcome to Jeopardish! I'm your host, Alex Trebek.",
                "Good evening, and welcome to Jeopardish!",
                "Hello, contestants! Let's play Jeopardish!"
            ],
            correct: [
                "That is correct!",
                "Well done!",
                "Yes, that's right!",
                "Excellent!"
            ],
            incorrect: [
                "I'm sorry, that's incorrect.",
                "No, that's not quite right.",
                "Unfortunately, that's not the answer we were looking for."
            ],
            general: [
                "Let's continue with the game!",
                "An interesting choice!",
                "Let's see what we have next."
            ]
        };
        
        // Detect response type from prompt
        let responseType = 'general';
        if (prompt.toLowerCase().includes('greet') || prompt.toLowerCase().includes('welcome')) {
            responseType = 'greeting';
        } else if (prompt.toLowerCase().includes('correct')) {
            responseType = 'correct';
        } else if (prompt.toLowerCase().includes('incorrect') || prompt.toLowerCase().includes('wrong')) {
            responseType = 'incorrect';
        }
        
        const responses = fallbacks[responseType];
        return responses[Math.floor(Math.random() * responses.length)];
    }
    
    /**
     * Get provider status
     */
    getStatus() {
        const status = {
            currentProvider: this.currentProvider,
            providers: {}
        };
        
        Object.keys(this.providers).forEach(key => {
            const provider = this.providers[key];
            const health = this.providerHealth.get(key) || {};
            const requestCount = (this.requestCounts.get(key) || []).length;
            
            status.providers[key] = {
                name: provider.name,
                enabled: provider.enabled,
                healthy: health.status || false,
                apiKeyConfigured: health.apiKeyConfigured || false,
                requestsInWindow: requestCount,
                rateLimit: provider.rateLimit,
                lastError: health.lastError
            };
        });
        
        return status;
    }
    
    /**
     * Manually switch provider
     */
    setProvider(providerKey) {
        if (this.providers[providerKey] && this.providers[providerKey].enabled) {
            const health = this.providerHealth.get(providerKey);
            if (health?.status && health?.apiKeyConfigured) {
                this.currentProvider = providerKey;
                console.log(`Switched to ${this.providers[providerKey].name}`);
                return true;
            } else {
                console.error(`Cannot switch to ${providerKey}: Provider not available`);
                return false;
            }
        }
        return false;
    }
    
    /**
     * Clear cache
     */
    clearCache() {
        this.cache.clear();
        console.log('Response cache cleared');
    }
}

// Create global instance
const multiAIProvider = new MultiAIProvider();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiAIProvider;
}

// Make available globally for browser use
window.multiAIProvider = multiAIProvider;
