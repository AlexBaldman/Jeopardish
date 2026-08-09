import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  DIALOGUE_ANCHOR_SCHEMA,
  DIALOGUE_ANCHOR_VERSION,
  DialogueAnchorRegions,
  computeDialogueAnchor,
  normalizeRect,
} = require('../src/presentation/dialogue-anchor.js');

test('dialogue anchor computes a deterministic card-bottom attachment and CSS values', () => {
  const dialogue = { left: 100, top: 50, width: 600, height: 300 };
  const host = { left: 450, top: 410, width: 100, height: 200 };
  const first = computeDialogueAnchor(dialogue, host);
  const repeat = computeDialogueAnchor(dialogue, host);

  assert.deepEqual(first, repeat);
  assert.equal(first.schema, DIALOGUE_ANCHOR_SCHEMA);
  assert.equal(first.version, DIALOGUE_ANCHOR_VERSION);
  assert.equal(first.region, 'center');
  assert.deepEqual(first.target, { x: 500, y: 510 });
  assert.deepEqual(first.attachment, {
    x: 500, y: 350, localX: 400, localY: 300, ratio: 0.667, clamped: false,
  });
  assert.deepEqual(first.cssVariables, {
    '--dialogue-tail-anchor': '66.667%',
    '--dialogue-tail-x': '66.667%',
    '--dialogue-tail-reach': '160px',
    '--dialogue-tail-angle': '0deg',
    '--dialogue-tail-anchor-px': '400px',
    '--dialogue-tail-target-x': '400px',
    '--dialogue-tail-target-y': '460px',
    '--dialogue-anchor-transition-ms': '180ms',
  });
});

test('host positions classify left, center, and right', () => {
  const dialogue = { x: 0, y: 0, width: 900, height: 400 };

  assert.equal(computeDialogueAnchor(dialogue, { x: 40, y: 500, width: 100, height: 100 }).region, 'left');
  assert.equal(computeDialogueAnchor(dialogue, { x: 400, y: 500, width: 100, height: 100 }).region, 'center');
  assert.equal(computeDialogueAnchor(dialogue, { x: 760, y: 500, width: 100, height: 100 }).region, 'right');
  assert.deepEqual(DialogueAnchorRegions, ['left', 'center', 'right']);
});

test('hosts outside either card edge clamp to a safe inset while preserving the target', () => {
  const dialogue = { left: 100, top: 20, right: 500, bottom: 220 };
  const farLeft = computeDialogueAnchor(dialogue, { left: -300, top: 250, width: 80, height: 120 });
  const farRight = computeDialogueAnchor(dialogue, { left: 900, top: 250, width: 80, height: 120 });

  assert.deepEqual(farLeft.target, { x: -260, y: 310 });
  assert.equal(farLeft.attachment.localX, 32);
  assert.equal(farLeft.attachment.clamped, true);
  assert.equal(farLeft.region, 'left');
  assert.deepEqual(farRight.target, { x: 940, y: 310 });
  assert.equal(farRight.attachment.localX, 368);
  assert.equal(farRight.attachment.clamped, true);
  assert.equal(farRight.region, 'right');
});

test('invalid host geometry safely falls back to the card center', () => {
  const result = computeDialogueAnchor(
    { left: 20, top: 30, width: 300, height: 180 },
    { left: NaN, top: 400, width: 0, height: -4 },
  );

  assert.equal(result.valid, false);
  assert.equal(result.renderable, true);
  assert.equal(result.fallback, 'invalid-host');
  assert.equal(result.region, 'center');
  assert.deepEqual(result.target, { x: 170, y: 210 });
  assert.equal(result.cssVariables['--dialogue-tail-anchor'], '50%');
  assert.equal(result.cssVariables['--dialogue-tail-x'], '50%');

  const invalidOrigin = computeDialogueAnchor(
    { left: 20, top: 30, width: 300, height: 180 },
    { left: NaN, top: 400, width: 100, height: 100 },
  );
  assert.equal(invalidOrigin.fallback, 'invalid-host');
});

test('invalid or zero dialogue geometry returns finite non-renderable fallback values', () => {
  for (const dialogue of [null, {}, { x: 4, y: 5, width: 0, height: 10 }, { width: Infinity, height: 20 }]) {
    const result = computeDialogueAnchor(dialogue, { x: 10, y: 20, width: 40, height: 80 });

    assert.equal(result.valid, false);
    assert.equal(result.renderable, false);
    assert.equal(result.fallback, 'invalid-dialogue');
    assert.equal(result.region, 'center');
    assert.equal(result.cssVariables['--dialogue-tail-anchor'], '50%');
    assert.doesNotMatch(JSON.stringify(result), /NaN|Infinity/);
  }
});

test('DOMRect-shaped snapshots normalize without requiring browser globals', () => {
  const normalized = normalizeRect({ left: 12, top: 24, right: 212, bottom: 124 });
  assert.deepEqual(normalized, {
    left: 12, top: 24, right: 212, bottom: 124, width: 200, height: 100, valid: true,
  });
  assert.equal(Object.isFrozen(normalized), true);
  assert.equal(typeof globalThis.DOMRect, 'undefined');
});

test('reduced motion disables interpolation and all nested output is immutable', () => {
  const reduced = computeDialogueAnchor(
    { x: 0, y: 0, width: 100, height: 100 },
    { x: 80, y: 100, width: 20, height: 100 },
    { edgeInsetPx: 200, reducedMotion: true, transitionMs: 9000 },
  );

  assert.deepEqual(reduced.motion, { reduced: true, transitionMs: 0 });
  assert.equal(reduced.cssVariables['--dialogue-anchor-transition-ms'], '0ms');
  assert.equal(reduced.attachment.localX, 50);
  assert.equal(Object.isFrozen(reduced), true);
  assert.equal(Object.isFrozen(reduced.attachment), true);
  assert.equal(Object.isFrozen(reduced.cssVariables), true);
  assert.throws(() => {
    reduced.attachment.localX = 12;
  }, TypeError);
});

test('host feature anchors drive a bounded connector angle and reach', () => {
  const result = computeDialogueAnchor(
    { x: 100, y: 50, width: 600, height: 300 },
    { x: 130, y: 380, width: 200, height: 400 },
    { hostAnchor: { x: 0.5, y: 0.245 } },
  );

  assert.deepEqual(result.target, { x: 230, y: 478 });
  assert.equal(result.region, 'left');
  assert.equal(result.cssVariables['--dialogue-tail-x'], '21.667%');
  assert.equal(result.cssVariables['--dialogue-tail-reach'], '128px');
  assert.equal(result.cssVariables['--dialogue-tail-angle'], '0deg');
});
