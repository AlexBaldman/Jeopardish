import test from 'node:test';
import assert from 'node:assert/strict';
import { QuestionBank } from '../question-bank.js';

function createResponse(data) {
  return {
    ok: true,
    status: 200,
    async json() {
      return data;
    },
  };
}

test('QuestionBank loads starter pack and manifest', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (source) => {
    if (source === './questions/starter-pack.json') {
      return createResponse([{ id: 1, category: 'A', question: 'Q', answer: 'A', value: '$100' }]);
    }

    if (source === './questions/manifest.json') {
      return createResponse({ totalQuestions: 3, shardCount: 1, shards: [{ file: 'shards/000.json', count: 2 }] });
    }

    throw new Error(`Unexpected fetch ${source}`);
  };

  try {
    const bank = new QuestionBank();
    const summary = await bank.init();
    assert.equal(summary.starterCount, 1);
    assert.equal(summary.totalQuestions, 3);
    assert.equal(bank.getLoadedCount(), 1);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('QuestionBank warms an unloaded shard once', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async (source) => {
    if (source === './questions/starter-pack.json') {
      return createResponse([{ id: 1, category: 'A', question: 'Q', answer: 'A', value: '$100' }]);
    }

    if (source === './questions/manifest.json') {
      return createResponse({ totalQuestions: 2, shardCount: 1, shards: [{ file: 'shards/000.json', count: 1 }] });
    }

    if (source === './questions/shards/000.json') {
      return createResponse([{ id: 2, category: 'B', question: 'Q2', answer: 'B', value: '$200' }]);
    }

    throw new Error(`Unexpected fetch ${source}`);
  };

  try {
    const bank = new QuestionBank();
    await bank.init();
    const result = await bank.loadRandomShard();

    if (result) {
      assert.equal(result.count, 1);
      assert.equal(bank.getLoadedCount(), 2);
    }
    assert.equal(await bank.loadRandomShard(), null);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('QuestionBank ensures persisted review clue shards by id hash', async () => {
  const originalFetch = globalThis.fetch;
  const probe = new QuestionBank();
  const targetId = 42;
  const shardId = probe.stableHash(targetId) % 2;
  const targetFile = `shards/${String(shardId).padStart(3, '0')}.json`;

  globalThis.fetch = async (source) => {
    if (source === './questions/starter-pack.json') {
      return createResponse([{ id: 1, category: 'A', question: 'Q', answer: 'A', value: '$100' }]);
    }

    if (source === './questions/manifest.json') {
      return createResponse({
        totalQuestions: 2,
        shardCount: 2,
        shards: [
          { file: 'shards/000.json', count: 1 },
          { file: 'shards/001.json', count: 1 },
        ],
      });
    }

    if (source === `./questions/${targetFile}`) {
      return createResponse([{ id: targetId, category: 'Review', question: 'Q42', answer: 'A42', value: '$400' }]);
    }

    throw new Error(`Unexpected fetch ${source}`);
  };

  try {
    const bank = new QuestionBank();
    await bank.init();
    const loaded = await bank.ensureQuestions([targetId]);

    assert.equal(loaded.length, 1);
    assert.equal(bank.getById(targetId).answer, 'A42');
  } finally {
    globalThis.fetch = originalFetch;
  }
});
