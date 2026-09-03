# Branch Convergence Audit - 2026-08-05

> **Repository-role update, 2026-09-03:** This audit remains useful for its
> historical branch disposition. Its repository-direction language is superseded
> by
> [`handoff/JEOPARODY_REPOSITORY_CONSOLIDATION_2026-09-03.md`](handoff/JEOPARODY_REPOSITORY_CONSOLIDATION_2026-09-03.md):
> `Jeopardish` is the canonical executable and `jeoPARODY` is the donor being
> mined toward retirement.

## Executive Decision

The verified `convergence/jeoparody-v3` line is the complete production
candidate and should be fast-forwarded to `master`. No remaining remote branch
is approved for a wholesale merge or a production cherry-pick.

This is not because every old patch is byte-for-byte present. It is because the
useful behavior has been rebuilt behind the current owners, tested more deeply,
and separated from obsolete Firebase, Genkit, monolithic CSS, duplicated assets,
and competing state systems.

## Fresh Evidence

- The remote was fetched and pruned before comparison.
- `convergence/jeoparody-v3` contains all 25 commits currently ahead of
  `master`; `master` has zero commits absent from the convergence line.
- `origin/github-pages`, `origin/mobile-first-overhaul`, and
  `origin/codex/review-and-clean-up-branches-gwfwry` are fully contained.
- Every other branch diverged before the modular runtime and carries an older
  application shape.
- Branch-only commit counts describe historical patches, not approved missing
  features. Their intended behavior was checked against current source, tests,
  architecture records, and the donor ledger.

## Branch Dispositions

| Branch | Decision | Valuable intent | Current disposition |
| --- | --- | --- | --- |
| `master` | Fast-forward | Production default | Promote the verified convergence line |
| `github-pages` | Retire | Historical Pages publishing | GitHub Actions now deploys immutable `dist/` |
| `mobile-first-overhaul` | Retire | Mobile-first containment | Fully merged and superseded by responsive fixtures |
| `review-and-clean-up-branches-gwfwry` | Retire | Clue-value scoring | Fully merged and tested |
| `coderabbitai/chat/44133fe` | Archive | Runtime hardening and triage | Superseded by domain owners and release gates |
| `review-and-clean-up-branches` | Archive | Fuzzy matching, lifecycle tests, triage | Rebuilt and covered by current suites |
| `review-and-clean-up-branches-bbyvi1` | Archive | Question normalization | Rebuilt in the bounded question pipeline |
| `review-open-pull-requests-for-mvp-optimizations` | Archive | Historical reports | No runtime behavior |
| `ui-revamp-jeoparody` | Archive | Visual modernization | Superseded by owned CSS and visual fixtures |
| `stupid` | Archive | Early host and mobile experiments | Host cycling and responsive placement are live |
| `implementing-some-newness` | Archive | Ticker, scoreboard, host skins, auth experiments | Strong ideas preserved selectively; obsolete runtime rejected |
| `mobile-ui-improvements` | Archive | Mobile controls and modals | Current focus, modal, and responsive contracts supersede it |
| `feature/responsive-fixes` | Archive | Containment fixes | Current multi-viewport matrix supersedes it |
| `carmack-refactor-v3` | Archive | Comedy ticker, AI host, host cycling | Host and AI boundaries are live; ticker remains a clean rebuild candidate |
| `create-american-handball-video-game-concept` | Preserve separately | Handball roadmap | Unrelated mode; never merge into trivia runtime wholesale |

## Confirmed Absorbed Behavior

- punctuation-, accent-, spacing-, alias-, transposition-, and typo-tolerant
  answer judgment with explainable fuzzy results;
- clue-value scoring and deterministic round ownership;
- bounded, validated question delivery with reviewed emergency fallback;
- responsive cabinet, centered clue presentation, host cycling, and reactions;
- animated scoreboard and explicit episode progress;
- bilingual category, clue, answer, UI, and source-language reveal;
- media preflight, substitution, and accessible image/audio/video modal behavior;
- console narration, voice input/output, and keyboard control;
- pausable Study flow, reinforcement, review queues, and local learning ledger;
- data-driven host packs and a provider-neutral, server-side AI roadmap;
- static production manifest, payload budgets, cross-engine smoke, full-episode
  proof, accessibility gates, and a 180-state visual matrix.

## Intentionally Deferred, Not Forgotten

These are preserved requirements rather than missing branch merges:

1. **Comedy ticker:** rebuild as a localized event subscriber after the core
   episode experience is commercially validated. Do not revive DOM polling or
   plane clipping from the historical branch.
2. **Accounts, profiles, and leaderboards:** require a current privacy, security,
   and product decision. Do not revive browser-exposed Firebase or Genkit code.
3. **PAO easter egg:** preserve as an isolated lazy mode with independent state.
4. **American handball:** preserve its roadmap outside the trivia runtime.

## Public Product Boundary

The logo Creative Room is an internal design tool. It is retained in source for
the team, marked `noindex`, removed from player navigation, and excluded from
the production manifest and release-route audits. The public product should
perform the identity rather than explain the design meeting that produced it.

## Result

After release verification, fast-forward `master` to this line and treat
`master` as the sole canonical branch. Old branches may remain as read-only
history until a separate remote-retirement pass, but none should receive new
work or be merged into the runtime.
