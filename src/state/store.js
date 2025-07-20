/**
 * Central State Store
 * 
 * Carmack's principle: "State should be predictable and debuggable.
 * Immutability prevents bugs. Time-travel debugging saves time."
 */

import { deepClone } from '../utils/helpers.js';
import { eventBus } from '../utils/events.js';
import { DEBUG } from '../utils/constants.js';

/**
 * Store class - Central state management
 */
export class Store {
  constructor(initialState = {}) {
    this._state = initialState;
    this._prevState = null;
    this._history = [];
    this._historyIndex = -1;
    this._maxHistory = 50;
    this._subscribers = new Map();
    this._middleware = [];
    this._isTimeTravel = false;
    
    // Add to history
    this._saveToHistory(this._state);
  }

  /**
   * Get current state (immutable)
   * @returns {Object} Current state
   */
  getState() {
    return deepClone(this._state);
  }

  /**
   * Get state at specific path
   * @param {string} path - Dot notation path (e.g., 'game.score')
   * @returns {*} Value at path
   */
  get(path) {
    const keys = path.split('.');
    let value = this._state;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return deepClone(value);
  }

  /**
   * Dispatch an action to update state
   * @param {string} type - Action type
   * @param {Object} payload - Action payload
   */
  dispatch(type, payload = {}) {
    const action = { type, payload, timestamp: Date.now() };
    
    if (DEBUG.LOG_STATE_CHANGES) {
      console.group(`📤 Action: ${type}`);
      console.log('Payload:', payload);
      console.log('Current State:', this.getState());
    }
    
    // Run middleware
    for (const middleware of this._middleware) {
      const result = middleware(this, action);
      if (result === false) {
        if (DEBUG.LOG_STATE_CHANGES) {
          console.log('❌ Action blocked by middleware');
          console.groupEnd();
        }
        return;
      }
    }
    
    // Save previous state
    this._prevState = deepClone(this._state);
    
    // Apply action through reducer
    const newState = this._reduce(this._state, action);
    
    // Only update if state actually changed
    if (JSON.stringify(newState) !== JSON.stringify(this._state)) {
      this._state = newState;
      
      // Save to history (unless we're time traveling)
      if (!this._isTimeTravel) {
        this._saveToHistory(newState);
      }
      
      // Notify subscribers
      this._notifySubscribers(action);
      
      // Emit global event
      eventBus.emit('state:changed', {
        action,
        prevState: this._prevState,
        newState: this.getState()
      });
    }
    
    if (DEBUG.LOG_STATE_CHANGES) {
      console.log('New State:', this.getState());
      console.groupEnd();
    }
  }

  /**
   * Subscribe to state changes
   * @param {Function} callback - Callback function
   * @param {string} path - Optional path to watch
   * @returns {Function} Unsubscribe function
   */
  subscribe(callback, path = null) {
    const id = Symbol('subscriber');
    this._subscribers.set(id, { callback, path });
    
    // Return unsubscribe function
    return () => {
      this._subscribers.delete(id);
    };
  }

  /**
   * Add middleware
   * @param {Function} middleware - Middleware function
   */
  use(middleware) {
    this._middleware.push(middleware);
  }

  /**
   * Time travel to previous state
   */
  undo() {
    if (this._historyIndex > 0) {
      this._isTimeTravel = true;
      this._historyIndex--;
      this._state = deepClone(this._history[this._historyIndex].state);
      this._notifySubscribers({ type: 'UNDO' });
      this._isTimeTravel = false;
    }
  }

  /**
   * Time travel to next state
   */
  redo() {
    if (this._historyIndex < this._history.length - 1) {
      this._isTimeTravel = true;
      this._historyIndex++;
      this._state = deepClone(this._history[this._historyIndex].state);
      this._notifySubscribers({ type: 'REDO' });
      this._isTimeTravel = false;
    }
  }

  /**
   * Reset to initial state
   */
  reset() {
    if (this._history.length > 0) {
      this._state = deepClone(this._history[0].state);
      this._historyIndex = 0;
      this._history = [this._history[0]];
      this._notifySubscribers({ type: 'RESET' });
    }
  }

  /**
   * Get state history
   * @returns {Array} State history
   */
  getHistory() {
    return this._history.map(entry => ({
      ...entry,
      isCurrent: this._history.indexOf(entry) === this._historyIndex
    }));
  }

  /**
   * Reduce function - applies actions to state
   * @param {Object} state - Current state
   * @param {Object} action - Action to apply
   * @returns {Object} New state
   * @private
   */
  _reduce(state, action) {
    // This should be overridden or configured with actual reducers
    // For now, we'll use a simple object spread pattern
    
    switch (action.type) {
      case 'SET':
        return this._setValue(state, action.payload.path, action.payload.value);
      
      case 'UPDATE':
        return { ...state, ...action.payload };
      
      case 'MERGE':
        return this._deepMerge(state, action.payload);
      
      default:
        // Allow custom reducers to be added
        if (this._customReducer) {
          return this._customReducer(state, action);
        }
        return state;
    }
  }

  /**
   * Set value at path
   * @param {Object} state - State object
   * @param {string} path - Dot notation path
   * @param {*} value - Value to set
   * @returns {Object} New state
   * @private
   */
  _setValue(state, path, value) {
    const keys = path.split('.');
    const newState = deepClone(state);
    let current = newState;
    
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }
    
    current[keys[keys.length - 1]] = value;
    return newState;
  }

  /**
   * Deep merge objects
   * @param {Object} target - Target object
   * @param {Object} source - Source object
   * @returns {Object} Merged object
   * @private
   */
  _deepMerge(target, source) {
    const result = deepClone(target);
    
    for (const key in source) {
      if (source.hasOwnProperty(key)) {
        if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
          result[key] = this._deepMerge(result[key] || {}, source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    
    return result;
  }

  /**
   * Save state to history
   * @param {Object} state - State to save
   * @private
   */
  _saveToHistory(state) {
    // Remove any future history if we're not at the end
    if (this._historyIndex < this._history.length - 1) {
      this._history = this._history.slice(0, this._historyIndex + 1);
    }
    
    // Add new state
    this._history.push({
      state: deepClone(state),
      timestamp: Date.now()
    });
    
    // Limit history size
    if (this._history.length > this._maxHistory) {
      this._history.shift();
    } else {
      this._historyIndex++;
    }
  }

  /**
   * Notify subscribers of state change
   * @param {Object} action - Action that caused change
   * @private
   */
  _notifySubscribers(action) {
    for (const [id, { callback, path }] of this._subscribers) {
      // If watching specific path, check if it changed
      if (path) {
        const prevValue = this._getValueAtPath(this._prevState, path);
        const newValue = this._getValueAtPath(this._state, path);
        
        if (JSON.stringify(prevValue) !== JSON.stringify(newValue)) {
          callback({
            action,
            path,
            prevValue,
            newValue,
            state: this.getState()
          });
        }
      } else {
        // Global subscriber
        callback({
          action,
          prevState: this._prevState,
          newState: this.getState()
        });
      }
    }
  }

  /**
   * Get value at path
   * @param {Object} obj - Object to traverse
   * @param {string} path - Dot notation path
   * @returns {*} Value at path
   * @private
   */
  _getValueAtPath(obj, path) {
    if (!obj || !path) return undefined;
    
    const keys = path.split('.');
    let value = obj;
    
    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        return undefined;
      }
    }
    
    return value;
  }

  /**
   * Set custom reducer
   * @param {Function} reducer - Custom reducer function
   */
  setReducer(reducer) {
    this._customReducer = reducer;
  }
}

/**
 * Create a store with initial state
 * @param {Object} initialState - Initial state
 * @returns {Store} Store instance
 */
export function createStore(initialState = {}) {
  return new Store(initialState);
}
