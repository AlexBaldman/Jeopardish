import { 
  gameState, 
  updateScore, 
  updateStreak, 
  setCurrentQuestion,
  revealAnswer,
  setShowingMessage,
  resetGame,
  loadSavedState,
  subscribeToState,
  storage
} from '../gameState';

describe('Game State Module', () => {
  beforeEach(() => {
    // Reset state before each test
    resetGame();
    // Set up storage mocks
    storage.getItem = jest.fn();
    storage.setItem = jest.fn();
  });

  describe('updateScore', () => {
    test('should increase current score', () => {
      updateScore(200);
      expect(gameState.currentScore).toBe(200);
      
      updateScore(300);
      expect(gameState.currentScore).toBe(500);
    });

    test('should update best score when current exceeds it', () => {
      gameState.bestScore = 100;
      updateScore(200);
      
      expect(gameState.bestScore).toBe(200);
      expect(storage.setItem).toHaveBeenCalledWith('jeopardish_bestScore', '200');
    });

    test('should not update best score when current is lower', () => {
      gameState.bestScore = 500;
      updateScore(100);
      
      expect(gameState.bestScore).toBe(500);
    });
  });

  describe('updateStreak', () => {
    test('should increment streak on correct answer', () => {
      updateStreak(true);
      expect(gameState.currentStreak).toBe(1);
      
      updateStreak(true);
      expect(gameState.currentStreak).toBe(2);
    });

    test('should reset streak on incorrect answer', () => {
      gameState.currentStreak = 5;
      updateStreak(false);
      expect(gameState.currentStreak).toBe(0);
    });

    test('should update best streak when current exceeds it', () => {
      updateStreak(true);
      updateStreak(true);
      updateStreak(true);
      
      expect(gameState.bestStreak).toBe(3);
      expect(storage.setItem).toHaveBeenCalledWith('jeopardish_bestStreak', '3');
    });
  });

  describe('setCurrentQuestion', () => {
    test('should set current question and reset flags', () => {
      const question = { 
        question: 'Test question', 
        answer: 'Test answer' 
      };
      
      gameState.answerWasRevealed = true;
      gameState.showingMessage = true;
      
      setCurrentQuestion(question);
      
      expect(gameState.currentQuestion).toEqual(question);
      expect(gameState.answerWasRevealed).toBe(false);
      expect(gameState.showingMessage).toBe(false);
    });
  });

  describe('revealAnswer', () => {
    test('should set answerWasRevealed flag', () => {
      revealAnswer();
      expect(gameState.answerWasRevealed).toBe(true);
    });

    test('should decrement peek tokens', () => {
      gameState.peekTokens = 3;
      revealAnswer();
      expect(gameState.peekTokens).toBe(2);
    });

    test('should not go below 0 peek tokens', () => {
      gameState.peekTokens = 0;
      revealAnswer();
      expect(gameState.peekTokens).toBe(0);
    });
  });

  describe('resetGame', () => {
    test('should reset all game state except best scores', () => {
      // Set up state
      gameState.currentScore = 500;
      gameState.currentStreak = 5;
      gameState.bestScore = 1000;
      gameState.bestStreak = 10;
      gameState.currentQuestion = { question: 'test' };
      gameState.answerWasRevealed = true;
      gameState.showingMessage = true;
      gameState.peekTokens = 2;
      
      resetGame();
      
      expect(gameState.currentScore).toBe(0);
      expect(gameState.currentStreak).toBe(0);
      expect(gameState.bestScore).toBe(1000); // Should not reset
      expect(gameState.bestStreak).toBe(10); // Should not reset
      expect(gameState.currentQuestion).toBe(null);
      expect(gameState.answerWasRevealed).toBe(false);
      expect(gameState.showingMessage).toBe(false);
      expect(gameState.peekTokens).toBe(5);
    });
  });

  describe('loadSavedState', () => {
    test('should load best scores from localStorage', () => {
      storage.getItem.mockImplementation((key) => {
        if (key === 'jeopardish_bestScore') return '2000';
        if (key === 'jeopardish_bestStreak') return '15';
        return null;
      });
      
      loadSavedState();
      
      expect(gameState.bestScore).toBe(2000);
      expect(gameState.bestStreak).toBe(15);
    });

    test('should handle missing localStorage data', () => {
      // Reset best scores to 0 before testing
      gameState.bestScore = 0;
      gameState.bestStreak = 0;
      
      storage.getItem.mockReturnValue(null);
      
      loadSavedState();
      
      expect(gameState.bestScore).toBe(0);
      expect(gameState.bestStreak).toBe(0);
    });
  });

  describe('subscribeToState', () => {
    test('should notify subscribers on state changes', () => {
      const callback = jest.fn();
      const unsubscribe = subscribeToState(callback);
      
      // Reset best score to 0 for this test
      gameState.bestScore = 0;
      
      updateScore(100);
      
      expect(callback).toHaveBeenCalledWith({
        property: 'score',
        value: { current: 100, best: 100 },
        state: gameState
      });
      
      // Test unsubscribe
      unsubscribe();
      updateScore(200);
      expect(callback).toHaveBeenCalledTimes(1); // Should not be called again
    });
  });
});
