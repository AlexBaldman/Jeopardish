# Jeopardish User Guide

Jeopardish is a fast arcade trivia practice game. It starts from a small curated clue pack, then lazily loads pieces of the larger archive while you play.

## Start The Game

From the repo root:

```bash
npm run start
```

Open:

```text
http://localhost:4173
```

The app needs a local server because it loads JSON files with `fetch`. Opening `index.html` directly from the filesystem is not the supported path.

## Main Controls

- **Quick Play**: play random clues from the loaded bank.
- **Review Misses**: replay clues you previously missed.
- **New Clue**: load a fresh clue.
- **Reveal**: show or hide the answer.
- **Reset Run**: reset the current score and streak while keeping durable stats.
- **Check**: submit the typed answer.

## Scoring

- Correct answers earn the clue value.
- Streaks can add bonus points.
- Revealed answers are practice-only and earn no points.
- Incorrect answers reset the current streak and add the clue to Review Misses.

## Answer Matching

The app normalizes answers before comparing them. It handles:

- punctuation differences
- leading articles such as `a`, `an`, and `the`
- common response prefixes like `what is`
- small typo tolerance
- parenthetical alternatives such as `The Eiffel Tower (or La Tour Eiffel)`

The app still intentionally rejects tiny substring guesses, so short partial answers should not pass just because they appear inside a longer answer.

## Review Misses

When you miss a clue, its ID is saved locally in the browser. Review Misses mode tries to load the exact shard for those saved misses, so old misses remain reviewable after a page reload.

Local persistence stores:

- best streak
- high score
- missed clue IDs

It does not use a server account or external database.

## Data Loading

Jeopardish avoids loading the full question archive at startup.

Startup path:

```text
starter-pack.json -> manifest.json -> random shard files as needed
```

This keeps first play fast while still making the large clue archive available over time.

## Troubleshooting

If clues do not load:

1. Make sure you are using `http://localhost:4173`, not a direct file path.
2. Run `npm run validate:questions`.
3. Regenerate shards with `npm run build:questions`.
4. Refresh the browser.

If the page looks stale after code changes, hard refresh the browser.

If port `4173` is already in use:

```bash
python3 -m http.server 5173
```

Then open:

```text
http://localhost:5173
```

## For Developers

Run the full local check:

```bash
npm run verify
```

Runtime modules:

- `app.js`: game coordinator
- `view.js`: DOM rendering and UI feedback
- `question-bank.js`: starter pack, manifest, and shard loading
- `game-session.js`: scoring, streaks, review misses
- `game-logic.js`: answer matching and clue value parsing

Generated data:

- `questions/manifest.json`
- `questions/shards/*.json`

Regenerate generated data with:

```bash
npm run build:questions
```
