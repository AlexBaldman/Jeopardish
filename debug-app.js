// Debug script to understand the current state
console.log('🔍 JEOPARDISH DEBUG SCRIPT RUNNING');

// Check if Vite modules are loading
console.log('🔍 Checking module imports...');

// Check for app initialization
setTimeout(() => {
  console.log('🔍 Checking app state after 2 seconds...');
  
  // Check if the new app initialized
  if (window.jeopardishApp) {
    console.log('✅ New app found:', window.jeopardishApp);
    console.log('  - Initialized:', window.jeopardishApp.initialized);
    console.log('  - Store:', window.jeopardishApp.store);
    console.log('  - Services:', window.jeopardishApp.services);
  } else {
    console.log('❌ New app NOT found on window.jeopardishApp');
  }
  
  // Check if App component exists in DOM
  const appElement = document.querySelector('jeopardish-app');
  if (appElement) {
    console.log('✅ App custom element found in DOM');
  } else {
    console.log('❌ App custom element NOT in DOM');
  }
  
  // Check for old system elements
  const oldElements = {
    questionButton: document.getElementById('questionButton'),
    answerButton: document.getElementById('answerButton'),
    checkButton: document.getElementById('checkButton'),
    questionBox: document.getElementById('questionBox'),
    answerBox: document.getElementById('answerBox')
  };
  
  console.log('🔍 Old system elements:', oldElements);
  
  // Check if questions are available
  if (window.questions || window.allQuestions) {
    console.log('✅ Questions found on window:', {
      questions: window.questions?.length,
      allQuestions: window.allQuestions?.length
    });
  } else {
    console.log('❌ No questions found on window');
  }
  
  // Check for Firebase
  if (window.firebase) {
    console.log('✅ Firebase loaded');
  } else {
    console.log('❌ Firebase NOT loaded');
  }
  
  // Check for custom elements registration
  console.log('🔍 Registered custom elements:', 
    Array.from(customElements.entries || []).map(([name]) => name)
  );
  
}, 2000);

// Listen for events
console.log('🔍 Setting up event listeners...');
if (window.eventBus) {
  window.eventBus.on('*', (event, data) => {
    console.log('📢 Event:', event, data);
  });
}

// Export debug function
window.debugJeopardish = () => {
  console.log('=== JEOPARDISH DEBUG INFO ===');
  console.log('App:', window.jeopardishApp);
  console.log('DOM #app:', document.getElementById('app'));
  console.log('Custom elements:', document.querySelectorAll('jeopardish-app'));
  console.log('Questions loaded:', {
    questions: window.questions?.length,
    allQuestions: window.allQuestions?.length
  });
  console.log('Console errors:', window.consoleErrors || []);
};

console.log('💡 Run window.debugJeopardish() for detailed info');
