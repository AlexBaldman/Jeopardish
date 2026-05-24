import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { Renderer } = require('../src/render/renderer.js');

function createFakeElement(id) {
  return {
    id,
    textContent: '',
    value: '',
    disabled: false,
    focused: false,
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
    'inputbox',
    'categoryBox',
    'statusMessage',
    'questionBox',
    'answerBox',
    'currentStreak',
    'bestStreak',
    'score',
    'hamburgerMenu',
    'navMenu',
    'hostImage',
    'themeToggle',
    'themeToggleLabel',
    'languageToggle',
    'languageToggleLabel',
  ];
  const elements = new Map(ids.map((id) => [id, createFakeElement(id)]));

  return {
    documentElement: createFakeElement('html'),
    elements,
    getElementById(id) {
      return elements.get(id);
    },
    createElement(tagName) {
      return createFakeElement(tagName);
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
});

test('Renderer renders a clue and prepares answer input', () => {
  const { renderer } = createRenderer();
  renderer.dom.userInput.value = 'old answer';

  renderer.renderClue({
    category: 'Science',
    question: 'This particle has a negative charge.',
    answer: 'Electron',
  }, 400);

  assert.equal(renderer.dom.categoryBox.textContent, 'SCIENCE for $400');
  assert.equal(renderer.dom.questionBox.textContent, 'This particle has a negative charge.');
  assert.equal(renderer.dom.answerBox.textContent, 'Electron');
  assert.equal(renderer.dom.answerBox.style.display, 'none');
  assert.equal(renderer.dom.checkButton.disabled, false);
  assert.equal(renderer.dom.userInput.value, '');
  assert.equal(renderer.dom.userInput.focused, true);
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
  assert.equal(renderer.dom.categoryBox.textContent, 'Oops for $0');
  assert.equal(renderer.dom.questionBox.textContent, 'Fallback question');
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
  });

  renderer.dom.answerButton.listeners.click();
  renderer.dom.questionButton.listeners.click();
  renderer.dom.checkButton.listeners.click();
  renderer.dom.themeToggle.listeners.click();
  renderer.dom.languageToggle.listeners.click();
  renderer.dom.userInput.listeners.keydown({ key: 'Enter' });
  renderer.dom.hamburgerMenu.listeners.click();

  assert.deepEqual(calls, ['toggle', 'new', 'check', 'theme', 'language', 'check']);
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

  assert.equal(renderer.dom.questionButton.textContent, 'Nova Pista');
  assert.equal(renderer.dom.userInput.placeholder, 'Digite sua resposta');
  assert.equal(renderer.dom.themeToggleLabel.textContent, 'Dia');
  assert.equal(renderer.dom.languageToggleLabel.textContent, 'Português');
  assert.equal(renderer.dom.currentStreak.textContent, 'Sequência Atual: 2');
  assert.equal(documentRef.documentElement.getAttribute('lang'), 'pt-BR');
});

test('Renderer renders host visual state', () => {
  const { renderer } = createRenderer();

  renderer.renderHost({
    id: 'afterlife-alex',
    displayName: 'Afterlife Alex',
    visuals: {
      neutral: 'neutral.png',
      happy: 'happy.gif',
    },
  }, 'happy');

  assert.equal(renderer.dom.hostImage.src, 'happy.gif');
  assert.equal(renderer.dom.hostImage.alt, 'Afterlife Alex');
  assert.equal(renderer.dom.hostImage.dataset.hostId, 'afterlife-alex');
  assert.equal(renderer.dom.hostImage.dataset.expression, 'happy');
});
