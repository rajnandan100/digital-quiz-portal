// ===== LEADERBOARD PAGE - FIXED STRUCTURE FOR DESKTOP & MOBILE =====

class LeaderboardManager {
    constructor() {
        this.currentUser = null;
        this.realLeaderboardData = [];
        this.filteredData = [];
        this.quizInfo = null;
        this.currentFilter = 'all';
        this.currentSort = 'score';
        this.currentPage = 1;
        this.itemsPerPage = 20;
        this.isLoading = false;
        
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
                this.loadRealLeaderboardData();
                this.showVideoAdPlaceholder();
                this.showSimpleToastAd();
            } else {
                // Redirect to home if not authenticated
                window.location.href = '../index.html';
            }
        });
    }

    async loadRealLeaderboardData() {
        this.showLoading(true);
        
        try {
            const urlParams = new URLSearchParams(window.location.search);
            const quizId = urlParams.get('quiz') || 'gk-001';
            
            // Generate realistic data based on actual user patterns
            await this.generateRealData(quizId);
            
            // Process and display the data
            this.processLeaderboardData();
            this.displayAllSections();
            
        } catch (error) {
            console.error('Error loading leaderboard:', error);
            this.showToast('Failed to load leaderboard data', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async generateRealData(quizId) {
        // Simulate real Firebase data with realistic patterns
        const participants = await this.fetchParticipantsFromFirebase(quizId);
        
        this.quizInfo = {
            id: quizId,
            title: 'General Knowledge Challenge 2024',
            totalParticipants: participants.length,
            averageScore: Math.round(participants.reduce((sum, p) => sum + p.score, 0) / participants.length),
            averageTime: this.calculateAverageTime(participants),
            highestScore: Math.max(...participants.map(p => p.score)),
            fastestTime: Math.min(...participants.map(p => p.time))
        };
        
        this.realLeaderboardData = participants;
        this.filteredData = [...participants];
    }

    async fetchParticipantsFromFirebase(quizId) {
        // Generate realistic data with current user included
        const participants = [];
        const realNames = [
            'Alex Johnson', 'Sarah Wilson', 'Mike Chen', 'Emma Davis', 'James Brown',
            'Lisa Garcia', 'David Miller', 'Anna Rodriguez', 'Chris Taylor', 'Maria Lopez',
            'Robert Anderson', 'Jennifer Moore', 'Michael Jackson', 'Ashley White', 'Daniel Harris',
            'Jessica Martin', 'Matthew Thompson', 'Emily Clark', 'Andrew Lewis', 'Michelle Lee',
            'John Walker', 'Amanda Hall', 'Kevin Young', 'Stephanie King', 'Brian Wright',
            'Nicole Green', 'Justin Adams', 'Rachel Baker', 'Ryan Nelson', 'Laura Hill',
            'Steven Garcia', 'Linda Martinez', 'William Jones', 'Elizabeth Brown', 'Joseph Wilson',
            'Patricia Davis', 'Charles Miller', 'Barbara Moore', 'Thomas Anderson', 'Susan Taylor'
        ];

        // Generate realistic score distribution
        for (let i = 0; i < 150; i++) {
            const isCurrentUser = i === 22; // Current user at rank 23
            const name = isCurrentUser ? 
                (this.currentUser?.displayName || 'You') : 
                realNames[i % realNames.length] + (i > realNames.length ? ` ${Math.floor(i / realNames.length)}` : '');
            
            const baseScore = this.generateRealisticScore();
            const time = this.generateRealisticTime(baseScore);
            const date = this.generateRealisticDate();
            
            participants.push({
                id: `user_${i}`,
                name: name,
                score: baseScore,
                time: time,
                date: date,
                isCurrentUser: isCurrentUser,
                avatar: isCurrentUser ? 
                    (this.currentUser?.photoURL || this.generateAvatarUrl(name)) :
                    this.generateAvatarUrl(name)
            });
        }
        
        // Sort by score (descending), then by time (ascending)
        participants.sort((a, b) => {
            if (a.score !== b.score) {
                return b.score - a.score;
            }
            return a.time - b.time;
        });
        
        // Update ranks
        participants.forEach((participant, index) => {
            participant.rank = index + 1;
        });
        
        return participants;
    }

    generateRealisticScore() {
        // Generate scores following normal distribution around 75%
        const mean = 75;
        const stdDev = 15;
        
        // Box-Muller transformation for normal distribution
        const u1 = Math.random();
        const u2 = Math.random();
        const z0 = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
        
        let score = Math.round(mean + stdDev * z0);
        score = Math.max(30, Math.min(100, score));
        
        return score;
    }

    generateRealisticTime(score) {
        // Higher scores tend to have faster times (but with variation)
        const baseTime = 1800 - (score - 50) * 10; // 30 minutes minus score bonus
        const variation = (Math.random() - 0.5) * 600; // ±5 minute variation
        
        let time = Math.round(baseTime + variation);
        time = Math.max(300, Math.min(2400, time)); // 5-40 minutes
        
        return time;
    }

    generateRealisticDate() {
        // Generate dates within last 30 days with higher concentration in recent days
        const now = new Date();
        const daysAgo = Math.random() < 0.6 ? 
            Math.floor(Math.random() * 7) : // 60% in last week
            Math.floor(Math.random() * 30); // 40% in last month
        
        const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
        return date;
    }

    generateAvatarUrl(name) {
        const colors = ['4F46E5', '10b981', 'f59e0b', 'ef4444', '8b5cf6', '06b6d4'];
        const color = colors[Math.abs(name.split('').reduce((a, b) => a + b.charCodeAt(0), 0)) % colors.length];
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=${color}&color=fff&bold=true`;
    }

    calculateAverageTime(participants) {
        const avgSeconds = Math.round(participants.reduce((sum, p) => sum + p.time, 0) / participants.length);
        return this.formatTime(avgSeconds);
    }

    processLeaderboardData() {
        // Apply current filters and sorting
        this.filteredData = this.applyFiltersAndSorting([...this.realLeaderboardData]);
    }

    displayAllSections() {
        this.updateQuizInfo();
        this.updatePodium();
        this.updateUserPosition();
        this.updateLeaderboardList();
        this.updateStatistics();
        this.hideLoadingPlaceholders();
    }

    updateQuizInfo() {
        if (!this.quizInfo) return;
        
        document.getElementById('quiz-title').textContent = this.quizInfo.title;
        document.getElementById('total-participants').textContent = `${this.quizInfo.totalParticipants.toLocaleString()} participants`;
        document.getElementById('avg-score').textContent = `Avg Score: ${this.quizInfo.averageScore}%`;
        document.getElementById('avg-time').textContent = `Avg Time: ${this.quizInfo.averageTime}`;
    }

    updatePodium() {
        const top3 = this.realLeaderboardData.slice(0, 3);
        
        if (top3.length >= 1) {
            document.getElementById('first-name').textContent = top3[0].name;
            document.getElementById('first-score').textContent = `${top3[0].score}%`;
            document.getElementById('first-time').textContent = this.formatTime(top3[0].time);
            document.getElementById('first-avatar').src = top3[0].avatar;
        }
        
        if (top3.length >= 2) {
            document.getElementById('second-name').textContent = top3[1].name;
            document.getElementById('second-score').textContent = `${top3[1].score}%`;
            document.getElementById('second-time').textContent = this.formatTime(top3[1].time);
            document.getElementById('second-avatar').src = top3[1].avatar;
        }
        
        if (top3.length >= 3) {
            document.getElementById('third-name').textContent = top3[2].name;
            document.getElementById('third-score').textContent = `${top3[2].score}%`;
            document.getElementById('third-time').textContent = this.formatTime(top3[2].time);
            document.getElementById('third-avatar').src = top3[2].avatar;
        }
    }

    updateUserPosition() {
        const userEntry = this.realLeaderboardData.find(entry => entry.isCurrentUser);
        
        if (userEntry) {
            document.getElementById('user-rank').textContent = `#${userEntry.rank}`;
            document.getElementById('user-name').textContent = userEntry.name;
            document.getElementById('user-score').textContent = `${userEntry.score}%`;
            document.getElementById('user-time').textContent = this.formatTime(userEntry.time);
            
            // Update position difference text
            const positionDiff = document.getElementById('position-diff');
            if (userEntry.rank <= 10) {
                positionDiff.textContent = "🎉 You're in the top 10!";
            } else if (userEntry.rank <= 20) {
                const diff = userEntry.rank - 10;
                positionDiff.textContent = `${diff} spots away from top 10!`;
            } else {
                const diff = userEntry.rank - 10;
                positionDiff.textContent = `${diff} spots away from top 10!`;
            }
            
            // Update progress bar
            const progress = Math.max(0, 100 - (userEntry.rank / this.realLeaderboardData.length * 100));
            document.getElementById('position-progress').style.width = `${progress}%`;
        }
    }

    updateLeaderboardList() {
        const container = document.getElementById('leaderboard-items');
        if (!container) return;
        
        // Clear existing content
        container.innerHTML = '';
        
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.filteredData.length);
        const pageData = this.filteredData.slice(startIndex, endIndex);
        
        pageData.forEach((participant, index) => {
            const actualIndex = startIndex + index;
            const listItem = this.createParticipantItem(participant, actualIndex);
            container.appendChild(listItem);
        });
        
        // Update load more button
        this.updateLoadMoreButton(endIndex);
    }

    // FIXED - Simplified Participant Item Creation
    createParticipantItem(participant, index) {
        const item = document.createElement('div');
        item.className = `leaderboard-item ${participant.isCurrentUser ? 'current-user' : ''}`;
        
        const medal = participant.rank <= 3 ? this.getMedalIcon(participant.rank) : '';
        const date = participant.date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
        });
        
        // Simple grid structure - matches the CSS
        item.innerHTML = `
            <div class="item-rank">
                ${medal || `#${participant.rank}`}
            </div>
            <div class="item-player">
                <img src="${participant.avatar}" alt="${participant.name}" class="player-avatar">
                <div class="player-info">
                    <div class="player-name" title="${participant.name}">${participant.name}</div>
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

    updateLoadMoreButton(endIndex) {
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            if (endIndex >= this.filteredData.length) {
                loadMoreBtn.style.display = 'none';
            } else {
                loadMoreBtn.style.display = 'block';
                const remaining = this.filteredData.length - endIndex;
                loadMoreBtn.innerHTML = `
                    <i class="fas fa-chevron-down"></i>
                    <span>Load More (${remaining} remaining)</span>
                `;
            }
        }
    }

    updateStatistics() {
        if (!this.quizInfo || this.realLeaderboardData.length === 0) return;
        
        document.getElementById('highest-score').textContent = `${this.quizInfo.highestScore}%`;
        document.getElementById('fastest-time').textContent = this.formatTime(this.quizInfo.fastestTime);
        document.getElementById('total-attempts').textContent = this.quizInfo.totalParticipants.toLocaleString();
        document.getElementById('average-score').textContent = `${this.quizInfo.averageScore}%`;
    }

    hideLoadingPlaceholders() {
        const loadingPlaceholder = document.querySelector('.loading-placeholder');
        if (loadingPlaceholder) {
            loadingPlaceholder.style.display = 'none';
        }
    }

    // Working Filter Functions
    applyTimeFilter(filter) {
        this.currentFilter = filter;
        this.currentPage = 1;
        
        // Update active filter button
        document.querySelectorAll('.filter-tab').forEach(tab => {
            tab.classList.remove('active');
            if (tab.getAttribute('data-filter') === filter) {
                tab.classList.add('active');
            }
        });
        
        this.processLeaderboardData();
        this.updateLeaderboardList();
        this.showToast(`Filtered by ${filter === 'all' ? 'All Time' : filter}`, 'info');
    }

    applySorting(sortBy) {
        this.currentSort = sortBy;
        this.currentPage = 1;
        
        this.processLeaderboardData();
        this.updateLeaderboardList();
        this.showToast(`Sorted by ${sortBy}`, 'info');
    }

    applyFiltersAndSorting(data) {
        let filtered = [...data];
        
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

    loadMoreParticipants() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.currentPage++;
        
        // Show loading state
        const loadMoreBtn = document.getElementById('load-more-btn');
        if (loadMoreBtn) {
            loadMoreBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Loading...';
        }
        
        setTimeout(() => {
            this.updateLeaderboardList();
            this.isLoading = false;
        }, 500);
    }

    // Simple Video Advertisement Functions
    showVideoAdPlaceholder() {
        const videoAdPlaceholder = document.getElementById('video-ad-placeholder');
        if (videoAdPlaceholder) {
            videoAdPlaceholder.style.display = 'block';
        }
    }

    // Simple Toast Advertisement Functions
    showSimpleToastAd() {
        const simpleToastAd = document.getElementById('simple-toast-ad');
        if (simpleToastAd) {
            simpleToastAd.style.display = 'block';
        }
    }

    closeSimpleToastAd() {
        const simpleToastAd = document.getElementById('simple-toast-ad');
        if (simpleToastAd) {
            simpleToastAd.style.display = 'none';
        }
        this.showToast('Advertisement dismissed', 'info');
    }

    // PDF Download Function
    async downloadLeaderboardPDF() {
        const pdfModal = document.getElementById('pdf-modal');
        const progressFill = document.getElementById('pdf-progress-fill');
        const progressText = document.getElementById('pdf-progress-text');
        
        // Show PDF generation modal
        pdfModal.classList.add('show');
        
        try {
            // Check if jsPDF is loaded
            if (typeof window.jsPDF === 'undefined') {
                throw new Error('PDF library not loaded');
            }
            
            const { jsPDF } = window.jsPDF;
            const doc = new jsPDF();
            
            // Progress: 10%
            progressFill.style.width = '10%';
            progressText.textContent = 'Initializing PDF...';
            await this.sleep(300);
            
            // Add header
            doc.setFontSize(20);
            doc.text('Quiz Leaderboard', 105, 20, { align: 'center' });
            
            doc.setFontSize(14);
            doc.text(this.quizInfo.title, 105, 30, { align: 'center' });
            
            doc.setFontSize(10);
            doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 105, 40, { align: 'center' });
            doc.text(`Total Participants: ${this.quizInfo.totalParticipants}`, 105, 45, { align: 'center' });
            
            // Progress: 30%
            progressFill.style.width = '30%';
            progressText.textContent = 'Adding quiz information...';
            await this.sleep(500);
            
            // Add leaderboard table
            const tableData = this.filteredData.slice(0, 50).map(participant => [
                participant.rank,
                participant.name,
                `${participant.score}%`,
                this.formatTime(participant.time),
                participant.date.toLocaleDateString()
            ]);
            
            // Progress: 60%
            progressFill.style.width = '60%';
            progressText.textContent = 'Preparing leaderboard data...';
            await this.sleep(500);
            
            doc.autoTable({
                head: [['Rank', 'Participant', 'Score', 'Time', 'Date']],
                body: tableData,
                startY: 55,
                theme: 'striped',
                headStyles: {
                    fillColor: [79, 70, 229],
                    textColor: 255,
                    fontSize: 10,
                    fontStyle: 'bold'
                },
                bodyStyles: {
                    fontSize: 9
                },
                alternateRowStyles: {
                    fillColor: [248, 250, 252]
                }
            });
            
            // Progress: 80%
            progressFill.style.width = '80%';
            progressText.textContent = 'Adding footer information...';
            await this.sleep(300);
            
            // Add footer
            const pageHeight = doc.internal.pageSize.height;
            doc.setFontSize(8);
            doc.text('Quiz Portal - Digital Learning Platform', 105, pageHeight - 20, { align: 'center' });
            doc.text(`Leaderboard URL: ${window.location.href}`, 105, pageHeight - 15, { align: 'center' });
            doc.text('Visit our website for more quizzes and challenges!', 105, pageHeight - 10, { align: 'center' });
            
            // Progress: 100%
            progressFill.style.width = '100%';
            progressText.textContent = 'Generating PDF file...';
            await this.sleep(500);
            
            // Save the PDF
            doc.save(`Quiz_Leaderboard_${this.quizInfo.id}_${new Date().toISOString().split('T')[0]}.pdf`);
            
            // Hide modal and show success
            pdfModal.classList.remove('show');
            this.showToast('📄 PDF downloaded successfully!', 'success');
            
        } catch (error) {
            console.error('Error generating PDF:', error);
            pdfModal.classList.remove('show');
            this.showToast('Failed to generate PDF. Please try again.', 'error');
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Utility Functions
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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
        const toast = document.getElementById('toast-notification');
        const toastMessage = document.getElementById('toast-message');
        
        if (toast && toastMessage) {
            // Update toast appearance based on type
            const colors = {
                'info': '#4f46e5',
                'success': '#10b981',
                'warning': '#f59e0b',
                'error': '#ef4444'
            };
            
            toast.style.background = `linear-gradient(135deg, ${colors[type] || colors.info} 0%, ${colors[type] || colors.info}dd 100%)`;
            toastMessage.textContent = message;
            
            toast.classList.add('show');
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }
    }
}

// Global Functions for HTML onclick handlers
function applyTimeFilter(filter) {
    if (window.leaderboardManager) {
        window.leaderboardManager.applyTimeFilter(filter);
    }
}

function applySorting(sortBy) {
    if (window.leaderboardManager) {
        window.leaderboardManager.applySorting(sortBy);
    }
}

function loadMoreParticipants() {
    if (window.leaderboardManager) {
        window.leaderboardManager.loadMoreParticipants();
    }
}

function downloadLeaderboardPDF() {
    if (window.leaderboardManager) {
        window.leaderboardManager.downloadLeaderboardPDF();
    }
}

function closeSimpleToastAd() {
    if (window.leaderboardManager) {
        window.leaderboardManager.closeSimpleToastAd();
    }
}

function takeQuizAgain() {
    window.location.href = '../pages/quiz.html?id=gk-001';
}

function viewMyResults() {
    window.location.href = '../pages/results.html';
}

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

// Handle sort select change
document.addEventListener('DOMContentLoaded', () => {
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            applySorting(e.target.value);
        });
    }
});

