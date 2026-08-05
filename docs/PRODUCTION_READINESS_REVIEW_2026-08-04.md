# JeoPARODY Production Readiness Review

**Reviewed:** 2026-08-04  
**Canonical branch:** `master`
**Purpose:** identify the shortest honest path from a strong vertical slice to a product people can trust, return to, and eventually buy.

## Executive Verdict

JeoPARODY is now a credible **private alpha**, not a sellable public product.

The difficult technical foundation exists: deterministic gameplay, a reviewed
episode, resilient media, bilingual UI, fuzzy judgment, Study pause/resume,
local learning memory, voice fallback, host-performance boundaries, a coherent
design system, and a serious release harness. Starting over would destroy
leverage.

The remaining blockers are product blockers rather than evidence that the
architecture failed:

1. the public identity and current host artwork are not yet clean original IP;
2. one ten-clue episode cannot support a paid-content promise;
3. authored clues still depend on network machine translation for their main
   Portuguese presentation;
4. no consented playtest evidence currently answers whether people finish,
   learn, laugh, return, or dispute rulings;
5. security, privacy, font provenance, CSP, and asset-rights decisions need a
   release record rather than scattered notes.

Payments are not the next domino. First make something lawful, repeatable, and
observable enough that charging for it would be an honest exchange.

## Evidence Snapshot

| Surface | Current evidence | Readiness |
| --- | --- | --- |
| Gameplay truth | One scoring owner, one phase owner, deterministic fuzzy judge | Strong |
| Episode flow | Ten-clue authored arc, finale, replay, emergency fallback | Strong alpha |
| Learning | Study, reviewed sources, confidence, dispute, memory rematch | Strong alpha |
| Host system | Three deterministic packs, bounded performance commands | Strong foundation |
| Voice | Narration and push-to-talk as optional enhancement | Alpha-ready |
| Translation | UI bilingual; clue translation can depend on a public network provider | Needs production work |
| Media | Preflight, substitution, modal, local standby | Strong |
| Presentation | Owned component styles and 180-state responsive fixture matrix | Strong alpha |
| Accessibility | Automated desktop/phone Chromium and WebKit gate | Strong automated baseline |
| Reliability | 234 tests, complete episode proof, emergency transport proof | Strong |
| Performance | 5.47 MB standalone cold first-party route; 35.6 MB total artifact | Acceptable alpha |
| Security | No package vulnerabilities; secret isolation and CSP record incomplete | Needs release gate |
| Rights | Prototype likeness and reference-heavy identity remain | Public-launch blocker |
| Content depth | One authored episode | Paid-product blocker |
| Product evidence | Privacy-safe event vocabulary, no approved collection sink | Unknown demand |
| Commerce | No account, entitlement, catalog, checkout, or refund model | Correctly deferred |

## What Changed In This Pass

- `ScoreboardView` now owns score, streak, best, progress, flip animation, and
  drawer interaction presentation without owning score truth.
- `FinaleView` now owns the completion receipt without owning episode outcomes.
- `Renderer` remains the stable facade and fell from 1,072 to 991 lines.
- The release command now includes the complete Season Zero browser proof.
- GitHub Actions now blocks deployment on the episode proof, cross-engine
  accessibility audit, and all 180 visual states.
- A browser-only timer binding regression was caught by the strengthened release
  path, fixed, and covered by a direct regression test.

## Highest-Leverage Dominoes

### 1. Original-IP Preview Pack

Create one coherent, provenance-recorded public pack:

- original host design with no real-person likeness dependency;
- custom JeoPARODY wordmark that preserves the inserted-O joke without depending
  on confusing trade dress;
- self-hosted, licensed fonts;
- original or licensed day/night scene art, sound cues, and host voice;
- machine-readable rights manifest mapping every shipped asset to origin, owner,
  license, intended use, and approval state.

**Exit:** the production manifest contains only approved original/licensed assets,
and the game remains visually recognizable with all reference-only assets removed.

### 2. Authored Bilingual Content Pipeline

Move reviewed episodes away from runtime machine translation:

- add reviewed `pt-BR` category, clue, answer, explanation, and host-line fields
  to the episode contract;
- prefer bundled authored localization, then on-device translation, then bounded
  network fallback for archive mode only;
- validate accepted aliases in both languages;
- ship at least three episodes with different educational/comedic arcs;
- add an editorial receipt for fact review, language review, media review, and
  rights review.

**Exit:** the paid-quality episode loop is fully playable offline in English and
Portuguese, with no network translation required for canonical content.

### 3. Instrumented Private Alpha

Use the existing privacy-safe event vocabulary with explicit consent:

- local playtest session identifier, never account identity;
- activation, completion, Study enter/resume, dispute, reinforcement, replay,
  and bounded failure events only;
- one-click export for private playtests before any hosted analytics sink;
- qualitative prompt after completion: fun, clarity, trust, and desire to play
  another episode;
- test with enough people to observe repeated failure patterns, not merely gather
  compliments.

**Exit:** evidence shows where players leave, what they dispute, whether Study
helps, and whether they request another episode.

### 4. Daily Return Loop

Turn the existing learning ledger into a reason to come back:

- transparent due-date scheduling;
- one daily episode plus a short memory rematch;
- episode history and earned artifacts;
- no account requirement for the first public preview;
- optional backup/export before cloud sync.

**Exit:** a returning local player receives a useful, explainable session based
on prior attempts.

### 5. Grounded Coach Gateway

Add AI only where it creates the differentiated promise:

- server-side provider keys;
- reviewed clue packet and approved sources as the only factual context;
- cancellable, source-linked explanations with uncertainty states;
- generated host performance candidates separated from canonical truth;
- deterministic Study mode remains fully useful when the provider is absent.

**Exit:** the coach deepens a topic without changing score, answer eligibility,
or reviewed fact truth.

### 6. Commerce After Retention Evidence

The first sensible commercial shape remains:

- free daily broadcast and local review;
- paid authored season packs, host packs, or educator/family bundles;
- no paywall around basic answer judgment or previously purchased learning data;
- entitlement service isolated from gameplay truth;
- clear refund, deletion, export, and privacy behavior.

Do not build subscription complexity until players complete, return, and ask for
more content.

## Technical Work That Continues In Parallel

- Reduce `app.js` from 651 lines by extracting one proven command/presentation
  workflow at a time; avoid framework migration.
- Continue renderer extraction only for stable cabinet behavior; 991 lines is
  improved but still broad.
- Replace external Google Font requests with approved self-hosted files.
- Define a deployable CSP and test it against every route.
- Complete 200% zoom and real-device screen-reader checks manually.
- Preserve the no-secret client rule for future AI, translation, and commerce.
- Keep archive questions as research/fallback input, not the paid editorial
  product.

## Go/No-Go Gates

### Private Alpha

- [x] Complete episode works in Chromium and WebKit.
- [x] Offline question transport produces reviewed playable content.
- [x] Critical responsive and accessibility states are automated.
- [x] No dependency vulnerabilities found.
- [ ] Original-IP preview pack selected or access explicitly restricted.
- [ ] Consent and playtest data handling documented.

### Public Free Preview

- [ ] Original host, logo, fonts, scenes, voice, and cues approved for use.
- [ ] Three reviewed bilingual episodes.
- [ ] CSP, privacy notice, asset manifest, and deployment rollback record.
- [ ] Manual zoom, keyboard, screen-reader, and real-device passes.
- [ ] Observed playtest failures triaged and corrected.

### Paid Pilot

- [ ] Completion and return evidence supports a content offer.
- [ ] Catalog, entitlement, checkout, refund, deletion, and export contracts.
- [ ] At least one meaningful content season beyond the free preview.
- [ ] Support and incident ownership documented.

## Decision

The next primary campaign is **Original-IP Preview Pack plus authored bilingual
content**. It unlocks lawful public testing, improves reliability, and creates
the first thing that could honestly become a paid catalog. Continue coordinator
cleanup as bounded parallel maintenance; do not let it postpone player evidence.
