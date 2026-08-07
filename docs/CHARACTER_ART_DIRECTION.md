# JeoPARODY Character Art Direction

**Status:** canonical visual direction

**Updated:** 2026-08-07

## The Decision

All JeoPARODY character artwork should inherit the visual DNA of the existing
`trebek-dope` host set, then be rebuilt with deliberate premium pixel craft.
The goal is not to paste a pixel filter over the current illustrations. The
goal is to preserve their peculiar faces, loud color, graphic-novel confidence,
and deadpan attitude while redrawing them on a coherent pixel grid.

The first direction board is:

![Premium pixel host direction](../assets/character-concepts/xander-premium-pixel-direction-v1.png)

This is a style target and identity study, not a production sprite sheet. It
still needs pixel cleanup, pose separation, transparent extraction, and a final
identity pass before runtime use.

## Canonical Reference Hierarchy

1. `assets/trebek/trebek-dope-01.png` owns the strongest overall silhouette,
   hair sweep, graphic polish, shirt energy, and confident asymmetry.
2. `assets/trebek/trebek-dope-03.png` owns the most useful facial caricature,
   suspicious brow, age, and dry expression.
3. `assets/trebek/trebek-dope-05.png` owns the clearest question-mark glasses,
   centered readability, and weathered deadpan mood.
4. `assets/trebek/trebek-dope-02.png` is a useful frontal-expression reference,
   but the forehead symbol is a situational gag rather than anatomy.

When references disagree, preserve recognizability and attitude before costume
detail. No single AI variation gets to redefine the character.

## Xander Identity Lock

The main host should retain these invariants in every pose and costume:

- late-middle-aged to older face with visible history, not a generic young hero;
- tall, angular head with a long nose, high forehead, and tired intelligent brow;
- thick silver hair swept upward and back, with dark indigo interior shadows;
- hot-pink wayfarer frames with simple question-mark or scene reflections;
- dry resting expression that can turn delighted without becoming a different
  person;
- loud tropical tailoring in coral, pink, turquoise, cream, and deep navy;
- a torso extending at least to the waist so the character can stand behind
  the cabinet footer;
- slightly disreputable details carried with complete dignity.

The cigar or joint, halo, forehead mark, microphone, drink, and other props are
performance vocabulary. They appear only when the scene calls for them. They
are not permanent identity features.

No artwork should contain `Jeopardy`, malformed pseudo-text, or another brand
inside the glasses. The lenses use question marks, controlled reflections, or
episode-specific iconography.

## House Character Language

Other hosts and supporting characters should look as though the same art team
made them, without becoming copies of Xander. They share:

- strong caricature based on an identifiable silhouette;
- graphic-novel shadow shapes and economical ink lines;
- expressive brows, mouths, hands, and posture;
- one memorable color relationship per character;
- clothing and props that reveal personality before dialogue begins;
- hand-placed pixel clusters, controlled dithering, and intentional highlights;
- enough visual restraint to remain readable at phone size.

They do not all share Xander's hair, glasses, shirt, age, body type, or props.
The house style is a rendering and character-design language, not a uniform.

## Pixel Standard

Create production art at its intended pixel density, then scale with nearest
neighbor only.

| Asset | Target master size | Runtime use |
| --- | ---: | --- |
| Host bust | 192 x 256 px | Standard clue and reaction pose |
| Host half body | 256 x 384 px | Cabinet stage and larger screens |
| Expression portrait | 128 x 128 px | Dialogue, menus, and compact phones |
| Full character sprite | 192 x 384 px | Future stage movement |
| Small reaction icon | 48 x 48 px | Score and notification beats |

Pixel rules:

- use one consistent pixel scale inside each asset;
- use dark indigo outlines rather than pure black where possible;
- prefer shaped clusters over scattered single-pixel noise;
- limit subpixel-style smoothing and never apply blur;
- use dithering only to describe form, material, or atmosphere;
- preserve clean negative space around hair, glasses, hands, and props;
- test every master at 1x, 2x, and the smallest actual runtime size.

## Palette Direction

The core character palette should remain compatible with the cabinet:

| Role | Color |
| --- | --- |
| Outline | `#0a0d24` |
| Deep shadow | `#17194a` |
| Electric cyan | `#35e6ef` |
| Hot pink | `#ed3d92` |
| Coral rim light | `#ff665f` |
| Broadcast gold | `#ffd84d` |
| Paper highlight | `#fff4d6` |

Skin and costume ramps can expand this palette, but each character should keep
one dominant hue, one counter-accent, and one warm highlight. More colors are
not automatically more premium.

## Expression and Animation Set

The first production host pack should prove these states with the same face:

1. idle deadpan;
2. clue presentation;
3. suspicious evaluation;
4. correct-answer delight;
5. incorrect-answer restraint;
6. patient teacher;
7. conspiratorial aside;
8. finale intensity.

Animation should be assembled from a small number of clean layers:

- torso and shoulders;
- head and hair;
- brows and eyelids;
- mouth shapes;
- lens reflections;
- foreground hand or prop;
- optional effect layer such as smoke, halo, sweat, or spark.

This supports blinking, breathing, glances, mouth movement, shoulder shifts,
prop entrances, and reaction hits without generating a new inconsistent body
for every frame.

## Anti-Slop Review

Reject or redraw artwork when:

- the face changes identity between expressions;
- glasses, ears, hands, shirt patterns, or hairline mutate without reason;
- pixel sizes are mixed or details dissolve into noisy confetti;
- anatomy is hidden behind effects instead of solved;
- the pose reads as generic confidence rather than this character's specific
  dry intelligence;
- a smooth illustration has merely been passed through a pixelation filter;
- text-like marks or accidental brand references appear;
- the character cannot be separated cleanly for animation;
- the result looks impressive at full size but unreadable in the actual game.

## Production Pipeline

1. Lock the identity from the canonical references.
2. Draw one neutral half-body master and one neutral bust on the target grid.
3. Approve the silhouette at actual runtime size.
4. Build the eight-expression sheet without changing facial proportions.
5. Separate animation layers and define anchor points.
6. Hand-clean edges, clusters, reflections, patterns, and anatomy.
7. Export transparent PNG masters plus lossless WebP runtime copies.
8. Test against every day/night scene, dialogue skin, and phone breakpoint.

AI generation can accelerate exploration and underdrawing. A final character
asset still requires a human-quality pixel cleanup pass and identity review.

