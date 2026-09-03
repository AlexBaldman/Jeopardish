(function initStageDirector(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('../contracts/events.js'),
      require('./stage-engine.js'),
    );
  } else {
    root.JeoPARODYStageDirector = factory(
      root.JeopardishContracts,
      root.JeoPARODYStageEngine,
    );
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function stageDirectorFactory(
  contracts,
  stageModule,
) {
  'use strict';

  if (!contracts || !stageModule) {
    throw new Error('StageDirector requires event and StageEngine contracts.');
  }

  const { GameEvents } = contracts;
  const {
    CameraShots,
    STAGE_CUE_SCHEMA,
    STAGE_CUE_VERSION,
    StageScenes,
  } = stageModule;

  const EVENT_DIRECTIONS = Object.freeze({
    [GameEvents.APPLICATION_STARTED]: Object.freeze({
      scene: StageScenes.INTRO,
      camera: Object.freeze({ shot: CameraShots.WIDE, target: 'stage' }),
    }),
    [GameEvents.CLUE_LOADED]: Object.freeze({
      scene: StageScenes.CLUE,
      camera: Object.freeze({ shot: CameraShots.MEDIUM, target: 'clue' }),
    }),
    [GameEvents.ANSWER_CORRECT]: Object.freeze({
      scene: StageScenes.CORRECT,
      camera: Object.freeze({ shot: CameraShots.CLOSE_UP, target: 'host' }),
    }),
    [GameEvents.ANSWER_INCORRECT]: Object.freeze({
      scene: StageScenes.WRONG,
      camera: Object.freeze({ shot: CameraShots.CLOSE_UP, target: 'host' }),
    }),
    [GameEvents.SESSION_COMPLETED]: Object.freeze({
      scene: StageScenes.WINNER,
      camera: Object.freeze({ shot: CameraShots.WIDE, target: 'stage' }),
    }),
  });

  const ROUND_TRANSITION_DIRECTION = Object.freeze({
    scene: StageScenes.ROUND_TRANSITION,
    camera: Object.freeze({ shot: CameraShots.WIDE, target: 'stage' }),
  });

  const STAGE_EVENT_TYPES = Object.freeze([
    ...Object.keys(EVENT_DIRECTIONS),
    GameEvents.ROUND_PHASE_CHANGED,
  ]);

  const SAFE_FACT_KEYS = Object.freeze([
    'episodeId',
    'clueId',
    'roundId',
    'current',
    'answered',
    'total',
    'score',
    'newScore',
    'scoreDelta',
    'currentStreak',
    'bestStreak',
    'complete',
  ]);

  function safeScalar(value) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number' && Number.isFinite(value)) return value;
    if (typeof value === 'string') return value.trim().slice(0, 120);
    return undefined;
  }

  function createReceipt(payload = {}) {
    const source = {
      ...payload,
      clueId: payload.clueId || payload.clue?.id,
    };
    const entries = SAFE_FACT_KEYS.flatMap((key) => {
      const value = safeScalar(source[key]);
      return value === undefined ? [] : [[key, value]];
    });
    return Object.freeze(Object.fromEntries(entries));
  }

  function createStageCue(event = {}) {
    const isRoundTransition = (
      event.type === GameEvents.ROUND_PHASE_CHANGED
      && event.payload?.nextPhase === 'loading-clue'
      && event.payload?.previousPhase === 'advance-ready'
    );
    const direction = isRoundTransition
      ? ROUND_TRANSITION_DIRECTION
      : EVENT_DIRECTIONS[event.type];
    if (!direction) return null;
    return Object.freeze({
      schema: STAGE_CUE_SCHEMA,
      version: STAGE_CUE_VERSION,
      eventType: event.type,
      scene: direction.scene,
      camera: direction.camera,
      receipt: createReceipt(event.payload),
    });
  }

  class StageDirector {
    constructor({ eventBus, stage, onCue = () => {} } = {}) {
      if (!eventBus?.on || !stage?.present) {
        throw new Error('StageDirector requires an event bus and StageEngine.');
      }
      this.eventBus = eventBus;
      this.stage = stage;
      this.onCue = onCue;
      this.unsubscribers = [];
      this.started = false;
    }

    start() {
      if (this.started) return this;
      STAGE_EVENT_TYPES.forEach((type) => {
        this.unsubscribers.push(this.eventBus.on(type, (event) => this.handle(event)));
      });
      this.unsubscribers.push(this.eventBus.on(
        GameEvents.HOST_PERFORMANCE_DIRECTED,
        (event) => this.stage.presentHost(event.payload),
      ));
      this.started = true;
      return this;
    }

    handle(event) {
      const cue = createStageCue(event);
      if (!cue) return null;
      this.stage.present(cue);
      this.onCue(cue);
      return cue;
    }

    stop() {
      this.unsubscribers.splice(0).forEach((unsubscribe) => unsubscribe());
      const wasStarted = this.started;
      this.started = false;
      return wasStarted;
    }
  }

  return {
    EVENT_DIRECTIONS,
    ROUND_TRANSITION_DIRECTION,
    SAFE_FACT_KEYS,
    STAGE_EVENT_TYPES,
    StageDirector,
    createReceipt,
    createStageCue,
  };
}));
