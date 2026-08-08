# Next Codex Pass: Stage Engine Visual Truth Loop

This document is the required mission brief for the next browser-capable Codex pass on the Stage Engine branch.

## Goal

Convert the current Stage Engine + immersive/mobile integration from a structurally promising implementation into a visually verified production experience, especially on iPhone-sized viewports.

The next pass should prioritize observed UI behavior over additional speculative architecture.

## Start here

Work from:

`codex/stage-engine-immersive-pass`

Read:

- `AGENTS.md`
- `docs/STAGE_ENGINE.md`
- this file

Then inspect the current diff against `master` before editing.

## Phase 1: deterministic verification

Run:

```bash
npm run check:js
npm test
npm run audit:css
npm run build
npm run audit:dist
npm run verify
```

Fix deterministic failures first. Do not hide, skip, or reinterpret failing checks just to reach screenshots faster.

## Phase 2: launch and capture

Launch the app using the repository dev workflow.

Capture the standalone game at minimum at these representative dimensions:

- 393x852
- 430x932
- 375x667
- a representative mobile landscape size
- a representative tablet size
- 1440px+ desktop

Treat 393x852 as the primary mobile design target.

## Phase 3: state matrix

At 393x852, visually inspect and capture at least:

- initial clue / answering state
- correct-answer result state
- incorrect-answer result state
- answer reveal state
- immersive mode entered
- immersive mode exited
- night mode
- day mode
- game menu open
- input focused / keyboard state if the browser tooling can emulate it reliably

If practical, also capture host medium, close-up, and extreme-close-up camera states using the developer fixture or safe runtime triggers.

## Phase 4: critique every screenshot

For every state, evaluate:

### Layout

- Is the clue unmistakably the primary content during normal play?
- Is the header compact enough on mobile?
- Is the scoreboard useful without behaving like a second header?
- Is there accidental clipping, horizontal overflow, or unusable scroll?
- Do safe areas work in immersive mode?
- Does the bottom control region stay reachable and legible?

### Host

- Does Xander feel present without stealing permanent clue space?
- Are close-ups framed around the face rather than merely scaling the entire layout awkwardly?
- Does dialogue recede appropriately during reaction shots?
- Does the host cover important clue/result text?
- Does returning to WIDE restore normal gameplay cleanly?

### Controls

- Are interactive targets at least comfortably tappable?
- Does the answer input remain usable at narrow widths?
- Does focusing the answer input avoid unwanted mobile zoom behavior?
- Are theme, sound, voice, menu, and immersive controls understandable despite visual skins?
- Do focus-visible and aria states remain correct?

### Brand

The current logo grammar is:

`jeoPAR[O]DY!`

Only the O in PARODY may be interchangeable.

Check that:

- `jeo` is visually quieter
- `PARODY` is clearly the personality-heavy portion
- night mode reads as high-detail neon inspiration rather than generic glow text
- hot pink / orange / yellow / selective white highlights are balanced
- flicker is rare and controlled
- day mode suggests rich yacht teak/brass/enamel rather than generic brown UI
- the O slot stays recognizable across tokens

### Motion

- Camera transitions feel deliberate rather than like browser zoom accidents.
- No persistent flicker or animation becomes distracting.
- Reduced-motion mode remains coherent.
- Immersive transitions do not create large layout jumps or unreachable controls.

## Phase 5: iterate, do not merely observe

Use this exact loop:

```text
RUN
  -> SCREENSHOT
  -> CRITIQUE
  -> IDENTIFY HIGHEST-LEVERAGE DEFECT
  -> IMPLEMENT FIX
  -> RERUN
  -> SCREENSHOT AGAIN
```

Repeat until the obvious visual defects are removed.

Do not stop after one CSS change if the new screenshot still looks crowded, clipped, awkwardly framed, or visually confused.

## Technical priorities

Prefer fixes in this order:

1. Stage blocking/layout rules
2. component sizing and hierarchy
3. responsive typography
4. host camera framing
5. safe-area/immersive behavior
6. control ergonomics
7. decorative styling
8. animation polish

Avoid accumulating per-device magic numbers unless a real platform quirk requires one and the reason is documented.

## Architecture guardrails

- Game truth stays in existing game/core/application logic.
- `HostPerformanceDirector` remains responsible for reaction/performance choice.
- Stage presentation owns framing/blocking.
- Existing theme preference remains authoritative.
- Do not create a second parallel theme or scoring state.
- Do not rewrite the app merely to simplify the visual task.

After visual proof, a follow-up cleanup may move Stage creation from the temporary runtime adapter into `ApplicationComposition` and replace DOM observation with direct presentation/event integration. Do that only if it remains a clear improvement after the browser pass.

## Final deliverable

Before ending the pass, report:

- exact tests run and results
- exact viewport sizes inspected
- screenshots captured
- visual problems discovered
- fixes implemented
- files changed
- remaining known visual defects
- whether PR #54 is ready to leave draft
- the single highest-leverage next implementation step

Do not claim the visual pass is complete unless browser screenshots were actually inspected.
