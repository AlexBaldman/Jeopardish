import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { DefaultHost, HostManager } = require('../src/host/host-manager.js');

test('HostManager exposes the default host', () => {
  const hostManager = new HostManager();

  assert.equal(hostManager.getActiveHost().id, DefaultHost.id);
  assert.equal(hostManager.getVisual('neutral'), 'assets/images/trebek-vector.png');
});

test('HostManager falls back to neutral visual for unknown expression', () => {
  const hostManager = new HostManager();

  assert.equal(hostManager.getVisual('mysterious'), DefaultHost.visuals.neutral);
});

test('HostManager can register and activate another host', () => {
  const hostManager = new HostManager();
  hostManager.register({
    id: 'robot-norm',
    displayName: 'Robot Norm',
    visuals: {
      neutral: 'robot.png',
    },
    quips: {
      idle: ['Hello.'],
    },
  });

  const activeHost = hostManager.setActiveHost('robot-norm');

  assert.equal(activeHost.displayName, 'Robot Norm');
  assert.equal(hostManager.getVisual('happy'), 'robot.png');
  assert.equal(hostManager.selectQuip('idle'), 'Hello.');
});

test('HostManager selects deterministic quips when random is injected', () => {
  const hostManager = new HostManager({ random: () => 0.99 });

  assert.equal(hostManager.selectQuip('correct'), 'That is the one.');
});
