import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  DefaultXanderHostAnimationPack,
  HOST_ANIMATION_PACK_SCHEMA,
  HOST_ANIMATION_PACK_VERSION,
  HOST_ANIMATION_SELECTION_SCHEMA,
  HostAnimationError,
  HostAnimationPoses,
  normalizeHostAnimationPack,
  resolveReducedMotion,
  selectHostAnimation,
} = require('../src/host/host-animation.js');

test('HostAnimationPack defines and freezes all eight authored host poses', () => {
  assert.equal(DefaultXanderHostAnimationPack.schema, HOST_ANIMATION_PACK_SCHEMA);
  assert.equal(DefaultXanderHostAnimationPack.version, HOST_ANIMATION_PACK_VERSION);
  assert.deepEqual(Object.keys(DefaultXanderHostAnimationPack.poses), HostAnimationPoses);
  assert.equal(DefaultXanderHostAnimationPack.poses.idle.clips.length, 2);
  assert.equal(Object.isFrozen(DefaultXanderHostAnimationPack), true);
  assert.equal(Object.isFrozen(DefaultXanderHostAnimationPack.poses.clue.clips[0]), true);
});

test('animation selection is deterministic, weighted, and renderer-neutral', () => {
  const options = { pose: 'idle', seed: 'episode-9:clue-3' };
  const first = selectHostAnimation(DefaultXanderHostAnimationPack, options);
  const repeat = selectHostAnimation(DefaultXanderHostAnimationPack, options);
  const alternate = selectHostAnimation(DefaultXanderHostAnimationPack, {
    ...options,
    previousClipId: first.clip.id,
  });

  assert.deepEqual(first, repeat);
  assert.notEqual(alternate.clip.id, first.clip.id);
  assert.equal(first.schema, HOST_ANIMATION_SELECTION_SCHEMA);
  assert.equal(first.clip.renderers[0].kind, 'css');
  assert.equal(first.timeline.cues[0].name, 'enter');
  assert.equal(Object.isFrozen(first), true);
});

test('animation contracts accept sprite descriptors and fall back from unavailable poses', () => {
  const pack = normalizeHostAnimationPack({
    id: 'sprite-host-v1',
    hostId: 'sprite-host',
    displayName: 'Sprite Host',
    poses: {
      idle: {
        clips: [{
          id: 'idle-sheet',
          durationMs: 400,
          renderers: { sprite: { asset: 'assets/hosts/sprite/idle.png', frames: 4, fps: 10 } },
        }],
      },
      clue: { clips: [] },
    },
  });
  const selection = selectHostAnimation(pack, { pose: 'clue', seed: 'fallback' });
  const unknown = selectHostAnimation(pack, { pose: 'not-a-pose', seed: 'fallback' });

  assert.equal(selection.pose, 'idle');
  assert.equal(selection.fallback, 'idle-pose');
  assert.equal(unknown.pose, 'idle');
  assert.equal(unknown.fallback, 'unknown-pose');
  assert.deepEqual(selection.clip.renderers[0], {
    kind: 'sprite', asset: 'assets/hosts/sprite/idle.png', frames: 4, fps: 10,
  });
});

test('reduced motion is explicitly resolved without browser state and preserves semantic settling', () => {
  const system = resolveReducedMotion({ preference: 'system', systemReducedMotion: true });
  const explicit = resolveReducedMotion({ preference: 'full', systemReducedMotion: true });
  const reduced = selectHostAnimation(DefaultXanderHostAnimationPack, {
    pose: 'clue',
    seed: 'motion-test',
    motion: { preference: 'reduce' },
  });

  assert.deepEqual(system, { preference: 'system', source: 'system', reducedMotion: true });
  assert.deepEqual(explicit, { preference: 'full', source: 'explicit', reducedMotion: false });
  assert.equal(reduced.motion.reducedMotion, true);
  assert.equal(reduced.timeline.durationMs, 120);
  assert.equal(reduced.timeline.loop, false);
  assert.equal(reduced.timeline.cues.at(-1).name, 'settle');
});

test('animation contracts reject unsupported schemas and unsafe sprite assets', () => {
  assert.throws(() => normalizeHostAnimationPack({
    schema: 'other.animation',
    id: 'unsafe-host',
    hostId: 'unsafe-host',
    displayName: 'Unsafe Host',
    poses: {
      idle: {
        clips: [{
          id: 'idle',
          renderers: { sprite: { asset: 'https://example.com/idle.png', frames: 2, fps: 12 } },
        }],
      },
    },
  }), HostAnimationError);
});
