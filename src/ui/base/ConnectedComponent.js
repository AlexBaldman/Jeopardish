/**
 * Base class for components that connect to the store and event bus
 * Follows Carmack's principles of minimal abstraction with clear purpose
 */
export default class ConnectedComponent {
    constructor({ store, eventBus }) {
        if (!store || !eventBus) {
            throw new Error('ConnectedComponent requires store and eventBus');
        }
        
        this.store = store;
        this.eventBus = eventBus;
        this.element = null;
        this.subscriptions = [];
        this.listeners = new Map();
    }

    /**
     * Subscribe to specific state paths
     * Returns unsubscribe function
     */
    subscribe(path, callback) {
        const unsubscribe = this.store.subscribe(path, callback);
        this.subscriptions.push(unsubscribe);
        return unsubscribe;
    }

    /**
     * Listen to specific events
     * Automatically cleaned up on destroy
     */
    on(event, handler) {
        this.eventBus.on(event, handler);
        
        // Track for cleanup
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(handler);
    }

    /**
     * Emit events through the event bus
     */
    emit(event, data) {
        this.eventBus.emit(event, data);
    }

    /**
     * Get current state from store
     */
    getState(path) {
        return this.store.getState(path);
    }

    /**
     * Dispatch action to store
     */
    dispatch(action) {
        return this.store.dispatch(action);
    }

    /**
     * Mount component to DOM
     */
    mount(container) {
        if (!container) {
            throw new Error('Container element required for mounting');
        }
        
        // Create element if needed
        if (!this.element) {
            this.element = this.render();
        }
        
        // Append to container
        container.appendChild(this.element);
        
        // Initialize after mounting
        this.initialize();
    }

    /**
     * Render component - must be implemented by subclasses
     */
    render() {
        throw new Error('render() must be implemented by subclass');
    }

    /**
     * Initialize component after mounting
     * Override in subclasses for setup logic
     */
    initialize() {
        // Default: subscribe to state changes
        this.subscribeToState();
    }

    /**
     * Subscribe to state changes - override in subclasses
     */
    subscribeToState() {
        // Subclasses should implement specific subscriptions
    }

    /**
     * Update component - override in subclasses
     */
    update() {
        // Subclasses should implement update logic
    }

    /**
     * Clean up component
     */
    destroy() {
        // Unsubscribe from store
        this.subscriptions.forEach(unsubscribe => unsubscribe());
        this.subscriptions = [];
        
        // Remove event listeners
        this.listeners.forEach((handlers, event) => {
            handlers.forEach(handler => {
                this.eventBus.off(event, handler);
            });
        });
        this.listeners.clear();
        
        // Remove from DOM
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
        }
        
        this.element = null;
    }

    /**
     * Helper to create DOM element with attributes
     */
    createElement(tag, attributes = {}, children = []) {
        const element = document.createElement(tag);
        
        // Set attributes
        Object.entries(attributes).forEach(([key, value]) => {
            if (key === 'className') {
                element.className = value;
            } else if (key === 'textContent') {
                element.textContent = value;
            } else if (key.startsWith('data-')) {
                element.setAttribute(key, value);
            } else {
                element[key] = value;
            }
        });
        
        // Append children
        children.forEach(child => {
            if (typeof child === 'string') {
                element.appendChild(document.createTextNode(child));
            } else if (child instanceof Node) {
                element.appendChild(child);
            }
        });
        
        return element;
    }

    /**
     * Helper to bind event handler with automatic cleanup
     */
    bindEvent(element, event, handler) {
        element.addEventListener(event, handler);
        
        // Track for cleanup
        if (!this.listeners.has(`dom:${event}`)) {
            this.listeners.set(`dom:${event}`, []);
        }
        this.listeners.get(`dom:${event}`).push({ element, handler });
    }

    /**
     * Clean up DOM event listeners
     */
    cleanupDOMEvents() {
        this.listeners.forEach((items, key) => {
            if (key.startsWith('dom:')) {
                const event = key.substring(4);
                items.forEach(({ element, handler }) => {
                    element.removeEventListener(event, handler);
                });
            }
        });
    }
}
