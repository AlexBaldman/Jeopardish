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
    emptyCategory: 'Host Advisory',
    loadingBank: 'Loading question bank...',
    loadingQuestions: 'Loading questions...',
    fallbackClue: 'There was a problem loading a normal clue. Showing fallback clue.',
    newClue: 'New clue loaded. Enter your answer and press Lock It In.',
    correctMessage: 'Correct! Your streak is now',
    correctAnswerStreak: 'Correct answer streak is now',
    incorrectMessage: 'Incorrect! The correct answer was:',
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
    }

    bindDom() {
      this.dom.checkButton = this.document.getElementById('checkButton');
      this.dom.answerButton = this.document.getElementById('answerButton');
      this.dom.questionButton = this.document.getElementById('questionButton');
      this.dom.userInput = this.document.getElementById('inputbox');
      this.dom.categoryBox = this.document.getElementById('categoryBox');
      this.dom.statusMessage = this.document.getElementById('statusMessage');
      this.dom.questionBox = this.document.getElementById('questionBox');
      this.dom.clueText = this.document.getElementById('clueText');
      this.dom.clueMedia = this.document.getElementById('clueMedia');
      this.dom.answerBox = this.document.getElementById('answerBox');
      this.dom.currentStreak = this.document.getElementById('currentStreak');
      this.dom.bestStreak = this.document.getElementById('bestStreak');
      this.dom.score = this.document.getElementById('score');
      this.dom.hamburgerMenu = this.document.getElementById('hamburgerMenu');
      this.dom.navMenu = this.document.getElementById('navMenu');
      this.dom.hostImage = this.document.getElementById('hostImage');
      this.dom.hostPrevButton = this.document.getElementById('hostPrevButton');
      this.dom.hostNextButton = this.document.getElementById('hostNextButton');
      this.dom.hostSkinLabel = this.document.getElementById('hostSkinLabel');
      this.dom.themeToggle = this.document.getElementById('themeToggle');
      this.dom.themeToggleLabel = this.document.getElementById('themeToggleLabel');
      this.dom.languageToggle = this.document.getElementById('languageToggle');
      this.dom.languageToggleLabel = this.document.getElementById('languageToggleLabel');
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
      onPreviousHostSkin = () => {},
      onNextHostSkin = () => {},
    }) {
      this.dom.hamburgerMenu.addEventListener('click', () => {
        this.dom.navMenu.classList.toggle('active');
      });

      this.dom.answerButton.addEventListener('click', onToggleAnswer);
      this.dom.questionButton.addEventListener('click', onNewQuestion);
      this.dom.checkButton.addEventListener('click', onCheckAnswer);
      this.dom.themeToggle?.addEventListener('click', onToggleTheme);
      this.dom.languageToggle?.addEventListener('click', onToggleLanguage);
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

    setControlsEnabled(enabled) {
      this.dom.checkButton.disabled = !enabled;
      this.dom.answerButton.disabled = !enabled;
    }

    setCategory(category, value) {
      this.dom.categoryBox.replaceChildren?.();

      const categoryLine = this.document.createElement('h2');
      categoryLine.className = 'clue-category';
      categoryLine.textContent = category;

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
      caption.textContent = isCurrentBill ? 'TRIVIA RESERVE NOTE' : 'QUESTIONABLE TENDER';

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
      const parsed = extractClueContent(clue?.question, this.document);
      const deduped = [...parsed.media];
      const urls = new Set(deduped.map((item) => item.url));

      getStructuredMedia(clue).forEach((item) => {
        if (!urls.has(item.url)) {
          urls.add(item.url);
          deduped.push(item);
        }
      });

      this.setQuestionText(parsed.text || 'No question available.');
      this.renderMedia(deduped);
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
    }

    renderHost(host, expression = 'neutral', visual = null, skin = null) {
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
      this.dom.hostImage.dataset.skinId = skin?.id || '';
      if (this.dom.hostSkinLabel) {
        this.setText(this.dom.hostSkinLabel, skin?.label || host.displayName || 'Host');
      }
    }

    showLoading() {
      this.setControlsEnabled(false);
      this.setStatus(this.copy.loadingBank);
      this.clearMedia();
      this.setQuestionText(this.copy.loadingQuestions);
    }

    displayErrorMessage(message) {
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
      this.setCategory(
        String(clue.category || 'Unknown Category').toUpperCase(),
        `$${clueValue}`,
      );
      this.renderClueContent(clue);
      this.setText(this.dom.answerBox, clue.answer || 'No answer available.');
      this.setStatus(this.copy.newClue);
      this.toggleAnswer(false);
      this.setControlsEnabled(true);
      this.clearUserAnswer();
      this.focusUserAnswer();
    }

    displayCorrectAnswerMessage(currentStreak) {
      this.setText(this.dom.categoryBox, '');
      this.clearMedia();
      this.setQuestionText(`${this.copy.correctMessage}: ${currentStreak}`);
      this.setText(this.dom.answerBox, `${this.copy.correctAnswerStreak} ${currentStreak}`);
      this.toggleAnswer(true);
    }

    displayIncorrectAnswerMessage(correctAnswer) {
      this.setText(this.dom.categoryBox, '');
      this.clearMedia();
      this.setQuestionText(`${this.copy.incorrectMessage} ${correctAnswer}`);
      this.setText(this.dom.answerBox, this.copy.streakReset);
      this.setStatus(this.copy.incorrectStatus);
      this.toggleAnswer(true);
    }
  }

  return {
    DefaultCopy,
    MediaTypes,
    Renderer,
    extractClueContent,
    getMediaType,
  };
}));
