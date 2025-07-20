/**
 * Host Image Cycler
 * Allows users to cycle through different host images by clicking on the left/right sides
 */

class HostImageCycler {
    constructor() {
        this.images = [
            'trebek-good-01.png',
            'trebek-good-02.png',
            'trebek-good-03.png',
            'trebek-good-05.png'
        ];
        this.currentIndex = 0; // Starting with trebek-good-01.png
        this.imageElement = null;
        this.isInitialized = false;
        
        // Initialize after DOM is loaded
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }
    
    init() {
        this.imageElement = document.getElementById('trebekImage');
        if (!this.imageElement) {
            console.error('Host image element not found');
            return;
        }
        
        // Add click zones for cycling
        this.setupClickZones();
        
        // Update the title attribute
        this.imageElement.title = 'Click left/right side to cycle hosts';
        
        this.isInitialized = true;
        console.log('Host Image Cycler initialized');
    }
    
    setupClickZones() {
        // Create invisible click zones
        const hostContainer = document.querySelector('.host-container');
        if (!hostContainer) return;
        
        // Clear any existing click handlers
        hostContainer.style.position = 'relative';
        
        // Create left click zone
        const leftZone = document.createElement('div');
        leftZone.className = 'host-click-zone host-click-left';
        leftZone.style.cssText = `
            position: absolute;
            left: 0;
            top: 0;
            width: 50%;
            height: 100%;
            cursor: pointer;
            z-index: 10;
        `;
        
        // Create right click zone
        const rightZone = document.createElement('div');
        rightZone.className = 'host-click-zone host-click-right';
        rightZone.style.cssText = `
            position: absolute;
            right: 0;
            top: 0;
            width: 50%;
            height: 100%;
            cursor: pointer;
            z-index: 10;
        `;
        
        // Add click handlers
        leftZone.addEventListener('click', (e) => {
            e.stopPropagation();
            this.cyclePrev();
        });
        
        rightZone.addEventListener('click', (e) => {
            e.stopPropagation();
            this.cycleNext();
        });
        
        // Add visual feedback on hover
        leftZone.addEventListener('mouseenter', () => {
            leftZone.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        });
        leftZone.addEventListener('mouseleave', () => {
            leftZone.style.backgroundColor = 'transparent';
        });
        
        rightZone.addEventListener('mouseenter', () => {
            rightZone.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
        });
        rightZone.addEventListener('mouseleave', () => {
            rightZone.style.backgroundColor = 'transparent';
        });
        
        // Append click zones
        hostContainer.appendChild(leftZone);
        hostContainer.appendChild(rightZone);
    }
    
    cycleNext() {
        if (!this.isInitialized) return;
        
        this.currentIndex = (this.currentIndex + 1) % this.images.length;
        this.updateDisplay();
        
        // Play sound effect if available
        if (window.soundManager && window.soundManager.play) {
            window.soundManager.play('buttonClick');
        }
    }
    
    cyclePrev() {
        if (!this.isInitialized) return;
        
        this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;
        this.updateDisplay();
        
        // Play sound effect if available
        if (window.soundManager && window.soundManager.play) {
            window.soundManager.play('buttonClick');
        }
    }
    
    updateDisplay() {
        if (!this.imageElement) return;
        
        const newImage = this.images[this.currentIndex];
        const imagePath = `images/trebek/${newImage}`;
        
        // Add transition effect
        this.imageElement.style.opacity = '0';
        
        setTimeout(() => {
            this.imageElement.src = imagePath;
            this.imageElement.style.opacity = '1';
            
            // Trigger host animation if available
            if (window.hostAnimationManager && Math.random() > 0.7) {
                setTimeout(() => {
                    window.hostAnimationManager.playAnimation('greeting');
                }, 500);
            }
        }, 150);
        
        console.log(`Switched to host image: ${newImage}`);
    }
    
    // Method to get current host index (for saving preferences)
    getCurrentIndex() {
        return this.currentIndex;
    }
    
    // Method to set specific host (for loading preferences)
    setHost(index) {
        if (index >= 0 && index < this.images.length) {
            this.currentIndex = index;
            this.updateDisplay();
        }
    }
}

// Initialize the host image cycler
window.hostImageCycler = new HostImageCycler();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HostImageCycler;
}
