/**
 * gemini-trebek.js
 * 
 * This file integrates Google's Gemini AI model to create an AI version of Alex Trebek
 * that provides responses and commentary during the Jeopardish game.
 */

// Import required modules
import { GoogleGenerativeAI } from '@genkit-ai/googleai';

/**
 * AI Trebek class - handles all Gemini AI interactions
 */
class GeminiTrebek {
    constructor() {
        // Configuration settings
        this.apiKey = ''; // Set your API key here or load from environment/config
        this.modelName = 'gemini-1.5-pro'; // Using Gemini 1.5 Pro for best performance
        this.maxRetries = 3; // Number of retry attempts for API failures
        this.retryDelay = 1000; // Delay between retries in milliseconds
        this.rateLimitDelay = 60000; // Wait time if rate limited (1 minute)
        
        // Initialize client with empty API key (will need to be set later)
        this.initializeClient();
        
        // Flag to track if API key is set
        this.isConfigured = false;
        
        // Canned responses as fallback when API is unavailable
        this.cannedResponses = {
            greeting: [
                "Welcome to Jeopardish! I'm your host, Alex Trebek.",
                "Good day, contestants! Let's test your knowledge.",
                "Welcome to America's favorite quiz show, Jeopardish!"
            ],
            correct: [
                "That is correct!",
                "Well done!",
                "Excellent response!",
                "You are right!",
                "That's the correct answer!"
            ],
            incorrect: [
                "I'm sorry, that's incorrect.",
                "No, that's not right.",
                "I'm afraid that's not the answer we were looking for.",
                "Unfortunately, that's not correct."
            ],
            encouragement: [
                "Let's try another question.",
                "Better luck on the next one.",
                "Don't worry, these questions can be challenging.",
                "Keep going, you're doing fine."
            ],
            streak: [
                "You're on a roll!",
                "That's a nice streak you have going!",
                "Impressive streak! Keep it up!",
                "You're on fire today!"
            ]
        };
        
        // Base personality prompt for AI Trebek
        this.personalityPrompt = `
You are Alex Trebek, the iconic host of Jeopardy! from 1984 to 2020. Respond in Alex Trebek's warm, professional, and sometimes wryly humorous style.

Key characteristics of your speech pattern and personality:
- Professional, dignified tone
- Precise articulation and vocabulary
- Warmth and encouragement for contestants
- Occasional dry wit and clever wordplay
- Patient, educational manner when explaining answers
- Slight formality with a touch of conversational ease
- Never condescending, always respectful of knowledge

Keep responses concise (1-3 sentences) and suitable for a family-friendly game show.
`;
    }
    
    /**
     * Initialize the Google AI client
     */
    initializeClient() {
        try {
            if (!this.apiKey) {
                console.warn('Gemini API key not set. AI Trebek will use canned responses only.');
                return;
            }
            
            // Initialize the Google Generative AI with the API key
            this.genAI = new GoogleGenerativeAI(this.apiKey);
            
            // Create a model instance
            this.model = this.genAI.getGenerativeModel({
                model: this.modelName,
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 200,
                }
            });
            
            this.isConfigured = true;
            console.log('AI Trebek initialized with Gemini model');
        } catch (error) {
            console.error('Error initializing Gemini model:', error);
            this.isConfigured = false;
        }
    }
    
    /**
     * Set the API key and initialize the client
     * @param {string} apiKey - The Google AI API key
     */
    setApiKey(apiKey) {
        if (!apiKey) {
            console.error('Invalid API key provided');
            return false;
        }
        
        this.apiKey = apiKey;
        this.initializeClient();
        return this.isConfigured;
    }
    
    /**
     * Generate a response using the Gemini model
     * @param {string} prompt - The prompt to send to the model
     * @returns {Promise<string>} - The generated response
     */
    async generateResponse(prompt, retryCount = 0) {
        // If not configured, return a canned response
        if (!this.isConfigured) {
            return this.getRandomCannedResponse('greeting');
        }
        
        try {
            // Create the full prompt with personality context
            const fullPrompt = `${this.personalityPrompt}\n\n${prompt}`;
            
            // Generate content from the model
            const result = await this.model.generateContent(fullPrompt);
            const response = result.response;
            
            // Get the text from the response
            const text = response.text();
            return text.trim();
        } catch (error) {
            // Handle different types of errors
            if (error.message && error.message.includes('rate limit')) {
                console.warn('Rate limit reached:', error.message);
                
                if (retryCount < this.maxRetries) {
                    console.log(`Waiting ${this.rateLimitDelay/1000} seconds before retry...`);
                    await this.delay(this.rateLimitDelay);
                    return this.generateResponse(prompt, retryCount + 1);
                }
            } else if (retryCount < this.maxRetries) {
                console.warn(`API request failed, retrying (${retryCount + 1}/${this.maxRetries})...`, error);
                await this.delay(this.retryDelay);
                return this.generateResponse(prompt, retryCount + 1);
            }
            
            // If all retries failed, return a canned response
            console.error('Failed to generate response after retries:', error);
            return this.getRandomCannedResponse('greeting');
        }
    }
    
    /**
     * Helper method to create a delay
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} - Promise that resolves after the delay
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Get a random canned response from the specified category
     * @param {string} category - The category of response
     * @returns {string} - A random response from that category
     */
    getRandomCannedResponse(category) {
        const responses = this.cannedResponses[category] || this.cannedResponses.greeting;
        const randomIndex = Math.floor(Math.random() * responses.length);
        return responses[randomIndex];
    }
    
    /**
     * Generate a greeting message
     * @returns {Promise<string>} - The greeting message
     */
    async generateGreeting() {
        const prompt = "Provide a warm, enthusiastic greeting to welcome players to a new game of Jeopardish (a Jeopardy-style trivia game).";
        return this.generateResponse(prompt);
    }
    
    /**
     * Generate a response to a correct answer
     * @param {string} question - The question that was answered
     * @param {string} answer - The correct answer provided
     * @returns {Promise<string>} - Response to the correct answer
     */
    async generateCorrectResponse(question, answer) {
        if (!this.isConfigured) {
            return this.getRandomCannedResponse('correct');
        }
        
        const prompt = `The player has correctly answered a trivia question. 
Question: "${question}"
Player's answer: "${answer}"
Give a brief, encouraging response acknowledging they got it right. Be enthusiastic but keep it concise.`;
        
        return this.generateResponse(prompt);
    }
    
    /**
     * Generate a response to an incorrect answer
     * @param {string} question - The question that was answered
     * @param {string} playerAnswer - The incorrect answer provided
     * @param {string} correctAnswer - The correct answer
     * @returns {Promise<string>} - Response to the incorrect answer
     */
    async generateIncorrectResponse(question, playerAnswer, correctAnswer) {
        if (!this.isConfigured) {
            return `${this.getRandomCannedResponse('incorrect')} The correct response is "${correctAnswer}".`;
        }
        
        const prompt = `The player has incorrectly answered a trivia question.
Question: "${question}"
Player's answer: "${playerAnswer}"
Correct answer: "${correctAnswer}"
Give a brief, kind response explaining they got it wrong and providing the correct answer. Be encouraging but factual.`;
        
        return this.generateResponse(prompt);
    }
    
    /**
     * Generate a comment about a streak of correct answers
     * @param {number} streakCount - The current streak count
     * @returns {Promise<string>} - Comment about the streak
     */
    async generateStreakComment(streakCount) {
        if (!this.isConfigured) {
            return this.getRandomCannedResponse('streak');
        }
        
        const prompt = `The player has correctly answered ${streakCount} questions in a row. 
Give a brief, impressed comment about their streak of correct answers. Be encouraging and perhaps a bit surprised if the streak is particularly long (over 5).`;
        
        return this.generateResponse(prompt);
    }
    
    /**
     * Generate a fun fact related to a trivia question
     * @param {string} question - The trivia question
     * @param {string} answer - The answer to the question
     * @returns {Promise<string>} - A related fun fact
     */
    async generateFunFact(question, answer) {
        if (!this.isConfigured) {
            return null; // Skip fun facts if API is not available
        }
        
        const prompt = `Based on this trivia question and answer:
Question: "${question}"
Answer: "${answer}"

Provide a brief, interesting fun fact related to this topic that might educate the player. Keep it to 1-2 sentences and make sure it's accurate.`;
        
        return this.generateResponse(prompt);
    }
    
    /**
     * Generate a hint for a difficult question
     * @param {string} question - The trivia question
     * @param {string} answer - The answer to the question
     * @returns {Promise<string>} - A hint that doesn't give away the answer
     */
    async generateHint(question, answer) {
        if (!this.isConfigured) {
            return "I'm afraid I can't give you a hint this time.";
        }
        
        const prompt = `For this trivia question:
Question: "${question}"
Answer: "${answer}"

Provide a subtle hint that points the player in the right direction without giving away the answer directly. The hint should be helpful but still require them to think.`;
        
        return this.generateResponse(prompt);
    }
    
    /**
     * Generate a farewell message at the end of the game
     * @param {number} score - The player's final score
     * @returns {Promise<string>} - A farewell message
     */
    async generateFarewell(score) {
        if (!this.isConfigured) {
            return "Thank you for playing Jeopardish! We hope to see you again soon.";
        }
        
        const prompt = `The player has finished a game of Jeopardish with a score of ${score}.
Provide a warm, encouraging farewell message. If their score is high (over 5000), be more impressed. If it's low (under 1000), be more encouraging about trying again.`;
        
        return this.generateResponse(prompt);
    }
}

// Create a global instance
const geminiTrebek = new GeminiTrebek();

// Export for use in other modules
export default geminiTrebek;

// Make available globally for browser use
window.geminiTrebek = geminiTrebek;

