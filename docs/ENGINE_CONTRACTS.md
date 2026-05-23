# Engine Contracts

Jeopardish is moving toward a host-agnostic arcade engine. This document records the current ownership boundaries so future changes keep moving in that direction.

## Current Modules

- `game-logic.js` owns pure answer utility functions such as normalization, fuzzy matching, and clue value parsing.
- `src/contracts/events.js` owns event names, phases, state enums, and default score rules.
- `src/core/event-bus.js` owns pub/sub event delivery.
- `src/core/game-engine.js` owns game state, scoring, streaks, active clue lifecycle, and answer outcomes.
- `src/data/data-loader.js` owns fetching and validating the current question bank.
- `src/render/renderer.js` owns DOM binding, rendering, user input reads, fallback clue display, and control state.
- `src/host/host-manager.js` owns active host config, host visuals, and host quip selection.
- `app.js` owns application coordination, random clue selection, and localStorage persistence.

## Important Boundary

`app.js` may coordinate score, streak, clue, answer, and host state between modules, but it should not calculate answer correctness, mutate score/streak directly, write to DOM nodes directly, or hardcode host image behavior.

The current browser load order is:

1. `game-logic.js`
2. `src/contracts/events.js`
3. `src/core/event-bus.js`
4. `src/core/game-engine.js`
5. `src/data/data-loader.js`
6. `src/render/renderer.js`
7. `src/host/host-manager.js`
8. `app.js`

## Next Extraction Targets

1. Replace full `questions/jeopardy-questions.json` loading with a manifest plus smaller shards.
2. Route future voice behavior through `src/audio/audio-controller.js`.
3. Convert renderer updates to event subscriptions once host/audio/data events are stable.

## Behavior Preserved

The first extraction intentionally preserves the current gameplay behavior:

- correct answers add the clue value to score
- correct answers increase current streak
- best streak persists in localStorage
- incorrect answers reset current streak to `0`
- incorrect answers reset score to `0`
- the app still loads the existing `questions/jeopardy-questions.json` dataset
