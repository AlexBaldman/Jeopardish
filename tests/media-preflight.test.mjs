import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { MediaPreflight, isMixedContent } = require('../src/media/media-preflight.js');

test('MediaPreflight accepts clues without media without probing', async () => {
  let probes = 0;
  const preflight = new MediaPreflight({ probe: async () => { probes += 1; return true; } });

  assert.deepEqual(await preflight.checkClue({ category: 'Text' }, []), {
    ok: true,
    checked: 0,
    failures: [],
    skipped: true,
  });
  assert.equal(probes, 0);
});

test('MediaPreflight rejects broken media and selects the next playable clue', async () => {
  const calls = [];
  const preflight = new MediaPreflight({
    locationRef: { href: 'https://game.test/', protocol: 'https:' },
    probe: async (item) => {
      calls.push(item.url);
      return item.url.includes('good')
        ? { ok: true, reason: 'image-loaded' }
        : { ok: false, reason: 'image-error' };
    },
  });
  const candidates = [
    { clue: { category: 'Broken' }, index: 4 },
    { clue: { category: 'Good' }, index: 5 },
  ];
  const selected = await preflight.selectPlayable(candidates, {
    getMedia: (clue) => [{ type: 'image', url: `https://cdn.test/${clue.category.toLowerCase()}.jpg` }],
  });

  assert.equal(selected.clue.category, 'Good');
  assert.equal(selected.attempts, 2);
  assert.deepEqual(calls, [
    'https://cdn.test/broken.jpg',
    'https://cdn.test/good.jpg',
  ]);
});

test('MediaPreflight caches failures so known dead assets are not repeatedly loaded', async () => {
  let probes = 0;
  const preflight = new MediaPreflight({
    probe: async () => { probes += 1; return { ok: false, reason: 'image-error' }; },
  });
  const media = [{ type: 'image', url: 'https://cdn.test/dead.jpg' }];

  await preflight.checkClue({ category: 'First' }, media);
  const second = await preflight.checkClue({ category: 'Second' }, media);

  assert.equal(probes, 1);
  assert.equal(second.failures[0].cached, true);
});

test('MediaPreflight replaces a successful preflight cache entry after a runtime failure', async () => {
  let probes = 0;
  const preflight = new MediaPreflight({
    locationRef: { href: 'https://game.test/', protocol: 'https:' },
    probe: async () => {
      probes += 1;
      return { ok: true, reason: 'image-loaded' };
    },
  });
  const item = { type: 'image', url: '/archive/photo.jpg' };

  assert.equal((await preflight.checkItem(item)).ok, true);
  assert.equal(preflight.markUnavailable(item, 'viewer-error'), true);
  const retried = await preflight.checkItem(item);

  assert.equal(retried.ok, false);
  assert.equal(retried.reason, 'viewer-error');
  assert.equal(retried.cached, true);
  assert.equal(probes, 1);
});

test('MediaPreflight rejects mixed content before invoking the network probe', async () => {
  let probes = 0;
  const locationRef = { href: 'https://game.test/', protocol: 'https:' };
  const preflight = new MediaPreflight({
    locationRef,
    probe: async () => { probes += 1; return true; },
  });
  const result = await preflight.checkItem({ type: 'image', url: 'http://archive.test/photo.jpg' });

  assert.equal(isMixedContent('http://archive.test/photo.jpg', locationRef), true);
  assert.equal(result.ok, false);
  assert.equal(result.reason, 'mixed-content');
  assert.equal(probes, 0);
});

test('MediaPreflight bounds stalled asset checks with a timeout', async () => {
  const preflight = new MediaPreflight({
    timeoutMs: 5,
    probe: () => new Promise(() => {}),
  });
  const result = await preflight.checkItem({ type: 'image', url: 'https://cdn.test/forever.jpg' });

  assert.equal(result.ok, false);
  assert.equal(result.reason, 'timeout');
});
