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
      this.lastScore = null;
      this.lastStreak = null;
      this.lastBestStreak = null;
      this.lastEpisodeValue = null;
      this.bound = false;
    }

    bindInteractions() {
      if (this.bound || !this.dom.scoreDrawer) return false;
      this.bound = true;
      this.dom.scoreDrawer.addEventListener('pointerenter', () => this.showDrawer(0));
      this.dom.scoreDrawer.addEventListener('pointerleave', () => this.hideDrawer());
      this.dom.scoreDrawer.addEventListener('focus', () => this.showDrawer(0));
      this.dom.scoreDrawer.addEventListener('blur', () => this.hideDrawer());
      this.dom.scoreDrawer.addEventListener('click', () => {
        const pinned = this.dom.scoreDrawer.dataset.pinned === 'true';
        this.dom.scoreDrawer.dataset.pinned = String(!pinned);
        this.dom.scoreDrawer.setAttribute('aria-pressed', String(!pinned));
        if (!pinned) this.showDrawer(0);
        else this.hideDrawer(true);
      });
      return true;
    }

    showDrawer(duration = 2600) {
      if (!this.dom.scoreDrawer) return false;
      this.clearTimer(this.drawerTimer);
      this.dom.scoreDrawer.classList.add('active');
      if (duration > 0) {
        this.drawerTimer = this.setTimer(() => this.hideDrawer(), duration);
        this.drawerTimer?.unref?.();
      }
      return true;
    }

    hideDrawer(force = false) {
      if (!this.dom.scoreDrawer) return false;
      this.clearTimer(this.drawerTimer);
      if (force || this.dom.scoreDrawer.dataset.pinned !== 'true') {
        this.dom.scoreDrawer.classList.remove('active');
      }
      return true;
    }

    animateTile(tile) {
      if (!tile) return false;
      tile.classList.remove('score-flip');
      void tile.offsetWidth;
      tile.classList.add('score-flip');
      const timer = this.setTimer(() => tile.classList.remove('score-flip'), 720);
      timer?.unref?.();
      return true;
    }

    renderScore(gameState = {}) {
      const score = Number.isFinite(gameState.score) ? gameState.score : 0;
      const currentStreak = Number.isFinite(gameState.currentStreak) ? gameState.currentStreak : 0;
      const bestStreak = Number.isFinite(gameState.bestStreak) ? gameState.bestStreak : 0;
      const scoreChanged = this.lastScore !== null && this.lastScore !== score;
      const streakChanged = this.lastStreak !== null && this.lastStreak !== currentStreak;
      const bestChanged = this.lastBestStreak !== null && this.lastBestStreak !== bestStreak;
      const copy = this.getCopy();

      this.renderTile(this.dom.hudScore, `$${score}`, scoreChanged);
      this.renderTile(this.dom.hudStreak, `x${currentStreak}`, streakChanged);
      this.renderTile(this.dom.hudBest, `x${bestStreak}`, bestChanged);
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
          this.animateTile(this.dom.hudEpisode);
          this.showDrawer();
        }
      }
      this.lastEpisodeValue = value;
      return true;
    }

    renderTile(tile, value, changed) {
      if (!tile) return;
      this.setText(tile, value);
      tile.dataset.value = value;
      if (changed) this.animateTile(tile);
    }
  }

  return {
    ScoreboardView,
  };
}));
