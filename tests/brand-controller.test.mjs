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
  assert.ok(O_TOKENS.includes('coin'));
  assert.equal(O_TOKEN_LABELS.coin, 'counterfeit coin');
});

test('BrandController ignores unknown tokens', () => {
  const brand = new BrandController({ documentRef: null });

  assert.equal(brand.setToken('eclipse'), 'eclipse');
  assert.equal(brand.setToken('questionable-poutine'), 'eclipse');
});
