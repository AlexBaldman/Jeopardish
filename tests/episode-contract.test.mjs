import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  EPISODE_KINDS,
  EpisodeContractError,
  adaptLegacyQuestionBank,
  normalizeEpisodeSource,
  validateEpisodePack,
} = require('../src/content/episode-contract.js');

function createAuthoredPack() {
  return {
    schemaVersion: 1,
    id: 'season-zero-001',
    title: 'A Respectable Amount of Trouble',
    locale: 'en',
    kind: 'authored',
    sequenceMode: 'authored-order',
    contentRevision: 3,
    episodeLength: 1,
    reviewStatus: 'reviewed',
    clues: [{
      id: 'sz-001-01',
      category: 'Science',
      value: 400,
      clue: 'This planet is known for its prominent ring system.',
      answer: 'Saturn',
      acceptedAnswers: ['the planet Saturn'],
      explanation: 'Saturn has the most visually prominent ring system in our solar system.',
      sources: [{
        title: 'NASA Saturn Overview',
        url: 'https://science.nasa.gov/saturn/',
      }],
      media: [{
        type: 'image',
        url: './assets/saturn.webp',
        alt: 'Saturn and its rings',
      }],
      difficulty: 0.2,
      tags: ['space'],
      learning: {
        backstory: 'A reviewed backstory.',
        connections: ['A reviewed connection.'],
      },
      performance: { beat: 'opening' },
    }],
    finale: {
      artifactTitle: 'A decoded signal',
      artifactBody: 'The clue order mattered.',
    },
  };
}

test('EpisodeContract validates and freezes a reviewed authored pack', () => {
  const pack = validateEpisodePack(createAuthoredPack(), { requireReviewed: true });

  assert.equal(pack.kind, EPISODE_KINDS.AUTHORED);
  assert.equal(pack.clues[0].question, pack.clues[0].clue);
  assert.equal(pack.clues[0].value, 400);
  assert.equal(pack.sequenceMode, 'authored-order');
  assert.equal(pack.contentRevision, 3);
  assert.equal(pack.clues[0].learning.connections[0], 'A reviewed connection.');
  assert.equal(pack.finale.artifactTitle, 'A decoded signal');
  assert.equal(Object.isFrozen(pack), true);
  assert.equal(Object.isFrozen(pack.clues[0].sources), true);
});

test('EpisodeContract rejects duplicate ids, insecure sources, and unreviewed production clues', () => {
  const pack = createAuthoredPack();
  pack.clues.push({
    ...pack.clues[0],
    sources: [{ title: 'Unsafe', url: 'http://example.test/source' }],
    explanation: '',
  });
  pack.episodeLength = 2;

  assert.throws(
    () => validateEpisodePack(pack, { requireReviewed: true }),
    (error) => (
      error instanceof EpisodeContractError
      && error.issues.some((issue) => issue.includes('duplicates'))
      && error.issues.some((issue) => issue.includes('HTTPS'))
      && error.issues.some((issue) => issue.includes('explanation'))
    ),
  );

  const draft = createAuthoredPack();
  draft.reviewStatus = 'draft';
  assert.throws(
    () => validateEpisodePack(draft, { requireReviewed: true }),
    /episode\.reviewStatus must be reviewed/,
  );
});

test('EpisodeContract adapts the historical bank without pretending it is reviewed content', () => {
  const source = [{
    category: 'History',
    value: '$200',
    question: 'This city hosted the 1893 World Columbian Exposition.',
    answer: 'Chicago',
    round: 'Jeopardy!',
    show_number: '100',
    air_date: '1989-01-01',
  }, {
    category: 'Science',
    value: '$400',
    question: 'This planet is famous for its rings.',
    answer: 'Saturn',
    round: 'Double Jeopardy!',
    show_number: '100',
    air_date: '1989-01-01',
  }];

  const first = adaptLegacyQuestionBank(source, { episodeLength: 2 });
  const second = normalizeEpisodeSource([...source].reverse(), { episodeLength: 2 });

  assert.equal(first.kind, EPISODE_KINDS.LEGACY_ADAPTER);
  assert.equal(first.reviewStatus, 'archive');
  assert.equal(first.provenance.sourceCount, 2);
  assert.equal(first.clues[0].value, 200);
  assert.match(first.clues[0].id, /^archive-/);
  assert.equal(
    first.clues.find(({ answer }) => answer === 'Chicago').id,
    second.clues.find(({ answer }) => answer === 'Chicago').id,
  );
});
