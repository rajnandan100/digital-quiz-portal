// ===== LEADERBOARD PAGE - COMPLETE FUNCTIONALITY =====

class LeaderboardManager {
    constructor() {
        this.currentUser = null;
        this.leaderboardData = [];
        this.quizInfo = null;
        this.currentFilter = 'all';
        this.currentSort = 'score';
        this.currentPage = 1;
        this.itemsPerPage = 20;
        
        this.init();
    }

    init() {
        // Wait for Firebase and DOM to be ready
        if (typeof firebase !== 'undefined' && document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else if (typeof firebase !== 'undefined') {
            this.setup();
        } else {
            setTimeout(() => this.init(), 100);
        }
    }

    setup() {
        // Check authentication
        firebase.auth().onAuthStateChanged((user) => {
            this.currentUser = user;
            if (user) {
                this.updateUserUI(user);
                this.loadLeaderboard();
            } else {
                // Redirect to home if not authenticated
                window.location.href = '../index.html';
            }
        });

        this.setupEventListeners();
    }

    loadLeaderboard() {
        const urlParams = new URLSearchParams(window.location.search);
        const quizId = urlParams.get('quiz') || 'gk-001';
        
        this.showLoading(true);
        
        // Generate sample data for demonstration
        setTimeout(() => {
            this.quizInfo = {
                id: quizId,
                title: 'General Knowledge Challenge 2024',
                totalParticipants: 1247,
                averageScore: 72,
                averageTime: '22:15'
            };
            
            this.leaderboardData = this.generateSampleLeaderboard();
            this.displayLeaderboard();
            this.showLoading(false);
        }, 1500);
    }

    generateSampleLeaderboard() {
        const names = [
            'Alex Johnson', 'Sarah Wilson', 'Mike Chen', 'Emma Davis', 'James Brown',
            'Lisa Garcia', 'David Miller', 'Anna Rodriguez', 'Chris Taylor', 'Maria Lopez',
            'Robert Anderson', 'Jennifer Moore', 'Michael Jackson', 'Ashley White', 'Daniel Harris',
            'Jessica Martin', 'Matthew Thompson', 'Emily Clark', 'Andrew Lewis', 'Michelle Lee',
            'John Walker', 'Amanda Hall', 'Kevin Young', 'Stephanie King', 'Brian Wright',
            'Nicole Green', 'Justin Adams', 'Rachel Baker', 'Ryan Nelson', 'Laura Hill'
        ];

        const leaderboard = [];
        
        for (let i = 0; i < 100; i++) {
            const score = Math.floor(Math.random() * 40) + 60; // 60-100%
            const time = Math.floor(Math.random() * 900) + 600; // 10-25 minutes
            const name = names[Math.floor(Math.random() * names.length)];
            const date = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
            
            leaderboard.push({
                rank: i + 1,
                name: i === 22 ? this.currentUser?.displayName || 'You' : `${name} ${i + 1}`,
                score: score,
                time: time,
                date: date,
                isCurrentUser: i === 22,
                avatar: i === 22 ? 
                    (this.currentUser?.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(this.currentUser?.displayName || 'You')}&background=4F46E5&color=fff`) :
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${this.getRandomColor()}&color=fff`
            });
        }
        
        // Sort by score (descending), then by time (ascending)
        leaderboard.sort((a, b) => {
            if (a.score !== b.score) {
                return b.score - a.score;
            }
            return a.time - b.time;
        });
        
        // Update ranks after sorting
        leaderboard.forEach((entry, index) => {
            entry.rank = index + 1;
        });
        
        return leaderboard;
    }

    getRandomColor() {
        const colors = ['4F46E5', '10b981', 'f59e0b', 'ef4444', '8b5cf6', '06b6d4'];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    displayLeaderboard() {
        this.updateQuizInfo();
        this.updatePodium();
        this.updateUserPosition();
        this.updateLeaderboardList();
        this.updateStats();
    }

    updateQuizInfo() {
        document.getElementById('quiz-title').textContent = this.quizInfo.title;
        document.getElementById('total-participants').textContent = `${this.quizInfo.totalParticipants.toLocaleString()} participants`;
        document.getElementById('avg-score').textContent = `Avg Score: ${this.quizInfo.averageScore}%`;
        document.getElementById('avg-time').textContent = `Avg Time: ${this.quizInfo.averageTime}`;
    }

    updatePodium() {
        const top3 = this.leaderboardData.slice(0, 3);
        
        // Update podium positions (note the order: 2nd, 1st, 3rd)
        const podiumOrder = [1, 0, 2]; // indices for 2nd, 1st, 3rd place
        const podiumElements = document.querySelectorAll('.podium-position');
        
        podiumOrder.forEach((dataIndex, elementIndex) => {
            if (top3[dataIndex] && podiumElements[elementIndex]) {
                const participant = top3[dataIndex];
                const podium = podiumElements[elementIndex];
                
                const avatar = podium.querySelector('.podium-avatar img');
                const name = podium.querySelector('.podium-name');
                const score = podium.querySelector('.podium-score');
                const time = podium.querySelector('.podium-time');
                
                if (avatar) avatar.src = participant.avatar;
                if (name) name.textContent = participant.name;
                if (score) score.textContent = `${participant.score}%`;
                if (time) time.textContent = this.formatTime(participant.time);
            }
        });
    }

    updateUserPosition() {
        const userEntry = this.leaderboardData.find(entry => entry.isCurrentUser);
        
        if (userEntry) {
            document.getElementById('user-name').textContent = userEntry.name;
            document.getElementById('user-score').textContent = `${userEntry.score}%`;
            document.getElementById('user-time').textContent = this.formatTime(userEntry.time);
            
            // Update rank display
            const rankElement = document.querySelector('.position-rank');
            if (rankElement) {
                rankElement.textContent = `#${userEntry.rank}`;
            }
            
            // Update position difference text
            const top10Diff = Math.max(0, userEntry.rank - 10);
            const positionDiff = document.getElementById('position-diff');
            if (positionDiff) {
                if (userEntry.rank <= 10) {
                    positionDiff.textContent = 'You\'re in the top 10! 🎉';
                } else {
                    positionDiff.textContent = `${top10Diff} spots away from top 10!`;
                }
            }
            
            // Update progress bar
            const progressBar = document.getElementById('position-progress');
            if (progressBar) {
                const progress = Math.max(0, 100 - (userEntry.rank / this.leaderboardData.length * 100));
                progressBar.style.width = `${progress}%`;
            }
        }
    }

    updateLeaderboardList() {
        const container = document.getElementById('leaderboard-items');
        if (!container) return;
        
        container.innerHTML = '';
        
        const filteredData = this.getFilteredData();
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = filteredData.slice(startIndex, endIndex);
        
        pageData.forEach(participant => {
            const listItem = this.createLeaderboardItem(participant);
            container.appendChild(listItem);
        });
        
        // Update load more button
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            if (endIndex >= filteredData.length) {
                loadMoreBtn.style.display = 'none';
            } else {
                loadMoreBtn.style.display = 'block';
            }
        }
    }

    createLeaderboardItem(participant) {
        const item = document.createElement('div');
        item.className = `leaderboard-item ${participant.isCurrentUser ? 'current-user' : ''}`;
        
        const medal = participant.rank <= 3 ? this.getMedalIcon(participant.rank) : '';
        const date = participant.date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
        
        item.innerHTML = `
            <div class="item-rank">
                ${medal || `#${participant.rank}`}
            </div>
            <div class="item-player">
                <img src="${participant.avatar}" alt="${participant.name}" class="player-avatar">
                <div class="player-info">
                    <div class="player-name">${participant.name}</div>
                    ${participant.isCurrentUser ? '<div class="current-user-badge">You</div>' : ''}
                </div>
            </div>
            <div class="item-score">${participant.score}%</div>
            <div class="item-time">${this.formatTime(participant.time)}</div>
            <div class="item-date">${date}</div>
        `;
        
        return item;
    }

    getMedalIcon(rank) {
        const medals = {
            1: '<i class="fas fa-trophy" style="color: #ffd700;"></i>',
            2: '<i class="fas fa-medal" style="color: #c0c0c0;"></i>',
            3: '<i class="fas fa-medal" style="color: #cd7f32;"></i>'
        };
        return medals[rank] || '';
    }

    getFilteredData() {
        let filtered = [...this.leaderboardData];
        
        // Apply time filter
        const now = new Date();
        if (this.currentFilter === 'today') {
            filtered = filtered.filter(p => {
                const diff = now - p.date;
                return diff < 24 * 60 * 60 * 1000;
            });
        } else if (this.currentFilter === 'week') {
            filtered = filtered.filter(p => {
                const diff = now - p.date;
                return diff < 7 * 24 * 60 * 60 * 1000;
            });
        } else if (this.currentFilter === 'month') {
            filtered = filtered.filter(p => {
                const diff = now - p.date;
                return diff < 30 * 24 * 60 * 60 * 1000;
            });
        }
        
        // Apply sorting
        if (this.currentSort === 'score') {
            filtered.sort((a, b) => {
                if (a.score !== b.score) return b.score - a.score;
                return a.time - b.time;
            });
        } else if (this.currentSort === 'time') {
            filtered.sort((a, b) => a.time - b.time);
        } else if (this.currentSort === 'date') {
            filtered.sort((a, b) => b.date - a.date);
        }
        
        return filtered;
    }

    updateStats() {
        if (this.leaderboardData.length === 0) return;
        
        const scores = this.leaderboardData.map(p => p.score);
        const times = this.leaderboardData.map(p => p.time);
        
        const highestScore = Math.max(...scores);
        const fastestTime = Math.min(...times);
        const averageScore = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        
        // Update statistics
        const statsElements = document.querySelectorAll('.stat-number');
        if (statsElements.length >= 4) {
            statsElements[0].textContent = `${highestScore}%`;
            statsElements[1].textContent = this.formatTime(fastestTime);
            statsElements[2].textContent = this.leaderboardData.length.toLocaleString();
            statsElements[3].textContent = `${averageScore}%`;
        }
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    setupEventListeners() {
        // Filter tabs
        const filterTabs = document.querySelectorAll('.filter-tab');
        filterTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                this.currentFilter = filter;
                this.currentPage = 1;
                
                // Update active state
                filterTabs.forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                
                this.updateLeaderboardList();
            });
        });
        
        // Sort select
        const sortSelect = document.getElementById('sort-select');
        if (sortSelect) {
            sortSelect.addEventListener('change', (e) => {
                this.currentSort = e.target.value;
                this.currentPage = 1;
                this.updateLeaderboardList();
            });
        }
        
        // Load more button
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => {
                this.currentPage++;
                this.loadMoreItems();
            });
        }
    }

    loadMoreItems() {
        const container = document.getElementById('leaderboard-items');
        if (!container) return;
        
        const filteredData = this.getFilteredData();
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = startIndex + this.itemsPerPage;
        const pageData = filteredData.slice(startIndex, endIndex);
        
        pageData.forEach(participant => {
            const listItem = this.createLeaderboardItem(participant);
            container.appendChild(listItem);
        });
        
        // Update load more button
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            if (endIndex >= filteredData.length) {
                loadMoreBtn.style.display = 'none';
            }
        }
    }

    updateUserUI(user) {
        const userAvatar = document.getElementById('user-avatar');
        if (userAvatar && user) {
            userAvatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=4F46E5&color=fff`;
        }
    }

    showLoading(show) {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.classList.toggle('show', show);
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        const bgColor = {
            'info': '#4f46e5',
            'success': '#10b981',
            'warning': '#f59e0b',
            'error': '#ef4444'
        }[type] || '#4f46e5';
        
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            z-index: 10001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            font-weight: 500;
        `;
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Global functions for HTML onclick handlers
function shareLeaderboard() {
    const text = `Check out the leaderboard for the General Knowledge Challenge! Can you beat the top scores? ${window.location.origin}`;
    
    if (navigator.share) {
        navigator.share({
            title: 'Quiz Leaderboard',
            text: text,
            url: window.location.origin
        });
    } else {
        // Fallback to copying to clipboard
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                if (window.leaderboardManager) {
                    window.leaderboardManager.showToast('Leaderboard link copied!', 'success');
                }
            });
        }
    }
}

// Initialize leaderboard manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.leaderboardManager = new LeaderboardManager();
});
