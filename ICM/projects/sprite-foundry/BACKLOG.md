# Sprite Foundry — Backlog

## Highest-leverage next machines
1. Real transparent-background cutout worker with mask preservation.
2. Alpha/edge cleanup worker with halo detection.
3. Registration worker that normalizes baselines, pivots, sockets, and canonical canvas sizes.
4. Contact-sheet / sprite-sheet compositor for 48/64/96px targets.
5. Manifest validator and deterministic asset naming.
6. Viewport matrix capture for responsive visual regression.
7. Animation strip builder with per-frame timing/events.
8. Asset dependency graph and selective regeneration.

## Character batches
- Archie reference-photo ingestion and first canonical master sheet.
- Alex likeness pack after user visual reference is supplied.
- Christopher Walken guest-host sheet.
- Leslie Nielsen guest-host sheet.
- Gullian, Rickigeon, Randers Pelicandy, Jim LaHeron, J-Rook studio crew sheets.

## Engine integration
- `assets.get(query)` registry lookup instead of hard-coded paths.
- cache/prefetch service-worker layer visualized through The Mailroom.
- scenes declare asset dependencies through manifests.
- Cinematic Studio can request character pose/expression/camera assets through the same registry.
- games remain composable components consuming shared factories rather than copying implementations.

## Dev-debt rule
Every repeated manual correction should be evaluated for conversion into a validator, transform, reusable primitive, test, or machine. Bugs should leave behind stronger infrastructure whenever practical.
