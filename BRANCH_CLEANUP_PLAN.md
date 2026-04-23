# Jeopardish Branch Cleanup + Production MVP Plan

## 1) Current Git Reality (as of 2026-04-03)

- Local branches available in this checkout: `work` only.
- No git remotes are currently configured in this local clone.
- Historic branch names can still be inferred from merge commit history.

### Historical branches seen in merge history

- `mobile-first-overhaul` (latest major UI update)
- `github-pages`, `gh-pages` (deployment-oriented)
- `alex-1`, `updates`, `newupdates`, `newnewnewnewnewnew`, `test`
- `dependabot/npm_and_yarn/multi-d54dc5d3e6`
- `master`

---

## 2) What to merge vs. retire

### Keep / preserve intent from

1. **`mobile-first-overhaul`**
   - Treat this as the baseline for your MVP UI/UX polish.
2. **Dependabot branch changes**
   - Keep dependency/security updates, but re-validate versions today.
3. **`github-pages` / `gh-pages`**
   - Keep only if GitHub Pages deployment is still part of your release path.

### Retire / archive candidates

- `test`, `newnewnewnewnewnew`, `newupdates`, and any one-off experiment branches.
- Duplicate deployment branches (`gh-pages` vs `github-pages`) — keep one naming convention.
- Any branch that has no unique commits compared to your production base.

---

## 3) Branch triage workflow (run when remote is configured)

```bash
# 0) connect remote if missing
# git remote add origin <repo-url>

git fetch --all --prune

# 1) list active + stale branches
git branch -a
git for-each-ref --sort=-committerdate refs/remotes --format='%(committerdate:short) %(refname:short) %(authorname) %(subject)'

# 2) find merged branches
git checkout main  # or master, whichever is the production base
git branch -r --merged

# 3) find unmerged branches
git branch -r --no-merged

# 4) compare each unmerged branch before deciding
# git log --oneline origin/main..origin/<branch>
# git diff --stat origin/main...origin/<branch>
```

Decision rubric:
- **Merge** if it improves UX, stability, accessibility, performance, or deploy reliability.
- **Cherry-pick** if only some commits are useful.
- **Close/delete** if obsolete, duplicated, or unreviewable.

---

## 4) Codebase cleanup priorities for a production-quality MVP

1. **Stop tracking dependency vendor files in git**
   - Keep `node_modules/` ignored (now handled via `.gitignore`).
2. **Consolidate legacy artifacts**
   - `backups/` and duplicate asset files should move to either:
     - `archive/` (not shipped), or
     - be removed after verifying no references.
3. **Standardize project layout**
   - Suggested structure:
     - `src/` for app logic
     - `public/` for static assets
     - `docs/` for plans/specs
4. **Add quality gates**
   - lint + format + basic CI checks on PRs.
5. **Define MVP quality bar**
   - mobile-first responsive pass
   - keyboard accessibility
   - Lighthouse performance + accessibility thresholds

---

## 5) Recommended immediate next actions

1. Configure `origin` remote in this clone.
2. Run the triage workflow above and create three lists:
   - **merge now**
   - **cherry-pick later**
   - **delete/archive**
3. Open one "MVP hardening" branch for:
   - file structure cleanup
   - dependency refresh
   - accessibility/performance pass
4. Freeze ad-hoc branches and enforce PR naming/review rules.

---

## 6) Suggested branch policy going forward

- `main` = production-ready only.
- `develop` (optional) = integration branch.
- `feature/<ticket>-<slug>` for all new work.
- Auto-delete branch after merge.
- Require passing checks + at least one review.
