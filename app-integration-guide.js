/**
 * Jeopardish + AI Trebek Integration Guide
 * 
 * This file demonstrates how to integrate the AI Trebek functionality
 * into the existing app.js file. The user should follow this guide to
 * update their app.js file.
 */

// STEP 1: Add imports at the top of app.js
// ----------------------------------------
// Add these import statements at the top of your app.js file
import { trebekReply } from './src/ai/trebek.js';
import { 
  displayAICorrectAnswerMessage, 
  displayAIIncorrectAnswerMessage, 
  displayAINewQuestionIntro,
  handleStreakMilestone
} from './src/ai/trebek-integration.js';

// STEP 2: Replace existing message display functions
// -------------------------------------------------
// Replace the displayCorrectAnswerMessage function with:
function displayCorrectAnswerMessage() {
  // Call the AI version of the function
  displayAICorrectAnswerMessage();
}

// Replace the displayIncorrectAnswerMessage function with:
function displayIncorrectAnswerMessage(correctAnswer) {
  // Call the AI version of the function
  displayAIIncorrectAnswerMessage(correctAnswer);
}

// STEP 3: Update the getNewQuestion function
// -----------------------------------------
// Modify the getNewQuestion function to call our AI function after displaying a new question
// Find the displayQuestion(normalizedQuestion); line and add this right after it:
async function getNewQuestion() {
  console.log('🎯 getNewQuestion called');
  
  // Reset all state flags
  showingMessage = false;
  answerWasRevealed = false;
  
  // Get and clear input box
  const inputBox = document.getElementById('inputBox');
  if (inputBox) {
    inputBox.value = '';
  }
  
  // Get answer box for visibility
  const answerBox = document.getElementById('answerBox');
  if (answerBox) {
    answerBox.style.display = 'none';
  }
  
  try {
    // Local question handling
    if (questions.length === 0 || currentQuestionIndex >= questions.length) {
      console.log('📥 Need to load more local questions...');
      const localQuestionsLoaded = await loadLocalQuestions();
      if (!localQuestionsLoaded) {
        console.error('❌ Failed to load local questions');
        displayErrorJoke();
        return;
      }
    }

    currentQuestion = questions[currentQuestionIndex];
    currentQuestionIndex++;
    
    const normalizedQuestion = normalizeQuestionData(currentQuestion);
    displayQuestion(normalizedQuestion);
    
    // Add this line to display AI intro message
    displayAINewQuestionIntro(normalizedQuestion);
    
    // Ensure answer is hidden when loading new question
    if (answerBox) {
      answerBox.style.display = 'none';
    }
  } catch (error) {
    console.error('Error getting new question:', error);
    displayErrorJoke();
  }
}

// STEP 4: Update the updateStreak function
// --------------------------------------
// Modify the updateStreak function to call our handleStreakMilestone function
// when the streak increases:
function updateStreak(correct) {
  if (correct) {
    currentStreak++;
    if (currentStreak > bestStreak) {
      bestStreak = currentStreak;
    }
    
    // Add this line to handle streak milestones
    handleStreakMilestone(currentStreak);
  } else {
    currentStreak = 0;
  }
  
  updateScoreBoard();
}

// STEP 5: Add error handling for missing API key
// --------------------------------------------
// Add this function to check if API key is configured
function checkAPIKeyConfigured() {
  // This is a simplified check - in a real app, you'd verify this through your
  // environment configuration system
  const apiKey = process.env.GOOGLE_AI_API_KEY;
  if (!apiKey || apiKey === 'YOUR_API_KEY_HERE') {
    console.warn('⚠️ Google AI API key not configured. AI Trebek features will use fallback messages.');
    displayCheekyMessage("⚠️ AI Trebek not available: API key not configured. Using fallback messages.");
    return false;
  }
  return true;
}

// Call this function on app initialization
window.addEventListener('DOMContentLoaded', () => {
  // Check if API key is configured
  checkAPIKeyConfigured();
  
  // Other initialization code...
});
