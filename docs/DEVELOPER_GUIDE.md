# Jeopardish Developer Guide

This guide explains how to work on the current MVP without undoing recent architecture changes.

## Current Runtime Contract

The browser should load only small runtime data first:

```text
questions/starter-pack.json
questions/manifest.json
questions/shards/*.json
```

Do not fetch `questions/jeopardy-questions.json` from the browser. That file is the canonical build input, not a runtime payload.

## Module Responsibilities

| File | Responsibility |
|---|---|
| `app.js` | Coordinates app state, events, sessions, question bank, and answer checking. |
| `view.js` | Owns DOM lookup, rendering, ticker messages, visual result state, and menu behavior. |
| `question-bank.js` | Loads starter questions, manifest, random shards, and exact shards for review misses. |
| `game-session.js` | Owns scoring, streaks, high score, accuracy, and missed clue persistence data. |
| `game-logic.js` | Owns answer normalization, accepted answers, fuzzy matching, and clue value parsing. |
| `scripts/shard-questions.mjs` | Generates runtime shard files from the canonical question archive. |
| `scripts/validate-questions.mjs` | Validates canonical data, starter pack, manifest, and shard presence/counts. |

## Verification

Run:

```bash
npm run verify
```

This runs syntax checks, unit tests, static MVP contract checks, and question validation.

The static contract checks verify:

- `index.html` loads the runtime scripts in dependency order.
- Required CSS, favicon, host image, and script files exist.
- DOM IDs required by `app.js` and `view.js` remain present.
- `questions/manifest.json` points to stable generated shard files.

The latest local review is tracked in [REPO_REVIEW_2026-05-04.md](REPO_REVIEW_2026-05-04.md).

## Adding Data

1. Update `questions/jeopardy-questions.json` or `questions/starter-pack.json`.
2. Run `npm run build:questions`.
3. Run `npm run validate:questions`.
4. Commit the generated manifest/shard changes if the project has decided to track generated runtime data.

## Adding UI

- Put DOM rendering in `view.js`.
- Keep `app.js` focused on state transitions and event wiring.
- Keep animation CSS-only unless there is a strong reason to add a dependency.
- Respect `prefers-reduced-motion`.

## Adding Game Rules

- Put pure scoring/session logic in `game-session.js`.
- Put answer matching in `game-logic.js`.
- Add tests before wiring rules into `app.js`.

## Multi-Agent Work

Before editing, read:

```text
coordination/README.md
coordination/active-work.md
latest coordination/handoffs/*
latest coordination/logs/*
```

After editing, run:

```bash
npm run agent:log -- --agent "<name>" --task "<task>" --status completed --files "<paths>"
```
