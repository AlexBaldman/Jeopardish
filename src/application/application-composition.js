(function initApplicationComposition(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    root.JeoPARODYApplicationComposition = factory(root);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function applicationCompositionFactory(
  root,
) {
  'use strict';

  const REQUIRED_CONSTRUCTORS = Object.freeze([
    'EventBus',
    'GameEngine',
    'DataLoader',
    'MediaPreflight',
    'Renderer',
    'ConsoleNarrator',
    'HostManager',
    'HostPerformanceDirector',
    'BroadcastPresenter',
    'BrandController',
    'TranslationService',
    'AudioController',
    'VoiceController',
    'RoundKernel',
    'PreferenceStore',
    'LearningLedger',
    'CluePipeline',
    'SessionManager',
    'EpisodeController',
    'StudyController',
    'InputController',
    'ProductTelemetry',
  ]);

  function resolveBrowserModules(scope = root) {
    return {
      EventBus: scope?.JeopardishEventBus?.EventBus,
      GameEngine: scope?.JeopardishEngine?.GameEngine,
      DataLoader: scope?.JeopardishData?.DataLoader,
      MediaPreflight: scope?.JeoPARODYMedia?.MediaPreflight,
      SceneService: scope?.JeopardishSceneService?.SceneService,
      Renderer: scope?.JeopardishRenderer?.Renderer,
      ConsoleNarrator: scope?.JeopardishConsoleNarrator?.ConsoleNarrator,
      HostManager: scope?.JeopardishHost?.HostManager,
      HostPerformanceDirector: scope?.JeoPARODYHostPerformance?.HostPerformanceDirector,
      BroadcastPresenter: scope?.JeoPARODYBroadcastPresenter?.BroadcastPresenter,
      BrandController: scope?.JeoPARODYBrand?.BrandController,
      TranslationService: scope?.JeoPARODYTranslation?.TranslationService,
      AudioController: scope?.JeoPARODYAudio?.AudioController,
      VoiceController: scope?.JeoPARODYVoice?.VoiceController,
      RoundKernel: scope?.JeoPARODYRoundKernel?.RoundKernel,
      PreferenceStore: scope?.JeoPARODYPreferences?.PreferenceStore,
      LearningLedger: scope?.JeoPARODYLearning?.LearningLedger,
      CluePipeline: scope?.JeoPARODYCluePipeline?.CluePipeline,
      SessionManager: scope?.JeoPARODYSession?.SessionManager,
      EpisodeController: scope?.JeoPARODYEpisodeController?.EpisodeController,
      StudyController: scope?.JeoPARODYStudyController?.StudyController,
      InputController: scope?.JeoPARODYInputController?.InputController,
      ProductTelemetry: scope?.JeoPARODYTelemetry?.ProductTelemetry,
    };
  }

  function validateModules(modules = {}) {
    const missing = REQUIRED_CONSTRUCTORS.filter((name) => typeof modules[name] !== 'function');
    if (missing.length) {
      throw new Error(`ApplicationComposition is missing constructors: ${missing.join(', ')}.`);
    }
    return modules;
  }

  class ApplicationComposition {
    constructor({
      modules = resolveBrowserModules(root),
      events = root?.JeopardishContracts?.GameEvents,
      environment = root,
    } = {}) {
      this.modules = validateModules(modules);
      this.events = events || {};
      this.environment = environment || {};
      this.services = null;
      this.started = false;
      this.destroyed = false;
    }

    create({
      bestStreak = 0,
      preferenceOptions = {},
      learningOptions = {},
      hostPerformanceOptions = {},
      presentationOptions = {},
      voiceOptions = {},
      roundOptions = {},
      cluePipelineOptions = {},
      episodeOptions = {},
      studyOptions = {},
      inputOptions = {},
      telemetryOptions = {},
    } = {}) {
      if (this.destroyed) {
        throw new Error('ApplicationComposition cannot be recreated after destroy().');
      }
      if (this.services) return this.services;

      const M = this.modules;
      const preferenceStore = new M.PreferenceStore(preferenceOptions);
      preferenceStore.load();
      const learningLedger = new M.LearningLedger(learningOptions);
      const eventBus = new M.EventBus();
      const gameEngine = new M.GameEngine({ eventBus, bestStreak });
      const dataLoader = new M.DataLoader({ eventBus });
      const mediaPreflight = new M.MediaPreflight({ eventBus });
      const sceneService = typeof M.SceneService === 'function' ? new M.SceneService() : null;
      const renderer = new M.Renderer();
      const consoleNarrator = new M.ConsoleNarrator({ eventBus });
      const hostManager = new M.HostManager();
      const hostPerformanceDirector = new M.HostPerformanceDirector({
        eventBus,
        ...hostPerformanceOptions,
      });
      const brandController = new M.BrandController();
      const translationService = new M.TranslationService();
      const audioController = new M.AudioController();
      const voiceController = new M.VoiceController(voiceOptions);
      const broadcastPresenter = new M.BroadcastPresenter({
        renderer,
        hostManager,
        hostPerformanceDirector,
        preferenceStore,
        voiceController,
        ...presentationOptions,
      });
      const roundKernel = new M.RoundKernel({
        audio: audioController,
        eventBus,
        ...roundOptions,
      });
      const cluePipeline = new M.CluePipeline({
        roundKernel,
        mediaPreflight,
        ...cluePipelineOptions,
      });
      const sessionManager = new M.SessionManager({ eventBus });
      const episodeController = new M.EpisodeController({
        dataLoader,
        sessionManager,
        cluePipeline,
        gameEngine,
        roundKernel,
        mediaPreflight,
        eventBus,
        learningLedger,
        ...episodeOptions,
      });
      const studyController = new M.StudyController({
        roundKernel,
        renderer,
        eventBus,
        learningLedger,
        ...studyOptions,
      });
      const inputController = new M.InputController({
        eventBus,
        ...inputOptions,
      });
      const productTelemetry = new M.ProductTelemetry({
        eventBus,
        ...telemetryOptions,
      });

      this.services = Object.freeze({
        eventBus,
        gameEngine,
        dataLoader,
        mediaPreflight,
        sceneService,
        renderer,
        consoleNarrator,
        hostManager,
        hostPerformanceDirector,
        broadcastPresenter,
        brandController,
        translationService,
        audioController,
        voiceController,
        roundKernel,
        preferenceStore,
        learningLedger,
        cluePipeline,
        episodeController,
        studyController,
        inputController,
        productTelemetry,
        sessionManager,
      });
      this.emit(this.events.APPLICATION_COMPOSED, {
        serviceCount: Object.keys(this.services).length,
      });
      return this.services;
    }

    start({
      rendererEvents = {},
      initialize = () => {},
    } = {}) {
      if (!this.services) {
        throw new Error('ApplicationComposition.create() must run before start().');
      }
      if (this.destroyed) {
        throw new Error('ApplicationComposition cannot start after destroy().');
      }
      if (this.started) return this.services;

      const S = this.services;
      try {
        S.renderer.bindDom();
        S.brandController.bind();
        S.hostManager.setActiveSkin(S.preferenceStore.get('hostSkinId'));
        S.hostPerformanceDirector.setActivePack(S.preferenceStore.get('hostPackId'));
        S.audioController.setMuted(S.preferenceStore.get('muted'));
        S.voiceController.setEnabled(S.preferenceStore.get('voiceEnabled'));
        S.sceneService?.bindDom();
        S.renderer.bindEvents(rendererEvents);
        S.inputController.bindKeyboard();
        S.productTelemetry.start();
        S.consoleNarrator.start();
        this.started = true;
        initialize(S);
        this.emit(this.events.APPLICATION_STARTED, {
          voiceEnabled: S.voiceController.enabled,
        });
        return S;
      } catch (error) {
        this.destroy({ reason: 'startup-failed' });
        throw error;
      }
    }

    destroy({ reason = 'application-destroyed' } = {}) {
      if (this.destroyed) return false;
      this.destroyed = true;
      const S = this.services;
      if (!S) return true;

      this.emit(this.events.APPLICATION_STOPPED, { reason });
      this.safeInvoke('episode-controller-destroy', () => S.episodeController.destroy());
      this.safeInvoke('round-kernel-cancel', () => S.roundKernel.cancel(undefined, reason));
      this.safeInvoke('input-controller-destroy', () => S.inputController.destroy());
      this.safeInvoke('product-telemetry-stop', () => S.productTelemetry.stop());
      this.safeInvoke('voice-controller-stop', () => S.voiceController.stop());
      this.safeInvoke('scene-service-destroy', () => S.sceneService?.destroy?.());
      this.safeInvoke('console-narrator-stop', () => S.consoleNarrator.stop());
      this.started = false;
      return true;
    }

    safeInvoke(code, operation) {
      try {
        operation();
      } catch (error) {
        this.emit(this.events.ERROR_REPORTED, {
          code,
          message: error?.message || String(error),
        });
      }
    }

    emit(type, payload = {}) {
      if (!type || !this.services?.eventBus?.emit) return null;
      return this.services.eventBus.emit(type, payload, { source: 'ApplicationComposition' });
    }
  }

  return {
    ApplicationComposition,
    REQUIRED_CONSTRUCTORS,
    resolveBrowserModules,
    validateModules,
  };
}));
