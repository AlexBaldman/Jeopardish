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
  judgeReinforcement,
} = require('../src/study/clue-packet.js');
const { RoundSnapshotStore } = require('../src/study/round-snapshot.js');

test('canonical clue packets preserve truth and accepted-answer policy immutably', () => {
  const clue = {
    id: 42,
    category: 'History',
    question: 'This city hosted the 1893 exposition.',
    answer: 'What is Chicago?',
    acceptedAnswers: ['The Windy City'],
    value: '$400',
  };
  const packet = createCanonicalCluePacket(clue, { media: [{ type: 'image', url: '/fair.jpg' }] });

  clue.answer = 'Boston';
  assert.equal(packet.clueId, '42');
  assert.equal(packet.answer, 'What is Chicago?');
  assert.deepEqual(packet.acceptedAnswers, ['chicago', 'windycity']);
  assert.equal(Object.isFrozen(packet), true);
  assert.equal(Object.isFrozen(packet.media), true);
});

test('reviewed study packets retain validated citations and reject unsafe citation schemes', () => {
  const canonical = createCanonicalCluePacket({
    question: 'A ringed planet',
    answer: 'Saturn',
    category: 'Space',
  });
  const grounded = createGroundedCluePacket(canonical, {
    reviewed: true,
    explanation: 'Saturn has a prominent ring system.',
    citations: [
      { title: 'NASA Saturn facts', url: 'https://science.nasa.gov/saturn/facts/' },
      { title: 'Unsafe', url: 'javascript:alert(1)' },
    ],
  });

  assert.equal(grounded.grounding, 'reviewed');
  assert.deepEqual(grounded.citations, [{
    title: 'NASA Saturn facts',
    url: 'https://science.nasa.gov/saturn/facts/',
  }]);
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

test('reviewed reinforcement localizes presentation and judges all reviewed aliases', () => {
  const canonical = createCanonicalCluePacket({
    question: 'This molecule is O3.',
    answer: 'Ozone',
    category: 'Science',
  });
  const grounded = createGroundedCluePacket(canonical, {
    reviewed: true,
    explanation: 'Ozone contains three oxygen atoms.',
    citations: [{ title: 'NASA', url: 'https://science.nasa.gov/' }],
    presentation: {
      locale: 'pt-BR',
      category: 'Ciência',
      question: 'Esta molécula é O3.',
      answer: 'Ozônio',
    },
    reinforcement: {
      prompt: 'How many oxygen atoms?',
      answer: 'Three',
      acceptedAnswers: ['3'],
      explanation: 'O3 contains three atoms.',
      promptPt: 'Quantos átomos de oxigênio?',
      answerPt: 'Três',
      acceptedAnswersPt: ['3'],
      explanationPt: 'O3 contém três átomos.',
    },
  });

  assert.equal(grounded.reinforcement.prompt, 'Quantos átomos de oxigênio?');
  assert.equal(grounded.reinforcement.answer, 'Três');
  assert.equal(judgeReinforcement(grounded, 'tres').isCorrect, true);
  assert.equal(judgeReinforcement(grounded, '3').isCorrect, true);
  assert.doesNotMatch(JSON.stringify(judgeReinforcement(grounded, '3')), /private/i);
});

test('round snapshots are immutable and resume tokens are single use', () => {
  const store = new RoundSnapshotStore({ tokenFactory: () => 'one-use-token' });
  const snapshot = store.capture({ clueId: 'clue-1', view: { userAnswer: 'Chi' } });

  assert.equal(Object.isFrozen(snapshot), true);
  assert.equal(Object.isFrozen(snapshot.view), true);
  assert.equal(store.consume('one-use-token'), snapshot);
  assert.throws(() => store.consume('one-use-token'), /missing, expired, or already consumed/);
});
