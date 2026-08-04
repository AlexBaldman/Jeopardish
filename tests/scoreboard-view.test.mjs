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
      const timer = { callback, duration, unref() {} };
      timers.push(timer);
      return timer;
    },
    clearTimer: () => {},
  });
  return { dom, timers, view };
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
  assert.equal(dom.hudScore.classList.contains('score-flip'), true);
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
  view.hideDrawer();
  assert.equal(dom.scoreDrawer.classList.contains('active'), true);

  dom.scoreDrawer.listeners.click();
  assert.equal(dom.scoreDrawer.dataset.pinned, 'false');
  assert.equal(dom.scoreDrawer.classList.contains('active'), false);
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
