/**
 * Configuration Manager
 * 
 * Manages user preferences and application configuration.
 * Follows Carmack's principle of simple, direct data management
 * without unnecessary abstraction layers.
 */

import { getState, dispatch } from '../store.js';
import { EVENTS, eventBus } from '../../utils/events.js';

class ConfigManager {
    constructor() {
        this.defaults = {
            theme: 'blue',
            soundEnabled: true,
            volume: 0.7,
            animations: true,
            difficulty: 'normal',
            showTimer: true,
            autoAdvance: false,
            speechRate: 1.0,
            fontSize: 'medium',
            highContrast: false
        };
        
        this.themes = ['blue', 'purple', 'green', 'orange', 'dark'];
        this.difficulties = ['easy', 'normal', 'hard', 'expert'];
        this.fontSizes = ['small', 'medium', 'large'];
    }
    
    /**
     * Load configuration from localStorage
     */
    load() {
        try {
            const saved = localStorage.getItem('jeopardish_config');
            const config = saved ? JSON.parse(saved) : {};
            
            // Merge with defaults
            const finalConfig = { ...this.defaults, ...config };
            
            // Update store
            dispatch({
                type: 'UPDATE_CONFIG',
                payload: finalConfig
            });
            
            // Apply theme
            this.applyTheme(finalConfig.theme);
            
            return finalConfig;
        } catch (error) {
            console.error('Failed to load config:', error);
            return this.defaults;
        }
    }
    
    /**
     * Save configuration to localStorage
     */
    save(config) {
        try {
            localStorage.setItem('jeopardish_config', JSON.stringify(config));
            eventBus.emit(EVENTS.CONFIG_UPDATED, config);
        } catch (error) {
            console.error('Failed to save config:', error);
        }
    }
    
    /**
     * Update a specific configuration value
     */
    update(key, value) {
        const state = getState();
        const currentConfig = state.config || this.defaults;
        
        const newConfig = {
            ...currentConfig,
            [key]: value
        };
        
        dispatch({
            type: 'UPDATE_CONFIG',
            payload: newConfig
        });
        
        this.save(newConfig);
        
        // Apply specific updates
        if (key === 'theme') {
            this.applyTheme(value);
        }
    }
    
    /**
     * Get current configuration
     */
    get() {
        const state = getState();
        return state.config || this.defaults;
    }
    
    /**
     * Get a specific configuration value
     */
    getValue(key) {
        const config = this.get();
        return config[key] ?? this.defaults[key];
    }
    
    /**
     * Reset to default configuration
     */
    reset() {
        dispatch({
            type: 'UPDATE_CONFIG',
            payload: this.defaults
        });
        
        this.save(this.defaults);
        this.applyTheme(this.defaults.theme);
    }
    
    /**
     * Apply theme to document
     */
    applyTheme(theme) {
        // Remove all theme classes
        this.themes.forEach(t => {
            document.documentElement.classList.remove(`theme-${t}`);
        });
        
        // Add new theme class
        if (this.themes.includes(theme)) {
            document.documentElement.classList.add(`theme-${theme}`);
        }
    }
    
    /**
     * Validate configuration object
     */
    validate(config) {
        const errors = [];
        
        // Validate theme
        if (config.theme && !this.themes.includes(config.theme)) {
            errors.push(`Invalid theme: ${config.theme}`);
        }
        
        // Validate difficulty
        if (config.difficulty && !this.difficulties.includes(config.difficulty)) {
            errors.push(`Invalid difficulty: ${config.difficulty}`);
        }
        
        // Validate font size
        if (config.fontSize && !this.fontSizes.includes(config.fontSize)) {
            errors.push(`Invalid font size: ${config.fontSize}`);
        }
        
        // Validate numeric values
        if (config.volume !== undefined && (config.volume < 0 || config.volume > 1)) {
            errors.push('Volume must be between 0 and 1');
        }
        
        if (config.speechRate !== undefined && (config.speechRate < 0.5 || config.speechRate > 2)) {
            errors.push('Speech rate must be between 0.5 and 2');
        }
        
        return errors;
    }
}

// Export singleton instance
export const configManager = new ConfigManager();
export { ConfigManager };
