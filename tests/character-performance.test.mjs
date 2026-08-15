import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const genomeApi = require('../src/character/character-genome.js');
const performanceApi = require('../src/character/performance-command.js');

const trombonist = genomeApi.normalizeCharacterGenome({
  id: 'marching-trombonist',
  displayName: 'Marching Trombonist',
  morphology: { kind: 'humanoid', species: 'human' },
  rig: {
    family: 'humanoid-v1',
    attachments: {
      'left-hand': { bone: 'hand.L' },
      'right-hand': { bone: 'hand.R' },
      mouth: { bone: 'head' },
    },
  },
  animation: {
    locomotionSet: 'march-standard',
    performanceSets: ['trombone-performance'],
    modifiers: { stride: 0.62, posture: 0.76, energy: 0.73, looseness: 0.35, expressiveness: 0.58 },
  },
  embodiments: [{ id: 'stadium-3d', kind: 'game-3d', renderer: 'three', representationAssetId: 'model.trombonist' }],
});

const archie = genomeApi.normalizeCharacterGenome({
  id: 'archie',
  displayName: 'Archie',
  morphology: { kind: 'quadruped', species: 'maltese-mix' },
  rig: { family: 'quadruped-canine-v1', attachments: { mouth: { bone: 'jaw' }, 'tail-base': { bone: 'tail.01' } } },
  animation: { locomotionSet: 'small-dog-chaos', performanceSets: ['suspicious-stare'], modifiers: { energy: 0.82, looseness: 0.78, expressiveness: 0.9 } },
  embodiments: [{ id: 'platformer', kind: 'pixel', renderer: 'sprite', representationAssetId: 'sprite.archie' }],
});

test('marching performance is semantic and renderer-neutral', () => {
  const command = performanceApi.normalizePerformanceCommand({
    kind: 'locomotion',
    action: 'march',
    loop: true,
    modifiers: { intensity: 0.72, speed: 0.58 },
  });
  assert.equal(command.schema, performanceApi.PERFORMANCE_SCHEMA);
  assert.equal(command.action, 'march');
  assert.equal(command.loop, true);
  assert.equal('renderer' in command, false);
  assert.equal(Object.isFrozen(command), true);
});

test('resolved performance inherits character defaults without mutating the command', () => {
  const command = performanceApi.normalizePerformanceCommand({ kind: 'action', action: 'play-instrument', modifiers: { intensity: 0.8 } });
  const resolved = performanceApi.resolvePerformance(trombonist, command);
  assert.equal(resolved.characterId, 'marching-trombonist');
  assert.equal(resolved.rigFamily, 'humanoid-v1');
  assert.equal(resolved.modifiers.posture, 0.76);
  assert.equal(resolved.modifiers.energy, 0.73);
  assert.equal(command.modifiers.posture, null);
});

test('instrument attachments resolve semantic hands into rig anchors', () => {
  const resolved = performanceApi.resolvePerformance(trombonist, {
    kind: 'action',
    action: 'play-instrument',
    blend: 'upper-body',
    attachments: [
      { target: 'left-hand', itemId: 'instrument.trombone', grip: 'brace' },
      { target: 'right-hand', itemId: 'instrument.trombone', grip: 'slide' },
    ],
  });
  assert.equal(resolved.semanticAttachments[0].rigAnchor.bone, 'hand.L');
  assert.equal(resolved.semanticAttachments[1].rigAnchor.bone, 'hand.R');
  assert.equal(resolved.blend, 'upper-body');
});

test('the same performance contract handles Archie reactions', () => {
  const resolved = performanceApi.resolvePerformance(archie, {
    kind: 'reaction',
    action: 'suspicious-stare',
    blend: 'facial',
    modifiers: { intensity: 0.92 },
  });
  assert.equal(resolved.characterId, 'archie');
  assert.equal(resolved.action, 'suspicious-stare');
  assert.equal(resolved.modifiers.expressiveness, 0.9);
});

test('performance sequences preserve authored order and freeze commands', () => {
  const sequence = performanceApi.createPerformanceSequence([
    { kind: 'locomotion', action: 'march', loop: true },
    { kind: 'action', action: 'play-instrument', blend: 'upper-body' },
    { kind: 'reaction', action: 'celebrate' },
  ]);
  assert.deepEqual(sequence.commands.map(({ action }) => action), ['march', 'play-instrument', 'celebrate']);
  assert.equal(Object.isFrozen(sequence.commands[0]), true);
});

test('invalid kinds and unsupported attachment targets fail early', () => {
  assert.throws(() => performanceApi.normalizePerformanceCommand({ kind: 'teleportish', action: 'march' }), performanceApi.PerformanceCommandError);
  assert.throws(() => performanceApi.normalizePerformanceCommand({ kind: 'action', action: 'hold-prop', attachments: [{ target: 'elbow-ish', itemId: 'prop.flag' }] }), performanceApi.PerformanceCommandError);
});
