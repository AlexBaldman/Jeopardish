import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  AVATAR_PACK_SCHEMA,
  DefaultXanderAvatarPack,
  HostAvatarError,
  normalizeHostAvatarPack,
  selectAvatarLook,
} = require('../src/host/host-avatar.js');

test('Xander avatar pack promotes the complete board-short catalog to runtime looks', () => {
  assert.equal(DefaultXanderAvatarPack.schema, AVATAR_PACK_SCHEMA);
  assert.equal(DefaultXanderAvatarPack.hostId, 'xander-trefleck');
  assert.equal(DefaultXanderAvatarPack.looks.length, 12);
  assert.equal(DefaultXanderAvatarPack.inventory.boardShorts.length, 12);
  assert.deepEqual(
    DefaultXanderAvatarPack.looks.map(({ id }) => id).sort(),
    DefaultXanderAvatarPack.inventory.boardShorts.map(({ id }) => id).sort(),
  );
  assert.equal(
    DefaultXanderAvatarPack.inventory.boardShorts.every(({ status }) => status === 'runtime'),
    true,
  );
  assert.equal(DefaultXanderAvatarPack.inventory.specialLooks.length, 6);
  assert.equal(DefaultXanderAvatarPack.inventory.performancePoses.length, 8);
  assert.equal(Object.isFrozen(DefaultXanderAvatarPack), true);
  assert.equal(Object.isFrozen(DefaultXanderAvatarPack.looks[0]), true);
});

test('avatar look selection is stable and avoids the previous show look', () => {
  const first = selectAvatarLook(DefaultXanderAvatarPack, { seed: 'episode:show-7' });
  const repeat = selectAvatarLook(DefaultXanderAvatarPack, { seed: 'episode:show-7' });
  const next = selectAvatarLook(DefaultXanderAvatarPack, {
    seed: 'episode:show-7',
    previousLookId: first.id,
  });

  assert.equal(first.id, repeat.id);
  assert.notEqual(next.id, first.id);
});

test('avatar contracts reject unsafe assets and malformed identities', () => {
  assert.throws(() => normalizeHostAvatarPack({
    id: 'Not Stable',
    hostId: 'host',
    displayName: 'Host',
    looks: [{
      id: 'look',
      label: 'Look',
      src: 'https://example.com/remote.png',
    }],
  }), HostAvatarError);
});
