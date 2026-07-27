import assert from 'node:assert/strict';
import { createReadStream } from 'node:fs';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium, webkit } from 'playwright';

const root = process.cwd();
const staticRoot = path.join(root, 'dist');
const episode = JSON.parse(
  await fs.readFile(path.join(root, 'questions/episodes/season-zero-001.json'), 'utf8'),
);
const sessionKey = 'jeoparody.session.season-zero';
const ownsServer = !process.env.BASE_URL;
const baseUrl = process.env.BASE_URL || 'http://127.0.0.1:4196/';
const base = new URL(baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`);
const browserNames = (process.env.PROOF_BROWSERS || 'chromium')
  .split(',')
  .map((name) => name.trim())
  .filter(Boolean);
const browsers = { chromium, webkit };
let server;

function getContentType(filePath) {
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
    const relativePath = pathname === '/' ? 'game.html' : pathname.replace(/^\/+/, '');
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
        'Content-Type': getContentType(filePath),
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

async function gotoGame(page) {
  const response = await page.goto(new URL('game.html', base).href, {
    waitUntil: 'domcontentloaded',
    timeout: 30000,
  });
  assert.equal(response?.ok(), true, 'game route must return a successful response');
  await page.waitForSelector('#gameContainer');
}

async function readSession(page) {
  return page.evaluate((key) => JSON.parse(localStorage.getItem(key) || 'null'), sessionKey);
}

async function waitForClue(page, clueId) {
  await page.waitForFunction(({ key, expectedId }) => {
    const session = JSON.parse(localStorage.getItem(key) || 'null');
    const currentId = session?.clueIds?.[session.cursor];
    const container = document.getElementById('gameContainer');
    const button = document.getElementById('checkButton');
    return currentId === expectedId
      && container?.dataset.roundPhase === 'answering'
      && button?.disabled === false;
  }, { key: sessionKey, expectedId: clueId }, { timeout: 30000 });
}

async function waitForLatestResult(page, expectedCount) {
  await page.waitForFunction(({ key, count }) => {
    const session = JSON.parse(localStorage.getItem(key) || 'null');
    return session?.results?.length === count;
  }, { key: sessionKey, count: expectedCount });
  const session = await readSession(page);
  return session.results.at(-1);
}

async function submitAnswer(page, answer, resultCount) {
  await page.locator('#inputbox').fill(answer);
  await page.locator('#checkButton').click();
  await page.waitForFunction(
    () => document.getElementById('gameContainer')?.dataset.roundPhase === 'advance-ready',
  );
  return waitForLatestResult(page, resultCount);
}

async function setConfidence(page, buttonSelector, expectedValue) {
  await page.locator(buttonSelector).click();
  await page.waitForFunction(({ key, value }) => {
    const session = JSON.parse(localStorage.getItem(key) || 'null');
    return session?.results?.at?.(-1)?.confidence === value;
  }, { key: sessionKey, value: expectedValue });
}

async function advance(page, clueId, { keyboard = false } = {}) {
  if (keyboard) {
    await page.keyboard.press('Enter');
  } else {
    await page.locator('#questionButton').click();
  }
  await waitForClue(page, clueId);
}

async function installTranslationStub(page) {
  await page.route('https://api.mymemory.translated.net/**', async (route) => {
    const text = new URL(route.request().url()).searchParams.get('q') || '';
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        responseData: { translatedText: `PT ${text}` },
      }),
    });
  });
}

function collectRuntimeFailures(page, browserName, label) {
  const failures = [];
  page.on('pageerror', (error) => failures.push(`${browserName}/${label}: ${error.message}`));
  page.on('console', (message) => {
    const text = message.text();
    if (message.type() === 'error' && !text.startsWith('Failed to load resource')) {
      failures.push(`${browserName}/${label}: console error: ${text}`);
    }
  });
  page.on('response', (response) => {
    if (response.url().startsWith(base.href) && response.status() >= 400) {
      failures.push(`${browserName}/${label}: HTTP ${response.status()} ${response.url()}`);
    }
  });
  return failures;
}

async function runEpisodeProof(browser, browserName) {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  const failures = collectRuntimeFailures(page, browserName, 'episode');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.addInitScript(() => {
    Object.defineProperty(globalThis, 'SpeechRecognition', {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(globalThis, 'webkitSpeechRecognition', {
      configurable: true,
      value: undefined,
    });
    Object.defineProperty(globalThis, 'Translator', {
      configurable: true,
      value: undefined,
    });
  });
  await installTranslationStub(page);

  try {
    await gotoGame(page);
    const clueIds = episode.clues.slice(0, episode.episodeLength).map(({ id }) => id);
    await waitForClue(page, clueIds[0]);

    assert.equal(await page.locator('#voiceButton').isDisabled(), true);
    assert.equal(await page.locator('#inputbox').isEnabled(), true);

    const exact = await submitAnswer(page, 'Braille', 1);
    assert.equal(exact.isCorrect, true);
    assert.equal(exact.reason, 'exact');
    await setConfidence(page, '#confidenceKnew', 'knew-it');

    await advance(page, clueIds[1], { keyboard: true });
    const alias = await submitAnswer(page, 'rip tide', 2);
    assert.equal(alias.isCorrect, true);
    assert.equal(alias.reason, 'variation');
    await setConfidence(page, '#confidenceShaky', 'shaky');
    await page.locator('#disputeButton').click();
    await page.waitForFunction((key) => (
      JSON.parse(localStorage.getItem(key) || 'null')?.results?.at?.(-1)?.disputed === true
    ), sessionKey);

    await advance(page, clueIds[2]);
    const fuzzy = await submitAnswer(page, 'ozne', 3);
    assert.equal(fuzzy.isCorrect, true);
    assert.equal(fuzzy.reason, 'fuzzy');
    await setConfidence(page, '#confidenceLearned', 'learned-it');

    await advance(page, clueIds[3]);
    const incorrect = await submitAnswer(page, 'banana', 4);
    assert.equal(incorrect.isCorrect, false);
    assert.equal(incorrect.score, 0);

    await advance(page, clueIds[4]);
    await page.locator('#answerButton').click();
    await page.waitForFunction(
      () => document.getElementById('gameContainer')?.dataset.roundPhase === 'advance-ready',
    );
    const revealed = await waitForLatestResult(page, 5);
    assert.equal(revealed.outcome, 'revealed');
    await setConfidence(page, '#confidenceLearned', 'learned-it');
    await page.locator('#deepDiveButton').click();
    await page.waitForFunction(() => (
      document.getElementById('gameContainer')?.dataset.roundPhase === 'paused'
      && document.getElementById('studyPanel')?.hidden === false
    ));
    assert.equal(await page.locator('#studySources a').count(), 1);
    await page.locator('[data-study-action="quiz"]').click();
    assert.match(await page.locator('#studyReinforcementPrompt').innerText(), /Which character/i);
    await page.locator('#studyReinforcementInput').fill('Marcellus');
    await page.locator('#studyReinforcementCheck').click();
    await page.waitForFunction(() => (
      document.getElementById('studyReinforcementResult')?.dataset.state === 'correct'
    ));
    const scoreBeforeStudyResume = await page.locator('#hudScore').innerText();
    await page.locator('#studyResume').click();
    await page.waitForFunction(() => (
      document.getElementById('gameContainer')?.dataset.roundPhase === 'advance-ready'
      && document.getElementById('studyPanel')?.hidden === true
    ));
    assert.equal(await page.locator('#hudScore').innerText(), scoreBeforeStudyResume);

    await advance(page, clueIds[5]);
    await page.locator('#languageToggle').click();
    await page.waitForFunction(() => (
      document.body.dataset.language === 'pt-BR'
      && document.querySelector('.category-primary')?.textContent?.startsWith('PT ')
      && document.getElementById('clueText')?.textContent?.startsWith('PT ')
      && document.getElementById('answerBox')?.textContent?.startsWith('PT ')
    ));
    assert.match(await page.locator('.category-original').textContent(), /^EN /);
    assert.match(await page.locator('#clueOriginal').textContent(), /^EN /);
    assert.equal(await page.locator('.category-original').isVisible(), false);
    assert.equal(await page.locator('#clueOriginal').isVisible(), false);
    await page.locator('#questionBox').hover();
    await page.waitForFunction(() => {
      const category = document.querySelector('.category-original');
      const clue = document.getElementById('clueOriginal');
      return Number.parseFloat(getComputedStyle(category).opacity) > 0
        && Number.parseFloat(getComputedStyle(clue).opacity) > 0;
    });
    assert.equal(await page.locator('.category-original').isVisible(), true);
    assert.equal(await page.locator('#clueOriginal').isVisible(), true);
    const localizedAnswer = await page.locator('#answerBox').innerText();
    const localized = await submitAnswer(page, localizedAnswer, 6);
    assert.equal(localized.isCorrect, true);
    await page.locator('#languageToggle').click();
    await page.waitForFunction(() => document.body.dataset.language === 'en');

    await advance(page, clueIds[6]);
    const scoreBeforeRefresh = Number(
      (await page.locator('#hudScore').innerText()).replace(/[^\d.-]/g, ''),
    );
    await page.reload({ waitUntil: 'domcontentloaded' });
    await waitForClue(page, clueIds[6]);
    const scoreAfterRefresh = Number(
      (await page.locator('#hudScore').innerText()).replace(/[^\d.-]/g, ''),
    );
    assert.equal(scoreAfterRefresh, scoreBeforeRefresh);

    const ada = await submitAnswer(page, 'Ada Lovelace', 7);
    assert.equal(ada.isCorrect, true);
    await advance(page, clueIds[7]);
    await page.waitForFunction(() => (
      document.querySelector('.media-thumbnail')?.naturalWidth > 0
    ));
    await page.locator('.media-preview').click();
    await page.waitForFunction(() => (
      document.getElementById('mediaModal')?.getAttribute('aria-hidden') === 'false'
    ));
    assert.equal(await page.locator('#mediaModalBody img').count(), 1);
    await page.locator('#mediaModalClose').click();
    await page.waitForFunction(() => (
      document.getElementById('mediaModal')?.getAttribute('aria-hidden') === 'true'
    ));
    assert.equal((await submitAnswer(page, 'Saturn', 8)).isCorrect, true);

    await advance(page, clueIds[8]);
    assert.equal(
      (await submitAnswer(page, 'Transcontinental Railroad', 9)).isCorrect,
      true,
    );
    await advance(page, clueIds[9]);
    assert.equal((await submitAnswer(page, 'Ocean', 10)).isCorrect, true);
    await page.keyboard.press('Enter');
    await page.waitForFunction(() => (
      document.getElementById('gameContainer')?.dataset.gameMoment === 'complete'
    ));
    assert.match(await page.locator('#questionBox').innerText(), /BROADCAST O/);
    assert.match(await page.locator('#answerBox').innerText(), /10 clues aired/);
    assert.equal(
      (await page.locator('#reviewQueueButton').innerText()).toLowerCase(),
      'review 2 saved clues',
    );

    await page.locator('#reviewQueueButton').click();
    await page.waitForFunction(() => (
      document.getElementById('studyPanel')?.hidden === false
    ));
    await page.locator('[data-study-action="quiz"]').click();
    assert.match(await page.locator('#studyReinforcementPrompt').innerText(), /earlier Apollo mission/i);
    await page.locator('#studyReinforcementInput').fill('Apollo 8');
    await page.locator('#studyReinforcementCheck').click();
    await page.waitForFunction(() => (
      document.getElementById('studyReinforcementResult')?.dataset.state === 'correct'
    ));
    await page.locator('#studyResume').click();
    await page.waitForFunction(() => (
      document.getElementById('studyPanel')?.hidden === true
    ));
    assert.equal(
      (await page.locator('#reviewQueueButton').innerText()).toLowerCase(),
      'review 1 saved clue',
    );

    await page.locator('#reviewQueueButton').click();
    await page.waitForFunction(() => (
      document.getElementById('studyPanel')?.hidden === false
    ));
    await page.locator('[data-study-action="quiz"]').click();
    assert.match(await page.locator('#studyReinforcementPrompt').innerText(), /direction should a swimmer/i);
    await page.locator('#studyReinforcementInput').fill('parallel to shore');
    await page.locator('#studyReinforcementCheck').click();
    await page.waitForFunction(() => (
      document.getElementById('studyReinforcementResult')?.dataset.state === 'correct'
    ));
    await page.locator('#studyResume').click();
    await page.waitForFunction(() => (
      document.getElementById('studyPanel')?.hidden === true
    ));
    assert.equal(await page.locator('#reviewQueueButton').isHidden(), true);
    assert.match(await page.locator('#reviewQueueStatus').innerText(), /review queue clear/);

    await page.locator('#questionButton').click();
    await waitForClue(page, clueIds[0]);
    const replaySession = await readSession(page);
    assert.equal(replaySession.cursor, 0);
    assert.equal(replaySession.results.length, 0);
  } finally {
    await context.close();
  }

  assert.deepEqual(failures, []);
}

function createResumeSession(cursor) {
  const clueIds = episode.clues.slice(0, episode.episodeLength).map(({ id }) => id);
  const results = clueIds.slice(0, cursor).map((clueId, index) => ({
    clueId,
    outcome: 'correct',
    isCorrect: true,
    creditEligible: true,
    reason: 'exact',
    scoreDelta: 200,
    score: (index + 1) * 200,
    currentStreak: index + 1,
    bestStreak: index + 1,
    confidence: null,
    disputed: false,
    completedAt: '2026-07-27T12:00:00.000Z',
  }));
  return {
    version: 3,
    episodeId: episode.id,
    contentRevision: episode.contentRevision,
    sequenceMode: episode.sequenceMode,
    clueIds,
    cursor,
    results,
    status: 'active',
    startedAt: '2026-07-27T12:00:00.000Z',
    updatedAt: '2026-07-27T12:00:00.000Z',
  };
}

async function runMediaStandbyProof(browser, browserName) {
  const context = await browser.newContext({ viewport: { width: 1000, height: 760 } });
  const page = await context.newPage();
  const failures = collectRuntimeFailures(page, browserName, 'media-standby');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const resumeSession = createResumeSession(7);
  await page.addInitScript(({ key, value }) => {
    localStorage.setItem(key, JSON.stringify(value));
  }, { key: sessionKey, value: resumeSession });
  await page.route('**/assets/episodes/season-zero/saturn-rings.svg', (route) => route.abort());

  try {
    await gotoGame(page);
    const standby = episode.clues.find(({ performance }) => (
      performance?.standbyFor === 's0e1-08-saturn'
    ));
    assert.ok(standby);
    await waitForClue(page, standby.id);
    assert.match(await page.locator('#questionBox').innerText(), /Atomic number 11/);
    const session = await readSession(page);
    assert.equal(session.cursor, 7);
    assert.equal(session.clueIds[7], standby.id);
    assert.equal(session.results.length, 7);
    assert.equal((await submitAnswer(page, 'Sodium', 8)).isCorrect, true);
  } finally {
    await context.close();
  }

  assert.deepEqual(failures, []);
}

await startServer();
const failures = [];
try {
  for (const browserName of browserNames) {
    const browserType = browsers[browserName];
    if (!browserType) throw new Error(`Unsupported proof browser: ${browserName}`);
    const browser = await browserType.launch({ headless: true });
    try {
      await runEpisodeProof(browser, browserName);
      await runMediaStandbyProof(browser, browserName);
      console.log(`${browserName}: Season Zero episode and media-standby proof passed.`);
    } catch (error) {
      failures.push(`${browserName}: ${error.stack || error.message || error}`);
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
  console.log('Season Zero production proof passed.');
}
