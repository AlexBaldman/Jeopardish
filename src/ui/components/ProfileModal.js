/**
 * ProfileModal Component
 * 
 * Modal for displaying and editing user profile information.
 * Allows users to set username, view stats summary, and manage preferences.
 * 
 * @module ui/components/ProfileModal
 */

import { Modal } from './Modal.js';
import { createElement } from '../../utils/helpers.js';
import { ConfigManager } from '../../state/managers/ConfigManager.js';
import { StatsManager } from '../../state/managers/StatsManager.js';
import { EventBus } from '../../utils/events.js';

/**
 * ProfileModal extends Modal to display user profile
 * @extends Modal
 */
export class ProfileModal extends Modal {
    constructor() {
        super({
            id: 'profile-modal',
            title: 'User Profile',
            className: 'profile-modal'
        });

        this.config = ConfigManager.getInstance();
        this.stats = StatsManager.getInstance();
        this.eventBus = EventBus.getInstance();
        
        this.init();
    }

    /**
     * Initialize the profile modal content
     * @override
     */
    init() {
        super.init();
        this.renderContent();
        this.attachEventListeners();
    }

    /**
     * Render the profile content
     * @private
     */
    renderContent() {
        const content = this.modal.querySelector('.modal-content');
        content.innerHTML = '';

        // Profile header with avatar placeholder
        const header = createElement('div', {
            className: 'profile-header'
        });

        const avatar = createElement('div', {
            className: 'profile-avatar',
            innerHTML: this.getAvatarInitials()
        });

        const username = this.config.get('username') || 'Guest Player';
        const nameDisplay = createElement('h2', {
            className: 'profile-username',
            textContent: username
        });

        header.appendChild(avatar);
        header.appendChild(nameDisplay);

        // Profile form
        const form = createElement('form', {
            className: 'profile-form'
        });

        // Username input
        const usernameGroup = createElement('div', {
            className: 'form-group'
        });

        const usernameLabel = createElement('label', {
            htmlFor: 'username-input',
            textContent: 'Username'
        });

        const usernameInput = createElement('input', {
            type: 'text',
            id: 'username-input',
            className: 'form-input',
            value: username,
            placeholder: 'Enter your username',
            maxLength: '20'
        });

        usernameGroup.appendChild(usernameLabel);
        usernameGroup.appendChild(usernameInput);

        // Stats summary
        const statsSection = createElement('div', {
            className: 'profile-stats-summary'
        });

        const statsTitle = createElement('h3', {
            textContent: 'Quick Stats'
        });

        const stats = this.getStatsData();
        const statsList = createElement('div', {
            className: 'stats-grid'
        });

        // Games played
        const gamesPlayed = createElement('div', {
            className: 'stat-item'
        });
        gamesPlayed.innerHTML = `
            <span class="stat-label">Games Played</span>
            <span class="stat-value">${stats.gamesPlayed}</span>
        `;

        // Total score
        const totalScore = createElement('div', {
            className: 'stat-item'
        });
        totalScore.innerHTML = `
            <span class="stat-label">Total Score</span>
            <span class="stat-value">${stats.totalScore.toLocaleString()}</span>
        `;

        // Best streak
        const bestStreak = createElement('div', {
            className: 'stat-item'
        });
        bestStreak.innerHTML = `
            <span class="stat-label">Best Streak</span>
            <span class="stat-value">${stats.bestStreak}</span>
        `;

        // Achievements
        const achievements = createElement('div', {
            className: 'stat-item'
        });
        achievements.innerHTML = `
            <span class="stat-label">Achievements</span>
            <span class="stat-value">${stats.achievementsUnlocked}/${stats.totalAchievements}</span>
        `;

        statsList.appendChild(gamesPlayed);
        statsList.appendChild(totalScore);
        statsList.appendChild(bestStreak);
        statsList.appendChild(achievements);

        statsSection.appendChild(statsTitle);
        statsSection.appendChild(statsList);

        // Preferences
        const prefsSection = createElement('div', {
            className: 'profile-preferences'
        });

        const prefsTitle = createElement('h3', {
            textContent: 'Preferences'
        });

        // Theme preference
        const themeGroup = createElement('div', {
            className: 'pref-group'
        });

        const themeLabel = createElement('label', {
            htmlFor: 'theme-select',
            textContent: 'Preferred Theme'
        });

        const themeSelect = createElement('select', {
            id: 'theme-select',
            className: 'form-select'
        });

        const themes = ['auto', 'light', 'dark'];
        const currentTheme = this.config.get('theme') || 'auto';
        
        themes.forEach(theme => {
            const option = createElement('option', {
                value: theme,
                textContent: theme.charAt(0).toUpperCase() + theme.slice(1),
                selected: theme === currentTheme
            });
            themeSelect.appendChild(option);
        });

        themeGroup.appendChild(themeLabel);
        themeGroup.appendChild(themeSelect);

        prefsSection.appendChild(prefsTitle);
        prefsSection.appendChild(themeGroup);

        // Save button
        const saveButton = createElement('button', {
            type: 'submit',
            className: 'btn btn-primary save-profile',
            textContent: 'Save Profile'
        });

        // Reset stats button
        const resetButton = createElement('button', {
            type: 'button',
            className: 'btn btn-danger reset-stats',
            textContent: 'Reset All Stats'
        });

        const buttonGroup = createElement('div', {
            className: 'button-group'
        });
        buttonGroup.appendChild(saveButton);
        buttonGroup.appendChild(resetButton);

        // Assemble form
        form.appendChild(usernameGroup);
        form.appendChild(prefsSection);
        form.appendChild(buttonGroup);

        // Assemble content
        content.appendChild(header);
        content.appendChild(statsSection);
        content.appendChild(form);

        // Store references
        this.usernameInput = usernameInput;
        this.themeSelect = themeSelect;
        this.form = form;
        this.resetButton = resetButton;
        this.avatar = avatar;
        this.nameDisplay = nameDisplay;
    }

    /**
     * Get initials for avatar from username
     * @private
     * @returns {string} Avatar initials
     */
    getAvatarInitials() {
        const username = this.config.get('username') || 'Guest';
        const words = username.split(' ');
        if (words.length > 1) {
            return words[0][0].toUpperCase() + words[1][0].toUpperCase();
        }
        return username.substring(0, 2).toUpperCase();
    }

    /**
     * Get stats data summary
     * @private
     * @returns {Object} Stats summary object
     */
    getStatsData() {
        const allTimeStats = this.stats.getAllTimeStats();
        const achievements = this.stats.getAchievements();
        
        return {
            gamesPlayed: allTimeStats.gamesPlayed || 0,
            totalScore: allTimeStats.totalScore || 0,
            bestStreak: allTimeStats.bestStreak || 0,
            achievementsUnlocked: achievements.filter(a => a.unlocked).length,
            totalAchievements: achievements.length
        };
    }

    /**
     * Attach event listeners
     * @private
     */
    attachEventListeners() {
        // Form submission
        this.form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveProfile();
        });

        // Reset stats button
        this.resetButton.addEventListener('click', () => {
            this.confirmResetStats();
        });

        // Live username preview
        this.usernameInput.addEventListener('input', () => {
            const newName = this.usernameInput.value.trim() || 'Guest Player';
            this.nameDisplay.textContent = newName;
            this.avatar.innerHTML = this.getAvatarInitials();
        });
    }

    /**
     * Save profile changes
     * @private
     */
    saveProfile() {
        const username = this.usernameInput.value.trim() || 'Guest Player';
        const theme = this.themeSelect.value;

        // Update config
        this.config.set('username', username);
        this.config.set('theme', theme);

        // Emit events
        this.eventBus.emit('profile:updated', { username, theme });
        this.eventBus.emit('theme:changed', theme);

        // Show feedback
        this.showFeedback('Profile saved successfully!', 'success');

        // Close modal after a delay
        setTimeout(() => this.hide(), 1500);
    }

    /**
     * Confirm stats reset
     * @private
     */
    confirmResetStats() {
        if (confirm('Are you sure you want to reset all your stats? This action cannot be undone.')) {
            this.resetStats();
        }
    }

    /**
     * Reset all stats
     * @private
     */
    resetStats() {
        // Reset stats
        this.stats.reset();

        // Emit event
        this.eventBus.emit('stats:reset');

        // Update display
        this.renderContent();
        this.attachEventListeners();

        // Show feedback
        this.showFeedback('All stats have been reset!', 'info');
    }

    /**
     * Show feedback message
     * @private
     * @param {string} message - Feedback message
     * @param {string} type - Message type (success, error, info)
     */
    showFeedback(message, type = 'info') {
        const feedback = createElement('div', {
            className: `feedback feedback-${type}`,
            textContent: message
        });

        this.modal.querySelector('.modal-content').appendChild(feedback);

        setTimeout(() => {
            feedback.remove();
        }, 3000);
    }

    /**
     * Show the profile modal
     * @override
     */
    show() {
        super.show();
        // Refresh content when showing
        this.renderContent();
        this.attachEventListeners();
    }
}
