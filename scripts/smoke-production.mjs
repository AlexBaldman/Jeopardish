import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium, webkit } from 'playwright';

const root = process.cwd();
const staticRoot = path.join(root, 'dist');
const ownsServer = !process.env.BASE_URL;
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4198/';
const base = new URL(baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
const browserNames = (process.env.SMOKE_BROWSERS || 'chromium')
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);
const browsers = { chromium, webkit };
const routes = [
  { id: 'root-game', path: 'index.html', budgetMb: 10, ready: '#gameContainer', interactive: true },
  { id: 'game', path: 'game.html', budgetMb: 10, ready: '#gameContainer', interactive: true },
];

let server;

async function startServer() {
  if (!ownsServer) return;
  const contentTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.webp': 'image/webp',
  };
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
        'Content-Type': contentTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
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

function getArtifactPath(resourceUrl) {
  const url = new URL(resourceUrl);
  if (url.origin !== base.origin || !url.pathname.startsWith(base.pathname)) return null;
  const relativePath = decodeURIComponent(url.pathname.slice(base.pathname.length)) || 'index.html';
  const filePath = path.resolve(staticRoot, relativePath);
  return filePath.startsWith(`${staticRoot}${path.sep}`) ? filePath : null;
}

async function gotoWithRetry(page, url, attempts = 5) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      if (response?.ok()) return response;
      lastError = new Error(`HTTP ${response?.status() || 0} for ${url}`);
    } catch (error) {
      lastError = error;
    }
    await new Promise((resolve) => setTimeout(resolve, attempt * 1000));
  }
  throw lastError;
}

async function auditRoute(browser, browserName, route) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const failures = [];
  const resources = new Set();
  page.on('pageerror', (error) => failures.push(`page error: ${error.message}`));
  page.on('console', (message) => {
    const text = message.text();
    if (message.type() === 'error' && !text.startsWith('Failed to load resource')) {
      failures.push(`console error: ${text}`);
    }
  });
  page.on('response', (response) => {
    const artifactPath = getArtifactPath(response.url());
    if (artifactPath) resources.add(artifactPath);
    if (response.url().startsWith(base.href) && response.status() >= 400) {
      failures.push(`HTTP ${response.status()}: ${response.url()}`);
    }
  });

  try {
    await gotoWithRetry(page, new URL(route.path, base).href);
    await page.waitForSelector(route.ready, { timeout: 15000 });
    if (route.interactive) {
      await page.waitForFunction(() => (
        document.getElementById('gameContainer')?.dataset.gameMoment === 'clue'
        && document.getElementById('questionButton')?.disabled === false
      ), null, { timeout: 30000 });
    }
    await page.waitForTimeout(350);

    const coldResources = new Set(resources);
    let bytes = 0;
    for (const file of coldResources) {
      try {
        bytes += (await fs.stat(file)).size;
      } catch {
        failures.push(`requested file missing from local artifact: ${file}`);
      }
    }
    const megabytes = bytes / 1024 / 1024;
    if (megabytes > route.budgetMb) {
      failures.push(`cold route payload ${megabytes.toFixed(2)} MB exceeds ${route.budgetMb.toFixed(1)} MB`);
    }

    if (route.interactive) {
      const originalTheme = await page.locator('body').getAttribute('data-theme');
      await page.locator('#themeToggle').click();
      await page.waitForFunction(
        (theme) => document.body.dataset.theme !== theme,
        originalTheme,
      );
      await page.locator('#hamburgerMenu').click();
      await page.waitForFunction(() => document.getElementById('navMenu')?.getAttribute('aria-hidden') === 'false');
      const originalControlSkin = await page.locator('#gameContainer').getAttribute('data-control-skin');
      await page.locator('#menuControlSkinNext').click();
      await page.waitForFunction(
        (skin) => document.getElementById('gameContainer')?.dataset.controlSkin !== skin,
        originalControlSkin,
      );
      await page.keyboard.press('Escape');
      await page.waitForFunction(() => document.getElementById('navMenu')?.getAttribute('aria-hidden') === 'true');

      const answer = await page.locator('#answerBox').innerText();
      await page.locator('#inputbox').fill(answer);
      await page.locator('#checkButton').click();
      await page.waitForFunction(
        () => document.getElementById('gameContainer')?.dataset.roundPhase === 'advance-ready',
      );
      const score = Number((await page.locator('#hudScore').innerText()).replace(/[^\d.-]/g, ''));
      if (!(score > 0)) failures.push('correct-answer flow did not increase score');

      await page.locator('#questionButton').click();
      await page.waitForFunction(
        () => document.getElementById('gameContainer')?.dataset.roundPhase === 'answering',
      );
      await page.locator('#deepDiveButton').click();
      await page.waitForFunction(() => (
        document.getElementById('gameContainer')?.dataset.roundPhase === 'paused'
        && document.getElementById('studyPanel')?.hidden === false
      ));
      await page.locator('#studyResume').click();
      await page.waitForFunction(() => (
        document.getElementById('gameContainer')?.dataset.roundPhase === 'advance-ready'
        && document.getElementById('studyPanel')?.hidden === true
      ));
    }
    console.log(
      `${browserName.padEnd(8)} ${route.id.padEnd(14)} `
      + `${megabytes.toFixed(2)} MB across ${coldResources.size} cold first-party resources`,
    );
  } finally {
    await page.close();
  }
  return failures.map((failure) => `${browserName}/${route.id}: ${failure}`);
}

async function auditEmergencyBroadcast(browser, browserName) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  const failures = [];
  page.on('pageerror', (error) => failures.push(`page error: ${error.message}`));
  await page.route('**/questions/**', (route) => route.abort());

  try {
    await gotoWithRetry(page, new URL('game.html', base).href);
    await page.waitForFunction(() => (
      document.getElementById('gameContainer')?.dataset.gameMoment === 'clue'
      && document.getElementById('gameContainer')?.dataset.roundPhase === 'answering'
    ), null, { timeout: 15000 });

    const category = await page.locator('#categoryBox').innerText();
    const clue = await page.locator('#clueText').innerText();
    if (!/signals you can touch/i.test(category) || !/raised-dot positions/i.test(clue)) {
      failures.push('embedded emergency broadcast did not present its first reviewed clue');
    }
    if (/file reading error|works on my machine|ghost in the machine|demo demon/i.test(clue)) {
      failures.push('technical placeholder appeared as playable clue content');
    }
    console.log(
      `${browserName.padEnd(8)} ${'emergency'.padEnd(14)} `
      + 'reviewed embedded clue available with question transport blocked',
    );
  } finally {
    await page.close();
  }

  return failures.map((failure) => `${browserName}/emergency: ${failure}`);
}

async function auditClassicAndEpisodeModes(browser, browserName) {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  const failures = [];
  const classicRequests = [];
  const episodeRequests = [];
  page.on('request', (request) => {
    if (request.url().includes('runtime-bank.json')) classicRequests.push(request.url());
    if (request.url().includes('season-zero-001.json')) episodeRequests.push(request.url());
  });
  page.on('pageerror', (error) => failures.push(`page error: ${error.message}`));

  try {
    await gotoWithRetry(page, new URL('game.html', base).href);
    await page.waitForSelector('#gameContainer', { timeout: 15000 });
    await page.waitForFunction(() => (
      document.getElementById('gameContainer')?.dataset.gameMoment === 'clue'
      && document.getElementById('gameContainer')?.dataset.roundPhase === 'answering'
    ), null, { timeout: 30000 });

    if (classicRequests.length !== 1) {
      failures.push(`classic mode requested the runtime bank ${classicRequests.length} times`);
    }
    if (episodeRequests.length) {
      failures.push('classic mode requested the authored episode');
    }

    const clues = [];
    for (let index = 0; index < 6; index += 1) {
      clues.push(await page.locator('#clueText').innerText());
      await page.locator('#questionButton').click();
      await page.waitForFunction((previous) => (
        document.getElementById('clueText')?.textContent !== previous
        && document.getElementById('gameContainer')?.dataset.roundPhase === 'answering'
      ), clues.at(-1));
    }
    if (new Set(clues).size !== clues.length) {
      failures.push('classic mode repeated a clue during a six-clue sample');
    }
    if (await page.locator('#hudEpisode').innerText() !== '#7') {
      failures.push('classic progress did not advance as an open random run');
    }

    await gotoWithRetry(page, new URL('game.html?mode=episode', base).href);
    await page.waitForFunction(() => (
      document.getElementById('gameContainer')?.dataset.gameMoment === 'clue'
    ), null, { timeout: 30000 });
    if (episodeRequests.length !== 1) {
      failures.push(`episode mode requested its authored pack ${episodeRequests.length} times`);
    }

    console.log(
      `${browserName.padEnd(8)} ${'play-modes'.padEnd(14)} `
      + 'classic served varied archive clues; episode remained explicit',
    );
  } finally {
    await page.close();
  }

  return failures.map((failure) => `${browserName}/play-modes: ${failure}`);
}

await startServer();
const failures = [];
try {
  for (const browserName of browserNames) {
    const browserType = browsers[browserName];
    if (!browserType) throw new Error(`Unsupported smoke browser: ${browserName}`);
    const browser = await browserType.launch({ headless: true });
    try {
      for (const route of routes) {
        failures.push(...await auditRoute(browser, browserName, route));
      }
      failures.push(...await auditEmergencyBroadcast(browser, browserName));
      failures.push(...await auditClassicAndEpisodeModes(browser, browserName));
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
  console.log('Production browser smoke passed.');
}
