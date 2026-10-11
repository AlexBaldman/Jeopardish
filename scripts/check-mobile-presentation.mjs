import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { chromium, webkit, devices } from 'playwright';

const root = process.cwd();
const outputDir = path.resolve(process.env.MOBILE_OUTPUT_DIR || 'screenshots/mobile-presentation');
await fs.mkdir(outputDir, { recursive: true });
const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.svg': 'image/svg+xml', '.webp': 'image/webp' };
let server;
let baseUrl = process.env.BASE_URL;
if (!baseUrl) {
  const dist = path.join(root, 'dist');
  server = http.createServer(async (request, response) => {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = path.resolve(dist, `.${pathname === '/' ? '/index.html' : pathname}`);
    if (!file.startsWith(`${dist}${path.sep}`)) return response.writeHead(403).end();
    try {
      const content = await fs.readFile(file);
      response.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' }).end(content);
    } catch { response.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  baseUrl = `http://127.0.0.1:${server.address().port}/`;
}
const gameUrl = new URL('game.html', baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`).href;
const viewports = [[320,568], [375,667], [390,844], [414,896], [844,390], [768,1024], [1440,900]];
const report = [];

async function ready(page) {
  await page.goto(gameUrl, { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => document.getElementById('gameContainer')?.dataset.roundPhase === 'answering');
}

function overlaps(a, b) {
  return Math.min(a.right, b.right) > Math.max(a.x, b.x) + 1
    && Math.min(a.bottom, b.bottom) > Math.max(a.y, b.y) + 1;
}

try {
  for (const [engine, browserType] of Object.entries({ chromium, webkit })) {
    let browser = await browserType.launch();
    try {
      for (const [width, height] of viewports) {
        const page = await browser.newPage({
          ...(width < 500 || height < 500 ? devices['iPhone 13'] : {}),
          viewport: { width, height }, reducedMotion: 'reduce',
        });
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await ready(page);
        await page.addScriptTag({ path: path.join(root, 'src/dev/visual-fixture-state.js') });
        await page.addStyleTag({ content: '*,*::before,*::after { animation:none!important; transition:none!important; }' });
        for (const theme of ['dark', 'light']) {
          for (const dialogue of ['clue-card', 'speech', 'thought', 'narration']) {
            await page.evaluate(({ theme, dialogue }) => {
              window.JeoparodyVisualFixtures.apply(document, { fixture: 'clue', theme, dialogue });
              window.dispatchEvent(new Event('resize'));
            }, { theme, dialogue });
            await page.evaluate(() => document.fonts.ready);
            const settling = await page.evaluate(() => new Promise((resolve, reject) => {
              const bubble = document.getElementById('speechBubble');
              const before = bubble.style.getPropertyValue('--dialogue-tail-origin-x');
              const started = performance.now();
              const timeout = setTimeout(() => reject(new Error('Browser did not complete the layout frames')), 10000);
              requestAnimationFrame(() => requestAnimationFrame(() => {
                clearTimeout(timeout);
                resolve({ before, after: bubble.style.getPropertyValue('--dialogue-tail-origin-x'), elapsedMs: performance.now() - started });
              }));
            }));
            if (settling.before !== settling.after) console.log(`${engine}-${width}x${height}-${dialogue}: tail synchronized after ${Math.round(settling.elapsedMs)}ms (${settling.before} → ${settling.after}).`);
            const id = `${engine}-${width}x${height}-${theme}-${dialogue}`;
            await page.screenshot({ path: path.join(outputDir, `${id}.png`) });
            const geometry = await page.evaluate(() => {
              const rect = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
              const bubble = document.getElementById('speechBubble');
              const card = bubble.getBoundingClientRect();
              const css = getComputedStyle(bubble);
              const tail = getComputedStyle(bubble, '::after');
              const matrix = new DOMMatrix(tail.transform === 'none' ? undefined : tail.transform);
              const target = {
                x: card.x + parseFloat(css.getPropertyValue('--dialogue-tail-target-x')),
                y: card.y + parseFloat(css.getPropertyValue('--dialogue-tail-target-y')),
              };
              const reach = parseFloat(css.getPropertyValue('--dialogue-tail-reach'));
              const tip = {
                x: card.x + parseFloat(css.borderLeftWidth) + parseFloat(tail.left) + parseFloat(tail.width) / 2 + matrix.e + matrix.c * reach,
                y: card.y + parseFloat(css.borderTopWidth) + parseFloat(tail.top) + matrix.f + matrix.d * reach,
              };
              return { host: rect('#hostAvatar'), card: rect('#speechBubble'), clue: rect('#clueText'), study: rect('#deepDiveButton'), footer: rect('.control-footer'), cabinet: rect('#gameContainer'), target, tip, tailDisplay: tail.display, tailVisible: bubble.dataset.dialogueTailVisible, overflow: css.overflow };
            });
            assert.ok(geometry.host.width >= (height <= 620 && width < 421 ? 87 : 111), `${id}: host too small`);
            assert.ok(!overlaps(geometry.host, geometry.clue), `${id}: host covers clue`);
            assert.ok(!overlaps(geometry.host, geometry.footer), `${id}: host covers controls`);
            assert.ok(!overlaps(geometry.study, geometry.clue), `${id}: Ask Host covers clue`);
            assert.ok(geometry.clue.y >= geometry.card.y && geometry.clue.bottom <= geometry.card.bottom, `${id}: standard clue is clipped`);
            assert.ok(geometry.host.y >= geometry.cabinet.y - 1 && geometry.host.bottom <= geometry.cabinet.bottom + 1, `${id}: host leaves cabinet`);
            if (dialogue === 'narration') {
              assert.equal(geometry.tailDisplay, 'none', `${id}: narration must not attribute speech`);
            } else {
              assert.equal(geometry.tailDisplay, 'block', `${id}: missing tail`);
              assert.equal(geometry.tailVisible, 'true', `${id}: hidden tail`);
              assert.equal(geometry.overflow, 'visible', `${id}: card clips the tail`);
              assert.ok(Math.hypot(geometry.tip.x - geometry.target.x, geometry.tip.y - geometry.target.y) < 2, `${id}: tail misses host mouth ${JSON.stringify(geometry)}`);
            }
            assert.deepEqual(errors, [], `${id}: browser errors`);
            report.push({ id, geometry });
          }
        }
        await page.close();
      }

      // Real native API, including the browser's own exit event.
      // Release raster resources from the screenshot matrix before interactions.
      await browser.close();
      browser = await browserType.launch();
      const native = await browser.newPage({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
      await ready(native);
      await native.addStyleTag({ content: '*,*::before,*::after { animation:none!important; transition:none!important; }' });
      await native.click('#fullscreenToggle');
      await native.waitForFunction(() => !!document.fullscreenElement || !!document.webkitFullscreenElement);
      assert.equal(await native.locator('#fullscreenToggle').getAttribute('aria-label'), 'Exit fullscreen');
      await native.evaluate(() => (document.exitFullscreen || document.webkitExitFullscreen).call(document));
      await native.waitForFunction(() => document.body.dataset.immersive === 'false');
      await native.close();

      // Capability emulation is separate from physical iPhone verification.
      for (const [failure, width, height] of [['missing',390,844], ['rejected',390,844], ['missing',844,390], ['missing',1440,900]]) {
        await browser.close();
        browser = await browserType.launch();
        const page = await browser.newPage({ ...(width < 500 || height < 500 ? devices['iPhone 13'] : {}), viewport: { width, height }, reducedMotion: 'reduce' });
        console.log(`${engine}: checking ${failure} fullscreen at ${width}x${height}.`);
        page.on('crash', () => console.error(`${engine}: page crashed during ${failure} fullscreen at ${width}x${height}.`));
        await page.addInitScript(failure => {
          Object.defineProperty(Element.prototype, 'requestFullscreen', {
            configurable: true,
            value: failure === 'missing' ? undefined : () => Promise.reject(new Error('Element fullscreen unavailable')),
          });
          Object.defineProperty(Element.prototype, 'webkitRequestFullscreen', { configurable: true, value: undefined });
          Object.defineProperty(document, 'fullscreenEnabled', { configurable: true, value: failure !== 'missing' });
        }, failure);
        await ready(page);
        await page.addStyleTag({ content: '*,*::before,*::after { animation:none!important; transition:none!important; }' });
        await page.click('#fullscreenToggle');
        await page.waitForFunction(() => document.getElementById('gameContainer').dataset.fullscreenMode === 'expanded');
        assert.equal(await page.locator('#fullscreenToggle').getAttribute('aria-label'), 'Exit expanded view');
        assert.match(await page.locator('#fullscreenStatus').innerText(), /address bar visible/);
        const size = await page.locator('#gameContainer').boundingBox();
        assert.ok(Math.abs(size.width - page.viewportSize().width) < 1 && Math.abs(size.height - page.viewportSize().height) < 1);
        const announcement = await page.evaluate(() => {
          const rect = selector => document.querySelector(selector).getBoundingClientRect().toJSON();
          return { status: rect('#fullscreenStatus'), footer: rect('.control-footer'), clue: rect('#clueText') };
        });
        assert.ok(!overlaps(announcement.status, announcement.footer), `${engine}-${failure}-${width}: fullscreen status covers controls`);
        assert.ok(!overlaps(announcement.status, announcement.clue), `${engine}-${failure}-${width}: fullscreen status covers clue`);
        await page.screenshot({ path: path.join(outputDir, `${engine}-fullscreen-${failure}-${width}x${height}.png`) });
        await page.click('#fullscreenToggle');
        await page.waitForFunction(() => document.body.dataset.immersive === 'false');
        await page.click('#hamburgerMenu');
        await page.click('#menuFullscreen');
        await page.waitForFunction(() => document.body.dataset.immersive === 'true');
        await page.keyboard.press('Escape');
        await page.waitForFunction(() => document.body.dataset.immersive === 'false');
        await page.close();
      }
      console.log(`${engine}: host, tail, and fullscreen checks passed.`);
    } finally { await browser.close(); }
  }
} finally {
  await fs.writeFile(path.join(outputDir, 'geometry.json'), `${JSON.stringify(report, null, 2)}\n`);
  if (server) await new Promise(resolve => server.close(resolve));
}
console.log(`Verified ${report.length} presentation states plus native, unavailable, and rejected fullscreen.`);
