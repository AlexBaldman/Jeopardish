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
    officialTender: 'TRIVIA RESERVE NOTE',
    questionableTender: 'QUESTIONABLE TENDER',
    currentStreak: 'Current Streak',
    bestStreak: 'Best Streak',
    score: 'Score',
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
  });

  const MediaTypes = Object.freeze({
    IMAGE: 'image',
    AUDIO: 'audio',
    VIDEO: 'video',
    EXTERNAL: 'external',
  });
  const CURRENT_US_BILL_VALUES = new Set([1, 2, 5, 10, 20, 50, 100]);

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
    constructor({ documentRef = globalThis.document, random = Math.random } = {}) {
      if (!documentRef) {
        throw new Error('Renderer requires a document.');
      }

      this.document = documentRef;
      this.random = random;
      this.dom = {};
      this.copy = { ...DefaultCopy };
      this.mediaItems = [];
      this.lastMediaTrigger = null;
      this.onMediaFailure = () => {};
    }

    bindDom() {
      this.dom.checkButton = this.document.getElementById('checkButton');
      this.dom.answerButton = this.document.getElementById('answerButton');
      this.dom.questionButton = this.document.getElementById('questionButton');
      this.dom.gameContainer = this.document.getElementById('gameContainer');
      this.dom.userInput = this.document.getElementById('inputbox');
      this.dom.categoryBox = this.document.getElementById('categoryBox');
      this.dom.statusMessage = this.document.getElementById('statusMessage');
      this.dom.questionBox = this.document.getElementById('questionBox');
      this.dom.clueText = this.document.getElementById('clueText');
      this.dom.clueOriginal = this.document.getElementById('clueOriginal');
      this.dom.clueMedia = this.document.getElementById('clueMedia');
      this.dom.answerBox = this.document.getElementById('answerBox');
      this.dom.currentStreak = this.document.getElementById('currentStreak');
      this.dom.bestStreak = this.document.getElementById('bestStreak');
      this.dom.score = this.document.getElementById('score');
      this.dom.hudScore = this.document.getElementById('hudScore');
      this.dom.hudStreak = this.document.getElementById('hudStreak');
      this.dom.hudScoreLabel = this.document.getElementById('hudScoreLabel');
      this.dom.hudStreakLabel = this.document.getElementById('hudStreakLabel');
      this.dom.hamburgerMenu = this.document.getElementById('hamburgerMenu');
      this.dom.navMenu = this.document.getElementById('navMenu');
      this.dom.hostStage = this.document.getElementById('hostStage');
      this.dom.hostImage = this.document.getElementById('hostImage');
      this.dom.hostPrevButton = this.document.getElementById('hostPrevButton');
      this.dom.hostNextButton = this.document.getElementById('hostNextButton');
      this.dom.hostSkinLabel = this.document.getElementById('hostSkinLabel');
      this.dom.hostCue = this.document.getElementById('hostCue');
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
      onMediaFailure = () => {},
    }) {
      this.onMediaFailure = onMediaFailure;
      this.dom.hamburgerMenu.addEventListener('click', () => {
        this.dom.navMenu.classList.toggle('active');
      });

      this.dom.answerButton.addEventListener('click', onToggleAnswer);
      this.dom.questionButton.addEventListener('click', onNewQuestion);
      this.dom.checkButton.addEventListener('click', onCheckAnswer);
      this.dom.themeToggle?.addEventListener('click', onToggleTheme);
      this.dom.languageToggle?.addEventListener('click', onToggleLanguage);
      this.dom.soundToggle?.addEventListener('click', onToggleSound);
      this.dom.hostPrevButton?.addEventListener('click', onPreviousHostSkin);
      this.dom.hostNextButton?.addEventListener('click', onNextHostSkin);
      this.dom.mediaModalClose?.addEventListener('click', () => this.closeMedia());
      this.dom.mediaModalBackdrop?.addEventListener('click', () => this.closeMedia());
      this.dom.userInput.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') {
          onCheckAnswer();
        }
      });
      this.document.addEventListener?.('keydown', (event) => {
        if (event.key === 'Escape' && this.dom.mediaModal && !this.dom.mediaModal.hidden) {
          this.closeMedia();
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

      this.decorateControlButton(this.dom.questionButton, this.copy.questionButton, 'Q');
      this.decorateControlButton(this.dom.answerButton, this.copy.answerButton, 'A');
      this.decorateControlButton(this.dom.checkButton, this.copy.checkButton, 'Enter');
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
      const numericAmount = Number(amount.replace(/[^0-9.]/g, ''));
      const isCurrentBill = CURRENT_US_BILL_VALUES.has(numericAmount);
      const valueLine = this.document.createElement('p');
      valueLine.className = `clue-value clue-value-${isCurrentBill ? 'officialish' : 'questionable'}`;
      valueLine.setAttribute(
        'aria-label',
        `${amount} clue value. ${isCurrentBill ? 'Trivia Reserve note.' : 'Questionable tender.'}`,
      );

      const leftAmount = this.document.createElement('span');
      leftAmount.className = 'clue-value-amount clue-value-amount-left';
      leftAmount.textContent = amount;

      const rightAmount = this.document.createElement('span');
      rightAmount.className = 'clue-value-amount clue-value-amount-right';
      rightAmount.setAttribute('aria-hidden', 'true');
      rightAmount.textContent = amount;

      const caption = this.document.createElement('span');
      caption.className = 'clue-value-caption';
      caption.textContent = isCurrentBill ? this.copy.officialTender : this.copy.questionableTender;

      valueLine.append(leftAmount, rightAmount, caption);

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
      this.dom.mediaModalClose?.focus?.();
    }

    closeMedia(restoreFocus = true) {
      if (!this.dom.mediaModal) {
        return;
      }

      this.dom.mediaModal.hidden = true;
      this.dom.mediaModal.setAttribute('aria-hidden', 'true');
      this.dom.mediaModalBody?.replaceChildren?.();
      this.document.body?.classList?.remove('modal-open');
      if (restoreFocus) {
        this.lastMediaTrigger?.focus?.();
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
      this.setText(this.dom.currentStreak, `${this.copy.currentStreak}: ${gameState.currentStreak}`);
      this.setText(this.dom.bestStreak, `${this.copy.bestStreak}: ${gameState.bestStreak}`);
      this.setText(this.dom.score, `${this.copy.score}: $${gameState.score}`);
      if (this.dom.hudScore) {
        this.setText(this.dom.hudScore, `$${gameState.score}`);
      }
      if (this.dom.hudStreak) {
        this.setText(this.dom.hudStreak, `x${gameState.currentStreak}`);
      }
      if (this.dom.hudScoreLabel) {
        this.setText(this.dom.hudScoreLabel, this.copy.score);
      }
      if (this.dom.hudStreakLabel) {
        this.setText(this.dom.hudStreakLabel, this.copy.currentStreak);
      }
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
      if (this.dom.hostCue) {
        this.setText(this.dom.hostCue, performance?.cue || activeState);
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
