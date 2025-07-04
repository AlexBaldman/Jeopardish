document.addEventListener('DOMContentLoaded', () => {
    console.log('Jeopardish script executing.');

    // --- Hamburger Menu Toggle --- //
    const hamburgerButton = document.getElementById('hamburger-menu');
    const sideMenu = document.getElementById('side-menu');

    if (hamburgerButton && sideMenu) {
        hamburgerButton.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent click from bubbling up to the window
            console.log('Hamburger menu toggled.');
            hamburgerButton.classList.toggle('active');
            sideMenu.classList.toggle('active');
        });
    } else {
        console.error('Core element missing: hamburger-menu or side-menu.');
    }

    // --- Theme Toggle --- //
    const themeSwitch = document.getElementById('theme-switch');
    if (themeSwitch) {
        themeSwitch.addEventListener('change', () => { // Use 'change' for checkboxes
            console.log('Theme toggled.');
            document.body.classList.toggle('dark-mode');
        });
    } else {
        console.error('Core element missing: theme-switch.');
    }

    // --- Close menu when clicking outside --- //
    document.addEventListener('click', (event) => {
        if (sideMenu && hamburgerButton && hamburgerButton.classList.contains('active')) {
            if (!sideMenu.contains(event.target) && !hamburgerButton.contains(event.target)) {
                console.log('Clicked outside, closing menu.');
                hamburgerButton.classList.remove('active');
                sideMenu.classList.remove('active');
            }
        }
    });

    // --- Language Toggle (Placeholder) --- //
    const langButton = document.getElementById('lang-btn');
    if (langButton) {
        langButton.addEventListener('click', () => {
            console.log('Language toggle clicked.');
            // Placeholder for actual language switching logic
        });
    } else {
        console.error('Language button not found.');
    }

    // --- Modal Management ---
    const modalTriggers = {
        'login-button': 'auth-modal',
        'leaderboard-button': 'leaderboard-modal',
        'settings-button': 'settings-modal',
        'stats-button': 'stats-modal',
        'achievements-button': 'achievements-modal',
        'profile-button': 'profile-modal',
        'help-button': 'help-modal'
    };

    const openModal = (modalId) => {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
        }
    };

    const closeModal = (modal) => {
        if (modal) {
            modal.style.display = 'none';
        }
    };

    // Attach event listeners to trigger buttons
    for (const triggerId in modalTriggers) {
        const triggerButton = document.getElementById(triggerId);
        if (triggerButton) {
            triggerButton.addEventListener('click', () => {
                openModal(modalTriggers[triggerId]);
                // Close the side menu when a modal is opened
                if (sideMenu.classList.contains('active')) {
                    hamburgerButton.classList.remove('active');
                    sideMenu.classList.remove('active');
                }
            });
        }
    }

    // Attach event listeners to all close buttons
    const closeButtons = document.querySelectorAll('.close-modal');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            const modal = button.closest('.modal');
            closeModal(modal);
        });
    });

    // Close modal when clicking outside of it
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', (event) => {
            if (event.target === modal) {
                closeModal(modal);
            }
        });
    });
});
