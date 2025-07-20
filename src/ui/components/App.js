import ConnectedComponent from '../base/ConnectedComponent.js';
import { ScoreBoard, QuestionDisplay, GameControls, ModalManager } from './index.js';
import { eventBus } from '../../utils/events.js';
import { GAME_PHASES } from '../../utils/constants.js';
import soundManager from '../../services/audio/SoundManager.js';

/**
 * Main application component that orchestrates all UI components.
 * 
 * Responsibilities:
 * - Component composition and layout
 * - High-level application state management
 * - Initialization and cleanup
 * 
 * @extends ConnectedComponent
 */
class App extends ConnectedComponent {
  constructor(config = {}) {
    super();
    this.config = config;
    this.store = config.store;
    this.eventBus = config.eventBus;
    this.container = config.container;
    this.children = {
      scoreBoard: null,
      questionDisplay: null,
      gameControls: null,
      modalManager: null
    };
  }

  // State selectors
  selectState(state) {
    return {
      phase: state.game.phase,
      isInitialized: state.game.phase !== GAME_PHASES.INITIAL
    };
  }

  // Initialize the component
  init() {
    console.log('🎮 App component initializing...');
    this.classList.add('app-container');
    this.initializeComponents();
    
    // Initialize sound manager
    this.initializeSoundManager();
    
    // Initialize game if needed
    if (!this.state || !this.state.isInitialized) {
      console.log('🎮 Emitting game:initialize event');
      this.eventBus.emit('game:initialize');
    }
    
    // Add to container if provided
    if (this.container) {
      this.container.appendChild(this);
    }
  }
  
  // Lifecycle methods
  connectedCallback() {
    super.connectedCallback();
    console.log('🎮 App component connected to DOM');
  }

  disconnectedCallback() {
    this.cleanupComponents();
    super.disconnectedCallback();
  }

  // Component management
  initializeComponents() {
    // Create header with sticky positioning
    const header = document.createElement('header');
    header.className = 'game-header';
    
    // Create left controls container
    const leftControls = document.createElement('div');
    leftControls.className = 'header-left';
    
    // Theme toggle
    const themeSwitch = document.createElement('div');
    themeSwitch.className = 'theme-switch';
    themeSwitch.innerHTML = `
      <button class="theme-toggle" aria-label="Toggle theme">
        <span class="theme-icon">🌞</span>
      </button>
    `;
    
    // Language toggle
    const languageToggle = document.createElement('div');
    languageToggle.className = 'language-toggle';
    languageToggle.innerHTML = `
      <button class="lang-button" aria-label="Change language">
        <span class="lang-icon">🌐</span>
      </button>
    `;
    
    leftControls.appendChild(themeSwitch);
    leftControls.appendChild(languageToggle);
    
    // Create center logo
    const logoContainer = document.createElement('div');
    logoContainer.className = 'header-center';
    logoContainer.innerHTML = `
      <img src="images/jeoparody.png" alt="Jeopardish Logo" class="game-logo">
    `;
    
    // Create right hamburger menu
    const rightControls = document.createElement('div');
    rightControls.className = 'header-right';
    const hamburger = document.createElement('button');
    hamburger.className = 'hamburger-menu';
    hamburger.id = 'hamburger-menu';
    hamburger.setAttribute('aria-label', 'Toggle menu');
    hamburger.innerHTML = `
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
      <span class="hamburger-line"></span>
    `;
    rightControls.appendChild(hamburger);
    
    // Build header
    header.appendChild(leftControls);
    header.appendChild(logoContainer);
    header.appendChild(rightControls);
    
    // Create side menu
    const sideMenu = document.createElement('nav');
    sideMenu.className = 'side-menu';
    sideMenu.id = 'side-menu';
    sideMenu.innerHTML = `
      <div class="menu-header">
        <h3>Menu</h3>
        <button class="close-menu" aria-label="Close menu">×</button>
      </div>
      <ul class="menu-items">
        <li><button data-action="settings">⚙️ Settings</button></li>
        <li><button data-action="stats">📊 Stats</button></li>
        <li><button data-action="achievements">🏆 Achievements</button></li>
        <li><button data-action="leaderboard">📈 Leaderboard</button></li>
        <li><button data-action="profile">👤 Profile</button></li>
        <li><button data-action="help">❓ Help</button></li>
      </ul>
    `;
    
    // Create main content area
    const main = document.createElement('main');
    main.className = 'app-main';
    
    // Create component containers
    const scoreBoardContainer = document.createElement('div');
    scoreBoardContainer.className = 'scoreboard-container';
    
    const questionContainer = document.createElement('div');
    questionContainer.className = 'question-container';
    
    const controlsContainer = document.createElement('div');
    controlsContainer.className = 'controls-container';
    
    // Initialize child components
    this.children.scoreBoard = new ScoreBoard();
    this.children.questionDisplay = new QuestionDisplay();
    this.children.gameControls = new GameControls();
    
    // Append components to containers
    scoreBoardContainer.appendChild(this.children.scoreBoard);
    questionContainer.appendChild(this.children.questionDisplay);
    controlsContainer.appendChild(this.children.gameControls);
    
    // Build layout
    main.appendChild(scoreBoardContainer);
    main.appendChild(questionContainer);
    main.appendChild(controlsContainer);
    
    // Add to app
    this.appendChild(header);
    this.appendChild(sideMenu);
    this.appendChild(main);
    
    // Initialize and add modal manager
    this.children.modalManager = new ModalManager();
    this.appendChild(this.children.modalManager);
    
    // Setup event handlers
    this.setupHeaderEvents();
  }
  
  setupHeaderEvents() {
    // Theme toggle
    const themeToggle = this.querySelector('.theme-toggle');
    if (themeToggle) {
      themeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-theme');
        const icon = themeToggle.querySelector('.theme-icon');
        icon.textContent = document.body.classList.contains('dark-theme') ? '🌚' : '🌞';
        localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
      });
    }
    
    // Language toggle - handled by main.js
    const langButton = this.querySelector('.lang-button');
    if (langButton) {
      langButton.id = 'lang-btn'; // Set ID for main.js to find it
      // Remove this listener as main.js handles it
    }
    
    // Hamburger menu
    const hamburger = this.querySelector('.hamburger-menu');
    const sideMenu = this.querySelector('.side-menu');
    const closeMenu = this.querySelector('.close-menu');
    
    if (hamburger && sideMenu) {
      hamburger.addEventListener('click', () => {
        sideMenu.classList.add('open');
      });
    }
    
    if (closeMenu && sideMenu) {
      closeMenu.addEventListener('click', () => {
        sideMenu.classList.remove('open');
      });
    }
    
    // Menu items
    const menuButtons = this.querySelectorAll('.menu-items button');
    menuButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        console.log(`📱 Menu action: ${action}`);
        this.eventBus.emit(`modal:open`, { type: action });
        sideMenu.classList.remove('open');
      });
    });
    
    // Apply saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme');
      const icon = themeToggle?.querySelector('.theme-icon');
      if (icon) icon.textContent = '🌚';
    }
  }

  cleanupComponents() {
    // Remove all child components
    Object.values(this.children).forEach(child => {
      if (child && child.parentNode) {
        child.parentNode.removeChild(child);
      }
    });
    
    // Clear references
    this.children = {
      scoreBoard: null,
      questionDisplay: null,
      gameControls: null,
      modalManager: null
    };
  }

  // Sound management
  initializeSoundManager() {
    // Initialize sounds (this ensures they're loaded)
    soundManager.init();
    
    // Wire up game event sounds
    eventBus.on('answer:correct', () => soundManager.play('correct'));
    eventBus.on('answer:incorrect', () => soundManager.play('incorrect'));
    eventBus.on('game:start', () => soundManager.play('theme'));
    eventBus.on('game:over', () => soundManager.play('gameover'));
    eventBus.on('button:click', () => soundManager.play('click'));
    
    // Add sound control UI
    this.addSoundControls();
  }

  addSoundControls() {
    // Create sound control button in header
    const header = this.querySelector('.app-header');
    if (!header) return;
    
    const soundControl = document.createElement('button');
    soundControl.className = 'sound-control';
    soundControl.setAttribute('aria-label', 'Toggle sound');
    soundControl.innerHTML = soundManager.isMuted() ? '🔇' : '🔊';
    
    soundControl.addEventListener('click', () => {
      soundManager.toggleMute();
      soundControl.innerHTML = soundManager.isMuted() ? '🔇' : '🔊';
    });
    
    header.appendChild(soundControl);
  }


  render() {
    // App component doesn't re-render after initialization
    // Child components handle their own rendering
  }
}

// Define custom element
customElements.define('jeopardish-app', App);

export default App;
export { App };
