/**
 * Ticker Integration
 * Connects existing game events to the comedy ticker system
 */

// Wait for DOM to be ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('Ticker Integration initialized');
    
    // Override or extend the updateTickerOnEvent function
    const originalUpdateTickerOnEvent = window.updateTickerOnEvent;
    
    window.updateTickerOnEvent = function(event, data = {}) {
        // Call original function if it exists
        if (originalUpdateTickerOnEvent) {
            originalUpdateTickerOnEvent.call(this, event, data);
        }
        
        // Dispatch events for our comedy ticker
        switch(event) {
            case 'correct':
                document.dispatchEvent(new CustomEvent('correctAnswer'));
                if (data.streak && data.streak >= 3) {
                    document.dispatchEvent(new CustomEvent('streakMilestone', { 
                        detail: { streak: data.streak } 
                    }));
                }
                break;
            case 'incorrect':
                document.dispatchEvent(new CustomEvent('incorrectAnswer'));
                break;
        }
    };
    
    // Also listen for streak updates
    const originalUpdateStreak = window.updateStreak;
    if (originalUpdateStreak) {
        window.updateStreak = function(correct) {
            // Call original
            originalUpdateStreak.call(this, correct);
            
            // Check for streak milestones
            if (correct && window.currentStreak >= 3) {
                document.dispatchEvent(new CustomEvent('streakMilestone', { 
                    detail: { streak: window.currentStreak } 
                }));
            }
        };
    }
});
