(function initCharacterGenome(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.UinverseCharacterGenome = factory();
}(typeof globalThis !== 'undefined' ? globalThis : this, function characterGenomeFactory() {
  'use strict';

  const CHARACTER_SCHEMA = 'uinverse.character-genome';
  const CHARACTER_VERSION = 1;
  const EMBODIMENT_KINDS = Object.freeze(['game-3d','sprite-2d','pixel','portrait','desktop-companion']);
  const BODY_KINDS = Object.freeze(['humanoid','quadruped','custom']);
  const WARDROBE_SLOTS = Object.freeze(['head','hair','face','eyes','ears','neck','undershirt','shirt','outerwear','hands','waist','legs','feet','back','left-hand','right-hand']);
  const ATTACHMENT_TARGETS = Object.freeze(['head','mouth','chest','back','left-hand','right-hand','left-foot','right-foot','tail-base']);

  class CharacterGenomeError extends Error {
    constructor(issues) {
      super(`Invalid CharacterGenome: ${issues.join('; ')}`);
      this.name = 'CharacterGenomeError';
      this.issues = Object.freeze([...issues]);
    }
  }

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function cleanText(value, maxLength = 180) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
  }

  function clamp01(value, fallback = 0.5) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;
  }

  function confidenceValue(input, fallback = 0.5) {
    if (input && typeof input === 'object' && 'value' in input) {
      return { value: Number(input.value) || 0, confidence: clamp01(input.confidence, 1), source: cleanText(input.source, 80) || 'authored' };
    }
    return { value: Number(input ?? fallback) || 0, confidence: 1, source: 'authored' };
  }

  function normalizeMorphology(input = {}) {
    const kind = BODY_KINDS.includes(input.kind) ? input.kind : 'humanoid';
    const proportions = {};
    Object.entries(input.proportions || {}).forEach(([key, value]) => {
      if (/^[a-z][a-zA-Z0-9]*$/.test(key)) proportions[key] = confidenceValue(value);
    });
    return {
      kind,
      species: cleanText(input.species, 100) || (kind === 'humanoid' ? 'human' : 'unspecified'),
      heightMeters: confidenceValue(input.heightMeters, kind === 'quadruped' ? 0.35 : 1.75),
      proportions,
    };
  }

  function normalizeFace(input = {}) {
    const parameters = {};
    Object.entries(input.parameters || {}).forEach(([key, value]) => {
      if (/^[a-z][a-zA-Z0-9]*$/.test(key)) parameters[key] = confidenceValue(value);
    });
    return {
      topology: cleanText(input.topology, 80) || 'generic',
      parameters,
      sourceCapture: {
        mode: ['none','single-photo','multi-photo','video','depth-scan'].includes(input.sourceCapture?.mode) ? input.sourceCapture.mode : 'none',
        assetIds: Array.isArray(input.sourceCapture?.assetIds) ? input.sourceCapture.assetIds.map((id) => cleanText(id, 120)).filter(Boolean) : [],
      },
    };
  }

  function normalizeWardrobe(input = {}, issues) {
    const slots = {};
    Object.entries(input.slots || {}).forEach(([slot, item]) => {
      if (!WARDROBE_SLOTS.includes(slot)) {
        issues.push(`wardrobe.slots.${slot} is not supported`);
        return;
      }
      if (!item) return;
      slots[slot] = {
        assetId: cleanText(item.assetId || item, 140),
        variant: cleanText(item.variant, 100),
        materialPreset: cleanText(item.materialPreset, 100),
      };
    });
    return {
      slots,
      overlays: Array.isArray(input.overlays) ? input.overlays.map((item) => ({
        assetId: cleanText(item.assetId, 140),
        kind: cleanText(item.kind, 80),
        region: cleanText(item.region, 80),
      })).filter((item) => item.assetId) : [],
    };
  }

  function normalizeRig(input = {}, morphologyKind, issues) {
    const attachments = {};
    Object.entries(input.attachments || {}).forEach(([key, value]) => {
      if (!ATTACHMENT_TARGETS.includes(key) && !key.startsWith('custom:')) {
        issues.push(`rig.attachments.${key} is not a supported target`);
        return;
      }
      attachments[key] = {
        bone: cleanText(value?.bone, 120),
        position: Array.isArray(value?.position) ? value.position.slice(0, 3).map((n) => Number(n) || 0) : [0,0,0],
        rotation: Array.isArray(value?.rotation) ? value.rotation.slice(0, 3).map((n) => Number(n) || 0) : [0,0,0],
      };
    });
    return {
      family: cleanText(input.family, 100) || (morphologyKind === 'humanoid' ? 'humanoid-v1' : `${morphologyKind}-v1`),
      retargetProfile: cleanText(input.retargetProfile, 100),
      attachments,
      ikChains: Array.isArray(input.ikChains) ? input.ikChains.map((chain) => ({
        id: cleanText(chain.id, 80),
        root: cleanText(chain.root, 100),
        tip: cleanText(chain.tip, 100),
        target: cleanText(chain.target, 100),
      })).filter((chain) => chain.id && chain.root && chain.tip) : [],
    };
  }

  function normalizeAnimation(input = {}) {
    return {
      locomotionSet: cleanText(input.locomotionSet, 120) || 'default',
      performanceSets: Array.isArray(input.performanceSets) ? [...new Set(input.performanceSets.map((v) => cleanText(v, 120)).filter(Boolean))] : [],
      facialProfile: cleanText(input.facialProfile, 100),
      modifiers: {
        stride: clamp01(input.modifiers?.stride, 0.5),
        posture: clamp01(input.modifiers?.posture, 0.5),
        energy: clamp01(input.modifiers?.energy, 0.5),
        looseness: clamp01(input.modifiers?.looseness, 0.5),
        expressiveness: clamp01(input.modifiers?.expressiveness, 0.5),
      },
    };
  }

  function normalizeEmbodiment(item, index, issues) {
    const id = cleanText(item?.id, 100);
    if (!id || !/^[a-z0-9-]+$/.test(id)) issues.push(`embodiments[${index}].id must be kebab-case`);
    const kind = EMBODIMENT_KINDS.includes(item?.kind) ? item.kind : '';
    if (!kind) issues.push(`embodiments[${index}].kind is unsupported`);
    return {
      id,
      kind,
      renderer: cleanText(item?.renderer, 80) || (kind === 'game-3d' ? 'three' : 'sprite'),
      representationAssetId: cleanText(item?.representationAssetId, 140),
      rigProfile: cleanText(item?.rigProfile, 120),
      animationSet: Array.isArray(item?.animationSet) ? [...new Set(item.animationSet.map((v) => cleanText(v, 100)).filter(Boolean))] : [],
      interactionProfile: cleanText(item?.interactionProfile, 100),
      scale: Number.isFinite(Number(item?.scale)) ? Number(item.scale) : 1,
      adapter: cleanText(item?.adapter, 100),
    };
  }

  function normalizeCharacterGenome(input = {}) {
    const issues = [];
    const id = cleanText(input.id, 100);
    const displayName = cleanText(input.displayName, 140);
    if (!id || !/^[a-z0-9-]+$/.test(id)) issues.push('id must be kebab-case');
    if (!displayName) issues.push('displayName is required');

    const morphology = normalizeMorphology(input.morphology);
    const embodiments = Array.isArray(input.embodiments)
      ? input.embodiments.map((item, index) => normalizeEmbodiment(item, index, issues))
      : [];
    if (!embodiments.length) issues.push('embodiments requires at least one embodiment');
    if (new Set(embodiments.map((item) => item.id)).size !== embodiments.length) issues.push('embodiment ids must be unique');

    const result = {
      schema: CHARACTER_SCHEMA,
      version: CHARACTER_VERSION,
      id,
      displayName,
      identity: {
        archetype: cleanText(input.identity?.archetype, 120),
        tags: Array.isArray(input.identity?.tags) ? [...new Set(input.identity.tags.map((v) => cleanText(v, 80)).filter(Boolean))] : [],
      },
      morphology,
      face: normalizeFace(input.face),
      appearance: {
        skinProfile: cleanText(input.appearance?.skinProfile, 120),
        hairProfile: cleanText(input.appearance?.hairProfile, 120),
        eyeProfile: cleanText(input.appearance?.eyeProfile, 120),
        materialProfile: cleanText(input.appearance?.materialProfile, 120),
      },
      wardrobe: normalizeWardrobe(input.wardrobe, issues),
      rig: normalizeRig(input.rig, morphology.kind, issues),
      animation: normalizeAnimation(input.animation),
      personality: Object.fromEntries(Object.entries(input.personality || {}).filter(([key]) => /^[a-z][a-zA-Z0-9]*$/.test(key)).map(([key, value]) => [key, clamp01(value, 0.5)])),
      embodiments,
      provenance: {
        source: cleanText(input.provenance?.source, 100) || 'authored',
        sourceAssetIds: Array.isArray(input.provenance?.sourceAssetIds) ? input.provenance.sourceAssetIds.map((v) => cleanText(v, 140)).filter(Boolean) : [],
        generator: cleanText(input.provenance?.generator, 120),
        generatorVersion: cleanText(input.provenance?.generatorVersion, 80),
      },
      rights: {
        status: cleanText(input.rights?.status, 100) || 'review-required',
        notes: cleanText(input.rights?.notes, 300),
      },
    };

    if (issues.length) throw new CharacterGenomeError(issues);
    return deepFreeze(result);
  }

  function selectEmbodiment(genome, idOrKind) {
    return genome.embodiments.find((item) => item.id === idOrKind)
      || genome.embodiments.find((item) => item.kind === idOrKind)
      || null;
  }

  function withWardrobe(genome, patch = {}) {
    const source = JSON.parse(JSON.stringify(genome));
    delete source.schema;
    delete source.version;
    source.wardrobe = source.wardrobe || { slots: {}, overlays: [] };
    source.wardrobe.slots = { ...source.wardrobe.slots, ...(patch.slots || {}) };
    if (Array.isArray(patch.overlays)) source.wardrobe.overlays = patch.overlays;
    return normalizeCharacterGenome(source);
  }

  return {
    ATTACHMENT_TARGETS,
    BODY_KINDS,
    CHARACTER_SCHEMA,
    CHARACTER_VERSION,
    CharacterGenomeError,
    EMBODIMENT_KINDS,
    WARDROBE_SLOTS,
    normalizeCharacterGenome,
    selectEmbodiment,
    withWardrobe,
  };
}));
