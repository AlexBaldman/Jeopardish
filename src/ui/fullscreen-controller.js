(function initFullscreenController(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeopardishFullscreen = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function fullscreenControllerFactory() {
  'use strict';

  class FullscreenController {
    constructor({ documentRef, windowRef, target } = {}) {
      this.document = documentRef || globalThis.document;
      this.window = windowRef || globalThis;
      this.target = target || this.document?.getElementById?.('gameContainer') || null;
      this.buttons = [];
      this.fallbackActive = false;
      this.started = false;
      this.onToggle = () => this.toggle();
      this.onFullscreenChange = () => this.sync();
      this.onKeydown = (event) => {
        if (event.key === 'Escape' && this.fallbackActive) this.exit();
      };
    }

    getNativeElement() {
      return this.document?.fullscreenElement || this.document?.webkitFullscreenElement || null;
    }

    isActive() {
      return Boolean(this.getNativeElement() || this.fallbackActive);
    }

    start() {
      if (this.started || !this.document || !this.target) return false;
      this.started = true;
      this.buttons = Array.from(this.document.querySelectorAll?.('[data-fullscreen-toggle]') || []);
      this.buttons.forEach((button) => button.addEventListener('click', this.onToggle));
      this.document.addEventListener?.('fullscreenchange', this.onFullscreenChange);
      this.document.addEventListener?.('webkitfullscreenchange', this.onFullscreenChange);
      this.document.addEventListener?.('keydown', this.onKeydown);
      this.sync();
      return true;
    }

    async enter() {
      if (!this.target) return false;
      const request = this.target.requestFullscreen || this.target.webkitRequestFullscreen;
      if (typeof request === 'function') {
        try {
          await request.call(this.target, { navigationUI: 'hide' });
          this.sync();
          return true;
        } catch (_error) {
          // iPhone browsers may expose the API while declining element fullscreen.
        }
      }
      this.fallbackActive = true;
      this.sync();
      this.window?.scrollTo?.(0, 0);
      return true;
    }

    async exit() {
      const nativeElement = this.getNativeElement();
      const exit = this.document?.exitFullscreen || this.document?.webkitExitFullscreen;
      if (nativeElement && typeof exit === 'function') {
        try {
          await exit.call(this.document);
        } catch (_error) {
          // State synchronization below still restores the immersive fallback.
        }
      }
      this.fallbackActive = false;
      this.sync();
      return true;
    }

    toggle() {
      return this.isActive() ? this.exit() : this.enter();
    }

    sync() {
      const active = this.isActive();
      if (this.document?.body) {
        this.document.body.dataset.immersive = String(active);
      }
      if (this.target) {
        this.target.dataset.immersive = String(active);
      }
      this.buttons.forEach((button) => {
        const label = active ? 'Exit fullscreen' : 'Enter fullscreen';
        button.setAttribute('aria-pressed', String(active));
        button.setAttribute('aria-label', label);
        button.dataset.help = label;
        button.title = label;
      });
      return active;
    }

    destroy() {
      if (!this.started) return false;
      this.buttons.forEach((button) => button.removeEventListener?.('click', this.onToggle));
      this.document?.removeEventListener?.('fullscreenchange', this.onFullscreenChange);
      this.document?.removeEventListener?.('webkitfullscreenchange', this.onFullscreenChange);
      this.document?.removeEventListener?.('keydown', this.onKeydown);
      this.started = false;
      return true;
    }
  }

  return { FullscreenController };
}));
