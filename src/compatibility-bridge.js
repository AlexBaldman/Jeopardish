/**
 * Compatibility Bridge
 * Connects the old DOM-based architecture with the new component system
 * This is a temporary solution while we migrate to the new architecture
 */

import questionService from './services/api/questionService.js';
import { eventBus } from './utils/events.js';
import dialogManager from './services/DialogManager.js';

console.log('🌉 Loading compatibility bridge...');

// Initialize when DOM is ready
function initBridge() {
  console.log('🌉 Initializing compatibility bridge...');
  
  // Initialize question service
  questionService.initialize().then(() => {
    console.log('✅ Question service initialized');
  }).catch(err => {
    console.error('❌ Failed to initialize question service:', err);
  });
  
  // Hook up old DOM elements to new system
  setupOldDOMBindings();
  
  // Set up console logging
  setupConsoleLogs();
}

function setupOldDOMBindings() {
  console.log('🔗 Setting up DOM bindings...');
  
  // Question button
  const questionButton = document.getElementById('questionButton');
  if (questionButton) {
    console.log('✅ Found question button');
    questionButton.addEventListener('click', async () => {
      console.log('🎯 Question button clicked');
      await handleNewQuestion();
    });
  } else {
    console.log('❌ Question button not found');
  }
  
  // Answer button
  const answerButton = document.getElementById('answerButton');
  if (answerButton) {
    console.log('✅ Found answer button');
    answerButton.addEventListener('click', () => {
      console.log('👁️ Answer button clicked');
      handleShowAnswer();
    });
  } else {
    console.log('❌ Answer button not found');
  }
  
  // Check button
  const checkButton = document.getElementById('checkButton');
  if (checkButton) {
    console.log('✅ Found check button');
    checkButton.addEventListener('click', () => {
      console.log('✅ Check button clicked');
      handleCheckAnswer();
    });
  } else {
    console.log('❌ Check button not found');
  }
  
  // Input box enter key - Smart handling
  const inputBox = document.getElementById('inputBox');
  if (inputBox) {
    console.log('✅ Found input box');
    inputBox.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        console.log('⏎ Enter key pressed');
        handleEnterKey();
      }
    });
  } else {
    console.log('❌ Input box not found');
  }
}

let currentQuestion = null;

async function handleNewQuestion() {
  console.log('🎯 Getting new question...');
  
  try {
    // Clear previous content
    const inputBox = document.getElementById('inputBox');
    if (inputBox) inputBox.value = '';
    
    const answerBox = document.getElementById('answerBox');
    if (answerBox) answerBox.style.display = 'none';
    
    // Get new question
    const question = await questionService.getQuestion();
    if (!question) {
      console.error('❌ No question received');
      return;
    }
    
    currentQuestion = question;
    console.log('📝 Got question:', question);
    
    // Display question
    displayQuestion(question);
    
    // Emit event
    eventBus.emit('question:new', question);
    
    // Update ticker
    eventBus.emit('ticker:update', { event: 'idle' });
    
  } catch (error) {
    console.error('❌ Error getting question:', error);
  }
}

function displayQuestion(question) {
  console.log('🎨 Displaying question:', question);
  
  const categoryBox = document.getElementById('categoryBox');
  const valueBox = document.getElementById('valueBox');
  const questionBox = document.getElementById('questionBox');
  const answerBox = document.getElementById('answerBox');
  
  if (categoryBox) categoryBox.textContent = question.category;
  if (valueBox) valueBox.textContent = `$${question.value}`;
  if (questionBox) questionBox.textContent = question.question;
  if (answerBox) {
    answerBox.textContent = question.answer;
    answerBox.style.display = 'none';
  }
  
  // Play sound
  playSound('stairs');
}

function handleShowAnswer() {
  console.log('👁️ Showing answer...');
  const answerBox = document.getElementById('answerBox');
  if (answerBox) {
    const isHidden = answerBox.style.display === 'none';
    answerBox.style.display = isHidden ? 'block' : 'none';
    
    if (isHidden) {
      eventBus.emit('answer:revealed', currentQuestion);
    }
  }
}

function handleCheckAnswer() {
  console.log('✅ Checking answer...');
  
  const inputBox = document.getElementById('inputBox');
  const userAnswer = inputBox?.value?.trim();
  
  if (!userAnswer) {
    console.log('❌ No answer provided');
    return;
  }
  
  if (!currentQuestion) {
    console.log('❌ No current question');
    return;
  }
  
  // Simple answer checking (can be improved)
  const correctAnswer = currentQuestion.answer.toLowerCase();
  const isCorrect = userAnswer.toLowerCase().includes(correctAnswer) || 
                    correctAnswer.includes(userAnswer.toLowerCase());
  
  console.log(`🎯 Answer check: "${userAnswer}" vs "${currentQuestion.answer}" = ${isCorrect}`);
  
  // Update UI
  const answerBox = document.getElementById('answerBox');
  if (answerBox) answerBox.style.display = 'block';
  
  // Update score
  updateScore(isCorrect);
  
  // Emit answer events for host animations
  if (isCorrect) {
    eventBus.emit('answer:correct', { 
      question: currentQuestion,
      answer: userAnswer,
      value: currentQuestion.value || 200
    });
    // Also fire legacy event for compatibility
    document.dispatchEvent(new Event('correctAnswer'));
  } else {
    eventBus.emit('answer:incorrect', { 
      question: currentQuestion,
      userAnswer: userAnswer,
      correctAnswer: currentQuestion.answer
    });
    // Also fire legacy event for compatibility
    document.dispatchEvent(new Event('incorrectAnswer'));
  }
  
  // Update ticker
  eventBus.emit('ticker:update', { event: isCorrect ? 'correct' : 'incorrect' });
  
  // Play sound
  playSound(isCorrect ? 'correct' : 'incorrect');
  
  // Clear input
  if (inputBox) inputBox.value = '';
}

function updateScore(isCorrect) {
  const scoreEl = document.getElementById('score');
  const streakEl = document.getElementById('streak');
  
  if (!scoreEl || !streakEl) return;
  
  // Get current values
  let score = parseInt(scoreEl.textContent.replace(/[^0-9]/g, '')) || 0;
  let streak = parseInt(streakEl.textContent) || 0;
  
  if (isCorrect) {
    score += currentQuestion.value || 200;
    streak += 1;
  } else {
    streak = 0;
  }
  
  // Update display
  scoreEl.textContent = `$${score}`;
  streakEl.textContent = streak;
  
  console.log(`📊 Score: $${score}, Streak: ${streak}`);
}

function playSound(soundName) {
  console.log(`🔊 Playing sound: ${soundName}`);
  // Sound playing will be handled by the sound manager when it's ready
  eventBus.emit('sound:play', soundName);
}

function setupConsoleLogs() {
  console.log('🎮 Welcome to Jeopardish!!!');
  console.log('❓ Click the "new question" button to get a random Jeopardy-style question & test your knowledge.');
  console.log('🔥 Multiple correct answers in a row will start a streak...');
  console.log('💔 ...but get one wrong & the streak will reset.');
  console.log('🏆 Let\'s see how many correct answers you can string together!');
  console.log('📊 Streak is currently at 0');
  console.log('✨ HAVE FUN YA MANIAC!');
}

function handleEnterKey() {
  const inputBox = document.getElementById('inputBox');
  const hasInput = inputBox?.value?.trim();
  const state = getGameState();
  
  console.log('⏎ Smart Enter key handler:', { hasInput, showingMessage: state.showingMessage });
  
  // If showing a message (correct/incorrect), go to next question
  if (state.showingMessage) {
    console.log('📝 Message showing, getting new question');
    handleNewQuestion();
    return;
  }
  
  // If no current question, get a new one
  if (!currentQuestion) {
    console.log('❓ No current question, getting new one');
    handleNewQuestion();
    return;
  }
  
  // If user typed something, check the answer
  if (hasInput) {
    console.log('✅ User input detected, checking answer');
    handleCheckAnswer();
  } else {
    console.log('💡 No input, prompting for answer');
    // Maybe show a hint or prompt
    dialogManager.queueMessage('TAUNT', 'Type your answer and press Enter, or press Enter again for a new question!');
  }
}

function getGameState() {
  // Simple state tracking for compatibility bridge
  return {
    showingMessage: document.querySelector('.speechBubble.showing-message') !== null,
    hasQuestion: currentQuestion !== null,
    conversationMode: dialogManager.conversationMode
  };
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initBridge();
    // Initialize dialog manager
    dialogManager.init();
  });
} else {
  initBridge();
  // Initialize dialog manager
  dialogManager.init();
}

// Export for debugging
window.compatibilityBridge = {
  questionService,
  eventBus,
  currentQuestion: () => currentQuestion,
  handleNewQuestion,
  handleShowAnswer,
  handleCheckAnswer
};

console.log('🌉 Compatibility bridge loaded');
