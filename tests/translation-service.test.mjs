import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { TranslationService, decodeHtmlEntities, splitByByteLength } = require('../src/i18n/translation-service.js');

function createStorage() {
  const values = new Map();
  return {
    getItem: (key) => values.get(key) || null,
    setItem: (key, value) => values.set(key, value),
  };
}

test('TranslationService translates complete clue content and caches segments', async () => {
  const requests = [];
  const translations = new Map([
    ['HISTORY', 'HISTÓRIA'],
    ['This city is known as the Eternal City.', 'Esta cidade é conhecida como a Cidade Eterna.'],
    ['Rome', 'Roma'],
  ]);
  const service = new TranslationService({
    TranslatorClass: null,
    storage: createStorage(),
    fetcher: async (url) => {
      const query = new URL(url).searchParams.get('q');
      requests.push(query);
      return {
        ok: true,
        json: async () => ({ responseData: { translatedText: translations.get(query) } }),
      };
    },
  });

  const clue = await service.translateClue({
    category: 'HISTORY',
    question: 'ignored html',
    answer: 'Rome',
  }, {
    questionText: 'This city is known as the Eternal City.',
  });

  assert.equal(clue.category, 'HISTÓRIA');
  assert.equal(clue.question, 'Esta cidade é conhecida como a Cidade Eterna.');
  assert.equal(clue.answer, 'Roma');
  assert.equal(clue.translation.original.answer, 'Rome');
  assert.equal(clue.translation.provider, 'network');

  await service.translateText('Rome');
  assert.equal(requests.filter((text) => text === 'Rome').length, 1);
});

test('TranslationService prefers an available on-device translator', async () => {
  class FakeTranslator {
    static async availability() { return 'available'; }
    static async create() {
      return { translate: async (text) => `PT:${text}` };
    }
  }
  const service = new TranslationService({
    TranslatorClass: FakeTranslator,
    storage: createStorage(),
    fetcher: async () => { throw new Error('remote should not run'); },
  });

  assert.deepEqual(await service.translateText('Hello'), {
    translatedText: 'PT:Hello',
    provider: 'on-device',
  });
});

test('TranslationService preserves source text when languages match', async () => {
  const service = new TranslationService({
    TranslatorClass: null,
    storage: createStorage(),
    fetcher: null,
  });

  assert.deepEqual(await service.translateText('  Olá   mundo ', {
    sourceLanguage: 'pt-BR',
    targetLanguage: 'pt-BR',
  }), {
    translatedText: 'Olá mundo',
    provider: 'original',
  });
});

test('TranslationService decodes network entities and chunks long clues', async () => {
  assert.equal(decodeHtmlEntities('Rock &amp; Roll &quot;rules&quot; &#33;'), 'Rock & Roll "rules" !');
  const chunks = splitByByteLength('palavra '.repeat(100), 80);
  assert.ok(chunks.length > 1);
  assert.ok(chunks.every((chunk) => new TextEncoder().encode(chunk).length <= 80));
});
