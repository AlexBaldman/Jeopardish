# AGENTS.md — JeoPARODY Canonical Repository

Read this before changing the repository.

## Current repository decision

- `AlexBaldman/Jeopardish` `master` is the canonical executable and source of current product truth.
- `AlexBaldman/jeoPARODY` `main` is a donor/R&D repository being mined toward retirement.
- JeoPARODY is the current working product title. Repository naming changes only after donor retirement gates pass.
- [`docs/handoff/JEOPARODY_REPOSITORY_CONSOLIDATION_2026-09-03.md`](docs/handoff/JEOPARODY_REPOSITORY_CONSOLIDATION_2026-09-03.md) supersedes the reversed August 8 migration direction.

## Read order

1. `AGENTS.md`
2. `docs/README.md`
3. `docs/PROJECT_MEMORY.md`
4. `docs/CURRENT_STATE.md`
5. `docs/ROADMAP.md`
6. `docs/convergence/README.md` and `docs/convergence/registry.json` for donor work
7. the relevant active contract for the subsystem being changed

Detailed dated audits are evidence, not automatic authority. Prefer the newest routed decision and verified runtime behavior.

## One owner per truth

Do not create parallel owners for scoring, judgment, rounds, episodes, learning, persistence, localization, media, input, host performance, Stage state, or global UI state. Adapt a donor behavior to the existing owner or explicitly replace that owner in one verified change.

Stage and host systems consume semantic facts. They may dramatize correctness or score; they may not decide either.

## Donor-mining contract

Every donor family receives one disposition:

- `KEEP`: canonical implementation already owns the truth; retain it and mine only missing evidence or behavior.
- `PORT`: isolated implementation fits canonical ownership with bounded adaptation.
- `REBUILD`: preserve behavior and tests, then implement through canonical owners.
- `ARCHIVE`: preserve useful research, provenance, fixtures, or history without runtime adoption.
- `RETIRE`: redundant, unsafe, superseded, or valueless after evidence is preserved.

For each port, record the donor revision and paths, target owner, risks, acceptance criteria, verification evidence, and superseded action in the convergence registry. The current registry maps `REBUILD` to `reinterpret`, `RETIRE` to `reject` or `archive`, and represents `KEEP` through verified canonical ownership. Only one candidate may be implementing at a time.

Never wholesale-merge donor runtime, CSS, stores, services, or branch histories. Preserve assets and provenance before branch or repository retirement.

## Main stays boring

Use a focused branch. Keep `master` deployable. Avoid unrelated refactors and broad dependency changes while migrating a bounded behavior.

## Verification

Run the smallest relevant checks while iterating, then the canonical verification appropriate to the change. A substantive runtime slice normally requires:

```text
syntax + unit/contract tests
+ convergence registry validation
+ CSS/assets/content audits when touched
+ production build and artifact audit
+ browser/accessibility/visual proof when behavior is visible
```

Record anything not verified. Donor deletion requires the full retirement gate in the current consolidation decision; “we probably got it all” is not a storage format.
