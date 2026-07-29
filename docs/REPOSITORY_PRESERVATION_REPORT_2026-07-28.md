# Repository Preservation Report

**Captured:** 2026-07-28  
**Result:** Verified  
**Scope:** Three Git databases, four active worktrees  
**Security:** Private local evidence; no credential values appear in this report

## Outcome

The repository realignment can proceed without guessing what might be lost.
Each Git database has a complete `--all` bundle, and each worktree has separate
captures for staged changes, unstaged changes, and untracked files.

Every worktree was reconstructed in a temporary clone. All four restored to the
same commit and exact porcelain status as their source. An independent SHA-256
verification then passed for every preserved file.

The source repositories were not changed by the preservation or restore drill.

## Captured State

| Repository | Worktree | Branch | HEAD | Changed paths | Untracked |
| --- | --- | --- | --- | ---: | ---: |
| Canonical runtime | Canonical convergence | `convergence/jeoparody-v3` | `205d746` | 2 | 0 |
| JeoPARODY donor | Production readiness | `cleanup/production-readiness` | `1f97c4d` | 65 | 36 |
| JeoPARODY donor | Branch merge review | `branch-merge-mvp-plan` | `f47e65e` | 9 | 0 |
| Historical Jeopardish | Migration worktree | `master` | `a27b366` | 317 | 164 |

The canonical runtime's two changed paths were the security and realignment
documentation prepared immediately before capture.

## Bundle Evidence

| Git database | Size | SHA-256 |
| --- | ---: | --- |
| Canonical runtime | 388,728,853 bytes | `bc5cc2aedf14a7ef5fb77940aa27ecd3841b2b8b3c87579a28aa98d5c2cac55e` |
| JeoPARODY donor | 151,442,567 bytes | `a3d3f1d911ae67143f6efee0cb0274893cc225dc9369a016036e5703edcef561` |
| Historical Jeopardish | 353,836,774 bytes | `9207418a9a4637acec38a6012b6696f92c1875a7d34472e58a16f19d297fc209` |

The complete private preservation set is approximately 1.0 GB. Its local
manifest includes full refs, worktree locations, branch and tag inventories,
bundle verification, repository integrity output, file hashes, exact status
records, patches, untracked archives, and ignored-file inventories.

## Restore Results

| Worktree | HEAD match | Exact status match |
| --- | --- | --- |
| Canonical convergence | Pass | Pass |
| Donor production readiness | Pass | Pass |
| Donor branch merge | Pass | Pass |
| Historical Jeopardish migration | Pass | Pass |

`SHA256SUMS` was checked independently after the report was generated. Every
listed file passed.

## Credential Boundary

The repository owner confirmed that the previously exposed Gemini credential
was deleted at the provider on 2026-07-28. The private bundles intentionally
preserve historical truth and therefore must remain private.

A future Gemini free-tier credential may be introduced only through the
server-side `HostDialogueGateway` described in `HOST_AI_DIALOGUE_ROADMAP.md`.
No provider key may enter browser-delivered code or checked-in configuration.

## Next Gate

The next phase is curated preservation, not merging:

1. Sanitize the tracked donor integration test.
2. Scan all refs and dirty files for credentials without printing values.
3. Divide donor and historical work into small, reviewable preservation commits.
4. Classify generated assets, screenshots, likeness-dependent media, and docs
   output before any public branch is pushed.
5. Stop for review before canonical protection or promotion.

Repository renames, default-branch changes, deployment changes, public archival
branches, and unrelated-history merges remain out of scope.
