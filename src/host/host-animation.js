(function initHostAnimation(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYHostAnimation = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function hostAnimationFactory() {
  'use strict';

  const HOST_ANIMATION_PACK_SCHEMA = 'jeoparody.host-animation';
  const HOST_ANIMATION_PACK_VERSION = 1;
  const HOST_ANIMATION_SELECTION_SCHEMA = 'jeoparody.host-animation-selection';
  const HOST_ANIMATION_SELECTION_VERSION = 1;
  const HostAnimationPoses = Object.freeze([
    'idle',
    'clue',
    'listening',
    'correct',
    'incorrect',
    'reveal',
    'study-coach',
    'streak',
  ]);
  const RendererKinds = Object.freeze(['css', 'sprite']);
  const ReducedMotionModes = Object.freeze(['static', 'shorten']);

  class HostAnimationError extends Error {
    constructor(issues) {
      super(`Invalid HostAnimationPack: ${issues.join('; ')}`);
      this.name = 'HostAnimationError';
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

  function stableHash(value) {
    let hash = 2166136261;
    const text = String(value || '');
    for (let index = 0; index < text.length; index += 1) {
      hash ^= text.charCodeAt(index);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function normalizeIdentifier(value, path, issues) {
    const id = cleanText(value, 100);
    if (!id || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
      issues.push(`${path} must be kebab-case`);
    }
    return id;
  }

  function normalizeWeight(value) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? Math.max(1, Math.min(100, Math.round(parsed))) : 1;
  }

  function normalizeDuration(value, path, issues, fallback = 0) {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) return fallback;
    if (parsed < 0 || parsed > 60000) {
      issues.push(`${path} must be between 0 and 60000`);
      return fallback;
    }
    return Math.round(parsed);
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

  function normalizeCssRenderer(input, path, issues) {
    if (!input || typeof input !== 'object') return null;
    const animationName = normalizeIdentifier(input.animationName, `${path}.animationName`, issues);
    const className = cleanText(input.className, 160);
    if (className && !/^[a-zA-Z][a-zA-Z0-9_-]*$/.test(className)) {
      issues.push(`${path}.className must be a CSS class token`);
    }
    return { kind: 'css', animationName, className };
  }

  function normalizeSpriteRenderer(input, path, issues) {
    if (!input || typeof input !== 'object') return null;
    const asset = normalizeAssetPath(input.asset, `${path}.asset`, issues);
    const frames = Math.round(Number(input.frames));
    const fps = Math.round(Number(input.fps));
    if (!Number.isInteger(frames) || frames < 1 || frames > 240) {
      issues.push(`${path}.frames must be between 1 and 240`);
    }
    if (!Number.isInteger(fps) || fps < 1 || fps > 120) {
      issues.push(`${path}.fps must be between 1 and 120`);
    }
    return {
      kind: 'sprite',
      asset,
      frames: Number.isInteger(frames) ? Math.min(240, Math.max(1, frames)) : 1,
      fps: Number.isInteger(fps) ? Math.min(120, Math.max(1, fps)) : 1,
    };
  }

  function normalizeRenderers(input, path, issues) {
    const source = input && typeof input === 'object' ? input : {};
    const renderers = [];
    const css = normalizeCssRenderer(source.css, `${path}.css`, issues);
    const sprite = normalizeSpriteRenderer(source.sprite, `${path}.sprite`, issues);
    if (css) renderers.push(css);
    if (sprite) renderers.push(sprite);
    if (renderers.length === 0) issues.push(`${path} requires a css or sprite renderer`);
    return renderers;
  }

  function normalizeCues(input, durationMs, path, issues) {
    const source = Array.isArray(input) ? input : [];
    const cues = source.map((cue, index) => {
      const cuePath = `${path}[${index}]`;
      const atMs = normalizeDuration(cue?.atMs, `${cuePath}.atMs`, issues);
      const name = normalizeIdentifier(cue?.name, `${cuePath}.name`, issues);
      if (atMs > durationMs) issues.push(`${cuePath}.atMs must not exceed the clip duration`);
      return { atMs: Math.min(atMs, durationMs), name };
    }).sort((left, right) => left.atMs - right.atMs || left.name.localeCompare(right.name));
    if (cues.length === 0) {
      return [{ atMs: 0, name: 'enter' }, { atMs: durationMs, name: 'settle' }];
    }
    return cues;
  }

  function normalizeReducedMotion(input, durationMs, path, issues) {
    const source = input && typeof input === 'object' ? input : {};
    const mode = ReducedMotionModes.includes(source.mode) ? source.mode : 'static';
    const shortenedDuration = mode === 'shorten'
      ? normalizeDuration(source.durationMs, `${path}.durationMs`, issues, Math.min(durationMs, 150))
      : 0;
    if (mode === 'shorten' && shortenedDuration > durationMs) {
      issues.push(`${path}.durationMs must not exceed the clip duration`);
    }
    return {
      mode,
      durationMs: mode === 'shorten' ? Math.min(shortenedDuration, durationMs) : 0,
    };
  }

  function normalizeVariant(input, clipPath, index, issues) {
    const path = `${clipPath}.variants[${index}]`;
    return {
      id: normalizeIdentifier(input?.id || `variant-${index + 1}`, `${path}.id`, issues),
      label: cleanText(input?.label, 140) || `Variant ${index + 1}`,
      weight: normalizeWeight(input?.weight),
      renderers: normalizeRenderers(input?.renderers, `${path}.renderers`, issues),
    };
  }

  function normalizeClip(input, pose, index, issues) {
    const path = `poses.${pose}.clips[${index}]`;
    const durationMs = normalizeDuration(input?.durationMs, `${path}.durationMs`, issues, 0);
    const variants = Array.isArray(input?.variants) && input.variants.length > 0
      ? input.variants.map((variant, variantIndex) => normalizeVariant(variant, path, variantIndex, issues))
      : [normalizeVariant({ id: 'default', renderers: input?.renderers }, path, 0, issues)];
    if (new Set(variants.map(({ id }) => id)).size !== variants.length) {
      issues.push(`${path}.variants ids must be unique`);
    }
    return {
      id: normalizeIdentifier(input?.id, `${path}.id`, issues),
      label: cleanText(input?.label, 140) || `Clip ${index + 1}`,
      weight: normalizeWeight(input?.weight),
      durationMs,
      loop: input?.loop === true,
      cues: normalizeCues(input?.cues, durationMs, `${path}.cues`, issues),
      reducedMotion: normalizeReducedMotion(input?.reducedMotion, durationMs, `${path}.reducedMotion`, issues),
      variants,
    };
  }

  function normalizePose(input, pose, issues) {
    const source = input && typeof input === 'object' ? input : {};
    const clips = Array.isArray(source.clips)
      ? source.clips.map((clip, index) => normalizeClip(clip, pose, index, issues))
      : [];
    if (new Set(clips.map(({ id }) => id)).size !== clips.length) {
      issues.push(`poses.${pose}.clips ids must be unique`);
    }
    return {
      label: cleanText(source.label, 140) || pose,
      clips,
    };
  }

  function normalizeHostAnimationPack(input = {}) {
    const issues = [];
    const schema = cleanText(input.schema || HOST_ANIMATION_PACK_SCHEMA, 120);
    const version = Number(input.version ?? HOST_ANIMATION_PACK_VERSION);
    if (schema !== HOST_ANIMATION_PACK_SCHEMA) issues.push(`schema must be ${HOST_ANIMATION_PACK_SCHEMA}`);
    if (version !== HOST_ANIMATION_PACK_VERSION) issues.push(`version must be ${HOST_ANIMATION_PACK_VERSION}`);
    const id = normalizeIdentifier(input.id, 'id', issues);
    const hostId = normalizeIdentifier(input.hostId, 'hostId', issues);
    const displayName = cleanText(input.displayName, 140);
    if (!displayName) issues.push('displayName is required');
    const sourcePoses = input.poses && typeof input.poses === 'object' ? input.poses : {};
    const unknownPoses = Object.keys(sourcePoses).filter((pose) => !HostAnimationPoses.includes(pose));
    if (unknownPoses.length) issues.push(`poses contains unsupported pose ids: ${unknownPoses.join(', ')}`);
    const poses = Object.fromEntries(HostAnimationPoses.map((pose) => [
      pose,
      normalizePose(sourcePoses[pose], pose, issues),
    ]));
    if (poses.idle.clips.length === 0) issues.push('poses.idle requires at least one clip');
    if (issues.length) throw new HostAnimationError(issues);
    return deepFreeze({
      schema: HOST_ANIMATION_PACK_SCHEMA,
      version: HOST_ANIMATION_PACK_VERSION,
      id,
      hostId,
      displayName,
      poses,
    });
  }

  function selectWeighted(items, seed, previousId = '') {
    if (!Array.isArray(items) || items.length === 0) return null;
    const candidates = items.length > 1 && previousId
      ? items.filter(({ id }) => id !== previousId)
      : items;
    const available = candidates.length > 0 ? candidates : items;
    const totalWeight = available.reduce((total, item) => total + item.weight, 0);
    let ticket = stableHash(seed) % totalWeight;
    for (const item of available) {
      if (ticket < item.weight) return item;
      ticket -= item.weight;
    }
    return available[0];
  }

  function resolveReducedMotion({ preference = 'system', systemReducedMotion = false } = {}) {
    const normalizedPreference = preference === true ? 'reduce'
      : preference === false ? 'full'
        : ['system', 'reduce', 'full'].includes(preference) ? preference : 'system';
    const reducedMotion = normalizedPreference === 'reduce'
      || (normalizedPreference === 'system' && Boolean(systemReducedMotion));
    return deepFreeze({
      preference: normalizedPreference,
      source: normalizedPreference === 'system' ? 'system' : 'explicit',
      reducedMotion,
    });
  }

  function buildTimeline(clip, reducedMotion) {
    if (!reducedMotion) {
      return deepFreeze({
        durationMs: clip.durationMs,
        loop: clip.loop,
        cues: clip.cues.map((cue) => ({ ...cue })),
      });
    }
    if (clip.reducedMotion.mode === 'shorten') {
      const ratio = clip.durationMs > 0 ? clip.reducedMotion.durationMs / clip.durationMs : 0;
      return deepFreeze({
        durationMs: clip.reducedMotion.durationMs,
        loop: false,
        cues: clip.cues.map((cue) => ({
          atMs: Math.min(clip.reducedMotion.durationMs, Math.round(cue.atMs * ratio)),
          name: cue.name,
        })),
      });
    }
    return deepFreeze({
      durationMs: 0,
      loop: false,
      cues: [{ atMs: 0, name: 'settle' }],
    });
  }

  function selectHostAnimation(pack, {
    pose = 'idle',
    seed = 'host-animation',
    previousClipId = '',
    previousVariantId = '',
    motion = {},
  } = {}) {
    const requestedPoseInput = cleanText(pose, 100) || 'idle';
    const requestedPose = HostAnimationPoses.includes(requestedPoseInput) ? requestedPoseInput : 'idle';
    const requestedClips = pack?.poses?.[requestedPose]?.clips || [];
    const resolvedPose = requestedClips.length > 0 ? requestedPose : 'idle';
    const clips = pack?.poses?.[resolvedPose]?.clips || [];
    const clip = selectWeighted(clips, `${pack?.id || 'fallback'}:${resolvedPose}:${seed}`, previousClipId);
    if (!clip) {
      return deepFreeze({
        schema: HOST_ANIMATION_SELECTION_SCHEMA,
        version: HOST_ANIMATION_SELECTION_VERSION,
        packId: cleanText(pack?.id, 100),
        requestedPose: requestedPoseInput,
        pose: 'idle',
        fallback: 'static',
        clip: null,
        variant: null,
        motion: resolveReducedMotion(motion),
        timeline: { durationMs: 0, loop: false, cues: [{ atMs: 0, name: 'settle' }] },
      });
    }
    const variant = selectWeighted(
      clip.variants,
      `${pack.id}:${resolvedPose}:${clip.id}:${seed}`,
      previousVariantId,
    );
    const resolvedMotion = resolveReducedMotion(motion);
    const selectedMotion = deepFreeze({
      ...resolvedMotion,
      mode: resolvedMotion.reducedMotion ? clip.reducedMotion.mode : 'full',
    });
    const fallback = requestedPose !== requestedPoseInput ? 'unknown-pose'
      : resolvedPose !== requestedPose ? 'idle-pose'
        : '';
    return deepFreeze({
      schema: HOST_ANIMATION_SELECTION_SCHEMA,
      version: HOST_ANIMATION_SELECTION_VERSION,
      packId: pack.id,
      requestedPose: requestedPoseInput,
      pose: resolvedPose,
      fallback,
      clip: {
        id: clip.id,
        label: clip.label,
        renderers: variant.renderers,
      },
      variant: {
        id: variant.id,
        label: variant.label,
      },
      motion: selectedMotion,
      timeline: buildTimeline(clip, selectedMotion.reducedMotion),
    });
  }

  const DefaultXanderHostAnimationPack = normalizeHostAnimationPack({
    id: 'xander-surf-motion-v1',
    hostId: 'xander-trefleck',
    displayName: 'Xander Surf Motion',
    poses: {
      idle: {
        label: 'Idle deadpan',
        clips: [
          {
            id: 'idle-breathe', label: 'Broadcast breathe', weight: 3, durationMs: 1800, loop: true,
            cues: [{ atMs: 0, name: 'enter' }, { atMs: 900, name: 'breathe' }],
            renderers: { css: { animationName: 'host-idle-breathe', className: 'host-animation-idle' } },
          },
          {
            id: 'idle-glance', label: 'Measured glance', weight: 1, durationMs: 1400, loop: true,
            cues: [{ atMs: 0, name: 'enter' }, { atMs: 700, name: 'glance' }],
            renderers: { css: { animationName: 'host-idle-glance', className: 'host-animation-idle' } },
          },
        ],
      },
      clue: {
        label: 'Clue presentation',
        clips: [{
          id: 'clue-lean-in', label: 'Lean in', durationMs: 520,
          cues: [{ atMs: 0, name: 'enter' }, { atMs: 240, name: 'accent' }, { atMs: 520, name: 'settle' }],
          reducedMotion: { mode: 'shorten', durationMs: 120 },
          renderers: { css: { animationName: 'host-clue-lean-in', className: 'host-animation-clue' } },
        }],
      },
      listening: { label: 'Listening', clips: [{ id: 'listening-hold', label: 'Listening hold', durationMs: 900, loop: true, renderers: { css: { animationName: 'host-listening-hold', className: 'host-animation-listening' } } }] },
      correct: { label: 'Correct-answer delight', clips: [{ id: 'correct-pop', label: 'Approval pop', durationMs: 460, cues: [{ atMs: 0, name: 'enter' }, { atMs: 180, name: 'accent' }, { atMs: 460, name: 'settle' }], renderers: { css: { animationName: 'host-correct-pop', className: 'host-animation-correct' } } }] },
      incorrect: { label: 'Incorrect-answer deadpan', clips: [{ id: 'incorrect-pause', label: 'Deadpan pause', durationMs: 620, cues: [{ atMs: 0, name: 'enter' }, { atMs: 310, name: 'accent' }, { atMs: 620, name: 'settle' }], renderers: { css: { animationName: 'host-incorrect-pause', className: 'host-animation-incorrect' } } }] },
      reveal: { label: 'Answer reveal', clips: [{ id: 'reveal-drop', label: 'Truth drop', durationMs: 560, cues: [{ atMs: 0, name: 'enter' }, { atMs: 260, name: 'accent' }, { atMs: 560, name: 'settle' }], renderers: { css: { animationName: 'host-reveal-drop', className: 'host-animation-reveal' } } }] },
      'study-coach': { label: 'Study coach', clips: [{ id: 'study-nod', label: 'Coach nod', durationMs: 480, cues: [{ atMs: 0, name: 'enter' }, { atMs: 240, name: 'accent' }, { atMs: 480, name: 'settle' }], renderers: { css: { animationName: 'host-study-nod', className: 'host-animation-study-coach' } } }] },
      streak: { label: 'Streak finale', clips: [{ id: 'streak-celebrate', label: 'Streak celebration', durationMs: 720, cues: [{ atMs: 0, name: 'enter' }, { atMs: 320, name: 'accent' }, { atMs: 720, name: 'settle' }], renderers: { css: { animationName: 'host-streak-celebrate', className: 'host-animation-streak' } } }] },
    },
  });

  return {
    DefaultXanderHostAnimationPack,
    HOST_ANIMATION_PACK_SCHEMA,
    HOST_ANIMATION_PACK_VERSION,
    HOST_ANIMATION_SELECTION_SCHEMA,
    HOST_ANIMATION_SELECTION_VERSION,
    HostAnimationError,
    HostAnimationPoses,
    ReducedMotionModes,
    RendererKinds,
    normalizeHostAnimationPack,
    resolveReducedMotion,
    selectHostAnimation,
    stableHash,
  };
}));
