'use strict';

const VIEWPORTS = Object.freeze([
  ['Phone 320x568', 320, 568],
  ['Phone 390x844', 390, 844],
  ['Tablet 768x1024', 768, 1024],
  ['Landscape 1024x768', 1024, 768],
  ['Desktop 1440x900', 1440, 900],
  ['Tall cabinet 807x1189', 807, 1189],
]);

const controls = document.getElementById('fixtureControls');
const stateSelect = document.getElementById('fixtureState');
const themeSelect = document.getElementById('fixtureTheme');
const viewportSelect = document.getElementById('fixtureViewport');
const frame = document.getElementById('fixtureFrame');

window.JeoparodyVisualFixtures.names.forEach((name) => stateSelect.add(new Option(name, name)));
VIEWPORTS.forEach(([label, width, height]) => viewportSelect.add(new Option(label, `${width}x${height}`)));
viewportSelect.value = '1440x900';

function applyFixture() {
  const [width, height] = viewportSelect.value.split('x').map(Number);
  frame.style.width = `${width}px`;
  frame.style.height = `${height}px`;
  window.JeoparodyVisualFixtures.apply(frame.contentDocument, {
    fixture: stateSelect.value,
    theme: themeSelect.value,
  });
  const available = Math.max(280, document.documentElement.clientWidth - 32);
  frame.style.transform = `scale(${Math.min(1, available / width)})`;
}

frame.addEventListener('load', () => {
  applyFixture();
  const startedAt = Date.now();
  const readyCheck = window.setInterval(() => {
    const ready = frame.contentDocument?.getElementById('questionButton')?.disabled === false;
    if (ready || Date.now() - startedAt > 15000) {
      window.clearInterval(readyCheck);
      applyFixture();
    }
  }, 100);
});
controls.addEventListener('change', applyFixture);
