(function initStageEngine(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYStageEngine = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function stageEngineFactory() {
  'use strict';

  const STAGE_CUE_SCHEMA = 'jeoparody.stage-cue';
  const STAGE_CUE_VERSION = 1;

  const StageScenes = Object.freeze({
    INTRO: 'INTRO',
    CLUE: 'CLUE',
    CORRECT: 'CORRECT',
    WRONG: 'WRONG',
    ROUND_TRANSITION: 'ROUND_TRANSITION',
    WINNER: 'WINNER',
  });

  const CameraShots = Object.freeze({
    WIDE: 'wide',
    MEDIUM: 'medium',
    CLOSE_UP: 'close-up',
  });

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function safeToken(value, fallback = '') {
    const token = String(value || '').trim();
    return /^[a-zA-Z0-9_-]{1,80}$/.test(token) ? token : fallback;
  }

  function normalizeCue(cue = {}) {
    if (cue.schema !== STAGE_CUE_SCHEMA || cue.version !== STAGE_CUE_VERSION) {
      throw new Error('StageEngine requires a versioned stage cue.');
    }
    const scene = Object.values(StageScenes).includes(cue.scene)
      ? cue.scene
      : StageScenes.CLUE;
    const shot = Object.values(CameraShots).includes(cue.camera?.shot)
      ? cue.camera.shot
      : CameraShots.WIDE;
    return deepFreeze({
      ...cue,
      scene,
      camera: {
        shot,
        target: safeToken(cue.camera?.target, 'stage'),
      },
    });
  }

  class StageEngine {
    constructor({
      documentRef = typeof document !== 'undefined' ? document : null,
      rootElement = null,
    } = {}) {
      this.document = documentRef;
      this.rootElement = rootElement;
      this.listeners = new Set();
      this.state = {
        scene: StageScenes.INTRO,
        camera: { shot: CameraShots.WIDE, target: 'stage' },
        host: null,
        cue: null,
      };
    }

    bind(rootElement = this.rootElement || this.document?.getElementById?.('gameContainer')) {
      this.rootElement = rootElement || null;
      this.syncDom();
      return this;
    }

    present(cue) {
      const normalized = normalizeCue(cue);
      this.state = {
        ...this.state,
        scene: normalized.scene,
        camera: normalized.camera,
        cue: normalized,
      };
      this.syncDom();
      return this.emit();
    }

    presentHost(performance = {}) {
      this.state = {
        ...this.state,
        host: deepFreeze({
          beat: safeToken(performance.beat, 'idle'),
          expression: safeToken(performance.expression, 'idle'),
          packId: safeToken(performance.packId),
        }),
      };
      this.syncDom();
      return this.emit();
    }

    getState() {
      return deepFreeze({
        scene: this.state.scene,
        camera: { ...this.state.camera },
        host: this.state.host ? { ...this.state.host } : null,
        cue: this.state.cue,
      });
    }

    subscribe(listener) {
      if (typeof listener !== 'function') return () => {};
      this.listeners.add(listener);
      return () => this.listeners.delete(listener);
    }

    emit() {
      const snapshot = this.getState();
      this.listeners.forEach((listener) => listener(snapshot));
      return snapshot;
    }

    syncDom() {
      if (!this.rootElement?.dataset) return false;
      this.rootElement.dataset.stageRuntime = 'ready';
      this.rootElement.dataset.stageScene = this.state.scene.toLowerCase();
      this.rootElement.dataset.cameraShot = this.state.camera.shot;
      this.rootElement.dataset.cameraTarget = this.state.camera.target;
      if (this.state.host) {
        this.rootElement.dataset.hostBeat = this.state.host.beat;
        this.rootElement.dataset.hostExpression = this.state.host.expression;
      }
      return true;
    }

    destroy() {
      this.listeners.clear();
      return true;
    }
  }

  return {
    CameraShots,
    STAGE_CUE_SCHEMA,
    STAGE_CUE_VERSION,
    StageEngine,
    StageScenes,
    normalizeCue,
  };
}));
