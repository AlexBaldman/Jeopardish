import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanAnswer, compareAnswers, compareAnswersDetailed, getAcceptedAnswers, parseClueValue } from '../game-logic.js';

test('cleanAnswer strips common prefixes and punctuation', () => {
  assert.equal(cleanAnswer('What is The Eiffel Tower?'), 'eiffeltower');
  assert.equal(cleanAnswer('Who was an Apple?'), 'apple');
});

test('compareAnswers supports exact normalized match', () => {
  assert.equal(compareAnswers('What is Abraham Lincoln?', 'Abraham Lincoln'), true);
});

test('compareAnswersDetailed explains exact and fuzzy outcomes', () => {
  assert.deepEqual(
    compareAnswersDetailed('What is Abraham Lincoln?', 'Abraham Lincoln'),
    {
      isCorrect: true,
      reason: 'exact',
      userAnswer: 'abrahamlincoln',
      correctAnswer: 'abrahamlincoln',
      acceptedAnswers: ['abrahamlincoln'],
      distance: 0,
    },
  );

  const fuzzy = compareAnswersDetailed('washngton', 'Washington');
  assert.equal(fuzzy.isCorrect, true);
  assert.equal(fuzzy.reason, 'fuzzy');
  assert.equal(fuzzy.distance, 1);
});

test('getAcceptedAnswers handles parenthetical alternate answers', () => {
  assert.deepEqual(
    getAcceptedAnswers('The Eiffel Tower (or La Tour Eiffel)'),
    ['eiffeltower', 'latoureiffel'],
  );
  assert.equal(compareAnswers('La Tour Eiffel', 'The Eiffel Tower (or La Tour Eiffel)'), true);
});

test('compareAnswers supports fuzzy match with small typo', () => {
  assert.equal(compareAnswers('washngton', 'Washington'), true);
});

test('compareAnswers does not accept tiny substring guesses', () => {
  assert.equal(compareAnswers('cop', 'Copernicus'), false);
  assert.equal(compareAnswers('a', 'Australia'), false);
});

test('compareAnswers rejects empty values', () => {
  assert.equal(compareAnswers('', 'anything'), false);
  assert.equal(compareAnswers('something', ''), false);
});

test('parseClueValue handles numeric, currency strings, and fallback', () => {
  assert.equal(parseClueValue(400), 400);
  assert.equal(parseClueValue('$1,200'), 1200);
  assert.equal(parseClueValue('unknown', 100), 100);
});
