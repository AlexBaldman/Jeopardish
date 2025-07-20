/**
 * SoundManager Service
 * 
 * Manages all game audio including sound effects and background music.
 * Follows Carmack's principle of minimal, focused modules.
 * 
 * @module services/audio/SoundManager
 */

import { eventBus } from '../../utils/events.js';
import { EVENTS } from '../../utils/constants.js';

class SoundManager {
  constructor() {
    this.sounds = new Map();
    this.isMuted = false;
    this.volume = 1.0;
    this.audioContext = null;
    
    // Initialize audio context on first user interaction
    this.initPromise = null;
    
    // Listen for game events
    this.setupEventListeners();
  }
  
  /**
   * Initialize audio context (required for modern browsers)
   */
  async init() {
    if (this.audioContext) return;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Resume context if suspended
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }
      
      console.log('[SoundManager] Audio context initialized');
    } catch (error) {
      console.error('[SoundManager] Failed to initialize audio context:', error);
    }
  }
  
  /**
   * Load a sound file
   * @param {string} name - Sound identifier
   * @param {string} url - Path to audio file
   */
  async loadSound(name, url) {
    try {
      const audio = new Audio(url);
      audio.volume = this.volume;
      
      // Preload the audio
      await new Promise((resolve, reject) => {
        audio.addEventListener('canplaythrough', resolve, { once: true });
        audio.addEventListener('error', reject, { once: true });
        audio.load();
      });
      
      this.sounds.set(name, audio);
      console.log(`[SoundManager] Loaded sound: ${name}`);
    } catch (error) {
      console.error(`[SoundManager] Failed to load sound ${name}:`, error);
    }
  }
  
  /**
   * Load multiple sounds
   * @param {Object} soundMap - Map of sound names to URLs
   */
  async loadSounds(soundMap) {
    const promises = Object.entries(soundMap).map(([name, url]) => 
      this.loadSound(name, url)
    );
    
    await Promise.all(promises);
  }
  
  /**
   * Play a sound
   * @param {string} name - Sound identifier
   * @param {Object} options - Playback options
   */
  play(name, options = {}) {
    if (this.isMuted) return;
    
    const sound = this.sounds.get(name);
    if (!sound) {
      console.warn(`[SoundManager] Sound not found: ${name}`);
      return;
    }
    
    // Clone the audio for overlapping playback
    const audio = sound.cloneNode();
    audio.volume = this.volume * (options.volume || 1);
    
    if (options.loop) {
      audio.loop = true;
    }
    
    // Clean up after playback
    if (!options.loop) {
      audio.addEventListener('ended', () => {
        audio.remove();
      });
    }
    
    // Ensure audio context is initialized
    if (!this.audioContext) {
      this.init().then(() => audio.play());
    } else {
      audio.play().catch(error => {
        console.error(`[SoundManager] Failed to play ${name}:`, error);
      });
    }
    
    return audio;
  }
  
  /**
   * Stop a specific sound or all sounds
   * @param {string} name - Optional sound identifier
   */
  stop(name = null) {
    if (name) {
      const sound = this.sounds.get(name);
      if (sound) {
        sound.pause();
        sound.currentTime = 0;
      }
    } else {
      // Stop all sounds
      this.sounds.forEach(sound => {
        sound.pause();
        sound.currentTime = 0;
      });
    }
  }
  
  /**
   * Set volume for all sounds
   * @param {number} volume - Volume level (0-1)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    
    // Update volume for all loaded sounds
    this.sounds.forEach(sound => {
      sound.volume = this.volume;
    });
    
    eventBus.emit(EVENTS.SOUND_VOLUME_CHANGED, { volume: this.volume });
  }
  
  /**
   * Toggle mute state
   */
  toggleMute() {
    this.isMuted = !this.isMuted;
    
    if (this.isMuted) {
      this.stop();
    }
    
    eventBus.emit(EVENTS.SOUND_MUTE_CHANGED, { muted: this.isMuted });
  }
  
  /**
   * Setup event listeners for game events
   */
  setupEventListeners() {
    // Play sounds based on game events
    eventBus.on(EVENTS.ANSWER_CORRECT, () => {
      this.play('correct');
    });
    
    eventBus.on(EVENTS.ANSWER_INCORRECT, () => {
      this.play('incorrect');
    });
    
    eventBus.on(EVENTS.GAME_START, () => {
      this.play('game-start');
    });
    
    eventBus.on(EVENTS.GAME_END, () => {
      this.play('game-over');
    });
    
    eventBus.on(EVENTS.ACHIEVEMENT_UNLOCKED, () => {
      this.play('achievement');
    });
    
    // UI interaction sounds
    eventBus.on('ui:button-click', () => {
      this.play('click');
    });
    
    eventBus.on('ui:modal-open', () => {
      this.play('modal-open');
    });
    
    eventBus.on('ui:modal-close', () => {
      this.play('modal-close');
    });
    
    // Host animation sounds
    eventBus.on('host:animation', ({ animation }) => {
      const soundMap = {
        'moonwalk': 'moonwalk',
        'scare': 'scream',
        'hide': 'whoosh',
        'dance': 'dance-music'
      };
      
      const sound = soundMap[animation];
      if (sound) {
        this.play(sound);
      }
    });
  }
  
  /**
   * Preload all game sounds
   */
  async preloadGameSounds() {
    const sounds = {
      // Game sounds
      'correct': '/assets/sounds/correct.mp3',
      'incorrect': '/assets/sounds/incorrect.mp3',
      'game-start': '/assets/sounds/game-start.mp3',
      'game-over': '/assets/sounds/game-over.mp3',
      'achievement': '/assets/sounds/achievement.mp3',
      
      // UI sounds
      'click': '/assets/sounds/click.mp3',
      'modal-open': '/assets/sounds/modal-open.mp3',
      'modal-close': '/assets/sounds/modal-close.mp3',
      
      // Host animation sounds
      'moonwalk': '/assets/sounds/moonwalk.mp3',
      'scream': '/assets/sounds/scream.mp3',
      'whoosh': '/assets/sounds/whoosh.mp3',
      'dance-music': '/assets/sounds/dance.mp3'
    };
    
    await this.loadSounds(sounds);
  }
}

// Export singleton instance
export const soundManager = new SoundManager();

// Also export class for testing
export { SoundManager };
