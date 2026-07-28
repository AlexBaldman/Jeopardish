import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { ClueView, MediaTypes, extractClueMedia } = require('../src/render/clue-view.js');

function element() {
  return {
    children: [],
    dataset: {},
    style: {},
    attributes: {},
    hidden: false,
    textContent: '',
    value: '',
    append(...children) {
      this.children.push(...children);
      this.textContent = children.map((child) => child.textContent).join('');
    },
    replaceChildren(...children) {
      this.children = children;
      this.textContent = children.map((child) => child.textContent).join('');
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    addEventListener(type, listener) {
      this.listeners ||= {};
      this.listeners[type] = listener;
    },
  };
}

function createHarness() {
  const calls = [];
  const dom = {
    categoryBox: element(),
    questionBox: element(),
    clueText: element(),
    clueOriginal: element(),
    clueMedia: element(),
    answerBox: element(),
    reviewQueueButton: element(),
    reviewQueueStatus: element(),
    questionButton: element(),
    translationState: element(),
    translationStateLabel: element(),
  };
  const documentRef = {
    createElement: () => element(),
  };
  const copy = {
    questionButton: 'New Clue',
    newClue: 'Clue ready',
    translatingClue: 'Translating...',
    translationOnDevice: 'ON DEVICE',
    translationNetwork: 'MACHINE',
    translationCache: 'CACHED',
    translationFallback: 'English shown',
  };
  const view = new ClueView({
    documentRef,
    dom,
    getCopy: () => copy,
    setText(target, value) { target.textContent = String(value ?? ''); },
    setGameMoment: (moment) => calls.push(['moment', moment]),
    setControlsEnabled: (enabled) => calls.push(['controls', enabled]),
    setStatus: (message) => calls.push(['status', message]),
    hideOutcomeFeedback: () => calls.push(['hide-outcome']),
    decorateControlButton: (...args) => calls.push(['decorate', ...args]),
    toggleAnswer: (visible) => calls.push(['answer', visible]),
    clearUserAnswer: () => calls.push(['clear-answer']),
    focusUserAnswer: () => calls.push(['focus-answer']),
    closeMedia: (restoreFocus) => calls.push(['close-media', restoreFocus]),
    openMedia: (index) => calls.push(['open-media', index]),
    reportMediaFailure: (item, reason) => calls.push(['media-failure', item, reason]),
  });
  return { calls, dom, view };
}

test('ClueView renders one translated clue and owns its media-preview state', () => {
  const { calls, dom, view } = createHarness();
  const clue = {
    category: 'História',
    question: 'Esta cidade é conhecida como a Cidade Eterna.',
    answer: 'Roma',
    media: [{ type: 'audio', src: '/prompt.mp3', label: 'Listen closely' }],
    translation: {
      provider: 'cache',
      original: {
        category: 'History',
        question: 'This city is known as the Eternal City.',
        answer: 'Rome',
      },
    },
  };

  view.renderClue(clue, 500);

  assert.equal(dom.categoryBox.children[0].children[0].textContent, 'HISTÓRIA');
  assert.equal(dom.categoryBox.children[0].children[1].textContent, 'EN · HISTORY');
  assert.equal(dom.clueText.textContent, clue.question);
  assert.equal(dom.clueOriginal.textContent, `EN · ${clue.translation.original.question}`);
  assert.equal(dom.answerBox.textContent, 'Roma');
  assert.equal(dom.translationState.dataset.status, 'translated');
  assert.equal(dom.translationStateLabel.textContent, 'CACHED');
  assert.equal(dom.clueMedia.children.length, 1);
  assert.equal(view.getMediaItem(0).type, MediaTypes.AUDIO);
  assert.ok(calls.some(([name, value]) => name === 'controls' && value === true));
  assert.ok(calls.some(([name]) => name === 'focus-answer'));
});

test('ClueView presents translation loading without retaining stale media', () => {
  const { calls, dom, view } = createHarness();
  view.renderMedia([{
    type: MediaTypes.IMAGE,
    url: '/old.png',
    label: 'Old image',
  }]);

  view.showTranslationLoading();

  assert.equal(view.getMediaItem(0), null);
  assert.equal(dom.clueMedia.children.length, 0);
  assert.equal(dom.categoryBox.textContent, 'TRADUZINDO');
  assert.equal(dom.clueText.textContent, 'Translating...');
  assert.equal(dom.translationState.dataset.status, 'loading');
  assert.ok(calls.some(([name, value]) => name === 'controls' && value === false));
});

test('clue media extraction rejects unsafe URLs and preserves readable link labels', () => {
  const parsed = extractClueMedia({
    question: 'Hear <a href="javascript:alert(1)">this</a> and <a href="/safe.mp3">the recording</a>.',
  });

  assert.equal(parsed.text, 'Hear this and the recording.');
  assert.deepEqual(
    parsed.media.map(({ type, url }) => ({ type, url })),
    [{ type: MediaTypes.AUDIO, url: '/safe.mp3' }],
  );
});
