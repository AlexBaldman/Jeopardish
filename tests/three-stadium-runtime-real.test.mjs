import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import {
  AnimationClip,
  AnimationMixer,
  Bone,
  BufferGeometry,
  LoopRepeat,
  MeshBasicMaterial,
  QuaternionKeyframeTrack,
  Skeleton,
  SkinnedMesh,
  VectorKeyframeTrack,
} from 'three';
import { CCDIKSolver } from 'three/addons/animation/CCDIKSolver.js';

const require = createRequire(import.meta.url);
const { ThreeStadiumRuntime } = require('../src/character/three-stadium-runtime.js');

function makeBone(name, parent = null, position = [0, 0, 0]) {
  const bone = new Bone();
  bone.name = name;
  bone.position.set(...position);
  if (parent) parent.add(bone);
  return bone;
}

function createRiggedFixture() {
  const hips = makeBone('Hips');
  const spine = makeBone('Spine', hips, [0, 1, 0]);

  const upperLeft = makeBone('UpperArm_L', spine, [0.25, 0.35, 0]);
  const foreLeft = makeBone('ForeArm_L', upperLeft, [0.35, 0, 0]);
  const handLeft = makeBone('Hand_L', foreLeft, [0.3, 0, 0]);
  const targetLeft = makeBone('IK_Target_L', hips, [0.48, 1.45, 0.24]);

  const upperRight = makeBone('UpperArm_R', spine, [-0.25, 0.35, 0]);
  const foreRight = makeBone('ForeArm_R', upperRight, [-0.35, 0, 0]);
  const handRight = makeBone('Hand_R', foreRight, [-0.3, 0, 0]);
  const targetRight = makeBone('IK_Target_R', hips, [-0.48, 1.45, 0.24]);

  const bones = [
    hips, spine,
    upperLeft, foreLeft, handLeft, targetLeft,
    upperRight, foreRight, handRight, targetRight,
  ];

  const mesh = new SkinnedMesh(new BufferGeometry(), new MeshBasicMaterial());
  mesh.name = 'StadiumTrombonist';
  mesh.add(hips);
  mesh.bind(new Skeleton(bones));

  const identity = [0, 0, 0, 1];
  const slightTurn = [0, 0, 0.0871557, 0.9961947];
  mesh.animations = [
    new AnimationClip('march', 1, [
      new VectorKeyframeTrack('.bones[Hips].position', [0, 0.5, 1], [0, 0, 0, 0, 0.03, 0, 0, 0, 0]),
      new QuaternionKeyframeTrack('.bones[Spine].quaternion', [0, 1], [...identity, ...slightTurn]),
    ]),
    new AnimationClip('play-instrument', 1, [
      new QuaternionKeyframeTrack('.bones[Spine].quaternion', [0, 1], [...identity, ...slightTurn]),
      new QuaternionKeyframeTrack('.bones[UpperArm_L].quaternion', [0, 1], [...identity, ...slightTurn]),
      new QuaternionKeyframeTrack('.bones[ForeArm_L].quaternion', [0, 1], [...identity, ...slightTurn]),
      new QuaternionKeyframeTrack('.bones[Hand_L].quaternion', [0, 1], [...identity, ...slightTurn]),
      new QuaternionKeyframeTrack('.bones[UpperArm_R].quaternion', [0, 1], [...identity, ...slightTurn]),
      new QuaternionKeyframeTrack('.bones[ForeArm_R].quaternion', [0, 1], [...identity, ...slightTurn]),
      new QuaternionKeyframeTrack('.bones[Hand_R].quaternion', [0, 1], [...identity, ...slightTurn]),
    ]),
  ];

  mesh.updateMatrixWorld(true);
  return { mesh, bones, upperLeft, foreLeft, handLeft, targetLeft, upperRight, foreRight, handRight, targetRight };
}

const THREE = { AnimationMixer, AnimationClip, LoopRepeat };

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

test('real Three.js AnimationMixer + CCDIKSolver mount the Stadium performer plan', () => {
  const fixture = createRiggedFixture();
  const skeleton = fixture.mesh.skeleton;
  const indexOf = (bone) => skeleton.bones.indexOf(bone);

  const runtime = new ThreeStadiumRuntime({
    THREE,
    CCDIKSolver,
    upperBodyBones: ['Spine', 'UpperArm_L', 'ForeArm_L', 'Hand_L', 'UpperArm_R', 'ForeArm_R', 'Hand_R'],
    ikResolver: () => ({
      mesh: fixture.mesh,
      iks: [
        {
          target: indexOf(fixture.targetLeft),
          effector: indexOf(fixture.handLeft),
          links: [{ index: indexOf(fixture.foreLeft) }, { index: indexOf(fixture.upperLeft) }],
          iteration: 2,
        },
        {
          target: indexOf(fixture.targetRight),
          effector: indexOf(fixture.handRight),
          links: [{ index: indexOf(fixture.foreRight) }, { index: indexOf(fixture.upperRight) }],
          iteration: 2,
        },
      ],
    }),
  });

  runtime.mount({ plan, model: fixture.mesh });
  assert.ok(runtime.mixer instanceof AnimationMixer);
  assert.ok(runtime.ikSolver instanceof CCDIKSolver);
  assert.equal(runtime.actions.length, 2);
  assert.equal(runtime.actions[0].getClip().name, 'march');
  assert.equal(runtime.actions[1].getClip().name, 'play-instrument:upper-body');
  assert.equal(runtime.actions[1].getClip().tracks.length, 7);

  assert.doesNotThrow(() => runtime.update(1 / 60));
  assert.doesNotThrow(() => runtime.update(1 / 60));
  runtime.dispose();
});
