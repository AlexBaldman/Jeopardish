# Deploy Preview Runbook

## Goal

Publish a clean static preview of the current Jeopardish MVP slice without shipping local archives, old videos, duplicate question files, screenshots, or generated planning outputs.

## Build

```bash
npm run build
```

This creates `dist/` with only runtime files:

- app shell: `index.html`, `game.html`, `style.css`, `app.js`, `landing.js`, `game-logic.js`
- runtime modules: `src/`
- active question bank: `questions/runtime-bank.json`
- active UI art: banknotes, vision images, scene layers, and current host-skin candidates
- `.nojekyll` for GitHub Pages static serving

## Verify Locally

```bash
python3 -m http.server 4190 -d dist
```

Open `http://127.0.0.1:4190/`, then check:

- landing page loads
- standalone game page loads at `/game.html`
- `#play` loads the game stage
- day/night toggle swaps scenes
- host arrows cycle skins and persist after reload
- clue loading fetches `questions/jeopardy-questions.json`
- no console/page errors
- no horizontal overflow on mobile width

## GitHub Pages Production

`.github/workflows/ci.yml` is the only supported production release path:

1. verify source and build `dist/`;
2. audit local links and archive exclusions;
3. smoke-test that exact artifact in Chromium and WebKit;
4. upload `dist/` as an immutable Pages artifact;
5. deploy through GitHub Pages Actions;
6. smoke-test the resulting public URL in Chromium and WebKit.

GitHub Pages must use **GitHub Actions** as its source. Do not publish the repository root or the legacy `github-pages` branch.

## Before Online Deploy

Run:

```bash
npm run check:js
npm test
npm run validate:questions
npm run build
```

Then run a browser smoke test against `dist/`.

```bash
npm run smoke:dist
```

Set `SMOKE_BROWSERS=chromium,webkit` to match CI. The smoke suite enforces route-level first-party payload budgets and checks the landing page, standalone game, and Creative Room.
