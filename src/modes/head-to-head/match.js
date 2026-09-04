(function initHeadToHeadMatch(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYHeadToHeadMatch = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function headToHeadMatchFactory() {
  'use strict';

  const MATCH_SCHEMA = 'jeoparody.head-to-head.match';
  const MATCH_VERSION = 1;
  const MATCH_COMMAND_SCHEMA = 'jeoparody.head-to-head.command';
  const MATCH_COMMAND_VERSION = 1;
  const MATCH_RECEIPT_SCHEMA = 'jeoparody.head-to-head.command-receipt';
  const DEFAULT_ROUND_COUNT = 5;
  const MAX_ROUND_COUNT = 20;
  const MAX_PLAYERS = 2;

  const MatchPhases = Object.freeze({
    LOBBY: 'lobby',
    PLAYING: 'playing',
    ROUND_RESULT: 'round-result',
    COMPLETE: 'complete',
  });

  const MatchCommandTypes = Object.freeze({
    JOIN: 'JOIN',
    SET_READY: 'SET_READY',
    START: 'START',
    SUBMIT_ANSWER: 'SUBMIT_ANSWER',
    NEXT_ROUND: 'NEXT_ROUND',
  });

  const RESERVED_KEYS = new Set(['__proto__', 'constructor', 'prototype']);

  function invariant(condition, message) {
    if (!condition) throw new Error(message);
  }

  function deepFreeze(value) {
    if (!value || typeof value !== 'object' || Object.isFrozen(value)) return value;
    Object.values(value).forEach(deepFreeze);
    return Object.freeze(value);
  }

  function cleanToken(value, label, maxLength = 120) {
    const token = String(value || '').trim();
    const pattern = new RegExp(`^[a-zA-Z0-9][a-zA-Z0-9._:-]{0,${maxLength - 1}}$`);
    invariant(pattern.test(token) && !RESERVED_KEYS.has(token), `${label} is invalid.`);
    return token;
  }

  function cleanText(value, label, maxLength, fallback = '') {
    const text = String(value ?? '').replace(/\s+/g, ' ').trim() || fallback;
    invariant(text.length > 0 && text.length <= maxLength, `${label} is invalid.`);
    return text;
  }

  function normalizeRoundCount(value) {
    const count = Number(value);
    invariant(
      Number.isInteger(count) && count >= 1 && count <= MAX_ROUND_COUNT,
      `totalRounds must be an integer from 1 to ${MAX_ROUND_COUNT}.`,
    );
    return count;
  }

  function normalizePlayer(player, label = 'player') {
    return {
      id: cleanToken(player?.id, `${label}.id`),
      nickname: cleanText(player?.nickname, `${label}.nickname`, 28),
      ready: Boolean(player?.ready),
      score: Math.max(0, Number(player?.score) || 0),
    };
  }

  function normalizeClue(clue) {
    const value = Number(clue?.value);
    invariant(
      Number.isInteger(value) && value >= 1 && value <= 100000,
      'clue.value must be a positive bounded integer.',
    );
    return {
      id: cleanToken(clue?.id, 'clue.id'),
      prompt: cleanText(clue?.prompt, 'clue.prompt', 500),
      category: cleanText(clue?.category, 'clue.category', 80, 'General Knowledge'),
      value,
    };
  }

  function requireMatchState(state) {
    invariant(
      state?.schema === MATCH_SCHEMA && state?.version === MATCH_VERSION,
      'A versioned Head-to-Head match state is required.',
    );
    return state;
  }

  function cloneState(state) {
    return {
      ...state,
      players: state.players.map((player) => ({ ...player })),
      round: state.round
        ? {
          ...state.round,
          clue: { ...state.round.clue },
          submittedPlayerIds: [...state.round.submittedPlayerIds],
          outcomes: Object.fromEntries(
            Object.entries(state.round.outcomes).map(([playerId, outcome]) => [
              playerId,
              { ...outcome },
            ]),
          ),
        }
        : null,
      winnerIds: [...state.winnerIds],
    };
  }

  function finalize(state) {
    return deepFreeze(state);
  }

  function findPlayer(state, playerId) {
    return state.players.find((player) => player.id === playerId) || null;
  }

  function createMatchState({ matchId, host, totalRounds = DEFAULT_ROUND_COUNT } = {}) {
    const normalizedHost = normalizePlayer(host, 'host');
    normalizedHost.ready = false;
    normalizedHost.score = 0;
    return finalize({
      schema: MATCH_SCHEMA,
      version: MATCH_VERSION,
      matchId: cleanToken(matchId, 'matchId'),
      hostId: normalizedHost.id,
      phase: MatchPhases.LOBBY,
      revision: 0,
      totalRounds: normalizeRoundCount(totalRounds),
      roundIndex: -1,
      players: [normalizedHost],
      round: null,
      winnerIds: [],
    });
  }

  function addPlayer(state, player) {
    requireMatchState(state);
    if (state.phase !== MatchPhases.LOBBY) return state;
    const normalized = normalizePlayer(player);
    if (findPlayer(state, normalized.id)) return state;
    invariant(state.players.length < MAX_PLAYERS, 'This Head-to-Head match is full.');

    normalized.ready = false;
    normalized.score = 0;
    const next = cloneState(state);
    next.players.push(normalized);
    next.revision += 1;
    return finalize(next);
  }

  function setPlayerReady(state, playerId, ready) {
    requireMatchState(state);
    if (state.phase !== MatchPhases.LOBBY) return state;
    const id = cleanToken(playerId, 'playerId');
    const current = findPlayer(state, id);
    invariant(current, 'Player is not in this match.');
    invariant(typeof ready === 'boolean', 'ready must be a boolean.');
    if (current.ready === ready) return state;

    const next = cloneState(state);
    findPlayer(next, id).ready = ready;
    next.revision += 1;
    return finalize(next);
  }

  function canStartMatch(state) {
    requireMatchState(state);
    return state.phase === MatchPhases.LOBBY
      && state.players.length === MAX_PLAYERS
      && state.players.every((player) => player.ready);
  }

  function openRound(state, clue) {
    requireMatchState(state);
    const mayOpen = state.phase === MatchPhases.LOBBY
      ? canStartMatch(state)
      : state.phase === MatchPhases.ROUND_RESULT;
    invariant(mayOpen, 'Match cannot open a round from the current phase.');

    const nextIndex = state.roundIndex + 1;
    if (nextIndex >= state.totalRounds) return finishMatch(state);

    const next = cloneState(state);
    next.phase = MatchPhases.PLAYING;
    next.roundIndex = nextIndex;
    next.round = {
      index: nextIndex,
      clue: normalizeClue(clue),
      submittedPlayerIds: [],
      outcomes: {},
      answerReveal: null,
    };
    next.revision += 1;
    return finalize(next);
  }

  function recordSubmission(state, playerId) {
    requireMatchState(state);
    if (state.phase !== MatchPhases.PLAYING || !state.round) return state;
    const id = cleanToken(playerId, 'playerId');
    invariant(findPlayer(state, id), 'Player is not in this match.');
    if (state.round.submittedPlayerIds.includes(id)) return state;

    const next = cloneState(state);
    next.round.submittedPlayerIds.push(id);
    next.revision += 1;
    return finalize(next);
  }

  function hasEverySubmission(state) {
    requireMatchState(state);
    return Boolean(state.round)
      && state.players.length === MAX_PLAYERS
      && state.players.every((player) => state.round.submittedPlayerIds.includes(player.id));
  }

  function normalizeOutcomes(state, outcomes) {
    invariant(outcomes && typeof outcomes === 'object', 'Authority outcomes are required.');
    const expectedIds = state.players.map((player) => player.id);
    const receivedIds = Object.keys(outcomes);
    invariant(
      receivedIds.length === expectedIds.length
        && receivedIds.every((playerId) => expectedIds.includes(playerId)),
      'Authority outcomes must match the current players exactly.',
    );

    return Object.fromEntries(state.players.map((player) => {
      const outcome = outcomes[player.id];
      invariant(typeof outcome?.isCorrect === 'boolean', 'Each outcome needs boolean isCorrect.');
      return [player.id, {
        isCorrect: outcome.isCorrect,
        points: outcome.isCorrect ? state.round.clue.value : 0,
      }];
    }));
  }

  function revealRound(state, { answerReveal, outcomes } = {}) {
    requireMatchState(state);
    invariant(
      state.phase === MatchPhases.PLAYING && hasEverySubmission(state),
      'Round cannot reveal until both players have submitted.',
    );

    const publicOutcomes = normalizeOutcomes(state, outcomes);
    const next = cloneState(state);
    next.players.forEach((player) => {
      player.score += publicOutcomes[player.id].points;
    });
    next.phase = MatchPhases.ROUND_RESULT;
    next.round.outcomes = publicOutcomes;
    next.round.answerReveal = cleanText(answerReveal, 'answerReveal', 240);
    next.revision += 1;
    return finalize(next);
  }

  function finishMatch(state) {
    requireMatchState(state);
    if (state.phase === MatchPhases.COMPLETE) return state;
    invariant(
      state.phase === MatchPhases.ROUND_RESULT
        && state.roundIndex === state.totalRounds - 1,
      'Match cannot finish before its final round result.',
    );

    const next = cloneState(state);
    const highScore = Math.max(...next.players.map((player) => player.score));
    next.phase = MatchPhases.COMPLETE;
    next.winnerIds = next.players
      .filter((player) => player.score === highScore)
      .map((player) => player.id);
    next.revision += 1;
    return finalize(next);
  }

  function createMatchCommand({
    id,
    matchId,
    actorId,
    type,
    roundIndex = null,
    payload = {},
  } = {}) {
    invariant(Object.values(MatchCommandTypes).includes(type), 'Unknown match command type.');
    const normalizedActorId = cleanToken(actorId, 'command.actorId');
    let normalizedPayload = {};

    if (type === MatchCommandTypes.JOIN) {
      const player = normalizePlayer(payload.player, 'command.payload.player');
      invariant(player.id === normalizedActorId, 'JOIN actor must match the joining player.');
      normalizedPayload = { player: { id: player.id, nickname: player.nickname } };
    } else if (type === MatchCommandTypes.SET_READY) {
      invariant(typeof payload.ready === 'boolean', 'SET_READY requires boolean ready.');
      normalizedPayload = { ready: payload.ready };
    } else if (type === MatchCommandTypes.SUBMIT_ANSWER) {
      normalizedPayload = {
        answer: cleanText(payload.answer, 'command.payload.answer', 200),
      };
    }

    const roundBound = [
      MatchCommandTypes.SUBMIT_ANSWER,
      MatchCommandTypes.NEXT_ROUND,
    ].includes(type);
    if (roundBound) {
      invariant(
        Number.isInteger(roundIndex) && roundIndex >= 0,
        `${type} requires a non-negative roundIndex.`,
      );
    }

    return finalize({
      schema: MATCH_COMMAND_SCHEMA,
      version: MATCH_COMMAND_VERSION,
      id: cleanToken(id, 'command.id'),
      matchId: cleanToken(matchId, 'command.matchId'),
      actorId: normalizedActorId,
      type,
      roundIndex: roundBound ? roundIndex : null,
      payload: normalizedPayload,
    });
  }

  function createPublicCommandReceipt(command) {
    const normalized = createMatchCommand(command);
    return finalize({
      schema: MATCH_RECEIPT_SCHEMA,
      version: 1,
      commandId: normalized.id,
      matchId: normalized.matchId,
      actorId: normalized.actorId,
      type: normalized.type,
      roundIndex: normalized.roundIndex,
    });
  }

  function applyMatchCommand(state, command, authority = {}) {
    requireMatchState(state);
    const normalized = createMatchCommand(command);
    if (normalized.matchId !== state.matchId) return state;

    switch (normalized.type) {
      case MatchCommandTypes.JOIN:
        if (state.players.length >= MAX_PLAYERS) return state;
        return addPlayer(state, normalized.payload.player);

      case MatchCommandTypes.SET_READY:
        if (!findPlayer(state, normalized.actorId)) return state;
        return setPlayerReady(state, normalized.actorId, normalized.payload.ready);

      case MatchCommandTypes.START:
        if (normalized.actorId !== state.hostId || !canStartMatch(state)) return state;
        return openRound(state, authority.clue);

      case MatchCommandTypes.SUBMIT_ANSWER: {
        if (
          normalized.roundIndex !== state.roundIndex
          || !findPlayer(state, normalized.actorId)
        ) return state;
        const next = recordSubmission(state, normalized.actorId);
        if (next === state || !hasEverySubmission(next)) return next;
        invariant(
          authority.reveal,
          'The final submission requires a private authority reveal for atomic publication.',
        );
        return revealRound(next, authority.reveal);
      }

      case MatchCommandTypes.NEXT_ROUND:
        if (
          normalized.actorId !== state.hostId
          || normalized.roundIndex !== state.roundIndex
          || state.phase !== MatchPhases.ROUND_RESULT
        ) return state;
        return state.roundIndex === state.totalRounds - 1
          ? finishMatch(state)
          : openRound(state, authority.clue);

      default:
        return state;
    }
  }

  return {
    DEFAULT_ROUND_COUNT,
    MATCH_COMMAND_SCHEMA,
    MATCH_COMMAND_VERSION,
    MATCH_RECEIPT_SCHEMA,
    MATCH_SCHEMA,
    MATCH_VERSION,
    MAX_PLAYERS,
    MAX_ROUND_COUNT,
    MatchCommandTypes,
    MatchPhases,
    addPlayer,
    applyMatchCommand,
    canStartMatch,
    createMatchCommand,
    createMatchState,
    createPublicCommandReceipt,
    finishMatch,
    hasEverySubmission,
    openRound,
    recordSubmission,
    revealRound,
    setPlayerReady,
  };
}));
