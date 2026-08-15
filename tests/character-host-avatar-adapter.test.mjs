import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { CharacterFactory } = require('../src/character/character-factory.js');
const { createHostAvatarAdapter, toHostAvatarPack } = require('../src/character/host-avatar-adapter.js');

const hostGenome = {
  id: 'schmalex-letrec',
  displayName: 'Schmalex LeTrec',
  identity: { archetype: 'beach-game-show-host' },
  appearance: { materialProfile: 'premium-pixel', skinProfile: 'channel-o-neon-surf' },
  wardrobe: {
    slots: {
      shirt: { assetId: 'garment.hot-pink-camp-shirt' },
      legs: { assetId: 'garment.broadcast-grid-board-shorts' },
      eyes: { assetId: 'accessory.yellow-wayfarers' },
      neck: { assetId: 'accessory.gold-chain' },
    },
  },
  rig: { family: 'humanoid-v1' },
  animation: {
    locomotionSet: 'host-idle',
    performanceSets: ['clue', 'correct', 'incorrect', 'reveal'],
  },
  embodiments: [{
    id: 'broadcast-pixel',
    kind: 'pixel',
    renderer: 'sprite',
    representationAssetId: 'assets/hosts/xander/v1/looks/broadcast-grid-black.png',
    animationSet: ['streak'],
  }],
  provenance: { source: 'authored', generator: 'character-factory', generatorVersion: '1' },
  rights: { status: 'prototype-original-review-required', notes: 'Review before commercial release.' },
};

test('CharacterGenome pixel embodiment maps into HostAvatarPack', () => {
  const pack = toHostAvatarPack(hostGenome, 'broadcast-pixel');
  assert.equal(pack.schema, 'jeoparody.host-avatar');
  assert.equal(pack.hostId, 'schmalex-letrec');
  assert.equal(pack.looks[0].visuals.idle, 'assets/hosts/xander/v1/looks/broadcast-grid-black.png');
  assert.match(pack.looks[0].wardrobe.shirt, /hot-pink-camp-shirt/);
  assert.ok(pack.inventory.performancePoses.some(({ id }) => id === 'clue'));
  assert.equal(pack.rights.status, 'prototype-original-review-required');
});

test('adapter plugs into CharacterFactory without changing the genome contract', async () => {
  const factory = new CharacterFactory({ adapters: [createHostAvatarAdapter()] });
  const genome = factory.create(hostGenome);
  const output = await factory.embody(genome, 'broadcast-pixel');
  assert.equal(output.status, 'ready');
  assert.equal(output.characterId, 'schmalex-letrec');
  assert.equal(output.hostAvatarPack.hostId, genome.id);
});

test('host adapter rejects 3D embodiments and non-project asset references', () => {
  const threeD = { ...hostGenome, id: 'three-d', embodiments: [{ id: 'stage', kind: 'game-3d', representationAssetId: 'assets/model.glb' }] };
  assert.throws(() => toHostAvatarPack(threeD, 'stage'), /does not support/);

  const remote = { ...hostGenome, id: 'remote', embodiments: [{ id: 'pixel', kind: 'pixel', representationAssetId: 'https://example.com/host.png' }] };
  assert.throws(() => toHostAvatarPack(remote, 'pixel'), /project-local/);
});
