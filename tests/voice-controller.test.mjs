import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  VoiceCommands,
  VoiceController,
  VoiceStates,
  normalizeTranscript,
  parseVoiceIntent,
  stripAnswerPrefix,
} = require('../src/voice/voice-controller.js');

class FakeUtterance {
  constructor(text) {
    this.text = text;
    this.lang = '';
    this.rate = 1;
    this.pitch = 1;
    this.voice = null;
  }
}

class FakeSynthesis {
  constructor() {
    this.cancelled = 0;
    this.spoken = [];
    this.voices = [
      { lang: 'en-US', name: 'Studio English' },
      { lang: 'pt-BR', name: 'Studio Portuguese' },
    ];
  }

  cancel() {
    this.cancelled += 1;
  }

  getVoices() {
    return this.voices;
  }

  speak(utterance) {
    this.spoken.push(utterance);
    utterance.onstart?.();
  }
}

class FakeRecognition {
  static latest = null;

  constructor() {
    FakeRecognition.latest = this;
    this.started = false;
    this.aborted = false;
  }

  start() {
    this.started = true;
    this.onstart?.();
  }

  abort() {
    this.aborted = true;
    this.onerror?.({ error: 'aborted' });
    this.onend?.();
  }

  emitTranscript(transcript, isFinal = true) {
    this.onresult?.({
      resultIndex: 0,
      results: [{
        0: { transcript },
        isFinal,
      }],
    });
    if (isFinal) this.onend?.();
  }

  deny() {
    this.onerror?.({ error: 'not-allowed' });
    this.onend?.();
  }
}

test('voice intent parser distinguishes commands from natural spoken answers', () => {
  assert.equal(normalizeTranscript('  Próxima pista! '), 'proxima pista');
  assert.deepEqual(
    parseVoiceIntent('Next clue'),
    { type: 'command', command: VoiceCommands.NEW_CLUE, transcript: 'Next clue' },
  );
  assert.deepEqual(
    parseVoiceIntent('Mostre a resposta'),
    { type: 'command', command: VoiceCommands.REVEAL_ANSWER, transcript: 'Mostre a resposta' },
  );
  assert.deepEqual(
    parseVoiceIntent('Who is Marie Curie?'),
    { type: 'answer', answer: 'Marie Curie', transcript: 'Who is Marie Curie?' },
  );
  assert.equal(stripAnswerPrefix('Minha resposta é Santos Dumont.'), 'Santos Dumont');
  assert.equal(parseVoiceIntent('background chatter', { context: 'command' }).type, 'unknown');
});

test('VoiceController narrates with a matching localized voice and reports lifecycle state', () => {
  const synthesis = new FakeSynthesis();
  const states = [];
  const controller = new VoiceController({
    speechSynthesisRef: synthesis,
    UtteranceClass: FakeUtterance,
    RecognitionClass: null,
    language: 'pt-BR',
    onState: ({ state }) => states.push(state),
  });

  assert.deepEqual(controller.getCapabilities(), { narration: true, recognition: false });
  assert.equal(controller.setEnabled(true), true);
  assert.equal(controller.speak('A pista está no ar.'), true);
  assert.equal(synthesis.spoken[0].lang, 'pt-BR');
  assert.equal(synthesis.spoken[0].voice.name, 'Studio Portuguese');
  assert.equal(controller.state, VoiceStates.SPEAKING);

  synthesis.spoken[0].onend();
  assert.equal(controller.state, VoiceStates.IDLE);
  assert.deepEqual(states, [VoiceStates.IDLE, VoiceStates.SPEAKING, VoiceStates.IDLE]);
});

test('VoiceController ignores stale speech callbacks after an interruption', () => {
  const synthesis = new FakeSynthesis();
  const controller = new VoiceController({
    speechSynthesisRef: synthesis,
    UtteranceClass: FakeUtterance,
    RecognitionClass: null,
  });

  controller.setEnabled(true);
  controller.speak('First clue.');
  controller.speak('Replacement clue.');
  synthesis.spoken[0].onend();

  assert.equal(controller.state, VoiceStates.SPEAKING);
  assert.equal(synthesis.cancelled, 2);

  synthesis.spoken[1].onend();
  assert.equal(controller.state, VoiceStates.IDLE);
});

test('VoiceController returns a final answer intent from one-shot recognition', () => {
  const intents = [];
  const transcripts = [];
  const controller = new VoiceController({
    speechSynthesisRef: null,
    UtteranceClass: null,
    RecognitionClass: FakeRecognition,
    onIntent: (intent) => intents.push(intent),
    onTranscript: (transcript) => transcripts.push(transcript),
  });

  controller.setEnabled(true);
  assert.equal(controller.listen({ context: 'answer' }), true);
  assert.equal(controller.state, VoiceStates.LISTENING);
  FakeRecognition.latest.emitTranscript('What is the Pacific Ocean');

  assert.deepEqual(transcripts, [{ transcript: 'What is the Pacific Ocean', final: true }]);
  assert.deepEqual(intents, [{
    type: 'answer',
    answer: 'the Pacific Ocean',
    transcript: 'What is the Pacific Ocean',
  }]);
  assert.equal(controller.state, VoiceStates.IDLE);
});

test('VoiceController exposes denied microphone permission without breaking narration mode', () => {
  const errors = [];
  const controller = new VoiceController({
    speechSynthesisRef: null,
    UtteranceClass: null,
    RecognitionClass: FakeRecognition,
    onError: (error) => errors.push(error),
  });

  controller.setEnabled(true);
  controller.listen();
  FakeRecognition.latest.deny();

  assert.equal(controller.state, VoiceStates.DENIED);
  assert.deepEqual(errors, [{ code: 'not-allowed', recoverable: false }]);
  assert.equal(controller.enabled, true);
});
