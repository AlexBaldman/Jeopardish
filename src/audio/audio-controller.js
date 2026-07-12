(function initAudioController(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYAudio = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function audioControllerFactory() {
  'use strict';

  const CUE_PATTERNS = Object.freeze({
    clue: Object.freeze([[392, 0, 0.055], [523.25, 0.07, 0.08]]),
    lock: Object.freeze([[196, 0, 0.045], [98, 0.055, 0.09]]),
    reveal: Object.freeze([[261.63, 0, 0.06], [329.63, 0.075, 0.06], [493.88, 0.15, 0.12]]),
    correct: Object.freeze([[329.63, 0, 0.06], [415.3, 0.07, 0.06], [659.25, 0.14, 0.15]]),
    incorrect: Object.freeze([[164.81, 0, 0.12], [123.47, 0.09, 0.18]]),
    streak: Object.freeze([[392, 0, 0.05], [523.25, 0.06, 0.05], [659.25, 0.12, 0.05], [783.99, 0.18, 0.16]]),
  });

  class AudioController {
    constructor({ AudioContextClass = globalThis.AudioContext || globalThis.webkitAudioContext } = {}) {
      this.AudioContextClass = AudioContextClass;
      this.context = null;
      this.muted = false;
    }

    unlock() {
      if (this.muted || !this.AudioContextClass) {
        return false;
      }
      if (!this.context) {
        this.context = new this.AudioContextClass();
      }
      if (this.context.state === 'suspended') {
        this.context.resume?.();
      }
      return true;
    }

    setMuted(muted) {
      this.muted = Boolean(muted);
      if (this.muted) {
        this.context?.suspend?.();
      } else {
        this.context?.resume?.();
      }
      return this.muted;
    }

    toggleMuted() {
      return this.setMuted(!this.muted);
    }

    play(cue) {
      if (this.muted || !this.unlock()) {
        return false;
      }
      const pattern = CUE_PATTERNS[cue];
      if (!pattern) {
        return false;
      }

      const now = this.context.currentTime;
      pattern.forEach(([frequency, offset, duration]) => {
        const oscillator = this.context.createOscillator();
        const gain = this.context.createGain();
        oscillator.type = cue === 'incorrect' || cue === 'lock' ? 'square' : 'triangle';
        oscillator.frequency.setValueAtTime(frequency, now + offset);
        gain.gain.setValueAtTime(0.0001, now + offset);
        gain.gain.exponentialRampToValueAtTime(0.075, now + offset + 0.012);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + offset + duration);
        oscillator.connect(gain);
        gain.connect(this.context.destination);
        oscillator.start(now + offset);
        oscillator.stop(now + offset + duration + 0.02);
      });
      return true;
    }
  }

  return {
    AudioController,
    CUE_PATTERNS,
  };
}));
