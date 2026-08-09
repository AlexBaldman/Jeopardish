(function initDialogueAnchor(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYDialogueAnchor = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function dialogueAnchorFactory() {
  'use strict';

  const DIALOGUE_ANCHOR_SCHEMA = 'jeoparody.dialogue-anchor';
  const DIALOGUE_ANCHOR_VERSION = 1;
  const DialogueAnchorRegions = Object.freeze(['left', 'center', 'right']);
  const DEFAULT_EDGE_INSET_PX = 32;
  const DEFAULT_TRANSITION_MS = 180;

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function finiteNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function round(value) {
    return Math.round(finiteNumber(value) * 1000) / 1000;
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, value));
  }

  // Accepts plain rectangles and DOMRect-shaped snapshots without depending on the DOM.
  function normalizeRect(input) {
    const source = input && typeof input === 'object' ? input : {};
    const rawLeft = Number.isFinite(Number(source.left)) ? Number(source.left) : Number(source.x);
    const rawTop = Number.isFinite(Number(source.top)) ? Number(source.top) : Number(source.y);
    const left = Number.isFinite(rawLeft) ? rawLeft : 0;
    const top = Number.isFinite(rawTop) ? rawTop : 0;
    const explicitWidth = Number(source.width);
    const explicitHeight = Number(source.height);
    const derivedWidth = Number(source.right) - left;
    const derivedHeight = Number(source.bottom) - top;
    const width = Number.isFinite(explicitWidth) ? explicitWidth : derivedWidth;
    const height = Number.isFinite(explicitHeight) ? explicitHeight : derivedHeight;
    const valid = Number.isFinite(rawLeft) && Number.isFinite(rawTop)
      && Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0;

    if (!valid) {
      return deepFreeze({
        left: 0, top: 0, right: 0, bottom: 0, width: 0, height: 0, valid: false,
      });
    }

    return deepFreeze({
      left: round(left),
      top: round(top),
      right: round(left + width),
      bottom: round(top + height),
      width: round(width),
      height: round(height),
      valid: true,
    });
  }

  function classifyRegion(ratio) {
    if (ratio < (1 / 3)) return 'left';
    if (ratio > (2 / 3)) return 'right';
    return 'center';
  }

  function formatPx(value) {
    return `${round(value)}px`;
  }

  function formatPercent(value) {
    return `${round(value)}%`;
  }

  function formatDegrees(value) {
    return `${round(value)}deg`;
  }

  /**
   * Computes a safe card-bottom attachment toward the host's center.
   * Recompute from fresh rectangle snapshots as the host moves; no state is retained.
   */
  function computeDialogueAnchor(dialogueRect, hostRect, options = {}) {
    const config = options && typeof options === 'object' ? options : {};
    const dialogue = normalizeRect(dialogueRect);
    const host = normalizeRect(hostRect);
    const requestedInset = Math.max(0, finiteNumber(config.edgeInsetPx, DEFAULT_EDGE_INSET_PX));
    const transitionMs = config.reducedMotion === true
      ? 0
      : clamp(Math.round(finiteNumber(config.transitionMs, DEFAULT_TRANSITION_MS)), 0, 1000);

    if (!dialogue.valid) {
      return deepFreeze({
        schema: DIALOGUE_ANCHOR_SCHEMA,
        version: DIALOGUE_ANCHOR_VERSION,
        valid: false,
        renderable: false,
        fallback: 'invalid-dialogue',
        region: 'center',
        dialogue,
        host,
        target: { x: 0, y: 0 },
        attachment: { x: 0, y: 0, localX: 0, localY: 0, ratio: 0.5, clamped: false },
        motion: { reduced: config.reducedMotion === true, transitionMs },
        cssVariables: {
          '--dialogue-tail-anchor': '50%',
          '--dialogue-tail-x': '50%',
          '--dialogue-tail-reach': '48px',
          '--dialogue-tail-angle': '0deg',
          '--dialogue-tail-anchor-px': '0px',
          '--dialogue-tail-target-x': '0px',
          '--dialogue-tail-target-y': '0px',
          '--dialogue-anchor-transition-ms': `${transitionMs}ms`,
        },
      });
    }

    const anchorX = clamp(finiteNumber(config.hostAnchor?.x, 0.5), 0, 1);
    const anchorY = clamp(finiteNumber(config.hostAnchor?.y, 0.5), 0, 1);
    const target = host.valid
      ? { x: round(host.left + (host.width * anchorX)), y: round(host.top + (host.height * anchorY)) }
      : { x: round(dialogue.left + (dialogue.width / 2)), y: dialogue.bottom };
    const edgeInset = Math.min(requestedInset, dialogue.width / 2);
    const unclampedLocalX = target.x - dialogue.left;
    const localX = clamp(unclampedLocalX, edgeInset, dialogue.width - edgeInset);
    const ratio = dialogue.width > 0 ? localX / dialogue.width : 0.5;
    const attachment = {
      x: round(dialogue.left + localX),
      y: dialogue.bottom,
      localX: round(localX),
      localY: dialogue.height,
      ratio: round(ratio),
      clamped: round(localX) !== round(unclampedLocalX),
    };
    const targetDeltaX = target.x - attachment.x;
    const targetDeltaY = Math.max(1, target.y - attachment.y);
    const tailReach = clamp(
      Math.hypot(targetDeltaX, targetDeltaY),
      finiteNumber(config.minimumReachPx, 48),
      finiteNumber(config.maximumReachPx, 180),
    );
    const tailAngle = clamp(
      Math.atan2(targetDeltaX, targetDeltaY) * (180 / Math.PI),
      -28,
      28,
    );

    return deepFreeze({
      schema: DIALOGUE_ANCHOR_SCHEMA,
      version: DIALOGUE_ANCHOR_VERSION,
      valid: host.valid,
      renderable: true,
      fallback: host.valid ? '' : 'invalid-host',
      region: classifyRegion(ratio),
      dialogue,
      host,
      target,
      attachment,
      motion: { reduced: config.reducedMotion === true, transitionMs },
      cssVariables: {
        '--dialogue-tail-anchor': formatPercent(ratio * 100),
        '--dialogue-tail-x': formatPercent(ratio * 100),
        '--dialogue-tail-reach': formatPx(tailReach),
        '--dialogue-tail-angle': formatDegrees(tailAngle),
        '--dialogue-tail-anchor-px': formatPx(localX),
        '--dialogue-tail-target-x': formatPx(target.x - dialogue.left),
        '--dialogue-tail-target-y': formatPx(target.y - dialogue.top),
        '--dialogue-anchor-transition-ms': `${transitionMs}ms`,
      },
    });
  }

  return {
    DIALOGUE_ANCHOR_SCHEMA,
    DIALOGUE_ANCHOR_VERSION,
    DialogueAnchorRegions,
    computeDialogueAnchor,
    normalizeRect,
  };
}));
