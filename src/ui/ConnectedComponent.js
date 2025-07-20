/**
 * Connected Component
 * 
 * Carmack's principle: "State and UI should be loosely coupled.
 * The UI reacts to state, but doesn't own it."
 */

import { Component } from './Component.js';
import { getStore } from '../state/index.js';

/**
 * Component connected to the global state store
 * Automatically re-renders when relevant state changes
 */
export class ConnectedComponent extends Component {
  constructor(props = {}) {
    super(props);
    
    this.store = getStore();
    this.storeUnsubscribe = null;
    this.prevStoreState = null;
    this.storeState = {};
  }

  /**
   * Connect to store on mount
   */
  onMount() {
    super.onMount();
    
    // Initial state mapping
    this._updateStoreState();
    
    // Subscribe to store changes
    this.storeUnsubscribe = this.store.subscribe(this._handleStoreChange.bind(this));
  }

  /**
   * Disconnect from store on unmount
   */
  onUnmount() {
    super.onUnmount();
    
    // Unsubscribe from store
    if (this.storeUnsubscribe) {
      this.storeUnsubscribe();
      this.storeUnsubscribe = null;
    }
  }

  /**
   * Map state to component
   * Override in subclasses
   * @param {Object} state - Store state
   * @returns {Object} Mapped state
   */
  mapStateToProps(state) {
    return {};
  }

  /**
   * Map dispatch to component methods
   * Override in subclasses
   * @param {Function} dispatch - Store dispatch
   * @returns {Object} Mapped methods
   */
  mapDispatchToProps(dispatch) {
    return {};
  }

  /**
   * Get store state
   */
  getStoreState() {
    return this.storeState;
  }

  /**
   * Dispatch action to store
   * @param {string} type - Action type
   * @param {Object} payload - Action payload
   */
  dispatch(type, payload) {
    this.store.dispatch(type, payload);
  }

  /**
   * Handle store changes
   * @private
   */
  _handleStoreChange(change) {
    this._updateStoreState();
  }

  /**
   * Update store state mapping
   * @private
   */
  _updateStoreState() {
    const state = this.store.getState();
    const newStoreState = this.mapStateToProps(state);
    
    // Check if mapped state changed
    if (this._hasStoreStateChanged(newStoreState)) {
      this.prevStoreState = this.storeState;
      this.storeState = newStoreState;
      
      // Re-render
      if (this._mounted) {
        this.update();
      }
    }
  }

  /**
   * Check if store state changed
   * @private
   */
  _hasStoreStateChanged(newState) {
    if (!this.storeState) return true;
    
    // Simple shallow comparison
    const keys = Object.keys({ ...this.storeState, ...newState });
    return keys.some(key => this.storeState[key] !== newState[key]);
  }
}

/**
 * HOC to connect any component to store
 */
export function connect(mapStateToProps, mapDispatchToProps) {
  return function(ComponentClass) {
    return class extends ConnectedComponent {
      mapStateToProps(state) {
        return mapStateToProps ? mapStateToProps(state) : {};
      }
      
      mapDispatchToProps(dispatch) {
        return mapDispatchToProps ? mapDispatchToProps(dispatch) : {};
      }
      
      render() {
        // Create instance of wrapped component
        if (!this.wrapped) {
          const props = {
            ...this.props,
            ...this.storeState,
            ...this.mapDispatchToProps(this.dispatch.bind(this))
          };
          this.wrapped = new ComponentClass(props);
        } else {
          // Update props
          Object.assign(this.wrapped.props, this.storeState);
        }
        
        return this.wrapped.render();
      }
    };
  };
}

/**
 * Hook-like helpers for functional components
 */
export const hooks = {
  /**
   * Use store state
   * @param {Function} selector - State selector
   */
  useState: function(selector) {
    const store = getStore();
    const state = store.getState();
    return selector(state);
  },
  
  /**
   * Use store dispatch
   */
  useDispatch: function() {
    const store = getStore();
    return store.dispatch.bind(store);
  },
  
  /**
   * Use store subscription
   * @param {Function} callback - Subscription callback
   * @param {Array} deps - Dependencies
   */
  useEffect: function(callback, deps = []) {
    const store = getStore();
    return store.subscribe(callback);
  }
};
