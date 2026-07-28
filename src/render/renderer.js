(function initRenderer(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('../ui/focus-scope.js'),
      require('./outcome-view.js'),
      require('./clue-view.js'),
    );
  } else {
    root.JeopardishRenderer = factory(
      root.JeoPARODYFocus,
      root.JeoPARODYOutcomeView,
      root.JeoPARODYClueView,
    );
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function rendererFactory(
  focusModule,
  outcomeModule,
  clueModule,
) {
  'use strict';

  if (!focusModule?.FocusScope) {
    throw new Error('JeopardishRenderer requires JeoPARODYFocus.');
  }
  if (!outcomeModule?.OutcomeView) {
    throw new Error('JeopardishRenderer requires JeoPARODYOutcomeView.');
  }
  if (!clueModule?.ClueView) {
    throw new Error('JeopardishRenderer requires JeoPARODYClueView.');
  }

  const DefaultCopy = Object.freeze({
    lang: 'en',
    questionButton: 'New Clue',
    answerButton: 'Reveal Answer',
    checkButton: 'Lock It In',
    inputPlaceholder: 'Type your response',
    soundOn: 'Sound',
    soundOff: 'Muted',
    voiceMode: 'Voice mode',
    voiceOff: 'Voice off',
    voiceReady: 'Tap to answer',
    voiceNarrationReady: 'Narration on',
    voiceListening: 'Listening...',
    voiceSpeaking: 'Xander speaking',
    voiceDenied: 'Microphone blocked',
    voiceUnavailable: 'Voice unavailable',
    voiceError: 'Voice needs another try',
    voiceHelp: 'Push to talk. Say an answer, next clue, reveal the answer, repeat the clue, open menu, or ask Xander.',
    nextClueReady: 'NEXT CLUE READY',
    themeNight: 'Night',
    themeDay: 'Day',
    languageEnglish: 'English',
    languagePortuguese: 'Português',
    translatingClue: 'Translating the complete clue...',
    translationOnDevice: 'PT · ON DEVICE',
    translationNetwork: 'PT · MACHINE',
    translationCache: 'PT · CACHED',
    translationFallback: 'PT unavailable · English shown',
    currentStreak: 'Current Streak',
    bestStreak: 'Best Streak',
    score: 'Score',
    episode: 'Episode',
    clueProgress: 'Clue',
    episodeComplete: 'Broadcast Complete',
    replayEpisode: 'Replay Episode',
    emptyCategory: 'Host Advisory',
    loadingBank: 'Loading question bank...',
    loadingQuestions: 'Loading questions...',
    fallbackClue: 'There was a problem loading a normal clue. Showing fallback clue.',
    newClue: 'New clue loaded. Enter your answer and press Lock It In.',
    correctKicker: 'Right on the Money',
    correctMessage: 'Correct.',
    correctAnswerStreak: 'Answer streak',
    incorrectKicker: 'The Judges Have Spoken',
    incorrectMessage: 'Not quite.',
    correctResponseLabel: 'Correct response:',
    yourResponseLabel: 'Your response:',
    exactJudgment: 'Exact match',
    variationJudgment: 'Accepted variation',
    fuzzyJudgment: 'Minor typo accepted',
    streakReset: 'STREAK RESET!',
    incorrectStatus: 'Incorrect. Load a new clue to continue.',
    keepTyping: 'Type an answer to keep the dignity damage contained.',
    answerFieldLabel: 'Your response',
    checkButtonKicker: 'Confirm',
    questionButtonKicker: 'Board',
    answerButtonKicker: 'Clue',
    hostPersonality: 'Host personality',
    askHost: 'Ask Xander',
    returnToClue: 'Return to clue',
    confidencePrompt: 'How did that one feel?',
    confidenceKnew: 'Knew it',
    confidenceShaky: 'Shaky',
    confidenceLearned: 'Learned it',
    disputeJudgment: 'Dispute ruling',
    disputeRecorded: 'Ruling flagged',
  });

  const {
    MediaTypes,
    extractClueContent,
    extractClueMedia,
    getMediaType,
  } = clueModule;

  class Renderer {
    constructor({
      documentRef = globalThis.document,
      random = Math.random,
      focusScope = null,
    } = {}) {
      if (!documentRef) {
        throw new Error('Renderer requires a document.');
      }

      this.document = documentRef;
      this.random = random;
      this.focusScope = focusScope || new focusModule.FocusScope({ documentRef });
      this.dom = {};
      this.copy = { ...DefaultCopy };
      this.lastMediaTrigger = null;
      this.onMediaFailure = () => {};
      this.lastScore = null;
      this.lastStreak = null;
      this.lastBestStreak = null;
      this.lastEpisodeValue = null;
      this.scoreDrawerTimer = null;
      this.onExitStudy = () => {};
      this.outcomeView = new outcomeModule.OutcomeView({
        dom: this.dom,
        getCopy: () => this.copy,
        setText: (element, value) => this.setText(element, value),
        setGameMoment: (moment) => this.setGameMoment(moment),
        clearMedia: () => this.clearMedia(),
        setQuestionText: (message) => this.setQuestionText(message),
        toggleAnswer: (visible) => this.toggleAnswer(visible),
      });
      this.clueView = new clueModule.ClueView({
        documentRef: this.document,
        dom: this.dom,
        getCopy: () => this.copy,
        setText: (element, value) => this.setText(element, value),
        setGameMoment: (moment) => this.setGameMoment(moment),
        setControlsEnabled: (enabled) => this.setControlsEnabled(enabled),
        setStatus: (message) => this.setStatus(message),
        hideOutcomeFeedback: () => this.hideOutcomeFeedback(),
        decorateControlButton: (...args) => this.decorateControlButton(...args),
        toggleAnswer: (visible) => this.toggleAnswer(visible),
        clearUserAnswer: () => this.clearUserAnswer(),
        focusUserAnswer: () => this.focusUserAnswer(),
        closeMedia: (restoreFocus) => this.closeMedia(restoreFocus),
        openMedia: (index, trigger) => this.openMedia(index, trigger),
        reportMediaFailure: (item, reason) => this.reportMediaFailure(item, reason),
      });
    }

    bindDom() {
      this.dom.checkButton = this.document.getElementById('checkButton');
      this.dom.answerButton = this.document.getElementById('answerButton');
      this.dom.questionButton = this.document.getElementById('questionButton');
      this.dom.answerFieldLabel = this.document.getElementById('answerFieldLabel');
      this.dom.checkButtonKicker = this.document.getElementById('checkButtonKicker');
      this.dom.questionButtonKicker = this.document.getElementById('questionButtonKicker');
      this.dom.answerButtonKicker = this.document.getElementById('answerButtonKicker');
      this.dom.gameContainer = this.document.getElementById('gameContainer');
      this.dom.userInput = this.document.getElementById('inputbox');
      this.dom.categoryBox = this.document.getElementById('categoryBox');
      this.dom.statusMessage = this.document.getElementById('statusMessage');
      this.dom.questionBox = this.document.getElementById('questionBox');
      this.dom.clueText = this.document.getElementById('clueText');
      this.dom.clueOriginal = this.document.getElementById('clueOriginal');
      this.dom.clueMedia = this.document.getElementById('clueMedia');
      this.dom.answerBox = this.document.getElementById('answerBox');
      this.dom.outcomeFeedback = this.document.getElementById('outcomeFeedback');
      this.dom.outcomeFeedbackPrompt = this.document.getElementById('outcomeFeedbackPrompt');
      this.dom.confidenceKnew = this.document.getElementById('confidenceKnew');
      this.dom.confidenceShaky = this.document.getElementById('confidenceShaky');
      this.dom.confidenceLearned = this.document.getElementById('confidenceLearned');
      this.dom.disputeButton = this.document.getElementById('disputeButton');
      this.dom.outcomeFeedbackStatus = this.document.getElementById('outcomeFeedbackStatus');
      this.dom.hudScore = this.document.getElementById('hudScore');
      this.dom.hudStreak = this.document.getElementById('hudStreak');
      this.dom.hudBest = this.document.getElementById('hudBest');
      this.dom.hudScoreLabel = this.document.getElementById('hudScoreLabel');
      this.dom.hudStreakLabel = this.document.getElementById('hudStreakLabel');
      this.dom.hudBestLabel = this.document.getElementById('hudBestLabel');
      this.dom.hudEpisode = this.document.getElementById('hudEpisode');
      this.dom.hudEpisodeLabel = this.document.getElementById('hudEpisodeLabel');
      this.dom.hamburgerMenu = this.document.getElementById('hamburgerMenu');
      this.dom.navMenu = this.document.getElementById('navMenu');
      this.dom.menuClose = this.document.getElementById('menuClose');
      this.dom.menuNewClue = this.document.getElementById('menuNewClue');
      this.dom.menuRevealAnswer = this.document.getElementById('menuRevealAnswer');
      this.dom.menuDeepDive = this.document.getElementById('menuDeepDive');
      this.dom.menuTheme = this.document.getElementById('menuTheme');
      this.dom.menuLanguage = this.document.getElementById('menuLanguage');
      this.dom.menuSound = this.document.getElementById('menuSound');
      this.dom.menuVoice = this.document.getElementById('menuVoice');
      this.dom.menuVoiceLabel = this.document.getElementById('menuVoiceLabel');
      this.dom.menuVoiceState = this.document.getElementById('menuVoiceState');
      this.dom.menuHostPack = this.document.getElementById('menuHostPack');
      this.dom.menuHostPackKicker = this.document.getElementById('menuHostPackKicker');
      this.dom.menuHostPackLabel = this.document.getElementById('menuHostPackLabel');
      this.dom.menuHostPackIndex = this.document.getElementById('menuHostPackIndex');
      this.dom.menuScene = this.document.getElementById('menuScene');
      this.dom.menuSceneLabel = this.document.getElementById('menuSceneLabel');
      this.dom.menuSceneIndex = this.document.getElementById('menuSceneIndex');
      this.dom.scoreDrawer = this.document.getElementById('scoreDrawer');
      this.dom.speechBubble = this.document.getElementById('speechBubble');
      this.dom.dialogueStylePrev = this.document.getElementById('dialogueStylePrev');
      this.dom.dialogueStyleNext = this.document.getElementById('dialogueStyleNext');
      this.dom.dialogueStyleLabel = this.document.getElementById('dialogueStyleLabel');
      this.dom.dialogueStyleIndex = this.document.getElementById('dialogueStyleIndex');
      this.dom.hostStage = this.document.getElementById('hostStage');
      this.dom.hostImage = this.document.getElementById('hostImage');
      this.dom.hostPrevButton = this.document.getElementById('hostPrevButton');
      this.dom.hostNextButton = this.document.getElementById('hostNextButton');
      this.dom.hostSkinLabel = this.document.getElementById('hostSkinLabel');
      this.dom.hostPackIndex = this.document.getElementById('hostPackIndex');
      this.dom.themeToggle = this.document.getElementById('themeToggle');
      this.dom.themeToggleLabel = this.document.getElementById('themeToggleLabel');
      this.dom.languageToggle = this.document.getElementById('languageToggle');
      this.dom.languageToggleLabel = this.document.getElementById('languageToggleLabel');
      this.dom.soundToggle = this.document.getElementById('soundToggle');
      this.dom.soundToggleLabel = this.document.getElementById('soundToggleLabel');
      this.dom.voiceButton = this.document.getElementById('voiceButton');
      this.dom.voiceState = this.document.getElementById('voiceState');
      this.dom.voiceHelp = this.document.getElementById('voiceHelp');
      this.dom.translationState = this.document.getElementById('translationState');
      this.dom.translationStateLabel = this.document.getElementById('translationStateLabel');
      this.dom.mediaModal = this.document.getElementById('mediaModal');
      this.dom.mediaModalBackdrop = this.document.getElementById('mediaModalBackdrop');
      this.dom.mediaModalBody = this.document.getElementById('mediaModalBody');
      this.dom.mediaModalTitle = this.document.getElementById('mediaModalTitle');
      this.dom.mediaModalType = this.document.getElementById('mediaModalType');
      this.dom.mediaModalClose = this.document.getElementById('mediaModalClose');
      this.dom.mediaModalLink = this.document.getElementById('mediaModalLink');
      this.dom.deepDiveButton = this.document.getElementById('deepDiveButton');
      this.dom.reviewQueueButton = this.document.getElementById('reviewQueueButton');
      this.dom.reviewQueueStatus = this.document.getElementById('reviewQueueStatus');
      this.dom.studyPanel = this.document.getElementById('studyPanel');
      this.dom.studyClose = this.document.getElementById('studyClose');
      this.dom.studyResume = this.document.getElementById('studyResume');
      this.dom.studyCategory = this.document.getElementById('studyCategory');
      this.dom.studyQuestion = this.document.getElementById('studyQuestion');
      this.dom.studyAnswer = this.document.getElementById('studyAnswer');
      this.dom.studyGrounding = this.document.getElementById('studyGrounding');
      this.dom.studySources = this.document.getElementById('studySources');
      this.dom.studyActions = this.document.getElementById('studyActions');
      this.dom.studyResponse = this.document.getElementById('studyResponse');
      this.dom.studyReinforcement = this.document.getElementById('studyReinforcement');
      this.dom.studyReinforcementPrompt = this.document.getElementById('studyReinforcementPrompt');
      this.dom.studyReinforcementForm = this.document.getElementById('studyReinforcementForm');
      this.dom.studyReinforcementInput = this.document.getElementById('studyReinforcementInput');
      this.dom.studyReinforcementCheck = this.document.getElementById('studyReinforcementCheck');
      this.dom.studyReinforcementResult = this.document.getElementById('studyReinforcementResult');
      this.updateStaticText();
      return this.dom;
    }

    bindEvents({
      onToggleAnswer,
      onNewQuestion,
      onCheckAnswer,
      onToggleTheme = () => {},
      onToggleLanguage = () => {},
      onToggleSound = () => {},
      onToggleVoice = () => {},
      onPreviousHostSkin = () => {},
      onNextHostSkin = () => {},
      onCycleHostPack = () => {},
      onPreviousDialogueStyle = () => {},
      onNextDialogueStyle = () => {},
      onCycleScene = () => {},
      onEnterStudy = () => {},
      onReviewSavedClues = () => {},
      onStudyAction = () => {},
      onSubmitReinforcement = () => {},
      onExitStudy = () => {},
      onConfidence = () => {},
      onDispute = () => {},
      onMediaFailure = () => {},
    }) {
      this.onMediaFailure = onMediaFailure;
      this.onExitStudy = onExitStudy;
      this.dom.hamburgerMenu.addEventListener('click', () => {
        this.setMenuOpen(!this.dom.navMenu.classList.contains('active'));
      });
      this.dom.menuClose?.addEventListener('click', () => this.setMenuOpen(false));
      this.dom.menuNewClue?.addEventListener('click', () => {
        this.setMenuOpen(false);
        onNewQuestion();
      });
      this.dom.menuRevealAnswer?.addEventListener('click', () => {
        this.setMenuOpen(false);
        onToggleAnswer();
      });
      this.dom.menuDeepDive?.addEventListener('click', () => {
        this.setMenuOpen(false);
        onEnterStudy();
      });
      this.dom.menuTheme?.addEventListener('click', onToggleTheme);
      this.dom.menuLanguage?.addEventListener('click', onToggleLanguage);
      this.dom.menuSound?.addEventListener('click', onToggleSound);
      this.dom.menuVoice?.addEventListener('click', () => onToggleVoice({ listen: false }));
      this.dom.menuHostPack?.addEventListener('click', onCycleHostPack);
      this.dom.menuScene?.addEventListener('click', onCycleScene);
      this.dom.scoreDrawer?.addEventListener('pointerenter', () => this.showScoreDrawer(0));
      this.dom.scoreDrawer?.addEventListener('pointerleave', () => this.hideScoreDrawer());
      this.dom.scoreDrawer?.addEventListener('focus', () => this.showScoreDrawer(0));
      this.dom.scoreDrawer?.addEventListener('blur', () => this.hideScoreDrawer());
      this.dom.scoreDrawer?.addEventListener('click', () => {
        const pinned = this.dom.scoreDrawer.dataset.pinned === 'true';
        this.dom.scoreDrawer.dataset.pinned = String(!pinned);
        this.dom.scoreDrawer.setAttribute('aria-pressed', String(!pinned));
        if (!pinned) this.showScoreDrawer(0);
        else this.hideScoreDrawer(true);
      });

      this.dom.answerButton.addEventListener('click', onToggleAnswer);
      this.dom.questionButton.addEventListener('click', onNewQuestion);
      this.dom.checkButton.addEventListener('click', onCheckAnswer);
      this.dom.themeToggle?.addEventListener('click', onToggleTheme);
      this.dom.languageToggle?.addEventListener('click', onToggleLanguage);
      this.dom.soundToggle?.addEventListener('click', onToggleSound);
      this.dom.voiceButton?.addEventListener('click', () => onToggleVoice({ listen: true }));
      this.dom.hostPrevButton?.addEventListener('click', onPreviousHostSkin);
      this.dom.hostNextButton?.addEventListener('click', onNextHostSkin);
      this.dom.dialogueStylePrev?.addEventListener('click', onPreviousDialogueStyle);
      this.dom.dialogueStyleNext?.addEventListener('click', onNextDialogueStyle);
      this.dom.deepDiveButton?.addEventListener('click', onEnterStudy);
      this.dom.reviewQueueButton?.addEventListener('click', onReviewSavedClues);
      this.dom.studyClose?.addEventListener('click', onExitStudy);
      this.dom.studyResume?.addEventListener('click', onExitStudy);
      this.dom.confidenceKnew?.addEventListener('click', () => onConfidence('knew-it'));
      this.dom.confidenceShaky?.addEventListener('click', () => onConfidence('shaky'));
      this.dom.confidenceLearned?.addEventListener('click', () => onConfidence('learned-it'));
      this.dom.disputeButton?.addEventListener('click', onDispute);
      this.dom.studyActions?.addEventListener('click', (event) => {
        const action = event.target?.closest?.('[data-study-action]');
        if (action) onStudyAction(action.dataset.studyAction);
      });
      this.dom.studyReinforcementForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        onSubmitReinforcement(this.dom.studyReinforcementInput?.value || '');
      });
      this.dom.mediaModalClose?.addEventListener('click', () => this.closeMedia());
      this.dom.mediaModalBackdrop?.addEventListener('click', () => this.closeMedia());
      this.dom.userInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          onCheckAnswer();
        }
      });
    }

    setMenuOpen(open) {
      if (!this.dom.navMenu) return;
      this.dom.navMenu.classList[open ? 'add' : 'remove']('active');
      this.dom.hamburgerMenu?.setAttribute('aria-expanded', String(Boolean(open)));
      this.dom.navMenu.setAttribute('aria-hidden', String(!open));
      this.dom.navMenu.inert = !open;
      this.dom.navMenu.toggleAttribute?.('inert', !open);
      if (open) {
        this.focusScope.activate(this.dom.navMenu, {
          initialFocus: this.dom.menuClose,
          returnFocus: this.dom.hamburgerMenu,
          onEscape: () => this.setMenuOpen(false),
        });
      } else {
        this.focusScope.deactivate(this.dom.navMenu);
      }
    }

    showScoreDrawer(duration = 2600) {
      if (!this.dom.scoreDrawer) return;
      clearTimeout(this.scoreDrawerTimer);
      this.dom.scoreDrawer.classList.add('active');
      if (duration > 0) {
        this.scoreDrawerTimer = setTimeout(() => this.hideScoreDrawer(), duration);
        this.scoreDrawerTimer?.unref?.();
      }
    }

    hideScoreDrawer(force = false) {
      if (!this.dom.scoreDrawer) return;
      clearTimeout(this.scoreDrawerTimer);
      if (force || this.dom.scoreDrawer.dataset.pinned !== 'true') {
        this.dom.scoreDrawer.classList.remove('active');
      }
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

      this.decorateControlButton(this.dom.questionButton, this.copy.questionButton, 'Q');
      this.decorateControlButton(this.dom.answerButton, this.copy.answerButton, 'A');
      this.decorateControlButton(this.dom.checkButton, this.copy.checkButton, 'Enter');
      this.setText(this.dom.answerFieldLabel, this.copy.answerFieldLabel);
      this.setText(this.dom.checkButtonKicker, this.copy.checkButtonKicker);
      this.setText(this.dom.questionButtonKicker, this.copy.questionButtonKicker);
      this.setText(this.dom.answerButtonKicker, this.copy.answerButtonKicker);
      this.setText(this.dom.menuVoiceLabel, this.copy.voiceMode);
      this.setText(this.dom.menuHostPackKicker, this.copy.hostPersonality);
      this.setText(this.dom.voiceHelp, this.copy.voiceHelp);
      this.setText(this.dom.outcomeFeedbackPrompt, this.copy.confidencePrompt);
      this.setText(this.dom.confidenceKnew, this.copy.confidenceKnew);
      this.setText(this.dom.confidenceShaky, this.copy.confidenceShaky);
      this.setText(this.dom.confidenceLearned, this.copy.confidenceLearned);
      this.setText(this.dom.disputeButton, this.copy.disputeJudgment);
      this.dom.userInput.placeholder = this.copy.inputPlaceholder;
      this.dom.userInput.setAttribute?.('aria-label', this.copy.inputPlaceholder);
      this.document.documentElement?.setAttribute?.('lang', this.copy.lang);
    }

    decorateControlButton(button, label, key) {
      if (!button) {
        return;
      }

      button.dataset.tooltip = label;
      button.dataset.key = key;
      button.setAttribute?.('title', `${label} [${key}]`);
      button.setAttribute?.('aria-label', `${label}. Keyboard shortcut: ${key}`);

      const tooltip = button.querySelector?.('.button-tooltip');
      if (tooltip) {
        tooltip.textContent = label;
      }
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
      if (el) el.textContent = text;
    }

    setStatus(message) {
      this.setText(this.dom.statusMessage, message || '');
    }

    setGameMoment(moment) {
      if (this.dom.gameContainer) {
        this.dom.gameContainer.dataset.gameMoment = moment || 'idle';
      }
    }

    setRoundPhase(phase) {
      if (this.dom.gameContainer) {
        this.dom.gameContainer.dataset.roundPhase = phase || 'idle';
      }
      if (this.dom.userInput) {
        this.dom.userInput.placeholder = phase === 'advance-ready'
          ? this.copy.nextClueReady
          : this.copy.inputPlaceholder;
      }
    }

    setControlsEnabled(enabled) {
      this.dom.checkButton.disabled = !enabled;
      this.dom.answerButton.disabled = !enabled;
      this.dom.userInput.disabled = !enabled;
    }

    setVoiceState({
      state = 'off',
      enabled = false,
      capabilities = {},
      transcript = '',
    } = {}) {
      const available = Boolean(capabilities.narration || capabilities.recognition);
      const labels = {
        off: this.copy.voiceOff,
        idle: capabilities.recognition ? this.copy.voiceReady : this.copy.voiceNarrationReady,
        listening: transcript || this.copy.voiceListening,
        speaking: this.copy.voiceSpeaking,
        denied: this.copy.voiceDenied,
        unavailable: this.copy.voiceUnavailable,
        error: this.copy.voiceError,
      };
      const label = labels[state] || this.copy.voiceOff;

      if (this.dom.gameContainer) this.dom.gameContainer.dataset.voiceState = state;
      if (this.dom.voiceButton) {
        this.dom.voiceButton.disabled = !capabilities.recognition;
        this.dom.voiceButton.dataset.state = state;
        this.dom.voiceButton.setAttribute('aria-pressed', String(state === 'listening'));
        this.dom.voiceButton.setAttribute(
          'aria-label',
          !capabilities.recognition
            ? this.copy.voiceUnavailable
            : enabled ? label : `Enable ${this.copy.voiceMode.toLowerCase()}`,
        );
      }
      this.setText(this.dom.voiceState, label);
      if (this.dom.menuVoice) {
        this.dom.menuVoice.disabled = !available;
        this.dom.menuVoice.setAttribute('aria-pressed', String(enabled));
      }
      this.setText(this.dom.menuVoiceState, !available ? 'N/A' : enabled ? 'ON' : 'OFF');
    }

    setStudyAvailable(available) {
      if (this.dom.deepDiveButton) this.dom.deepDiveButton.disabled = !available;
      if (this.dom.menuDeepDive) this.dom.menuDeepDive.disabled = !available;
    }

    captureRoundView() {
      return {
        userAnswer: this.getUserAnswer(),
        answerVisible: this.isAnswerVisible(),
        gameMoment: this.dom.gameContainer?.dataset?.gameMoment || 'clue',
        focusedElementId: this.document.activeElement?.id || null,
      };
    }

    restoreRoundView(view = {}) {
      this.dom.userInput.value = String(view.userAnswer || '');
      this.toggleAnswer(Boolean(view.answerVisible));
      this.setGameMoment(view.gameMoment || 'clue');
      const focusTarget = view.focusedElementId && this.document.getElementById(view.focusedElementId);
      (focusTarget || this.dom.userInput)?.focus?.();
    }

    isStudyOpen() {
      return Boolean(this.dom.studyPanel && !this.dom.studyPanel.hidden);
    }

    renderStudyPanel(packet, actions = []) {
      const clue = packet.presentation || packet.canonical;
      this.dom.studyPanel?.classList?.remove('reinforcement-active');
      this.setText(this.dom.studyCategory, clue.category);
      this.setText(this.dom.studyQuestion, clue.question);
      this.setText(this.dom.studyAnswer, clue.answer);
      this.setText(this.dom.studyGrounding, packet.grounding === 'reviewed' ? 'Reviewed sources attached' : 'Archive text only');
      const sourceLinks = (packet.citations || []).map((citation) => {
        const link = this.document.createElement('a');
        link.href = citation.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = citation.title;
        return link;
      });
      this.dom.studySources?.replaceChildren?.(...sourceLinks);
      if (this.dom.studySources) this.dom.studySources.hidden = sourceLinks.length === 0;
      this.setText(this.dom.studyResponse, clue.locale === 'pt-BR'
        ? 'Escolha um caminho. Continuarei preso aos fatos conhecidos, uma restrição que a televisão tradicionalmente considera opcional.'
        : 'Pick a direction. I will remain tethered to the known facts, a restriction television has traditionally considered optional.');
      if (this.dom.studyReinforcement) this.dom.studyReinforcement.hidden = true;
      if (this.dom.studyReinforcementForm) this.dom.studyReinforcementForm.hidden = false;
      if (this.dom.studyReinforcementInput) {
        this.dom.studyReinforcementInput.value = '';
        this.dom.studyReinforcementInput.disabled = false;
      }
      if (this.dom.studyReinforcementCheck) this.dom.studyReinforcementCheck.disabled = false;
      this.setText(this.dom.studyReinforcementResult, '');
      this.dom.studyReinforcementResult?.removeAttribute?.('data-state');
      const buttons = actions.map((action) => {
        const button = this.document.createElement('button');
        button.type = 'button';
        button.dataset.studyAction = action.id;
        button.textContent = action.label;
        return button;
      });
      this.dom.studyActions?.replaceChildren?.(...buttons);
    }

    renderStudyResponse(response) {
      this.setText(this.dom.studyResponse, response);
    }

    renderStudyReinforcement(reinforcement, locale = 'en') {
      if (!this.dom.studyReinforcement || !reinforcement) return;
      this.dom.studyPanel?.classList?.add('reinforcement-active');
      this.dom.studyReinforcement.hidden = false;
      this.setText(this.dom.studyReinforcementPrompt, reinforcement.prompt);
      if (this.dom.studyReinforcementInput) {
        this.dom.studyReinforcementInput.value = '';
        this.dom.studyReinforcementInput.disabled = false;
        this.dom.studyReinforcementInput.placeholder = locale === 'pt-BR'
          ? 'Digite sua resposta'
          : 'Type your answer';
      }
      if (this.dom.studyReinforcementCheck) {
        this.dom.studyReinforcementCheck.disabled = false;
        this.setText(
          this.dom.studyReinforcementCheck,
          locale === 'pt-BR' ? 'Verificar memória' : 'Check memory',
        );
      }
      this.setText(this.dom.studyReinforcementResult, '');
      this.dom.studyReinforcementResult?.removeAttribute?.('data-state');
      this.dom.studyReinforcementInput?.focus?.();
    }

    renderStudyReinforcementResult({ correct = false, empty = false, message = '' } = {}) {
      this.setText(this.dom.studyReinforcementResult, message);
      if (this.dom.studyReinforcementResult) {
        this.dom.studyReinforcementResult.dataset.state = empty
          ? 'empty'
          : correct ? 'correct' : 'incorrect';
      }
      if (correct) {
        if (this.dom.studyReinforcementInput) this.dom.studyReinforcementInput.disabled = true;
        if (this.dom.studyReinforcementCheck) this.dom.studyReinforcementCheck.disabled = true;
        this.dom.studyResume?.focus?.();
      } else {
        this.dom.studyReinforcementInput?.select?.();
      }
      this.dom.studyReinforcementResult?.scrollIntoView?.({ block: 'nearest' });
    }

    setReviewQueueState(learning = {}) {
      const due = Math.max(0, Number(learning.due) || 0);
      const reinforced = Math.max(0, Number(learning.reviewReinforced) || 0);
      if (this.dom.reviewQueueButton) {
        this.dom.reviewQueueButton.hidden = due === 0;
        this.setText(
          this.dom.reviewQueueButton,
          `Review ${due} saved clue${due === 1 ? '' : 's'}`,
        );
      }
      this.setText(
        this.dom.reviewQueueStatus,
        due > 0
          ? `${due} still due · ${reinforced} reinforced`
          : reinforced > 0 ? `${reinforced} reinforced · review queue clear` : '',
      );
    }

    setStudyOpen(open) {
      if (!this.dom.studyPanel) return;
      this.dom.studyPanel.hidden = !open;
      this.dom.studyPanel.setAttribute('aria-hidden', String(!open));
      this.dom.gameContainer?.classList?.toggle('study-open', open);
      this.document.body?.classList?.toggle('study-mode-open', open);
      if (this.dom.deepDiveButton) this.dom.deepDiveButton.disabled = open;
      if (this.dom.menuDeepDive) this.dom.menuDeepDive.disabled = open;
      if (open) {
        this.focusScope.activate(this.dom.studyPanel, {
          initialFocus: this.dom.studyClose,
          returnFocus: null,
          onEscape: () => this.onExitStudy(),
        });
      } else {
        this.focusScope.deactivate(this.dom.studyPanel, { restoreFocus: false });
      }
    }

    setSoundState(muted) {
      if (!this.dom.soundToggle) {
        return;
      }
      this.dom.soundToggle.setAttribute('aria-pressed', String(Boolean(muted)));
      this.dom.soundToggle.setAttribute('aria-label', muted ? 'Enable game audio' : 'Mute game audio');
      this.dom.soundToggle.dataset.muted = String(Boolean(muted));
      if (this.dom.soundToggleLabel) {
        this.setText(this.dom.soundToggleLabel, muted ? this.copy.soundOff : this.copy.soundOn);
      }
    }

    renderDialogueStyle(style, index = 0, total = 1) {
      if (!style || !this.dom.speechBubble) {
        return;
      }
      this.dom.speechBubble.dataset.dialogueStyle = style.id;
      this.setText(this.dom.dialogueStyleLabel, style.label);
      this.setText(
        this.dom.dialogueStyleIndex,
        `${String(index + 1).padStart(2, '0')}/${String(total).padStart(2, '0')}`,
      );
      this.dom.speechBubble.setAttribute('aria-label', `${style.label} dialogue panel`);
    }

    renderScenePicker(pack, index = 0, total = 1) {
      if (!pack || !this.dom.menuScene) return;
      this.setText(this.dom.menuSceneLabel, pack.label);
      this.setText(
        this.dom.menuSceneIndex,
        `${String(index + 1).padStart(2, '0')}/${String(total).padStart(2, '0')}`,
      );
      this.dom.menuScene.setAttribute('aria-label', `Background: ${pack.label}. Activate to cycle.`);
      this.dom.menuScene.dataset.scenePack = pack.id;
    }

    renderHostPack(pack, index = 0, total = 1) {
      if (!pack || !this.dom.menuHostPack) return;
      this.setText(this.dom.menuHostPackLabel, pack.displayName);
      this.setText(
        this.dom.menuHostPackIndex,
        `${String(index + 1).padStart(2, '0')}/${String(total).padStart(2, '0')}`,
      );
      this.dom.menuHostPack.dataset.hostPack = pack.id;
      this.dom.menuHostPack.setAttribute(
        'aria-label',
        `${this.copy.hostPersonality}: ${pack.displayName}, ${pack.subtitle}. Activate to cycle.`,
      );
    }

    setTranslationState(status = 'original', provider = '') {
      return this.clueView.setTranslationState(status, provider);
    }

    showTranslationLoading() {
      return this.clueView.showTranslationLoading();
    }

    setCategory(category, value, originalCategory = '') {
      return this.clueView.setCategory(category, value, originalCategory);
    }

    setQuestionText(text) {
      return this.clueView.setQuestionText(text);
    }

    clearMedia() {
      return this.clueView.clearMedia();
    }

    renderMedia(items) {
      return this.clueView.renderMedia(items);
    }

    renderClueContent(clue) {
      return this.clueView.renderClueContent(clue);
    }

    reportMediaFailure(item, reason = 'runtime-error') {
      if (!item || item.failureReported) return;
      item.failureReported = true;
      this.onMediaFailure?.({ item, reason });
    }

    openMedia(index, trigger = null) {
      const item = this.clueView.getMediaItem(index);
      if (!item || !this.dom.mediaModal || !this.dom.mediaModalBody) {
        return;
      }

      this.lastMediaTrigger = trigger;
      this.setText(this.dom.mediaModalTitle, item.label);
      this.setText(this.dom.mediaModalType, `${item.type.toUpperCase()} CLUE`);
      this.dom.mediaModalLink.href = item.url;

      let viewer;
      if (item.type === MediaTypes.IMAGE) {
        viewer = this.document.createElement('img');
        viewer.alt = item.label;
      } else if (item.type === MediaTypes.AUDIO) {
        viewer = this.document.createElement('audio');
        viewer.controls = true;
        viewer.preload = 'metadata';
      } else if (item.type === MediaTypes.VIDEO) {
        viewer = this.document.createElement('video');
        viewer.controls = true;
        viewer.preload = 'metadata';
        viewer.playsInline = true;
      } else {
        viewer = this.document.createElement('p');
        viewer.textContent = 'This clue uses an external media format. Open the original to view it.';
      }

      viewer.className = `media-viewer media-viewer-${item.type}`;
      if (item.type !== MediaTypes.EXTERNAL) {
        viewer.src = item.url;
        viewer.addEventListener('error', () => this.reportMediaFailure(item, 'viewer-error'));
      }
      this.dom.mediaModalBody.replaceChildren(viewer);

      if (item.isLegacyVideo) {
        const supportNote = this.document.createElement('p');
        supportNote.className = 'media-support-note';
        supportNote.textContent = 'Vintage WMV clip: if it will not play in this browser, use Open Original.';
        this.dom.mediaModalBody.append(supportNote);
      }

      this.dom.mediaModal.hidden = false;
      this.dom.mediaModal.setAttribute('aria-hidden', 'false');
      this.document.body?.classList?.add('modal-open');
      this.focusScope.activate(this.dom.mediaModal, {
        initialFocus: this.dom.mediaModalClose,
        returnFocus: trigger,
        onEscape: () => this.closeMedia(),
      });
    }

    closeMedia(restoreFocus = true) {
      if (!this.dom.mediaModal) {
        return;
      }

      const wasOpen = !this.dom.mediaModal.hidden;
      this.dom.mediaModal.hidden = true;
      this.dom.mediaModal.setAttribute('aria-hidden', 'true');
      this.dom.mediaModalBody?.replaceChildren?.();
      this.document.body?.classList?.remove('modal-open');
      if (wasOpen) {
        this.focusScope.deactivate(this.dom.mediaModal, { restoreFocus });
      }
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

    setUserAnswer(value) {
      this.dom.userInput.value = String(value || '');
      this.dom.userInput.scrollLeft = this.dom.userInput.scrollWidth || 0;
    }

    clearUserAnswer() {
      this.dom.userInput.value = '';
      this.dom.userInput.scrollLeft = 0;
    }

    focusUserAnswer() {
      try {
        this.dom.userInput.focus({ preventScroll: true });
      } catch (error) {
        this.dom.userInput.focus();
      }
    }

    renderScoreboard(gameState) {
      const scoreChanged = this.lastScore !== null && this.lastScore !== gameState.score;
      const streakChanged = this.lastStreak !== null && this.lastStreak !== gameState.currentStreak;
      const bestChanged = this.lastBestStreak !== null && this.lastBestStreak !== gameState.bestStreak;
      if (this.dom.hudScore) {
        this.setText(this.dom.hudScore, `$${gameState.score}`);
        this.dom.hudScore.dataset.value = `$${gameState.score}`;
        if (scoreChanged) this.animateScoreTile(this.dom.hudScore);
      }
      if (this.dom.hudStreak) {
        this.setText(this.dom.hudStreak, `x${gameState.currentStreak}`);
        this.dom.hudStreak.dataset.value = `x${gameState.currentStreak}`;
        if (streakChanged) this.animateScoreTile(this.dom.hudStreak);
      }
      if (this.dom.hudBest) {
        this.setText(this.dom.hudBest, `x${gameState.bestStreak}`);
        this.dom.hudBest.dataset.value = `x${gameState.bestStreak}`;
        if (bestChanged) this.animateScoreTile(this.dom.hudBest);
      }
      if (this.dom.hudScoreLabel) {
        this.setText(this.dom.hudScoreLabel, this.copy.score);
      }
      if (this.dom.hudStreakLabel) {
        this.setText(this.dom.hudStreakLabel, this.copy.currentStreak);
      }
      if (this.dom.hudBestLabel) {
        this.setText(this.dom.hudBestLabel, this.copy.bestStreak);
      }
      if (scoreChanged || streakChanged || bestChanged) this.showScoreDrawer();
      this.lastScore = gameState.score;
      this.lastStreak = gameState.currentStreak;
      this.lastBestStreak = gameState.bestStreak;
    }

    renderSessionProgress(progress) {
      if (!progress) return;
      const value = progress.complete ? `${progress.total}/${progress.total}` : `${progress.current}/${progress.total}`;
      this.setText(this.dom.hudEpisode, value);
      this.setText(this.dom.hudEpisodeLabel, this.copy.clueProgress);
      if (this.dom.hudEpisode) {
        const episodeChanged = this.lastEpisodeValue !== null && this.lastEpisodeValue !== value;
        this.dom.hudEpisode.dataset.value = value;
        if (episodeChanged) {
          this.animateScoreTile(this.dom.hudEpisode);
          this.showScoreDrawer();
        }
      }
      this.lastEpisodeValue = value;
    }

    renderEpisodeComplete(progress) {
      const accuracy = progress.total > 0
        ? Math.round((progress.counts.correct / progress.total) * 100)
        : 0;
      this.setGameMoment('complete');
      this.hideOutcomeFeedback();
      this.setText(this.dom.categoryBox, this.copy.episodeComplete);
      this.clearMedia();
      const artifactTitle = progress.finale?.artifactTitle || progress.finale?.title || '';
      this.setQuestionText([
        artifactTitle,
        `$${progress.score} final score · ${accuracy}% accuracy`,
      ].filter(Boolean).join('\n'));
      const artifactBody = progress.finale?.artifactBody || '';
      const reviewLine = progress.review?.total
        ? `${progress.review.total} clue${progress.review.total === 1 ? '' : 's'} saved for review`
        : 'No clues queued for review';
      const disputeLine = progress.disputes
        ? `${progress.disputes} ruling${progress.disputes === 1 ? '' : 's'} flagged`
        : '';
      this.setText(
        this.dom.answerBox,
        [
          artifactBody,
          `${progress.total} clues aired`,
          `${progress.counts.incorrect} incorrect · ${progress.counts.revealed} revealed · ${progress.counts.skipped} skipped`,
          reviewLine,
          disputeLine,
        ].filter(Boolean).join('\n'),
      );
      this.toggleAnswer(true);
      this.dom.checkButton.disabled = true;
      this.dom.answerButton.disabled = true;
      this.dom.userInput.disabled = true;
      this.decorateControlButton(this.dom.questionButton, this.copy.replayEpisode, 'Q');
      this.dom.questionButton.disabled = false;
      this.setReviewQueueState(progress.learning);
      this.showScoreDrawer();
    }

    animateScoreTile(tile) {
      tile.classList.remove('score-flip');
      void tile.offsetWidth;
      tile.classList.add('score-flip');
      const timer = setTimeout(() => tile.classList.remove('score-flip'), 720);
      timer?.unref?.();
    }

    renderHost(host, expression = 'idle', visual = null, skin = null, performance = null) {
      if (!this.dom.hostImage || !host) {
        return;
      }

      const activeSkin = performance?.skin || skin;
      const activeState = performance?.state || expression;
      const nextVisual = performance?.visual
        || visual
        || activeSkin?.visuals?.[activeState]
        || activeSkin?.src
        || host.visuals?.[activeState]
        || host.visuals?.idle;
      if (nextVisual) {
        this.dom.hostImage.src = nextVisual;
      }
      const hostDisplayName = performance?.hostDisplayName
        || host.displayName
        || 'Jeopardish host';
      this.dom.hostImage.alt = performance?.accessibleLabel
        ? `${hostDisplayName}, ${performance.accessibleLabel}`
        : hostDisplayName;
      this.dom.hostImage.dataset.hostId = host.id || '';
      this.dom.hostImage.dataset.expression = activeState;
      this.dom.hostImage.dataset.skinId = activeSkin?.id || '';
      this.dom.hostImage.dataset.frame = performance?.frame || activeSkin?.frame || 'portrait';
      this.dom.hostImage.dataset.effect = performance?.effect || activeState;
      this.dom.hostImage.dataset.intensity = performance?.intensity || 'medium';
      this.dom.hostImage.dataset.hostPack = performance?.hostPackId || '';
      if (this.dom.hostStage) {
        this.dom.hostStage.dataset.expression = activeState;
        this.dom.hostStage.dataset.frame = performance?.frame || activeSkin?.frame || 'portrait';
        this.dom.hostStage.dataset.effect = performance?.effect || activeState;
        this.dom.hostStage.dataset.intensity = performance?.intensity || 'medium';
        this.dom.hostStage.dataset.hostPack = performance?.hostPackId || '';
        this.applyHostMotion(performance?.motion);
      }
      if (this.dom.hostSkinLabel) {
        this.setText(this.dom.hostSkinLabel, activeSkin?.label || host.displayName || 'Host');
      }
      if (this.dom.hostPackIndex) {
        const position = Number(performance?.skinIndex || 0) + 1;
        const total = Number(performance?.skinCount || 1);
        this.setText(this.dom.hostPackIndex, `${String(position).padStart(2, '0')}/${String(total).padStart(2, '0')}`);
      }
    }

    applyHostMotion(motion = null) {
      if (!this.dom.hostStage) return false;
      const primitive = motion?.primitive || '';
      this.dom.hostStage.dataset.motion = '';
      if (!primitive) return false;
      void this.dom.hostStage.offsetWidth;
      this.dom.hostStage.dataset.motion = primitive;
      return true;
    }

    showLoading() {
      this.setGameMoment('loading');
      this.setControlsEnabled(false);
      this.setStatus(this.copy.loadingBank);
      this.clearMedia();
      this.hideOutcomeFeedback();
      if (this.dom.reviewQueueButton) this.dom.reviewQueueButton.hidden = true;
      this.setText(this.dom.reviewQueueStatus, '');
      this.setQuestionText(this.copy.loadingQuestions);
    }

    displayErrorMessage(message) {
      this.setGameMoment('error');
      this.setStatus(message);
      this.setText(this.dom.categoryBox, 'Error');
      this.clearMedia();
      this.hideOutcomeFeedback();
      this.setQuestionText(message);
      this.setText(this.dom.answerBox, '');
      this.toggleAnswer(true);
    }

    displayEmptyAnswerQuip(message) {
      this.setStatus(message);
      this.setControlsEnabled(true);
      this.setStudyAvailable(true);
      this.clearUserAnswer();
      this.focusUserAnswer();
    }

    displayErrorJoke(fallbackClues) {
      this.setGameMoment('error');
      const randomError = fallbackClues[Math.floor(this.random() * fallbackClues.length)];
      this.setStatus(this.copy.fallbackClue);
      this.setCategory(String(randomError.category || this.copy.emptyCategory).toUpperCase(), randomError.value);
      this.clearMedia();
      this.hideOutcomeFeedback();
      this.setQuestionText(randomError.question);
      this.setText(this.dom.answerBox, randomError.answer);
      this.toggleAnswer(true);
      this.setControlsEnabled(true);
      return randomError;
    }

    renderClue(clue, clueValue) {
      return this.clueView.renderClue(clue, clueValue);
    }

    displayCorrectAnswerMessage(result) {
      return this.outcomeView.displayCorrect(result);
    }

    displayIncorrectAnswerMessage(result) {
      return this.outcomeView.displayIncorrect(result);
    }

    renderOutcomeFeedback(result = {}) {
      return this.outcomeView.renderFeedback(result);
    }

    hideOutcomeFeedback() {
      return this.outcomeView.hideFeedback();
    }
  }

  return {
    DefaultCopy,
    MediaTypes,
    Renderer,
    extractClueMedia,
    extractClueContent,
    getMediaType,
  };
}));
