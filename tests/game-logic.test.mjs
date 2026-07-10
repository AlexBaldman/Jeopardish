import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const logic = require('../game-logic.js');

test('cleanAnswer strips common prefixes and punctuation', () => {
  assert.equal(logic.cleanAnswer('What is The Eiffel Tower?'), 'eiffeltower');
  assert.equal(logic.cleanAnswer('Who was an Apple?'), 'apple');
  assert.equal(logic.cleanAnswer('  What is Crate & Barrel?!  '), 'crateandbarrel');
  assert.equal(logic.cleanAnswer('John C. Frémont'), 'johncfremont');
});

test('compareAnswers supports exact normalized match', () => {
  assert.equal(logic.compareAnswers('What is Abraham Lincoln?', 'Abraham Lincoln'), true);
  assert.equal(logic.compareAnswers('crate and barrel', 'Crate & Barrel'), true);
  assert.equal(logic.compareAnswers('John C Fremont', 'John C. Frémont'), true);
});

test('compareAnswers supports fuzzy matches for small typos and transpositions', () => {
  assert.equal(logic.compareAnswers('washngton', 'Washington'), true);
  assert.equal(logic.compareAnswers('recieve', 'receive'), true);
});

test('getAcceptedAnswers handles archive-style alternatives without accepting stray details', () => {
  assert.deepEqual(logic.getAcceptedAnswers('The Eiffel Tower (or La Tour Eiffel)'), ['eiffeltower', 'latoureiffel']);
  assert.equal(logic.compareAnswers('La Tour Eiffel', 'The Eiffel Tower (or La Tour Eiffel)'), true);
  assert.equal(logic.compareAnswers('Sri Lanka', 'Ceylon (or Sri Lanka)'), true);
  assert.equal(logic.compareAnswers('England', 'Great Britain/England'), true);
  assert.equal(logic.compareAnswers('Uranus', 'Neptune (Uranus also accepted)'), true);

  assert.deepEqual(logic.getAcceptedAnswers('(Lou) Gehrig'), ['gehrig', 'lougehrig']);
  assert.equal(logic.compareAnswers('Gehrig', '(Lou) Gehrig'), true);
  assert.equal(logic.compareAnswers('Lou Gehrig', '(Lou) Gehrig'), true);
  assert.equal(logic.compareAnswers('Lou', '(Lou) Gehrig'), false);
  assert.equal(logic.compareAnswers('Lewis', 'Lewis & Clark'), false);
});

test('compareAnswers accepts narrow whole-answer variations', () => {
  assert.equal(logic.compareAnswers('cities', 'city'), true);
  assert.equal(logic.compareAnswers('U.S.A.', 'United States'), true);
  assert.equal(logic.compareAnswersDetailed('cities', 'city').reason, 'variation');
});

test('compareAnswers rejects ambiguous near matches and tiny substring guesses', () => {
  assert.equal(logic.compareAnswers('cop', 'Copernicus'), false);
  assert.equal(logic.compareAnswers('a', 'Australia'), false);
  assert.equal(logic.compareAnswers('Iran', 'Iraq'), false);
  assert.equal(logic.compareAnswers('Holland', 'Poland'), false);
});

test('compareAnswersDetailed explains exact, fuzzy, and rejected outcomes', () => {
  const fuzzy = logic.compareAnswersDetailed('washngton', 'Washington');
  assert.equal(fuzzy.isCorrect, true);
  assert.equal(fuzzy.reason, 'fuzzy');
  assert.equal(fuzzy.distance, 1);

  const mismatch = logic.compareAnswersDetailed('Iran', 'Iraq');
  assert.equal(mismatch.isCorrect, false);
  assert.equal(mismatch.reason, 'mismatch');
  assert.equal(mismatch.threshold, 0);
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
