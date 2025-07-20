/**
 * Base Component Class
 * 
 * Carmack's principle: "Keep the core small and fast.
 * Everything else builds on top."
 */

import { eventBus } from '../utils/events.js';
import { generateId } from '../utils/helpers.js';

/**
 * Base class for all UI components
 * Provides lifecycle, state management, and DOM manipulation
 */
export class Component {
  constructor(props = {}) {
    this.props = props;
    this.state = {};
    this.children = [];
    this.element = null;
    this.id = props.id || generateId();
    this._mounted = false;
    this._bindings = [];
    this._subscriptions = [];
    this._refs = {};
    
    // Call init hook
    this.init();
  }

  /**
   * Initialize hook - called before mount
   * Override in subclasses for setup logic
   */
  init() {}

  /**
   * Set component state and trigger re-render
   * @param {Object|Function} updates - State updates
   */
  setState(updates) {
    const prevState = { ...this.state };
    
    // Handle function updates
    if (typeof updates === 'function') {
      updates = updates(this.state, this.props);
    }
    
    // Merge state
    this.state = { ...this.state, ...updates };
    
    // Call state change hook
    this.onStateChange(prevState, this.state);
    
    // Re-render if mounted
    if (this._mounted) {
      this.update();
    }
  }

  /**
   * Get state value
   * @param {string} key - State key
   * @param {*} defaultValue - Default value
   */
  getState(key, defaultValue = undefined) {
    return this.state[key] ?? defaultValue;
  }

  /**
   * Render component to HTML
   * @returns {string} HTML string
   */
  render() {
    throw new Error('Component must implement render() method');
  }

  /**
   * Create element from render output
   * @returns {HTMLElement} DOM element
   */
  createElement() {
    const html = this.render();
    const template = document.createElement('template');
    template.innerHTML = html.trim();
    
    const element = template.content.firstChild;
    
    // Add component ID
    element.dataset.componentId = this.id;
    
    // Process refs
    this._processRefs(element);
    
    // Process event handlers
    this._processEventHandlers(element);
    
    return element;
  }

  /**
   * Mount component to DOM
   * @param {HTMLElement|string} target - Mount target
   */
  mount(target) {
    if (this._mounted) {
      console.warn('Component already mounted');
      return;
    }
    
    // Get target element
    if (typeof target === 'string') {
      target = document.querySelector(target);
    }
    
    if (!target) {
      throw new Error('Mount target not found');
    }
    
    // Create element
    this.element = this.createElement();
    
    // Mount children first
    this._mountChildren();
    
    // Append to DOM
    target.appendChild(this.element);
    
    // Mark as mounted
    this._mounted = true;
    
    // Call mounted hook
    this.onMount();
  }

  /**
   * Update component
   */
  update() {
    if (!this._mounted || !this.element) return;
    
    // Store scroll position
    const scrollTop = window.scrollY;
    const scrollLeft = window.scrollX;
    
    // Create new element
    const newElement = this.createElement();
    
    // Diff and patch
    this._patchElement(this.element, newElement);
    
    // Update children
    this._updateChildren();
    
    // Restore scroll
    window.scrollTo(scrollLeft, scrollTop);
    
    // Call updated hook
    this.onUpdate();
  }

  /**
   * Unmount component from DOM
   */
  unmount() {
    if (!this._mounted) return;
    
    // Call before unmount hook
    this.onBeforeUnmount();
    
    // Unmount children
    this._unmountChildren();
    
    // Remove element
    if (this.element && this.element.parentNode) {
      this.element.parentNode.removeChild(this.element);
    }
    
    // Clean up
    this._cleanup();
    
    // Mark as unmounted
    this._mounted = false;
    this.element = null;
    
    // Call unmounted hook
    this.onUnmount();
  }

  /**
   * Add child component
   * @param {Component} child - Child component
   * @param {string} ref - Optional ref name
   */
  addChild(child, ref = null) {
    this.children.push(child);
    
    if (ref) {
      this._refs[ref] = child;
    }
    
    // Mount child if we're mounted
    if (this._mounted && child.element) {
      const container = this.element.querySelector(`[data-ref="${ref}"]`) || this.element;
      child.mount(container);
    }
    
    return child;
  }

  /**
   * Remove child component
   * @param {Component} child - Child to remove
   */
  removeChild(child) {
    const index = this.children.indexOf(child);
    if (index !== -1) {
      this.children.splice(index, 1);
      child.unmount();
    }
  }

  /**
   * Get reference to child component or element
   * @param {string} ref - Reference name
   */
  ref(ref) {
    return this._refs[ref];
  }

  /**
   * Subscribe to events
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  on(event, handler) {
    const unsubscribe = eventBus.on(event, handler);
    this._subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  /**
   * Emit event
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  emit(event, data) {
    eventBus.emit(event, data);
  }

  /**
   * Lifecycle hooks - override in subclasses
   */
  onMount() {}
  onUpdate() {}
  onBeforeUnmount() {}
  onUnmount() {}
  onStateChange(prevState, newState) {}

  /**
   * Process ref attributes
   * @private
   */
  _processRefs(element) {
    const refElements = element.querySelectorAll('[data-ref]');
    refElements.forEach(el => {
      const ref = el.dataset.ref;
      if (ref) {
        this._refs[ref] = el;
      }
    });
    
    // Add root element if it has ref
    if (element.dataset.ref) {
      this._refs[element.dataset.ref] = element;
    }
  }

  /**
   * Process event handlers
   * @private
   */
  _processEventHandlers(element) {
    // Clean up old bindings
    this._bindings.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this._bindings = [];
    
    // Find all elements with data-on-* attributes
    const elements = [element, ...element.querySelectorAll('*')];
    
    elements.forEach(el => {
      Array.from(el.attributes)
        .filter(attr => attr.name.startsWith('data-on-'))
        .forEach(attr => {
          const event = attr.name.slice(8); // Remove 'data-on-'
          const methodName = attr.value;
          const handler = this[methodName];
          
          if (typeof handler === 'function') {
            const boundHandler = handler.bind(this);
            el.addEventListener(event, boundHandler);
            this._bindings.push({ element: el, event, handler: boundHandler });
          } else {
            console.warn(`Handler '${methodName}' not found on component`);
          }
        });
    });
  }

  /**
   * Simple DOM patching
   * @private
   */
  _patchElement(oldEl, newEl) {
    // Different tag names - replace whole element
    if (oldEl.tagName !== newEl.tagName) {
      oldEl.parentNode.replaceChild(newEl, oldEl);
      this.element = newEl;
      return;
    }
    
    // Update attributes
    const oldAttrs = Array.from(oldEl.attributes);
    const newAttrs = Array.from(newEl.attributes);
    
    // Remove old attributes
    oldAttrs.forEach(attr => {
      if (!newEl.hasAttribute(attr.name)) {
        oldEl.removeAttribute(attr.name);
      }
    });
    
    // Set new attributes
    newAttrs.forEach(attr => {
      if (oldEl.getAttribute(attr.name) !== attr.value) {
        oldEl.setAttribute(attr.name, attr.value);
      }
    });
    
    // Update text content if no children
    if (!oldEl.children.length && !newEl.children.length) {
      if (oldEl.textContent !== newEl.textContent) {
        oldEl.textContent = newEl.textContent;
      }
      return;
    }
    
    // Patch children
    const oldChildren = Array.from(oldEl.childNodes);
    const newChildren = Array.from(newEl.childNodes);
    
    // Simple case - text node
    if (oldChildren.length === 1 && newChildren.length === 1 &&
        oldChildren[0].nodeType === 3 && newChildren[0].nodeType === 3) {
      if (oldChildren[0].textContent !== newChildren[0].textContent) {
        oldChildren[0].textContent = newChildren[0].textContent;
      }
      return;
    }
    
    // Complex case - just replace innerHTML for now
    // A real implementation would do proper diffing
    if (oldEl.innerHTML !== newEl.innerHTML) {
      oldEl.innerHTML = newEl.innerHTML;
      this._processRefs(oldEl);
      this._processEventHandlers(oldEl);
    }
  }

  /**
   * Mount children
   * @private
   */
  _mountChildren() {
    this.children.forEach(child => {
      if (!child._mounted) {
        const container = this.element.querySelector(`[data-component="${child.constructor.name}"]`) || 
                         this.element;
        child.mount(container);
      }
    });
  }

  /**
   * Update children
   * @private
   */
  _updateChildren() {
    this.children.forEach(child => {
      if (child._mounted) {
        child.update();
      }
    });
  }

  /**
   * Unmount children
   * @private
   */
  _unmountChildren() {
    // Unmount in reverse order
    for (let i = this.children.length - 1; i >= 0; i--) {
      this.children[i].unmount();
    }
  }

  /**
   * Clean up resources
   * @private
   */
  _cleanup() {
    // Remove event listeners
    this._bindings.forEach(({ element, event, handler }) => {
      element.removeEventListener(event, handler);
    });
    this._bindings = [];
    
    // Unsubscribe from events
    this._subscriptions.forEach(unsubscribe => unsubscribe());
    this._subscriptions = [];
    
    // Clear refs
    this._refs = {};
  }

  /**
   * Helper to create element with attributes
   */
  static createElement(tag, attrs = {}, children = []) {
    const attrString = Object.entries(attrs)
      .map(([key, value]) => `${key}="${value}"`)
      .join(' ');
    
    const childrenHTML = children
      .map(child => typeof child === 'string' ? child : child.render())
      .join('');
    
    return `<${tag} ${attrString}>${childrenHTML}</${tag}>`;
  }
}
