// Modal Management
const modals = {
    help: document.getElementById('help-modal'),
    settings: document.getElementById('settings-modal'),
    stats: document.getElementById('stats-modal'),
    achievements: document.getElementById('achievements-modal')
};

// Feature Icon Buttons
const featureButtons = {
    help: document.getElementById('help-btn'),
    settings: document.getElementById('settings-btn'),
    stats: document.getElementById('stats-btn'),
    achievements: document.getElementById('achievements-btn')
};

// Close Buttons
const closeButtons = document.querySelectorAll('.close-modal');

// Initialize Chart.js for stats
let statsChart = null;

// Modal Functions
function openModal(modalId) {
    const modal = modals[modalId];
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => {
            modal.classList.add('active');
        }, 10);
        
        // Initialize stats chart if opening stats modal
        if (modalId === 'stats' && !statsChart) {
            initializeStatsChart();
        }
    }
}

function closeModal(modalId) {
    const modal = modals[modalId];
    if (modal) {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
        }, 300);
    }
}

// Event Listeners for Feature Icons
Object.entries(featureButtons).forEach(([key, button]) => {
    if (button) {
        button.addEventListener('click', () => openModal(key));
    }
});

// Event Listeners for Close Buttons
closeButtons.forEach(button => {
    button.addEventListener('click', () => {
        const modal = button.closest('.modal');
        const modalId = Object.keys(modals).find(key => modals[key] === modal);
        if (modalId) {
            closeModal(modalId);
        }
    });
});

// Close modal when clicking outside
Object.values(modals).forEach(modal => {
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                const modalId = Object.keys(modals).find(key => modals[key] === modal);
                if (modalId) {
                    closeModal(modalId);
                }
            }
        });
    }
});

// Settings Functions
function initializeSettings() {
    const themeToggle = document.getElementById('theme-toggle');
    const speechBubbleStyle = document.getElementById('speech-bubble-style');
    const difficulty = document.getElementById('difficulty');
    const soundToggle = document.getElementById('sound-toggle');

    // Load saved settings
    const savedSettings = JSON.parse(localStorage.getItem('gameSettings')) || {
        theme: 'light',
        speechBubbleStyle: 'default',
        difficulty: 'medium',
        sound: true
    };

    // Apply saved settings
    if (themeToggle) themeToggle.value = savedSettings.theme;
    if (speechBubbleStyle) speechBubbleStyle.value = savedSettings.speechBubbleStyle;
    if (difficulty) difficulty.value = savedSettings.difficulty;
    if (soundToggle) soundToggle.checked = savedSettings.sound;

    // Add event listeners
    if (themeToggle) {
        themeToggle.addEventListener('change', (e) => {
            savedSettings.theme = e.target.value;
            saveSettings(savedSettings);
            applyTheme(e.target.value);
        });
    }

    if (speechBubbleStyle) {
        speechBubbleStyle.addEventListener('change', (e) => {
            savedSettings.speechBubbleStyle = e.target.value;
            saveSettings(savedSettings);
            applySpeechBubbleStyle(e.target.value);
        });
    }

    if (difficulty) {
        difficulty.addEventListener('change', (e) => {
            savedSettings.difficulty = e.target.value;
            saveSettings(savedSettings);
        });
    }

    if (soundToggle) {
        soundToggle.addEventListener('change', (e) => {
            savedSettings.sound = e.target.checked;
            saveSettings(savedSettings);
        });
    }
}

function saveSettings(settings) {
    localStorage.setItem('gameSettings', JSON.stringify(settings));
}

function applyTheme(theme) {
    document.body.setAttribute('data-theme', theme);
}

function applySpeechBubbleStyle(style) {
    const speechBubble = document.querySelector('.speechBubble');
    if (speechBubble) {
        speechBubble.className = 'speechBubble';
        if (style !== 'default') {
            speechBubble.classList.add(style + '-style');
        }
    }
}

// Stats Functions
function initializeStatsChart() {
    const ctx = document.getElementById('stats-chart').getContext('2d');
    const stats = JSON.parse(localStorage.getItem('gameStats')) || {
        dailyScores: Array(7).fill(0),
        dailyCorrect: Array(7).fill(0),
        dailyTotal: Array(7).fill(0)
    };

    statsChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
            datasets: [
                {
                    label: 'Score',
                    data: stats.dailyScores,
                    borderColor: '#ffd700',
                    backgroundColor: 'rgba(255, 215, 0, 0.1)',
                    tension: 0.4
                },
                {
                    label: 'Accuracy',
                    data: stats.dailyCorrect.map((correct, i) => 
                        stats.dailyTotal[i] ? (correct / stats.dailyTotal[i] * 100) : 0
                    ),
                    borderColor: '#4b21f4',
                    backgroundColor: 'rgba(75, 33, 244, 0.1)',
                    tension: 0.4
                }
            ]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#fffbe0',
                        font: {
                            family: "'Press Start 2P', monospace",
                            size: 10
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#fffbe0',
                        font: {
                            family: "'Press Start 2P', monospace",
                            size: 8
                        }
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    },
                    ticks: {
                        color: '#fffbe0',
                        font: {
                            family: "'Press Start 2P', monospace",
                            size: 8
                        }
                    }
                }
            }
        }
    });
}

function updateStats(correct, score) {
    const stats = JSON.parse(localStorage.getItem('gameStats')) || {
        totalGames: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        dailyScores: Array(7).fill(0),
        dailyCorrect: Array(7).fill(0),
        dailyTotal: Array(7).fill(0)
    };

    const today = new Date().getDay();
    stats.questionsAnswered++;
    if (correct) stats.correctAnswers++;
    stats.dailyScores[today] += score;
    stats.dailyCorrect[today] += correct ? 1 : 0;
    stats.dailyTotal[today]++;

    localStorage.setItem('gameStats', JSON.stringify(stats));
    updateStatsDisplay();
}

function updateStatsDisplay() {
    const stats = JSON.parse(localStorage.getItem('gameStats')) || {
        totalGames: 0,
        questionsAnswered: 0,
        correctAnswers: 0
    };

    document.getElementById('total-games').textContent = stats.totalGames;
    document.getElementById('questions-answered').textContent = stats.questionsAnswered;
    document.getElementById('correct-answers').textContent = stats.correctAnswers;
    document.getElementById('accuracy').textContent = 
        stats.questionsAnswered ? 
        Math.round((stats.correctAnswers / stats.questionsAnswered) * 100) + '%' : 
        '0%';

    if (statsChart) {
        statsChart.update();
    }
}

// Achievements Functions
function checkAchievements() {
    const stats = JSON.parse(localStorage.getItem('gameStats')) || {
        totalGames: 0,
        questionsAnswered: 0,
        correctAnswers: 0,
        highScore: 0,
        bestStreak: 0
    };

    const achievements = JSON.parse(localStorage.getItem('achievements')) || {
        firstWin: false,
        hotStreak: false,
        perfectScore: false,
        champion: false
    };

    // Check for new achievements
    if (stats.totalGames > 0 && !achievements.firstWin) {
        unlockAchievement('firstWin');
    }
    if (stats.bestStreak >= 5 && !achievements.hotStreak) {
        unlockAchievement('hotStreak');
    }
    if (stats.highScore >= 1000 && !achievements.perfectScore) {
        unlockAchievement('perfectScore');
    }
    if (stats.rank === 1 && !achievements.champion) {
        unlockAchievement('champion');
    }
}

function unlockAchievement(achievementId) {
    const achievements = JSON.parse(localStorage.getItem('achievements')) || {};
    achievements[achievementId] = true;
    localStorage.setItem('achievements', JSON.stringify(achievements));

    // Update UI
    const achievementItem = document.querySelector(`[data-achievement="${achievementId}"]`);
    if (achievementItem) {
        achievementItem.classList.remove('locked');
        achievementItem.classList.add('unlocked');
    }

    // Show notification
    showAchievementNotification(achievementId);
}

function showAchievementNotification(achievementId) {
    const achievementNames = {
        firstWin: 'First Win',
        hotStreak: 'Hot Streak',
        perfectScore: 'Perfect Score',
        champion: 'Champion'
    };

    const notification = document.createElement('div');
    notification.className = 'achievement-notification';
    notification.innerHTML = `
        <i class="fas fa-trophy"></i>
        <div class="notification-content">
            <h3>Achievement Unlocked!</h3>
            <p>${achievementNames[achievementId]}</p>
        </div>
    `;

    document.body.appendChild(notification);
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            notification.remove();
        }, 300);
    }, 3000);
}

// Initialize everything when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeSettings();
    updateStatsDisplay();
    checkAchievements();
}); 