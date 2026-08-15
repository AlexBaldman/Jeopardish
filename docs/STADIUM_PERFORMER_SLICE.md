# Stadium Performer Slice v0

## Purpose

Turn Character Genome + semantic Performance Commands into the smallest useful 3D performer execution plan for a marching musician.

This slice deliberately stops before choosing a skeletal-animation or IK library. It tells that future implementation exactly what it must do.

## Input

A Stadium performer requires:

- a humanoid `CharacterGenome`
- a `game-3d` embodiment
- looping locomotion, initially `march`
- an upper-body or additive `play-instrument` action
- semantic left- and right-hand instrument attachments
- rig anchors for every requested attachment

Mouth contact is optional at the contract level, but supported when the character and instrument require it.

## Output

`buildStadiumPerformerPlan()` produces an immutable execution plan containing:

- character and embodiment identity
- renderer hint and model asset ID
- rig profile
- base locomotion layer
- upper-body performance layer
- canonical instrument props
- concrete bone/contact constraints resolved from semantic attachments
- a capability list the eventual runtime must implement

A trombone performance currently advertises capabilities including:

- skeletal animation
- layered animation
- root locomotion
- semantic attachments
- two-hand prop IK
- face/head contact when a mouthpiece is attached

## Why this boundary matters

Gameplay owns the verbs. Character Genome owns identity and semantic rig anchors. Performance Commands own behavioral intent. Stadium Performer translates those facts into an implementation plan. The future renderer owns clips, mixers, bones, IK solvers, matrices, scene objects, and frame updates.

No upstream layer needs to know which 3D engine wins that job.

## First performer

The reference performer is a marching trombonist:

```js
const plan = buildStadiumPerformerPlan({
  genome: trombonist,
  locomotion: {
    kind: 'locomotion',
    action: 'march',
    loop: true,
  },
  performance: {
    kind: 'action',
    action: 'play-instrument',
    blend: 'upper-body',
    loop: true,
    attachments: [
      { target: 'left-hand', itemId: 'instrument.trombone', grip: 'brace' },
      { target: 'right-hand', itemId: 'instrument.trombone', grip: 'slide' },
      { target: 'mouth', itemId: 'instrument.trombone', mode: 'contact', grip: 'mouthpiece' },
    ],
  },
});
```

The plan contains enough information to keep the feet marching while the upper body plays and the instrument remains constrained to both hands and the mouthpiece contact point.

## Next technical decision

The next branch should implement a thin engine adapter against one actual 3D runtime. Selection criteria should be driven by this plan rather than library fashion:

1. skeletal clip playback and cross-fade
2. independent upper-body masking/layering
3. practical two-hand prop IK
4. stable bone lookup/retarget mapping
5. acceptable browser bundle/runtime cost
6. ability to keep the underlying contracts engine-neutral

Before adding a dependency, compare the existing mature options and choose the smallest implementation that can satisfy this exact marching-trombone slice.
