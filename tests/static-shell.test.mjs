import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [landingHtml, gameHtml, styles, gameStyles] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../game.html', import.meta.url), 'utf8'),
  readFile(new URL('../style.css', import.meta.url), 'utf8'),
  readFile(new URL('../styles/game.css', import.meta.url), 'utf8'),
]);

const cabinetContractIds = [
  'gameContainer',
  'sceneStage',
  'hamburgerMenu',
  'scoreDrawer',
  'hudEpisode',
  'episodeProgress',
  'navMenu',
  'menuScene',
  'speechBubble',
  'categoryBox',
  'questionBox',
  'clueMedia',
  'hostStage',
  'hostImage',
  'inputbox',
  'checkButton',
  'questionButton',
  'answerButton',
  'statusMessage',
];

const mediaContractIds = [
  'mediaModal',
  'mediaModalBackdrop',
  'mediaModalType',
  'mediaModalTitle',
  'mediaModalClose',
  'mediaModalBody',
  'mediaModalLink',
];

function getIds(html) {
  return [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
}

function assertHasIds(html, ids, surface) {
  const actual = new Set(getIds(html));
  ids.forEach((id) => assert.ok(actual.has(id), `${surface} is missing #${id}`));
}

test('landing and standalone pages preserve the cabinet DOM contract', () => {
  assertHasIds(landingHtml, cabinetContractIds, 'index.html');
  assertHasIds(gameHtml, cabinetContractIds, 'game.html');
});

test('both game shells load the canonical game stylesheet after shared styles', () => {
  for (const [surface, html] of [['index.html', landingHtml], ['game.html', gameHtml]]) {
    const sharedIndex = html.indexOf('href="style.css');
    const gameIndex = html.indexOf('href="styles/game.css');
    assert.ok(sharedIndex >= 0, `${surface} is missing shared styles`);
    assert.ok(gameIndex > sharedIndex, `${surface} must load game styles after shared styles`);
  }
});

test('landing and standalone pages both provide the clue media viewer', () => {
  assertHasIds(landingHtml, mediaContractIds, 'index.html');
  assertHasIds(gameHtml, mediaContractIds, 'game.html');
});

test('both game shells load the Season Zero session runtime', () => {
  for (const [surface, html] of [['index.html', landingHtml], ['game.html', gameHtml]]) {
    assert.match(html, /src="src\/session\/session-manager\.js/,
      `${surface} does not load the session manager`);
  }
});

test('HTML entry points contain no duplicate ids', () => {
  for (const [surface, html] of [['index.html', landingHtml], ['game.html', gameHtml]]) {
    const ids = getIds(html);
    assert.equal(new Set(ids).size, ids.length, `${surface} contains duplicate ids`);
  }
});

test('static scene picker copy matches the three-pack runtime', () => {
  assert.match(landingHtml, /id="menuSceneIndex"[^>]*>01\/03</);
  assert.match(gameHtml, /id="menuSceneIndex"[^>]*>01\/03</);
  assert.match(landingHtml, /id="menuSceneLabel">Long Beach '96</);
  assert.match(gameHtml, /id="menuSceneLabel">Long Beach '96</);
});

test('signal maps have an offline visual fallback and reveal content is safe by default', () => {
  assert.equal((landingHtml.match(/class="diagram-flow"/g) || []).length, 2);
  assert.doesNotMatch(landingHtml, /<pre class="mermaid">/);
  assert.match(styles, /\.reveal\s*\{\s*opacity:\s*1;/);
});

test('dialogue skins use direct values instead of banknote background art', () => {
  assert.match(gameStyles, /Dialogue system v2/);
  assert.doesNotMatch(gameStyles, /background-image:\s*url\(["']?assets\/images\/banknotes/);
  assert.match(gameStyles, /clip-path:\s*polygon\(0 0, 100% 0, 0 100%\)/);
});

test('host reaction copy remains accessible without a visible cue badge', () => {
  assert.doesNotMatch(landingHtml, /id="hostCue"/);
  assert.doesNotMatch(gameHtml, /id="hostCue"/);
  assert.doesNotMatch(gameStyles, /\.host-cue/);
});
