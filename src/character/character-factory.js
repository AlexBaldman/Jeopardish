(function initCharacterFactory(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./character-genome.js'));
  else root.UinverseCharacterFactory = factory(root.UinverseCharacterGenome);
}(typeof globalThis !== 'undefined' ? globalThis : this, function characterFactoryModule(genomeApi) {
  'use strict';

  const { normalizeCharacterGenome, selectEmbodiment } = genomeApi;

  class CharacterFactory {
    constructor({ adapters = [] } = {}) {
      this.adapters = new Map();
      adapters.forEach((adapter) => this.registerAdapter(adapter));
    }

    registerAdapter(adapter) {
      if (!adapter || typeof adapter.id !== 'string' || typeof adapter.canHandle !== 'function' || typeof adapter.build !== 'function') {
        throw new TypeError('Character adapter requires id, canHandle(), and build()');
      }
      this.adapters.set(adapter.id, adapter);
      return this;
    }

    create(input) {
      return normalizeCharacterGenome(input);
    }

    async embody(genomeInput, idOrKind, context = {}) {
      const genome = genomeInput?.schema ? genomeInput : normalizeCharacterGenome(genomeInput);
      const embodiment = selectEmbodiment(genome, idOrKind);
      if (!embodiment) throw new Error(`Unknown embodiment: ${idOrKind}`);
      const candidates = embodiment.adapter
        ? [this.adapters.get(embodiment.adapter)].filter(Boolean)
        : [...this.adapters.values()].filter((adapter) => adapter.canHandle({ genome, embodiment, context }));
      const adapter = candidates[0];
      if (!adapter) return { genome, embodiment, status: 'unresolved', reason: 'no-adapter' };
      return adapter.build({ genome, embodiment, context });
    }
  }

  function createDescriptorAdapter({ id, kinds = [] }) {
    return {
      id,
      canHandle({ embodiment }) { return kinds.includes(embodiment.kind); },
      async build({ genome, embodiment }) {
        return Object.freeze({
          status: 'ready',
          adapter: id,
          characterId: genome.id,
          embodimentId: embodiment.id,
          kind: embodiment.kind,
          renderer: embodiment.renderer,
          representationAssetId: embodiment.representationAssetId,
          rigProfile: embodiment.rigProfile || genome.rig.family,
          animationSet: embodiment.animationSet.length ? embodiment.animationSet : [genome.animation.locomotionSet, ...genome.animation.performanceSets],
          wardrobe: genome.wardrobe,
          attachments: genome.rig.attachments,
        });
      },
    };
  }

  return { CharacterFactory, createDescriptorAdapter };
}));
