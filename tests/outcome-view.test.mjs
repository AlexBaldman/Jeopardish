import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { OutcomeView } = require('../src/render/outcome-view.js');

function createHarness() {
  const calls = [];
  const element = () => ({
    textContent: '',
    hidden: true,
    attributes: {},
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
  });
  const dom = {
    categoryBox: element(),
    answerBox: element(),
    outcomeFeedback: element(),
    confidenceKnew: element(),
    confidenceShaky: element(),
    confidenceLearned: element(),
    disputeButton: element(),
    outcomeFeedbackStatus: element(),
  };
  const copy = {
    exactJudgment: 'Exact',
    variationJudgment: 'Variation',
    fuzzyJudgment: 'Typo accepted',
    correctKicker: 'Correct',
    correctMessage: 'Right',
    correctResponseLabel: 'Response:',
    correctAnswerStreak: 'Streak',
    incorrectKicker: 'No',
    incorrectMessage: 'Incorrect',
    yourResponseLabel: 'You:',
    streakReset: 'Reset',
    disputeRecorded: 'Flagged',
    disputeJudgment: 'Dispute',
    confidencePrompt: 'Confidence?',
    confidenceKnew: 'Knew it',
    confidenceShaky: 'Shaky',
    confidenceLearned: 'Learned it',
  };
  const view = new OutcomeView({
    dom,
    getCopy: () => copy,
    setText(elementRef, value) {
      elementRef.textContent = String(value);
    },
    setGameMoment: (moment) => calls.push(['moment', moment]),
    clearMedia: () => calls.push(['clear-media']),
    setQuestionText: (message) => calls.push(['question', message]),
    toggleAnswer: (visible) => calls.push(['answer', visible]),
  });
  return { calls, dom, view };
}

test('OutcomeView renders correct and incorrect payoff without game authority', () => {
  const { calls, dom, view } = createHarness();
  view.displayCorrect({
    scoreDelta: 400,
    currentStreak: 3,
    correctAnswer: 'Saturn',
    answerMatch: { reason: 'fuzzy' },
  });
  assert.equal(dom.categoryBox.textContent, 'Correct');
  assert.match(dom.answerBox.textContent, /Saturn/);
  assert.match(dom.answerBox.textContent, /Typo accepted/);
  assert.ok(calls.some(([name, moment]) => name === 'moment' && moment === 'correct'));

  view.displayIncorrect({ submittedAnswer: 'Mars', correctAnswer: 'Saturn' });
  assert.equal(dom.categoryBox.textContent, 'No');
  assert.match(dom.answerBox.textContent, /You: Mars/);
  assert.match(dom.answerBox.textContent, /Response: Saturn/);
  assert.equal(calls.some(([name]) => name === 'score'), false);
});

test('OutcomeView owns confidence and dispute visibility', () => {
  const { dom, view } = createHarness();
  assert.equal(view.renderFeedback({ confidence: 'shaky', disputed: true }), true);
  assert.equal(dom.outcomeFeedback.hidden, false);
  assert.equal(dom.confidenceShaky.attributes['aria-pressed'], 'true');
  assert.equal(dom.disputeButton.attributes['aria-pressed'], 'true');
  assert.equal(dom.disputeButton.textContent, 'Flagged');
  assert.match(dom.outcomeFeedbackStatus.textContent, /Shaky/);

  assert.equal(view.hideFeedback(), true);
  assert.equal(dom.outcomeFeedback.hidden, true);
  assert.equal(dom.outcomeFeedbackStatus.textContent, '');
});
