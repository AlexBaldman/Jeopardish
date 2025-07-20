/**
 * Settings.js - Game settings management component
 * 
 * Features:
 * - Display settings (theme, speech bubble style)
 * - Game settings (difficulty, sound effects)
 * - Settings persistence
 * - Live preview of changes
 * 
 * @module ui/components/Settings
 */

import { Modal } from './Modal.js';
import { html } from './BaseComponent.js';
import { GAME_CONFIG } from '../../utils/constants.js';
import { eventBus } from '../../utils/events.js';

/**
 * Settings component for game configuration
 * @extends Modal
 */
export class Settings extends Modal {
    constructor(props = {}) {
        super({
            ...props,
            title: 'Game Settings',
            className: 'settings-modal'
        });
        
        // Default settings
        this.settings = {
            theme: 'light',
            speechBubbleStyle: 'default',
            difficulty: 'medium',
            soundEnabled: true,
            animations: true,
            autoSave: true,
            ...this.loadSettings()
        };
        
        this.bindEvents();
    }
    
    /**
     * Bind settings-specific events
     */
    bindEvents() {
        // Listen for settings requests
        eventBus.on('SETTINGS_REQUESTED', () => this.show());
        eventBus.on('SETTINGS_RESET', () => this.resetSettings());
    }
    
    /**
     * Render modal content
     * @returns {string} HTML content
     */
    renderContent() {
        return html`
            <div class="settings-container">
                ${this.renderDisplaySettings()}
                ${this.renderGameSettings()}
                ${this.renderAdvancedSettings()}
                ${this.renderActions()}
            </div>
        `;
    }
    
    /**
     * Render display settings section
     * @returns {string} HTML content
     */
    renderDisplaySettings() {
        return html`
            <div class="settings-section">
                <h3>Display Settings</h3>
                
                <div class="setting-item">
                    <label for="theme-select">Theme</label>
                    <select 
                        id="theme-select" 
                        value="${this.settings.theme}"
                        data-setting="theme"
                    >
                        <option value="light">Light</option>
                        <option value="dark">Dark</option>
                        <option value="auto">Auto (System)</option>
                    </select>
                    <span class="setting-description">
                        Choose your preferred color scheme
                    </span>
                </div>
                
                <div class="setting-item">
                    <label for="bubble-style-select">Speech Bubble Style</label>
                    <select 
                        id="bubble-style-select"
                        value="${this.settings.speechBubbleStyle}"
                        data-setting="speechBubbleStyle"
                    >
                        <option value="default">Classic</option>
                        <option value="comic">Comic Book</option>
                        <option value="thought">Thought Bubble</option>
                        <option value="modern">Modern</option>
                    </select>
                    <span class="setting-description">
                        Change the appearance of question bubbles
                    </span>
                </div>
                
                <div class="setting-item">
                    <label for="animations-toggle">
                        <input 
                            type="checkbox" 
                            id="animations-toggle"
                            data-setting="animations"
                            ${this.settings.animations ? 'checked' : ''}
                        >
                        Enable Animations
                    </label>
                    <span class="setting-description">
                        Toggle visual effects and transitions
                    </span>
                </div>
            </div>
        `;
    }
    
    /**
     * Render game settings section
     * @returns {string} HTML content
     */
    renderGameSettings() {
        return html`
            <div class="settings-section">
                <h3>Game Settings</h3>
                
                <div class="setting-item">
                    <label for="difficulty-select">Difficulty</label>
                    <select 
                        id="difficulty-select"
                        value="${this.settings.difficulty}"
                        data-setting="difficulty"
                    >
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                        <option value="expert">Expert</option>
                    </select>
                    <span class="setting-description">
                        Affects question difficulty and scoring
                    </span>
                </div>
                
                <div class="setting-item">
                    <label for="sound-toggle">
                        <input 
                            type="checkbox" 
                            id="sound-toggle"
                            data-setting="soundEnabled"
                            ${this.settings.soundEnabled ? 'checked' : ''}
                        >
                        Sound Effects
                    </label>
                    <span class="setting-description">
                        Enable audio feedback for actions
                    </span>
                </div>
                
                <div class="setting-item">
                    <label for="timer-mode">Timer Mode</label>
                    <select 
                        id="timer-mode"
                        value="${this.settings.timerMode || 'normal'}"
                        data-setting="timerMode"
                    >
                        <option value="off">No Timer</option>
                        <option value="normal">Normal (30s)</option>
                        <option value="quick">Quick (15s)</option>
                        <option value="marathon">Marathon (60s)</option>
                    </select>
                    <span class="setting-description">
                        Set answer time limits
                    </span>
                </div>
            </div>
        `;
    }
    
    /**
     * Render advanced settings section
     * @returns {string} HTML content
     */
    renderAdvancedSettings() {
        return html`
            <div class="settings-section">
                <h3>Advanced Settings</h3>
                
                <div class="setting-item">
                    <label for="auto-save-toggle">
                        <input 
                            type="checkbox" 
                            id="auto-save-toggle"
                            data-setting="autoSave"
                            ${this.settings.autoSave ? 'checked' : ''}
                        >
                        Auto-Save Progress
                    </label>
                    <span class="setting-description">
                        Automatically save your game state
                    </span>
                </div>
                
                <div class="setting-item">
                    <label for="fuzzy-matching">
                        <input 
                            type="checkbox" 
                            id="fuzzy-matching"
                            data-setting="fuzzyMatching"
                            ${this.settings.fuzzyMatching !== false ? 'checked' : ''}
                        >
                        Fuzzy Answer Matching
                    </label>
                    <span class="setting-description">
                        Allow minor typos in answers
                    </span>
                </div>
                
                <div class="setting-item">
                    <label for="hints-enabled">
                        <input 
                            type="checkbox" 
                            id="hints-enabled"
                            data-setting="hintsEnabled"
                            ${this.settings.hintsEnabled !== false ? 'checked' : ''}
                        >
                        Enable Hints
                    </label>
                    <span class="setting-description">
                        Show hints for difficult questions
                    </span>
                </div>
            </div>
        `;
    }
    
    /**
     * Render action buttons
     * @returns {string} HTML content
     */
    renderActions() {
        return html`
            <div class="settings-actions">
                <button 
                    class="button button-secondary"
                    data-action="reset"
                >
                    Reset to Defaults
                </button>
                <button 
                    class="button button-primary"
                    data-action="save"
                >
                    Save Settings
                </button>
            </div>
        `;
    }
    
    /**
     * Handle DOM events
     * @override
     */
    handleEvent(event) {
        // Handle parent events first
        super.handleEvent(event);
        
        const target = event.target;
        
        // Handle setting changes
        if (target.dataset.setting) {
            const setting = target.dataset.setting;
            const value = target.type === 'checkbox' 
                ? target.checked 
                : target.value;
            
            this.updateSetting(setting, value);
        }
        
        // Handle action buttons
        if (target.dataset.action) {
            switch (target.dataset.action) {
                case 'save':
                    this.saveSettings();
                    break;
                case 'reset':
                    this.resetSettings();
                    break;
            }
        }
    }
    
    /**
     * Update a setting value
     * @param {string} key - Setting key
     * @param {*} value - New value
     */
    updateSetting(key, value) {
        const oldValue = this.settings[key];
        this.settings[key] = value;
        
        // Apply immediate changes for some settings
        if (key === 'theme') {
            this.applyTheme(value);
        } else if (key === 'soundEnabled') {
            eventBus.emit('SOUND_TOGGLE', { enabled: value });
        } else if (key === 'animations') {
            document.body.classList.toggle('no-animations', !value);
        }
        
        // Emit change event
        eventBus.emit('SETTING_CHANGED', {
            key,
            value,
            oldValue
        });
    }
    
    /**
     * Apply theme change
     * @param {string} theme - Theme name
     */
    applyTheme(theme) {
        if (theme === 'auto') {
            // Use system preference
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
            theme = prefersDark ? 'dark' : 'light';
        }
        
        document.documentElement.setAttribute('data-theme', theme);
    }
    
    /**
     * Save all settings
     */
    saveSettings() {
        try {
            localStorage.setItem(GAME_CONFIG.STORAGE_KEYS.SETTINGS, JSON.stringify(this.settings));
            
            // Apply all settings
            Object.entries(this.settings).forEach(([key, value]) => {
                if (key === 'theme') this.applyTheme(value);
            });
            
            eventBus.emit('SETTINGS_SAVED', { settings: this.settings });
            
            // Show success feedback
            this.showNotification('Settings saved successfully!', 'success');
            
            // Close modal after brief delay
            setTimeout(() => this.hide(), 1500);
            
        } catch (error) {
            console.error('Failed to save settings:', error);
            this.showNotification('Failed to save settings', 'error');
        }
    }
    
    /**
     * Load settings from storage
     * @returns {Object} Loaded settings
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem(GAME_CONFIG.STORAGE_KEYS.SETTINGS);
            return saved ? JSON.parse(saved) : {};
        } catch (error) {
            console.error('Failed to load settings:', error);
            return {};
        }
    }
    
    /**
     * Reset settings to defaults
     */
    resetSettings() {
        if (confirm('Are you sure you want to reset all settings to defaults?')) {
            this.settings = {
                theme: 'light',
                speechBubbleStyle: 'default',
                difficulty: 'medium',
                soundEnabled: true,
                animations: true,
                autoSave: true,
                fuzzyMatching: true,
                hintsEnabled: true,
                timerMode: 'normal'
            };
            
            // Re-render
            this.update();
            
            // Apply defaults
            this.applyTheme(this.settings.theme);
            document.body.classList.toggle('no-animations', !this.settings.animations);
            
            this.showNotification('Settings reset to defaults', 'info');
        }
    }
    
    /**
     * Show temporary notification
     * @param {string} message - Notification message
     * @param {string} type - Notification type (success, error, info)
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `settings-notification ${type}`;
        notification.textContent = message;
        
        this.modalContent.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 2000);
    }
    
    /**
     * Show the settings modal
     * @override
     */
    show() {
        super.show();
        
        // Refresh settings from storage
        this.settings = {
            ...this.settings,
            ...this.loadSettings()
        };
        
        this.update();
    }
    
    /**
     * Clean up
     * @override
     */
    destroy() {
        eventBus.off('SETTINGS_REQUESTED');
        eventBus.off('SETTINGS_RESET');
        super.destroy();
    }
}

// Export factory function
export function createSettings(container, props = {}) {
    const settings = new Settings(props);
    settings.mount(container);
    return settings;
}
