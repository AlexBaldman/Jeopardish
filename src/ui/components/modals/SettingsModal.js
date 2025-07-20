/**
 * SettingsModal.js - Game settings configuration
 * 
 * Allows users to customize game preferences, audio settings,
 * and other options. Built on the base Modal component.
 */

import Modal from '../Modal.js';
import { createElement } from '../../../utils/helpers.js';
import { AudioService } from '../../../services/AudioService.js';

export class SettingsModal extends Modal {
    constructor(config = {}) {
        super({
            ...config,
            title: '⚙️ Settings',
            className: 'settings-modal'
        });
        
        this.settings = {
            soundEnabled: true,
            musicEnabled: true,
            volume: 0.7,
            speechRate: 1.0,
            theme: 'default',
            difficulty: 'normal',
            animations: true,
            autoSave: true
        };
        
        this.loadSettings();
    }
    
    renderContent() {
        return createElement('div', {
            className: 'settings-content'
        }, [
            this.renderAudioSettings(),
            this.renderGameplaySettings(),
            this.renderVisualSettings(),
            this.renderSystemSettings()
        ]);
    }
    
    renderAudioSettings() {
        return createElement('section', {
            className: 'settings-section'
        }, [
            createElement('h3', {}, 'Audio'),
            
            this.renderToggle('soundEnabled', '🔊 Sound Effects'),
            this.renderToggle('musicEnabled', '🎵 Background Music'),
            
            createElement('div', {
                className: 'setting-item'
            }, [
                createElement('label', {}, '🔈 Volume'),
                createElement('input', {
                    type: 'range',
                    min: '0',
                    max: '1',
                    step: '0.1',
                    value: this.settings.volume,
                    oninput: (e) => this.updateSetting('volume', parseFloat(e.target.value))
                }),
                createElement('span', {
                    className: 'value-display'
                }, `${Math.round(this.settings.volume * 100)}%`)
            ]),
            
            createElement('div', {
                className: 'setting-item'
            }, [
                createElement('label', {}, '🗣️ Speech Rate'),
                createElement('input', {
                    type: 'range',
                    min: '0.5',
                    max: '2',
                    step: '0.1',
                    value: this.settings.speechRate,
                    oninput: (e) => this.updateSetting('speechRate', parseFloat(e.target.value))
                }),
                createElement('span', {
                    className: 'value-display'
                }, `${this.settings.speechRate}x`)
            ])
        ]);
    }
    
    renderGameplaySettings() {
        return createElement('section', {
            className: 'settings-section'
        }, [
            createElement('h3', {}, 'Gameplay'),
            
            createElement('div', {
                className: 'setting-item'
            }, [
                createElement('label', {}, '🎯 Difficulty'),
                createElement('select', {
                    value: this.settings.difficulty,
                    onchange: (e) => this.updateSetting('difficulty', e.target.value)
                }, [
                    createElement('option', { value: 'easy' }, 'Easy'),
                    createElement('option', { value: 'normal' }, 'Normal'),
                    createElement('option', { value: 'hard' }, 'Hard'),
                    createElement('option', { value: 'genius' }, 'Genius')
                ])
            ]),
            
            this.renderToggle('autoSave', '💾 Auto-save Progress')
        ]);
    }
    
    renderVisualSettings() {
        return createElement('section', {
            className: 'settings-section'
        }, [
            createElement('h3', {}, 'Visual'),
            
            createElement('div', {
                className: 'setting-item'
            }, [
                createElement('label', {}, '🎨 Theme'),
                createElement('select', {
                    value: this.settings.theme,
                    onchange: (e) => this.updateSetting('theme', e.target.value)
                }, [
                    createElement('option', { value: 'default' }, 'Classic Blue'),
                    createElement('option', { value: 'dark' }, 'Dark Mode'),
                    createElement('option', { value: 'light' }, 'Light Mode'),
                    createElement('option', { value: 'retro' }, 'Retro TV'),
                    createElement('option', { value: 'neon' }, 'Neon Glow')
                ])
            ]),
            
            this.renderToggle('animations', '✨ Enable Animations')
        ]);
    }
    
    renderSystemSettings() {
        return createElement('section', {
            className: 'settings-section'
        }, [
            createElement('h3', {}, 'System'),
            
            createElement('button', {
                className: 'button danger',
                onclick: () => this.resetSettings()
            }, '🔄 Reset to Defaults'),
            
            createElement('button', {
                className: 'button',
                onclick: () => this.exportSettings()
            }, '📤 Export Settings'),
            
            createElement('button', {
                className: 'button',
                onclick: () => this.importSettings()
            }, '📥 Import Settings')
        ]);
    }
    
    renderToggle(key, label) {
        return createElement('div', {
            className: 'setting-item toggle'
        }, [
            createElement('label', {}, label),
            createElement('input', {
                type: 'checkbox',
                checked: this.settings[key],
                onchange: (e) => this.updateSetting(key, e.target.checked)
            })
        ]);
    }
    
    updateSetting(key, value) {
        this.settings[key] = value;
        this.saveSettings();
        this.applySetting(key, value);
        
        // Re-render affected parts
        if (key === 'volume' || key === 'speechRate') {
            this.update();
        }
    }
    
    applySetting(key, value) {
        switch (key) {
            case 'soundEnabled':
            case 'musicEnabled':
            case 'volume':
                AudioService.updateSettings({ [key]: value });
                break;
                
            case 'speechRate':
                if (window.speechSynthesis) {
                    // Update speech rate for text-to-speech
                }
                break;
                
            case 'theme':
                document.body.className = `theme-${value}`;
                break;
                
            case 'animations':
                document.body.classList.toggle('no-animations', !value);
                break;
        }
        
        this.emit('settingChanged', { key, value });
    }
    
    loadSettings() {
        try {
            const saved = localStorage.getItem('jeopardish-settings');
            if (saved) {
                this.settings = { ...this.settings, ...JSON.parse(saved) };
                
                // Apply all settings
                Object.entries(this.settings).forEach(([key, value]) => {
                    this.applySetting(key, value);
                });
            }
        } catch (e) {
            console.error('Failed to load settings:', e);
        }
    }
    
    saveSettings() {
        try {
            localStorage.setItem('jeopardish-settings', JSON.stringify(this.settings));
        } catch (e) {
            console.error('Failed to save settings:', e);
        }
    }
    
    resetSettings() {
        if (confirm('Reset all settings to defaults?')) {
            this.settings = {
                soundEnabled: true,
                musicEnabled: true,
                volume: 0.7,
                speechRate: 1.0,
                theme: 'default',
                difficulty: 'normal',
                animations: true,
                autoSave: true
            };
            
            this.saveSettings();
            Object.entries(this.settings).forEach(([key, value]) => {
                this.applySetting(key, value);
            });
            
            this.update();
            this.emit('settingsReset');
        }
    }
    
    exportSettings() {
        const data = JSON.stringify(this.settings, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = createElement('a', {
            href: url,
            download: 'jeopardish-settings.json'
        });
        
        a.click();
        URL.revokeObjectURL(url);
    }
    
    importSettings() {
        const input = createElement('input', {
            type: 'file',
            accept: '.json',
            onchange: (e) => this.handleImport(e.target.files[0])
        });
        
        input.click();
    }
    
    async handleImport(file) {
        if (!file) return;
        
        try {
            const text = await file.text();
            const imported = JSON.parse(text);
            
            // Validate and merge settings
            Object.entries(imported).forEach(([key, value]) => {
                if (key in this.settings) {
                    this.settings[key] = value;
                    this.applySetting(key, value);
                }
            });
            
            this.saveSettings();
            this.update();
            this.emit('settingsImported', this.settings);
            
        } catch (e) {
            console.error('Failed to import settings:', e);
            alert('Failed to import settings. Please check the file format.');
        }
    }
}
