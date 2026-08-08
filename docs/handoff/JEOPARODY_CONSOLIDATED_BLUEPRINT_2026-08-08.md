# JeoPARODY / Jeopardish — Consolidated Product & Architecture Blueprint

**Compiled:** 2026-08-08  
**Canonical repository:** `AlexBaldman/Jeopardish`  
**Canonical branch:** `master`  
**Donor/R&D repository:** `AlexBaldman/jeoPARODY`

> This is the front-door handoff for humans and coding agents. It consolidates the recent production-readiness, branch-convergence, episode/editorial, host/avatar, voice/AI, Stage Runtime, and donor-mining work. Where older notes conflict, prefer the most recent canonical implementation and this document's status labels.

## Executive Summary

JeoPARODY has converged into a credible private-alpha game plus a larger reusable product architecture. The working runtime should remain in `AlexBaldman/Jeopardish`; `AlexBaldman/jeoPARODY` is a donor/R&D repository whose useful behavior, fixtures, product ideas, and creative research are selectively mined into the canonical system.

The recent work establishes five mutually reinforcing pillars:

1. deterministic trivia/learning core with one owner for game truth;
2. directed episode/editorial system that turns trivia into short authored shows;
3. host-performance and avatar system built from reusable packs;
4. programmable Stage Runtime that maps semantic game events into cameras, reactions, audience behavior, lighting, FX, comedy, and shared-screen play;
5. creator/content ecosystem around Topic Shows, Host Studio, PAO, full-board formats, mastery, and future cosmetic/content packs.

Do not rewrite the project into a new framework simply because these systems now exist. Preserve the working canonical runtime and add capabilities behind existing contracts.

## Repository Truth

### Canonical runtime

- Repository: `AlexBaldman/Jeopardish`
- Branch: `master`
- Owns executable product, game truth, episodes, learning state, presentation owners, host system, and release gates.

### Donor / R&D

- Repository: `AlexBaldman/jeoPARODY`
- Branch: `main`
- Owns historical implementations, assets, ideas, product experiments, behavior specifications, and fixtures.
- Do not wholesale-merge its store/component/runtime architecture.

### Recent side-branch material

The branch `agent/deep-mine-jeoparody-donor` contains the newest donor deep-mine report and Stage Runtime implementation handoff. Those documents are implementation-relevant even when not yet promoted to `master`.

The governing rule is **one active implementation**. Donor findings must be classified as **KEEP / PORT / REBUILD / ARCHIVE**.

## What Is Already Real

The private-alpha foundation includes:

- deterministic scoring and round ownership;
- tolerant/fuzzy answer judgment with aliases and explainable outcomes;
- a reviewed Season Zero authored episode with clue arc, finale, replay, emergency fallback, Study mode, confidence/dispute capture, and memory reinforcement;
- local learning memory and review queues;
- bilingual UI and clue-language support;
- media preflight/substitution and accessible modal behavior;
- optional voice narration/input with typed parity;
- HostPacks and `HostPerformanceDirector` boundaries;
- modular Xander avatar/wardrobe runtime with 12 production looks, deterministic per-show selection, manual cycling, persistence, semantic motion, and fallback;
- focused Scoreboard and Finale presentation owners;
- release harness covering unit/contract tests, content validation, static build audit, complete episode proof, cross-engine accessibility checks, visual fixtures, and deployment gates.

The product is technically credible as a **private alpha**. The main blockers are now rights-cleared identity, content depth, release policy, and actual player evidence.

## Product Model

JeoPARODY should operate as a short-form comedy-learning broadcast system:

```text
player enters show
  → directed episode presents clues
  → host performs around semantic events
  → optional Study detour pauses safely
  → uncertain/missed facts enter reinforcement
  → finale resolves the show device
  → returning player gets rematches + fresh broadcast
  → optional Topic Shows / alternate formats expand the catalog
```

Potential monetizable surfaces include authored episode/season packs, host/avatar/voice packs, alternate Stage sets, podiums, audience packs, camera/FX packages, props, educator/family bundles, and creator tools after the internal production pipeline is proven.

Do not build complicated commerce until players complete, return, and ask for more.

## Episode & Editorial System

Three content layers currently exist:

| Layer | Role | Player-facing authority |
| --- | --- | --- |
| Historical archive (~216k records) | research, discovery, edge cases, source leads | no |
| Normalized runtime bank (~10k clues) | local research/migration fixture | never shipped as catalog |
| Authored Season Zero | reviewed, paced, sourced show | yes |

### Two-lane catalog

**Editorial Episodes** are reviewed, sourced, localized, paced shows with explicit fact, answer, language, media, rights, and playability review. They can carry official progression, mastery, artifacts, and paid value.

**Topic Shows** are temporary generated shows built from source-backed immutable fact packets. They retain provenance, remain clearly generated, and never silently become canonical editorial episodes.

### Episode grammar

```text
Entrance → Turn → Payoff → Memory Return → Finale
```

Episodes should feel directed rather than randomly sampled. Near-term content proof:

1. finish reviewed `pt-BR` fields for Episode 001;
2. author Episode 002 with a distinct knowledge arc and media/audio mechanic;
3. author Episode 003 with callbacks from prior episodes.

Three coherent episodes prove there is a repeatable show factory rather than one lucky pilot.

## Stage Runtime: Integration Layer

JeoPARODY should behave as a **programmable game-show studio**, not a trivia UI with a decorative background.

```text
Room / Game State
    ↓
GameEngine / EventBus
    ↓
semantic game events
    ↓
GameDirector / presentation coordination
    ├── HostPerformanceDirector
    ├── StageDirector
    ├── CameraDirector
    ├── AudioDirector / AudioController
    └── FXDirector
    ↓
Shared Stage + player interaction surfaces
```

The presentation/director layer MUST NOT become a second owner of scoring, clue truth, answer state, progression, learning state, or canonical room state.

### Stage scene vocabulary

```js
const stageScenes = {
  INTRO: {},
  CATEGORY_REVEAL: {},
  BOARD: {},
  CLUE: {},
  BUZZ: {},
  PLAYER_ANSWER: {},
  CORRECT: {},
  WRONG: {},
  CHAOS_WAGER: {},
  ROUND_TRANSITION: {},
  FINAL_JEOPARODY: {},
  WINNER: {},
  CREDITS: {},
};
```

Conceptual scene layers:

```text
SET
├── Environment
├── Game Board
├── Host
├── Contestants
├── Podiums
├── Audience
├── Screens
├── Props
├── Camera
├── Lighting
├── FX
└── Comedy Layer
```

Example:

```text
PLAYER_WRONG
    ↓
StageDirector
    ├─ contestant reaction
    ├─ host reaction
    ├─ camera punch-in
    ├─ podium animation
    ├─ audience response
    ├─ optional comedy ticker
    └─ optional environmental gag
```

Every presentation effect should be cancellable/disposable, reduced-motion safe, and deterministic or seedable where replay/testing matters.

## Shared-Screen / Couch Party

The Stage architecture should support a TV/projector as the public show surface while phones/browser devices act as controllers.

**Shared Stage:** clues/board, public score/progress, host/contestant representation, audience, cameras, lighting, FX, environmental comedy.

**Player devices:** buzzing, answer entry, wagers, voting, optional power-ups/sabotage for declared formats, private information, drawing/alternate input, confidence controls.

Phones send intent into canonical room/game state. They do not independently determine truth.

## Comedy as a System

The studio itself can behave like a comedy character. Historical Stage ideas include a fax machine, skeleton, raccoon, backward-facing camera, sleeping boom operator, audience signs, dangling light, wrong-channel monitor, mis-aimed confetti cannon, 404-glitching wheel, blinking chicken, repo truck, and fishbowl bubbles.

Treat these as optional event-driven assets/gags, never permanent clutter.

Maintain separate humor budgets for:

- clue/content comedy;
- host-performance comedy;
- camera comedy;
- physical/environmental comedy;
- lore/background comedy.

Do not fire every channel simultaneously. Gameplay readability wins.

The donor comedy ticker is a useful behavioral reference but should be rebuilt as a localized, cancellable presentation subscriber. Do not revive global DOM ownership, unmanaged intervals, or long random animations that obscure play.

## Host System

Canonical ownership:

| Pack/System | Owns | Must not own |
| --- | --- | --- |
| `HostAvatarPack` | visual identity, looks, layers, anchors, effects | scoring, clue truth, jokes |
| `HostPack` | personality, dialogue style, teaching style, comedy boundaries | visual assets, score authority |
| `VoicePack` | approved clips, synthesis settings, consent, pronunciation | progression, clue facts |
| `HostPerformanceDirector` | semantic host performance coordination | game truth |

Xander's current direction uses an older, angular, weathered face; swept silver hair; loud tropical/surf styling; question-mark eyewear language; dry intelligence; and premium pixel craft. Public release still requires an original identity/rights pass.

The runtime includes 12 transparent wardrobe looks with deterministic selection, manual cycling, persistence, semantic motion, and a known-good fallback. Special-event wardrobe and performance poses remain approved inventory.

## Host Studio

Host Studio is the future creator workspace for appearance, wardrobe, performance, voice, personality, and teaching style. It should export validated data packs rather than place generative models inside gameplay.

```text
Identity lock
→ wardrobe composer
→ pose lab
→ layer editor
→ motion lab
→ personality workshop
→ voice booth
→ preview matrix
→ export gate
```

Generated outputs remain candidates until explicitly approved.

Recommended sequence:

1. runtime contract — largely complete;
2. read-only closet/gallery + validated pack import/export;
3. local creator for metadata, weights, crop/mask/anchor/palette tools;
4. personality and consented voice tooling;
5. motion workshop and layered/sprite export.

The game must boot and play with every generation provider disabled.

## Voice & AI Boundary

Use a three-tier voice model:

1. authored performance library for timing-sensitive recurring lines;
2. consented character synthesis for variable lines;
3. browser/local fallback speech when character audio is unavailable.

Pre-render as much as practical.

```text
Game event
→ Performance Director
→ approved finished clip if available
→ otherwise validated dynamic text if allowed
→ consented synthesis
→ provenance/cache
→ audio adapter + transcript
```

A model may choose wording. It may not change correct answers, score, sources, learning state, or episode progression.

Voice input remains progressive enhancement with push-to-talk, visible listening state, cancellation, transcription, typed parity, and no silent risky commands.

Generated Topic Shows and dynamic host dialogue belong behind a server or trusted-local boundary. Never put provider secrets in the public browser.

## Donor Deep Mine

The recent `jeoPARODY` audit found substantial behavior worth preserving without reviving its runtime architecture.

### PAO

Preserve deck management, card identity, filters, batch editing, flip interactions, retrieval quizzes, attempt history, import/export, and optional image-generation hooks. Rebuild behind safe canonical boundaries.

### Full Board

Preserve 6x5 board shape, category preferences, exact/partial category matching, date/year/month requests, board-position metadata, and history/completion ideas. Implement through a `BoardFormatContract` feeding existing episode/round owners.

### Content Pipeline

Mine fixtures for category eligibility, category/date retrieval, shard/index-first loading, CSV/TSV/JSON parsing, bounded failure behavior, local-first operation, and normalization. Do not port the donor browser monolith or fallback chain.

### Mastery

Reinterpret achievements as recomputable projections from canonical episode facts, learning ledger, and product events. Do not create a separate stats truth store.

### Developer Workbench

Rebuild useful HUD concepts as a development-only inspector fed by public snapshots/event bus: phase, episode position, score/streak, host/avatar, media/localization transaction state, learning queue, event trace, reduced motion, viewport/theme, and optional frame timing.

### Offline/PWA

Preserve the requirement only. If installability matters, generate cache entries from the audited production manifest and prove update/rollback behavior. Do not revive the old broad cache-first worker.

### AI / host mood

Keep useful semantic prompt/mood vocabulary where it fits `HostPack` and `HostPerformanceDirector`. Reject browser secret storage and legacy global event glue.

## Donor Disposition Matrix

**PORT / REBUILD, high value:** PAO behavior, full-board behavior, content-pipeline fixtures, mastery projections.

**REBUILD, medium-high:** ambient comedy subscriber, prompt/persona behavior behind current HostPack/AI boundary, developer instrumentation.

**KEEP vocabulary/fixtures:** host mood/animation beats, migration cases, audio operational concerns, control/media interaction cases, uncovered visual/token ideas.

**ARCHIVE / REJECT:** parallel store/reducer truth, compatibility bridges, browser API-secret storage, monolithic donor CSS/runtime architecture, placeholder image-service code, legacy real-person host definitions for public shipping.

## Production Readiness

Public release blockers are currently dominated by:

1. original/rights-cleared identity and assets;
2. more authored content;
3. fully reviewed offline bilingual canonical content;
4. consented playtest evidence;
5. security/privacy/CSP/font/rights release records.

### Public free preview gates

- original host/logo/fonts/scenes/voice/cues approved;
- three reviewed bilingual episodes;
- CSP, privacy notice, asset manifest, rollback record;
- manual zoom/keyboard/screen-reader/device passes;
- observed playtest failures corrected.

### Paid pilot gates

- completion and return evidence;
- catalog/entitlement/checkout/refund/deletion/export contracts;
- meaningful paid content beyond the free preview;
- support and incident ownership.

## Unified Roadmap

### Phase A — Consolidate truth

- Keep this document as the obvious front door.
- Promote/review Stage Runtime and donor deep-mine material into master when appropriate.
- Keep `jeoPARODY` explicitly donor/R&D.

### Phase B — Prove Stage vertical slice

- Identify existing semantic events and presentation boundaries.
- Establish Stage lifecycle without changing game truth.
- Prove `INTRO`, `CLUE`, `CORRECT`, `WRONG`, `ROUND_TRANSITION`, `WINNER`.
- Route host beats through `HostPerformanceDirector`.
- Add camera and contestant/podium reaction fixtures.

### Phase C — Original-IP preview pack

- lock original primary-host identity;
- produce rights/provenance manifest;
- self-host licensed fonts;
- replace/approve scene, sound, voice, and brand assets.

### Phase D — Episode factory

- finish Episode 001 Portuguese authored fields;
- produce Episodes 002 and 003;
- formalize review receipts and fact-packet tooling;
- build internal clustering/editorial helpers before public creator tooling.

### Phase E — Private-alpha evidence

- add consented local event export;
- run real playtests;
- measure completion, disputes, Study use, rematch value, desire to play another episode;
- fix repeated failures.

### Phase F — Return loop

- transparent due-date scheduling;
- daily broadcast + short memory rematch;
- episode history and earned artifacts;
- mastery as recomputable projection.

### Phase G — Social / format expansion

- Couch Party shared-screen mode;
- full-board adapter;
- PAO isolated mode;
- developer workbench as complexity grows.

### Phase H — AI / creator expansion

- grounded coach gateway;
- Topic Shows;
- read-only Host Studio closet, then local creator;
- consented voice and motion tooling.

### Phase I — Commerce

Only after retention evidence. Prefer paid season/host/educator-family packs before subscription machinery.

## Suggested Architecture Map

```text
GAME TRUTH
RoundKernel / GameEngine / EpisodeController / clue pipeline
learning ledger / SessionManager / PreferenceStore / InputController
        ↓
SEMANTIC EVENTS / BOUNDED PRESENTATION FACTS
        ↓
DIRECTORS
HostPerformanceDirector / StageDirector / Camera / Audio / FX / Comedy subscriber
        ↓
PRESENTATION
Stage scenes / ClueView / OutcomeView / StudyView / ScoreboardView / FinaleView
HostAvatarPack / audience / podiums / props / lights / screens / camera / FX
        ↓
INTERACTION SURFACES
cabinet / TV-projector Stage / player phones / keyboard-touch-voice-a11y adapters

CREATOR + CONTENT
Episode factory / fact packets / Topic Shows / Host Studio / PAO / visual fixtures
```

## Devin / Coding-Agent Handoff

Read in this order:

1. this consolidated blueprint;
2. `docs/PRODUCTION_READINESS_REVIEW_2026-08-04.md`;
3. `docs/BRANCH_CONVERGENCE_2026-08-05.md`;
4. `docs/EPISODE_AND_EDITORIAL_PLAYBOOK.md`;
5. `docs/VOICE_PRODUCTION_AND_AI_STACK.md`;
6. `docs/CHARACTER_ART_DIRECTION.md`;
7. `docs/HOST_STUDIO_ARCHITECTURE.md`;
8. `docs/convergence/README.md`;
9. `docs/convergence/registry.json`;
10. on `agent/deep-mine-jeoparody-donor`, read `docs/convergence/DONOR_DEEP_MINE_2026-08-07.md` and `docs/architecture/STAGE_RUNTIME_SYSTEM.md`.

Before creating a subsystem, search current owners. Do not introduce a second scoring, round, episode, learning, persistence, or global UI state owner.

For donor ideas, explicitly classify **KEEP / PORT / REBUILD / ARCHIVE**.

The preferred first Stage implementation is the smallest vertical slice that proves:

```text
semantic game event → presentation/director command → deterministic Stage fixture
```

for intro, clue, correct, wrong, transition, and winner states.

Add deterministic tests/visual fixtures. Preserve accessibility, reduced motion, localization, privacy, provenance, content rights, and the no-client-secret rule. Avoid framework migration unless separately approved.

## Open Decisions

Decide these only when implementation needs them:

- final original public identity for primary host and brand;
- exact Stage/GameDirector class boundary versus existing coordinators;
- Couch Party synchronization/transport;
- mastery scheduling model;
- first PAO/full-board expansion scope;
- PWA value to the daily-return loop;
- playtest analytics collection boundary;
- asset/font/audio/scene license status;
- Topic Show research/citation provider design;
- first commercial SKU structure after retention evidence.

Prematurely solving every future subsystem is an excellent way to avoid shipping.
