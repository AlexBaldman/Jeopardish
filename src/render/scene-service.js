(function initSceneService(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    root.JeopardishSceneService = factory(root);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function sceneServiceFactory(root) {
  'use strict';

  const BEACH_BROADCAST_SCENES = Object.freeze({
    light: {
      id: 'beach-day',
      label: 'Daytime Beach Broadcast',
      basePath: 'assets/scenes/beach-day/',
      layers: [
        { id: 'illustration', src: 'beach-seek-and-find-v1.png', depth: 0.04, drift: 8 },
      ],
    },
    dark: {
      id: 'beach-night',
      label: 'Solarized Night Beach Broadcast',
      basePath: 'assets/scenes/beach-night/',
      layers: [
        { id: 'illustration', src: 'beach-seek-and-find-v1.png', depth: 0.04, drift: 8 },
      ],
    },
  });

  const LONG_BEACH_SCENES = Object.freeze({
    light: {
      id: 'long-beach-day',
      label: 'Long Beach West End Sunset',
      basePath: 'assets/scenes/long-beach-day/',
      layers: [
        { id: 'illustration', src: 'long-beach-west-sunset-v2.png', depth: 0.04, drift: 8 },
      ],
    },
    dark: {
      id: 'long-beach-night',
      label: 'Long Beach West End Blue Hour',
      basePath: 'assets/scenes/long-beach-night/',
      layers: [
        { id: 'illustration', src: 'long-beach-west-blue-hour-v2.png', depth: 0.04, drift: 8 },
      ],
    },
  });

  const LONG_BEACH_96_SCENES = Object.freeze({
    light: {
      id: 'long-beach-96-day',
      label: "Long Beach '96 Sunset Stories",
      basePath: 'assets/scenes/long-beach-96-day/',
      layers: [
        { id: 'illustration', src: 'long-beach-96-sunset-v1.png', depth: 0.04, drift: 8 },
      ],
    },
    dark: {
      id: 'long-beach-96-night',
      label: "Long Beach '96 Afterglow Stories",
      basePath: 'assets/scenes/long-beach-96-night/',
      layers: [
        { id: 'illustration', src: 'long-beach-96-blue-hour-v1.png', depth: 0.04, drift: 8 },
      ],
    },
  });

  const WEST_END_FIELD_DAY_SCENES = Object.freeze({
    light: {
      id: 'west-end-field-day',
      label: 'West End Field Day',
      basePath: 'assets/scenes/west-end-field-day/',
      layers: [
        { id: 'illustration', src: 'west-end-field-day-v1.jpg', depth: 0.04, drift: 8 },
      ],
    },
    dark: {
      id: 'west-end-field-night',
      label: 'West End Field Night',
      basePath: 'assets/scenes/west-end-field-day/',
      layers: [
        { id: 'illustration', src: 'west-end-field-night-v1.jpg', depth: 0.04, drift: 8 },
      ],
    },
  });

  const DEFAULT_SCENE_PACKS = Object.freeze([
    Object.freeze({
      id: 'long-beach-96',
      label: "Long Beach '96",
      scenes: LONG_BEACH_96_SCENES,
    }),
    Object.freeze({
      id: 'long-beach-boardwalk',
      label: 'Long Beach West End',
      scenes: LONG_BEACH_SCENES,
    }),
    Object.freeze({
      id: 'beach-broadcast',
      label: 'Beach Broadcast',
      scenes: BEACH_BROADCAST_SCENES,
    }),
    Object.freeze({
      id: 'west-end-field-day',
      label: 'West End Field Day',
      scenes: WEST_END_FIELD_DAY_SCENES,
    }),
  ]);
  const DEFAULT_SCENES = LONG_BEACH_96_SCENES;

  function normalizeSceneKey(theme) {
    return theme === 'light' ? 'light' : 'dark';
  }

  function getLayerSource(scene, layer) {
    if (!layer?.src) return '';
    if (/^(?:https?:)?\/\//i.test(layer.src) || layer.src.startsWith('/') || layer.src.startsWith('data:')) {
      return layer.src;
    }
    return `${scene.basePath || ''}${layer.src}`;
  }

  class SceneService {
    constructor({
      documentRef = root.document,
      windowRef = root,
      scenes = DEFAULT_SCENES,
      scenePacks = null,
      activePackId = '',
    } = {}) {
      this.document = documentRef;
      this.window = windowRef;
      this.scenes = scenes;
      this.scenePacks = scenePacks || (scenes === DEFAULT_SCENES
        ? DEFAULT_SCENE_PACKS
        : [{ id: 'custom', label: 'Custom Scene', scenes }]);
      this.activePackId = this.scenePacks.some((pack) => pack.id === activePackId)
        ? activePackId
        : this.scenePacks[0]?.id || '';
      this.activeTheme = 'dark';
      this.stage = null;
      this.activeSceneId = '';
      this.reduceMotion = false;
      this.pointerListener = null;
      this.resetPointerListener = null;
    }

    bindDom(stage = this.document?.getElementById?.('sceneStage')) {
      this.stage = stage || null;
      this.reduceMotion = Boolean(this.window?.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);
      this.bindPointer();
      return this;
    }

    bindPointer() {
      if (!this.stage || this.reduceMotion || this.pointerListener) {
        return;
      }

      this.pointerListener = (event) => {
        const rect = this.stage.getBoundingClientRect?.();
        const width = rect?.width || this.window?.innerWidth || 1;
        const height = rect?.height || this.window?.innerHeight || 1;
        const originX = rect?.left || 0;
        const originY = rect?.top || 0;
        const x = ((event.clientX || 0) - originX) / width - 0.5;
        const y = ((event.clientY || 0) - originY) / height - 0.5;
        this.stage.style.setProperty('--scene-x', x.toFixed(3));
        this.stage.style.setProperty('--scene-y', y.toFixed(3));
      };
      this.resetPointerListener = () => {
        this.stage?.style?.setProperty('--scene-x', '0');
        this.stage?.style?.setProperty('--scene-y', '0');
      };

      this.window?.addEventListener?.('pointermove', this.pointerListener);
      this.window?.addEventListener?.('pointerleave', this.resetPointerListener);
    }

    destroy() {
      if (this.pointerListener) {
        this.window?.removeEventListener?.('pointermove', this.pointerListener);
      }
      if (this.resetPointerListener) {
        this.window?.removeEventListener?.('pointerleave', this.resetPointerListener);
      }
      this.pointerListener = null;
      this.resetPointerListener = null;
      this.stage = null;
      return true;
    }

    setTheme(theme) {
      const key = normalizeSceneKey(theme);
      this.activeTheme = key;
      const scenes = this.getActivePack()?.scenes || this.scenes;
      return this.renderScene(scenes[key] || scenes.dark);
    }

    getPacks() {
      return this.scenePacks;
    }

    getActivePack() {
      return this.scenePacks.find((pack) => pack.id === this.activePackId) || this.scenePacks[0] || null;
    }

    setPack(packId, { render = true } = {}) {
      const pack = this.scenePacks.find((candidate) => candidate.id === packId) || this.getActivePack();
      if (!pack) return null;
      if (pack.id !== this.activePackId || !this.activeSceneId) {
        this.activePackId = pack.id;
        this.scenes = pack.scenes;
        this.activeSceneId = '';
        if (render) this.setTheme(this.activeTheme);
      }
      return pack;
    }

    cyclePack(step = 1) {
      if (this.scenePacks.length === 0) return null;
      const currentIndex = Math.max(0, this.scenePacks.findIndex((pack) => pack.id === this.activePackId));
      const nextIndex = (currentIndex + step + this.scenePacks.length) % this.scenePacks.length;
      return this.setPack(this.scenePacks[nextIndex].id);
    }

    renderScene(scene) {
      if (!this.stage || !scene || scene.id === this.activeSceneId) {
        return scene;
      }

      const layers = Array.isArray(scene.layers) ? scene.layers : [];
      const fragment = this.document.createDocumentFragment?.();
      const nodes = layers.map((layer, index) => this.createLayer(scene, layer, index));

      if (fragment) {
        nodes.forEach((node) => fragment.append?.(node));
        this.stage.replaceChildren?.(fragment);
      } else {
        this.stage.replaceChildren?.(...nodes);
      }

      this.activeSceneId = scene.id;
      this.stage.dataset.scene = scene.id;
      this.stage.setAttribute?.('aria-label', scene.label || scene.id);
      return scene;
    }

    createLayer(scene, layer, index) {
      const image = this.document.createElement('img');
      image.className = `scene-layer scene-layer-${layer.id || index}`;
      image.src = getLayerSource(scene, layer);
      image.alt = '';
      image.decoding = 'async';
      image.loading = index === 0 ? 'eager' : 'lazy';
      image.setAttribute?.('aria-hidden', 'true');
      image.style?.setProperty('--scene-depth', String(Number(layer.depth) || 0));
      image.style?.setProperty('--scene-drift', `${Number(layer.drift) || 0}px`);
      image.dataset.layer = layer.id || String(index);
      return image;
    }
  }

  return {
    BEACH_BROADCAST_SCENES,
    DEFAULT_SCENES,
    DEFAULT_SCENE_PACKS,
    LONG_BEACH_SCENES,
    SceneService,
    WEST_END_FIELD_DAY_SCENES,
    getLayerSource,
    normalizeSceneKey,
  };
}));
