import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { EventBus } = require('../src/core/event-bus.js');
const { GameEvents } = require('../src/contracts/events.js');
const { LegalTransitions, RoundKernel, RoundPhases } = require('../src/core/round-kernel.js');

test('RoundKernel owns clue intro, judgment, payoff, and advance', async () => {
  const phases = [];
  const cues = [];
  const kernel = new RoundKernel({
    reducedMotion: true,
    audio: { play: (cue) => cues.push(cue) },
    onPhase: (phase) => phases.push(phase),
  });
  let rendered = 0;

  await kernel.introduceClue(() => { rendered += 1; });
  const result = await kernel.judge(
    () => ({ isCorrect: true, currentStreak: 3 }),
    () => { rendered += 1; },
  );

  assert.equal(result.isCorrect, true);
  assert.equal(rendered, 2);
  assert.equal(kernel.phase, RoundPhases.ADVANCE_READY);
  assert.deepEqual(phases, [
    RoundPhases.LOADING_CLUE,
    RoundPhases.CLUE_INTRO,
    RoundPhases.ANSWERING,
    RoundPhases.JUDGING,
    RoundPhases.CORRECT,
    RoundPhases.ADVANCE_READY,
  ]);
  assert.deepEqual(cues, ['clue', 'lock', 'streak']);
});

test('RoundKernel resolves cancelled delays and ignores stale clue work', async () => {
  let nextTimer = 0;
  const callbacks = new Map();
  const kernel = new RoundKernel({
    scheduler: (callback) => {
      nextTimer += 1;
      callbacks.set(nextTimer, callback);
      return nextTimer;
    },
    clearScheduler: (timer) => callbacks.delete(timer),
  });

  const first = kernel.introduceClue(() => {});
  const second = kernel.introduceClue(() => {});
  callbacks.forEach((callback) => callback());
  await Promise.all([first, second]);

  assert.equal(kernel.phase, RoundPhases.ANSWERING);
  assert.equal(kernel.pending.size, 0);
  assert.equal(kernel.isBusy(), false);
});

test('RoundKernel rejects duplicate judgment while a beat is active', async () => {
  const kernel = new RoundKernel({ reducedMotion: true });
  kernel.busy = true;

  assert.equal(await kernel.judge(() => ({ isCorrect: true }), () => {}), null);
});

test('RoundKernel releases its transaction lock when presentation fails', async () => {
  const kernel = new RoundKernel({ reducedMotion: true });
  await kernel.introduceClue(() => {});

  await assert.rejects(
    kernel.judge(
      () => ({ isCorrect: true, currentStreak: 1 }),
      () => { throw new Error('renderer offline'); },
    ),
    /renderer offline/,
  );

  assert.equal(kernel.isBusy(), false);
  assert.equal(kernel.phase, RoundPhases.ADVANCE_READY);
});

test('RoundKernel treats answer reveal as a one-way advance state', async () => {
  const cues = [];
  const kernel = new RoundKernel({
    reducedMotion: true,
    audio: { play: (cue) => cues.push(cue) },
  });
  let reveals = 0;

  await kernel.introduceClue(() => {});
  cues.length = 0;
  assert.equal(await kernel.reveal(() => { reveals += 1; }), true);
  assert.equal(reveals, 1);
  assert.equal(kernel.phase, RoundPhases.ADVANCE_READY);
  assert.deepEqual(cues, ['reveal']);
});

test('RoundKernel pauses and resumes only the same stable round', async () => {
  const phases = [];
  const kernel = new RoundKernel({ reducedMotion: true, onPhase: (phase) => phases.push(phase) });

  assert.equal(kernel.pause(), null);
  await kernel.introduceClue(() => {});
  const snapshot = kernel.pause();

  assert.deepEqual(snapshot, {
    version: 1,
    phase: RoundPhases.ANSWERING,
    roundId: 'round-1',
    reason: 'study',
  });
  assert.equal(kernel.isPaused(), true);
  assert.equal(kernel.resume(snapshot), true);
  assert.equal(kernel.phase, RoundPhases.ANSWERING);
  assert.deepEqual(phases.slice(-4), [RoundPhases.ANSWERING, RoundPhases.PAUSING, RoundPhases.PAUSED, RoundPhases.RESUMING].concat(RoundPhases.ANSWERING).slice(-4));
});

test('RoundKernel rejects stale pause snapshots after the next clue begins', async () => {
  const kernel = new RoundKernel({ reducedMotion: true });
  await kernel.introduceClue(() => {});
  const staleSnapshot = kernel.pause();

  kernel.beginClueLoad();
  await kernel.introduceClue(() => {});
  kernel.pause();

  assert.equal(kernel.getState().roundId, 'round-2');
  assert.equal(kernel.resume(staleSnapshot), false);
  assert.equal(kernel.isPaused(), true);
});

test('RoundKernel blocks score mutation callbacks while paused', async () => {
  const kernel = new RoundKernel({ reducedMotion: true });
  let scoringCalls = 0;
  await kernel.introduceClue(() => {});
  kernel.pause();

  const result = await kernel.judge(
    () => {
      scoringCalls += 1;
      return { isCorrect: true };
    },
    () => {},
  );

  assert.equal(result, null);
  assert.equal(scoringCalls, 0);
});

test('RoundKernel publishes immutable transition facts and rejects illegal transitions', async () => {
  const eventBus = new EventBus({ now: () => 'now' });
  const events = [];
  eventBus.on('*', (event) => events.push(event));
  const kernel = new RoundKernel({ eventBus, reducedMotion: true });

  assert.equal(Object.isFrozen(LegalTransitions), true);
  assert.throws(
    () => kernel.transition(RoundPhases.CORRECT, 'test-illegal-jump'),
    /Illegal round transition/,
  );

  await kernel.introduceClue(() => {});
  const started = events.find((event) => event.type === GameEvents.ROUND_STARTED);
  const answering = events.find(
    (event) => event.type === GameEvents.ROUND_PHASE_CHANGED
      && event.payload.nextPhase === RoundPhases.ANSWERING,
  );
  const error = events.find((event) => event.type === GameEvents.ERROR_REPORTED);

  assert.equal(started.payload.roundId, 'round-1');
  assert.equal(answering.payload.previousPhase, RoundPhases.CLUE_INTRO);
  assert.equal(answering.meta.source, 'RoundKernel');
  assert.equal(Object.isFrozen(answering.payload), true);
  assert.equal(error.payload.code, 'illegal-round-transition');
});
