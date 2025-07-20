import soundManager from '../../services/audio/SoundManager.js';
import eventBus from '../../utils/events.js';

class HostAnimationManager {
    constructor() {
        this.host = document.querySelector('.trebek');
        this.gameContainer = document.querySelector('.game-container');
        this.isAnimating = false;
        this.currentAnimation = null;
        this.discoBall = null;
    }

    init() {
        // Add disco ball element
        this.discoBall = document.createElement('div');
        this.discoBall.className = 'disco-ball';
        this.gameContainer.appendChild(this.discoBall);
        
        // Set up event listeners
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        eventBus.on('openHostAnimationModal', () => {
            this.openHostAnimationModal();
        });

        // Set up animation trigger
        eventBus.on('triggerHostAnimation', (e) => {
            if (e.detail && e.detail.animation) {
                this.triggerAnimation(e.detail.animation);
            }
        });

        // Set up host selection
        eventBus.on('selectHost', (e) => {
            if (e.detail && e.detail.hostNumber) {
                this.changeHost(e.detail.hostNumber);
            }
        });
    }
    
    openHostAnimationModal() {
        if (this.hostAnimationModal) {
            this.hostAnimationModal.style.display = 'block';
            setTimeout(() => {
                this.hostAnimationModal.classList.add('active');
            }, 10);
        }
    }
    
    closeModal(modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
    
    triggerAnimation(animationType) {
        switch(animationType) {
            case 'happy':
                this.playAnimation('stairs');
                break;
            case 'sad':
                this.playAnimation('hideLeft');
                break;
            case 'surprised':
                this.playAnimation('duckAndScare');
                break;
            case 'laughing':
                this.playAnimation('moonwalk');
                break;
        }
    }
    
    changeHost(hostNumber) {
        const hostImage = document.getElementById('trebekImage');
        if (hostImage) {
            switch(hostNumber) {
                case '1':
                    hostImage.src = 'images/trebek/trebek-good-04.png';
                    break;
                case '2':
                    hostImage.src = 'images/trebek/trebek-good-02.png';
                    break;
                case '3':
                    hostImage.src = 'images/trebek/trebek-good-03.png';
                    break;
            }
            
            // Update active button state
            const hostButtons = document.querySelectorAll('.host-select-btn');
            hostButtons.forEach(btn => {
                btn.classList.remove('active');
                if (btn.dataset.host === hostNumber) {
                    btn.classList.add('active');
                }
            });
        }
    }

    async playAnimation(animationName) {
        if (this.isAnimating) return;
        this.isAnimating = true;

        switch (animationName) {
            case 'hideLeft':
                await this.hideLeft();
                break;
            case 'duckAndScare':
                await this.duckAndScare();
                break;
            case 'stairs':
                await this.stairs();
                break;
            case 'moonwalk':
                await this.moonwalk();
                break;
        }

        this.isAnimating = false;
    }

    async hideLeft() {
        soundManager.play('hostHide');
        this.host.style.transition = 'left 1.5s ease-in-out';
        this.host.style.left = '-15vw';
        await this.wait(1500);
        this.host.style.left = '2vw';
    }

    async duckAndScare() {
        const exclamations = [
            "BOO!",
            "GOTCHA!",
            "SURPRISE!",
            "AH-HA!"
        ];
        
        soundManager.play('hostHide');
        this.host.style.transition = 'bottom 1s ease-in-out';
        this.host.style.bottom = '-20vh';
        await this.wait(1000);
        
        soundManager.play('hostScare');
        this.host.style.bottom = '0';
        this.showExclamation(exclamations[Math.floor(Math.random() * exclamations.length)]);
    }

    async stairs() {
        soundManager.play('stairs');
        const steps = 5;
        const stepHeight = 20;
        
        for (let i = 0; i < steps; i++) {
            this.host.style.bottom = `${-stepHeight * (i + 1)}px`;
            await this.wait(300);
            this.host.style.bottom = '0';
            await this.wait(300);
        }
        
        soundManager.play('hostPop');
        this.host.style.transform = 'scale(1.2)';
        await this.wait(200);
        this.host.style.transform = 'scale(1)';
    }

    async moonwalk() {
        soundManager.play('discoStart');
        this.startDiscoMode();
        
        this.host.style.transition = 'all 2s ease-in-out';
        this.host.style.transform = 'scaleX(-1)';
        this.host.style.left = '80vw';
        
        await this.wait(2000);
        
        soundManager.play('discoEnd');
        this.stopDiscoMode();
        this.host.style.transform = 'scaleX(1)';
        this.host.style.left = '2vw';
    }

    startDiscoMode() {
        this.gameContainer.classList.add('disco-mode');
        this.discoBall.style.display = 'block';
    }

    stopDiscoMode() {
        this.gameContainer.classList.remove('disco-mode');
        this.discoBall.style.display = 'none';
    }

    showExclamation(text) {
        const exclamation = document.createElement('div');
        exclamation.className = 'host-exclamation';
        exclamation.textContent = text;
        this.host.appendChild(exclamation);
        
        setTimeout(() => {
            exclamation.remove();
        }, 1000);
    }

    wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

export default HostAnimationManager;
