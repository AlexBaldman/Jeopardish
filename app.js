'use strict';

const QUESTION_SOURCE = './questions/episodes/season-zero-001.json';
const FALLBACK_QUESTION_SOURCE = './questions/runtime-bank.json';
const FETCH_TIMEOUT_MS = 30000;
const MAX_MEDIA_PREFLIGHT_ATTEMPTS = 8;
const DIALOGUE_STYLES = Object.freeze([
  Object.freeze({ id: 'clue-card', label: Object.freeze({ en: 'Clue Card', 'pt-BR': 'Cartão da Pista' }) }),
  Object.freeze({ id: 'speech', label: Object.freeze({ en: 'Comic Speech', 'pt-BR': 'Fala de Quadrinho' }) }),
  Object.freeze({ id: 'thought', label: Object.freeze({ en: 'Host Thought', 'pt-BR': 'Pensamento do Host' }) }),
  Object.freeze({ id: 'narration', label: Object.freeze({ en: 'Narration Box', 'pt-BR': 'Caixa do Narrador' }) }),
]);

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
  bestStreak: 0,
  translationRequestId: 0,
};

const BEST_STREAK_KEY = 'jeopardish.bestStreak';

const UI_COPY = {
  en: {
    lang: 'en',
    questionButton: 'New Clue',
    answerButton: 'Reveal Answer',
    checkButton: 'Lock It In',
    inputPlaceholder: 'Type your response',
    answerFieldLabel: 'Your response',
    checkButtonKicker: 'Confirm',
    questionButtonKicker: 'Board',
    answerButtonKicker: 'Clue',
    confidencePrompt: 'How did that one feel?',
    confidenceKnew: 'Knew it',
    confidenceShaky: 'Shaky',
    confidenceLearned: 'Learned it',
    disputeJudgment: 'Dispute ruling',
    disputeRecorded: 'Ruling flagged',
    soundOn: 'Sound',
    soundOff: 'Muted',
    voiceMode: 'Voice mode',
    voiceOff: 'Voice off',
    voiceReady: 'Tap to answer',
    voiceNarrationReady: 'Narration on',
    voiceListening: 'Listening...',
    voiceSpeaking: 'Xander speaking',
    voiceDenied: 'Microphone blocked',
    voiceUnavailable: 'Voice unavailable',
    voiceError: 'Voice needs another try',
    voiceHelp: 'Push to talk. Say an answer, next clue, reveal the answer, repeat the clue, open menu, or ask Xander.',
    voiceWelcome: 'Voice mode online. Tap the microphone to answer or give me a command.',
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
    currentStreak: 'Current Streak',
    bestStreak: 'Best Streak',
    score: 'Score',
    episode: 'Episode',
    clueProgress: 'Clue',
    episodeComplete: 'Broadcast Complete',
    replayEpisode: 'Replay Episode',
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
    yourResponseLabel: 'Your response:',
    exactJudgment: 'Exact match',
    variationJudgment: 'Accepted variation',
    fuzzyJudgment: 'Minor typo accepted',
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
    voiceClue: (category, value, question) => `${category}, for ${value} dollars. ${question}`,
    voiceCorrect: (value, streak) => `Correct. Add ${value} dollars. Your streak is ${streak}.`,
    voiceIncorrect: (answer) => `Not quite. The correct response was ${answer}.`,
    voiceReveal: (answer) => `The correct response is ${answer}.`,
    voiceComplete: (score, correct, total) => `Broadcast complete. Final score, ${score} dollars. ${correct} correct out of ${total}.`,
  },
  'pt-BR': {
    lang: 'pt-BR',
    questionButton: 'Nova Pista',
    answerButton: 'Revelar Resposta',
    checkButton: 'Valendo',
    inputPlaceholder: 'Digite sua resposta',
    answerFieldLabel: 'Sua resposta',
    checkButtonKicker: 'Confirmar',
    questionButtonKicker: 'Tabuleiro',
    answerButtonKicker: 'Pista',
    confidencePrompt: 'Como foi essa?',
    confidenceKnew: 'Eu sabia',
    confidenceShaky: 'Foi por pouco',
    confidenceLearned: 'Aprendi agora',
    disputeJudgment: 'Contestar decisão',
    disputeRecorded: 'Decisão marcada',
    soundOn: 'Som',
    soundOff: 'Mudo',
    voiceMode: 'Modo de voz',
    voiceOff: 'Voz desligada',
    voiceReady: 'Toque para responder',
    voiceNarrationReady: 'Narração ativa',
    voiceListening: 'Ouvindo...',
    voiceSpeaking: 'Xander falando',
    voiceDenied: 'Microfone bloqueado',
    voiceUnavailable: 'Voz indisponível',
    voiceError: 'Tente a voz novamente',
    voiceHelp: 'Toque para falar. Diga uma resposta, próxima pista, mostre a resposta, repita a pista, abra o menu ou pergunte ao Xander.',
    voiceWelcome: 'Modo de voz ativado. Toque no microfone para responder ou dar um comando.',
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
    currentStreak: 'Sequência Atual',
    bestStreak: 'Melhor Sequência',
    score: 'Placar',
    episode: 'Episódio',
    clueProgress: 'Pista',
    episodeComplete: 'Transmissão Concluída',
    replayEpisode: 'Repetir Episódio',
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
    yourResponseLabel: 'Sua resposta:',
    exactJudgment: 'Resposta exata',
    variationJudgment: 'Variação aceita',
    fuzzyJudgment: 'Pequeno erro aceito',
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
    voiceClue: (category, value, question) => `${category}, por ${value} dólares. ${question}`,
    voiceCorrect: (value, streak) => `Correto. Mais ${value} dólares. Sua sequência é ${streak}.`,
    voiceIncorrect: (answer) => `Quase. A resposta correta era ${answer}.`,
    voiceReveal: (answer) => `A resposta correta é ${answer}.`,
    voiceComplete: (score, correct, total) => `Transmissão concluída. Placar final, ${score} dólares. ${correct} acertos em ${total}.`,
  },
};

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

if (!contracts || !rendererModule || !voiceModule || !roundKernelModule || !inputControllerModule || !applicationCompositionModule) {
  throw new Error('Jeopardish engine modules failed to load. Ensure src modules are included before app.js.');
}

let applicationComposition;
let eventBus;
let gameEngine;
let sceneService;
let renderer;
let hostManager;
let translationService;
let audioController;
let voiceController;
let roundKernel;
let preferenceStore;
let episodeController;
let studyController;
let inputController;
let translationAbortController = null;
let sceneActivated = false;

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
  return UI_COPY[preferenceStore.get('language')] || UI_COPY.en;
}

function getCurrentEpisodeContext() {
  return episodeController?.getCurrentContext() || {
    sourceClue: null,
    displayClue: null,
  };
}

function applyScenePreferences() {
  const scenePackId = preferenceStore.get('scenePackId');
  const activeScenePack = sceneService?.setPack(scenePackId, { render: false });
  sceneService?.setTheme(preferenceStore.get('theme'));
  sceneActivated = true;
  if (activeScenePack && activeScenePack.id !== scenePackId) {
    preferenceStore.set('scenePackId', activeScenePack.id);
  }
  return activeScenePack;
}

function applyPreferences() {
  const copy = getCopy();
  const theme = preferenceStore.get('theme');
  const language = preferenceStore.get('language');
  const scenePackId = preferenceStore.get('scenePackId');
  globalThis.document?.body?.setAttribute('data-theme', theme);
  globalThis.document?.body?.setAttribute('data-language', language);
  const isStandaloneGame = globalThis.document?.body?.dataset?.appMode === 'game';
  const activeScenePack = (isStandaloneGame || sceneActivated)
    ? applyScenePreferences()
    : sceneService?.getPacks().find((pack) => pack.id === scenePackId)
      || sceneService?.getActivePack();
  if (activeScenePack) {
    if (activeScenePack.id !== preferenceStore.get('scenePackId')) {
      preferenceStore.set('scenePackId', activeScenePack.id);
    }
    renderScenePicker(activeScenePack);
  }
  renderer.setCopy(copy);
  renderer.setToggleStates({
    theme,
    language,
  });
  renderer.setSoundState(preferenceStore.get('muted'));
  voiceController?.setLanguage(language);
  if (voiceController) {
    renderer.setVoiceState({
      state: voiceController.state,
      enabled: voiceController.enabled,
      capabilities: voiceController.getCapabilities(),
    });
  }
  renderDialogueStyle();
  renderScoreboard();
}

function renderDialogueStyle() {
  const dialogueStyleId = preferenceStore.get('dialogueStyleId');
  const language = preferenceStore.get('language');
  const index = Math.max(0, DIALOGUE_STYLES.findIndex((style) => style.id === dialogueStyleId));
  const style = DIALOGUE_STYLES[index];
  renderer.renderDialogueStyle({
    ...style,
    label: style.label[language] || style.label.en,
  }, index, DIALOGUE_STYLES.length);
}

function cycleDialogueStyle(step) {
  const currentId = preferenceStore.get('dialogueStyleId');
  const currentIndex = Math.max(0, DIALOGUE_STYLES.findIndex((style) => style.id === currentId));
  const nextIndex = (currentIndex + step + DIALOGUE_STYLES.length) % DIALOGUE_STYLES.length;
  preferenceStore.set('dialogueStyleId', DIALOGUE_STYLES[nextIndex].id);
  renderDialogueStyle();
}

function renderScenePicker(pack = sceneService?.getActivePack()) {
  if (!pack || !sceneService) return;
  const packs = sceneService.getPacks();
  const index = Math.max(0, packs.findIndex((candidate) => candidate.id === pack.id));
  renderer.renderScenePicker(pack, index, packs.length);
}

function cycleScenePack() {
  const pack = sceneService?.cyclePack(1);
  if (!pack) return;
  sceneActivated = true;
  preferenceStore.set('scenePackId', pack.id);
  renderScenePicker(pack);
}

function toggleSound() {
  const muted = audioController.toggleMuted();
  preferenceStore.set('muted', muted);
  renderer.setSoundState(muted);
  if (!muted) {
    audioController.unlock();
    audioController.play('clue');
  }
}

function emitVoiceEvent(type, payload = {}) {
  eventBus?.emit(type, payload, { source: 'VoiceController' });
}

function speakHost(message) {
  return voiceController?.speak?.(message, {
    language: preferenceStore.get('language') === 'pt-BR' ? 'pt-BR' : 'en-US',
  }) || false;
}

function narrateCurrentClue() {
  const context = getCurrentEpisodeContext();
  const clue = context.displayClue;
  if (!clue) return false;
  const question = getSourceClueContent(clue).questionText;
  const value = gameEngine?.getState()?.currentClueValue || 0;
  const authoredLine = preferenceStore.get('language') === 'en'
    ? context.sourceClue?.performance?.hostLine
    : '';
  return speakHost([
    authoredLine,
    getCopy().voiceClue(clue.category || '', value, question),
  ].filter(Boolean).join(' '));
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
  const theme = preferenceStore.get('theme') === 'dark' ? 'light' : 'dark';
  preferenceStore.set('theme', theme);
  applyPreferences();
}

async function toggleLanguage() {
  const language = preferenceStore.get('language') === 'en' ? 'pt-BR' : 'en';
  preferenceStore.set('language', language);
  applyPreferences();
  renderHost(getCurrentHostExpression());
  if (getCurrentEpisodeContext().sourceClue && gameEngine.getActiveClue()) {
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
  if (episodeController) renderer.renderSessionProgress(episodeController.getProgress());
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
}

function presentClue({ sourceClue, displayClue = sourceClue, gameState } = {}) {
  if (!sourceClue) {
    renderer.displayErrorJoke(jeopardyErrors);
    return;
  }

  renderHost(sourceClue.performance?.expression || 'clue');
  renderer.renderClue(displayClue, gameState.currentClueValue);
}

function getSourceClueContent(clue) {
  const parsed = rendererModule.extractClueMedia(clue, globalThis.document);
  return { questionText: parsed.text, media: parsed.media };
}

function presentEpisodeProgress(progress) {
  renderer.renderSessionProgress(progress);
}

function presentEpisodeComplete(progress) {
  renderHost('streak');
  renderer.renderSessionProgress(progress);
  renderer.renderEpisodeComplete(progress);
  speakHost([
    progress.finale?.hostLine,
    getCopy().voiceComplete(progress.score, progress.counts.correct, progress.total),
    progress.finale?.teaser,
  ].filter(Boolean).join(' '));
}

function presentEpisodeLoaded({ sourceCount, fallback = false } = {}) {
  const gameState = gameEngine.getState();
  state.bestStreak = Math.max(state.bestStreak, gameState.bestStreak || 0);
  renderer.setStatus(fallback
    ? `${getCopy().loadedClues(sourceCount || 0)} Authored broadcast unavailable; archive transmission active.`
    : getCopy().loadedClues(sourceCount || 0));
  renderScoreboard();
}

function presentEpisodeError(error) {
  console.error('Error loading episode:', error);
  renderer.displayErrorJoke(jeopardyErrors);
}

async function translateClueForDisplay(clue, signal) {
  if (preferenceStore.get('language') !== 'pt-BR') {
    return clue;
  }

  renderer.showTranslationLoading();
  const sourceContent = getSourceClueContent(clue);
  try {
    const translated = await translationService.translateClue(clue, {
      questionText: sourceContent.questionText,
      signal,
    });
    return {
      ...translated,
      media: [
        ...(Array.isArray(clue.media) ? clue.media : []),
        ...sourceContent.media,
      ],
    };
  } catch (error) {
    if (error?.name === 'AbortError') {
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
  const { sourceClue } = getCurrentEpisodeContext();
  if (!sourceClue) {
    return;
  }
  const roundView = renderer.captureRoundView();
  const requestId = ++state.translationRequestId;
  translationAbortController?.abort();
  translationAbortController = new AbortController();
  const displayClue = await translateClueForDisplay(sourceClue, translationAbortController.signal);
  if (!displayClue || requestId !== state.translationRequestId) {
    return;
  }
  episodeController.updateCurrentDisplayClue(displayClue);
  renderer.renderClue(displayClue, gameEngine.getState().currentClueValue);
  renderer.setRoundPhase(roundKernel.phase);
  renderer.restoreRoundView(roundView);
  renderer.setControlsEnabled(roundKernel.phase === roundKernelModule.RoundPhases.ANSWERING);
  narrateCurrentClue();
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
    renderHost('empty');
    renderer.displayEmptyAnswerQuip(hostManager.selectQuip('empty') || getCopy().emptyAnswerFallback);
    return;
  }

  renderer.setControlsEnabled(false);
  renderHost('reveal');
  const judgment = await roundKernel.judge(
    () => gameEngine.submitAnswer(userAnswer, {
      acceptedAnswers: displayClue?.translation
        ? [displayClue.answer]
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
        renderer.displayCorrectAnswerMessage({
          ...result,
          correctAnswer: displayClue?.answer || result.correctAnswer,
        });
        renderer.setStatus(getCopy().correctStatus(result.scoreDelta, hostManager.selectQuip('correct')));
      } else {
        renderHost('incorrect');
        renderer.displayIncorrectAnswerMessage({
          ...result,
          correctAnswer: displayClue?.answer || result.correctAnswer || 'Unknown',
        });
        renderer.setStatus(getCopy().incorrectStatus(hostManager.selectQuip('incorrect')));
      }

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
    speakHost(judgment.isCorrect
      ? getCopy().voiceCorrect(judgment.scoreDelta, judgment.currentStreak)
      : getCopy().voiceIncorrect(
        displayClue?.answer || judgment.correctAnswer || 'Unknown',
      ));
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
  const revealed = await roundKernel.reveal(() => {
    renderer.toggleAnswer(true);
    renderer.setGameMoment('reveal');
    renderHost('reveal');
    const progress = episodeController.recordOutcome('revealed');
    renderer.renderOutcomeFeedback(progress.latestResult);
  });
  if (revealed) speakHost(getCopy().voiceReveal(revealedAnswer));
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
  if (!sceneActivated) renderScenePicker(applyScenePreferences());
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
    translationService,
    audioController,
    voiceController,
    roundKernel,
    preferenceStore,
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
    [InputCommands.PREVIOUS_DIALOGUE]: () => cycleDialogueStyle(-1),
    [InputCommands.NEXT_DIALOGUE]: () => cycleDialogueStyle(1),
    [InputCommands.CYCLE_SCENE]: cycleScenePack,
    [InputCommands.ENTER_STUDY]: () => studyController.enter(),
    [InputCommands.SELECT_STUDY_ACTION]: ({ actionId }) => (
      studyController.selectAction(actionId)
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
    episodeOptions: {
      sourceUrl: QUESTION_SOURCE,
      fallbackSourceUrl: FALLBACK_QUESTION_SOURCE,
      timeoutMs: FETCH_TIMEOUT_MS,
      legacyEpisode: {
        id: 'season-zero-pilot',
        title: 'Season Zero: Pilot Broadcast',
        episodeLength: 10,
      },
      isBlocked: () => studyController?.isOpen() || false,
      getMedia: (clue) => getSourceClueContent(clue).media,
      prepareDisplay: (clue, { signal }) => translateClueForDisplay(clue, signal),
      onEpisodeLoading: () => renderer.showLoading(),
      onEpisodeLoaded: presentEpisodeLoaded,
      onClueLoading: () => {
        state.translationRequestId += 1;
        translationAbortController?.abort();
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
      onEmpty: () => renderer.displayErrorJoke(jeopardyErrors),
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
    },
    inputOptions: {
      isAdvanceReady: () => roundKernel.isAdvanceReady(),
      handlers: createInputHandlers(),
    },
  };
}

function initializeApplicationView() {
  applyPreferences();
  renderHost('idle');
  renderer.setControlsEnabled(false);
  renderer.setStudyAvailable(false);
  renderer.setStatus('Studio standing by.');
  renderScoreboard();
}

function destroyApplication(event) {
  if (event?.persisted) return;
  translationAbortController?.abort();
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
