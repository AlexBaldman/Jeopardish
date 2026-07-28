(function initClueView(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYClueView = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function clueViewFactory() {
  'use strict';

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
    if (['png', 'gif', 'svg', 'webp', 'avif', 'bmp'].includes(extension)
      || extension.includes('jpg') || extension.includes('jpeg')) {
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
    if (!isSafeMediaUrl(safeUrl) || seen.has(safeUrl)) return;

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

  class ClueView {
    constructor({
      documentRef,
      dom,
      getCopy,
      setText,
      setGameMoment,
      setControlsEnabled,
      setStatus,
      hideOutcomeFeedback,
      decorateControlButton,
      toggleAnswer,
      clearUserAnswer,
      focusUserAnswer,
      closeMedia,
      openMedia,
      reportMediaFailure,
    } = {}) {
      if (!documentRef || !dom || typeof getCopy !== 'function' || typeof setText !== 'function') {
        throw new Error('ClueView requires document, DOM, copy, and text adapters.');
      }
      Object.assign(this, {
        document: documentRef,
        dom,
        getCopy,
        setText,
        setGameMoment,
        setControlsEnabled,
        setStatus,
        hideOutcomeFeedback,
        decorateControlButton,
        toggleAnswer,
        clearUserAnswer,
        focusUserAnswer,
        closeMedia,
        openMedia,
        reportMediaFailure,
      });
      this.mediaItems = [];
    }

    setTranslationState(status = 'original', provider = '') {
      if (!this.dom.translationState) return;
      const copy = this.getCopy();
      const labels = {
        'on-device': copy.translationOnDevice,
        network: copy.translationNetwork,
        cache: copy.translationCache,
        fallback: copy.translationFallback,
        loading: copy.translatingClue,
      };
      this.dom.translationState.dataset.status = status;
      this.dom.translationState.hidden = status === 'original';
      if (this.dom.translationStateLabel) {
        this.setText(this.dom.translationStateLabel, labels[provider] || labels[status] || 'PT');
      }
    }

    showTranslationLoading() {
      const copy = this.getCopy();
      this.setGameMoment('loading');
      this.setControlsEnabled(false);
      this.setTranslationState('loading');
      this.setText(this.dom.categoryBox, 'TRADUZINDO');
      this.clearMedia();
      this.setQuestionText(copy.translatingClue);
      if (this.dom.clueOriginal) this.dom.clueOriginal.hidden = true;
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
      if (!this.dom.clueMedia) return;

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
          thumbnail.addEventListener(
            'error',
            () => this.reportMediaFailure(item, 'thumbnail-error'),
          );
          button.append(thumbnail);
        } else {
          const icon = this.document.createElement('span');
          icon.className = 'media-preview-icon';
          icon.textContent = item.type === MediaTypes.AUDIO
            ? 'AUDIO' : item.type === MediaTypes.VIDEO ? 'PLAY' : 'LINK';
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

    getMediaItem(index) {
      return this.mediaItems[index] || null;
    }

    renderClue(clue, clueValue) {
      const copy = this.getCopy();
      this.setGameMoment('clue');
      if (this.dom.reviewQueueButton) this.dom.reviewQueueButton.hidden = true;
      this.setText(this.dom.reviewQueueStatus, '');
      this.decorateControlButton(this.dom.questionButton, copy.questionButton, 'Q');
      this.setCategory(
        String(clue.category || 'Unknown Category').toUpperCase(),
        `$${clueValue}`,
        String(clue?.translation?.original?.category || '').toUpperCase(),
      );
      this.renderClueContent(clue);
      this.hideOutcomeFeedback();
      this.setText(this.dom.answerBox, clue.answer || 'No answer available.');
      this.setStatus(copy.newClue);
      this.toggleAnswer(false);
      this.setTranslationState(
        clue?.translation?.provider ? 'translated' : clue?.translationFallback ? 'fallback' : 'original',
        clue?.translation?.provider || (clue?.translationFallback ? 'fallback' : ''),
      );
      this.setControlsEnabled(true);
      this.clearUserAnswer();
      this.focusUserAnswer();
    }
  }

  return {
    ClueView,
    MediaTypes,
    extractClueContent,
    extractClueMedia,
    getMediaType,
  };
}));
