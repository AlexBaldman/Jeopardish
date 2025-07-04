/**
 * Main Entry Point
 * Initializes the Jeopardish application with modular architecture
 */

import { GameController } from '@components/game/GameController.js';
import { ScoreBoard } from '@components/ui/ScoreBoard.js';
import { loadSavedState } from '@store/gameState.js';

// Global app state
const app = {
  gameController: null,
  scoreBoard: null,
  initialized: false
};

/**
 * Initialize the application
 */
async function initializeApp() {
  console.log('🚀 Initializing Jeopardish...');
  
  try {
    // Load saved game state
    loadSavedState();
    
    // Initialize scoreboard
    app.scoreBoard = new ScoreBoard('scoreboard');
    
    // Initialize game controller
    app.gameController = new GameController();
    
    // Set up global event listeners
    setupGlobalEventListeners();
    
    // Initialize other features
    await initializeFeatures();
    
    app.initialized = true;
    console.log('✅ Jeopardish initialized successfully!');
    
  } catch (error) {
    console.error('❌ Failed to initialize Jeopardish:', error);
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
  
  // Modal handlers
  setupModalHandlers();
}

/**
 * Initialize additional features
 */
async function initializeFeatures() {
  // Initialize Firebase (if configured)
  // await initializeFirebase();
  
  // Initialize AI features (if API key is configured)
  // await initializeAI();
  
  // Initialize sound system
  // await initializeSounds();
  
  // Initialize animations
  // await initializeAnimations();
}

/**
 * Set up modal handlers
 */
function setupModalHandlers() {
  // Close modal buttons
  const closeButtons = document.querySelectorAll('.close-modal');
  closeButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      const modal = e.target.closest('.modal');
      if (modal) {
        closeModal(modal);
      }
    });
  });
  
  // Click outside to close
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });
  
  // Settings button
  const settingsButton = document.getElementById('settings-button');
  const settingsModal = document.getElementById('settings-modal');
  if (settingsButton && settingsModal) {
    settingsButton.addEventListener('click', () => openModal(settingsModal));
  }
  
  // Stats button
  const statsButton = document.getElementById('stats-button');
  const statsModal = document.getElementById('stats-modal');
  if (statsButton && statsModal) {
    statsButton.addEventListener('click', () => openModal(statsModal));
  }
  
  // Achievements button
  const achievementsButton = document.getElementById('achievements-button');
  const achievementsModal = document.getElementById('achievements-modal');
  if (achievementsButton && achievementsModal) {
    achievementsButton.addEventListener('click', () => openModal(achievementsModal));
  }
}

/**
 * Open a modal
 */
function openModal(modal) {
  if (!modal) return;
  
  modal.style.display = 'flex';
  setTimeout(() => {
    modal.classList.add('active');
    const modalContent = modal.querySelector('.modal-content');
    if (modalContent) {
      modalContent.style.transform = 'scale(1)';
    }
  }, 10);
}

/**
 * Close a modal
 */
function closeModal(modal) {
  if (!modal) return;
  
  const modalContent = modal.querySelector('.modal-content');
  if (modalContent) {
    modalContent.style.transform = 'scale(0.95)';
  }
  modal.classList.remove('active');
  
  setTimeout(() => {
    modal.style.display = 'none';
  }, 300);
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
  const currentLang = langBtn.getAttribute('data-lang') || 'en';
  const newLang = currentLang === 'en' ? 'es' : 'en';
  
  langBtn.setAttribute('data-lang', newLang);
  
  // TODO: Implement actual language switching
  console.log(`Language switched to: ${newLang}`);
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
