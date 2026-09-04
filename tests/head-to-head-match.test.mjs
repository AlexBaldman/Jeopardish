import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  MATCH_COMMAND_SCHEMA,
  MATCH_SCHEMA,
  MatchCommandTypes,
  MatchPhases,
  applyMatchCommand,
  canStartMatch,
  createMatchCommand,
  createMatchState,
  createPublicCommandReceipt,
  finishMatch,
} = require('../src/modes/head-to-head/match.js');

let commandSequence = 0;

function makeCommand(state, type, actorId, {
  payload = {},
  roundIndex = null,
  matchId = state.matchId,
} = {}) {
  commandSequence += 1;
  return createMatchCommand({
    id: `command-${commandSequence}`,
    matchId,
    actorId,
    type,
    roundIndex,
    payload,
  });
}

function clue(index, extra = {}) {
  return {
    id: `clue-${index}`,
    prompt: `Public clue ${index}?`,
    category: 'Proof',
    value: 100 * index,
    ...extra,
  };
}

function readyLobby({ totalRounds = 5 } = {}) {
  let state = createMatchState({
    matchId: 'match-1',
    host: { id: 'host', nickname: 'Host' },
    totalRounds,
  });
  state = applyMatchCommand(state, makeCommand(
    state,
    MatchCommandTypes.JOIN,
    'guest',
    { payload: { player: { id: 'guest', nickname: 'Guest' } } },
  ));
  state = applyMatchCommand(state, makeCommand(
    state,
    MatchCommandTypes.SET_READY,
    'host',
    { payload: { ready: true } },
  ));
  state = applyMatchCommand(state, makeCommand(
    state,
    MatchCommandTypes.SET_READY,
    'guest',
    { payload: { ready: true } },
  ));
  return state;
}

function startMatch(state, firstClue = clue(1)) {
  return applyMatchCommand(
    state,
    makeCommand(state, MatchCommandTypes.START, state.hostId),
    { clue: firstClue },
  );
}

function submit(state, actorId, answer, reveal = null) {
  return applyMatchCommand(
    state,
    makeCommand(state, MatchCommandTypes.SUBMIT_ANSWER, actorId, {
      roundIndex: state.roundIndex,
      payload: { answer },
    }),
    reveal ? { reveal } : {},
  );
}

test('Head-to-Head creates transport-neutral immutable public match truth', () => {
  const state = createMatchState({
    matchId: 'match-proof',
    host: { id: 'host', nickname: 'Captain' },
  });

  assert.equal(state.schema, MATCH_SCHEMA);
  assert.equal(state.phase, MatchPhases.LOBBY);
  assert.equal(state.roundIndex, -1);
  assert.equal('roomId' in state, false);
  assert.equal('joinCode' in state, false);
  assert.equal(Object.isFrozen(state), true);
  assert.equal(Object.isFrozen(state.players), true);
  assert.equal(Object.isFrozen(state.players[0]), true);
  assert.throws(() => createMatchState({
    matchId: 'bad-round-count',
    host: { id: 'host', nickname: 'Host' },
    totalRounds: 0,
  }), /totalRounds/);
});

test('lobby commands require two ready players and replay idempotently', () => {
  let state = createMatchState({
    matchId: 'match-1',
    host: { id: 'host', nickname: 'Host' },
  });
  const join = makeCommand(state, MatchCommandTypes.JOIN, 'guest', {
    payload: { player: { id: 'guest', nickname: 'Guest' } },
  });
  state = applyMatchCommand(state, join);
  assert.equal(canStartMatch(state), false);
  assert.equal(applyMatchCommand(state, join), state);

  const hostReady = makeCommand(state, MatchCommandTypes.SET_READY, 'host', {
    payload: { ready: true },
  });
  state = applyMatchCommand(state, hostReady);
  assert.equal(applyMatchCommand(state, hostReady), state);
  state = applyMatchCommand(state, makeCommand(
    state,
    MatchCommandTypes.SET_READY,
    'guest',
    { payload: { ready: true } },
  ));
  assert.equal(canStartMatch(state), true);
});

test('membership and host authority fail closed before transport exists', () => {
  const lobby = readyLobby();
  const thirdPlayer = makeCommand(lobby, MatchCommandTypes.JOIN, 'outsider', {
    payload: { player: { id: 'outsider', nickname: 'Third Wheel' } },
  });
  assert.equal(applyMatchCommand(lobby, thirdPlayer), lobby);

  const guestStart = makeCommand(lobby, MatchCommandTypes.START, 'guest');
  assert.equal(applyMatchCommand(lobby, guestStart, { clue: clue(1) }), lobby);

  const wrongMatch = makeCommand(lobby, MatchCommandTypes.START, 'host', {
    matchId: 'some-other-match',
  });
  assert.equal(applyMatchCommand(lobby, wrongMatch, { clue: clue(1) }), lobby);
});

test('opening a round allowlists public clue fields and discards answer truth', () => {
  const state = startMatch(readyLobby(), clue(1, {
    answer: 'PRIVATE ANSWER',
    acceptedAnswers: ['PRIVATE ALIAS'],
    explanation: 'PRIVATE EXPLANATION',
    unexpected: { secret: 'PRIVATE OBJECT' },
  }));

  assert.deepEqual(state.round.clue, {
    id: 'clue-1',
    prompt: 'Public clue 1?',
    category: 'Proof',
    value: 100,
  });
  assert.doesNotMatch(
    JSON.stringify(state),
    /PRIVATE ANSWER|PRIVATE ALIAS|PRIVATE EXPLANATION|PRIVATE OBJECT/,
  );
  assert.equal(Object.isFrozen(state.round), true);
  assert.equal(Object.isFrozen(state.round.clue), true);
});

test('the first raw answer produces only a public submission receipt', () => {
  const started = startMatch(readyLobby());
  const privateCommand = makeCommand(
    started,
    MatchCommandTypes.SUBMIT_ANSWER,
    'host',
    { roundIndex: 0, payload: { answer: 'Jove' } },
  );
  const receipt = createPublicCommandReceipt(privateCommand);
  const waiting = applyMatchCommand(started, privateCommand);

  assert.equal(privateCommand.schema, MATCH_COMMAND_SCHEMA);
  assert.equal(Object.isFrozen(privateCommand), true);
  assert.equal('payload' in receipt, false);
  assert.doesNotMatch(JSON.stringify(receipt), /Jove/);
  assert.deepEqual(waiting.round.submittedPlayerIds, ['host']);
  assert.deepEqual(waiting.round.outcomes, {});
  assert.equal(waiting.round.answerReveal, null);
  assert.deepEqual(waiting.players.map((player) => player.score), [0, 0]);
  assert.doesNotMatch(JSON.stringify(waiting), /Jove/);
});

test('the final submission cannot publish without a complete private authority reveal', () => {
  const waiting = submit(startMatch(readyLobby()), 'host', 'Jove');
  assert.throws(
    () => submit(waiting, 'guest', 'Mars'),
    /private authority reveal/,
  );
  assert.deepEqual(waiting.round.submittedPlayerIds, ['host']);
  assert.equal(waiting.phase, MatchPhases.PLAYING);
});

test('the second submission atomically reveals correctness and kernel-owned scores', () => {
  const waiting = submit(startMatch(readyLobby(), clue(4)), 'host', 'Jove');
  const guestSubmission = makeCommand(
    waiting,
    MatchCommandTypes.SUBMIT_ANSWER,
    'guest',
    { roundIndex: 0, payload: { answer: 'Mars' } },
  );
  const reveal = {
    answerReveal: 'Jupiter',
    outcomes: {
      host: { isCorrect: true, points: 99999 },
      guest: { isCorrect: false, points: 99999 },
    },
  };
  const result = applyMatchCommand(waiting, guestSubmission, { reveal });

  assert.equal(result.phase, MatchPhases.ROUND_RESULT);
  assert.deepEqual(result.round.submittedPlayerIds, ['host', 'guest']);
  assert.equal(result.round.answerReveal, 'Jupiter');
  assert.deepEqual(result.round.outcomes, {
    host: { isCorrect: true, points: 400 },
    guest: { isCorrect: false, points: 0 },
  });
  assert.deepEqual(result.players.map((player) => player.score), [400, 0]);
  assert.doesNotMatch(JSON.stringify(result), /Jove|Mars|99999/);
  assert.equal(applyMatchCommand(result, guestSubmission, { reveal }), result);
});

test('atomic reveal rejects incomplete players and truthy non-booleans', () => {
  const waiting = submit(startMatch(readyLobby()), 'host', 'Jove');
  assert.throws(() => submit(waiting, 'guest', 'Mars', {
    answerReveal: 'Jupiter',
    outcomes: { host: { isCorrect: true } },
  }), /match the current players exactly/);
  assert.throws(() => submit(waiting, 'guest', 'Mars', {
    answerReveal: 'Jupiter',
    outcomes: {
      host: { isCorrect: 'false' },
      guest: { isCorrect: false },
    },
  }), /boolean isCorrect/);
});

test('round-bound command replay cannot affect a later round', () => {
  let state = submit(
    submit(startMatch(readyLobby({ totalRounds: 2 })), 'host', 'A'),
    'guest',
    'B',
    {
      answerReveal: 'C',
      outcomes: {
        host: { isCorrect: false },
        guest: { isCorrect: false },
      },
    },
  );
  const advanceRoundZero = makeCommand(state, MatchCommandTypes.NEXT_ROUND, 'host', {
    roundIndex: 0,
  });
  state = applyMatchCommand(state, advanceRoundZero, { clue: clue(2) });
  assert.equal(state.roundIndex, 1);

  const replayedAdvance = applyMatchCommand(state, advanceRoundZero, { clue: clue(3) });
  assert.equal(replayedAdvance, state);
  const staleAnswer = createMatchCommand({
    id: 'stale-round-zero-answer',
    matchId: state.matchId,
    actorId: 'host',
    type: MatchCommandTypes.SUBMIT_ANSWER,
    roundIndex: 0,
    payload: { answer: 'old answer' },
  });
  assert.equal(applyMatchCommand(state, staleAnswer), state);
  assert.deepEqual(state.round.submittedPlayerIds, []);
});

test('five deterministic rounds finish with stable tie ordering', () => {
  let state = startMatch(readyLobby({ totalRounds: 5 }));

  for (let round = 0; round < 5; round += 1) {
    state = submit(state, 'host', `host-private-${round}`);
    state = submit(state, 'guest', `guest-private-${round}`, {
      answerReveal: `Public answer ${round}`,
      outcomes: {
        host: { isCorrect: true },
        guest: { isCorrect: true },
      },
    });
    assert.equal(state.phase, MatchPhases.ROUND_RESULT);

    const next = makeCommand(state, MatchCommandTypes.NEXT_ROUND, 'host', {
      roundIndex: round,
    });
    state = applyMatchCommand(
      state,
      next,
      round < 4 ? { clue: clue(round + 2) } : {},
    );
  }

  assert.equal(state.phase, MatchPhases.COMPLETE);
  assert.deepEqual(state.winnerIds, ['host', 'guest']);
  assert.deepEqual(state.players.map((player) => player.score), [1500, 1500]);
  assert.equal(finishMatch(state), state);
});

test('command contracts reject ambiguous identity and unbounded private input', () => {
  const state = readyLobby();
  assert.throws(() => makeCommand(state, MatchCommandTypes.JOIN, 'guest-2', {
    payload: { player: { id: 'someone-else', nickname: 'Guest' } },
  }), /JOIN actor/);
  assert.throws(() => makeCommand(state, MatchCommandTypes.SET_READY, 'host', {
    payload: { ready: 'false' },
  }), /boolean ready/);
  assert.throws(() => makeCommand(state, MatchCommandTypes.SUBMIT_ANSWER, 'host', {
    roundIndex: 0,
    payload: { answer: 'x'.repeat(201) },
  }), /payload.answer/);
});
