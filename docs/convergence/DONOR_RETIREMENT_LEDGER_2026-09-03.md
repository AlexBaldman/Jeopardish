# jeoPARODY Donor Retirement Ledger

**Status:** CURRENT REFERENCE REGISTER
**Donor revision:** `AlexBaldman/jeoPARODY@c96e85cc8a848e308a8af07e7b633547522791be`
**Canonical baseline:** `AlexBaldman/Jeopardish@379ba9d1f9413d8b7283bd5f13cbd1bb11d19197`

This ledger refreshes the August 7 mine after the donor added roughly 25,350 lines, removed roughly 27,702 lines, and changed 248 paths. Counts are archaeological scale, not a quality score; otherwise package-lock files would be our finest novelists.

The machine-enforced work queue is [`registry.json`](registry.json). This document groups the entire donor surface so eventual retirement cannot quietly forget a mode, deployment contract, or endangered asset family.

## Current classification

| Donor family | Disposition | Canonical treatment / evidence |
|---|---|---|
| Main Game answer judgment, scoring, and simplified `GameEngine` | **KEEP CANONICAL / ARCHIVE DONOR** | Donor convergence ports behavior descended from Jeopardish. Canonical `game-logic.js`, `GameEngine`, RoundKernel, episode/session owners, and 280-test baseline remain stronger. Mine only uncovered fixtures. |
| Duplicate component, controller, validator, store, and obsolete host families removed in donor PRs #59–#64 | **RETIRE** | Preserve the deletion rationale and historical audit. Do not reintroduce any removed parallel owner. |
| Semantic show events and Needle Drop `ShowDirector` | **REBUILD / PARTLY PORTED** | The sanitized-event, deterministic-performance, and disposable-director pattern informs canonical `StageDirector`. Donor copy/audio specifics remain mode-local reference. |
| `HostStageActor` and responsive Stage motion | **REBUILD** | Preserve movement, tail tracking, reduced-motion, and stage-rail behaviors. Reject global DOM access, unmanaged listeners, `Math.random`, and direct game-event choreography. Route through Stage and HostPerformanceDirector contracts. |
| Needle Drop pure domain (`core/content`, `round`, `session`, `party`, `showEvents`) | **PORT** | Strong isolated mode candidate. Start with reducer, immutable rights-gated content, deterministic seed/session behavior, and privacy-safe semantic events. |
| Needle Drop audio, presentation, persistence, recorder, stings, runtime/browser proof | **PORT / REBUILD** | Port adapters after the pure domain. Retain checksum validation, exact sample windows, procedural public-domain demo strategy, escaped markup, optional persistence, redacted receipts, and browser evidence. Adapt build/UI to canonical owners. |
| Head-to-Head match kernel and host authority | **PORT / REBUILD** | Preserve serializable commands, private adjudication until atomic reveal, idempotence, deterministic public state, ties, and reconnect behavior. Keep mode scoring separate from canonical solo scoring. |
| Local/Firebase room gateways, lifecycle, session recovery, Firestore rules/indexes | **PORT / REBUILD** | Port behind a canonical room/input adapter after the pure match contract. Preserve anonymous guest entry, room-code discovery, per-command durability, host secret recovery, 12-hour lifecycle, executable rules, and two-context reconnect proof. |
| Exact-live-SHA Pages deployment and cloud certification | **REINTERPRET** | Add guarantees that fit canonical deployment. Do not introduce a second publisher or force a Vite/Firebase migration merely to copy workflow shape. |
| Node 24 CI, doctrine/security/docs checks, source reachability, runtime evidence | **REINTERPRET** | Compare each assertion with canonical `verify` / `verify:release`; port only missing guarantees. Preserve the donor's one-owner documentation registry and append-safe handoff ideas where they reduce ambiguity. |
| Question service and bounded donor question assets | **ARCHIVE / ADAPT** | Canonical episode/content pipeline remains authoritative. Head-to-Head may need a narrow clue-provider adapter; no second question truth or browser corpus. |
| HostSystem, AI providers, rewrite integration, Qwen image work | **ARCHIVE / REBUILD LATER** | Preserve provider requirements and Qwen/image-edit research. Any runtime AI enters through a server-side provider-neutral gateway with deterministic fallback and no browser credentials. |
| PAO components | **PORT LATER** | Preserve as a lazy isolated easter egg with its own lifecycle/storage and exact game-session restoration. |
| Full-board service | **REFERENCE** | Extract selection/format requirements into EpisodeController/RoundKernel adapters; donor service does not become a competing engine. |
| `MediaHandler`, sound manager, comedy ticker, utilities/logger | **REFERENCE / SELECTIVE PORT** | Canonical media, audio, console narration, and presentation owners win. Port only missing low-level behavior with focused tests and teardown. |
| CSS/token/responsive-stage families | **ARCHIVE VISUAL BEHAVIOR** | Mine layouts and fixture expectations. Do not wholesale-layer donor CSS over the owned canonical cascade. |
| Trebek audio archive/transcription tooling and likeness-dependent assets | **ARCHIVE / RIGHTS HOLD** | Preserve inventory, transcripts, hashes, and research provenance privately. Exclude from production unless name, likeness, voice, and audio rights are cleared. |
| ICM project/world documents, glossary, and cross-project ideas | **DEDUPLICATE / ARCHIVE** | Merge missing durable concepts into canonical project memory/ICM owners. Avoid two mutable copies. |
| Needle Drop public-domain composition data | **PORT WITH VALIDATION** | Preserve composition provenance and original-performance requirement. Blind recognition testing remains necessary; commercial recordings require interactive-game rights. |
| Donor `main` documentation history and DEV_JOURNAL entries | **ARCHIVE** | Preserve milestone evidence and decisions. Current repository-role claims are superseded by the September 3 consolidation decision. |
| Donor non-main branches | **EVALUATE BEFORE RETIREMENT** | Inventory unique blobs and assets, especially Qwen, visual/stage, dependency/security, multiplayer, Needle Drop, and old Mac/refactor branches. Never merge branch families wholesale. |

## Port queue

### 1. Stage semantic contract — first slice implemented

Canonical files:

- `src/presentation/stage-engine.js`
- `src/presentation/stage-director.js`
- `tests/stage-director.test.mjs`

The slice covers `INTRO`, `CLUE`, `CORRECT`, `WRONG`, `ROUND_TRANSITION`, and `WINNER`; emits versioned deterministic cues; allowlists receipt facts; excludes clue/answer content; consumes HostPerformanceDirector events; and owns subscription teardown. Camera visuals, actor blocking, audio, FX, and comedy remain later presentation adapters.

### 2. Head-to-Head domain before transport

First preserve and adapt `core/match.js`, command vocabulary, privacy assertions, host-authority seam, and deterministic tests. Firebase arrives after the domain contract passes inside the canonical harness.

### 3. Needle Drop domain before spectacle

Port the reducer, rights-gated content manifest, deterministic sessions, and sanitized show events. Then adapt audio and presentation through existing canonical boundaries.

### 4. Proof-wall reconciliation

Create an assertion-by-assertion comparison between donor CI/runtime/security checks and canonical `verify:release`. Add a missing guarantee only when it protects a real product boundary.

### 5. Long-tail retirement

Finish assets/provenance, PAO, full-board, AI/Qwen, ICM deduplication, and non-main branch archaeology. The final gate lives in the September 3 consolidation decision.

## Explicitly rejected migration tactics

- merging donor `main` into canonical history;
- copying donor state/component architecture;
- installing Vite/Firebase solely to make donor files compile unchanged;
- introducing another correctness, score, question, persistence, host, or global UI owner;
- publishing likeness-dependent media because it already exists in Git;
- deleting the donor before non-main branch and asset provenance review.
