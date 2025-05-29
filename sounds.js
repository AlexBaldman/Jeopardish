// Sound Effects Manager
class SoundManager {
    constructor() {
        this.sounds = {};
        this.isMuted = false;
        this.volume = 0.5;
        this.init();
    }

    init() {
        // Load all sound effects
        this.sounds = {
            buttonClick: new Audio('sounds/button-click.mp3'),
            correctAnswer: new Audio('sounds/correct.mp3'),
            incorrectAnswer: new Audio('sounds/incorrect.mp3'),
            hostHide: new Audio('sounds/hide.mp3'),
            hostPop: new Audio('sounds/pop.mp3'),
            hostScare: new Audio('sounds/scare.mp3'),
            discoStart: new Audio('sounds/disco-start.mp3'),
            discoEnd: new Audio('sounds/disco-end.mp3'),
            stairs: new Audio('sounds/stairs.mp3'),
            moonwalk: new Audio('sounds/moonwalk.mp3')
        };

        // Set initial volume for all sounds
        Object.values(this.sounds).forEach(sound => {
            sound.volume = this.volume;
        });
    }

    play(soundName) {
        if (this.isMuted) return;
        
        const sound = this.sounds[soundName];
        if (sound) {
            // Clone the audio to allow overlapping sounds
            const soundClone = sound.cloneNode();
            soundClone.volume = this.volume;
            soundClone.play().catch(error => {
                console.warn(`Could not play sound ${soundName}:`, error);
            });
        }
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));
        Object.values(this.sounds).forEach(sound => {
            sound.volume = this.volume;
        });
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }
}

// Create global sound manager instance
const soundManager = new SoundManager(); 