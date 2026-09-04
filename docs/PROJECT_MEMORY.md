# JeoPARODY Project Memory

**Status:** Canonical conversation and decision synthesis
**Updated:** 2026-09-04
**Canonical executable and consolidation target:** `AlexBaldman/Jeopardish`, branch `master`
**Donor slated for eventual retirement:** `AlexBaldman/jeoPARODY`, branch `main`
**Product name:** JeoPARODY

This document captures durable decisions from the long design and development
conversation. It is not a transcript. Repeated requests are consolidated into
one decision, implementation is separated from aspiration, and older audit
claims are reconciled against the current executable.

## North Star

JeoPARODY is a fast, funny comedy-learning show in which presentation can be
wild while facts, scoring, answer judgment, provenance, accessibility, and
learning history remain boringly dependable.

The product begins with a trivia-show rhythm but is not limited to recreating
one television format. Over time it may borrow the best interaction ideas from
game shows, arcade games, comics, educational practice, and AI-assisted study.
Every mode must reuse the same truth and learning owners.

## Canonical Decisions

### Repository and architecture

- Keep Jeopardish playable as the canonical executable and improve it in place.
- Mine the newer jeoPARODY work as a donor, then retire it only after the
  September 3 retirement gate is complete.
- Port behavior, tests, fixtures, assets, and ideas through explicit contracts.
  Never merge either runtime or styling system wholesale into the other.
- `RoundKernel` owns legal phases and makes reveal a one-way transition.
  `GameEngine` owns score and judgment. `EpisodeController` and
  `SessionManager` record correctness and credit eligibility as explicit
  outcome facts. The renderer presents; it does not invent game truth.
- AI, DOM state, voice, and animation may never decide correctness or score.
- `master` is the canonical Jeopardish branch. Migration work uses focused
  branches and lands through canonical owners; old branches remain read-only sources.
- Head-to-Head owns separate deterministic match truth because two-player
  readiness, atomic reveal, and competitive scoring are different rules from
  solo `GameEngine` play. Its public state excludes transport discovery, raw
  answers, and private correctness; room gateways and host/server authority
  remain replaceable adapters.
- Head-to-Head uses round-bound serializable commands so stale durable intent
  cannot mutate a later clue. Browser-host authority is limited to casual
  proving play; rankings or prizes require trusted server adjudication.

### Game-first product surface

- The public landing experience puts the playable game first.
- Internal plans, architecture discussions, logo workshops, and creative-room
  material are team tools, excluded from player navigation and production.
- Season Zero is the proof slice: a finite authored episode with explanations,
  reviewed sources, local media, finale, replay, and emergency fallback.
- Archive Practice remains available for historical-question practice, but the
  historical corpus is research material, not the authored paid product.
- Additional formats enter only through the canonical kernel: review, daily
  play, category runs, wagers, full board, PAO, and later social play.

### Answer judgment

- Normalize capitalization, punctuation, accents, articles, prompt prefixes,
  and excess whitespace.
- Accept reviewed aliases and tolerate defensible typos or transpositions with
  length-aware fuzzy matching.
- Keep correctness separate from credit eligibility. A revealed answer can be
  correct for learning while earning no score or competitive streak.
- Explain the ruling sufficiently to debug edge cases and support disputes.
- Never infer state from whether a DOM element happens to be visible.

### Episodes, questions, and translation

- Historical clues may inspire practice, but public authored episodes should
  use original or appropriately licensed wording and record provenance.
- Canonical episodes need stable IDs, aliases, explanation, sources, value,
  rights review, optional media, and quality flags.
- English and Brazilian Portuguese apply to category, clue, answer,
  explanation, host copy, and controls, not merely menu chrome.
- Authored bilingual fields are the production goal. Runtime translation is a
  bounded fallback, especially for Archive Practice.
- Portuguese learning aids may reveal source-language text contextually without
  replacing the Portuguese presentation.
- Generated clues require grounding, validation, provenance, and a review state
  before they become canonical content.

### Media resilience

- Image, audio, and video clues use structured media metadata and accessible
  modal presentation.
- Images open from a thumbnail; audio and video provide explicit controls and
  fallbacks.
- Media is preflighted. A broken required asset substitutes a reviewed clue or
  emergency episode instead of showing a broken link.
- Production packages include only referenced, approved assets.

### Host identity and performance

- Xander is the current fictional prototype. His AI-assisted art direction
  still requires likeness, provenance, and commercial-rights review; the
  public host pack must not depend on a real-person likeness.
- His core look is a premium pixel-art and inked-comic hybrid: silver hair,
  athletic beach-bum silhouette, open tropical shirts, expressive board shorts,
  and yellow wayfarer-style glasses with pink mirrored question-mark lenses.
- The approved wardrobe includes the full 12-look board-short collection plus
  special formal, retro, and broadcast outfits. Wardrobe changes between shows
  and can be cycled during development.
- The first animation vocabulary is semantic: idle, clue, listening, correct,
  incorrect, reveal, study, and streak celebration. Reduced motion always has a
  coherent exit.
- Host placement is pinned to the control deck baseline. Movement may travel
  left and right within a bounded stage without colliding with content.
- Dialogue attribution follows the host mouth at runtime. Speech tails and
  thought trails move with him; narrator cards deliberately have no host tail.
- Host personality, avatar, animation, and voice are separate versioned packs
  so Host Studio can eventually create new companions without modifying game
  truth.

### Tone and story

- Desired tone: dry Canadian deadpan, shaggy comic absurdity, precise trivia,
  mischievous warmth, and occasional genuine teaching insight.
- Do not write generic AI banter, explain every joke, or make cruelty the host's
  defining trait.
- The false-host mystery can leak through subtle contradictions and collectible
  evidence. It should reward attention rather than interrupt every clue.
- Heaven, beach-party, counterfeit-host, and darker conspiracy backstories are
  experimental private lore. Public canon requires a separate tone, rights,
  audience, and age-rating decision.
- Console narration is a witty conductor and debugging trace: event-oriented,
  useful, bounded, and never a second visible status panel.

### Visual system

- The visual target combines premium arcade clarity, expressive console-game
  polish, graphic-novel inking, and detailed pixel art without copying any one
  company's trade dress.
- Day and night are genuinely different illustrated worlds, not a scoreboard
  recolor. Night is luminous and solarized rather than nearly black.
- Beach scenes evoke Long Beach, New York, including the boardwalk, West End,
  ocean, sunset direction, and dense observational comedy visible over time.
- Scenes need coherent geography, scale, lighting, and human anatomy. Busy does
  not mean visually noisy or generically AI-generated.
- The logo is the familiar-looking word transformed by one intruding O between
  R and D: `JeoPARODY`. The O can rotate among circular comic objects while the
  word remains readable.
- Public production art must be original and provenance recorded. Historic
  likeness and reference assets stay in development or archives.

### Dialogue component

- The clue skin combines a classic blue clue-screen feeling with a host speech
  bubble: rounded, centered, readable, and visually attached to the host.
- Category is prominent near the top, clue value is compact high-contrast text,
  and clue content owns the visual hierarchy.
- Additional skins include inked speech, off-white thought, and yellow narrator
  card. Skin selection has a product purpose, not merely decoration.
- Thought bubbles stay paper-light in dark mode and warmer in light mode.
- The component uses available space at every breakpoint without forcing the
  main game container to scroll.

### Header, menu, controls, and scoreboard

- The centered title, day/night control, language control, and menu belong in a
  stable header. Icon-only controls always have hover/focus help and accessible
  names.
- English uses a clear United States flag; Portuguese uses a Brazilian flag.
- The hamburger opens a dedicated smooth menu. It never masquerades as the
  scoreboard.
- Buttons share a museum-quality arcade keycap language: clear hierarchy,
  tactile travel, keyboard focus, and reduced-motion behavior.
- `Ask Host` becomes a question-mark icon at narrow widths with a readable help
  label.
- The scoreboard peeks below the header, opens on hover/focus/tap, animates when
  values change, and can be pinned. It combines split-flap labels, arena digits,
  and arcade hardware while remaining legible in both themes and on phones.

### Voice and AI

- Voice is optional progressive enhancement. Typed, touch, and keyboard play
  remain complete when speech APIs or microphone permission are absent.
- Players can hear clues and results, answer by voice, and use bounded voice
  commands.
- Voice cloning requires explicit actor consent, rights metadata, deletion
  rules, and isolated source recordings. No unconsented celebrity cloning.
- Prefer local or free development tools when capable, but runtime architecture
  targets capabilities rather than hard-coding a provider.
- Remote model credentials stay server-side. The deleted Gemini key must never
  return through URLs, browser storage, logs, or production bundles.
- AI may propose jokes, rewrites, explanations, art drafts, sprites, animation,
  voices, and topic episodes. Validated deterministic fallbacks always remain.

### Study and learning companion

- Any clue can pause into the in-cabinet Study panel now without corrupting
  score, timers, or episode position. A detachable synchronized Study window
  remains a later progressive enhancement.
- Study uses the reviewed clue packet and source links, then returns to the exact
  broadcast state.
- Memory Rematch, confidence, disputes, and reinforcement are learning actions,
  not hidden score changes.
- The future coach gateway can answer deeper questions, generate grounded
  practice, and adapt teaching style while clearly separating generated advice
  from reviewed facts.
- Host Studio eventually exposes appearance, wardrobe, personality, pedagogy,
  voice, and generation tools as an editable companion-creation system.

### Easter eggs and additional modes

- PAO is intentionally preserved as an isolated, lazy-loaded personal easter
  egg with independent storage and exact session restoration.
- Nostalgic unlocks may include a controller-style code and a rapid visual
  interaction such as tapping the host or a scoreboard detail.
- The comedy ticker may return only as a localized event subscriber with sane
  clipping and direction. Old DOM-polling and broken plane implementations do
  not return.
- American handball remains a separately bounded mode or project, not trivia
  runtime code accidentally sharing state.

### Cross-project platform direction

- `uINVERSE` is a preserved umbrella thesis for projecting shared semantic
  worlds through comic, 2D, 3D, audio, prose, and workbench lenses.
- Its Stage layer renders a world model; it never becomes the owner of world,
  game, learning, or project truth.
- JeoPARODY remains a product with its own release gates. Shared platform work
  must be extracted only after a concrete JeoPARODY contract proves reusable.
- Sprite Foundry is preserved as a separately bounded creator-tool
  specification for consistent character assets, poses, wardrobe, and stage
  projections. It is not part of the player runtime yet.

## Current Executable Truth

Features described as implemented may exist only in the current working tree
until committed and release-verified. [`CURRENT_STATE.md`](CURRENT_STATE.md)
distinguishes committed, working-tree, and deployed truth.

Implemented now:

- deterministic Season Zero episode and archive practice;
- fuzzy answer judgment with reveal/no-credit separation;
- bilingual clue localization and source-language aid;
- media preflight, substitution, and modal handling;
- Study pause/resume, local learning ledger, rematches, and finale;
- optional speech narration, recognition, and voice commands;
- data-driven host packs, 12-look avatar pack, deterministic animation pack,
  VoicePack, and Host Studio project contract;
- position-aware dialogue geometry and four dialogue skins;
- responsive split-flap scoreboard drawer;
- owned CSS layers, production manifest, asset/question audits, episode proof,
  accessibility audit, smoke test, and visual fixture matrix.

Not yet a public paid product:

- original-IP and rights-approved public asset pack is incomplete;
- multiple reviewed offline bilingual episodes are not yet shipped;
- no consented player evidence proves completion, learning, laughter, or return;
- secure grounded AI gateway is a contract, not a deployed service;
- custom neural voice and frame-authored sprite animation are not production
  assets yet;
- accounts, catalog, entitlements, commerce, and hosted synchronization remain
  deliberately deferred.

## Decision Discipline

When a new idea arrives:

1. identify the canonical owner;
2. classify it as requirement, evidence, experiment, or implementation;
3. record provenance and rights implications;
4. add a deterministic fallback;
5. prove the complete player journey;
6. update this memory only when the decision is durable.
