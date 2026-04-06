import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const logic = require('../game-logic.js');

test('cleanAnswer strips common prefixes and punctuation', () => {
  assert.equal(logic.cleanAnswer('What is The Eiffel Tower?'), 'eiffeltower');
  assert.equal(logic.cleanAnswer('Who was an Apple?'), 'apple');
});

test('compareAnswers supports substring match', () => {
  assert.equal(logic.compareAnswers('lincoln', 'Abraham Lincoln'), true);
});

test('compareAnswers supports fuzzy match with small typo', () => {
  assert.equal(logic.compareAnswers('washngton', 'Washington'), true);
});

test('compareAnswers rejects empty values', () => {
  assert.equal(logic.compareAnswers('', 'anything'), false);
  assert.equal(logic.compareAnswers('something', ''), false);
});
