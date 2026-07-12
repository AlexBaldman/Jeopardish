'use strict';

const QUESTION_SOURCE = './questions/jeopardy-questions.json';
const FETCH_TIMEOUT_MS = 10000;
const MAX_MEDIA_PREFLIGHT_ATTEMPTS = 8;

const jeopardyErrors = [
  {
    category: 'TECHNICAL DIFFICULTIES',
    question: "This term describes what happens when your app can't load the local question database.",
    answer: "What is 'a file reading error'?",
    value: '$0',
  },
  {
    category: 'OOOPS!',
    question: "This famous line was uttered by every programmer ever when their code didn't work as expected.",
    answer: "What is 'It works on my machine'?",
    value: '$0',
  },
  {
    category: 'MYSTERY OF CODING',
    question: "It's the spooky thing that happens when your API call goes into the void and never returns.",
    answer: "What is 'the ghost in the machine'?",
    value: '$0',
  },
  {
    category: 'SOFTWARE SNAFUS',
    question: 'This phrase is often said when an application stops working right as you show it to someone.',
    answer: "What is 'demo demon'?",
    value: '$0',
  },
];

const state = {
  questions: [],
  lastClueIndex: -1,
  bestStreak: 0,
  theme: 'dark',
  language: 'en',
  hostSkinId: '',
  muted: false,
  currentSourceClue: null,
  currentDisplayClue: null,
  translationRequestId: 0,
};

const BEST_STREAK_KEY = 'jeopardish.bestStreak';
const THEME_KEY = 'jeopardish.theme';
const LANGUAGE_KEY = 'jeopardish.language';
const HOST_SKIN_KEY = 'jeopardish.hostSkin';
const MUTED_KEY = 'jeoparody.muted';

const UI_COPY = {
  en: {
    lang: 'en',
    questionButton: 'New Clue',
    answerButton: 'Reveal Answer',
    checkButton: 'Lock It In',
    inputPlaceholder: 'Type your response',
    soundOn: 'Sound',
    soundOff: 'Muted',
    nextClueReady: 'NEXT CLUE READY',
    themeNight: 'Night',
    themeDay: 'Day',
    languageEnglish: 'English',
    languagePortuguese: 'Português',
    translatingClue: 'Translating the complete clue...',
    translationOnDevice: 'PT · ON DEVICE',
    translationNetwork: 'PT · MACHINE',
    translationCache: 'PT · CACHED',
    translationFallback: 'PT unavailable · English shown',
    officialTender: 'TRIVIA RESERVE NOTE',
    questionableTender: 'QUESTIONABLE TENDER',
    currentStreak: 'Current Streak',
    bestStreak: 'Best Streak',
    score: 'Score',
    emptyCategory: 'Host Advisory',
    loadingBank: 'Loading question bank...',
    loadingQuestions: 'Loading questions...',
    fallbackClue: 'There was a problem loading a normal clue. Showing fallback clue.',
    newClue: 'New clue loaded. Enter your answer and press Lock It In.',
    correctKicker: 'Right on the Money',
    correctMessage: 'Correct.',
    correctAnswerStreak: 'Answer streak',
    incorrectKicker: 'The Judges Have Spoken',
    incorrectMessage: 'Not quite.',
    correctResponseLabel: 'Correct response:',
    streakReset: 'STREAK RESET!',
    hostCues: {
      idle: 'On Air',
      clue: 'Your Move',
      reveal: 'The Truth',
      correct: 'Approved',
      incorrect: 'Judges Say No',
      empty: '...Really?',
      streak: 'On Fire',
    },
    noClue: 'No question available yet. Please load one first.',
    emptyAnswer: 'Please enter an answer before checking.',
    emptyAnswerFallback: 'Try words. They have served contestants reasonably well.',
    keepTyping: 'Type an answer to keep the dignity damage contained.',
    loadedClues: (count) => `Loaded ${count.toLocaleString()} clues.`,
    initializing: 'Initializing game...',
    correctStatus: (scoreDelta, quip) => `Correct. +$${scoreDelta}. ${quip} Press Enter or New Clue to keep rolling.`,
    incorrectStatus: (quip) => `Incorrect. ${quip} Press Enter or New Clue to continue.`,
  },
  'pt-BR': {
    lang: 'pt-BR',
    questionButton: 'Nova Pista',
    answerButton: 'Revelar Resposta',
    checkButton: 'Valendo',
    inputPlaceholder: 'Digite sua resposta',
    soundOn: 'Som',
    soundOff: 'Mudo',
    nextClueReady: 'PRÓXIMA PISTA',
    themeNight: 'Noite',
    themeDay: 'Dia',
    languageEnglish: 'English',
    languagePortuguese: 'Português',
    translatingClue: 'Traduzindo categoria, pista e resposta...',
    translationOnDevice: 'PT · NO DISPOSITIVO',
    translationNetwork: 'PT · TRADUÇÃO AUTOMÁTICA',
    translationCache: 'PT · EM CACHE',
    translationFallback: 'PT indisponível · exibindo inglês',
    officialTender: 'RESERVA DE TRÍVIA',
    questionableTender: 'DINHEIRO SUSPEITO',
    currentStreak: 'Sequência Atual',
    bestStreak: 'Melhor Sequência',
    score: 'Placar',
    emptyCategory: 'Aviso do Host',
    loadingBank: 'Carregando banco de pistas...',
    loadingQuestions: 'Carregando perguntas...',
    fallbackClue: 'Houve um problema ao carregar uma pista normal. Mostrando uma pista reserva.',
    newClue: 'Nova pista carregada. Digite sua resposta e aperte Valendo.',
    correctKicker: 'Dinheiro no Bolso',
    correctMessage: 'Correto.',
    correctAnswerStreak: 'Sequência de acertos',
    incorrectKicker: 'Os Juízes Decidiram',
    incorrectMessage: 'Quase, mas não.',
    correctResponseLabel: 'Resposta correta:',
    streakReset: 'SEQUÊNCIA ZERADA!',
    hostCues: {
      idle: 'No Ar',
      clue: 'Sua Vez',
      reveal: 'A Verdade',
      correct: 'Aprovado',
      incorrect: 'Juízes: Não',
      empty: '...Sério?',
      streak: 'Pegando Fogo',
    },
    noClue: 'Nenhuma pergunta disponível ainda. Carregue uma pista primeiro.',
    emptyAnswer: 'Digite uma resposta antes de conferir.',
    emptyAnswerFallback: 'Tente usar palavras. Elas costumam ajudar.',
    keepTyping: 'Digite uma resposta para conter o dano à dignidade.',
    loadedClues: (count) => `${count.toLocaleString('pt-BR')} pistas carregadas.`,
    initializing: 'Inicializando o jogo...',
    correctStatus: (scoreDelta, quip) => `Correto. +$${scoreDelta}. ${quip} Aperte Enter ou Nova Pista para continuar.`,
    incorrectStatus: (quip) => `Incorreto. ${quip} Aperte Enter ou Nova Pista para continuar.`,
  },
};

const logic = globalThis.JeopardishLogic || null;
if (!logic) {
  throw new Error('JeopardishLogic failed to load. Ensure game-logic.js is included before app.js.');
}

const contracts = globalThis.JeopardishContracts || null;
const eventBusModule = globalThis.JeopardishEventBus || null;
const engineModule = globalThis.JeopardishEngine || null;
const dataModule = globalThis.JeopardishData || null;
const mediaModule = globalThis.JeoPARODYMedia || null;
const sceneModule = globalThis.JeopardishSceneService || null;
const rendererModule = globalThis.JeopardishRenderer || null;
const narratorModule = globalThis.JeopardishConsoleNarrator || null;
const hostModule = globalThis.JeopardishHost || null;
const brandModule = globalThis.JeoPARODYBrand || null;
const translationModule = globalThis.JeoPARODYTranslation || null;
const audioModule = globalThis.JeoPARODYAudio || null;
const roundDirectorModule = globalThis.JeoPARODYRoundDirector || null;

if (!contracts || !eventBusModule || !engineModule || !dataModule || !mediaModule || !rendererModule || !narratorModule || !hostModule || !brandModule || !translationModule || !audioModule || !roundDirectorModule) {
  throw new Error('Jeopardish engine modules failed to load. Ensure src modules are included before app.js.');
}

let eventBus;
let gameEngine;
let dataLoader;
let mediaPreflight;
let sceneService;
let renderer;
let consoleNarrator;
let hostManager;
let brandController;
let translationService;
let audioController;
let roundDirector;
let translationAbortController = null;
let mediaAbortController = null;
let gameStarted = false;
let gameStartPromise = null;
const preloadedHostVisuals = new Set();

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

function loadPersistedPreferences() {
  try {
    const theme = globalThis.localStorage?.getItem(THEME_KEY);
    const language = globalThis.localStorage?.getItem(LANGUAGE_KEY);
    if (theme === 'dark' || theme === 'light') {
      state.theme = theme;
    }
    if (language === 'en' || language === 'pt-BR') {
      state.language = language;
    }
    const hostSkinId = globalThis.localStorage?.getItem(HOST_SKIN_KEY);
    if (hostSkinId) {
      state.hostSkinId = hostSkinId;
    }
    state.muted = globalThis.localStorage?.getItem(MUTED_KEY) === 'true';
  } catch (error) {
    console.warn('Unable to read persisted UI preferences.', error);
  }
}

function persistBestStreak() {
  try {
    globalThis.localStorage?.setItem(BEST_STREAK_KEY, String(state.bestStreak));
  } catch (error) {
    console.warn('Unable to persist best streak.', error);
  }
}

function persistPreference(key, value) {
  try {
    globalThis.localStorage?.setItem(key, value);
  } catch (error) {
    console.warn('Unable to persist UI preference.', error);
  }
}

function getCopy() {
  return UI_COPY[state.language] || UI_COPY.en;
}

function applyPreferences() {
  const copy = getCopy();
  globalThis.document?.body?.setAttribute('data-theme', state.theme);
  globalThis.document?.body?.setAttribute('data-language', state.language);
  sceneService?.setTheme(state.theme);
  renderer.setCopy(copy);
  renderer.setToggleStates({
    theme: state.theme,
    language: state.language,
  });
  renderer.setSoundState(state.muted);
  renderScoreboard();
}

function toggleSound() {
  state.muted = audioController.toggleMuted();
  persistPreference(MUTED_KEY, String(state.muted));
  renderer.setSoundState(state.muted);
  if (!state.muted) {
    audioController.unlock();
    audioController.play('clue');
  }
}

function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark';
  persistPreference(THEME_KEY, state.theme);
  applyPreferences();
}

async function toggleLanguage() {
  state.language = state.language === 'en' ? 'pt-BR' : 'en';
  persistPreference(LANGUAGE_KEY, state.language);
  applyPreferences();
  renderHost(getCurrentHostExpression());
  if (state.currentSourceClue && gameEngine.getActiveClue()) {
    await refreshCurrentClueLanguage();
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
}

function preloadActiveHostVisuals() {
  if (!hostManager || typeof globalThis.Image !== 'function') {
    return;
  }

  hostManager.getVisualSources().forEach((src) => {
    if (preloadedHostVisuals.has(src)) {
      return;
    }
    const image = new globalThis.Image();
    image.src = src;
    preloadedHostVisuals.add(src);
  });
}

function renderHost(expression = 'idle') {
  const host = hostManager.getActiveHost();
  const performance = hostManager.getPerformance(expression);
  if (!performance) {
    return;
  }
  const cue = getCopy().hostCues?.[performance.cueKey] || performance.state;
  renderer.renderHost(
    host,
    performance.state,
    performance.visual,
    performance.skin,
    {
      ...performance,
      cue,
      accessibleLabel: cue,
    },
  );
}

function persistHostSkin() {
  const skin = hostManager.getActiveSkin();
  if (skin?.id) {
    persistPreference(HOST_SKIN_KEY, skin.id);
  }
}

function getCurrentHostExpression() {
  return renderer?.dom?.hostImage?.dataset?.expression || 'idle';
}

function cycleHostSkin(step) {
  hostManager.cycleSkin(step);
  persistHostSkin();
  preloadActiveHostVisuals();
  renderHost(getCurrentHostExpression());
}

function getQuestionCandidates(limit = MAX_MEDIA_PREFLIGHT_ATTEMPTS) {
  const count = state.questions.length;
  if (count === 0) return [];

  const candidates = [];
  const start = Math.floor(Math.random() * count);
  for (let offset = 0; offset < count && candidates.length < limit; offset += 1) {
    const index = (start + offset) % count;
    if (count > 1 && index === state.lastClueIndex) continue;
    candidates.push({ clue: state.questions[index], index });
  }
  return candidates;
}

function renderClue(sourceClue, displayClue = sourceClue) {
  if (!sourceClue) {
    renderer.displayErrorJoke(jeopardyErrors);
    return;
  }

  const gameState = gameEngine.loadClue(sourceClue);
  state.currentSourceClue = sourceClue;
  state.currentDisplayClue = displayClue;
  renderHost('clue');
  renderer.renderClue(displayClue, gameState.currentClueValue);
}

function getSourceClueContent(clue) {
  const parsed = rendererModule.extractClueMedia(clue, globalThis.document);
  return { questionText: parsed.text, media: parsed.media };
}

async function selectPlayableQuestion(signal) {
  const selected = await mediaPreflight.selectPlayable(getQuestionCandidates(), {
    signal,
    getMedia: (clue) => getSourceClueContent(clue).media,
    events: {
      started: contracts.GameEvents.MEDIA_PREFLIGHT_STARTED,
      passed: contracts.GameEvents.MEDIA_PREFLIGHT_PASSED,
      rejected: contracts.GameEvents.MEDIA_PREFLIGHT_REJECTED,
      exhausted: contracts.GameEvents.MEDIA_PREFLIGHT_EXHAUSTED,
    },
  });
  if (selected?.candidate && Number.isInteger(selected.candidate.index)) {
    state.lastClueIndex = selected.candidate.index;
  }
  return selected?.clue || null;
}

async function prepareDisplayClue(clue, requestId) {
  if (state.language !== 'pt-BR') {
    translationAbortController?.abort();
    return clue;
  }

  translationAbortController?.abort();
  translationAbortController = new AbortController();
  renderer.showTranslationLoading();
  const sourceContent = getSourceClueContent(clue);
  try {
    const translated = await translationService.translateClue(clue, {
      questionText: sourceContent.questionText,
      signal: translationAbortController.signal,
    });
    if (requestId !== state.translationRequestId) {
      return null;
    }
    return {
      ...translated,
      media: [
        ...(Array.isArray(clue.media) ? clue.media : []),
        ...sourceContent.media,
      ],
    };
  } catch (error) {
    if (error?.name === 'AbortError' || requestId !== state.translationRequestId) {
      return null;
    }
    console.warn('Complete clue translation unavailable; showing the original clue.', error);
    return {
      ...clue,
      translationFallback: true,
    };
  }
}

async function refreshCurrentClueLanguage() {
  const sourceClue = state.currentSourceClue;
  if (!sourceClue) {
    return;
  }
  const requestId = ++state.translationRequestId;
  const displayClue = await prepareDisplayClue(sourceClue, requestId);
  if (!displayClue || requestId !== state.translationRequestId) {
    return;
  }
  state.currentDisplayClue = displayClue;
  renderer.renderClue(displayClue, gameEngine.getState().currentClueValue);
  renderer.setRoundPhase(roundDirectorModule.RoundPhases.ANSWERING);
}

async function getNewQuestion() {
  if (!gameStarted) {
    return startGame();
  }

  const requestId = ++state.translationRequestId;
  roundDirector.cancel(roundDirectorModule.RoundPhases.CLUE_INTRO);
  renderer.setControlsEnabled(false);
  mediaAbortController?.abort();
  mediaAbortController = new AbortController();
  let clue;
  try {
    clue = await selectPlayableQuestion(mediaAbortController.signal);
  } catch (error) {
    if (error?.name === 'AbortError') return null;
    console.warn('Media preflight failed unexpectedly.', error);
  }
  if (requestId !== state.translationRequestId) return null;
  if (!clue) {
    renderer.displayErrorJoke(jeopardyErrors);
    return null;
  }
  const displayClue = await prepareDisplayClue(clue, requestId);
  if (!displayClue || requestId !== state.translationRequestId) {
    return null;
  }
  return roundDirector.introduceClue(() => renderClue(clue, displayClue));
}

function handleMediaFailure({ item, reason }) {
  eventBus.emit(contracts.GameEvents.MEDIA_RUNTIME_FAILED, {
    url: item?.url,
    type: item?.type,
    reason,
  }, { source: 'Renderer' });
  getNewQuestion();
}

async function checkAnswer() {
  if (roundDirector.isAdvanceReady()) {
    getNewQuestion();
    return;
  }

  if (roundDirector.isBusy()) {
    return;
  }

  if (!gameEngine.getActiveClue()) {
    if (gameEngine.getState().phase === contracts.GamePhases.REVEALING) {
      getNewQuestion();
      return;
    }

    renderer.displayErrorMessage(getCopy().noClue);
    return;
  }

  const userAnswer = renderer.getUserAnswer();
  const userAnswerCleaned = logic.cleanAnswer(userAnswer);

  if (!userAnswerCleaned) {
    renderHost('empty');
    renderer.displayEmptyAnswerQuip(hostManager.selectQuip('empty') || getCopy().emptyAnswerFallback);
    return;
  }

  renderer.setControlsEnabled(false);
  renderHost('reveal');
  await roundDirector.judge(
    () => gameEngine.submitAnswer(userAnswer, {
      acceptedAnswers: state.currentDisplayClue?.translation
        ? [state.currentDisplayClue.answer]
        : [],
    }),
    (result) => {
      if (!result.ok) {
        renderer.displayErrorMessage(result.error.message);
        return;
      }

      if (result.isCorrect) {
        state.bestStreak = result.bestStreak;
        persistBestStreak();
        renderHost(result.currentStreak >= 3 ? 'streak' : 'correct');
        renderer.displayCorrectAnswerMessage(result);
        renderer.setStatus(getCopy().correctStatus(result.scoreDelta, hostManager.selectQuip('correct')));
      } else {
        renderHost('incorrect');
        renderer.displayIncorrectAnswerMessage(
          state.currentDisplayClue?.answer || result.correctAnswer || 'Unknown',
        );
        renderer.setStatus(getCopy().incorrectStatus(hostManager.selectQuip('incorrect')));
      }

      renderer.setControlsEnabled(false);
      renderScoreboard();
      renderer.clearUserAnswer();
    },
  );
}

async function showHideAnswer() {
  if (roundDirector.isBusy() || roundDirector.isAdvanceReady() || renderer.isAnswerVisible()) {
    return;
  }
  renderer.setControlsEnabled(false);
  await roundDirector.reveal(() => {
    renderer.toggleAnswer(true);
    renderer.setGameMoment('reveal');
    renderHost('reveal');
  });
}

async function loadQuestions() {
  const abort = new AbortController();
  const timer = setTimeout(() => abort.abort(), FETCH_TIMEOUT_MS);

  try {
    renderer.showLoading();
    const data = await dataLoader.loadQuestionBank(QUESTION_SOURCE, { signal: abort.signal });

    state.questions = data;
    renderer.setStatus(getCopy().loadedClues(data.length));
    gameEngine.ready();
    getNewQuestion();
  } catch (error) {
    console.error('Error loading questions:', error);
    renderer.displayErrorJoke(jeopardyErrors);
  } finally {
    clearTimeout(timer);
  }
}

function startGame() {
  if (gameStartPromise) {
    return gameStartPromise;
  }

  gameStarted = true;
  renderer.setStatus(getCopy().initializing);
  gameEngine.init();
  gameStartPromise = loadQuestions();
  return gameStartPromise;
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

function bindEvents() {
  renderer.bindEvents({
    onToggleAnswer: showHideAnswer,
    onNewQuestion: getNewQuestion,
    onCheckAnswer: checkAnswer,
    onToggleTheme: toggleTheme,
    onToggleLanguage: toggleLanguage,
    onToggleSound: toggleSound,
    onPreviousHostSkin: () => cycleHostSkin(-1),
    onNextHostSkin: () => cycleHostSkin(1),
    onMediaFailure: handleMediaFailure,
  });

  globalThis.document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    const isTyping = event.target === renderer.dom.userInput;
    if (key === 'enter' && roundDirector.isAdvanceReady()) {
      event.preventDefault();
      getNewQuestion();
      return;
    }
    if (isTyping || event.metaKey || event.ctrlKey || event.altKey) {
      return;
    }

    if (key === 'q') {
      event.preventDefault();
      getNewQuestion();
    } else if (key === 'a') {
      event.preventDefault();
      showHideAnswer();
    }
  });
}

document.addEventListener('DOMContentLoaded', async () => {
  loadPersistedBestStreak();
  loadPersistedPreferences();
  eventBus = new eventBusModule.EventBus();
  gameEngine = new engineModule.GameEngine({
    eventBus,
    bestStreak: state.bestStreak,
  });
  dataLoader = new dataModule.DataLoader({ eventBus });
  mediaPreflight = new mediaModule.MediaPreflight({ eventBus });
  sceneService = sceneModule ? new sceneModule.SceneService() : null;
  renderer = new rendererModule.Renderer();
  consoleNarrator = new narratorModule.ConsoleNarrator({ eventBus });
  hostManager = new hostModule.HostManager();
  brandController = new brandModule.BrandController();
  translationService = new translationModule.TranslationService();
  audioController = new audioModule.AudioController();
  hostManager.setActiveSkin(state.hostSkinId);
  preloadActiveHostVisuals();
  consoleNarrator.start();

  renderer.bindDom();
  brandController.bind();
  audioController.setMuted(state.muted);
  roundDirector = new roundDirectorModule.RoundDirector({
    audio: audioController,
    reducedMotion: globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
    onPhase: (phase) => renderer.setRoundPhase(phase),
  });
  sceneService?.bindDom();
  applyPreferences();
  renderHost('idle');
  bindEvents();
  renderer.setControlsEnabled(false);
  renderer.setStatus('Studio standing by.');
  renderScoreboard();

  bindGameActivation();
});
