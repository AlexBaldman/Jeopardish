# JeoPARODY Donor Deep Mine

**Date:** 2026-08-07  
**Canonical repository:** `AlexBaldman/Jeopardish`  
**Donor repository:** `AlexBaldman/jeoPARODY`  
**Canonical branch reviewed:** `master` at `2c5731b`  
**Public donor baseline reviewed:** `main` at `e71d0dc`

## Executive Decision

The existing convergence strategy is correct: keep the Jeopardish history as the
canonical JeoPARODY executable and mine the older `jeoPARODY` repository for
behavior, fixtures, product requirements, and creative research.

This pass confirms that the donor still contains useful material beyond the
already-registered PAO, full-board, AI, asset, and content candidates. It does
**not** justify a wholesale merge, revival of the donor store/component runtime,
or a framework migration.

The strongest newly promoted donor opportunities are:

1. mastery and achievement projections;
2. event-driven ambient comedy;
3. developer instrumentation and state inspection;
4. explicit offline/PWA requirements;
5. additional question-pipeline fixtures and board-selection requirements.

The donor is best treated as a behavioral specification library. Source code is
accepted only when it fits an existing canonical owner and survives current
security, privacy, rights, accessibility, and release gates.

## Method

The public donor tree and representative implementations were inspected by
subsystem, then compared against the canonical runtime owners documented in
`docs/convergence/README.md`, `docs/CONVERGENCE_DONOR_LEDGER_2026-07-26.md`, and
`docs/convergence/registry.json`.

Each area receives one of four dispositions:

- **KEEP:** canonical implementation is already stronger; donor supplies tests or ideas only.
- **PORT:** donor behavior is sufficiently isolated to adapt directly behind a canonical boundary.
- **REBUILD:** preserve the behavior or requirement, but implement it through current owners.
- **ARCHIVE:** preserve as research/history without runtime work.

## Complete Donor Scorecard

| Donor area | Disposition | Value remaining | Canonical owner / destination |
| --- | --- | --- | --- |
| `src/components/pao/` | PORT / REBUILD UI | High | isolated `src/pao/` mode adapter |
| `FullboardGameService` | REBUILD | High | `EpisodeController` + `RoundKernel` format adapter |
| donor question service | REBUILD fixtures only | High | build-time content pipeline + `EpisodeContract` |
| achievements/statistics | REBUILD | High | learning ledger + product-event projections + earned artifacts |
| comedy ticker | REBUILD | Medium-high | localized presentation subscriber |
| AI `PromptBuilder` / personas | REBUILD | Medium-high | `HostPack` + future server-side dialogue gateway |
| AI provider orchestration | ARCHIVE implementation / KEEP requirements | Medium | fresh provider adapters behind gateway |
| AI settings diagnostics | REBUILD developer-only | Medium | future host/creator diagnostics surface |
| host mood system | KEEP vocabulary only | Medium | `HostPerformanceDirector` |
| host animation manager/integration | KEEP semantic beats only | Medium | canonical semantic motion primitives |
| dev HUD / dev menu | REBUILD | Medium | canonical development workbench/fixture tooling |
| service worker | REBUILD requirements only | Medium | release/offline architecture decision |
| persistence adapter/migrations | KEEP migration ideas only | Medium | existing domain-specific stores/session managers |
| selectors/store/reducer | ARCHIVE | Low | rejected parallel state owner |
| `GameControls` component | KEEP interaction fixtures only | Low-medium | canonical `InputController` + controls presentation |
| `QuestionDisplay` | ARCHIVE implementation | Low | canonical clue renderer/presenter |
| `MediaModal` / `MediaHandler` | KEEP uncovered fixtures only | Low-medium | canonical media preflight/modal |
| sound manager | ARCHIVE implementation | Low-medium | canonical `AudioController`; asset semantics reviewed separately |
| donor CSS layers | ARCHIVE / REJECT wholesale | Low | canonical owned cascade |
| design tokens/themes | KEEP uncovered visual ideas only | Medium | canonical semantic tokens |
| fonts/audio/host art | AUDIT | Potentially high | rights-reviewed asset manifest |
| Qwen image service stub | ARCHIVE code | Low | Host Studio provider architecture supersedes it |
| legacy Trebek/Watson host definitions | ARCHIVE content | Low | original HostPacks only |
| compatibility bridge / legacy event glue | REJECT | Negative | canonical contracts only |

## 1. PAO: Preserve the Product, Replace the Renderer

### Donor behavior worth preserving

The donor PAO surface already defines a useful product shape:

- multiple decks persisted locally;
- card identity with number, initials, emoji, person, action, object, and image;
- free-text search plus number/initial/emoji filters;
- multi-select, deletion, and batch metadata editing;
- card flip interaction;
- person/action/object retrieval quiz;
- lightweight attempt history;
- optional image-generation hook.

### Donor defects

The current component interpolates editable card values directly through
`innerHTML`. It also couples persistence, view rendering, quiz policy, prompt UI,
and image generation inside one component.

### Canonical decision

Keep `PAO-001`, but expand its behavior contract to include deck management,
filtering, batch metadata, retrieval attempts, and import/export. Render all
editable content with structured DOM/text APIs. Image generation belongs to a
creator tool or provider adapter, not PAO startup.

## 2. Full Board: Mine Selection Rules, Never Its State Ownership

### Useful donor requirements

`FullboardGameService` captures several requirements worth retaining:

- six categories by five clues;
- preferred-category selection with exact and partial matching;
- random, exact-date, year, and month board requests;
- board-position metadata;
- completion statistics and recent-board history.

The donor question service separately contains value-aware category assembly and
a deterministic date-board concept.

### Defects to reject

The service mutates clue objects with `completed` state and can assign synthetic
$200-$1000 values unrelated to source clue truth. Random fallbacks can also make
a nominally date-based board cease to represent that date without a strong
product distinction.

### Canonical decision

Keep `FORMAT-001`. Define a `BoardFormatContract` that converts validated clue
references into canonical episode/round inputs. Board selection may choose clues;
it may not own answer, reveal, score, Study, media, localization, or resume.
Source value and provenance remain explicit facts; presentation tiers are a
separate field if needed.

## 3. Content Pipeline: Expand `CONTENT-001`

The current registry points `CONTENT-001` primarily at older Jeopardish sharding
work. The donor `src/services/api/questionService.js` contains additional testable
requirements that deserve fixture-level intake:

- category extraction and minimum-category eligibility;
- category-specific retrieval;
- exact-date/year/month filtering;
- shard/index-first loading;
- JSON, TSV, and CSV parser fallback;
- bounded API timeout/failure behavior;
- local-first operation when external APIs fail;
- normalization of mixed category shapes;
- board selection near known clue values.

Do **not** port its runtime fallback chain, giant monolithic browser corpus, or
synthetic error-joke-as-question behavior. Instead add fixtures only where the
canonical build-time pipeline lacks coverage.

## 4. Mastery And Achievements: New Candidate Recommended

### Donor behavior worth preserving

`AchievementsModal` defines concrete progress hooks around:

- first correct response;
- best streak;
- single-session score;
- perfect runs;
- speed milestones;
- category mastery;
- multi-day return behavior;
- lifetime correct responses;
- lifetime score.

This is more valuable as a **mastery/artifact vocabulary** than as an achievement
modal.

### Defects to reject

The donor creates an independent `jeopardish_stats` truth store, increments
statistics from UI/event listeners, and risks double counting or divergence from
game/learning truth.

### Recommended registry candidate

`MASTERY-001` — Reinterpret donor achievements as read-only projections from
canonical episode facts, the learning ledger, and versioned product events.
Rewards may decorate or unlock experiences but cannot modify scoring truth.

**Suggested acceptance:**

1. every milestone can be recomputed from canonical facts;
2. replaying or resuming cannot double-count milestones;
3. category and multi-day progress survive version upgrades;
4. reward UI is localized and reduced-motion safe;
5. deleting/exporting local learning data has defined milestone behavior.

## 5. Ambient Comedy: New Candidate Recommended

### Donor behavior worth preserving

`comedyTicker` demonstrates a useful pattern: game events can trigger short
ambient lines without entering scoring or clue truth. It includes positive,
negative, streak, welcome, and random line categories plus a queue.

### Defects to reject

The donor implementation directly owns DOM placement, starts an unmanaged
interval, uses random vertical placement, runs very long animations, and lacks a
clear teardown/reduced-motion/accessibility contract.

### Recommended registry candidate

`COMEDY-001` — Build a localized, cancellable presentation subscriber that
receives bounded event facts and chooses deterministic or seeded ambient lines.
It must never obscure clue/input surfaces or become required for progress.

This should remain lower priority than authored-content depth and observed
player retention. Comedy is valuable; a thirty-second airplane crossing the
answer box is less so.

## 6. Host Motion And Mood: Vocabulary Already Absorbed

The donor host modules contain semantic ideas such as thinking, excited,
disappointed, celebrating, talking, waving, confused, pointing, nodding, and
shaking. The donor also maps performance facts to mood and occasional wardrobe
or image changes.

The implementation should remain archived because it combines global DOM
lookup, legacy and modern event names, timers, random animation choice, sound,
image cycling, and retry loops. The canonical runtime now has HostPacks,
HostAvatarPack, HostPerformanceDirector, and semantic motion primitives.

Action: mine donor scenarios into host-performance tests only when they represent
a useful beat not already covered by `enter`, `react`, `hold`, `recover`, and
`exit`.

## 7. AI: Preserve Contracts, Discard Browser Secrets

### Useful donor ideas

- event-shaped prompt building;
- persona-specific system instructions;
- provider order/fallback concepts;
- deterministic seed and temperature controls;
- diagnostics/test prompt UI;
- graceful fallback behavior.

### Hard rejects

The donor settings UI stores Gemini/Claude credentials in browser
`localStorage`. That behavior must never return. Raw player answers and reviewed
clue text should also not automatically leave the device merely because a prompt
builder knows how to include them.

`AI-001` remains the correct destination. The future gateway should accept a
versioned, privacy-reviewed context packet and return a constrained performance
or explanation result. Canonical clue truth and scoring remain immutable.

The donor `QwenImageService` is only a placeholder URL stub; it contributes no
implementation value. The newer canonical Host Studio architecture already has
a stronger provider-neutral creator-tool plan.

## 8. Developer Instrumentation: New Candidate Recommended

The donor dev HUD/menu includes several useful development behaviors:

- opt-in FPS visibility;
- event counters;
- score/streak snapshot;
- rapid theme/speech-surface cycling;
- audio initialization controls;
- local-only gating.

The existing implementation reaches through `app.gameEngine`, uses raw
`requestAnimationFrame`, and accumulates event subscriptions without a disposal
contract. Still, a **canonical debug workbench** would materially reduce the cost
of future format, host, and presentation work.

### Recommended registry candidate

`DEV-001` — Add a development-only inspector fed by stable public snapshots and
the event bus. Prefer extending `visual-fixtures.html` and deterministic fixture
controls over creating a second runtime shell.

Suggested panels: round phase, episode position, score/streak, active host/avatar,
media/localization transaction state, learning queue size, event trace, reduced
motion, viewport/theme, and optional frame-time sampling.

Production builds must exclude or inert the inspector.

## 9. Offline/PWA: New Evaluation Candidate Recommended

The donor service worker implements a small cache-first strategy for same-origin
assets, JSON, CSS, and JavaScript. The code itself is too blunt for adoption: it
has a fixed cache name, broad path matching, no explicit version manifest, and
can cache stale content indefinitely.

The requirement is still interesting because the canonical product increasingly
benefits from offline authored episodes and local review.

### Recommended registry candidate

`OFFLINE-001` — Evaluate whether installability/offline shell support improves the
daily-return product. If approved, generate cache entries from the audited
production manifest and prove update/rollback behavior. Do not cache canonical
content with an unversioned wildcard policy.

## 10. Persistence And Preferences: Canonical System Wins

The donor persistence layer contains worthwhile migration concepts:

- storage adapter abstraction;
- versioned records;
- defensive parse/write behavior;
- selective clearing;
- migration hooks.

It also maps multiple state slices to shared keys and belongs to the rejected
global-store architecture. The canonical `PreferenceStore`, `SessionManager`,
learning ledger, and domain-specific persistence owners should remain separate.

Action: use donor migration cases as fixtures when canonical stored schemas next
change. Do not port the persistence middleware.

## 11. Audio And Assets: Behavior Low, Provenance High

The donor `soundManager` shows useful operational concerns: initialize audio only
after user interaction, preload a tiny critical set, pool overlapping clips,
remember mute/volume, lazy-load failures, and fail without blocking play.

The implementation is not a port candidate because the canonical AudioController
already owns the concern and the donor registry points at historical Trebek audio.
The asset library itself remains potentially valuable research, but public
shipping depends entirely on rights/provenance review under `ASSET-001`.

## 12. Components And Store: Use As Fixture Sources

Donor `GameControls`, `QuestionDisplay`, modal classes, selectors, reducers, and
connected components demonstrate useful interaction cases but should not return
as runtime architecture.

Examples worth preserving as tests where missing:

- answer submission disabled after reveal;
- keyboard Enter paths;
- loading-state control gating;
- style/theme preference persistence;
- modal media cleanup;
- no-answer warning behavior;
- category/value rendering edge cases.

The donor's selectors use `JSON.stringify` comparisons for memoization and its
components sometimes return HTML strings containing question/answer data. Those
are additional reasons to mine scenarios rather than classes.

## Proposed Registry Delta

The live registry is already strong. This pass recommends adding only the gaps
that represent distinct future product work:

| ID | Priority | Disposition | Canonical owner | Depends on |
| --- | --- | --- | --- | --- |
| `MASTERY-001` | P2 | reinterpret | learning ledger + product-event projections | `CORE-001` |
| `COMEDY-001` | P3 | reinterpret | localized presentation subscriber | `CORE-001` |
| `DEV-001` | P2 | reinterpret | visual fixture/debug workbench | `CORE-001` |
| `OFFLINE-001` | P3 | reinterpret | audited production manifest + release shell | none initially |

Also expand `CONTENT-001` provenance to include donor
`src/services/api/questionService.js` and its parser/category/date/shard
requirements.

Do **not** change the one-active-implementation rule. Capturing more donor value
is useful; turning all of it into simultaneous active work would recreate the
problem this control plane exists to prevent.

## Mining Priority

### Now

1. Finish the currently active canonical convergence work.
2. Complete security/preservation gates that unblock donor evidence.
3. Fold donor question-service cases into `CONTENT-001` evaluation.
4. Write full acceptance contracts for PAO and full-board before implementation.

### Next product-expanding wave

1. `MASTERY-001` because it strengthens the daily-return learning loop.
2. `PAO-001` because it is a distinctive learning mode and isolated enough to
   remain safe.
3. `FORMAT-001` because full-board play expands the product while reusing the
   canonical engine.
4. `DEV-001` when those new modes materially increase inspection cost.

### Later

- `COMEDY-001` after playtests prove the core episode cadence;
- `AI-001` after security and content grounding gates;
- `OFFLINE-001` when installability/return behavior has a concrete product case.

## Automated Archaeology Tool: Recommended Shape

A future `scripts/audit-donor.mjs` should automate **inventory and drift
detection**, not pretend semantic architecture decisions can be inferred from
filenames.

Suggested inputs:

```text
--canonical <checkout>
--donor <checkout>
--registry docs/convergence/registry.json
```

Suggested output:

```text
- files/subsystems present only in donor
- files/subsystems already represented by registry provenance
- stale registry paths
- duplicated filenames and approximate text similarity
- production dependency differences
- asset-extension/size inventory
- unsafe-pattern findings (innerHTML, localStorage secret names, globals)
- event-name inventory and overlap
- localStorage key inventory and overlap
- test/fixture inventory
- candidate report in JSON + Markdown
```

It should never emit an automatic `PORT` decision. The script finds evidence;
the convergence registry records human/architectural decisions.

## Final Verdict

The donor has **not** been exhausted.

Its remaining highest-value material is primarily product behavior and edge-case
knowledge rather than superior application architecture. The canonical repo
already contains the right mechanism for absorbing that value. This pass should
therefore deepen the existing control plane rather than replace it.

The practical objective is now measurable: every meaningful donor subsystem
must end in exactly one state: represented by a canonical owner, represented by
a future convergence candidate, or explicitly archived/rejected with a reason.
When that matrix reaches 100%, `jeoPARODY` has been mined rather than merely
remembered.