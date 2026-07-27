'use strict';

(function exposeVisualFixtures(global) {
  const COPY = Object.freeze({
    clue: Object.freeze({
      category: 'Oddly Specific History',
      value: '$800',
      clue: 'This accidental invention began as a failed attempt to make a very strong adhesive.',
      answer: '',
      phase: 'awaiting-answer',
    }),
    reveal: Object.freeze({
      category: 'Oddly Specific History',
      value: '$800',
      clue: 'This accidental invention began as a failed attempt to make a very strong adhesive.',
      answer: 'What are Post-it Notes?',
      phase: 'advance-ready',
    }),
    correct: Object.freeze({
      category: 'Right on the Money',
      value: '+$800',
      clue: 'Correct. The adhesive failed magnificently and then became office supplies.',
      answer: 'Answer streak x4',
      phase: 'advance-ready',
    }),
    incorrect: Object.freeze({
      category: 'The Judges Have Spoken',
      value: '$0',
      clue: 'Not quite. Confidence is not legal tender, though television keeps trying.',
      answer: 'Correct response: What are Post-it Notes?',
      phase: 'advance-ready',
    }),
    menu: Object.freeze({
      category: 'Broadcast Paused',
      value: '$800',
      clue: 'The menu should remain sharp, readable, and entirely separate from the scoreboard.',
      answer: '',
      phase: 'awaiting-answer',
    }),
    scoreboard: Object.freeze({
      category: 'Numbers Department',
      value: '$1200',
      clue: 'The live scoreboard appears briefly when the score changes, then politely gets out of the way.',
      answer: '',
      phase: 'awaiting-answer',
    }),
    study: Object.freeze({
      category: 'Oddly Specific History',
      value: '$800',
      clue: 'This accidental invention began as a failed attempt to make a very strong adhesive.',
      answer: '',
      phase: 'paused',
    }),
    'voice-listening': Object.freeze({
      category: 'Oddly Specific History',
      value: '$800',
      clue: 'This accidental invention began as a failed attempt to make a very strong adhesive.',
      answer: '',
      phase: 'answering',
    }),
    'voice-speaking': Object.freeze({
      category: 'Oddly Specific History',
      value: '$800',
      clue: 'This accidental invention began as a failed attempt to make a very strong adhesive.',
      answer: '',
      phase: 'answering',
    }),
  });

  function appendCategory(document, container, fixture) {
    const heading = document.createElement('h2');
    heading.className = 'clue-category';
    const category = document.createElement('span');
    category.className = 'category-primary';
    category.textContent = fixture.category;
    heading.append(category);

    const value = document.createElement('p');
    value.className = 'clue-value';
    const amount = document.createElement('span');
    amount.className = 'clue-value-amount';
    amount.textContent = fixture.value;
    value.append(amount);
    container.replaceChildren(heading, value);
  }

  function apply(document, options = {}) {
    const fixtureName = COPY[options.fixture] ? options.fixture : 'clue';
    const fixture = COPY[fixtureName];
    const theme = options.theme === 'light' ? 'light' : 'dark';
    const container = document.getElementById('gameContainer');
    const categoryBox = document.getElementById('categoryBox');
    const clueText = document.getElementById('clueText');
    const answerBox = document.getElementById('answerBox');
    const menu = document.getElementById('navMenu');
    const menuButton = document.getElementById('hamburgerMenu');
    const score = document.getElementById('scoreDrawer');
    const study = document.getElementById('studyPanel');

    if (!container || !categoryBox || !clueText || !answerBox) return false;

    document.documentElement.dataset.visualFixture = fixtureName;
    document.body.dataset.theme = theme;
    const voiceFixture = fixtureName.startsWith('voice-');
    container.dataset.gameMoment = fixtureName === 'menu' || fixtureName === 'scoreboard' || voiceFixture
      ? 'clue'
      : fixtureName;
    container.dataset.roundPhase = fixture.phase;
    document.getElementById('speechBubble')?.setAttribute('data-dialogue-style', options.dialogue || 'clue-card');
    appendCategory(document, categoryBox, fixture);
    clueText.textContent = fixture.clue;
    answerBox.textContent = fixture.answer;
    document.getElementById('clueOriginal')?.setAttribute('hidden', '');
    document.getElementById('clueMedia')?.replaceChildren();

    const voiceState = voiceFixture ? fixtureName.replace('voice-', '') : 'idle';
    const voiceButton = document.getElementById('voiceButton');
    if (voiceButton) {
      voiceButton.disabled = false;
      voiceButton.dataset.state = voiceState;
      voiceButton.setAttribute('aria-pressed', String(voiceState === 'listening'));
    }
    const voiceLabel = document.getElementById('voiceState');
    if (voiceLabel) {
      voiceLabel.textContent = voiceState === 'listening' ? 'Listening...' : voiceState === 'speaking' ? 'Xander speaking' : 'Tap to answer';
    }
    const menuVoice = document.getElementById('menuVoice');
    menuVoice?.setAttribute('aria-pressed', String(voiceFixture));
    const menuVoiceState = document.getElementById('menuVoiceState');
    if (menuVoiceState) menuVoiceState.textContent = voiceFixture ? 'ON' : 'OFF';

    const menuOpen = fixtureName === 'menu';
    menu?.classList.toggle('active', menuOpen);
    menuButton?.setAttribute('aria-expanded', String(menuOpen));

    const scoreOpen = fixtureName === 'scoreboard';
    score?.classList.toggle('active', scoreOpen);
    if (score) {
      score.dataset.pinned = String(scoreOpen);
      score.setAttribute('aria-pressed', String(scoreOpen));
    }

    const studyOpen = fixtureName === 'study';
    if (study) {
      study.hidden = !studyOpen;
      study.setAttribute('aria-hidden', String(!studyOpen));
    }
    document.getElementById('gameContainer')?.classList.toggle('study-open', studyOpen);
    if (studyOpen) {
      document.getElementById('studyGrounding').textContent = 'Archive text only';
      document.getElementById('studyCategory').textContent = fixture.category;
      document.getElementById('studyQuestion').textContent = fixture.clue;
      document.getElementById('studyAnswer').textContent = 'What are Post-it Notes?';
      document.getElementById('studyResponse').textContent = 'The canonical response is protected while we take this useful little detour.';
    }

    const scoreValue = document.getElementById('hudScore');
    const streakValue = document.getElementById('hudStreak');
    const bestValue = document.getElementById('hudBest');
    const episodeValue = document.getElementById('hudEpisode');
    if (scoreValue) scoreValue.textContent = '$4,600';
    if (streakValue) streakValue.textContent = 'x4';
    if (bestValue) bestValue.textContent = 'x7';
    if (episodeValue) episodeValue.textContent = '6/10';

    return true;
  }

  global.JeoparodyVisualFixtures = Object.freeze({ apply, names: Object.keys(COPY) });
}(window));
