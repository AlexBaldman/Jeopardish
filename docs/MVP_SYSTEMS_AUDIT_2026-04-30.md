# Jeopardish MVP Systems Audit — 2026-04-30

## Executive take

Jeopardish already has a viable seed: a fast static trivia loop, a large local clue bank, answer normalization, score/streak persistence, and a visual identity that is more distinctive than a generic quiz app. The current `master` is stable enough to preserve, but it is not yet the best MVP because the system is split between a tiny production app and several large experimental branches containing mixed ideas, vendored dependencies, data churn, AI/Firebase experiments, and visual prototypes.

The right move is not to merge everything. Treat `master` as the release base, mine the branches for proven product ideas, and rebuild the MVP around a crisp game loop: choose a clue, answer under lightweight pressure, get delightful feedback, learn why the answer is right, and feel pulled into one more round.

## Current repo reality

- Active local branch: `master`, tracking `origin/master`.
- Local working tree: clean at audit time.
- Passing checks:
  - `npm test`: 6/6 tests pass.
  - `npm run check:js`: passes.
  - `npm run validate:questions`: validates 216,930 clues.
- Runtime shape: static HTML/CSS/JS app using `index.html`, `style.css`, `app.js`, `game-logic.js`, and `questions/jeopardy-questions.json`.
- Repo size: about 601 MB.
- Question data is duplicated:
  - `questions/jeopardy-questions.json`: 55.6 MB.
  - `questions/questions.json`: 55.6 MB.
  - `questions/jeopardy-questions.csv`: 34.9 MB.
  - `questions/questions..csv`: 34.9 MB.
- `node_modules/` and `.DS_Store` files are still tracked even though `.gitignore` now excludes them.
- The app imports `axios`, Font Awesome, Material Icons, and a Cloudinary title asset in `index.html`, but current `app.js` uses native `fetch`; these are deploy-time fragility and cleanup opportunities.

## Systems Thinking Audit

### Product system

The current app behaves more like a flashcard toy than a complete game. That is fine for a first seed, but the MVP needs a complete player loop:

1. Select mode or start instantly.
2. Receive a clue with category and value.
3. Submit a response.
4. Get immediate correctness feedback.
5. See the normalized expected answer and a short learning note.
6. Earn score/streak/progress.
7. Continue, review misses, or change category/difficulty.

The missing system element is memory. The app remembers best streak, but it does not build a learning profile: weak categories, missed clues, recent repeats, accuracy, or “review this later.” A learning trivia app gets much better once the system adapts.

### Engineering system

The production code is simple and understandable, which is valuable. The risk is that experimental branches add complexity faster than the core loop can absorb it. A Carmack-style read of this repo says: preserve the shortest path that works, remove accidental complexity, and only add architecture where the loop demands it.

Immediate engineering weaknesses:

- `app.js` mixes state, DOM binding, fetch, game flow, rendering, and persistence.
- The 55 MB question JSON is loaded as one huge file on app start.
- Answer matching is intentionally fuzzy but not explainable to the player.
- Tests cover `game-logic.js`, but not game flow, DOM behavior, data loading failure, keyboard behavior, or responsive rendering.
- Static deployment depends on third-party CDNs for some visual assets even though the repo has local assets.

### Content/data system

The dataset is a strength, but raw Jeopardy clues are uneven for a learning game. Some answers contain markup, alternate phrasings, ambiguous responses, dated clues, or missing values. The MVP should treat data as a curated product surface, not a dump.

Best MVP data model:

- `id`
- `category`
- `clue`
- `answer`
- `acceptedAnswers`
- `value`
- `airdate`
- `difficulty`
- `tags`
- `explanation`
- `source`

The first production version can generate `difficulty`, `tags`, and lightweight `acceptedAnswers` offline from the existing data, then progressively enrich.

### Experience system

The screenshots and branch diffs show a distinctive direction: neon, retro arcade, fake game show, strange host energy. That is the app’s moat. The current `master` interface is more utilitarian than memorable, while `ui-revamp-jeoparody` appears to contain a concentrated style upgrade in only `app.js`, `index.html`, and `style.css`.

The MVP should feel like “late-night pirate game show arcade cabinet for learning facts,” but it still needs professional interaction design: readable clue card, obvious input, tactile feedback, responsive layout, and no controls fighting the clue.

## Carmack-Style Audit

The fastest path to a great MVP is to make the core loop excellent before adding services.

Hard calls:

- Do not merge the giant refactor branch as-is.
- Do not add AI, auth, Firebase, leaderboards, or audio until the local single-player loop is excellent.
- Do not ship a 55 MB blocking JSON load if the game can start from a small indexed shard.
- Do not let visual experiments dictate architecture.
- Do not keep duplicate datasets and tracked dependencies in the release branch.

High-leverage changes:

- Split pure game state from DOM rendering.
- Create a small `GameSession` module: current clue, score, streak, attempts, history, mode.
- Create a `QuestionBank` module that can load a small manifest plus category/value shards.
- Build a single deterministic answer validator with transparent result reasons: exact, normalized, fuzzy, rejected.
- Add a smoke test that loads the page, gets a clue, submits right/wrong answers, and verifies score/streak.

Performance bar:

- First playable clue in under 1 second on a normal connection.
- No blocking load of the entire clue database before play.
- No remote CDN required for core UI.
- Bundle/runtime small enough that GitHub Pages or any static host works cleanly.

## Rockstar-Quality Creative Audit

The app needs a stronger fantasy and better moment-to-moment feel.

Creative pillars:

1. **Arcade game show, not generic quiz.**
   Use chunky board typography, punchy transitions, value tiles, buzzer behavior, and stage lighting.

2. **Funky but legible.**
   Neon and weirdness are good; unreadable clue text is fatal. The clue always wins the hierarchy.

3. **Host as personality layer, not core dependency.**
   The host can react with short quips, facial changes, or ticker lines. The game must still work silently and offline.

4. **Learning payoff after every answer.**
   Correctness alone is not enough. Add one compact “why this matters” note or related fact.

5. **One-more-round frictionlessness.**
   Enter key flow, auto-focus, quick next clue, visible streak, clean feedback animation.

Best MVP signature features:

- “Daily Board”: six categories, five clue values each.
- “Chaos Mode”: random fast clues with streak multiplier.
- “Review Misses”: spaced repetition queue from wrong answers.
- “Host heckle ticker”: local curated quips, not AI-required.
- “Confidence button”: I knew it / guessed / missed, used for learning stats.

## Branch Audit

### Already merged into `origin/master`

- `origin/codex/review-and-clean-up-branches-gwfwry`
- `origin/mobile-first-overhaul`

These can be deleted remotely after confirming no open PR depends on them.

### Merge candidates

- `origin/dependabot/npm_and_yarn/form-data-4.0.5`
  - Scope: `package-lock.json` only.
  - Action: merge or recreate via Dependabot after removing tracked `node_modules`.
  - Risk: low.

- `origin/ui-revamp-jeoparody`
  - Scope: `app.js`, `index.html`, `style.css`.
  - Action: review visually, then cherry-pick or manually port the good UI pieces.
  - Risk: medium, because design changes can regress responsiveness and accessibility.

- `origin/codex/review-open-pull-requests-for-mvp-optimizations`
  - Scope: reports/script/package metadata.
  - Action: cherry-pick only if the PR-review script is still useful.
  - Risk: low.

### Mine, do not merge

- `origin/carmack-refactor-v3`
  - Huge rewrite: 1,300+ files changed, 1.4M+ insertions, lots of binary/media/data churn, new `src/` architecture, tests, AI host work, audio, state modules.
  - Action: mine selectively for module ideas, answer validation tests, state reducer patterns, host animation ideas, and docs. Do not merge wholesale.

- `origin/implementing-some-newness`
  - Mixed Firebase/auth/profile/leaderboard/UI experiments and dependency churn.
  - Action: defer auth/leaderboards. Mine any proven UI or flow improvements after MVP loop is hardened.

- `origin/github-pages`
  - Deployment branch mixed with old feature history.
  - Action: keep only if GitHub Pages deployment needs branch-specific config; otherwise replace with a clean deployment workflow from `master`.

- `origin/mobile-ui-improvements`
  - Ancestor of larger experimental work.
  - Action: likely superseded; mine only if a specific mobile fix is absent from `master`.

### Delete/archive candidates after confirming no open PR needs them

- `origin/coderabbitai/chat/44133fe`
- `origin/codex/create-american-handball-video-game-concept`
- `origin/codex/review-and-clean-up-branches`
- `origin/codex/review-and-clean-up-branches-bbyvi1`
- `origin/feature/responsive-fixes`
- `origin/stupid`
- merged branches listed above after PR check.

## Upgrade Plan

### Phase 0 — Freeze and protect the base

- Rename `master` to `main` if desired, or keep `master` but make it the only production branch.
- Turn on branch protection.
- Require `npm test`, `npm run check:js`, `npm run validate:questions`, and a browser smoke test.
- Delete merged remote branches after checking open PRs.
- Stop direct pushes except emergency fixes.

### Phase 1 — Repo hygiene

- Remove tracked `node_modules/` from git.
- Remove tracked `.DS_Store` files.
- Remove or archive duplicate datasets.
- Keep one canonical question source for dev and generate deploy artifacts from scripts.
- Replace remote title/CDN dependencies with local assets or package-managed assets.
- Update stale branch-cleanup docs that still mention a no-remote `work` branch.

### Phase 2 — Core game loop MVP

- Add modes:
  - Quick Play: random clue stream.
  - Daily Board: category/value board.
  - Review Misses: repeat wrong answers.
- Add answer lifecycle:
  - input
  - submit
  - normalized comparison
  - result reason
  - reveal answer
  - continue
- Add score model:
  - clue value
  - streak multiplier
  - wrong-answer reset or penalty
  - session summary
- Add local stats:
  - attempts
  - accuracy
  - best streak
  - weak categories
  - missed clue queue.

### Phase 3 — Data performance

- Generate a compact question manifest.
- Split the question bank into shards by category, difficulty, or hash bucket.
- Load a small starter shard immediately and lazy-load more in the background.
- Add data validation for duplicate IDs, missing values, malformed markup, and answer weirdness.
- Add an offline “starter pack” of curated clues for instant play.

### Phase 4 — Visual and interaction polish

- Pick one visual direction: funky arcade game show.
- Use the best parts of `ui-revamp-jeoparody` as a design reference.
- Build stable responsive layouts for:
  - 390px mobile
  - 768px tablet
  - 1280px desktop
  - tall/narrow mobile.
- Make the clue card the visual anchor.
- Add tasteful motion:
  - clue reveal
  - correct/incorrect pulse
  - streak fire-up
  - host reaction
  - score increment.
- Respect reduced motion.

### Phase 5 — Learning layer

- Add explanations for curated starter clues first.
- Add “show me why” expandable details.
- Add tags and review queues.
- Let users choose categories they want to improve.
- Add end-of-session summary: best category, weakest category, clues to review.

### Phase 6 — Optional services after the local MVP works

- Leaderboard: only after scoring rules are stable.
- Auth: only if cross-device stats matter.
- AI host: local fallback first, network-generated flavor second.
- Generated explanations: use offline caching and moderation; never block gameplay.

## Recommended PR sequence

1. **PR 1: branch and repo cleanup**
   - delete merged/stale branches remotely
   - remove tracked `node_modules` and `.DS_Store`
   - update docs for current `origin/master` reality

2. **PR 2: data slimming**
   - remove duplicate datasets
   - add generation/validation scripts
   - produce smaller deploy question shards

3. **PR 3: game-loop extraction**
   - extract session state and question bank modules
   - add tests for right/wrong/empty/repeated clue flows

4. **PR 4: MVP arcade UI**
   - port best `ui-revamp-jeoparody` ideas
   - make responsive layout production-grade
   - remove unused CDN dependencies

5. **PR 5: daily board + review misses**
   - add board mode
   - add missed clue persistence
   - add session summary

6. **PR 6: deployment readiness**
   - GitHub Pages or static host workflow
   - browser smoke test
   - Lighthouse/accessibility checks
   - tag `v1.0.0-mvp`

## Definition of “best possible MVP”

The MVP is ready when a new player can open the game, understand it in under 10 seconds, play a full satisfying session, learn something, laugh once or twice, and trust that the app will work on mobile without waiting for a giant data file or hitting a broken external service.

Concrete release gates:

- First playable clue under 1 second on desktop and under 2 seconds on mobile.
- No core dependency on external CDNs.
- No tracked `node_modules`, `.DS_Store`, or duplicate data dumps.
- At least one browser smoke test.
- At least 20 unit tests covering answer logic, scoring, session state, and data validation.
- Mobile and desktop screenshots approved.
- Branch list reduced to production branch plus active PR branches only.
