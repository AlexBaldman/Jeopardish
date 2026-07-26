(function initTranslationService(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYTranslation = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function translationServiceFactory() {
  'use strict';

  const DEFAULT_ENDPOINT = 'https://api.mymemory.translated.net/get';
  const CACHE_KEY = 'jeoparody.translationCache.v1';
  const MAX_CACHE_ENTRIES = 240;
  const MAX_REMOTE_BYTES = 450;
  const DEFAULT_TIMEOUT_MS = 8000;

  function createAbortError() {
    const error = new Error('Translation was aborted.');
    error.name = 'AbortError';
    return error;
  }

  function createTimeoutError() {
    const error = new Error('Translation provider timed out.');
    error.name = 'TimeoutError';
    return error;
  }

  function withTimeout(promise, {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    signal,
    onTimeout = () => {},
  } = {}) {
    if (signal?.aborted) return Promise.reject(createAbortError());
    return new Promise((resolve, reject) => {
      let settled = false;
      const finish = (callback, value) => {
        if (settled) return;
        settled = true;
        globalThis.clearTimeout(timer);
        signal?.removeEventListener?.('abort', handleAbort);
        callback(value);
      };
      const handleAbort = () => finish(reject, createAbortError());
      const timer = globalThis.setTimeout(() => {
        onTimeout();
        finish(reject, createTimeoutError());
      }, timeoutMs);
      signal?.addEventListener?.('abort', handleAbort, { once: true });
      Promise.resolve(promise).then(
        (value) => finish(resolve, value),
        (error) => finish(reject, error),
      );
    });
  }

  function normalizeLanguage(language) {
    return String(language || 'en').toLowerCase().startsWith('pt') ? 'pt-BR' : 'en';
  }

  function normalizeText(text) {
    return String(text || '').replace(/\s+/g, ' ').trim();
  }

  function decodeHtmlEntities(text) {
    const named = {
      amp: '&', apos: "'", gt: '>', lt: '<', nbsp: ' ', quot: '"',
    };
    return String(text || '').replace(/&(#x[\da-f]+|#\d+|[a-z]+);/gi, (entity, code) => {
      if (code[0] === '#') {
        const numeric = code[1].toLowerCase() === 'x'
          ? Number.parseInt(code.slice(2), 16)
          : Number.parseInt(code.slice(1), 10);
        return Number.isFinite(numeric) ? String.fromCodePoint(numeric) : entity;
      }
      return named[code.toLowerCase()] ?? entity;
    });
  }

  function splitByByteLength(text, maxBytes = MAX_REMOTE_BYTES) {
    const encoder = new TextEncoder();
    const words = normalizeText(text).split(' ');
    const chunks = [];
    let current = '';
    words.forEach((word) => {
      const candidate = current ? `${current} ${word}` : word;
      if (current && encoder.encode(candidate).length > maxBytes) {
        chunks.push(current);
        current = word;
      } else {
        current = candidate;
      }
    });
    if (current) {
      chunks.push(current);
    }
    return chunks;
  }

  class TranslationService {
    constructor({
      fetcher = (...args) => globalThis.fetch(...args),
      TranslatorClass = globalThis.Translator,
      storage = globalThis.localStorage,
      endpoint = DEFAULT_ENDPOINT,
      timeoutMs = DEFAULT_TIMEOUT_MS,
    } = {}) {
      this.fetcher = fetcher;
      this.TranslatorClass = TranslatorClass;
      this.storage = storage;
      this.endpoint = endpoint;
      this.timeoutMs = timeoutMs;
      this.cache = new Map();
      this.translators = new Map();
      this.loadCache();
    }

    loadCache() {
      try {
        const entries = JSON.parse(this.storage?.getItem?.(CACHE_KEY) || '[]');
        if (Array.isArray(entries)) {
          entries.slice(-MAX_CACHE_ENTRIES).forEach(([key, value]) => this.cache.set(key, value));
        }
      } catch {
        this.cache.clear();
      }
    }

    persistCache() {
      try {
        const entries = [...this.cache.entries()].slice(-MAX_CACHE_ENTRIES);
        this.storage?.setItem?.(CACHE_KEY, JSON.stringify(entries));
      } catch {
        // Translation remains usable when storage is blocked or full.
      }
    }

    getCacheKey(text, sourceLanguage, targetLanguage) {
      return `${sourceLanguage}>${targetLanguage}:${normalizeText(text)}`;
    }

    async getBrowserTranslator(sourceLanguage, targetLanguage) {
      if (!this.TranslatorClass?.create) {
        return null;
      }
      const key = `${sourceLanguage}>${targetLanguage}`;
      if (this.translators.has(key)) {
        return this.translators.get(key);
      }

      const translatorPromise = (async () => {
        const options = {
          sourceLanguage: sourceLanguage.split('-')[0],
          targetLanguage: targetLanguage.split('-')[0],
        };
        if (this.TranslatorClass.availability) {
          const availability = await this.TranslatorClass.availability(options);
          if (availability === 'unavailable') {
            return null;
          }
        }

        return this.TranslatorClass.create(options);
      })();
      this.translators.set(key, translatorPromise);
      try {
        return await translatorPromise;
      } catch (error) {
        this.translators.delete(key);
        throw error;
      }
    }

    async translateWithBrowser(text, sourceLanguage, targetLanguage) {
      const translator = await this.getBrowserTranslator(sourceLanguage, targetLanguage);
      if (!translator?.translate) {
        return null;
      }
      const translatedText = normalizeText(await translator.translate(text));
      return translatedText ? { translatedText, provider: 'on-device' } : null;
    }

    async translateWithRemote(text, sourceLanguage, targetLanguage, signal) {
      if (!this.fetcher) {
        return null;
      }
      const translatedChunks = [];
      for (const chunk of splitByByteLength(text)) {
        const query = new URLSearchParams({
          q: chunk,
          langpair: `${sourceLanguage}|${targetLanguage}`,
        });
        const response = await this.fetcher(`${this.endpoint}?${query}`, { signal });
        if (!response.ok) {
          throw new Error(`Translation request failed with ${response.status}.`);
        }
        const payload = await response.json();
        translatedChunks.push(decodeHtmlEntities(payload?.responseData?.translatedText));
      }
      const translatedText = normalizeText(translatedChunks.join(' '));
      return translatedText ? { translatedText, provider: 'network' } : null;
    }

    async translateText(text, {
      sourceLanguage = 'en',
      targetLanguage = 'pt-BR',
      signal,
    } = {}) {
      const normalizedText = normalizeText(text);
      const source = normalizeLanguage(sourceLanguage);
      const target = normalizeLanguage(targetLanguage);
      if (!normalizedText || source === target) {
        return { translatedText: normalizedText, provider: 'original' };
      }

      const cacheKey = this.getCacheKey(normalizedText, source, target);
      const cached = this.cache.get(cacheKey);
      if (cached) {
        return { translatedText: cached, provider: 'cache' };
      }

      const localController = typeof globalThis.AbortController === 'function'
        ? new globalThis.AbortController()
        : null;
      const handleAbort = () => localController?.abort();
      signal?.addEventListener?.('abort', handleAbort, { once: true });
      const translation = (async () => {
        let providerResult = null;
        try {
          providerResult = await this.translateWithBrowser(normalizedText, source, target);
        } catch {
          providerResult = null;
        }
        if (!providerResult) {
          providerResult = await this.translateWithRemote(
            normalizedText,
            source,
            target,
            localController?.signal || signal,
          );
        }
        return providerResult;
      })();
      let result;
      try {
        result = await withTimeout(translation, {
          timeoutMs: this.timeoutMs,
          signal,
          onTimeout: () => localController?.abort(),
        });
      } finally {
        signal?.removeEventListener?.('abort', handleAbort);
      }
      if (!result?.translatedText) {
        throw new Error('No translation provider is available.');
      }

      this.cache.set(cacheKey, result.translatedText);
      this.persistCache();
      return result;
    }

    async translateClue(clue, { questionText, signal } = {}) {
      const source = {
        category: normalizeText(clue?.category),
        question: normalizeText(questionText ?? clue?.question),
        answer: normalizeText(clue?.answer),
      };
      const [category, question, answer] = await Promise.all([
        this.translateText(source.category, { signal }),
        this.translateText(source.question, { signal }),
        this.translateText(source.answer, { signal }),
      ]);
      const providers = [category.provider, question.provider, answer.provider];

      return {
        ...clue,
        category: category.translatedText,
        question: question.translatedText,
        answer: answer.translatedText,
        translation: {
          language: 'pt-BR',
          provider: providers.includes('network')
            ? 'network'
            : providers.includes('on-device') ? 'on-device' : 'cache',
          original: source,
        },
      };
    }
  }

  return {
    CACHE_KEY,
    DEFAULT_TIMEOUT_MS,
    DEFAULT_ENDPOINT,
    MAX_REMOTE_BYTES,
    TranslationService,
    createTimeoutError,
    decodeHtmlEntities,
    normalizeLanguage,
    normalizeText,
    splitByByteLength,
    withTimeout,
  };
}));
