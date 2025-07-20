/**
 * Sound Manager Service
 * Wraps the existing SoundManager with our service architecture
 * Follows Carmack's principles: simple interface, predictable behavior
 */

import { eventBus } from '../utils/events.js';

// Import the existing SoundManager if it exists, otherwise create our own
let BaseSoundManager;
try {
  // Try to import existing SoundManager
  BaseSoundManager = (await import('/sounds.js')).SoundManager;
} catch (e) {
  // Fallback to creating our own implementation
  BaseSoundManager = class {
    constructor() {
      this.sounds = {};
      this.isMuted = localStorage.getItem('soundMuted') === 'true';
      this.volume = parseFloat(localStorage.getItem('soundVolume') || '0.7');
    }

    async preloadSounds() {
      const soundFiles = [
        'correct', 'incorrect', 'daily-double', 'final-jeopardy',
        'time-up', 'applause', 'theme', 'buzzer'
      ];

      for (const sound of soundFiles) {
        try {
          const audio = new Audio(`/sounds/${sound}.mp3`);
          audio.volume = this.volume;
          this.sounds[sound] = audio;
        } catch (e) {
          console.warn(`Failed to load sound: ${sound}`, e);
        }
      }
    }

    playSound(soundName) {
      if (this.isMuted) return;
      
      const sound = this.sounds[soundName];
      if (sound) {
        sound.currentTime = 0;
        sound.volume = this.volume;
        sound.play().catch(e => console.warn('Sound play failed:', e));
      }
    }

    setMuted(muted) {
      this.isMuted = muted;
      localStorage.setItem('soundMuted', muted);
    }

    setVolume(volume) {
      this.volume = Math.max(0, Math.min(1, volume));
      localStorage.setItem('soundVolume', this.volume);
      
      // Update all sound volumes
      Object.values(this.sounds).forEach(sound => {
        sound.volume = this.volume;
      });
    }
  };
}

/**
 * Enhanced SoundManager with event integration
 */
export class SoundManager {
  constructor() {
    this.baseManager = new BaseSoundManager();
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;

    // Initialize base manager
    await this.baseManager.preloadSounds();

    // Listen for game events
    this.setupEventListeners();

    this.initialized = true;
    console.log('🔊 Sound system initialized');
  }

  setupEventListeners() {
    // Game events
    eventBus.on('answer:correct', () => this.playSound('correct'));
    eventBus.on('answer:incorrect', () => this.playSound('incorrect'));
    eventBus.on('game:daily-double', () => this.playSound('daily-double'));
    eventBus.on('game:final-jeopardy', () => this.playSound('final-jeopardy'));
    eventBus.on('game:time-up', () => this.playSound('time-up'));
    eventBus.on('game:complete', () => this.playSound('applause'));
    
    // UI events
    eventBus.on('sound:play', ({ sound }) => this.playSound(sound));
    eventBus.on('sound:toggle-mute', () => this.toggleMute());
    eventBus.on('sound:set-volume', ({ volume }) => this.setVolume(volume));
  }

  playSound(soundName) {
    if (!this.initialized) {
      console.warn('Sound system not initialized');
      return;
    }
    
    this.baseManager.playSound(soundName);
  }

  toggleMute() {
    const newMuted = !this.baseManager.isMuted;
    this.baseManager.setMuted(newMuted);
    eventBus.emit('sound:mute-changed', { muted: newMuted });
    return newMuted;
  }

  setVolume(volume) {
    this.baseManager.setVolume(volume);
    eventBus.emit('sound:volume-changed', { volume: this.baseManager.volume });
  }

  get isMuted() {
    return this.baseManager.isMuted;
  }

  get volume() {
    return this.baseManager.volume;
  }
}

// Export singleton instance for convenience
export const soundManager = new SoundManager();
