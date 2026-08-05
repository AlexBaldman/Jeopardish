import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import AxeBuilder from '@axe-core/playwright';
import { chromium, webkit } from 'playwright';

const root = process.cwd();
const staticRoot = path.join(root, 'dist');
const ownsServer = !process.env.BASE_URL;
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4195/';
const base = new URL(baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
const browserNames = (process.env.A11Y_BROWSERS || 'chromium')
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);
const browsers = { chromium, webkit };
const viewports = [
  { id: 'desktop', width: 1440, height: 900 },
  { id: 'phone', width: 390, height: 844 },
];
const gameStates = [
  'clue',
  'outcome',
  'translated',
  'menu',
  'scoreboard',
  'study',
  'reinforcement',
  'media-modal',
  'complete',
];
let server;

function contentType(filePath) {
  return {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
  }[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
}

async function startServer() {
  if (!ownsServer) return;
  server = http.createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url || '/', base).pathname);
    const relativePath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
    const filePath = path.resolve(staticRoot, relativePath);
    if (!filePath.startsWith(`${staticRoot}${path.sep}`)) {
      response.writeHead(403).end();
      return;
    }
    try {
      const stat = await fs.stat(filePath);
      if (!stat.isFile()) throw new Error('Not a file');
      response.writeHead(200, {
        'Cache-Control': 'no-store',
        'Content-Type': contentType(filePath),
      });
      createReadStream(filePath).pipe(response);
    } catch {
      response.writeHead(404).end('Not found');
    }
  });
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(Number(base.port || 80), base.hostname, resolve);
  });
}

function formatViolations(browserName, viewportId, state, violations) {
  return violations.flatMap((violation) => {
    const summary = `${browserName}/${viewportId}/${state}: ${violation.id} (${violation.impact || 'unknown'})`;
    return violation.nodes.slice(0, 4).map((node) => (
      `${summary} at ${node.target.join(' ')}: ${node.failureSummary || violation.help}`
    ));
  });
}

async function runAxe(page, browserName, viewportId, state) {
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'])
    .analyze();
  console.log(
    `${browserName.padEnd(8)} ${viewportId.padEnd(7)} ${state.padEnd(14)} `
    + `${String(results.passes.length).padStart(3)} rules passed`,
  );
  return formatViolations(browserName, viewportId, state, results.violations);
}

async function openPage(page, route, readySelector) {
  const response = await page.goto(new URL(route, base).href, {
    waitUntil: 'load',
    timeout: 30000,
  });
  if (!response?.ok()) throw new Error(`HTTP ${response?.status() || 0} for ${route}`);
  await page.waitForSelector(readySelector, { timeout: 15000 });
  await page.waitForFunction(() => (
    [...document.styleSheets]
      .filter((sheet) => sheet.href?.startsWith(location.origin))
      .every((sheet) => {
        try {
          return sheet.cssRules.length > 0;
        } catch {
          return false;
        }
      })
  ));
}

async function auditStaticRoute(browser, browserName, viewport, route) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  try {
    await openPage(page, route.path, route.ready);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    return await runAxe(page, browserName, viewport.id, route.id);
  } finally {
    await context.close();
  }
}

async function auditGame(browser, browserName, viewport) {
  const context = await browser.newContext({ viewport });
  const page = await context.newPage();
  const failures = [];
  try {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await openPage(page, 'game.html', '#gameContainer');
    await page.waitForFunction(() => (
      document.getElementById('gameContainer')?.dataset.gameMoment === 'clue'
      && document.getElementById('questionButton')?.disabled === false
    ), null, { timeout: 30000 });
    await page.addScriptTag({
      url: new URL('src/dev/visual-fixture-state.js', base).href,
    });

    for (const state of gameStates) {
      await page.evaluate((fixture) => {
        window.JeoparodyVisualFixtures.apply(document, {
          fixture,
          theme: 'dark',
        });
      }, state);
      if (state === 'translated') {
        await page.hover('#questionBox');
      } else {
        await page.mouse.move(0, 0);
      }
      await page.waitForTimeout(30);
      failures.push(...await runAxe(page, browserName, viewport.id, state));
    }
  } finally {
    await context.close();
  }
  return failures;
}

await startServer();
const failures = [];
try {
  for (const browserName of browserNames) {
    const browserType = browsers[browserName];
    if (!browserType) throw new Error(`Unsupported accessibility browser: ${browserName}`);
    const browser = await browserType.launch({ headless: true });
    try {
      for (const viewport of viewports) {
        failures.push(...await auditStaticRoute(browser, browserName, viewport, {
          id: 'landing',
          path: 'index.html',
          ready: '#heroTitle',
        }));
        failures.push(...await auditGame(browser, browserName, viewport));
      }
    } finally {
      await browser.close();
    }
  }
} finally {
  if (server) await new Promise((resolve) => server.close(resolve));
}

if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
} else {
  console.log('Production accessibility audit passed.');
}
