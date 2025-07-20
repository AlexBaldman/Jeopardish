/**
 * StatsModal.js - Game statistics display
 * 
 * Shows detailed player statistics, performance metrics,
 * and historical data. Visualizes progress over time.
 */

import Modal from '../Modal.js';
import { ConnectedComponent } from '../../ConnectedComponent.js';
import { createElement } from '../../../utils/helpers.js';
import { formatTime, formatNumber } from '../../../utils/helpers.js';

export class StatsModal extends Modal {
    constructor(config = {}) {
        super({
            ...config,
            title: '📊 Statistics',
            className: 'stats-modal'
        });
        
        this.stats = this.loadStats();
        this.timeRange = 'all'; // 'today', 'week', 'month', 'all'
    }
    
    renderContent() {
        const stats = this.getFilteredStats();
        
        return createElement('div', {
            className: 'stats-content'
        }, [
            this.renderTimeFilter(),
            this.renderOverview(stats),
            this.renderPerformance(stats),
            this.renderCategories(stats),
            this.renderAchievementProgress(stats),
            this.renderHistory(stats)
        ]);
    }
    
    renderTimeFilter() {
        return createElement('div', {
            className: 'time-filter'
        }, [
            ['today', 'Today'],
            ['week', 'This Week'],
            ['month', 'This Month'],
            ['all', 'All Time']
        ].map(([value, label]) => 
            createElement('button', {
                className: `filter-button ${this.timeRange === value ? 'active' : ''}`,
                onclick: () => this.setTimeRange(value)
            }, label)
        ));
    }
    
    renderOverview(stats) {
        return createElement('section', {
            className: 'stats-section overview'
        }, [
            createElement('h3', {}, 'Overview'),
            createElement('div', {
                className: 'stat-grid'
            }, [
                this.renderStatCard('🎮', 'Games Played', stats.gamesPlayed),
                this.renderStatCard('🏆', 'Total Score', formatNumber(stats.totalScore)),
                this.renderStatCard('✅', 'Questions Answered', stats.questionsAnswered),
                this.renderStatCard('🎯', 'Accuracy', `${Math.round(stats.accuracy)}%`),
                this.renderStatCard('🔥', 'Best Streak', stats.bestStreak),
                this.renderStatCard('⏱️', 'Time Played', formatTime(stats.timePlayed))
            ])
        ]);
    }
    
    renderPerformance(stats) {
        return createElement('section', {
            className: 'stats-section performance'
        }, [
            createElement('h3', {}, 'Performance'),
            
            createElement('div', {
                className: 'performance-chart'
            }, [
                this.renderProgressBar('Correct Answers', stats.correctAnswers, stats.questionsAnswered, 'success'),
                this.renderProgressBar('Incorrect Answers', stats.incorrectAnswers, stats.questionsAnswered, 'error'),
                this.renderProgressBar('Daily Doubles Found', stats.dailyDoublesFound, stats.dailyDoublesTotal, 'special')
            ]),
            
            createElement('div', {
                className: 'stat-grid small'
            }, [
                this.renderStatCard('💰', 'Avg Score/Game', formatNumber(stats.avgScorePerGame)),
                this.renderStatCard('⚡', 'Avg Response Time', `${stats.avgResponseTime}s`),
                this.renderStatCard('📈', 'Improvement Rate', `+${stats.improvementRate}%`),
                this.renderStatCard('🎯', 'Perfect Games', stats.perfectGames)
            ])
        ]);
    }
    
    renderCategories(stats) {
        const topCategories = this.getTopCategories(stats.categoryStats);
        
        return createElement('section', {
            className: 'stats-section categories'
        }, [
            createElement('h3', {}, 'Category Performance'),
            
            createElement('div', {
                className: 'category-list'
            }, topCategories.map(cat => 
                createElement('div', {
                    className: 'category-stat'
                }, [
                    createElement('div', {
                        className: 'category-info'
                    }, [
                        createElement('span', {
                            className: 'category-name'
                        }, cat.name),
                        createElement('span', {
                            className: 'category-accuracy'
                        }, `${Math.round(cat.accuracy)}%`)
                    ]),
                    this.renderMiniProgressBar(cat.accuracy)
                ])
            ))
        ]);
    }
    
    renderAchievementProgress(stats) {
        const achievements = this.getAchievementProgress(stats);
        
        return createElement('section', {
            className: 'stats-section achievements'
        }, [
            createElement('h3', {}, 'Achievement Progress'),
            
            createElement('div', {
                className: 'achievement-grid'
            }, achievements.slice(0, 6).map(achievement => 
                createElement('div', {
                    className: `achievement-card ${achievement.unlocked ? 'unlocked' : ''}`
                }, [
                    createElement('div', {
                        className: 'achievement-icon'
                    }, achievement.icon),
                    createElement('div', {
                        className: 'achievement-info'
                    }, [
                        createElement('span', {
                            className: 'achievement-name'
                        }, achievement.name),
                        achievement.unlocked ? 
                            createElement('span', {
                                className: 'achievement-date'
                            }, `Unlocked ${new Date(achievement.unlockedAt).toLocaleDateString()}`) :
                            this.renderMiniProgressBar(achievement.progress)
                    ])
                ])
            ))
        ]);
    }
    
    renderHistory(stats) {
        const recentGames = stats.gameHistory.slice(-5).reverse();
        
        return createElement('section', {
            className: 'stats-section history'
        }, [
            createElement('h3', {}, 'Recent Games'),
            
            createElement('div', {
                className: 'game-history'
            }, recentGames.map(game => 
                createElement('div', {
                    className: 'history-item'
                }, [
                    createElement('div', {
                        className: 'history-date'
                    }, new Date(game.date).toLocaleDateString()),
                    createElement('div', {
                        className: 'history-score'
                    }, formatNumber(game.score)),
                    createElement('div', {
                        className: 'history-stats'
                    }, [
                        createElement('span', {}, `${game.questionsAnswered} questions`),
                        createElement('span', {}, `${Math.round(game.accuracy)}% accuracy`)
                    ])
                ])
            ))
        ]);
    }
    
    renderStatCard(icon, label, value) {
        return createElement('div', {
            className: 'stat-card'
        }, [
            createElement('div', {
                className: 'stat-icon'
            }, icon),
            createElement('div', {
                className: 'stat-value'
            }, value),
            createElement('div', {
                className: 'stat-label'
            }, label)
        ]);
    }
    
    renderProgressBar(label, value, total, type = 'default') {
        const percentage = total > 0 ? (value / total) * 100 : 0;
        
        return createElement('div', {
            className: 'progress-item'
        }, [
            createElement('div', {
                className: 'progress-header'
            }, [
                createElement('span', {}, label),
                createElement('span', {}, `${value} / ${total}`)
            ]),
            createElement('div', {
                className: 'progress-bar'
            }, [
                createElement('div', {
                    className: `progress-fill ${type}`,
                    style: `width: ${percentage}%`
                })
            ])
        ]);
    }
    
    renderMiniProgressBar(percentage) {
        return createElement('div', {
            className: 'mini-progress'
        }, [
            createElement('div', {
                className: 'mini-progress-fill',
                style: `width: ${percentage}%`
            })
        ]);
    }
    
    setTimeRange(range) {
        this.timeRange = range;
        this.update();
    }
    
    getFilteredStats() {
        if (this.timeRange === 'all') {
            return this.stats;
        }
        
        const now = Date.now();
        const ranges = {
            today: 24 * 60 * 60 * 1000,
            week: 7 * 24 * 60 * 60 * 1000,
            month: 30 * 24 * 60 * 60 * 1000
        };
        
        const cutoff = now - ranges[this.timeRange];
        
        // Filter stats based on time range
        return this.filterStatsByDate(this.stats, cutoff);
    }
    
    filterStatsByDate(stats, cutoff) {
        // Deep clone and filter stats
        const filtered = JSON.parse(JSON.stringify(stats));
        
        // Filter game history
        filtered.gameHistory = filtered.gameHistory.filter(game => 
            new Date(game.date).getTime() >= cutoff
        );
        
        // Recalculate aggregates based on filtered history
        this.recalculateAggregates(filtered);
        
        return filtered;
    }
    
    recalculateAggregates(stats) {
        const games = stats.gameHistory;
        
        stats.gamesPlayed = games.length;
        stats.totalScore = games.reduce((sum, game) => sum + game.score, 0);
        stats.questionsAnswered = games.reduce((sum, game) => sum + game.questionsAnswered, 0);
        stats.correctAnswers = games.reduce((sum, game) => sum + game.correctAnswers, 0);
        stats.incorrectAnswers = stats.questionsAnswered - stats.correctAnswers;
        stats.accuracy = stats.questionsAnswered > 0 ? 
            (stats.correctAnswers / stats.questionsAnswered) * 100 : 0;
        stats.avgScorePerGame = stats.gamesPlayed > 0 ? 
            Math.round(stats.totalScore / stats.gamesPlayed) : 0;
    }
    
    getTopCategories(categoryStats) {
        return Object.entries(categoryStats)
            .map(([name, stats]) => ({
                name,
                accuracy: stats.correct / (stats.correct + stats.incorrect) * 100,
                total: stats.correct + stats.incorrect
            }))
            .filter(cat => cat.total > 0)
            .sort((a, b) => b.total - a.total)
            .slice(0, 10);
    }
    
    getAchievementProgress(stats) {
        // Mock achievement data - would come from achievements system
        return [
            {
                id: 'first-game',
                name: 'First Steps',
                icon: '🎮',
                unlocked: true,
                unlockedAt: stats.firstGameDate,
                progress: 100
            },
            {
                id: 'streak-10',
                name: 'Hot Streak',
                icon: '🔥',
                unlocked: stats.bestStreak >= 10,
                progress: Math.min(100, (stats.bestStreak / 10) * 100)
            },
            {
                id: 'perfect-game',
                name: 'Perfectionist',
                icon: '💯',
                unlocked: stats.perfectGames > 0,
                progress: stats.perfectGames > 0 ? 100 : 0
            },
            {
                id: 'trivia-master',
                name: 'Trivia Master',
                icon: '🎓',
                unlocked: stats.totalScore >= 100000,
                progress: Math.min(100, (stats.totalScore / 100000) * 100)
            },
            {
                id: 'daily-player',
                name: 'Daily Player',
                icon: '📅',
                unlocked: stats.daysPlayed >= 7,
                progress: Math.min(100, (stats.daysPlayed / 7) * 100)
            },
            {
                id: 'speed-demon',
                name: 'Speed Demon',
                icon: '⚡',
                unlocked: stats.avgResponseTime < 3,
                progress: stats.avgResponseTime < 3 ? 100 : 0
            }
        ];
    }
    
    loadStats() {
        try {
            const saved = localStorage.getItem('jeopardish-stats');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {
            console.error('Failed to load stats:', e);
        }
        
        // Return default stats
        return {
            gamesPlayed: 0,
            totalScore: 0,
            questionsAnswered: 0,
            correctAnswers: 0,
            incorrectAnswers: 0,
            accuracy: 0,
            bestStreak: 0,
            timePlayed: 0,
            avgScorePerGame: 0,
            avgResponseTime: 0,
            improvementRate: 0,
            perfectGames: 0,
            dailyDoublesFound: 0,
            dailyDoublesTotal: 0,
            daysPlayed: 0,
            firstGameDate: null,
            categoryStats: {},
            gameHistory: []
        };
    }
}
