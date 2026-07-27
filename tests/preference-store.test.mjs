import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  PreferenceStore,
  DEFAULT_PREFERENCES,
  STORAGE_KEYS,
} = require('../src/application/preference-store.js');

class MemoryStorage {
  constructor(entries = {}) {
    this.values = new Map(Object.entries(entries));
  }

  getItem(key) {
    return this.values.has(key) ? this.values.get(key) : null;
  }

  setItem(key, value) {
    this.values.set(key, value);
  }
}

test('PreferenceStore loads valid persisted values and preserves defaults', () => {
  const storage = new MemoryStorage({
    [STORAGE_KEYS.theme]: 'light',
    [STORAGE_KEYS.language]: 'pt-BR',
    [STORAGE_KEYS.hostSkinId]: 'dope-03',
    [STORAGE_KEYS.dialogueStyleId]: 'thought',
    [STORAGE_KEYS.scenePackId]: 'beach-broadcast',
    [STORAGE_KEYS.muted]: 'true',
  });
  const store = new PreferenceStore({
    storage,
    allowedValues: { dialogueStyleId: ['clue-card', 'thought'] },
  });

  assert.deepEqual(store.load(), {
    ...DEFAULT_PREFERENCES,
    theme: 'light',
    language: 'pt-BR',
    hostSkinId: 'dope-03',
    dialogueStyleId: 'thought',
    scenePackId: 'beach-broadcast',
    muted: true,
  });
  assert.equal(store.get('voiceEnabled'), false);
});

test('PreferenceStore rejects corrupted persisted values without poisoning defaults', () => {
  const storage = new MemoryStorage({
    [STORAGE_KEYS.theme]: 'purple',
    [STORAGE_KEYS.language]: 'fr',
    [STORAGE_KEYS.dialogueStyleId]: 'missing-style',
    [STORAGE_KEYS.muted]: 'sometimes',
    [STORAGE_KEYS.voiceEnabled]: 'true',
  });
  const store = new PreferenceStore({
    storage,
    allowedValues: { dialogueStyleId: ['clue-card', 'speech'] },
  });

  assert.deepEqual(store.load(), {
    ...DEFAULT_PREFERENCES,
    voiceEnabled: true,
  });
});

test('PreferenceStore validates writes and returns immutable snapshots', () => {
  const storage = new MemoryStorage();
  const store = new PreferenceStore({ storage });
  store.load();

  assert.equal(store.set('theme', 'light'), 'light');
  assert.equal(storage.getItem(STORAGE_KEYS.theme), 'light');
  assert.equal(store.get('theme'), 'light');
  assert.throws(() => store.set('theme', 'sepia'), /Invalid value/);
  assert.throws(() => store.get('mystery'), /Unknown UI preference/);
  assert.equal(Object.isFrozen(store.getSnapshot()), true);
});

test('PreferenceStore keeps in-memory preferences usable when storage fails', () => {
  const warnings = [];
  const storage = {
    getItem() {
      throw new Error('read blocked');
    },
    setItem() {
      throw new Error('write blocked');
    },
  };
  const store = new PreferenceStore({
    storage,
    logger: { warn: (message) => warnings.push(message) },
  });

  assert.deepEqual(store.load(), DEFAULT_PREFERENCES);
  assert.equal(store.set('muted', true), true);
  assert.equal(store.get('muted'), true);
  assert.ok(warnings.some((message) => message.includes('Unable to read')));
  assert.ok(warnings.some((message) => message.includes('Unable to persist')));
});
