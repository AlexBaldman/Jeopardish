import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { FinaleView } = require('../src/render/finale-view.js');

function createElement() {
  return { textContent: '', disabled: false, dataset: {} };
}

test('FinaleView presents an episode receipt without owning gameplay facts', () => {
  const dom = {
    categoryBox: createElement(),
    answerBox: createElement(),
    checkButton: createElement(),
    answerButton: createElement(),
    userInput: createElement(),
    questionButton: createElement(),
  };
  const calls = [];
  const view = new FinaleView({
    dom,
    getCopy: () => ({ episodeComplete: 'Broadcast Complete', replayEpisode: 'Replay Episode' }),
    setGameMoment: (moment) => calls.push(['moment', moment]),
    hideOutcomeFeedback: () => calls.push(['hide-feedback']),
    setText: (element, value) => { element.textContent = value; },
    clearMedia: () => calls.push(['clear-media']),
    setQuestionText: (value) => calls.push(['question', value]),
    toggleAnswer: (visible) => calls.push(['answer', visible]),
    decorateControlButton: (button, label, key) => {
      button.dataset.tooltip = label;
      button.dataset.key = key;
    },
    setReviewQueueState: (learning) => calls.push(['review', learning]),
    showScoreDrawer: () => calls.push(['score-drawer']),
  });

  const progress = {
    total: 10,
    score: 2400,
    counts: { correct: 7, incorrect: 1, revealed: 1, skipped: 1 },
    review: { total: 2 },
    learning: { due: 2 },
    disputes: 1,
    finale: { artifactTitle: 'BROADCAST O', artifactBody: 'The signal has been decoded.' },
  };
  assert.equal(view.render(progress), true);

  assert.deepEqual(calls[0], ['moment', 'complete']);
  assert.match(calls.find(([kind]) => kind === 'question')[1], /70% accuracy/);
  assert.match(calls.find(([kind]) => kind === 'question')[1], /BROADCAST O/);
  assert.match(dom.answerBox.textContent, /2 clues saved for review/);
  assert.match(dom.answerBox.textContent, /1 ruling flagged/);
  assert.equal(dom.categoryBox.textContent, 'Broadcast Complete');
  assert.equal(dom.checkButton.disabled, true);
  assert.equal(dom.answerButton.disabled, true);
  assert.equal(dom.userInput.disabled, true);
  assert.equal(dom.questionButton.disabled, false);
  assert.equal(dom.questionButton.dataset.tooltip, 'Replay Episode');
  assert.ok(calls.some(([kind]) => kind === 'score-drawer'));
});
