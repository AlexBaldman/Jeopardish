(function initConsoleNarrator(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../contracts/events.js'));
  } else {
    root.JeopardishConsoleNarrator = factory(root.JeopardishContracts);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function consoleNarratorFactory(contracts) {
  'use strict';

  if (!contracts) {
    throw new Error('JeopardishConsoleNarrator requires JeopardishContracts.');
  }

  const { GameEvents } = contracts;

  class ConsoleNarrator {
    constructor({
      eventBus,
      consoleRef = globalThis.console,
      random = Math.random,
    } = {}) {
      if (!eventBus) {
        throw new Error('ConsoleNarrator requires an eventBus.');
      }

      this.eventBus = eventBus;
      this.console = consoleRef;
      this.random = random;
      this.unsubscribe = null;
    }

    start() {
      if (this.unsubscribe) {
        return this.unsubscribe;
      }

      this.say('📺 Welcome to JeoPARODY. The extra O has breached containment, the clues are suspicious, and Xander has produced credentials nobody requested.');
      this.unsubscribe = this.eventBus.on('*', (event) => this.narrate(event));
      return this.unsubscribe;
    }

    stop() {
      if (!this.unsubscribe) {
        return;
      }

      this.unsubscribe();
      this.unsubscribe = null;
    }

    narrate(event) {
      const message = this.getMessage(event);
      if (message) {
        this.say(message);
      }
    }

    say(message) {
      this.console?.log?.(`[JeoPARODY / Channel O] ${message}`);
    }

    getMessage(event) {
      const payload = event.payload || {};

      switch (event.type) {
        case GameEvents.APPLICATION_STARTED:
          return `🎚️ Composition root online. ${payload.voiceEnabled ? 'Voice is standing by' : 'Voice is off'}; every service has one chair and a name card.`;
        case GameEvents.APPLICATION_STOPPED:
          return `🧹 Composition root signing off (${payload.reason || 'normal shutdown'}). Pending cues and callbacks have been politely shown the exit.`;
        case GameEvents.GAME_INIT:
          return '🕯️ The game wakes up and immediately pretends this was its plan all along.';
        case GameEvents.QUESTIONS_REQUESTED:
          return '📚 The clue vault is being opened with a key labeled "probably fine."';
        case GameEvents.QUESTIONS_LOADED:
          return `📚 ${formatNumber(payload.count)} clues marched in, alphabetized by confidence and mild panic.`;
        case GameEvents.QUESTIONS_FAILED:
          return `🧯 The clue vault coughed smoke: ${payload.message || 'unknown mischief'}.`;
        case GameEvents.EPISODE_SOURCE_REQUESTED:
          return '🗂️ The episode desk is opening tonight’s rundown. The staples are ceremonial; the schema is not.';
        case GameEvents.EPISODE_SOURCE_LOADED:
          return `📦 Episode source arrived as ${payload.format || 'unclassified paperwork'} with ${formatNumber(payload.count)} clue${payload.count === 1 ? '' : 's'}. Validation is checking the guest list.`;
        case GameEvents.EPISODE_SOURCE_FAILED:
          return `🧯 The episode source missed call time: ${payload.message || 'no explanation, just tremendous confidence'}.`;
        case GameEvents.EPISODE_FALLBACK_ACTIVATED:
          return `🛟 Tonight’s authored rundown missed the bus (${truncate(payload.reason || 'transport trouble')}). The archive understudy is entering from ${truncate(payload.fallbackSourceUrl || 'an undisclosed filing cabinet')}.`;
        case GameEvents.EPISODE_READY:
          return `🎞️ “${payload.title || 'Untitled Broadcast'}” is locked: ${payload.clueCount || 0} clues from ${formatNumber(payload.sourceCount)} available, ${payload.kind || 'mysterious'} edition${payload.resumed ? ', resuming in progress' : ''}.`;
        case GameEvents.EPISODE_RESTARTED:
          return `🔁 Episode ${payload.episodeId || 'unknown'} rewound to the opening clue. Continuity denies having seen any of this before.`;
        case GameEvents.GAME_READY:
          return '🛎️ The board is alive. The answers have put on little fake mustaches.';
        case GameEvents.ROUND_STARTED:
          return `🎬 ${payload.roundId || 'A new round'} has the floor. All older callbacks have been shown the door and given bus fare.`;
        case GameEvents.ROUND_PHASE_CHANGED:
          return this.describeRoundTransition(payload);
        case GameEvents.SESSION_STARTED:
          return `🎬 Season Zero rolls camera: ${payload.total || 0} clues, one contestant, and absolutely no permit from the trivia authorities.`;
        case GameEvents.SESSION_RESUMED:
          return `⏯️ The broadcast resumes at clue ${payload.current || 1} of ${payload.total || 0}. Continuity has been restored with tape and selective memory.`;
        case GameEvents.SESSION_PROGRESS:
          return `📍 Episode progress: ${payload.answered || 0}/${payload.total || 0}. Xander insists this is exactly where the plot thickens.`;
        case GameEvents.SESSION_COMPLETED:
          return `🏁 Broadcast complete. ${payload.counts?.correct || 0} correct and $${payload.score || 0} retained after accounting reviewed the footage.`;
        case GameEvents.SESSION_RESULT_ANNOTATED:
          return `🧾 Player note filed for ${truncate(payload.clueId || 'the latest clue')}: ${payload.confidence || 'confidence unrated'}${payload.disputed ? '; ruling disputed' : ''}. The score remains untouched, as civilized systems occasionally manage.`;
        case GameEvents.MEDIA_PREFLIGHT_STARTED:
          return `🔎 Media customs is inspecting ${payload.mediaCount || 0} attachment${payload.mediaCount === 1 ? '' : 's'}. Nobody enjoys this, which is how we know it matters.`;
        case GameEvents.MEDIA_PREFLIGHT_PASSED:
          return `✅ Media cleared for broadcast. ${payload.checked || 0} tiny bureaucratic stamp${payload.checked === 1 ? '' : 's'} applied.`;
        case GameEvents.MEDIA_PREFLIGHT_REJECTED:
          return `📼 Clue quietly escorted offstage: ${this.describeMediaFailures(payload.failures)}. Another clue is pretending not to stare.`;
        case GameEvents.MEDIA_PREFLIGHT_EXHAUSTED:
          return `🧯 Media customs rejected ${payload.attempts || 'several'} clues in a row. The emergency index card is being unfolded.`;
        case GameEvents.MEDIA_RUNTIME_FAILED:
          return `🚪 A media asset collapsed during broadcast (${payload.reason || 'unknown indignity'}). Xander has declared it an unscheduled clue change.`;
        case GameEvents.CLUE_LOADED:
          return this.describeClue(payload);
        case GameEvents.ANSWER_SUBMITTED:
          return `✍️ The contestant offers "${truncate(payload.submittedAnswer || 'a mysterious silence')}". The room leans forward like it owes money.`;
        case GameEvents.ANSWER_CORRECT:
          return this.describeCorrect(payload);
        case GameEvents.ANSWER_INCORRECT:
          return this.describeIncorrect(payload);
        case GameEvents.STREAK_MILESTONE:
          return `🔥 Streak milestone: ${payload.streak}. The scoreboard fans itself with a tiny program.`;
        case GameEvents.STUDY_ENTERED:
          return `🧭 Study detour opened for clue ${truncate(payload.clueId || 'unknown')}. The score has been placed in a tamper-evident Canadian envelope.`;
        case GameEvents.STUDY_ACTION_SELECTED:
          return `🧠 Xander considers “${payload.actionId || 'something educational'}” using ${payload.grounding || 'mysterious'} grounding. Fabricated certainty has been denied entry.`;
        case GameEvents.STUDY_EXITED:
          return '↩️ Study detour closed. The exact round state returns, looking rested and insisting it never left.';
        case GameEvents.INPUT_COMMAND_DISPATCHED:
          return `🎛️ ${payload.source || 'unknown'} routed “${payload.command || 'unspecified'}” through the control desk. One command path, fewer alibis.`;
        case GameEvents.INPUT_COMMAND_REJECTED:
          return `⛔ ${payload.source || 'unknown'} requested “${payload.command || 'unspecified'}”, but the control desk found no authorized route.`;
        case GameEvents.VOICE_ENABLED:
          return `🎙️ Voice mode is live. Narration ${payload.capabilities?.narration ? 'ready' : 'unavailable'}; recognition ${payload.capabilities?.recognition ? 'ready' : 'unavailable'}. Xander has been asked not to answer himself.`;
        case GameEvents.VOICE_DISABLED:
          return '🔇 Voice mode signed off. Typed answers remain legally recognized in this jurisdiction.';
        case GameEvents.VOICE_LISTENING:
          return '🎧 Microphone open for one response. The host is maintaining a rare and medically significant silence.';
        case GameEvents.VOICE_TRANSCRIPT:
          return `📝 Speech transcript received: “${truncate(payload.transcript || 'inaudible Canadian murmuring')}”.`;
        case GameEvents.VOICE_COMMAND:
          return payload.type === 'answer'
            ? `🗣️ Spoken response routed to the same fair judge: “${truncate(payload.answer)}”.`
            : `🎛️ Voice command accepted: ${payload.command || 'unspecified studio business'}.`;
        case GameEvents.VOICE_FAILED:
          return `🎙️ Voice desk unavailable: ${payload.code || payload.message || 'the microphone has invoked its right to remain silent'}.`;
        case GameEvents.ERROR_REPORTED:
          return `⚠️ The rules desk has raised one eyebrow: ${payload.message || 'something got weird'}.`;
        default:
          return '';
      }
    }

    describeClue(payload) {
      const clue = payload.clue || {};
      const category = String(clue.category || 'Unknown Category').toUpperCase();
      const value = `$${payload.clueValue || 0}`;
      const openers = [
        '🎲 New clue hits the felt',
        '🃏 Fresh clue, still warm from the printer',
        '📣 The board clears its throat',
      ];

      return `${this.pick(openers)}: ${category} for ${value}. ${truncate(clue.question || 'The clue has chosen silence.')}`;
    }

    describeRoundTransition(payload) {
      const transitions = {
        answering: '🟢 Input is live. The judging desk is accepting one answer and no interpretive dance.',
        judging: '⚖️ Answer locked. The deterministic judge is comparing letters while the host pretends to receive a ruling by wire.',
        'advance-ready': '⏭️ Round sealed. Score mutations are closed; the next clue may approach the bench.',
        paused: '⏸️ Round paused. Timers are cancelled and the score is under glass.',
        idle: '🎚️ Round returned to idle. The studio is sweeping up any unfinished callbacks.',
      };
      const message = transitions[payload.nextPhase];
      if (!message) return '';
      const reason = payload.reason ? ` Reason: ${payload.reason}.` : '';
      return `${message}${reason}`;
    }

    describeCorrect(payload) {
      const flourishes = [
        'the neurons form a conga line',
        'the scoreboard does a tasteful little shimmy',
        'the clue exits, defeated but oddly respectful',
      ];
      const judgeNote = payload.answerMatch?.reason === 'fuzzy'
        ? ' The judges allow the tiny typo.'
        : payload.answerMatch?.reason === 'variation'
          ? ' The judges accept that equivalent response.'
          : '';

      return `✅ Correct for +$${payload.scoreDelta}. Streak ${payload.currentStreak}; score $${payload.newScore}.${judgeNote} ${this.pick(flourishes)}.`;
    }

    describeIncorrect(payload) {
      const correctAnswer = payload.correctAnswer || 'the truth, lurking nearby';
      const flourishes = [
        'A tiny cloud passes over the podium.',
        'The streak packs a small suitcase and leaves no forwarding address.',
        'Somewhere, an index card sighs dramatically.',
      ];

      return `❌ Not it. The answer was "${truncate(correctAnswer)}". Score $${payload.newScore}. ${this.pick(flourishes)}`;
    }

    describeMediaFailures(failures = []) {
      const reasons = failures.map((failure) => failure.reason).filter(Boolean);
      return reasons.length ? reasons.join(', ') : 'the attachment failed to produce identification';
    }

    pick(items) {
      return items[Math.floor(this.random() * items.length)] || items[0] || '';
    }
  }

  function formatNumber(value) {
    const number = Number(value);
    return Number.isFinite(number) ? number.toLocaleString() : 'Several';
  }

  function truncate(value, maxLength = 140) {
    const text = String(value).replace(/\s+/g, ' ').trim();
    if (text.length <= maxLength) {
      return text;
    }

    return `${text.slice(0, maxLength - 1)}…`;
  }

  return {
    ConsoleNarrator,
  };
}));
