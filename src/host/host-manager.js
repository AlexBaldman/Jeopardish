(function initHostManager(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeopardishHost = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function hostManagerFactory() {
  'use strict';

  const DefaultHostSkins = Object.freeze([
    {
      id: 'malex-counterfeit',
      label: 'Counterfeit Malex',
      src: 'assets/images/vision/malex-counterfeit-portrait.png',
      note: 'Current fictional-host portrait.',
    },
    {
      id: 'neon-cardsharp',
      label: 'Neon Cardsharp',
      src: 'assets/trebek/trebek-1.webp',
      note: 'High-impact neon portrait.',
    },
    {
      id: 'neon-professor',
      label: 'Neon Professor',
      src: 'assets/trebek/trebek-3.webp',
      note: 'Sharper game-show villain energy.',
    },
    {
      id: 'neon-broadcast',
      label: 'Neon Broadcast',
      src: 'assets/trebek/trebek-4.webp',
      note: 'Glossy podium candidate.',
    },
    {
      id: 'neon-uncle',
      label: 'Neon Uncle',
      src: 'assets/trebek/trebek-5.webp',
      note: 'Warmer, suspiciously avuncular candidate.',
    },
    {
      id: 'neon-dealer',
      label: 'Neon Dealer',
      src: 'assets/trebek/trebek-6.webp',
      note: 'Good fake-money posture.',
    },
    {
      id: 'beachbum-malex',
      label: 'Beachbum Malex',
      src: 'assets/trebek-other-images/trebek-meta -beachbum.jpeg',
      note: 'Beach-stage tone reference.',
    },
    {
      id: 'cosmic-malex',
      label: 'Cosmic Malex',
      src: 'assets/trebek-other-images/trebek-god.png',
      note: 'Overpowered finale reference.',
    },
    {
      id: 'legacy-cutout',
      label: 'Legacy Cutout',
      src: 'assets/images/trebek-vector.png',
      note: 'Transparent-background legacy placeholder.',
    },
  ]);

  const DefaultHost = Object.freeze({
    id: 'malex-trebek',
    displayName: 'M. Alex "Malex" Trebek',
    skins: DefaultHostSkins,
    visuals: {
      neutral: 'assets/images/vision/malex-counterfeit-portrait.png',
      thinking: 'assets/images/vision/malex-counterfeit-portrait.png',
      happy: 'assets/images/vision/malex-counterfeit-portrait.png',
      sad: 'assets/images/vision/malex-counterfeit-portrait.png',
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
    constructor({
      hosts = [DefaultHost],
      activeHostId = DefaultHost.id,
      activeSkinId = '',
      random = Math.random,
    } = {}) {
      this.hosts = new Map(hosts.map((host) => [host.id, host]));
      this.random = random;
      this.activeHost = this.hosts.get(activeHostId) || hosts[0] || null;
      this.activeSkinId = activeSkinId || this.getSkins()[0]?.id || '';
    }

    register(host) {
      this.hosts.set(host.id, host);
      if (!this.activeHost) {
        this.activeHost = host;
        this.activeSkinId = this.getSkins()[0]?.id || '';
      }
    }

    setActiveHost(hostId) {
      const host = this.hosts.get(hostId);
      if (!host) {
        throw new Error(`Unknown host: ${hostId}`);
      }

      this.activeHost = host;
      if (!this.getActiveSkin()) {
        this.activeSkinId = this.getSkins()[0]?.id || '';
      }
      return host;
    }

    getActiveHost() {
      return this.activeHost;
    }

    getSkins() {
      return this.activeHost?.skins || [];
    }

    getActiveSkin() {
      const skins = this.getSkins();
      if (skins.length === 0) {
        return null;
      }

      return skins.find((skin) => skin.id === this.activeSkinId) || skins[0];
    }

    setActiveSkin(skinId) {
      const skin = this.getSkins().find((candidate) => candidate.id === skinId);
      if (!skin) {
        return this.getActiveSkin();
      }

      this.activeSkinId = skin.id;
      return skin;
    }

    cycleSkin(step = 1) {
      const skins = this.getSkins();
      if (skins.length === 0) {
        return null;
      }

      const activeSkin = this.getActiveSkin();
      const currentIndex = Math.max(0, skins.findIndex((skin) => skin.id === activeSkin?.id));
      const nextIndex = (currentIndex + step + skins.length) % skins.length;
      this.activeSkinId = skins[nextIndex].id;
      return skins[nextIndex];
    }

    getVisual(expression = 'neutral') {
      if (!this.activeHost) {
        return null;
      }

      const skin = this.getActiveSkin();
      if (skin?.visuals?.[expression]) {
        return skin.visuals[expression];
      }
      if (skin?.src) {
        return skin.src;
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
    DefaultHostSkins,
    HostManager,
  };
}));
