# Deploy Preview Runbook

## Goal

Publish a clean static preview of the current Jeopardish MVP slice without shipping local archives, old videos, duplicate question files, screenshots, or generated planning outputs.

## Build

```bash
npm run build
```

This creates `dist/` with only runtime files:

- app shell: `index.html`, `style.css`, `app.js`, `landing.js`, `game-logic.js`
- runtime modules: `src/`
- active question bank: `questions/jeopardy-questions.json`
- active UI art: banknotes, vision images, scene layers, and current host-skin candidates
- `.nojekyll` for GitHub Pages static serving

## Verify Locally

```bash
python3 -m http.server 4190 -d dist
```

Open `http://127.0.0.1:4190/`, then check:

- landing page loads
- `#play` loads the game stage
- day/night toggle swaps scenes
- host arrows cycle skins and persist after reload
- clue loading fetches `questions/jeopardy-questions.json`
- no console/page errors
- no horizontal overflow on mobile width

## GitHub Pages Preview

Recommended settings for a preview branch:

- Build command: `npm run build`
- Publish directory: `dist`

If deploying manually from a branch, build first and publish `dist/` to the selected Pages source.

## Before Online Deploy

Run:

```bash
npm run check:js
npm test
npm run validate:questions
npm run build
```

Then run a browser smoke test against `dist/`.
