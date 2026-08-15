import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { CabinetPresenter } = require('../src/presentation/cabinet-presenter.js');
const { ControlSkins, DialogueStyles, UiCopy } = require('../src/presentation/ui-catalog.js');

function createHarness({ appMode = 'game' } = {}) {
  const calls = [];
  const values = {
    theme: 'dark',
    language: 'en',
    scenePackId: 'beach',
    hostPackId: 'xander-trefleck',
    dialogueStyleId: 'clue-card',
    controlSkinId: 'arcade',
    muted: true,
  };
  const preferenceStore = {
    get: (key) => values[key],
    set(key, value) {
      values[key] = value;
      calls.push(['preference', key, value]);
      return value;
    },
  };
  const packs = [{ id: 'beach', label: 'Beach' }, { id: 'studio', label: 'Studio' }];
  let activePack = packs[0];
  const sceneService = {
    getPacks: () => packs,
    getActivePack: () => activePack,
    setPack(id) {
      activePack = packs.find((pack) => pack.id === id) || packs[0];
      calls.push(['scene-pack', activePack.id]);
      return activePack;
    },
    setTheme(theme) { calls.push(['scene-theme', theme]); },
    cyclePack() {
      activePack = activePack.id === 'beach' ? packs[1] : packs[0];
      return activePack;
    },
  };
  const renderer = new Proxy({}, {
    get(target, name) {
      if (!target[name]) target[name] = (...args) => calls.push([name, ...args]);
      return target[name];
    },
  });
  const audioController = {
    muted: true,
    toggleMuted() {
      this.muted = !this.muted;
      return this.muted;
    },
    unlock: () => calls.push(['audio-unlock']),
    play: (cue) => calls.push(['audio-play', cue]),
  };
  const voiceController = {
    state: 'ready',
    enabled: true,
    setLanguage: (language) => calls.push(['voice-language', language]),
    getCapabilities: () => ({ narration: true, recognition: false }),
  };
  const hostPacks = [
    { id: 'xander-trefleck', displayName: 'Xander Trefleck' },
    { id: 'vera-static', displayName: 'Vera Static' },
  ];
  let hostPack = hostPacks[0];
  const hostPerformanceDirector = {
    getPacks: () => hostPacks,
    getActivePack: () => hostPack,
    setActivePack(id) {
      hostPack = hostPacks.find((pack) => pack.id === id) || hostPacks[0];
      return hostPack;
    },
  };
  const gameContainer = {
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
  };
  const body = {
    dataset: { appMode },
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
  };
  const presenter = new CabinetPresenter({
    renderer,
    preferenceStore,
    sceneService,
    audioController,
    voiceController,
    hostPerformanceDirector,
    copyCatalog: UiCopy,
    dialogueStyles: DialogueStyles,
    controlSkins: ControlSkins,
    documentRef: {
      body,
      getElementById: (id) => id === 'gameContainer' ? gameContainer : null,
    },
  });
  return { body, calls, gameContainer, presenter, values };
}

test('CabinetPresenter applies one coherent preference snapshot', () => {
  const { body, calls, gameContainer, presenter } = createHarness();
  const snapshot = presenter.applyPreferences();

  assert.equal(snapshot.copy, UiCopy.en);
  assert.equal(body.attributes['data-theme'], 'dark');
  assert.equal(body.attributes['data-language'], 'en');
  assert.equal(gameContainer.attributes['data-control-skin'], 'arcade');
  assert.ok(calls.some(([name, detail]) => name === 'setCopy' && detail === UiCopy.en));
  assert.ok(calls.some(([name, detail]) => (
    name === 'setToggleStates' && detail.theme === 'dark' && detail.language === 'en'
  )));
  assert.ok(calls.some(([name, pack]) => name === 'renderScenePicker' && pack.id === 'beach'));
  assert.ok(calls.some(([name, pack]) => (
    name === 'renderHostPack' && pack.id === 'xander-trefleck'
  )));
});

test('CabinetPresenter cycles presentation preferences without touching game state', () => {
  const { calls, presenter, values } = createHarness();

  presenter.cycleDialogueStyle(1);
  presenter.cycleScenePack();
  presenter.cycleControlSkin();
  presenter.toggleTheme();
  presenter.toggleLanguage();
  const muted = presenter.toggleSound();

  assert.equal(values.dialogueStyleId, 'speech');
  assert.equal(values.scenePackId, 'studio');
  assert.equal(values.controlSkinId, 'famicom');
  assert.equal(values.theme, 'light');
  assert.equal(values.language, 'pt-BR');
  assert.equal(muted, false);
  assert.ok(calls.some(([name]) => name === 'audio-unlock'));
  assert.ok(calls.some(([name, cue]) => name === 'audio-play' && cue === 'clue'));
  assert.equal(calls.some(([name]) => name === 'score'), false);
});
