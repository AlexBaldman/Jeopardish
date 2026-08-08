# Sprite Foundry — World

The Foundry is both architecture and a legible in-world metaphor for the engine's production infrastructure.

## Places / machines
- Intake Hopper: registers source material and provenance.
- Cutout Engine: produces transparent subject/component cutouts and masks.
- Edge Forge: repairs halos, alpha damage, and contours.
- Registration Jig: normalizes scale, baseline, pivots, sockets, facing, and canvas.
- Body-Part Separator: emits modular head/body/limb/tail/prop layers.
- Pose Mill: creates named canonical poses.
- Pixel Rasterizer: enforces the handcrafted Jeopardish pixel-art grammar.
- Animation Loom: builds frame sequences, timing, events, and transitions.
- Accessory Press: creates wearable/held/effect modules.
- Variant Combiner: assembles compatible modular combinations.
- QC Inspector: validates alpha, dimensions, anchors, palettes, clipping, and continuity.
- Manifest Stamper: records identity, lineage, state, and compatibility.
- The Mailroom: routes/cache-serves assets to requesting components; its service-worker visualization may use a frantic old-school mailroom-worker archetype slinging requests into cubbies.
- Responsive Torture Rack: captures scenes across viewport/device matrices and routes failures into reusable fixes/tests.

## Actors
- Characters and hosts are asset families rather than monolithic images.
- Gullian can serve as the diegetic Cinematic Studio camera operator, physically embodying follow/lead/chase/orbit/reveal camera behavior.
- QA/playtest agents deliberately stress device sizes, inputs, timing, network states, cinematics, and layout boundaries, preserving both bugs and accidental discoveries.

## Semantic events
`source.registered`, `cutout.created`, `anchor.assigned`, `part.extracted`, `pose.created`, `sprite.rasterized`, `animation.built`, `qc.failed`, `qc.passed`, `asset.cataloged`, `asset.requested`, `asset.served`.

These events should eventually form a graph so every derived asset can answer: what made me, what do I depend on, where am I used, and what should regenerate if my source changes?
