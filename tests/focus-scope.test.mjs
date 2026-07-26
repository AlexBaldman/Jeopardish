import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { FocusScope } = require('../src/ui/focus-scope.js');

function createElement(id) {
  return {
    id,
    hidden: false,
    attributes: {},
    focused: false,
    focus() {
      this.focused = true;
      this.ownerDocument.activeElement = this;
    },
    getAttribute(name) {
      return this.attributes[name];
    },
    closest() {
      return null;
    },
  };
}

function createFixture() {
  const listeners = {};
  const documentRef = {
    activeElement: null,
    addEventListener(type, listener) {
      listeners[type] = listener;
    },
    removeEventListener(type, listener) {
      if (listeners[type] === listener) delete listeners[type];
    },
  };
  const first = createElement('first');
  const last = createElement('last');
  const trigger = createElement('trigger');
  [first, last, trigger].forEach((element) => {
    element.ownerDocument = documentRef;
  });
  const container = createElement('container');
  container.ownerDocument = documentRef;
  container.querySelectorAll = () => [first, last];
  container.contains = (element) => element === first || element === last;
  return { container, documentRef, first, last, listeners, trigger };
}

test('FocusScope traps tab navigation and restores the trigger', () => {
  const fixture = createFixture();
  const scope = new FocusScope({ documentRef: fixture.documentRef });
  scope.activate(fixture.container, {
    initialFocus: fixture.first,
    returnFocus: fixture.trigger,
  });

  let prevented = false;
  fixture.documentRef.activeElement = fixture.last;
  fixture.listeners.keydown({
    key: 'Tab',
    shiftKey: false,
    preventDefault: () => { prevented = true; },
  });

  assert.equal(prevented, true);
  assert.equal(fixture.documentRef.activeElement, fixture.first);
  assert.equal(scope.deactivate(fixture.container), true);
  assert.equal(fixture.trigger.focused, true);
  assert.equal(fixture.listeners.keydown, undefined);
});

test('FocusScope delegates Escape and ignores a different container on teardown', () => {
  const fixture = createFixture();
  const scope = new FocusScope({ documentRef: fixture.documentRef });
  let escaped = 0;
  scope.activate(fixture.container, {
    onEscape: () => { escaped += 1; },
  });

  fixture.listeners.keydown({ key: 'Escape', preventDefault() {} });

  assert.equal(escaped, 1);
  assert.equal(scope.deactivate(createElement('other')), false);
  assert.equal(scope.active.container, fixture.container);
});
