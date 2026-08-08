(function initBrandController(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYBrand = factory();
    bootstrapStagePresentation(root);
  }

  function bootstrapStagePresentation(runtimeRoot) {
    const documentRef = runtimeRoot?.document;
    if (!documentRef || documentRef.documentElement?.dataset?.stageResources === 'loading') return;
    documentRef.documentElement.dataset.stageResources = 'loading';

    function loadStyle(href, marker) {
      if (documentRef.querySelector(`link[${marker}]`)) return;
      const link = documentRef.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      link.setAttribute(marker, 'true');
      documentRef.head?.append(link);
    }

    loadStyle('styles/game/stage-engine.css?v=stage-engine-2', 'data-stage-engine-style');
    loadStyle('styles/game/stage-runtime.css?v=stage-runtime-2', 'data-stage-runtime-style');
    loadStyle('styles/game/stage-brand-controls.css?v=stage-brand-1', 'data-stage-brand-style');

    function loadScript(src, marker, onload) {
      const existing = documentRef.querySelector(`script[${marker}]`);
      if (existing) {
        if (onload) {
          if (existing.dataset.loaded === 'true') onload();
          else existing.addEventListener('load', onload, { once: true });
        }
        return existing;
      }
      const script = documentRef.createElement('script');
      script.src = src;
      script.defer = true;
      script.setAttribute(marker, 'true');
      script.addEventListener('load', () => {
        script.dataset.loaded = 'true';
        onload?.();
      }, { once: true });
      documentRef.head?.append(script);
      return script;
    }

    loadScript('src/presentation/stage-engine.js?v=stage-engine-2', 'data-stage-engine-script', () => {
      loadScript('src/presentation/stage-runtime.js?v=stage-runtime-2', 'data-stage-runtime-script');
      documentRef.documentElement.dataset.stageResources = 'ready';
    });
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function brandControllerFactory() {
  'use strict';

  const O_TOKENS = Object.freeze(['intruder', 'portal', 'eye', 'donut', 'coin', 'eclipse', 'disco']);
  const O_TOKEN_LABELS = Object.freeze({
    intruder: 'unauthorized letter',
    portal: 'portal eye',
    eye: 'witness eye',
    donut: 'donut',
    coin: 'counterfeit coin',
    eclipse: 'eclipse',
    disco: 'disco signal',
  });

  function prepareWordmark(mark) {
    const before = mark?.querySelector?.('.brand-base-before');
    const after = mark?.querySelector?.('.brand-base-after');
    if (!before || before.dataset.brandStructured === 'true') return mark;

    const source = String(before.textContent || '').trim();
    if (source.toUpperCase() !== 'JEOPAR') return mark;

    before.textContent = '';
    before.dataset.brandStructured = 'true';

    const heritage = mark.ownerDocument.createElement('span');
    heritage.className = 'brand-heritage';
    heritage.textContent = 'jeo';

    const parodyLead = mark.ownerDocument.createElement('span');
    parodyLead.className = 'brand-parody brand-parody-before';
    parodyLead.textContent = 'PAR';

    before.append(heritage, parodyLead);
    after?.classList?.add('brand-parody', 'brand-parody-after');
    mark.dataset.brandGrammar = 'jeo-parody';
    return mark;
  }

  class BrandController {
    constructor({
      documentRef = globalThis.document,
      locationRef = globalThis.location,
      now = () => Date.now(),
      tokens = O_TOKENS,
    } = {}) {
      this.document = documentRef;
      this.location = locationRef;
      this.now = now;
      this.tokens = [...tokens];
      this.index = 0;
      this.secretActivations = [];
    }

    bind() {
      const marks = Array.from(this.document?.querySelectorAll?.('[data-brand-mark]') || []);
      marks.forEach((mark) => {
        prepareWordmark(mark);
        const trigger = mark.querySelector?.('[data-brand-o]');
        trigger?.addEventListener?.('click', () => this.activate());
        trigger?.addEventListener?.('keydown', (event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            this.activate();
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

    activate() {
      const token = this.cycle();
      this.registerSecretActivation();
      return token;
    }

    registerSecretActivation() {
      if (!this.isLocalPreview()) return false;
      const currentTime = this.now();
      this.secretActivations = this.secretActivations
        .filter((time) => currentTime - time <= 4500);
      this.secretActivations.push(currentTime);
      if (this.secretActivations.length < 7) return false;
      this.secretActivations = [];
      this.location?.assign?.('creative-room.html');
      return true;
    }

    isLocalPreview() {
      const hostname = String(this.location?.hostname || '').toLowerCase();
      const local = this.location?.protocol === 'file:'
        || hostname === 'localhost'
        || hostname === '127.0.0.1'
        || hostname === '[::1]';
      return local && this.document?.body?.dataset?.releaseChannel !== 'production';
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
      const tokenLabel = O_TOKEN_LABELS[token] || token;
      this.document?.querySelectorAll?.('[data-brand-o], [data-brand-o-display]')?.forEach?.((element) => {
        element.dataset.oToken = token;
        if (element.hasAttribute?.('data-brand-o')) {
          element.setAttribute?.(
            'aria-label',
            `The O in PARODY is dressed as a ${tokenLabel}. Activate to change it.`,
          );
          element.setAttribute?.(
            'title',
            `The O in PARODY is the ${tokenLabel}. Activate to change it.`,
          );
        }
      });
    }
  }

  return {
    BrandController,
    O_TOKENS,
    O_TOKEN_LABELS,
    prepareWordmark,
  };
}));
