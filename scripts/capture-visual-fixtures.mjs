import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const outputDir = path.join(root, 'screenshots', 'visual-fixtures');
const ownsServer = !process.env.BASE_URL;
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4197';
const serverUrl = new URL(baseUrl);
const fixtures = [
  'clue',
  'reveal',
  'correct',
  'incorrect',
  'menu',
  'scoreboard',
  'study',
  'voice-listening',
  'voice-speaking',
];
const themes = ['dark', 'light'];
const viewports = [
  ['phone-320', 320, 568],
  ['phone-390', 390, 844],
  ['tablet', 768, 1024],
  ['landscape', 1024, 768],
  ['desktop', 1440, 900],
  ['tall-cabinet', 807, 1189],
];

let server;

async function serverReady() {
  return new Promise((resolve) => {
    const request = http.get(`${baseUrl}/game.html`, (response) => {
      response.resume();
      resolve(response.statusCode >= 200 && response.statusCode < 400);
    });
    request.setTimeout(1500, () => request.destroy());
    request.on('error', () => resolve(false));
  });
}

async function ensureServer() {
  if (!ownsServer) return;
  if (await serverReady()) return;

  const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.gif': 'image/gif',
    '.html': 'text/html; charset=utf-8',
    '.jpeg': 'image/jpeg',
    '.jpg': 'image/jpeg',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
  };

  server = http.createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url || '/', baseUrl).pathname);
    const relativePath = pathname === '/' ? 'game.html' : pathname.replace(/^\/+/, '');
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
  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(Number(serverUrl.port || 80), serverUrl.hostname, resolve);
  });
}

function roundedRect(rect) {
  return Object.fromEntries(Object.entries(rect).map(([key, value]) => [key, Math.round(value * 10) / 10]));
}

await ensureServer();
await fs.rm(outputDir, { recursive: true, force: true });
await fs.mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage();
const failures = [];
const report = [];

try {
  await page.goto(`${baseUrl}/game.html`, { waitUntil: 'domcontentloaded' });
  await page.waitForSelector('#gameContainer');
  await page.waitForFunction(() => {
    const button = document.getElementById('questionButton');
    const container = document.getElementById('gameContainer');
    return button?.disabled === false && container?.dataset.gameMoment === 'clue';
  }, null, { timeout: 30000 });
  await page.addScriptTag({ path: path.join(root, 'src/dev/visual-fixture-state.js') });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addStyleTag({
    content: `
      html { scroll-behavior: auto; }
      [data-visual-fixture] *,
      [data-visual-fixture] *::before,
      [data-visual-fixture] *::after {
        animation: none !important;
        transition: none !important;
      }
    `,
  });

  for (const [viewportName, width, height] of viewports) {
    await page.setViewportSize({ width, height });
    for (const theme of themes) {
      for (const fixture of fixtures) {
        await page.evaluate(({ fixtureName, themeName }) => {
          window.JeoparodyVisualFixtures.apply(document, { fixture: fixtureName, theme: themeName });
        }, { fixtureName: fixture, themeName: theme });
        await page.waitForTimeout(40);

        const geometry = await page.evaluate(() => {
          const selectors = {
            cabinet: '#gameContainer',
            header: '.game-header',
            scoreboard: '#scoreDrawer',
            menu: '#navMenu',
            dialogue: '#speechBubble',
            clueText: '#clueText',
            host: '#hostStage',
            footer: '.control-footer',
            study: '#studyPanel',
            voice: '#voiceButton',
          };
          const result = {};
          for (const [name, selector] of Object.entries(selectors)) {
            const element = document.querySelector(selector);
            if (!element) continue;
            const rect = element.getBoundingClientRect();
            result[name] = { x: rect.x, y: rect.y, width: rect.width, height: rect.height, right: rect.right, bottom: rect.bottom };
          }
          return {
            documentOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
            rects: result,
          };
        });

        const cabinet = geometry.rects.cabinet;
        const hostIsVisible = width > 420 || height > 620;
        const visibleNames = fixture === 'menu'
          ? ['header', 'menu', 'dialogue', ...(hostIsVisible ? ['host'] : []), 'footer']
          : fixture === 'scoreboard'
            ? ['header', 'scoreboard', 'dialogue', ...(hostIsVisible ? ['host'] : []), 'footer']
            : fixture === 'study'
              ? ['header', 'study', 'footer']
            : ['header', 'dialogue', ...(hostIsVisible ? ['host'] : []), 'footer', 'voice'];
        const fixtureFailures = [];
        if (geometry.documentOverflow > 1) fixtureFailures.push(`document overflow ${geometry.documentOverflow}px`);
        for (const name of visibleNames) {
          const rect = geometry.rects[name];
          if (!rect || rect.width < 1 || rect.height < 1) fixtureFailures.push(`${name} has no visible geometry`);
          if (rect && cabinet && (rect.x < cabinet.x - 2 || rect.right > cabinet.right + 2)) fixtureFailures.push(`${name} exceeds cabinet horizontally`);
        }
        const clueRect = geometry.rects.clueText;
        const hostRect = geometry.rects.host;
        if (hostIsVisible && clueRect && hostRect) {
          const overlapWidth = Math.max(0, Math.min(clueRect.right, hostRect.right) - Math.max(clueRect.x, hostRect.x));
          const overlapHeight = Math.max(0, Math.min(clueRect.bottom, hostRect.bottom) - Math.max(clueRect.y, hostRect.y));
          if (overlapWidth * overlapHeight > 1) fixtureFailures.push('host overlaps clue text');
        }

        const id = `${viewportName}-${theme}-${fixture}`;
        await page.screenshot({ path: path.join(outputDir, `${id}.png`), fullPage: true });
        report.push({ id, viewport: { width, height }, fixture, theme, failures: fixtureFailures, geometry: Object.fromEntries(Object.entries(geometry.rects).map(([name, rect]) => [name, roundedRect(rect)])) });
        failures.push(...fixtureFailures.map((failure) => `${id}: ${failure}`));
      }
    }
  }
} finally {
  await browser.close();
  if (ownsServer && server) await new Promise((resolve) => server.close(resolve));
}

await fs.writeFile(path.join(outputDir, 'geometry.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(`Captured ${report.length} visual fixtures in ${path.relative(root, outputDir)}.`);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exitCode = 1;
}
