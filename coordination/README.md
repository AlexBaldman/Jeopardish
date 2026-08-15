# Multi-Agent Coordination

This folder is the shared coordination surface for Codex, Gemini CLI, subagents, browser tools, shell sessions, and humans working on Jeopardish.

## Read First

Every agent should read these files before making changes:

1. `coordination/README.md`
2. `coordination/active-work.md`
3. `coordination/ROOMS.md`
4. Latest file in `coordination/handoffs/`
5. Latest log file under `coordination/logs/`
6. Relevant docs in `docs/`, especially:
   - `docs/MVP_SYSTEMS_AUDIT_2026-04-30.md`
   - `docs/EXPERIMENT_IDEA_LEDGER.md`

## Required Convention

Before editing:

- Check `coordination/active-work.md` for claimed files and in-flight work.
- Add or update your row if you are taking ownership of a task.
- Avoid editing files claimed by another active agent unless the user explicitly coordinates it.

After editing:

- Add a timestamped log with `npm run agent:log -- --agent "<name>" --task "<task>" --status "<status>" --files "<paths>"`.
- Update `coordination/active-work.md`.
- If you made a major architectural change, add or update a handoff in `coordination/handoffs/`.

For live observation:

- Start another CLI through `npm run agent:session -- --agent "<name>" --command "<command>"`.
- Ask an observer agent to review the latest log in `coordination/live/`.
- Keep final summaries in `coordination/logs/`, not only in live transcripts.

## Log Quality Bar

Each log should make it possible for another agent to answer:

- Who changed this?
- When?
- Why?
- What files were touched?
- What checks were run?
- What should the next agent avoid duplicating or undoing?
- What risks or follow-ups remain?

## Generated vs Human Files

- `logs/` entries are append-only records.
- `live/` entries are terminal/session transcripts for observation.
- `handoffs/` are curated summaries for major coordination points.
- `decisions/`, `reviews/`, and `huddles/` are room-specific artifacts.
- `active-work.md` is a small live board and should be updated by every agent.
- `templates/` defines the preferred log format.
