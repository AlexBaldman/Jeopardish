# Foundation Cleanup Sprint

**Date:** 2026-07-23

## Executive Result

This sprint converted the game's styling and asset pipeline from a stack of accumulated redesigns into an enforceable migration architecture. It deliberately preserves the visual direction and research library while making the production path smaller, easier to reason about, and harder to accidentally regress.

## Measured Improvement

| Area | Before | After |
| --- | ---: | ---: |
| Legacy game stylesheet | 3,174 lines | 1,372 lines |
| Audited CSS | 5,409 lines | 4,661 lines |
| Same-context duplicate selectors | 36 | 8 |
| Production build | 88.5 MB | 34.2 MB |
| Packaged question data | 53.0 MB | 2.3 MB |
| Runtime clues | Full 216,930-clue archive | Deterministic 10,000-clue bank |

The complete clue archive and all source art remain available for research. The production manifest now packages only runtime dependencies.

## Styling Architecture

- `styles/tokens.css` owns brand primitives and semantic theme tokens.
- `styles/base.css` owns reset and document foundations.
- `style.css` is landing-page-only and is no longer loaded by `game.html`.
- `styles/game/legacy.css` is an explicitly temporary migration source; new component work does not belong there.
- `styles/game/cabinet.css` owns page framing, cabinet geometry, and the container-query boundary.
- `styles/game/scene.css` owns layered art, scene treatment, parallax, and scene motion.
- Host, dialogue, controls, header, scoreboard, menu, and study mode have named component owners.
- Runtime stylesheet order is protected by cascade layers.
- The CSS audit fails above 8 duplicate selectors or 5 reduced-motion `!important` declarations.
- Static contracts fail if migrated cabinet, scene, host, or dialogue rules return to the legacy file, or if legacy CSS grows beyond 1,400 lines.

## Asset And Data Architecture

- `scripts/runtime-manifest.mjs` is the single production copy manifest.
- `scripts/audit-assets.mjs` reports packaged, archival, duplicate, and unreferenced source assets without deleting research material.
- `scripts/build-runtime-questions.mjs` derives a validated, deterministic runtime bank from the complete archive.
- `scripts/validate-questions.mjs` validates both archive and runtime data by default.
- `scripts/build-static.mjs` packages the runtime bank and explicit artwork dependencies instead of copying broad directories.

Current source art inventory:

| Classification | Files | Size |
| --- | ---: | ---: |
| Complete source library | 113 | 118.0 MB |
| Packaged artwork | 32 | 31.5 MB |
| Research/archive only | 81 | 86.6 MB |

Ten byte-identical asset groups remain. They are now visible in the audit and can be consolidated deliberately after references are normalized.

## Remaining CSS Debt

The 8 remaining duplicate selectors are concentrated entirely in dialogue-adjacent responsive rules and light-theme clue variants. The next migration should reconcile those historical clue rules with `dialogue.css`, then move media previews and the modal viewer into an owned `media.css`.

The legacy file remains a runtime dependency until those shell rules are migrated. Its line ceiling should only move downward.

## Release Checks

Use one command for the non-browser release gate:

```bash
npm run verify
```

This checks JavaScript and build scripts, runs unit and static contracts, audits CSS and assets, validates both question banks, and creates the static production build. Browser fixture capture remains a separate command because it requires a local listening port:

```bash
npm run test:visual
```
