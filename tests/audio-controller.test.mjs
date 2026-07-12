import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { AudioController } = require('../src/audio/audio-controller.js');

class FakeParam {
  setValueAtTime() {}
  exponentialRampToValueAtTime() {}
}

class FakeNode {
  constructor() {
    this.frequency = new FakeParam();
    this.gain = new FakeParam();
  }

  connect() {}
  start() {}
  stop() {}
}

class FakeAudioContext {
  constructor() {
    this.currentTime = 1;
    this.destination = {};
    this.state = 'running';
    this.oscillators = 0;
  }

  createOscillator() {
    this.oscillators += 1;
    return new FakeNode();
  }

  createGain() {
    return new FakeNode();
  }

  suspend() { this.state = 'suspended'; }
  resume() { this.state = 'running'; }
}

test('AudioController plays original cue patterns and respects mute', () => {
  const audio = new AudioController({ AudioContextClass: FakeAudioContext });

  assert.equal(audio.play('correct'), true);
  assert.equal(audio.context.oscillators, 3);
  assert.equal(audio.setMuted(true), true);
  assert.equal(audio.play('clue'), false);
  assert.equal(audio.toggleMuted(), false);
  assert.equal(audio.play('not-a-cue'), false);
});

test('AudioController degrades cleanly without Web Audio', () => {
  const audio = new AudioController({ AudioContextClass: null });

  assert.equal(audio.unlock(), false);
  assert.equal(audio.play('clue'), false);
});
