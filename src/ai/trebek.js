import { chat } from 'genkit';

// System prompt for Trebek's personality
const SYSTEM_PROMPT = `You are Alex Trebek hosting Jeopardy. 
You have a witty, slightly sarcastic but always professional personality.
Keep responses brief (1-2 sentences) unless asked for an explanation.
Reference contestants by name when possible. 
Occasionally make subtle jokes or puns related to the question or answer.
Your responses should be varied and entertaining.`;

// Fallback responses in case the AI service is unavailable or quota is exhausted
const FALLBACK_RESPONSES = [
  "That's correct! Well done.",
  "I'm sorry, that's incorrect.",
  "Let's move on to the next question.",
  "Interesting response, but not what we were looking for.",
  "That's absolutely right!",
  "Oh, so close, but not quite there.",
  "You're on a roll today!",
  "That's a tough one, isn't it?",
  "Better luck with the next question.",
  "Well, that was... an attempt."
];

/**
 * Generate a response from AI Trebek based on the game context
 * @param {Object} context - Game context including prompt and game state
 * @param {string} context.prompt - Event type (e.g., 'correct_answer', 'wrong_answer')
 * @param {Object} context.gameState - Current game state
 * @param {string} context.question - Current question text
 * @param {string} context.answer - Correct answer text
 * @param {string} context.userAnswer - User's provided answer (if applicable)
 * @returns {Promise<string>} - Trebek's response
 */
export async function trebekReply(context) {
  try {
    // Build prompt based on context
    let userPrompt = '';
    
    switch(context.prompt) {
      case 'correct_answer':
        userPrompt = `The contestant correctly answered "${context.userAnswer}" to the question "${context.question}". The correct answer is "${context.answer}". Give a positive and encouraging response.`;
        break;
      case 'wrong_answer':
        userPrompt = `The contestant incorrectly answered "${context.userAnswer}" to the question "${context.question}". The correct answer is "${context.answer}". Give a gentle correction.`;
        break;
      case 'new_question':
        userPrompt = `A new question has been selected: "${context.question}" (Category: ${context.category}, Value: $${context.value}). Give a brief introduction to this question.`;
        break;
      case 'game_start':
        userPrompt = `The game is starting. The player's current score is $${context.gameState.currentScore}. Give a welcome message.`;
        break;
      case 'streak_milestone':
        userPrompt = `The contestant has achieved a streak of ${context.gameState.currentStreak} correct answers. Congratulate them.`;
        break;
      default:
        userPrompt = `The current question is "${context.question}". The correct answer is "${context.answer}". Make a witty comment about this.`;
    }
    
    // Add game state info to help with context
    const gameStateInfo = `Current score: $${context.gameState.currentScore}, Current streak: ${context.gameState.currentStreak}, Best streak: ${context.gameState.bestStreak}`;
    
    // Make the API call
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: userPrompt + '\n\n' + gameStateInfo }
    ];
    
    const response = await chat({ messages });
    return response.content.trim();
    
  } catch (error) {
    console.error('Error generating Trebek response:', error);
    
    // Return a fallback response if the AI service fails
    return FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
  }
}
