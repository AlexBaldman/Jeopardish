# External Audit Reconciliation

**Updated:** 2026-08-08  
**Purpose:** preserve outside reviews without allowing stale donor-repo findings
to become the current backlog.

## Source Preservation

Five unique reports supplied through the project conversation are preserved
verbatim in [`history/external-audits/`](history/external-audits/). Two uploads
of the comprehensive implementation plan were byte-identical, so only one copy
is retained.

| Preserved source | SHA-256 prefix | Context |
| --- | --- | --- |
| Carmack cofounder triage | `4cfb313f6e79` | Old JeoPARODY stabilization branch |
| Devin full application audit | `b36465e652b8` | Old JeoPARODY `main` at `e71d0dc` |
| Comprehensive implementation plan | `f1482029cb20` | Generic plan derived from old architecture |
| Full project audit | `bb4d386c0f10` | Old donor worktree plus comparative review |
| Hermes follow-up audit | `44d2a80596af` | Old stabilization branch follow-up |

The duplicate upload had the same full hash as the retained implementation
plan and contains no additional recommendation.

## Recommendation Disposition

| Recommendation | Current verdict | Evidence |
| --- | --- | --- |
| Start over or promote dormant component/store code | Rejected | Canonical runtime now has explicit owners and deep journey tests |
| Add a dependency-injection framework | Rejected | `ApplicationComposition` provides a small composition root without framework machinery |
| Fix reveal-then-score exploit | Resolved | Round kernel separates correctness from credit eligibility and tests reveal flow |
| Remove browser URL API keys | Resolved in canonical runtime | No provider credential path exists in the shipped app; server boundary remains required |
| Replace data-bearing `innerHTML` | Resolved for canonical presentation | Focused views use text nodes/structured media; security remains a release gate |
| Stop shipping the entire archive | Resolved | Static production manifest ships curated runtime content and audits payload |
| Make accessibility a real browser gate | Resolved as automated baseline | Preview-server axe audit and visual matrix run in release verification |
| Add real production smoke and episode tests | Resolved | Built-artifact smoke plus complete Season Zero proof |
| Unify answer matching and fuzzy tolerance | Resolved | Canonical judge covers aliases, normalization, accents, punctuation, typo distance, and explanations |
| Make modes reuse one kernel | Accepted and ongoing | Incomplete public modes were removed; future formats remain registry candidates |
| Build one complete episode before expanding | Resolved | Season Zero is authored, finite, tested, and includes finale and emergency fallback |
| Add Review Misses / learning loop | Resolved foundation | Study, confidence, dispute, ledger, and Memory Rematch are live |
| Improve host animation architecture | Resolved foundation | Versioned avatar, animation, personality, voice, and project contracts are separate |
| Create a broad animation framework | Narrowed | Semantic host clips exist; no general framework or runtime sprite engine until assets require it |
| Add Storybook | Deferred | Deterministic visual fixtures cover current component states with less infrastructure |
| Add A/B testing | Deferred | Private playtest export and consent come before experimentation infrastructure |
| Add PurgeCSS | Rejected for now | Explicit static manifest and CSS ownership audits provide safer production control |
| Self-host fonts and establish CSP | Accepted, still open | Public-release gate in the production readiness review |
| Establish original/licensed asset provenance | Accepted, still open | Original-IP preview pack and rights manifest remain top public-launch blocker |
| Ship multiple authored bilingual episodes | Accepted, still open | Current paid-product blocker |
| Secure grounded AI gateway | Accepted, intentionally deferred | Requires security boundary, reviewed context, provider fallback, and cost controls |

## Branch Audit Result

The 2026-08-05 convergence line is already contained in the Jeopardish
`master`. No unmerged historical branch is approved for wholesale merge.
Jeopardish remains the current proving ground while jeoPARODY is repaired as
the long-term destination. Valuable intent from fuzzy
matching, mobile layout, host cycling, scoring, media, and release tooling is
either implemented behind current owners or retained in the donor ledger.

Still-preserved ideas are not accidental omissions:

- localized comedy ticker;
- accounts, profiles, and leaderboards after a privacy decision;
- isolated PAO easter egg;
- canonical full-board format adapter;
- grounded AI host gateway;
- historical content fixtures;
- separately bounded American handball work.

Fresh August branches add planning worth preserving without changing that
merge rule: donor deep-mine findings, a presentation-only Stage contract,
Sprite Foundry production specifications, and the broader uINVERSE platform
thesis. Their runtime experiments are not merge-ready and must enter only
through composition, lifecycle, accessibility, and parity contracts.

## Audit Rule Going Forward

An outside report creates an investigation candidate, not a ticket. Before a
recommendation enters the roadmap, verify:

1. which repository and revision it inspected;
2. whether the described code is on the active import path;
3. whether newer tests or contracts already supersede it;
4. whether it adds a second owner for existing truth;
5. whether its cost is justified by a current release gate.
