# Foundation Cleanup Sprint

**Date:** 2026-07-23

## Executive Result

This sprint converted the game's styling and asset pipeline from a stack of accumulated redesigns into an enforceable migration architecture. It deliberately preserves the visual direction and research library while making the production path smaller, easier to reason about, and harder to accidentally regress.

## Measured Improvement

| Area | Before | After |
| --- | ---: | ---: |
| Legacy game stylesheet | 3,174 lines | Retired |
| Audited CSS | 5,409 lines | 4,287 lines |
| Same-context duplicate selectors | 36 | 0 |
| Production build | 88.5 MB | 34.1 MB |
| Packaged question data | 53.0 MB | 2.3 MB |
| Runtime clues | Full 216,930-clue archive | Deterministic 10,000-clue bank |

The complete clue archive and all source art remain available for research. The production manifest now packages only runtime dependencies.

## Styling Architecture

- `styles/tokens.css` owns brand primitives and semantic theme tokens.
- `styles/base.css` owns reset and document foundations.
- `style.css` is landing-page-only and is no longer loaded by `game.html`.
- The legacy game stylesheet has been removed from both runtime shells.
- `styles/brand.css` and `styles/preferences.css` own shared identity and preference-control internals.
- `styles/game/cabinet.css` owns page framing, cabinet geometry, and the container-query boundary.
- `styles/game/scene.css` owns layered art, scene treatment, parallax, and scene motion.
- `styles/game/dialogue.css` owns clue hierarchy, translations, dialogue skins, state motion, and the style picker.
- `styles/game/media.css` owns clue previews, failure-safe media affordances, and the modal viewer.
- Host, dialogue, controls, header, scoreboard, menu, and study mode have named component owners.
- Runtime stylesheet order is protected by cascade layers.
- The CSS audit fails on any duplicate selector or above 5 reduced-motion `!important` declarations.
- Static contracts fail if either game shell attempts to load a legacy game stylesheet.

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

The audited runtime styles now contain zero same-context duplicate selectors, and the legacy game stylesheet has been retired. Remaining cleanup is no longer cascade triage: it is component refinement, especially splitting the large dialogue owner into structural, translation, and skin modules if those areas begin evolving independently.

## Release Checks

Use one command for the non-browser release gate:

```bash
npm run verify
```

This checks JavaScript and build scripts, runs unit and static contracts, audits CSS and assets, validates both question banks, and creates the static production build. Browser fixture capture remains a separate command because it requires a local listening port:

```bash
npm run test:visual
```
