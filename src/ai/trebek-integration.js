// Import our AI trebek module
import { trebekReply } from './trebek.js';

/**
 * Integrate AI Trebek with the existing game
 * This file contains the functions that will replace or augment
 * the existing message display functions in app.js
 */

// Modified version of displayCorrectAnswerMessage
export async function displayAICorrectAnswerMessage() {
  const categoryBox = document.getElementById('categoryBox');
  const valueBox = document.getElementById('valueBox');
  const questionBox = document.getElementById('questionBox');
  const answerBox = document.getElementById('answerBox');
  
  if (!categoryBox || !valueBox || !questionBox || !answerBox || !window.currentQuestion) {
    console.error('Missing required DOM elements or question data for correct answer message display');
    return;
  }
  
  try {
    // Get AI response
    const response = await trebekReply({
      prompt: 'correct_answer',
      gameState: {
        currentScore,
        currentStreak,
        bestScore,
        bestStreak
      },
      question: window.currentQuestion.question,
      answer: window.currentQuestion.answer,
      userAnswer: document.getElementById('inputBox')?.value || '',
      category: window.currentQuestion.category,
      value: window.currentQuestion.value
    });
    
    // Display the AI response
    categoryBox.innerHTML = "";
    valueBox.innerHTML = "";
    questionBox.innerHTML = response;
    answerBox.innerHTML = "";
    answerBox.style.display = "flex";
    showingMessage = true;
    
    // Trigger host animation if available
    if (window.hostAnimationManager) {
      window.hostAnimationManager.triggerAnimation('nod');
    }
    
  } catch (error) {
    console.error('Error getting AI response:', error);
    // Fall back to original function behavior
    categoryBox.innerHTML = "";
    valueBox.innerHTML = "";
    questionBox.innerHTML = `Correctamundo and cowabunga, my friend! Your streak is now ${currentStreak}. Keep it going, sir or lady or other person!!`;
    answerBox.innerHTML = "";
    answerBox.style.display = "flex";
    showingMessage = true;
  }
}

// Modified version of displayIncorrectAnswerMessage
export async function displayAIIncorrectAnswerMessage(correctAnswer) {
  const categoryBox = document.getElementById('categoryBox');
  const valueBox = document.getElementById('valueBox');
  const questionBox = document.getElementById('questionBox');
  const answerBox = document.getElementById('answerBox');
  
  if (!categoryBox || !valueBox || !questionBox || !answerBox || !window.currentQuestion) {
    console.error('Missing required DOM elements or question data for incorrect answer message display');
    return;
  }
  
  try {
    // Get AI response
    const response = await trebekReply({
      prompt: 'wrong_answer',
      gameState: {
        currentScore,
        currentStreak,
        bestScore,
        bestStreak
      },
      question: window.currentQuestion.question,
      answer: correctAnswer,
      userAnswer: document.getElementById('inputBox')?.value || '',
      category: window.currentQuestion.category,
      value: window.currentQuestion.value
    });
    
    // Display the AI response
    categoryBox.innerHTML = "";
    valueBox.innerHTML = "";
    questionBox.innerHTML = response;
    answerBox.innerHTML = `The correct answer was: ${correctAnswer}`;
    answerBox.style.display = "flex";
    showingMessage = true;
    
    // Trigger host animation if available
    if (window.hostAnimationManager) {
      window.hostAnimationManager.triggerAnimation('shake');
    }
    
  } catch (error) {
    console.error('Error getting AI response:', error);
    // Fall back to original function behavior
    categoryBox.innerHTML = "";
    valueBox.innerHTML = "";
    questionBox.innerHTML = `Incorrect, you fool! Your streak is now reset! Try again, sir or lady or other person!!`;
    answerBox.innerHTML = `The correct answer was: ${correctAnswer}`;
    answerBox.style.display = "flex";
    showingMessage = true;
  }
}

// New function to display AI intro for new question
export async function displayAINewQuestionIntro(questionData) {
  if (!questionData) {
    console.error('No question data provided');
    return;
  }
  
  try {
    // Get AI response for new question intro
    const response = await trebekReply({
      prompt: 'new_question',
      gameState: {
        currentScore,
        currentStreak,
        bestScore,
        bestStreak
      },
      question: questionData.question,
      answer: questionData.answer,
      category: questionData.category,
      value: questionData.value
    });
    
    // Display the AI response briefly before showing the actual question
    const cheekyIntro = document.createElement('div');
    cheekyIntro.className = 'trebek-intro';
    cheekyIntro.textContent = response;
    
    // Get speech bubble
    const speechBubble = document.getElementById('speechBubble');
    if (speechBubble) {
      // Add the intro message at the top of the speech bubble
      const introContainer = document.createElement('div');
      introContainer.className = 'trebek-intro-container';
      introContainer.appendChild(cheekyIntro);
      
      speechBubble.prepend(introContainer);
      
      // Remove after a few seconds
      setTimeout(() => {
        if (introContainer.parentNode === speechBubble) {
          speechBubble.removeChild(introContainer);
        }
      }, 4000);
    }
    
    // Trigger host animation if available
    if (window.hostAnimationManager) {
      window.hostAnimationManager.triggerAnimation('wave');
    }
    
  } catch (error) {
    console.error('Error getting AI response for new question:', error);
    // No fallback needed, just continue with regular question display
  }
  
  // Return true to indicate we completed successfully
  return true;
}

// Function to handle streak milestones
export async function handleStreakMilestone(streak) {
  // Only trigger for significant streaks (multiples of 5)
  if (streak % 5 !== 0) return;
  
  try {
    // Get AI response
    const response = await trebekReply({
      prompt: 'streak_milestone',
      gameState: {
        currentScore,
        currentStreak: streak,
        bestScore,
        bestStreak
      }
    });
    
    // Display a toast notification with the message
    displayCheekyMessage(response);
    
    // Trigger host animation if available
    if (window.hostAnimationManager) {
      window.hostAnimationManager.triggerAnimation('dance');
    }
    
  } catch (error) {
    console.error('Error getting AI response for streak milestone:', error);
    // No fallback needed
  }
}
