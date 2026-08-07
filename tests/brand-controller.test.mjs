import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { BrandController, O_TOKENS, O_TOKEN_LABELS } = require('../src/brand/brand-controller.js');

test('BrandController cycles and wraps interchangeable O tokens', () => {
  const brand = new BrandController({ documentRef: null, tokens: ['portal', 'donut', 'eye'] });

  assert.equal(brand.getToken(), 'portal');
  assert.equal(brand.cycle(), 'donut');
  assert.equal(brand.cycle(2), 'portal');
  assert.equal(brand.cycle(-1), 'eye');
  assert.equal(O_TOKENS[0], 'intruder');
  assert.ok(O_TOKENS.includes('coin'));
  assert.equal(O_TOKEN_LABELS.intruder, 'unauthorized letter');
  assert.equal(O_TOKEN_LABELS.coin, 'counterfeit coin');
});

test('BrandController ignores unknown tokens', () => {
  const brand = new BrandController({ documentRef: null });

  assert.equal(brand.setToken('eclipse'), 'eclipse');
  assert.equal(brand.setToken('questionable-poutine'), 'eclipse');
});

test('BrandController opens the internal room only after seven quick local activations', () => {
  let time = 1000;
  const destinations = [];
  const brand = new BrandController({
    documentRef: { body: { dataset: {} } },
    locationRef: {
      hostname: '127.0.0.1',
      protocol: 'http:',
      assign: (destination) => destinations.push(destination),
    },
    now: () => time,
  });

  for (let index = 0; index < 6; index += 1) {
    brand.activate();
    time += 300;
  }
  assert.deepEqual(destinations, []);
  brand.activate();
  assert.deepEqual(destinations, ['creative-room.html']);
});

test('BrandController never exposes the internal room from a public host', () => {
  const destinations = [];
  const brand = new BrandController({
    documentRef: null,
    locationRef: {
      hostname: 'alexbaldman.github.io',
      protocol: 'https:',
      assign: (destination) => destinations.push(destination),
    },
  });

  for (let index = 0; index < 14; index += 1) brand.activate();
  assert.deepEqual(destinations, []);
});

test('BrandController keeps internal navigation closed in a production build preview', () => {
  const destinations = [];
  const brand = new BrandController({
    documentRef: { body: { dataset: { releaseChannel: 'production' } } },
    locationRef: {
      hostname: '127.0.0.1',
      protocol: 'http:',
      assign: (destination) => destinations.push(destination),
    },
  });

  for (let index = 0; index < 7; index += 1) brand.activate();
  assert.deepEqual(destinations, []);
});
