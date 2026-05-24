(function initRenderer(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeopardishRenderer = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function rendererFactory() {
  'use strict';

  const DefaultCopy = Object.freeze({
    lang: 'en',
    questionButton: 'New Clue',
    answerButton: 'Reveal Answer',
    checkButton: 'Lock It In',
    inputPlaceholder: 'Type your response',
    themeNight: 'Night',
    themeDay: 'Day',
    languageEnglish: 'English',
    languagePortuguese: 'Português',
    currentStreak: 'Current Streak',
    bestStreak: 'Best Streak',
    score: 'Score',
    loadingBank: 'Loading question bank...',
    loadingQuestions: 'Loading questions...',
    fallbackClue: 'There was a problem loading a normal clue. Showing fallback clue.',
    newClue: 'New clue loaded. Enter your answer and press Lock It In.',
    correctMessage: 'Correct! Your streak is now',
    correctAnswerStreak: 'Correct answer streak is now',
    incorrectMessage: 'Incorrect! The correct answer was:',
    streakReset: 'STREAK RESET!',
    incorrectStatus: 'Incorrect. Load a new clue to continue.',
  });

  class Renderer {
    constructor({ documentRef = globalThis.document, random = Math.random } = {}) {
      if (!documentRef) {
        throw new Error('Renderer requires a document.');
      }

      this.document = documentRef;
      this.random = random;
      this.dom = {};
      this.copy = { ...DefaultCopy };
    }

    bindDom() {
      this.dom.checkButton = this.document.getElementById('checkButton');
      this.dom.answerButton = this.document.getElementById('answerButton');
      this.dom.questionButton = this.document.getElementById('questionButton');
      this.dom.userInput = this.document.getElementById('inputbox');
      this.dom.categoryBox = this.document.getElementById('categoryBox');
      this.dom.statusMessage = this.document.getElementById('statusMessage');
      this.dom.questionBox = this.document.getElementById('questionBox');
      this.dom.answerBox = this.document.getElementById('answerBox');
      this.dom.currentStreak = this.document.getElementById('currentStreak');
      this.dom.bestStreak = this.document.getElementById('bestStreak');
      this.dom.score = this.document.getElementById('score');
      this.dom.hamburgerMenu = this.document.getElementById('hamburgerMenu');
      this.dom.navMenu = this.document.getElementById('navMenu');
      this.dom.hostImage = this.document.getElementById('hostImage');
      this.dom.themeToggle = this.document.getElementById('themeToggle');
      this.dom.themeToggleLabel = this.document.getElementById('themeToggleLabel');
      this.dom.languageToggle = this.document.getElementById('languageToggle');
      this.dom.languageToggleLabel = this.document.getElementById('languageToggleLabel');
      this.updateStaticText();
      return this.dom;
    }

    bindEvents({
      onToggleAnswer,
      onNewQuestion,
      onCheckAnswer,
      onToggleTheme = () => {},
      onToggleLanguage = () => {},
    }) {
      this.dom.hamburgerMenu.addEventListener('click', () => {
        this.dom.navMenu.classList.toggle('active');
      });

      this.dom.answerButton.addEventListener('click', onToggleAnswer);
      this.dom.questionButton.addEventListener('click', onNewQuestion);
      this.dom.checkButton.addEventListener('click', onCheckAnswer);
      this.dom.themeToggle?.addEventListener('click', onToggleTheme);
      this.dom.languageToggle?.addEventListener('click', onToggleLanguage);
      this.dom.userInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          onCheckAnswer();
        }
      });
    }

    setCopy(copy = {}) {
      this.copy = {
        ...DefaultCopy,
        ...copy,
      };
      this.updateStaticText();
    }

    updateStaticText() {
      if (!this.dom.questionButton) {
        return;
      }

      this.setText(this.dom.questionButton, this.copy.questionButton);
      this.setText(this.dom.answerButton, this.copy.answerButton);
      this.setText(this.dom.checkButton, this.copy.checkButton);
      this.dom.userInput.placeholder = this.copy.inputPlaceholder;
      this.dom.userInput.setAttribute?.('aria-label', this.copy.inputPlaceholder);
      this.document.documentElement?.setAttribute?.('lang', this.copy.lang);
    }

    setToggleStates({ theme = 'dark', language = 'en' } = {}) {
      const isLight = theme === 'light';
      const isPortuguese = language === 'pt-BR';

      if (this.dom.themeToggle) {
        this.dom.themeToggle.setAttribute('aria-pressed', String(isLight));
        this.dom.themeToggle.dataset.mode = theme;
      }
      if (this.dom.themeToggleLabel) {
        this.setText(this.dom.themeToggleLabel, isLight ? this.copy.themeDay : this.copy.themeNight);
      }

      if (this.dom.languageToggle) {
        this.dom.languageToggle.setAttribute('aria-pressed', String(isPortuguese));
        this.dom.languageToggle.dataset.language = language;
      }
      if (this.dom.languageToggleLabel) {
        this.setText(
          this.dom.languageToggleLabel,
          isPortuguese ? this.copy.languagePortuguese : this.copy.languageEnglish,
        );
      }
    }

    setText(el, text) {
      el.textContent = text;
    }

    setStatus(message) {
      this.setText(this.dom.statusMessage, message || '');
    }

    setControlsEnabled(enabled) {
      this.dom.checkButton.disabled = !enabled;
      this.dom.answerButton.disabled = !enabled;
    }

    setCategory(category, value) {
      this.dom.categoryBox.textContent = '';

      const categoryLine = this.document.createElement('strong');
      categoryLine.textContent = category;

      const valueLine = this.document.createElement('span');
      valueLine.textContent = ` for ${value}`;

      this.dom.categoryBox.append(categoryLine, valueLine);
    }

    toggleAnswer(show) {
      this.dom.answerBox.style.display = show ? 'flex' : 'none';
    }

    isAnswerVisible() {
      return this.dom.answerBox.style.display !== 'none';
    }

    getUserAnswer() {
      return this.dom.userInput.value;
    }

    clearUserAnswer() {
      this.dom.userInput.value = '';
    }

    focusUserAnswer() {
      this.dom.userInput.focus();
    }

    renderScoreboard(gameState) {
      this.setText(this.dom.currentStreak, `${this.copy.currentStreak}: ${gameState.currentStreak}`);
      this.setText(this.dom.bestStreak, `${this.copy.bestStreak}: ${gameState.bestStreak}`);
      this.setText(this.dom.score, `${this.copy.score}: $${gameState.score}`);
    }

    renderHost(host, expression = 'neutral', visual = null) {
      if (!this.dom.hostImage || !host) {
        return;
      }

      const nextVisual = visual || host.visuals?.[expression] || host.visuals?.neutral;
      if (nextVisual) {
        this.dom.hostImage.src = nextVisual;
      }
      this.dom.hostImage.alt = host.displayName || 'Jeopardish host';
      this.dom.hostImage.dataset.hostId = host.id || '';
      this.dom.hostImage.dataset.expression = expression;
    }

    showLoading() {
      this.setControlsEnabled(false);
      this.setStatus(this.copy.loadingBank);
      this.setText(this.dom.questionBox, this.copy.loadingQuestions);
    }

    displayErrorMessage(message) {
      this.setStatus(message);
      this.setText(this.dom.categoryBox, 'Error');
      this.setText(this.dom.questionBox, message);
      this.setText(this.dom.answerBox, '');
      this.toggleAnswer(true);
    }

    displayErrorJoke(fallbackClues) {
      const randomError = fallbackClues[Math.floor(this.random() * fallbackClues.length)];
      this.setStatus(this.copy.fallbackClue);
      this.setCategory(randomError.category, randomError.value);
      this.setText(this.dom.questionBox, randomError.question);
      this.setText(this.dom.answerBox, randomError.answer);
      this.toggleAnswer(true);
      this.setControlsEnabled(true);
      return randomError;
    }

    renderClue(clue, clueValue) {
      this.setCategory(
        String(clue.category || 'Unknown Category').toUpperCase(),
        `$${clueValue}`,
      );
      this.setText(this.dom.questionBox, clue.question || 'No question available.');
      this.setText(this.dom.answerBox, clue.answer || 'No answer available.');
      this.setStatus(this.copy.newClue);
      this.toggleAnswer(false);
      this.setControlsEnabled(true);
      this.clearUserAnswer();
      this.focusUserAnswer();
    }

    displayCorrectAnswerMessage(currentStreak) {
      this.setText(this.dom.categoryBox, '');
      this.setText(this.dom.questionBox, `${this.copy.correctMessage}: ${currentStreak}`);
      this.setText(this.dom.answerBox, `${this.copy.correctAnswerStreak} ${currentStreak}`);
      this.toggleAnswer(true);
    }

    displayIncorrectAnswerMessage(correctAnswer) {
      this.setText(this.dom.categoryBox, '');
      this.setText(this.dom.questionBox, `${this.copy.incorrectMessage} ${correctAnswer}`);
      this.setText(this.dom.answerBox, this.copy.streakReset);
      this.setStatus(this.copy.incorrectStatus);
      this.toggleAnswer(true);
    }
  }

  return {
    DefaultCopy,
    Renderer,
  };
}));
