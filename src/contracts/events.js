(function initContracts(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeopardishContracts = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function contractsFactory() {
  'use strict';

  const GameEvents = Object.freeze({
    GAME_INIT: 'GAME_INIT',
    GAME_READY: 'GAME_READY',
    GAME_RESET: 'GAME_RESET',
    GAME_OVER: 'GAME_OVER',

    PHASE_CHANGED: 'PHASE_CHANGED',
    SCORE_CHANGED: 'SCORE_CHANGED',
    STREAK_CHANGED: 'STREAK_CHANGED',
    ERROR_REPORTED: 'ERROR_REPORTED',

    CATEGORY_SELECTED: 'CATEGORY_SELECTED',
    CLUE_SELECTED: 'CLUE_SELECTED',
    CLUE_LOADED: 'CLUE_LOADED',
    CLUE_REVEALED: 'CLUE_REVEALED',

    ANSWER_SUBMITTED: 'ANSWER_SUBMITTED',
    ANSWER_CORRECT: 'ANSWER_CORRECT',
    ANSWER_INCORRECT: 'ANSWER_INCORRECT',
    ANSWER_REVEALED: 'ANSWER_REVEALED',

    STREAK_MILESTONE: 'STREAK_MILESTONE',

    QUESTIONS_REQUESTED: 'QUESTIONS_REQUESTED',
    QUESTIONS_LOADED: 'QUESTIONS_LOADED',
    QUESTIONS_FAILED: 'QUESTIONS_FAILED',

    SHARD_REQUESTED: 'SHARD_REQUESTED',
    SHARD_LOADED: 'SHARD_LOADED',
    SHARD_FAILED: 'SHARD_FAILED',

    MEDIA_PREFLIGHT_STARTED: 'MEDIA_PREFLIGHT_STARTED',
    MEDIA_PREFLIGHT_PASSED: 'MEDIA_PREFLIGHT_PASSED',
    MEDIA_PREFLIGHT_REJECTED: 'MEDIA_PREFLIGHT_REJECTED',
    MEDIA_PREFLIGHT_EXHAUSTED: 'MEDIA_PREFLIGHT_EXHAUSTED',
    MEDIA_RUNTIME_FAILED: 'MEDIA_RUNTIME_FAILED',

    HOST_CHANGED: 'HOST_CHANGED',
    HOST_EXPRESSION_CHANGED: 'HOST_EXPRESSION_CHANGED',
    HOST_QUIP_REQUESTED: 'HOST_QUIP_REQUESTED',
    HOST_QUIP_SELECTED: 'HOST_QUIP_SELECTED',

    AUDIO_REQUESTED: 'AUDIO_REQUESTED',
    AUDIO_READY: 'AUDIO_READY',
    AUDIO_PLAYED: 'AUDIO_PLAYED',
    AUDIO_FAILED: 'AUDIO_FAILED',
    AUDIO_MUTED: 'AUDIO_MUTED',

    TELEMETRY_RECORDED: 'TELEMETRY_RECORDED',
  });

  const GamePhases = Object.freeze({
    IDLE: 'idle',
    LOADING: 'loading',
    BOARD: 'board',
    CLUE: 'clue',
    ANSWERING: 'answering',
    REVEALING: 'revealing',
    TRANSITION: 'transition',
    GAME_OVER: 'gameover',
  });

  const NetworkStates = Object.freeze({
    ONLINE: 'online',
    DEGRADED: 'degraded',
    OFFLINE: 'offline',
  });

  const AudioStates = Object.freeze({
    READY: 'ready',
    BUFFERING: 'buffering',
    FAILED: 'failed',
    MUTED: 'muted',
  });

  const ScoreRules = Object.freeze({
    correctMultiplier: 1,
    incorrectScoreMode: 'reset-to-zero',
    streakMilestones: [3, 5, 10],
    allowNegativeScore: false,
  });

  return {
    GameEvents,
    GamePhases,
    NetworkStates,
    AudioStates,
    ScoreRules,
  };
}));
