/**
 * State Persistence
 * 
 * Carmack's principle: "Save often, load fast.
 * Users shouldn't lose progress due to technical issues."
 */

import { STORAGE_KEYS } from '../utils/constants.js';
import { deepClone } from '../utils/helpers.js';

/**
 * Storage adapter interface
 * Allows swapping between localStorage, sessionStorage, or other backends
 */
class StorageAdapter {
  constructor(storage = localStorage) {
    this.storage = storage;
  }

  getItem(key) {
    try {
      const item = this.storage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.error('Error reading from storage:', error);
      return null;
    }
  }

  setItem(key, value) {
    try {
      this.storage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Error writing to storage:', error);
      return false;
    }
  }

  removeItem(key) {
    try {
      this.storage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Error removing from storage:', error);
      return false;
    }
  }

  clear() {
    try {
      // Only clear our keys, not all storage
      Object.values(STORAGE_KEYS).forEach(key => {
        this.storage.removeItem(key);
      });
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }
}

/**
 * State persistence manager
 */
export class StatePersistence {
  constructor(storage = new StorageAdapter()) {
    this.storage = storage;
    this.saveDebounceTime = 1000; // Debounce saves by 1 second
    this.saveTimeout = null;
  }

  /**
   * Save state to storage
   * @param {Object} state - State to save
   * @param {Object} options - Save options
   */
  saveState(state, options = {}) {
    const {
      immediate = false,
      partial = false,
      keys = null
    } = options;

    // Clear existing timeout if debouncing
    if (!immediate && this.saveTimeout) {
      clearTimeout(this.saveTimeout);
    }

    const save = () => {
      try {
        if (partial && keys) {
          // Save only specified keys
          keys.forEach(key => {
            const stateSlice = this._getStateSlice(state, key);
            if (stateSlice !== undefined) {
              this._saveSlice(key, stateSlice);
            }
          });
        } else {
          // Save full state
          this._saveFullState(state);
        }
      } catch (error) {
        console.error('Error saving state:', error);
      }
    };

    if (immediate) {
      save();
    } else {
      // Debounce saves
      this.saveTimeout = setTimeout(save, this.saveDebounceTime);
    }
  }

  /**
   * Load state from storage
   * @param {Object} defaults - Default state values
   * @returns {Object} Loaded state
   */
  loadState(defaults = {}) {
    try {
      const gameState = this._loadSlice('game', defaults.game);
      const scoreState = this._loadSlice('score', defaults.score);
      const userState = this._loadSlice('user', defaults.user);
      const settingsState = this._loadSlice('settings', defaults.settings);
      const statisticsState = this._loadSlice('statistics', defaults.statistics);

      // Merge with defaults
      return {
        ...defaults,
        game: { ...defaults.game, ...gameState },
        score: { ...defaults.score, ...scoreState },
        user: { ...defaults.user, ...userState },
        settings: { ...defaults.settings, ...settingsState },
        statistics: { ...defaults.statistics, ...statisticsState }
      };
    } catch (error) {
      console.error('Error loading state:', error);
      return defaults;
    }
  }

  /**
   * Clear all saved state
   */
  clearState() {
    return this.storage.clear();
  }

  /**
   * Save state slice
   * @private
   */
  _saveSlice(key, data) {
    const storageKey = this._getStorageKey(key);
    this.storage.setItem(storageKey, {
      data,
      timestamp: Date.now(),
      version: '2.0.0'
    });
  }

  /**
   * Load state slice
   * @private
   */
  _loadSlice(key, defaultValue = {}) {
    const storageKey = this._getStorageKey(key);
    const saved = this.storage.getItem(storageKey);
    
    if (!saved) return defaultValue;
    
    // Check version compatibility
    if (saved.version !== '2.0.0') {
      console.warn(`State version mismatch for ${key}. Migrating...`);
      return this._migrateState(saved, defaultValue);
    }
    
    return saved.data || defaultValue;
  }

  /**
   * Save full state
   * @private
   */
  _saveFullState(state) {
    // Save critical state slices
    this._saveSlice('game', {
      currentQuestion: null, // Don't persist current question
      session: null // Don't persist active session
    });
    
    this._saveSlice('score', {
      current: state.score?.current,
      high: state.score?.high,
      streak: state.score?.streak,
      bestStreak: state.score?.bestStreak
    });
    
    this._saveSlice('user', state.user);
    this._saveSlice('settings', state.settings);
    this._saveSlice('statistics', state.statistics);
  }

  /**
   * Get state slice by key
   * @private
   */
  _getStateSlice(state, key) {
    return state[key];
  }

  /**
   * Get storage key
   * @private
   */
  _getStorageKey(key) {
    const keyMap = {
      game: STORAGE_KEYS.GAME_STATE,
      score: STORAGE_KEYS.GAME_STATE,
      user: STORAGE_KEYS.USER_PREFS,
      settings: STORAGE_KEYS.USER_PREFS,
      statistics: STORAGE_KEYS.STATISTICS
    };
    
    return keyMap[key] || STORAGE_KEYS.GAME_STATE;
  }

  /**
   * Migrate old state format
   * @private
   */
  _migrateState(oldState, defaultValue) {
    // Handle version 1.x migration
    if (oldState.version && oldState.version.startsWith('1.')) {
      return this._migrateV1ToV2(oldState.data || oldState, defaultValue);
    }
    
    return defaultValue;
  }

  /**
   * Migrate v1 to v2 state
   * @private
   */
  _migrateV1ToV2(v1State, defaultValue) {
    try {
      // Map old structure to new
      return {
        ...defaultValue,
        current: v1State.currentScore || defaultValue.current,
        high: v1State.bestScore || v1State.highScore || defaultValue.high,
        streak: v1State.currentStreak || defaultValue.streak,
        bestStreak: v1State.bestStreak || defaultValue.bestStreak
      };
    } catch (error) {
      console.error('Migration failed:', error);
      return defaultValue;
    }
  }
}

/**
 * Create persistence middleware for store
 */
export function createPersistenceMiddleware(persistence, config = {}) {
  const {
    blacklist = ['errors', 'ui.loading', 'ui.notifications'],
    whitelist = null,
    throttle = 1000
  } = config;

  let lastSave = 0;

  return (store, action) => {
    // Don't persist on every action
    const now = Date.now();
    if (now - lastSave < throttle) {
      return true;
    }

    // Check if action should trigger save
    const shouldSave = [
      'SCORE_UPDATE',
      'STREAK_UPDATE',
      'HIGH_SCORE_UPDATE',
      'SETTINGS_UPDATE',
      'USER_LOGIN',
      'USER_UPDATE_PROFILE',
      'STATS_UPDATE',
      'STATS_ACHIEVEMENT_UNLOCK',
      'GAME_END'
    ].includes(action.type);

    if (shouldSave) {
      const state = store.getState();
      const stateToPersist = filterState(state, { blacklist, whitelist });
      
      persistence.saveState(stateToPersist, {
        partial: true,
        keys: getKeysToSave(action.type)
      });
      
      lastSave = now;
    }

    return true;
  };
}

/**
 * Filter state based on blacklist/whitelist
 */
function filterState(state, { blacklist, whitelist }) {
  if (whitelist) {
    // Only save whitelisted keys
    const filtered = {};
    whitelist.forEach(key => {
      const [root, ...path] = key.split('.');
      if (!filtered[root]) filtered[root] = {};
      
      if (path.length === 0) {
        filtered[root] = state[root];
      } else {
        // Handle nested paths
        setNestedValue(filtered[root], path, getNestedValue(state[root], path));
      }
    });
    return filtered;
  }

  // Remove blacklisted keys
  const filtered = deepClone(state);
  blacklist.forEach(key => {
    const [root, ...path] = key.split('.');
    if (path.length === 0) {
      delete filtered[root];
    } else {
      // Handle nested paths
      deleteNestedValue(filtered[root], path);
    }
  });
  
  return filtered;
}

/**
 * Get keys to save based on action type
 */
function getKeysToSave(actionType) {
  const keyMap = {
    'SCORE_UPDATE': ['score'],
    'STREAK_UPDATE': ['score'],
    'HIGH_SCORE_UPDATE': ['score'],
    'SETTINGS_UPDATE': ['settings'],
    'USER_LOGIN': ['user'],
    'USER_UPDATE_PROFILE': ['user'],
    'STATS_UPDATE': ['statistics'],
    'STATS_ACHIEVEMENT_UNLOCK': ['statistics'],
    'GAME_END': ['score', 'statistics']
  };
  
  return keyMap[actionType] || ['game', 'score'];
}

/**
 * Helper functions for nested paths
 */
function getNestedValue(obj, path) {
  return path.reduce((current, key) => current?.[key], obj);
}

function setNestedValue(obj, path, value) {
  const last = path[path.length - 1];
  const parent = path.slice(0, -1).reduce((current, key) => {
    if (!current[key]) current[key] = {};
    return current[key];
  }, obj);
  parent[last] = value;
}

function deleteNestedValue(obj, path) {
  const last = path[path.length - 1];
  const parent = path.slice(0, -1).reduce((current, key) => current?.[key], obj);
  if (parent) delete parent[last];
}

/**
 * Default persistence instance
 */
export const persistence = new StatePersistence();
