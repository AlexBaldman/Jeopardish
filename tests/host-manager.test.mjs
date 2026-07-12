import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  DefaultHost,
  DefaultHostSkins,
  HostManager,
  normalizePerformanceState,
} = require('../src/host/host-manager.js');

test('HostManager exposes the default host', () => {
  const hostManager = new HostManager();

  assert.equal(hostManager.getActiveHost().id, DefaultHost.id);
  assert.equal(hostManager.getActiveHost().displayName, 'Xander Trefleck');
  assert.equal(hostManager.getVisual('neutral'), 'assets/trebek/trebek-dope-02.png');
  assert.equal(hostManager.getActiveSkin().id, DefaultHostSkins[0].id);
});

test('HostManager falls back to neutral visual for unknown expression', () => {
  const hostManager = new HostManager();

  assert.equal(hostManager.getVisual('mysterious'), DefaultHost.visuals.idle);
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

test('HostManager cycles host skins and wraps around the catalog', () => {
  const hostManager = new HostManager();

  assert.equal(hostManager.getActiveSkin().id, 'dope-broadcast');
  assert.equal(hostManager.cycleSkin(1).id, 'dope-question');
  assert.equal(hostManager.getVisual('happy'), 'assets/trebek/trebek-dope-02.png');
  assert.equal(hostManager.cycleSkin(-1).id, 'dope-broadcast');
  assert.equal(hostManager.cycleSkin(-1).id, 'legacy-cutout');
});

test('HostManager restores a known skin and ignores an unknown skin', () => {
  const hostManager = new HostManager({ activeSkinId: 'dope-question' });

  assert.equal(hostManager.getActiveSkin().id, 'dope-question');
  assert.equal(hostManager.setActiveSkin('not-real').id, 'dope-question');
});

test('HostManager resolves a complete dope reaction performance pack', () => {
  const hostManager = new HostManager();
  const clue = hostManager.getPerformance('thinking');
  const correct = hostManager.getPerformance('happy');

  assert.equal(clue.state, 'clue');
  assert.equal(clue.visual, 'assets/trebek/trebek-dope-05.png');
  assert.equal(clue.effect, 'lean-in');
  assert.equal(clue.frame, 'bust');
  assert.equal(correct.state, 'correct');
  assert.equal(correct.visual, 'assets/trebek/trebek-dope-01.png');
  assert.equal(correct.skinIndex, 0);
  assert.equal(correct.skinCount, DefaultHostSkins.length);
  assert.deepEqual(hostManager.getVisualSources(), [
    'assets/trebek/trebek-dope-02.png',
    'assets/trebek/trebek-dope-05.png',
    'assets/trebek/trebek-dope-03.png',
    'assets/trebek/trebek-dope-01.png',
  ]);
  assert.equal(normalizePerformanceState('not-a-state'), 'idle');
});

test('HostManager selects deterministic quips when random is injected', () => {
  const hostManager = new HostManager({ random: () => 0.99 });

  assert.equal(hostManager.selectQuip('correct'), 'That is the one. Please stop making this look easy in my building.');
});
