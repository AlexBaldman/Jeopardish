import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  DEFAULT_SCENES,
  SceneService,
  getLayerSource,
  normalizeSceneKey,
} = require('../src/render/scene-service.js');

function createFakeElement(tagName) {
  return {
    tagName,
    className: '',
    src: '',
    alt: '',
    decoding: '',
    loading: '',
    dataset: {},
    attributes: {},
    children: [],
    listeners: {},
    style: {
      values: {},
      setProperty(name, value) {
        this.values[name] = value;
      },
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    addEventListener(type, listener) {
      this.listeners[type] = listener;
    },
    append(child) {
      this.children.push(child);
    },
    replaceChildren(...children) {
      this.children = children.flatMap((child) => child.children || child);
    },
    getBoundingClientRect() {
      return {
        left: 0,
        top: 0,
        width: 1000,
        height: 500,
      };
    },
  };
}

function createFakeDocument(stage) {
  return {
    getElementById(id) {
      return id === 'sceneStage' ? stage : null;
    },
    createElement(tagName) {
      return createFakeElement(tagName);
    },
    createDocumentFragment() {
      return createFakeElement('fragment');
    },
  };
}

function createFakeWindow() {
  return {
    listeners: {},
    innerWidth: 1000,
    innerHeight: 500,
    addEventListener(type, listener) {
      this.listeners[type] = listener;
    },
    matchMedia() {
      return { matches: false };
    },
  };
}

test('SceneService renders the light scene as ordered image layers', () => {
  const stage = createFakeElement('div');
  const documentRef = createFakeDocument(stage);
  const windowRef = createFakeWindow();
  const service = new SceneService({ documentRef, windowRef }).bindDom();

  const scene = service.setTheme('light');

  assert.equal(scene.id, DEFAULT_SCENES.light.id);
  assert.equal(stage.dataset.scene, 'beach-day');
  assert.equal(stage.children.length, 4);
  assert.equal(stage.children[0].className, 'scene-layer scene-layer-sky');
  assert.equal(stage.children[0].src, 'assets/scenes/beach-day/sky.svg');
  assert.equal(stage.children[3].dataset.layer, 'gags');
  assert.equal(stage.attributes['aria-label'], 'Daytime Beach Broadcast');
});

test('SceneService switches to dark scene and updates pointer parallax variables', () => {
  const stage = createFakeElement('div');
  const documentRef = createFakeDocument(stage);
  const windowRef = createFakeWindow();
  const service = new SceneService({ documentRef, windowRef }).bindDom();

  service.setTheme('dark');
  windowRef.listeners.pointermove({ clientX: 750, clientY: 125 });

  assert.equal(stage.dataset.scene, 'beach-night');
  assert.equal(stage.children[0].src, 'assets/scenes/beach-night/sky.svg');
  assert.equal(stage.style.values['--scene-x'], '0.250');
  assert.equal(stage.style.values['--scene-y'], '-0.250');
});

test('SceneService helpers normalize theme keys and layer sources', () => {
  assert.equal(normalizeSceneKey('light'), 'light');
  assert.equal(normalizeSceneKey('weird'), 'dark');
  assert.equal(
    getLayerSource(DEFAULT_SCENES.dark, { src: 'gags.svg' }),
    'assets/scenes/beach-night/gags.svg',
  );
  assert.equal(
    getLayerSource(DEFAULT_SCENES.dark, { src: 'https://example.test/layer.svg' }),
    'https://example.test/layer.svg',
  );
});
