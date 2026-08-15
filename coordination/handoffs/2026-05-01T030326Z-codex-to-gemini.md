# 2026-05-01T03:03:26Z - Codex Handoff To Gemini

Gemini should read this first, then `coordination/active-work.md`, then the latest logs under `coordination/logs/`.

## Current Branch State

- Branch: `master`
- Working tree: dirty with intentional uncommitted MVP changes.
- Nothing has been committed or pushed by Codex.
- No remote branches have been merged or deleted.

## Important Architecture Changes Already Made

- Runtime data loading no longer fetches `questions/jeopardy-questions.json` directly.
- New intended data path:
  - `questions/starter-pack.json`
  - `questions/manifest.json`
  - lazy-loaded `questions/shards/*.json`
- `question-bank.js` owns manifest/shard loading and exact shard lookup for persisted review misses.
- `view.js` owns DOM rendering and UI feedback.
- `app.js` coordinates state, events, question bank, session, and answer checking.
- `game-session.js` owns scoring, streaks, accuracy, and missed clue state.
- `game-logic.js` owns answer normalization and matching, including parenthetical alternate answers.

## Files Gemini Should Inspect Before Editing

- `coordination/README.md`
- `coordination/active-work.md`
- `app.js`
- `view.js`
- `question-bank.js`
- `game-session.js`
- `game-logic.js`
- `scripts/shard-questions.mjs`
- `scripts/validate-questions.mjs`
- `tests/*.test.mjs`

## Do Not Regress

- Do not restore the old full-archive runtime fetch.
- Do not edit generated shards manually.
- Do not reintroduce tracked `node_modules`.
- Do not reintroduce duplicate question dumps.
- Do not move rendering back into `app.js`.

## Last Known Passing Checks

```bash
npm run check:js
npm test
npm run validate:questions
```

Results:

- JS syntax: passed.
- Tests: 15/15 passed.
- Question validation: passed for canonical JSON, starter pack, and 128 shards.

## Suggested Next Work

- Browser visual QA and layout tuning.
- Add an actual browser smoke test harness if tooling permits.
- Decide whether generated shards should be committed or produced in deploy/build.
- Add a `CONTRIBUTING.md` pointer to the coordination convention if this becomes permanent.
