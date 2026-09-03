# JeoPARODY

> Formerly developed under the working title **Jeopardish**. The public creative direction is now **JeoPARODY**, where one unauthorized O turns game-show prestige into a comedy-learning universe.

`AlexBaldman/Jeopardish` `master` is the canonical executable. The similarly
named `AlexBaldman/jeoPARODY` repository is being mined as a donor toward
eventual retirement; the current decision and deletion gates are in
[`docs/handoff/JEOPARODY_REPOSITORY_CONSOLIDATION_2026-09-03.md`](docs/handoff/JEOPARODY_REPOSITORY_CONSOLIDATION_2026-09-03.md).

`creative-room.html` is an internal brand lab retained for the team. It is
deliberately absent from player navigation and production builds.

The compact source of current product truth and durable conversation decisions
is [`docs/PROJECT_MEMORY.md`](docs/PROJECT_MEMORY.md). The complete document map
is [`docs/README.md`](docs/README.md).

The current executable roadmap is
[`docs/OPTIMAL_PRIME_ROADMAP_2026-07-26.md`](docs/OPTIMAL_PRIME_ROADMAP_2026-07-26.md).
The current private-alpha scorecard, public-launch gates, and paid-product domino
order are in
[`docs/PRODUCTION_READINESS_REVIEW_2026-08-04.md`](docs/PRODUCTION_READINESS_REVIEW_2026-08-04.md).
Its source-by-source convergence decisions live in
[`docs/CONVERGENCE_DONOR_LEDGER_2026-07-26.md`](docs/CONVERGENCE_DONOR_LEDGER_2026-07-26.md).
The current all-branch audit and final promotion decision are recorded in
[`docs/BRANCH_CONVERGENCE_2026-08-05.md`](docs/BRANCH_CONVERGENCE_2026-08-05.md).
The repository identity decision and side-by-side comparison with the older
JeoPARODY codebase live in
[`docs/REPOSITORY_TRUTH_COMPARATIVE_AUDIT_2026-07-28.md`](docs/REPOSITORY_TRUTH_COMPARATIVE_AUDIT_2026-07-28.md).
The safety-reviewed, phased operational plan is
[`docs/REPOSITORY_REALIGNMENT_RUNBOOK_2026-07-28.md`](docs/REPOSITORY_REALIGNMENT_RUNBOOK_2026-07-28.md).
Its verified private-backup and restore-drill evidence is summarized in
[`docs/REPOSITORY_PRESERVATION_REPORT_2026-07-28.md`](docs/REPOSITORY_PRESERVATION_REPORT_2026-07-28.md).
The live, validated queue for incorporating donor behavior without creating
competing systems is
[`docs/convergence/README.md`](docs/convergence/README.md).
Earlier plans remain useful historical design material, but these documents
govern new product work.

## Current Playable Slice

The flagship path now runs the reviewed ten-clue episode **The Extra O Is Not
an Accident** from `questions/episodes/season-zero-001.json`:

- ten clues in a deliberate three-act order, including one local-media clue;
- reviewed explanations, institutional sources, accepted aliases, backstory,
  and connections available through Ask Xander;
- deterministic exact, variation, and typo-tolerant answer judgment;
- `knew it`, `shaky`, and `learned it` confidence plus a dispute path;
- revision-safe local resume, missed/revealed/shaky review queues, and replay;
- bilingual memory rematches backed by a private local learning ledger;
- a finale artifact decoded from the clue order;
- automatic fallback to a compact reviewed emergency episode when transport
  fails; the historical bank is available only in local Archive Practice.

The content format and editorial workflow are documented in
[`docs/CONTENT_AUTHORING.md`](docs/CONTENT_AUTHORING.md), with the broader
episode model in
[`docs/EPISODE_AND_EDITORIAL_PLAYBOOK.md`](docs/EPISODE_AND_EDITORIAL_PLAYBOOK.md)
and the consent-first voice plan in
[`docs/VOICE_PRODUCTION_AND_AI_STACK.md`](docs/VOICE_PRODUCTION_AND_AI_STACK.md).

## Host Performance

The host now has a deterministic performance system rather than scattered
reaction copy. The menu cycles among Xander Trefleck, Vera Static, and Professor
O.O.; the selection persists locally and is independent from the arrows that
cycle the current placeholder host artwork.

Each versioned HostPack supplies an original personality, bilingual line banks,
teaching style, comedy boundaries, voice direction, and rights metadata. The
director can choose dialogue, expression, and semantic motion, but it has no
access to scoring or answer authority. Season Zero, Study mode, reinforcement,
voice narration, and the finale all use the same boundary. The design and future
AI gateway rules live in
[`docs/HOST_AI_DIALOGUE_ROADMAP.md`](docs/HOST_AI_DIALOGUE_ROADMAP.md).
The canonical visual identity and premium pixel-art production rules live in
[`docs/CHARACTER_ART_DIRECTION.md`](docs/CHARACTER_ART_DIRECTION.md). Xander's
first avatar pack now includes 12 transparent production looks, deterministic
per-show wardrobe selection, manual cycling, eight deterministic animation
poses, lens reactions, reduced-motion output, and asset fallback. The voice
runtime now consumes a bilingual, rights-aware VoicePack while retaining
browser speech as its safe fallback. The future character creator and local-first AI boundaries
are specified in
[`docs/HOST_STUDIO_ARCHITECTURE.md`](docs/HOST_STUDIO_ARCHITECTURE.md).

## Privacy-Safe Product Events

`ProductTelemetry` observes the existing event bus through a no-op sink by
default, so this build sends and stores no analytics. A future approved sink can
receive only versioned aggregate facts for activation, completion, disputes,
Study enter/resume, reinforcement outcomes, replay, and bounded failures.
Player answers, clue text, reinforcement responses, transcripts, URLs, titles,
and error messages are excluded at the adapter boundary and covered by tests.

## Learning Return Loop

Ask Xander now leads somewhere. Opening a reviewed clue in Study mode saves that
clue to a versioned, local-only learning ledger. Its Memory Rematch reuses the
same typo-tolerant judge as the main game and accepts the reviewed English and
Brazilian Portuguese answer aliases.

At episode completion, **Review saved clues** opens the remaining rematches in
the Study panel. Correct retrieval clears each item from that episode's queue;
an incorrect attempt keeps it available. Review attempts never change score,
streak, episode outcome, or round position, and leaving Study restores the exact
broadcast state that was paused. The ledger contains stable episode/clue IDs and
aggregate learning counts only, not player responses or clue text.

## Overview

JeoPARODY began as a flash-card practice experiment and has become a finite,
comedic learning show. The current product combines authored episodes, resilient
historical practice, deterministic answer judgment, bilingual presentation,
media clues, a pausable Study mode, local learning memory, and a data-driven host
performance system. The parody lives in the theatre; factual and learning truth
stay inside explicit tested owners.

## Voice Mode

Voice mode is an optional progressive enhancement. Enable it from the game menu or press the microphone button in the control deck:

- Xander narrates clues, results, reveals, study responses, and the episode summary.
- Push to talk accepts natural responses such as `Who is Marie Curie?` through the same deterministic answer judge as typed input.
- Supported commands include `next clue`, `reveal the answer`, `repeat the clue`, `lock it in`, `open menu`, `ask Xander`, and `turn voice mode off`.
- English and Brazilian Portuguese recognition and narration follow the current game language.
- If speech synthesis, speech recognition, or microphone permission is unavailable, every typed and keyboard control continues to work normally.

Microphone recognition requires a secure browser context such as HTTPS or localhost. The microphone opens only after an explicit player action and closes after one response.



## Repo Operations (Production MVP Hardening)

This repo now includes lightweight operations scripts so you can execute the branch-cleanup plan immediately:

- Generate a branch triage report:

  ```bash
  npm run triage:branches
  # or set base branch explicitly
  bash scripts/branch-triage-report.sh master
  ```

- Validate local trivia dataset integrity:

  ```bash
  npm run validate:questions
  ```

- Rebuild the deterministic 10,000-clue runtime bank from the complete archive:

  ```bash
  npm run build:questions
  ```

- Check JavaScript syntax:

  ```bash
  npm run check:js
  ```

- Run unit tests for answer matching logic:

  ```bash
  npm test
  ```

- Open the deterministic visual-state workbench at `visual-fixtures.html`, or
  capture and geometry-check all 180 supported state, theme, and viewport
  combinations. The matrix includes clue, result, confidence, translation,
  menu, scoreboard, Study, reinforcement, media, finale, and voice states:

  ```bash
  npm run test:visual
  ```

- Audit the built landing and critical game states at desktop and phone widths:

  ```bash
  npm run build
  A11Y_BROWSERS=chromium,webkit npm run audit:a11y
  ```

- Enforce the shrinking CSS-debt ceiling:

  ```bash
  npm run audit:css
  ```

- Audit the source art library against the production asset manifest:

  ```bash
  npm run audit:assets
  ```

- Run every non-browser release check and create the production build:

  ```bash
  npm run verify
  ```

- Before a preview or release, run the full build, browser smoke, complete
  authored episode proof, accessibility, and visual-fixture gates:

  ```bash
  SMOKE_BROWSERS=chromium,webkit PROOF_BROWSERS=chromium,webkit A11Y_BROWSERS=chromium,webkit npm run verify:release
  ```

- Prove the complete authored episode against a fresh production build:

  ```bash
  PROOF_BROWSERS=chromium,webkit npm run test:episode
  ```

`questions/jeopardy-questions.json` is the complete research archive. The
browser loads the reviewed Season Zero episode. Production ships reviewed
episode packs and a small embedded emergency broadcast, not the historical
archive or `questions/runtime-bank.json`. The runtime bank remains a local
research and migration fixture and should be regenerated rather than hand-edited.

Use `docs/BRANCH_DECISIONS_TEMPLATE.md` to capture future
merge/cherry-pick/delete decisions. The latest completed pass is
`docs/BRANCH_CONVERGENCE_2026-08-05.md`.

## Historical Prototype

The original 2020 JService flash-card brief, wireframe, schedule, and early code
sample remain in Git history at commit `2c5731b` and earlier. They explain where
the project began but no longer describe the product, runtime, security model,
content pipeline, or public identity.
