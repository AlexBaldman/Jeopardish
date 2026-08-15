(function initStadiumPerformerAdapter(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(
      require('./character-genome.js'),
      require('./performance-command.js'),
    );
  } else {
    root.UinverseStadiumPerformerAdapter = factory(
      root.UinverseCharacterGenome,
      root.UinversePerformanceCommand,
    );
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function stadiumPerformerAdapterFactory(genomeApi, performanceApi) {
  'use strict';

  const STADIUM_PLAN_SCHEMA = 'uinverse.stadium-performer-plan';
  const STADIUM_PLAN_VERSION = 1;

  class StadiumPerformerError extends Error {
    constructor(issues) {
      super(`Invalid StadiumPerformerPlan: ${issues.join('; ')}`);
      this.name = 'StadiumPerformerError';
      this.issues = Object.freeze([...issues]);
    }
  }

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function resolveCommand(genome, input) {
    return input?.schema === performanceApi.PERFORMANCE_SCHEMA
      ? performanceApi.resolvePerformance(genome, input)
      : performanceApi.resolvePerformance(genome, input || {});
  }

  function validateInstrumentPerformance(command, issues) {
    if (command.kind !== 'action') issues.push('instrument performance must be an action');
    if (command.action !== 'play-instrument') issues.push('instrument performance action must be play-instrument');
    if (command.blend !== 'upper-body' && command.blend !== 'additive') {
      issues.push('instrument performance must use upper-body or additive blend');
    }
    const targets = new Set(command.semanticAttachments.map(({ target }) => target));
    if (!targets.has('left-hand')) issues.push('instrument performance requires left-hand attachment');
    if (!targets.has('right-hand')) issues.push('instrument performance requires right-hand attachment');
  }

  function buildConstraint(attachment, issues) {
    if (!attachment.rigAnchor?.bone) {
      issues.push(`missing rig anchor for ${attachment.target}`);
      return null;
    }
    return {
      type: attachment.mode === 'contact' ? 'contact' : 'attachment',
      target: attachment.target,
      bone: attachment.rigAnchor.bone,
      itemId: attachment.itemId,
      grip: attachment.grip,
      localPosition: attachment.rigAnchor.position || [0, 0, 0],
      localRotation: attachment.rigAnchor.rotation || [0, 0, 0],
    };
  }

  function buildStadiumPerformerPlan({
    genome: genomeInput,
    embodiment: embodimentIdOrKind = 'game-3d',
    locomotion,
    performance,
  } = {}) {
    const issues = [];
    const genome = genomeInput?.schema === genomeApi.CHARACTER_SCHEMA
      ? genomeInput
      : genomeApi.normalizeCharacterGenome(genomeInput || {});
    const selected = genomeApi.selectEmbodiment(genome, embodimentIdOrKind);

    if (!selected) issues.push(`unknown embodiment: ${embodimentIdOrKind}`);
    else if (selected.kind !== 'game-3d') issues.push('stadium performer requires a game-3d embodiment');
    if (genome.morphology.kind !== 'humanoid') issues.push('stadium performer v0 supports humanoid morphology only');

    let locomotionCommand = null;
    let performanceCommand = null;
    if (!issues.length) {
      locomotionCommand = resolveCommand(genome, locomotion);
      performanceCommand = resolveCommand(genome, performance);
      if (locomotionCommand.kind !== 'locomotion') issues.push('base command must be locomotion');
      if (!locomotionCommand.loop) issues.push('stadium locomotion must be loopable');
      validateInstrumentPerformance(performanceCommand, issues);
    }

    const constraints = [];
    if (performanceCommand) {
      performanceCommand.semanticAttachments.forEach((attachment) => {
        const constraint = buildConstraint(attachment, issues);
        if (constraint) constraints.push(constraint);
      });
    }

    if (issues.length) throw new StadiumPerformerError(issues);

    const instrumentIds = [...new Set(constraints.map(({ itemId }) => itemId).filter(Boolean))];
    const requiredCapabilities = ['skeletal-animation', 'layered-animation', 'root-locomotion'];
    if (constraints.length) requiredCapabilities.push('semantic-attachments');
    if (constraints.some(({ target }) => target.includes('hand'))) requiredCapabilities.push('two-hand-prop-ik');
    if (constraints.some(({ target }) => target === 'mouth')) requiredCapabilities.push('face-or-head-contact');

    return deepFreeze({
      schema: STADIUM_PLAN_SCHEMA,
      version: STADIUM_PLAN_VERSION,
      characterId: genome.id,
      embodimentId: selected.id,
      rendererHint: selected.renderer || 'three',
      modelAssetId: selected.representationAssetId,
      rigProfile: selected.rigProfile || genome.rig.family,
      layers: [
        {
          id: 'base-locomotion',
          kind: locomotionCommand.kind,
          action: locomotionCommand.action,
          blend: 'replace',
          loop: locomotionCommand.loop,
          modifiers: locomotionCommand.modifiers,
        },
        {
          id: 'upper-body-performance',
          kind: performanceCommand.kind,
          action: performanceCommand.action,
          blend: performanceCommand.blend,
          loop: performanceCommand.loop,
          modifiers: performanceCommand.modifiers,
        },
      ],
      props: instrumentIds.map((itemId) => ({ itemId, role: 'instrument' })),
      constraints,
      requiredCapabilities: [...new Set(requiredCapabilities)],
    });
  }

  function createStadiumPerformerAdapter(options = {}) {
    return {
      id: options.id || 'stadium-performer-v0',
      canHandle({ genome, embodiment }) {
        return genome.morphology.kind === 'humanoid' && embodiment.kind === 'game-3d';
      },
      async build({ genome, embodiment, context = {} }) {
        const plan = buildStadiumPerformerPlan({
          genome,
          embodiment: embodiment.id,
          locomotion: context.locomotion,
          performance: context.performance,
        });
        return Object.freeze({
          status: 'ready',
          adapter: options.id || 'stadium-performer-v0',
          characterId: genome.id,
          embodimentId: embodiment.id,
          plan,
        });
      },
    };
  }

  return {
    STADIUM_PLAN_SCHEMA,
    STADIUM_PLAN_VERSION,
    StadiumPerformerError,
    buildStadiumPerformerPlan,
    createStadiumPerformerAdapter,
  };
}));
