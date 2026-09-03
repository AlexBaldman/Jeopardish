# JeoPARODY Stage Runtime System

**Status:** implementation design / agent handoff
**Canonical runtime:** `AlexBaldman/Jeopardish`
**Related donor/R&D repo:** `AlexBaldman/jeoPARODY`

## Intent

JeoPARODY should behave as a programmable game-show studio, not merely a trivia UI with a decorative background. The game engine produces semantic facts/events. A presentation/director layer interprets those facts dramatically. The Stage renders the shared television show while player devices can provide private/control surfaces.

This document is intended to be readable by another AI implementation agent as the architectural target.

## Current implementation

The first canonical contract slice lives in
`src/presentation/stage-director.js` and `src/presentation/stage-engine.js`.
It maps `INTRO`, `CLUE`, `CORRECT`, `WRONG`, `ROUND_TRANSITION`, and `WINNER`
from canonical events into versioned cues, strips raw clue/answer content from
receipts, consumes host state through `HOST_PERFORMANCE_DIRECTED`, and releases
all subscriptions on teardown. Camera visuals, actor blocking, audio, FX, and
environmental comedy remain later adapters behind this contract.

## Core topology

```text
                    ┌─────────────────────┐
                    │     ROOM STATE      │
                    │ players / scores    │
                    │ round / clue / mode │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   GAME DIRECTOR     │
                    │ decides presentation│
                    └──────┬────────┬─────┘
                           │        │
             ┌─────────────▼─┐    ┌─▼──────────────┐
             │     STAGE     │    │ PLAYER DEVICES │
             │ TV / projector│    │ phones/browser │
             └───────────────┘    └────────────────┘
```

Canonical direction:

```text
GameController
    ↓
GameEngine / EventBus
    ↓
semantic game events
    ↓
GameDirector
    ├── HostPerformanceDirector
    ├── StageDirector
    ├── CameraDirector
    ├── AudioDirector
    └── FXDirector
```

The director/presentation layer MUST NOT become a second owner of scoring, clue truth, answer state, progression, or canonical room state.

## Stage vocabulary

Prefer reusable scene/state vocabulary rather than hardcoded one-off screens:

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

A Stage scene should be composed from independently controllable layers:

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

This is a conceptual contract, not permission to introduce twelve competing state stores. Existing canonical ownership boundaries win.

## Event-driven example

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

Presentation effects should subscribe to bounded semantic facts. They should be cancellable, deterministic/seedable where useful, reduced-motion safe, and disposable on scene/round teardown.

## Host performance

The Stage integrates the canonical host system rather than inventing another host runtime. Current host concepts include Xander Trefleck, Vera Static, and Professor O.O.

`HostPerformanceDirector` should remain the specialized owner of host performance. StageDirector requests/coordinates semantic performance beats rather than manipulating host DOM/image/timers directly.

Useful semantic host vocabulary includes reactions such as thinking, excited, disappointed, celebrating, talking, waving, confused, pointing, nodding, and shaking, but implementations should map these into the canonical performance primitives/HostPacks rather than resurrect donor global-DOM animation code.

## Player identity and avatars

Player identity should visibly inhabit the show. A player profile/avatar pipeline can feed:

- contestant podiums;
- scoreboards;
- reaction cutaways;
- winner screens;
- stage cameos;
- persistent cosmetics/discoveries where supported.

The desired pipeline is broadly `player photo/input → standardized illustrated/pixel avatar → reusable stage asset`, subject to the project's privacy, rights, and asset rules.

## Couch Party / shared-screen mode

The Stage architecture should naturally support a shared TV/projector plus personal controllers.

Shared Stage responsibilities:

- board/clue presentation;
- host performance;
- contestant/podium representation;
- scores and public state;
- cameras, lighting, audience, FX and environmental comedy.

Player-device responsibilities can include:

- buzzing;
- answer entry;
- wagers;
- voting;
- power-ups/sabotage where a mode allows it;
- secret/private information;
- drawing or alternate input;
- confidence or other private controls.

Room state remains canonical. Phones do not independently determine game truth.

## Comedy as a staged system

Treat the studio itself as a comedy character. Earlier stage concepts included deliberately malfunctioning TV-production details such as a fax machine, skeleton, raccoon, backward-facing camera, sleeping boom operator, audience signs, dangling studio light, wrong-channel monitor, mis-aimed confetti cannon, a 404-glitching wheel, blinking chicken, repo truck, and fishbowl bubbles.

These should become optional environmental/comedy assets and event-driven gags, not mandatory visual noise.

Maintain separate conceptual humor budgets for:

- clue/content comedy;
- host-performance comedy;
- camera comedy;
- physical/environmental comedy;
- lore/background comedy.

Avoid firing every channel simultaneously. The stage needs cadence, hierarchy, and readable clue/input surfaces.

The donor `comedyTicker` is useful as a behavioral reference only. Canonical direction is a localized, cancellable presentation subscriber driven by bounded game events. It must not own DOM placement globally, run unmanaged intervals, obscure play surfaces, or become required for progress.

## Visual direction

The historical stage target is a wide 16:9 television-stage composition with a retro pixel/VHS sensibility. Useful ingredients include limited-color/pixel treatment, dithering, neon/VHS glow, scanlines, RGB separation, studio hardware, podiums, host/contestants, audience/background infrastructure, and animated environmental details.

Treat these as art-direction vocabulary rather than hard requirements for every theme. The Stage Runtime should allow alternate sets/themes without changing game truth.

## Cameras, audio, lighting and FX

These are presentation domains coordinated from semantic events. They should not be embedded ad hoc throughout game logic.

Examples:

- camera: establish, host close-up, contestant punch-in, board/clue focus, winner framing;
- audio: semantic stings, audience responses, transitions, user-interaction-safe initialization;
- lighting: scene/round emphasis and reactions;
- FX: confetti, glitches, overlays, environmental animation, transitions.

Existing canonical controllers/owners should be reused whenever present. Do not revive donor sound/global animation managers merely because they contain useful examples.

## Scene orchestration contract

A practical target interface might resemble:

```ts
interface StagePresentationEvent {
  type: string;
  eventId: string;
  seed?: string | number;
  occurredAt: number;
  facts: Record<string, unknown>;
}

interface StageDirector {
  handle(event: StagePresentationEvent): void;
  enterScene(scene: string, context: unknown): void;
  leaveScene(scene: string): void;
  dispose(): void;
}
```

This is illustrative. An implementation agent should first inspect current canonical contracts and adapt to them rather than forcing this exact API.

## Implementation constraints

1. `AlexBaldman/Jeopardish` is the canonical executable/runtime.
2. `AlexBaldman/jeoPARODY` is a donor/R&D repository. Mine behavior, fixtures, visual ideas, and product requirements from it; do not wholesale-merge its runtime architecture.
3. Preserve the canonical `GameController → GameEngine/EventBus → presentation` ownership direction.
4. Stage systems consume semantic events/facts. They do not mutate canonical scoring/clue/round truth.
5. Prefer deterministic/seedable presentation choices where replay/testing matters.
6. Every subscription, timer, animation, media transaction, and scene effect needs teardown/cancellation semantics.
7. Respect reduced motion, localization, accessibility, privacy, content rights/provenance, and release gates.
8. Comedy and effects must never block or obscure required gameplay input/content.
9. Reuse existing HostPacks, HostAvatarPack, HostPerformanceDirector, semantic motion primitives, AudioController, InputController, EpisodeController/RoundKernel and other canonical owners where they exist.
10. Do not create compatibility bridges or parallel global stores merely to preserve donor implementation details.

## Recommended implementation order

### Phase 1: Stage shell

Create/identify a Stage root that can render canonical scenes while leaving existing gameplay truth untouched. Establish scene lifecycle and deterministic fixture support.

### Phase 2: Director/event adapter

Translate existing canonical semantic events into presentation commands. Start with a narrow set such as intro, clue, answer-correct, answer-wrong, round transition, and winner.

### Phase 3: Host integration

Route host beats through `HostPerformanceDirector`. Prove enter/react/hold/recover/exit behavior without direct Stage ownership of host internals.

### Phase 4: Camera + contestant/podium reactions

Add semantic camera framing and contestant/podium reaction surfaces. Keep animations disposable and reduced-motion safe.

### Phase 5: ambient studio life

Introduce audience responses, screens, props, background motion and bounded environmental comedy. Add seeded fixture scenarios so visual regressions can be reproduced.

### Phase 6: shared-screen multiplayer

Use the same Stage as the public shared display while player phones/controllers send input into canonical room/game state.

## Agent handoff checklist

Before implementing, an AI agent should:

1. read this document;
2. read `docs/convergence/README.md`, the convergence registry, and the current donor deep-mine report;
3. inspect existing `HostPerformanceDirector`, HostPack/avatar, event bus, audio, input, episode/round, media, localization and visual-fixture owners;
4. search both repositories for existing stage/studio/camera/audience/podium/host/comedy implementations and assets;
5. classify donor material as KEEP / PORT / REBUILD / ARCHIVE rather than copying blindly;
6. propose the smallest vertical slice that proves semantic event → director → stage rendering;
7. add deterministic tests/visual fixtures before broadening the system;
8. avoid framework migration or wholesale architecture replacement unless a separate approved decision explicitly requires it.

## Product expansion enabled by this architecture

A stable Stage Runtime can support alternate sets, hosts, podiums, audience packs, camera packages, FX packs, seasonal studios, props, cosmetics and future show formats without rewriting the trivia engine. That also creates a plausible future content/cosmetic economy while keeping gameplay truth stable.

## North-star statement

**JeoPARODY is a programmable game-show studio.** The engine produces facts; directors turn those facts into performance; the Stage renders the show; player devices provide public/private interaction surfaces. New theatrical layers should plug into that pipeline rather than becoming new owners of the game.
