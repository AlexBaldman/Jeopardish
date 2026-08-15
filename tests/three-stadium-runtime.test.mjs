import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { ThreeStadiumRuntime, ThreeStadiumRuntimeError, maskAnimationClip } = require('../src/character/three-stadium-runtime.js');

const calls = [];
class FakeClip {
  constructor(name, duration, tracks, blendMode) {
    this.name = name;
    this.duration = duration;
    this.tracks = tracks;
    this.blendMode = blendMode;
  }
}
class FakeAction {
  constructor(clip) { this.clip = clip; }
  setLoop(mode, count) { calls.push(['loop', this.clip.name, mode, count]); return this; }
  setEffectiveWeight(value) { calls.push(['weight', this.clip.name, value]); return this; }
  setEffectiveTimeScale(value) { calls.push(['speed', this.clip.name, value]); return this; }
  play() { calls.push(['play', this.clip.name]); return this; }
}
class FakeMixer {
  constructor(model) { this.model = model; calls.push(['mixer', model.id]); }
  clipAction(clip) { return new FakeAction(clip); }
  update(delta) { calls.push(['mixer-update', delta]); }
  stopAllAction() { calls.push(['stop-all']); }
}
class FakeIK {
  constructor(mesh, iks) { this.mesh = mesh; this.iks = iks; calls.push(['ik', iks.length]); }
  update(blend) { calls.push(['ik-update', blend]); }
}
const THREE = { AnimationMixer: FakeMixer, AnimationClip: FakeClip, LoopRepeat: 'repeat' };

const model = {
  id: 'trombonist-model',
  animations: [
    new FakeClip('march', 1, [
      { name: '.bones[Hips].position' },
      { name: '.bones[Spine].quaternion' },
      { name: '.bones[UpperArm_L].quaternion' },
      { name: '.bones[UpperArm_R].quaternion' },
      { name: '.bones[Foot_L].quaternion' },
    ]),
    new FakeClip('play-instrument', 1.5, [
      { name: '.bones[Hips].position' },
      { name: '.bones[Spine].quaternion' },
      { name: '.bones[UpperArm_L].quaternion' },
      { name: '.bones[UpperArm_R].quaternion' },
      { name: '.bones[Hand_L].quaternion' },
      { name: '.bones[Hand_R].quaternion' },
      { name: '.bones[Foot_L].quaternion' },
    ]),
  ],
};

const plan = {
  schema: 'uinverse.stadium-performer-plan',
  characterId: 'stadium-trombonist',
  layers: [
    { id: 'base-locomotion', action: 'march', loop: true, modifiers: { speed: 0.6 } },
    { id: 'upper-body-performance', action: 'play-instrument', loop: true, blend: 'upper-body', modifiers: { speed: 0.5 } },
  ],
  constraints: [
    { target: 'left-hand', bone: 'Hand_L', itemId: 'instrument.trombone' },
    { target: 'right-hand', bone: 'Hand_R', itemId: 'instrument.trombone' },
  ],
};

function createRuntime() {
  calls.length = 0;
  return new ThreeStadiumRuntime({
    THREE,
    CCDIKSolver: FakeIK,
    upperBodyBones: ['Spine', 'UpperArm_L', 'UpperArm_R', 'Hand_L', 'Hand_R'],
    ikResolver: () => ({ mesh: { id: 'skinned-mesh' }, iks: [{ target: 1, effector: 2, links: [] }, { target: 3, effector: 4, links: [] }] }),
  });
}

test('upper-body masking strips root and foot tracks from instrument clips', () => {
  const masked = maskAnimationClip(THREE, model.animations[1], ['Spine', 'UpperArm_L', 'UpperArm_R', 'Hand_L', 'Hand_R']);
  assert.equal(masked.name, 'play-instrument:upper-body');
  assert.equal(masked.tracks.length, 5);
  assert.equal(masked.tracks.some(({ name }) => name.includes('Hips')), false);
  assert.equal(masked.tracks.some(({ name }) => name.includes('Foot_L')), false);
});

test('runtime mounts base and masked upper-body actions plus CCD IK', () => {
  const runtime = createRuntime().mount({ plan, model });
  assert.equal(runtime.actions.length, 2);
  assert.equal(runtime.actions[0].clip.name, 'march');
  assert.equal(runtime.actions[1].clip.name, 'play-instrument:upper-body');
  assert.ok(calls.some((entry) => entry[0] === 'ik' && entry[1] === 2));
});

test('frame update applies animation before IK and clamps huge frame deltas', () => {
  const runtime = createRuntime().mount({ plan, model });
  calls.length = 0;
  runtime.update(4);
  assert.deepEqual(calls, [['mixer-update', 0.05], ['ik-update', 1]]);
});

test('dispose stops actions and releases runtime references', () => {
  const runtime = createRuntime().mount({ plan, model });
  calls.length = 0;
  runtime.dispose();
  assert.deepEqual(calls, [['stop-all']]);
  assert.equal(runtime.mixer, null);
  assert.equal(runtime.ikSolver, null);
});

test('runtime fails early for missing clips, masks, or IK configuration', () => {
  assert.throws(() => new ThreeStadiumRuntime({ THREE, CCDIKSolver: FakeIK, upperBodyBones: [], ikResolver() {} }), ThreeStadiumRuntimeError);
  const missingClip = createRuntime();
  assert.throws(() => missingClip.mount({ plan: { ...plan, layers: [{ ...plan.layers[0], action: 'moonwalk' }, plan.layers[1]] }, model }), /missing animation clip/);
  const noIk = new ThreeStadiumRuntime({ THREE, CCDIKSolver: FakeIK, upperBodyBones: ['Spine'], ikResolver: () => ({ mesh: {}, iks: [] }) });
  assert.throws(() => noIk.mount({ plan, model }), /ikResolver/);
});
