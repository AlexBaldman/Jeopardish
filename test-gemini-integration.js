/**
 * Test script for Gemini AI integration
 * Run this to verify the API is working correctly
 */

// Simple test without module imports for direct browser testing
async function testGeminiIntegration() {
    console.log('🧪 Testing Gemini AI Integration...\n');
    
    // Check if API key is configured
    const apiKey = 'AIzaSyA6ew-A399YaDOPYdyHzLYo0xaM2HGxbqA';
    if (!apiKey) {
        console.error('❌ No API key found! Please set VITE_GEMINI_API_KEY in your .env file');
        return;
    }
    
    console.log('✅ API key found');
    
    // Test 1: Direct API call
    console.log('\n📝 Test 1: Direct API Call...');
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: "Say 'Hello, I am AI Alex Trebek!' in a witty way"
                    }]
                }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 100,
                }
            })
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        const aiResponse = data.candidates[0].content.parts[0].text;
        console.log('✅ API Response:', aiResponse);
    } catch (error) {
        console.error('❌ API Test Failed:', error.message);
        return;
    }
    
    // Test 2: Question rewriting
    console.log('\n📝 Test 2: Question Rewriting...');
    try {
        const testQuestion = "This European capital is known as the 'City of Light'";
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are Alex Trebek. Rewrite this Jeopardy question in your style with subtle humor:
                        Category: Geography
                        Value: $200
                        Original: "${testQuestion}"
                        Keep it educational but add your personality.`
                    }]
                }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 200,
                }
            })
        });
        
        const data = await response.json();
        const rewrittenQuestion = data.candidates[0].content.parts[0].text;
        console.log('✅ Original:', testQuestion);
        console.log('✅ Rewritten:', rewrittenQuestion);
    } catch (error) {
        console.error('❌ Question Rewriting Failed:', error.message);
    }
    
    // Test 3: Response generation
    console.log('\n📝 Test 3: Response Generation...');
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `You are Alex Trebek. The player just got the correct answer "Paris". They're on a 5-answer streak. Give an encouraging response with your signature style.`
                    }]
                }],
                generationConfig: {
                    temperature: 0.8,
                    maxOutputTokens: 100,
                }
            })
        });
        
        const data = await response.json();
        const correctResponse = data.candidates[0].content.parts[0].text;
        console.log('✅ Correct Answer Response:', correctResponse);
    } catch (error) {
        console.error('❌ Response Generation Failed:', error.message);
    }
    
    // Test 4: Ticker message
    console.log('\n📝 Test 4: Ticker Message Generation...');
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Generate a funny ticker message in the style of Norm MacDonald for this game event: Player just got their 10th question wrong in a row. Make it absurdist and under 100 characters.`
                    }]
                }],
                generationConfig: {
                    temperature: 0.9,
                    maxOutputTokens: 50,
                }
            })
        });
        
        const data = await response.json();
        const tickerMessage = data.candidates[0].content.parts[0].text;
        console.log('✅ Ticker Message:', tickerMessage);
    } catch (error) {
        console.error('❌ Ticker Generation Failed:', error.message);
    }
    
    console.log('\n🎉 Testing complete! Check the results above.');
    console.log('💡 If all tests passed, your Gemini integration is working correctly!');
}

// Add button to run test in browser console
if (typeof window !== 'undefined') {
    window.testGemini = testGeminiIntegration;
    console.log('💡 Run testGemini() in the console to test the Gemini integration');
}

// Auto-run if called directly
if (typeof module !== 'undefined' && require.main === module) {
    testGeminiIntegration();
}
