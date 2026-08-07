(function initHostAvatar(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYHostAvatar = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function hostAvatarFactory() {
  'use strict';

  const AVATAR_PACK_SCHEMA = 'jeoparody.host-avatar';
  const AVATAR_PACK_VERSION = 1;
  const PERFORMANCE_STATES = Object.freeze([
    'idle',
    'clue',
    'reveal',
    'correct',
    'incorrect',
    'empty',
    'streak',
  ]);
  const AVATAR_SLOTS = Object.freeze([
    'body',
    'wardrobe',
    'eyewear',
    'accessory',
    'prop',
    'effect',
  ]);

  class HostAvatarError extends Error {
    constructor(issues) {
      super(`Invalid HostAvatarPack: ${issues.join('; ')}`);
      this.name = 'HostAvatarError';
      this.issues = Object.freeze([...issues]);
    }
  }

  function cleanText(value, maxLength = 500) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
  }

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function normalizeAssetPath(value, path, issues) {
    const candidate = cleanText(value, 300);
    if (!candidate) return '';
    if (!candidate.startsWith('assets/') || candidate.includes('..') || /^(?:data|https?|javascript):/i.test(candidate)) {
      issues.push(`${path} must be a project-local assets/ path`);
      return '';
    }
    return candidate;
  }

  function normalizeVisuals(input, path, issues) {
    const source = input && typeof input === 'object' ? input : {};
    const visuals = Object.fromEntries(PERFORMANCE_STATES.map((state) => [
      state,
      normalizeAssetPath(source[state] || source.idle || source.src, `${path}.${state}`, issues),
    ]));
    if (!visuals.idle) issues.push(`${path}.idle is required`);
    return visuals;
  }

  function normalizeAnchors(input = {}) {
    const clamp = (value, fallback) => {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? Math.min(1, Math.max(0, parsed)) : fallback;
    };
    return {
      stage: {
        x: clamp(input.stage?.x, 0.5),
        y: clamp(input.stage?.y, 1),
      },
      lenses: {
        x: clamp(input.lenses?.x, 0.5),
        y: clamp(input.lenses?.y, 0.145),
        width: clamp(input.lenses?.width, 0.26),
      },
      mouth: {
        x: clamp(input.mouth?.x, 0.5),
        y: clamp(input.mouth?.y, 0.245),
      },
    };
  }

  function normalizeLook(input, index, issues) {
    const path = `looks[${index}]`;
    const id = cleanText(input?.id, 80);
    const label = cleanText(input?.label, 120);
    if (!id || !/^[a-z0-9-]+$/.test(id)) issues.push(`${path}.id must be kebab-case`);
    if (!label) issues.push(`${path}.label is required`);
    const weight = Math.max(1, Math.min(20, Math.round(Number(input?.weight) || 1)));
    const layerSources = {};
    AVATAR_SLOTS.forEach((slot) => {
      const source = normalizeAssetPath(input?.layers?.[slot], `${path}.layers.${slot}`, issues);
      if (source) layerSources[slot] = source;
    });

    return {
      id,
      label,
      frame: ['bust', 'half-body', 'full'].includes(input?.frame) ? input.frame : 'full',
      weight,
      rarity: ['signature', 'common', 'special'].includes(input?.rarity)
        ? input.rarity
        : 'common',
      visuals: normalizeVisuals(input?.visuals || { src: input?.src }, `${path}.visuals`, issues),
      layers: layerSources,
      wardrobe: {
        shorts: cleanText(input?.wardrobe?.shorts, 160),
        shirt: cleanText(input?.wardrobe?.shirt, 160),
        accessories: Array.isArray(input?.wardrobe?.accessories)
          ? input.wardrobe.accessories.map((item) => cleanText(item, 80)).filter(Boolean)
          : [],
      },
      eyewear: {
        frames: cleanText(input?.eyewear?.frames, 100),
        lenses: cleanText(input?.eyewear?.lenses, 100),
        effect: cleanText(input?.eyewear?.effect, 80) || 'question-reflection',
      },
    };
  }

  function normalizeInventory(items, path, issues) {
    if (!Array.isArray(items)) return [];
    const normalized = items.map((item, index) => {
      const id = cleanText(item?.id, 80);
      const label = cleanText(item?.label, 140);
      if (!id || !/^[a-z0-9-]+$/.test(id)) issues.push(`${path}[${index}].id must be kebab-case`);
      if (!label) issues.push(`${path}[${index}].label is required`);
      return {
        id,
        label,
        status: ['runtime', 'approved', 'special'].includes(item?.status)
          ? item.status
          : 'approved',
      };
    });
    if (new Set(normalized.map(({ id }) => id)).size !== normalized.length) {
      issues.push(`${path} ids must be unique`);
    }
    return normalized;
  }

  function normalizeHostAvatarPack(input = {}) {
    const issues = [];
    const id = cleanText(input.id, 80);
    const hostId = cleanText(input.hostId, 80);
    const displayName = cleanText(input.displayName, 120);
    if (!id || !/^[a-z0-9-]+$/.test(id)) issues.push('id must be kebab-case');
    if (!hostId || !/^[a-z0-9-]+$/.test(hostId)) issues.push('hostId must be kebab-case');
    if (!displayName) issues.push('displayName is required');

    const looks = Array.isArray(input.looks)
      ? input.looks.map((look, index) => normalizeLook(look, index, issues))
      : [];
    if (looks.length === 0) issues.push('looks requires at least one show look');
    if (new Set(looks.map(({ id: lookId }) => lookId)).size !== looks.length) {
      issues.push('look ids must be unique');
    }

    const slotInput = Array.isArray(input.slots) ? input.slots : AVATAR_SLOTS;
    const slots = [...new Set(slotInput.filter((slot) => AVATAR_SLOTS.includes(slot)))];
    if (slots.length === 0) issues.push('slots requires at least one supported avatar slot');
    const sourceAsset = normalizeAssetPath(input.creation?.sourceAsset, 'creation.sourceAsset', issues);
    const inventory = {
      boardShorts: normalizeInventory(input.inventory?.boardShorts, 'inventory.boardShorts', issues),
      specialLooks: normalizeInventory(input.inventory?.specialLooks, 'inventory.specialLooks', issues),
      performancePoses: normalizeInventory(input.inventory?.performancePoses, 'inventory.performancePoses', issues),
    };

    if (issues.length) throw new HostAvatarError(issues);
    return deepFreeze({
      schema: AVATAR_PACK_SCHEMA,
      version: AVATAR_PACK_VERSION,
      id,
      hostId,
      displayName,
      style: {
        family: cleanText(input.style?.family, 160),
        pixelScale: cleanText(input.style?.pixelScale, 80),
        paletteId: cleanText(input.style?.paletteId, 80),
      },
      slots,
      anchors: normalizeAnchors(input.anchors),
      looks,
      inventory,
      creation: {
        editable: input.creation?.editable !== false,
        source: cleanText(input.creation?.source, 100) || 'authored',
        modelFamily: cleanText(input.creation?.modelFamily, 100),
        promptVersion: cleanText(input.creation?.promptVersion, 100),
        sourceAsset,
      },
      rights: {
        status: cleanText(input.rights?.status, 100) || 'review-required',
        notes: cleanText(input.rights?.notes, 300),
      },
    });
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

  function selectAvatarLook(pack, {
    seed = 'opening-broadcast',
    previousLookId = '',
  } = {}) {
    const candidates = pack.looks.length > 1
      ? pack.looks.filter(({ id }) => id !== previousLookId)
      : pack.looks;
    const totalWeight = candidates.reduce((total, look) => total + look.weight, 0);
    let ticket = stableHash(`${pack.id}:${seed}`) % totalWeight;
    for (const look of candidates) {
      if (ticket < look.weight) return look;
      ticket -= look.weight;
    }
    return candidates[0] || null;
  }

  const DefaultXanderAvatarPack = normalizeHostAvatarPack({
    id: 'xander-surf-v1',
    hostId: 'xander-trefleck',
    displayName: 'Xander Surf Broadcast',
    style: {
      family: 'Premium pixel art with graphic-novel ink and neon broadcast light',
      pixelScale: 'arcade-readable-modern',
      paletteId: 'channel-o-neon-surf',
    },
    slots: AVATAR_SLOTS,
    anchors: {
      stage: { x: 0.5, y: 1 },
      lenses: { x: 0.5, y: 0.145, width: 0.255 },
      mouth: { x: 0.5, y: 0.245 },
    },
    creation: {
      editable: true,
      source: 'ai-assisted-original-with-authored-direction',
      modelFamily: 'OpenAI image generation',
      promptVersion: 'xander-surf-production-v1',
      sourceAsset: 'assets/character-concepts/xander-core-surf-wardrobe-v1.png',
    },
    rights: {
      status: 'prototype-original-review-required',
      notes: 'Fictional host art. Complete provenance and counsel review before commercial release.',
    },
    inventory: {
      boardShorts: [
        { id: 'question-pink', label: 'Hot pink with yellow question marks', status: 'runtime' },
        { id: 'exclamation-blue', label: 'Broadcast blue with yellow exclamation points', status: 'runtime' },
        { id: 'lightning-yellow', label: 'Sunshine yellow with orange side lightning', status: 'runtime' },
        { id: 'sunset-cyan', label: 'Electric cyan with magenta sunset waves', status: 'runtime' },
        { id: 'neon-tropical-navy', label: 'Deep navy with neon tropical linework', status: 'runtime' },
        { id: 'contour-purple', label: 'Purple with turquoise contour waves and coral O marks', status: 'runtime' },
        { id: 'hibiscus-cream', label: 'Cream hibiscus with aqua wave bands', status: 'runtime' },
        { id: 'diagonal-orange', label: 'Orange-to-magenta diagonal surf graphic', status: 'runtime' },
        { id: 'broadcast-grid-black', label: 'Black abstract neon broadcast grid', status: 'runtime' },
        { id: 'sun-wave-turquoise', label: 'Turquoise with gold suns and indigo waves', status: 'runtime' },
        { id: 'checker-lightning-coral', label: 'Coral checkerboard with cyan lightning', status: 'runtime' },
        { id: 'question-constellation', label: 'Midnight question-mark constellation', status: 'runtime' },
      ],
      specialLooks: [
        { id: 'midnight-tuxedo', label: 'Midnight game-show tuxedo', status: 'special' },
        { id: 'canadian-leisure', label: 'Mustard Canadian leisure suit', status: 'special' },
        { id: 'public-access-1993', label: '1990s public-access windbreaker', status: 'special' },
        { id: 'professor-after-dark', label: 'Burgundy professor-after-dark jacket', status: 'special' },
        { id: 'ivory-finale', label: 'Ivory finale dinner jacket', status: 'special' },
        { id: 'tropical-trousers', label: 'Signature tropical shirt with cream trousers', status: 'special' },
      ],
      performancePoses: [
        { id: 'idle', label: 'Idle deadpan' },
        { id: 'clue', label: 'Clue presentation' },
        { id: 'listening', label: 'Listening' },
        { id: 'correct', label: 'Correct-answer delight' },
        { id: 'incorrect', label: 'Incorrect-answer deadpan' },
        { id: 'reveal', label: 'Answer reveal' },
        { id: 'study-coach', label: 'Study coach' },
        { id: 'streak', label: 'Streak finale' },
      ],
    },
    looks: [
      {
        id: 'question-pink',
        label: 'Questionable Pink',
        frame: 'full',
        weight: 6,
        rarity: 'signature',
        src: 'assets/hosts/xander/v1/looks/question-pink.png',
        wardrobe: {
          shorts: 'Hot pink with yellow question marks',
          shirt: 'Open hot-pink floral camp shirt',
          accessories: ['gold watch', 'thin gold chain'],
        },
        eyewear: {
          frames: 'broadcast yellow wayfarer-style',
          lenses: 'mirrored hot pink',
          effect: 'question-reflection',
        },
      },
      {
        id: 'exclamation-blue',
        label: 'Broadcast Exclamation',
        frame: 'full',
        weight: 4,
        rarity: 'common',
        src: 'assets/hosts/xander/v1/looks/exclamation-blue.png',
        wardrobe: {
          shorts: 'Broadcast blue with yellow exclamation points',
          shirt: 'Open coral palm camp shirt',
          accessories: ['gold watch', 'thin gold chain'],
        },
        eyewear: {
          frames: 'broadcast yellow wayfarer-style',
          lenses: 'mirrored hot pink',
          effect: 'question-reflection',
        },
      },
      {
        id: 'lightning-yellow',
        label: 'West End Lightning',
        frame: 'full',
        weight: 3,
        rarity: 'common',
        src: 'assets/hosts/xander/v1/looks/lightning-yellow.png',
        wardrobe: {
          shorts: 'Sunshine yellow with orange side lightning',
          shirt: 'Open midnight tropical camp shirt',
          accessories: ['gold watch', 'thin gold chain'],
        },
        eyewear: {
          frames: 'broadcast yellow wayfarer-style',
          lenses: 'mirrored hot pink',
          effect: 'question-reflection',
        },
      },
      {
        id: 'sunset-cyan',
        label: 'Sunset Voltage',
        frame: 'full',
        weight: 3,
        rarity: 'common',
        src: 'assets/hosts/xander/v1/looks/sunset-cyan.png',
        wardrobe: {
          shorts: 'Electric cyan with magenta sunset waves',
          shirt: 'Open black camp shirt with cyan palms',
          accessories: ['gold watch', 'thin gold chain'],
        },
        eyewear: {
          frames: 'broadcast yellow wayfarer-style',
          lenses: 'mirrored hot pink',
          effect: 'question-reflection',
        },
      },
      {
        id: 'neon-tropical-navy',
        label: 'Neon Field Notes',
        frame: 'full',
        weight: 2,
        rarity: 'common',
        src: 'assets/hosts/xander/v1/looks/neon-tropical-navy.png',
        wardrobe: {
          shorts: 'Deep navy with neon tropical linework',
          shirt: 'Open cream hibiscus camp shirt',
          accessories: ['gold watch', 'thin gold chain'],
        },
        eyewear: {
          frames: 'broadcast yellow wayfarer-style',
          lenses: 'mirrored hot pink',
          effect: 'question-reflection',
        },
      },
      {
        id: 'contour-purple',
        label: 'Purple Topography',
        frame: 'full',
        weight: 2,
        rarity: 'common',
        src: 'assets/hosts/xander/v1/looks/contour-purple.png',
        wardrobe: {
          shorts: 'Purple with turquoise contour waves and coral rings',
          shirt: 'Open deep-violet palm camp shirt',
          accessories: ['gold watch', 'gold medallion'],
        },
        eyewear: {
          frames: 'broadcast yellow wayfarer-style',
          lenses: 'mirrored hot pink',
          effect: 'question-reflection',
        },
      },
      {
        id: 'hibiscus-cream',
        label: 'Hibiscus Alibi',
        frame: 'full',
        weight: 2,
        rarity: 'common',
        src: 'assets/hosts/xander/v1/looks/hibiscus-cream.png',
        wardrobe: {
          shorts: 'Cream hibiscus with aqua wave bands',
          shirt: 'Open teal floral camp shirt',
          accessories: ['gold watch', 'shell necklace'],
        },
        eyewear: {
          frames: 'broadcast yellow wayfarer-style',
          lenses: 'mirrored hot pink',
          effect: 'question-reflection',
        },
      },
      {
        id: 'diagonal-orange',
        label: 'Diagonal Emergency',
        frame: 'full',
        weight: 2,
        rarity: 'common',
        src: 'assets/hosts/xander/v1/looks/diagonal-orange.png',
        wardrobe: {
          shorts: 'Orange-to-magenta diagonal surf graphic',
          shirt: 'Open orange-and-teal geometric camp shirt',
          accessories: ['gold watch', 'thin gold chain'],
        },
        eyewear: {
          frames: 'broadcast yellow wayfarer-style',
          lenses: 'mirrored hot pink',
          effect: 'question-reflection',
        },
      },
      {
        id: 'broadcast-grid-black',
        label: 'Broadcast Grid',
        frame: 'full',
        weight: 2,
        rarity: 'common',
        src: 'assets/hosts/xander/v1/looks/broadcast-grid-black.png',
        wardrobe: {
          shorts: 'Black abstract neon broadcast grid',
          shirt: 'Open hot-pink geometric camp shirt',
          accessories: ['gold watch', 'thin gold chain'],
        },
        eyewear: {
          frames: 'broadcast yellow wayfarer-style',
          lenses: 'mirrored hot pink',
          effect: 'question-reflection',
        },
      },
      {
        id: 'sun-wave-turquoise',
        label: 'Solar Undertow',
        frame: 'full',
        weight: 2,
        rarity: 'common',
        src: 'assets/hosts/xander/v1/looks/sun-wave-turquoise.png',
        wardrobe: {
          shorts: 'Turquoise with gold suns and indigo waves',
          shirt: 'Open coral palm camp shirt',
          accessories: ['gold watch', 'gold medallion'],
        },
        eyewear: {
          frames: 'broadcast yellow wayfarer-style',
          lenses: 'mirrored hot pink',
          effect: 'question-reflection',
        },
      },
      {
        id: 'checker-lightning-coral',
        label: 'Checkerbolt Coral',
        frame: 'full',
        weight: 2,
        rarity: 'common',
        src: 'assets/hosts/xander/v1/looks/checker-lightning-coral.png',
        wardrobe: {
          shorts: 'Coral checkerboard with cyan lightning',
          shirt: 'Open cream micro-tropical camp shirt',
          accessories: ['gold watch', 'thin gold chain'],
        },
        eyewear: {
          frames: 'broadcast yellow wayfarer-style',
          lenses: 'mirrored hot pink',
          effect: 'question-reflection',
        },
      },
      {
        id: 'question-constellation',
        label: 'Midnight Questions',
        frame: 'full',
        weight: 3,
        rarity: 'common',
        src: 'assets/hosts/xander/v1/looks/question-constellation.png',
        wardrobe: {
          shorts: 'Midnight question-mark constellation',
          shirt: 'Open deep-blue cosmic camp shirt',
          accessories: ['gold watch', 'thin gold chain'],
        },
        eyewear: {
          frames: 'broadcast yellow wayfarer-style',
          lenses: 'mirrored hot pink',
          effect: 'question-reflection',
        },
      },
    ],
  });

  return {
    AVATAR_PACK_SCHEMA,
    AVATAR_PACK_VERSION,
    AVATAR_SLOTS,
    DefaultXanderAvatarPack,
    HostAvatarError,
    normalizeHostAvatarPack,
    selectAvatarLook,
    stableHash,
  };
}));
