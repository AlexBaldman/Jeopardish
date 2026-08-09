(function initScoreboardView(root, factory) {
  if (typeof module === 'object' && module.exports) {
    module.exports = factory();
  } else {
    root.JeoPARODYScoreboardView = factory();
  }
}(typeof globalThis !== 'undefined' ? globalThis : this, function scoreboardViewFactory() {
  'use strict';

  class ScoreboardView {
    constructor({
      dom,
      getCopy,
      setText,
      setTimer = (...args) => globalThis.setTimeout(...args),
      clearTimer = (...args) => globalThis.clearTimeout(...args),
    } = {}) {
      if (!dom || typeof getCopy !== 'function' || typeof setText !== 'function') {
        throw new Error('ScoreboardView requires DOM, copy, and text presentation adapters.');
      }
      this.dom = dom;
      this.getCopy = getCopy;
      this.setText = setText;
      this.setTimer = setTimer;
      this.clearTimer = clearTimer;
      this.drawerTimer = null;
      this.drawerTimerGeneration = 0;
      this.tileTimers = new WeakMap();
      this.activeTileTimers = new Set();
      this.lastScore = null;
      this.lastStreak = null;
      this.lastBestStreak = null;
      this.lastEpisodeValue = null;
      this.pointerInside = false;
      this.focusInside = false;
      this.bound = false;
    }

    bindInteractions() {
      if (this.bound || !this.dom.scoreDrawer) return false;
      this.bound = true;
      this.setPinned(this.dom.scoreDrawer.dataset.pinned === 'true');
      this.syncDrawerState(
        this.dom.scoreDrawer.classList.contains('active') ? 'expanded' : 'hidden',
      );
      this.dom.scoreDrawer.addEventListener('pointerenter', () => {
        this.pointerInside = true;
        this.showDrawer(0);
      });
      this.dom.scoreDrawer.addEventListener('pointerleave', () => {
        this.pointerInside = false;
        this.hideDrawer();
      });
      this.dom.scoreDrawer.addEventListener('focus', () => {
        this.focusInside = true;
        this.showDrawer(0);
      });
      this.dom.scoreDrawer.addEventListener('blur', () => {
        this.focusInside = false;
        this.hideDrawer();
      });
      this.dom.scoreDrawer.addEventListener('click', () => {
        const pinned = !this.isPinned();
        this.setPinned(pinned);
        if (pinned) this.showDrawer(0);
        else if (this.pointerInside || this.focusInside) this.showDrawer(0);
        else this.hideDrawer(true);
      });
      this.dom.scoreDrawer.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        event.preventDefault?.();
        event.stopPropagation?.();
        this.setPinned(false);
        this.hideDrawer(true);
      });
      return true;
    }

    showDrawer(duration = 2600) {
      if (!this.dom.scoreDrawer) return false;
      this.clearDrawerTimer();
      this.dom.scoreDrawer.classList.add('active');
      this.dom.scoreDrawer.setAttribute('aria-expanded', 'true');

      if (this.isPinned()) {
        this.syncDrawerState('pinned');
        return true;
      }

      const holdOpen = this.pointerInside || this.focusInside || duration <= 0;
      this.syncDrawerState(holdOpen ? 'expanded' : 'peeking');
      if (!holdOpen) {
        const generation = this.drawerTimerGeneration;
        this.drawerTimer = this.setTimer(() => {
          if (generation !== this.drawerTimerGeneration) return;
          this.drawerTimer = null;
          this.hideDrawer();
        }, duration);
        this.drawerTimer?.unref?.();
      }
      return true;
    }

    hideDrawer(force = false) {
      if (!this.dom.scoreDrawer) return false;
      this.clearDrawerTimer();
      if (!force && (this.isPinned() || this.pointerInside || this.focusInside)) {
        this.syncDrawerState(this.isPinned() ? 'pinned' : 'expanded');
        return true;
      }
      this.dom.scoreDrawer.classList.remove('active');
      this.dom.scoreDrawer.setAttribute('aria-expanded', 'false');
      this.syncDrawerState('hidden');
      return true;
    }

    clearDrawerTimer() {
      this.drawerTimerGeneration += 1;
      if (this.drawerTimer !== null) {
        this.clearTimer(this.drawerTimer);
        this.drawerTimer = null;
      }
    }

    isPinned() {
      return this.dom.scoreDrawer?.dataset.pinned === 'true';
    }

    setPinned(pinned) {
      if (!this.dom.scoreDrawer) return false;
      const value = String(Boolean(pinned));
      this.dom.scoreDrawer.dataset.pinned = value;
      this.dom.scoreDrawer.setAttribute('aria-pressed', value);
      return true;
    }

    syncDrawerState(state) {
      const drawer = this.dom.scoreDrawer;
      if (!drawer) return;
      drawer.dataset.drawerState = state;
      ['peeking', 'expanded', 'pinned'].forEach((name) => {
        const method = name === state ? 'add' : 'remove';
        drawer.classList[method](`score-drawer--${name}`);
      });
    }

    animateTile(tile, previousValue, nextValue, kind = 'value') {
      if (!tile) return false;
      const priorTimer = this.tileTimers.get(tile);
      if (priorTimer) {
        this.clearTimer(priorTimer.timer);
        this.activeTileTimers.delete(priorTimer);
      }

      tile.classList.remove('score-flip');
      tile.classList.remove('split-flap-changing');
      void tile.offsetWidth;
      tile.classList.add('score-flip');
      tile.classList.add('split-flap-changing');
      tile.dataset.changeKind = kind;
      tile.dataset.previousValue = String(previousValue);
      tile.dataset.nextValue = String(nextValue);
      tile.dataset.changeDirection = this.getChangeDirection(previousValue, nextValue);
      tile.dataset.transitionState = 'flipping';

      const record = { timer: null };
      record.timer = this.setTimer(() => {
        if (this.tileTimers.get(tile) !== record) return;
        tile.classList.remove('score-flip');
        tile.classList.remove('split-flap-changing');
        tile.dataset.transitionState = 'settled';
        this.tileTimers.delete(tile);
        this.activeTileTimers.delete(record);
      }, 720);
      this.tileTimers.set(tile, record);
      this.activeTileTimers.add(record);
      record.timer?.unref?.();
      return true;
    }

    getChangeDirection(previousValue, nextValue) {
      const previous = Number(String(previousValue).match(/-?\d+(?:\.\d+)?/)?.[0]);
      const next = Number(String(nextValue).match(/-?\d+(?:\.\d+)?/)?.[0]);
      if (!Number.isFinite(previous) || !Number.isFinite(next) || previous === next) return 'changed';
      return next > previous ? 'up' : 'down';
    }

    renderScore(gameState = {}) {
      const score = Number.isFinite(gameState.score) ? gameState.score : 0;
      const currentStreak = Number.isFinite(gameState.currentStreak) ? gameState.currentStreak : 0;
      const bestStreak = Number.isFinite(gameState.bestStreak) ? gameState.bestStreak : 0;
      const scoreChanged = this.lastScore !== null && this.lastScore !== score;
      const streakChanged = this.lastStreak !== null && this.lastStreak !== currentStreak;
      const bestChanged = this.lastBestStreak !== null && this.lastBestStreak !== bestStreak;
      const copy = this.getCopy();

      this.renderTile(this.dom.hudScore, `$${score}`, scoreChanged, this.lastScore, 'score');
      this.renderTile(this.dom.hudStreak, `x${currentStreak}`, streakChanged, this.lastStreak, 'streak');
      this.renderTile(this.dom.hudBest, `x${bestStreak}`, bestChanged, this.lastBestStreak, 'best');
      this.setText(this.dom.hudScoreLabel, copy.score);
      this.setText(this.dom.hudStreakLabel, copy.currentStreak);
      this.setText(this.dom.hudBestLabel, copy.bestStreak);

      if (scoreChanged || streakChanged || bestChanged) this.showDrawer();
      this.lastScore = score;
      this.lastStreak = currentStreak;
      this.lastBestStreak = bestStreak;
    }

    renderProgress(progress) {
      if (!progress) return false;
      const total = Number.isFinite(progress.total) ? progress.total : 0;
      const current = progress.complete
        ? total
        : Number.isFinite(progress.current) ? progress.current : 0;
      const value = `${current}/${total}`;
      const episodeChanged = this.lastEpisodeValue !== null && this.lastEpisodeValue !== value;

      this.setText(this.dom.hudEpisode, value);
      this.setText(this.dom.hudEpisodeLabel, this.getCopy().clueProgress);
      if (this.dom.hudEpisode) {
        this.dom.hudEpisode.dataset.value = value;
        if (episodeChanged) {
          this.animateTile(this.dom.hudEpisode, this.lastEpisodeValue, value, 'episode-progress');
          this.showDrawer();
        } else if (!this.dom.hudEpisode.dataset.transitionState) {
          this.dom.hudEpisode.dataset.transitionState = 'settled';
        }
      }
      this.lastEpisodeValue = value;
      return true;
    }

    renderTile(tile, value, changed, previousValue = value, kind = 'value') {
      if (!tile) return;
      this.setText(tile, value);
      tile.dataset.value = value;
      if (changed) this.animateTile(tile, previousValue, value, kind);
      else if (!tile.dataset.transitionState) tile.dataset.transitionState = 'settled';
    }

    destroy() {
      this.clearDrawerTimer();
      this.activeTileTimers.forEach((record) => this.clearTimer(record.timer));
      this.activeTileTimers.clear();
      return true;
    }
  }

  return {
    ScoreboardView,
  };
}));
