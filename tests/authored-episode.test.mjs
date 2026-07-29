import test from 'node:test';
import assert from 'node:assert/strict';
import { access, readFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { validateEpisodePack } = require('../src/content/episode-contract.js');
const { EmergencyEpisode } = require('../src/content/emergency-episode.js');
const episodeUrl = new URL('../questions/episodes/season-zero-001.json', import.meta.url);
const episode = validateEpisodePack(
  JSON.parse(await readFile(episodeUrl, 'utf8')),
  { requireReviewed: true },
);

test('Season Zero pilot is a reviewed, authored ten-clue broadcast', () => {
  assert.equal(episode.id, 'season-zero-001-extra-o');
  assert.equal(episode.kind, 'authored');
  assert.equal(episode.sequenceMode, 'authored-order');
  assert.equal(episode.reviewStatus, 'reviewed');
  assert.equal(episode.episodeLength, 10);
  assert.equal(episode.clues.length, 11);
  assert.ok(episode.clues.every((clue) => (
    clue.explanation
      && clue.sources.length > 0
      && clue.sources.every(({ url }) => url.startsWith('https://'))
      && clue.learning.backstory
      && clue.learning.connections.length > 0
      && clue.learning.reinforcement?.prompt
      && clue.learning.reinforcement?.answer
      && clue.learning.reinforcement?.explanation
      && clue.learning.reinforcement?.promptPt
      && clue.learning.reinforcement?.answerPt
      && clue.performance.hostLine
  )));
});

test('Season Zero clue order carries the intended finale signal and act progression', () => {
  const airedClues = episode.clues.slice(0, episode.episodeLength);
  const signal = airedClues.map(({ answer }) => answer[0].toUpperCase()).join('');
  const acts = airedClues.map(({ performance }) => performance.act);

  assert.equal(signal, 'BROADCASTO');
  assert.equal(episode.finale.artifactTitle, 'BROADCAST O');
  assert.match(episode.finale.artifactBody, /extra O/i);
  assert.deepEqual(acts, [...acts].sort((left, right) => left - right));
});

test('Season Zero includes a reviewed text-only standby for the media slot', () => {
  const standby = episode.clues.find(({ performance }) => (
    performance.standbyFor === 's0e1-08-saturn'
  ));

  assert.equal(standby.answer[0], 'S');
  assert.equal(standby.media.length, 0);
  assert.ok(standby.tags.includes('media-fallback'));
});

test('Season Zero local media ships from a resolvable production path', async () => {
  const localMedia = episode.clues
    .flatMap(({ media }) => media)
    .filter(({ url }) => url.startsWith('./'));

  assert.equal(localMedia.length, 1);
  await Promise.all(localMedia.map(({ url }) => (
    access(fileURLToPath(new URL(`../../${url.replace(/^\.\//, '')}`, episodeUrl)))
  )));
});

test('embedded emergency broadcast contains only reviewed playable clues', () => {
  const emergency = validateEpisodePack(EmergencyEpisode, {
    requireReviewed: true,
  });

  assert.equal(emergency.id, 'season-zero-emergency-broadcast');
  assert.equal(emergency.episodeLength, 3);
  assert.equal(emergency.clues.length, 3);
  assert.ok(emergency.clues.every((clue) => (
    clue.explanation
      && clue.sources.length > 0
      && clue.learning.reinforcement?.prompt
      && clue.learning.reinforcement?.promptPt
      && clue.answer
  )));
});
