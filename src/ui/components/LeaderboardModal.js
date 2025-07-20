import { Modal } from './Modal.js';
import { createElement } from '../../utils/helpers.js';

class LeaderboardModal extends Modal {
    constructor() {
        super('Leaderboard');
        this.topScoresTab = null;
        this.topStreaksTab = null;
        this.setupLeaderboardTabs();
    }

    setupLeaderboardTabs() {
        const tabsContainer = createElement('div', {
            className: 'modal-tabs-container'
        });

        this.topScoresTab = createElement('button', {
            textContent: 'Top Scores',
            className: 'tab-button active',
            onclick: () => this.switchTab('scores')
        });

        this.topStreaksTab = createElement('button', {
            textContent: 'Top Streaks',
            className: 'tab-button',
            onclick: () => this.switchTab('streaks')
        });

        tabsContainer.append(this.topScoresTab, this.topStreaksTab);
        this.content.append(tabsContainer, this.createLeaderboardContent());
        this.switchTab('scores');
    }

    createLeaderboardContent() {
        return createElement('div', {
            className: 'leaderboard-content'
        });
    }

    switchTab(tabName) {
        if (tabName === 'scores') {
            this.topScoresTab.classList.add('active');
            this.topStreaksTab.classList.remove('active');
        } else {
            this.topScoresTab.classList.remove('active');
            this.topStreaksTab.classList.add('active');
        }
        this.updateLeaderboardContent(tabName);
    }

    updateLeaderboardContent(tabName) {
        if (tabName === 'scores') {
            this.fetchAndDisplayScores();
        } else {
            this.fetchAndDisplayStreaks();
        }
    }

    fetchAndDisplayScores() {
        // Mock implementation for now
        const scores = [
            { player: 'Alice', score: 3000 },
            { player: 'Bob', score: 2500 },
            { player: 'Charlie', score: 2000 }
        ];
        const content = this.renderLeaderboardItems(scores, 'score');
        this.replaceLeaderboardContent(content);
    }

    fetchAndDisplayStreaks() {
        // Mock implementation for now
        const streaks = [
            { player: 'Dave', streak: 15 },
            { player: 'Eve', streak: 10 },
            { player: 'Frank', streak: 7 }
        ];
        const content = this.renderLeaderboardItems(streaks, 'streak');
        this.replaceLeaderboardContent(content);
    }

    renderLeaderboardItems(items, key) {
        const container = createElement('ul', {
            className: 'leaderboard-items'
        });
        items.forEach(item => {
            const li = createElement('li', {
                textContent: `${item.player}: ${item[key]}`
            });
            container.append(li);
        });
        return container;
    }

    replaceLeaderboardContent(newContent) {
        const contentArea = this.content.querySelector('.leaderboard-content');
        contentArea.innerHTML = '';
        contentArea.append(newContent);
    }
}

export default LeaderboardModal;
