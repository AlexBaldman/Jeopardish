# Agent Rooms

Agent Rooms are named collaboration modes for humans, CLI agents, browser harnesses, bots, and review tools. They define how work should be coordinated, what artifacts should be written, and what behavior is expected.

The goal is to stop treating agents like isolated terminals and start treating them like people in the same project room.

## Core Rule

Every room produces durable artifacts in `coordination/`.

- Live chatter goes in `coordination/live/`.
- Decisions go in `coordination/decisions/`.
- Reviews go in `coordination/reviews/`.
- Creative ideas go in `coordination/huddles/` or `docs/EXPERIMENT_IDEA_LEDGER.md`.
- Finished work gets a timestamped log in `coordination/logs/`.

## Room Types

### Pair Coding

Use when one agent is implementing and another is observing or reviewing.

Operating pattern:

- Driver agent claims files in `coordination/active-work.md`.
- Observer reads the live log or diff and comments in `coordination/reviews/`.
- Driver owns edits; observer avoids touching overlapping files unless the human says so.

Good for:

- risky refactors
- bug fixes
- migration work
- test repair

Required artifacts:

- live log for the driver
- final agent log
- optional review note

### Architecture Huddle

Use when the structure is unclear or multiple valid designs exist.

Operating pattern:

- No runtime code changes until a decision note exists.
- Agents propose options, risks, and constraints.
- Human or release captain records the decision.

Good for:

- data architecture
- module boundaries
- migration strategy
- deployment strategy

Required artifacts:

- `coordination/decisions/YYYY-MM-DD-short-topic.md`
- final agent log

### Creative Jam

Use when the point is range, not correctness.

Operating pattern:

- No production code edits by default.
- Agents propose wild ideas, sketches, mechanics, copy, UI moods, and feature concepts.
- Good ideas are promoted to `docs/EXPERIMENT_IDEA_LEDGER.md`.

Good for:

- game mechanics
- host persona
- jokes and quips
- visual direction
- learning loops

Required artifacts:

- `coordination/huddles/YYYY-MM-DD-short-topic.md`
- idea ledger updates for keepers

### Serious Code Review

Use when the task is to find problems, not cheerlead.

Operating pattern:

- Findings first.
- Include file and line references when possible.
- Prioritize bugs, regressions, missing tests, security/privacy risk, performance, and maintainability.

Good for:

- pre-PR review
- release readiness
- reviewing another agent's pass

Required artifacts:

- `coordination/reviews/YYYY-MM-DD-review-topic.md`
- final agent log

### Release Captain

Use when a branch is approaching merge/deploy.

Operating pattern:

- One owner controls merge readiness.
- Other agents can review and suggest but should not mutate release files without coordination.
- Release captain maintains the checklist.

Good for:

- final MVP stabilization
- deployment
- branch cleanup

Required artifacts:

- `coordination/decisions/YYYY-MM-DD-release-readiness.md`
- `coordination/active-work.md` updated with release owner
- final agent log

### Weird Lab

Use for experiments where taste, humor, and novelty matter.

Operating pattern:

- Work in an isolated branch or sandbox folder.
- End every pass with one of: keep, kill, park.
- Preserve promising ideas before deleting code.

Good for:

- strange UI ideas
- quip engines
- AI host prototypes
- audio experiments
- alternate game modes

Required artifacts:

- huddle note or experiment note
- idea ledger update
- final agent log

## Human State Metadata

This is optional but useful. Creative output and review strictness can vary by context.

When starting a room, the human can include:

- energy: low / medium / high
- mode: playful / serious / surgical / exploratory
- risk tolerance: low / medium / high
- timebox: minutes or hours
- substance/context note: optional and human-controlled

Example:

```text
Room: Creative Jam
Energy: high
Mode: playful
Risk tolerance: high
Timebox: 25 minutes
Goal: invent weird but playable Jeopardish game mechanics
```

Agents should treat this as workflow context, not as permission to ignore repo safety.

## Recommended Start Prompt

```text
We are in [ROOM TYPE].
Before acting, read coordination/README.md, coordination/ROOMS.md, coordination/active-work.md, latest coordination/handoffs, and latest coordination/logs.
State what you are claiming, what you will not touch, and what artifact you will leave.
```

## Recommended End Prompt

```text
Before ending, update coordination/active-work.md, leave a timestamped npm run agent:log entry, and add any review/decision/huddle artifact required by the room.
```
