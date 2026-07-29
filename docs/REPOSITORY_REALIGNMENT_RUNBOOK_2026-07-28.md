# JeoPARODY Repository Realignment Runbook

**Prepared:** 2026-07-28  
**Status:** Private preservation and restore drill complete; promotion not approved
**Governs:** Preservation, canonical branch promotion, deployment continuity,
and any future repository rename

## Executive Decision

Do not rename either repository now.

The immediate problem is not the GitHub slug. It is that:

- the strongest runtime is ahead of its default and deployed branch;
- three historical worktrees contain preserved but uncurated changes;
- an older tracked integration test contains a live-shaped Gemini credential;
- neither repository has branch protection or a ruleset;
- both repositories publish separate GitHub Pages project sites;
- GitHub does not redirect project Pages URLs after a repository rename;
- reusing the old `JeoPARODY` name would destroy the donor repository redirect.

The safe sequence is:

```text
ROTATE
  -> PRESERVE
  -> RESTORE-TEST
  -> PROTECT
  -> PROMOTE
  -> DEPLOY
  -> STABILIZE URL
  -> RECONSIDER NAME
```

No unrelated-history merge and no third repository are recommended.

## Expert Panel

The preflight used four independent review lenses:

| Lens | Main conclusion |
| --- | --- |
| Pragmatic product governance | Canonical branch and deployment ownership matter before naming |
| Git/source-control preservation | A rename can work only after verified backups and promotion |
| Release engineering | Pages URLs and repository-name reuse make a quick swap unsafe |
| Digital preservation | Three dirty worktrees and a credential require private capture and restore testing |

The panel disagreed only about whether a future exact rename is worth the
provenance cost. It unanimously agreed on the first five phases below.

## Verified Live State

### Canonical candidate

| Fact | Value |
| --- | --- |
| GitHub repository | `AlexBaldman/Jeopardish` |
| Immutable repository ID | `270805020` |
| Default branch | `master` |
| Deployed commit | `b9dc873` |
| Candidate branch | `convergence/jeoparody-v3` |
| Preservation baseline | `205d746` |
| Divergence at preservation | 14 commits ahead, clean linear descendant |
| Pages | `https://alexbaldman.github.io/Jeopardish/` |
| Pages mode | GitHub Actions |
| Open PRs | 7 historical PRs; none for convergence |
| Rulesets / branch protection | None |
| Actions secrets | None |

### JeoPARODY donor

| Fact | Value |
| --- | --- |
| GitHub repository | `AlexBaldman/jeoPARODY` |
| Immutable repository ID | `1034476118` |
| Default branch | `main` |
| Published commit | `e71d0dc` |
| Dirty worktree | `cleanup/production-readiness` at `1f97c4d` |
| Unpublished branch work | 3 commits plus 5,489 changed lines |
| Second linked worktree | `branch-merge-mvp-plan`, 9 unpublished commits and modified screenshots |
| Pages | `https://alexbaldman.github.io/jeoPARODY/` |
| Pages mode | Legacy branch publishing plus workflow/package alternatives |
| Open PRs | 3 |
| Production dependency audit | 6 vulnerabilities |
| Rulesets / effective protection | None |

### Older Jeopardish migration worktree

`/Users/alex/coding/jeopardish` is four commits behind its remote and contains:

- modified application and configuration files;
- 144 staged deletions, including tracked dependency and data cleanup;
- untracked session, question-bank, view, sharding, tests, and documentation;
- generated question shards and coordination material.

It is historical evidence, not a development target.

## Phase 0: Security Stop

### Finding

`/Users/alex/coding/jeoparody/tests/integration/test-gemini-integration.js`
contains a hard-coded string matching the shape of a Gemini API key.

The value must never be printed into logs, docs, patches, or chat. Treat it as
compromised because the repository and its history are public.

**Rotation status:** The repository owner confirmed on 2026-07-28 that the key
was deleted at the provider. A replacement may be created later only through
the server-side `HostDialogueGateway` contract in
`HOST_AI_DIALOGUE_ROADMAP.md`; it must never be placed in browser code.

### Required actions

1. Record the owner's provider-side deletion confirmation.
2. Replace the tracked test value with an environment-variable contract during
   curated donor preservation.
3. Run a repository-wide secret scan across all refs and dirty files.
4. Keep pre-sanitization bundles private with restrictive local permissions.
5. Do not rewrite public history until complete verified backups exist and the
   consequences for existing clones are separately approved.

### Gate

**CLEARED FOR PRIVATE PRESERVATION.** Public archival branches remain blocked
until the tracked test is sanitized and the all-ref secret scan is reviewed.

## Phase 1: Forensic Preservation

Create a dated preservation root outside every repository. Capture:

### Git history

- complete `--all` bundles for both Git databases;
- all local and remote refs;
- branch, tag, release, PR, Pages, environment, and repository-ID inventories;
- bundle verification output.

### Dirty state

For each worktree, capture separately:

- staged binary patch;
- unstaged binary patch;
- untracked-file archive;
- selected ignored-file archive;
- file-size and SHA-256 manifest;
- exact porcelain status;
- current branch, HEAD, upstream, and worktree location.

### Exclusions

Do not place these in preservation commits:

- `node_modules/`;
- `dist/`;
- `coverage/`;
- `.DS_Store`;
- transient logs;
- generated docs-site data unless its source cannot reproduce it.

### Separate asset archive

Preserve large artwork, visual baselines, and screenshots with checksums outside
Git until rights, authorship, and runtime need are classified.

### Gate

**PASSED 2026-07-28.** Complete Git bundles, separate dirty-state captures,
private permissions, manifests, and checksums are recorded in
`REPOSITORY_PRESERVATION_REPORT_2026-07-28.md`.

## Phase 2: Restore Drill

Backups are not proven until restored.

1. Clone each bundle into a temporary directory.
2. Restore each staged patch, unstaged patch, and untracked archive.
3. Compare restored status and file manifests with the source worktree.
4. Confirm branches, tags, and commit counts.
5. Run the appropriate tests from the restored source where dependencies permit.
6. Record the drill results in the preservation manifest.

### Gate

**PASSED 2026-07-28.** Every captured worktree restored to the same HEAD and
the exact same porcelain status. Independent checksum verification passed.

## Phase 3: Curated Preservation Branches

After rotation and restore proof, convert valuable WIP into reviewable commits.

### JeoPARODY donor commits

Keep separate:

1. bootstrap and `src/init/` extraction;
2. question-service and translation hardening;
3. scoring and validation changes;
4. host and AI-development-tool changes;
5. UI and CSS work;
6. PAO behavior;
7. planning and salvage documents.

Hold for explicit review:

- deletion of `docs/MASTER_PLAN.md`;
- `.cursor/` plans;
- generated `site/` output;
- runtime screenshots;
- large generated art;
- real-host audio and likeness-dependent assets.

### Older Jeopardish commits

Keep separate:

1. tracked dependency and `.DS_Store` hygiene;
2. duplicate data deletion;
3. session, question-bank, and view behavior;
4. shard builder, manifest, and starter pack;
5. tests and developer documentation.

Do not pull or reconcile the older worktree until its dirty state is preserved.

### Gate

**STOP** before pushing any branch that fails secret, size, or rights review.

## Phase 4: Protect The Canonical Candidate

Before promotion:

1. Create a `master` ruleset.
2. Block branch deletion and force pushes.
3. Require a pull request.
4. Require the `validate` CI job.
5. Keep a documented administrator rollback path.
6. Restrict the `github-pages` environment to `master`.
7. Remove obsolete deployment allowances for `alex-1` and `github-pages` only
   after confirming they are not needed for rollback.

Do not rename `master` during this campaign.

## Phase 5: Promote And Deploy

1. Open a PR from `convergence/jeoparody-v3` to `master`.
2. Review the complete convergence delta at the PR head.
3. Run the complete GitHub PR gate.
4. Preserve the individual convergence commits; do not squash them.
5. Merge only after required checks pass.
6. Verify the push-to-`master` production workflow.
7. Verify exact-artifact smoke, accessibility, visual fixtures, Pages deploy,
   and post-deploy canary.
8. Run the Season Zero proof against the deployed URL.
9. Record the deployed SHA and artifact evidence.

This separates code-promotion failure from repository-identity failure.

### Gate

**STOP** unless `master` is the verified canonical runtime in production.

## Phase 6: Stable Product Address

GitHub officially excludes project Pages URLs from repository-rename redirects.
The preferred mitigation is a custom domain attached to repository ID
`270805020`.

If a domain is available:

1. configure DNS and GitHub Pages verification;
2. enforce HTTPS;
3. verify landing, `game.html`, assets, Study, media, voice, and finale;
4. soak the domain before any repository rename.

If no domain is available:

- keep the current repository names for now; or
- explicitly accept that `/Jeopardish/` and `/jeoPARODY/` Pages links will not
  redirect after a rename.

## Phase 7: Repository-Name Decision

Reconsider naming only after Phases 0 through 6.

### Option A: Keep repository names

- Product remains JeoPARODY.
- `Jeopardish` is documented as the canonical runtime repository.
- `jeoPARODY` is documented as the donor archive.

Lowest technical risk, highest ongoing naming friction.

### Option B: Rename canonical to `jeoparody-game`

- Rename `Jeopardish` to an unambiguous new slug.
- Preserve the historical `jeoPARODY` repository and its links.
- Avoid repository-name reuse and redirect collision.

Best provenance compromise.

### Option C: Exact name swap

1. Rename donor ID `1034476118` to `JeoPARODY-legacy`.
2. Update every donor remote and add local push guards.
3. Verify all donor refs, PRs, tags, releases, and archives.
4. Explicitly accept that historical old-JeoPARODY URLs will resolve to the new
   canonical repository after name reuse.
5. Rename canonical ID `270805020` to `JeoPARODY`.
6. Update all canonical remotes and references.
7. Redeploy and verify.

Cleanest product slug, highest provenance and stale-clone risk.

### Decision rule

Choose a rename only when:

- all dirty work is preserved;
- credential and rights reviews pass;
- canonical `master` is deployed and protected;
- a stable product URL exists;
- redirect consequences are explicitly accepted;
- the naming benefit exceeds the migration and provenance cost.

## Rollback

### Application failure

Do not reverse repository names for an ordinary deployment failure. Redeploy the
last known-good `master` artifact.

### Repository-identity failure

1. Pause releases.
2. Restore repository names in reverse order.
3. Verify immutable repository IDs.
4. Restore recorded remotes and Pages settings.
5. Redeploy known-good `master`.
6. Keep the custom domain attached to canonical repository ID `270805020`.

No branches, tags, repositories, bundles, or preservation archives are deleted
during the initial soak window.

## First Approved Work Package

The first executable package should contain only:

1. credential-rotation confirmation;
2. read-only inventory capture;
3. private checksummed bundles and dirty-state archives;
4. restore drill;
5. preservation report.

It must not include:

- repository renames;
- default-branch changes;
- merges;
- history rewrites;
- donor cleanup;
- bulk commits;
- deployment changes.

After that package is reviewed, proceed to curated preservation and canonical
branch promotion as separate approvals.

## Official GitHub Constraints

- [Renaming a repository](https://docs.github.com/en/repositories/creating-and-managing-repositories/renaming-a-repository)
- [About custom domains and GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/about-custom-domains-and-github-pages)
- [Managing remote repositories](https://docs.github.com/en/get-started/git-basics/managing-remote-repositories)

## Final Verdict

The repository mismatch is real, but a quick name swap would create avoidable
risk. The optimal correction is staged canonicalization:

> secure the credential, preserve every line, prove restoration, protect and
> deploy the winning runtime, establish a stable product URL, then decide
> whether renaming still earns its cost.
