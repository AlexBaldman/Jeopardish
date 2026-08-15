import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { ScoreboardView } = require('../src/render/scoreboard-view.js');

function createElement() {
  return {
    textContent: '',
    dataset: {},
    attributes: {},
    listeners: {},
    classList: {
      values: new Set(),
      add(value) { this.values.add(value); },
      remove(value) { this.values.delete(value); },
      contains(value) { return this.values.has(value); },
    },
    addEventListener(type, listener) { this.listeners[type] = listener; },
    setAttribute(name, value) { this.attributes[name] = value; },
  };
}

function createView() {
  const dom = {
    scoreDrawer: createElement(),
    hudScore: createElement(),
    hudStreak: createElement(),
    hudBest: createElement(),
    hudScoreLabel: createElement(),
    hudStreakLabel: createElement(),
    hudBestLabel: createElement(),
    hudEpisode: createElement(),
    hudEpisodeLabel: createElement(),
  };
  const timers = [];
  const clearedTimers = [];
  const view = new ScoreboardView({
    dom,
    getCopy: () => ({
      score: 'Score',
      currentStreak: 'Streak',
      bestStreak: 'Best',
      clueProgress: 'Clue',
    }),
    setText: (element, value) => { if (element) element.textContent = value; },
    setTimer: (callback, duration) => {
      const timer = { callback, duration, cleared: false, unref() {} };
      timers.push(timer);
      return timer;
    },
    clearTimer: (timer) => {
      if (!timer) return;
      timer.cleared = true;
      clearedTimers.push(timer);
    },
  });
  return { clearedTimers, dom, timers, view };
}

test('ScoreboardView presents values and opens only when a fact changes', () => {
  const { dom, view } = createView();

  view.renderScore({ score: 0, currentStreak: 0, bestStreak: 0 });
  assert.equal(dom.scoreDrawer.classList.contains('active'), false);

  view.renderScore({ score: 400, currentStreak: 1, bestStreak: 1 });
  assert.equal(dom.hudScore.textContent, '$400');
  assert.equal(dom.hudStreak.textContent, 'x1');
  assert.equal(dom.hudBest.textContent, 'x1');
  assert.equal(dom.hudScoreLabel.textContent, 'Score');
  assert.equal(dom.scoreDrawer.classList.contains('active'), true);
  assert.equal(dom.scoreDrawer.dataset.drawerState, 'peeking');
  assert.equal(dom.scoreDrawer.attributes['aria-expanded'], 'true');
  assert.equal(dom.hudScore.classList.contains('score-flip'), true);
  assert.equal(dom.hudScore.classList.contains('split-flap-changing'), true);
  assert.equal(dom.hudScore.dataset.previousValue, '0');
  assert.equal(dom.hudScore.dataset.nextValue, '$400');
  assert.equal(dom.hudScore.dataset.changeKind, 'score');
  assert.equal(dom.hudScore.dataset.changeDirection, 'up');

  const timerCount = view.drawerTimerGeneration;
  view.renderScore({ score: 400, currentStreak: 1, bestStreak: 1 });
  assert.equal(view.drawerTimerGeneration, timerCount);
});

test('ScoreboardView owns progress animation and drawer pinning', () => {
  const { dom, view } = createView();
  assert.equal(view.bindInteractions(), true);
  assert.equal(view.bindInteractions(), false);

  view.renderProgress({ current: 1, total: 10, complete: false });
  view.renderProgress({ current: 2, total: 10, complete: false });
  assert.equal(dom.hudEpisode.textContent, '2/10');
  assert.equal(dom.hudEpisodeLabel.textContent, 'Clue');
  assert.equal(dom.hudEpisode.classList.contains('score-flip'), true);

  dom.scoreDrawer.listeners.click();
  assert.equal(dom.scoreDrawer.dataset.pinned, 'true');
  assert.equal(dom.scoreDrawer.attributes['aria-pressed'], 'true');
  assert.equal(dom.scoreDrawer.dataset.drawerState, 'pinned');
  view.hideDrawer();
  assert.equal(dom.scoreDrawer.classList.contains('active'), true);

  dom.scoreDrawer.listeners.blur();
  dom.scoreDrawer.listeners.click();
  assert.equal(dom.scoreDrawer.dataset.pinned, 'false');
  assert.equal(dom.scoreDrawer.classList.contains('active'), false);
  assert.equal(dom.scoreDrawer.attributes['aria-expanded'], 'false');
});

test('ScoreboardView safely replaces automatic peek timers', () => {
  const { clearedTimers, dom, timers, view } = createView();

  view.renderScore({ score: 0, currentStreak: 0, bestStreak: 0 });
  view.renderScore({ score: 200, currentStreak: 1, bestStreak: 1 });
  const firstDrawerTimer = timers.find((timer) => timer.duration === 2600);
  view.renderScore({ score: 400, currentStreak: 2, bestStreak: 2 });
  const drawerTimers = timers.filter((timer) => timer.duration === 2600);

  assert.equal(drawerTimers.length, 2);
  assert.ok(clearedTimers.includes(firstDrawerTimer));
  firstDrawerTimer.callback();
  assert.equal(dom.scoreDrawer.classList.contains('active'), true);
  assert.equal(dom.scoreDrawer.dataset.drawerState, 'peeking');

  drawerTimers[1].callback();
  assert.equal(dom.scoreDrawer.classList.contains('active'), false);
  assert.equal(dom.scoreDrawer.dataset.drawerState, 'closing');
  timers.find((timer) => timer.duration === 520).callback();
  assert.equal(dom.scoreDrawer.dataset.drawerState, 'hidden');
});

test('ScoreboardView keeps pointer, focus, and keyboard-owned expansion accessible', () => {
  const { dom, view } = createView();
  view.bindInteractions();

  dom.scoreDrawer.listeners.pointerenter();
  assert.equal(dom.scoreDrawer.dataset.drawerState, 'expanded');
  dom.scoreDrawer.listeners.focus();
  dom.scoreDrawer.listeners.pointerleave();
  assert.equal(dom.scoreDrawer.classList.contains('active'), true);

  dom.scoreDrawer.listeners.click();
  assert.equal(dom.scoreDrawer.dataset.drawerState, 'pinned');
  let prevented = false;
  dom.scoreDrawer.listeners.keydown({
    key: 'Escape',
    preventDefault() { prevented = true; },
    stopPropagation() {},
  });
  assert.equal(prevented, true);
  assert.equal(dom.scoreDrawer.dataset.pinned, 'false');
  assert.equal(dom.scoreDrawer.attributes['aria-pressed'], 'false');
  assert.equal(dom.scoreDrawer.attributes['aria-expanded'], 'false');
  assert.equal(dom.scoreDrawer.classList.contains('active'), false);
});

test('ScoreboardView ignores the moving panel crossing a stationary pointer while closing', () => {
  const { dom, view } = createView();
  dom.scoreDrawer.querySelector = () => ({
    getBoundingClientRect: () => ({ left: 20, right: 120, top: 10, bottom: 40 }),
  });
  view.bindInteractions();
  view.syncDrawerState('closing');

  dom.scoreDrawer.listeners.pointerenter({ clientX: 70, clientY: 90 });
  assert.equal(dom.scoreDrawer.classList.contains('active'), false);
  assert.equal(view.pointerInside, false);

  dom.scoreDrawer.listeners.pointerenter({ clientX: 70, clientY: 24 });
  assert.equal(dom.scoreDrawer.classList.contains('active'), true);
  assert.equal(dom.scoreDrawer.dataset.drawerState, 'expanded');
});

test('ScoreboardView does not let stale tile timers settle a newer transition', () => {
  const { dom, timers, view } = createView();
  view.renderScore({ score: 0, currentStreak: 0, bestStreak: 0 });
  view.renderScore({ score: 200, currentStreak: 1, bestStreak: 1 });
  const firstScoreTimer = timers.find((timer) => timer.duration === 720);
  view.renderScore({ score: -200, currentStreak: 0, bestStreak: 1 });
  const currentScoreTimer = view.tileTimers.get(dom.hudScore).timer;

  assert.equal(dom.hudScore.dataset.changeDirection, 'down');
  firstScoreTimer.callback();
  assert.equal(dom.hudScore.dataset.transitionState, 'flipping');
  assert.equal(dom.hudScore.classList.contains('split-flap-changing'), true);

  currentScoreTimer.callback();
  assert.equal(dom.hudScore.dataset.transitionState, 'settled');
  assert.equal(dom.hudScore.classList.contains('split-flap-changing'), false);
});

test('ScoreboardView peeks for episode progress changes but not identical progress', () => {
  const { dom, timers, view } = createView();
  view.renderProgress({ current: 1, total: 10, complete: false });
  const initialTimerCount = timers.length;
  view.renderProgress({ current: 1, total: 10, complete: false });
  assert.equal(timers.length, initialTimerCount);

  view.renderProgress({ current: 2, total: 10, complete: false });
  assert.equal(dom.hudEpisode.dataset.changeKind, 'episode-progress');
  assert.equal(dom.hudEpisode.dataset.previousValue, '1/10');
  assert.equal(dom.hudEpisode.dataset.nextValue, '2/10');
  assert.equal(dom.scoreDrawer.dataset.drawerState, 'peeking');
});

test('ScoreboardView calls browser timer primitives with their global receiver', () => {
  const originalSetTimeout = globalThis.setTimeout;
  const originalClearTimeout = globalThis.clearTimeout;
  const receivers = [];
  globalThis.setTimeout = function timer() {
    receivers.push(this);
    return { unref() {} };
  };
  globalThis.clearTimeout = function clear() {
    receivers.push(this);
  };
  try {
    const dom = {
      scoreDrawer: createElement(),
      hudScore: createElement(),
      hudStreak: createElement(),
      hudBest: createElement(),
    };
    const view = new ScoreboardView({
      dom,
      getCopy: () => ({}),
      setText: (element, value) => { if (element) element.textContent = value; },
    });
    view.renderScore({ score: 0, currentStreak: 0, bestStreak: 0 });
    view.renderScore({ score: 200, currentStreak: 1, bestStreak: 1 });
    assert.ok(receivers.length >= 4);
    assert.ok(receivers.every((receiver) => receiver === globalThis));
  } finally {
    globalThis.setTimeout = originalSetTimeout;
    globalThis.clearTimeout = originalClearTimeout;
  }
});

test('ScoreboardView clears pending drawer and split-flap work on destroy', () => {
  const { clearedTimers, timers, view } = createView();
  view.renderScore({ score: 0, currentStreak: 0, bestStreak: 0 });
  view.renderScore({ score: 200, currentStreak: 1, bestStreak: 1 });

  const pending = timers.filter((timer) => !timer.cleared);
  assert.ok(pending.length >= 4);
  assert.equal(view.destroy(), true);
  assert.ok(pending.every((timer) => clearedTimers.includes(timer)));
  assert.equal(view.drawerTimer, null);
  assert.equal(view.activeTileTimers.size, 0);
});
