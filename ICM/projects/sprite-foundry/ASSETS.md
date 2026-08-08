# Sprite Foundry — Assets

## Canonical character targets

### Alex
- Type: human / creator avatar
- Source requirement: user-provided visual reference before likeness generation
- Initial outputs: portrait, turnaround, idle, talk, point, celebrate, host/cameo variants

### Archie / Archimedes Beckerman
- Type: small shaggy white dog; Maltese with Chihuahua and Pomeranian mix
- Canonical traits: floppy ears/hair, expressive dark eyes, black button nose, compact body, enormous curled plume tail, subtly suspicious expression
- Personality in motion: screw loose, sudden inappropriate confidence, odd ear behavior, invisible-phenomena reactions, manic victory poses
- Initial outputs: turnaround, idle, walk, run, jump, fall, land, sniff, suspicious stare, interact, celebrate

### Christopher Walken host archetype
- Type: guest-host character pack
- Initial outputs: turnaround, idle, clue-read, pause/ponder, gesture, reaction, celebrate

### Leslie Nielsen host archetype
- Type: guest-host character pack
- Initial outputs: turnaround, idle, deadpan read, confused beat, absurd reaction, gesture, celebrate

## Shared studio bird cast
Keep these modular and reusable across Jeopardish, jeoPARODY, Archimedes Adventures, and Cinematic Studio scenes:
- Gullian: seagull cameraman / autonomous camera operator
- Rickigeon: chaotic pigeon problem-solver
- Randers Pelicandy: pelican with absurd pouch inventory
- Jim LaHeron: authority/supervisor heron
- J-Rook: corvid performer / self-appointed hype-man

## Asset unit
Every production artifact should carry at minimum:

```json
{
  "assetId": "character.state.variant.v001",
  "project": "shared",
  "character": "archie",
  "type": "animation",
  "sources": [],
  "styleGuide": "jeopardish-pixel-shared",
  "frameSize": [64, 64],
  "anchors": {},
  "attachments": [],
  "palette": "default",
  "version": 1,
  "status": "candidate"
}
```

## Library slots

```text
assets/library/
  characters/<slug>/
    source/
    masters/
    cutouts/
    body-parts/
    expressions/
    poses/
    sprites/
    animations/
    costumes/
    accessories/
    palettes/
    manifests/
  shared/
    props/
    effects/
    cameras/
    palettes/
```

Preserve original sources and generated provenance. Derived assets should be reproducible whenever practical.
