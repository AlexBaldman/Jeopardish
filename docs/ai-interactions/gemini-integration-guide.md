# Gemini AI Integration Guide

**Created:** 2025-01-04  
**Updated:** 2025-01-04  
**Author:** The AI Specialist  
**Status:** Active  

## Summary

This guide explains how to set up and use the Gemini AI integration in Jeopardish for AI-powered host personality, dynamic question rewriting, and intelligent ticker messages.

## Features

### 1. AI-Powered Host Personality
- Alex Trebek's personality with professional wit and self-aware humor
- Dynamic responses to correct/incorrect answers
- Streak celebrations and encouragement
- Context-aware commentary

### 2. Question Rewriting
- Transforms standard Jeopardy questions into Trebek's voice
- Adds personal asides and humor
- Maintains educational value while enhancing entertainment
- Avoids copyright issues by paraphrasing

### 3. Dynamic Ticker Messages
- AI-generated comedy messages for game events
- Norm MacDonald-inspired absurdist humor
- Context-aware based on game state
- Supplements pre-written ticker messages

## Setup Instructions

### Step 1: Get a Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Click "Create API Key"
3. Copy your API key (keep it secure!)

### Step 2: Configure the API Key

#### Option A: Environment Variable (Recommended for Development)
1. Create a `.env` file in the project root
2. Add your API key:
   ```
   VITE_GEMINI_API_KEY=your_actual_api_key_here
   ```
3. Restart your development server

#### Option B: Through the Game UI
1. Click the hamburger menu in the game
2. Go to Settings
3. Find "AI Host Settings"
4. Enter your API key and click Save
5. Toggle "Enable AI Host" on

### Step 3: Enable AI Features

Once configured, the AI features automatically activate:
- Questions will be rewritten in Trebek's voice
- Responses will be AI-generated
- Ticker may show AI-generated messages

## How It Works

### Architecture
```
Game Events → Gemini Integration → Gemini API → AI Response → Game UI
```

### Key Components

1. **gemini-trebek-enhanced.js**
   - Core API integration
   - Handles API calls and rate limiting
   - Manages response caching

2. **gemini-game-integration.js**
   - Connects AI to game events
   - Overrides display functions
   - Manages UI updates

3. **trebek-personality.md**
   - Defines AI personality guidelines
   - Contains response templates
   - Guides question rewriting style

## API Usage

### Rate Limits
- Free tier: 60 requests per minute
- Automatic rate limiting built-in
- Fallback to pre-written responses if limits exceeded

### Caching
- Responses cached for 5 minutes
- Reduces API calls for repeated questions
- Improves response time

### Error Handling
- Graceful fallback to default responses
- No game interruption on API failures
- Error logging for debugging

## Customization

### Modifying Personality

Edit the personality prompt in `gemini-trebek-enhanced.js`:
```javascript
loadPersonalityPrompt() {
    return `Your custom personality prompt here...`;
}
```

### Adjusting Response Style

Modify temperature and token settings:
```javascript
generationConfig: {
    temperature: 0.8,  // 0-1, higher = more creative
    topK: 40,          // Diversity of responses
    topP: 0.95,        // Nucleus sampling
    maxOutputTokens: 200  // Response length
}
```

### Adding Custom Events

Create new AI response types:
```javascript
async generateCustomResponse(eventType, context) {
    const prompt = `Generate response for ${eventType}: ${JSON.stringify(context)}`;
    return await this.callGeminiAPI(prompt);
}
```

## Troubleshooting

### API Key Not Working
1. Check for typos in the key
2. Ensure key is active in Google AI Studio
3. Check browser console for errors
4. Verify .env file is in project root

### Responses Not Appearing
1. Check if AI Host is enabled in settings
2. Verify API key is configured
3. Check rate limit status
4. Look for errors in console

### Generic Responses
1. API might be rate limited
2. Network connectivity issues
3. API service temporarily down
4. Fallback system activated

## Best Practices

1. **Keep API Key Secure**
   - Never commit .env file
   - Use environment variables
   - Don't share keys publicly

2. **Monitor Usage**
   - Track API calls in Google Console
   - Watch for rate limit warnings
   - Use caching effectively

3. **Test Fallbacks**
   - Ensure game works without API
   - Test with invalid keys
   - Verify error handling

## Future Enhancements

1. **Voice Synthesis**
   - Add text-to-speech for AI responses
   - Create Trebek voice clone

2. **Advanced Context**
   - Remember player history
   - Personalized responses
   - Difficulty adjustment

3. **Multi-language Support**
   - Translate AI responses
   - Localized humor
   - Cultural adaptations

## Resources

- [Gemini API Documentation](https://ai.google.dev/tutorials/rest_quickstart)
- [Google AI Studio](https://makersuite.google.com/)
- [Prompt Engineering Guide](https://ai.google.dev/docs/prompt_best_practices)

---

*"I'm not just a host, I'm an AI host. The difference? I never forget a question... or need a bathroom break." - AI Trebek*
