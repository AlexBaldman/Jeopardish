export const runtimeEntries = Object.freeze([
  // The build promotes the standalone cabinet to index.html.
  'game.html',

  // Shared runtime.
  'styles',
  'app.js',
  'game-logic.js',
  'src',

  // Question delivery.
  'questions/episodes',
  'assets/episodes',

  // Public identity artwork.
  'assets/brand/channel-o-mark.svg',

  // Game scene and host catalogs.
  'assets/ui',
  'assets/scenes',
  'assets/hosts/xander/v1',
]);

export const productionPageEntries = Object.freeze([
  'index.html',
  'game.html',
]);
