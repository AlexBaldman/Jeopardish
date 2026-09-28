import { createReadStream } from 'node:fs';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const baseUrl = 'http://127.0.0.1:4199';
const outputDir = path.join(root, 'screenshots', 'stadium-visual');

const contentTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.gltf': 'model/gltf+json',
  '.json': 'application/json',
  '.mjs': 'text/javascript; charset=utf-8',
  '.png': 'image/png',
};

const server = http.createServer(async (request, response) => {
  const pathname = decodeURIComponent(new URL(request.url || '/', baseUrl).pathname);
  const relativePath = pathname === '/' ? 'stadium-lab.html' : pathname.replace(/^\/+/, '');
  const filePath = path.resolve(root, relativePath);
  if (!filePath.startsWith(`${root}${path.sep}`)) {
    response.writeHead(403).end();
    return;
  }
  try {
    const stat = await fs.stat(filePath);
    if (!stat.isFile()) throw new Error('Not a file');
    response.writeHead(200, { 'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(404).end('Not found');
  }
});

await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });
await new Promise((resolve, reject) => {
  server.once('error', reject);
  server.listen(4199, '127.0.0.1', resolve);
});

const browser = await chromium.launch({
  headless: true,
  args: [
    '--enable-webgl',
    '--enable-unsafe-swiftshader',
    '--use-gl=angle',
    '--use-angle=swiftshader-webgl',
  ],
});
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (error) => errors.push(`pageerror: ${error.stack || error.message}`));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(`console: ${message.text()}`);
});
page.on('requestfailed', (request) => {
  errors.push(`requestfailed: ${request.url()} · ${request.failure()?.errorText || 'unknown error'}`);
});

async function captureDiagnostics(label, extra = {}) {
  const state = await page.evaluate(() => ({
    ready: window.__stadiumFixtureReady === true,
    fixtureError: window.__stadiumFixtureError || null,
    metrics: window.__stadiumFixtureMetrics || null,
    status: document.getElementById('status')?.textContent || '',
    bodyReady: document.body?.dataset?.stadiumReady || '',
    canvas: (() => {
      const canvas = document.getElementById('stage');
      const rect = canvas?.getBoundingClientRect();
      return rect ? { width: rect.width, height: rect.height } : null;
    })(),
  })).catch((error) => ({ evaluationError: error.message }));
  const diagnostics = { label, errors, state, ...extra };
  await fs.writeFile(path.join(outputDir, 'diagnostics.json'), `${JSON.stringify(diagnostics, null, 2)}\n`);
  await page.screenshot({ path: path.join(outputDir, 'marching-trombonist-failure.png'), fullPage: true }).catch(() => {});
  return diagnostics;
}

try {
  const response = await page.goto(`${baseUrl}/stadium-lab.html`, { waitUntil: 'domcontentloaded' });
  if (!response?.ok()) throw new Error(`stadium lab returned HTTP ${response?.status()}`);

  try {
    await page.waitForFunction(
      () => window.__stadiumFixtureReady === true || Boolean(window.__stadiumFixtureError),
      null,
      { timeout: 15000 },
    );
  } catch (error) {
    const diagnostics = await captureDiagnostics('fixture-ready-timeout', { timeoutError: error.message });
    throw new Error(`stadium fixture did not become ready\n${JSON.stringify(diagnostics, null, 2)}`);
  }

  const state = await page.evaluate(() => ({
    ready: window.__stadiumFixtureReady === true,
    fixtureError: window.__stadiumFixtureError || null,
    metrics: window.__stadiumFixtureMetrics,
    status: document.getElementById('status')?.textContent || '',
    canvas: (() => {
      const canvas = document.getElementById('stage');
      const rect = canvas?.getBoundingClientRect();
      return rect ? { width: rect.width, height: rect.height } : null;
    })(),
  }));

  if (state.fixtureError) throw new Error(`stadium fixture error: ${state.fixtureError}`);
  if (errors.length) throw new Error(`browser errors:\n${errors.join('\n')}`);
  if (!state.ready) throw new Error('stadium fixture did not report ready');
  if (state.metrics?.actions !== 2) throw new Error(`expected 2 animation actions, got ${state.metrics?.actions}`);
  if (state.metrics?.ikChains !== 2) throw new Error(`expected 2 IK chains, got ${state.metrics?.ikChains}`);
  if (state.metrics?.characterId !== 'stadium-trombonist') throw new Error(`unexpected character id: ${state.metrics?.characterId}`);
  if (!state.canvas || state.canvas.width < 1000 || state.canvas.height < 600) throw new Error('stadium canvas is not visibly sized');

  const initial = state.metrics;
  function assertContracts(metrics) {
    const { before, after, samePlan, frozen, prop, ikBindings } = metrics.contracts;
    assert.deepEqual(after, before, 'renderer must preserve serialized contracts');
    assert.equal(samePlan, true, 'runtime must consume the adapter plan itself');
    assert.equal(frozen, true, 'canonical inputs and plan remain immutable');
    assert.equal(before.genome.schema, 'uinverse.character-genome');
    for (const command of [before.locomotion, before.performance]) {
      assert.equal(command.schema, 'uinverse.character-performance');
    }
    assert.equal(after.plan.schema, 'uinverse.stadium-performer-plan');
    assert.equal(after.plan.version, 1);
    assert.equal(after.plan.characterId, before.genome.id);
    assert.equal(after.plan.modelAssetId, before.genome.embodiments[0].representationAssetId);
    assert.deepEqual(after.plan.layers.map(layer => [layer.action, layer.modifiers.speed]),
      [['march', 0.6], ['play-instrument', 0.5]]);
    assert.deepEqual(after.plan.constraints.map(c => [c.target, c.bone, c.grip]),
      [['left-hand', 'Hand_L', 'brace'], ['right-hand', 'Hand_R', 'slide']]);
    assert.deepEqual(prop, { itemId: 'instrument.trombone', node: 'Trombone' });
    assert.deepEqual(ikBindings, [
      { target: 'IK_Target_L', effector: 'Hand_L' },
      { target: 'IK_Target_R', effector: 'Hand_R' },
    ]);
  }
  assertContracts(initial);
  if (initial.asset !== '/assets/stadium/marching-trombonist.gltf') throw new Error('authored GLTF was not loaded');
  if (JSON.stringify(initial.clips) !== JSON.stringify(['march', 'play-instrument'])) throw new Error('authored clips missing');
  if (initial.bones.length !== 15 || !['Hand_L', 'Hand_R', 'IK_Target_L', 'IK_Target_R'].every(name => initial.bones.includes(name))) throw new Error('semantic skeleton missing');
  if (initial.upperTracks.length !== 7 || initial.upperTracks.some(name => /Hips|Thigh|Shin/.test(name))) throw new Error('upper-body mask changed');
  if (initial.skinnedVertices < 100 || initial.triangles < 100) throw new Error('performer geometry missing');
  await page.waitForFunction((frame) => window.__stadiumFixtureMetrics.frameCount >= frame + 20, initial.frameCount);
  const later = await page.evaluate(() => window.__stadiumFixtureMetrics);
  if (later.marchTime === initial.marchTime || JSON.stringify(later.thigh) === JSON.stringify(initial.thigh)) throw new Error('march animation is stationary');
  if (Math.abs(later.slideZ - initial.slideZ) < 0.0001 || Math.abs(later.targetZ - initial.targetZ) < 0.0001) throw new Error('slide/IK target is stationary');
  // The original right target extends beyond the 0.64-unit arm at full slide.
  // Bound inherited solver error; this is not a claim of exact prop contact.
  if (![...initial.handErrors, ...later.handErrors].every(error => Number.isFinite(error) && error < 0.3)) throw new Error(`hand IK contact drift: ${later.handErrors}`);
  if (errors.length) throw new Error(`browser errors: ${errors.join('\n')}`);
  assertContracts(later);
  state.motionSample = later;

  await page.screenshot({ path: path.join(outputDir, 'marching-trombonist.png'), fullPage: true });
  await fs.writeFile(path.join(outputDir, 'metrics.json'), `${JSON.stringify(state, null, 2)}\n`);
  const missingAssetPage = await browser.newPage();
  await missingAssetPage.route('**/assets/stadium/marching-trombonist.gltf', route => route.fulfill({ status: 404, body: 'missing fixture' }));
  await missingAssetPage.goto(`${baseUrl}/stadium-lab.html`);
  await missingAssetPage.waitForFunction(() => Boolean(window.__stadiumFixtureError));
  if (await missingAssetPage.evaluate(() => window.__stadiumFixtureReady === true)) throw new Error('missing asset incorrectly reported ready');
  await missingAssetPage.close();
  console.log(`Stadium visual smoke PASS: ${state.metrics.actions} actions, ${state.metrics.ikChains} IK chains.`);
} catch (error) {
  await captureDiagnostics('smoke-failure', { thrown: error.stack || error.message });
  throw error;
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}


