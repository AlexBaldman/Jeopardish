(function initPerformanceCommand(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./character-genome.js'));
  else root.UinversePerformanceCommand = factory(root.UinverseCharacterGenome);
}(typeof globalThis !== 'undefined' ? globalThis : this, function performanceCommandFactory(genomeApi) {
  'use strict';

  const PERFORMANCE_SCHEMA = 'uinverse.character-performance';
  const PERFORMANCE_VERSION = 1;
  const PERFORMANCE_KINDS = Object.freeze(['locomotion', 'action', 'reaction', 'pose', 'transition']);
  const BLEND_MODES = Object.freeze(['replace', 'additive', 'upper-body', 'facial']);

  class PerformanceCommandError extends Error {
    constructor(issues) {
      super(`Invalid PerformanceCommand: ${issues.join('; ')}`);
      this.name = 'PerformanceCommandError';
      this.issues = Object.freeze([...issues]);
    }
  }

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function cleanText(value, maxLength = 120) {
    return String(value || '').replace(/\s+/g, ' ').trim().slice(0, maxLength);
  }

  function semanticId(value) {
    return cleanText(value, 100).toLowerCase().replace(/[^a-z0-9:.-]+/g, '-').replace(/^-|-$/g, '');
  }

  function clamp01(value, fallback = 0.5) {
    const n = Number(value);
    return Number.isFinite(n) ? Math.min(1, Math.max(0, n)) : fallback;
  }

  function normalizeAttachment(input, index, issues) {
    const target = cleanText(input?.target, 100);
    if (!genomeApi.ATTACHMENT_TARGETS.includes(target) && !target.startsWith('custom:')) {
      issues.push(`attachments[${index}].target is unsupported`);
    }
    const itemId = cleanText(input?.itemId, 140);
    if (!itemId) issues.push(`attachments[${index}].itemId is required`);
    return {
      target,
      itemId,
      mode: ['hold', 'wear', 'mount', 'contact'].includes(input?.mode) ? input.mode : 'hold',
      grip: semanticId(input?.grip),
    };
  }

  function normalizePerformanceCommand(input = {}) {
    const issues = [];
    const kind = PERFORMANCE_KINDS.includes(input.kind) ? input.kind : '';
    if (!kind) issues.push('kind is unsupported');
    const action = semanticId(input.action || input.verb);
    if (!action) issues.push('action is required');
    const attachments = Array.isArray(input.attachments)
      ? input.attachments.map((item, index) => normalizeAttachment(item, index, issues))
      : [];

    const result = {
      schema: PERFORMANCE_SCHEMA,
      version: PERFORMANCE_VERSION,
      id: semanticId(input.id || `${kind || 'performance'}:${action || 'unknown'}`),
      kind,
      action,
      target: semanticId(input.target),
      loop: input.loop === true,
      durationMs: Number.isFinite(Number(input.durationMs)) ? Math.max(0, Number(input.durationMs)) : 0,
      blend: BLEND_MODES.includes(input.blend) ? input.blend : 'replace',
      modifiers: {
        intensity: clamp01(input.modifiers?.intensity, 0.5),
        speed: clamp01(input.modifiers?.speed, 0.5),
        stride: input.modifiers?.stride == null ? null : clamp01(input.modifiers.stride),
        posture: input.modifiers?.posture == null ? null : clamp01(input.modifiers.posture),
        energy: input.modifiers?.energy == null ? null : clamp01(input.modifiers.energy),
        looseness: input.modifiers?.looseness == null ? null : clamp01(input.modifiers.looseness),
        expressiveness: input.modifiers?.expressiveness == null ? null : clamp01(input.modifiers.expressiveness),
      },
      attachments,
      cues: Array.isArray(input.cues) ? input.cues.map((cue) => semanticId(cue)).filter(Boolean) : [],
      metadata: {
        source: cleanText(input.metadata?.source, 80) || 'authored',
        note: cleanText(input.metadata?.note, 240),
      },
    };

    if (issues.length) throw new PerformanceCommandError(issues);
    return deepFreeze(result);
  }

  function resolvePerformance(genomeInput, commandInput) {
    const genome = genomeInput?.schema === genomeApi.CHARACTER_SCHEMA
      ? genomeInput
      : genomeApi.normalizeCharacterGenome(genomeInput);
    const command = commandInput?.schema === PERFORMANCE_SCHEMA
      ? commandInput
      : normalizePerformanceCommand(commandInput);
    const defaults = genome.animation?.modifiers || {};
    const modifiers = {};
    ['stride', 'posture', 'energy', 'looseness', 'expressiveness'].forEach((key) => {
      modifiers[key] = command.modifiers[key] == null ? clamp01(defaults[key], 0.5) : command.modifiers[key];
    });
    modifiers.intensity = command.modifiers.intensity;
    modifiers.speed = command.modifiers.speed;

    return deepFreeze({
      ...command,
      characterId: genome.id,
      rigFamily: genome.rig.family,
      modifiers,
      semanticAttachments: command.attachments.map((attachment) => ({
        ...attachment,
        rigAnchor: genome.rig.attachments?.[attachment.target] || null,
      })),
    });
  }

  function createPerformanceSequence(items = []) {
    const commands = items.map((item) => normalizePerformanceCommand(item));
    return deepFreeze({
      schema: 'uinverse.performance-sequence',
      version: 1,
      commands,
    });
  }

  return {
    BLEND_MODES,
    PERFORMANCE_KINDS,
    PERFORMANCE_SCHEMA,
    PERFORMANCE_VERSION,
    PerformanceCommandError,
    createPerformanceSequence,
    normalizePerformanceCommand,
    resolvePerformance,
  };
}));
