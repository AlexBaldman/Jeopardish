import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { RoundDirector, RoundPhases } = require('../src/directors/round-director.js');

test('RoundDirector directs clue intro, judgment, payoff, and advance', async () => {
  const phases = [];
  const cues = [];
  const director = new RoundDirector({
    reducedMotion: true,
    audio: { play: (cue) => cues.push(cue) },
    onPhase: (phase) => phases.push(phase),
  });
  let rendered = 0;

  await director.introduceClue(() => { rendered += 1; });
  const result = await director.judge(
    () => ({ isCorrect: true, currentStreak: 3 }),
    () => { rendered += 1; },
  );

  assert.equal(result.isCorrect, true);
  assert.equal(rendered, 2);
  assert.equal(director.phase, RoundPhases.ADVANCE_READY);
  assert.deepEqual(phases, [
    RoundPhases.CLUE_INTRO,
    RoundPhases.ANSWERING,
    RoundPhases.JUDGING,
    RoundPhases.CORRECT,
    RoundPhases.ADVANCE_READY,
  ]);
  assert.deepEqual(cues, ['clue', 'lock', 'streak']);
});

test('RoundDirector resolves cancelled delays and ignores stale clue work', async () => {
  let nextTimer = 0;
  const callbacks = new Map();
  const director = new RoundDirector({
    scheduler: (callback) => {
      nextTimer += 1;
      callbacks.set(nextTimer, callback);
      return nextTimer;
    },
    clearScheduler: (timer) => callbacks.delete(timer),
  });

  const first = director.introduceClue(() => {});
  const second = director.introduceClue(() => {});
  callbacks.forEach((callback) => callback());
  await Promise.all([first, second]);

  assert.equal(director.phase, RoundPhases.ANSWERING);
  assert.equal(director.pending.size, 0);
  assert.equal(director.isBusy(), false);
});

test('RoundDirector rejects duplicate judgment while a beat is active', async () => {
  const director = new RoundDirector({ reducedMotion: true });
  director.busy = true;

  assert.equal(await director.judge(() => ({ isCorrect: true }), () => {}), null);
});

test('RoundDirector treats answer reveal as a one-way advance state', async () => {
  const cues = [];
  const director = new RoundDirector({
    reducedMotion: true,
    audio: { play: (cue) => cues.push(cue) },
  });
  let reveals = 0;

  assert.equal(await director.reveal(() => { reveals += 1; }), true);
  assert.equal(reveals, 1);
  assert.equal(director.phase, RoundPhases.ADVANCE_READY);
  assert.deepEqual(cues, ['reveal']);
});

test('RoundDirector pauses and resumes only stable round phases', async () => {
  const phases = [];
  const director = new RoundDirector({ reducedMotion: true, onPhase: (phase) => phases.push(phase) });

  assert.equal(director.pause(), null);
  await director.introduceClue(() => {});
  const snapshot = director.pause();

  assert.deepEqual(snapshot, { version: 1, phase: RoundPhases.ANSWERING });
  assert.equal(director.isPaused(), true);
  assert.equal(director.resume(snapshot), true);
  assert.equal(director.phase, RoundPhases.ANSWERING);
  assert.deepEqual(phases.slice(-4), [RoundPhases.ANSWERING, RoundPhases.PAUSING, RoundPhases.PAUSED, RoundPhases.RESUMING].concat(RoundPhases.ANSWERING).slice(-4));
});
