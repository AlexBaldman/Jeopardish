import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { DialogueStyles, UiCopy, getUiCopy } = require('../src/presentation/ui-catalog.js');

test('UI catalog exposes immutable bilingual control and narration copy', () => {
  assert.equal(Object.isFrozen(DialogueStyles), true);
  assert.equal(Object.isFrozen(UiCopy.en), true);
  assert.equal(Object.isFrozen(UiCopy['pt-BR']), true);
  for (const key of [
    'questionButton',
    'answerButton',
    'checkButton',
    'askHost',
    'askHostAboutClue',
    'hostPersonality',
    'languageSwitchToPortuguese',
    'languageSwitchToEnglish',
    'voiceClue',
    'voiceCorrect',
    'voiceIncorrect',
    'voiceReveal',
    'voiceComplete',
  ]) {
    assert.equal(typeof UiCopy.en[key], typeof UiCopy['pt-BR'][key], key);
  }
  assert.equal(UiCopy.en.askHost, 'Ask Host');
  assert.equal(UiCopy['pt-BR'].askHost, 'Pergunte ao Host');
  assert.equal(getUiCopy('unknown'), UiCopy.en);
});

test('dialogue styles retain localized labels and stable ids', () => {
  assert.deepEqual(
    DialogueStyles.map(({ id }) => id),
    ['clue-card', 'speech', 'thought', 'narration'],
  );
  DialogueStyles.forEach((style) => {
    assert.equal(typeof style.label.en, 'string');
    assert.equal(typeof style.label['pt-BR'], 'string');
  });
});
