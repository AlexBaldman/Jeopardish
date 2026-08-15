'use strict';

const tickerMessages = {
    welcome: [
      'Welcome to Jeopardish: legally distinct, spiritually chaotic.',
      'The board is hot, the clues are weird, and your streak is watching.',
    ],
    correct: [
      'Correct. The score meter just lit up.',
      'That answer had clean footwork.',
      'The judges accept it, and the imaginary crowd goes medium-wild.',
    ],
    incorrect: [
      'Nope. Into the review pile it goes.',
      'A noble miss. The archive will remember.',
      'Incorrect, but now the clue has unfinished business with you.',
    ],
    peek: [
      'Reveal used. Wisdom gained, points denied.',
      'Peeking is learning with a trench coat on.',
    ],
    streak: [
      'Streak bonus online.',
      'You are officially cooking with category gas.',
    ],
    review: [
      'Review mode: old enemies, new confidence.',
      'Running back the misses. This is where learning gets teeth.',
    ],
    roulette: [
      'Category Roulette: High risk, 2x reward.',
      'Spin the wheel, pick your poison, double your glory.',
      'Five questions, one category, infinite possibilities.',
    ],
    lightning: [
      'Lightning Round: 60 seconds of pure adrenaline.',
      'Speed is everything. Points scale with your reflexes.',
      'Rapid-fire trivia. No time to think, just answer.',
    ],
    'date-spin': [
      'Date Spin: Travel through Jeopardy history.',
      'Pick a date, pick a category, make your mark.',
      'The wheel of time spins. Where will it land?',
    ],
  };

export function randomFrom(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

export function setText(el, text) {
    el.textContent = text;
  }

export function bindDom() {
    return {
      answerForm: document.getElementById('answerForm'),
      checkButton: document.getElementById('checkButton'),
      answerButton: document.getElementById('answerButton'),
      questionButton: document.getElementById('questionButton'),
      resetButton: document.getElementById('resetButton'),
      quickModeButton: document.getElementById('quickModeButton'),
      reviewModeButton: document.getElementById('reviewModeButton'),
      dailyModeButton: document.getElementById('dailyModeButton'),
      lightningModeButton: document.getElementById('lightningModeButton'),
      rouletteModeButton: document.getElementById('rouletteModeButton'),
      dateSpinModeButton: document.getElementById('dateSpinModeButton'),
      menuToggle: document.getElementById('menuToggle'),
      controlPanel: document.getElementById('controlPanel'),
      userInput: document.getElementById('inputbox'),
      statusMessage: document.getElementById('statusMessage'),
      questionBox: document.getElementById('questionBox'),
      answerBox: document.getElementById('answerBox'),
      clueCard: document.getElementById('clueCard'),
      dateSpinner: document.getElementById('dateSpinner'),
      categorySpinner: document.getElementById('categorySpinner'),
      currentStreak: document.getElementById('currentStreak'),
      bestStreak: document.getElementById('bestStreak'),
      accuracy: document.getElementById('accuracy'),
      reviewCount: document.getElementById('reviewCount'),
      score: document.getElementById('score'),
      highScore: document.getElementById('highScore'),
      scoreChip: document.getElementById('scoreChip'),
      tickerMessage: document.getElementById('tickerMessage'),
      hostImage: document.getElementById('hostImage'),
      badgeDisplay: document.getElementById('badgeDisplay'),
      soundToggle: document.getElementById('soundToggle'),
      lightningTimer: document.getElementById('lightningTimer'),
      heatmapDisplay: document.getElementById('heatmapDisplay'),
    };
  }

export function setTicker(dom, category, override) {
    const message = override || randomFrom(tickerMessages[category] || tickerMessages.welcome);
    setText(dom.tickerMessage, message);
  }

export function setControlsEnabled(dom, enabled) {
    dom.checkButton.disabled = !enabled;
    dom.answerButton.disabled = !enabled;
    dom.questionButton.disabled = !enabled;
  }

export function renderStats(dom, session, accuracy) {
    setText(dom.currentStreak, session.currentStreak);
    setText(dom.bestStreak, session.bestStreak);
    setText(dom.accuracy, `${accuracy}%`);
    setText(dom.reviewCount, session.missedClueIds.length);
    setText(dom.score, `Score: $${session.score}`);
    setText(dom.highScore, `High: $${session.highScore}`);
    setText(dom.scoreChip, `$${session.score}`);
  }

export function renderMode(dom, mode) {
    dom.quickModeButton.classList.toggle('active', mode === 'quick');
    dom.reviewModeButton.classList.toggle('active', mode === 'review');
    if (dom.dailyModeButton) dom.dailyModeButton.classList.toggle('active', mode === 'daily');
    if (dom.lightningModeButton) dom.lightningModeButton.classList.toggle('active', mode === 'lightning');
    if (dom.rouletteModeButton) dom.rouletteModeButton.classList.toggle('active', mode === 'roulette');
    if (dom.dateSpinModeButton) dom.dateSpinModeButton.classList.toggle('active', mode === 'date-spin');
  }

export function setStatus(dom, message) {
    setText(dom.statusMessage, message);
  }

export function logClueMeta(clue, clueValue, mode) {
    console.info('Jeopardish clue', {
      category: clue.category,
      value: clueValue,
      mode,
      id: clue.id,
    });
  }

export function renderClue(dom, clue, clueValue, mode) {
    setText(dom.statusMessage, mode === 'review' ? 'Review clue loaded.' : 'New clue loaded.');
    setText(dom.questionBox, clue.question);
    setText(dom.answerBox, clue.answer);
    logClueMeta(clue, clueValue, mode);

    dom.clueCard.classList.remove('correct', 'incorrect', 'peeked', 'dealing');
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        dom.clueCard.classList.add('dealing');
      });
    });
    dom.userInput.value = '';
    showAnswer(dom, false);
    setControlsEnabled(dom, true);
    dom.userInput.focus();
  }

export function showAnswer(dom, show) {
    dom.answerBox.hidden = !show;
    dom.answerButton.textContent = show ? 'Hide' : 'Reveal';
  }

export function renderResult(dom, result) {
    dom.clueCard.classList.toggle('correct', result.isCorrect);
    dom.clueCard.classList.toggle('incorrect', !result.isCorrect);
    dom.clueCard.classList.toggle('peeked', result.peekUsed);
    dom.hostImage.classList.remove('host-correct', 'host-incorrect', 'host-peeked');
    dom.hostImage.classList.add(result.peekUsed ? 'host-peeked' : result.isCorrect ? 'host-correct' : 'host-incorrect');
  }

export function toggleMenu(dom) {
    const isOpen = dom.controlPanel.classList.toggle('open');
    dom.menuToggle.setAttribute('aria-expanded', String(isOpen));
  }

export function renderBadges(dom, badges) {
  if (!dom.badgeDisplay) return;
  
  dom.badgeDisplay.innerHTML = '';
  
  if (badges.length === 0) {
    dom.badgeDisplay.innerHTML = '<div class="no-badges">No badges yet. Keep playing!</div>';
    return;
  }
  
  const recentBadges = badges.slice(-10).reverse();
  
  for (const badge of recentBadges) {
    const badgeEl = document.createElement('div');
    badgeEl.className = 'badge-item';
    badgeEl.title = `Earned: ${new Date(badge.earnedAt).toLocaleDateString()}`;
    badgeEl.innerHTML = `
      <span class="badge-item-icon">${badge.icon}</span>
      <div>
        <div class="badge-item-name">${badge.name}</div>
        <div class="badge-item-category">${badge.category}</div>
      </div>
    `;
    dom.badgeDisplay.appendChild(badgeEl);
  }
}

export function renderHeatmap(dom, heatmapData) {
  if (!dom.heatmapDisplay) return;
  
  dom.heatmapDisplay.innerHTML = '';
  
  if (heatmapData.length === 0) {
    dom.heatmapDisplay.innerHTML = '<div class="no-heatmap-data">Play some questions to see your knowledge heatmap!</div>';
    return;
  }
  
  for (const cell of heatmapData) {
    const cellEl = document.createElement('div');
    cellEl.className = 'heatmap-cell';
    
    if (cell.accuracy >= 90) {
      cellEl.classList.add('heatmap-cell-mastered');
    } else if (cell.accuracy >= 70) {
      cellEl.classList.add('heatmap-cell-strong');
    } else if (cell.accuracy >= 50) {
      cellEl.classList.add('heatmap-cell-learning');
    } else {
      cellEl.classList.add('heatmap-cell-weak');
    }
    
    cellEl.innerHTML = `
      <div class="heatmap-cell-name">${cell.category}</div>
      <div class="heatmap-cell-accuracy">${cell.accuracy}%</div>
      <div class="heatmap-cell-stats">${cell.total} questions</div>
    `;
    
    dom.heatmapDisplay.appendChild(cellEl);
  }
}
