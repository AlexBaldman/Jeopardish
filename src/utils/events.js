/**
 * Event System
 * 
 * Carmack's principle: "Decouple components through events.
 * This makes the system more flexible and testable."
 */

class EventEmitter {
  constructor() {
    this.events = new Map();
    this.onceEvents = new Map();
  }

  /**
   * Subscribe to an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   * @returns {Function} Unsubscribe function
   */
  on(event, callback) {
    if (!this.events.has(event)) {
      this.events.set(event, []);
    }
    
    this.events.get(event).push(callback);
    
    // Return unsubscribe function
    return () => this.off(event, callback);
  }

  /**
   * Subscribe to an event once
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  once(event, callback) {
    if (!this.onceEvents.has(event)) {
      this.onceEvents.set(event, []);
    }
    
    this.onceEvents.get(event).push(callback);
  }

  /**
   * Unsubscribe from an event
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (this.events.has(event)) {
      const callbacks = this.events.get(event);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event
   * @param {string} event - Event name
   * @param {...*} args - Event arguments
   */
  emit(event, ...args) {
    // Call regular listeners
    if (this.events.has(event)) {
      this.events.get(event).forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
    
    // Call once listeners
    if (this.onceEvents.has(event)) {
      const callbacks = this.onceEvents.get(event);
      this.onceEvents.delete(event);
      callbacks.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in once event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Remove all listeners for an event
   * @param {string} event - Event name
   */
  removeAllListeners(event) {
    if (event) {
      this.events.delete(event);
      this.onceEvents.delete(event);
    } else {
      this.events.clear();
      this.onceEvents.clear();
    }
  }

  /**
   * Get listener count for an event
   * @param {string} event - Event name
   * @returns {number} Listener count
   */
  listenerCount(event) {
    const regular = this.events.has(event) ? this.events.get(event).length : 0;
    const once = this.onceEvents.has(event) ? this.onceEvents.get(event).length : 0;
    return regular + once;
  }
}

// Global event bus
export const eventBus = new EventEmitter();

// Game Events
export const GAME_EVENTS = {
  // State changes
  STATE_CHANGED: 'game:state:changed',
  
  // Question events
  QUESTION_LOADED: 'game:question:loaded',
  QUESTION_DISPLAYED: 'game:question:displayed',
  ANSWER_SUBMITTED: 'game:answer:submitted',
  ANSWER_CHECKED: 'game:answer:checked',
  ANSWER_REVEALED: 'game:answer:revealed',
  
  // Score events
  SCORE_UPDATED: 'game:score:updated',
  STREAK_UPDATED: 'game:streak:updated',
  HIGH_SCORE_ACHIEVED: 'game:highscore:achieved',
  
  // Category mode events
  CATEGORY_MODE_STARTED: 'game:category:started',
  CATEGORY_MODE_COMPLETED: 'game:category:completed',
  CATEGORY_PROGRESS_UPDATED: 'game:category:progress',
  CATEGORY_QUESTION_LOADED: 'game:category:question:loaded',
  
  // UI events
  THEME_CHANGED: 'ui:theme:changed',
  LANGUAGE_CHANGED: 'ui:language:changed',
  MODAL_OPENED: 'ui:modal:opened',
  MODAL_CLOSED: 'ui:modal:closed',
  
  // Animation events
  ANIMATION_STARTED: 'animation:started',
  ANIMATION_COMPLETED: 'animation:completed',
  
  // Audio events
  AUDIO_MUTED: 'audio:muted',
  AUDIO_UNMUTED: 'audio:unmuted',
  SOUND_PLAYED: 'audio:sound:played',
  
  // AI events
  AI_RESPONSE_STARTED: 'ai:response:started',
  AI_RESPONSE_RECEIVED: 'ai:response:received',
  AI_RESPONSE_ERROR: 'ai:response:error',
  
  // Error events
  ERROR_OCCURRED: 'error:occurred',
  API_ERROR: 'error:api',
  VALIDATION_ERROR: 'error:validation'
};

/**
 * Emit a game event with consistent structure
 * @param {string} event - Event name
 * @param {Object} data - Event data
 */
export function emitGameEvent(event, data = {}) {
  eventBus.emit(event, {
    timestamp: Date.now(),
    event,
    ...data
  });
}

/**
 * Create a typed event handler
 * @param {string} event - Event name
 * @param {Function} handler - Handler function
 * @returns {Function} Unsubscribe function
 */
export function onGameEvent(event, handler) {
  return eventBus.on(event, handler);
}

/**
 * Wait for an event to occur
 * @param {string} event - Event name
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise} Promise that resolves with event data
 */
export function waitForEvent(event, timeout = 30000) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      eventBus.off(event, handler);
      reject(new Error(`Timeout waiting for event: ${event}`));
    }, timeout);
    
    const handler = (data) => {
      clearTimeout(timer);
      resolve(data);
    };
    
    eventBus.once(event, handler);
  });
}
