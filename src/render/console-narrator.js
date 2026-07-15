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
        case GameEvents.GAME_INIT:
          return '🕯️ The game wakes up and immediately pretends this was its plan all along.';
        case GameEvents.QUESTIONS_REQUESTED:
          return '📚 The clue vault is being opened with a key labeled "probably fine."';
        case GameEvents.QUESTIONS_LOADED:
          return `📚 ${formatNumber(payload.count)} clues marched in, alphabetized by confidence and mild panic.`;
        case GameEvents.QUESTIONS_FAILED:
          return `🧯 The clue vault coughed smoke: ${payload.message || 'unknown mischief'}.`;
        case GameEvents.GAME_READY:
          return '🛎️ The board is alive. The answers have put on little fake mustaches.';
        case GameEvents.SESSION_STARTED:
          return `🎬 Season Zero rolls camera: ${payload.total || 0} clues, one contestant, and absolutely no permit from the trivia authorities.`;
        case GameEvents.SESSION_RESUMED:
          return `⏯️ The broadcast resumes at clue ${payload.current || 1} of ${payload.total || 0}. Continuity has been restored with tape and selective memory.`;
        case GameEvents.SESSION_PROGRESS:
          return `📍 Episode progress: ${payload.answered || 0}/${payload.total || 0}. Xander insists this is exactly where the plot thickens.`;
        case GameEvents.SESSION_COMPLETED:
          return `🏁 Broadcast complete. ${payload.counts?.correct || 0} correct and $${payload.score || 0} retained after accounting reviewed the footage.`;
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
