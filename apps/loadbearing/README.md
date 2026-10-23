# LOADBEARING — vertical slice 0.1

A mobile-first pixel-art strength RPG whose first playable loop is a real, usable bench-press training session.

## What works in this slice

- Create a local athlete profile.
- Log sleep, energy, soreness, motivation, and a pain flag.
- Generate an explainable bench prescription through `SPOTTER-1`.
- See council reactions from Vane, Morrow, and Rook.
- Log three working sets (or fewer when readiness reduces volume).
- Record reps, RIR, technique, and unexpected pain.
- Calculate estimated 1RM with Epley.
- Decide whether to increase, hold, or reduce the base load.
- Award protocol XP for adherence, technique, honest effort, and recovery discipline.
- Persist every domain event to an append-only JSONL event store under `user://`.
- Rebuild current state from event history after restart.

## Run

Open `apps/loadbearing/project.godot` with Godot 4.x (target: 4.7.x) and run the project.

The slice is deliberately local-first. No account, cloud dependency, AI call, or external service is required.

## Headless logic tests

When Godot is available on PATH:

```bash
godot --headless --path apps/loadbearing --script res://tests/test_training_logic.gd
```

## Product contract

The game may be eccentric. The prescription engine may not be reckless.

- Main compound sets are prescribed with reps in reserve.
- A pain flag prevents load progression.
- Recovery-adjusted sessions do not opportunistically trigger a load increase.
- XP rewards following the prescription, including backing off when the prescription backs off.
- Estimated 1RM is a trend signal, not a promise that a maximal single is safe or achievable today.

See `docs/ARCHITECTURE.md` and `docs/VERTICAL_SLICE.md` for the system boundary and acceptance criteria.
