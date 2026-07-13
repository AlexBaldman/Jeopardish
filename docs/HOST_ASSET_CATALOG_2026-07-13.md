# JeoPARODY Host Asset Catalog - 2026-07-13

## Executive Decision

The game now has one curated six-look runtime carousel, one larger concept archive, and one clearly separated real-host reaction archive. Runtime selection is defined only in `src/host/host-manager.js`; files being present in `assets/` no longer implies production approval.

## Runtime Carousel

| Look | File | Alpha | Role |
| --- | --- | --- | --- |
| Dope Broadcast | `trebek-dope-01.png`, `02`, `03`, `05` | True | Primary multi-state reaction pack |
| Question Mark Xander | `trebek-dope-02.png` | True | Single-pose review skin |
| Mustache Xander | `trebek-dope-03.png` | True | Single-pose review skin |
| Halo Xander | `trebek-dope-01.png` | True | Single-pose review skin |
| After-Hours Xander | `trebek-good-01.png` | True | Distinct comic candidate recovered from JeoPARODY |
| Legacy Cutout | `assets/images/trebek-vector.png` | True | Neutral compositing control |

All six assets are included in the static production build. The host manager reports the active index, preloads every visual used by the selected pack, and preserves expression state while cycling.

## JeoPARODY Rebuild Reconciliation

The later `/Users/alex/coding/jeoparody/assets/images/trebek/` directory contains ten PNGs. Four `trebek-dope-*` masters were already recovered here. `trebek-good-03.png` and `trebek-good-05.png` are byte-identical aliases of `trebek-dope-01.png` and `trebek-dope-02.png`. Of the four remaining unique files:

| Source | Decision |
| --- | --- |
| `trebek-good-01.png` | Imported as the distinct true-alpha After-Hours candidate |
| `trebek-good-02.png` | Reject for runtime; checkerboard is visibly baked into the image |
| `trebek-coy-angel.png` | Concept only; alpha exists, but the portrait includes a composed atmospheric backdrop |
| `trebek-smarmy-mafioso.png` | Concept only; useful personality reference, not a clean production cutout |

The rebuild's `JeoPARODY-Trebek-Character-Sheet-01.png` is a 1491x1055 opaque concept sheet. Preserve it in the rebuild as art-direction reference; do not treat it as a sprite sheet.

## Archive Boundaries

- `assets/trebek/trebek-1.webp` through `trebek-6.webp`: flattened generated concepts with no alpha. `trebek-1.webp` and `trebek-2.webp` are identical.
- `assets/trebek-other-images/`: mixed generated portraits and seven motion experiments. Review only.
- `assets/trebek/trebek-gifs/`: 36 show-era GIF/JPEG references depicting the real host. Keep out of the fictional runtime character system.
- Vector, zombie, yearbook, and memoriam variants: provenance/reference, not MVP skins.

## Animation Production Path

1. Lock one face, silhouette, palette, and costume from the true-alpha carousel.
2. Commission a character turnaround with front, three-quarter, profile, and desk crop anchors.
3. Produce seven expression keyframes matching `idle`, `clue`, `reveal`, `correct`, `incorrect`, `empty`, and `streak`.
4. Add two-frame eye, mouth, shoulder, and hand overlays so CSS or canvas can create life without regenerating the entire character.
5. Export each frame against true transparency with identical canvas size, eye line, desk line, and anchor metadata.
6. Keep personality, performance state, visual skin, and animation timing as separate contracts.

The next art milestone is not more unrelated portraits. It is one character-consistent reaction sheet that can survive every game state and every viewport.
