import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  DefaultVoicePack,
  SUPPORTED_VOICE_LOCALES,
  VOICE_PACK_SCHEMA,
  VOICE_PACK_VERSION,
  VoiceCapabilities,
  VoicePackError,
  normalizeVoicePack,
  resolveVoiceProviders,
  selectVoiceStyle,
} = require('../src/voice/voice-pack.js');

function mutableDefault() {
  return JSON.parse(JSON.stringify(DefaultVoicePack));
}

test('VoicePack is versioned, deeply immutable, bilingual, and provider-neutral', () => {
  assert.equal(DefaultVoicePack.schema, VOICE_PACK_SCHEMA);
  assert.equal(DefaultVoicePack.version, VOICE_PACK_VERSION);
  assert.deepEqual(SUPPORTED_VOICE_LOCALES, ['en-US', 'pt-BR']);
  assert.equal(Object.isFrozen(DefaultVoicePack), true);
  assert.equal(Object.isFrozen(DefaultVoicePack.variants['pt-BR'].styles), true);
  assert.deepEqual(
    DefaultVoicePack.providers.map(({ kind }) => kind).sort(),
    ['browser', 'local', 'neural'],
  );
  assert.ok(DefaultVoicePack.providers.every(({ offline }) => offline));
});

test('VoicePack style selection is deterministic and offline fallback skips neural by default', () => {
  const first = selectVoiceStyle(DefaultVoicePack, { locale: 'pt-BR', seed: 'episode-7:clue-3' });
  const second = selectVoiceStyle(DefaultVoicePack, { locale: 'pt-BR', seed: 'episode-7:clue-3' });
  assert.deepEqual(first, second);
  assert.equal(selectVoiceStyle(DefaultVoicePack, { locale: 'en-US' }).id, 'clear');

  assert.deepEqual(
    resolveVoiceProviders(DefaultVoicePack, { locale: 'pt-BR' }).map(({ id }) => id),
    ['local-generic', 'browser-system'],
  );
  assert.deepEqual(
    resolveVoiceProviders(DefaultVoicePack, {
      locale: 'pt-BR',
      capability: VoiceCapabilities.NARRATION,
      allowNeural: true,
    }).map(({ id }) => id),
    ['local-generic', 'browser-system'],
  );

  const neuralEnabled = mutableDefault();
  neuralEnabled.providers[0].enabled = true;
  const neuralPack = normalizeVoicePack(neuralEnabled);
  assert.deepEqual(
    resolveVoiceProviders(neuralPack, { locale: 'pt-BR', allowNeural: true }).map(({ id }) => id),
    ['neural-local', 'local-generic', 'browser-system'],
  );
});

test('VoicePack validation rejects secrets, unsafe runtime URLs, and incomplete consent', () => {
  const secret = mutableDefault();
  secret.providers[0].apiKey = 'sk_live_123456789012345';
  assert.throws(
    () => normalizeVoicePack(secret),
    (error) => error instanceof VoicePackError
      && error.issues.some((issue) => issue.includes('must not contain secrets')),
  );

  const unsafeUrl = mutableDefault();
  unsafeUrl.providers[1].endpoint = 'http://127.0.0.1:9000/speech';
  assert.throws(
    () => normalizeVoicePack(unsafeUrl),
    (error) => error instanceof VoicePackError
      && error.issues.some((issue) => issue.includes('runtime URLs')),
  );

  const incompleteConsent = mutableDefault();
  incompleteConsent.providers[0].consent = { status: 'granted', releaseId: 'performer-release' };
  assert.throws(
    () => normalizeVoicePack(incompleteConsent),
    (error) => error instanceof VoicePackError
      && error.issues.some((issue) => issue.includes('releaseVersion'))
      && error.issues.some((issue) => issue.includes('scope')),
  );
});

test('VoicePack requires locale coverage and a non-neural narration fallback for every locale', () => {
  const incomplete = mutableDefault();
  delete incomplete.variants['pt-BR'];
  incomplete.providers = incomplete.providers.filter(({ id }) => id === 'neural-local');
  incomplete.fallbackOrder = ['neural-local'];

  assert.throws(
    () => normalizeVoicePack(incomplete),
    (error) => error instanceof VoicePackError
      && error.issues.some((issue) => issue.includes('variants.pt-BR'))
      && error.issues.some((issue) => issue.includes('non-neural narration fallback for en-US')),
  );
});
