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
      properties: new Map(),
      setProperty(name, value) {
        this.properties.set(name, value);
      },
      removeProperty(name) {
        this.properties.delete(name);
      },
      getPropertyValue(name) {
        return this.properties.get(name) || '';
      },
    },
    rect: { left: 0, top: 0, width: 0, height: 0 },
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
      contains(className) {
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
    removeAttribute(name) {
      delete this.attributes[name];
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
    select() {
      this.selected = true;
    },
    getBoundingClientRect() {
      return {
        ...this.rect,
        right: this.rect.left + this.rect.width,
        bottom: this.rect.top + this.rect.height,
      };
    },
  };
}

function createFakeDocument() {
  const ids = [
    'checkButton',
    'answerButton',
    'questionButton',
    'answerFieldLabel',
    'checkButtonKicker',
    'questionButtonKicker',
    'answerButtonKicker',
    'gameContainer',
    'inputbox',
    'categoryBox',
    'statusMessage',
    'questionBox',
    'clueText',
    'clueOriginal',
    'clueMedia',
    'answerBox',
    'outcomeFeedback',
    'outcomeFeedbackPrompt',
    'confidenceKnew',
    'confidenceShaky',
    'confidenceLearned',
    'disputeButton',
    'outcomeFeedbackStatus',
    'hudScore',
    'hudStreak',
    'hudBest',
    'hudScoreLabel',
    'hudStreakLabel',
    'hudBestLabel',
    'hudEpisode',
    'hudEpisodeLabel',
    'hamburgerMenu',
    'navMenu',
    'menuClose',
    'menuNewClue',
    'menuRevealAnswer',
    'menuDeepDive',
    'menuDeepDiveLabel',
    'menuTheme',
    'menuLanguage',
    'menuSound',
    'menuVoice',
    'menuVoiceLabel',
    'menuVoiceState',
    'menuHostPack',
    'menuHostPackKicker',
    'menuHostPackLabel',
    'menuHostPackIndex',
    'menuScene',
    'menuSceneLabel',
    'menuSceneIndex',
    'scoreDrawer',
    'speechBubble',
    'dialogueStylePrev',
    'dialogueStyleNext',
    'dialogueStyleLabel',
    'dialogueStyleIndex',
    'hostStage',
    'hostAvatar',
    'hostImage',
    'hostLensSignal',
    'hostPrevButton',
    'hostNextButton',
    'hostSkinLabel',
    'hostPackIndex',
    'themeToggle',
    'themeToggleLabel',
    'languageToggle',
    'languageToggleLabel',
    'soundToggle',
    'soundToggleLabel',
    'voiceButton',
    'voiceState',
    'voiceHelp',
    'translationState',
    'translationStateLabel',
    'mediaModal',
    'mediaModalBackdrop',
    'mediaModalBody',
    'mediaModalTitle',
    'mediaModalType',
    'mediaModalClose',
    'mediaModalLink',
    'deepDiveButton',
    'deepDiveLabel',
    'reviewQueueButton',
    'reviewQueueStatus',
    'studyPanel',
    'studyTitle',
    'studyClose',
    'studyResume',
    'studyCategory',
    'studyQuestion',
    'studyAnswer',
    'studyGrounding',
    'studySources',
    'studyActions',
    'studyResponse',
    'studyReinforcement',
    'studyReinforcementPrompt',
    'studyReinforcementForm',
    'studyReinforcementInput',
    'studyReinforcementCheck',
    'studyReinforcementResult',
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

  assert.equal(renderer.dom.hudScore.textContent, '$1200');
  assert.equal(renderer.dom.hudStreak.textContent, 'x2');
  assert.equal(renderer.dom.hudBest.textContent, 'x5');
  assert.equal(renderer.dom.hudBestLabel.textContent, 'Best');
  assert.equal(renderer.dom.gameContainer.dataset.gameMoment, undefined);
});

test('Renderer presents voice capability and listening state without replacing answer input', () => {
  const { renderer } = createRenderer();
  renderer.setUserAnswer('Marie Curie');

  renderer.setVoiceState({
    state: 'listening',
    enabled: true,
    capabilities: { narration: true, recognition: true },
    transcript: 'Who is Marie',
  });

  assert.equal(renderer.dom.userInput.value, 'Marie Curie');
  assert.equal(renderer.dom.voiceState.textContent, 'Who is Marie');
  assert.equal(renderer.dom.voiceButton.dataset.state, 'listening');
  assert.equal(renderer.dom.voiceButton.attributes['aria-pressed'], 'true');
  assert.equal(renderer.dom.menuVoiceState.textContent, 'ON');
});

test('Renderer renders episode progress and a completion artifact', () => {
  const { renderer } = createRenderer();
  const progress = {
    title: 'Season Zero: Pilot Broadcast',
    current: 10,
    answered: 10,
    total: 10,
    complete: true,
    score: 2400,
    counts: { correct: 7, incorrect: 1, revealed: 1, skipped: 1 },
    review: { missed: 1, revealed: 1, shaky: 1, total: 2 },
    learning: { reviewReinforced: 0, due: 2 },
    disputes: 1,
    finale: {
      artifactTitle: 'BROADCAST O',
      artifactBody: 'The signal has been decoded.',
    },
  };

  renderer.renderSessionProgress(progress);
  renderer.renderEpisodeComplete(progress);

  assert.equal(renderer.dom.hudEpisode.textContent, '10/10');
  assert.equal(renderer.dom.gameContainer.dataset.gameMoment, 'complete');
  assert.match(renderer.dom.clueText.textContent, /\$2400/);
  assert.match(renderer.dom.clueText.textContent, /70% accuracy/);
  assert.match(renderer.dom.clueText.textContent, /BROADCAST O/);
  assert.match(renderer.dom.answerBox.textContent, /signal has been decoded/);
  assert.match(renderer.dom.answerBox.textContent, /2 clues saved for review/);
  assert.match(renderer.dom.answerBox.textContent, /1 ruling flagged/);
  assert.equal(renderer.dom.questionButton.disabled, false);
  assert.equal(renderer.dom.answerButton.disabled, true);
  assert.equal(renderer.dom.questionButton.dataset.tooltip, 'Replay Episode');
  assert.equal(renderer.dom.reviewQueueButton.hidden, false);
  assert.equal(renderer.dom.reviewQueueButton.textContent, 'Review 2 saved clues');
});

test('Renderer renders a clue and prepares answer input', () => {
  const { renderer } = createRenderer();
  renderer.dom.userInput.value = 'old answer';
  renderer.decorateControlButton(renderer.dom.questionButton, 'Replay Episode', 'Q');

  renderer.renderClue({
    category: 'Science',
    question: 'This particle has a negative charge.',
    answer: 'Electron',
  }, 400);

  assert.equal(renderer.dom.gameContainer.dataset.gameMoment, 'clue');

  assert.equal(renderer.dom.categoryBox.children[0].textContent, 'SCIENCE');
  assert.equal(renderer.dom.categoryBox.children[1].className, 'clue-value');
  assert.equal(renderer.dom.categoryBox.children[1].children[0].textContent, '$400');
  assert.equal(renderer.dom.categoryBox.children[1].children.length, 1);
  assert.equal(renderer.dom.categoryBox.children[1].getAttribute('aria-label'), '$400 clue value.');
  assert.equal(renderer.dom.clueText.textContent, 'This particle has a negative charge.');
  assert.equal(renderer.dom.answerBox.textContent, 'Electron');
  assert.equal(renderer.dom.answerBox.style.display, 'none');
  assert.equal(renderer.dom.checkButton.disabled, false);
  assert.equal(renderer.dom.userInput.value, '');
  assert.equal(renderer.dom.userInput.focused, true);
  assert.equal(renderer.dom.questionButton.dataset.tooltip, 'New Clue');
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
  assert.equal(renderer.dom.categoryBox.children[1].children.length, 1);
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
    onToggleVoice: ({ listen }) => calls.push(listen ? 'voice-listen' : 'voice-menu'),
    onPreviousHostSkin: () => calls.push('host-prev'),
    onNextHostSkin: () => calls.push('host-next'),
    onCycleHostPack: () => calls.push('host-pack'),
    onPreviousDialogueStyle: () => calls.push('dialogue-prev'),
    onNextDialogueStyle: () => calls.push('dialogue-next'),
    onCycleScene: () => calls.push('scene'),
    onReviewSavedClues: () => calls.push('review'),
    onSubmitReinforcement: (answer) => calls.push(`reinforcement:${answer}`),
    onConfidence: (confidence) => calls.push(`confidence:${confidence}`),
    onDispute: () => calls.push('dispute'),
  });

  renderer.dom.answerButton.listeners.click();
  renderer.dom.questionButton.listeners.click();
  renderer.dom.checkButton.listeners.click();
  renderer.dom.themeToggle.listeners.click();
  renderer.dom.languageToggle.listeners.click();
  renderer.dom.soundToggle.listeners.click();
  renderer.dom.menuVoice.listeners.click();
  renderer.dom.voiceButton.listeners.click();
  renderer.dom.hostPrevButton.listeners.click();
  renderer.dom.hostNextButton.listeners.click();
  renderer.dom.menuHostPack.listeners.click();
  renderer.dom.dialogueStylePrev.listeners.click();
  renderer.dom.dialogueStyleNext.listeners.click();
  renderer.dom.menuScene.listeners.click();
  renderer.dom.reviewQueueButton.listeners.click();
  renderer.dom.confidenceShaky.listeners.click();
  renderer.dom.disputeButton.listeners.click();
  renderer.dom.studyReinforcementInput.value = 'three';
  renderer.dom.studyReinforcementForm.listeners.submit({ preventDefault() {} });
  renderer.dom.userInput.listeners.keydown({ key: 'Enter' });
  renderer.dom.hamburgerMenu.listeners.click();

  assert.deepEqual(calls, [
    'toggle',
    'new',
    'check',
    'theme',
    'language',
    'sound',
    'voice-menu',
    'voice-listen',
    'host-prev',
    'host-next',
    'host-pack',
    'dialogue-prev',
    'dialogue-next',
    'scene',
    'review',
    'confidence:shaky',
    'dispute',
    'reinforcement:three',
    'check',
  ]);
  assert.equal(renderer.dom.navMenu.classList.has('active'), true);
  assert.equal(renderer.dom.hamburgerMenu.attributes['aria-expanded'], 'true');
});

test('Renderer presents grounded study content and restores the round view', () => {
  const { renderer } = createRenderer();
  renderer.dom.userInput.value = 'half typed answer';
  renderer.toggleAnswer(false);
  renderer.setGameMoment('clue');
  const view = renderer.captureRoundView();

  renderer.renderStudyPanel({
    grounding: 'reviewed',
    canonical: { category: 'Science', question: 'A grounded question', answer: 'A grounded answer' },
    citations: [{ title: 'Reviewed source', url: 'https://example.com/source' }],
  }, [{ id: 'simple', label: 'Explain this simply' }]);
  renderer.setStudyOpen(true);

  assert.equal(renderer.isStudyOpen(), true);
  assert.equal(renderer.dom.studyCategory.textContent, 'Science');
  assert.equal(renderer.dom.studySources.hidden, false);
  assert.equal(renderer.dom.studySources.children[0].textContent, 'Reviewed source');
  assert.equal(renderer.dom.studySources.children[0].attributes.href, undefined);
  assert.equal(renderer.dom.studySources.children[0].href, 'https://example.com/source');
  assert.equal(renderer.dom.studyActions.children[0].dataset.studyAction, 'simple');
  renderer.dom.userInput.value = '';
  renderer.setStudyOpen(false);
  renderer.restoreRoundView(view);
  assert.equal(renderer.dom.userInput.value, 'half typed answer');
  assert.equal(renderer.isAnswerVisible(), false);
});

test('Renderer presents a reinforcement check and seals a correct result', () => {
  const { renderer } = createRenderer();

  renderer.renderStudyReinforcement({
    prompt: 'How many oxygen atoms are in ozone?',
  }, 'en');
  assert.equal(renderer.dom.studyReinforcement.hidden, false);
  assert.equal(
    renderer.dom.studyReinforcementPrompt.textContent,
    'How many oxygen atoms are in ozone?',
  );
  assert.equal(renderer.dom.studyReinforcementCheck.textContent, 'Check memory');

  renderer.renderStudyReinforcementResult({
    correct: true,
    message: 'Ozone is O3.',
  });
  assert.equal(renderer.dom.studyReinforcementResult.dataset.state, 'correct');
  assert.equal(renderer.dom.studyReinforcementInput.disabled, true);
  assert.equal(renderer.dom.studyReinforcementCheck.disabled, true);
  assert.equal(renderer.dom.studyResume.focused, true);
});

test('Renderer presents and updates lightweight outcome feedback', () => {
  const { renderer } = createRenderer();

  renderer.renderOutcomeFeedback({ confidence: 'shaky', disputed: true });

  assert.equal(renderer.dom.outcomeFeedback.hidden, false);
  assert.equal(renderer.dom.confidenceKnew.attributes['aria-pressed'], 'false');
  assert.equal(renderer.dom.confidenceShaky.attributes['aria-pressed'], 'true');
  assert.equal(renderer.dom.disputeButton.attributes['aria-pressed'], 'true');
  assert.equal(renderer.dom.disputeButton.textContent, 'Ruling flagged');

  renderer.renderClue({
    category: 'Science',
    question: 'A new clue',
    answer: 'An answer',
  }, 200);
  assert.equal(renderer.dom.outcomeFeedback.hidden, true);
});

test('Renderer applies localized static UI copy and toggle states', () => {
  const { renderer, documentRef } = createRenderer();

  renderer.setCopy({
    lang: 'pt-BR',
    questionButton: 'Nova Pista',
    answerButton: 'Revelar Resposta',
    checkButton: 'Valendo',
    inputPlaceholder: 'Digite sua resposta',
    answerFieldLabel: 'Sua resposta',
    checkButtonKicker: 'Confirmar',
    questionButtonKicker: 'Tabuleiro',
    answerButtonKicker: 'Pista',
    askHost: 'Pergunte ao Host',
    askHostAboutClue: 'Pergunte ao host sobre esta pista',
    themeDay: 'Dia',
    languagePortuguese: 'Português',
    languageSwitchToEnglish: 'Idioma: português. Mudar para inglês',
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
  assert.equal(renderer.dom.answerFieldLabel.textContent, 'Sua resposta');
  assert.equal(renderer.dom.checkButtonKicker.textContent, 'Confirmar');
  assert.equal(renderer.dom.questionButtonKicker.textContent, 'Tabuleiro');
  assert.equal(renderer.dom.answerButtonKicker.textContent, 'Pista');
  assert.equal(renderer.dom.menuDeepDiveLabel.textContent, 'Pergunte ao Host');
  assert.equal(renderer.dom.deepDiveLabel.textContent, 'Pergunte ao Host');
  assert.equal(renderer.dom.studyTitle.textContent, 'Pergunte ao Host');
  assert.equal(renderer.dom.deepDiveButton.dataset.help, 'Pergunte ao Host');
  assert.equal(renderer.dom.deepDiveButton.getAttribute('title'), 'Pergunte ao Host');
  assert.equal(renderer.dom.deepDiveButton.getAttribute('aria-label'), 'Pergunte ao host sobre esta pista');
  assert.equal(renderer.dom.themeToggleLabel.textContent, 'Dia');
  assert.equal(renderer.dom.languageToggleLabel.textContent, 'Português');
  assert.equal(renderer.dom.themeToggle.dataset.help, 'Switch to night mode');
  assert.equal(renderer.dom.languageToggle.dataset.help, 'Idioma: português. Mudar para inglês');
  assert.equal(renderer.dom.languageToggle.getAttribute('title'), 'Idioma: português. Mudar para inglês');
  assert.equal(renderer.dom.languageToggle.getAttribute('aria-label'), 'Idioma: português. Mudar para inglês');
  assert.equal(renderer.dom.hudStreakLabel.textContent, 'Sequência Atual');
  assert.equal(renderer.dom.hudBestLabel.textContent, 'Melhor Sequência');
  assert.equal(documentRef.documentElement.getAttribute('lang'), 'pt-BR');
});

test('Renderer synchronizes multiple theme controls on composite pages', () => {
  const documentRef = createFakeDocument();
  const embeddedToggle = createFakeElement('gameThemeToggle');
  const embeddedLabel = createFakeElement('gameThemeToggleLabel');
  documentRef.querySelectorAll = (selector) => {
    if (selector === '[data-theme-toggle]') {
      return [documentRef.getElementById('themeToggle'), embeddedToggle];
    }
    if (selector === '[data-theme-toggle-label]') {
      return [documentRef.getElementById('themeToggleLabel'), embeddedLabel];
    }
    return [];
  };

  const renderer = new Renderer({ documentRef, random: () => 0 });
  renderer.bindDom();
  renderer.setToggleStates({ theme: 'light', language: 'en' });

  assert.equal(renderer.dom.themeToggles.length, 2);
  assert.equal(documentRef.getElementById('themeToggle').getAttribute('aria-pressed'), 'true');
  assert.equal(embeddedToggle.getAttribute('aria-pressed'), 'true');
  assert.equal(documentRef.getElementById('themeToggleLabel').textContent, 'Day');
  assert.equal(embeddedLabel.textContent, 'Day');
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
  assert.equal(renderer.dom.soundToggle.dataset.help, 'Enable game audio');
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
    correctAnswer: 'Post-it Notes',
    answerMatch: { reason: 'fuzzy' },
  });

  assert.equal(renderer.dom.gameContainer.dataset.gameMoment, 'correct');
  assert.equal(renderer.dom.categoryBox.textContent, 'Right on the Money');
  assert.equal(renderer.dom.clueText.textContent, 'Correct. +$800');
  assert.equal(
    renderer.dom.answerBox.textContent,
    'Correct response: Post-it Notes\nMinor typo accepted\nAnswer streak: 3',
  );
  assert.equal(renderer.dom.answerBox.style.display, 'flex');
});

test('Renderer creates an informative incorrect-answer payoff state', () => {
  const { renderer } = createRenderer();

  renderer.displayIncorrectAnswerMessage({
    submittedAnswer: 'Cousin',
    correctAnswer: 'Uncle',
  });

  assert.equal(renderer.dom.gameContainer.dataset.gameMoment, 'incorrect');
  assert.equal(renderer.dom.categoryBox.textContent, 'The Judges Have Spoken');
  assert.equal(renderer.dom.clueText.textContent, 'Not quite.');
  assert.equal(renderer.dom.answerBox.textContent, 'Your response: Cousin\nCorrect response: Uncle\nSTREAK RESET!');
  assert.equal(renderer.dom.answerBox.style.display, 'flex');
});

test('Renderer presents every clue value as direct, readable text', () => {
  const { renderer } = createRenderer();

  renderer.renderClue({
    category: 'Money',
    question: 'A familiar denomination.',
    answer: 'One hundred dollars',
  }, 100);

  const value = renderer.dom.categoryBox.children[1];
  assert.equal(value.className, 'clue-value');
  assert.equal(value.children.length, 1);
  assert.equal(value.children[0].textContent, '$100');
  assert.equal(value.attributes['aria-label'], '$100 clue value.');
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
    hostPackId: 'vera-static',
    hostDisplayName: 'Vera Static',
    motion: { primitive: 'react' },
  });

  assert.equal(renderer.dom.hostImage.src, 'happy.gif');
  assert.equal(renderer.dom.hostImage.alt, 'Vera Static, Approved');
  assert.equal(renderer.dom.hostImage.dataset.hostId, 'afterlife-alex');
  assert.equal(renderer.dom.hostImage.dataset.expression, 'correct');
  assert.equal(renderer.dom.hostImage.dataset.skinId, 'sparkle-host');
  assert.equal(renderer.dom.hostImage.dataset.frame, 'bust');
  assert.equal(renderer.dom.hostImage.dataset.hostPack, 'vera-static');
  assert.equal(renderer.dom.hostImage.dataset.lookId, 'sparkle-host');
  assert.equal(renderer.dom.hostStage.dataset.effect, 'approve');
  assert.equal(renderer.dom.hostStage.dataset.motion, 'react');
  assert.equal(renderer.dom.hostImage.dataset.assetState, 'loading');
  assert.equal(renderer.dom.hostSkinLabel.textContent, 'Sparkle Host');
  assert.equal(renderer.dom.hostPackIndex.textContent, '02/05');

  renderer.dom.hostImage.listeners.error();
  assert.equal(renderer.dom.hostImage.src, 'assets/hosts/xander/v1/looks/question-pink.png');
  assert.equal(renderer.dom.hostImage.dataset.assetState, 'fallback');
  renderer.dom.hostImage.listeners.load();
  assert.equal(renderer.dom.hostImage.dataset.assetState, 'ready');
});

test('Renderer realizes a CSS animation selection and preserves semantic-motion fallback', () => {
  const { renderer } = createRenderer();
  const host = {
    id: 'xander-trefleck',
    displayName: 'Xander Trefleck',
    visuals: { idle: 'host.png', correct: 'host.png' },
  };
  const skin = { id: 'question-pink', label: 'Questionable Pink' };

  renderer.renderHost(host, 'correct', null, skin, {
    state: 'correct',
    visual: 'host.png',
    skin,
    animation: {
      packId: 'xander-surf-motion-v1',
      pose: 'correct',
      clip: {
        id: 'correct-pop',
        renderers: [{ kind: 'css', animationName: 'host-correct-pop' }],
      },
      variant: { id: 'default' },
      motion: { reducedMotion: false, mode: 'full' },
      timeline: { durationMs: 460 },
    },
  });

  assert.equal(renderer.dom.hostStage.dataset.animationPack, 'xander-surf-motion-v1');
  assert.equal(renderer.dom.hostStage.dataset.animationPose, 'correct');
  assert.equal(renderer.dom.hostStage.dataset.animationClip, 'correct-pop');
  assert.equal(renderer.dom.hostStage.dataset.animationReduced, 'false');
  assert.equal(renderer.dom.hostStage.dataset.motion, '');

  renderer.applyHostMotion({ primitive: 'recover' });
  assert.equal(renderer.dom.hostStage.dataset.animationClip, '');
  assert.equal(renderer.dom.hostStage.dataset.motion, 'recover');
});

test('Renderer tracks the dialogue tail to the active host mouth anchor', () => {
  const { renderer } = createRenderer();
  renderer.dom.speechBubble.rect = { left: 100, top: 50, width: 600, height: 300 };
  renderer.dom.hostAvatar.rect = { left: 130, top: 380, width: 200, height: 400 };
  const host = {
    id: 'xander-trefleck',
    displayName: 'Xander Trefleck',
    visuals: { idle: 'host.png' },
  };
  const skin = { id: 'question-pink', label: 'Questionable Pink' };

  renderer.renderDialogueStyle({ id: 'speech', label: 'Speech Bubble' }, 1, 4);
  renderer.renderHost(host, 'idle', null, skin, {
    state: 'idle',
    visual: 'host.png',
    skin,
    anchors: { mouth: { x: 0.5, y: 0.245 } },
  });

  assert.equal(renderer.dom.speechBubble.dataset.dialogueSource, 'host');
  assert.equal(renderer.dom.speechBubble.dataset.dialogueAnchorZone, 'left');
  assert.equal(renderer.dom.speechBubble.dataset.dialogueAnchorState, 'tracked');
  assert.equal(renderer.dom.speechBubble.style.getPropertyValue('--dialogue-tail-x'), '21.667%');
  assert.equal(renderer.dom.speechBubble.style.getPropertyValue('--dialogue-tail-reach'), '128px');

  renderer.renderDialogueStyle({ id: 'narration', label: 'Narrator Box' }, 3, 4);
  assert.equal(renderer.dom.speechBubble.dataset.dialogueSource, 'narrator');
});

test('Renderer applies dialogue skins and animates changed score tiles', () => {
  const { renderer } = createRenderer();

  renderer.renderDialogueStyle({ id: 'thought', label: 'Host Thought' }, 2, 4);
  renderer.renderScenePicker({ id: 'long-beach-boardwalk', label: 'Long Beach Boardwalk' }, 1, 2);
  renderer.renderHostPack({
    id: 'professor-oo',
    displayName: 'Professor O.O.',
    subtitle: 'Cosmic pattern coach',
  }, 2, 3);
  renderer.renderScoreboard({ currentStreak: 0, bestStreak: 0, score: 0 });
  renderer.renderScoreboard({ currentStreak: 1, bestStreak: 1, score: 400 });

  assert.equal(renderer.dom.speechBubble.dataset.dialogueStyle, 'thought');
  assert.equal(renderer.dom.dialogueStyleLabel.textContent, 'Host Thought');
  assert.equal(renderer.dom.dialogueStyleIndex.textContent, '03/04');
  assert.equal(renderer.dom.speechBubble.attributes['aria-label'], 'Host Thought dialogue panel');
  assert.equal(renderer.dom.menuSceneLabel.textContent, 'Long Beach Boardwalk');
  assert.equal(renderer.dom.menuSceneIndex.textContent, '02/02');
  assert.equal(renderer.dom.menuScene.dataset.scenePack, 'long-beach-boardwalk');
  assert.equal(renderer.dom.menuHostPackLabel.textContent, 'Professor O.O.');
  assert.equal(renderer.dom.menuHostPackIndex.textContent, '03/03');
  assert.equal(renderer.dom.menuHostPack.dataset.hostPack, 'professor-oo');
  assert.equal(renderer.dom.hudScore.classList.has('score-flip'), true);
  assert.equal(renderer.dom.hudBest.classList.has('score-flip'), true);
  assert.equal(renderer.dom.scoreDrawer.classList.has('active'), true);
});

test('Renderer animates and reveals the scoreboard when episode progress changes', () => {
  const { renderer } = createRenderer();

  renderer.renderSessionProgress({ current: 1, answered: 0, total: 10, complete: false });
  renderer.hideScoreDrawer(true);
  renderer.renderSessionProgress({ current: 2, answered: 1, total: 10, complete: false });

  assert.equal(renderer.dom.hudEpisode.textContent, '2/10');
  assert.equal(renderer.dom.hudEpisode.classList.has('score-flip'), true);
  assert.equal(renderer.dom.scoreDrawer.classList.has('active'), true);
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

test('Renderer reports a runtime image failure only once', () => {
  const { renderer } = createRenderer();
  const failures = [];
  renderer.onMediaFailure = (failure) => failures.push(failure);

  renderer.renderClue({
    category: 'Archive',
    question: 'Identify <a href="https://media.test/broken.jpg">this image</a>.',
    answer: 'A test',
  }, 400);

  const thumbnail = renderer.dom.clueMedia.children[0].children[0];
  thumbnail.listeners.error();
  thumbnail.listeners.error();

  assert.equal(failures.length, 1);
  assert.equal(failures[0].reason, 'thumbnail-error');
  assert.equal(failures[0].item.url, 'https://media.test/broken.jpg');
});
