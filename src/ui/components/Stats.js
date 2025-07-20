/**
 * Stats Component
 * 
 * Displays comprehensive game statistics and performance metrics.
 * 
 * Following Carmack's principle: "Measure everything that matters"
 * 
 * Features:
 * - Session statistics
 * - All-time records
 * - Category performance
 * - Achievement progress
 * - Visual charts
 */

import { Modal } from './Modal.js';
import { formatTime, formatNumber } from '../../utils/helpers.js';
import { GAME_EVENTS } from '../../utils/events.js';

export class Stats extends Modal {
    constructor(options = {}) {
        super({
            ...options,
            title: '📊 Game Statistics',
            className: 'stats-modal'
        });
        
        this.charts = {
            categoryPerformance: null,
            dailyProgress: null
        };
    }
    
    getContent() {
        const stats = this.getStats();
        
        return `
            <div class="stats-container">
                ${this.renderSessionStats(stats.session)}
                ${this.renderAllTimeStats(stats.allTime)}
                ${this.renderCategoryPerformance(stats.categories)}
                ${this.renderAchievements(stats.achievements)}
                ${this.renderCharts()}
            </div>
        `;
    }
    
    renderSessionStats(session) {
        return `
            <section class="stats-section session-stats">
                <h3>Current Session</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">Questions</span>
                        <span class="stat-value">${session.questionsAnswered}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Correct</span>
                        <span class="stat-value">${session.correctAnswers}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Accuracy</span>
                        <span class="stat-value">${this.formatPercentage(session.accuracy)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Current Streak</span>
                        <span class="stat-value">${session.currentStreak}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Best Streak</span>
                        <span class="stat-value">${session.bestStreak}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Session Time</span>
                        <span class="stat-value">${formatTime(session.duration)}</span>
                    </div>
                </div>
            </section>
        `;
    }
    
    renderAllTimeStats(allTime) {
        return `
            <section class="stats-section all-time-stats">
                <h3>All-Time Records</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">Total Questions</span>
                        <span class="stat-value">${formatNumber(allTime.totalQuestions)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Total Correct</span>
                        <span class="stat-value">${formatNumber(allTime.totalCorrect)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Overall Accuracy</span>
                        <span class="stat-value">${this.formatPercentage(allTime.accuracy)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Longest Streak</span>
                        <span class="stat-value">${allTime.longestStreak}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Total Score</span>
                        <span class="stat-value">${formatNumber(allTime.totalScore)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Play Time</span>
                        <span class="stat-value">${formatTime(allTime.totalPlayTime)}</span>
                    </div>
                </div>
            </section>
        `;
    }
    
    renderCategoryPerformance(categories) {
        const sortedCategories = Object.entries(categories)
            .sort(([, a], [, b]) => b.accuracy - a.accuracy)
            .slice(0, 10);
        
        return `
            <section class="stats-section category-stats">
                <h3>Top Categories</h3>
                <div class="category-list">
                    ${sortedCategories.map(([category, stats], index) => `
                        <div class="category-item">
                            <span class="category-rank">${index + 1}</span>
                            <span class="category-name">${category}</span>
                            <div class="category-stats">
                                <span class="category-accuracy">${this.formatPercentage(stats.accuracy)}</span>
                                <span class="category-count">(${stats.answered} questions)</span>
                            </div>
                            <div class="accuracy-bar">
                                <div class="accuracy-fill" style="width: ${stats.accuracy}%"></div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </section>
        `;
    }
    
    renderAchievements(achievements) {
        const earned = achievements.filter(a => a.earned);
        const unearned = achievements.filter(a => !a.earned);
        
        return `
            <section class="stats-section achievements-stats">
                <h3>Achievements (${earned.length}/${achievements.length})</h3>
                <div class="achievements-grid">
                    ${earned.map(achievement => this.renderAchievement(achievement, true)).join('')}
                    ${unearned.map(achievement => this.renderAchievement(achievement, false)).join('')}
                </div>
            </section>
        `;
    }
    
    renderAchievement(achievement, earned) {
        return `
            <div class="achievement ${earned ? 'earned' : 'unearned'}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <div class="achievement-name">${achievement.name}</div>
                    <div class="achievement-description">${achievement.description}</div>
                    ${!earned && achievement.progress ? `
                        <div class="achievement-progress">
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${achievement.progress}%"></div>
                            </div>
                            <span class="progress-text">${achievement.progress}%</span>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
    }
    
    renderCharts() {
        return `
            <section class="stats-section charts-section">
                <h3>Performance Trends</h3>
                <div class="charts-container">
                    <div class="chart-wrapper">
                        <canvas id="daily-progress-chart" width="400" height="200"></canvas>
                    </div>
                    <div class="chart-wrapper">
                        <canvas id="category-distribution-chart" width="400" height="200"></canvas>
                    </div>
                </div>
            </section>
        `;
    }
    
    getStats() {
        const state = this.store.getState();
        const { score, stats, achievements } = state;
        
        // Calculate session statistics
        const session = {
            questionsAnswered: stats.sessionQuestions || 0,
            correctAnswers: stats.sessionCorrect || 0,
            accuracy: stats.sessionQuestions > 0 
                ? (stats.sessionCorrect / stats.sessionQuestions) * 100 
                : 0,
            currentStreak: score.streak || 0,
            bestStreak: stats.sessionBestStreak || 0,
            duration: Date.now() - (stats.sessionStart || Date.now())
        };
        
        // Calculate all-time statistics
        const allTime = {
            totalQuestions: stats.totalQuestions || 0,
            totalCorrect: stats.totalCorrect || 0,
            accuracy: stats.totalQuestions > 0 
                ? (stats.totalCorrect / stats.totalQuestions) * 100 
                : 0,
            longestStreak: stats.longestStreak || 0,
            totalScore: stats.totalScore || 0,
            totalPlayTime: stats.totalPlayTime || 0
        };
        
        // Process category statistics
        const categories = stats.categoryStats || {};
        
        // Process achievements
        const achievementList = this.processAchievements(achievements);
        
        return {
            session,
            allTime,
            categories,
            achievements: achievementList
        };
    }
    
    processAchievements(achievementsData) {
        // Define achievement templates
        const achievementTemplates = [
            {
                id: 'first_correct',
                name: 'First Steps',
                description: 'Answer your first question correctly',
                icon: '🎯',
                condition: stats => stats.totalCorrect >= 1
            },
            {
                id: 'streak_5',
                name: 'On Fire',
                description: 'Get 5 correct answers in a row',
                icon: '🔥',
                condition: stats => stats.longestStreak >= 5
            },
            {
                id: 'streak_10',
                name: 'Unstoppable',
                description: 'Get 10 correct answers in a row',
                icon: '⚡',
                condition: stats => stats.longestStreak >= 10
            },
            {
                id: 'total_100',
                name: 'Century',
                description: 'Answer 100 questions',
                icon: '💯',
                condition: stats => stats.totalQuestions >= 100
            },
            {
                id: 'accuracy_80',
                name: 'Sharp Mind',
                description: 'Maintain 80% accuracy over 50 questions',
                icon: '🧠',
                condition: stats => stats.totalQuestions >= 50 && 
                    (stats.totalCorrect / stats.totalQuestions) >= 0.8
            },
            {
                id: 'category_master',
                name: 'Category Master',
                description: 'Get 90% accuracy in any category (min 10 questions)',
                icon: '👑',
                condition: (stats, categories) => {
                    return Object.values(categories || {}).some(cat => 
                        cat.answered >= 10 && cat.accuracy >= 90
                    );
                }
            }
        ];
        
        const stats = this.store.getState().stats;
        const categories = stats.categoryStats || {};
        
        return achievementTemplates.map(template => {
            const earned = achievementsData?.[template.id]?.earned || 
                          template.condition(stats, categories);
            
            const progress = this.calculateAchievementProgress(template, stats, categories);
            
            return {
                ...template,
                earned,
                progress: earned ? 100 : progress
            };
        });
    }
    
    calculateAchievementProgress(achievement, stats, categories) {
        switch (achievement.id) {
            case 'first_correct':
                return stats.totalCorrect > 0 ? 100 : 0;
                
            case 'streak_5':
                return Math.min((stats.longestStreak / 5) * 100, 100);
                
            case 'streak_10':
                return Math.min((stats.longestStreak / 10) * 100, 100);
                
            case 'total_100':
                return Math.min((stats.totalQuestions / 100) * 100, 100);
                
            case 'accuracy_80':
                if (stats.totalQuestions < 50) {
                    return (stats.totalQuestions / 50) * 50;
                }
                const accuracy = stats.totalCorrect / stats.totalQuestions;
                return 50 + (accuracy / 0.8) * 50;
                
            case 'category_master':
                const bestCategory = Object.values(categories)
                    .filter(cat => cat.answered >= 10)
                    .sort((a, b) => b.accuracy - a.accuracy)[0];
                
                if (!bestCategory) {
                    return 0;
                }
                
                return Math.min((bestCategory.accuracy / 90) * 100, 100);
                
            default:
                return 0;
        }
    }
    
    formatPercentage(value) {
        return `${Math.round(value)}%`;
    }
    
    onMount() {
        super.onMount();
        
        // Draw charts if canvas elements exist
        requestAnimationFrame(() => {
            this.drawDailyProgressChart();
            this.drawCategoryDistributionChart();
        });
    }
    
    drawDailyProgressChart() {
        const canvas = this.element.querySelector('#daily-progress-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const stats = this.store.getState().stats;
        const dailyData = stats.dailyProgress || {};
        
        // Simple line chart implementation
        // In production, consider using a lightweight charting library
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.strokeStyle = '#4CAF50';
        ctx.lineWidth = 2;
        
        // Draw axes
        ctx.beginPath();
        ctx.moveTo(40, 10);
        ctx.lineTo(40, 170);
        ctx.lineTo(380, 170);
        ctx.stroke();
        
        // Plot data points
        const days = Object.keys(dailyData).slice(-7);
        if (days.length > 0) {
            const maxValue = Math.max(...days.map(day => dailyData[day].correct || 0));
            const xStep = 340 / (days.length - 1 || 1);
            
            ctx.beginPath();
            days.forEach((day, index) => {
                const value = dailyData[day].correct || 0;
                const x = 40 + (index * xStep);
                const y = 170 - ((value / maxValue) * 150);
                
                if (index === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
                
                // Draw point
                ctx.fillStyle = '#4CAF50';
                ctx.beginPath();
                ctx.arc(x, y, 4, 0, 2 * Math.PI);
                ctx.fill();
            });
            ctx.stroke();
        }
    }
    
    drawCategoryDistributionChart() {
        const canvas = this.element.querySelector('#category-distribution-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const stats = this.store.getState().stats;
        const categories = stats.categoryStats || {};
        
        // Simple pie chart implementation
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        const total = Object.values(categories).reduce((sum, cat) => sum + cat.answered, 0);
        if (total === 0) return;
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = 70;
        
        let currentAngle = -Math.PI / 2;
        const colors = ['#4CAF50', '#2196F3', '#FF9800', '#9C27B0', '#F44336'];
        
        Object.entries(categories)
            .sort(([, a], [, b]) => b.answered - a.answered)
            .slice(0, 5)
            .forEach(([category, data], index) => {
                const sliceAngle = (data.answered / total) * 2 * Math.PI;
                
                ctx.beginPath();
                ctx.moveTo(centerX, centerY);
                ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
                ctx.closePath();
                
                ctx.fillStyle = colors[index % colors.length];
                ctx.fill();
                
                currentAngle += sliceAngle;
            });
    }
    
    getStyles() {
        return `
            ${super.getStyles()}
            
            .stats-modal .modal-content {
                max-width: 800px;
                max-height: 80vh;
                overflow-y: auto;
            }
            
            .stats-container {
                padding: 1rem;
            }
            
            .stats-section {
                margin-bottom: 2rem;
                padding-bottom: 2rem;
                border-bottom: 1px solid var(--border-color, #e0e0e0);
            }
            
            .stats-section:last-child {
                border-bottom: none;
            }
            
            .stats-section h3 {
                margin: 0 0 1rem 0;
                color: var(--primary-color, #333);
                font-size: 1.2rem;
            }
            
            .stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 1rem;
            }
            
            .stat-item {
                background: var(--bg-secondary, #f5f5f5);
                padding: 1rem;
                border-radius: 8px;
                text-align: center;
            }
            
            .stat-label {
                display: block;
                font-size: 0.875rem;
                color: var(--text-secondary, #666);
                margin-bottom: 0.5rem;
            }
            
            .stat-value {
                display: block;
                font-size: 1.5rem;
                font-weight: bold;
                color: var(--primary-color, #333);
            }
            
            .category-list {
                display: flex;
                flex-direction: column;
                gap: 0.75rem;
            }
            
            .category-item {
                display: grid;
                grid-template-columns: 2rem 1fr auto;
                gap: 1rem;
                align-items: center;
                padding: 0.75rem;
                background: var(--bg-secondary, #f5f5f5);
                border-radius: 8px;
            }
            
            .category-rank {
                font-weight: bold;
                color: var(--text-secondary, #666);
            }
            
            .category-name {
                font-weight: 500;
            }
            
            .category-stats {
                text-align: right;
            }
            
            .category-accuracy {
                font-weight: bold;
                color: var(--success-color, #4CAF50);
            }
            
            .category-count {
                font-size: 0.875rem;
                color: var(--text-secondary, #666);
                margin-left: 0.5rem;
            }
            
            .accuracy-bar {
                grid-column: 2 / -1;
                height: 4px;
                background: var(--bg-tertiary, #e0e0e0);
                border-radius: 2px;
                overflow: hidden;
            }
            
            .accuracy-fill {
                height: 100%;
                background: var(--success-color, #4CAF50);
                transition: width 0.3s ease;
            }
            
            .achievements-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 1rem;
            }
            
            .achievement {
                display: flex;
                gap: 1rem;
                padding: 1rem;
                background: var(--bg-secondary, #f5f5f5);
                border-radius: 8px;
                transition: all 0.2s ease;
            }
            
            .achievement.earned {
                background: var(--success-bg, #e8f5e9);
                border: 1px solid var(--success-color, #4CAF50);
            }
            
            .achievement.unearned {
                opacity: 0.6;
                filter: grayscale(0.5);
            }
            
            .achievement-icon {
                font-size: 2rem;
                flex-shrink: 0;
            }
            
            .achievement-info {
                flex: 1;
            }
            
            .achievement-name {
                font-weight: bold;
                margin-bottom: 0.25rem;
            }
            
            .achievement-description {
                font-size: 0.875rem;
                color: var(--text-secondary, #666);
            }
            
            .achievement-progress {
                margin-top: 0.5rem;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .progress-bar {
                flex: 1;
                height: 4px;
                background: var(--bg-tertiary, #e0e0e0);
                border-radius: 2px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background: var(--primary-color, #2196F3);
                transition: width 0.3s ease;
            }
            
            .progress-text {
                font-size: 0.75rem;
                color: var(--text-secondary, #666);
                min-width: 3ch;
            }
            
            .charts-container {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 2rem;
                margin-top: 1rem;
            }
            
            .chart-wrapper {
                background: var(--bg-secondary, #f5f5f5);
                padding: 1rem;
                border-radius: 8px;
            }
            
            .chart-wrapper canvas {
                width: 100%;
                height: auto;
            }
        `;
    }
}
