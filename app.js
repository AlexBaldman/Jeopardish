'use strict';

function isLocalContentHost(locationRef = globalThis.location) {
  const hostname = String(locationRef?.hostname || '').toLowerCase();
  return locationRef?.protocol === 'file:'
    || hostname === 'localhost'
    || hostname === '127.0.0.1'
    || hostname === '[::1]';
}

const URL_PARAMETERS = new URLSearchParams(globalThis.location?.search || '');
const IS_PRIVATE_PREVIEW = isLocalContentHost()
  && globalThis.document?.body?.dataset?.releaseChannel !== 'production';
const ARCHIVE_PRACTICE = IS_PRIVATE_PREVIEW && URL_PARAMETERS.get('mode') === 'archive';
const QUESTION_SOURCE = ARCHIVE_PRACTICE
  ? './questions/runtime-bank.json'
  : './questions/episodes/season-zero-001.json';
const FALLBACK_QUESTION_SOURCE = null;
const FETCH_TIMEOUT_MS = 30000;
const MAX_MEDIA_PREFLIGHT_ATTEMPTS = 8;

const state = {
  bestStreak: 0,
};

const BEST_STREAK_KEY = 'jeopardish.bestStreak';

const logic = globalThis.JeopardishLogic || null;
if (!logic) {
  throw new Error('JeopardishLogic failed to load. Ensure game-logic.js is included before app.js.');
}

const contracts = globalThis.JeopardishContracts || null;
const rendererModule = globalThis.JeopardishRenderer || null;
const voiceModule = globalThis.JeoPARODYVoice || null;
const roundKernelModule = globalThis.JeoPARODYRoundKernel || null;
const inputControllerModule = globalThis.JeoPARODYInputController || null;
const applicationCompositionModule = globalThis.JeoPARODYApplicationComposition || null;
const hostPackModule = globalThis.JeoPARODYHostPack || null;
const uiCatalogModule = globalThis.JeoPARODYUiCatalog || null;
const emergencyEpisodeModule = globalThis.JeoPARODYEmergencyEpisode || null;

if (!contracts || !rendererModule || !voiceModule || !roundKernelModule || !inputControllerModule || !applicationCompositionModule || !hostPackModule || !uiCatalogModule) {
  throw new Error('Jeopardish engine modules failed to load. Ensure src modules are included before app.js.');
}

const { DialogueStyles: DIALOGUE_STYLES, UiCopy: UI_COPY } = uiCatalogModule;

let applicationComposition;
let eventBus;
let gameEngine;
let sceneService;
let renderer;
let hostManager;
let hostPerformanceDirector;
let broadcastPresenter;
let cabinetPresenter;
let audioController;
let voiceController;
let roundKernel;
let preferenceStore;
let clueLocalization;
let episodeController;
let studyController;
let inputController;

function loadPersistedBestStreak() {
  try {
    const value = globalThis.localStorage?.getItem(BEST_STREAK_KEY);
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed >= 0) {
      state.bestStreak = parsed;
    }
  } catch (error) {
    console.warn('Unable to read persisted best streak.', error);
  }
}

function persistBestStreak() {
  try {
    globalThis.localStorage?.setItem(BEST_STREAK_KEY, String(state.bestStreak));
  } catch (error) {
    console.warn('Unable to persist best streak.', error);
  }
}

function getCopy() {
  return cabinetPresenter?.getCopy()
    || UI_COPY[preferenceStore?.get('language')]
    || UI_COPY.en;
}

function getCurrentEpisodeContext() {
  return episodeController?.getCurrentContext() || {
    sourceClue: null,
    displayClue: null,
  };
}

function applyPreferences() {
  cabinetPresenter.applyPreferences();
  renderScoreboard();
}

function cycleDialogueStyle(step) {
  return cabinetPresenter.cycleDialogueStyle(step);
}

function cycleScenePack() {
  return cabinetPresenter.cycleScenePack();
}

function toggleSound() {
  return cabinetPresenter.toggleSound();
}

function emitVoiceEvent(type, payload = {}) {
  eventBus?.emit(type, payload, { source: 'VoiceController' });
}

function speakHost(message, speech = {}) {
  return broadcastPresenter?.speak(message, speech) || false;
}

function narrateCurrentClue() {
  const context = getCurrentEpisodeContext();
  const clue = context.displayClue;
  if (!clue) return false;
  return broadcastPresenter.narrateClue({
    sourceClue: context.sourceClue,
    displayClue: clue,
    value: gameEngine?.getState()?.currentClueValue || 0,
    sequence: episodeController.getProgress().current,
    questionText: getSourceClueContent(clue).questionText,
  });
}

function setVoiceEnabled(enabled, { announce = false } = {}) {
  const active = voiceController.setEnabled(enabled);
  preferenceStore.set('voiceEnabled', active);
  emitVoiceEvent(
    active ? contracts.GameEvents.VOICE_ENABLED : contracts.GameEvents.VOICE_DISABLED,
    { capabilities: voiceController.getCapabilities() },
  );
  if (active && announce) speakHost(getCopy().voiceWelcome);
  return active;
}

function toggleVoice({ listen = false } = {}) {
  if (!voiceController.enabled) {
    if (!setVoiceEnabled(true, { announce: !listen })) return false;
  } else if (!listen) {
    setVoiceEnabled(false);
    return false;
  }

  if (listen) {
    const context = gameEngine?.getActiveClue()
      && !studyController.isOpen()
      && !roundKernel.isAdvanceReady()
      ? 'answer'
      : 'command';
    return voiceController.listen({ context });
  }
  return true;
}

async function submitSpokenAnswer({ answer } = {}) {
  if (!gameEngine?.getActiveClue() || studyController.isOpen() || roundKernel.isBusy()) {
    speakHost(getCopy().noClue);
    return false;
  }
  renderer.setUserAnswer(answer);
  await checkAnswer();
  return true;
}

function toggleTheme() {
  return cabinetPresenter.toggleTheme();
}

async function toggleLanguage() {
  cabinetPresenter.toggleLanguage();
  renderScoreboard();
  renderHost(getCurrentHostExpression());
  if (getCurrentEpisodeContext().sourceClue && gameEngine.getActiveClue()) {
    await clueLocalization.refreshCurrent();
  } else {
    renderer.setStatus(getCopy().newClue);
  }
}

function renderScoreboard() {
  const gameState = gameEngine?.getState() || {
    currentStreak: 0,
    bestStreak: state.bestStreak,
    score: 0,
  };

  renderer.renderScoreboard(gameState);
  if (episodeController) renderer.renderSessionProgress(episodeController.getProgress());
}

function renderHost(expression = 'idle', directedPerformance = null) {
  return broadcastPresenter.renderHost(expression, directedPerformance);
}

function persistHostSkin() {
  const skin = hostManager.getActiveSkin();
  if (skin?.id) {
    preferenceStore.set('hostSkinId', skin.id);
  }
}

function getCurrentHostExpression() {
  return renderer?.dom?.hostImage?.dataset?.expression || 'idle';
}

function cycleHostSkin(step) {
  hostManager.cycleSkin(step);
  persistHostSkin();
  renderHost(getCurrentHostExpression());
  renderer.applyHostMotion({ primitive: 'recover' });
}

function renderHostPackPicker(pack = hostPerformanceDirector?.getActivePack()) {
  return cabinetPresenter.renderHostPackPicker(pack);
}

function performHostBeat(beat, options = {}) {
  return broadcastPresenter.performHostBeat(beat, options);
}

function cycleHostPack() {
  const pack = hostPerformanceDirector.cyclePack(1);
  preferenceStore.set('hostPackId', pack.id);
  broadcastPresenter.clearCluePerformance();
  renderHostPackPicker(pack);
  const performance = performHostBeat(hostPackModule.HostBeats.WELCOME, {
    facts: { sequence: 'personality-change' },
  });
  renderer.setStatus(`${pack.displayName}: ${performance.dialogue.line}`);
  speakHost(performance.dialogue.line, performance.speech);
  return pack;
}

function presentClue({ sourceClue, displayClue = sourceClue, gameState } = {}) {
  if (!sourceClue) {
    renderer.displayErrorJoke(jeopardyErrors);
    return;
  }

  broadcastPresenter.presentClue({
    sourceClue,
    displayClue,
    gameState,
    sequence: episodeController.getProgress().current,
  });
}

function getSourceClueContent(clue) {
  const parsed = rendererModule.extractClueMedia(clue, globalThis.document);
  return { questionText: parsed.text, media: parsed.media };
}

function presentEpisodeProgress(progress) {
  renderer.renderSessionProgress(progress);
}

function presentEpisodeComplete(progress) {
  return broadcastPresenter.presentEpisodeComplete(progress);
}

function refreshLearningQueue() {
  const progress = episodeController.getProgress();
  if (progress.complete) renderer.setReviewQueueState(progress.learning);
  return progress;
}

async function openSavedReview() {
  const context = episodeController.getNextReviewContext();
  if (!context) {
    renderer.setReviewQueueState(episodeController.getProgress().learning);
    return false;
  }
  const displayClue = await clueLocalization.prepare(context.sourceClue, {
    showLoading: false,
  });
  return studyController.enter({
    ...context,
    displayClue: displayClue || context.sourceClue,
    locale: preferenceStore.get('language'),
  });
}

function createShowLookSeed(episodeId = 'broadcast') {
  const nonce = globalThis.crypto?.randomUUID?.()
    || `${Date.now()}-${Math.floor(Math.random() * 1_000_000)}`;
  return `${episodeId}:${nonce}`;
}

function presentEpisodeLoaded({
  pack,
  resumed = false,
  sourceCount,
  fallback = false,
  emergency = false,
} = {}) {
  const previousLookId = preferenceStore.get('hostSkinId');
  const showLook = resumed
    ? hostManager.setActiveSkin(previousLookId)
    : hostManager.selectShowLook(createShowLookSeed(pack?.id), { previousLookId });
  if (showLook?.id) {
    preferenceStore.set('hostSkinId', showLook.id);
    renderHost(getCurrentHostExpression());
    renderer.applyHostMotion({ primitive: 'enter' });
    console.info(`%c[Xander Wardrobe] ${showLook.label} has entered the broadcast. Nobody approved the shorts.`, 'color:#ff4fb8;font-weight:bold');
  }
  const gameState = gameEngine.getState();
  state.bestStreak = Math.max(state.bestStreak, gameState.bestStreak || 0);
  renderer.setStatus(
    ARCHIVE_PRACTICE
      ? `Archive Practice loaded ${sourceCount || 0} historical clues. Original television wording is active in this local research mode.`
      : emergency
      ? `${getCopy().loadedClues(sourceCount || 0)} Question files are offline; reviewed emergency broadcast active.`
      : fallback
        ? `${getCopy().loadedClues(sourceCount || 0)} Authored broadcast unavailable; archive transmission active.`
        : getCopy().loadedClues(sourceCount || 0),
  );
  renderScoreboard();
}

function presentEpisodeError(error) {
  console.error('Error loading episode:', error);
  renderer.displayErrorMessage('Question transmission is unavailable. Reconnect the preview and request another clue.');
}

function getNewQuestion() {
  return episodeController.nextClue();
}

function handleMediaFailure({ item, reason }) {
  return episodeController.replaceFailedMedia({ item, reason });
}

async function checkAnswer() {
  if (studyController.isOpen()) return;
  if (roundKernel.isAdvanceReady()) {
    getNewQuestion();
    return;
  }

  if (roundKernel.isBusy()) {
    return;
  }

  if (!gameEngine.getActiveClue()) {
    renderer.displayErrorMessage(getCopy().noClue);
    return;
  }

  const { displayClue } = getCurrentEpisodeContext();
  const userAnswer = renderer.getUserAnswer();
  const userAnswerCleaned = logic.cleanAnswer(userAnswer);

  if (!userAnswerCleaned) {
    broadcastPresenter.presentEmptyAnswer({
      clueId: getCurrentEpisodeContext().sourceClue?.id,
    });
    return;
  }

  renderer.setControlsEnabled(false);
  renderHost('reveal');
  let resultPerformance = null;
  const judgment = await roundKernel.judge(
    () => gameEngine.submitAnswer(userAnswer, {
      acceptedAnswers: displayClue?.translation
        ? [displayClue.answer]
        : [],
    }),
    (result) => {
      if (!result.ok) {
        broadcastPresenter.presentJudgment(result, { displayClue });
        return;
      }

      if (result.isCorrect) {
        state.bestStreak = result.bestStreak;
        persistBestStreak();
      }
      resultPerformance = broadcastPresenter.presentJudgment(result, { displayClue });

      const progress = episodeController.recordOutcome(result.isCorrect ? 'correct' : 'incorrect', {
        clue: result.clue,
        judgment: result,
      });
      renderer.renderOutcomeFeedback(progress.latestResult);

      renderer.setControlsEnabled(false);
      renderScoreboard();
      renderer.clearUserAnswer();
    },
  );
  if (judgment?.ok) {
    broadcastPresenter.narrateJudgment(judgment, resultPerformance, { displayClue });
  }
  renderer.setStudyAvailable(roundKernel.canPause());
}

async function showHideAnswer() {
  if (studyController.isOpen()) return;
  if (roundKernel.isBusy() || roundKernel.isAdvanceReady() || renderer.isAnswerVisible()) {
    return;
  }
  const { sourceClue, displayClue } = getCurrentEpisodeContext();
  renderer.setControlsEnabled(false);
  const revealedAnswer = displayClue?.answer || sourceClue?.answer || 'Unknown';
  let performance = null;
  const revealed = await roundKernel.reveal(() => {
    renderer.toggleAnswer(true);
    renderer.setGameMoment('reveal');
    performance = broadcastPresenter.presentReveal({ sourceClue });
    const progress = episodeController.recordOutcome('revealed');
    renderer.renderOutcomeFeedback(progress.latestResult);
  });
  if (revealed) {
    broadcastPresenter.narrateReveal(revealedAnswer, performance);
  }
  renderer.setStudyAvailable(roundKernel.canPause());
}

function setOutcomeConfidence({ confidence } = {}) {
  const progress = episodeController.annotateCurrentResult({ confidence });
  renderer.renderOutcomeFeedback(progress.latestResult);
  return progress;
}

function toggleOutcomeDispute() {
  const current = episodeController.getProgress().latestResult;
  const progress = episodeController.annotateCurrentResult({
    disputed: !current?.disputed,
  });
  renderer.renderOutcomeFeedback(progress.latestResult);
  return progress;
}

function startGame() {
  cabinetPresenter.ensureSceneActive();
  renderer.setStatus(getCopy().initializing);
  return episodeController.start();
}

function bindGameActivation() {
  if (globalThis.document?.body?.dataset?.appMode === 'game') {
    startGame();
    return;
  }

  globalThis.addEventListener?.('jeopardish:activate', startGame);

  const playSection = globalThis.document.getElementById('play');
  if (!playSection || !('IntersectionObserver' in globalThis)) {
    startGame();
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    if (entries.some((entry) => entry.isIntersecting)) {
      startGame();
      observer.disconnect();
    }
  }, {
    rootMargin: '360px 0px',
    threshold: 0.02,
  });

  observer.observe(playSection);

  if (globalThis.location?.hash === '#play') {
    startGame();
  }
}

function assignApplicationServices(services) {
  ({
    eventBus,
    gameEngine,
    sceneService,
    renderer,
    hostManager,
    hostPerformanceDirector,
    broadcastPresenter,
    cabinetPresenter,
    audioController,
    voiceController,
    roundKernel,
    preferenceStore,
    clueLocalization,
    episodeController,
    studyController,
    inputController,
  } = services);
}

function createInputHandlers() {
  const { InputCommands } = inputControllerModule;
  return {
    [InputCommands.NEW_CLUE]: getNewQuestion,
    [InputCommands.REVEAL_ANSWER]: showHideAnswer,
    [InputCommands.SUBMIT_ANSWER]: checkAnswer,
    [InputCommands.SUBMIT_SPOKEN_ANSWER]: submitSpokenAnswer,
    [InputCommands.REPEAT_CLUE]: narrateCurrentClue,
    [InputCommands.OPEN_MENU]: () => renderer.setMenuOpen(true),
    [InputCommands.CLOSE_MENU]: () => renderer.setMenuOpen(false),
    [InputCommands.TOGGLE_THEME]: toggleTheme,
    [InputCommands.TOGGLE_LANGUAGE]: toggleLanguage,
    [InputCommands.TOGGLE_SOUND]: toggleSound,
    [InputCommands.TOGGLE_VOICE]: () => toggleVoice({ listen: false }),
    [InputCommands.LISTEN_VOICE]: () => toggleVoice({ listen: true }),
    [InputCommands.DISABLE_VOICE]: () => setVoiceEnabled(false),
    [InputCommands.PREVIOUS_HOST]: () => cycleHostSkin(-1),
    [InputCommands.NEXT_HOST]: () => cycleHostSkin(1),
    [InputCommands.CYCLE_HOST_PACK]: cycleHostPack,
    [InputCommands.PREVIOUS_DIALOGUE]: () => cycleDialogueStyle(-1),
    [InputCommands.NEXT_DIALOGUE]: () => cycleDialogueStyle(1),
    [InputCommands.CYCLE_SCENE]: cycleScenePack,
    [InputCommands.ENTER_STUDY]: () => studyController.enter(),
    [InputCommands.REVIEW_SAVED_CLUES]: openSavedReview,
    [InputCommands.SELECT_STUDY_ACTION]: ({ actionId }) => (
      studyController.selectAction(actionId)
    ),
    [InputCommands.SUBMIT_REINFORCEMENT]: ({ answer }) => (
      studyController.submitReinforcement(answer)
    ),
    [InputCommands.EXIT_STUDY]: () => studyController.exit(),
    [InputCommands.SET_CONFIDENCE]: setOutcomeConfidence,
    [InputCommands.TOGGLE_DISPUTE]: toggleOutcomeDispute,
  };
}

function createCompositionOptions() {
  return {
    bestStreak: state.bestStreak,
    preferenceOptions: {
      allowedValues: {
        dialogueStyleId: DIALOGUE_STYLES.map((style) => style.id),
      },
    },
    hostPerformanceOptions: {
      motionPreference: 'system',
      systemReducedMotion: Boolean(
        globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
      ),
    },
    presentationOptions: {
      hostBeats: hostPackModule.HostBeats,
      getCopy,
    },
    cabinetOptions: {
      copyCatalog: UI_COPY,
      dialogueStyles: DIALOGUE_STYLES,
      documentRef: globalThis.document,
    },
    voiceOptions: {
      onState: (detail) => {
        renderer?.setVoiceState(detail);
        if (detail.state === voiceModule.VoiceStates.LISTENING) {
          emitVoiceEvent(contracts.GameEvents.VOICE_LISTENING);
        }
      },
      onTranscript: ({ transcript, final }) => {
        renderer?.setVoiceState({
          state: voiceModule.VoiceStates.LISTENING,
          enabled: voiceController.enabled,
          capabilities: voiceController.getCapabilities(),
          transcript,
        });
        if (final) {
          emitVoiceEvent(contracts.GameEvents.VOICE_TRANSCRIPT, { transcript });
        }
      },
      onIntent: (intent) => inputController?.routeVoiceIntent(intent),
      onError: (error) => emitVoiceEvent(contracts.GameEvents.VOICE_FAILED, error),
    },
    roundOptions: {
      reducedMotion: globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
      onPhase: (phase) => renderer.setRoundPhase(phase),
    },
    cluePipelineOptions: {
      maxAttempts: MAX_MEDIA_PREFLIGHT_ATTEMPTS,
      mediaEvents: {
        started: contracts.GameEvents.MEDIA_PREFLIGHT_STARTED,
        passed: contracts.GameEvents.MEDIA_PREFLIGHT_PASSED,
        rejected: contracts.GameEvents.MEDIA_PREFLIGHT_REJECTED,
        exhausted: contracts.GameEvents.MEDIA_PREFLIGHT_EXHAUSTED,
      },
    },
    localizationOptions: {
      extractContent: getSourceClueContent,
      getCurrentContext: getCurrentEpisodeContext,
      hasActiveClue: () => Boolean(gameEngine?.getActiveClue()),
      getRoundPresentation: () => ({
        phase: roundKernel.phase,
        canAnswer: roundKernel.phase === roundKernelModule.RoundPhases.ANSWERING,
      }),
      getClueValue: () => gameEngine.getState().currentClueValue,
      updateDisplayClue: (displayClue) => (
        episodeController.updateCurrentDisplayClue(displayClue)
      ),
      narrateCurrentClue,
    },
    episodeOptions: {
      sourceUrl: QUESTION_SOURCE,
      fallbackSourceUrl: FALLBACK_QUESTION_SOURCE,
      emergencySource: emergencyEpisodeModule?.EmergencyEpisode || null,
      timeoutMs: FETCH_TIMEOUT_MS,
      legacyEpisode: {
        id: ARCHIVE_PRACTICE ? 'archive-practice-local' : 'season-zero-pilot',
        title: ARCHIVE_PRACTICE ? 'Archive Practice: Historical Clues' : 'Season Zero: Pilot Broadcast',
        episodeLength: ARCHIVE_PRACTICE ? 10000 : 10,
      },
      isBlocked: () => studyController?.isOpen() || false,
      getMedia: (clue) => getSourceClueContent(clue).media,
      onEpisodeLoading: () => renderer.showLoading(),
      onEpisodeLoaded: presentEpisodeLoaded,
      onClueLoading: () => {
        clueLocalization.cancel();
        renderer.setControlsEnabled(false);
        renderer.setStudyAvailable(false);
      },
      onClueCommitted: (detail) => {
        presentClue(detail);
        renderer.setControlsEnabled(false);
      },
      onClueReady: () => {
        renderer.setControlsEnabled(true);
        renderer.setStudyAvailable(roundKernel.canPause());
        narrateCurrentClue();
      },
      onEmpty: () => renderer.displayErrorMessage('No playable clues remain in this transmission. Request a new broadcast.'),
      onError: presentEpisodeError,
      onProgress: presentEpisodeProgress,
      onComplete: presentEpisodeComplete,
      onRestart: () => renderScoreboard(),
    },
    studyOptions: {
      getGameState: () => gameEngine.getState(),
      getContext: () => ({
        ...getCurrentEpisodeContext(),
        locale: preferenceStore.get('language'),
      }),
      extractContent: getSourceClueContent,
      revealAnswer: showHideAnswer,
      renderHost,
      speak: speakHost,
      performHostBeat,
      onLearningProgress: refreshLearningQueue,
    },
    inputOptions: {
      isAdvanceReady: () => roundKernel.isAdvanceReady(),
      handlers: createInputHandlers(),
    },
  };
}

function initializeApplicationView() {
  const archiveMenuItem = globalThis.document?.getElementById('menuArchiveMode');
  const archiveMenuLabel = globalThis.document?.getElementById('menuArchiveModeLabel');
  if (archiveMenuItem && IS_PRIVATE_PREVIEW) {
    archiveMenuItem.hidden = false;
    archiveMenuItem.href = ARCHIVE_PRACTICE ? 'game.html' : 'game.html?mode=archive';
    if (archiveMenuLabel) {
      archiveMenuLabel.textContent = ARCHIVE_PRACTICE ? 'Return to Season Zero' : 'Archive Practice';
    }
  }
  applyPreferences();
  performHostBeat(hostPackModule.HostBeats.IDLE);
  renderer.setControlsEnabled(false);
  renderer.setStudyAvailable(false);
  renderer.setStatus('Studio standing by.');
  renderScoreboard();
}

function destroyApplication(event) {
  if (event?.persisted) return;
  applicationComposition?.destroy({ reason: 'pagehide' });
}

function bootstrapApplication() {
  loadPersistedBestStreak();
  applicationComposition = new applicationCompositionModule.ApplicationComposition();
  assignApplicationServices(applicationComposition.create(createCompositionOptions()));
  applicationComposition.start({
    rendererEvents: {
      ...inputController.createRendererBindings(),
      onMediaFailure: handleMediaFailure,
    },
    initialize: initializeApplicationView,
  });
  globalThis.addEventListener?.('pagehide', destroyApplication);
  bindGameActivation();
}

document.addEventListener('DOMContentLoaded', bootstrapApplication, { once: true });
