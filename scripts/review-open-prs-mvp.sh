#!/usr/bin/env bash
set -euo pipefail

BASE_BRANCH="${1:-work}"
OUT_DIR="${2:-reports}"
DATE_UTC="$(date -u +%Y-%m-%d)"
OUT_FILE="${OUT_DIR}/pr-mvp-review-${DATE_UTC}.md"

mkdir -p "$OUT_DIR"

remote_count="$(git remote | wc -l | tr -d ' ')"

have_gh=0
if command -v gh >/dev/null 2>&1; then
  have_gh=1
fi

open_pr_rows=""
open_pr_count=0

if [ "$have_gh" -eq 1 ] && [ "$remote_count" -gt 0 ]; then
  if gh repo view >/dev/null 2>&1; then
    # number\ttitle\thead\tbase\tisDraft\tupdatedAt\turl
    open_pr_rows="$(gh pr list --state open --limit 200 --json number,title,headRefName,baseRefName,isDraft,updatedAt,url --template '{{range .}}{{.number}}\t{{.title}}\t{{.headRefName}}\t{{.baseRefName}}\t{{.isDraft}}\t{{.updatedAt}}\t{{.url}}\n{{end}}')"
    if [ -n "$open_pr_rows" ]; then
      open_pr_count="$(printf '%s' "$open_pr_rows" | awk 'NF>0' | wc -l | tr -d ' ')"
    fi
  fi
fi

{
  echo "# Open PR + MVP Review (${DATE_UTC} UTC)"
  echo
  echo "- Base branch target: \`${BASE_BRANCH}\`"
  echo "- Remotes configured: ${remote_count}"
  echo "- GitHub CLI available: $([ "$have_gh" -eq 1 ] && echo yes || echo no)"
  echo

  echo "## Open pull requests"
  echo

  if [ "$open_pr_count" -eq 0 ]; then
    echo "No open PR metadata could be loaded from this checkout."
    echo
    echo "Possible reasons:" 
    echo "- No remote configured in this clone."
    echo "- GitHub CLI is unavailable or unauthenticated."
    echo "- Repo has no open pull requests."
  else
    echo "| PR | Title | Head | Base | Draft | Updated (UTC) |"
    echo "|---:|---|---|---|---|---|"
    while IFS=$'\t' read -r number title head base draft updated url; do
      [ -z "${number}" ] && continue
      echo "| [#${number}](${url}) | ${title} | \`${head}\` | \`${base}\` | ${draft} | ${updated} |"
    done <<< "$open_pr_rows"
  fi

  echo
  echo "## MVP-oriented merge recommendations"
  echo
  echo "1. **Merge now (if still open and not yet in ${BASE_BRANCH})**"
  echo "   - \`mobile-first-overhaul\` (UX modernization baseline)."
  echo "   - \`dependabot/npm_and_yarn/multi-d54dc5d3e6\` (dependency/security improvements)."
  echo "2. **Cherry-pick selectively**"
  echo "   - \`github-pages\` / \`gh-pages\` deployment commits only (pick one deploy strategy)."
  echo "   - \`alex-1\` after commit-level review."
  echo "3. **Close/delete once verified no unique commits**"
  echo "   - \`test\`, \`newupdates\`, \`newnewnewnewnewnew\`, and duplicate deploy branch naming."

  echo
  echo "## Lost-change recovery checklist"
  echo
  cat <<'RECOVER'
Run this once `origin` is attached:

```bash
git fetch --all --prune
for b in mobile-first-overhaul dependabot/npm_and_yarn/multi-d54dc5d3e6 github-pages gh-pages alex-1 test newupdates newnewnewnewnewnew; do
  echo "=== $b ==="
  git log --oneline origin/work..origin/$b | head -n 25 || true
  git diff --stat origin/work...origin/$b | head -n 25 || true
done
```
RECOVER

  echo
  echo "## Deploy-updated-version plan"
  echo
  cat <<'DEPLOY'
1. Merge/cherry-pick approved PRs into `work`.
2. Run quality gates:
   - `npm run check:js`
   - `npm run validate:questions`
   - `npm test`
3. Build a release commit/tag:
   - `git tag -a v1.0.0-mvp -m "Publishable MVP"`
4. Deploy to your chosen target (GitHub Pages or host of record) and smoke-test desktop/mobile.
DEPLOY
} > "$OUT_FILE"

echo "Wrote $OUT_FILE"
