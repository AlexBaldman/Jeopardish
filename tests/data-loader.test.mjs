import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { GameEvents } = require('../src/contracts/events.js');
const { EventBus } = require('../src/core/event-bus.js');
const { DataLoader } = require('../src/data/data-loader.js');

function createHarness(response) {
  const events = [];
  const eventBus = new EventBus({ now: () => 'now' });
  eventBus.on('*', (event) => events.push(event));
  const fetcher = async () => response;
  return {
    events,
    loader: new DataLoader({ eventBus, fetcher }),
  };
}

test('DataLoader identifies a legacy bank without interpreting its content', async () => {
  const source = [{ question: 'Question', answer: 'Answer' }];
  const { events, loader } = createHarness({
    ok: true,
    async json() {
      return source;
    },
  });

  assert.equal(await loader.loadEpisodeSource('/questions.json'), source);
  assert.deepEqual(events.map(({ type }) => type), [
    GameEvents.EPISODE_SOURCE_REQUESTED,
    GameEvents.EPISODE_SOURCE_LOADED,
  ]);
  assert.equal(events[1].payload.format, 'legacy-bank');
  assert.equal(events[1].payload.count, 1);
});

test('DataLoader accepts an episode-shaped object for contract validation downstream', async () => {
  const source = { schemaVersion: 1, clues: [{ id: 'clue-1' }] };
  const { events, loader } = createHarness({
    ok: true,
    async json() {
      return source;
    },
  });

  assert.equal(await loader.loadEpisodeSource('/episode.json'), source);
  assert.equal(events[1].payload.format, 'episode-pack');
  assert.equal(events[1].payload.count, 1);
});

test('DataLoader reports transport and empty-source failures before rethrowing', async () => {
  const failed = createHarness({
    ok: false,
    status: 503,
  });
  await assert.rejects(
    failed.loader.loadEpisodeSource('/offline.json'),
    /Failed to load episode source: 503/,
  );
  assert.equal(failed.events.at(-1).type, GameEvents.EPISODE_SOURCE_FAILED);

  const empty = createHarness({
    ok: true,
    async json() {
      return [];
    },
  });
  await assert.rejects(
    empty.loader.loadEpisodeSource('/empty.json'),
    /Episode source is empty or invalid/,
  );
  assert.equal(empty.events.at(-1).type, GameEvents.EPISODE_SOURCE_FAILED);
});
