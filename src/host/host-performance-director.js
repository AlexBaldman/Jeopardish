(function initHostPerformanceDirector(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('./host-pack.js'),
      require('./host-animation.js'),
      require('../contracts/events.js'),
    );
  } else {
    root.JeoPARODYHostPerformance = factory(
      root.JeoPARODYHostPack,
      root.JeoPARODYHostAnimation,
      root.JeopardishContracts,
    );
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function hostPerformanceFactory(
  hostPackModule,
  hostAnimationModule,
  contracts,
) {
  'use strict';

  if (!hostPackModule || !hostAnimationModule || !contracts) {
    throw new Error('HostPerformanceDirector requires host, animation, and event contracts.');
  }

  const {
    DefaultHostPacks,
    HostBeats,
    normalizeHostPack,
  } = hostPackModule;
  const {
    DefaultXanderHostAnimationPack,
    selectHostAnimation,
  } = hostAnimationModule;
  const { GameEvents } = contracts;
  const PERFORMANCE_SCHEMA = 'jeoparody.host-performance';
  const PERFORMANCE_VERSION = 1;

  const BeatPresentation = Object.freeze({
    [HostBeats.IDLE]: Object.freeze({ expression: 'idle', motion: 'hold', intensity: 'low' }),
    [HostBeats.WELCOME]: Object.freeze({ expression: 'idle', motion: 'enter', intensity: 'medium' }),
    [HostBeats.CLUE]: Object.freeze({ expression: 'clue', motion: 'enter', intensity: 'medium' }),
    [HostBeats.EMPTY]: Object.freeze({ expression: 'empty', motion: 'react', intensity: 'medium' }),
    [HostBeats.CORRECT]: Object.freeze({ expression: 'correct', motion: 'react', intensity: 'high' }),
    [HostBeats.INCORRECT]: Object.freeze({ expression: 'incorrect', motion: 'react', intensity: 'medium' }),
    [HostBeats.REVEAL]: Object.freeze({ expression: 'reveal', motion: 'react', intensity: 'medium' }),
    [HostBeats.STREAK]: Object.freeze({ expression: 'streak', motion: 'react', intensity: 'max' }),
    [HostBeats.EPISODE_COMPLETE]: Object.freeze({ expression: 'streak', motion: 'hold', intensity: 'high' }),
    [HostBeats.STUDY_ENTERED]: Object.freeze({ expression: 'clue', motion: 'enter', intensity: 'low' }),
    [HostBeats.STUDY_EXITED]: Object.freeze({ expression: 'idle', motion: 'recover', intensity: 'low' }),
    [HostBeats.REINFORCEMENT_CORRECT]: Object.freeze({ expression: 'correct', motion: 'react', intensity: 'medium' }),
    [HostBeats.REINFORCEMENT_INCORRECT]: Object.freeze({ expression: 'clue', motion: 'recover', intensity: 'low' }),
  });

  const BeatAnimationPose = Object.freeze({
    [HostBeats.IDLE]: 'idle',
    [HostBeats.WELCOME]: 'idle',
    [HostBeats.CLUE]: 'clue',
    [HostBeats.EMPTY]: 'incorrect',
    [HostBeats.CORRECT]: 'correct',
    [HostBeats.INCORRECT]: 'incorrect',
    [HostBeats.REVEAL]: 'reveal',
    [HostBeats.STREAK]: 'streak',
    [HostBeats.EPISODE_COMPLETE]: 'streak',
    [HostBeats.STUDY_ENTERED]: 'study-coach',
    [HostBeats.STUDY_EXITED]: 'study-coach',
    [HostBeats.REINFORCEMENT_CORRECT]: 'study-coach',
    [HostBeats.REINFORCEMENT_INCORRECT]: 'study-coach',
  });

  const RECEIPT_FACTS = Object.freeze([
    'clueId',
    'roundId',
    'outcome',
    'sequence',
    'attemptCount',
    'streak',
  ]);

  function cleanText(value, maxLength = 500) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
  }

  function normalizeLocale(locale) {
    return locale === 'pt-BR' ? 'pt-BR' : 'en';
  }

  function stableHash(value) {
    let hash = 2166136261;
    const text = String(value || '');
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function formatLine(template, facts = {}) {
    return cleanText(template).replace(/\{([a-zA-Z][a-zA-Z0-9]*)\}/g, (match, token) => {
      if (!Object.hasOwn(facts, token)) return match;
      const value = facts[token];
      if (!['string', 'number', 'boolean'].includes(typeof value)) return '';
      return cleanText(value, 120);
    });
  }

  function createReceipt(facts = {}) {
    return Object.freeze(Object.fromEntries(
      RECEIPT_FACTS
        .filter((key) => Object.hasOwn(facts, key))
        .map((key) => [key, cleanText(facts[key], 120)]),
    ));
  }

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  class HostPerformanceDirector {
    constructor({
      packs = DefaultHostPacks,
      activePackId = DefaultHostPacks[0]?.id,
      animationPack = DefaultXanderHostAnimationPack,
      motionPreference = 'system',
      systemReducedMotion = false,
      eventBus = null,
    } = {}) {
      this.packs = new Map(packs.map((pack) => {
        const normalized = normalizeHostPack(pack);
        return [normalized.id, normalized];
      }));
      this.activePack = this.packs.get(activePackId) || this.packs.values().next().value || null;
      this.animationPack = animationPack;
      this.motionPreference = motionPreference;
      this.systemReducedMotion = Boolean(systemReducedMotion);
      this.eventBus = eventBus;
      if (!this.activePack) throw new Error('HostPerformanceDirector requires at least one HostPack.');
    }

    getPacks() {
      return Object.freeze([...this.packs.values()]);
    }

    getActivePack() {
      return this.activePack;
    }

    setActivePack(packId) {
      const next = this.packs.get(packId);
      if (!next) return this.activePack;
      const changed = next.id !== this.activePack?.id;
      this.activePack = next;
      if (changed) {
        this.emit(GameEvents.HOST_PACK_CHANGED, {
          packId: next.id,
          displayName: next.displayName,
        });
      }
      return next;
    }

    cyclePack(step = 1) {
      const packs = this.getPacks();
      const currentIndex = Math.max(0, packs.findIndex(({ id }) => id === this.activePack?.id));
      const nextIndex = (currentIndex + step + packs.length) % packs.length;
      return this.setActivePack(packs[nextIndex].id);
    }

    direct(beat, {
      locale = 'en',
      facts = {},
      authoredLine = '',
    } = {}) {
      const normalizedBeat = Object.values(HostBeats).includes(beat) ? beat : HostBeats.IDLE;
      const normalizedLocale = normalizeLocale(locale);
      const pack = this.activePack;
      const authored = cleanText(authoredLine);
      const authoredAllowed = (
        normalizedLocale === 'en'
        && authored
        && pack.generationPolicy.authoredLinePolicy === 'prefer'
      );
      const lineBank = pack.lineBanks[normalizedLocale]?.[normalizedBeat]
        || pack.lineBanks.en?.[normalizedBeat]
        || pack.lineBanks[normalizedLocale]?.[HostBeats.IDLE]
        || pack.lineBanks.en[HostBeats.IDLE];
      const seed = [
        pack.id,
        normalizedBeat,
        ...RECEIPT_FACTS.map((key) => facts[key] ?? ''),
      ].join(':');
      const selectedLine = lineBank[stableHash(seed) % lineBank.length] || '';
      const line = authoredAllowed ? authored : formatLine(selectedLine, facts);
      const presentation = BeatPresentation[normalizedBeat] || BeatPresentation[HostBeats.IDLE];
      const animation = selectHostAnimation(this.animationPack, {
        pose: BeatAnimationPose[normalizedBeat] || 'idle',
        seed,
        motion: {
          preference: this.motionPreference,
          systemReducedMotion: this.systemReducedMotion,
        },
      });
      const command = deepFreeze({
        schema: PERFORMANCE_SCHEMA,
        version: PERFORMANCE_VERSION,
        pack: {
          id: pack.id,
          displayName: pack.displayName,
          subtitle: pack.subtitle,
        },
        beat: normalizedBeat,
        expression: presentation.expression,
        cueKey: presentation.expression,
        motion: {
          primitive: presentation.motion,
          intensity: presentation.intensity,
        },
        animation,
        dialogue: {
          line,
          locale: normalizedLocale,
          source: authoredAllowed ? 'authored' : 'line-bank',
        },
        speech: {
          line,
          locale: normalizedLocale === 'pt-BR' ? 'pt-BR' : 'en-US',
          rate: pack.voice.rate,
          pitch: pack.voice.pitch,
          voiceHint: pack.voice.voiceHint,
        },
        receipt: createReceipt(facts),
      });
      this.emit(GameEvents.HOST_PERFORMANCE_DIRECTED, {
        packId: pack.id,
        beat: normalizedBeat,
        expression: command.expression,
        locale: normalizedLocale,
        source: command.dialogue.source,
      });
      return command;
    }

    emit(type, payload) {
      return type ? this.eventBus?.emit?.(type, payload, { source: 'HostPerformanceDirector' }) : null;
    }
  }

  return {
    BeatAnimationPose,
    BeatPresentation,
    HostPerformanceDirector,
    PERFORMANCE_SCHEMA,
    PERFORMANCE_VERSION,
    formatLine,
    stableHash,
  };
}));
