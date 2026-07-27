# Engine Contracts

Jeopardish is moving toward a host-agnostic arcade engine. This document records the current ownership boundaries so future changes keep moving in that direction.

## Current Modules

- `game-logic.js` owns pure answer utility functions such as normalization, fuzzy matching, and clue value parsing.
- `src/contracts/events.js` owns event names, state enums, and default score rules.
- `src/core/event-bus.js` owns pub/sub event delivery.
- `src/core/game-engine.js` owns scoring, streaks, active clue truth, and answer outcomes.
- `src/content/episode-contract.js` owns the versioned production content shape,
  validation, immutable normalized packs, and the explicitly labeled adapter for
  the historical archive.
- `src/core/round-kernel.js` is the sole owner of legal round phases,
  presentation transactions, round identity, cancellation, and pause/resume.
- `src/application/preference-store.js` owns validated UI preference state and
  persistence for theme, language, host, dialogue, scene, sound, and voice.
- `src/application/clue-pipeline.js` owns the cancellable transaction from
  episode candidate through media preflight, translation, and render commit.
- `src/application/episode-controller.js` owns source loading, contract
  adaptation, resume, current source/display clue identity, outcome locking,
  progress, completion, restart, and broken-media clue replacement.
- `src/application/study-controller.js` owns study entry, grounded clue packets,
  protected score references, study actions, and exact round resume.
- `src/application/input-controller.js` owns the shared command vocabulary and
  routing for UI callbacks, keyboard shortcuts, and parsed voice intents. It
  reports command source and failure without logging arbitrary payload data.
- `src/application/application-composition.js` is the sole construction and
  lifecycle root. It creates the service graph, binds essential browser
  controls, publishes startup/shutdown events, and cancels owned work on
  teardown.
- `src/session/session-manager.js` owns authored or deterministic episode order,
  versioned outcome history, confidence/dispute annotations, review queues,
  progress, completion, content-revision invalidation, and local resume snapshots.
- `src/data/data-loader.js` owns fetching and transport-level shape checks. It
  does not decide whether episode content is production-valid.
- `src/media/media-preflight.js` owns media reachability checks, bounded timeouts, health caching, and playable-clue selection.
- `src/render/renderer.js` owns DOM binding, rendering, user input reads, fallback clue display, and control state.
- `src/host/host-manager.js` owns active host config, host visuals, and host quip selection.
- `src/audio/audio-controller.js` owns deterministic synthesized game cues.
- `src/voice/voice-controller.js` owns speech capability detection, narration, one-shot recognition, transcript normalization, and command parsing. It never judges an answer or mutates game state.
- `app.js` supplies product-specific display, translation, voice, and host
  adapters. It delegates episode lifecycle to `EpisodeController` and never
  constructs services, selects candidates, judges answers, maps input devices,
  or writes UI preferences to storage.

## Important Boundary

`app.js` may translate deterministic facts into presentation callbacks, but it
must not own the current clue, episode completion flag, outcome lock, candidate
selection, answer correctness, score/streak mutation, direct DOM writes, or host
image paths.

The current browser load order is:

1. `game-logic.js`
2. `src/contracts/events.js`
3. `src/content/episode-contract.js`
4. `src/core/event-bus.js`
5. `src/core/game-engine.js`
6. Data, media, scene, focus, renderer, narrator, host, host presentation,
   brand, translation, audio, and voice modules
7. `src/core/round-kernel.js`
8. Application modules: `PreferenceStore` and `CluePipeline`
9. `SessionManager`
10. `EpisodeController`
11. Study data modules and `StudyController`
12. `InputController`
13. `ApplicationComposition`
14. `app.js`

`BroadcastPresenter` is the presentation owner for host visuals, semantic
motion, deterministic host beats, clue narration, answer payoff, reveal
narration, and the episode finale. It receives already-approved domain facts and
may call the renderer and optional voice controller. It cannot select a clue,
judge an answer, record an outcome, mutate score, advance an episode, or pause a
round.

Media preflight happens before `GameEngine.loadClue()`. A rejected attachment can select another clue, but it cannot mutate score, streak, or answer correctness. Renderer-level media errors are a second recovery layer for assets that fail after preflight.

`SessionManager` version 3 records `correct`, `incorrect`, `revealed`, and
`skipped` outcomes plus explicit `isCorrect`, `creditEligible`, `reason`, and
`scoreDelta` facts. Correctness and competitive credit are intentionally
separate. Each result may also receive `knew-it`, `shaky`, or `learned-it`
confidence and a dispute flag without mutating score. Missed, revealed, and
shaky clues produce distinct immutable review queues. Version 1 and 2 local
sessions migrate in place; a changed episode `contentRevision` starts a fresh
session rather than restoring incompatible progress.

Authored packs use `authored-order`; adapted archives use
`deterministic-sample`. `EpisodeController` attempts the reviewed authored
source first and activates the explicitly configured archive fallback only
when transport fails. Contract failures do not silently downgrade to archive
content.

Broken-media substitutions replace the current episode slot without consuming
progress. `GameEngine.restoreProgress()` hydrates score and streak after a
refresh. It never restores or owns a presentation phase. `RoundKernel` alone
owns the active phase and rejects a pause snapshot from an older round id.

## Next Extraction Targets

1. Move remaining preference, scene, translation-refresh, and control-deck
   presentation coordination out of `app.js`.
2. Split the large renderer into clue, outcome, Study, cabinet, and finale view
   owners while retaining one DOM binding lifecycle.
3. Move the static locale catalog into a dedicated presentation module.
4. Convert renderer updates to event subscriptions only where the event facts
   are stable and doing so removes callback plumbing rather than hiding it.

## Behavior Preserved

The first extraction intentionally preserves the current gameplay behavior:

- correct answers add the clue value to score
- correct answers increase current streak
- best streak persists in localStorage
- incorrect answers reset current streak to `0`
- incorrect answers reset score to `0`
- the browser loads `questions/episodes/season-zero-001.json` as the flagship
  reviewed pack and uses `questions/runtime-bank.json` only as a labeled
  transport fallback through the `legacy-adapter`
- the complete `questions/jeopardy-questions.json` archive remains research
  source material and is not shipped
