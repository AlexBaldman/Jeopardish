# Jeopardish Visual Asset Audit - 2026-05-24

## What Exists

As of 2026-07-13, the `assets/` tree contains 114 files: 103 renderable image/video assets and 11 manifests or source/support files. The active runtime treats host art as performance packs through `src/host/host-manager.js`. The default Dope Broadcast pack preloads and selects distinct frames for clue, reveal, correct, incorrect, empty-answer, and streak beats; alternate packs preserve the current performance state while changing visual treatment.

Open `docs/asset-gallery.html` through the local server to review all renderable artwork and host video experiments together.

## Categories

| Group | Contents | Recommended use |
| --- | --- | --- |
| Game chrome | title, background, favicon, Genesis-set illustration | Production UI or reference |
| Currency | `trivia-note-officialish.png`, `trivia-note-questionable.png` | Production clue-value notes |
| Beach broadcasts | Original seek-and-find pair, clean west-facing Long Beach West End pair, and the livelier `Long Beach '96` story pair | Production scene art |
| Current neutral host | vector PNG/SVG and zombie variant | Legacy placeholder / archive |
| Neon host concepts | `assets/trebek/trebek-dope-01.png`, `02`, `03`, `05`, and `trebek-good-01.png` | Active true-alpha carousel restored from JeoPARODY masters |
| Alternate host concepts | pixel arcade portrait, beach/meta/god/screenshot variants | Concept review candidates |
| Recorded host reactions | intro, finale, goodbye, good/bad GIF banks | Historical/reference archive; these depict the real host rather than a fictional twin |
| Video experiments | seven MP4 files in `trebek-other-images/` | Review for motion language only |
| Source/aliases | `.vectornator` file and duplicate copies | Preserve until the final art direction is selected |

The 11 non-renderable files are the six scene manifests, `.DS_Store`, `assets/images/trebek-vector 1.vectornator`, `assets/trebek-poetry.md`, and two `.download/Info.plist` remnants from prior generated-video downloads.

## Confirmed Duplicates

- `assets/trebek/trebek-1.webp` and `assets/trebek/trebek-2.webp` are byte-identical.
- `assets/trebek/trebek-6.webp` duplicates `assets/images/trebek-6.webp`.
- `assets/trebek-vector.svg` duplicates `assets/trebek-with-sunglasses.svg`.
- Root and `assets/images/` copies of `background.svg`, `title.png`, `title.svg`, and `favicon.svg` match.
- `assets/trebek-vector-zombie.png` duplicates `assets/images/trebek-vector-zombie.png`.
- The long-named pixel-host MP4 duplicates `upload_img_52018450_07_28_2024_17_35_05_632555_4825587188899972826.mp4`.

## Currency Direction

The question corpus includes normal values and gloriously fake ones: `$100`, `$200`, `$400`, `$600`, `$800`, `$1000`, `$367`, `$1111`, and `$8917`, among others. The renderer now applies:

- Green illustrated note for current United States bill denominations: `$1`, `$2`, `$5`, `$10`, `$20`, `$50`, `$100`.
- Purple illustrated `QUESTIONABLE TENDER` note for every non-current or invented denomination, including the standard game-board values above `$100`.

The amount is live HTML text over a reusable illustration, so every odd archival value renders accurately without requiring hundreds of separate image files.

## Fictional Host Direction

The premise works best as an openly fictional parody universe: a painfully polite Canadian quiz-host double emerges after the original program goes dark, claims the podium on a technicality, and slowly betrays himself through oddly specific clues, forged “reserve notes,” and an inability to say the word `sorry` convincingly. That gives the game mystery without presenting a real person's illness or death as a factual conspiracy.

### Name Candidates

| Name | Bit |
| --- | --- |
| **Malex Trebek** | So blunt it becomes funny; he insists the `M` is silent and was always there. |
| **Halifax Trebek** | Claims Halifax is a family name; has never once been east of Sudbury. |
| **Al Trebèque** | The allegedly French-Canadian brother whose accent becomes Wisconsin when pressured. |
| **Gordon Trebek** | Evil by the distinctly Canadian standard of never returning a borrowed snow shovel. |
| **Blaise Trebek** | Says he spent forty years in “the private trivia sector,” which no one can verify. |
| **M. Alex Trebek** | Lets the game hide the twist in plain sight: the initial changes meaning one clue at a time. |

Strongest working title: **Malex Trebek**, appearing publicly as **M. Alex Trebek** until the reveal.

### Slow-Burn Tells

- A bill occasionally bears the caption `QUESTIONABLE TENDER`, although Malex calls it “perfectly ordinary prize money.”
- His supposedly nostalgic anecdotes all concern Canadian institutions that do not exist.
- A category named `FAMILY RESEMBLANCE` begins yielding answers such as “a forged signature,” “a second birth certificate,” and “the wrong moustache.”
- Correct streaks trigger increasingly defensive lines about identity verification, estate paperwork, and why a man might own one sinister purple suit.

## Next Art Pass

The active Dope Broadcast pack now uses the recovered true-alpha PNG masters for idle, clue, reveal, correct, incorrect, empty-answer deadpan, and streak celebration. `trebek-good-01.png` adds one distinct, true-alpha after-hours candidate from the later JeoPARODY rebuild. The flattened WebP exports remain archived because their checkerboard backdrop is baked into the pixels. The restored masters prove transparent compositing, timing, framing, preloading, pack cycling, and mobile composition before commissioning the final character-consistent art. Existing real-host GIFs remain archived as source-era material rather than becoming the fictional character's on-screen reactions.
