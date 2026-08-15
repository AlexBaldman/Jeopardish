import test from 'node:test';
import assert from 'node:assert/strict';
import { createSession, calculateAccuracy, recordAnswer } from '../game-session.js';

test('createSession restores durable stats without carrying active score', () => {
  const session = createSession({
    bestStreak: 4,
    highScore: 1200,
    missedClueIds: [1, 2],
  });

  assert.equal(session.score, 0);
  assert.equal(session.bestStreak, 4);
  assert.equal(session.highScore, 1200);
  assert.deepEqual(session.missedClueIds, [1, 2]);
});

test('recordAnswer increments score, streak, and accuracy for correct answers', () => {
  const session = createSession();
  const result = recordAnswer(session, {
    clueId: 10,
    isCorrect: true,
    clueValue: 400,
    peekUsed: false,
  });

  assert.equal(result.delta, 400);
  assert.equal(result.session.score, 400);
  assert.equal(result.session.currentStreak, 1);
  assert.equal(result.session.bestStreak, 1);
  assert.equal(result.accuracy, 100);
});

test('recordAnswer stores misses and clears them when later answered correctly', () => {
  const missed = recordAnswer(createSession(), {
    clueId: 22,
    isCorrect: false,
    clueValue: 200,
    peekUsed: false,
  }).session;

  assert.deepEqual(missed.missedClueIds, [22]);
  assert.equal(missed.currentStreak, 0);

  const recovered = recordAnswer(missed, {
    clueId: 22,
    isCorrect: true,
    clueValue: 200,
    peekUsed: false,
  }).session;

  assert.deepEqual(recovered.missedClueIds, []);
});

test('peeked answers earn no score and reset streak', () => {
  const session = {
    ...createSession(),
    currentStreak: 3,
    bestStreak: 3,
  };

  const result = recordAnswer(session, {
    clueId: 7,
    isCorrect: true,
    clueValue: 800,
    peekUsed: true,
  });

  assert.equal(result.delta, 0);
  assert.equal(result.session.score, 0);
  assert.equal(result.session.currentStreak, 0);
});
