# Canonical Convergence Control Plane

This directory is the operational answer to “how do we combine the best parts
without making another tangled rebuild?”

The canonical product is **JeoPARODY**. The canonical executable is
`AlexBaldman/Jeopardish` `master`. `AlexBaldman/jeoPARODY` is the donor being
mined toward retirement; the September 3 consolidation decision is authoritative.

## Working Rule

No donor code enters the canonical runtime merely because it exists or looks
more modular. A candidate moves forward only when the registry identifies:

1. the exact source repository, revision, and path;
2. the behavior or requirement worth preserving;
3. the existing canonical owner that receives it;
4. dependencies and risks;
5. acceptance criteria proving parity or improvement;
6. evidence after verification;
7. what happens to the superseded implementation.

## Workflow

```mermaid
flowchart LR
    A["Captured"] --> B["Evaluating"]
    B --> C["Approved"]
    B --> X["Rejected or archived"]
    C --> D["Implementing"]
    D --> E["Verified"]
    D --> F["Blocked"]
    F --> C
```

Only one candidate may be `implementing` at a time. This keeps the lead domino
visible and prevents half-integrated systems from competing for ownership.

Statuses mean:

| Status | Meaning |
| --- | --- |
| `captured` | Preserved and named; no implementation decision |
| `evaluating` | Comparing behavior, architecture, evidence, and risk |
| `approved` | Target owner and acceptance criteria are agreed |
| `implementing` | The sole active convergence change |
| `blocked` | Approved work has a named external or dependency blocker |
| `verified` | Acceptance evidence exists and superseded behavior is resolved |
| `archived` | Valuable research or history; no runtime work planned |
| `rejected` | Conflicts with canonical contracts or product direction |

## Priority Queue

The registry is ordered by leverage and dependency:

1. `STAGE-001`: land the privacy-safe semantic Stage cue slice.
2. `MULTI-001`: port Head-to-Head domain/privacy contracts before transport.
3. `NEEDLE-001`: port Needle Drop's pure domain before audio/presentation.
4. `SEC-001` / `OPS-001`: finish all-ref security and branch preservation.
5. `ASSET-001`: establish a rights-reviewed production asset manifest.
6. `PAO-001`, `FORMAT-001`, and `AI-001`: integrate bounded product systems
   through canonical contracts.
7. `CONTENT-001`: mine only missing historical content-pipeline fixtures.

Priority does not override dependencies. A visually exciting candidate stays
captured until the systems it depends on are verified.

## Verified Canonical Foundations

`UI-001` establishes the visual ownership rule for future convergence work:

- `styles/tokens.css` owns shared tactile and semantic primitives;
- `styles/game/cabinet.css` owns stage geometry;
- `styles/game/dialogue.css` owns clue hierarchy, skins, and attribution;
- `styles/game/controls.css` owns the answer deck and primary action keycaps;
- `styles/game/host.css` owns host presentation and host-selection controls.

Historical Jeopardish and donor JeoPARODY styles remain reference material, not
runtime layers. A useful donor behavior may enter through one of these owners
only after it is named, tested, and verified across the deterministic light/dark
viewport matrix. The project is converging in place; it is not starting over.

## Updating The Registry

Use `TICKET_TEMPLATE.md` for investigation notes or implementation plans. Then
update `registry.json` in the same change.

Run:

```bash
npm run validate:convergence
```

The validator rejects duplicate IDs, unknown states, missing provenance,
dependency cycles, unsafe credential-shaped values, finished work without
evidence, and more than one active implementation.

## Decision Boundaries

- Do not merge unrelated histories.
- Do not start feature work in donor worktrees.
- Do not create a second owner for scoring, rounds, episodes, Study, input,
  localization, media, presentation, or preferences.
- Do not copy generated assets into production without provenance and rights.
- Do not let AI rewrite canonical clue or answer truth.
- Do not mark work verified because it compiles; attach the acceptance evidence.

The donor ledger remains the broad comparative record. This registry is the
live queue and must stay smaller, stricter, and current.
