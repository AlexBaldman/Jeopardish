/**
 * State Management Module
 * 
 * Carmack's principle: "One source of truth, many ways to access it.
 * Centralized state with decentralized access patterns."
 */

// Core exports
export { Store, createStore } from './store.js';
export { rootReducer, initialState } from './reducer.js';
export * from './actions.js';
export * from './selectors.js';
export { persistence, StatePersistence, createPersistenceMiddleware } from './persistence.js';

// Additional imports for setup
import { createStore } from './store.js';
import { rootReducer, initialState } from './reducer.js';
import { persistence, createPersistenceMiddleware } from './persistence.js';
import { createActionValidator, createActionLogger } from './actions.js';
import { DEBUG } from '../utils/constants.js';

/**
 * Create and configure the app store
 * @param {Object} config - Store configuration
 * @returns {Store} Configured store instance
 */
export function createAppStore(config = {}) {
  const {
    preloadedState = {},
    middleware = [],
    enablePersistence = true,
    enableLogging = DEBUG.LOG_STATE_CHANGES,
    enableValidation = true
  } = config;

  // Load persisted state
  const persistedState = enablePersistence 
    ? persistence.loadState(initialState) 
    : {};

  // Merge initial state
  const mergedInitialState = {
    ...initialState,
    ...persistedState,
    ...preloadedState
  };

  // Create store
  const store = createStore(mergedInitialState);

  // Set custom reducer
  store.setReducer(rootReducer);

  // Add middleware
  if (enableValidation) {
    store.use(createActionValidator());
  }

  if (enableLogging) {
    store.use(createActionLogger());
  }

  if (enablePersistence) {
    store.use(createPersistenceMiddleware(persistence));
  }

  // Add custom middleware
  middleware.forEach(m => store.use(m));

  return store;
}

/**
 * Global store instance (singleton)
 */
let globalStore = null;

/**
 * Get or create global store
 * @returns {Store} Global store instance
 */
export function getStore() {
  if (!globalStore) {
    globalStore = createAppStore();
  }
  return globalStore;
}

/**
 * Reset global store
 * Useful for testing or logout
 */
export function resetStore() {
  if (globalStore) {
    globalStore.reset();
  }
}

/**
 * Connect component to store
 * Higher-order function for connecting components to state
 */
export function connect(mapStateToProps, mapDispatchToProps) {
  return function(Component) {
    return class ConnectedComponent {
      constructor(props) {
        this.component = new Component(props);
        this.store = getStore();
        this.unsubscribe = null;
        this.mappedState = {};
        this.mappedDispatch = {};
        
        this.setup();
      }

      setup() {
        // Map state to props
        if (mapStateToProps) {
          this.updateMappedState();
          this.unsubscribe = this.store.subscribe(() => {
            this.updateMappedState();
            this.component.forceUpdate?.();
          });
        }

        // Map dispatch to props
        if (mapDispatchToProps) {
          this.mappedDispatch = mapDispatchToProps(
            (...args) => this.store.dispatch(...args)
          );
        }

        // Inject props
        Object.assign(this.component, this.mappedState, this.mappedDispatch);
      }

      updateMappedState() {
        const state = this.store.getState();
        this.mappedState = mapStateToProps(state);
        Object.assign(this.component, this.mappedState);
      }

      destroy() {
        if (this.unsubscribe) {
          this.unsubscribe();
        }
      }
    };
  };
}

/**
 * Use selector hook
 * For functional components or direct state access
 */
export function useSelector(selector) {
  const store = getStore();
  const state = store.getState();
  return selector(state);
}

/**
 * Use dispatch hook
 * For functional components or direct dispatch access
 */
export function useDispatch() {
  const store = getStore();
  return (...args) => store.dispatch(...args);
}

/**
 * Batch dispatch multiple actions
 */
export function batchDispatch(actions) {
  const store = getStore();
  actions.forEach(action => {
    if (action) store.dispatch(action.type, action.payload);
  });
}

/**
 * Create bound action creators
 * Automatically dispatches actions when called
 */
export function bindActionCreators(actionCreators) {
  const dispatch = useDispatch();
  const bound = {};
  
  for (const key in actionCreators) {
    const actionCreator = actionCreators[key];
    bound[key] = (...args) => {
      const action = actionCreator(...args);
      dispatch(action.type, action.payload);
      return action;
    };
  }
  
  return bound;
}

/**
 * Debug utilities
 */
export const debug = {
  /**
   * Get current state snapshot
   */
  getState: () => getStore().getState(),
  
  /**
   * Get state history
   */
  getHistory: () => getStore().getHistory(),
  
  /**
   * Time travel to specific state
   */
  timeTravel: (index) => {
    const store = getStore();
    const history = store.getHistory();
    const target = history[index];
    if (target) {
      // Go back to beginning
      while (store._historyIndex > 0) {
        store.undo();
      }
      // Go forward to target
      while (store._historyIndex < index) {
        store.redo();
      }
    }
  },
  
  /**
   * Log state changes
   */
  logStateChanges: (enabled = true) => {
    const store = getStore();
    if (enabled) {
      return store.subscribe((change) => {
        console.group('📊 State Change');
        console.log('Action:', change.action);
        console.log('Previous:', change.prevState);
        console.log('Current:', change.newState);
        console.groupEnd();
      });
    }
  },
  
  /**
   * Export state for debugging
   */
  exportState: () => {
    const state = getStore().getState();
    const blob = new Blob(
      [JSON.stringify(state, null, 2)], 
      { type: 'application/json' }
    );
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `jeopardish-state-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },
  
  /**
   * Import state for debugging
   */
  importState: (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const state = JSON.parse(e.target.result);
          const store = getStore();
          store.dispatch('UPDATE', state);
          resolve(state);
        } catch (error) {
          reject(error);
        }
      };
      reader.readAsText(file);
    });
  }
};
