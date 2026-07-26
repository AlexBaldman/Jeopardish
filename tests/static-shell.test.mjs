import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const [landingHtml, gameHtml, fixtureHtml, baseStyles, tokens, brandStyles, preferenceStyles, siteStyles, cabinetStyles, sceneStyles, headerStyles, scoreboardStyles, menuStyles, hostStyles, dialogueStyles, mediaStyles, controlStyles] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../game.html', import.meta.url), 'utf8'),
  readFile(new URL('../visual-fixtures.html', import.meta.url), 'utf8'),
  readFile(new URL('../styles/base.css', import.meta.url), 'utf8'),
  readFile(new URL('../styles/tokens.css', import.meta.url), 'utf8'),
  readFile(new URL('../styles/brand.css', import.meta.url), 'utf8'),
  readFile(new URL('../styles/preferences.css', import.meta.url), 'utf8'),
  readFile(new URL('../style.css', import.meta.url), 'utf8'),
  readFile(new URL('../styles/game/cabinet.css', import.meta.url), 'utf8'),
  readFile(new URL('../styles/game/scene.css', import.meta.url), 'utf8'),
  readFile(new URL('../styles/game/header.css', import.meta.url), 'utf8'),
  readFile(new URL('../styles/game/scoreboard.css', import.meta.url), 'utf8'),
  readFile(new URL('../styles/game/menu.css', import.meta.url), 'utf8'),
  readFile(new URL('../styles/game/host.css', import.meta.url), 'utf8'),
  readFile(new URL('../styles/game/dialogue.css', import.meta.url), 'utf8'),
  readFile(new URL('../styles/game/media.css', import.meta.url), 'utf8'),
  readFile(new URL('../styles/game/controls.css', import.meta.url), 'utf8'),
]);

const cabinetContractIds = [
  'gameContainer',
  'sceneStage',
  'hamburgerMenu',
  'scoreDrawer',
  'hudScore',
  'hudStreak',
  'hudBest',
  'hudEpisode',
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
  'answerFieldLabel',
  'checkButtonKicker',
  'questionButtonKicker',
  'answerButtonKicker',
  'statusMessage',
  'deepDiveButton',
  'menuDeepDive',
  'studyPanel',
  'studyActions',
  'studyResponse',
  'studyResume',
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

test('game shells load foundations and owned components without a legacy runtime stylesheet', () => {
  for (const [surface, html] of [['index.html', landingHtml], ['game.html', gameHtml]]) {
    const tokensIndex = html.indexOf('href="styles/tokens.css');
    const baseIndex = html.indexOf('href="styles/base.css');
    const brandIndex = html.indexOf('href="styles/brand.css');
    const preferenceIndex = html.indexOf('href="styles/preferences.css');
    const cabinetIndex = html.indexOf('href="styles/game/cabinet.css');
    assert.ok(tokensIndex >= 0, `${surface} is missing design tokens`);
    assert.ok(baseIndex > tokensIndex, `${surface} must load base styles after tokens`);
    assert.ok(brandIndex > baseIndex, `${surface} must load brand styles after foundations`);
    assert.ok(preferenceIndex > brandIndex, `${surface} must load preference styles after brand styles`);
    assert.ok(cabinetIndex > preferenceIndex, `${surface} must load game components after shared components`);
    assert.match(html, /href="styles\/order\.css/);
    assert.doesNotMatch(html, /styles\/game\/legacy\.css/, `${surface} still loads the retired legacy game stylesheet`);
    assert.ok(html.indexOf('href="styles/game/scene.css') > cabinetIndex, `${surface} must load the owned scene after the cabinet`);
    assert.ok(html.indexOf('href="styles/game/header.css') > cabinetIndex, `${surface} must load the owned header after the cabinet`);
    assert.ok(html.indexOf('href="styles/game/scoreboard.css') > cabinetIndex, `${surface} must load the owned scoreboard after the cabinet`);
    assert.ok(html.indexOf('href="styles/game/menu.css') > cabinetIndex, `${surface} must load the owned menu after the cabinet`);
    assert.ok(html.indexOf('href="styles/game/dialogue.css') > cabinetIndex, `${surface} must load the owned dialogue after the cabinet`);
    assert.ok(html.indexOf('href="styles/game/media.css') > cabinetIndex, `${surface} must load the owned media after the cabinet`);
    assert.ok(html.indexOf('href="styles/game/controls.css') > cabinetIndex, `${surface} must load the owned controls after the cabinet`);
  }
  assert.match(landingHtml, /href="style\.css/, 'index.html must load landing-page styles');
  assert.doesNotMatch(gameHtml, /href="style\.css/, 'game.html must not load landing-page styles');
});

test('canonical cabinet components use layers and container-driven responsive rules', () => {
  assert.match(baseStyles, /^@layer reset/);
  assert.match(tokens, /^@layer tokens/);
  assert.match(brandStyles, /^@layer components/);
  assert.match(preferenceStyles, /^@layer components/);
  assert.match(siteStyles, /^@layer legacy/);
  assert.match(cabinetStyles, /^@layer components/);
  assert.match(cabinetStyles, /container:\s*cabinet\s*\/\s*inline-size/);
  assert.match(sceneStyles, /^@layer components/);
  assert.match(sceneStyles, /@keyframes scene-layer-enter/);
  assert.match(headerStyles, /@container cabinet \(max-width: 760px\)/);
  assert.match(scoreboardStyles, /@layer components/);
  assert.match(menuStyles, /@layer components/);
  assert.match(dialogueStyles, /^@layer components/);
  assert.match(dialogueStyles, /@keyframes clue-card-arrive/);
  assert.match(mediaStyles, /^@layer components/);
  assert.match(mediaStyles, /@keyframes media-pop-in/);
  assert.match(hostStyles, /@container cabinet \(max-width: 420px\)/);
  assert.match(hostStyles, /@keyframes host-streak/);
  assert.doesNotMatch(controlStyles, /\.host-cycle/,
    'host selectors belong to host.css, not controls.css');
  assert.match(controlStyles, /CHANNEL O CONTROL DECK/);
  assert.match(controlStyles, /@container cabinet \(max-width: 700px\)/);
});

test('visual state lab exposes deterministic game fixtures', () => {
  assert.match(fixtureHtml, /id="fixtureState"/);
  assert.match(fixtureHtml, /src="src\/dev\/visual-fixture-state\.js"/);
  assert.match(fixtureHtml, /id="fixtureFrame"/);
});

test('the live drawer is the only scoreboard surface', () => {
  for (const [surface, html] of [['index.html', landingHtml], ['game.html', gameHtml]]) {
    assert.doesNotMatch(html, /id="menuScoreTitle"|id="dataBox"|id="episodeProgress"/,
      `${surface} still contains the legacy menu scoreboard`);
    assert.match(html, /id="hudBest"/);
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

test('both game shells load the grounded study runtime and owned styles', () => {
  for (const [surface, html] of [['index.html', landingHtml], ['game.html', gameHtml]]) {
    assert.match(html, /src="src\/study\/clue-packet\.js/, `${surface} is missing clue packets`);
    assert.match(html, /src="src\/study\/round-snapshot\.js/, `${surface} is missing round snapshots`);
    assert.match(html, /href="styles\/game\/study\.css/, `${surface} is missing study styles`);
  }
});

test('both game shells load focus management and keep the closed menu inert', () => {
  for (const [surface, html] of [['index.html', landingHtml], ['game.html', gameHtml]]) {
    assert.match(html, /src="src\/ui\/focus-scope\.js/, `${surface} is missing focus management`);
    assert.match(
      html,
      /<nav class="nav-menu" id="navMenu"[^>]*aria-hidden="true"[^>]*inert/,
      `${surface} exposes the closed game menu to keyboard navigation`,
    );
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
  assert.match(siteStyles, /\.reveal\s*\{\s*opacity:\s*1;/);
});

test('dialogue skins use direct values instead of banknote background art', () => {
  assert.match(dialogueStyles, /Dialogue system v2/);
  assert.doesNotMatch(dialogueStyles, /background-image:\s*url\(["']?assets\/images\/banknotes/);
  assert.match(dialogueStyles, /clip-path:\s*polygon\(0 0, 100% 0, 0 100%\)/);
});

test('host reaction copy remains accessible without a visible cue badge', () => {
  assert.doesNotMatch(landingHtml, /id="hostCue"/);
  assert.doesNotMatch(gameHtml, /id="hostCue"/);
  assert.doesNotMatch(hostStyles, /\.host-cue/);
});
