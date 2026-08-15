# Jeopardish

Jeopardish is a funky arcade-style trivia and learning game built as a static web app. It loads fast from a small starter pack, then expands into a large local clue archive through generated question shards.

The current MVP loop is:

1. Load a clue.
2. Type an answer.
3. Check it.
4. Get score, streak, accuracy, host feedback, and review tracking.
5. Revisit missed clues in Review Misses mode.

## Quick Start

```bash
npm run start
```

Then open:

```text
http://localhost:4173
```

If port `4173` is busy, run a static server manually from the repo root with another port:

```bash
python3 -m http.server 5173
```

## Docs Map

Start with [docs/README.md](</Users/alex/coding/Jeopardish/docs/README.md>) for the documentation index and current review notes.

Active docs:

- [docs/USER_GUIDE.md](</Users/alex/coding/Jeopardish/docs/USER_GUIDE.md>) for gameplay and troubleshooting.
- [docs/DEVELOPER_GUIDE.md](</Users/alex/coding/Jeopardish/docs/DEVELOPER_GUIDE.md>) for module ownership and quality gates.
- [docs/REPO_REVIEW_2026-05-04.md](</Users/alex/coding/Jeopardish/docs/REPO_REVIEW_2026-05-04.md>) for the latest local inspection.

## Gameplay

- **Quick Play**: random clues from the loaded question bank.
- **Review Misses**: revisits clues answered incorrectly.
- **Reveal**: shows the answer, but answering after reveal earns no points.
- **Reset Run**: clears the active score/streak while keeping high score and missed clues.
- **Streaks**: correct answers increase streak; longer streaks can earn bonus points.
- **Accuracy**: tracks correct answers over total answered in the current run.

See [docs/USER_GUIDE.md](</Users/alex/coding/Jeopardish/docs/USER_GUIDE.md>) for the full user guide.

## Architecture

The browser runtime is intentionally small and dependency-free.

```text
index.html
  loads scripts and app shell

app.js
  coordinates game state, events, question bank, sessions, and answer checking

view.js
  owns DOM binding, rendering, ticker messages, answer reveal, and visual feedback

game-logic.js
  owns answer normalization, accepted answer extraction, fuzzy matching, and clue value parsing

game-session.js
  owns score, streak, high score, accuracy, and missed clue tracking

question-bank.js
  owns starter-pack, manifest, shard loading, random clue selection, and review clue lookup
```

## Question Data

The canonical raw source is:

```text
questions/jeopardy-questions.json
```

Runtime data is generated from that source:

```text
questions/starter-pack.json
questions/manifest.json
questions/shards/*.json
```

The app should not fetch `questions/jeopardy-questions.json` at runtime. The intended flow is:

```text
starter pack -> manifest -> lazy shard loading
```

Regenerate shards after changing the canonical question data:

```bash
npm run build:questions
```

Do not hand-edit generated shard files.

## Useful Commands

```bash
npm run start
npm run verify
npm run check:js
npm test
npm run validate:questions
npm run build:questions
```

For branch triage:

```bash
npm run triage:branches
```

## Multi-Agent Coordination

This repo includes a lightweight coordination convention for parallel CLI/agent work.

Read first:

```text
coordination/README.md
coordination/active-work.md
latest coordination/handoffs/*
latest coordination/logs/*
docs/EXPERIMENT_IDEA_LEDGER.md
```

After every meaningful agent pass, leave a timestamped log:

```bash
npm run agent:log -- \
  --agent "Agent Name" \
  --tool "CLI or harness" \
  --task "short task name" \
  --status "completed" \
  --files "file1.js,file2.css" \
  --summary "What changed." \
  --validation "Checks run and results." \
  --risks "Known risks or none." \
  --next-notes "What the next agent should know."
```

See [coordination/README.md](</Users/alex/coding/Jeopardish/coordination/README.md>) for the full convention.

## Current Quality Gates

Before handing off or opening a PR, run:

```bash
npm run verify
```

Current verification covers:

- JavaScript syntax for runtime and scripts.
- Unit tests for answer logic, session logic, and question bank behavior.
- Question validation for the canonical source, starter pack, manifest, and generated shards.

## Important Guardrails

- Do not reintroduce tracked `node_modules`.
- Do not reintroduce `.DS_Store` files.
- Do not restore duplicate question dumps.
- Do not fetch the full canonical JSON in the browser runtime.
- Do not move DOM rendering back into `app.js`.
- Do preserve good experimental ideas in `docs/EXPERIMENT_IDEA_LEDGER.md` before deleting exploratory work.
