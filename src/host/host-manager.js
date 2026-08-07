(function initHostManager(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('./host-avatar.js'));
  } else {
    root.JeopardishHost = factory(root.JeoPARODYHostAvatar);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function hostManagerFactory(avatarModule) {
  'use strict';

  if (!avatarModule?.DefaultXanderAvatarPack || !avatarModule?.selectAvatarLook) {
    throw new Error('HostManager requires JeoPARODYHostAvatar.');
  }

  const { DefaultXanderAvatarPack, selectAvatarLook } = avatarModule;

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

  const DefaultHostSkins = Object.freeze(DefaultXanderAvatarPack.looks.map((look) => Object.freeze({
    ...look,
    avatarPackId: DefaultXanderAvatarPack.id,
    anchors: DefaultXanderAvatarPack.anchors,
    note: `${look.wardrobe.shorts}; ${look.wardrobe.shirt}.`,
  })));

  const DefaultHost = Object.freeze({
    id: 'xander-trefleck',
    displayName: 'Xander Trefleck',
    avatarPack: DefaultXanderAvatarPack,
    skins: DefaultHostSkins,
    visuals: DefaultHostSkins[0].visuals,
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

    selectShowLook(seed, { previousLookId = this.activeSkinId } = {}) {
      const avatarPack = this.activeHost?.avatarPack;
      if (!avatarPack) return this.getActiveSkin();
      const look = selectAvatarLook(avatarPack, { seed, previousLookId });
      if (!look) return this.getActiveSkin();
      this.activeSkinId = look.id;
      return this.getActiveSkin();
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
        avatarPackId: skin?.avatarPackId || this.activeHost.avatarPack?.id || '',
        anchors: skin?.anchors || this.activeHost.avatarPack?.anchors || null,
        wardrobe: skin?.wardrobe || null,
        eyewear: skin?.eyewear || null,
        layers: skin?.layers || null,
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
    DefaultXanderAvatarPack,
    HostPerformanceStates,
    HostManager,
    normalizePerformanceState,
  };
}));
