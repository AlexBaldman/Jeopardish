# JeoPARODY Handoff — Read This First

## Current repository direction

The authoritative repository-role decision is now:

**`AlexBaldman/Jeopardish` `master` is the canonical executable and long-term consolidation target.**

**`AlexBaldman/jeoPARODY` `main` is the donor/R&D repository to mine comprehensively and eventually retire.**

Read [`JEOPARODY_REPOSITORY_CONSOLIDATION_2026-09-03.md`](JEOPARODY_REPOSITORY_CONSOLIDATION_2026-09-03.md) before any other handoff document.

### Supersession warning

The August 8 migration strategy and its reversed repository roles are historical. Its product, Stage, host, content, and roadmap material remains useful, but its direction is superseded by the September 3 consolidation decision.

Do not use older repository-role labels to reverse the migration again.

## Operating model

```text
jeoPARODY donor
       ↓ mine behavior/contracts/fixtures/assets/provenance
PORT / REBUILD / ARCHIVE / RETIRE
       ↓
Jeopardish canonical executable
       ↓ retirement gate
final JeoPARODY repository rename
```

## For Devin / coding agents

1. Read the September 3 consolidation decision first.
2. Treat Jeopardish owners and tests as canonical.
3. Use the convergence registry and donor retirement ledger for every donor family.
4. Port one bounded vertical slice with explicit parity/privacy tests.
5. Do not wholesale-merge either repository or create parallel owners.
6. Do not delete the donor until its full retirement gate passes and Alex approves the destructive step.
