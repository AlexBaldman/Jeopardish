import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const genomeApi = require('../src/character/character-genome.js');
const { CharacterFactory, createDescriptorAdapter } = require('../src/character/character-factory.js');

const humanBase = {
  id: 'photo-human', displayName: 'Photo Human',
  morphology: { kind: 'humanoid', species: 'human', heightMeters: { value: 1.78, confidence: 0.82, source: 'multi-photo' }, proportions: { shoulderWidth: { value: 0.58, confidence: 0.76, source: 'multi-photo' } } },
  face: { topology: 'human-v1', sourceCapture: { mode: 'multi-photo', assetIds: ['capture-front','capture-side'] }, parameters: { jawWidth: { value: 0.61, confidence: 0.91, source: 'multi-photo' } } },
  wardrobe: { slots: { shirt: { assetId: 'garment.basic-tee' } } },
  rig: { family: 'humanoid-v1', attachments: { 'right-hand': { bone: 'hand.R' }, mouth: { bone: 'head' } }, ikChains: [{ id: 'right-arm', root: 'upper_arm.R', tip: 'hand.R', target: 'right-hand' }] },
  animation: { locomotionSet: 'human-standard', performanceSets: ['talk'], modifiers: { stride: 0.55, posture: 0.6, energy: 0.5 } },
  embodiments: [{ id: 'realistic-3d', kind: 'game-3d', renderer: 'three', representationAssetId: 'model.photo-human.glb' }, { id: 'portrait', kind: 'portrait', renderer: 'canvas', representationAssetId: 'portrait.photo-human' }],
};

const marchingMusician = { ...humanBase, id: 'marching-trombonist', displayName: 'Marching Trombonist', identity: { archetype: 'marching-musician' }, wardrobe: { slots: { shirt: { assetId: 'uniform.band-jacket' }, head: { assetId: 'uniform.shako' }, 'right-hand': { assetId: 'instrument.trombone' } } }, animation: { locomotionSet: 'march-standard', performanceSets: ['trombone-performance'], modifiers: { stride: 0.62, posture: 0.76, energy: 0.73 } } };

const archie = { id: 'archie', displayName: 'Archie', morphology: { kind: 'quadruped', species: 'maltese-mix', heightMeters: 0.28, proportions: { tailPlume: 0.95, earFlop: 0.72 } }, face: { topology: 'canine-v1', parameters: { suspicion: 0.88 } }, rig: { family: 'quadruped-canine-v1', attachments: { 'tail-base': { bone: 'tail.01' }, mouth: { bone: 'jaw' } } }, animation: { locomotionSet: 'small-dog-chaos', performanceSets: ['suspicious-stare','manic-victory'], modifiers: { energy: 0.82, looseness: 0.78, expressiveness: 0.9 } }, embodiments: [{ id: 'platformer-pixel', kind: 'pixel', renderer: 'sprite', representationAssetId: 'sprite.archie.platformer' }, { id: 'desktop-archie', kind: 'desktop-companion', renderer: 'sprite', representationAssetId: 'sprite.archie.pet', interactionProfile: 'desktop-reactive' }] };

const schmalex = { ...humanBase, id: 'schmalex-letrec', displayName: 'Schmalex LeTrec', identity: { archetype: 'beach-game-show-host', tags: ['surfer','host'] }, personality: { confidence: 0.96, weirdness: 0.81 }, embodiments: [{ id: 'broadcast-pixel', kind: 'pixel', renderer: 'sprite', representationAssetId: 'assets/hosts/xander/v1/looks/broadcast-grid-black.png' }, { id: 'stage-3d', kind: 'game-3d', renderer: 'three', representationAssetId: 'model.schmalex' }] };

const desktopOnly = { ...humanBase, id: 'tiny-companion', displayName: 'Tiny Companion', embodiments: [{ id: 'desktop', kind: 'desktop-companion', renderer: 'sprite', representationAssetId: 'sprite.tiny', adapter: 'descriptor-pet' }] };

const fixtures = [humanBase, marchingMusician, archie, schmalex, desktopOnly];

test('five distinct fixtures normalize under one renderer-agnostic genome', () => {
  for (const fixture of fixtures) {
    const genome = genomeApi.normalizeCharacterGenome(fixture);
    assert.equal(genome.schema, genomeApi.CHARACTER_SCHEMA);
    assert.equal(Object.isFrozen(genome), true);
    assert.ok(genome.embodiments.length >= 1);
  }
});

test('photo-derived values preserve confidence and capture provenance', () => {
  const genome = genomeApi.normalizeCharacterGenome(humanBase);
  assert.equal(genome.face.sourceCapture.mode, 'multi-photo');
  assert.equal(genome.face.parameters.jawWidth.confidence, 0.91);
  assert.equal(genome.morphology.heightMeters.source, 'multi-photo');
});

test('one identity supports multiple embodiments without renderer coupling', () => {
  const genome = genomeApi.normalizeCharacterGenome(schmalex);
  assert.equal(genomeApi.selectEmbodiment(genome, 'pixel').renderer, 'sprite');
  assert.equal(genomeApi.selectEmbodiment(genome, 'game-3d').renderer, 'three');
  assert.equal(genome.id, 'schmalex-letrec');
});

test('wardrobe swaps preserve identity, rig, and embodiments', () => {
  const original = genomeApi.normalizeCharacterGenome(marchingMusician);
  const changed = genomeApi.withWardrobe(original, { slots: { head: { assetId: 'uniform.cowboy-hat' } } });
  assert.equal(changed.id, original.id);
  assert.equal(changed.rig.family, original.rig.family);
  assert.deepEqual(changed.embodiments, original.embodiments);
  assert.equal(changed.wardrobe.slots.head.assetId, 'uniform.cowboy-hat');
});

test('non-human Archie uses the same identity contract with a different rig family', () => {
  const genome = genomeApi.normalizeCharacterGenome(archie);
  assert.equal(genome.morphology.kind, 'quadruped');
  assert.equal(genome.rig.family, 'quadruped-canine-v1');
  assert.equal(genomeApi.selectEmbodiment(genome, 'desktop-companion').interactionProfile, 'desktop-reactive');
});

test('factory resolves embodiments through swappable adapters', async () => {
  const factory = new CharacterFactory({ adapters: [
    createDescriptorAdapter({ id: 'descriptor-3d', kinds: ['game-3d'] }),
    createDescriptorAdapter({ id: 'descriptor-pet', kinds: ['desktop-companion'] }),
  ] });
  const pet = factory.create(desktopOnly);
  const output = await factory.embody(pet, 'desktop');
  assert.equal(output.status, 'ready');
  assert.equal(output.adapter, 'descriptor-pet');
  assert.equal(output.characterId, 'tiny-companion');
});

test('invalid wardrobe slots and malformed embodiment ids are rejected', () => {
  assert.throws(() => genomeApi.normalizeCharacterGenome({ ...humanBase, id: 'bad', wardrobe: { slots: { nonsense: { assetId: 'x' } } } }), genomeApi.CharacterGenomeError);
  assert.throws(() => genomeApi.normalizeCharacterGenome({ ...humanBase, id: 'bad2', embodiments: [{ id: 'Not Valid', kind: 'pixel' }] }), genomeApi.CharacterGenomeError);
});
