import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { CluePipeline } = require('../src/application/clue-pipeline.js');

function createKernel() {
  return {
    starts: 0,
    cancellations: [],
    introduced: 0,
    beginClueLoad() {
      this.starts += 1;
    },
    cancel(phase, reason) {
      this.cancellations.push({ phase, reason });
    },
    async introduceClue(render) {
      this.introduced += 1;
      render();
    },
  };
}

test('CluePipeline commits one media-safe translated clue transaction', async () => {
  const kernel = createKernel();
  const calls = [];
  const clue = { id: 42, question: 'Source clue' };
  const mediaPreflight = {
    async selectPlayable(candidates, options) {
      calls.push(['preflight', candidates, options.events]);
      return { clue, candidate: { clue, index: 3 } };
    },
  };
  const pipeline = new CluePipeline({
    roundKernel: kernel,
    mediaPreflight,
    mediaEvents: { passed: 'MEDIA_PASSED' },
    maxAttempts: 5,
  });

  const result = await pipeline.load({
    getCandidates: (limit) => {
      calls.push(['candidates', limit]);
      return [{ clue }];
    },
    getMedia: () => [],
    onLoading: () => calls.push(['loading']),
    onCandidate: (selected) => calls.push(['candidate', selected.candidate.index]),
    prepareDisplay: async (source) => ({ ...source, question: 'Translated clue' }),
    commit: (source, display) => calls.push(['commit', source.question, display.question]),
    onReady: () => calls.push(['ready']),
  });

  assert.equal(result, clue);
  assert.equal(kernel.starts, 1);
  assert.equal(kernel.introduced, 1);
  assert.deepEqual(calls, [
    ['loading'],
    ['candidates', 5],
    ['preflight', [{ clue }], { passed: 'MEDIA_PASSED' }],
    ['candidate', 3],
    ['commit', 'Source clue', 'Translated clue'],
    ['ready'],
  ]);
});

test('CluePipeline cancels superseded work before it can commit', async () => {
  const kernel = createKernel();
  const pending = [];
  const mediaPreflight = {
    selectPlayable(candidates, { signal }) {
      return new Promise((resolve, reject) => {
        signal.addEventListener('abort', () => {
          const error = new Error('aborted');
          error.name = 'AbortError';
          reject(error);
        });
        pending.push(() => resolve({ clue: candidates[0].clue }));
      });
    },
  };
  const pipeline = new CluePipeline({ roundKernel: kernel, mediaPreflight });
  const commits = [];
  const options = (id) => ({
    getCandidates: () => [{ clue: { id } }],
    getMedia: () => [],
    commit: (clue) => commits.push(clue.id),
  });

  const first = pipeline.load(options('old'));
  const second = pipeline.load(options('new'));
  pending.at(-1)();

  assert.equal(await first, null);
  assert.equal((await second).id, 'new');
  assert.deepEqual(commits, ['new']);
  assert.equal(kernel.starts, 2);
});

test('CluePipeline exposes empty and recoverable failure states', async () => {
  const emptyKernel = createKernel();
  const emptyPipeline = new CluePipeline({
    roundKernel: emptyKernel,
    mediaPreflight: { selectPlayable: async () => null },
  });
  let emptyCalls = 0;

  assert.equal(await emptyPipeline.load({
    getCandidates: () => [],
    getMedia: () => [],
    onEmpty: () => { emptyCalls += 1; },
  }), null);
  assert.equal(emptyCalls, 1);
  assert.equal(emptyKernel.cancellations[0].reason, 'no-playable-clue');

  const failedKernel = createKernel();
  const failedPipeline = new CluePipeline({
    roundKernel: failedKernel,
    mediaPreflight: { selectPlayable: async () => { throw new Error('network broke'); } },
  });
  let reported;

  assert.equal(await failedPipeline.load({
    getCandidates: () => [],
    getMedia: () => [],
    onError: (error) => { reported = error.message; },
  }), null);
  assert.equal(reported, 'network broke');
  assert.equal(failedKernel.cancellations[0].reason, 'clue-pipeline-failed');
});
