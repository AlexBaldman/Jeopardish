import test from 'node:test';
import assert from 'node:assert/strict';
import stageModule from '../src/presentation/stage-engine.js';

const {
  CameraShots,
  LightingModes,
  StageEngine,
  StageLayouts,
  createPropRegistry,
  createSkinRegistry,
  resolveStageLayout,
} = stageModule;

test('resolveStageLayout maps representative viewports to blocking presets', () => {
  assert.equal(resolveStageLayout({ width: 393, height: 852 }), StageLayouts.MOBILE_PORTRAIT);
  assert.equal(resolveStageLayout({ width: 393, height: 852, immersive: true }), StageLayouts.MOBILE_IMMERSIVE);
  assert.equal(resolveStageLayout({ width: 852, height: 393 }), StageLayouts.TABLET);
  assert.equal(resolveStageLayout({ width: 740, height: 390 }), StageLayouts.MOBILE_LANDSCAPE);
  assert.equal(resolveStageLayout({ width: 820, height: 1180 }), StageLayouts.TABLET);
  assert.equal(resolveStageLayout({ width: 1180, height: 820 }), StageLayouts.DESKTOP_COMPACT);
  assert.equal(resolveStageLayout({ width: 1600, height: 1000 }), StageLayouts.DESKTOP_WIDE);
});

test('skin registry keeps semantic control type separate from visual skin id', () => {
  const skins = createSkinRegistry();
  skins.register('theme', { id: 'lavaLamp', states: ['day', 'night'] });
  skins.register('theme', { id: 'pullChainBulb', states: ['day', 'night'] });

  assert.equal(skins.get('theme', 'lavaLamp').id, 'lavaLamp');
  assert.equal(skins.list('theme').length, 2);
  assert.equal(skins.get('sound', 'lavaLamp'), null);
});

test('prop registry exposes stable semantic ids and anchors', () => {
  const props = createPropRegistry();
  const bubble = props.register('dialogue', {
    kind: 'dialogueBubble',
    anchors: { topLeft: { x: 0, y: 0 }, tail: { x: .15, y: 1 } },
  });

  assert.equal(bubble.kind, 'dialogueBubble');
  assert.deepEqual(props.get('dialogue').anchors.tail, { x: .15, y: 1 });
  assert.equal(props.unregister('dialogue'), true);
  assert.equal(props.get('dialogue'), null);
});

test('StageEngine updates camera, lighting, scene, and immersive state without DOM', () => {
  const stage = new StageEngine({ windowRef: null, documentRef: null });
  stage.setCamera(CameraShots.CLOSE_UP, { target: 'host', intensity: 1.2 });
  stage.setLighting(LightingModes.BLACKLIGHT, { intensity: .8 });
  stage.setScene('result');
  stage.setImmersive(true);

  const state = stage.getState();
  assert.equal(state.camera.shot, CameraShots.CLOSE_UP);
  assert.equal(state.camera.target, 'host');
  assert.equal(state.lighting.mode, LightingModes.BLACKLIGHT);
  assert.equal(state.scene, 'result');
  assert.equal(state.immersive, true);
});
