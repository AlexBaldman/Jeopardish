/**
 * Test script for AI Trebek integration
 * This can be run directly from the browser console to test 
 * the AI functionality without modifying app.js
 */

// Test function to verify AI integration
async function testAITrebek() {
  console.log('🧪 Testing AI Trebek integration...');
  
  try {
    // Import modules dynamically for testing
    const trebekModule = await import('./src/ai/trebek.js');
    
    // Test with a sample context
    const testContext = {
      prompt: 'new_question',
      gameState: {
        currentScore: 400,
        currentStreak: 2,
        bestScore: 800,
        bestStreak: 5
      },
      question: "This president delivered the Gettysburg Address",
      answer: "Abraham Lincoln",
      category: "U.S. History",
      value: 400
    };
    
    console.log('🔄 Sending test request to AI...');
    const response = await trebekModule.trebekReply(testContext);
    
    // Display the result
    console.log('✅ AI Trebek Response:', response);
    
    // Display in UI for easier visibility
    const categoryBox = document.getElementById('categoryBox');
    const valueBox = document.getElementById('valueBox');
    const questionBox = document.getElementById('questionBox');
    const answerBox = document.getElementById('answerBox');
    
    if (categoryBox && valueBox && questionBox && answerBox) {
      categoryBox.innerHTML = "TEST MODE";
      valueBox.innerHTML = "AI Trebek";
      questionBox.innerHTML = `AI RESPONSE: ${response}`;
      answerBox.innerHTML = "This is a test of the AI integration";
      answerBox.style.display = "flex";
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error testing AI Trebek:', error);
    return false;
  }
}

// Test for API key configuration
function checkAPIKey() {
  const apiKey = localStorage.getItem('GOOGLE_AI_API_KEY');
  if (!apiKey) {
    console.warn('⚠️ No API key found in localStorage');
    
    // Prompt user to enter an API key for testing
    const key = prompt('Enter your Google AI API Key for testing:');
    if (key) {
      localStorage.setItem('GOOGLE_AI_API_KEY', key);
      console.log('✅ API key stored in localStorage for testing');
      return true;
    }
    return false;
  }
  return true;
}

// Run tests
async function runTests() {
  console.group('🧪 AI Trebek Integration Tests');
  
  if (!checkAPIKey()) {
    console.error('❌ No API key available for testing');
    console.groupEnd();
    return;
  }
  
  const result = await testAITrebek();
  console.log(result ? '✅ Tests passed!' : '❌ Tests failed!');
  
  console.groupEnd();
}

// Make test function available globally
window.testAITrebek = runTests;

console.log('🧪 AI Trebek test script loaded. Run window.testAITrebek() to test the integration.');
