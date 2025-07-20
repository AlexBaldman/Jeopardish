/**
 * Integration Test Setup
 * 
 * Provides utilities and helpers for integration testing
 * the Jeopardish game components and state management.
 * 
 * Following Carmack's principles:
 * - Test real interactions, not mocks
 * - Focus on data flow and state transitions
 * - Verify system behavior, not implementation details
 */

import { createStore } from '../../src/state/store.js';
import { EventBus } from '../../src/utils/events.js';
import { App } from '../../src/ui/components/App.js';
import { loadQuestionBank } from '../../src/core/question.js';

/**
 * Create a test environment with real components
 */
export function createTestEnvironment() {
    // Create real instances, not mocks
    const store = createStore();
    const eventBus = new EventBus();
    
    // Create a test container
    const container = document.createElement('div');
    container.id = 'test-app';
    document.body.appendChild(container);
    
    // Mount the app
    const app = new App(container, { store, eventBus });
    
    return {
        store,
        eventBus,
        app,
        container,
        cleanup: () => {
            app.destroy();
            document.body.removeChild(container);
        }
    };
}

/**
 * Load test question data
 */
export async function loadTestQuestions() {
    const testQuestions = [
        {
            category: "TEST CATEGORY",
            value: 200,
            question: "This is a test question",
            answer: "What is a test answer",
            air_date: "2024-01-01"
        },
        {
            category: "TEST CATEGORY",
            value: 400,
            question: "Another test question with multiple valid answers",
            answer: "What is option one (or option two)",
            air_date: "2024-01-01"
        },
        {
            category: "SCIENCE",
            value: 600,
            question: "The speed of light in a vacuum",
            answer: "What is 299,792,458 meters per second",
            air_date: "2024-01-01"
        }
    ];
    
    await loadQuestionBank(testQuestions);
    return testQuestions;
}

/**
 * Wait for state change
 */
export function waitForState(store, predicate, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const startTime = Date.now();
        
        const unsubscribe = store.subscribe(() => {
            const state = store.getState();
            if (predicate(state)) {
                unsubscribe();
                resolve(state);
            } else if (Date.now() - startTime > timeout) {
                unsubscribe();
                reject(new Error('Timeout waiting for state change'));
            }
        });
        
        // Check immediately
        const currentState = store.getState();
        if (predicate(currentState)) {
            unsubscribe();
            resolve(currentState);
        }
    });
}

/**
 * Wait for event
 */
export function waitForEvent(eventBus, eventType, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            eventBus.off(eventType, handler);
            reject(new Error(`Timeout waiting for event: ${eventType}`));
        }, timeout);
        
        const handler = (event) => {
            clearTimeout(timer);
            resolve(event);
        };
        
        eventBus.once(eventType, handler);
    });
}

/**
 * Simulate user input
 */
export function simulateUserInput(input, value) {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
}

/**
 * Simulate button click
 */
export function simulateClick(button) {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

/**
 * Assert state matches expected shape
 */
export function assertState(state, expected) {
    const errors = [];
    
    function check(actual, expected, path = '') {
        if (expected === undefined) return;
        
        if (typeof expected === 'object' && expected !== null) {
            if (typeof actual !== 'object' || actual === null) {
                errors.push(`${path}: expected object, got ${typeof actual}`);
                return;
            }
            
            for (const key in expected) {
                check(actual[key], expected[key], path ? `${path}.${key}` : key);
            }
        } else if (actual !== expected) {
            errors.push(`${path}: expected ${expected}, got ${actual}`);
        }
    }
    
    check(state, expected);
    
    if (errors.length > 0) {
        throw new Error(`State assertion failed:\n${errors.join('\n')}`);
    }
}

/**
 * Performance profiler for integration tests
 */
export class TestProfiler {
    constructor() {
        this.marks = new Map();
        this.measures = [];
    }
    
    mark(name) {
        this.marks.set(name, performance.now());
    }
    
    measure(name, startMark, endMark) {
        const start = this.marks.get(startMark);
        const end = endMark ? this.marks.get(endMark) : performance.now();
        
        if (!start) {
            throw new Error(`Start mark '${startMark}' not found`);
        }
        
        const duration = end - start;
        this.measures.push({ name, duration, start, end });
        
        return duration;
    }
    
    getReport() {
        return {
            measures: this.measures.map(m => ({
                name: m.name,
                duration: `${m.duration.toFixed(2)}ms`
            })),
            total: this.measures.reduce((sum, m) => sum + m.duration, 0).toFixed(2) + 'ms'
        };
    }
}
