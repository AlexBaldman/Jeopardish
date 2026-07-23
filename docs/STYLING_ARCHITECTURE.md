# JeoPARODY Styling Architecture

## Purpose

The visual system should feel authored, playful, and game-like without making the cascade mysterious. Every runtime surface has one stylesheet owner. New visual work extends that owner instead of appending a new override generation.

## Runtime Stylesheets

| File | Owner | Loaded by |
| --- | --- | --- |
| `styles/order.css` | Global cascade-layer order | `index.html`, `game.html` |
| `styles/tokens.css` | Brand primitives plus theme-aware semantic component tokens | `index.html`, `game.html` |
| `styles/base.css` | Reset, document foundations, shared body treatment | `index.html`, `game.html` |
| `style.css` | Landing page only; never loaded by the standalone game | `index.html` |
| `styles/game/legacy.css` | Historical cabinet rules awaiting component migration; no new rules permitted | `index.html`, `game.html` |
| `styles/game/header.css` | Game header layout, preference controls, logo placement, and container behavior | `index.html`, `game.html` |
| `styles/game/scoreboard.css` | Score drawer, split-flap readouts, reveal motion, and compact states | `index.html`, `game.html` |
| `styles/game/menu.css` | Navigation drawer, menu controls, and responsive geometry | `index.html`, `game.html` |
| `styles/game/host.css` | Host stage, portrait framing, reactions, labels, selector keys, and responsive anchoring | `index.html`, `game.html` |
| `styles/game/dialogue.css` | Clue hierarchy, dialogue skins, tails, result typography, and responsive card rules | `index.html`, `game.html` |
| `styles/game/controls.css` | Answer input and cabinet control deck | `index.html`, `game.html` |
| `styles/game/study.css` | Study-mode drawer and learning actions | `index.html`, `game.html` |
| `creative-room.css` | Creative Room documentation tool | `creative-room.html` |

The order is enforced by `@layer`: `reset`, `tokens`, `legacy`, `components`, `variants`, `states`, `responsive`, and `utilities`. Legacy rules cannot beat migrated component rules merely because they were appended later. `creative-room.css` remains isolated because its interface and information density are different from the game.

## Component Ownership

Component migration follows the page from back to front:

1. Cabinet and illustrated scene
2. Header, preferences, score drawer, and navigation menu (migrated)
3. Host stage and selector controls (migrated)
4. Dialogue card and its four semantic skins (migrated)
5. Media previews and modal viewer
6. Answer controls and footer (migrated)
7. Main stage and round feedback
8. Responsive and reduced-motion states

## Cascade Rules

- Use a component class as the root selector. Avoid element IDs for styling.
- Keep theme and state selectors immediately beside their component.
- Keep responsive rules with the component when practical; use the final responsive section only for shell-level composition changes.
- Do not add a new redesign block at the end of a file. Replace the canonical component rules.
- `!important` is reserved for global reduced-motion guarantees. Component declarations must win through ownership and source order.
- A selector should appear once per cascade context. Run `npm run audit:css` before shipping visual work.
- Prefer design tokens for repeated color, type, spacing, depth, and motion decisions.
- Use cabinet container queries for component composition. Viewport media queries are reserved for page-level height, safe-area, and browser-chrome constraints.

## Visual State Lab

`visual-fixtures.html` deterministically presents clue, reveal, correct, incorrect, menu, and scoreboard states in day or night mode at each supported cabinet size.

Run `npm run test:visual` to capture 72 combinations under `screenshots/visual-fixtures/`. The runner fails on document overflow, component escape from the cabinet, missing visible geometry, or host overlap with clue text. Captures are local build artifacts and are intentionally ignored by git.

The current audited ceiling is 12 same-context duplicate selectors. The baseline after the host, dialogue, and control-deck migrations is 12. Every later component migration must hold or lower that number.

## Art Direction Test

Every component should pass four questions:

1. **Nintendo clarity:** Is the next action immediately legible?
2. **Sega velocity:** Does interaction feel responsive and energetic?
3. **Rockstar character:** Does the surface contain authored humor and world detail?
4. **Sony finish:** Do typography, motion, contrast, and transitions feel deliberate?

References are principles, not imitation. JeoPARODY's own visual language is broadcast trivia, boardwalk arcade hardware, comic inking, and a richly illustrated Long Beach stage.

## Migration Rule

Legacy files in `backups/` are research material only and are never runtime dependencies. `styles/game/legacy.css` remains a runtime dependency only while its components are migrated. When recovering an older idea, reimplement it against the current component contract rather than copying its stylesheet wholesale.
