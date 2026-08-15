# Character Performance Vocabulary v0.1

## Goal

Define character performance as semantic intent that can be interpreted by different rigs, renderers, animation systems, and embodiments.

A gameplay system should be able to request `march`, `play-instrument`, `celebrate`, or `suspicious-stare` without knowing whether the result is skeletal animation, procedural IK, sprite states, CSS motion, or a compact desktop-companion behavior.

## Contract

A `PerformanceCommand` contains:

- `kind`: locomotion, action, reaction, pose, or transition
- `action`: semantic verb/state such as `march`, `play-instrument`, `present-clue`, or `suspicious-stare`
- optional target
- loop and duration intent
- blend mode: replace, additive, upper-body, or facial
- normalized intensity/speed modifiers
- optional overrides for stride, posture, energy, looseness, and expressiveness
- semantic attachments to canonical character targets
- optional cues and bounded authoring metadata

The contract intentionally contains no renderer, clip name, bone index, keyframe data, shader, or engine-specific object.

## Character defaults

`resolvePerformance()` combines a command with the Character Genome. Missing motion modifiers inherit the character's animation profile. This allows the same `march` command to feel different for a rigid ceremonial performer, a loose parade marcher, or a chaotic cartoon character while keeping the gameplay verb stable.

## Attachments

Performance attachments use semantic targets such as `left-hand`, `right-hand`, `mouth`, `back`, and `tail-base`.

When resolved against a Character Genome, each semantic attachment is paired with the character's rig anchor if one exists. A later animation/IK adapter decides how to satisfy that contact or grip.

Example marching trombone performance:

```js
resolvePerformance(trombonist, {
  kind: 'action',
  action: 'play-instrument',
  blend: 'upper-body',
  attachments: [
    { target: 'left-hand', itemId: 'instrument.trombone', grip: 'brace' },
    { target: 'right-hand', itemId: 'instrument.trombone', grip: 'slide' },
  ],
});
```

This is enough information for a future instrument adapter to solve grip placement and for a motion adapter to layer the performance over marching locomotion.

## Parallel performance

The `upper-body` and `facial` blend modes are the first deliberately small seam for simultaneous behaviors. A marching musician can run looping `march` locomotion while an upper-body `play-instrument` action controls hands, arms, chest, and mouth.

The core does not perform blending itself. It communicates intent to an implementation that can.

## Why sequences exist

`createPerformanceSequence()` preserves authored order for cinematics, scripted beats, tutorials, sports drills, host performances, and compact NPC behavior. Timing engines remain downstream.

## StadiumSlice target

The next practical implementation should use this vocabulary to model one marching performer:

1. resolve a looping `march` locomotion command
2. resolve an upper-body `play-instrument` command
3. attach a trombone to left/right semantic hand targets
4. add a mouth contact target where the rig supports it
5. feed those resolved commands into a thin 3D animation/IK adapter

That slice will reveal what the 3D adapter actually needs instead of guessing in advance.
