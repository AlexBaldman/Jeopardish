import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  STUDY_ACTIONS,
  createCanonicalCluePacket,
  createGroundedCluePacket,
  getStudyResponse,
  getStudyActions,
} = require('../src/study/clue-packet.js');
const { RoundSnapshotStore } = require('../src/study/round-snapshot.js');

test('canonical clue packets preserve truth and accepted-answer policy immutably', () => {
  const clue = {
    id: 42,
    category: 'History',
    question: 'This city hosted the 1893 exposition.',
    answer: 'What is Chicago?',
    value: '$400',
  };
  const packet = createCanonicalCluePacket(clue, { media: [{ type: 'image', url: '/fair.jpg' }] });

  clue.answer = 'Boston';
  assert.equal(packet.clueId, '42');
  assert.equal(packet.answer, 'What is Chicago?');
  assert.deepEqual(packet.acceptedAnswers, ['chicago']);
  assert.equal(Object.isFrozen(packet), true);
  assert.equal(Object.isFrozen(packet.media), true);
});

test('canonical-only study responses disclose missing reviewed grounding', () => {
  const canonical = createCanonicalCluePacket({ question: 'A clue?', answer: 'An answer', category: 'Test' });
  const grounded = createGroundedCluePacket(canonical);

  assert.equal(grounded.grounding, 'canonical-only');
  assert.match(getStudyResponse(grounded, 'backstory'), /no reviewed explanation or citations/i);
  assert.match(getStudyResponse(grounded, 'quiz'), /one step at a time/i);
  assert.equal(STUDY_ACTIONS.length, 5);
});

test('study presentation localizes independently from canonical truth', () => {
  const canonical = createCanonicalCluePacket({ question: 'Capital of Italy', answer: 'Rome', category: 'Geography' });
  const grounded = createGroundedCluePacket(canonical, {
    presentation: { locale: 'pt-BR', category: 'Geografia', question: 'Capital da Itália', answer: 'Roma' },
  });

  assert.equal(grounded.canonical.answer, 'Rome');
  assert.equal(grounded.presentation.answer, 'Roma');
  assert.match(getStudyResponse(grounded, 'why'), /resposta canônica.*Roma/i);
  assert.equal(getStudyActions('pt-BR')[0].label, 'Explique de forma simples');
});

test('round snapshots are immutable and resume tokens are single use', () => {
  const store = new RoundSnapshotStore({ tokenFactory: () => 'one-use-token' });
  const snapshot = store.capture({ clueId: 'clue-1', view: { userAnswer: 'Chi' } });

  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.view), true);
  assert.equal(store.consume('one-use-token'), snapshot);
  assert.throws(() => store.consume('one-use-token'), /missing, expired, or already consumed/);
});
