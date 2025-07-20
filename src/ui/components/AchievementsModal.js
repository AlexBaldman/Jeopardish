/**
 * AchievementsModal.js
 * 
 * Displays user achievements with progress tracking
 * 
 * PRINCIPLE: Clear visual feedback for gamification
 * - Earned vs locked achievements
 * - Progress bars for partial achievements
 * - Engaging icons and descriptions
 */

import { Modal } from './Modal.js';
import { createElement } from '../../utils/helpers.js';
import { getStore } from '../../state/index.js';
import { eventBus } from '../../utils/events.js';

export class AchievementsModal extends Modal {
  constructor() {
    super('achievements-modal', 'Achievements');
    
    this.achievements = [
      {
        id: 'first-win',
        icon: 'trophy',
        name: 'First Win',
        description: 'Win your first game',
        requirement: { type: 'games', value: 1 }
      },
      {
        id: 'hot-streak',
        icon: 'fire',
        name: 'Hot Streak',
        description: 'Get a 5-question streak',
        requirement: { type: 'streak', value: 5 }
      },
      {
        id: 'perfect-score',
        icon: 'star',
        name: 'Perfect Score',
        description: 'Score 1000+ points',
        requirement: { type: 'score', value: 1000 }
      },
      {
        id: 'trivia-master',
        icon: 'crown',
        name: 'Trivia Master',
        description: 'Answer 100 questions correctly',
        requirement: { type: 'correct', value: 100 }
      },
      {
        id: 'category-expert',
        icon: 'brain',
        name: 'Category Expert',
        description: 'Get 10 correct in a single category',
        requirement: { type: 'category', value: 10 }
      },
      {
        id: 'speed-demon',
        icon: 'bolt',
        name: 'Speed Demon',
        description: 'Answer 5 questions in under 30 seconds',
        requirement: { type: 'speed', value: 5 }
      },
      {
        id: 'persistence',
        icon: 'shield-alt',
        name: 'Persistence',
        description: 'Play for 7 consecutive days',
        requirement: { type: 'days', value: 7 }
      },
      {
        id: 'scholar',
        icon: 'graduation-cap',
        name: 'Scholar',
        description: 'Achieve 80% accuracy over 50 questions',
        requirement: { type: 'accuracy', value: 80, minQuestions: 50 }
      }
    ];
    
    this.loadAchievements();
  }
  
  loadAchievements() {
    const saved = localStorage.getItem('jeopardish_achievements');
    if (saved) {
      try {
        this.earnedAchievements = JSON.parse(saved);
      } catch (e) {
        this.earnedAchievements = {};
      }
    } else {
      this.earnedAchievements = {};
    }
  }
  
  saveAchievements() {
    localStorage.setItem('jeopardish_achievements', JSON.stringify(this.earnedAchievements));
  }
  
  checkAchievement(id) {
    const achievement = this.achievements.find(a => a.id === id);
    if (!achievement || this.earnedAchievements[id]) return false;
    
    const store = getStore();
    const state = store.getState();
    const stats = state.stats || {};
    
    switch (achievement.requirement.type) {
      case 'games':
        return stats.totalGames >= achievement.requirement.value;
        
      case 'streak':
        return stats.bestStreak >= achievement.requirement.value;
        
      case 'score':
        return stats.highScore >= achievement.requirement.value;
        
      case 'correct':
        return stats.correctAnswers >= achievement.requirement.value;
        
      case 'category':
        // Check if any category has enough correct answers
        const categories = stats.categoryStats || {};
        return Object.values(categories).some(cat => cat.correct >= achievement.requirement.value);
        
      case 'speed':
        return stats.speedAnswers >= achievement.requirement.value;
        
      case 'days':
        return stats.consecutiveDays >= achievement.requirement.value;
        
      case 'accuracy':
        const accuracy = stats.questionsAnswered > 0 
          ? (stats.correctAnswers / stats.questionsAnswered) * 100 
          : 0;
        return stats.questionsAnswered >= achievement.requirement.minQuestions &&
               accuracy >= achievement.requirement.value;
        
      default:
        return false;
    }
  }
  
  unlockAchievement(id) {
    if (this.earnedAchievements[id]) return;
    
    this.earnedAchievements[id] = {
      unlockedAt: Date.now(),
      date: new Date().toISOString()
    };
    
    this.saveAchievements();
    
    // Emit event for notification
    events.emit('achievement:unlocked', {
      achievement: this.achievements.find(a => a.id === id)
    });
    
    // Update display if modal is open
    if (this.isOpen) {
      this.render();
    }
  }
  
  checkAllAchievements() {
    this.achievements.forEach(achievement => {
      if (this.checkAchievement(achievement.id)) {
        this.unlockAchievement(achievement.id);
      }
    });
  }
  
  getProgress(achievement) {
    const store = getStore();
    const state = store.getState();
    const stats = state.stats || {};
    
    switch (achievement.requirement.type) {
      case 'games':
        return {
          current: stats.totalGames || 0,
          target: achievement.requirement.value
        };
        
      case 'streak':
        return {
          current: stats.currentStreak || 0,
          target: achievement.requirement.value
        };
        
      case 'score':
        return {
          current: stats.currentScore || 0,
          target: achievement.requirement.value
        };
        
      case 'correct':
        return {
          current: stats.correctAnswers || 0,
          target: achievement.requirement.value
        };
        
      case 'category':
        const categories = stats.categoryStats || {};
        const maxCategory = Math.max(...Object.values(categories).map(c => c.correct || 0), 0);
        return {
          current: maxCategory,
          target: achievement.requirement.value
        };
        
      case 'speed':
        return {
          current: stats.speedAnswers || 0,
          target: achievement.requirement.value
        };
        
      case 'days':
        return {
          current: stats.consecutiveDays || 0,
          target: achievement.requirement.value
        };
        
      case 'accuracy':
        const accuracy = stats.questionsAnswered > 0 
          ? Math.round((stats.correctAnswers / stats.questionsAnswered) * 100) 
          : 0;
        return {
          current: accuracy,
          target: achievement.requirement.value,
          note: `(${stats.questionsAnswered}/${achievement.requirement.minQuestions} questions)`
        };
        
      default:
        return { current: 0, target: 1 };
    }
  }
  
  renderContent() {
    return createElement('div', {
      className: 'achievements-content'
    }, [
      this.renderSummary(),
      this.renderAchievementGrid()
    ]);
  }
  
  renderSummary() {
    const total = this.achievements.length;
    const earned = Object.keys(this.earnedAchievements).length;
    const percentage = Math.round((earned / total) * 100);
    
    return createElement('div', {
      className: 'achievements-summary'
    }, [
      createElement('div', {
        className: 'summary-stat'
      }, [
        createElement('span', { className: 'stat-value' }, earned.toString()),
        createElement('span', { className: 'stat-label' }, 'Earned')
      ]),
      createElement('div', {
        className: 'summary-stat'
      }, [
        createElement('span', { className: 'stat-value' }, total.toString()),
        createElement('span', { className: 'stat-label' }, 'Total')
      ]),
      createElement('div', {
        className: 'summary-stat'
      }, [
        createElement('span', { className: 'stat-value' }, `${percentage}%`),
        createElement('span', { className: 'stat-label' }, 'Complete')
      ])
    ]);
  }
  
  renderAchievementGrid() {
    return createElement('div', {
      className: 'achievements-grid'
    }, this.achievements.map(achievement => this.renderAchievement(achievement)));
  }
  
  renderAchievement(achievement) {
    const isEarned = !!this.earnedAchievements[achievement.id];
    const progress = this.getProgress(achievement);
    const progressPercentage = Math.min(100, Math.round((progress.current / progress.target) * 100));
    
    const achievementEl = createElement('div', {
      className: `achievement-item ${isEarned ? 'earned' : 'locked'}`,
      'data-achievement': achievement.id
    }, [
      createElement('i', { 
        className: `fas fa-${achievement.icon} achievement-icon` 
      }),
      createElement('h3', { className: 'achievement-name' }, achievement.name),
      createElement('p', { className: 'achievement-description' }, achievement.description),
      
      !isEarned && createElement('div', {
        className: 'achievement-progress'
      }, [
        createElement('div', {
          className: 'progress-bar'
        }, [
          createElement('div', {
            className: 'progress-fill',
            style: `width: ${progressPercentage}%`
          })
        ]),
        createElement('span', {
          className: 'progress-text'
        }, `${progress.current} / ${progress.target} ${progress.note || ''}`)
      ]),
      
      isEarned && createElement('div', {
        className: 'achievement-earned'
      }, [
        createElement('i', { className: 'fas fa-check' }),
        createElement('span', {}, 
          new Date(this.earnedAchievements[achievement.id].unlockedAt).toLocaleDateString()
        )
      ])
    ]);
    
    return achievementEl;
  }
  
  open() {
    // Check achievements when opening
    this.checkAllAchievements();
    super.open();
  }
}

// Auto-check achievements on game events
events.on('game:answer_submitted', () => {
  const modal = document.querySelector('#achievements-modal');
  if (modal && modal.__component) {
    modal.__component.checkAllAchievements();
  }
});

events.on('game:ended', () => {
  const modal = document.querySelector('#achievements-modal');
  if (modal && modal.__component) {
    modal.__component.checkAllAchievements();
  }
});
