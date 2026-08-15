'use strict';

import { getDailySeed } from './utils.js';
import seededRandom from './utils.js';

const BADGE_THRESHOLDS = {
  3: { name: 'Novice', icon: '🌱' },
  5: { name: 'Apprentice', icon: '⭐' },
  7: { name: 'Expert', icon: '🔥' },
  10: { name: 'Master', icon: '👑' },
  15: { name: 'Legend', icon: '💎' },
};

export { getDailySeed, seededRandom };

export function createSession(saved = {}) {
    return {
      score: 0,
      currentStreak: 0,
      bestStreak: Number(saved.bestStreak) || 0,
      highScore: Number(saved.highScore) || 0,
      totalAnswered: 0,
      totalCorrect: 0,
      missedClueIds: Array.isArray(saved.missedClueIds) ? saved.missedClueIds : [],
      answeredClueIds: [],
      lastClueId: null,
      lastCategory: null,
      mode: 'quick',
      categoryStreaks: new Map(),
      categoryBestStreaks: saved.categoryBestStreaks ? new Map(Object.entries(saved.categoryBestStreaks)) : new Map(),
      badges: Array.isArray(saved.badges) ? saved.badges : [],
    };
  }

export function calculateAccuracy(session) {
  if (!session || session.totalAnswered === 0) return 0;
  return Math.round((session.totalCorrect / session.totalAnswered) * 100);
}

export function calculateScoreDelta({ isCorrect, clueValue, streak, peekUsed }) {
  const value = Number.isFinite(clueValue) && clueValue > 0 ? clueValue : 100;

  if (!isCorrect) return 0;
  if (peekUsed) return 0;

  const streakBonus = streak >= 5 ? Math.round(value * 0.5) : streak >= 3 ? Math.round(value * 0.25) : 0;
  return value + streakBonus;
}

export function recordAnswer(session, result) {
  const next = {
    ...session,
    missedClueIds: [...session.missedClueIds],
    answeredClueIds: [...session.answeredClueIds],
    categoryStreaks: new Map(session.categoryStreaks),
    categoryBestStreaks: new Map(session.categoryBestStreaks),
    badges: [...session.badges],
  };

  const clueId = result.clueId ?? null;
  const category = result.category || 'Unknown';
  if (clueId !== null && !next.answeredClueIds.includes(clueId)) {
    next.answeredClueIds.push(clueId);
  }

  next.totalAnswered += 1;

  if (result.isCorrect) {
    next.totalCorrect += 1;
    next.currentStreak = result.peekUsed ? 0 : next.currentStreak + 1;

    if (clueId !== null) {
      next.missedClueIds = next.missedClueIds.filter((id) => id !== clueId);
    }

    if (!result.peekUsed) {
      const currentCategoryStreak = next.categoryStreaks.get(category) || 0;
      const newCategoryStreak = currentCategoryStreak + 1;
      next.categoryStreaks.set(category, newCategoryStreak);

      const bestCategoryStreak = next.categoryBestStreaks.get(category) || 0;
      if (newCategoryStreak > bestCategoryStreak) {
        next.categoryBestStreaks.set(category, newCategoryStreak);
      }

      const newBadges = checkForBadges(category, newCategoryStreak, next.badges);
      next.badges = [...next.badges, ...newBadges];
    }
  } else {
    next.currentStreak = 0;
    next.categoryStreaks.set(category, 0);

    if (clueId !== null && !next.missedClueIds.includes(clueId)) {
      next.missedClueIds.push(clueId);
    }
  }

  next.lastCategory = category;

  const delta = calculateScoreDelta({
    isCorrect: result.isCorrect,
    clueValue: result.clueValue,
    streak: next.currentStreak,
    peekUsed: result.peekUsed,
  });

  next.score += delta;
  next.highScore = Math.max(next.highScore, next.score);
  next.bestStreak = Math.max(next.bestStreak, next.currentStreak);

  return {
    session: next,
    delta,
    accuracy: calculateAccuracy(next),
    newBadges: next.badges.length - session.badges.length,
  };
}

export function checkForBadges(category, streak, existingBadges) {
  const newBadges = [];
  
  for (const [threshold, badge] of Object.entries(BADGE_THRESHOLDS)) {
    const thresholdNum = parseInt(threshold, 10);
    if (streak >= thresholdNum) {
      const badgeId = `${category}-${thresholdNum}`;
      if (!existingBadges.some(b => b.id === badgeId)) {
        newBadges.push({
          id: badgeId,
          category,
          threshold: thresholdNum,
          name: `${category} ${badge.name}`,
          icon: badge.icon,
          earnedAt: Date.now(),
        });
      }
    }
  }
  
  return newBadges;
}

export function getCategoryStreak(session, category) {
  return session.categoryStreaks.get(category) || 0;
}

export function getCategoryBestStreak(session, category) {
  return session.categoryBestStreaks.get(category) || 0;
}

export function getAllBadges(session) {
  return session.badges;
}

export function getCategoryBadgeCount(session) {
  const categoryCounts = {};
  for (const badge of session.badges) {
    categoryCounts[badge.category] = (categoryCounts[badge.category] || 0) + 1;
  }
  return categoryCounts;
}

export function getCategoryStats(session) {
  const stats = new Map();
  
  for (const [category, streak] of session.categoryStreaks) {
    if (!stats.has(category)) {
      stats.set(category, { total: 0, correct: 0, streak: 0, bestStreak: 0 });
    }
    const categoryStat = stats.get(category);
    categoryStat.streak = streak;
    categoryStat.bestStreak = session.categoryBestStreaks.get(category) || 0;
  }
  
  return stats;
}

export function addCategoryAnswer(session, category, isCorrect) {
  const stats = getCategoryStats(session);
  
  if (!stats.has(category)) {
    stats.set(category, { total: 0, correct: 0, streak: 0, bestStreak: 0 });
  }
  
  const categoryStat = stats.get(category);
  categoryStat.total += 1;
  if (isCorrect) {
    categoryStat.correct += 1;
  }
  
  return stats;
}
