// Add sound effects to buttons
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => {
        soundManager.play('buttonClick');
    });
});

// Add animation triggers for different events
function triggerRandomHostAnimation() {
    const animations = ['hideLeft', 'duckAndScare', 'stairs', 'moonwalk'];
    const randomAnimation = animations[Math.floor(Math.random() * animations.length)];
    hostAnimationManager.playAnimation(randomAnimation);
}

// Trigger animations on specific events
document.addEventListener('correctAnswer', () => {
    soundManager.play('correctAnswer');
    hostAnimationManager.playAnimation('duckAndScare');
});

document.addEventListener('incorrectAnswer', () => {
    soundManager.play('incorrectAnswer');
    hostAnimationManager.playAnimation('hideLeft');
});

// Add a button to trigger random animations (for testing)
const animationButton = document.createElement('button');
animationButton.textContent = '🎭 Host Animation';
animationButton.className = 'feature-icon';
animationButton.addEventListener('click', triggerRandomHostAnimation);
document.querySelector('.title-bar-right').appendChild(animationButton);

// Add sound controls
const soundButton = document.createElement('button');
soundButton.textContent = '🔊';
soundButton.className = 'feature-icon';
soundButton.addEventListener('click', () => {
    const isMuted = soundManager.toggleMute();
    soundButton.textContent = isMuted ? '🔇' : '🔊';
});
document.querySelector('.title-bar-right').appendChild(soundButton); 