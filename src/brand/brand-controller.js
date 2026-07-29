(function initBrandController(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYBrand = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function brandControllerFactory() {
  'use strict';

  const O_TOKENS = Object.freeze(['portal', 'eye', 'donut', 'coin', 'eclipse', 'disco']);

  class BrandController {
    constructor({ documentRef = globalThis.document, tokens = O_TOKENS } = {}) {
      this.document = documentRef;
      this.tokens = [...tokens];
      this.index = 0;
    }

    bind() {
      const marks = Array.from(this.document?.querySelectorAll?.('[data-brand-mark]') || []);
      marks.forEach((mark) => {
        const trigger = mark.querySelector?.('[data-brand-o]');
        trigger?.addEventListener?.('click', () => this.cycle());
        trigger?.addEventListener?.('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.cycle();
          }
        });
      });
      this.render();
      return marks.length;
    }

    cycle(step = 1) {
      this.index = (this.index + step + this.tokens.length) % this.tokens.length;
      this.render();
      return this.getToken();
    }

    setToken(token) {
      const index = this.tokens.indexOf(token);
      if (index >= 0) {
        this.index = index;
        this.render();
      }
      return this.getToken();
    }

    getToken() {
      return this.tokens[this.index] || 'portal';
    }

    render() {
      const token = this.getToken();
      this.document?.querySelectorAll?.('[data-brand-o], [data-brand-o-display]')?.forEach?.((element) => {
        element.dataset.oToken = token;
        if (element.hasAttribute?.('data-brand-o')) {
          element.setAttribute?.('aria-label', `Jeo O: ${token}. Activate to change it.`);
          element.setAttribute?.('title', `The O in Jeo is currently ${token}. Activate to change it.`);
        }
      });
    }
  }

  return {
    BrandController,
    O_TOKENS,
  };
}));
