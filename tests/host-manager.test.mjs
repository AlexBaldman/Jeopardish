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
  assert.equal(hostManager.getVisual('neutral'), 'assets/hosts/xander/v1/looks/question-pink.png');
  assert.equal(hostManager.getActiveSkin().id, 'question-pink');
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

  assert.equal(hostManager.getActiveSkin().id, 'question-pink');
  assert.equal(hostManager.cycleSkin(1).id, 'exclamation-blue');
  assert.equal(hostManager.getVisual('happy'), 'assets/hosts/xander/v1/looks/exclamation-blue.png');
  assert.equal(hostManager.cycleSkin(-1).id, 'question-pink');
  assert.equal(hostManager.cycleSkin(-1).id, 'question-constellation');
});

test('HostManager restores a known skin and ignores an unknown skin', () => {
  const hostManager = new HostManager({ activeSkinId: 'exclamation-blue' });

  assert.equal(hostManager.getActiveSkin().id, 'exclamation-blue');
  assert.equal(hostManager.setActiveSkin('not-real').id, 'exclamation-blue');
});

test('HostManager resolves a complete modular avatar performance pack', () => {
  const hostManager = new HostManager();
  const clue = hostManager.getPerformance('thinking');
  const correct = hostManager.getPerformance('happy');

  assert.equal(clue.state, 'clue');
  assert.equal(clue.visual, 'assets/hosts/xander/v1/looks/question-pink.png');
  assert.equal(clue.effect, 'lean-in');
  assert.equal(clue.frame, 'full');
  assert.equal(clue.avatarPackId, 'xander-surf-v1');
  assert.equal(clue.eyewear.effect, 'question-reflection');
  assert.equal(correct.state, 'correct');
  assert.equal(correct.visual, 'assets/hosts/xander/v1/looks/question-pink.png');
  assert.equal(correct.skinIndex, 0);
  assert.equal(correct.skinCount, DefaultHostSkins.length);
  assert.deepEqual(hostManager.getVisualSources(), [
    'assets/hosts/xander/v1/looks/question-pink.png',
  ]);
  assert.equal(normalizePerformanceState('not-a-state'), 'idle');
});

test('HostManager chooses a stable no-repeat show look', () => {
  const hostManager = new HostManager({ activeSkinId: 'question-pink' });
  const selected = hostManager.selectShowLook('season-zero:show-2', {
    previousLookId: 'question-pink',
  });
  const repeat = new HostManager({ activeSkinId: 'question-pink' }).selectShowLook(
    'season-zero:show-2',
    { previousLookId: 'question-pink' },
  );

  assert.notEqual(selected.id, 'question-pink');
  assert.equal(selected.id, repeat.id);
});

test('HostManager selects deterministic quips when random is injected', () => {
  const hostManager = new HostManager({ random: () => 0.99 });

  assert.equal(hostManager.selectQuip('correct'), 'That is the one. Please stop making this look easy in my building.');
});
