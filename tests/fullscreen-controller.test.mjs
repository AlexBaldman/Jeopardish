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
  assert.equal(buttons[0].attributes['aria-label'], 'Exit expanded view');
  assert.deepEqual(scrollCalls, [[0, 0]]);

  await controller.toggle();
  assert.equal(documentRef.body.dataset.immersive, 'false');
  assert.equal(buttons[1].attributes['aria-label'], 'Expand game');
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

test('native fullscreen follows browser exit events and preserves the receiver', async () => {
  const target = { dataset: {} };
  const button = createButton();
  const documentRef = createDocument(target, [button]);
  target.requestFullscreen = async function request(options) {
    assert.equal(this, target);
    assert.equal(options.navigationUI, 'hide');
    documentRef.fullscreenElement = target;
  };
  documentRef.exitFullscreen = async () => { documentRef.fullscreenElement = null; };
  const controller = new fullscreenModule.FullscreenController({ documentRef, target });
  controller.start();
  await controller.toggle();
  assert.equal(target.dataset.fullscreenMode, 'native');
  assert.equal(button.attributes['aria-label'], 'Exit fullscreen');
  documentRef.fullscreenElement = null;
  documentRef.listeners.fullscreenchange();
  assert.equal(target.dataset.immersive, 'false');
  assert.equal(button.attributes['aria-pressed'], 'false');
});

test('unavailable or silently ignored APIs expand the game and Escape restores the scroll position', async () => {
  for (const enabled of [false, true]) {
    let calls = 0;
    const target = { dataset: {}, requestFullscreen: async () => { calls += 1; } };
    const button = createButton();
    const documentRef = createDocument(target, [button]);
    documentRef.fullscreenEnabled = enabled;
    const scrollCalls = [];
    const controller = new fullscreenModule.FullscreenController({
      documentRef, target,
      windowRef: { scrollX: 0, scrollY: 125, scrollTo: (...args) => scrollCalls.push(args) },
    });
    controller.start();
    await controller.toggle();
    assert.equal(calls, enabled ? 1 : 0);
    assert.equal(target.dataset.fullscreenMode, 'expanded');
    assert.equal(button.attributes['aria-label'], 'Exit expanded view');
    documentRef.listeners.keydown({ key: 'Escape' });
    assert.equal(target.dataset.immersive, 'false');
    assert.deepEqual(scrollCalls, [[0, 0], [0, 125]]);
  }
});

test('prefixed WebKit requests receive no unsupported options', async () => {
  const target = { dataset: {} };
  const documentRef = createDocument(target, [createButton()]);
  target.webkitRequestFullscreen = function request(...args) {
    assert.equal(args.length, 0);
    documentRef.webkitFullscreenElement = target;
  };
  const controller = new fullscreenModule.FullscreenController({ documentRef, target });
  controller.start();
  await controller.toggle();
  assert.equal(controller.fallbackActive, false);
  assert.equal(target.dataset.fullscreenMode, 'native');
});

test('rapid toggles do not issue overlapping native requests', async () => {
  let finish;
  let calls = 0;
  const target = { dataset: {}, requestFullscreen: () => { calls += 1; return new Promise(resolve => { finish = resolve; }); } };
  const button = createButton();
  const documentRef = createDocument(target, [button]);
  const controller = new fullscreenModule.FullscreenController({ documentRef, target, windowRef: {} });
  controller.start();
  const entering = controller.toggle();
  assert.equal(button.disabled, true);
  assert.equal(await controller.toggle(), false);
  assert.equal(calls, 1);
  documentRef.fullscreenElement = target;
  finish();
  await entering;
  assert.equal(button.disabled, false);
});
