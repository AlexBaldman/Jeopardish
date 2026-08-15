# Jeopardish Docs

This folder is intentionally small. The root app is a dependency-free static MVP, so the docs should stay direct and operational.

## Start Here

| Doc | Purpose | Status |
|---|---|---|
| [USER_GUIDE.md](USER_GUIDE.md) | How to run and play the app | Active |
| [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md) | Runtime contract, module boundaries, and checks | Active |
| [REPO_REVIEW_2026-05-04.md](REPO_REVIEW_2026-05-04.md) | Latest local review and verification notes | Active |
| [VENTURE_CARD_2026-08-15.md](VENTURE_CARD_2026-08-15.md) | Snapshot of the shard cleanup and provenance architecture turn | Historical |
| [EXPERIMENT_IDEA_LEDGER.md](EXPERIMENT_IDEA_LEDGER.md) | Ideas worth preserving from older work | Reference |
| [MVP_SYSTEMS_AUDIT_2026-04-30.md](MVP_SYSTEMS_AUDIT_2026-04-30.md) | Historical audit from before the current shard/runtime cleanup | Historical |
| [BRANCH_DECISIONS_2026-04-05.md](BRANCH_DECISIONS_2026-04-05.md) | Branch cleanup snapshot | Historical |
| [BRANCH_DECISIONS_TEMPLATE.md](BRANCH_DECISIONS_TEMPLATE.md) | Template for future branch audits | Template |

## Current Contract

- Runtime app: `index.html`, `style.css`, `app.js`, `view.js`, `game-logic.js`, `game-session.js`, and `question-bank.js`.
- Canonical source data: `questions/jeopardy-questions.json`.
- Runtime data: `questions/starter-pack.json`, `questions/manifest.json`, and `questions/shards/*.json`.
- Full check: `npm run verify`.

## Archive Boundary

Older audit docs may mention tracked `node_modules`, duplicate CSV/JSON dumps, or the browser loading the full archive. Those notes describe the pre-cleanup state. The current runtime contract is the shard-based path described in [DEVELOPER_GUIDE.md](DEVELOPER_GUIDE.md).
