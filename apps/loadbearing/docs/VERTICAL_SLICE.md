# Vertical slice 0.1

## Thesis being tested

Can a strength-training logger feel like a game while remaining fast enough to use between real sets and disciplined enough to reward intelligent recovery?

## End-to-end flow

1. Athlete profile is created once.
2. Athlete enters four readiness ratings and a pain flag.
3. SPOTTER-1 creates a bench prescription.
4. Three coach archetypes interpret the prescription.
5. Athlete logs each real working set.
6. A pain flag ends the session early and prevents progression.
7. The engine computes e1RM and a progression decision.
8. The game awards protocol XP.
9. All events persist locally.
10. Relaunch reconstructs current load, XP, session count, and latest e1RM.

## Acceptance criteria

- [x] Training logic is isolated from the scene.
- [x] Persistence is append-only JSONL.
- [x] Readiness can reduce dose.
- [x] Recovery-adjusted sessions cannot increase the base load.
- [x] Pain prevents progression and is rewarded as an honest safety stop rather than punished as failure.
- [x] Progression decision contains machine-readable reasons.
- [x] Coach dialogue is content-driven JSON.
- [x] XP is deterministic from the recorded session.
- [x] Restart can project state from history.
- [x] Headless domain tests cover core decision branches.

## Next slice

Expand the same contracts to Squat, Deadlift, OHP, weighted pull-up, row, RDL, dip, leg curl, carry, and grip; then add the three-day program scheduler without changing the event-store contract.
