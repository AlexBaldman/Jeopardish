(function initStageEngine(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYStageEngine = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function stageEngineFactory() {
  'use strict';

  const StageLayouts = Object.freeze({
    DESKTOP_WIDE: 'desktopWide',
    DESKTOP_COMPACT: 'desktopCompact',
    TABLET: 'tablet',
    MOBILE_PORTRAIT: 'mobilePortrait',
    MOBILE_IMMERSIVE: 'mobileImmersive',
    MOBILE_LANDSCAPE: 'mobileLandscape',
  });

  const StageZones = Object.freeze({
    UPSTAGE_LEFT: 'upstage-left',
    UPSTAGE_CENTER: 'upstage-center',
    UPSTAGE_RIGHT: 'upstage-right',
    CENTER_LEFT: 'center-left',
    CENTER: 'center',
    CENTER_RIGHT: 'center-right',
    DOWNSTAGE_LEFT: 'downstage-left',
    DOWNSTAGE_CENTER: 'downstage-center',
    DOWNSTAGE_RIGHT: 'downstage-right',
  });

  const CameraShots = Object.freeze({
    WIDE: 'wide',
    MEDIUM: 'medium',
    CLOSE_UP: 'close-up',
    EXTREME_CLOSE_UP: 'extreme-close-up',
    PEEK: 'peek',
    OFFSCREEN: 'offscreen',
  });

  const LightingModes = Object.freeze({
    DAY: 'day',
    NIGHT: 'night',
    BLACKLIGHT: 'blacklight',
  });

  const MotionDurations = Object.freeze({
    instant: 0,
    fast: 160,
    normal: 320,
    dramatic: 650,
  });

  const DefaultControlSkins = Object.freeze({
    theme: Object.freeze({ id: 'bulb', label: 'Pull-chain bulb', states: ['day', 'night'] }),
    sound: Object.freeze({ id: 'speaker', label: 'Speaker stack', states: ['on', 'off'] }),
    voice: Object.freeze({ id: 'microphone', label: 'Broadcast microphone', states: ['on', 'off'] }),
    immersive: Object.freeze({ id: 'viewport', label: 'Stage expander', states: ['on', 'off'] }),
  });

  function freeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(freeze);
    return Object.freeze(value);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value) || 0));
  }

  function resolveStageLayout({
    width = 0,
    height = 0,
    immersive = false,
  } = {}) {
    const w = Number(width) || 0;
    const h = Number(height) || 0;
    const landscape = w > h;

    if (w <= 767 && landscape) return StageLayouts.MOBILE_LANDSCAPE;
    if (w <= 480 && immersive) return StageLayouts.MOBILE_IMMERSIVE;
    if (w <= 480) return StageLayouts.MOBILE_PORTRAIT;
    if (w <= 900) return StageLayouts.TABLET;
    if (w <= 1280) return StageLayouts.DESKTOP_COMPACT;
    return StageLayouts.DESKTOP_WIDE;
  }

  function normalizeShot(shot) {
    return Object.values(CameraShots).includes(shot) ? shot : CameraShots.WIDE;
  }

  function normalizeLighting(mode) {
    return Object.values(LightingModes).includes(mode) ? mode : LightingModes.NIGHT;
  }

  function createSkinRegistry(seed = {}) {
    const registry = new Map();

    function register(controlType, skin) {
      const type = String(controlType || '').trim();
      const id = String(skin?.id || '').trim();
      if (!type || !id) throw new Error('A skin requires a control type and id.');
      if (!registry.has(type)) registry.set(type, new Map());
      const normalized = freeze({ ...skin, id });
      registry.get(type).set(id, normalized);
      return normalized;
    }

    function get(controlType, skinId) {
      return registry.get(controlType)?.get(skinId) || null;
    }

    function list(controlType) {
      return Object.freeze([...(registry.get(controlType)?.values() || [])]);
    }

    Object.entries(seed).forEach(([controlType, skinOrSkins]) => {
      const skins = Array.isArray(skinOrSkins) ? skinOrSkins : [skinOrSkins];
      skins.filter(Boolean).forEach((skin) => register(controlType, skin));
    });

    return Object.freeze({ register, get, list });
  }

  function createPropRegistry() {
    const props = new Map();

    function register(id, { element = null, anchors = {}, kind = 'prop' } = {}) {
      const key = String(id || '').trim();
      if (!key) throw new Error('A stage prop requires an id.');
      const prop = { id: key, element, anchors: { ...anchors }, kind };
      props.set(key, prop);
      return prop;
    }

    function get(id) {
      return props.get(id) || null;
    }

    function unregister(id) {
      return props.delete(id);
    }

    function list() {
      return Object.freeze([...props.values()]);
    }

    return Object.freeze({ register, get, unregister, list });
  }

  class StageEngine {
    constructor({
      windowRef = typeof window !== 'undefined' ? window : null,
      documentRef = typeof document !== 'undefined' ? document : null,
      rootElement = null,
      skinRegistry = createSkinRegistry(DefaultControlSkins),
    } = {}) {
      this.window = windowRef;
      this.document = documentRef;
      this.rootElement = rootElement;
      this.skinRegistry = skinRegistry;
      this.props = createPropRegistry();
      this.listeners = new Set();
      this.resizeListener = null;
      this.fullscreenListener = null;
      this.state = {
        layout: StageLayouts.DESKTOP_WIDE,
        immersive: false,
        nativeFullscreen: false,
        camera: { shot: CameraShots.WIDE, target: 'stage', intensity: 1 },
        lighting: { mode: LightingModes.NIGHT, intensity: 1 },
        scene: 'clue',
        lastCue: null,
      };
    }

    bind(rootElement = this.rootElement || this.document?.getElementById?.('gameContainer')) {
      this.rootElement = rootElement || null;
      if (!this.rootElement) return this;
      this.rootElement.dataset.stageEngine = 'ready';
      this.syncViewport();
      this.syncDom();

      if (!this.resizeListener) {
        this.resizeListener = () => this.syncViewport();
        this.window?.addEventListener?.('resize', this.resizeListener, { passive: true });
        this.window?.addEventListener?.('orientationchange', this.resizeListener, { passive: true });
      }

      if (!this.fullscreenListener) {
        this.fullscreenListener = () => {
          this.state.nativeFullscreen = Boolean(this.document?.fullscreenElement);
          if (!this.state.nativeFullscreen && this.state.immersive) this.syncDom();
          this.emit();
        };
        this.document?.addEventListener?.('fullscreenchange', this.fullscreenListener);
      }
      return this;
    }

    destroy() {
      if (this.resizeListener) {
        this.window?.removeEventListener?.('resize', this.resizeListener);
        this.window?.removeEventListener?.('orientationchange', this.resizeListener);
      }
      if (this.fullscreenListener) {
        this.document?.removeEventListener?.('fullscreenchange', this.fullscreenListener);
      }
      this.resizeListener = null;
      this.fullscreenListener = null;
      this.listeners.clear();
      return true;
    }

    getState() {
      return freeze(JSON.parse(JSON.stringify(this.state)));
    }

    subscribe(listener) {
      if (typeof listener !== 'function') return () => {};
      this.listeners.add(listener);
      listener(this.getState());
      return () => this.listeners.delete(listener);
    }

    emit() {
      const snapshot = this.getState();
      this.listeners.forEach((listener) => listener(snapshot));
      return snapshot;
    }

    syncViewport() {
      const width = this.rootElement?.clientWidth || this.window?.innerWidth || 0;
      const height = this.rootElement?.clientHeight || this.window?.innerHeight || 0;
      const layout = resolveStageLayout({ width, height, immersive: this.state.immersive });
      if (layout !== this.state.layout) this.state.layout = layout;
      this.syncDom();
      return this.emit();
    }

    syncDom() {
      if (!this.rootElement) return;
      this.rootElement.dataset.stageLayout = this.state.layout;
      this.rootElement.dataset.immersive = this.state.immersive ? 'true' : 'false';
      this.rootElement.dataset.cameraShot = this.state.camera.shot;
      this.rootElement.dataset.cameraTarget = this.state.camera.target;
      this.rootElement.dataset.lighting = this.state.lighting.mode;
      this.rootElement.dataset.stageScene = this.state.scene;
      this.rootElement.style?.setProperty('--stage-camera-intensity', String(this.state.camera.intensity));
      this.rootElement.style?.setProperty('--stage-light-intensity', String(this.state.lighting.intensity));
      this.document?.body?.classList?.toggle('jeoparody-immersive', this.state.immersive);
    }

    setScene(scene) {
      this.state.scene = String(scene || 'clue');
      this.syncDom();
      return this.emit();
    }

    setCamera(shot, { target = 'stage', intensity = 1 } = {}) {
      this.state.camera = {
        shot: normalizeShot(shot),
        target: String(target || 'stage'),
        intensity: clamp(intensity, 0, 2),
      };
      this.syncDom();
      return this.emit();
    }

    setLighting(mode, { intensity = 1 } = {}) {
      this.state.lighting = {
        mode: normalizeLighting(mode),
        intensity: clamp(intensity, 0, 2),
      };
      this.syncDom();
      return this.emit();
    }

    cue(type, payload = {}) {
      const cue = freeze({
        type: String(type || 'idle'),
        payload: { ...payload },
        timestamp: Date.now(),
      });
      this.state.lastCue = cue;
      if (payload.scene) this.state.scene = String(payload.scene);
      if (payload.camera?.shot) this.setCamera(payload.camera.shot, payload.camera);
      if (payload.lighting?.mode) this.setLighting(payload.lighting.mode, payload.lighting);
      this.syncDom();
      return this.emit();
    }

    setImmersive(enabled) {
      this.state.immersive = Boolean(enabled);
      this.syncViewport();
      return this.state.immersive;
    }

    async toggleFullscreen({ preferNative = true } = {}) {
      const currentlyNative = Boolean(this.document?.fullscreenElement);
      if (currentlyNative) {
        await this.document.exitFullscreen?.();
        this.setImmersive(false);
        return false;
      }

      this.setImmersive(!this.state.immersive);
      if (this.state.immersive && preferNative && this.rootElement?.requestFullscreen) {
        try {
          await this.rootElement.requestFullscreen({ navigationUI: 'hide' });
          this.state.nativeFullscreen = Boolean(this.document?.fullscreenElement);
        } catch (error) {
          this.state.nativeFullscreen = false;
        }
      }
      this.syncDom();
      this.emit();
      return this.state.immersive;
    }
  }

  return {
    CameraShots,
    DefaultControlSkins,
    LightingModes,
    MotionDurations,
    StageEngine,
    StageLayouts,
    StageZones,
    createPropRegistry,
    createSkinRegistry,
    resolveStageLayout,
  };
}));
