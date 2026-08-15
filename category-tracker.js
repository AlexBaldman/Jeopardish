'use strict';

export class CategoryTracker {
  constructor() {
    this.categoryStats = new Map();
    this.pendingWrites = 0;
    this.writeThreshold = 10;
    this.loadFromStorage();
    
    // Save on page unload
    window.addEventListener('beforeunload', () => this.saveToStorage());
  }

  recordAnswer(category, isCorrect) {
    if (!this.categoryStats.has(category)) {
      this.categoryStats.set(category, {
        total: 0,
        correct: 0,
        lastPlayed: Date.now(),
      });
    }

    const stats = this.categoryStats.get(category);
    stats.total += 1;
    if (isCorrect) {
      stats.correct += 1;
    }
    stats.lastPlayed = Date.now();

    this.pendingWrites += 1;
    
    if (this.pendingWrites >= this.writeThreshold) {
      this.saveToStorage();
      this.pendingWrites = 0;
    }
  }

  getAccuracy(category) {
    const stats = this.categoryStats.get(category);
    if (!stats || stats.total === 0) return 0;
    return Math.round((stats.correct / stats.total) * 100);
  }

  getAllStats() {
    const result = [];
    for (const [category, stats] of this.categoryStats) {
      result.push({
        category,
        accuracy: this.getAccuracy(category),
        total: stats.total,
        correct: stats.correct,
        lastPlayed: stats.lastPlayed,
      });
    }
    return result.sort((a, b) => b.total - a.total);
  }

  getHeatmapData() {
    const stats = this.getAllStats();
    return stats.map(stat => ({
      category: stat.category,
      accuracy: stat.accuracy,
      total: stat.total,
      color: this.getHeatmapColor(stat.accuracy),
    }));
  }

  getHeatmapColor(accuracy) {
    if (accuracy >= 90) return '#2ecc71'; // Green
    if (accuracy >= 70) return '#f39c12'; // Yellow
    if (accuracy >= 50) return '#e67e22'; // Orange
    return '#e94560'; // Red
  }

  saveToStorage() {
    try {
      const data = Object.fromEntries(this.categoryStats);
      localStorage.setItem('jeopardish.categoryStats', JSON.stringify(data));
    } catch (error) {
      console.warn('Unable to persist category stats.', error);
    }
  }

  loadFromStorage() {
    try {
      const data = localStorage.getItem('jeopardish.categoryStats');
      if (data) {
        const parsed = JSON.parse(data);
        this.categoryStats = new Map(Object.entries(parsed));
      }
    } catch (error) {
      console.warn('Unable to load category stats.', error);
    }
  }

  reset() {
    this.categoryStats.clear();
    this.pendingWrites = 0;
    this.saveToStorage();
  }
}
