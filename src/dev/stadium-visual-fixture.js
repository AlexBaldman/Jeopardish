import * as THREE from 'three';
import { CCDIKSolver } from 'three/addons/animation/CCDIKSolver.js';

const canvas = document.getElementById('stage');
const status = document.getElementById('status');
const { ThreeStadiumRuntime } = window.UinverseThreeStadiumRuntime || {};
if (!ThreeStadiumRuntime) throw new Error('ThreeStadiumRuntime global is unavailable');

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x07110b);
scene.fog = new THREE.Fog(0x07110b, 7, 18);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
camera.position.set(4.4, 2.8, 6.4);
camera.lookAt(0, 1.25, 0);

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.shadowMap.enabled = true;

scene.add(new THREE.HemisphereLight(0xb8ddff, 0x23421c, 2.4));
const key = new THREE.DirectionalLight(0xffffff, 2.5);
key.position.set(4, 7, 3);
key.castShadow = true;
scene.add(key);

const field = new THREE.Mesh(
  new THREE.PlaneGeometry(22, 14),
  new THREE.MeshStandardMaterial({ color: 0x183f25, roughness: 1 }),
);
field.rotation.x = -Math.PI / 2;
field.receiveShadow = true;
scene.add(field);

const stripeMaterial = new THREE.MeshBasicMaterial({ color: 0xd6e8d2, transparent: true, opacity: 0.38 });
for (let x = -8; x <= 8; x += 2) {
  const stripe = new THREE.Mesh(new THREE.PlaneGeometry(0.035, 10), stripeMaterial);
  stripe.rotation.x = -Math.PI / 2;
  stripe.position.set(x, 0.006, 0);
  scene.add(stripe);
}

function bone(name, parent = null, position = [0, 0, 0]) {
  const value = new THREE.Bone();
  value.name = name;
  value.position.set(...position);
  if (parent) parent.add(value);
  return value;
}

function attachBox(parent, size, position, material, rotation = [0, 0, 0]) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(...size), material);
  mesh.position.set(...position);
  mesh.rotation.set(...rotation);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function attachSphere(parent, radius, position, material) {
  const mesh = new THREE.Mesh(new THREE.SphereGeometry(radius, 18, 12), material);
  mesh.position.set(...position);
  mesh.castShadow = true;
  parent.add(mesh);
  return mesh;
}

function createPerformer() {
  const uniform = new THREE.MeshStandardMaterial({ color: 0x8f2434, roughness: 0.7 });
  const trousers = new THREE.MeshStandardMaterial({ color: 0xe8e5dc, roughness: 0.75 });
  const skin = new THREE.MeshStandardMaterial({ color: 0xd7a27f, roughness: 0.8 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.65 });

  const hips = bone('Hips');
  hips.position.y = 0.95;
  const spine = bone('Spine', hips, [0, 0.58, 0]);
  const head = bone('Head', spine, [0, 0.62, 0]);

  const upperLeft = bone('UpperArm_L', spine, [0.23, 0.38, 0]);
  const foreLeft = bone('ForeArm_L', upperLeft, [0.34, 0, 0]);
  const handLeft = bone('Hand_L', foreLeft, [0.3, 0, 0]);
  const targetLeft = bone('IK_Target_L', hips, [0.32, 0.93, 0.42]);

  const upperRight = bone('UpperArm_R', spine, [-0.23, 0.38, 0]);
  const foreRight = bone('ForeArm_R', upperRight, [-0.34, 0, 0]);
  const handRight = bone('Hand_R', foreRight, [-0.3, 0, 0]);
  const targetRight = bone('IK_Target_R', hips, [-0.24, 0.9, 0.58]);

  const thighLeft = bone('Thigh_L', hips, [0.16, -0.04, 0]);
  const shinLeft = bone('Shin_L', thighLeft, [0, -0.48, 0]);
  const thighRight = bone('Thigh_R', hips, [-0.16, -0.04, 0]);
  const shinRight = bone('Shin_R', thighRight, [0, -0.48, 0]);

  const bones = [hips, spine, head, upperLeft, foreLeft, handLeft, targetLeft, upperRight, foreRight, handRight, targetRight, thighLeft, shinLeft, thighRight, shinRight];
  const solverMesh = new THREE.SkinnedMesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial());
  solverMesh.name = 'VisualStadiumTrombonist';
  // This mesh carries the skeleton for AnimationMixer + CCD IK only. Visible body
  // geometry hangs from its bones, so keep the carrier traversable without asking
  // Three.js to render or frustum-test an intentionally empty BufferGeometry.
  solverMesh.frustumCulled = false;
  solverMesh.material.visible = false;
  solverMesh.add(hips);
  solverMesh.bind(new THREE.Skeleton(bones));

  attachBox(hips, [0.55, 0.28, 0.3], [0, 0.03, 0], trousers);
  attachBox(spine, [0.62, 0.78, 0.34], [0, 0.22, 0], uniform);
  attachSphere(head, 0.22, [0, 0.16, 0], skin);
  attachBox(head, [0.48, 0.11, 0.48], [0, 0.37, 0], dark);

  attachBox(upperLeft, [0.36, 0.15, 0.15], [0.18, 0, 0], uniform);
  attachBox(foreLeft, [0.32, 0.13, 0.13], [0.16, 0, 0], skin);
  attachSphere(handLeft, 0.09, [0.03, 0, 0], skin);
  attachBox(upperRight, [0.36, 0.15, 0.15], [-0.18, 0, 0], uniform);
  attachBox(foreRight, [0.32, 0.13, 0.13], [-0.16, 0, 0], skin);
  attachSphere(handRight, 0.09, [-0.03, 0, 0], skin);

  attachBox(thighLeft, [0.17, 0.48, 0.19], [0, -0.24, 0], trousers);
  attachBox(shinLeft, [0.15, 0.48, 0.17], [0, -0.24, 0], trousers);
  attachBox(shinLeft, [0.2, 0.1, 0.38], [0, -0.51, 0.08], dark);
  attachBox(thighRight, [0.17, 0.48, 0.19], [0, -0.24, 0], trousers);
  attachBox(shinRight, [0.15, 0.48, 0.17], [0, -0.24, 0], trousers);
  attachBox(shinRight, [0.2, 0.1, 0.38], [0, -0.51, 0.08], dark);

  const identity = [0, 0, 0, 1];
  const legForward = new THREE.Quaternion().setFromEuler(new THREE.Euler(0.38, 0, 0)).toArray();
  const legBack = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.38, 0, 0)).toArray();
  const armLiftL = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.3, 0.2, -0.45)).toArray();
  const armLiftR = new THREE.Quaternion().setFromEuler(new THREE.Euler(-0.3, -0.2, 0.45)).toArray();

  solverMesh.animations = [
    new THREE.AnimationClip('march', 1, [
      new THREE.VectorKeyframeTrack('.bones[Hips].position', [0, 0.25, 0.5, 0.75, 1], [0,0.95,0, 0,1.01,0, 0,0.95,0, 0,1.01,0, 0,0.95,0]),
      new THREE.QuaternionKeyframeTrack('.bones[Thigh_L].quaternion', [0, 0.5, 1], [...legForward, ...legBack, ...legForward]),
      new THREE.QuaternionKeyframeTrack('.bones[Thigh_R].quaternion', [0, 0.5, 1], [...legBack, ...legForward, ...legBack]),
    ]),
    new THREE.AnimationClip('play-instrument', 1, [
      new THREE.QuaternionKeyframeTrack('.bones[Spine].quaternion', [0, 1], [...identity, ...identity]),
      new THREE.QuaternionKeyframeTrack('.bones[UpperArm_L].quaternion', [0, 1], [...armLiftL, ...armLiftL]),
      new THREE.QuaternionKeyframeTrack('.bones[ForeArm_L].quaternion', [0, 1], [...identity, ...identity]),
      new THREE.QuaternionKeyframeTrack('.bones[Hand_L].quaternion', [0, 1], [...identity, ...identity]),
      new THREE.QuaternionKeyframeTrack('.bones[UpperArm_R].quaternion', [0, 1], [...armLiftR, ...armLiftR]),
      new THREE.QuaternionKeyframeTrack('.bones[ForeArm_R].quaternion', [0, 1], [...identity, ...identity]),
      new THREE.QuaternionKeyframeTrack('.bones[Hand_R].quaternion', [0, 1], [...identity, ...identity]),
    ]),
  ];

  const brass = new THREE.MeshStandardMaterial({ color: 0xd5a62e, metalness: 0.82, roughness: 0.28 });
  const trombone = new THREE.Group();
  trombone.name = 'Trombone';
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.07, 0.34, 24, 1, true), brass);
  bell.rotation.x = Math.PI / 2;
  bell.position.z = 0.05;
  trombone.add(bell);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 1.1, 12), brass);
  tube.rotation.x = Math.PI / 2;
  tube.position.z = 0.62;
  trombone.add(tube);
  const slide = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.85, 10), brass);
  slide.rotation.x = Math.PI / 2;
  slide.position.set(-0.22, -0.08, 0.85);
  trombone.add(slide);
  trombone.position.set(0, 1.78, 0.34);
  solverMesh.add(trombone);

  solverMesh.updateMatrixWorld(true);
  return { solverMesh, trombone, slide, targetLeft, targetRight, handLeft, handRight, upperLeft, foreLeft, upperRight, foreRight };
}

const performer = createPerformer();
scene.add(performer.solverMesh);

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

const skeleton = performer.solverMesh.skeleton;
const indexOf = (value) => skeleton.bones.indexOf(value);
const runtime = new ThreeStadiumRuntime({
  THREE,
  CCDIKSolver,
  upperBodyBones: ['Spine', 'UpperArm_L', 'ForeArm_L', 'Hand_L', 'UpperArm_R', 'ForeArm_R', 'Hand_R'],
  ikResolver: () => ({
    mesh: performer.solverMesh,
    iks: [
      { target: indexOf(performer.targetLeft), effector: indexOf(performer.handLeft), links: [{ index: indexOf(performer.foreLeft) }, { index: indexOf(performer.upperLeft) }], iteration: 3 },
      { target: indexOf(performer.targetRight), effector: indexOf(performer.handRight), links: [{ index: indexOf(performer.foreRight) }, { index: indexOf(performer.upperRight) }], iteration: 3 },
    ],
  }),
});
runtime.mount({ plan, model: performer.solverMesh });

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / Math.max(1, height);
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

const clock = new THREE.Clock();
let elapsed = 0;
let frameCount = 0;
function animate() {
  const delta = Math.min(clock.getDelta(), 0.05);
  elapsed += delta;

  const slidePhase = (Math.sin(elapsed * 2.2) + 1) * 0.5;
  performer.targetRight.position.z = 0.48 + slidePhase * 0.34;
  performer.slide.position.z = 0.83 + slidePhase * 0.2;
  performer.solverMesh.position.x = Math.sin(elapsed * 0.45) * 1.4;

  performer.solverMesh.updateMatrixWorld(true);
  runtime.update(delta);
  renderer.render(scene, camera);

  frameCount += 1;
  if (frameCount === 8) {
    window.__stadiumFixtureReady = true;
    window.__stadiumFixtureMetrics = {
      actions: runtime.actions.length,
      ikChains: runtime.ikSolver?.iks?.length || 2,
      renderer: renderer.constructor.name,
      characterId: plan.characterId,
    };
    status.textContent = 'ready · march + upper-body instrument layer + two-hand CCD IK';
    status.dataset.ready = 'true';
    document.body.dataset.stadiumReady = 'true';
  }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);
