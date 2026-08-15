(function initCharacterHostAvatarAdapter(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('./character-genome.js'),
      require('../host/host-avatar.js'),
    );
  } else {
    root.UinverseCharacterHostAvatarAdapter = factory(
      root.UinverseCharacterGenome,
      root.JeoPARODYHostAvatar,
    );
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function characterHostAvatarAdapterFactory(genomeApi, hostAvatarApi) {
  'use strict';

  const SUPPORTED_KINDS = Object.freeze(['pixel', 'sprite-2d', 'portrait']);

  function wardrobeLabel(item) {
    if (!item) return '';
    return [item.assetId, item.variant, item.materialPreset].filter(Boolean).join(' · ');
  }

  function accessoryLabels(wardrobe) {
    return Object.entries(wardrobe?.slots || {})
      .filter(([slot]) => ['head', 'face', 'eyes', 'ears', 'neck', 'hands', 'waist', 'back', 'left-hand', 'right-hand'].includes(slot))
      .map(([slot, item]) => `${slot}: ${wardrobeLabel(item)}`)
      .filter(Boolean);
  }

  function buildPerformanceInventory(genome, embodiment) {
    return [...new Set([
      'idle',
      genome.animation.locomotionSet,
      ...genome.animation.performanceSets,
      ...embodiment.animationSet,
    ].filter(Boolean))].map((id) => ({
      id: String(id).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'idle',
      label: String(id).replace(/[-_]+/g, ' '),
      status: 'runtime',
    }));
  }

  function toHostAvatarPack(genomeInput, embodimentIdOrKind, options = {}) {
    const genome = genomeInput?.schema
      ? genomeInput
      : genomeApi.normalizeCharacterGenome(genomeInput);
    const embodiment = genomeApi.selectEmbodiment(genome, embodimentIdOrKind);
    if (!embodiment) throw new Error(`Unknown embodiment: ${embodimentIdOrKind}`);
    if (!SUPPORTED_KINDS.includes(embodiment.kind)) {
      throw new Error(`HostAvatar adapter does not support embodiment kind: ${embodiment.kind}`);
    }
    if (!embodiment.representationAssetId.startsWith('assets/')) {
      throw new Error('HostAvatar embodiments require a project-local assets/ representation');
    }

    const shirt = genome.wardrobe.slots.shirt || genome.wardrobe.slots.outerwear;
    const legs = genome.wardrobe.slots.legs || genome.wardrobe.slots.waist;
    const lookId = options.lookId || embodiment.id;
    const performancePoses = buildPerformanceInventory(genome, embodiment);

    return hostAvatarApi.normalizeHostAvatarPack({
      id: options.packId || `${genome.id}-${embodiment.id}`,
      hostId: options.hostId || genome.id,
      displayName: options.displayName || genome.displayName,
      style: {
        family: options.styleFamily || genome.appearance.materialProfile || 'CharacterGenome embodiment',
        pixelScale: options.pixelScale || (embodiment.kind === 'pixel' ? 'character-genome-pixel' : 'character-genome-sprite'),
        paletteId: options.paletteId || genome.appearance.skinProfile || '',
      },
      slots: options.slots,
      anchors: options.anchors,
      creation: {
        editable: true,
        source: genome.provenance.source,
        modelFamily: genome.provenance.generator,
        promptVersion: genome.provenance.generatorVersion,
        sourceAsset: embodiment.representationAssetId,
      },
      rights: genome.rights,
      inventory: {
        boardShorts: options.boardShorts || [],
        specialLooks: options.specialLooks || [],
        performancePoses,
      },
      looks: [{
        id: lookId,
        label: options.lookLabel || genome.displayName,
        frame: options.frame || 'full',
        weight: options.weight || 1,
        rarity: options.rarity || 'signature',
        src: embodiment.representationAssetId,
        wardrobe: {
          shorts: wardrobeLabel(legs),
          shirt: wardrobeLabel(shirt),
          accessories: accessoryLabels(genome.wardrobe),
        },
        eyewear: options.eyewear || {},
      }],
    });
  }

  function createHostAvatarAdapter(options = {}) {
    return {
      id: options.id || 'jeoparody-host-avatar',
      canHandle({ embodiment }) {
        return SUPPORTED_KINDS.includes(embodiment.kind)
          && embodiment.representationAssetId.startsWith('assets/');
      },
      async build({ genome, embodiment, context }) {
        const pack = toHostAvatarPack(genome, embodiment.id, context?.hostAvatar || options);
        return Object.freeze({
          status: 'ready',
          adapter: options.id || 'jeoparody-host-avatar',
          characterId: genome.id,
          embodimentId: embodiment.id,
          hostAvatarPack: pack,
        });
      },
    };
  }

  return {
    SUPPORTED_KINDS,
    createHostAvatarAdapter,
    toHostAvatarPack,
  };
}));
