import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { GameEvents } = require('../src/contracts/events.js');
const {
  ApplicationComposition,
  REQUIRED_CONSTRUCTORS,
  validateModules,
} = require('../src/application/application-composition.js');
const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');

function createHarness() {
  const calls = [];
  const events = [];

  class EventBus {
    emit(type, payload, meta) {
      const event = { type, payload, meta };
      events.push(event);
      return event;
    }
  }

  class PreferenceStore {
    constructor(options) {
      this.options = options;
      this.values = {
        hostSkinId: 'dope-03',
        muted: true,
        voiceEnabled: true,
      };
      calls.push(['construct', 'preferences', options]);
    }

    load() {
      calls.push(['load', 'preferences']);
      return this.values;
    }

    get(key) {
      return this.values[key];
    }
  }

  const simpleConstructor = (name) => class {
    constructor(options = {}) {
      this.options = options;
      calls.push(['construct', name, options]);
    }
  };

  class Renderer extends simpleConstructor('renderer') {
    bindDom() { calls.push(['bind', 'renderer-dom']); }
    bindEvents(eventsToBind) {
      this.events = eventsToBind;
      calls.push(['bind', 'renderer-events']);
    }
  }

  class ConsoleNarrator extends simpleConstructor('narrator') {
    start() { calls.push(['start', 'narrator']); }
    stop() { calls.push(['stop', 'narrator']); }
  }

  class HostManager extends simpleConstructor('host') {
    setActiveSkin(id) { calls.push(['skin', id]); }
  }

  class BrandController extends simpleConstructor('brand') {
    bind() { calls.push(['bind', 'brand']); }
  }

  class AudioController extends simpleConstructor('audio') {
    setMuted(muted) { calls.push(['muted', muted]); }
  }

  class VoiceController extends simpleConstructor('voice') {
    constructor(options) {
      super(options);
      this.enabled = false;
    }

    setEnabled(enabled) {
      this.enabled = enabled;
      calls.push(['voice-enabled', enabled]);
    }

    stop() { calls.push(['stop', 'voice']); }
  }

  class SceneService extends simpleConstructor('scene') {
    bindDom() { calls.push(['bind', 'scene']); }
    destroy() { calls.push(['destroy', 'scene']); }
  }

  class CluePipeline extends simpleConstructor('pipeline') {
    cancel() { calls.push(['cancel', 'pipeline']); }
  }

  class RoundKernel extends simpleConstructor('round') {
    cancel(nextPhase, reason) { calls.push(['cancel', 'round', nextPhase, reason]); }
  }

  class InputController extends simpleConstructor('input') {
    bindKeyboard() { calls.push(['bind', 'keyboard']); }
    destroy() { calls.push(['destroy', 'input']); }
  }

  class ProductTelemetry extends simpleConstructor('telemetry') {
    start() { calls.push(['start', 'telemetry']); }
    stop() { calls.push(['stop', 'telemetry']); }
  }

  class EpisodeController extends simpleConstructor('episode') {
    destroy() {
      calls.push(['destroy', 'episode']);
      this.options.cluePipeline.cancel();
    }
  }

  const modules = {
    EventBus,
    GameEngine: simpleConstructor('engine'),
    DataLoader: simpleConstructor('data'),
    MediaPreflight: simpleConstructor('media'),
    SceneService,
    Renderer,
    ConsoleNarrator,
    HostManager,
    BrandController,
    TranslationService: simpleConstructor('translation'),
    AudioController,
    VoiceController,
    RoundKernel,
    PreferenceStore,
    CluePipeline,
    SessionManager: simpleConstructor('session'),
    EpisodeController,
    StudyController: simpleConstructor('study'),
    InputController,
    ProductTelemetry,
  };
  const composition = new ApplicationComposition({ modules, events: GameEvents });
  return { calls, composition, events };
}

test('ApplicationComposition constructs the service graph once with explicit dependencies', () => {
  const { calls, composition, events } = createHarness();
  const services = composition.create({
    bestStreak: 7,
    preferenceOptions: { allowedValues: { dialogueStyleId: ['clue-card'] } },
    voiceOptions: { language: 'en-US' },
    roundOptions: { reducedMotion: true },
    cluePipelineOptions: { maxAttempts: 8 },
    episodeOptions: { sourceUrl: '/episode.json' },
    studyOptions: { getGameState: () => ({ score: 0 }) },
    inputOptions: { handlers: { 'new-clue': () => {} } },
    telemetryOptions: { sink: { record() {} } },
  });

  assert.equal(Object.isFrozen(services), true);
  assert.equal(composition.create(), services);
  assert.equal(services.gameEngine.options.eventBus, services.eventBus);
  assert.equal(services.gameEngine.options.bestStreak, 7);
  assert.equal(services.roundKernel.options.audio, services.audioController);
  assert.equal(services.roundKernel.options.eventBus, services.eventBus);
  assert.equal(services.roundKernel.options.reducedMotion, true);
  assert.equal(services.cluePipeline.options.roundKernel, services.roundKernel);
  assert.equal(services.cluePipeline.options.mediaPreflight, services.mediaPreflight);
  assert.equal(services.episodeController.options.sessionManager, services.sessionManager);
  assert.equal(services.episodeController.options.cluePipeline, services.cluePipeline);
  assert.equal(services.episodeController.options.sourceUrl, '/episode.json');
  assert.equal(services.studyController.options.renderer, services.renderer);
  assert.equal(services.inputController.options.eventBus, services.eventBus);
  assert.equal(services.productTelemetry.options.eventBus, services.eventBus);
  assert.equal(typeof services.productTelemetry.options.sink.record, 'function');
  assert.equal(calls.filter(([action]) => action === 'load').length, 1);
  assert.ok(events.some((event) => (
    event.type === GameEvents.APPLICATION_COMPOSED
    && event.payload.serviceCount === 20
  )));
});

test('ApplicationComposition starts and destroys its lifecycle exactly once', () => {
  const { calls, composition, events } = createHarness();
  const services = composition.create();
  const rendererEvents = { onNewQuestion: () => {} };

  assert.equal(composition.start({
    rendererEvents,
    initialize: () => calls.push(['initialize', 'application']),
  }), services);
  assert.equal(composition.start(), services);
  assert.equal(services.renderer.events, rendererEvents);
  assert.equal(calls.filter((call) => call[1] === 'renderer-dom').length, 1);
  assert.equal(calls.filter((call) => call[1] === 'keyboard').length, 1);
  assert.equal(calls.filter((call) => call[0] === 'start' && call[1] === 'telemetry').length, 1);
  assert.ok(events.some((event) => (
    event.type === GameEvents.APPLICATION_STARTED
    && event.payload.voiceEnabled === true
  )));

  assert.equal(composition.destroy({ reason: 'test-complete' }), true);
  assert.equal(composition.destroy(), false);
  assert.ok(calls.some((call) => call[0] === 'cancel' && call[1] === 'pipeline'));
  assert.equal(calls.filter((call) => call[0] === 'cancel' && call[1] === 'pipeline').length, 1);
  assert.ok(calls.some((call) => (
    call[0] === 'cancel' && call[1] === 'round' && call[3] === 'test-complete'
  )));
  assert.ok(calls.some((call) => call[0] === 'destroy' && call[1] === 'input'));
  assert.ok(calls.some((call) => call[0] === 'destroy' && call[1] === 'episode'));
  assert.ok(calls.some((call) => call[0] === 'destroy' && call[1] === 'scene'));
  assert.ok(calls.some((call) => call[0] === 'stop' && call[1] === 'voice'));
  assert.ok(calls.some((call) => call[0] === 'stop' && call[1] === 'narrator'));
  assert.ok(calls.some((call) => call[0] === 'stop' && call[1] === 'telemetry'));
  assert.ok(events.some((event) => (
    event.type === GameEvents.APPLICATION_STOPPED
    && event.payload.reason === 'test-complete'
  )));
  assert.throws(() => composition.start(), /cannot start after destroy/);
});

test('ApplicationComposition rolls back owned work when startup fails', () => {
  const { calls, composition, events } = createHarness();
  composition.create();

  assert.throws(() => composition.start({
    initialize: () => {
      throw new Error('initial paint failed');
    },
  }), /initial paint failed/);
  assert.ok(calls.some((call) => call[0] === 'cancel' && call[1] === 'pipeline'));
  assert.ok(events.some((event) => (
    event.type === GameEvents.APPLICATION_STOPPED
    && event.payload.reason === 'startup-failed'
  )));
});

test('ApplicationComposition rejects incomplete service registries', () => {
  assert.equal(REQUIRED_CONSTRUCTORS.includes('GameEngine'), true);
  assert.throws(() => validateModules({ EventBus: class {} }), /missing constructors/);
});

test('app.js delegates service construction and lifecycle binding to ApplicationComposition', () => {
  assert.match(appSource, /new applicationCompositionModule\.ApplicationComposition\(\)/);
  assert.match(appSource, /applicationComposition\.create\(createCompositionOptions\(\)\)/);
  assert.match(appSource, /applicationComposition\.start\(/);
  assert.match(appSource, /applicationComposition\?\.destroy\(/);
  assert.doesNotMatch(appSource, /renderer\.bindDom\(\)/);
  assert.doesNotMatch(appSource, /inputController\.bindKeyboard\(\)/);
  assert.doesNotMatch(appSource, /new voiceModule\.VoiceController/);
  assert.doesNotMatch(appSource, /new roundKernelModule\.RoundKernel/);
});

test('app.js delegates episode ownership without retaining shadow lifecycle state', () => {
  assert.match(appSource, /episodeController\.start\(\)/);
  assert.match(appSource, /episodeController\.nextClue\(\)/);
  assert.match(appSource, /episodeController\.recordOutcome\(/);
  assert.match(appSource, /episodeController\.replaceFailedMedia\(/);
  assert.doesNotMatch(appSource, /loadQuestionBank\(/);
  assert.doesNotMatch(appSource, /\bsessionManager\b/);
  assert.doesNotMatch(appSource, /\bcurrentOutcomeRecorded\b/);
  assert.doesNotMatch(appSource, /\bsessionCompleteVisible\b/);
  assert.doesNotMatch(appSource, /state\.current(?:Source|Display)Clue/);
});
