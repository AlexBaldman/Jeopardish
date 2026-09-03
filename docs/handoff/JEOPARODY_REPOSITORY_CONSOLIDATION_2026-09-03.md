# JeoPARODY Repository Consolidation Decision

**Status:** CURRENT REPOSITORY-ROLE DECISION
**Date:** 2026-09-03
**Canonical executable:** `AlexBaldman/Jeopardish` `master`
**Donor slated for eventual retirement:** `AlexBaldman/jeoPARODY` `main`
**Working product title:** JeoPARODY; final capitalization remains open

## Decision

Continue the product in `AlexBaldman/Jeopardish`. Mine every valuable behavior, fixture, asset, requirement, proof, and piece of provenance from `AlexBaldman/jeoPARODY` into the existing canonical owners. Once the retirement gate is satisfied, retire the donor repository and rename the canonical repository to the final JeoPARODY spelling.

This decision supersedes the repository direction in [`JEOPARODY_CANONICAL_MIGRATION_STRATEGY_2026-08-08.md`](JEOPARODY_CANONICAL_MIGRATION_STRATEGY_2026-08-08.md) and the old `handoff/README.md`. Those files remain historical evidence explaining why work temporarily flowed in the other direction.

The product name and repository role are separate facts. Using JeoPARODY in player-facing copy does not make the same-named donor repository canonical.

## Why the direction changed

Jeopardish still has the deeper product/runtime foundation: authored episodes, deterministic RoundKernel and scoring/judgment, Study and learning memory, bilingual presentation, media preflight, versioned host/avatar/voice packs, privacy-safe telemetry, content/build audits, accessibility checks, and a large deterministic fixture wall.

Since the previous donor mine, jeoPARODY materially improved. Its August 2026 convergence campaign removed duplicate runtime owners and added valuable isolated systems, especially Needle Drop, reconnect-safe Head-to-Head multiplayer, semantic Show Director behavior, security and documentation contracts, Node 24 CI, and exact-live-SHA deployment proof. Those gains make it a richer donor; they do not justify another full architectural reversal.

## Consolidation flow

```text
jeoPARODY donor main + non-main branches
        ↓ inventory by behavior / asset / proof / provenance
KEEP | PORT | REBUILD | ARCHIVE | RETIRE
        ↓ one bounded candidate at a time
Jeopardish canonical owners + deterministic evidence
        ↓ retirement gate
archive/delete donor repository
        ↓
rename canonical repository to final JeoPARODY spelling
```

## Snapshot used for the renewed mine

| Repository | Revision | Role |
|---|---|---|
| `AlexBaldman/Jeopardish` | `379ba9d1f9413d8b7283bd5f13cbd1bb11d19197` | canonical baseline |
| `AlexBaldman/jeoPARODY` | `c96e85cc8a848e308a8af07e7b633547522791be` | donor baseline |

The file-family classification is in [`../convergence/DONOR_RETIREMENT_LEDGER_2026-09-03.md`](../convergence/DONOR_RETIREMENT_LEDGER_2026-09-03.md). The machine-enforced queue remains [`../convergence/registry.json`](../convergence/registry.json).

## Migration invariants

1. One active implementation and one owner per truth.
2. Preserve behavior and evidence; avoid copying architecture by habit.
3. Game/domain truth remains deterministic and upstream of Stage, host, transport, AI, and rendering.
4. Raw answers, clue text, credentials, and private competitive truth do not leak through presentation, telemetry, or public multiplayer state.
5. Donor CSS and DOM orchestration are reference material unless a canonical owner and fixture prove the port.
6. New modes may keep their own deterministic domain state while sharing lower-level contracts deliberately.
7. Production assets require provenance, rights, likeness, and packaging approval.
8. Rename only after code, documentation, deployment, links, package identity, and automation references have a tested migration plan.

## Donor retirement gate

The donor repository is disposable only when all of these are true:

- every tracked `main` file family has a recorded disposition;
- unique behavior has canonical tests or an explicit archival rationale;
- every non-main branch is inventoried for unique code, assets, docs, and provenance;
- security scanning covers current files and preserved refs without publishing secret values;
- external Firebase, Pages, workflow, environment, and domain configuration is either migrated or deliberately retired;
- asset manifests identify what can ship, what is reference-only, and what must be excluded;
- Needle Drop and Head-to-Head each have a final PORT / REBUILD / ARCHIVE decision with preserved evidence;
- an immutable private preservation bundle and restore drill exist;
- canonical release checks pass after the last accepted port;
- inbound links and references are redirected;
- Alex approves the final destructive retirement action.

Repository deletion is a separate, explicitly approved operation. This decision authorizes mining and consolidation, not deletion today.

## Immediate execution order

1. Establish this decision and refreshed retirement ledger as the routing truth.
2. Land the event-driven Stage cue slice derived from donor Show Director lessons.
3. Port Head-to-Head domain/privacy contracts before Firebase wiring.
4. Port Needle Drop as an isolated mode, beginning with its pure reducer/content/session contracts.
5. Reconcile CI/deployment/security guarantees without replacing the canonical static-build architecture.
6. Finish assets, dormant PAO/full-board/AI decisions, and non-main branch archaeology.
7. Run the retirement gate, preserve the final archive, then plan the repository rename.
