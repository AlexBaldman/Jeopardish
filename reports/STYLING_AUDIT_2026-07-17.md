# JeoPARODY Styling Audit

**Date:** 2026-07-17  
**Scope:** Landing page, embedded cabinet, standalone cabinet, Creative Room, and production packaging.

## Executive Finding

The visual quality problem was partly art direction, but the larger engineering problem was unclear CSS ownership. The runtime loaded one 5,230-line stylesheet containing the landing site, original cabinet, cabinet v2, beach redesign, and dialogue v2. Later components often survived by specificity or `!important`, so changing a card or header required understanding several historical versions at once.

This pass establishes explicit surface ownership and removes the highest-risk dead dialogue contracts. It intentionally preserves the current visual behavior while making the next design passes safer and faster.

## Changes Completed

- Split the game cabinet into `styles/game.css`; `style.css` now owns shared foundations and the landing experience.
- Updated both game shells and the production build to load/package the canonical game stylesheet.
- Removed three abandoned banknote/value styling generations and the superseded first dialogue-skin generation.
- Reduced `!important` declarations from 18 to 5. The remaining five enforce reduced-motion accessibility.
- Added `npm run audit:css`, with a regression ceiling of 52 duplicate same-context selectors and 5 `!important` declarations.
- Added a static contract test for stylesheet ownership and loading order.
- Documented component ownership and visual principles in `docs/STYLING_ARCHITECTURE.md`.

## Component Audit

| Surface | Current status | Primary next action |
| --- | --- | --- |
| Dialogue / clue | Canonical v2 skins; dead bill contracts removed | Fold remaining mobile clue declarations into the canonical block |
| Header | Functional, but base, cabinet v2, and beach/mobile rules overlap | Rebuild as one responsive header component with named layout tokens |
| Score drawer | Clear interaction model; some header selectors overlap | Isolate drawer geometry and flip animation from header layout |
| Hamburger menu | Correct behavior; repeated hit-area and mobile sizing rules | Consolidate into one menu component and one mobile state |
| Host stage | Strong product identity; repeated cycle/stage sizing | Normalize transparent asset frame and responsive anchor tokens |
| Footer controls | Functional; duplicate grid/input/button declarations remain | Establish one control cluster with explicit compact breakpoint |
| Scene system | Strong art foundation and clean JS ownership | Separate scene composition tokens from cabinet chrome |
| Media viewer | Cohesive and comparatively isolated | Add visual fixture states for image, audio, video, failure, and fallback |
| Landing page | Visually coherent but shares primitive class names with game | Namespace site-only generic selectors during its dedicated pass |
| Creative Room | Runtime-isolated | Keep independent; audit only against its own stylesheet |

## Remaining Debt

The measured runtime baseline is now:

- 4,892 CSS lines across shared and game styles
- 756 selector rules
- 52 duplicate selectors in the same cascade context
- 5 `!important` declarations, all accessibility-related

The largest duplicate cluster is the mobile header (`.game-header`, header controls, hamburger sizing), followed by host controls and footer/input composition. These should be consolidated component by component, with screenshots or visual fixtures captured before each replacement.

## Recommended Sequence

1. Canonical responsive header, score drawer, and hamburger menu
2. Canonical host stage and transparent-asset frame contract
3. Canonical footer controls and answer input
4. Dialogue mobile-state merge and media fixture gallery
5. Landing namespace cleanup
6. Token extraction into explicit color, type, depth, spacing, and motion groups

This order attacks the components with the most shared geometry first. It should improve both desktop and mobile stability before another broad art-direction pass.
