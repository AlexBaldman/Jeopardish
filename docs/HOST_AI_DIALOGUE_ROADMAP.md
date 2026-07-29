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

The first provider candidate may use Gemini's free tier, but "free" changes
neither the trust boundary nor the failure policy:

- the Gemini key exists only in server or worker secret storage;
- no key enters browser JavaScript, HTML, query parameters, localStorage,
  sessionStorage, logs, telemetry, screenshots, or generated artifacts;
- local development reads an ignored environment variable through the gateway,
  with a committed `.env.example` containing names but no values;
- provider quotas, rate limits, model changes, and free-tier exhaustion trigger
  the same deterministic local fallback as an outage;
- the provider adapter is replaceable and has no scoring, answer, episode, or
  canonical-clue authority;
- key rotation and a repository-wide secret scan are release requirements.

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

`BroadcastPresenter` now owns:

- host visual and semantic-motion rendering;
- clue performance and narration;
- empty-answer, correct, incorrect, and streak payoff;
- answer reveal narration;
- episode-finale rendering and narration.

`StudyController` continues to own the pause, grounded actions, reinforcement,
and exact resume transaction while routing its host beats through the same
presenter boundary.

The next extraction should move preference, scene, translation-refresh, and
control-deck presentation coordination out of `app.js`, followed by splitting
the renderer into focused view owners. The work is complete when `app.js` only
coordinates lifecycle and cross-system commands rather than composing
individual scenes.
