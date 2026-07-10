# Branch Audit + Deployment Plan — 2026-07-10

## Executive Verdict

The current Jeopardish working snapshot should become the new testable deployment line after the host-presence pass lands and the current dirty worktree is intentionally committed.

Do **not** merge the large stale experiment branches wholesale. They contain useful ideas, but also old screenshots, `.DS_Store` files, historical app copies, Firebase/Genkit experiments, source dumps, and broad asset churn. Treat them as salvage archives, not integration branches.

## Repo Reality

- Active working clone: `2026-05-24/prior-conversation-with-codex-conversation-role/Jeopardish`
- Current branch: `master`
- Current configured `origin`: local path to the older `2026-05-22/.../Jeopardish` clone
- Older clone remote: `https://github.com/alexBaldman/Jeopardish.git`
- Online fetch status from this sandbox: DNS/network unavailable for direct GitHub lookup during this audit
- Existing CI: `.github/workflows/ci.yml`
  - validates question data
  - runs `npm run check:js`
  - runs `npm test`

## Current Branch Matrix

Compared against `origin/master` from the older clone after `git fetch --all --prune`.

| Branch | Ahead | Behind | Verdict | Notes |
|---|---:|---:|---|---|
| `origin/master` | 0 | 0 | keep | Current upstream baseline. |
| `origin/github-pages` | 0 | 0 | keep as alias or delete later | Same commit as master; no unique content. |
| `origin/mobile-first-overhaul` | 0 | 7 | already absorbed | No diff from its merge base; intent is already in history. |
| `origin/codex/review-and-clean-up-branches-gwfwry` | 0 | 5 | already absorbed | Clue value scoring/parser work appears merged. |
| `origin/dependabot/npm_and_yarn/form-data-4.0.6` | 1 | 0 | merge/cherry-pick | Small dependency lockfile update. Validate after package refresh. |
| `origin/ui-revamp-jeoparody` | 1 | 8 | inspect/cherry-pick only | Only `app.js`, `index.html`, `style.css`; likely useful visual ideas, but superseded by current design work. |
| `origin/codex/create-american-handball-video-game-concept` | 1 | 6 | archive or docs cherry-pick | Adds handball roadmap only; not MVP critical. |
| `origin/codex/review-open-pull-requests-for-mvp-optimizations` | 1 | 4 | cherry-pick tooling/report if useful | Adds PR review script/reports; not runtime. |
| `origin/coderabbitai/chat/44133fe` | 4 | 6 | mostly absorbed, inspect only | Runtime hardening/tooling commits overlap current architecture. |
| `origin/codex/review-and-clean-up-branches` | 6 | 6 | mostly absorbed | Branch triage and logic extraction ideas are already present or superseded. |
| `origin/codex/review-and-clean-up-branches-bbyvi1` | 3 | 6 | mostly absorbed | Normalize/question-bank and CodeRabbit fixes; current tests should be source of truth. |
| `origin/stupid` | 12 | 9 | archive/delete after salvage | Contains early mobile/header/host-image experiments; do not merge. |
| `origin/implementing-some-newness` | 52 | 9 | salvage archive | Plane, scoreboard, ticker, Firebase attempts. Ideas useful; branch too noisy to merge. |
| `origin/mobile-ui-improvements` | 56 | 9 | salvage archive | Mobile and modal ideas, but includes broad old asset/file churn. |
| `origin/feature/responsive-fixes` | 59 | 9 | salvage archive | Some responsive fixes, but huge generated/archive footprint. |
| `origin/carmack-refactor-v3` | 61 | 9 | salvage archive | Contains AI host, ticker, cycling, speech-bubble ideas; too large/noisy for merge. |

## Salvage Targets

Pull ideas or small diffs from these branches only after the MVP line is stable:

1. `carmack-refactor-v3`
   - host image cycling
   - comedy ticker
   - AI host prompt/personality docs
   - responsive speech-bubble fixes

2. `implementing-some-newness`
   - plane/ticker direction fixes
   - scoreboard/header experiments
   - Firebase/auth notes only as future reference

3. `mobile-ui-improvements` / `feature/responsive-fixes`
   - any mobile containment tricks not already reproduced
   - title-bar/modal interaction ideas

4. `ui-revamp-jeoparody`
   - small visual/UI ideas from `app.js`, `index.html`, `style.css`

## Cleanup Order

1. Finish Host Presence System v1 on the current snapshot.
2. Run the quality gates:
   - `npm run check:js`
   - `npm test`
   - `node scripts/validate-questions.mjs`
   - browser smoke at desktop and mobile widths
3. Commit the current working snapshot to a new branch, e.g. `mvp/arcade-vision-host-stage`.
4. Push that branch to GitHub when network is available.
5. Deploy that branch to a test URL.
6. After the deployed build is verified, prune branches in this order:
   - delete `github-pages` if GitHub Pages no longer needs a branch alias
   - delete branches already absorbed with no unique diff
   - archive noisy experiment branches after extracting named salvage items

## Deployment Recommendation

For the fastest online test build, use a static host with this repo root as the publish directory.

### GitHub Pages path

- Keep `master` or a dedicated deploy branch as the source.
- This app is static and does not currently need a bundler.
- Required shipped files include:
  - `index.html`
  - `style.css`
  - `app.js`
  - `landing.js`
  - `game-logic.js`
  - `src/`
  - `assets/`
  - `questions/jeopardy-questions.json`

### Safer preview path

Deploy a preview branch first:

```bash
git checkout -b mvp/arcade-vision-host-stage
npm run check:js
npm test
node scripts/validate-questions.mjs
git add index.html style.css app.js package.json src assets docs tests landing.js game-logic.js scripts .github questions
git commit -m "Build arcade vision testable MVP slice"
git remote set-url origin https://github.com/alexBaldman/Jeopardish.git
git push -u origin mvp/arcade-vision-host-stage
```

Then connect that branch to GitHub Pages or open a PR into the configured Pages source.

## Deploy Blockers Observed Here

- This clone's `origin` points to another local folder, not GitHub.
- Direct `github.com` resolution failed from this sandbox during audit.
- The working tree is dirty with substantial intentional changes, so deployment should happen from a deliberate branch/commit, not an ad-hoc push.
- The repo is large for a static site (`questions/` and `assets/` dominate), but still deployable. Future MVP cleanup should move non-runtime archives out of the published root.

## Next Lead Domino

Proceed with **Host Presence System v1**, then create the preview deploy branch. That gives the online build the best visible jump: new scenes plus a host that feels like a real character in the world.
