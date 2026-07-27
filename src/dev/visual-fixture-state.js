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
      answerVisible: true,
    }),
    correct: Object.freeze({
      category: 'Right on the Money',
      value: '+$800',
      clue: 'Correct. The adhesive failed magnificently and then became office supplies.',
      answer: 'Answer streak x4',
      phase: 'advance-ready',
      answerVisible: true,
    }),
    incorrect: Object.freeze({
      category: 'The Judges Have Spoken',
      value: '$0',
      clue: 'Not quite. Confidence is not legal tender, though television keeps trying.',
      answer: 'Correct response: What are Post-it Notes?',
      phase: 'advance-ready',
      answerVisible: true,
    }),
    outcome: Object.freeze({
      category: 'Right on the Money',
      value: '',
      clue: 'Correct. +$800',
      answer: 'Correct response: What are Post-it Notes?\nExact match\nAnswer streak: 4',
      phase: 'advance-ready',
      moment: 'correct',
      answerVisible: true,
    }),
    translated: Object.freeze({
      category: 'ACIDENTES ÚTEIS',
      originalCategory: 'USEFUL ACCIDENTS',
      value: '$800',
      clue: 'Esta invenção acidental começou como uma tentativa fracassada de criar um adesivo muito forte.',
      originalClue: 'This accidental invention began as a failed attempt to make a very strong adhesive.',
      answer: 'O que são os Post-its?',
      phase: 'awaiting-answer',
      moment: 'clue',
    }),
    media: Object.freeze({
      category: 'PLANETAS COM ACESSÓRIOS',
      value: '$600',
      clue: 'Este gigante gasoso transformou anéis em uma decisão de moda.',
      answer: 'O que é Saturno?',
      phase: 'awaiting-answer',
      moment: 'clue',
      media: true,
    }),
    'media-modal': Object.freeze({
      category: 'PLANETAS COM ACESSÓRIOS',
      value: '$600',
      clue: 'Este gigante gasoso transformou anéis em uma decisão de moda.',
      answer: 'O que é Saturno?',
      phase: 'awaiting-answer',
      moment: 'clue',
      media: true,
      modal: true,
    }),
    complete: Object.freeze({
      category: 'BROADCAST COMPLETE',
      value: '',
      clue: 'BROADCAST O\n$6,400 final score · 70% accuracy',
      answer: 'Season Zero survived the airwaves.\n10 clues aired\n2 incorrect · 1 revealed · 0 skipped\n3 clues saved for review · 1 ruling flagged',
      phase: 'episode-complete',
      moment: 'complete',
      answerVisible: true,
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
    if (!fixture.value) {
      container.textContent = fixture.category;
      return;
    }

    const heading = document.createElement('h2');
    heading.className = 'clue-category';
    const category = document.createElement('span');
    category.className = 'category-primary';
    category.textContent = fixture.category;
    heading.append(category);

    if (fixture.originalCategory) {
      const original = document.createElement('span');
      original.className = 'category-original';
      original.lang = 'en';
      original.textContent = `EN · ${fixture.originalCategory}`;
      heading.append(original);
    }

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
    const outcome = document.getElementById('outcomeFeedback');
    const clueOriginal = document.getElementById('clueOriginal');
    const clueMedia = document.getElementById('clueMedia');
    const translationState = document.getElementById('translationState');
    const mediaModal = document.getElementById('mediaModal');
    const mediaModalBody = document.getElementById('mediaModalBody');

    if (!container || !categoryBox || !clueText || !answerBox) return false;

    document.documentElement.dataset.visualFixture = fixtureName;
    document.body.dataset.theme = theme;
    const voiceFixture = fixtureName.startsWith('voice-');
    container.dataset.gameMoment = fixture.moment || (
      fixtureName === 'menu' || fixtureName === 'scoreboard' || voiceFixture
        ? 'clue'
        : fixtureName
    );
    container.dataset.roundPhase = fixture.phase;
    document.getElementById('speechBubble')?.setAttribute('data-dialogue-style', options.dialogue || 'clue-card');
    appendCategory(document, categoryBox, fixture);
    clueText.textContent = fixture.clue;
    answerBox.textContent = fixture.answer;
    answerBox.style.display = fixture.answerVisible ? 'flex' : 'none';

    if (clueOriginal) {
      clueOriginal.textContent = fixture.originalClue ? `EN · ${fixture.originalClue}` : '';
      clueOriginal.hidden = !fixture.originalClue;
    }
    clueMedia?.replaceChildren();
    if (translationState) {
      translationState.dataset.status = fixtureName === 'translated' ? 'translated' : 'original';
      translationState.hidden = fixtureName !== 'translated';
    }
    const translationLabel = document.getElementById('translationStateLabel');
    if (translationLabel) translationLabel.textContent = fixtureName === 'translated' ? 'PT · MACHINE' : 'PT';

    if (outcome) outcome.hidden = fixtureName !== 'outcome';
    document.getElementById('confidenceKnew')?.setAttribute('aria-pressed', String(fixtureName === 'outcome'));
    document.getElementById('confidenceShaky')?.setAttribute('aria-pressed', 'false');
    document.getElementById('confidenceLearned')?.setAttribute('aria-pressed', 'false');
    document.getElementById('disputeButton')?.setAttribute('aria-pressed', 'false');

    if (fixture.media && clueMedia) {
      const preview = document.createElement('button');
      preview.type = 'button';
      preview.className = 'media-preview media-preview-image';
      preview.setAttribute('aria-label', 'Open image clue: Saturn ring diagram');
      const thumbnail = document.createElement('img');
      thumbnail.className = 'media-thumbnail';
      thumbnail.src = 'assets/episodes/season-zero/saturn-rings.svg';
      thumbnail.alt = '';
      const label = document.createElement('span');
      label.className = 'media-preview-label';
      label.textContent = 'Saturn ring diagram';
      preview.append(thumbnail, label);
      clueMedia.append(preview);
    }

    const modalOpen = Boolean(fixture.modal);
    if (mediaModal) {
      mediaModal.hidden = !modalOpen;
      mediaModal.setAttribute('aria-hidden', String(!modalOpen));
    }
    document.body.classList.toggle('modal-open', modalOpen);
    mediaModalBody?.replaceChildren();
    if (modalOpen && mediaModalBody) {
      document.getElementById('mediaModalType').textContent = 'IMAGE CLUE';
      document.getElementById('mediaModalTitle').textContent = 'Saturn ring diagram';
      const viewer = document.createElement('img');
      viewer.className = 'media-viewer media-viewer-image';
      viewer.src = 'assets/episodes/season-zero/saturn-rings.svg';
      viewer.alt = 'Illustrated diagram of Saturn and its rings';
      mediaModalBody.append(viewer);
    }

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
    if (fixtureName === 'complete') {
      if (scoreValue) scoreValue.textContent = '$6,400';
      if (episodeValue) episodeValue.textContent = '10/10';
    }

    return true;
  }

  global.JeoparodyVisualFixtures = Object.freeze({ apply, names: Object.keys(COPY) });
}(window));
