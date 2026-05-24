(function initHostManager(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeopardishHost = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function hostManagerFactory() {
  'use strict';

  const DefaultHost = Object.freeze({
    id: 'afterlife-alex',
    displayName: 'Afterlife Alex',
    visuals: {
      neutral: 'assets/images/trebek-vector.png',
      thinking: 'assets/trebek/trebek-gifs/trebek-intro.gif',
      happy: 'assets/trebek/trebek-gifs/trebek-reactions-good/alex-good-01.gif',
      sad: 'assets/trebek/trebek-gifs/trebek-reactions-bad/alex-bad-01.gif',
    },
    quips: {
      idle: [
        'Pick a category. Any category. Preferably one you know.',
        'The board is waiting.',
      ],
      clue: [
        'Here is your clue.',
        'This one has a little texture to it.',
      ],
      correct: [
        'Correct.',
        'Yes, nicely done.',
        'That is the one.',
      ],
      incorrect: [
        'Nope.',
        'Not quite.',
        'That one got away from you.',
      ],
      empty: [
        'Bold strategy: submitting the concept of air.',
        'I checked with the judges. Silence remains incorrect.',
        'You have to type something. Even a tragic little guess would do.',
        'The answer box is not a mime school.',
        'A blank response? Minimalist, but legally not an answer.',
        'I admire the confidence of giving me absolutely nothing.',
        'The keyboard is right there, glowing with abandoned potential.',
        'That was less an answer and more a tiny vacation for your fingers.',
        'We cannot award points for dramatic staring.',
        'Try words. They have served contestants reasonably well.',
      ],
      streak: [
        'You are heating up.',
        'A streak appears.',
      ],
    },
  });

  class HostManager {
    constructor({ hosts = [DefaultHost], activeHostId = DefaultHost.id, random = Math.random } = {}) {
      this.hosts = new Map(hosts.map((host) => [host.id, host]));
      this.random = random;
      this.activeHost = this.hosts.get(activeHostId) || hosts[0] || null;
    }

    register(host) {
      this.hosts.set(host.id, host);
      if (!this.activeHost) {
        this.activeHost = host;
      }
    }

    setActiveHost(hostId) {
      const host = this.hosts.get(hostId);
      if (!host) {
        throw new Error(`Unknown host: ${hostId}`);
      }

      this.activeHost = host;
      return host;
    }

    getActiveHost() {
      return this.activeHost;
    }

    getVisual(expression = 'neutral') {
      if (!this.activeHost) {
        return null;
      }

      return this.activeHost.visuals[expression] || this.activeHost.visuals.neutral;
    }

    selectQuip(trigger = 'idle') {
      if (!this.activeHost) {
        return '';
      }

      const bank = this.activeHost.quips[trigger] || this.activeHost.quips.idle || [];
      if (bank.length === 0) {
        return '';
      }

      return bank[Math.floor(this.random() * bank.length)];
    }
  }

  return {
    DefaultHost,
    HostManager,
  };
}));
