(function initRenderer(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../ui/focus-scope.js'));
  } else {
    root.JeopardishRenderer = factory(root.JeoPARODYFocus);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function rendererFactory(focusModule) {
  'use strict';

  if (!focusModule?.FocusScope) {
    throw new Error('JeopardishRenderer requires JeoPARODYFocus.');
  }

  const DefaultCopy = Object.freeze({
    lang: 'en',
    questionButton: 'New Clue',
    answerButton: 'Reveal Answer',
    checkButton: 'Lock It In',
    inputPlaceholder: 'Type your response',
    soundOn: 'Sound',
    soundOff: 'Muted',
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
    streakReset: 'STREAK RESET!',
    incorrectStatus: 'Incorrect. Load a new clue to continue.',
    keepTyping: 'Type an answer to keep the dignity damage contained.',
    answerFieldLabel: 'Your response',
    checkButtonKicker: 'Confirm',
    questionButtonKicker: 'Board',
    answerButtonKicker: 'Clue',
    askHost: 'Ask Xander',
    returnToClue: 'Return to clue',
  });

  const MediaTypes = Object.freeze({
    IMAGE: 'image',
    AUDIO: 'audio',
    VIDEO: 'video',
    EXTERNAL: 'external',
  });
  function normaliseText(text) {
    return String(text || '')
      .replace(/\r/g, '')
      .replace(/[ \t]*\n[ \t]*/g, '\n')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  function stripTags(markup) {
    return String(markup || '')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .replace(/&amp;/gi, '&')
      .replace(/&quot;/gi, '"')
      .replace(/&#39;|&apos;/gi, "'")
      .replace(/&lt;/gi, '<')
      .replace(/&gt;/gi, '>');
  }

  function getMediaType(url, declaredType = '') {
    const hint = String(declaredType || '').toLowerCase();
    if (hint.includes('image')) return MediaTypes.IMAGE;
    if (hint.includes('audio')) return MediaTypes.AUDIO;
    if (hint.includes('video')) return MediaTypes.VIDEO;

    const extensionMatch = String(url || '').toLowerCase().match(/\.([a-z0-9]+)(?:[?#]|$)/);
    const extension = extensionMatch?.[1] || '';
    if (['png', 'gif', 'svg', 'webp', 'avif', 'bmp'].includes(extension) || extension.includes('jpg') || extension.includes('jpeg')) {
      return MediaTypes.IMAGE;
    }
    if (['mp3', 'wav', 'ogg', 'oga', 'm4a', 'aac', 'flac'].includes(extension)) {
      return MediaTypes.AUDIO;
    }
    if (['mp4', 'mov', 'm4v', 'webm', 'ogv', 'wmv'].includes(extension)) {
      return MediaTypes.VIDEO;
    }
    return MediaTypes.EXTERNAL;
  }

  function isSafeMediaUrl(url) {
    const value = String(url || '').trim();
    return value.length > 0 && !/^(?:javascript|data|vbscript):/i.test(value);
  }

  function getMediaLabel(type, providedLabel, position) {
    const rawLabel = normaliseText(stripTags(providedLabel));
    if (rawLabel && !/^(?:here|this|photo|image|audio|video|listen|watch|clip)$/i.test(rawLabel)) {
      return rawLabel;
    }

    return `${type.charAt(0).toUpperCase()}${type.slice(1)} clue ${position}`;
  }

  function addMediaItem(items, seen, { url, type, label } = {}) {
    const safeUrl = String(url || '').trim();
    if (!isSafeMediaUrl(safeUrl) || seen.has(safeUrl)) {
      return;
    }

    const mediaType = getMediaType(safeUrl, type);
    seen.add(safeUrl);
    items.push({
      url: safeUrl,
      type: mediaType,
      label: getMediaLabel(mediaType, label, items.length + 1),
      isLegacyVideo: /\.wmv(?:[?#]|$)/i.test(safeUrl),
    });
  }

  function extractClueContent(question, documentRef) {
    const markup = String(question || '');
    const media = [];
    const seen = new Set();
    const template = documentRef?.createElement?.('template');

    if (template?.content?.querySelectorAll) {
      template.innerHTML = markup;
      const content = template.content;

      content.querySelectorAll('br').forEach((breakNode) => {
        breakNode.replaceWith(documentRef.createTextNode('\n'));
      });
      content.querySelectorAll('a[href]').forEach((link) => {
        addMediaItem(media, seen, {
          url: link.getAttribute('href'),
          label: link.textContent,
        });
      });
      content.querySelectorAll('img[src], audio[src], video[src], source[src]').forEach((node) => {
        addMediaItem(media, seen, {
          url: node.getAttribute('src'),
          type: node.tagName,
          label: node.getAttribute('alt') || node.getAttribute('title'),
        });
      });

      return {
        text: normaliseText(content.textContent),
        media,
      };
    }

    const textWithLinkLabels = markup.replace(
      /<a\b[^>]*\bhref=(["'])(.*?)\1[^>]*>([\s\S]*?)<\/a>/gi,
      (match, quote, url, label) => {
        addMediaItem(media, seen, { url, label });
        return stripTags(label);
      },
    );

    return {
      text: normaliseText(stripTags(textWithLinkLabels)),
      media,
    };
  }

  function getStructuredMedia(clue) {
    const media = [];
    const seen = new Set();
    const fields = [
      ['image', MediaTypes.IMAGE],
      ['imageUrl', MediaTypes.IMAGE],
      ['images', MediaTypes.IMAGE],
      ['audio', MediaTypes.AUDIO],
      ['audioUrl', MediaTypes.AUDIO],
      ['audios', MediaTypes.AUDIO],
      ['video', MediaTypes.VIDEO],
      ['videoUrl', MediaTypes.VIDEO],
      ['videos', MediaTypes.VIDEO],
      ['media', ''],
      ['mediaUrl', ''],
      ['mediaUrls', ''],
    ];

    fields.forEach(([field, type]) => {
      const values = Array.isArray(clue?.[field]) ? clue[field] : [clue?.[field]];
      values.forEach((value) => {
        if (typeof value === 'string') {
          addMediaItem(media, seen, { url: value, type });
        } else if (value && typeof value === 'object') {
          addMediaItem(media, seen, {
            url: value.url || value.src || value.href,
            type: value.type || type,
            label: value.label || value.title || value.alt,
          });
        }
      });
    });

    return media;
  }

  function extractClueMedia(clue, documentRef) {
    const parsed = extractClueContent(clue?.question, documentRef);
    const media = [...parsed.media];
    const urls = new Set(media.map((item) => item.url));
    getStructuredMedia(clue).forEach((item) => {
      if (!urls.has(item.url)) {
        urls.add(item.url);
        media.push(item);
      }
    });
    return { text: parsed.text, media };
  }

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
      this.mediaItems = [];
      this.lastMediaTrigger = null;
      this.onMediaFailure = () => {};
      this.lastScore = null;
      this.lastStreak = null;
      this.lastBestStreak = null;
      this.lastEpisodeValue = null;
      this.scoreDrawerTimer = null;
      this.onExitStudy = () => {};
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
      this.dom.studyPanel = this.document.getElementById('studyPanel');
      this.dom.studyClose = this.document.getElementById('studyClose');
      this.dom.studyResume = this.document.getElementById('studyResume');
      this.dom.studyCategory = this.document.getElementById('studyCategory');
      this.dom.studyQuestion = this.document.getElementById('studyQuestion');
      this.dom.studyAnswer = this.document.getElementById('studyAnswer');
      this.dom.studyGrounding = this.document.getElementById('studyGrounding');
      this.dom.studyActions = this.document.getElementById('studyActions');
      this.dom.studyResponse = this.document.getElementById('studyResponse');
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
      onPreviousHostSkin = () => {},
      onNextHostSkin = () => {},
      onPreviousDialogueStyle = () => {},
      onNextDialogueStyle = () => {},
      onCycleScene = () => {},
      onEnterStudy = () => {},
      onStudyAction = () => {},
      onExitStudy = () => {},
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
      this.dom.hostPrevButton?.addEventListener('click', onPreviousHostSkin);
      this.dom.hostNextButton?.addEventListener('click', onNextHostSkin);
      this.dom.dialogueStylePrev?.addEventListener('click', onPreviousDialogueStyle);
      this.dom.dialogueStyleNext?.addEventListener('click', onNextDialogueStyle);
      this.dom.deepDiveButton?.addEventListener('click', onEnterStudy);
      this.dom.studyClose?.addEventListener('click', onExitStudy);
      this.dom.studyResume?.addEventListener('click', onExitStudy);
      this.dom.studyActions?.addEventListener('click', (event) => {
        const action = event.target?.closest?.('[data-study-action]');
        if (action) onStudyAction(action.dataset.studyAction);
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
      el.textContent = text;
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
      this.setText(this.dom.studyCategory, clue.category);
      this.setText(this.dom.studyQuestion, clue.question);
      this.setText(this.dom.studyAnswer, clue.answer);
      this.setText(this.dom.studyGrounding, packet.grounding === 'reviewed' ? 'Reviewed sources attached' : 'Archive text only');
      this.setText(this.dom.studyResponse, clue.locale === 'pt-BR'
        ? 'Escolha um caminho. Continuarei preso aos fatos conhecidos, uma restrição que a televisão tradicionalmente considera opcional.'
        : 'Pick a direction. I will remain tethered to the known facts, a restriction television has traditionally considered optional.');
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

    setTranslationState(status = 'original', provider = '') {
      if (!this.dom.translationState) {
        return;
      }
      const labels = {
        'on-device': this.copy.translationOnDevice,
        network: this.copy.translationNetwork,
        cache: this.copy.translationCache,
        fallback: this.copy.translationFallback,
        loading: this.copy.translatingClue,
      };
      this.dom.translationState.dataset.status = status;
      this.dom.translationState.hidden = status === 'original';
      if (this.dom.translationStateLabel) {
        this.setText(this.dom.translationStateLabel, labels[provider] || labels[status] || 'PT');
      }
    }

    showTranslationLoading() {
      this.setGameMoment('loading');
      this.setControlsEnabled(false);
      this.setTranslationState('loading');
      this.setText(this.dom.categoryBox, 'TRADUZINDO');
      this.clearMedia();
      this.setQuestionText(this.copy.translatingClue);
      if (this.dom.clueOriginal) {
        this.dom.clueOriginal.hidden = true;
      }
    }

    setCategory(category, value, originalCategory = '') {
      this.dom.categoryBox.replaceChildren?.();

      const categoryLine = this.document.createElement('h2');
      categoryLine.className = 'clue-category';
      const categoryPrimary = this.document.createElement('span');
      categoryPrimary.className = 'category-primary';
      categoryPrimary.textContent = category;
      categoryLine.append(categoryPrimary);

      if (originalCategory && originalCategory !== category) {
        const originalLine = this.document.createElement('span');
        originalLine.className = 'category-original';
        originalLine.lang = 'en';
        originalLine.textContent = `EN · ${originalCategory}`;
        categoryLine.append(originalLine);
      }

      const amount = String(value || '$0').startsWith('$') ? String(value || '$0') : `$${value}`;
      const valueLine = this.document.createElement('p');
      valueLine.className = 'clue-value';
      valueLine.setAttribute('aria-label', `${amount} clue value.`);

      const amountText = this.document.createElement('span');
      amountText.className = 'clue-value-amount';
      amountText.textContent = amount;
      valueLine.append(amountText);

      this.dom.categoryBox.append(categoryLine, valueLine);
    }

    setQuestionText(text) {
      this.setText(this.dom.clueText || this.dom.questionBox, text);
    }

    clearMedia() {
      this.mediaItems = [];
      this.dom.clueMedia?.replaceChildren?.();
      this.closeMedia(false);
    }

    renderMedia(items) {
      this.closeMedia(false);
      this.mediaItems = items;
      this.dom.clueMedia?.replaceChildren?.();
      if (!this.dom.clueMedia) {
        return;
      }

      items.forEach((item, index) => {
        const button = this.document.createElement('button');
        button.type = 'button';
        button.className = `media-preview media-preview-${item.type}`;
        button.setAttribute('aria-label', `Open ${item.type} clue: ${item.label}`);
        button.addEventListener('click', () => this.openMedia(index, button));

        if (item.type === MediaTypes.IMAGE) {
          const thumbnail = this.document.createElement('img');
          thumbnail.className = 'media-thumbnail';
          thumbnail.src = item.url;
          thumbnail.alt = '';
          thumbnail.loading = 'lazy';
          thumbnail.addEventListener('error', () => this.reportMediaFailure(item, 'thumbnail-error'));
          button.append(thumbnail);
        } else {
          const icon = this.document.createElement('span');
          icon.className = 'media-preview-icon';
          icon.textContent = item.type === MediaTypes.AUDIO ? 'AUDIO' : item.type === MediaTypes.VIDEO ? 'PLAY' : 'LINK';
          button.append(icon);
        }

        const label = this.document.createElement('span');
        label.className = 'media-preview-label';
        label.textContent = item.label;
        button.append(label);
        this.dom.clueMedia.append(button);
      });
    }

    renderClueContent(clue) {
      const parsed = extractClueMedia(clue, this.document);

      this.setQuestionText(parsed.text || 'No question available.');
      const originalQuestion = clue?.translation?.original?.question || '';
      if (this.dom.clueOriginal) {
        this.setText(this.dom.clueOriginal, originalQuestion ? `EN · ${originalQuestion}` : '');
        this.dom.clueOriginal.hidden = !originalQuestion || originalQuestion === parsed.text;
      }
      this.renderMedia(parsed.media);
    }

    reportMediaFailure(item, reason = 'runtime-error') {
      if (!item || item.failureReported) return;
      item.failureReported = true;
      this.onMediaFailure?.({ item, reason });
    }

    openMedia(index, trigger = null) {
      const item = this.mediaItems[index];
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
      this.setGameMoment('complete');
      this.setText(this.dom.categoryBox, this.copy.episodeComplete);
      this.clearMedia();
      this.setQuestionText(`$${progress.score} final score · ${progress.counts.correct} correct`);
      this.setText(
        this.dom.answerBox,
        `${progress.total} clues aired\n${progress.counts.incorrect} incorrect · ${progress.counts.revealed} revealed · ${progress.counts.skipped} skipped`,
      );
      this.toggleAnswer(true);
      this.dom.checkButton.disabled = true;
      this.dom.answerButton.disabled = true;
      this.dom.userInput.disabled = true;
      this.decorateControlButton(this.dom.questionButton, this.copy.replayEpisode, 'Q');
      this.dom.questionButton.disabled = false;
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
      this.dom.hostImage.alt = performance?.accessibleLabel
        ? `${host.displayName || 'Jeopardish host'}, ${performance.accessibleLabel}`
        : host.displayName || 'Jeopardish host';
      this.dom.hostImage.dataset.hostId = host.id || '';
      this.dom.hostImage.dataset.expression = activeState;
      this.dom.hostImage.dataset.skinId = activeSkin?.id || '';
      this.dom.hostImage.dataset.frame = performance?.frame || activeSkin?.frame || 'portrait';
      this.dom.hostImage.dataset.effect = performance?.effect || activeState;
      this.dom.hostImage.dataset.intensity = performance?.intensity || 'medium';
      if (this.dom.hostStage) {
        this.dom.hostStage.dataset.expression = activeState;
        this.dom.hostStage.dataset.frame = performance?.frame || activeSkin?.frame || 'portrait';
        this.dom.hostStage.dataset.effect = performance?.effect || activeState;
        this.dom.hostStage.dataset.intensity = performance?.intensity || 'medium';
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

    showLoading() {
      this.setGameMoment('loading');
      this.setControlsEnabled(false);
      this.setStatus(this.copy.loadingBank);
      this.clearMedia();
      this.setQuestionText(this.copy.loadingQuestions);
    }

    displayErrorMessage(message) {
      this.setGameMoment('error');
      this.setStatus(message);
      this.setText(this.dom.categoryBox, 'Error');
      this.clearMedia();
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
      this.setQuestionText(randomError.question);
      this.setText(this.dom.answerBox, randomError.answer);
      this.toggleAnswer(true);
      this.setControlsEnabled(true);
      return randomError;
    }

    renderClue(clue, clueValue) {
      this.setGameMoment('clue');
      this.decorateControlButton(this.dom.questionButton, this.copy.questionButton, 'Q');
      this.setCategory(
        String(clue.category || 'Unknown Category').toUpperCase(),
        `$${clueValue}`,
        String(clue?.translation?.original?.category || '').toUpperCase(),
      );
      this.renderClueContent(clue);
      this.setText(this.dom.answerBox, clue.answer || 'No answer available.');
      this.setStatus(this.copy.newClue);
      this.toggleAnswer(false);
      this.setTranslationState(
        clue?.translation?.provider ? 'translated' : clue?.translationFallback ? 'fallback' : 'original',
        clue?.translation?.provider || (clue?.translationFallback ? 'fallback' : ''),
      );
      this.setControlsEnabled(true);
      this.clearUserAnswer();
      this.focusUserAnswer();
    }

    displayCorrectAnswerMessage(result) {
      const currentStreak = typeof result === 'number' ? result : result?.currentStreak || 0;
      const scoreDelta = typeof result === 'number' ? 0 : result?.scoreDelta || 0;
      this.setGameMoment('correct');
      this.setText(this.dom.categoryBox, this.copy.correctKicker);
      this.clearMedia();
      this.setQuestionText(scoreDelta > 0 ? `${this.copy.correctMessage} +$${scoreDelta}` : this.copy.correctMessage);
      this.setText(this.dom.answerBox, `${this.copy.correctAnswerStreak}: ${currentStreak}`);
      this.toggleAnswer(true);
    }

    displayIncorrectAnswerMessage(correctAnswer) {
      this.setGameMoment('incorrect');
      this.setText(this.dom.categoryBox, this.copy.incorrectKicker);
      this.clearMedia();
      this.setQuestionText(this.copy.incorrectMessage);
      this.setText(this.dom.answerBox, `${this.copy.correctResponseLabel} ${correctAnswer}\n${this.copy.streakReset}`);
      this.setStatus(this.copy.incorrectStatus);
      this.toggleAnswer(true);
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
