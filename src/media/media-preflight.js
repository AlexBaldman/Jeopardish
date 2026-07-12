(function initMediaPreflight(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYMedia = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function mediaPreflightFactory() {
  'use strict';

  const DEFAULT_TIMEOUT_MS = 2600;
  const SUCCESS_TTL_MS = 60 * 60 * 1000;
  const FAILURE_TTL_MS = 5 * 60 * 1000;

  function createAbortError() {
    const error = new Error('Media preflight was aborted.');
    error.name = 'AbortError';
    return error;
  }

  function normalizeResult(result, fallbackReason = 'unavailable') {
    if (result === true) return { ok: true, reason: 'loaded' };
    if (result === false || !result) return { ok: false, reason: fallbackReason };
    return {
      ok: Boolean(result.ok),
      reason: String(result.reason || (result.ok ? 'loaded' : fallbackReason)),
    };
  }

  function resolveUrl(url, locationRef = globalThis.location) {
    try {
      return new URL(String(url || ''), locationRef?.href || 'http://localhost/').href;
    } catch {
      return '';
    }
  }

  function isMixedContent(url, locationRef = globalThis.location) {
    const resolved = resolveUrl(url, locationRef);
    return locationRef?.protocol === 'https:' && resolved.startsWith('http:');
  }

  function probeElementMedia(item, {
    documentRef = globalThis.document,
    ImageClass = globalThis.Image,
    locationRef = globalThis.location,
    signal,
  } = {}) {
    const url = resolveUrl(item?.url, locationRef);
    if (!url) {
      return Promise.resolve({ ok: false, reason: 'invalid-url' });
    }

    return new Promise((resolve, reject) => {
      let element = null;
      let settled = false;
      const finish = (result) => {
        if (settled) return;
        settled = true;
        signal?.removeEventListener?.('abort', onAbort);
        if (element) {
          element.onload = null;
          element.onerror = null;
          element.onloadedmetadata = null;
          element.oncanplay = null;
        }
        resolve(result);
      };
      const onAbort = () => {
        if (element) {
          element.src = '';
        }
        reject(createAbortError());
      };

      if (signal?.aborted) {
        reject(createAbortError());
        return;
      }
      signal?.addEventListener?.('abort', onAbort, { once: true });

      if (item.type === 'image' && ImageClass) {
        element = new ImageClass();
        element.onload = () => finish({
          ok: Number(element.naturalWidth || element.width || 1) > 0,
          reason: 'image-loaded',
        });
        element.onerror = () => finish({ ok: false, reason: 'image-error' });
        element.src = url;
        return;
      }

      if ((item.type === 'audio' || item.type === 'video') && documentRef?.createElement) {
        element = documentRef.createElement(item.type);
        element.preload = 'metadata';
        element.onloadedmetadata = () => finish({ ok: true, reason: `${item.type}-metadata` });
        element.oncanplay = () => finish({ ok: true, reason: `${item.type}-playable` });
        element.onerror = () => finish({ ok: false, reason: `${item.type}-error` });
        element.src = url;
        element.load?.();
        return;
      }

      finish({ ok: false, reason: 'unsupported-probe' });
    });
  }

  async function defaultProbe(item, options = {}) {
    if (item?.type !== 'external') {
      const elementResult = await probeElementMedia(item, options);
      if (elementResult.reason !== 'unsupported-probe') {
        return elementResult;
      }
    }

    const fetcher = options.fetcher || globalThis.fetch;
    if (!fetcher) {
      return { ok: false, reason: 'no-probe-available' };
    }
    const url = resolveUrl(item?.url, options.locationRef);
    try {
      const response = await fetcher(url, {
        method: 'GET',
        mode: 'no-cors',
        cache: 'force-cache',
        signal: options.signal,
      });
      return {
        ok: response?.type === 'opaque' || response?.ok,
        reason: response?.type === 'opaque' || response?.ok ? 'reachable' : `http-${response?.status || 0}`,
      };
    } catch (error) {
      if (error?.name === 'AbortError') throw error;
      return { ok: false, reason: 'network-error' };
    }
  }

  class MediaPreflight {
    constructor({
      eventBus = null,
      probe = defaultProbe,
      timeoutMs = DEFAULT_TIMEOUT_MS,
      successTtlMs = SUCCESS_TTL_MS,
      failureTtlMs = FAILURE_TTL_MS,
      now = Date.now,
      locationRef = globalThis.location,
      probeOptions = {},
    } = {}) {
      this.eventBus = eventBus;
      this.probe = probe;
      this.timeoutMs = timeoutMs;
      this.successTtlMs = successTtlMs;
      this.failureTtlMs = failureTtlMs;
      this.now = now;
      this.locationRef = locationRef;
      this.probeOptions = probeOptions;
      this.cache = new Map();
    }

    emit(type, payload) {
      return this.eventBus?.emit?.(type, payload, { source: 'MediaPreflight' });
    }

    getCached(url) {
      const cached = this.cache.get(url);
      if (!cached || cached.expiresAt <= this.now()) {
        this.cache.delete(url);
        return null;
      }
      return { ...cached.result, cached: true };
    }

    setCached(url, result) {
      this.cache.set(url, {
        result,
        expiresAt: this.now() + (result.ok ? this.successTtlMs : this.failureTtlMs),
      });
    }

    async checkItem(item, { signal } = {}) {
      if (signal?.aborted) throw createAbortError();
      const url = resolveUrl(item?.url, this.locationRef);
      if (!url) {
        return { item, ok: false, reason: 'invalid-url' };
      }
      const cached = this.getCached(url);
      if (cached) {
        return { item, ...cached };
      }
      if (isMixedContent(url, this.locationRef)) {
        const result = { ok: false, reason: 'mixed-content' };
        this.setCached(url, result);
        return { item, ...result };
      }

      let timeout;
      let abortHandler;
      const timeoutPromise = new Promise((resolve, reject) => {
        timeout = globalThis.setTimeout(
          () => resolve({ ok: false, reason: 'timeout' }),
          this.timeoutMs,
        );
        abortHandler = () => reject(createAbortError());
        signal?.addEventListener?.('abort', abortHandler, { once: true });
      });

      try {
        const probed = await Promise.race([
          Promise.resolve(this.probe(item, {
            ...this.probeOptions,
            locationRef: this.locationRef,
            signal,
          })),
          timeoutPromise,
        ]);
        const result = normalizeResult(probed);
        this.setCached(url, result);
        return { item, ...result };
      } finally {
        globalThis.clearTimeout(timeout);
        signal?.removeEventListener?.('abort', abortHandler);
      }
    }

    async checkClue(clue, media = [], { signal, events = {} } = {}) {
      const items = Array.isArray(media) ? media : [];
      if (items.length === 0) {
        return { ok: true, checked: 0, failures: [], skipped: true };
      }
      this.emit(events.started || 'MEDIA_PREFLIGHT_STARTED', {
        category: clue?.category,
        mediaCount: items.length,
      });
      const results = await Promise.all(items.map((item) => this.checkItem(item, { signal })));
      const failures = results.filter((result) => !result.ok);
      const report = {
        ok: failures.length === 0,
        checked: results.length,
        failures,
        results,
      };
      this.emit(report.ok ? (events.passed || 'MEDIA_PREFLIGHT_PASSED') : (events.rejected || 'MEDIA_PREFLIGHT_REJECTED'), {
        category: clue?.category,
        checked: report.checked,
        failures: failures.map(({ item, reason }) => ({ url: item?.url, reason })),
      });
      return report;
    }

    async selectPlayable(candidates, { getMedia, signal, events } = {}) {
      let attempts = 0;
      for (const candidate of candidates || []) {
        if (signal?.aborted) throw createAbortError();
        attempts += 1;
        const clue = candidate?.clue || candidate;
        const media = await getMedia(clue);
        const report = await this.checkClue(clue, media, { signal, events });
        if (report.ok) {
          return { candidate, clue, media, report, attempts };
        }
      }
      this.emit(events?.exhausted || 'MEDIA_PREFLIGHT_EXHAUSTED', { attempts });
      return null;
    }
  }

  return {
    DEFAULT_TIMEOUT_MS,
    FAILURE_TTL_MS,
    MediaPreflight,
    SUCCESS_TTL_MS,
    createAbortError,
    defaultProbe,
    isMixedContent,
    normalizeResult,
    probeElementMedia,
    resolveUrl,
  };
}));
