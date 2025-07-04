# AI Trebek Integration for Jeopardish

This README provides instructions for setting up and configuring the AI-powered Alex Trebek for the Jeopardish game.

## Overview

The AI Trebek integration adds dynamic, contextual responses from an AI-powered Alex Trebek character to enhance the game experience. The AI will:

- Introduce new questions with witty comments
- Respond to correct answers with encouraging remarks
- Respond to incorrect answers with gentle corrections
- Celebrate streak milestones with special messages

## Setup Instructions

### 1. API Key Configuration

To use the AI Trebek feature, you need a Google AI API key:

1. Go to the [Google AI Studio](https://makersuite.google.com/) and sign up for an account
2. Create a new API key in the Google AI Studio console
3. Copy the API key to your `.env.local` file:

```
GOOGLE_AI_API_KEY=your_api_key_here
GENKIT_PROJECT_ID=your_project_id_here
```

> Note: The `.env.local` file is already gitignored to prevent accidentally committing your API key.

### 2. Integration with the Game

The AI integration consists of the following files:

- `genkit.config.js`: Configuration for Genkit and Google AI
- `src/ai/trebek.js`: Core AI functionality
- `src/ai/trebek-integration.js`: Integration with game logic
- `app-integration-guide.js`: Guide for integrating with app.js

Follow these steps to complete the integration:

1. Make sure the required packages are installed:
   ```
   npm install genkit @genkit-ai/googleai
   ```

2. Update your `app.js` file following the instructions in `app-integration-guide.js`:
   - Add the import statements
   - Replace the message display functions
   - Update the `getNewQuestion` and `updateStreak` functions
   - Add error handling for the API key

### 3. Testing the Integration

After integrating, you should see:

1. AI-generated introductions when new questions appear
2. Witty AI responses when answering questions (correctly or incorrectly)
3. Special messages for streak milestones (every 5 correct answers)

## Customization

### Trebek's Personality

You can customize Trebek's personality by modifying the `SYSTEM_PROMPT` in `src/ai/trebek.js`. This defines how the AI should respond in different situations.

### Fallback Responses

If the AI service is unavailable or the API key is not configured, the game will use the fallback responses defined in `src/ai/trebek.js`. You can customize these responses to match your desired style.

### Animation Integration

The integration automatically triggers animations if the `hostAnimationManager` is available. You can modify which animations are triggered for different events by changing the animation names in `src/ai/trebek-integration.js`.

## Troubleshooting

- **API Key Issues**: If you see "API key not configured" warnings, check your `.env.local` file and make sure it has the correct API key.
- **Network Errors**: If AI responses are not appearing, check your browser console for network errors. The AI may be unavailable or rate-limited.
- **Animation Issues**: If animations are not working, ensure that the `host-animations.js` file is properly loaded and that the animation names match those defined in your animation manager.

## Credits

This integration uses:
- [Genkit](https://github.com/genkit-ai/genkit) for AI integration
- [Google AI Gemini](https://ai.google.dev/gemini) for generating dynamic responses
