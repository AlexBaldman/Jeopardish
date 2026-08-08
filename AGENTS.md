# JeoPARODY agent operating guide

This repository is the canonical JeoPARODY runtime. Treat `master` as protected release history. Do feature work on a focused branch and open a PR back to `master` after verification.

## First principles

- Preserve game correctness. Scoring, clue selection, accepted answers, episode state, and study state belong to core/application logic, not presentation code.
- Treat the visible game as a **stage**, not a webpage. Presentation concepts map to useful software concepts: Stage, Scene, Director/Cue, Camera, Actor, Prop, Scenery, Lighting, Effects, Audio, Skin.
- The game decides **what happened**. Presentation decides **how it is performed**.
- Prefer incremental migration. Existing modules such as `HostPerformanceDirector`, `SceneService`, presenters, render views, and the event bus are assets to extend, not obstacles to replace.
- Mobile is first-class. The clue is the visual priority; chrome and host presence must yield when space is constrained.
- Creative controls remain accessible controls. Every illustrated switch must preserve button/switch semantics, keyboard access, focus, state labeling, and reduced-motion behavior.

## Brand rules

- The wordmark is conceptually `jeoPAR[O]DY!`.
- Only the **O in PARODY** is the interchangeable novelty slot. Do not substitute other letters.
- `jeo` is visually quieter and can reference classic blue/yellow game-show heritage without copying protected artwork.
- `PARODY` carries the loud personality.
- Art direction is high-detail pixel illustration: illustrated first, pixelated second. Avoid generic blocky 8-bit styling.
- Night mode: neon, hot pink/orange/yellow, selective white-hot highlights, controlled flicker.
- Day mode: premium yacht atmosphere, teak/brass/enamel, warm daylight.

## Stage architecture

Use or extend these semantics where they genuinely reduce coupling:

- `Stage`: owns the playable viewport and responsive blocking.
- `Scene`: current game presentation state.
- `Director`: converts semantic game moments into presentation cues.
- `Camera`: wide/medium/close/extreme-close/peek/offscreen presentation framing.
- `Actor`: host state, separated into shot, reaction, and action.
- `Prop`: clue card, dialogue bubble, score, response input, controls, etc.
- `Skin`: presentation-only implementation of a semantic component.
- `Lighting`: day/night plus future modifiers such as blacklight.

Prefer semantic anchors and stage zones over viewport-specific coordinates so actor/prop interactions can survive responsive layouts.

## Responsive layouts

Support these conceptual blocking presets as the design evolves:

- `desktopWide`
- `desktopCompact`
- `tablet`
- `mobilePortrait`
- `mobileImmersive`
- `mobileLandscape`

Use `dvh`, safe-area insets, CSS grid/flex/container queries where practical. Avoid accumulating arbitrary per-device patches.

## Skin contract

Semantic control behavior must be independent from its artwork. Theme, sound, voice, immersive/fullscreen and future controls may be skinned as props such as a pull-chain bulb, lava lamp, blacklight, desk lamp, sun/moon, porthole, or volcano.

A skin may describe assets, state variants, animation cues, sound cues, effects, dimensions, anchors, and fallbacks. Do not hard-wire game logic to a particular visual metaphor.

## Motion

Centralize motion durations/easing. Prefer named intents such as instant/fast/normal/dramatic. Support reduced motion. Avoid permanent expensive filters, layout-thrashing animation, and eager loading of rare reaction assets.

## Branch discipline

- Start from current `master` unless a task explicitly targets another convergence branch.
- One implementation goal per feature branch.
- Never delete or force-update another branch as incidental cleanup.
- Before reusing work from an old branch, compare it with `master` and port behavior intentionally rather than merging stale architecture wholesale.
- Existing historic/Codex branches are evidence, not automatically authoritative.

## Required verification

Before claiming completion, run the strongest applicable subset, ideally:

```bash
npm run check:js
npm test
npm run audit:css
npm run audit:assets
npm run validate:questions
npm run build
npm run audit:dist
```

For release-level work run `npm run verify` and, where the environment supports browsers, `npm run verify:release`.

For visual work, inspect representative viewports around 393x852, 430x932, 375x667, mobile landscape, tablet, desktop, and large desktop. Check overflow, keyboard opening, safe areas, orientation, reduced motion, clue readability, focus, and immersive transitions.

## Working style for Codex

1. Inspect before editing.
2. State the implementation seam you found.
3. Make concrete progress rather than producing architecture-only prose.
4. Implement one vertical slice early and verify it before broadening.
5. Preserve and document deferred ideas instead of half-implementing them.
6. End with exact files changed, tests run/results, remaining risks, and the highest-leverage next step.

The success test for foundational work is simple: the next absurd-but-useful JeoPARODY idea should become easier to add, not harder.
