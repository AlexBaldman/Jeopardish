# Host Performance And AI Roadmap

## Current Contract

The host is a performance layer, not a source of game truth.

`HostPerformanceDirector` consumes a named beat plus approved, bounded facts and
returns one immutable presentation command:

- personality pack and display name;
- deterministic localized line;
- expression and semantic motion;
- speech locale, rate, pitch, and voice hint;
- a privacy-safe receipt containing identifiers and aggregate state only.

It cannot change score, answer rulings, clue order, sources, learning mastery, or
episode state. Canonical clue narration and factual explanations are composed
outside the director.

## Portable HostPack

Version 1 packs define:

- original identity, subtitle, worldview, motifs, and vocabulary;
- teaching style and comedy boundaries;
- English and Brazilian Portuguese line banks for every supported beat;
- voice defaults;
- authored-line policy;
- rights status and provenance notes.

The first three packs are:

1. **Xander Trefleck**: bureaucratic Canadian deadpan; prefers reviewed episode
   host lines when available.
2. **Vera Static**: a midnight signal detective who treats knowledge as a
   broadcast worth recovering.
3. **Professor O.O.**: a cosmic pattern coach who connects facts without
   pretending coincidence is evidence.

These personalities deliberately share the current placeholder host artwork.
Personality selection and visual skin selection are separate controls, allowing
original art to replace temporary likeness-dependent assets without changing
dialogue, teaching behavior, or player preferences.

## Deterministic First

Every required beat works offline through reviewed line banks:

`idle`, `welcome`, `clue`, `empty`, `correct`, `incorrect`, `reveal`, `streak`,
`episode-complete`, `study-entered`, `study-exited`,
`reinforcement-correct`, and `reinforcement-incorrect`.

Line selection is stable for the same pack, beat, and approved receipt facts.
Voice and motion are optional consumers of the same command and can fail without
affecting the round.

## Runtime AI Boundary

GitHub Pages must never call a paid model with a shared API key. A future
`HostDialogueGateway` should live behind a small server or worker and return the
same performance-command shape.

The gateway request may include:

- pack ID and prompt version;
- beat;
- reviewed clue packet fields needed for that beat;
- bounded aggregate round context;
- requested locale.

The gateway response must include:

- generated candidate line;
- model and prompt versions;
- input hash and cache key;
- safety result;
- factual-fidelity result when clue content is involved;
- source references for generated factual claims;
- fallback reason when generation is rejected.

Cancellation, timeout, caching, output-length limits, and deterministic fallback
are required before any provider is enabled during play. Player answers,
microphone transcripts, personal identifiers, and unrestricted conversation
history are excluded by default.

## Clue Rewriting

Clue rewriting is a later, higher-risk capability. It must:

- preserve the accepted answer set and every solving constraint;
- preserve reviewed media and source relationships;
- remain concise enough for the clue view;
- run a semantic and answerability check;
- retain the original wording for audit and bilingual learning;
- fall back to the reviewed original whenever confidence is insufficient.

Generated clue text never becomes the answer judge's source of truth.

## Next Presentation Work

The next host-system pass should extract choreography still coordinated in
`app.js` into small presentation owners:

1. clue and narration presenter;
2. outcome and reveal presenter;
3. Study and reinforcement presenter;
4. finale presenter.

That extraction should preserve the existing event, director, renderer, voice,
and episode contracts. It is complete when `app.js` only coordinates lifecycle
and cross-system commands, rather than composing individual scenes.
