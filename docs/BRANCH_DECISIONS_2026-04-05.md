# Branch Decisions — 2026-04-05

## Snapshot Metadata

- Date: 2026-04-05 (UTC)
- Reviewer: Codex + repo owner
- Base branch used for triage: `work`
- Triage report: `reports/branch-triage-2026-04-05.md`
- Repo reality in this clone: **no remote configured**, so merge/delete actions are currently recommendations until `origin` is attached.

## Decision Summary (from historical merge metadata)

### Merge now (if still unmerged in remote)

1. `mobile-first-overhaul`
   - reason: latest UI modernization branch, likely closest to current MVP UX baseline.
   - risk: medium (verify responsiveness regressions and asset references).
   - owner: product/frontend.

2. `dependabot/npm_and_yarn/multi-d54dc5d3e6`
   - reason: dependency/security update stream should be retained if not superseded.
   - risk: low/medium (run smoke tests + CI).
   - owner: maintainer.

### Cherry-pick later

1. `github-pages` / `gh-pages`
   - reason: deployment-oriented changes may still be useful, but keep one canonical deployment path.
   - action: cherry-pick only deploy pipeline/static hosting commits you still need.
   - owner: maintainer/devops.

2. `alex-1`
   - reason: likely mixed feature/experiment commits.
   - action: cherry-pick specific production-safe commits after review.
   - owner: maintainer.

### Archive / delete (after remote verification)

1. `test`
   - reason: exploratory branch naming, low long-term value.
2. `newupdates`
   - reason: non-descriptive and likely superseded.
3. `newnewnewnewnewnew`
   - reason: experimental branch, poor traceability.
4. duplicate deployment branch (`gh-pages` or `github-pages`)
   - reason: keep one naming convention only.

## Required Verification Before Deleting Any Branch

Run these once `origin` is configured:

```bash
git remote add origin <repo-url>        # if missing
git fetch --all --prune

# verify branches with unique commits
for b in mobile-first-overhaul dependabot/npm_and_yarn/multi-d54dc5d3e6 github-pages gh-pages alex-1 test newupdates newnewnewnewnewnew; do
  echo "=== $b ==="
  git log --oneline origin/work..origin/$b | head -n 20 || true
  git diff --stat origin/work...origin/$b | head -n 20 || true
done
```

Delete only branches with zero required unique commits:

```bash
git push origin --delete <branch>
```

## Production MVP Hardening Queue (next 3 PRs)

1. **PR 1: repo hygiene + structure**
   - move archival artifacts under `archive/`
   - remove dead duplicate assets not referenced by runtime files.

2. **PR 2: UX polish + accessibility**
   - keyboard navigation review, focus states, contrast checks.

3. **PR 3: release readiness**
   - lock CI required checks
   - tag MVP release
   - branch protection + auto-delete merged branches.
