import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { MediaTypes, Renderer, extractClueContent, getMediaType } = require('../src/render/renderer.js');

function createFakeElement(id) {
  return {
    id,
    tagName: String(id).toUpperCase(),
    textContent: '',
    value: '',
    disabled: false,
    focused: false,
    hidden: false,
    children: [],
    style: {
      display: '',
    },
    dataset: {},
    attributes: {},
    classList: {
      values: new Set(),
      toggle(className) {
        if (this.values.has(className)) {
          this.values.delete(className);
        } else {
          this.values.add(className);
        }
      },
      has(className) {
        return this.values.has(className);
      },
      add(className) {
        this.values.add(className);
      },
      remove(className) {
        this.values.delete(className);
      },
    },
    listeners: {},
    addEventListener(type, listener) {
      this.listeners[type] = listener;
    },
    setAttribute(name, value) {
      this.attributes[name] = value;
    },
    getAttribute(name) {
      return this.attributes[name];
    },
    append(...children) {
      this.children.push(...children);
      this.textContent = children.map((child) => child.textContent).join('');
    },
    replaceChildren(...children) {
      this.children = children;
      this.textContent = children.map((child) => child.textContent).join('');
    },
    focus() {
      this.focused = true;
    },
  };
}

function createFakeDocument() {
  const ids = [
    'checkButton',
    'answerButton',
    'questionButton',
    'gameContainer',
    'inputbox',
    'categoryBox',
    'statusMessage',
    'questionBox',
    'clueText',
    'clueOriginal',
    'clueMedia',
    'answerBox',
    'currentStreak',
    'bestStreak',
    'score',
    'hudScore',
    'hudStreak',
    'hudScoreLabel',
    'hudStreakLabel',
    'hamburgerMenu',
    'navMenu',
    'hostStage',
    'hostImage',
    'hostPrevButton',
    'hostNextButton',
    'hostSkinLabel',
    'hostCue',
    'hostPackIndex',
    'themeToggle',
    'themeToggleLabel',
    'languageToggle',
    'languageToggleLabel',
    'soundToggle',
    'soundToggleLabel',
    'translationState',
    'translationStateLabel',
    'mediaModal',
    'mediaModalBackdrop',
    'mediaModalBody',
    'mediaModalTitle',
    'mediaModalType',
    'mediaModalClose',
    'mediaModalLink',
  ];
  const elements = new Map(ids.map((id) => [id, createFakeElement(id)]));
  const body = createFakeElement('body');

  return {
    body,
    documentElement: createFakeElement('html'),
    elements,
    listeners: {},
    getElementById(id) {
      return elements.get(id);
    },
    createElement(tagName) {
      return createFakeElement(tagName);
    },
    addEventListener(type, listener) {
      this.listeners[type] = listener;
    },
  };
}

function createRenderer() {
  const documentRef = createFakeDocument();
  const renderer = new Renderer({
    documentRef,
    random: () => 0,
  });
  renderer.bindDom();
  return { documentRef, renderer };
}

test('Renderer renders scoreboard state', () => {
  const { renderer } = createRenderer();

  renderer.renderScoreboard({
    currentStreak: 2,
    bestStreak: 5,
    score: 1200,
  });

  assert.equal(renderer.dom.currentStreak.textContent, 'Current Streak: 2');
  assert.equal(renderer.dom.bestStreak.textContent, 'Best Streak: 5');
  assert.equal(renderer.dom.score.textContent, 'Score: $1200');
  assert.equal(renderer.dom.hudScore.textContent, '$1200');
  assert.equal(renderer.dom.hudStreak.textContent, 'x2');
  assert.equal(renderer.dom.gameContainer.dataset.gameMoment, undefined);
});

test('Renderer renders a clue and prepares answer input', () => {
  const { renderer } = createRenderer();
  renderer.dom.userInput.value = 'old answer';

  renderer.renderClue({
    category: 'Science',
    question: 'This particle has a negative charge.',
    answer: 'Electron',
  }, 400);

  assert.equal(renderer.dom.gameContainer.dataset.gameMoment, 'clue');

  assert.equal(renderer.dom.categoryBox.children[0].textContent, 'SCIENCE');
  assert.equal(renderer.dom.categoryBox.children[1].className, 'clue-value clue-value-questionable');
  assert.equal(renderer.dom.categoryBox.children[1].children[0].textContent, '$400');
  assert.equal(renderer.dom.categoryBox.children[1].children[2].textContent, 'QUESTIONABLE TENDER');
  assert.equal(renderer.dom.clueText.textContent, 'This particle has a negative charge.');
  assert.equal(renderer.dom.answerBox.textContent, 'Electron');
  assert.equal(renderer.dom.answerBox.style.display, 'none');
  assert.equal(renderer.dom.checkButton.disabled, false);
  assert.equal(renderer.dom.userInput.value, '');
  assert.equal(renderer.dom.userInput.focused, true);
});

test('Renderer presents translated clue content with its English source', () => {
  const { renderer } = createRenderer();

  renderer.renderClue({
    category: 'HISTÓRIA',
    question: 'Esta cidade é conhecida como a Cidade Eterna.',
    answer: 'Roma',
    translation: {
      provider: 'cache',
      original: {
        category: 'HISTORY',
        question: 'This city is known as the Eternal City.',
        answer: 'Rome',
      },
    },
  }, 500);

  assert.equal(renderer.dom.categoryBox.children[0].children[0].textContent, 'HISTÓRIA');
  assert.equal(renderer.dom.categoryBox.children[0].children[1].textContent, 'EN · HISTORY');
  assert.equal(renderer.dom.clueText.textContent, 'Esta cidade é conhecida como a Cidade Eterna.');
  assert.equal(renderer.dom.clueOriginal.textContent, 'EN · This city is known as the Eternal City.');
  assert.equal(renderer.dom.clueOriginal.hidden, false);
  assert.equal(renderer.dom.translationState.dataset.status, 'translated');
  assert.equal(renderer.dom.translationStateLabel.textContent, 'PT · CACHED');
});

test('Renderer displays fallback clue and enables controls', () => {
  const { renderer } = createRenderer();

  const fallback = renderer.displayErrorJoke([
    {
      category: 'Oops',
      question: 'Fallback question',
      answer: 'Fallback answer',
      value: '$0',
    },
  ]);

  assert.equal(fallback.category, 'Oops');
  assert.equal(renderer.dom.statusMessage.textContent, 'There was a problem loading a normal clue. Showing fallback clue.');
  assert.equal(renderer.dom.categoryBox.children[0].textContent, 'OOPS');
  assert.equal(renderer.dom.categoryBox.children[1].children[0].textContent, '$0');
  assert.equal(renderer.dom.categoryBox.children[1].children[2].textContent, 'QUESTIONABLE TENDER');
  assert.equal(renderer.dom.clueText.textContent, 'Fallback question');
  assert.equal(renderer.dom.answerBox.textContent, 'Fallback answer');
  assert.equal(renderer.dom.answerBox.style.display, 'flex');
  assert.equal(renderer.dom.checkButton.disabled, false);
});

test('Renderer binds UI events to callbacks', () => {
  const { renderer } = createRenderer();
  const calls = [];

  renderer.bindEvents({
    onToggleAnswer: () => calls.push('toggle'),
    onNewQuestion: () => calls.push('new'),
    onCheckAnswer: () => calls.push('check'),
    onToggleTheme: () => calls.push('theme'),
    onToggleLanguage: () => calls.push('language'),
    onToggleSound: () => calls.push('sound'),
    onPreviousHostSkin: () => calls.push('host-prev'),
    onNextHostSkin: () => calls.push('host-next'),
  });

  renderer.dom.answerButton.listeners.click();
  renderer.dom.questionButton.listeners.click();
  renderer.dom.checkButton.listeners.click();
  renderer.dom.themeToggle.listeners.click();
  renderer.dom.languageToggle.listeners.click();
  renderer.dom.soundToggle.listeners.click();
  renderer.dom.hostPrevButton.listeners.click();
  renderer.dom.hostNextButton.listeners.click();
  renderer.dom.userInput.listeners.keydown({ key: 'Enter' });
  renderer.dom.hamburgerMenu.listeners.click();

  assert.deepEqual(calls, ['toggle', 'new', 'check', 'theme', 'language', 'sound', 'host-prev', 'host-next', 'check']);
  assert.equal(renderer.dom.navMenu.classList.has('active'), true);
});

test('Renderer applies localized static UI copy and toggle states', () => {
  const { renderer, documentRef } = createRenderer();

  renderer.setCopy({
    lang: 'pt-BR',
    questionButton: 'Nova Pista',
    answerButton: 'Revelar Resposta',
    checkButton: 'Valendo',
    inputPlaceholder: 'Digite sua resposta',
    themeDay: 'Dia',
    languagePortuguese: 'Português',
    currentStreak: 'Sequência Atual',
    bestStreak: 'Melhor Sequência',
    score: 'Placar',
  });
  renderer.setToggleStates({
    theme: 'light',
    language: 'pt-BR',
  });
  renderer.renderScoreboard({
    currentStreak: 2,
    bestStreak: 5,
    score: 1200,
  });

  assert.equal(renderer.dom.questionButton.dataset.tooltip, 'Nova Pista');
  assert.equal(renderer.dom.questionButton.getAttribute('aria-label'), 'Nova Pista. Keyboard shortcut: Q');
  assert.equal(renderer.dom.userInput.placeholder, 'Digite sua resposta');
  assert.equal(renderer.dom.themeToggleLabel.textContent, 'Dia');
  assert.equal(renderer.dom.languageToggleLabel.textContent, 'Português');
  assert.equal(renderer.dom.currentStreak.textContent, 'Sequência Atual: 2');
  assert.equal(documentRef.documentElement.getAttribute('lang'), 'pt-BR');
});

test('Renderer exposes round phase and audio state without a visible status panel', () => {
  const { renderer } = createRenderer();

  renderer.setCopy({
    inputPlaceholder: 'Type your response',
    nextClueReady: 'NEXT CLUE READY',
    soundOn: 'Sound',
    soundOff: 'Muted',
  });
  renderer.setRoundPhase('advance-ready');
  renderer.setSoundState(true);

  assert.equal(renderer.dom.gameContainer.dataset.roundPhase, 'advance-ready');
  assert.equal(renderer.dom.userInput.placeholder, 'NEXT CLUE READY');
  assert.equal(renderer.dom.soundToggle.dataset.muted, 'true');
  assert.equal(renderer.dom.soundToggleLabel.textContent, 'Muted');
  assert.equal(renderer.dom.soundToggle.getAttribute('aria-label'), 'Enable game audio');
});

test('Renderer shows empty-answer host quip without replacing the active clue', () => {
  const { renderer } = createRenderer();

  renderer.renderClue({
    category: 'Science',
    question: 'This particle has a negative charge.',
    answer: 'Electron',
  }, 400);
  renderer.dom.userInput.value = '   ';

  renderer.displayEmptyAnswerQuip('Try words. They have served contestants reasonably well.');

  assert.equal(renderer.dom.statusMessage.textContent, 'Try words. They have served contestants reasonably well.');
  assert.equal(renderer.dom.categoryBox.children[0].textContent, 'SCIENCE');
  assert.equal(renderer.dom.clueText.textContent, 'This particle has a negative charge.');
  assert.equal(renderer.dom.answerBox.textContent, 'Electron');
  assert.equal(renderer.dom.answerBox.style.display, 'none');
  assert.equal(renderer.dom.userInput.value, '');
  assert.equal(renderer.dom.userInput.focused, true);
});

test('Renderer creates a scored correct-answer payoff state', () => {
  const { renderer } = createRenderer();

  renderer.displayCorrectAnswerMessage({
    currentStreak: 3,
    scoreDelta: 800,
  });

  assert.equal(renderer.dom.gameContainer.dataset.gameMoment, 'correct');
  assert.equal(renderer.dom.categoryBox.textContent, 'Right on the Money');
  assert.equal(renderer.dom.clueText.textContent, 'Correct. +$800');
  assert.equal(renderer.dom.answerBox.textContent, 'Answer streak: 3');
  assert.equal(renderer.dom.answerBox.style.display, 'flex');
});

test('Renderer creates an informative incorrect-answer payoff state', () => {
  const { renderer } = createRenderer();

  renderer.displayIncorrectAnswerMessage('Uncle');

  assert.equal(renderer.dom.gameContainer.dataset.gameMoment, 'incorrect');
  assert.equal(renderer.dom.categoryBox.textContent, 'The Judges Have Spoken');
  assert.equal(renderer.dom.clueText.textContent, 'Not quite.');
  assert.equal(renderer.dom.answerBox.textContent, 'Correct response: Uncle\nSTREAK RESET!');
  assert.equal(renderer.dom.answerBox.style.display, 'flex');
});

test('Renderer gives current US denominations their officialish note treatment', () => {
  const { renderer } = createRenderer();

  renderer.renderClue({
    category: 'Money',
    question: 'A familiar denomination.',
    answer: 'One hundred dollars',
  }, 100);

  const bill = renderer.dom.categoryBox.children[1];
  assert.equal(bill.className, 'clue-value clue-value-officialish');
  assert.equal(bill.children[0].textContent, '$100');
  assert.equal(bill.children[2].textContent, 'TRIVIA RESERVE NOTE');
  assert.equal(bill.attributes['aria-label'], '$100 clue value. Trivia Reserve note.');
});

test('Renderer renders host visual state', () => {
  const { renderer } = createRenderer();

  const host = {
    id: 'afterlife-alex',
    displayName: 'Afterlife Alex',
    visuals: {
      idle: 'neutral.png',
      correct: 'happy.gif',
    },
  };
  const skin = {
    id: 'sparkle-host',
    label: 'Sparkle Host',
    frame: 'bust',
  };
  renderer.renderHost(host, 'correct', null, skin, {
    state: 'correct',
    visual: 'happy.gif',
    cue: 'Approved',
    accessibleLabel: 'Approved',
    effect: 'approve',
    intensity: 'high',
    frame: 'bust',
    skin,
    skinIndex: 1,
    skinCount: 5,
  });

  assert.equal(renderer.dom.hostImage.src, 'happy.gif');
  assert.equal(renderer.dom.hostImage.alt, 'Afterlife Alex, Approved');
  assert.equal(renderer.dom.hostImage.dataset.hostId, 'afterlife-alex');
  assert.equal(renderer.dom.hostImage.dataset.expression, 'correct');
  assert.equal(renderer.dom.hostImage.dataset.skinId, 'sparkle-host');
  assert.equal(renderer.dom.hostImage.dataset.frame, 'bust');
  assert.equal(renderer.dom.hostStage.dataset.effect, 'approve');
  assert.equal(renderer.dom.hostSkinLabel.textContent, 'Sparkle Host');
  assert.equal(renderer.dom.hostCue.textContent, 'Approved');
  assert.equal(renderer.dom.hostPackIndex.textContent, '02/05');
});

test('Renderer identifies supported clue media formats', () => {
  assert.equal(getMediaType('photo.jpg'), MediaTypes.IMAGE);
  assert.equal(getMediaType('listen.mp3'), MediaTypes.AUDIO);
  assert.equal(getMediaType('archive.wmv'), MediaTypes.VIDEO);
  assert.equal(getMediaType('reference.pdf'), MediaTypes.EXTERNAL);
});

test('Renderer extracts linked clue media without rendering raw HTML', () => {
  const parsed = extractClueContent(
    'Listen <a href="https://media.test/clue.mp3">to this</a><br />then identify <a href="https://media.test/picture.jpg">the photo</a>.',
  );

  assert.equal(parsed.text, 'Listen to this\nthen identify the photo.');
  assert.deepEqual(
    parsed.media.map(({ type, url }) => ({ type, url })),
    [
      { type: MediaTypes.AUDIO, url: 'https://media.test/clue.mp3' },
      { type: MediaTypes.IMAGE, url: 'https://media.test/picture.jpg' },
    ],
  );
});

test('Renderer builds media previews and opens accessible media viewers', () => {
  const { renderer, documentRef } = createRenderer();

  renderer.renderClue({
    category: 'Archive',
    question: 'Name <a href="https://media.test/still.jpg">this</a> and watch <a href="https://media.test/clip.wmv">this</a>.',
    answer: 'A test',
  }, 500);

  assert.equal(renderer.dom.clueText.textContent, 'Name this and watch this.');
  assert.equal(renderer.dom.clueMedia.children.length, 2);
  assert.equal(renderer.dom.clueMedia.children[0].attributes['aria-label'], 'Open image clue: Image clue 1');
  assert.equal(renderer.dom.clueMedia.children[1].attributes['aria-label'], 'Open video clue: Video clue 2');

  renderer.dom.clueMedia.children[1].listeners.click();
  assert.equal(renderer.dom.mediaModal.hidden, false);
  assert.equal(renderer.dom.mediaModal.attributes['aria-hidden'], 'false');
  assert.equal(renderer.dom.mediaModalType.textContent, 'VIDEO CLUE');
  assert.equal(renderer.dom.mediaModalBody.children[0].src, 'https://media.test/clip.wmv');
  assert.equal(renderer.dom.mediaModalBody.children[1].textContent.includes('Vintage WMV clip'), true);
  assert.equal(documentRef.body.classList.has('modal-open'), true);

  renderer.renderClue({
    category: 'Archive',
    question: 'A clue with no attachment.',
    answer: 'A test',
  }, 600);
  assert.equal(renderer.dom.mediaModal.hidden, true);
  assert.equal(renderer.dom.clueMedia.children.length, 0);
  assert.equal(documentRef.body.classList.has('modal-open'), false);
});
