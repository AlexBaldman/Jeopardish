import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFile } from 'node:fs/promises';

const require = createRequire(import.meta.url);
const { EventBus } = require('../src/core/event-bus.js');
const { GameEvents } = require('../src/contracts/events.js');
const {
  InputCommands,
  InputController,
  InputSources,
  isEditableTarget,
} = require('../src/application/input-controller.js');
const appSource = await readFile(new URL('../app.js', import.meta.url), 'utf8');

function createHarness({ advanceReady = false, handlers = {} } = {}) {
  const eventBus = new EventBus({ now: () => 'now' });
  const events = [];
  const calls = [];
  eventBus.on('*', (event) => events.push(event));
  const allHandlers = Object.fromEntries(
    Object.values(InputCommands).map((command) => [
      command,
      (payload, meta) => {
        calls.push({ command, payload, meta });
        return command;
      },
    ]),
  );
  const listeners = {};
  const documentRef = {
    addEventListener: (type, listener) => { listeners[type] = listener; },
    removeEventListener: (type, listener) => {
      if (listeners[type] === listener) delete listeners[type];
    },
  };
  const controller = new InputController({
    eventBus,
    handlers: { ...allHandlers, ...handlers },
    documentRef,
    isAdvanceReady: () => advanceReady,
  });
  return { controller, events, calls, listeners };
}

test('InputController maps renderer callbacks into one command vocabulary', async () => {
  const harness = createHarness();
  const bindings = harness.controller.createRendererBindings();

  await bindings.onNewQuestion();
  await bindings.onToggleAnswer();
  await bindings.onCheckAnswer();
  await bindings.onToggleVoice({ listen: true });
  await bindings.onPreviousHostSkin();
  await bindings.onNextDialogueStyle();
  await bindings.onReviewSavedClues();
  await bindings.onStudyAction('why');
  await bindings.onSubmitReinforcement('three');
  await bindings.onConfidence('shaky');
  await bindings.onDispute();

  assert.deepEqual(
    harness.calls.map(({ command }) => command),
    [
      InputCommands.NEW_CLUE,
      InputCommands.REVEAL_ANSWER,
      InputCommands.SUBMIT_ANSWER,
      InputCommands.LISTEN_VOICE,
      InputCommands.PREVIOUS_HOST,
      InputCommands.NEXT_DIALOGUE,
      InputCommands.REVIEW_SAVED_CLUES,
      InputCommands.SELECT_STUDY_ACTION,
      InputCommands.SUBMIT_REINFORCEMENT,
      InputCommands.SET_CONFIDENCE,
      InputCommands.TOGGLE_DISPUTE,
    ],
  );
  assert.deepEqual(harness.calls.at(-2).payload, { confidence: 'shaky' });
  assert.deepEqual(
    harness.calls.find(({ command }) => command === InputCommands.SUBMIT_REINFORCEMENT).payload,
    { answer: 'three' },
  );
  assert.ok(harness.calls.every(({ meta }) => meta.source === InputSources.UI));
});

test('InputController owns keyboard shortcuts and suppresses unsafe repeats', async () => {
  const harness = createHarness({ advanceReady: true });
  assert.equal(harness.controller.bindKeyboard(), true);
  assert.equal(harness.controller.bindKeyboard(), false);

  const createEvent = (overrides = {}) => ({
    key: 'q',
    preventDefault() { this.defaultPreventedByController = true; },
    ...overrides,
  });
  const enter = createEvent({ key: 'Enter', target: { tagName: 'INPUT' } });
  harness.listeners.keydown(enter);
  harness.listeners.keydown(createEvent({ key: 'q', repeat: true }));
  harness.listeners.keydown(createEvent({ key: 'a', ctrlKey: true }));
  harness.listeners.keydown(createEvent({ key: 'q', target: { tagName: 'TEXTAREA' } }));
  harness.listeners.keydown(createEvent({ key: 'd', target: { tagName: 'BUTTON' } }));
  await new Promise((resolve) => setTimeout(resolve, 0));

  assert.equal(enter.defaultPreventedByController, true);
  assert.deepEqual(
    harness.calls.map(({ command }) => command),
    [InputCommands.NEW_CLUE, InputCommands.ENTER_STUDY],
  );
  assert.ok(harness.calls.every(({ meta }) => meta.source === InputSources.KEYBOARD));
  assert.equal(harness.controller.destroy(), true);
  assert.equal(harness.listeners.keydown, undefined);
});

test('InputController routes voice commands and spoken answers through the same handlers', async () => {
  const harness = createHarness();

  await harness.controller.routeVoiceIntent({ type: 'answer', answer: 'Marie Curie' });
  await harness.controller.routeVoiceIntent({ type: 'command', command: 'toggle-language' });
  assert.equal(
    await harness.controller.routeVoiceIntent({ type: 'command', command: 'invent-rule' }),
    false,
  );

  assert.deepEqual(harness.calls.slice(0, 2).map(({ command, payload, meta }) => ({
    command,
    payload,
    source: meta.source,
  })), [
    {
      command: InputCommands.SUBMIT_SPOKEN_ANSWER,
      payload: { answer: 'Marie Curie' },
      source: InputSources.VOICE,
    },
    {
      command: InputCommands.TOGGLE_LANGUAGE,
      payload: {},
      source: InputSources.VOICE,
    },
  ]);
  assert.equal(
    harness.events.filter((event) => event.type === GameEvents.VOICE_COMMAND).length,
    3,
  );
  assert.ok(harness.events.some((event) => event.type === GameEvents.INPUT_COMMAND_REJECTED));
});

test('InputController contains command failures and reports them without leaking payloads', async () => {
  const harness = createHarness({
    handlers: {
      [InputCommands.NEW_CLUE]: () => {
        throw new Error('studio offline');
      },
    },
  });

  assert.equal(await harness.controller.dispatch(
    InputCommands.NEW_CLUE,
    { privateAnswer: 'secret' },
    { source: InputSources.UI },
  ), false);
  const error = harness.events.find((event) => event.type === GameEvents.ERROR_REPORTED);
  assert.equal(error.payload.code, 'input-command-failed');
  assert.equal(error.payload.command, InputCommands.NEW_CLUE);
  assert.equal(Object.hasOwn(error.payload, 'privateAnswer'), false);
});

test('editable target detection covers form fields and contenteditable regions', () => {
  assert.equal(isEditableTarget({ tagName: 'INPUT' }), true);
  assert.equal(isEditableTarget({ nodeName: 'select' }), true);
  assert.equal(isEditableTarget({ isContentEditable: true }), true);
  assert.equal(isEditableTarget({ tagName: 'BUTTON' }), false);
});

test('app coordination delegates keyboard and voice command mapping to InputController', () => {
  assert.doesNotMatch(appSource, /addEventListener\(['"]keydown/);
  assert.doesNotMatch(appSource, /case\s+voiceModule\.VoiceCommands/);
  assert.match(appSource, /inputController\.createRendererBindings\(\)/);
  assert.match(appSource, /inputController\?\.routeVoiceIntent\(intent\)/);
});
