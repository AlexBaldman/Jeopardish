# Sprite Foundry

Status: ACTIVE

## Promise
Build a reusable asset-production machine shop for Jeopardish and the shared game engine. Raw source images enter once; the system cuts out, cleans, normalizes, separates, registers, poses, pixelizes, animates, validates, catalogs, and routes production-ready assets into a shared library.

## Lead domino
Get the first deterministic vertical slice working for four characters: Alex, Archie / Archimedes Beckerman, Christopher Walken, and Leslie Nielsen.

## Machine contract
Every machine accepts a typed asset manifest and emits files plus updated metadata. Machines should be composable, branchable, replayable, cacheable, and provenance-aware.

```text
SOURCE INTAKE
  -> CUTOUT
  -> ALPHA / EDGE CLEANUP
  -> SCALE + REGISTRATION
  -> BODY-PART SEPARATION
  -> POSE GENERATION
  -> PIXEL RASTERIZATION
  -> ANIMATION LOOM
  -> ACCESSORY / VARIANT COMBINER
  -> QC
  -> MANIFEST STAMPER
  -> MAILROOM / ASSET LIBRARY
```

## Self-building rule
Whenever a recurring production problem is solved, prefer turning the solution into a reusable machine, function, test, validator, editor, graph operation, or factory. The engine should progressively acquire better hands and a larger MacGyver/Batman toolbelt.

## Shared-engine role
A complete game is itself a composable component assembled from reusable scenes, maps, actors, graphs, factories, cinematics, assets, systems, and tools. Sprite Foundry is one production subsystem inside that larger recursive engine.

## Do not
- create one-off character exports when a reusable machine would solve the class of problem;
- destroy original sources;
- flatten provenance;
- bake costumes/accessories into every sprite if they can remain modular;
- silently diverge from the shared Jeopardish handcrafted pixel-art style guide.
