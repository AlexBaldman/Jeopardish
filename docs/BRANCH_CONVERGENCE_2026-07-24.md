# Branch Convergence Audit - 2026-07-24

## Executive Verdict

`master` is the only branch that should receive new product work. It contains the
strongest implementation of nearly every useful idea preserved in the older
branches and is 27 commits ahead of GitHub `origin/master`.

Do not merge any remaining branch wholesale. The large experiment branches mix
useful concepts with obsolete runtime code, Firebase/Genkit experiments,
generated archives, duplicate assets, and old styling systems. Their useful
behavior has either been rebuilt on `master` or is explicitly recorded below.

## Repository State

- Canonical remote: `https://github.com/alexBaldman/Jeopardish.git`
- Active branch: `master`
- GitHub baseline: `43e82ab`
- Local head before this audit: `9fbbfc9`
- Local divergence before this audit: 27 ahead, 0 behind
- Dependency lock: `form-data` 4.0.6, zero known npm vulnerabilities
- Hygiene defect fixed by this audit: tracked `node_modules` content

## Branch Matrix

Counts compare each GitHub branch with the current local `master`.

| Branch | Master only | Branch only | Verdict |
|---|---:|---:|---|
| `origin/master` | 27 | 0 | Canonical upstream; update from local `master`. |
| `origin/github-pages` | 27 | 0 | Exact upstream alias; retain only if Pages still requires it. |
| `origin/mobile-first-overhaul` | 38 | 0 | Fully absorbed and superseded. |
| `origin/codex/review-and-clean-up-branches-gwfwry` | 36 | 0 | Fully absorbed; clue-value scoring is tested on `master`. |
| `origin/coderabbitai/chat/44133fe` | 37 | 4 | Tooling and hardening rebuilt more completely on `master`. |
| `origin/codex/review-and-clean-up-branches` | 37 | 6 | Logic extraction, tests, and branch tooling are superseded. |
| `origin/codex/review-and-clean-up-branches-bbyvi1` | 37 | 3 | Data cleanup intent is covered by build-time filtering and validation. |
| `origin/codex/review-open-pull-requests-for-mvp-optimizations` | 35 | 1 | Historical report tooling only; no runtime value to merge. |
| `origin/codex/create-american-handball-video-game-concept` | 37 | 1 | Unrelated roadmap; archive outside the MVP line. |
| `origin/ui-revamp-jeoparody` | 39 | 1 | Obsolete monolithic UI rewrite; current component system supersedes it. |
| `origin/stupid` | 40 | 12 | Early host/mobile experiments; archive after deployed verification. |
| `origin/implementing-some-newness` | 40 | 52 | Noisy salvage archive; do not merge. |
| `origin/mobile-ui-improvements` | 40 | 56 | Noisy salvage archive; do not merge. |
| `origin/feature/responsive-fixes` | 40 | 59 | Noisy salvage archive; do not merge. |
| `origin/carmack-refactor-v3` | 40 | 61 | Noisy AI/UI salvage archive; do not merge. |

## Feature Coverage

The following branch ideas are already implemented more safely on `master`:

- fuzzy answer matching, transpositions, aliases, plurals, punctuation, spacing,
  capitalization, accents, and archive-style alternate answers
- clue-value scoring and parsing
- validated and bounded runtime question data
- responsive cabinet layout and mobile containment
- host image cycling and reaction states
- dialogue skins and Jeopardy-inspired clue presentation
- animated live scoreboard
- complete clue translation with English-source reveal
- media preflight, broken-link substitution, and accessible media modals
- console narration
- grounded, pausable Ask Xander study mode
- local-first AI host architecture and personality planning

## Preserved but Deferred

### Comedy Broadcast Ticker

The plane/comedy ticker remains desirable, but its old implementation is coupled
to obsolete markup and Firebase-era scripts. Rebuild it as an event-driven scene
overlay after the current cabinet is deployed and visually baselined.

Requirements for the clean implementation:

- subscribes to game events instead of polling DOM state
- remains behind primary gameplay surfaces
- travels in the correct direction and never clips behind scene bands
- pauses or hides on narrow and reduced-motion layouts
- sources localized, host-aware messages from structured data
- can be disabled independently from gameplay audio and motion

### Authentication and Profiles

Firebase and Genkit experiments are reference material only. Authentication,
profiles, and leaderboards need a separate product/security decision before any
code is revived.

### American Handball

The handball roadmap is unrelated to the JeoPARODY MVP. Preserve it in branch
history, but do not ship or merge it into the trivia runtime.

## Safe Cleanup Order

1. Push the current `master` and deploy a preview.
2. Verify desktop/mobile gameplay, translation, media failure, and score states.
3. Confirm whether GitHub Pages still depends on `github-pages`.
4. Delete fully absorbed branches.
5. Tag the large salvage branches before deleting their branch refs.
6. Build the comedy ticker cleanly from the requirements above.

No remote branch should be deleted before the updated deployment is verified.
