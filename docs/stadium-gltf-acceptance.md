# Tiny authored trombonist acceptance

Scope: one checked-in GLTF performer replacing PR #62's runtime construction.
No changes to CharacterGenome, PerformanceCommand, StadiumPerformerPlan, or
ThreeStadiumRuntime. No crowd, formation, stadium architecture, or asset pipeline.

## Reviewed baseline

- PR #62 was open/draft at `37641fcbdc2c35ef5cf7e0691497a89e5a97671d`.
- Repository default `master` was `379ba9d1f9413d8b7283bd5f13cbd1bb11d19197`;
  this follow-up is stacked on #62, not on the frozen trivia donor branch.
- [Baseline CI run](https://github.com/AlexBaldman/Jeopardish/actions/runs/36092193511):
  Stadium smoke passed. The later production-artifact smoke failed. This is not
  evidence that the entire baseline CI run was green.

## Asset and boundary

`assets/stadium/marching-trombonist.gltf` is a self-contained 90,261-byte GLTF 2.0
file with embedded buffer, no textures, no external resources or extensions.
SHA-256: `eb5b34ccae4416c8c12fac9dd38a3654d510e385636bb4086a66c8d19136fa89`.

Authored offline from the repository's original fixture proportions, colors,
bone hierarchy and keyframes using Three.js GLTFExporter 0.185.1. It is not a
Blender-authored or third-party downloaded character. Low-poly head/hands and
instrument reduce size. The body now has 792 visible, rigid-weighted skinned
vertices instead of an invisible one-vertex skeleton carrier. Vertex colors
allow one body material. No build/export step is required to use or ship it.

Preserved: all 15 semantic bones, `march` and `play-instrument` clips, both
`IK_Target_L`/`IK_Target_R` targets, the existing three-iteration CCD chains,
plan, slide trajectory and performer travel. `TromboneSlide` names the movable
instrument node. The fixture translates GLTF track bindings to `.bones[Name]`
bindings before mounting; the shared runtime and its upper-body mask are unchanged.
Load failures surface an error and never fall back to a procedural character.

## Acceptance evidence (2026-09-27)

- PASS: existing adapter/runtime/real-Three focused suite, 12 tests.
- PASS: updated browser smoke with locked Three.js 0.185.1 and Playwright 1.61.1.
  Local Chromium 153.0.8010.0 + SwiftShader was used because the normal Playwright
  browser download returned invalid archives. Only launch path/arguments were
  substituted in a temporary local runner; assertions were unchanged.
- PASS: GLTF loaded, 15 bones, two clips, two running actions, seven masked
  upper-body tracks, two IK chains, 792 skinned vertices, 708 rendered triangles.
- PASS: frame-separated samples show marching thigh rotation and slide/target
  movement; finite hand-target errors remain within the baseline's 0.3-unit bound.
- PASS: intercepted GLTF 404 surfaces an error without reporting ready.
- PASS: generated 1280 x 800 screenshot inspected; performer, instrument and field
  render. This retains the deliberately crude fixture proportions.
- PASS: changed JavaScript syntax checks and whitespace checks.

The original right target can exceed the arm's 0.64-unit reach. The smoke records
hand-target distances and bounds gross regressions; it does **not** establish
precise hand-to-instrument or mouthpiece contact. This asset-swap pass preserves
that pre-existing limitation rather than changing choreography.

## Reproduce and retain

```sh
npm ci --ignore-scripts
npx --no-install playwright install --with-deps chromium
node --test tests/stadium-performer-adapter.test.mjs tests/three-stadium-runtime.test.mjs tests/three-stadium-runtime-real.test.mjs
npm run smoke:stadium
```

The smoke writes `screenshots/stadium-visual/marching-trombonist.png` and
`metrics.json` (initial and later samples), or failure screenshot/diagnostics.
CI now uploads `stadium-fixture-evidence` after the Stadium step on both success
and failure, independent of later unrelated checks. Record the follow-up commit
SHA, Actions run URL, Stadium step result and artifact when CI finishes.
PR #66 at `d4099e67870690933546907e179bdffdd3341d2d` has now completed
[GitHub run 36369691271](https://github.com/AlexBaldman/Jeopardish/actions/runs/36369691271).
The Stadium smoke and `stadium-fixture-evidence` upload both passed. The later
production-artifact smoke failed, as on the baseline; the full workflow is not green.

## Contract-path follow-up (2026-09-28)

Continues PR #66's existing asset swap. The GLTF is unchanged. The browser lab
now loads the canonical genome/command/plan APIs and builds the plan with
`buildStadiumPerformerPlan` instead of using a handwritten plan. The fixture maps
`plan.modelAssetId` to the existing asset and resolves the two IK effectors from
`plan.constraints`, retaining the same target bones and chain links. No upstream
contract or ThreeStadiumRuntime source changes are needed.

The smoke asserts normalized schema/version, character/model identity, command
speeds, semantic grips, the trombone prop and the actual IK bone bindings. It
compares the complete JSON contracts before mounting and after multiple rendered
frames, and checks frozen inputs plus runtime plan identity. `metrics.json`
records both contract snapshots alongside the existing animation/IK samples.
This establishes the genome -> commands -> plan -> loaded model -> renderer path.
It does not add a mouth constraint or claim precise hand/prop contact.

Validation for this follow-up:
- PASS: all 12 existing focused adapter/runtime/real-Three tests.
- PASS: expanded Playwright smoke, including missing-asset failure, with locked
  Three.js 0.185.1 / Playwright 1.61.1 and Chromium 153.0.8010.0 + SwiftShader.
  The standard browser download again returned invalid archives; a temporary
  runner substituted only the executable path and launch arguments.
- PASS: screenshot inspected and changed JavaScript syntax checked.
- GitHub CI for the contract-path follow-up is pending at the time of this entry.
  Prior asset-swap CI results above must not be attributed to the new change.

