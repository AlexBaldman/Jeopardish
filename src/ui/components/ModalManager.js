import Component from '../base/Component.js';
import Modal from '../base/Modal.js';
import HelpModal from './HelpModal.js';
import Settings from './Settings.js';
import Stats from './Stats.js';
import AchievementsModal from './AchievementsModal.js';
import LeaderboardModal from './LeaderboardModal.js';
import ProfileModal from './ProfileModal.js';
import eventBus from '../../utils/events.js';
import { createElement } from '../../utils/dom.js';

/**
 * Manages all modal components in the application
 * Handles instantiation, showing/hiding, and event coordination
 */
class ModalManager extends Component {
  constructor() {
    super();
    
    // Modal instances
    this.modals = {
      help: null,
      settings: null,
      stats: null,
      achievements: null,
      leaderboard: null,
      profile: null
    };
    
    // Currently active modal
    this.activeModal = null;
  }

  mounted() {
    // Create modal container if it doesn't exist
    if (!document.getElementById('modal-container')) {
      const container = createElement('div', {
        id: 'modal-container',
        className: 'modal-container'
      });
      document.body.appendChild(container);
    }
    
    // Initialize all modals
    this.initializeModals();
    
    // Set up event listeners
    this.setupEventListeners();
    
    // Handle escape key to close modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.activeModal) {
        this.hideActiveModal();
      }
    });
  }

  initializeModals() {
    const container = document.getElementById('modal-container');
    
    // Initialize each modal and append to container
    this.modals.help = new HelpModal();
    container.appendChild(this.modals.help.element);
    
    this.modals.settings = new Settings();
    container.appendChild(this.modals.settings.element);
    
    this.modals.stats = new Stats();
    container.appendChild(this.modals.stats.element);
    
    this.modals.achievements = new AchievementsModal();
    container.appendChild(this.modals.achievements.element);
    
    this.modals.leaderboard = new LeaderboardModal();
    container.appendChild(this.modals.leaderboard.element);
    
    this.modals.profile = new ProfileModal();
    container.appendChild(this.modals.profile.element);
  }

  setupEventListeners() {
    // Listen for modal show requests from eventBus
    eventBus.on('modal:show', (modalName) => {
      this.showModal(modalName);
    });
    
    eventBus.on('modal:hide', () => {
      this.hideActiveModal();
    });
    
    // Specific modal triggers
    eventBus.on('help:show', () => this.showModal('help'));
    eventBus.on('settings:show', () => this.showModal('settings'));
    eventBus.on('stats:show', () => this.showModal('stats'));
    eventBus.on('achievements:show', () => this.showModal('achievements'));
    eventBus.on('leaderboard:show', () => this.showModal('leaderboard'));
    eventBus.on('profile:show', () => this.showModal('profile'));
  }

  showModal(modalName) {
    const modal = this.modals[modalName];
    
    if (!modal) {
      console.warn(`Modal "${modalName}" not found`);
      return;
    }
    
    // Hide current active modal if any
    if (this.activeModal && this.activeModal !== modal) {
      this.activeModal.hide();
    }
    
    // Show the requested modal
    modal.show();
    this.activeModal = modal;
    
    // Emit event for tracking
    eventBus.emit('modal:opened', { modal: modalName });
  }

  hideActiveModal() {
    if (this.activeModal) {
      this.activeModal.hide();
      const modalName = Object.keys(this.modals).find(
        key => this.modals[key] === this.activeModal
      );
      eventBus.emit('modal:closed', { modal: modalName });
      this.activeModal = null;
    }
  }

  hideAll() {
    Object.values(this.modals).forEach(modal => {
      if (modal) modal.hide();
    });
    this.activeModal = null;
  }

  render() {
    // ModalManager itself doesn't render anything
    // It manages other components
    return createElement('div', { style: 'display: none;' });
  }
}

export default ModalManager;
