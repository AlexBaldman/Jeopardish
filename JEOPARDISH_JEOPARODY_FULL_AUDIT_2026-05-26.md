# Jeopardish and JeoPARODY Full Audit

Date: 2026-05-26  
Audited locations:

- Local Jeopardish worktree: `/Users/alex/coding/jeopardish`
- Local JeoPARODY worktree: `/Users/alex/coding/jeoparody`
- Historical JeoPARODY checkout: `/Users/alex/coding/jeoparody.old`
- GitHub repositories: `AlexBaldman/Jeopardish` and `AlexBaldman/jeoPARODY`

## Scope And Method

This audit examined:

- Local Git status, branch divergence, size, assets, documentation, source, scripts, and tests.
- Current GitHub repository status, branches, pull requests, default branches, and recent activity.
- The playable/runtime behavior of JeoPARODY in development and production-preview builds.
- The latest GitHub `origin/master` Jeopardish code in an isolated temporary extraction, so the dirty local worktree was not altered.
- Existing and newly developed visual material in both projects.
- Migration decisions: what JeoPARODY should preserve from Jeopardish, what it should replace, and what should be deferred.

The creative and technical lenses below are not statements from, impersonations of, or endorsements by John Carmack, Banksy, Grant Morrison, Leonardo da Vinci, Anthony Metivier, MAD Magazine artists, or any other named creator. They are reasoned critiques using relevant principles associated with their public bodies of work and expertise.

## Executive Assessment

JeoPARODY is the correct long-term home for the final product, but it is not presently a releasable successor to Jeopardish. It has a more ambitious visual identity, stronger conceptual reach, promising modular services, and a better foundation for modes and AI integration. However, the current local rebuild has release-blocking runtime and deployment defects: first-load initialization never becomes interactive in the tested browser flow, the production build does not ship the dynamic clue/audio assets it requests, revealed answers can still earn full score, and new-clue routing is duplicated.

Jeopardish is not simply obsolete. Its newest GitHub `master` branch is a tested, coherent arcade engine refactor, while the dirty local checkout contains a different and valuable experimental line: question sharding, starter-pack startup, review-misses functionality, and data cleanup. Jeopardish currently holds several of the most important learning-product and performance ideas that should be deliberately transplanted into JeoPARODY.

The final product should not be a pile of modes and AI providers. Its first durable release should be a fast, funny, original, legally defensible mastery loop:

1. Start instantly with local content.
2. Play a clue, answer, score fairly, and learn why.
3. Capture missed clues for later retrieval practice.
4. Respond through an original host voice and coherent visual system.
5. Treat AI as an optional enhancement, never a boot dependency or factual authority without constraints.

## Findings First

### P0. JeoPARODY Does Not Reach An Interactive Ready State In Browser Testing

Severity: Critical  
Affected surface: Current local JeoPARODY rebuild and any branch promoted from it

The initialization sequence blocks UI binding behind audio startup:

- [src/main.js](/Users/alex/coding/jeoparody/src/main.js:34) awaits core-service initialization before it binds UI behavior.
- [src/init/services.js](/Users/alex/coding/jeoparody/src/init/services.js:24) unconditionally awaits `soundManager.init()`.
- [src/services/soundManager.js](/Users/alex/coding/jeoparody/src/services/soundManager.js:73) creates and attempts to resume an `AudioContext` before a user gesture, then awaits preload.

Browser validation against both Vite development and production-preview servers never reached `window.JeopardyApp.initialized`. The splash screen remained active after clicking a start mode, and the full-board screen remained hidden. Browser console output stopped after clue data loaded and reported the browser restriction that `AudioContext` could not begin before user interaction.

Why it matters:

- A visually complete app that cannot leave its splash screen is not shippable.
- It blocks meaningful end-to-end verification of all game modes.
- It turns an optional enhancement, audio, into a fatal boot dependency.

Required correction:

- Bind controls and establish application-ready state before audio activation.
- Initialize or resume audio only from an actual user gesture, non-blockingly.
- Make sound preload bounded and failure-tolerant.
- Add a browser smoke gate that fails unless classic mode and board mode can enter an interactive state.

### P0. The JeoPARODY Production Artifact Omits Runtime Question And Audio Assets

Severity: Critical  
Affected surface: Production deployments, including the GitHub Pages workflow design

The application requests runtime content from asset paths such as:

- [src/services/api/questionService.js](/Users/alex/coding/jeoparody/src/services/api/questionService.js:317): `assets/questions/starter-pack.json`, index, and shards.
- [src/services/soundManager.js](/Users/alex/coding/jeoparody/src/services/soundManager.js:19): audio asset paths.

The successful Vite build generated JavaScript, CSS, fonts, favicon, title artwork, and service worker files in `dist`, but no `assets/questions` or `assets/audio` content. A request to the production preview path `/assets/questions/starter-pack.json` returned the HTML application fallback rather than JSON. The same request in the development server returned actual JSON because source assets are directly available there.

Why it matters:

- Deployment can look healthy while clue loading silently fails or drops into incomplete fallbacks.
- A GitHub Pages workflow that publishes only `dist` cannot deliver content that was never copied into `dist`.
- This is a production correctness defect, not an optimization.

Required correction:

- Establish a production static-asset pipeline, for example `public/assets` or an explicit Vite copy/build step.
- Include only the intended deployable content set, not every historical asset by default.
- Assert during CI that deployed starter pack, shard index, representative shard, host art, and required audio routes return the expected MIME/content.
- Run browser tests against `vite preview`, not only development mode.

### P0. Revealing An Answer Does Not Prevent Full-Score Submission

Severity: Critical for learning integrity  
Affected surface: Core gameplay scoring

There are answer reveal handlers in:

- [src/init/ui.js](/Users/alex/coding/jeoparody/src/init/ui.js:61)
- [src/init/services.js](/Users/alex/coding/jeoparody/src/init/services.js:100)

The UI emits `game:answer:revealed` at [src/init/ui.js](/Users/alex/coding/jeoparody/src/init/ui.js:345), but the engine event registration at [src/core/GameEngine.js](/Users/alex/coding/jeoparody/src/core/GameEngine.js:591) does not consume that event and set the reveal/peek state. Scoring at [src/core/GameEngine.js](/Users/alex/coding/jeoparody/src/core/GameEngine.js:375) hardcodes `peekUsed: false`.

The resulting behavior inferred directly from active source is that a learner can reveal the answer and then submit it for full credit.

Why it matters:

- It breaks the central promise of a practice and learning application.
- It makes score, streak, and future spaced-review data meaningless.
- Jeopardish already contains tested behavior for denying points after a peek; the rebuild has regressed this principle.

Required correction:

- Give the game engine sole ownership of reveal state.
- Route answer reveal through one engine action/event.
- Add tests: reveal then correct answer receives no ordinary credit; unrevealed correct answer scores; revealed clues enter review history appropriately.

### P1. A Single New-Clue Request Is Handled Twice

Severity: High  
Affected surface: Game determinism, question inventory, scoring history

Both the engine and UI initialization subscribe to the same event:

- [src/core/GameEngine.js](/Users/alex/coding/jeoparody/src/core/GameEngine.js:591) handles `question:request-new`, fetches a question, and emits `question:load`.
- [src/init/ui.js](/Users/alex/coding/jeoparody/src/init/ui.js:330) separately handles `question:request-new`, fetches a question, and emits `question:load`.

The button emits that request at [src/init/ui.js](/Users/alex/coding/jeoparody/src/init/ui.js:20). Once initialization is repaired, one click can draw and load two questions, with one discarded or overwritten depending on event timing.

Required correction:

- Choose one orchestrator. The engine should own question selection and game-state mutations; UI should emit intent and render state.
- Add a test asserting one button action consumes exactly one clue and produces one load event.

### P1. Several Presented Modes Are Not Yet Complete Product Features

Severity: High product risk  
Affected surface: User trust and product scope

Current board question loading selects one random year shard during local initialization at [src/services/api/questionService.js](/Users/alex/coding/jeoparody/src/services/api/questionService.js:331). Board generation later filters only that already loaded pool at [src/services/api/questionService.js](/Users/alex/coding/jeoparody/src/services/api/questionService.js:174), rather than selecting the requested date/year data deterministically.

The UI offers years far beyond the verified bundled shard range, and selected board cells currently display clue content rather than entering the primary answer/scoring loop. The run-category interface contains placeholder progress behavior in [src/init/ui.js](/Users/alex/coding/jeoparody/src/init/ui.js:297).

Required correction:

- Label incomplete modes as experimental or hide them from the release path.
- Finish classic mode first.
- Make board/date selection resolve the correct content index and feed the same scoring/review state machine as classic play.

### P1. Browser Trust Boundaries Are Too Weak For A Public AI-Enhanced App

Severity: High  
Affected surface: XSS exposure, API key leakage, AI content display

Active answer rendering writes data into HTML:

- [src/init/services.js](/Users/alex/coding/jeoparody/src/init/services.js:100)
- [src/init/ui.js](/Users/alex/coding/jeoparody/src/init/ui.js:61)

Question normalization returns answer text without the same defensive handling applied elsewhere at [src/services/api/questionService.js](/Users/alex/coding/jeoparody/src/services/api/questionService.js:598). Other service/component paths also insert AI or persisted user material into HTML, including [src/services/DialogManager.js](/Users/alex/coding/jeoparody/src/services/DialogManager.js:180), [src/services/ai/ConsoleOverlay.js](/Users/alex/coding/jeoparody/src/services/ai/ConsoleOverlay.js:38), and [src/components/SettingsModal.js](/Users/alex/coding/jeoparody/src/components/SettingsModal.js:37).

In addition, [src/init/services.js](/Users/alex/coding/jeoparody/src/init/services.js:37) accepts AI keys from URL parameters and stores them locally. URL-delivered keys can leak into browser history, logging, screen sharing, referrer flows, or analytics before cleanup; local storage becomes especially problematic in the presence of HTML injection.

Required correction:

- Use `textContent` by default for clue, answer, user, and AI text.
- Sanitize only deliberately supported rich markup.
- Remove client-side key collection from production. Put paid-provider calls behind a server-side proxy or disable them for the public static release.
- Add hostile-string rendering tests and a content security policy.

### P1. Both Public Projects Need An Intellectual-Property And Asset-Provenance Decision

Severity: High business/release risk  
Affected surface: Public/commercial launch

Jeopardish and JeoPARODY include or appear to depend on material closely associated with an existing television program: clue archives, likeness-oriented host imagery, reaction media, show-like presentation, and in JeoPARODY substantial audio/visual content with recognizable-host direction. The newer JeoPARODY character sheet is visually coherent, but its silver-haired moustached presenter reads intentionally close to Alex Trebek.

The README asserts MIT treatment, but no actual `LICENSE` file was found in either audited worktree.

This is not legal advice. It is an engineering/product release risk: the more durable and commercial the project becomes, the more it should own its host character, voice, music, art, typography licensing, content provenance, name/branding, and distribution rights.

Required correction:

- Make the host unquestionably original in appearance, name, voice, biography, and performance.
- Inventory every asset and dataset with source, license, and allowed use.
- Add an actual software license only for code the owner can license.
- Obtain qualified legal review before broad public monetization or launch.

## Repository Status Snapshot

| Topic | Jeopardish | JeoPARODY |
| --- | --- | --- |
| Intended role | Early experimental/prototyping project | Rebuild intended as final product |
| GitHub URL | `github.com/AlexBaldman/Jeopardish` | `github.com/AlexBaldman/jeoPARODY` |
| Public/default branch | Public, `master` | Public, `main` |
| GitHub last push observed | 2026-05-24 11:09:17 UTC | 2026-01-19 17:35:46 UTC |
| Local active branch | `master` | `cleanup/production-readiness` |
| Local divergence | Behind `origin/master` by 4 commits and heavily dirty | Ahead of `origin/main` by 3 commits and heavily dirty |
| Current canonical remote tip | `8d61c1a` on `origin/master` | `e71d0dc` on `origin/main` |
| Local HEAD | `a27b366` | `1f97c4d` |
| Open PR count observed | 7 | 1 |
| Local directory size | 526 MB | 712 MB |
| Runtime verification | Remote tip passes JS/tests/question validation | Unit/lint/build pass; browser runtime fails to initialize |

### GitHub Governance Status

Jeopardish has meaningful recent remote development but a cluttered pull-request queue. Open PRs include obsolete/duplicated work and at least one unrelated game concept branch. Its most recent merged line is materially more advanced than the local checkout in core architecture.

JeoPARODY's GitHub repository is comparatively stale relative to the local rebuild. The important current architecture and production-readiness work is not represented on GitHub as a reviewable, CI-checked branch. One older open PR concerns Qwen image-edit support; it should be mined only after current product priorities and security constraints are settled.

Recommendation:

- Do not treat open PR count as momentum. Close obsolete PRs and preserve only intentionally useful branches.
- Do not push current dirty JeoPARODY state as "finished." Stabilize P0 issues locally, commit scoped changes, then open a clear rebuild/stabilization PR with browser deployment checks.

## Jeopardish Audit

### What The GitHub Version Has Become

The current remote Jeopardish `origin/master` is no longer just the primitive first experiment. Its four commits beyond the local checkout establish:

- A modular engine architecture with explicit contracts, event bus, game engine, data loader, host manager, renderer, and console narrator.
- Stronger arcade interface and controls.
- Security/dependency audit work.
- Tests for event flow, narration, host behavior, rendering, and core answer logic.

The remote documentation describes an engine-centered product boundary: game rules remain independent of host performance and presentation. That is a useful principle for JeoPARODY.

Validation against an isolated extraction of `origin/master`:

- `npm run check:js`: passed.
- `npm test`: passed, 23 tests.
- `npm run validate:questions`: passed, validating 216,930 questions.

### What The Dirty Local Jeopardish Worktree Contains

The local worktree is behind the remote branch but is not merely stale. It contains a parallel experimental direction:

- Flat MVP session/view/question-bank modules.
- Starter pack plus lazy shard-manifest question delivery.
- A review-misses learning workflow.
- Data cleanup work removing tracked dependency/generated clutter and duplicate data representations.
- Additional developer/product audit documentation and experiment ledgers.

Local validation:

- `npm run verify`: passed.
- Test result: 18 tests passed.
- Dataset result: canonical archive of 216,930 questions with starter pack and 128 generated shards verified by local scripts.

### Jeopardish Strengths Worth Preserving

- It has the clearest proof of a small, playable, direct trivia loop.
- It has working and tested answer-judging ideas.
- The local data sharding work directly addresses payload/startup problems still relevant to JeoPARODY.
- Review Misses is more central to genuine learning value than several ambitious JeoPARODY modes.
- Its new remote engine separation is a sound reference for event ownership and deterministic state.

### Jeopardish Limitations

- The GitHub tip still describes loading the full archive as a current data-loader behavior; the local sharding work has not been reconciled upstream.
- The local and remote directions have diverged and cannot be safely combined by an indiscriminate merge.
- The visual identity is clear but still prototype-like: saturated pink framing, flat caricature host, and simple arcade panel read as a useful lab rather than a durable original universe.
- It shares the broader rights/provenance questions around content and recognizable-show influence.

### Jeopardish Decision

Treat `origin/master@8d61c1a` as the canonical stable Jeopardish baseline. Before any reconciliation, snapshot/preserve the dirty local experimental work on its own branch. Then extract only high-value mechanisms and documentation into JeoPARODY:

- Review Misses and durable practice history.
- Starter pack plus deterministic shard/index loading.
- Tested answer-normalization and reveal/scoring rules.
- Any useful data-cleanup tooling.
- Concise experiment-ledger ideas that support the primary loop.

Jeopardish should eventually become a reference laboratory or archived playable prototype, not a competing production target.

## JeoPARODY Audit

### Architectural Direction

JeoPARODY aims at a broader product: classic trivia play, full board, study and mnemonic features, AI providers, host/dialog systems, stronger theming, and a more authored world. Its [ARCHITECTURE.md](/Users/alex/coding/jeoparody/ARCHITECTURE.md:1) is appropriately candid: the current MVP runtime is still the static DOM plus `src/main.js`, `GameEngine`, and event bus; many component/store modules are not the primary mounted runtime.

That honesty matters. The architecture problem is not a lack of abstractions. It is that the active runtime presently violates some of its own boundaries:

- Service startup blocks interaction.
- UI and engine both mutate question flow.
- Scoring is detached from reveal state.
- Some visible modes are not integrated with the core game.

### Local Change State

The local branch `cleanup/production-readiness` is three commits ahead of GitHub `main`, with substantial additional uncommitted work. Relative to `origin/main`, the current working state changes more than one hundred files, adding thousands of lines and removing thousands more. It includes:

- Question/runtime convergence work.
- AI fallback and service guard work.
- An extraction of initialization logic from a very large `src/main.js`.
- Current untracked runtime scripts and visual design assets.

This is useful progress but high risk without a stable commit boundary and browser integration gate. The active local work is materially more important than the stale GitHub presentation of JeoPARODY.

### Test And Build Health

Successful checks on the current local worktree:

| Check | Result |
| --- | --- |
| `npm test -- --runInBand` | Passed: 6 suites, 58 tests |
| `npm run lint` | Passed |
| `npm run lint:css` | Passed |
| `npm run build` | Passed |
| Production artifact content test | Failed: required dynamic assets omitted |
| Browser runtime smoke test, dev server | Failed: splash does not initialize into mode |
| Browser runtime smoke test, preview server | Failed: splash does not initialize into mode |

The distinction is important: unit/lint/build status is respectable, but deployment and interaction correctness currently fail.

### Dependencies And Security Maintenance

`npm audit --json` reports five moderate, fixable transitive advisories in the current lockfile, involving packages in chains including `brace-expansion`, `gaxios`, `protobufjs`, `uuid`, and `ws`. This is an improvement over the older May documentation that reported more severe findings, but the repository documentation is now stale in both directions: it still describes problems already fixed, while not documenting present browser-runtime and packaging blockers.

### Data And Asset Footprint

JeoPARODY's richer ambition has a large delivery footprint:

| Area | Approximate size |
| --- | ---: |
| Entire local directory | 712 MB |
| `assets` | 246 MB |
| `assets/questions` | 217 MB |
| `assets/images` | 15 MB |
| `assets/audio` | 13 MB |

Large content examples include:

- `combined_season1-40.tsv`: about 75.5 MB.
- `questions.json`: about 55.6 MB.
- `questions.csv`: about 34.9 MB.

This is acceptable as a source archive, but not as an unexamined deployed payload. The product needs a clear split between archival source material, curated deployable dataset, lazy shards, offline cache policy, and asset provenance.

### Documentation Accuracy

The current README and architecture documentation disagree:

- The README presents a broader component/store architecture as though it is the established runtime and refers to `docs/MASTER_PLAN.md`.
- Current work deletes `docs/MASTER_PLAN.md`.
- `ARCHITECTURE.md` says the static DOM/event-driven MVP path is the actual active runtime.
- The README refers to CSS lint as a known failure even though it now passes.
- The README implies MIT licensing without an actual `LICENSE` file.

Recommendation:

- Make `ARCHITECTURE.md` the accurate runtime truth until the mounted architecture genuinely changes.
- Replace the deleted master-plan link with a short current roadmap.
- Separate "implemented," "experimental," and "concept" capabilities.
- Add license and provenance documentation only after ownership is clear.

## Migration Matrix

| Capability | Best current source | JeoPARODY status | Decision |
| --- | --- | --- | --- |
| Pure answer matching / acceptable variants | Jeopardish remote and migrated tests | Partly present | Preserve, expand tests |
| Peek/reveal scoring integrity | Jeopardish behavior | Regressed in JeoPARODY | Reimplement as P0 |
| Review Misses | Dirty local Jeopardish | Not central/current | Migrate as core MVP feature |
| Starter pack and shard loading | Dirty local Jeopardish | Some shard services present, deployment broken | Adopt with production packaging tests |
| Modular event-driven engine | Jeopardish remote plus JeoPARODY engine intent | Ownership currently duplicated | Consolidate in JeoPARODY engine |
| Celestial host/world concept | JeoPARODY new art material | Strong concept, not fully integrated | Keep direction, redesign as original IP |
| AI provider abstractions | JeoPARODY | Security and product scope unresolved | Server-side optional enhancement later |
| Full board | JeoPARODY | Visible but incomplete data/scoring integration | Hold from MVP until real |
| Run-category mode | JeoPARODY | Placeholder interaction | Hold from MVP |
| PAO/mnemonic tooling | JeoPARODY concept/components | Not yet a verified learning loop | Stage behind Review Misses |
| Live/persisted browser API keys | JeoPARODY | Risky | Remove from production |
| Large archive/media collection | Both | High footprint/provenance risk | Keep source-only pending rights audit |

## Product And Experience Evaluation

### What The Product Wants To Be

The most compelling idea is not "Jeopardy with more buttons." It is an original learning-comedy universe where:

- Retrieval practice has the velocity and drama of a game show.
- A host responds with authored warmth and wit.
- Misses become structured return visits, not failure screens.
- Humor lowers the fear of being wrong without weakening factual rigor.

JeoPARODY is better placed to become this product than Jeopardish because it has the larger identity ambition. Jeopardish is better at demonstrating what the interaction must never lose: immediacy, clear scoring, and compact learning utility.

### First Release Definition

The initial final-product release should include:

- One reliably playable classic mode.
- Immediate startup with a curated starter dataset and lazy archive access.
- Correct answer matching and unambiguous score rules.
- Reveal answer behavior that forfeits normal points but supports learning.
- Review Misses with spaced return opportunities.
- One coherent original host identity with authored fallback lines and reactions.
- Responsive and accessible keyboard/touch flow.
- No required paid AI, no browser-stored provider key, no unfinished public modes.

This is not a reduced vision. It is the base on which the universe can reliably grow.

## Engineering Lens: Performance, Simplicity, Determinism

A Carmack-informed engineering review would focus on observable control flow and latency before adding more product surface:

- The first interaction must not await audio, AI, large archives, or optional effects.
- There must be one authoritative state machine for clue selection, answer reveal, judging, scoring, and review logging.
- A built artifact must contain or reliably retrieve every file it references.
- Game content should be indexed and lazily delivered, not loaded as redundant full archives.
- Runtime instrumentation should expose initialization time, clue-load failures, discarded/double loads, and asset-route failures.
- Elaborate service/component architecture is valuable only where it improves correctness, profiling, or iteration.

The current P0 failures are exactly the kind of failures this lens prioritizes: user-perceived non-functionality caused by optional systems and unclear ownership.

## Visual And Art-Direction Lens

### Jeopardish Current Visual Character

The reviewed Jeopardish screenshots show a loud, accessible prototype language:

- Neon pink surrounding field.
- Charcoal arcade cabinet treatment.
- Bright cyan/pink actions.
- Blue clue bubble and flat caricature presenter.

This is readable and play-forward. It communicates "arcade trivia prototype" quickly. It does not yet convey a unique long-form world or premium authored product; the palette dominates nuance and the host is still mostly a functional mascot.

### JeoPARODY Current Visual Character

The newer JeoPARODY runtime screenshots are more cinematic:

- Large dark clue panel with gradient arcade buttons.
- Stage-like photographic background treatment.
- Mixed serif clue typography and pixel/arcade interaction typography.
- A photographic/recognizable-host element.

The untracked character-sheet and infographic artwork offers a more promising identity system:

- Cream, navy, gold, and lavender celestial-show palette.
- Tailored presenter silhouette with star/halo accents.
- Editorial illustration and expression studies.
- A clear tagline/world-building direction around an afterlife/celestial trivia host.

The problem is collision rather than lack of design: photographic television-stage realism, pixel arcade controls, glossy editorial concept art, and recognizable-host reference currently coexist without a single governing visual bible.

### Recommended Art Direction

Choose a singular system: an original celestial art-deco trivia theatre with restrained arcade/pixel accents.

- Retain navy/gold/lavender/cream as the core palette.
- Redesign the host away from any identifiable real presenter while preserving charm, precision, and theatrical grace.
- Replace borrowed photographic stage and reaction material with authored backgrounds, props, and reaction portraits or sprites.
- Define typography roles: display/logo, clue/readability, interface/control, and optional pixel accent only.
- Produce a compact expression/reaction set that is usable in runtime and consistent at every viewport size.
- Optimize assets and enforce a delivery budget before adding more illustration.

### Satire And Comics Lens

A satire-informed review would ask: what does the joke reveal, and who bears its cost?

- The strongest target is game-show certainty, pompous scoring rituals, AI overconfidence, and the comedy of remembering strange facts.
- The weakest direction is using parody as an excuse to lean on borrowed host likeness, clips, or brand recognition.
- The host should make being wrong enjoyable, not make the learner the joke.

A graphic-narrative lens suggests treating each session as a short performance:

- Entrance: host sets the tone.
- Rising action: clues build streak or tension.
- Reveal: misses produce a clever but useful teaching beat.
- Return: Review Misses makes earlier failures reappear as character and mastery development.

That narrative structure can make even a small MVP feel like a universe rather than a utility.

### Pixel And Game-Art Lens

If pixel-art elements remain, use them as an intentional subsystem:

- One pixel scale and one limited palette for icons/effects/sprites.
- Crisp silhouettes readable on small screens.
- Small animation vocabulary: entrance, correct, miss, streak, reveal.
- Avoid mixing photographic footage, pseudo-pixel buttons, and detailed illustration in the same gameplay view unless the contrast is a deliberate narrative device.
- Maintain contrast, reduced-motion support, tap target size, and legibility as visual non-negotiables.

## Leonardo Da Vinci-Informed Lens: A Designed Machine With A Soul

The project's strongest instinct is its attempt to combine mechanism, memory, theatre, illustration, and humor. A da Vinci-informed critique would favor careful notebooks and prototypes, but demand that observations become working mechanisms.

Useful implications:

- Continue the experiment ledger and character studies, but distinguish sketches from shipped apparatus.
- Design the host, board, sounds, scoring, and study loop as one coordinated machine.
- Observe learners: where do they hesitate, laugh, return, or quit? Let those observations shape mechanics.
- Use illustration to clarify cognition: category maps, remembered loci, visual clue associations, and progress should teach rather than merely decorate.

In that frame, JeoPARODY is promising sketchbook work attached to a machine that still needs its essential gears corrected.

## Anthony Metivier-Informed Learning Lens

A memory-training-informed evaluation favors retrieval, association, and repeated recall over passive reveal or novelty modes. The highest-value learning feature in the combined projects is therefore Review Misses, not AI improvisation.

Recommended learning loop:

1. Learner attempts an answer before seeing support.
2. The product judges transparently and records confidence/outcome.
3. A miss presents concise correction plus an optional vivid mnemonic association.
4. The missed clue returns on a spaced schedule.
5. Related categories can be placed into a user-defined memory palace or PAO structure only after core retrieval works.
6. Progress is measured through later recall, not merely exposure or generated explanation.

AI can assist by suggesting memory imagery, alternate phrasings, and explanation, but should not:

- Award unverifiable points.
- Bypass the attempted-retrieval step.
- Generate facts without a validated clue/answer anchor.
- Become necessary for offline play.

JeoPARODY's PAO and learning ambitions become credible when built on deterministic Review Misses and spaced practice telemetry.

## Delivery, Security, And Operational Review

### Build And Hosting

The current deployment model needs explicit asset correctness:

- Decide which dataset is part of a public release.
- Copy/build that content into `dist` or serve it from a defined content origin.
- Verify service-worker cache behavior for starter content and application shell.
- Keep huge source archives out of initial download and potentially out of production distribution.

### Performance

Key performance goals:

- Initial interactive shell without waiting on audio or full clue archive.
- Starter clues immediately available.
- Lazy content shards loaded deterministically.
- Compressed, optimized original imagery and audio.
- No double question loads and no unnecessary service activation.

### Security

High-priority controls:

- Remove browser provider secrets and URL key paths from production.
- Eliminate unsafe text-to-HTML rendering for archive, AI, and user-controlled material.
- Apply CSP and dependency updates.
- Keep provider integration behind a server policy boundary with rate limits and redaction.

### Accessibility

Accessibility was not comprehensively audited with assistive technology in this pass, but the product direction requires:

- Keyboard-only complete gameplay.
- Visible focus state and semantic controls.
- Screen-reader announcement of new clue, judged result, reveal, and score updates.
- Adequate clue font size/line length and button contrast.
- Reduced-motion and audio-independent feedback.

### Legal And Provenance

Before a public final release:

- Create an asset inventory and license/provenance register.
- Replace or clear third-party audio, show-derived visual material, recognizable likeness material, and fonts as needed.
- Clarify dataset rights and redistribution strategy.
- Establish a real repository license and trademark/name strategy.

## Prioritized Execution Plan

### Phase 0: Stabilize And Preserve

Goal: make current work recoverable and restore basic product correctness.

1. Create preservation branches/commits for both dirty worktrees before merging, rebasing, or pruning.
2. Preserve Jeopardish local sharding/review work separately from remote modular-engine work.
3. Fix JeoPARODY startup so UI is ready without waiting on audio.
4. Package required runtime assets into the production build and assert content routes.
5. Establish single engine ownership of new-clue and reveal/scoring behavior.
6. Replace unsafe active HTML rendering and remove client-side production API-key paths.
7. Add browser tests for startup, one-clue-per-action, reveal score behavior, and production content fetch.
8. Correct runtime documentation and add a deliberate license/provenance decision.

Exit criteria:

- `vite preview` supports playable classic mode.
- No reveal-for-full-score path.
- No double clue consumption.
- No required runtime asset returns HTML fallback.
- Unit, lint, build, browser smoke, and security checks are recorded in CI.

### Phase 1: Ship The Core Learning Game

Goal: release a small but complete and enjoyable product.

1. Migrate Review Misses and deterministic shard/index loading from Jeopardish.
2. Finish classic mode with stable state, statistics, explanations, and spaced return queue.
3. Provide original local host dialog/reactions that work without AI.
4. Optimize starter dataset and essential visual/audio bundle.
5. Conduct small user sessions focused on response time, comprehension, humor, and repeat practice.

### Phase 2: Establish Original World And Brand

Goal: turn promising concept art into safe, consistent identity.

1. Select and consistently use the final product name.
2. Complete an original host redesign and production expression/sprite library.
3. Replace television-derived or ambiguous assets.
4. Finalize visual bible, typography, interaction motion, sound direction, and accessibility rules.
5. Resolve licensing and content provenance with qualified review.

### Phase 3: Add Modes And Optional Intelligence

Goal: expand only after the core loop is trusted.

1. Complete full-board data selection and scoring integration.
2. Build category/study mode on the same engine and Review Misses queue.
3. Add PAO/memory-palace tools tied to actual delayed recall.
4. Introduce AI behind a secure server boundary for optional dialog and mnemonic assistance.
5. Add deployment monitoring and product telemetry appropriate to privacy commitments.

## Immediate Repository Actions

### Jeopardish

- Preserve the dirty local experiment line before updating from remote.
- Keep `origin/master@8d61c1a` as the tested reference baseline.
- Reconcile sharding and Review Misses intentionally, not by wholesale merge.
- Close or label obsolete/unrelated PRs after preserving any useful artifacts.

### JeoPARODY

- Treat current local `cleanup/production-readiness` as active unreleased rebuild work, not the public canonical product yet.
- Break the work into reviewable commits after P0 corrections.
- Open a stabilization PR only after preview-browser checks pass.
- Do not merge image-edit/provider expansions ahead of startup, asset, scoring, and security correctness.

## Evidence Summary

### GitHub Status Observed

- Jeopardish: public, default `master`, pushed 2026-05-24, seven open pull requests observed.
- JeoPARODY: public, default `main`, pushed 2026-01-19, one open pull request observed.

### Jeopardish Validation

- Latest GitHub `origin/master` isolated extraction:
  - JavaScript check passed.
  - 23 tests passed.
  - Question validation passed for 216,930 questions.
- Dirty local worktree:
  - Verification passed.
  - 18 tests passed.
  - Sharded/starter-pack dataset validation passed.

### JeoPARODY Validation

- Unit tests: 58 passed in 6 suites.
- JavaScript lint: passed.
- CSS lint: passed.
- Vite build: passed.
- Dependency audit: five moderate fixable transitive advisories remain.
- Preview asset inspection: failed because required clue JSON route resolves to application HTML rather than bundled JSON.
- Browser runtime test on development server: failed to enter full-board mode.
- Browser runtime test on production preview: failed to enter full-board mode.
- Browser readiness probe: application did not reach initialized state within 30 seconds in either environment.

## Final Recommendation

JeoPARODY should remain the final-product destination, but the correct next move is stabilization, not feature accumulation. Jeopardish contains tested interaction and learning mechanisms that the rebuild still needs. Preserve both lines, correct JeoPARODY's boot/deployment/scoring/security blockers, migrate the useful learning loop, and build an unmistakably original celestial trivia identity around a small, fast, fair game.

That path turns the project from an ambitious collection of prototypes into a defensible, funny, teachable product with room to grow.
