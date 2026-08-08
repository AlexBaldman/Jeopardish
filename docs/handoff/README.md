# JeoPARODY Handoff — Read This First

## Current repository direction

The authoritative repository-role decision is:

**`AlexBaldman/jeoPARODY` is the intended long-term canonical product repository.**

**`AlexBaldman/Jeopardish` is the short-term stable proving ground, bug-fix/reference implementation, and source of proven systems to forward-port deliberately into jeoPARODY.**

Read [`JEOPARODY_CANONICAL_MIGRATION_STRATEGY_2026-08-08.md`](JEOPARODY_CANONICAL_MIGRATION_STRATEGY_2026-08-08.md) before any other handoff document.

### Supersession warning

`JEOPARODY_CONSOLIDATED_BLUEPRINT_2026-08-08.md` was generated immediately before the latest Devin migration context was reconciled. Its product, Stage, host, content, and roadmap material remains useful, **but its statements describing Jeopardish as permanently canonical and jeoPARODY as merely donor/R&D are superseded by the migration-strategy document above.**

Do not use those older repository-role labels to reverse the migration.

## Operating model

```text
Jeopardish
working + tested proving ground
       ↓
extract proven behavior/contracts/fixtures
       ↓
PORT / REBUILD deliberately
       ↓
jeoPARODY
repair architectural foundation
       ↓
earn parity + release evidence
       ↓
long-term canonical product
```

## For Devin / coding agents

1. Read the migration strategy first.
2. In `jeoPARODY`, read Devin's `docs/AUDIT_2026.md` and `docs/AUDIT_2026-07_REVIEW.md` work/review branches.
3. Repair jeoPARODY's P0 boot/runtime failures before broad feature migration.
4. Treat Jeopardish as a behavioral oracle and proving ground, not the permanent destination.
5. Port by vertical slice with explicit parity tests; do not wholesale-merge either repository.
6. Current Jeopardish Stage/host/episode work is valuable migration source material after it is proven.
