/**
 * Statistics Manager
 * 
 * Tracks game statistics, achievements, and player progress.
 * Follows Carmack's approach of direct, efficient data structures
 * with clear ownership and minimal indirection.
 */

import { getState, dispatch } from '../store.js';
import { EVENTS, eventBus } from '../../utils/events.js';

class StatsManager {
    constructor() {
        this.achievements = {
            'first_correct': {
                id: 'first_correct',
                name: 'First Steps',
                description: 'Answer your first question correctly',
                icon: '🎯',
                unlocked: false,
                unlockedAt: null
            },
            'streak_5': {
                id: 'streak_5',
                name: 'On Fire',
                description: 'Get 5 correct answers in a row',
                icon: '🔥',
                unlocked: false,
                unlockedAt: null
            },
            'streak_10': {
                id: 'streak_10',
                name: 'Unstoppable',
                description: 'Get 10 correct answers in a row',
                icon: '⚡',
                unlocked: false,
                unlockedAt: null
            },
            'score_1000': {
                id: 'score_1000',
                name: 'Grand Champion',
                description: 'Score 1000 points in a single game',
                icon: '🏆',
                unlocked: false,
                unlockedAt: null
            },
            'perfect_category': {
                id: 'perfect_category',
                name: 'Category Master',
                description: 'Answer all questions in a category correctly',
                icon: '🎓',
                unlocked: false,
                unlockedAt: null
            },
            'speed_demon': {
                id: 'speed_demon',
                name: 'Speed Demon',
                description: 'Answer 10 questions correctly in under 5 minutes',
                icon: '⏱️',
                unlocked: false,
                unlockedAt: null
            },
            'comeback_kid': {
                id: 'comeback_kid',
                name: 'Comeback Kid',
                description: 'Win after being down by 500 points',
                icon: '💪',
                unlocked: false,
                unlockedAt: null
            },
            'daily_player': {
                id: 'daily_player',
                name: 'Daily Player',
                description: 'Play 7 days in a row',
                icon: '📅',
                unlocked: false,
                unlockedAt: null
            }
        };
        
        this.defaultStats = {
            gamesPlayed: 0,
            totalScore: 0,
            highScore: 0,
            questionsAnswered: 0,
            correctAnswers: 0,
            wrongAnswers: 0,
            currentStreak: 0,
            bestStreak: 0,
            totalTimePlayed: 0,
            fastestCorrect: null,
            categoriesPlayed: {},
            dailyStreak: 0,
            lastPlayedDate: null,
            achievements: []
        };
    }
    
    /**
     * Load statistics from localStorage
     */
    load() {
        try {
            const saved = localStorage.getItem('jeopardish_stats');
            const stats = saved ? JSON.parse(saved) : {};
            
            // Merge with defaults
            const finalStats = { ...this.defaultStats, ...stats };
            
            // Load achievements
            const savedAchievements = localStorage.getItem('jeopardish_achievements');
            if (savedAchievements) {
                const achievementData = JSON.parse(savedAchievements);
                Object.keys(achievementData).forEach(id => {
                    if (this.achievements[id]) {
                        this.achievements[id] = { ...this.achievements[id], ...achievementData[id] };
                    }
                });
            }
            
            // Update store
            dispatch({
                type: 'UPDATE_STATS',
                payload: finalStats
            });
            
            return finalStats;
        } catch (error) {
            console.error('Failed to load stats:', error);
            return this.defaultStats;
        }
    }
    
    /**
     * Save statistics to localStorage
     */
    save(stats) {
        try {
            localStorage.setItem('jeopardish_stats', JSON.stringify(stats));
            localStorage.setItem('jeopardish_achievements', JSON.stringify(this.achievements));
            eventBus.emit(EVENTS.STATS_UPDATED, stats);
        } catch (error) {
            console.error('Failed to save stats:', error);
        }
    }
    
    /**
     * Update statistics after a question is answered
     */
    updateQuestionStats(correct, value, category, timeToAnswer) {
        const state = getState();
        const currentStats = state.stats || this.defaultStats;
        
        const newStats = {
            ...currentStats,
            questionsAnswered: currentStats.questionsAnswered + 1,
            correctAnswers: correct ? currentStats.correctAnswers + 1 : currentStats.correctAnswers,
            wrongAnswers: correct ? currentStats.wrongAnswers : currentStats.wrongAnswers + 1,
            currentStreak: correct ? currentStats.currentStreak + 1 : 0,
            bestStreak: correct && currentStats.currentStreak + 1 > currentStats.bestStreak 
                ? currentStats.currentStreak + 1 
                : currentStats.bestStreak
        };
        
        // Update category stats
        if (category) {
            newStats.categoriesPlayed = {
                ...newStats.categoriesPlayed,
                [category]: (newStats.categoriesPlayed[category] || 0) + 1
            };
        }
        
        // Update fastest correct answer
        if (correct && timeToAnswer && (!newStats.fastestCorrect || timeToAnswer < newStats.fastestCorrect)) {
            newStats.fastestCorrect = timeToAnswer;
        }
        
        dispatch({
            type: 'UPDATE_STATS',
            payload: newStats
        });
        
        this.save(newStats);
        
        // Check for achievements
        this.checkAchievements(newStats);
    }
    
    /**
     * Update game statistics
     */
    updateGameStats(score, timePlayed) {
        const state = getState();
        const currentStats = state.stats || this.defaultStats;
        
        const newStats = {
            ...currentStats,
            gamesPlayed: currentStats.gamesPlayed + 1,
            totalScore: currentStats.totalScore + score,
            highScore: score > currentStats.highScore ? score : currentStats.highScore,
            totalTimePlayed: currentStats.totalTimePlayed + timePlayed,
            lastPlayedDate: new Date().toISOString()
        };
        
        // Update daily streak
        const lastPlayed = currentStats.lastPlayedDate ? new Date(currentStats.lastPlayedDate) : null;
        const today = new Date();
        if (lastPlayed) {
            const daysSinceLastPlay = Math.floor((today - lastPlayed) / (1000 * 60 * 60 * 24));
            if (daysSinceLastPlay === 1) {
                newStats.dailyStreak = currentStats.dailyStreak + 1;
            } else if (daysSinceLastPlay > 1) {
                newStats.dailyStreak = 1;
            }
        } else {
            newStats.dailyStreak = 1;
        }
        
        dispatch({
            type: 'UPDATE_STATS',
            payload: newStats
        });
        
        this.save(newStats);
        
        // Check for achievements
        this.checkAchievements(newStats);
    }
    
    /**
     * Get all time statistics
     */
    getAllTimeStats() {
        const state = getState();
        const stats = state.stats || this.defaultStats;
        
        return {
            gamesPlayed: stats.gamesPlayed,
            totalScore: stats.totalScore,
            highScore: stats.highScore,
            questionsAnswered: stats.questionsAnswered,
            correctAnswers: stats.correctAnswers,
            accuracy: stats.questionsAnswered > 0 
                ? Math.round((stats.correctAnswers / stats.questionsAnswered) * 100) 
                : 0,
            bestStreak: stats.bestStreak,
            avgScore: stats.gamesPlayed > 0 
                ? Math.round(stats.totalScore / stats.gamesPlayed) 
                : 0,
            totalTimePlayed: stats.totalTimePlayed,
            favoriteCategory: this.getFavoriteCategory(stats.categoriesPlayed),
            dailyStreak: stats.dailyStreak
        };
    }
    
    /**
     * Get favorite category based on play count
     */
    getFavoriteCategory(categoriesPlayed) {
        if (!categoriesPlayed || Object.keys(categoriesPlayed).length === 0) {
            return 'None';
        }
        
        return Object.entries(categoriesPlayed)
            .sort(([,a], [,b]) => b - a)[0][0];
    }
    
    /**
     * Get all achievements
     */
    getAchievements() {
        return Object.values(this.achievements);
    }
    
    /**
     * Get unlocked achievements
     */
    getUnlockedAchievements() {
        return Object.values(this.achievements).filter(a => a.unlocked);
    }
    
    /**
     * Check and unlock achievements based on current stats
     */
    checkAchievements(stats) {
        const newlyUnlocked = [];
        
        // First correct answer
        if (!this.achievements.first_correct.unlocked && stats.correctAnswers >= 1) {
            this.unlockAchievement('first_correct');
            newlyUnlocked.push(this.achievements.first_correct);
        }
        
        // Streak achievements
        if (!this.achievements.streak_5.unlocked && stats.currentStreak >= 5) {
            this.unlockAchievement('streak_5');
            newlyUnlocked.push(this.achievements.streak_5);
        }
        
        if (!this.achievements.streak_10.unlocked && stats.currentStreak >= 10) {
            this.unlockAchievement('streak_10');
            newlyUnlocked.push(this.achievements.streak_10);
        }
        
        // High score achievement
        if (!this.achievements.score_1000.unlocked && stats.highScore >= 1000) {
            this.unlockAchievement('score_1000');
            newlyUnlocked.push(this.achievements.score_1000);
        }
        
        // Daily streak achievement
        if (!this.achievements.daily_player.unlocked && stats.dailyStreak >= 7) {
            this.unlockAchievement('daily_player');
            newlyUnlocked.push(this.achievements.daily_player);
        }
        
        // Emit events for newly unlocked achievements
        newlyUnlocked.forEach(achievement => {
            eventBus.emit(EVENTS.ACHIEVEMENT_UNLOCKED, achievement);
        });
        
        return newlyUnlocked;
    }
    
    /**
     * Unlock a specific achievement
     */
    unlockAchievement(achievementId) {
        if (this.achievements[achievementId] && !this.achievements[achievementId].unlocked) {
            this.achievements[achievementId].unlocked = true;
            this.achievements[achievementId].unlockedAt = new Date().toISOString();
            
            // Update store
            const state = getState();
            const currentStats = state.stats || this.defaultStats;
            const updatedStats = {
                ...currentStats,
                achievements: [...(currentStats.achievements || []), achievementId]
            };
            
            dispatch({
                type: 'UPDATE_STATS',
                payload: updatedStats
            });
        }
    }
    
    /**
     * Reset all statistics
     */
    reset() {
        // Reset stats
        dispatch({
            type: 'UPDATE_STATS',
            payload: this.defaultStats
        });
        
        // Reset achievements
        Object.keys(this.achievements).forEach(id => {
            this.achievements[id].unlocked = false;
            this.achievements[id].unlockedAt = null;
        });
        
        // Clear localStorage
        localStorage.removeItem('jeopardish_stats');
        localStorage.removeItem('jeopardish_achievements');
        
        eventBus.emit(EVENTS.STATS_RESET);
    }
    
    /**
     * Get singleton instance (for backward compatibility)
     */
    static getInstance() {
        if (!StatsManager.instance) {
            StatsManager.instance = new StatsManager();
        }
        return StatsManager.instance;
    }
}

// Export singleton instance
export const statsManager = new StatsManager();
export { StatsManager };
