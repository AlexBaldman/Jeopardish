# JEOPARDISH
## Master Product, Story, Learning, and Engineering Plan

**Working thesis:** Jeopardish becomes an original comedy-learning game-show universe: a trustworthy trivia engine inside an unreliable late-night celestial broadcast, hosted by a fictional Canadian-adjacent impresario whose show grows funnier, stranger, and more suspicious as the player learns.

**Prepared:** May 26, 2026  
**Status:** Vision plan for product and implementation decisions  
**Core recommendation:** Build the truth layer first, then make the theater spectacular.

---

## 1. Executive Summary

Jeopardish began as an affectionate random-clue practice app. It now contains the seeds of something far more distinctive:

- A large trivia corpus with real depth, media, alternate-answer complexity, and historical anomalies.
- An improving input judge that can support humane answer evaluation.
- A memorable visual vocabulary: neon stage lighting, speech bubbles, host portraits, and fictional banknotes.
- A comic premise capable of becoming a narrative retention loop.
- An opportunity to make learning feel like participating in a forbidden television signal rather than doing homework.

The most important strategic change is to stop framing the product as a spoof of one existing quiz show. The name may retain parody energy, but the product should be an original game-show network built from the *grammar* of decades of televised play: wagers, surveys, lightning rounds, puzzles, mystery doors, jackpots, bargain prizes, panel bluffing, relationship tests, and escalating finale rituals.

That vision rests on one non-negotiable principle:

> The comedy, host performance, visual hallucination, and narrative mystery may be wonderfully unreliable. The facts, accepted answers, learning record, score rules, and content provenance must be reliable.

The next engineering move should therefore be a normalized content and mechanic layer, not another pile of presentation-only features.

---

## 2. What Exists Today

### 2.1 Current playable foundation

The active prototype already supports:

- Random clue delivery from a local bank.
- Category/value/clue presentation in a styled speech bubble.
- Answer entry and reveal flow.
- Score and streak tracking.
- Improved normalized and fuzzy answer matching.
- Safe alternate-answer extraction for several archival answer patterns.
- Media-aware clue previews and modals.
- Host visual/quips abstraction and console narration.
- Illustrated fictional banknote value display.

The code has begun separating responsibilities:

| Module | Current role | Direction |
| --- | --- | --- |
| `game-logic.js` | normalization, matching, value parsing | evolve into pure validation/scoring helpers |
| `src/core/game-engine.js` | active clue, score, streak, events | evolve into mode-aware state machine |
| `src/data/data-loader.js` | loads entire bank | evolve into catalog/shard/content service |
| `src/render/renderer.js` | UI rendering and media | remain view layer over typed moments |
| `src/host/host-manager.js` | host visuals/quips | evolve into story/performance facade |
| `app.js` | orchestration and random selection | shrink as controllers/services mature |

### 2.2 Evidence in the corpus

Local analysis of `questions/jeopardy-questions.json` shows:

| Finding | Value | Why it matters |
| --- | ---: | --- |
| Total clue records | 216,930 | Enough breadth for modes, personalization, and replay |
| Date range | 1984-09-10 to 2012-01-27 | Era rules and dated facts matter |
| Distinct category strings | 27,995 | Taxonomy cleanup and topic mapping are valuable |
| `Jeopardy!` records | 107,384 | Ordinary-round material |
| `Double Jeopardy!` records | 105,912 | Higher-risk/complexity material |
| `Final Jeopardy!` records | 3,631 | Require a separate gameplay concept |
| `Tiebreaker` records | 3 | Special-state handling required |
| Records with linked media markup | 10,523 | Media is not an edge case |
| Parenthetical answers | 9,316 | Answer validation is a core system |
| Alternate-answer markup signals | 2,733 | Canonical answer model needed |
| Answers with non-ASCII characters | 708 | Normalization and display integrity required |
| Non-grid value candidates | 6,625 | Values cannot be blindly interpreted as ordinary face values |

There is also immediate performance/storage waste: `questions/questions.json` and `questions/jeopardy-questions.json` are byte-identical copies, each approximately 53 MB.

### 2.3 The value-semantics discovery

The current game displays and scores every value as if it were a normal clue value. That is wrong for part of the source data.

One verified example:

- Archive record: `LEGAL "E"s`, value `$367`, air date `2011-02-16`.
- Source confirmation: J! Archive Show #6088 identifies it as `DD: $367`.
- Meaning: this is a displayed Daily Double wager, not an ordinary board denomination.

Additionally:

- All 3,631 Final Jeopardy records contain `value: null`.
- All three Tiebreaker records contain `value: null`.
- The current parser replaces missing values with `$100`.

This is a product correctness issue, not a minor display concern. The game must know the semantic type of a moment before it renders money, applies scoring, or lets an AI host reinterpret the clue.

---

## 3. Product Identity

### 3.1 The product is not a clone

**Old frame:** a charming parody flashcard app borrowing the aura of a known trivia program.  
**New frame:** an original comedy-learning broadcast universe that uses trivia facts as raw fuel for many formats.

The relationship to classic game shows should be inspiration at the level of pacing and interaction, not reproduction of official marks, show packaging, archived expression, or a single copyrighted/trademarked identity.

### 3.2 Positioning statement

> Jeopardish is a narrative trivia arcade where verified facts are transformed into outrageous retro game-show moments by a suspiciously charming host. Players build knowledge, chase streaks, wager counterfeit prize money, and uncover why this broadcast should probably not exist.

### 3.3 Product principles

1. **Truth is sacred; framing is ridiculous.**  
   The answer and explanation must remain accurate even when the host is lying about everything else.

2. **A session has a dramatic shape.**  
   It should begin legibly, escalate playfully, surprise meaningfully, and end memorably.

3. **The host is a system, not decoration.**  
   Character state, memory, visual expression, timing, and lines respond to player history and story discovery.

4. **Mechanics create variety; knowledge creates continuity.**  
   A single learned fact can appear in multiple interaction forms across sessions.

5. **Original identity compounds.**  
   Fictional host, original art, defensible content, and new mechanics make the project ownable over time.

6. **Difficulty should feel fair.**  
   Gentle judging, transparent rulings, accessibility, and contextual explanations turn failure into progress.

---

## 4. The World And Comic Engine

### 4.1 Fictional premise

The product should not depend on presenting real deceased personalities as production characters. Preserve the emotional inspiration, but build an original universe.

**Working premise:**

An unknown broadcaster styling himself **M. Alex "Malex" Trebek** takes possession of an after-hours transmission called *Jeopardish*. He assures contestants that the network is impeccably legitimate, the currency is legal in "several provinces," and every change in format is normal. His performance begins as buttoned-up Canadian professionalism. As the player performs well, notices contradictions, and finds suspicious artifacts, Malex becomes defensive, flamboyant, and increasingly unable to maintain the fiction.

The network is a celestial/pirate broadcasting depot full of discarded game-show machinery: wheels, curtains, buzzer rigs, survey boards, bargain bins, illuminated envelopes, beach-party remnants, and a vault of unexplained tapes.

### 4.2 Tone rules

The humor target is dry, structurally absurd, and unexpectedly specific:

- Understatement where hysteria is warranted.
- Elaborate evasions that create new evidence.
- Courtesy used as a weapon.
- Solemn delivery of humiliatingly small stakes.
- Recurring bits that evolve rather than random jokes.

Avoid:

- Direct imitation of a real comedian's voice or identity.
- Graphic or exploitative stories about identifiable real people's illness, addiction, or death.
- Humor that attacks protected traits or players for genuine ignorance.
- Host rewrites that change factual meaning for a punchline.

### 4.3 Host identity ladder

| Story stage | Public behavior | Visual cue | Gameplay effect |
| --- | --- | --- | --- |
| Respectable host | Crisp, polite, mildly dry | immaculate suit / green note | standard rounds |
| Comfortable liar | Unrequested anecdotes, little contradictions | loosened tie / static flare | counterfeit tender appears |
| Defensive executive | Explains why questions about family are irrelevant | magenta glitches | mystery categories |
| Broadcast baron | Admits he owns the network, denies theft | extravagant stage coat | format collisions |
| Exposed Malex | Must host honestly or lose signal | authentic final portrait | finale and replay variation |

### 4.4 Recurring comedic assets

- `QUESTIONABLE TENDER`: fake notes appear when stakes or data semantics get strange.
- `THE APOLOGY METER`: the more defensively Malex apologizes, the less Canadian he appears.
- `LEGAL "EH"s`: a suspicious recurring category that forces him to discuss contracts.
- `BACKSTAGE MEMOS`: collectible artifacts containing contradictions and mechanic unlocks.
- `THE WRONG MOUSTACHE`: a visual clue motif that quietly advances the reveal.

---

## 5. The Player Experience

### 5.1 Three game modes

Each mode shares content and judging infrastructure, but has its own pacing and scoring.

#### Study Mode: learn efficiently

Purpose: knowledge acquisition and review.

- Choose subject, era, difficulty, media inclusion, and session length.
- Receive original or rights-cleared question presentations.
- Answer with forgiving but transparent judging.
- See concise explanation, source, alternate accepted answers, and confidence.
- Schedule missed/hesitated concepts for spaced review.

Success measure: recall improvement and return to review, not theatrical score.

#### Arcade Story Mode: laugh, learn, uncover

Purpose: signature playable experience.

- Ten-to-fifteen-minute episodes.
- Familiar clue backbone plus mechanic interruptions.
- Counterfeit banknotes, wagers, story artifacts, Malex stage changes.
- Score, streak, evidence unlocks, and chapter progression.
- Session finale selected by performance and discovered evidence.

Success measure: completion, replay, learning retention, and story curiosity.

#### Classic Strategy Mode: competitive homage, carefully designed

Purpose: board-and-wager tactics for enthusiasts.

- Category board, row values, controlled clue reveal.
- Explicit Daily Double and final wagering modeled semantically.
- Era-correct value rules or original value grid.
- This mode should use original content/format branding in public production unless licenses are secured.

Success measure: strategic mastery and repeat competitive play.

### 5.2 Ideal Arcade Story session

| Minute | Moment | Player feeling | System responsibility |
| ---: | --- | --- | --- |
| 0:00 | Cold open and normal clue | I know how to play | onboarding and trust |
| 1:30 | Rhythm/streak develops | I might be good at this | calibrated difficulty |
| 3:00 | First format switch | Oh, this game has tricks | mechanic engine |
| 5:00 | Questionable bill / wager | This is hilarious and risky | semantic money state |
| 6:30 | Host contradiction appears | Something is off | story state |
| 8:00 | High-pressure learning payoff | I remember that fact now | retrieval loop |
| 10:00 | Finale + evidence fragment | One more episode | narrative retention |

### 5.3 Moment types

A `Moment` is the atomic player-facing unit. It may be a clue, a wager, a reveal, an interstitial host beat, or an artifact discovery.

```ts
type Moment = {
  kind: 'prompt' | 'wager' | 'reveal' | 'host-beat' | 'artifact' | 'finale';
  mechanicId: string;
  factId?: string;
  presentation: PresentationPayload;
  scoringRule?: ScoringRule;
  truthPolicy: TruthPolicy;
  storyTriggers?: StoryTrigger[];
};
```

This prevents the app from forcing every future feature into the old `random question -> text answer -> score` funnel.

---

## 6. Trivia And Learning System

### 6.1 Source material strategy

Historical clue archives are useful for research, internal testing, topic extraction, and semantic discovery. They should not automatically become the public, commercial content payload.

Production content should eventually be built from:

- Rights-cleared/licensed trivia sources.
- Public-domain source documents and reference material.
- Original fact cards curated with citations.
- Generated question variants constrained by a verified fact record.
- User-created/private content packs where allowed.

Each playable fact should be traceable, versioned, and separately expressible from any original archived clue text.

### 6.2 Canonical fact model

```ts
type FactRecord = {
  id: string;
  topicIds: string[];
  canonicalAnswer: string;
  acceptedAnswers: AcceptedAnswer[];
  explanation: string;
  evidenceSources: SourceCitation[];
  temporalScope?: { validFrom?: string; validTo?: string };
  difficultySignals: DifficultySignals;
  mediaAssets?: ClearedMediaAsset[];
  rightsStatus: 'cleared' | 'internal-only' | 'needs-review';
};
```

An archived clue can be an import source or internal evaluation input; it should not be conflated with the canonical fact.

### 6.3 Prompt generation contract

The host or mechanic generator may create a prompt only from a canonical fact packet:

```ts
type PromptPacket = {
  factId: string;
  requiredAnswer: string;
  immutableConstraints: string[];
  forbiddenClaims: string[];
  mechanic: MechanicDefinition;
  hostVoice: HostVoiceProfile;
};
```

Before display:

1. Generate candidate wording.
2. Validate answer alignment and required constraints.
3. Reject unsafe/ambiguous wording.
4. Cache approved wording by fact, mechanic, persona, and prompt version.
5. Log disputes and player rulings without silently modifying truth.

### 6.4 Answer judging

The current fuzzy/alternate-answer improvements are a useful starting point. The production judge should distinguish:

| Result | Meaning | Player feedback |
| --- | --- | --- |
| Exact | normalized canonical answer | instant success |
| Alternate accepted | sanctioned synonym/variant | success plus small note |
| Typo accepted | constrained edit-distance match | success; "judges allow typo" |
| Needs review | uncertain near-answer | player may contest or reveal |
| Incorrect | conflicts with canonical answer | explanation and review queue |

Important rule: AI may propose accepted variants for editorial review; it must not autonomously expand accepted answers during live competitive play.

### 6.5 Learning loop

The product should deliberately use well-supported learning principles:

- **Retrieval practice:** answering, not merely revealing, builds recall.
- **Distributed practice:** missed and fragile concepts return later.
- **Feedback:** errors receive brief factual explanations, not only jokes.
- **Interleaving:** related topics mix after initial mastery.
- **Metacognition:** players can see what they know, guessed, or disputed.

Possible player memory states:

```text
unseen -> attempted -> fragile -> remembered -> mastered
             |            |
             v            v
          review_due <- disputed
```

The host can make this feel playful: "We are revisiting this because the judges have a vindictive memory. Also because learning works."

---

## 7. Mechanic Engine: The Game-Show Amalgam

### 7.1 Common mechanic protocol

Every mechanic needs the same interface so the product does not become a tangle of one-off games.

```ts
type MechanicDefinition = {
  id: string;
  promptStyle: string;
  inputType: 'free-text' | 'choice' | 'ranking' | 'numeric' | 'sequence' | 'wager';
  timer?: TimerRule;
  score: ScoringRule;
  reveal: RevealSequence;
  eligibleFacts: EligibilityRule[];
  hostBeats: HostBeatSlot[];
  accessibilityFallback: string;
};
```

### 7.2 Initial mechanic library

| Mechanic | Core play | Learning value | Malex treatment |
| --- | --- | --- | --- |
| Straight Clue | free-text recall | pure retrieval | claims this is the only respectable format |
| Counterfeit Wager | stake points before answer | confidence calibration | slaps down questionable tender |
| Lightning Cabinet | short timed queue | fluency / retrieval speed | panics at his own timer |
| Survey Bluff | choose most plausible wrong/true response | misconception exposure | cites an imaginary Canadian survey |
| Missing Phrase | complete a title/quotation/term | partial-cue recall | overly dramatic letter board |
| Bargain Bin Estimate | numeric proximity question | magnitude sense | awards worthless prize props |
| Evidence Envelope | solve fact to unlock story artifact | narrative retention | insists memo is unrelated |
| Finale Transmission | multi-step final question | synthesis | loses control of the broadcast |

### 7.3 What not to build first

- Ten unrelated minigames without a protocol.
- Multiplayer before solo session quality is proven.
- Live generative judging.
- Full show-board simulation before content semantics are normalized.

### 7.4 First recommended new mechanic

**Counterfeit Wager** is the ideal first addition because it connects:

- The newly discovered Daily Double semantics.
- The fictional banknote art already built.
- Confidence-based learning behavior.
- Score drama.
- Malex's fraud narrative.

It also forces the architecture to correctly separate `faceValue`, `wager`, and `awardedPoints`.

---

## 8. AI Host Architecture

### 8.1 Deterministic kernel, generative shell

The model should be a performer and writer's-room assistant, never the final authority for rules or truth.

```text
                            +--------------------------+
 Verified Fact Store ----> | Deterministic Game Kernel | ----> score / accepted answer
        |                   +--------------------------+
        | immutable packet             |
        v                              v
 Prompt Guardrails ----> Host Generation Service ----> styled line / clue presentation
        ^                       |
        |                       v
 Safety + fidelity validator <--+---- cache / logs / editorial review
```

### 8.2 Allowed AI responsibilities

- Create short host introductions and reaction lines.
- Rephrase approved facts into mechanic-specific prompt wording.
- Offer factual explanations using supplied sources, validated before display.
- Write narrative artifact variants within canonical plot constraints.
- Select performance tone from story and session state.
- Create private editorial candidates for new fact packs and accepted variants.

### 8.3 Forbidden live AI responsibilities

- Determining correct/incorrect answers without deterministic validation.
- Creating uncited factual claims that affect learning.
- Selecting or changing a wager after player input.
- Modifying score or mastery history.
- Producing public content from restricted source material without rights clearance.
- Impersonating real deceased personalities as if authored by them.

### 8.4 Host generation request

```ts
type HostRequest = {
  personaVersion: string;
  storyStage: number;
  momentKind: string;
  mechanicId: string;
  factPacket?: PromptPacket;
  playerContext: {
    streak: number;
    recentOutcomes: string[];
    evidenceFound: string[];
    safetySettings: string[];
  };
  lengthBudget: number;
};
```

### 8.5 Latency and cost plan

- Use authored local fallback lines for every state.
- Pre-generate/cached approved clue performances for core content packs.
- Generate only lightweight reactivity during a live session when available.
- Never block prompt display on nonessential AI banter.
- Log prompt version, cache hit, validation result, latency, and estimated cost.

---

## 9. Content Semantics And Data Architecture

### 9.1 Normalize before play

The raw clue record is not sufficient gameplay state. Introduce a normalization pipeline:

```text
raw archive/import
  -> parse markup/media
  -> classify round and value semantics
  -> extract candidate fact/answer forms
  -> attach provenance and rights status
  -> flag uncertainty for editorial review
  -> publish playable content shard
```

### 9.2 Imported clue record

```ts
type ImportedClue = {
  sourceId: string;
  sourceType: 'archive' | 'licensed' | 'original' | 'user-pack';
  sourceRound?: string;
  sourceValueText?: string | null;
  airDate?: string;
  rawPrompt?: string;
  rawAnswer?: string;
  mediaLinks?: MediaReference[];
  provenance: SourceCitation[];
};
```

### 9.3 Classified historical record

```ts
type ClassifiedClue = ImportedClue & {
  round: 'single' | 'double' | 'final' | 'tiebreaker' | 'other';
  clueKind: 'regular' | 'daily-double' | 'final' | 'special' | 'unknown';
  faceValue: number | null;
  observedWager: number | null;
  classificationConfidence: 'verified' | 'inferred' | 'unknown';
  reviewFlags: string[];
};
```

Do not infer a Daily Double merely because a value is unusual; special episodes can use unusual grids. A value can create a review candidate. A verified source can establish truth.

### 9.4 Content shards and catalog

Replace the duplicated monolithic JSON load with:

- A compact catalog/manifest.
- Shards by mode/topic/difficulty/era and media requirement.
- A local index for fast selection and spaced-review scheduling.
- Separate rights-cleared production packs from internal research imports.

Example:

```text
content/
  catalog.json
  packs/
    original-general-v1/
      manifest.json
      facts-0001.json
      prompts-arcade-0001.json
    internal-archive-evaluation/
      manifest.json
      imports-1984-1992.json
```

### 9.5 Media handling

With 10,523 source clues containing linked media markup, media cannot be handled as a surprise DOM concern alone.

For each media item store:

- media type and format;
- local/remote availability;
- rights and attribution status;
- thumbnail and transcript/caption availability;
- fallback mode for inaccessible or unsupported media;
- cache/transcode readiness.

Before public distribution, broken or uncleared links must not determine gameplay outcomes.

---

## 10. Application Architecture

### 10.1 Target component map

```text
Content Pipeline (offline/editorial)
  Importer -> Normalizer -> Rights/Provenance Gate -> Fact Store -> Pack Builder

Game Runtime
  Session Director
    -> Mechanic Registry
    -> Deterministic Rules/Judge
    -> Player Memory & Progress
    -> Story State
    -> Event Bus

Performance Runtime
  Host Director -> AI Gateway + Cache + Safety/Fidelity Check -> Renderer/Audio

Client Experience
  UI Scenes -> Accessibility/Settings -> Local persistence / sync later
```

### 10.2 Recommended modules

| Module | Responsibility |
| --- | --- |
| `content/normalizer` | classify records, parse value/round/media/answer semantics |
| `content/catalog` | select playable rights-approved content packs |
| `core/session-director` | construct session arc and choose next moment |
| `core/mechanic-registry` | mechanic plug-in contract and eligibility |
| `core/rules-engine` | score, wagers, timers, deterministic outcomes |
| `core/answer-judge` | current matching logic plus dispute workflow |
| `learning/mastery-store` | attempts, confidence, due review, topic progress |
| `story/story-engine` | evidence, host phase, narrative triggers |
| `host/host-director` | performance request selection and fallbacks |
| `ai/host-gateway` | secure server-side generation/cache/validation |
| `media/media-service` | playable assets, transcripts, preload/fallback |
| `render/scene-renderer` | presentation of typed moments |

### 10.3 Event vocabulary additions

```text
SESSION_STARTED / SESSION_COMPLETED
MOMENT_SELECTED / MOMENT_REVEALED
WAGER_OFFERED / WAGER_COMMITTED / WAGER_RESOLVED
JUDGMENT_EXPLAINED / JUDGMENT_DISPUTED
MASTERY_CHANGED / REVIEW_SCHEDULED
ARTIFACT_DISCOVERED / STORY_STAGE_CHANGED
HOST_LINE_REQUESTED / HOST_LINE_VALIDATED / HOST_LINE_FALLBACK
CONTENT_FLAGGED / MEDIA_FALLBACK_USED
```

### 10.4 Persistence

Start local-first:

- preferences;
- completed sessions;
- mastery state;
- disputes;
- story unlocks;
- local performance telemetry;
- content pack versions.

Account/sync/multiplayer should arrive only after the solo loop earns repeat use.

---

## 11. Visual, Audio, And Interaction Design

### 11.1 Visual world

The visual identity should blend:

- midnight television studio;
- celestial backlot/beach-afterparty residue;
- CRT interference and neon arcade typography;
- suspicious counterfeit currency;
- manila evidence files and broadcast control-room overlays.

The current illustrated banknotes are an excellent seed. The next art pass should generate an original Malex expression kit:

1. respectable neutral;
2. delighted but unsettling;
3. wounded pride;
4. trying not to panic;
5. caught lying;
6. final reveal.

### 11.2 Money semantics in the UI

Money treatments become meaningful rather than decorative:

| Semantic moment | Treatment |
| --- | --- |
| Standard clue score | clean game-credit note or score tile |
| Confidence wager | counterfeit note entering from off-screen |
| Verified historical Daily Double reference in internal mode | labeled archival/wager context |
| Finale | sealed envelope / no face-value bill |
| Malex fraud story beat | overstamped `QUESTIONABLE TENDER` |

### 11.3 Audio system

Audio is a major fun multiplier and accessibility responsibility.

Audio layers:

- UI taps, note slap, reel click, timer tick.
- Mechanic stings and transitions.
- Broadcast ambience and static.
- Malex vocal performance, initially text-first with optional future voice.
- Media clue playback with captions/transcripts.

Rules:

- Mute and volume controls from first implementation.
- Reduced sensory mode.
- No automatic loud playback.
- Transcripts/captions required for information-bearing audio.
- Audio failures never make a question unanswerable without fallback.

### 11.4 Accessibility

- Keyboard-complete operation.
- Screen-reader live regions without cluttering the visible clue.
- Reduced motion and reduced flashing settings.
- High-contrast palette alternatives.
- Captions/transcripts and image descriptions for media prompts.
- Timing accommodations and untimed Study Mode.
- Explanation language adjustable independently of comic host verbosity.

---

## 12. The Second Pass: Build The Important Extras Anyway

The safe plan could stop at normalized clues, modes, a host, and a few mechanics. That would be a good game. The more ambitious product sees that learning, narrative, and television nostalgia can reinforce one another rather than compete.

### 12.1 Backstage evidence board

Every Arcade Story session can yield an artifact:

- A forged network memo.
- A prize invoice.
- A transcript correction.
- A Polaroid from a show that never aired.
- A player-submitted disputed ruling stamped by the judges.

Artifacts form an evidence wall. They unlock mechanics, reveal Malex's contradictions, and give regular learning progress a narrative shape.

### 12.2 The Lost Broadcast schedule

Instead of an endless feed, the game has fictional programming blocks:

- `Monday Night Respectability`: mostly straight clues and study rewards.
- `Counterfeit Thursdays`: wager-heavy arcade episodes.
- `Transmission From Cabin 8`: audio/media clues and strange interruptions.
- `Sunday Apology Special`: weekly recap of knowledge gained and evidence found.

The schedule can be local and optional, not manipulative. Its function is mood, not FOMO.

### 12.3 Personal knowledge documentary

At the end of a month, the game creates an episode recap of the player's actual learning:

- topics entered;
- facts rescued from fragile to remembered;
- most stubborn misconception;
- funniest disputed ruling;
- story discoveries.

Malex tries to make it about himself; the system quietly proves the player is the real protagonist.

### 12.4 Couch co-op and family lore

A television-inspired product should eventually support shared rooms:

- Pass-the-buzzer living-room rounds.
- Intergenerational decade packs.
- Players contribute family-safe local questions/photos with provenance.
- Grandparent/child teams discover knowledge gaps in both directions.

This is where nostalgia becomes social rather than ornamental.

---

## 13. The Third Pass: High-Upside Sparks

These are not all immediate build items. They are the ideas worth preserving because they may define the product if tests prove the core loop works.

### Spark 1: The show is a memory palace

The broadcast studio physically changes according to what the player learns. Astronomy facts illuminate a broken planetarium wing. Music facts restore a spectral house band. Geography unlocks absurd destination prizes. Mastery does not merely fill a bar; it repairs a world.

**Why it matters:** Spaced repetition becomes exploration. Education produces visible belonging.

### Spark 2: Wrong answers become comic canon

When a player gives a wonderful wrong answer, the game can save it as an explicitly false alternate-universe artifact: an advertisement, fake museum plaque, or Malex business venture. It is labeled false and paired with the correction.

Example: a player mistakes the Appian Way for a pasta company. Later a counterfeit commercial appears for `APPIAN WAY: ROADSIDE RIGATONI`, immediately followed by the factual recall prompt.

**Why it matters:** Embarrassment becomes memory glue without corrupting truth.

### Spark 3: The host is afraid of your learning

Malex's narrative pressure should not depend only on score. He becomes more exposed specifically when the player masters certain domains: identity, contracts, broadcast history, Canadian geography, suspicious money. Knowledge itself advances the mystery.

**Why it matters:** The educational act is also the dramatic act. The story cannot be separated from learning.

### Spark 4: Every mechanic is a thinking lens

Mechanics should map to cognitive skills, not merely aesthetic references:

| Mechanic | Cognitive lens |
| --- | --- |
| Free recall clue | retrieval |
| Estimate/bargain round | magnitude and calibration |
| Survey bluff | misconception detection |
| Sequence board | chronology/causality |
| Evidence envelope | source interpretation |
| Wager | confidence accuracy |
| Two-truths style panel | discrimination and explanation |

**Why it matters:** Game-show variety becomes a hidden curriculum in how to think.

### Spark 5: A player's disputed rulings become the editorial flywheel

Every uncertain judgment can feed a private queue:

- what was submitted;
- why it was accepted/rejected;
- player challenge;
- recommended accepted variants;
- fact ambiguity score.

That queue improves authored rules and reveals bad prompts. It is not live model self-modification; it is a human-auditable improvement loop.

**Why it matters:** The game gets fairer from actual play and builds a proprietary learning-quality asset.

### Spark 6: The broadcast can be a creator platform

Long-term, creators/teachers can make original `channels`:

- a history teacher's Roaring Twenties station;
- a museum's object mystery hour;
- a language-learning variety show;
- a family's oral-history game night.

Each uses the same fact, mechanic, host, provenance, and accessibility contracts.

**Why it matters:** Jeopardish changes from one funny game to an authoring platform for memorable learning television.

### Spark 7: The final reveal should not end the show

If the player exposes Malex, he should not simply disappear. He is forced to stop pretending and co-host the show honestly, still vain and ridiculous but now oddly invested in the player's growth. Later chapters explore new network villains: an algorithmic Standards Board, a malfunctioning applause machine, a sentient prize warehouse.

**Why it matters:** Story payoff deepens the relationship rather than destroying the product's signature character.

---

## 14. Risks, Ethics, Rights, And Trust

This project can be joyful and bold only if it is serious about its boundaries.

| Risk | Consequence | Required control |
| --- | --- | --- |
| Archive provenance/republication limitations | Product cannot safely commercialize corpus as-is | rights review; internal-only flag; original/licensed fact packs |
| Existing brand/show resemblance | confusing or legally exposed production identity | original format names, visuals, character, and content |
| Real-person likeness/death premise | taste, rights, and reputational risk | fictional host and composite inspirations |
| AI rephrases a fact incorrectly | teaches false information | canonical fact packets, validator, cache, fallback |
| AI judges answers | inconsistent/fundamentally unfair play | deterministic answer judge only |
| Hidden Daily Double/final semantics | fake scoring and misleading UI | normalized clue classification |
| Remote media breaks or is uncleared | unusable/inaccessible prompt | media ingest, transcripts, rights states, fallbacks |
| Humor overwhelms learning | novelty without value | mastery loop, explanations, outcome metrics |
| Huge initial download | slow loading and fragile mobile play | deduplicate, shard, manifest/cache |
| Narrative becomes manipulative | retention by pressure rather than delight | optional story/mode settings, transparent progression |

This is planning guidance, not legal advice. A public or monetized release needs legal review of title, source corpus provenance, content rights, format resemblance, likeness use, and media assets.

---

## 15. Metrics And Evaluation

Do not optimize for time spent alone. A learning entertainment product succeeds when players return because it is fun *and* demonstrably retain knowledge.

### 15.1 Core validation metrics

| Goal | Measure |
| --- | --- |
| Fun | session completion, voluntarily started next episode, post-session delight rating |
| Learning | delayed recall on reviewed facts, fragile-to-mastered movement, explanation usefulness |
| Fairness | disputed ruling rate, overturned judgment rate, ambiguous prompt flags |
| Narrative pull | artifacts inspected, story chapter continuation, host-line skip/mute rate |
| Reliability | prompt generation validation pass rate, media fallback rate, load latency |
| Defensibility | percentage of playable facts with cleared provenance and citations |

### 15.2 First playtest questions

- Did the player understand what to do within thirty seconds?
- Did any wrong ruling feel unfair?
- Did humor aid or interrupt recall?
- Was the host charming, irritating, or too present?
- Which mechanic did the player immediately want again?
- Did the player notice the mystery without being told?
- Would they prefer study, story arcade, or board strategy next?

---

## 16. Delivery Roadmap

### Phase 0: Legacy Harvest And Feature Preservation

**Goal:** Recover proven good ideas before rewriting the foundation.

The active checkout exposes one `master` branch; it cannot establish on its own that every earlier Jeopardish or Jeoparody experiment has already been absorbed. When prior folders, repositories, exports, or screenshots are located, run a deliberate archaeology pass:

- Inventory every recoverable version by date, runtime, asset set, and playable feature.
- Diff answer-judging behavior, especially normalization, punctuation/spacing tolerance, aliases, parentheticals, diacritics, and Levenshtein/fuzzy thresholds.
- Turn recovered edge cases into a shared judge regression fixture before merging implementations.
- Compare clue rendering, media handling, host-state logic, sound, visual assets, game modes, and scoring behaviors.
- Preserve promising art and writing in an attributed archive; re-create production-facing likeness art as original fictional Malex material.
- Produce a keep/merge/retire decision ledger so a shiny rebuild does not accidentally erase a better older interaction.

**Exit condition:** All available prior builds have a feature matrix and rescued behaviors have tests or explicit retirement decisions.

### Phase A: Truth Layer And Prototype Correction

**Goal:** Never lie accidentally.

- Normalize `round`, `clueKind`, `faceValue`, `observedWager`, confidence, media, and accepted answers.
- Stop rendering Final/Tiebreaker null values as `$100`.
- Produce corpus classification report with review queue.
- Deduplicate and shard data loading.
- Add tests for value semantics, media ingest, and judgment disputes.
- Establish rights/provenance status in the content schema.

**Exit condition:** The runtime can distinguish standard, wager, final, and unknown moments without guessing silently.

### Phase B: Original Content And Arcade Vertical Slice

**Goal:** Ship the first unmistakably original episode.

- Create a small rights-cleared/original fact pack with citations.
- Implement `Study` and `Arcade Story` session directors.
- Implement Straight Clue, Counterfeit Wager, and Evidence Envelope mechanics.
- Generate coherent original Malex expression kit and animation/audio stings.
- Add mastery storage, explanation reveal, dispute logging, story artifact wall.

**Exit condition:** A ten-minute session is fun, factual, original, and replayable.

### Phase C: AI Performance Layer

**Goal:** Give the host a brain without giving it the keys to truth.

- Secure server-side host-generation endpoint.
- Persona/story-stage prompt specification.
- Fact-preserving rewrite validation and cached approved presentations.
- Host banter/reaction generation with local fallbacks.
- Cost/latency/safety observability.

**Exit condition:** Dynamic performance elevates sessions without changing outcomes or causing factual regressions.

### Phase D: Variety Network And Social Learning

**Goal:** Turn one excellent show into a universe.

- Mechanic registry expansion.
- Lost Broadcast schedule and monthly learning documentary.
- Couch co-op and original creator/teacher packs.
- Optional sync/account system and cross-device mastery.
- New story seasons beyond the Malex reveal.

**Exit condition:** The platform sustains content creators, repeat players, and durable learning loops.

---

## 17. Prioritized Implementation Backlog

### Must do next

1. Complete the Legacy Harvest feature matrix for every prior build that can be located.
2. Convert recovered answer-judging cases into regression fixtures for the canonical judge.
3. Build normalized clue classifier and a report of ambiguous/special values.
4. Change the score/render contract so null, face value, and wager are separate.
5. Shard/deduplicate the question bank and update the loader contract.
6. Define `FactRecord`, `Moment`, and `MechanicDefinition` schemas.
7. Build a small original/cited production fact pack.
8. Create Arcade Story session director with one real narrative arc.
9. Create Malex original expression kit after approving concept art direction.

### High leverage soon after

10. Implement mastery/review state and explanation panel.
11. Add dispute queue around deterministic answer judgments.
12. Implement Counterfeit Wager and Evidence Envelope.
13. Add audio/accessibility controller and media preflight validation.
14. Prototype host-generation endpoint with validation and fallback cache.

### Preserve as ambitious options

15. Memory-palace studio world changes.
16. Wrong-answer false-advertisement callbacks.
17. Learning-triggered mystery progress.
18. Weekly fictional schedule.
19. Couch co-op and classroom/creator channels.

---

## 18. Immediate Decisions For The Founder

These choices determine the next build rather than merely its polish:

1. **Identity:** Adopt an original fictional host and universe as the production direction, preserving real-host assets only as private reference/archive.
2. **Content:** Treat the current archive bank as internal research/evaluation until provenance and public-use rights are established.
3. **First mode:** Build Arcade Story alongside Study Mode; delay Classic Strategy until semantic classification is robust.
4. **First new mechanic:** Use Counterfeit Wager to force correct money/wager modeling and exploit the existing bill art.
5. **Narrative intensity:** Keep mystery optional and comic, with player knowledge driving reveals.
6. **AI boundary:** Approve deterministic truth/rules and generative performance as a hard architecture rule.

---

## 19. Closing Covenant

Jeopardish can be more than a nostalgia joke, more than a practice tool, and more than an AI host wrapper. It can be a rare kind of educational game: one where becoming more knowledgeable is inseparable from becoming more entertained, more suspicious, and more capable of seeing through the host's magnificent nonsense.

Build the part that knows what is true.  
Build the part that remembers what the player is learning.  
Then let Malex light up the counterfeit stage and insist, with full professional dignity, that none of this is unusual.

---

## Sources And Evidence

1. Local corpus analysis produced from `questions/jeopardy-questions.json` by `outputs/manual-20260526-jeopardish-vision/presentations/master-vision/source-analysis.mjs`, May 26, 2026.
2. J! Archive, Show #6088, Wednesday, February 16, 2011: https://j-archive.com/showgame.php?game_id=3577
3. J! Archive help and terms of use: https://www.j-archive.com/help.php
4. Dunlosky, J. et al. (2013). *Improving Students' Learning With Effective Learning Techniques*. PubMed record: https://pubmed.ncbi.nlm.nih.gov/26173288/
5. U.S. Copyright Office, Compendium Chapter 700: https://copyright.gov/comp3/chap700/ch700-literary-works.pdf
6. Local architecture contracts: `docs/ENGINE_CONTRACTS.md`.
7. Local asset inventory: `docs/ASSET_AUDIT_2026-05-24.md`.
