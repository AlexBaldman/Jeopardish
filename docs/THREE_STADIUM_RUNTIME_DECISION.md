# Three.js Stadium Runtime Decision v0

## Decision

Use Three.js as the first StadiumSlice browser runtime behind an injected adapter. Do not import Three.js into CharacterGenome, PerformanceCommand, or StadiumPerformerPlan.

The v0 implementation accepts the Three namespace and `CCDIKSolver` constructor as dependencies so the engine remains replaceable and the current static application does not need a new production dependency merely to prove the architecture.

## Requirements discovered by the marching-trombone slice

The runtime must provide:

1. skeletal animation clip playback
2. simultaneous weighted/layered actions
3. an upper-body-only instrument clip
4. two-hand inverse kinematics for a shared prop
5. optional head/mouth contact
6. stable frame ordering: animation first, IK second
7. bounded frame deltas so tab suspension does not create giant simulation jumps

## Why Three.js first

Three.js has a compact animation foundation centered on `AnimationMixer`, `AnimationAction`, and `AnimationClip`. Multiple actions can be active and weighted at once. The official addon set also contains `CCDIKSolver` for inverse-kinematics chains on skinned meshes.

Three.js does not provide the same first-class animation-layer mask authoring model as PlayCanvas. For this slice that gap is small: `AnimationClip` consists of named keyframe tracks, so the adapter derives an upper-body clip by retaining only tracks targeting an explicitly supplied upper-body bone set.

This keeps masking logic local to the Three adapter instead of teaching the engine-neutral performance contract about skeleton paths.

## Alternatives considered

### PlayCanvas

PlayCanvas has excellent native animation layers, weights, and bone masks. It maps cleanly to the base-march + upper-body-performance model. For this exact slice, however, the official animation surface solves the layering problem more directly than the two-hand IK problem. It remains a strong alternate implementation behind the same StadiumPerformerPlan.

### Babylon.js

Babylon.js provides `BoneIKController` and a broad game-engine surface. It can satisfy the IK side of the slice directly, but adopting the broader engine before the proving slice requires it would increase coupling and migration cost. It remains a viable future adapter if its higher-level systems become advantageous elsewhere in uINVERSE.

## v0 adapter responsibilities

`ThreeStadiumRuntime`:

- resolves semantic layer actions to actual model clips through an injected `clipResolver`
- creates one `AnimationMixer`
- plays the full-body base locomotion clip
- derives and plays a masked upper-body performance clip
- delegates model-specific CCD chain construction to an injected `ikResolver`
- updates the animation mixer before the IK solver
- clamps large frame deltas
- disposes mixer state cleanly

## Deliberate omissions

The adapter does not yet:

- load GLTF assets
- define a canonical humanoid bone-name map
- construct CCD target bones automatically
- place or animate the trombone prop itself
- retarget clips between skeletons
- solve formation movement
- render a scene

Those should be added only as the real Stadium slice needs them.

## Official references

- Three.js AnimationMixer: https://threejs.org/docs/pages/AnimationMixer.html
- Three.js AnimationAction: https://threejs.org/docs/pages/AnimationAction.html
- Three.js animation system: https://threejs.org/manual/en/animation-system.html
- Three.js CCDIKSolver: https://threejs.org/docs/pages/CCDIKSolver.html
- PlayCanvas animation layer masking: https://developer.playcanvas.com/user-manual/animation/anim-layer-masking/
- Babylon.js BoneIKController: https://doc.babylonjs.com/typedoc/classes/_babylonjs_core.BoneIKController

## Next proving step

Create one tiny GLTF fixture with a humanoid skeleton, named `march` and `play-instrument` clips, explicit left/right hand IK chains, and a trombone prop. Then mount this runtime against the real Three.js classes in a visual fixture. That test should be the point where Three.js becomes an actual runtime dependency, if the slice still justifies it.
