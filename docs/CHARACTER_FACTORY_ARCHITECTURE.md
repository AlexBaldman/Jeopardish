# Character Factory Architecture v0.1

## Purpose

Character Factory defines a canonical identity contract that can survive changes in renderer, art style, body topology, wardrobe, animation backend, and delivery surface. A character is data first; meshes, sprites, portraits, and compact companions are embodiments of that identity.

## Core rule

`CharacterGenome` must not depend on Three.js, PixiJS, Blender, MetaHuman, Codex Pets, or any other specific implementation. Those systems belong behind adapters.

## Genome

The v0.1 genome contains:

- stable identity and tags
- morphology (`humanoid`, `quadruped`, or `custom`)
- body proportions with optional source confidence
- face parameters with photo/video/depth provenance
- appearance profiles
- wardrobe slots and overlays
- rig family, attachment targets, and IK-chain metadata
- animation vocabulary and personality modifiers
- one or more embodiments
- provenance and rights metadata

## Confidence-aware capture

Photo- or scan-derived values are stored as `{ value, confidence, source }` instead of baking the estimate directly into a mesh. Better capture pipelines can later regenerate representations while preserving identity.

## Embodiments

Supported v0.1 embodiment families:

- `game-3d`
- `sprite-2d`
- `pixel`
- `portrait`
- `desktop-companion`

An embodiment selects a renderer-facing representation, optional rig override, animation set, interaction profile, scale, and adapter. The canonical genome remains unchanged.

## Wardrobe

Wardrobe is semantic and slot-based. The character owns a loadout of garment/item asset IDs; renderers and garment systems decide how those IDs become meshes, sprites, layers, or materials. Wardrobe swaps therefore preserve identity, rig metadata, and embodiments.

## Rig and attachment contract

The core stores semantic attachment targets (`left-hand`, `right-hand`, `mouth`, `back`, etc.) plus optional custom targets. Adapter layers map those targets to renderer/rig-specific bones. This allows an instrument or prop factory to describe how an item is held without owning a character-specific animation.

## Animation profile

Animation data is intentionally semantic:

- locomotion set
- performance sets
- facial profile
- stride
- posture
- energy
- looseness
- expressiveness

Animation engines can translate the same profile into skeletal clips, procedural motion, sprite states, or compact companion behaviors.

## Adapter boundary

`CharacterFactory.embody()` selects an adapter for an embodiment. The included descriptor adapter proves the contract without binding the engine to any renderer. Future adapters can target Three.js, PixiJS, Blender export, MetaHuman-style pipelines, or Codex/custom-pet packaging.

Pet compatibility is intentionally downstream. Lessons that generalize should move into the genome; platform-specific packaging must remain in the adapter.

## Stress-test fixtures

The test suite validates one schema against:

1. photo-derived realistic human with confidence metadata
2. marching-band trombonist with instrument/wardrobe requirements
3. Archie as a quadruped with canine rig and pixel/desktop embodiments
4. Schmalex LeTrec as a stylized host with pixel and 3D embodiments
5. a compact desktop-only companion

## Next implementation step

Build the first real renderer adapter around the existing host avatar system rather than creating a parallel character renderer. Map a `CharacterGenome` embodiment into the current `HostAvatarPack`/host performance pipeline, then use that integration to identify the smallest general-purpose wardrobe and animation interfaces needed for StadiumSlice performers.
