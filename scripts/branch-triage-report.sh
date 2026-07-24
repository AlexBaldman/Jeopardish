#!/usr/bin/env bash
set -euo pipefail

CURRENT_BRANCH="$(git branch --show-current 2>/dev/null || true)"
BASE_BRANCH="${1:-${CURRENT_BRANCH:-master}}"
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
    git for-each-ref --sort=-committerdate refs/remotes \
      --format='%(if)%(symref)%(then)%(else)- `%(refname:short)` | %(committerdate:short) | %(authorname) | %(subject)%(end)' | \
      sed '/^$/d'
  fi
  echo

  if [ "$HAS_BASE" -eq 1 ]; then
    if git show-ref --verify --quiet "refs/heads/${BASE_BRANCH}"; then
      MATRIX_BASE="$BASE_BRANCH"
    else
      MATRIX_BASE="origin/${BASE_BRANCH}"
    fi

    echo "## Divergence from ${MATRIX_BASE}"
    echo
    echo "| Branch | Base-only commits | Branch-only commits | Patch-unique commits |"
    echo "|---|---:|---:|---:|"
    while IFS= read -r branch; do
      read -r base_only branch_only <<< "$(git rev-list --left-right --count "${MATRIX_BASE}...${branch}")"
      patch_unique="$(git cherry "$MATRIX_BASE" "$branch" | awk '$1 == "+" { count += 1 } END { print count + 0 }')"
      echo "| \`${branch}\` | ${base_only} | ${branch_only} | ${patch_unique} |"
    done < <(
      git for-each-ref --sort=refname refs/heads refs/remotes \
        --format='%(if)%(symref)%(then)%(else)%(refname:short)%(end)' | \
        sed '/^$/d'
    )
    echo
  fi

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
