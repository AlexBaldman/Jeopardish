# JeoPARODY Styling Architecture

## Purpose

The visual system should feel authored, playful, and game-like without making the cascade mysterious. Every runtime surface has one stylesheet owner. New visual work extends that owner instead of appending a new override generation.

## Runtime Stylesheets

| File | Owner | Loaded by |
| --- | --- | --- |
| `style.css` | Shared reset, design tokens, landing page, site-level responsive behavior | `index.html`, `game.html` |
| `styles/game.css` | Game shell, scene, header, score drawer, menu, dialogue, host, controls, media, game responsive behavior | `index.html`, `game.html` |
| `creative-room.css` | Creative Room documentation tool | `creative-room.html` |

The order is intentional: shared tokens first, game components second. `creative-room.css` is isolated because its interface and information density are different from the game.

## Component Ownership

The game stylesheet follows the page from back to front:

1. Cabinet and illustrated scene
2. Header, preferences, score drawer, and navigation menu
3. Main stage and round feedback
4. Dialogue card and its four semantic skins
5. Media previews and modal viewer
6. Host stage and host controls
7. Answer controls and footer
8. Responsive and reduced-motion states

## Cascade Rules

- Use a component class as the root selector. Avoid element IDs for styling.
- Keep theme and state selectors immediately beside their component.
- Keep responsive rules with the component when practical; use the final responsive section only for shell-level composition changes.
- Do not add a new redesign block at the end of a file. Replace the canonical component rules.
- `!important` is reserved for global reduced-motion guarantees. Component declarations must win through ownership and source order.
- A selector should appear once per cascade context. Run `npm run audit:css` before shipping visual work.
- Prefer design tokens for repeated color, type, spacing, depth, and motion decisions.

## Art Direction Test

Every component should pass four questions:

1. **Nintendo clarity:** Is the next action immediately legible?
2. **Sega velocity:** Does interaction feel responsive and energetic?
3. **Rockstar character:** Does the surface contain authored humor and world detail?
4. **Sony finish:** Do typography, motion, contrast, and transitions feel deliberate?

References are principles, not imitation. JeoPARODY's own visual language is broadcast trivia, boardwalk arcade hardware, comic inking, and a richly illustrated Long Beach stage.

## Migration Rule

Legacy files in `backups/` are research material only and are never runtime dependencies. When recovering an older idea, reimplement it against the current component contract rather than copying its stylesheet wholesale.
