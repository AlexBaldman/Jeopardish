import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

function resolveRepoPath(relativePath) {
  return path.join(repoRoot, relativePath);
}

async function readText(relativePath) {
  return fs.readFile(resolveRepoPath(relativePath), 'utf8');
}

function extractAttributes(html, attributeName) {
  const pattern = new RegExp(`\\b${attributeName}="([^"]+)"`, 'g');
  return [...html.matchAll(pattern)].map((match) => match[1]);
}

test('index.html keeps the static MVP boot contract intact', async () => {
  const html = await readText('index.html');
  const scripts = extractAttributes(html, 'src').filter((source) => source.endsWith('.js'));

  assert.deepEqual(scripts, [
    'app.js',
  ]);

  const requiredAssets = [
    'style.css',
    'assets/images/favicon.svg',
    'assets/images/trebek-vector.png',
    ...scripts,
  ];

  for (const assetPath of requiredAssets) {
    await assert.doesNotReject(() => fs.access(resolveRepoPath(assetPath)));
  }
});

test('index.html exposes the DOM hooks required by app and view modules', async () => {
  const html = await readText('index.html');
  const requiredIds = [
    'menuToggle',
    'controlPanel',
    'quickModeButton',
    'reviewModeButton',
    'questionButton',
    'answerButton',
    'resetButton',
    'answerForm',
    'inputbox',
    'checkButton',
    'tickerMessage',
    'categoryBox',
    'valueBox',
    'statusMessage',
    'questionBox',
    'answerBox',
    'score',
    'scoreChip',
    'highScore',
    'currentStreak',
    'bestStreak',
    'accuracy',
    'reviewCount',
  ];

  for (const id of requiredIds) {
    assert.match(html, new RegExp(`\\bid="${id}"`), `missing #${id}`);
  }
});

test('runtime question manifest points to generated shards with stable ids', async () => {
  const manifest = JSON.parse(await readText('questions/manifest.json'));

  assert.equal(manifest.strategy, 'fnv1a-id-hash');
  assert.equal(manifest.shards.length, manifest.shardCount);

  for (const [index, shard] of manifest.shards.entries()) {
    assert.equal(shard.id, index);
    assert.equal(shard.file, `shards/${String(index).padStart(3, '0')}.json`);
    await assert.doesNotReject(() => fs.access(resolveRepoPath(`questions/${shard.file}`)));
  }
});
