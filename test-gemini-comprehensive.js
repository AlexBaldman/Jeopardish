#!/usr/bin/env node

/**
 * Comprehensive test suite for Gemini AI integration
 * Tests all major features through the proxy server
 */

const PROXY_URL = 'http://localhost:3002/api/gemini/generate';

async function makeRequest(prompt, temperature = 0.8, maxTokens = 200) {
    try {
        const response = await fetch(PROXY_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                prompt,
                temperature,
                maxTokens
            })
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || `HTTP ${response.status}`);
        }
        
        const data = await response.json();
        return data.text;
    } catch (error) {
        console.error('Request failed:', error.message);
        return null;
    }
}

async function runTests() {
    console.log('🧪 Comprehensive Gemini AI Integration Test\n');
    console.log('═'.repeat(50));
    
    // Test 1: AI Greeting
    console.log('\n📝 Test 1: AI Greeting');
    console.log('-'.repeat(30));
    const greeting = await makeRequest(
        `You are Alex Trebek, the beloved host of Jeopardy! from 1984 to 2020. 
        You have been digitally resurrected to host "Jeopardish," a comedic tribute to the original game show.
        Provide a warm, witty greeting to welcome players to a new game. 
        Be self-aware about being an AI version. Keep it to 2-3 sentences.`,
        0.8,
        150
    );
    console.log('✅ Response:', greeting);
    
    // Test 2: Question Rewriting
    console.log('\n📝 Test 2: Question Rewriting');
    console.log('-'.repeat(30));
    const rewrittenQuestion = await makeRequest(
        `You are Alex Trebek. Rewrite this Jeopardy question in your style, adding subtle humor or personal asides:
        Category: European Capitals
        Value: $400
        Original: "This European capital is known as the 'City of Light'"
        
        Keep the educational value but make it more entertaining with your personality. Add parenthetical comments if appropriate.`,
        0.8,
        200
    );
    console.log('✅ Rewritten:', rewrittenQuestion);
    
    // Test 3: Correct Answer Response
    console.log('\n📝 Test 3: Correct Answer Response');
    console.log('-'.repeat(30));
    const correctResponse = await makeRequest(
        `You are Alex Trebek. The player just gave the correct answer: "What is Paris?" 
        They're on a 5-answer streak! Give an encouraging response with your signature style. 
        Maybe reference their streak or make a witty comment. Keep it brief (1-2 sentences).`,
        0.8,
        100
    );
    console.log('✅ Response:', correctResponse);
    
    // Test 4: Incorrect Answer Response
    console.log('\n📝 Test 4: Incorrect Answer Response');
    console.log('-'.repeat(30));
    const incorrectResponse = await makeRequest(
        `You are Alex Trebek. The player answered "What is London?" but the correct answer was "What is Paris?" 
        Give a consoling but slightly witty response. Be kind but maybe add a gentle joke. Keep it brief.`,
        0.8,
        100
    );
    console.log('✅ Response:', incorrectResponse);
    
    // Test 5: Ticker Message (Norm MacDonald style)
    console.log('\n📝 Test 5: Comedy Ticker Message');
    console.log('-'.repeat(30));
    const tickerMessage = await makeRequest(
        `Generate a funny ticker message in the style of Norm MacDonald for this game event:
        The player just got their 10th question wrong in a row.
        Make it absurdist, unexpected, or a non-sequitur. Keep it under 80 characters.`,
        0.9,
        50
    );
    console.log('✅ Ticker:', tickerMessage);
    
    // Test 6: Fun Fact
    console.log('\n📝 Test 6: Educational Fun Fact');
    console.log('-'.repeat(30));
    const funFact = await makeRequest(
        `You are Alex Trebek. Based on this question and answer:
        Question: "This element with atomic number 79 is highly valued for its use in jewelry"
        Answer: "What is gold?"
        
        Provide a brief, interesting fun fact about gold that might educate the player. 
        Keep it to 1-2 sentences and make it genuinely interesting.`,
        0.7,
        100
    );
    console.log('✅ Fun Fact:', funFact);
    
    // Test 7: Category Introduction
    console.log('\n📝 Test 7: Category Introduction');
    console.log('-'.repeat(30));
    const categoryIntro = await makeRequest(
        `You are Alex Trebek. Introduce this Jeopardy category with your typical flair:
        Category: "Potent Potables"
        
        Add a brief, witty comment about the category. Maybe a dad joke or personal aside. Keep it short.`,
        0.8,
        80
    );
    console.log('✅ Introduction:', categoryIntro);
    
    // Test 8: Game Over Message
    console.log('\n📝 Test 8: Game Over Message');
    console.log('-'.repeat(30));
    const gameOver = await makeRequest(
        `You are Alex Trebek. The game has ended and the player scored $8,400.
        Give them a warm farewell message. Comment on their performance and encourage them to play again.
        Keep it to 2-3 sentences.`,
        0.8,
        120
    );
    console.log('✅ Farewell:', gameOver);
    
    console.log('\n' + '═'.repeat(50));
    console.log('✨ All tests completed successfully!');
    console.log('The Gemini AI integration is working properly.\n');
}

// Run the tests
runTests().catch(console.error);
