import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  DefaultHostPacks,
  HostBeats,
  HostPackError,
  normalizeHostPack,
} = require('../src/host/host-pack.js');

test('default HostPacks provide three immutable bilingual personalities', () => {
  assert.equal(DefaultHostPacks.length, 3);
  assert.equal(new Set(DefaultHostPacks.map(({ id }) => id)).size, 3);
  DefaultHostPacks.forEach((pack) => {
    assert.equal(Object.isFrozen(pack), true);
    assert.ok(pack.personality.teachingStyle);
    assert.ok(pack.personality.boundaries.length >= 4);
    assert.ok(pack.rights.status);
    assert.ok(pack.lineBanks.en[HostBeats.CORRECT][0]);
    assert.ok(pack.lineBanks['pt-BR'][HostBeats.CORRECT][0]);
  });
});

test('HostPack validation rejects missing identity, boundaries, rights, and bilingual lines', () => {
  assert.throws(
    () => normalizeHostPack({
      id: 'Bad Id',
      displayName: '',
      personality: {},
      lineBanks: { en: {}, 'pt-BR': {} },
    }),
    (error) => (
      error instanceof HostPackError
      && error.issues.some((issue) => issue.includes('kebab-case'))
      && error.issues.some((issue) => issue.includes('teachingStyle'))
      && error.issues.some((issue) => issue.includes('boundaries'))
      && error.issues.some((issue) => issue.includes('rights.status'))
      && error.issues.some((issue) => issue.includes('lineBanks.pt-BR.correct'))
    ),
  );
});
