/**
 * Game Controller Module
 * Orchestrates the game logic and coordinates between different modules
 */

import { 
  gameState, 
  updateScore, 
  updateStreak, 
  setCurrentQuestion,
  revealAnswer,
  setShowingMessage
} from '@store/gameState.js';

import {
  fetchQuestionFromAPI,
  loadLocalQuestions,
  getNextLocalQuestion,
  getErrorJoke,
  normalizeQuestionData
} from '@services/api/questionService.js';

import {
  compareAnswers,
  getCheekyComment,
  getRandomInsult
} from '@utils/answerValidator.js';

export class GameController {
  constructor() {
    this.questionBox = document.getElementById('questionBox');
    this.answerBox = document.getElementById('answerBox');
    this.categoryBox = document.getElementById('categoryBox');
    this.valueBox = document.getElementById('valueBox');
    this.inputBox = document.getElementById('inputBox');
    
    this.init();
  }
  
  async init() {
    console.log('🎮 Initializing Game Controller...');
    
    // Load local questions on startup
    await loadLocalQuestions();
    
    // Set up event listeners
    this.setupEventListeners();
    
    console.log('✅ Game Controller initialized');
  }
  
  setupEventListeners() {
    // Question button
    const questionButton = document.getElementById('questionButton');
    if (questionButton) {
      questionButton.addEventListener('click', () => this.getNewQuestion());
    }
    
    // Answer button
    const answerButton = document.getElementById('answerButton');
    if (answerButton) {
      answerButton.addEventListener('click', () => this.showHideAnswer());
    }
    
    // Check button
    const checkButton = document.getElementById('checkButton');
    if (checkButton) {
      checkButton.addEventListener('click', () => this.checkAnswer());
    }
    
    // Enter key on input
    if (this.inputBox) {
      this.inputBox.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          event.preventDefault();
          this.handleEnterKey();
        }
      });
    }
  }
  
  async getNewQuestion() {
    console.log('🎯 Getting new question...');
    
    // Reset state
    setShowingMessage(false);
    
    // Clear input
    if (this.inputBox) {
      this.inputBox.value = '';
    }
    
    // Hide answer
    if (this.answerBox) {
      this.answerBox.style.display = 'none';
    }
    
    try {
      // Try API first
      let question = await fetchQuestionFromAPI();
      
      // Fall back to local questions if API fails
      if (!question) {
        question = getNextLocalQuestion();
        
        // If no local questions, reload them
        if (!question) {
          const loaded = await loadLocalQuestions();
          if (loaded) {
            question = getNextLocalQuestion();
          }
        }
      }
      
      // If still no question, show error joke
      if (!question) {
        question = getErrorJoke();
      }
      
      // Normalize and display the question
      const normalizedQuestion = normalizeQuestionData(question);
      this.displayQuestion(normalizedQuestion);
      setCurrentQuestion(normalizedQuestion);
      
      // Focus input box
      if (this.inputBox) {
        this.inputBox.focus();
      }
      
    } catch (error) {
      console.error('❌ Error getting new question:', error);
      this.displayErrorJoke();
    }
  }
  
  displayQuestion(questionData) {
    if (!questionData) return;
    
    console.log('🎨 Displaying question:', questionData);
    
    // Display category and value
    if (this.categoryBox) {
      this.categoryBox.textContent = questionData.category;
    }
    if (this.valueBox) {
      this.valueBox.textContent = `for $${questionData.value}`;
    }
    
    // Display question
    if (this.questionBox) {
      this.questionBox.textContent = questionData.question;
    }
    
    // Set answer (hidden)
    if (this.answerBox) {
      this.answerBox.textContent = questionData.answer;
      this.answerBox.style.display = 'none';
    }
  }
  
  displayErrorJoke() {
    const errorJoke = getErrorJoke();
    this.displayQuestion(errorJoke);
  }
  
  showHideAnswer() {
    if (!this.answerBox) return;
    
    if (this.answerBox.style.display === 'none' || !this.answerBox.style.display) {
      if (gameState.peekTokens > 0) {
        this.answerBox.style.display = 'block';
        revealAnswer();
        console.log(`👁️ Peek tokens remaining: ${gameState.peekTokens}`);
      } else {
        console.log('⚠️ No peek tokens remaining!');
        this.displayMessage('No peek tokens remaining! Try to answer without peeking.');
      }
    } else {
      this.answerBox.style.display = 'none';
    }
  }
  
  checkAnswer() {
    console.log('🎯 Checking answer...');
    
    if (!this.inputBox || !gameState.currentQuestion) {
      console.error('❌ Required elements or question not found');
      return;
    }
    
    const userAnswer = this.inputBox.value.trim();
    const correctAnswer = gameState.currentQuestion.answer || '';
    
    if (!userAnswer) {
      console.log('❌ No answer provided');
      return;
    }
    
    // Check if answer is correct
    const isCorrect = compareAnswers(userAnswer, correctAnswer);
    
    // Clear input
    this.inputBox.value = '';
    
    // Handle revealed answers differently
    if (gameState.answerWasRevealed) {
      if (isCorrect) {
        // Cheeky message for correct after peeking
        const cheekyComment = getCheekyComment();
        const insult = getRandomInsult();
        this.displayMessage(
          `${cheekyComment} Since you looked at the answer, you don't get any points and your streak has been reset.`,
          `The correct answer was "${correctAnswer}", but you knew that, you ${insult}!`
        );
      } else {
        // Wrong answer after peeking
        this.displayMessage(
          'You already saw the answer and still got it wrong! No points for you.',
          `The correct answer was: ${correctAnswer}`
        );
      }
      updateStreak(false);
      return;
    }
    
    // Handle normal answers
    if (isCorrect) {
      // Add points
      const questionValue = parseInt(gameState.currentQuestion.value) || 200;
      updateScore(questionValue);
      updateStreak(true);
      
      this.displayMessage(
        `Correctamundo and cowabunga, my friend! Your streak is now ${gameState.currentStreak}. Keep it going!`,
        ''
      );
    } else {
      updateStreak(false);
      this.displayMessage(
        'Incorrect, you fool! Your streak is now reset! Try again!',
        `The correct answer was: ${correctAnswer}`
      );
    }
    
    // Auto-advance to next question after delay
    if (!gameState.showingMessage) {
      setTimeout(() => {
        this.getNewQuestion();
      }, 3000);
    }
  }
  
  displayMessage(message, answer = '') {
    setShowingMessage(true);
    
    // Clear category and value
    if (this.categoryBox) this.categoryBox.innerHTML = '';
    if (this.valueBox) this.valueBox.innerHTML = '';
    
    // Display message
    if (this.questionBox) {
      this.questionBox.innerHTML = message;
    }
    
    // Display answer if provided
    if (this.answerBox && answer) {
      this.answerBox.innerHTML = answer;
      this.answerBox.style.display = 'flex';
    }
  }
  
  handleEnterKey() {
    if (!gameState.currentQuestion) {
      this.getNewQuestion();
      return;
    }
    
    if (gameState.showingMessage) {
      this.getNewQuestion();
      return;
    }
    
    if (this.inputBox.value.trim()) {
      this.checkAnswer();
    }
  }
}
