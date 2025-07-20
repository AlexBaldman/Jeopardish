import eventBus from '../utils/eventBus.js';

/**
 * Sound Effects Manager
 * Handles all audio playback for the game
 */
class SoundManager {
    constructor() {
        this.sounds = {};
        this.isMuted = false;
        this.volume = 0.5;
        this.initialized = false;
    }

    async init() {
        if (this.initialized) return;

        // Define sound mappings
        const soundFiles = {
            buttonClick: 'sounds/button-click.mp3',
            correctAnswer: 'sounds/correct.mp3',
            incorrectAnswer: 'sounds/incorrect.mp3',
            hostHide: 'sounds/hide.mp3',
            hostPop: 'sounds/pop.mp3',
            hostScare: 'sounds/scare.mp3',
            discoStart: 'sounds/disco-start.mp3',
            discoEnd: 'sounds/disco-end.mp3',
            stairs: 'sounds/stairs.mp3',
            moonwalk: 'sounds/moonwalk.mp3'
        };

        // Load all sound effects
        for (const [name, path] of Object.entries(soundFiles)) {
            try {
                const audio = new Audio(path);
                audio.volume = this.volume;
                this.sounds[name] = audio;
            } catch (error) {
                console.warn(`Failed to load sound ${name}:`, error);
            }
        }

        // Set up event listeners
        this.setupEventListeners();
        
        this.initialized = true;
        console.log('SoundManager initialized');
    }

    setupEventListeners() {
        // Game events
        eventBus.on('answer:correct', () => this.play('correctAnswer'));
        eventBus.on('answer:incorrect', () => this.play('incorrectAnswer'));
        
        // UI events
        eventBus.on('ui:buttonClick', () => this.play('buttonClick'));
        
        // Host animation events
        eventBus.on('host:animation:hide', () => this.play('hostHide'));
        eventBus.on('host:animation:pop', () => this.play('hostPop'));
        eventBus.on('host:animation:scare', () => this.play('hostScare'));
        eventBus.on('host:animation:discoStart', () => this.play('discoStart'));
        eventBus.on('host:animation:discoEnd', () => this.play('discoEnd'));
        eventBus.on('host:animation:stairs', () => this.play('stairs'));
        eventBus.on('host:animation:moonwalk', () => this.play('moonwalk'));
        
        // Sound control events
        eventBus.on('sound:mute', () => this.mute());
        eventBus.on('sound:unmute', () => this.unmute());
        eventBus.on('sound:toggleMute', () => this.toggleMute());
        eventBus.on('sound:setVolume', (volume) => this.setVolume(volume));
    }

    play(soundName) {
        if (this.isMuted || !this.sounds[soundName]) return;
        
        try {
            // Clone the audio to allow overlapping sounds
            const soundClone = this.sounds[soundName].cloneNode();
            soundClone.volume = this.volume;
            soundClone.play().catch(error => {
                console.warn(`Could not play sound ${soundName}:`, error);
            });
        } catch (error) {
            console.warn(`Error playing sound ${soundName}:`, error);
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        Object.values(this.sounds).forEach(sound => {
            sound.volume = this.volume;
        });
        eventBus.emit('sound:volumeChanged', this.volume);
    }

    mute() {
        this.isMuted = true;
        eventBus.emit('sound:muted');
    }

    unmute() {
        this.isMuted = false;
        eventBus.emit('sound:unmuted');
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        eventBus.emit(this.isMuted ? 'sound:muted' : 'sound:unmuted');
        return this.isMuted;
    }

    getState() {
        return {
            isMuted: this.isMuted,
            volume: this.volume
        };
    }
}

// Create singleton instance
const soundManager = new SoundManager();

export default soundManager;
