import assert from 'node:assert/strict';
import test from 'node:test';
import fullscreenModule from '../src/ui/fullscreen-controller.js';

function createButton() {
  return {
    attributes: {},
    dataset: {},
    listeners: {},
    addEventListener(type, listener) {
      this.listeners[type] = listener;
    },
    removeEventListener(type) {
      delete this.listeners[type];
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
  };
}

function createDocument(target, buttons) {
  return {
    body: { dataset: {} },
    listeners: {},
    fullscreenElement: null,
    getElementById(id) {
      return id === 'gameContainer' ? target : null;
    },
    querySelectorAll() {
      return buttons;
    },
    addEventListener(type, listener) {
      this.listeners[type] = listener;
    },
    removeEventListener(type) {
      delete this.listeners[type];
    },
  };
}

test('fullscreen controller provides an immersive fallback and restores the page', async () => {
  const target = { dataset: {} };
  const buttons = [createButton(), createButton()];
  const documentRef = createDocument(target, buttons);
  const scrollCalls = [];
  const controller = new fullscreenModule.FullscreenController({
    documentRef,
    windowRef: { scrollTo: (...args) => scrollCalls.push(args) },
    target,
  });

  assert.equal(controller.start(), true);
  assert.equal(buttons[0].attributes['aria-pressed'], 'false');

  await controller.toggle();
  assert.equal(documentRef.body.dataset.immersive, 'true');
  assert.equal(target.dataset.immersive, 'true');
  assert.equal(buttons[0].attributes['aria-label'], 'Exit fullscreen');
  assert.deepEqual(scrollCalls, [[0, 0]]);

  await controller.toggle();
  assert.equal(documentRef.body.dataset.immersive, 'false');
  assert.equal(buttons[1].attributes['aria-label'], 'Enter fullscreen');
  assert.equal(controller.destroy(), true);
});

test('fullscreen controller falls back when a browser declines element fullscreen', async () => {
  const target = {
    dataset: {},
    requestFullscreen: async () => {
      throw new Error('not allowed');
    },
  };
  const documentRef = createDocument(target, [createButton()]);
  const controller = new fullscreenModule.FullscreenController({
    documentRef,
    windowRef: { scrollTo() {} },
    target,
  });

  controller.start();
  assert.equal(await controller.enter(), true);
  assert.equal(controller.isActive(), true);
  assert.equal(target.dataset.immersive, 'true');
});
