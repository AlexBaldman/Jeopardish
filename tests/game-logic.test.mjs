import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const logic = require('../game-logic.js');

test('cleanAnswer strips common prefixes and punctuation', () => {
  assert.equal(logic.cleanAnswer('What is The Eiffel Tower?'), 'eiffeltower');
  assert.equal(logic.cleanAnswer('Who was an Apple?'), 'apple');
});

test('compareAnswers supports exact normalized match', () => {
  assert.equal(logic.compareAnswers('What is Abraham Lincoln?', 'Abraham Lincoln'), true);
});

test('compareAnswers supports fuzzy match with small typo', () => {
  assert.equal(logic.compareAnswers('washngton', 'Washington'), true);
});

test('compareAnswers does not accept tiny substring guesses', () => {
  assert.equal(logic.compareAnswers('cop', 'Copernicus'), false);
  assert.equal(logic.compareAnswers('a', 'Australia'), false);
});

test('compareAnswers rejects empty values', () => {
  assert.equal(logic.compareAnswers('', 'anything'), false);
  assert.equal(logic.compareAnswers('something', ''), false);
});

test('parseClueValue handles numeric, currency strings, and fallback', () => {
  assert.equal(logic.parseClueValue(400), 400);
  assert.equal(logic.parseClueValue('$1,200'), 1200);
  assert.equal(logic.parseClueValue('unknown', 100), 100);
});

test('normalizeQuestionRecord sanitizes and normalizes raw records', () => {
  const normalized = logic.normalizeQuestionRecord({
    id: 42,
    category: { title: 'science' },
    question: '  What planet is known as the red planet? ',
    answer: ' Mars ',
    value: '$400',
  });

  assert.deepEqual(normalized, {
    id: 42,
    category: 'science',
    question: 'What planet is known as the red planet?',
    answer: 'Mars',
    value: '$400',
    numericValue: 400,
  });
});

test('normalizeQuestionRecord drops unusable clues', () => {
  assert.equal(logic.normalizeQuestionRecord({ question: '', answer: 'x' }), null);
  assert.equal(logic.normalizeQuestionRecord({ question: 'x', answer: '' }), null);
  assert.equal(logic.normalizeQuestionRecord(null), null);
});
