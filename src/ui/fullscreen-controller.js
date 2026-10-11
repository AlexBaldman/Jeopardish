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
      this.pending = false;
      this.restoreScroll = null;
      this.onToggle = () => this.toggle();
      this.onFullscreenChange = () => {
        if (this.getNativeElement()) {
          // A late WebKit native-entry event replaces expansion, but its scroll
          // position must survive until the browser exits fullscreen.
          this.fallbackActive = false;
          this.announce('');
        } else if (!this.fallbackActive && this.restoreScroll) {
          // Browser-owned exit controls bypass exit(), so restore here as well.
          this.window?.scrollTo?.(...this.restoreScroll);
          this.restoreScroll = null;
          this.announce('Returned to normal view.');
        }
        this.sync();
      };
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
      const enabled = this.target.requestFullscreen
        ? this.document?.fullscreenEnabled
        : this.document?.webkitFullscreenEnabled;
      if (typeof request === 'function' && enabled !== false) {
        try {
          if (this.target.requestFullscreen) {
            await request.call(this.target, { navigationUI: 'hide' });
          } else {
            await request.call(this.target);
          }
          if (this.getNativeElement()) {
            this.sync();
            return true;
          }
        } catch (_error) {
          // iPhone browsers may expose the API while declining element fullscreen.
        }
      }
      this.restoreScroll = [this.window?.scrollX || 0, this.window?.scrollY || 0];
      this.fallbackActive = true;
      this.sync();
      this.window?.scrollTo?.(0, 0);
      this.announce('Expanded view: this browser keeps its address bar visible.');
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
      if (this.restoreScroll) this.window?.scrollTo?.(...this.restoreScroll);
      this.restoreScroll = null;
      this.announce(this.getNativeElement() ? 'Use your browser’s fullscreen exit control to return.' : 'Returned to normal view.');
      return true;
    }

    async toggle() {
      if (this.pending) return false;
      this.pending = true;
      this.sync();
      try {
        return await (this.isActive() ? this.exit() : this.enter());
      } finally {
        this.pending = false;
        this.sync();
      }
    }

    announce(message) {
      const status = this.document?.getElementById?.('fullscreenStatus');
      if (status) status.textContent = message;
    }

    sync() {
      const active = this.isActive();
      const mode = this.getNativeElement() ? 'native' : this.fallbackActive ? 'expanded' : 'normal';
      if (this.document?.body) {
        this.document.body.dataset.immersive = String(active);
      }
      if (this.target) {
        this.target.dataset.immersive = String(active);
        this.target.dataset.fullscreenMode = mode;
      }
      this.buttons.forEach((button) => {
        const supported = typeof (this.target?.requestFullscreen || this.target?.webkitRequestFullscreen) === 'function'
          && (this.target?.requestFullscreen ? this.document?.fullscreenEnabled : this.document?.webkitFullscreenEnabled) !== false;
        const label = mode === 'expanded' ? 'Exit expanded view'
          : active ? 'Exit fullscreen' : supported ? 'Enter fullscreen' : 'Expand game';
        button.disabled = this.pending;
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
