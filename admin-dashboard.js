// Admin Dashboard Management System - Simplified

class AdminDashboard {
    constructor() {
        this.realTimeListeners = [];
        this.statsCache = {};
        // Don't initialize immediately - wait for user interaction
    }

    // Initialize only when called
    init() {
        console.log('Initializing Admin Dashboard...');
        
        this.setupEventListeners();
        this.setupNavigation();
        
        // Try to load data, but don't fail if Firebase isn't ready
        setTimeout(() => {
            this.loadDashboardDataSafely();
        }, 1000);
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

        // Search functionality
        const adminSearch = document.getElementById('admin-search');
        if (adminSearch) {
            adminSearch.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
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
    }

    setupNavigation() {
        const menuItems = document.querySelectorAll('.menu-item[data-section]');
        
        menuItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const sectionId = item.dataset.section;
                this.switchSection(sectionId);
                
                // Update active menu item
                menuItems.forEach(mi => mi.classList.remove('active'));
                item.classList.add('active');
            });
        });
    }

    switchSection(sectionId) {
        // Hide all sections
        const sections = document.querySelectorAll('.admin-section');
        sections.forEach(section => section.classList.remove('active'));
        
        // Show target section
        const targetSection = document.getElementById(sectionId);
        if (targetSection) {
            targetSection.classList.add('active');
        }
    }

    // Safe data loading with proper error handling
    async loadDashboardDataSafely() {
        // Check if Firebase is available
        if (typeof firebase === 'undefined' || !firebase.apps.length) {
            console.warn('Firebase not available, showing placeholder data');
            this.showPlaceholderData();
            return;
        }

        try {
            await Promise.all([
                this.loadUserStats(),
                this.loadQuizStats(), 
                this.loadAttemptStats(),
                this.loadRecentActivities()
            ]);
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showPlaceholderData();
        }
    }

    // Show placeholder data when Firebase isn't working
    showPlaceholderData() {
        console.log('Showing placeholder data...');
        
        // Set placeholder stats
        const stats = [
            { id: 'total-users', value: '---' },
            { id: 'total-quizzes', value: '---' },
            { id: 'quiz-attempts', value: '---' },
            { id: 'avg-score', value: '---%' },
            { id: 'users-change', value: '---%' },
            { id: 'quizzes-change', value: '---%' },
            { id: 'attempts-change', value: '---%' },
            { id: 'score-change', value: '---%' },
            { id: 'active-quizzes', value: '---' },
            { id: 'online-users', value: '---' }
        ];
        
        stats.forEach(stat => {
            const element = document.getElementById(stat.id);
            if (element) {
                element.textContent = stat.value;
            }
        });
        
        // Show placeholder activities
        const activitiesContainer = document.getElementById('recent-activities');
        if (activitiesContainer) {
            activitiesContainer.innerHTML = `
                <div style="text-align: center; padding: 40px 20px; color: #666;">
                    <i class="fas fa-database" style="font-size: 48px; color: #ddd; margin-bottom: 16px;"></i>
                    <p style="margin: 0; font-size: 16px;">Dashboard data will load once connected to Firebase</p>
                    <p style="margin: 8px 0 0 0; font-size: 14px;">Admin panel functionality is working!</p>
                </div>
            `;
        }
    }

    async loadUserStats() {
        try {
            const usersCollection = firebase.firestore().collection('users');
            const snapshot = await usersCollection.get();
            const totalUsers = snapshot.size;
            
            const totalUsersEl = document.getElementById('total-users');
            if (totalUsersEl) {
                totalUsersEl.textContent = totalUsers.toLocaleString();
            }
            
            const usersChangeEl = document.getElementById('users-change');
            if (usersChangeEl) {
                usersChangeEl.textContent = '+10%'; // Placeholder growth
            }
            
        } catch (error) {
            console.error('Error loading user stats:', error);
        }
    }

    async loadQuizStats() {
        try {
            const quizzesCollection = firebase.firestore().collection('quizzes');
            const snapshot = await quizzesCollection.get();
            const totalQuizzes = snapshot.size;
            
            const totalQuizzesEl = document.getElementById('total-quizzes');
            if (totalQuizzesEl) {
                totalQuizzesEl.textContent = totalQuizzes.toLocaleString();
            }
            
            const activeQuizzesEl = document.getElementById('active-quizzes');
            if (activeQuizzesEl) {
                activeQuizzesEl.textContent = totalQuizzes.toLocaleString();
            }
            
            const quizzesChangeEl = document.getElementById('quizzes-change');
            if (quizzesChangeEl) {
                quizzesChangeEl.textContent = '+5%'; // Placeholder growth
            }
            
        } catch (error) {
            console.error('Error loading quiz stats:', error);
        }
    }

    async loadAttemptStats() {
        try {
            const resultsCollection = firebase.firestore().collection('quizResults');
            const snapshot = await resultsCollection.get();
            const totalAttempts = snapshot.size;
            
            const quizAttemptsEl = document.getElementById('quiz-attempts');
            if (quizAttemptsEl) {
                quizAttemptsEl.textContent = totalAttempts.toLocaleString();
            }
            
            const avgScoreEl = document.getElementById('avg-score');
            if (avgScoreEl) {
                avgScoreEl.textContent = '75%'; // Placeholder average
            }
            
            const attemptsChangeEl = document.getElementById('attempts-change');
            if (attemptsChangeEl) {
                attemptsChangeEl.textContent = '+25%'; // Placeholder growth
            }
            
            const scoreChangeEl = document.getElementById('score-change');
            if (scoreChangeEl) {
                scoreChangeEl.textContent = '75%';
            }
            
        } catch (error) {
            console.error('Error loading attempt stats:', error);
        }
    }

    async loadRecentActivities() {
        try {
            const activitiesContainer = document.getElementById('recent-activities');
            if (!activitiesContainer) return;
            
            activitiesContainer.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">Loading activities...</p>';
            
            // Try to get recent data, but provide fallback
            const recentResults = await firebase.firestore()
                .collection('quizResults')
                .orderBy('completedAt', 'desc')
                .limit(3)
                .get();
            
            let activitiesHTML = '';
            
            if (recentResults.size === 0) {
                activitiesHTML = `
                    <div style="text-align: center; padding: 20px; color: #666;">
                        <i class="fas fa-chart-line" style="font-size: 32px; color: #ddd; margin-bottom: 12px;"></i>
                        <p style="margin: 0;">No recent activities yet</p>
                        <p style="margin: 8px 0 0 0; font-size: 14px;">Activity will appear when users start taking quizzes</p>
                    </div>
                `;
            } else {
                recentResults.forEach(doc => {
                    const data = doc.data();
                    const completedAt = data.completedAt?.toDate() || new Date();
                    const timeAgo = this.getTimeAgo(completedAt);
                    
                    activitiesHTML += `
                        <div class="activity-item" style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                            <div class="activity-icon" style="width: 40px; height: 40px; background: #10B981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                                <i class="fas fa-check-circle" style="color: white; font-size: 16px;"></i>
                            </div>
                            <div class="activity-content" style="flex: 1;">
                                <p style="margin: 0; font-size: 14px;"><strong>${data.userName || 'Anonymous'}</strong> completed quiz</p>
                                <span style="font-size: 12px; color: #666;">${timeAgo}</span>
                            </div>
                            <div class="activity-score" style="background: #f0f9ff; color: #0369a1; padding: 4px 8px; border-radius: 12px; font-size: 12px;">
                                ${data.score || 0}%
                            </div>
                        </div>
                    `;
                });
            }
            
            activitiesContainer.innerHTML = activitiesHTML;
            
        } catch (error) {
            console.error('Error loading activities:', error);
            const activitiesContainer = document.getElementById('recent-activities');
            if (activitiesContainer) {
                activitiesContainer.innerHTML = '<p style="color: #dc2626; text-align: center; padding: 20px;">Unable to load activities</p>';
            }
        }
    }

    handleSearch(query) {
        console.log('Search:', query);
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
        this.realTimeListeners.forEach(listener => {
            if (typeof listener === 'function') {
                listener();
            }
        });
    }
}

// Global functions
window.switchSection = function(sectionId) {
    if (window.adminDashboard) {
        window.adminDashboard.switchSection(sectionId);
    }
};

window.exportAllData = function() {
    alert('Data export feature coming soon!');
};

// Initialize when everything is ready
window.addEventListener('load', () => {
    // Wait a bit more for Firebase to load
    setTimeout(() => {
        if (window.adminAuth && window.adminAuth.currentAdmin) {
            window.adminDashboard = new AdminDashboard();
            window.adminDashboard.init();
        }
    }, 1500);
});

