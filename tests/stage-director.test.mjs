import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { GameEvents } = require('../src/contracts/events.js');
const { EventBus } = require('../src/core/event-bus.js');
const { StageEngine, StageScenes } = require('../src/presentation/stage-engine.js');
const { StageDirector, createStageCue } = require('../src/presentation/stage-director.js');

test('StageDirector maps the six load-bearing show moments deterministically', () => {
  const expected = new Map([
    [GameEvents.APPLICATION_STARTED, StageScenes.INTRO],
    [GameEvents.CLUE_LOADED, StageScenes.CLUE],
    [GameEvents.ANSWER_CORRECT, StageScenes.CORRECT],
    [GameEvents.ANSWER_INCORRECT, StageScenes.WRONG],
    [GameEvents.SESSION_COMPLETED, StageScenes.WINNER],
  ]);

  for (const [type, scene] of expected) {
    assert.equal(createStageCue({ type, payload: {} }).scene, scene);
    assert.deepEqual(
      createStageCue({ type, payload: {} }),
      createStageCue({ type, payload: {} }),
    );
  }

  const transition = {
    type: GameEvents.ROUND_PHASE_CHANGED,
    payload: { previousPhase: 'advance-ready', nextPhase: 'loading-clue' },
  };
  assert.equal(createStageCue(transition).scene, StageScenes.ROUND_TRANSITION);
  assert.equal(createStageCue({
    type: GameEvents.ROUND_PHASE_CHANGED,
    payload: { previousPhase: 'judging', nextPhase: 'correct' },
  }), null);
});

test('Stage cues retain useful receipts without leaking clue or answer content', () => {
  const cue = createStageCue({
    type: GameEvents.ANSWER_CORRECT,
    payload: {
      clueId: 'clue-7',
      submittedAnswer: 'private player answer',
      correctAnswer: 'private canonical answer',
      clue: { id: 'clue-7', question: 'private clue text' },
      newScore: 800,
      scoreDelta: 400,
      currentStreak: 2,
    },
  });

  assert.deepEqual(cue.receipt, {
    clueId: 'clue-7',
    newScore: 800,
    scoreDelta: 400,
    currentStreak: 2,
  });
  const serialized = JSON.stringify(cue);
  assert.doesNotMatch(serialized, /private player answer|private canonical answer|private clue text/);
  assert.equal(Object.isFrozen(cue), true);
  assert.equal(Object.isFrozen(cue.receipt), true);
});

test('StageEngine projects semantic cues and HostPerformanceDirector events onto the stage', () => {
  const eventBus = new EventBus();
  const rootElement = { dataset: {} };
  const stage = new StageEngine({ rootElement }).bind();
  const cues = [];
  const director = new StageDirector({ eventBus, stage, onCue: (cue) => cues.push(cue) });

  assert.equal(director.start(), director);
  assert.equal(director.start(), director);
  eventBus.emit(GameEvents.CLUE_LOADED, {
    clue: { id: 'clue-1', question: 'never projected' },
    clueValue: 200,
  });
  eventBus.emit(GameEvents.HOST_PERFORMANCE_DIRECTED, {
    packId: 'vera-static',
    beat: 'clue',
    expression: 'clue',
    line: 'not stage truth',
  });

  const state = stage.getState();
  assert.equal(state.scene, StageScenes.CLUE);
  assert.equal(state.camera.target, 'clue');
  assert.deepEqual(state.host, {
    beat: 'clue',
    expression: 'clue',
    packId: 'vera-static',
  });
  assert.equal(rootElement.dataset.stageRuntime, 'ready');
  assert.equal(rootElement.dataset.stageScene, 'clue');
  assert.equal(rootElement.dataset.cameraShot, 'medium');
  assert.equal(rootElement.dataset.hostBeat, 'clue');
  assert.equal(cues.length, 1);

  assert.equal(director.stop(), true);
  assert.equal(director.stop(), false);
  eventBus.emit(GameEvents.SESSION_COMPLETED, { score: 1000 });
  assert.equal(stage.getState().scene, StageScenes.CLUE);
});

test('StageEngine rejects unversioned presentation data', () => {
  const stage = new StageEngine();
  assert.throws(() => stage.present({ scene: StageScenes.CLUE }), /versioned stage cue/);
});
