/**
 * Main Entry Point
 * Bootstraps the Jeopardish application with new component architecture
 */

import { createStore } from './state/store.js';
import { App } from './ui/components/App.js';
import { eventBus } from './utils/events.js';
import { SoundManager } from './services/soundManager.js';
import { ComedyTicker } from './services/comedyTicker.js';
import { HostAnimationManager } from './services/hostAnimationManager.js';
import hostAnimationIntegration from './services/hostAnimationIntegration.js';
import { DialogManager } from './services/DialogManager.js';

// Global app context for debugging
const app = {
  store: null,
  eventBus: null,
  rootComponent: null,
  services: {
    sound: null,
    comedyTicker: null,
    hostAnimations: null,
    dialog: null
  },
  initialized: false
};

/**
 * Initialize the application
 */
async function initializeApp() {
  console.log('🚀 Initializing Jeopardish...');
  
  try {
    // Initialize event bus
    app.eventBus = eventBus;
    
    // Initialize store
    app.store = createStore();
    
    // Mount root component
    const rootElement = document.getElementById('app');
    if (!rootElement) {
      throw new Error('Root element #app not found');
    }
    
    app.rootComponent = new App({
      container: rootElement,
      store: app.store,
      eventBus: app.eventBus
    });
    
    // Initialize root component
    app.rootComponent.init();
    
    // Set up global event listeners
    setupGlobalEventListeners();
    
    // Initialize features
    await initializeFeatures();
    
    app.initialized = true;
    console.log('✅ Jeopardish initialized successfully!');
    
  } catch (error) {
    console.error('❌ Failed to initialize Jeopardish:', error);
    handleFatalError(error);
  }
}

/**
 * Handle fatal initialization errors
 */
function handleFatalError(error) {
  const rootElement = document.getElementById('app');
  if (rootElement) {
    rootElement.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <h1>😕 Oops! Something went wrong</h1>
        <p>Failed to initialize Jeopardish</p>
        <pre style="text-align: left; background: #f5f5f5; padding: 1rem; margin: 1rem auto; max-width: 600px; overflow: auto;">${error.message}</pre>
        <button onclick="location.reload()" style="padding: 0.5rem 1rem; font-size: 1rem; cursor: pointer;">Reload Page</button>
      </div>
    `;
  }
}

/**
 * Set up global event listeners
 */
function setupGlobalEventListeners() {
  // Theme toggle
  const themeSwitch = document.getElementById('theme-switch');
  if (themeSwitch) {
    themeSwitch.addEventListener('change', toggleTheme);
  }
  
  // Language toggle
  const langBtn = document.getElementById('lang-btn');
  if (langBtn) {
    langBtn.addEventListener('click', toggleLanguage);
  }
  
  // Hamburger menu
  const hamburgerMenu = document.getElementById('hamburger-menu');
  const sideMenu = document.getElementById('side-menu');
  if (hamburgerMenu && sideMenu) {
    hamburgerMenu.addEventListener('click', () => {
      sideMenu.classList.toggle('active');
      hamburgerMenu.classList.toggle('active');
    });
  }
  
  // Set up event-driven modal handling
  setupEventDrivenModals();
}

/**
 * Initialize additional features
 */
async function initializeFeatures() {
  // Initialize sound system
  app.services.sound = new SoundManager();
  await app.services.sound.init();
  
  // Initialize comedy ticker
  app.services.comedyTicker = new ComedyTicker({
    container: document.getElementById('comedy-ticker-container'),
    eventBus: app.eventBus
  });
  app.services.comedyTicker.init();
  
  // Initialize host animations
  app.services.hostAnimations = new HostAnimationManager({
    container: document.getElementById('host-container'),
    eventBus: app.eventBus,
    soundManager: app.services.sound
  });
  app.services.hostAnimations.init();
  
  // Initialize dialog manager
  app.services.dialog = DialogManager.getInstance();
  app.services.dialog.setDependencies({
    eventBus: app.eventBus,
    hostAnimations: app.services.hostAnimations,
    soundManager: app.services.sound
  });
  await app.services.dialog.init();
  
  // Initialize Firebase (if configured)
  // await initializeFirebase();
  
  // Initialize AI features (if API key is configured)
  // await initializeAI();
}

/**
 * Set up event-driven modal handling
 */
function setupEventDrivenModals() {
  // Settings button
  const settingsButton = document.getElementById('settings-button');
  if (settingsButton) {
    settingsButton.addEventListener('click', () => {
      app.eventBus.emit('modal:open', { type: 'settings' });
    });
  }
  
  // Stats button
  const statsButton = document.getElementById('stats-button');
  if (statsButton) {
    statsButton.addEventListener('click', () => {
      app.eventBus.emit('modal:open', { type: 'stats' });
    });
  }
  
  // Achievements button
  const achievementsButton = document.getElementById('achievements-button');
  if (achievementsButton) {
    achievementsButton.addEventListener('click', () => {
      app.eventBus.emit('modal:open', { type: 'achievements' });
    });
  }
  
  // Help button
  const helpButton = document.getElementById('help-button');
  if (helpButton) {
    helpButton.addEventListener('click', () => {
      app.eventBus.emit('modal:open', { type: 'help' });
    });
  }
  
  // Leaderboard button
  const leaderboardButton = document.getElementById('leaderboard-button');
  if (leaderboardButton) {
    leaderboardButton.addEventListener('click', () => {
      app.eventBus.emit('modal:open', { type: 'leaderboard' });
    });
  }
  
  // Profile button
  const profileButton = document.getElementById('profile-button');
  if (profileButton) {
    profileButton.addEventListener('click', () => {
      app.eventBus.emit('modal:open', { type: 'profile' });
    });
  }
}

/**
 * Toggle theme
 */
function toggleTheme(e) {
  const isDark = e.target.checked;
  document.body.classList.toggle('dark-theme', isDark);
  localStorage.setItem('jeopardish_theme', isDark ? 'dark' : 'light');
}

/**
 * Toggle language
 */
function toggleLanguage() {
  const langBtn = document.getElementById('lang-btn');
  if (!langBtn) return;
  
  const currentLang = langBtn.getAttribute('data-lang') || 'en';
  const newLang = currentLang === 'en' ? 'pt-BR' : 'en';
  
  langBtn.setAttribute('data-lang', newLang);
  langBtn.textContent = newLang === 'en' ? 'EN' : 'PT';
  
  // Emit language change event
  if (app && app.eventBus) {
    app.eventBus.emit('language:changed', { lang: newLang });
  }
  
  // TODO: Implement actual translation loading
  console.log(`🌐 Language switched to: ${newLang}`);
}

/**
 * Load saved preferences
 */
function loadPreferences() {
  // Load theme preference
  const savedTheme = localStorage.getItem('jeopardish_theme');
  if (savedTheme === 'dark') {
    document.body.classList.add('dark-theme');
    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch) {
      themeSwitch.checked = true;
    }
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    loadPreferences();
    initializeApp();
  });
} else {
  loadPreferences();
  initializeApp();
}

// Export for debugging
window.jeopardishApp = app;
