# LOADBEARING architecture

## Principle

Real training data is the source of truth. Game progression reacts to it, but never manufactures physiological progress.

```text
real-world set
    ↓
append-only event
    ↓
state projection
    ↓
training engine
    ↓
explainable decision
    ↓
coach interpretation
    ↓
game reward / world state
```

## Layers

### Domain: training
Pure rules for estimated strength, readiness, prescriptions, and progression. These scripts should remain usable without any game scene.

### Domain: coaches
Maps domain outcomes to character reactions. Coaches interpret decisions; they do not override hard training constraints.

### Domain: game
Awards protocol XP from behaviors the product wants to reinforce: adherence, appropriate RIR, technique, and recovery discipline.

### Persistence
`EventStore` writes one JSON object per line to `user://loadbearing_events.jsonl`. The log is append-only. Current state is projected from the log by `AppState`.

### Presentation
The Godot scene is a portrait-oriented training console. In the vertical slice, visual identity is built with retro panels and typography rather than production sprites. Production art can replace presentation without changing the training engine.

## Event schema

All persisted events share:

```json
{
  "event_id": "evt_...",
  "event_type": "set_logged",
  "schema_version": 1,
  "occurred_at": "2026-08-24T23:00:00",
  "session_id": "sess_...",
  "payload": {}
}
```

Initial event types:

- `profile_created`
- `readiness_logged`
- `session_prescribed`
- `session_started`
- `set_logged`
- `pain_flagged`
- `session_completed`
- `progression_decided`
- `xp_awarded`

## Why event sourcing here

Training algorithms will change. If we store only mutable current state, algorithm changes destroy context. An event history lets future versions replay sessions, recompute trends, compare engine versions, and explain why a recommendation occurred.

## Engine versioning

Every progression event stores `engine_version`. Future migrations should preserve original decisions even when newer rules would decide differently.
