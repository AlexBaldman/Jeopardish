# Control Deck Design Decision

## Expert Roundtable

The footer was reviewed through four complementary lenses:

- **Nintendo interaction design:** every action must be readable before it is decorative; one glance should explain hierarchy and state.
- **Sega arcade art direction:** color should communicate energy and action families without turning every surface into a competing marquee.
- **Classic cabinet industrial design:** controls need a shared bezel, physical travel, obvious disabled states, and believable hardware relationships.
- **Modern accessibility and UI engineering:** labels stay visible, focus remains unmistakable, touch targets stay generous, and localization cannot break geometry.

## Proposals Debated

1. **Oversized arcade plungers**
   Strong physical personality, but too toy-like and space-hungry for a text-first trivia game.
2. **Pure 16-bit pixel HUD**
   Nostalgic and compact, but long translated labels become cramped and the interface loses modern legibility.
3. **Rockstar-style illustrated chrome**
   Rich attitude, but the controls compete with the beach scene, host, and clue card instead of supporting them.
4. **Broadcast control deck**
   A machined dark bezel with pale action caps, compact glyph medallions, persistent labels, small function kickers, and limited cyan/pink/gold coding.

## Consensus

Ship the **broadcast control deck**. It combines Nintendo clarity, Sega color energy, Neo Geo status labeling, and arcade hardware tactility while keeping the clue as the visual priority.

## Rules

- The answer field is the largest uninterrupted surface.
- `Lock It In` is the primary gold action beside the answer field.
- `New Clue` and `Reveal Answer` are secondary sibling actions.
- Every control has a visible verb, a short contextual kicker, and an optional keyboard badge.
- Color appears mainly as a narrow identity stripe and glyph illumination, not a full neon slab.
- Hover lifts by two pixels; active press travels four pixels; disabled controls settle into the deck.
- Mobile removes kickers and keyboard badges before reducing readable action labels.
- Host cycling uses compact faceted D-pad keys rather than unrelated glowing circles.

## Follow-On Recommendations

- Give audio cues distinct, short mechanical signatures for focus, press, disabled, and round-ready states.
- Replace temporary text glyphs with a tiny original icon set once the control silhouettes are stable.
- Apply the same function-kicker hierarchy to the header toggles in a later component pass.
- Add a high-contrast accessibility skin without changing control geometry.
