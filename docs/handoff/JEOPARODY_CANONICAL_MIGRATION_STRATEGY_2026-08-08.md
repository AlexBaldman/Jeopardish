# JeoPARODY Canonical Migration Strategy

> **SUPERSEDED REPOSITORY DIRECTION.** Preserved as historical evidence. The
> current decision is [`JEOPARODY_REPOSITORY_CONSOLIDATION_2026-09-03.md`](JEOPARODY_REPOSITORY_CONSOLIDATION_2026-09-03.md): Jeopardish is canonical;
> jeoPARODY is the donor being mined toward retirement.

**Updated:** 2026-08-08

## Decision

The long-term product destination is **`AlexBaldman/jeoPARODY`**.

`AlexBaldman/Jeopardish` remains the **short-term stable proving ground and source of proven product behavior** while the newer jeoPARODY architecture is repaired, simplified, and brought to parity.

This explicitly supersedes older handoff wording that described Jeopardish as the permanent canonical repository or jeoPARODY as merely a donor archive.

The migration is not a wholesale merge in either direction.

The strategy is:

```text
JEOPARDISH
stable + working + heavily tested
        │
        │ prove/fix features here when safest
        │ extract contracts, fixtures, behaviors, assets
        ▼
PORT / REBUILD DELIBERATELY
        │
        ▼
JEOPARODY
newer architecture
repair boot/runtime first
then absorb proven goodness
        │
        ▼
LONG-TERM CANONICAL PRODUCT
```

## Why This Is The Current Truth

Devin's full audit of jeoPARODY found that its documented architecture and live runtime had diverged badly, but also concluded that the underlying pieces were individually useful and that the required work was **consolidation rather than a rewrite**.

Devin's follow-up review of the `mac-fixed-pushing-changes` refactor found that the architectural direction improved substantially:

- one composed entry point;
- `UIManager` view registry;
- `StateBridge` connecting engine events to the store;
- more of the intended component tree actually reachable;
- ESLint installed;
- CSS moved toward tokens/layers;
- dead-code fraction substantially reduced.

However, that refactor currently cannot boot in a browser. Devin reproduced a chain of five independent P0 failures plus asset/data/build issues. The correct response is to repair and finish the architecture, not abandon it.

Meanwhile, Jeopardish has become a highly useful proving ground with deterministic gameplay, authored episodes, Study/learning loops, host performance boundaries, modular avatar/wardrobe work, release gates, and the new Stage Engine vertical slice. Those systems should increasingly become **source material for deliberate forward ports into jeoPARODY**.

## Repository Roles During Migration

### `AlexBaldman/Jeopardish`

**Role: stable reference implementation / proving ground / short-term bug-fix target.**

Use it to:

- keep the currently working game playable;
- fix regressions when doing so is lower-risk than fixing them first in jeoPARODY;
- prove new behavior such as Stage presentation vertically;
- maintain deterministic fixtures and release evidence;
- define clear contracts for systems worth moving;
- serve as a behavior oracle during parity tests.

Do **not** assume every new subsystem must permanently live here.

### `AlexBaldman/jeoPARODY`

**Role: long-term canonical destination.**

Use it to:

- repair the refactored architecture until it boots and plays reliably;
- remove duplicate/parallel state and component implementations;
- establish one entrypoint, one game-state owner, one component contract, one question path, and one event vocabulary;
- absorb proven Jeopardish systems through clean contracts;
- become the eventual home for Stage, authored episode/learning systems, Host Studio, Topic Shows, PAO, full-board modes, shared-screen play, and future product expansion.

Do not port historical defects simply to claim parity.

## Devin's Immediate jeoPARODY Repair Order

Before broad feature migration, finish the P0 runtime repair identified in Devin's follow-up audit:

1. repair/remove `PlaneAnimationService.adjustBannerSize()` and stop constructing the service at module scope;
2. reconcile `ConnectedComponent` with the contract its subclasses actually use (`mount`, `setState`, `storeState`, `mapStateToProps`, `onMount`);
3. fix `Modal` construction/super contract;
4. resolve the `GameEngine` versus `GameController` ownership/API mismatch and keep one owner;
5. replace browser `process.env` references with browser-safe configuration;
6. render Splash first rather than auto-skipping it;
7. make the production build ship question assets/shards and valid host art paths;
8. add a real browser smoke test asserting initialization and visible clue rendering, then make it blocking in CI.

After that:

- clear blocking ESLint/stylelint issues;
- remove duplicate/deprecated copies;
- remove URL/browser API-key injection;
- fix accessibility regressions;
- fix duplicate event/control bindings;
- eliminate the 55 MB monolithic browser corpus in favor of bounded shards/packs.

## Forward-Port Model

Every Jeopardish capability considered for jeoPARODY should get an explicit disposition:

- **PORT:** implementation is isolated and fits the new architecture with minor adaptation.
- **REBUILD:** behavior is valuable but the Jeopardish implementation is too coupled to its current owners.
- **REFERENCE:** preserve tests, fixtures, semantics, UX, or product requirements only.
- **RETIRE:** behavior is obsolete, unsafe, redundant, or no longer part of the target product.

Do not equate "exists in Jeopardish" with "copy the files."

## Highest-Value Jeopardish Systems To Carry Forward

The current strong candidates are:

1. deterministic scoring/round behavior and fuzzy answer-judgment fixtures;
2. authored Episode contract, EpisodeController behavior, emergency reviewed fallback, finale/replay flow;
3. Study pause/resume, confidence/dispute handling, memory reinforcement, and learning-ledger behavior;
4. HostPack / HostAvatarPack / HostPerformanceDirector semantics;
5. modular Xander wardrobe/avatar selection and fallback behavior;
6. media preflight/substitution and accessibility behavior;
7. bilingual/localization contracts and authored Portuguese direction;
8. release proof harness: browser smoke, full-episode proof, accessibility gates, visual fixtures, dist audits;
9. Stage Engine concepts and semantic presentation contracts after the current vertical slice is visually proven;
10. privacy-safe product-event vocabulary and no-client-secret rules.

## Stage Strategy During Migration

The current Jeopardish Stage Engine work is a **proof**, not evidence that Stage must permanently remain in Jeopardish.

Use Jeopardish to validate:

```text
semantic game event
→ presentation cue
→ responsive Stage/camera/host behavior
→ deterministic fixture
```

Then port/rebuild the proven Stage contract into jeoPARODY once its core runtime is stable enough to receive it.

The long-term Stage remains presentation-only. It must not become a competing owner of score, answer truth, episode position, or learning state.

## Migration Gates

jeoPARODY becomes the operational canonical product only when it can demonstrate, at minimum:

- clean browser boot;
- one game-state owner and one component contract;
- visible functional core gameplay;
- bounded question/content loading;
- correct packaged assets;
- browser smoke tests in CI;
- answer/scoring parity with the intended canonical fixtures;
- accessibility baseline;
- no browser API secrets;
- deterministic test coverage for each forward-ported subsystem.

Do not switch canonical status merely because files have been copied.

## Parallel Work Rule

Until those gates are met:

- fixes/features may continue in Jeopardish when they improve the working product or prove a future contract;
- jeoPARODY work should prioritize architecture repair and high-confidence parity ports;
- avoid implementing the same speculative subsystem independently in both repos;
- whenever behavior is added to Jeopardish that is intended long-term, document its expected migration contract immediately.

## Recommended Next Sequence

### Track 1 — jeoPARODY foundation

1. Repair Devin's P0 boot chain.
2. Add blocking browser smoke CI.
3. Remove duplicate state/engine/component paths.
4. Fix data/assets packaging and bounded question loading.
5. Establish migration test harness.

### Track 2 — Jeopardish proving ground

1. Finish visual validation of the current Stage Engine branch.
2. Keep stable gameplay/release harness green.
3. Isolate reusable behavior contracts rather than broadening monoliths.
4. Continue original-IP/content work where it directly improves product evidence.

### Track 3 — controlled forward ports

Port by vertical slice, roughly:

1. scoring/judgment fixtures;
2. episode/content contract;
3. Study + learning return loop;
4. host-performance/avatar packs;
5. media/localization;
6. Stage presentation contract;
7. product event/release gates;
8. expanded formats such as full-board and PAO;
9. shared-screen/Couch Party;
10. Host Studio / Topic Shows / grounded AI.

Each slice must boot, render, and test before starting the next broad slice.

## Long-Term North Star

**jeoPARODY becomes the clean extensible product architecture. Jeopardish becomes the proven behavioral ancestor and reference implementation from which its best ideas were deliberately absorbed.**

The goal is eventually one product repository with a clear architecture, not two applications eternally swapping the word "canonical" every time one of them has a productive weekend.

## Agent Instruction

If you are Devin, Codex, Claude, or another coding agent:

1. treat this file as the current repository-direction decision;
2. inspect Devin's `docs/AUDIT_2026.md` and `docs/AUDIT_2026-07_REVIEW.md` in jeoPARODY;
3. inspect the newest Jeopardish implementation/docs only as proven source behavior and migration evidence;
4. do not start a wholesale merge;
5. repair jeoPARODY's boot/runtime foundation first;
6. propose the next smallest vertical forward-port with explicit parity tests;
7. record any changed repository-role decision here so future agents do not reverse the migration by accident.
