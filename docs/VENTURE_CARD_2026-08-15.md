# Venture Card: The Shard Cleanup and Provenance Turn

Date: 2026-08-15

## What This Venture Was

Jeopardish moved from a raw archive-shaped app toward a disciplined static game runtime.

The useful line became clear: keep gameplay deterministic, keep source data buildable, and treat AI or generated content as a pipeline that must prove itself before it reaches the player.

## What We Preserved

- A dependency-light static app that can run locally without remote services.
- A deterministic answer and scoring core that can be tested directly.
- A large clue archive, now shaped for runtime loading through starter data, a manifest, and shards.
- Written context for future agents so the project does not have to rediscover its own constraints.

## What We Rejected

- Loading the full archive directly in the browser.
- Letting generated host behavior control scoring or progression.
- Treating AI-generated clues as trusted runtime objects without schema and provenance checks.
- Keeping duplicate dumps, vendored dependencies, and local machine noise as tracked project state.

## Technical Marker

The next serious architecture move is not an LLM feature. It is a stronger boundary:

- deterministic kernel for score, answer validation, and progression;
- content compiler for clue shape, provenance, and leakage checks;
- host layer for presentation only.

## Why It Matters

This is the point where Jeopardish stops being only a pile of good experiments and starts becoming a maintainable product surface.

The project can still be strange, visual, and funny. The runtime has to be boring where correctness matters.
