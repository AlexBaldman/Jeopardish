(function initInputController(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory(require('../contracts/events.js'), root);
  } else {
    root.JeoPARODYInputController = factory(root.JeopardishContracts, root);
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function inputControllerFactory(
  contracts,
  root,
) {
  'use strict';

  if (!contracts) throw new Error('InputController requires contracts.');

  const { GameEvents } = contracts;
  const InputCommands = Object.freeze({
    NEW_CLUE: 'new-clue',
    REVEAL_ANSWER: 'reveal-answer',
    SUBMIT_ANSWER: 'submit-answer',
    SUBMIT_SPOKEN_ANSWER: 'submit-spoken-answer',
    REPEAT_CLUE: 'repeat-clue',
    OPEN_MENU: 'open-menu',
    CLOSE_MENU: 'close-menu',
    TOGGLE_THEME: 'toggle-theme',
    TOGGLE_LANGUAGE: 'toggle-language',
    TOGGLE_SOUND: 'toggle-sound',
    TOGGLE_VOICE: 'toggle-voice',
    LISTEN_VOICE: 'listen-voice',
    DISABLE_VOICE: 'disable-voice',
    PREVIOUS_HOST: 'previous-host',
    NEXT_HOST: 'next-host',
    PREVIOUS_DIALOGUE: 'previous-dialogue',
    NEXT_DIALOGUE: 'next-dialogue',
    CYCLE_SCENE: 'cycle-scene',
    ENTER_STUDY: 'enter-study',
    REVIEW_SAVED_CLUES: 'review-saved-clues',
    SELECT_STUDY_ACTION: 'select-study-action',
    SUBMIT_REINFORCEMENT: 'submit-reinforcement',
    EXIT_STUDY: 'exit-study',
    SET_CONFIDENCE: 'set-confidence',
    TOGGLE_DISPUTE: 'toggle-dispute',
  });

  const InputSources = Object.freeze({
    UI: 'ui',
    KEYBOARD: 'keyboard',
    VOICE: 'voice',
  });

  const KEY_COMMANDS = Object.freeze({
    q: InputCommands.NEW_CLUE,
    a: InputCommands.REVEAL_ANSWER,
    v: InputCommands.NEXT_DIALOGUE,
    d: InputCommands.ENTER_STUDY,
    m: InputCommands.LISTEN_VOICE,
  });

  const VOICE_COMMANDS = Object.freeze({
    'new-clue': InputCommands.NEW_CLUE,
    'reveal-answer': InputCommands.REVEAL_ANSWER,
    'submit-answer': InputCommands.SUBMIT_ANSWER,
    'repeat-clue': InputCommands.REPEAT_CLUE,
    'open-menu': InputCommands.OPEN_MENU,
    'close-menu': InputCommands.CLOSE_MENU,
    study: InputCommands.ENTER_STUDY,
    'toggle-theme': InputCommands.TOGGLE_THEME,
    'toggle-language': InputCommands.TOGGLE_LANGUAGE,
    'toggle-sound': InputCommands.TOGGLE_SOUND,
    'voice-off': InputCommands.DISABLE_VOICE,
  });

  function isEditableTarget(target) {
    const tagName = String(target?.tagName || target?.nodeName || '').toLowerCase();
    return Boolean(
      target?.isContentEditable
      || tagName === 'input'
      || tagName === 'textarea'
      || tagName === 'select',
    );
  }

  class InputController {
    constructor({
      eventBus,
      handlers = {},
      documentRef = root?.document,
      isAdvanceReady = () => false,
    } = {}) {
      if (!eventBus) throw new Error('InputController requires an eventBus.');
      this.eventBus = eventBus;
      this.handlers = { ...handlers };
      this.document = documentRef || null;
      this.isAdvanceReady = isAdvanceReady;
      this.boundKeydown = (event) => this.handleKeydown(event);
      this.keyboardBound = false;
    }

    async dispatch(command, payload = {}, { source = InputSources.UI } = {}) {
      const handler = this.handlers[command];
      if (!Object.values(InputCommands).includes(command) || typeof handler !== 'function') {
        this.emit(GameEvents.INPUT_COMMAND_REJECTED, { command, source });
        return false;
      }

      this.emit(GameEvents.INPUT_COMMAND_DISPATCHED, { command, source });
      try {
        return await handler(payload, { command, source });
      } catch (error) {
        this.emit(GameEvents.ERROR_REPORTED, {
          code: 'input-command-failed',
          command,
          source,
          message: error?.message || String(error),
        });
        return false;
      }
    }

    createRendererBindings() {
      const dispatch = (command, payload) => (
        this.dispatch(command, payload, { source: InputSources.UI })
      );
      return {
        onToggleAnswer: () => dispatch(InputCommands.REVEAL_ANSWER),
        onNewQuestion: () => dispatch(InputCommands.NEW_CLUE),
        onCheckAnswer: () => dispatch(InputCommands.SUBMIT_ANSWER),
        onToggleTheme: () => dispatch(InputCommands.TOGGLE_THEME),
        onToggleLanguage: () => dispatch(InputCommands.TOGGLE_LANGUAGE),
        onToggleSound: () => dispatch(InputCommands.TOGGLE_SOUND),
        onToggleVoice: ({ listen = false } = {}) => dispatch(
          listen ? InputCommands.LISTEN_VOICE : InputCommands.TOGGLE_VOICE,
        ),
        onPreviousHostSkin: () => dispatch(InputCommands.PREVIOUS_HOST),
        onNextHostSkin: () => dispatch(InputCommands.NEXT_HOST),
        onPreviousDialogueStyle: () => dispatch(InputCommands.PREVIOUS_DIALOGUE),
        onNextDialogueStyle: () => dispatch(InputCommands.NEXT_DIALOGUE),
        onCycleScene: () => dispatch(InputCommands.CYCLE_SCENE),
        onEnterStudy: () => dispatch(InputCommands.ENTER_STUDY),
        onReviewSavedClues: () => dispatch(InputCommands.REVIEW_SAVED_CLUES),
        onStudyAction: (actionId) => dispatch(InputCommands.SELECT_STUDY_ACTION, { actionId }),
        onSubmitReinforcement: (answer) => dispatch(
          InputCommands.SUBMIT_REINFORCEMENT,
          { answer },
        ),
        onExitStudy: () => dispatch(InputCommands.EXIT_STUDY),
        onConfidence: (confidence) => dispatch(InputCommands.SET_CONFIDENCE, { confidence }),
        onDispute: () => dispatch(InputCommands.TOGGLE_DISPUTE),
      };
    }

    async routeVoiceIntent(intent) {
      if (!intent || intent.type === 'empty' || intent.type === 'unknown') return false;
      this.emit(GameEvents.VOICE_COMMAND, intent);

      if (intent.type === 'answer') {
        return this.dispatch(
          InputCommands.SUBMIT_SPOKEN_ANSWER,
          { answer: intent.answer },
          { source: InputSources.VOICE },
        );
      }

      const command = VOICE_COMMANDS[intent.command];
      if (!command) {
        this.emit(GameEvents.INPUT_COMMAND_REJECTED, {
          command: intent.command || 'unknown-voice-command',
          source: InputSources.VOICE,
        });
        return false;
      }
      return this.dispatch(command, {}, { source: InputSources.VOICE });
    }

    handleKeydown(event) {
      if (
        !event
        || event.defaultPrevented
        || event.repeat
        || event.metaKey
        || event.ctrlKey
        || event.altKey
      ) {
        return false;
      }

      const key = String(event.key || '').toLowerCase();
      if (key === 'enter' && this.isAdvanceReady()) {
        event.preventDefault?.();
        this.dispatch(InputCommands.NEW_CLUE, {}, { source: InputSources.KEYBOARD });
        return true;
      }
      if (isEditableTarget(event.target)) return false;

      const command = KEY_COMMANDS[key];
      if (!command) return false;
      event.preventDefault?.();
      this.dispatch(command, {}, { source: InputSources.KEYBOARD });
      return true;
    }

    bindKeyboard() {
      if (this.keyboardBound || !this.document?.addEventListener) return false;
      this.document.addEventListener('keydown', this.boundKeydown);
      this.keyboardBound = true;
      return true;
    }

    destroy() {
      if (!this.keyboardBound) return false;
      this.document?.removeEventListener?.('keydown', this.boundKeydown);
      this.keyboardBound = false;
      return true;
    }

    emit(type, payload = {}) {
      return this.eventBus.emit(type, payload, { source: 'InputController' });
    }
  }

  return {
    InputCommands,
    InputController,
    InputSources,
    isEditableTarget,
  };
}));
