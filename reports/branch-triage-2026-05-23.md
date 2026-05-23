# Branch Triage Report (2026-05-23)

Base branch: `origin/master`

This review fetched the live GitHub remote and compared all unmerged remote branches against `origin/master`.

## Already Integrated

- `origin/mobile-first-overhaul`
  - Already merged into `origin/master`.
  - No action needed.
- `origin/codex/review-and-clean-up-branches-gwfwry`
  - Already merged into `origin/master`.
  - Its clue value scoring and parser coverage are already part of the baseline.
- Cleanup basics from earlier Codex branches
  - `.gitignore`, `.github/workflows/ci.yml`, validation script, branch-triage docs, and `game-logic.js` coverage are already present on `master`.

## Integrated Now

- `origin/dependabot/npm_and_yarn/form-data-4.0.5`
  - Applied only `package-lock.json`.
  - Updates transitive `form-data` from `4.0.0` to `4.0.5`.
  - Kept app code unchanged.

## Do Not Merge Wholesale

- `origin/carmack-refactor-v3`
  - Huge mixed branch: full app rewrites, tracked generated assets, screenshots, AI/Trebek experiments, Firebase/Genkit material, large audio/image additions, and `node_modules` churn.
  - Useful ideas: host animation manager, sound manager, comedy ticker, AI host notes, modular state concepts.
  - Recommendation: mine selectively after the current clean engine/renderer/data boundaries stabilize.

- `origin/implementing-some-newness`
  - Huge mixed branch: Firebase login/profile/leaderboard experiments, UI rewrites, asset reorganizations, and `node_modules` churn.
  - Useful ideas: auth/profile/leaderboard concepts, modal patterns, alternate assets.
  - Recommendation: do not deploy from it; cherry-pick only intentional product features later.

- `origin/stupid`
  - Clearly marked as a side branch for breaking changes.
  - Recommendation: archive/delete after confirming no specific asset is still wanted.

- `origin/feature/responsive-fixes`
  - Large asset/file reorganization with old-version folders and duplicate runtime files.
  - Recommendation: do not merge. Compare visual ideas only if a design pass needs them.

## Cherry-Pick Later, If Wanted

- `origin/ui-revamp-jeoparody`
  - Small, focused UI revamp diff compared with the giant branches.
  - Touches `app.js`, `index.html`, and `style.css`.
  - Recommendation: manually inspect style ideas during a dedicated visual polish pass, rather than merging over the new modular architecture.

- `origin/mobile-ui-improvements`
  - Contains mobile/modal/title-bar ideas but is based on an older app shape.
  - Recommendation: cherry-pick concepts, not files.

- `origin/github-pages`
  - Deployment branch is stale relative to `master`.
  - Recommendation: keep GitHub Pages deployment sourced from `master` if repository settings allow it, or replace the branch from current `master` when deploying.

- `origin/codex/review-open-pull-requests-for-mvp-optimizations`
  - Adds process reports/scripts, not runtime improvements.
  - Recommendation: optional docs-only cherry-pick if you want the historical PR review note.

## Delete / Archive Candidates

These appear obsolete, experimental, or superseded:

- `origin/stupid`
- `origin/feature/responsive-fixes`
- `origin/codex/create-american-handball-video-game-concept`
- `origin/coderabbitai/chat/44133fe`
- `origin/codex/review-and-clean-up-branches`
- `origin/codex/review-and-clean-up-branches-bbyvi1`
- `origin/codex/review-open-pull-requests-for-mvp-optimizations`

Do not delete branches until after the current work is pushed and GitHub Pages is verified.

## Deployment Note

`gh` is installed locally but not authenticated in this environment, so GitHub Pages settings could not be queried through the GitHub API. Use one of these after authentication:

```bash
gh api repos/alexBaldman/Jeopardish/pages
```

or verify in the GitHub repository settings whether Pages is sourced from:

- `master` branch root, or
- `github-pages` branch root, or
- a GitHub Actions workflow.
