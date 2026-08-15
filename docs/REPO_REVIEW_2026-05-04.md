# Jeopardish Repo Review - 2026-05-04 EDT

Scope: local inspection of `/Users/alex/coding/Jeopardish`, docs review, and available verification.

## Summary

Jeopardish is currently the clean, dependency-free static MVP. The architecture is straightforward: browser scripts load in order, `app.js` coordinates state, `view.js` owns DOM rendering, pure game/session logic sits in separate modules, and question loading uses a starter pack plus manifest/shards.

## Verification

Passed:

```bash
npm run verify
```

Result:

- JavaScript syntax checks passed.
- Node test runner passed 18 tests.
- Static MVP contract checks now cover script order, required assets, DOM hooks, and manifest shard IDs.
- Question validation passed for 216,930 canonical questions, 10 starter questions, and 128 runtime shards.
- Question validation now checks each generated shard file length against `questions/manifest.json`.

## Findings

No blocking runtime issue was found in this pass.

Residual risks:

- Generated runtime shard files are large enough that future commits should be deliberate about whether they are tracked or rebuilt.
- `questions/manifest.json` assumes shard IDs align with `stableHash(id) % shardCount`; keep `scripts/shard-questions.mjs` and `question-bank.js` in sync.
- The historical audit docs still describe the older pre-cleanup state. [docs/README.md](README.md) now marks that boundary explicitly.

## Recommended Next Steps

1. Keep `npm run verify` as the merge gate.
2. Avoid reintroducing tracked `node_modules`, `.DS_Store`, or duplicate question dumps.
3. Add browser interaction smoke coverage only when the MVP flow changes beyond the current static contract checks.
