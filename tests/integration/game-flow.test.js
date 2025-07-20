/**
 * Game Flow Integration Test
 * 
 * Tests the complete game flow from initialization through
 * question display, answering, and score updates.
 * 
 * Following Carmack's approach:
 * - Test real user interactions
 * - Verify state transitions
 * - Ensure proper event flow
 */

import { 
    createTestEnvironment, 
    loadTestQuestions,
    waitForState,
    waitForEvent,
    simulateUserInput,
    simulateClick,
    assertState,
    TestProfiler
} from './setup.js';

describe('Game Flow Integration', () => {
    let env;
    let profiler;
    
    beforeEach(async () => {
        profiler = new TestProfiler();
        profiler.mark('setup-start');
        
        env = createTestEnvironment();
        await loadTestQuestions();
        
        profiler.mark('setup-end');
        profiler.measure('Setup', 'setup-start', 'setup-end');
    });
    
    afterEach(() => {
        env.cleanup();
        console.log('Performance:', profiler.getReport());
    });
    
    test('Complete game round flow', async () => {
        const { store, eventBus, container } = env;
        
        profiler.mark('test-start');
        
        // Initial state verification
        assertState(store.getState(), {
            game: {
                currentQuestion: null,
                score: 0,
                questionsAnswered: 0,
                showAnswer: false,
                userAnswer: ''
            }
        });
        
        // Get new question
        profiler.mark('new-question-start');
        const newQuestionBtn = container.querySelector('[data-action="new-question"]');
        expect(newQuestionBtn).toBeTruthy();
        
        simulateClick(newQuestionBtn);
        
        // Wait for question to load
        await waitForState(store, state => state.game.currentQuestion !== null);
        profiler.measure('New Question', 'new-question-start');
        
        const state1 = store.getState();
        expect(state1.game.currentQuestion).toBeTruthy();
        expect(state1.game.currentQuestion.question).toBeTruthy();
        expect(state1.game.showAnswer).toBe(false);
        
        // Verify UI updated
        const questionDisplay = container.querySelector('.question-display');
        expect(questionDisplay.textContent).toContain(state1.game.currentQuestion.question);
        expect(questionDisplay.textContent).toContain(`$${state1.game.currentQuestion.value}`);
        
        // Type an answer
        profiler.mark('answer-input-start');
        const answerInput = container.querySelector('input[type="text"]');
        expect(answerInput).toBeTruthy();
        
        simulateUserInput(answerInput, 'test answer');
        
        await waitForState(store, state => state.game.userAnswer === 'test answer');
        profiler.measure('Answer Input', 'answer-input-start');
        
        // Submit answer
        profiler.mark('submit-answer-start');
        const submitBtn = container.querySelector('[data-action="submit-answer"]');
        expect(submitBtn).toBeTruthy();
        
        const questionValue = state1.game.currentQuestion.value;
        simulateClick(submitBtn);
        
        // Wait for answer check
        await waitForEvent(eventBus, 'answer.checked');
        await waitForState(store, state => state.game.showAnswer === true);
        profiler.measure('Submit Answer', 'submit-answer-start');
        
        // Verify answer shown
        const state2 = store.getState();
        expect(state2.game.showAnswer).toBe(true);
        expect(state2.game.questionsAnswered).toBe(1);
        
        // Check if score was updated (depends on answer correctness)
        const answerDisplay = container.querySelector('.answer-display');
        expect(answerDisplay).toBeTruthy();
        expect(answerDisplay.textContent).toContain(state1.game.currentQuestion.answer);
        
        // Get another question
        profiler.mark('next-question-start');
        simulateClick(newQuestionBtn);
        
        await waitForState(store, state => 
            state.game.currentQuestion !== null && 
            state.game.currentQuestion.question !== state1.game.currentQuestion.question
        );
        profiler.measure('Next Question', 'next-question-start');
        
        // Verify state reset
        const state3 = store.getState();
        expect(state3.game.showAnswer).toBe(false);
        expect(state3.game.userAnswer).toBe('');
        expect(state3.game.currentQuestion).not.toEqual(state1.game.currentQuestion);
        
        profiler.measure('Complete Test', 'test-start');
    });
    
    test('Show answer without submitting', async () => {
        const { store, container } = env;
        
        // Get a question first
        const newQuestionBtn = container.querySelector('[data-action="new-question"]');
        simulateClick(newQuestionBtn);
        
        await waitForState(store, state => state.game.currentQuestion !== null);
        
        // Click show answer directly
        const showAnswerBtn = container.querySelector('[data-action="show-answer"]');
        expect(showAnswerBtn).toBeTruthy();
        
        simulateClick(showAnswerBtn);
        
        await waitForState(store, state => state.game.showAnswer === true);
        
        // Verify state
        const state = store.getState();
        expect(state.game.showAnswer).toBe(true);
        expect(state.game.score).toBe(0); // No score change when just showing answer
        
        // Verify UI
        const answerDisplay = container.querySelector('.answer-display');
        expect(answerDisplay).toBeTruthy();
        expect(answerDisplay.style.display).not.toBe('none');
    });
    
    test('Button states during game flow', async () => {
        const { store, container } = env;
        
        const newQuestionBtn = container.querySelector('[data-action="new-question"]');
        const showAnswerBtn = container.querySelector('[data-action="show-answer"]');
        const submitBtn = container.querySelector('[data-action="submit-answer"]');
        
        // Initial state - only new question enabled
        expect(newQuestionBtn.disabled).toBe(false);
        expect(showAnswerBtn.disabled).toBe(true);
        expect(submitBtn.disabled).toBe(true);
        
        // After getting question
        simulateClick(newQuestionBtn);
        await waitForState(store, state => state.game.currentQuestion !== null);
        
        expect(newQuestionBtn.disabled).toBe(false);
        expect(showAnswerBtn.disabled).toBe(false);
        expect(submitBtn.disabled).toBe(true); // Still disabled without input
        
        // After typing answer
        const answerInput = container.querySelector('input[type="text"]');
        simulateUserInput(answerInput, 'some answer');
        await waitForState(store, state => state.game.userAnswer.length > 0);
        
        expect(submitBtn.disabled).toBe(false);
        
        // After showing answer
        simulateClick(showAnswerBtn);
        await waitForState(store, state => state.game.showAnswer === true);
        
        expect(showAnswerBtn.disabled).toBe(true);
        expect(submitBtn.disabled).toBe(true);
    });
    
    test('Score calculation for correct answers', async () => {
        const { store, container, eventBus } = env;
        
        // Get a specific question we know the answer to
        const newQuestionBtn = container.querySelector('[data-action="new-question"]');
        
        // Keep getting questions until we get the one we want
        let attempts = 0;
        while (attempts < 10) {
            simulateClick(newQuestionBtn);
            await waitForState(store, state => state.game.currentQuestion !== null);
            
            const state = store.getState();
            if (state.game.currentQuestion.answer === 'What is a test answer') {
                break;
            }
            attempts++;
        }
        
        const currentState = store.getState();
        expect(currentState.game.currentQuestion.answer).toBe('What is a test answer');
        const questionValue = currentState.game.currentQuestion.value;
        
        // Submit correct answer (without "What is")
        const answerInput = container.querySelector('input[type="text"]');
        simulateUserInput(answerInput, 'a test answer');
        
        await waitForState(store, state => state.game.userAnswer === 'a test answer');
        
        const submitBtn = container.querySelector('[data-action="submit-answer"]');
        simulateClick(submitBtn);
        
        // Wait for answer check
        const event = await waitForEvent(eventBus, 'answer.checked');
        expect(event.detail.correct).toBe(true);
        
        await waitForState(store, state => state.game.score === questionValue);
        
        // Verify score updated
        const finalState = store.getState();
        expect(finalState.game.score).toBe(questionValue);
        expect(finalState.game.correctAnswers).toBe(1);
        
        // Verify UI shows updated score
        const scoreDisplay = container.querySelector('.score');
        expect(scoreDisplay.textContent).toContain(`$${questionValue}`);
    });
    
    test('Performance under rapid interactions', async () => {
        const { store, container } = env;
        const iterations = 10;
        
        profiler.mark('rapid-test-start');
        
        for (let i = 0; i < iterations; i++) {
            profiler.mark(`iteration-${i}-start`);
            
            // Get question
            const newQuestionBtn = container.querySelector('[data-action="new-question"]');
            simulateClick(newQuestionBtn);
            await waitForState(store, state => state.game.currentQuestion !== null);
            
            // Type answer quickly
            const answerInput = container.querySelector('input[type="text"]');
            simulateUserInput(answerInput, `answer ${i}`);
            
            // Submit immediately
            const submitBtn = container.querySelector('[data-action="submit-answer"]');
            if (!submitBtn.disabled) {
                simulateClick(submitBtn);
                await waitForState(store, state => state.game.showAnswer === true);
            }
            
            profiler.measure(`Iteration ${i}`, `iteration-${i}-start`);
        }
        
        profiler.measure('Rapid Interactions', 'rapid-test-start');
        
        // Verify system still responsive
        const state = store.getState();
        expect(state.game.questionsAnswered).toBeGreaterThanOrEqual(iterations - 1);
        
        // Check average interaction time
        const report = profiler.getReport();
        const avgTime = report.measures
            .filter(m => m.name.startsWith('Iteration'))
            .reduce((sum, m) => sum + parseFloat(m.duration), 0) / iterations;
        
        console.log(`Average interaction time: ${avgTime.toFixed(2)}ms`);
        expect(avgTime).toBeLessThan(100); // Should be fast
    });
});
