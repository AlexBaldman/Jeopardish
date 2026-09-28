import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
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

const assetUrl = new URL('../../assets/stadium/marching-trombonist.gltf', import.meta.url);
let performer;
try {
  const gltf = await new GLTFLoader().loadAsync(assetUrl.href);
  const model = gltf.scene;
  const solverMesh = model.getObjectByName('VisualStadiumTrombonist');
  if (!solverMesh?.isSkinnedMesh) throw new Error('fixture requires a visible skinned performer');
  const required = (name) => {
    const node = model.getObjectByName(name);
    if (!node) throw new Error(`fixture missing node: ${name}`);
    return node;
  };
  // Keep GLTF naming conversion here; the injected runtime contract stays unchanged.
  solverMesh.animations = gltf.animations.map((source) => {
    const clip = source.clone();
    for (const track of clip.tracks) {
      const binding = THREE.PropertyBinding.parseTrackName(track.name);
      const bone = solverMesh.skeleton.getBoneByName(binding.nodeName);
      if (!bone) throw new Error(`fixture animation targets unknown bone: ${track.name}`);
      track.name = `.bones[${bone.name}].${binding.propertyName}`;
    }
    return clip;
  });
  model.traverse((node) => { if (node.isMesh) node.castShadow = true; });
  performer = { model, solverMesh, slide: required('TromboneSlide'),
    targetLeft: required('IK_Target_L'), targetRight: required('IK_Target_R'),
    handLeft: required('Hand_L'), handRight: required('Hand_R'),
    upperLeft: required('UpperArm_L'), foreLeft: required('ForeArm_L'),
    upperRight: required('UpperArm_R'), foreRight: required('ForeArm_R') };
  scene.add(model);
} catch (error) {
  window.__stadiumFixtureError = `GLTF fixture: ${error.message}`;
  status.textContent = window.__stadiumFixtureError;
  throw error;
}

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
  performer.model.position.x = Math.sin(elapsed * 0.45) * 1.4;

  performer.model.updateMatrixWorld(true);
  runtime.update(delta);
  renderer.render(scene, camera);

  frameCount += 1;
  window.__stadiumFixtureMetrics = {
    actions: runtime.actions.length,
    ikChains: runtime.ikSolver.iks.length,
    renderer: renderer.constructor.name,
    characterId: plan.characterId,
    asset: assetUrl.pathname,
    clips: performer.solverMesh.animations.map(({ name }) => name),
    bones: skeleton.bones.map(({ name }) => name),
    upperTracks: runtime.actions[1].getClip().tracks.map(({ name }) => name),
    skinnedVertices: performer.solverMesh.geometry.attributes.position.count,
    triangles: renderer.info.render.triangles,
    frameCount,
    marchTime: runtime.actions[0].time,
    thigh: skeleton.getBoneByName('Thigh_L').quaternion.toArray(),
    slideZ: performer.slide.position.z,
    targetZ: performer.targetRight.position.z,
    handErrors: [performer.handLeft, performer.handRight].map((hand, i) =>
      hand.getWorldPosition(new THREE.Vector3()).distanceTo(
        [performer.targetLeft, performer.targetRight][i].getWorldPosition(new THREE.Vector3()))),
  };
  if (frameCount === 8) {
    window.__stadiumFixtureReady = true;
    status.textContent = 'ready · march + upper-body instrument layer + two-hand CCD IK';
    status.dataset.ready = 'true';
    document.body.dataset.stadiumReady = 'true';
  }
  requestAnimationFrame(animate);
}
requestAnimationFrame(animate);

