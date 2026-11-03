# November 3, 2026 — Visual Run Contract pilot

**Status:** proposed pilot, pending integrated GitHub CI and review.

## Why this repository

The user identifies the `Jeopardish` runtime as the nearer target for gameplay experience, visual personality, and eventual product presentation. Earlier cross-repository plans named `jeoPARODY` as a long-term target. Treat that as a historical migration proposal pending fresh comparison, rather than permission to replace the preferred working experience or styling system.

The established browser visual fixture runner already produces 210 combinations of 15 states, 2 themes and 7 viewports, with screenshots and geometry findings. The run contract wraps **that existing proof**: it requires every intended state, accurate metadata, the original geometry results, and a readable screenshot for every case. A digest fingerprints the observed screenshot set. Failed cases produce exact IDs.

## Run

```bash
npm test
npm run test:visual
node scripts/verify-visual-contract.mjs contracts/visual-cabinet.v1.json
```

The last command writes `screenshots/visual-fixtures/run-contract-evidence.json`. CI uploads it as an artifact, including when visual-state checks fail.

## Boundaries

- Existing fixture tests remain the behavioral/geometry authority.
- The verifier has only file-read and summary-write access; no agents, arbitrary commands, deploy authority or automatic retries.
- A green automated result **does not** certify that the art direction is appealing, that images match an approved reference, or that real iPhone Safari behaves identically. Those require visual/physical review.
- This pilot modifies no gameplay, host art, shared state, CSS, public URL, or repo-wide migration priority.

## Exit criteria

One successful CI run proving the exact checked master-based branch, 210 valid case records, 210 readable screenshots, zero geometry findings, inspectable evidence output, and deliberate human review before merge. Promote the verifier to shared uINVERSE tooling only if a second independent product actually needs it.
