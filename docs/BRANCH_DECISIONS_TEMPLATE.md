# Branch Decisions (Template)

Use this after generating a report via:

```bash
scripts/branch-triage-report.sh main
# or
scripts/branch-triage-report.sh master
```

## Snapshot Metadata

- Date:
- Reviewer:
- Base branch:
- Report file:

## Merge now

- branch:
  - reason:
  - risk:
  - owner:

## Cherry-pick later

- branch:
  - commit(s):
  - reason:
  - owner:

## Archive / delete

- branch:
  - reason:

## Follow-up tasks

- [ ] Remove stale remote branches after merge.
- [ ] Ensure branch protection and required checks are enabled.
- [ ] Add release tag for MVP checkpoint.
