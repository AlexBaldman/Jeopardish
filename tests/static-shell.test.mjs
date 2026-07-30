import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { runtimeEntries } from '../scripts/runtime-manifest.mjs';

const [landingHtml, gameHtml, creativeRoomHtml, fixtureHtml, smokeScript, baseStyles, tokens, brandStyles, preferenceStyles, siteStyles, cabinetStyles, sceneStyles, headerStyles, scoreboardStyles, menuStyles, hostStyles, dialogueStyles, mediaStyles, controlStyles] = await Promise.all([
  readFile(new URL('../index.html', import.meta.url), 'utf8'),
  readFile(new URL('../game.html', import.meta.url), 'utf8'),
  readFile(new URL('../creative-room.html', import.meta.url), 'utf8'),
  readFile(new URL('../visual-fixtures.html', import.meta.url), 'utf8'),
  readFile(new URL('../scripts/smoke-production.mjs', import.meta.url), 'utf8'),
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
  'voiceButton',
  'voiceState',
  'voiceHelp',
  'checkButtonKicker',
  'questionButtonKicker',
  'answerButtonKicker',
  'statusMessage',
  'deepDiveButton',
  'deepDiveLabel',
  'menuDeepDive',
  'menuDeepDiveLabel',
  'menuVoice',
  'menuVoiceState',
  'studyPanel',
  'studyTitle',
  'studyActions',
  'studySources',
  'studyResponse',
  'studyResume',
  'studyReinforcement',
  'studyReinforcementInput',
  'studyReinforcementCheck',
  'studyReinforcementResult',
  'reviewQueueButton',
  'reviewQueueStatus',
  'outcomeFeedback',
  'confidenceKnew',
  'confidenceShaky',
  'confidenceLearned',
  'disputeButton',
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

test('interactive option collections expose valid accessible group semantics', () => {
  assert.match(landingHtml, /id="studyActions" role="group" aria-label="Study directions"/);
  assert.match(gameHtml, /id="studyActions" role="group" aria-label="Study directions"/);
  assert.match(creativeRoomHtml, /class="direction-grid" role="group" aria-labelledby="directionTitle"/);
});

test('open scoreboard removes covered dialogue controls from interaction', () => {
  assert.match(
    scoreboardStyles,
    /\.score-drawer\.active ~ \.main-content \.dialogue-style-picker[\s\S]*visibility: hidden;[\s\S]*pointer-events: none;/,
  );
});

test('scoreboard uses readable LED bays without a line through its digits', () => {
  assert.match(scoreboardStyles, /@keyframes scoreboard-digit-change/);
  assert.match(scoreboardStyles, /font-variant-numeric:\s*tabular-nums/);
  assert.match(scoreboardStyles, /white-space:\s*nowrap/);
  assert.match(scoreboardStyles, /body\[data-theme="light"\] \.game-container \.score-drawer/);
  assert.doesNotMatch(scoreboardStyles, /\.hud-readout strong::after/);
});

test('production smoke uses the canonical answer input id', () => {
  assert.match(smokeScript, /locator\('#inputbox'\)/);
  assert.doesNotMatch(smokeScript, /locator\('#inputBox'\)/);
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

test('both game shells load focused renderer views before the renderer facade', () => {
  for (const [surface, html] of [['index.html', landingHtml], ['game.html', gameHtml]]) {
    const outcomeView = html.indexOf('src/render/outcome-view.js');
    const clueView = html.indexOf('src/render/clue-view.js');
    const studyView = html.indexOf('src/render/study-view.js');
    const renderer = html.indexOf('src/render/renderer.js');
    assert.ok(outcomeView > 0, `${surface} is missing the outcome view`);
    assert.ok(clueView > outcomeView, `${surface} must load the clue view after the outcome view`);
    assert.ok(studyView > clueView, `${surface} must load the study view after the clue view`);
    assert.ok(renderer > studyView, `${surface} must load focused views before the renderer`);
  }
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
  assert.match(tokens, /--jp-keycap-travel:\s*6px/);
  assert.match(controlStyles, /translateY\(calc\(var\(--jp-keycap-travel\) - 1px\)\)/);
  assert.match(controlStyles, /--control-face:\s*#f5f1df/);
  assert.match(controlStyles, /0 var\(--jp-keycap-travel\) 0 var\(--control-edge\)/);
  assert.match(controlStyles, /\.control-symbol[\s\S]*border-radius:\s*50%/);
  assert.match(dialogueStyles, /--thought-fill:\s*#f1efe5/);
  assert.match(dialogueStyles, /body\[data-theme="light"\][\s\S]*--thought-fill:\s*#fff9e8/);
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

test('both game shells load the episode contract and controller before composition', () => {
  for (const [surface, html] of [['index.html', landingHtml], ['game.html', gameHtml]]) {
    assert.match(html, /src="src\/session\/session-manager\.js/,
      `${surface} does not load the session manager`);
    assert.match(html, /src="src\/content\/episode-contract\.js/,
      `${surface} does not load the episode contract`);
    assert.match(html, /src="src\/content\/emergency-episode\.js/,
      `${surface} does not load the emergency episode`);
    assert.match(html, /src="src\/application\/episode-controller\.js/,
      `${surface} does not load the episode controller`);
    assert.ok(
      html.indexOf('src/content/episode-contract.js')
        < html.indexOf('src/content/emergency-episode.js'),
      `${surface} must load the contract before the emergency episode`,
    );
    assert.ok(
      html.indexOf('src/content/emergency-episode.js')
        < html.indexOf('src/application/episode-controller.js'),
      `${surface} must load the emergency episode before the episode controller`,
    );
    assert.ok(
      html.indexOf('src/application/episode-controller.js')
        < html.indexOf('src/application/application-composition.js'),
      `${surface} must load the episode controller before composition`,
    );
  }
});

test('both game shells load the authoritative round kernel', () => {
  for (const [surface, html] of [['index.html', landingHtml], ['game.html', gameHtml]]) {
    assert.match(html, /src="src\/core\/round-kernel\.js/,
      `${surface} does not load the round kernel`);
    assert.match(html, /src="src\/application\/preference-store\.js/,
      `${surface} does not load the preference store`);
    assert.match(html, /src="src\/application\/clue-pipeline\.js/,
      `${surface} does not load the clue pipeline`);
    assert.match(html, /src="src\/application\/clue-localization\.js/,
      `${surface} does not load clue localization`);
    assert.ok(
      html.indexOf('src/application/clue-localization.js')
        < html.indexOf('src/application/application-composition.js'),
      `${surface} must load clue localization before composition`,
    );
    assert.ok(
      html.indexOf('src/application/preference-store.js') < html.indexOf('src="app.js'),
      `${surface} must load the preference store before app.js`,
    );
    assert.doesNotMatch(html, /src\/directors\/round-director\.js/,
      `${surface} still loads the retired round director`);
  }
});

test('both game shells load voice mode as an optional progressive enhancement', () => {
  for (const [surface, html] of [['index.html', landingHtml], ['game.html', gameHtml]]) {
    assert.match(html, /src="src\/voice\/voice-controller\.js/, `${surface} is missing voice control`);
    assert.match(html, /id="voiceButton"/, `${surface} is missing push-to-talk`);
    assert.match(html, /id="menuVoice"/, `${surface} is missing the voice setting`);
  }
  assert.match(controlStyles, /\.voice-button/);
  assert.match(controlStyles, /@keyframes voice-listening/);
});

test('both game shells load host packs and the performance director before composition', () => {
  for (const [surface, html] of [['index.html', landingHtml], ['game.html', gameHtml]]) {
    const hostPack = html.indexOf('src/host/host-pack.js');
    const director = html.indexOf('src/host/host-performance-director.js');
    const catalog = html.indexOf('src/presentation/ui-catalog.js');
    const presenter = html.indexOf('src/presentation/broadcast-presenter.js');
    const cabinet = html.indexOf('src/presentation/cabinet-presenter.js');
    const composition = html.indexOf('src/application/application-composition.js');
    assert.ok(hostPack > 0, `${surface} is missing the HostPack contract`);
    assert.ok(director > hostPack, `${surface} must load HostPack before its director`);
    assert.ok(catalog > director, `${surface} must load host performance before UI copy`);
    assert.ok(presenter > catalog, `${surface} must load UI copy before presentation`);
    assert.ok(cabinet > presenter, `${surface} must load broadcast before cabinet presentation`);
    assert.ok(composition > cabinet, `${surface} must load presentation before composition`);
    assert.match(html, /id="menuHostPack"/, `${surface} is missing personality selection`);
  }
});

test('host presentation realizes semantic motion with a reduced-motion exit', () => {
  for (const primitive of ['enter', 'react', 'hold', 'recover', 'exit']) {
    assert.match(hostStyles, new RegExp(`data-motion="${primitive}"`));
    assert.match(hostStyles, new RegExp(`@keyframes host-motion-${primitive}`));
  }
  assert.match(tokens, /--jp-motion-response:/);
  assert.match(tokens, /--jp-ease-enter:/);
  assert.match(hostStyles, /prefers-reduced-motion: reduce/);
  assert.match(hostStyles, /\.host-stage \.host-stand/);
});

test('both game shells load the grounded study runtime and owned styles', () => {
  for (const [surface, html] of [['index.html', landingHtml], ['game.html', gameHtml]]) {
    assert.match(html, /src="src\/study\/clue-packet\.js/, `${surface} is missing clue packets`);
    assert.match(html, /src="src\/study\/round-snapshot\.js/, `${surface} is missing round snapshots`);
    assert.match(html, /src="src\/learning\/learning-ledger\.js/, `${surface} is missing learning persistence`);
    assert.match(html, /src="src\/application\/study-controller\.js/, `${surface} is missing the study controller`);
    assert.ok(
      html.indexOf('src/application/study-controller.js') < html.indexOf('src="app.js'),
      `${surface} must load the study controller before app.js`,
    );
    assert.match(html, /href="styles\/game\/study\.css/, `${surface} is missing study styles`);
  }
});

test('both game shells expose the reinforcement and review-return controls', () => {
  for (const [surface, html] of [['landing', landingHtml], ['game', gameHtml]]) {
    assert.match(html, /id="studyReinforcementForm"/, `${surface} is missing reinforcement input`);
    assert.match(html, /id="reviewQueueButton"/, `${surface} is missing the review return`);
  }
});

test('both game shells load the canonical input controller before app coordination', () => {
  for (const [surface, html] of [['index.html', landingHtml], ['game.html', gameHtml]]) {
    assert.match(html, /src="src\/application\/input-controller\.js/,
      `${surface} is missing the input controller`);
    assert.ok(
      html.indexOf('src/application/input-controller.js') < html.indexOf('src="app.js'),
      `${surface} must load the input controller before app.js`,
    );
  }
});

test('both game shells load the composition root immediately before app coordination', () => {
  for (const [surface, html] of [['index.html', landingHtml], ['game.html', gameHtml]]) {
    assert.match(html, /src="src\/application\/application-composition\.js/,
      `${surface} is missing the application composition root`);
    assert.ok(
      html.indexOf('src/application/application-composition.js') < html.indexOf('src="app.js'),
      `${surface} must load the composition root before app.js`,
    );
  }
});

test('both game shells load privacy-safe telemetry before the composition root', () => {
  for (const html of [landingHtml, gameHtml]) {
    const telemetry = html.indexOf('src/telemetry/product-telemetry.js');
    const composition = html.indexOf('src/application/application-composition.js');
    assert.ok(telemetry > 0 && telemetry < composition);
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

test('brand marks put the interchangeable O in JEO while keeping PARODY intact', () => {
  for (const [surface, html] of [['index.html', landingHtml], ['game.html', gameHtml]]) {
    assert.match(
      html,
      /brand-jeo">JE<\/span><span class="brand-o"[\s\S]*?<span class="brand-par">PAR<\/span><span class="brand-dy">ODY<\/span>/,
      `${surface} does not render JE + interchangeable O + PARODY`,
    );
    assert.doesNotMatch(
      html,
      /brand-jeo">JEO<\/span><span class="brand-par">PAR<\/span><span class="brand-o"/,
      `${surface} still inserts the changing O inside PARODY`,
    );
  }
});

test('game headers use explicit flag artwork and current architecture styles', () => {
  for (const [surface, html] of [['index.html', landingHtml], ['game.html', gameHtml]]) {
    assert.match(html, /assets\/ui\/flag-us\.svg/, `${surface} is missing the US flag`);
    assert.match(html, /assets\/ui\/flag-br\.svg/, `${surface} is missing the Brazilian flag`);
    assert.match(html, /styles\/preferences\.css\?v=architecture-9/);
    assert.match(html, /styles\/game\/header\.css\?v=architecture-5/);
    assert.match(html, /styles\/tokens\.css\?v=architecture-4/);
    assert.match(html, /styles\/game\/cabinet\.css\?v=architecture-5/);
    assert.match(html, /styles\/game\/host\.css\?v=architecture-5/);
    assert.match(html, /styles\/game\/scoreboard\.css\?v=architecture-4/);
    assert.match(html, /styles\/game\/dialogue\.css\?v=architecture-7/);
    assert.match(html, /styles\/game\/controls\.css\?v=architecture-7/);
    assert.match(html, /styles\/game\/study\.css\?v=architecture-4/);
  }
  assert.match(headerStyles, /\.title-div\s*\{[\s\S]*?grid-row:\s*1;/);
  assert.match(headerStyles, /\.header-controls\s*\{[\s\S]*?grid-row:\s*1;/);
  assert.match(preferenceStyles, /body\[data-language="pt-BR"\]\s+\.flag-br\s*\{[\s\S]*?opacity:\s*1;/);
  assert.match(preferenceStyles, /\.language-toggle\[data-help\]::after[\s\S]*display:\s*block/);
  assert.ok(runtimeEntries.includes('assets/ui'), 'production manifest must ship header flag artwork');
});

test('host study entry uses localized generic copy in both game shells', () => {
  for (const [surface, html] of [['index.html', landingHtml], ['game.html', gameHtml]]) {
    assert.match(html, /id="menuDeepDiveLabel">Ask Host</, `${surface} menu uses stale host copy`);
    assert.match(html, /id="deepDiveLabel">Ask Host</, `${surface} trigger uses stale host copy`);
    assert.match(html, /id="studyTitle">Ask Host</, `${surface} study title uses stale host copy`);
    assert.match(
      html,
      /id="languageToggle"[\s\S]*?data-help="Language: English\. Switch to Brazilian Portuguese"/,
      `${surface} language toggle lacks descriptive hover help`,
    );
  }
});

test('static scene picker copy matches the four-pack runtime', () => {
  assert.match(landingHtml, /id="menuSceneIndex"[^>]*>01\/04</);
  assert.match(gameHtml, /id="menuSceneIndex"[^>]*>01\/04</);
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
  assert.match(dialogueStyles, /--dialogue-tail-anchor:/);
  assert.match(dialogueStyles, /min-height:\s*clamp\(345px, 45vh, 430px\)/);
  assert.match(dialogueStyles, /\.dialogue-style-cycle:active\s*\{[\s\S]*?translateY\(2px\)/);
  assert.match(dialogueStyles, /@media \(min-width: 761px\) and \(max-width: 900px\)/);
  assert.match(dialogueStyles, /--dialogue-tail-length:\s*clamp\(128px, 15vh, 154px\)/);
  assert.match(dialogueStyles, /height:\s*min\(315px, calc\(100svh - var\(--jp-header-height\) - var\(--footer-height\) - 1\.25rem\)\)/);
  assert.match(dialogueStyles, /clip-path:\s*polygon\(36% 0, 100% 0, 0 100%\)/);
  assert.match(dialogueStyles, /#questionBox\s*\{[\s\S]*?overflow-y:\s*auto;/);
  assert.match(
    dialogueStyles,
    /@media \(max-height: 620px\)[\s\S]*?speech-bubble\[data-dialogue-style\]::after\s*\{[\s\S]*?display:\s*none;/,
  );
});

test('host reaction copy remains accessible without a visible cue badge', () => {
  assert.doesNotMatch(landingHtml, /id="hostCue"/);
  assert.doesNotMatch(gameHtml, /id="hostCue"/);
  assert.doesNotMatch(hostStyles, /\.host-cue/);
});
