import { createReadStream } from 'node:fs';
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

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
const errors = [];
page.on('pageerror', (error) => errors.push(error.message));
page.on('console', (message) => {
  if (message.type() === 'error') errors.push(message.text());
});

try {
  const response = await page.goto(`${baseUrl}/stadium-lab.html`, { waitUntil: 'domcontentloaded' });
  if (!response?.ok()) throw new Error(`stadium lab returned HTTP ${response?.status()}`);
  await page.waitForFunction(() => window.__stadiumFixtureReady === true, null, { timeout: 15000 });
  const state = await page.evaluate(() => ({
    metrics: window.__stadiumFixtureMetrics,
    status: document.getElementById('status')?.textContent || '',
    canvas: (() => {
      const canvas = document.getElementById('stage');
      const rect = canvas?.getBoundingClientRect();
      return rect ? { width: rect.width, height: rect.height } : null;
    })(),
  }));

  if (errors.length) throw new Error(`browser errors:\n${errors.join('\n')}`);
  if (state.metrics?.actions !== 2) throw new Error(`expected 2 animation actions, got ${state.metrics?.actions}`);
  if (state.metrics?.ikChains !== 2) throw new Error(`expected 2 IK chains, got ${state.metrics?.ikChains}`);
  if (state.metrics?.characterId !== 'stadium-trombonist') throw new Error(`unexpected character id: ${state.metrics?.characterId}`);
  if (!state.canvas || state.canvas.width < 1000 || state.canvas.height < 600) throw new Error('stadium canvas is not visibly sized');

  await page.screenshot({ path: path.join(outputDir, 'marching-trombonist.png'), fullPage: true });
  await fs.writeFile(path.join(outputDir, 'metrics.json'), `${JSON.stringify(state, null, 2)}\n`);
  console.log(`Stadium visual smoke PASS: ${state.metrics.actions} actions, ${state.metrics.ikChains} IK chains.`);
} finally {
  await browser.close();
  await new Promise((resolve) => server.close(resolve));
}
