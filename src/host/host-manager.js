(function initHostManager(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeopardishHost = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function hostManagerFactory() {
  'use strict';

  const HostPerformanceStates = Object.freeze({
    IDLE: 'idle',
    CLUE: 'clue',
    REVEAL: 'reveal',
    CORRECT: 'correct',
    INCORRECT: 'incorrect',
    EMPTY: 'empty',
    STREAK: 'streak',
  });

  const ExpressionAliases = Object.freeze({
    neutral: HostPerformanceStates.IDLE,
    thinking: HostPerformanceStates.CLUE,
    revealing: HostPerformanceStates.REVEAL,
    happy: HostPerformanceStates.CORRECT,
    sad: HostPerformanceStates.INCORRECT,
  });

  const PerformanceMeta = Object.freeze({
    idle: Object.freeze({ effect: 'on-air', intensity: 'low' }),
    clue: Object.freeze({ effect: 'lean-in', intensity: 'medium' }),
    reveal: Object.freeze({ effect: 'truth-drop', intensity: 'medium' }),
    correct: Object.freeze({ effect: 'approve', intensity: 'high' }),
    incorrect: Object.freeze({ effect: 'deadpan', intensity: 'medium' }),
    empty: Object.freeze({ effect: 'disbelief', intensity: 'medium' }),
    streak: Object.freeze({ effect: 'streak-fire', intensity: 'max' }),
  });

  function normalizePerformanceState(expression = HostPerformanceStates.IDLE) {
    const candidate = String(expression || HostPerformanceStates.IDLE).toLowerCase();
    if (ExpressionAliases[candidate]) {
      return ExpressionAliases[candidate];
    }
    if (Object.values(HostPerformanceStates).includes(candidate)) {
      return candidate;
    }
    return HostPerformanceStates.IDLE;
  }

  const DefaultHostSkins = Object.freeze([
    {
      id: 'dope-broadcast',
      label: 'Channel O Xander',
      frame: 'bust',
      visuals: Object.freeze({
        idle: 'assets/trebek/trebek-dope-02.png',
        clue: 'assets/trebek/trebek-dope-05.png',
        reveal: 'assets/trebek/trebek-dope-03.png',
        correct: 'assets/trebek/trebek-dope-01.png',
        incorrect: 'assets/trebek/trebek-dope-05.png',
        empty: 'assets/trebek/trebek-dope-03.png',
        streak: 'assets/trebek/trebek-dope-01.png',
      }),
      note: 'Primary reaction pack restored from the true-alpha neon masters.',
    },
    {
      id: 'dope-question',
      label: 'Question Mark Xander',
      frame: 'bust',
      src: 'assets/trebek/trebek-dope-02.png',
      note: 'True-alpha question-mark portrait.',
    },
    {
      id: 'dope-mustache',
      label: 'Mustache Xander',
      frame: 'bust',
      src: 'assets/trebek/trebek-dope-03.png',
      note: 'True-alpha mustache portrait.',
    },
    {
      id: 'dope-halo',
      label: 'Halo Xander',
      frame: 'bust',
      src: 'assets/trebek/trebek-dope-01.png',
      note: 'True-alpha halo portrait.',
    },
    {
      id: 'legacy-cutout',
      label: 'Legacy Cutout',
      frame: 'portrait',
      src: 'assets/images/trebek-vector.png',
      note: 'Transparent-background legacy placeholder.',
    },
  ]);

  const DefaultHost = Object.freeze({
    id: 'xander-trefleck',
    displayName: 'Xander Trefleck',
    skins: DefaultHostSkins,
    visuals: {
      idle: 'assets/trebek/trebek-dope-02.png',
      clue: 'assets/trebek/trebek-dope-05.png',
      reveal: 'assets/trebek/trebek-dope-03.png',
      correct: 'assets/trebek/trebek-dope-01.png',
      incorrect: 'assets/trebek/trebek-dope-05.png',
    },
    quips: {
      idle: [
        'The board is waiting. It has retained counsel.',
        'Welcome. My credentials are framed just outside the crop.',
      ],
      clue: [
        'Here is your clue. I have removed the suspicious fingerprints.',
        'This one has texture, which is television language for evidence.',
      ],
      correct: [
        'Correct. Disturbingly correct.',
        'Yes. The judges and I will discuss how you knew that.',
        'That is the one. Please stop making this look easy in my building.',
      ],
      incorrect: [
        'No. A brave answer, in the historical sense of brave decisions.',
        'Not quite. Canada remains neutral, but the judges do not.',
        'That one got away from you and has requested asylum.',
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
        'You are heating up. The studio insurance has noticed.',
        'A streak appears. I am happy for you in an administrative capacity.',
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

    getPerformance(expression = HostPerformanceStates.IDLE) {
      if (!this.activeHost) {
        return null;
      }

      const state = normalizePerformanceState(expression);
      const skin = this.getActiveSkin();
      const skins = this.getSkins();
      const skinIndex = Math.max(0, skins.findIndex((candidate) => candidate.id === skin?.id));
      const visual = skin?.visuals?.[state]
        || skin?.visuals?.idle
        || skin?.visuals?.neutral
        || skin?.src
        || this.activeHost.visuals?.[state]
        || this.activeHost.visuals?.idle
        || this.activeHost.visuals?.neutral
        || null;
      const meta = PerformanceMeta[state] || PerformanceMeta.idle;

      return {
        state,
        visual,
        cueKey: state,
        effect: meta.effect,
        intensity: meta.intensity,
        frame: skin?.frame || 'portrait',
        skin,
        skinIndex,
        skinCount: skins.length,
      };
    }

    getVisual(expression = HostPerformanceStates.IDLE) {
      return this.getPerformance(expression)?.visual || null;
    }

    getVisualSources() {
      const skin = this.getActiveSkin();
      return [...new Set([
        skin?.src,
        ...Object.values(skin?.visuals || {}),
      ].filter(Boolean))];
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
    HostPerformanceStates,
    HostManager,
    normalizePerformanceState,
  };
}));
