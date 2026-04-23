#!/usr/bin/env bash
set -euo pipefail

BASE_BRANCH="${1:-main}"
OUT_DIR="${2:-reports}"
DATE_UTC="$(date -u +%Y-%m-%d)"
OUT_FILE="${OUT_DIR}/branch-triage-${DATE_UTC}.md"

mkdir -p "$OUT_DIR"

if ! git rev-parse --git-dir >/dev/null 2>&1; then
  echo "Not a git repository." >&2
  exit 1
fi

REMOTE_COUNT="$(git remote | wc -l | tr -d ' ')"
HAS_BASE=0
if git show-ref --verify --quiet "refs/heads/${BASE_BRANCH}" || git show-ref --verify --quiet "refs/remotes/origin/${BASE_BRANCH}"; then
  HAS_BASE=1
fi

{
  echo "# Branch Triage Report (${DATE_UTC} UTC)"
  echo
  echo "- Base branch target: \`${BASE_BRANCH}\`"
  echo "- Remotes configured: ${REMOTE_COUNT}"
  echo

  echo "## Local branches"
  echo
  git for-each-ref --sort=-committerdate refs/heads --format='- `%(refname:short)` | %(committerdate:short) | %(authorname) | %(subject)'
  echo

  echo "## Remote branches"
  echo
  if [ "$REMOTE_COUNT" -eq 0 ]; then
    echo "_No remotes configured in this clone._"
  else
    git for-each-ref --sort=-committerdate refs/remotes --format='- `%(refname:short)` | %(committerdate:short) | %(authorname) | %(subject)'
  fi
  echo

  echo "## Historic branch names inferred from merge commits"
  echo
  git log --merges --pretty=%s | \
    sed -nE "s/.*from [^/]+\/(.+)$/\1/p; s/.*Merge branch '([^']+)'.*/\1/p" | \
    sort | uniq -c | sort -nr | sed 's/^/ - /'
  echo

  if [ "$HAS_BASE" -eq 1 ]; then
    if git show-ref --verify --quiet "refs/heads/${BASE_BRANCH}"; then
      RESOLVED_BASE="$BASE_BRANCH"
    else
      RESOLVED_BASE="origin/${BASE_BRANCH}"
    fi

    echo "## Branches merged into ${RESOLVED_BASE}"
    echo
    git branch -a --merged "$RESOLVED_BASE" | sed 's/^/ - /'
    echo

    echo "## Branches NOT merged into ${RESOLVED_BASE}"
    echo
    git branch -a --no-merged "$RESOLVED_BASE" | sed 's/^/ - /'
    echo
  else
    echo "## Merge status checks"
    echo
    echo "Could not resolve base branch \`${BASE_BRANCH}\`."
    echo "Run again with an existing base, e.g.:"
    echo
    echo "\`scripts/branch-triage-report.sh master\`"
    echo
  fi

  echo "## Recommended action template"
  echo
  cat <<'TEMPLATE'
Fill this section during review:

- merge-now:
  - 
- cherry-pick-later:
  - 
- archive-delete:
  - 
TEMPLATE
} > "$OUT_FILE"

echo "Wrote $OUT_FILE"
