(function initPreferenceStore(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(root);
  } else {
    root.JeoPARODYPreferences = factory(root);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function preferenceStoreFactory(root) {
  'use strict';

  const STORAGE_KEYS = Object.freeze({
    theme: 'jeopardish.theme',
    language: 'jeopardish.language',
    hostSkinId: 'jeopardish.hostSkin',
    dialogueStyleId: 'jeoparody.dialogueStyle',
    scenePackId: 'jeoparody.scenePack',
    muted: 'jeoparody.muted',
    voiceEnabled: 'jeoparody.voiceEnabled',
  });

  const DEFAULT_PREFERENCES = Object.freeze({
    theme: 'dark',
    language: 'en',
    hostSkinId: '',
    dialogueStyleId: 'clue-card',
    scenePackId: 'long-beach-96',
    muted: false,
    voiceEnabled: false,
  });

  const BUILT_IN_VALUES = Object.freeze({
    theme: Object.freeze(['dark', 'light']),
    language: Object.freeze(['en', 'pt-BR']),
  });

  function getDefaultStorage() {
    try {
      return root?.localStorage || null;
    } catch {
      return null;
    }
  }

  function parseStoredValue(name, value) {
    if (value === null || value === undefined) return undefined;
    if (name === 'muted' || name === 'voiceEnabled') {
      if (value === 'true') return true;
      if (value === 'false') return false;
      return undefined;
    }
    return String(value);
  }

  class PreferenceStore {
    constructor({
      storage = getDefaultStorage(),
      logger = root?.console,
      defaults = {},
      allowedValues = {},
    } = {}) {
      this.storage = storage;
      this.logger = logger;
      this.defaults = Object.freeze({ ...DEFAULT_PREFERENCES, ...defaults });
      this.allowedValues = Object.fromEntries(
        Object.entries(allowedValues).map(([name, values]) => [name, new Set(values)]),
      );
      this.values = { ...this.defaults };
    }

    load() {
      this.values = { ...this.defaults };
      Object.entries(STORAGE_KEYS).forEach(([name, storageKey]) => {
        let storedValue;
        try {
          storedValue = this.storage?.getItem?.(storageKey);
        } catch (error) {
          this.warn(`Unable to read UI preference "${name}".`, error);
          return;
        }

        const value = parseStoredValue(name, storedValue);
        if (value !== undefined && this.isValid(name, value)) {
          this.values[name] = value;
        }
      });
      return this.getSnapshot();
    }

    get(name) {
      this.assertKnown(name);
      return this.values[name];
    }

    getSnapshot() {
      return Object.freeze({ ...this.values });
    }

    set(name, value) {
      this.assertKnown(name);
      if (!this.isValid(name, value)) {
        throw new TypeError(`Invalid value for UI preference "${name}".`);
      }

      this.values[name] = value;
      try {
        this.storage?.setItem?.(STORAGE_KEYS[name], String(value));
      } catch (error) {
        this.warn(`Unable to persist UI preference "${name}".`, error);
      }
      return value;
    }

    isValid(name, value) {
      const allowed = this.allowedValues[name];
      if (allowed) return allowed.has(value);
      if (BUILT_IN_VALUES[name]) return BUILT_IN_VALUES[name].includes(value);
      if (name === 'muted' || name === 'voiceEnabled') return typeof value === 'boolean';
      if (name === 'hostSkinId') return typeof value === 'string';
      if (name === 'dialogueStyleId' || name === 'scenePackId') {
        return typeof value === 'string' && value.length > 0;
      }
      return false;
    }

    assertKnown(name) {
      if (!Object.hasOwn(STORAGE_KEYS, name)) {
        throw new TypeError(`Unknown UI preference "${name}".`);
      }
    }

    warn(message, error) {
      this.logger?.warn?.(message, error);
    }
  }

  return {
    PreferenceStore,
    DEFAULT_PREFERENCES,
    STORAGE_KEYS,
  };
}));
