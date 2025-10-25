// ===== FIXED ADMIN DASHBOARD - NO LOADING CONFLICTS =====
console.log('Loading Fixed Admin Dashboard...');

class FixedAdminDashboard {
    constructor() {
        this.realTimeListeners = [];
        this.statsCache = {};
        this.isActive = true;
        this.loadingTimeouts = [];
    }

    init() {
        console.log('Initializing Fixed Admin Dashboard...');
        this.setupEventListeners();
        this.setupNavigation();
        
        // Start monitoring immediately without loading delay
        setTimeout(() => {
            this.startRealTimeMonitoring();
        }, 500);
    }

    setupEventListeners() {
        // Sidebar toggle
        const sidebarToggle = document.getElementById('sidebar-toggle');
        const sidebar = document.getElementById('admin-sidebar');
        if (sidebarToggle && sidebar) {
            sidebarToggle.addEventListener('click', () => {
                sidebar.classList.toggle('open');
            });
        }

        // Profile dropdown
        const profileBtn = document.getElementById('admin-profile-btn');
        const dropdown = document.getElementById('admin-dropdown');
        if (profileBtn && dropdown) {
            profileBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
            });
            
            document.addEventListener('click', () => {
                dropdown.style.display = 'none';
            });
        }

        // Visibility change detection
        document.addEventListener('visibilitychange', () => {
            this.isActive = !document.hidden;
        });
    }

    setupNavigation() {
        const menuItems = document.querySelectorAll('.menu-item[data-section]');
        
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = item.dataset.section;
                this.switchSection(sectionId);
                
                // Update active state
                menuItems.forEach(mi => mi.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    switchSection(sectionId) {
        // Hide all sections
        const sections = document.querySelectorAll('.admin-section');
        sections.forEach(section => {
            section.classList.remove('active');
        });
        
        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
            this.loadSectionData(sectionId);
        }
    }

    loadSectionData(sectionId) {
        switch(sectionId) {
            case 'quiz-management':
                if (typeof loadQuizzes === 'function') {
                    loadQuizzes();
                }
                break;
            case 'user-management':
                if (typeof loadUsers === 'function') {
                    loadUsers();
                }
                break;
        }
    }

    // ===== FIXED REAL-TIME MONITORING =====
    startRealTimeMonitoring() {
        console.log('Starting real-time monitoring...');
        
        if (typeof firebase === 'undefined' || !firebase.apps.length) {
            console.warn('Firebase not available');
            this.showPlaceholderData();
            return;
        }

        // Clear any existing timeouts
        this.loadingTimeouts.forEach(timeout => clearTimeout(timeout));
        this.loadingTimeouts = [];

        this.setupRealTimeListeners();
    }

    setupRealTimeListeners() {
        try {
            // Real-time quiz count - WITH ERROR HANDLING
            const quizzesListener = firebase.firestore()
                .collection('quizzes')
                .onSnapshot(
                    (snapshot) => this.handleQuizzesUpdate(snapshot),
                    (error) => {
                        console.error('Quizzes listener error:', error);
                        this.handleListenerError('quizzes', error);
                    }
                );

            // Real-time results - WITH ERROR HANDLING
            const resultsListener = firebase.firestore()
                .collection('quizResults')
                .orderBy('completedAt', 'desc')
                .limit(10)
                .onSnapshot(
                    (snapshot) => this.handleResultsUpdate(snapshot),
                    (error) => {
                        console.error('Results listener error:', error);
                        this.handleListenerError('results', error);
                    }
                );

            this.realTimeListeners = [quizzesListener, resultsListener];

            // Try to get users data with fallback
            this.getUsersDataSafely();

        } catch (error) {
            console.error('Error setting up listeners:', error);
            this.showPlaceholderData();
        }
    }

    // Safe way to get users data
    async getUsersDataSafely() {
        try {
            const usersSnapshot = await firebase.firestore().collection('users').get();
            this.handleUsersUpdate(usersSnapshot);
        } catch (error) {
            console.error('Cannot access users collection:', error);
            // Set placeholder user data
            this.updateStatWithAnimation('total-users', '0');
            this.updateStatWithAnimation('online-users', '0');
        }
    }

    // Handle listener errors gracefully
    handleListenerError(listenerType, error) {
        console.log(`${listenerType} listener failed, using fallback data`);
        
        switch(listenerType) {
            case 'users':
                this.updateStatWithAnimation('total-users', '0');
                this.updateStatWithAnimation('online-users', '0');
                break;
            case 'results':
                this.updateStatWithAnimation('quiz-attempts', '0');
                this.updateStatWithAnimation('avg-score', '0%');
                break;
        }
    }

    handleQuizzesUpdate(snapshot) {
        const totalQuizzes = snapshot.size;
        let activeQuizzes = 0;

        snapshot.forEach(doc => {
            const quiz = doc.data();
            const status = quiz.status || 'active';
            if (status === 'active') {
                activeQuizzes++;
            }
        });

        // Update immediately without loading animation
        this.updateStatDirectly('total-quizzes', totalQuizzes.toLocaleString());
        this.updateStatDirectly('active-quizzes', activeQuizzes.toLocaleString());
        
        this.statsCache.totalQuizzes = totalQuizzes;
        this.statsCache.activeQuizzes = activeQuizzes;
        
        console.log(`📊 Real-time update: ${totalQuizzes} total quizzes (${activeQuizzes} active)`);
    }

    handleUsersUpdate(snapshot) {
        const totalUsers = snapshot.size;
        
        this.updateStatDirectly('total-users', totalUsers.toLocaleString());
        this.updateStatDirectly('online-users', Math.max(1, Math.floor(totalUsers * 0.15)).toLocaleString());
        
        this.statsCache.totalUsers = totalUsers;
        
        console.log(`👥 Real-time update: ${totalUsers} total users`);
    }

    handleResultsUpdate(snapshot) {
        let totalAttempts = 0;
        let totalScore = 0;
        let validScores = 0;

        // Get total attempts from all results (not just recent 10)
        firebase.firestore().collection('quizResults').get().then(allResults => {
            totalAttempts = allResults.size;
            
            allResults.forEach(doc => {
                const result = doc.data();
                if (result.score && !isNaN(result.score)) {
                    totalScore += result.score;
                    validScores++;
                }
            });

            const avgScore = validScores > 0 ? Math.round(totalScore / validScores) : 0;

            this.updateStatDirectly('quiz-attempts', totalAttempts.toLocaleString());
            this.updateStatDirectly('avg-score', `${avgScore}%`);
            
            this.statsCache.totalAttempts = totalAttempts;
            this.statsCache.avgScore = avgScore;
            
            console.log(`🎯 Real-time update: ${totalAttempts} attempts, ${avgScore}% avg score`);
        }).catch(error => {
            console.error('Error getting total results:', error);
            // Use recent results only
            const recentAttempts = snapshot.size;
            this.updateStatDirectly('quiz-attempts', recentAttempts.toLocaleString());
            this.updateStatDirectly('avg-score', '0%');
        });

        // Update recent activities with the snapshot we have
        this.updateRecentActivities(snapshot);
    }

    // FIXED: Update stat without loading animation conflicts
    updateStatDirectly(elementId, value) {
        const element = document.getElementById(elementId);
        if (element) {
            element.textContent = value;
        }
    }

    updateStatWithAnimation(elementId, value) {
        const element = document.getElementById(elementId);
        if (element && element.textContent !== value) {
            element.style.transform = 'scale(1.05)';
            element.style.color = '#10B981';
            element.textContent = value;
            
            setTimeout(() => {
                element.style.transform = 'scale(1)';
                element.style.color = '';
            }, 200);
        }
    }

    updateRecentActivities(snapshot) {
        const activitiesContainer = document.getElementById('recent-activities');
        if (!activitiesContainer) return;

        let activitiesHTML = '';

        if (snapshot.size === 0) {
            activitiesHTML = `
                <div class="empty-activities">
                    <i class="fas fa-chart-line"></i>
                    <h3>No Recent Activities</h3>
                    <p>Activity will appear when users start taking quizzes</p>
                </div>
            `;
        } else {
            snapshot.forEach(doc => {
                const data = doc.data();
                const completedAt = data.completedAt?.toDate() || new Date();
                const timeAgo = this.getTimeAgo(completedAt);
                const userName = data.userName || 'Anonymous User';
                const score = data.score || 0;
                const quizTitle = data.quizTitle || 'Unknown Quiz';

                activitiesHTML += `
                    <div class="activity-item">
                        <div class="activity-icon ${this.getScoreClass(score)}">
                            <i class="fas fa-${this.getScoreIcon(score)}"></i>
                        </div>
                        <div class="activity-content">
                            <p><strong>${userName}</strong> completed "${quizTitle}"</p>
                            <span class="activity-time">${timeAgo}</span>
                        </div>
                        <div class="activity-score ${this.getScoreClass(score)}">
                            ${score}%
                        </div>
                    </div>
                `;
            });
        }

        activitiesContainer.innerHTML = activitiesHTML;
    }

    showPlaceholderData() {
        console.log('Showing safe placeholder data...');
        
        const stats = [
            {id: 'total-users', value: '0'},
            {id: 'total-quizzes', value: '0'},
            {id: 'quiz-attempts', value: '0'},
            {id: 'avg-score', value: '0%'},
            {id: 'active-quizzes', value: '0'},
            {id: 'online-users', value: '0'}
        ];
        
        stats.forEach(stat => {
            this.updateStatDirectly(stat.id, stat.value);
        });

        const activitiesContainer = document.getElementById('recent-activities');
        if (activitiesContainer) {
            activitiesContainer.innerHTML = `
                <div class="empty-activities">
                    <i class="fas fa-rocket"></i>
                    <h3>Dashboard Ready!</h3>
                    <p>Real-time data will appear as users interact with your quizzes</p>
                </div>
            `;
        }
    }

    // ===== UTILITY FUNCTIONS =====
    getScoreClass(score) {
        if (score >= 80) return 'high-score';
        if (score >= 60) return 'medium-score';
        return 'low-score';
    }

    getScoreIcon(score) {
        if (score >= 80) return 'trophy';
        if (score >= 60) return 'check-circle';
        return 'times-circle';
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
        return `${Math.floor(diffInSeconds / 86400)}d ago`;
    }

    destroy() {
        // Clean up
        this.realTimeListeners.forEach(listener => {
            if (typeof listener === 'function') {
                listener();
            }
        });
        
        this.loadingTimeouts.forEach(timeout => clearTimeout(timeout));
    }
}

// ===== INITIALIZE DASHBOARD =====
window.switchSection = function(sectionId) {
    if (window.adminDashboard) {
        window.adminDashboard.switchSection(sectionId);
    }
};

// Initialize when admin is ready
window.addEventListener('load', () => {
    setTimeout(() => {
        window.adminDashboard = new FixedAdminDashboard();
        window.adminDashboard.init();
    }, 1000);
});

console.log('✅ Fixed Admin Dashboard loaded successfully!');
