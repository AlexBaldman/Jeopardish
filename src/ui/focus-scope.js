(function initFocusScope(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYFocus = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function focusScopeFactory() {
  'use strict';

  const FOCUSABLE_SELECTOR = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    '[tabindex]:not([tabindex="-1"])',
  ].join(',');

  function getFocusable(container) {
    if (!container?.querySelectorAll) return [];
    return [...container.querySelectorAll(FOCUSABLE_SELECTOR)].filter((element) => (
      !element.hidden
      && element.getAttribute?.('aria-hidden') !== 'true'
      && !element.closest?.('[hidden], [aria-hidden="true"], [inert]')
    ));
  }

  class FocusScope {
    constructor({ documentRef = globalThis.document } = {}) {
      if (!documentRef) {
        throw new Error('FocusScope requires a document.');
      }
      this.document = documentRef;
      this.active = null;
      this.handleKeydown = this.handleKeydown.bind(this);
    }

    activate(container, {
      initialFocus = null,
      returnFocus = this.document.activeElement,
      onEscape = null,
    } = {}) {
      if (!container) return false;
      this.deactivate(this.active?.container, { restoreFocus: false });
      this.active = {
        container,
        returnFocus,
        onEscape,
      };
      this.document.addEventListener?.('keydown', this.handleKeydown);
      (initialFocus || getFocusable(container)[0] || container).focus?.();
      return true;
    }

    deactivate(container = this.active?.container, { restoreFocus = true } = {}) {
      if (!this.active || (container && this.active.container !== container)) {
        return false;
      }
      const { returnFocus } = this.active;
      this.active = null;
      this.document.removeEventListener?.('keydown', this.handleKeydown);
      if (restoreFocus) returnFocus?.focus?.();
      return true;
    }

    handleKeydown(event) {
      if (!this.active) return;
      if (event.key === 'Escape') {
        event.preventDefault?.();
        this.active.onEscape?.();
        return;
      }
      if (event.key !== 'Tab') return;

      const focusable = getFocusable(this.active.container);
      if (focusable.length === 0) {
        event.preventDefault?.();
        this.active.container.focus?.();
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const current = this.document.activeElement;
      const containsCurrent = this.active.container.contains?.(current);
      if (event.shiftKey && (!containsCurrent || current === first)) {
        event.preventDefault?.();
        last.focus?.();
      } else if (!event.shiftKey && (!containsCurrent || current === last)) {
        event.preventDefault?.();
        first.focus?.();
      }
    }
  }

  return {
    FOCUSABLE_SELECTOR,
    FocusScope,
    getFocusable,
  };
}));
