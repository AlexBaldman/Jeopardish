// Frontend Functionality Fixes for Jeopardish

document.addEventListener('DOMContentLoaded', function() {
    console.log('Frontend fixes loading...');

    // ========================================
    // 1. HAMBURGER MENU FUNCTIONALITY
    // ========================================
    const hamburgerBtn = document.getElementById('hamburger-menu');
    const sideMenu = document.getElementById('side-menu');
    
    if (hamburgerBtn && sideMenu) {
        hamburgerBtn.addEventListener('click', function() {
            this.classList.toggle('active');
            sideMenu.classList.toggle('active');
        });

        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!hamburgerBtn.contains(e.target) && !sideMenu.contains(e.target)) {
                hamburgerBtn.classList.remove('active');
                sideMenu.classList.remove('active');
            }
        });
    }

    // ========================================
    // 2. SCOREBOARD FUNCTIONALITY
    // ========================================
    const scoreboard = document.getElementById('scoreboard');
    let scoreboardTimeout;
    
    if (scoreboard) {
        // Create peek element if it doesn't exist
        if (!scoreboard.querySelector('::before')) {
            // The ::before pseudo-element handles the peek tab
        }

        // Show scoreboard on hover
        scoreboard.addEventListener('mouseenter', function() {
            clearTimeout(scoreboardTimeout);
            this.classList.add('visible');
        });

        scoreboard.addEventListener('mouseleave', function() {
            scoreboardTimeout = setTimeout(() => {
                this.classList.remove('visible');
            }, 500);
        });

        // Show scoreboard on score change
        const scoreElement = document.getElementById('score');
        const streakElement = document.getElementById('streak');
        
        if (scoreElement) {
            const originalUpdateScore = window.updateScore;
            window.updateScore = function(newScore) {
                if (originalUpdateScore) {
                    originalUpdateScore.call(this, newScore);
                }
                
                // Show scoreboard temporarily
                scoreboard.classList.add('visible');
                scoreElement.classList.add('changed');
                
                setTimeout(() => {
                    scoreElement.classList.remove('changed');
                }, 500);
                
                setTimeout(() => {
                    scoreboard.classList.remove('visible');
                }, 3000);
            };
        }
    }

    // ========================================
    // 3. HOST IMAGE CYCLING
    // ========================================
    const hostContainer = document.querySelector('.host-container');
    const hostImage = document.getElementById('trebekImage');
    
    if (hostContainer && hostImage) {
        // Array of host images
        const hostImages = [
            'images/trebek/trebek-good-01.png',
            'images/trebek/trebek-good-02.png',
            'images/trebek/trebek-good-03.png',
            'images/trebek/trebek-good-04.png',
            'images/trebek/trebek-bad-01.png',
            'images/trebek/trebek-bad-02.png',
            'images/trebek/trebek-bad-03.png',
            'images/trebek/trebek-bad-04.png'
        ];
        
        let currentImageIndex = 3; // Start with trebek-good-04.png
        
        // Create invisible click zones
        const leftZone = document.createElement('div');
        const rightZone = document.createElement('div');
        
        leftZone.style.cssText = 'position:absolute;left:0;top:0;width:50%;height:100%;cursor:pointer;z-index:10;';
        rightZone.style.cssText = 'position:absolute;right:0;top:0;width:50%;height:100%;cursor:pointer;z-index:10;';
        
        hostContainer.appendChild(leftZone);
        hostContainer.appendChild(rightZone);
        
        // Cycle functions
        function cycleLeft() {
            currentImageIndex = (currentImageIndex - 1 + hostImages.length) % hostImages.length;
            updateHostImage();
        }
        
        function cycleRight() {
            currentImageIndex = (currentImageIndex + 1) % hostImages.length;
            updateHostImage();
        }
        
        function updateHostImage() {
            hostImage.style.opacity = '0';
            setTimeout(() => {
                hostImage.src = hostImages[currentImageIndex];
                hostImage.style.opacity = '1';
            }, 200);
        }
        
        // Add transition for smooth fade
        hostImage.style.transition = 'opacity 0.2s ease';
        
        leftZone.addEventListener('click', cycleLeft);
        rightZone.addEventListener('click', cycleRight);
        
        // Keyboard support
        document.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowLeft') cycleLeft();
            if (e.key === 'ArrowRight') cycleRight();
        });
    }

    // ========================================
    // 4. SPEECH BUBBLE THEME CYCLING
    // ========================================
    const speechBubble = document.getElementById('speechBubble');
    
    if (speechBubble) {
        const themes = [
            { 
                name: 'classic',
                background: 'linear-gradient(135deg, #0d2a5c 0%, #10347c 50%, #0d2a5c 100%)',
                border: '#00ffff',
                shadow: 'rgba(0, 255, 255, 0.5)'
            },
            {
                name: 'neon',
                background: 'linear-gradient(135deg, #ff006e 0%, #8338ec 100%)',
                border: '#00ff00',
                shadow: 'rgba(0, 255, 0, 0.5)'
            },
            {
                name: 'retro',
                background: 'linear-gradient(135deg, #f72585 0%, #3a0ca3 100%)',
                border: '#ffd700',
                shadow: 'rgba(255, 215, 0, 0.5)'
            },
            {
                name: 'dark',
                background: 'linear-gradient(135deg, #000000 0%, #330066 100%)',
                border: '#ff00ff',
                shadow: 'rgba(255, 0, 255, 0.5)'
            }
        ];
        
        let currentThemeIndex = 0;
        
        // Create click zones for theme switching
        const leftThemeZone = document.createElement('div');
        const rightThemeZone = document.createElement('div');
        
        leftThemeZone.style.cssText = 'position:absolute;left:0;top:0;width:50px;height:100%;cursor:pointer;z-index:10;';
        rightThemeZone.style.cssText = 'position:absolute;right:0;top:0;width:50px;height:100%;cursor:pointer;z-index:10;';
        
        speechBubble.appendChild(leftThemeZone);
        speechBubble.appendChild(rightThemeZone);
        
        function applyTheme(theme) {
            speechBubble.style.background = theme.background;
            speechBubble.style.borderColor = theme.border;
            speechBubble.style.boxShadow = `0 0 30px ${theme.shadow}, inset 0 0 20px ${theme.shadow.replace('0.5', '0.2')}`;
        }
        
        leftThemeZone.addEventListener('click', function(e) {
            e.stopPropagation();
            currentThemeIndex = (currentThemeIndex - 1 + themes.length) % themes.length;
            applyTheme(themes[currentThemeIndex]);
        });
        
        rightThemeZone.addEventListener('click', function(e) {
            e.stopPropagation();
            currentThemeIndex = (currentThemeIndex + 1) % themes.length;
            applyTheme(themes[currentThemeIndex]);
        });
    }

    // ========================================
    // 5. THEME SWITCH FUNCTIONALITY
    // ========================================
    const themeSwitch = document.getElementById('theme-switch');
    
    if (themeSwitch) {
        // Load saved theme
        const savedTheme = localStorage.getItem('jeopardishTheme');
        if (savedTheme === 'dark') {
            themeSwitch.checked = true;
            document.body.classList.add('dark-theme');
        }
        
        themeSwitch.addEventListener('change', function() {
            if (this.checked) {
                document.body.classList.add('dark-theme');
                localStorage.setItem('jeopardishTheme', 'dark');
            } else {
                document.body.classList.remove('dark-theme');
                localStorage.setItem('jeopardishTheme', 'light');
            }
        });
    }

    // ========================================
    // 6. BUTTON ANIMATIONS
    // ========================================
    const allButtons = document.querySelectorAll('button');
    
    allButtons.forEach(button => {
        // Add ripple effect on click
        button.addEventListener('click', function(e) {
            const ripple = document.createElement('span');
            ripple.classList.add('ripple');
            
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;
            
            ripple.style.cssText = `
                position: absolute;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.5);
                border-radius: 50%;
                transform: scale(0);
                animation: ripple-animation 0.6s ease-out;
            `;
            
            this.style.position = 'relative';
            this.style.overflow = 'hidden';
            this.appendChild(ripple);
            
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // ========================================
    // 7. SMOOTH SCROLLING
    // ========================================
    const mainContent = document.querySelector('.main-content-wrapper');
    
    if (mainContent) {
        // Smooth scroll to elements
        window.scrollToElement = function(element) {
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        };
    }

    // ========================================
    // 8. FIX INPUT BOX STYLING
    // ========================================
    const inputBox = document.getElementById('inputBox');
    
    if (inputBox) {
        // Add focus effects
        inputBox.addEventListener('focus', function() {
            this.parentElement.classList.add('focused');
        });
        
        inputBox.addEventListener('blur', function() {
            this.parentElement.classList.remove('focused');
        });
        
        // Auto-focus on page load
        setTimeout(() => inputBox.focus(), 1000);
    }

    // ========================================
    // 9. FEEDBACK MESSAGES
    // ========================================
    window.showFeedback = function(message, type = 'success') {
        const feedback = document.createElement('div');
        feedback.className = `feedback-message ${type}`;
        feedback.textContent = message;
        
        document.body.appendChild(feedback);
        
        setTimeout(() => {
            feedback.style.opacity = '0';
            setTimeout(() => feedback.remove(), 500);
        }, 3000);
    };

    // ========================================
    // 10. LOADING STATES
    // ========================================
    window.setButtonLoading = function(button, isLoading) {
        if (isLoading) {
            button.classList.add('loading');
            button.disabled = true;
        } else {
            button.classList.remove('loading');
            button.disabled = false;
        }
    };

    // ========================================
    // 11. RESPONSIVE FIXES
    // ========================================
    function handleResponsive() {
        const isMobile = window.innerWidth < 768;
        
        if (isMobile) {
            // Mobile-specific adjustments
            document.body.classList.add('mobile');
            
            // Close side menu on mobile when clicking menu items
            const menuButtons = document.querySelectorAll('.side-menu button');
            menuButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    hamburgerBtn.classList.remove('active');
                    sideMenu.classList.remove('active');
                });
            });
        } else {
            document.body.classList.remove('mobile');
        }
    }
    
    handleResponsive();
    window.addEventListener('resize', handleResponsive);

    // ========================================
    // 12. ADD RIPPLE ANIMATION CSS
    // ========================================
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple-animation {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .ripple {
            pointer-events: none;
        }
        
        /* Dark theme styles */
        body.dark-theme {
            background-color: #000;
            background-image: linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url('images/pixel-beach-bg.png');
        }
        
        body.dark-theme .speechBubble {
            background: linear-gradient(135deg, #000 0%, #1a1a1a 100%);
            border-color: #ff00ff;
        }
        
        /* Mobile class styles */
        body.mobile .side-menu {
            width: 100%;
            right: -100%;
        }
        
        body.mobile .button-div {
            flex-direction: column;
            width: 100%;
            padding: 0 20px;
        }
        
        body.mobile .button-div button {
            width: 100%;
        }
    `;
    document.head.appendChild(style);

    console.log('Frontend fixes loaded successfully!');
});
