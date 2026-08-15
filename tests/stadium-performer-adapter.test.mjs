import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const genomeApi = require('../src/character/character-genome.js');
const { CharacterFactory } = require('../src/character/character-factory.js');
const performanceApi = require('../src/character/performance-command.js');
const {
  STADIUM_PLAN_SCHEMA,
  StadiumPerformerError,
  buildStadiumPerformerPlan,
  createStadiumPerformerAdapter,
} = require('../src/character/stadium-performer-adapter.js');

const performer = genomeApi.normalizeCharacterGenome({
  id: 'stadium-trombonist',
  displayName: 'Stadium Trombonist',
  morphology: { kind: 'humanoid', species: 'human' },
  rig: {
    family: 'humanoid-v1',
    attachments: {
      'left-hand': { bone: 'hand.L', position: [0.02, 0, 0] },
      'right-hand': { bone: 'hand.R', position: [0.01, 0, 0] },
      mouth: { bone: 'head', position: [0, 0.08, 0.11] },
    },
  },
  animation: {
    locomotionSet: 'march-standard',
    performanceSets: ['trombone-performance'],
    modifiers: { stride: 0.62, posture: 0.76, energy: 0.73, looseness: 0.35, expressiveness: 0.58 },
  },
  embodiments: [{
    id: 'stadium-3d',
    kind: 'game-3d',
    renderer: 'three',
    representationAssetId: 'model.stadium-trombonist',
    rigProfile: 'humanoid-v1',
  }],
});

const march = performanceApi.normalizePerformanceCommand({
  kind: 'locomotion',
  action: 'march',
  loop: true,
  modifiers: { speed: 0.6, intensity: 0.72 },
});

const playTrombone = performanceApi.normalizePerformanceCommand({
  kind: 'action',
  action: 'play-instrument',
  blend: 'upper-body',
  loop: true,
  modifiers: { intensity: 0.8 },
  attachments: [
    { target: 'left-hand', itemId: 'instrument.trombone', grip: 'brace' },
    { target: 'right-hand', itemId: 'instrument.trombone', grip: 'slide' },
    { target: 'mouth', itemId: 'instrument.trombone', mode: 'contact', grip: 'mouthpiece' },
  ],
});

test('stadium plan layers marching locomotion and upper-body instrument performance', () => {
  const plan = buildStadiumPerformerPlan({ genome: performer, locomotion: march, performance: playTrombone });
  assert.equal(plan.schema, STADIUM_PLAN_SCHEMA);
  assert.equal(plan.characterId, 'stadium-trombonist');
  assert.equal(plan.layers[0].action, 'march');
  assert.equal(plan.layers[0].blend, 'replace');
  assert.equal(plan.layers[1].action, 'play-instrument');
  assert.equal(plan.layers[1].blend, 'upper-body');
  assert.equal(plan.props[0].itemId, 'instrument.trombone');
  assert.equal(Object.isFrozen(plan), true);
});

test('semantic grips become concrete rig constraints without engine objects', () => {
  const plan = buildStadiumPerformerPlan({ genome: performer, locomotion: march, performance: playTrombone });
  const left = plan.constraints.find(({ target }) => target === 'left-hand');
  const right = plan.constraints.find(({ target }) => target === 'right-hand');
  const mouth = plan.constraints.find(({ target }) => target === 'mouth');
  assert.equal(left.bone, 'hand.L');
  assert.equal(right.bone, 'hand.R');
  assert.equal(mouth.type, 'contact');
  assert.equal(mouth.bone, 'head');
  assert.equal('object3D' in plan, false);
  assert.equal('mixer' in plan, false);
});

test('plan advertises implementation capabilities learned from the real slice', () => {
  const plan = buildStadiumPerformerPlan({ genome: performer, locomotion: march, performance: playTrombone });
  assert.ok(plan.requiredCapabilities.includes('layered-animation'));
  assert.ok(plan.requiredCapabilities.includes('two-hand-prop-ik'));
  assert.ok(plan.requiredCapabilities.includes('face-or-head-contact'));
});

test('CharacterFactory can resolve a 3D performer through the stadium adapter', async () => {
  const factory = new CharacterFactory({ adapters: [createStadiumPerformerAdapter()] });
  const output = await factory.embody(performer, 'stadium-3d', {
    locomotion: march,
    performance: playTrombone,
  });
  assert.equal(output.status, 'ready');
  assert.equal(output.adapter, 'stadium-performer-v0');
  assert.equal(output.plan.layers.length, 2);
});

test('v0 rejects non-humanoid performers and incomplete two-hand instrument rigs', () => {
  const dog = genomeApi.normalizeCharacterGenome({
    id: 'stadium-dog',
    displayName: 'Stadium Dog',
    morphology: { kind: 'quadruped', species: 'dog' },
    rig: { family: 'canine-v1', attachments: { mouth: { bone: 'jaw' } } },
    animation: { locomotionSet: 'run' },
    embodiments: [{ id: 'stadium-3d', kind: 'game-3d', representationAssetId: 'model.dog' }],
  });
  assert.throws(() => buildStadiumPerformerPlan({ genome: dog, locomotion: march, performance: playTrombone }), StadiumPerformerError);

  const oneHand = performanceApi.normalizePerformanceCommand({
    kind: 'action', action: 'play-instrument', blend: 'upper-body',
    attachments: [{ target: 'left-hand', itemId: 'instrument.trombone' }],
  });
  assert.throws(() => buildStadiumPerformerPlan({ genome: performer, locomotion: march, performance: oneHand }), StadiumPerformerError);
});

test('missing rig anchors fail before a renderer gets an impossible assignment', () => {
  const badRig = genomeApi.normalizeCharacterGenome({
    id: 'bad-rig-trombonist',
    displayName: 'Bad Rig Trombonist',
    morphology: { kind: 'humanoid', species: 'human' },
    rig: { family: 'humanoid-v1', attachments: { 'left-hand': { bone: 'hand.L' } } },
    animation: { locomotionSet: 'march-standard' },
    embodiments: [{ id: 'stadium-3d', kind: 'game-3d', representationAssetId: 'model.bad' }],
  });
  assert.throws(() => buildStadiumPerformerPlan({ genome: badRig, locomotion: march, performance: playTrombone }), /missing rig anchor for right-hand/);
});
