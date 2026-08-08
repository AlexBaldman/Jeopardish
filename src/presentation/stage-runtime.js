(function initStageRuntime(root) {
  'use strict';

  const module = root.JeoPARODYStageEngine;
  const documentRef = root.document;
  if (!module || !documentRef) return;

  const {
    CameraShots,
    LightingModes,
    StageEngine,
  } = module;

  function ensureRuntimeStyles() {
    if (documentRef.querySelector('link[data-stage-runtime-style]')) return;
    const link = documentRef.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'styles/game/stage-runtime.css?v=stage-runtime-2';
    link.dataset.stageRuntimeStyle = 'true';
    documentRef.head?.append(link);
  }

  function createButton({ id, className, label, text }) {
    const button = documentRef.createElement('button');
    button.id = id;
    button.className = className;
    button.type = 'button';
    button.setAttribute('aria-label', label);
    button.setAttribute('aria-pressed', 'false');
    button.innerHTML = text;
    return button;
  }

  function decorateControl(element, type, skin) {
    if (!element) return null;
    element.dataset.controlType = type;
    element.dataset.skin = skin;
    return element;
  }

  function boot() {
    const gameContainer = documentRef.getElementById('gameContainer');
    if (!gameContainer || gameContainer.dataset.stageRuntime === 'ready') return;

    ensureRuntimeStyles();
    gameContainer.dataset.stageRuntime = 'ready';
    const stage = new StageEngine({
      windowRef: root,
      documentRef,
      rootElement: gameContainer,
    }).bind();

    const propSpecs = [
      ['clue', 'speechBubble', 'dialogue', { topLeft: 'top-left', topCenter: 'top-center', tail: 'tail' }],
      ['host', 'hostStage', 'actor', { face: 'face', leftHand: 'left-hand', rightHand: 'right-hand' }],
      ['score', 'scoreDrawer', 'scoreboard', { center: 'center' }],
      ['response', 'inputbox', 'control', { center: 'center' }],
      ['controls', null, 'controls', { center: 'center' }],
    ];

    propSpecs.forEach(([id, domId, kind, anchors]) => {
      const element = domId
        ? documentRef.getElementById(domId)
        : gameContainer.querySelector('.control-footer');
      if (element) stage.props.register(id, { element, kind, anchors });
    });

    gameContainer.querySelectorAll('[data-theme-toggle]').forEach((element) => {
      decorateControl(element, 'theme', 'bulb');
    });
    decorateControl(documentRef.getElementById('soundToggle'), 'sound', 'speaker');
    decorateControl(documentRef.getElementById('voiceButton'), 'voice', 'microphone');
    decorateControl(documentRef.getElementById('menuTheme'), 'theme', 'bulb');
    decorateControl(documentRef.getElementById('menuSound'), 'sound', 'speaker');
    decorateControl(documentRef.getElementById('menuVoice'), 'voice', 'microphone');

    const headerControls = gameContainer.querySelector('.header-controls');
    let immersiveButton = documentRef.getElementById('immersiveToggle');
    if (!immersiveButton && headerControls) {
      immersiveButton = createButton({
        id: 'immersiveToggle',
        className: 'stage-immersive-toggle',
        label: 'Enter immersive game view',
        text: '<span class="stage-control-icon" aria-hidden="true">⛶</span><span class="toggle-label">Immersive</span>',
      });
      headerControls.append(immersiveButton);
    }
    decorateControl(immersiveButton, 'immersive', 'viewport');

    const settingsSection = documentRef.getElementById('menuSettingsTitle')?.closest('.menu-section');
    let menuImmersive = documentRef.getElementById('menuImmersive');
    if (!menuImmersive && settingsSection) {
      menuImmersive = createButton({
        id: 'menuImmersive',
        className: 'stage-menu-immersive',
        label: 'Enter immersive game view',
        text: '<span>Immersive view</span><b aria-hidden="true">⛶</b>',
      });
      settingsSection.append(menuImmersive);
    }
    decorateControl(menuImmersive, 'immersive', 'viewport');

    function syncButtons(state) {
      const active = Boolean(state.immersive);
      [immersiveButton, menuImmersive].filter(Boolean).forEach((button) => {
        button.setAttribute('aria-pressed', String(active));
        button.setAttribute('aria-label', active ? 'Exit immersive game view' : 'Enter immersive game view');
        button.dataset.active = active ? 'true' : 'false';
        button.dataset.controlState = active ? 'on' : 'off';
      });
      const label = immersiveButton?.querySelector('.toggle-label');
      if (label) label.textContent = active ? 'Exit' : 'Immersive';
    }

    async function toggleImmersive() {
      await stage.toggleFullscreen({ preferNative: true });
      syncButtons(stage.getState());
    }

    immersiveButton?.addEventListener('click', toggleImmersive);
    menuImmersive?.addEventListener('click', toggleImmersive);
    stage.subscribe(syncButtons);

    function syncLighting() {
      const theme = documentRef.body?.dataset?.theme;
      const mode = theme === 'light' ? LightingModes.DAY : LightingModes.NIGHT;
      stage.setLighting(mode);
      gameContainer.querySelectorAll('[data-control-type="theme"]').forEach((element) => {
        const isDay = mode === LightingModes.DAY;
        element.dataset.controlState = isDay ? 'day' : 'night';
        if (element.matches('button')) element.setAttribute('aria-pressed', String(isDay));
      });
    }

    syncLighting();
    const bodyObserver = new root.MutationObserver(syncLighting);
    bodyObserver.observe(documentRef.body, { attributes: true, attributeFilter: ['data-theme'] });

    function cueFromGameMoment() {
      const moment = gameContainer.dataset.gameMoment || 'clue';
      const phase = gameContainer.dataset.roundPhase || 'idle';

      if (moment === 'incorrect') {
        stage.cue('wrongAnswer', {
          scene: 'result',
          camera: { shot: CameraShots.CLOSE_UP, target: 'host', intensity: 1.1 },
        });
        return;
      }
      if (moment === 'correct') {
        stage.cue('correctAnswer', {
          scene: 'result',
          camera: { shot: CameraShots.MEDIUM, target: 'host', intensity: 1 },
        });
        return;
      }
      if (moment === 'reveal') {
        stage.cue('revealAnswer', {
          scene: 'result',
          camera: { shot: CameraShots.MEDIUM, target: 'host', intensity: 1 },
        });
        return;
      }
      if (phase === 'answering' || moment === 'clue' || moment === 'loading') {
        stage.cue('clueLoaded', {
          scene: 'clue',
          camera: { shot: CameraShots.WIDE, target: 'stage', intensity: 1 },
        });
      }
    }

    const gameObserver = new root.MutationObserver(cueFromGameMoment);
    gameObserver.observe(gameContainer, {
      attributes: true,
      attributeFilter: ['data-game-moment', 'data-round-phase'],
    });
    cueFromGameMoment();

    const hostImage = documentRef.getElementById('hostImage');
    if (hostImage) {
      const hostObserver = new root.MutationObserver(() => {
        const expression = hostImage.dataset.expression || '';
        if (expression === 'incorrect') {
          stage.setCamera(CameraShots.CLOSE_UP, { target: 'host', intensity: 1.1 });
        } else if (expression === 'correct' || expression === 'reveal') {
          stage.setCamera(CameraShots.MEDIUM, { target: 'host', intensity: 1 });
        }
      });
      hostObserver.observe(hostImage, { attributes: true, attributeFilter: ['data-expression'] });
    }

    root.JeoPARODYStage = stage;
  }

  if (documentRef.readyState === 'loading') {
    documentRef.addEventListener('DOMContentLoaded', boot, { once: true });
  } else {
    boot();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this));
