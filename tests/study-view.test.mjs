import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { StudyCopy, StudyView } = require('../src/render/study-view.js');

function element() {
  return {
    children: [],
    dataset: {},
    attributes: {},
    hidden: false,
    disabled: false,
    value: '',
    textContent: '',
    classList: {
      values: new Set(),
      add(value) { this.values.add(value); },
      remove(value) { this.values.delete(value); },
      contains(value) { return this.values.has(value); },
    },
    replaceChildren(...children) {
      this.children = children;
      this.textContent = children.map((child) => child.textContent).join('');
    },
    removeAttribute(name) {
      delete this.attributes[name];
      delete this.dataset[name.replace(/^data-/, '')];
    },
    focus() { this.focused = true; },
    select() { this.selected = true; },
    scrollIntoView(options) { this.scrolled = options; },
  };
}

function createHarness() {
  const dom = {
    studyPanel: element(),
    studyResume: element(),
    studyCategory: element(),
    studyQuestion: element(),
    studyAnswer: element(),
    studyGrounding: element(),
    studySources: element(),
    studyActions: element(),
    studyResponse: element(),
    studyReinforcement: element(),
    studyReinforcementPrompt: element(),
    studyReinforcementForm: element(),
    studyReinforcementInput: element(),
    studyReinforcementCheck: element(),
    studyReinforcementResult: element(),
  };
  const documentRef = {
    createElement() {
      return {
        ...element(),
        href: '',
        target: '',
        rel: '',
        type: '',
      };
    },
  };
  const view = new StudyView({
    documentRef,
    dom,
    setText(target, value) {
      if (target) target.textContent = String(value ?? '');
    },
  });
  return { dom, view };
}

test('StudyView renders one grounded packet with reviewed sources and actions', () => {
  const { dom, view } = createHarness();
  dom.studyPanel.classList.add('reinforcement-active');
  dom.studyReinforcement.hidden = false;
  dom.studyReinforcementInput.value = 'old response';
  dom.studyReinforcementResult.dataset.state = 'incorrect';

  view.renderPanel({
    grounding: 'reviewed',
    presentation: {
      locale: 'en',
      category: 'Science',
      question: 'This planet has rings.',
      answer: 'Saturn',
    },
    citations: [{
      title: 'Reviewed astronomy source',
      url: 'https://example.com/saturn',
    }],
  }, [{ id: 'simple', label: 'Explain simply' }]);

  assert.equal(dom.studyCategory.textContent, 'Science');
  assert.equal(dom.studyGrounding.textContent, 'Reviewed sources attached');
  assert.equal(dom.studySources.hidden, false);
  assert.equal(dom.studySources.children[0].href, 'https://example.com/saturn');
  assert.equal(dom.studySources.children[0].rel, 'noopener noreferrer');
  assert.equal(dom.studyActions.children[0].dataset.studyAction, 'simple');
  assert.equal(dom.studyReinforcement.hidden, true);
  assert.equal(dom.studyReinforcementInput.value, '');
  assert.equal(dom.studyPanel.classList.contains('reinforcement-active'), false);
});

test('StudyView localizes reinforcement controls and seals a correct retrieval', () => {
  const { dom, view } = createHarness();

  assert.equal(view.renderReinforcement({
    prompt: 'Qual planeta tem anéis?',
  }, 'pt-BR'), true);
  assert.equal(dom.studyReinforcement.hidden, false);
  assert.equal(dom.studyReinforcementPrompt.textContent, 'Qual planeta tem anéis?');
  assert.equal(dom.studyReinforcementInput.placeholder, 'Digite sua resposta');
  assert.equal(dom.studyReinforcementCheck.textContent, 'Verificar memória');
  assert.equal(dom.studyReinforcementInput.focused, true);

  view.renderReinforcementResult({
    correct: true,
    message: 'Correto.',
  });
  assert.equal(dom.studyReinforcementResult.dataset.state, 'correct');
  assert.equal(dom.studyReinforcementInput.disabled, true);
  assert.equal(dom.studyReinforcementCheck.disabled, true);
  assert.equal(dom.studyResume.focused, true);
  assert.deepEqual(dom.studyReinforcementResult.scrolled, { block: 'nearest' });
});

test('StudyView keeps an empty retrieval editable and selects it for correction', () => {
  const { dom, view } = createHarness();

  view.renderReinforcementResult({
    empty: true,
    message: 'Try an answer first.',
  });

  assert.equal(dom.studyReinforcementResult.dataset.state, 'empty');
  assert.equal(dom.studyReinforcementInput.disabled, false);
  assert.equal(dom.studyReinforcementInput.selected, true);
  assert.equal(Object.isFrozen(StudyCopy.en), true);
  assert.equal(Object.isFrozen(StudyCopy['pt-BR']), true);
});
