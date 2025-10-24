// Admin Dashboard Management System - Fixed Firebase Initialization

class AdminDashboard {
    constructor() {
        this.realTimeListeners = [];
        this.chartInstances = {};
        this.statsCache = {};
        this.firebaseReady = false;
        this.init();
    }

    init() {
        // Wait for Firebase to be properly initialized
        this.waitForFirebase().then(() => {
            this.firebaseReady = true;
            this.setupEventListeners();
            this.setupNavigation();
            this.loadDashboardData();
            this.setupRealTimeUpdates();
        }).catch(error => {
            console.error('Firebase initialization failed:', error);
            this.showNotification('Failed to initialize Firebase', 'error');
        });
    }

    // Wait for Firebase to be ready
    waitForFirebase() {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const maxAttempts = 50; // 5 seconds max wait time
            
            const checkFirebase = () => {
                attempts++;
                
                if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
                    // Firebase is initialized
                    resolve();
                } else if (attempts >= maxAttempts) {
                    // Timeout
                    reject(new Error('Firebase initialization timeout'));
                } else {
                    // Wait and try again
                    setTimeout(checkFirebase, 100);
                }
            };
            
            checkFirebase();
        });
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
            
            // Load section-specific data
            this.loadSectionData(sectionId);
        }
    }

    async loadDashboardData() {
        if (!this.firebaseReady) {
            console.warn('Firebase not ready, skipping dashboard data load');
            return;
        }

        try {
            // Load all dashboard statistics
            await Promise.all([
                this.loadUserStats(),
                this.loadQuizStats(),
                this.loadAttemptStats(),
                this.loadRecentActivities()
            ]);
            
            // Initialize charts
            this.initializeCharts();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            this.showNotification('Error loading dashboard data', 'error');
        }
    }

    async loadUserStats() {
        try {
            const usersCollection = firebase.firestore().collection('users');
            const snapshot = await usersCollection.get();
            const totalUsers = snapshot.size;
            
            // Calculate growth (compare with last month)
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            
            const recentUsersSnapshot = await usersCollection
                .where('createdAt', '>=', lastMonth)
                .get();
            
            const recentUsers = recentUsersSnapshot.size;
            const growthPercentage = totalUsers > 0 ? ((recentUsers / totalUsers) * 100).toFixed(1) : 0;
            
            // Update UI
            const totalUsersEl = document.getElementById('total-users');
            const usersChangeEl = document.getElementById('users-change');
            
            if (totalUsersEl) totalUsersEl.textContent = totalUsers.toLocaleString();
            if (usersChangeEl) usersChangeEl.textContent = `+${growthPercentage}%`;
            
            this.statsCache.users = { total: totalUsers, growth: growthPercentage };
            
        } catch (error) {
            console.error('Error loading user stats:', error);
        }
    }

    async loadQuizStats() {
        try {
            const quizzesCollection = firebase.firestore().collection('quizzes');
            const snapshot = await quizzesCollection.get();
            const totalQuizzes = snapshot.size;
            
            // Count active quizzes (published and not expired)
            const now = new Date();
            const activeQuizzesSnapshot = await quizzesCollection
                .where('isActive', '==', true)
                .where('publishDate', '<=', now)
                .get();
            
            const activeQuizzes = activeQuizzesSnapshot.size;
            
            // Update UI
            const totalQuizzesEl = document.getElementById('total-quizzes');
            const activeQuizzesEl = document.getElementById('active-quizzes');
            
            if (totalQuizzesEl) totalQuizzesEl.textContent = totalQuizzes.toLocaleString();
            if (activeQuizzesEl) activeQuizzesEl.textContent = activeQuizzes.toLocaleString();
            
            // Calculate growth
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            
            const recentQuizzesSnapshot = await quizzesCollection
                .where('createdAt', '>=', lastMonth)
                .get();
            
            const recentQuizzes = recentQuizzesSnapshot.size;
            const growthPercentage = totalQuizzes > 0 ? ((recentQuizzes / totalQuizzes) * 100).toFixed(1) : 0;
            
            const quizzesChangeEl = document.getElementById('quizzes-change');
            if (quizzesChangeEl) quizzesChangeEl.textContent = `+${growthPercentage}%`;
            
            this.statsCache.quizzes = { total: totalQuizzes, active: activeQuizzes, growth: growthPercentage };
            
        } catch (error) {
            console.error('Error loading quiz stats:', error);
        }
    }

    async loadAttemptStats() {
        try {
            const resultsCollection = firebase.firestore().collection('quizResults');
            const snapshot = await resultsCollection.get();
            const totalAttempts = snapshot.size;
            
            // Calculate average score
            let totalScore = 0;
            let validResults = 0;
            
            snapshot.forEach(doc => {
                const data = doc.data();
                if (data.score !== undefined && data.score !== null) {
                    totalScore += data.score;
                    validResults++;
                }
            });
            
            const avgScore = validResults > 0 ? (totalScore / validResults).toFixed(1) : 0;
            
            // Calculate recent growth
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            
            const recentAttemptsSnapshot = await resultsCollection
                .where('completedAt', '>=', lastMonth)
                .get();
            
            const recentAttempts = recentAttemptsSnapshot.size;
            const growthPercentage = totalAttempts > 0 ? ((recentAttempts / totalAttempts) * 100).toFixed(1) : 0;
            
            // Update UI
            const quizAttemptsEl = document.getElementById('quiz-attempts');
            const avgScoreEl = document.getElementById('avg-score');
            const attemptsChangeEl = document.getElementById('attempts-change');
            const scoreChangeEl = document.getElementById('score-change');
            
            if (quizAttemptsEl) quizAttemptsEl.textContent = totalAttempts.toLocaleString();
            if (avgScoreEl) avgScoreEl.textContent = `${avgScore}%`;
            if (attemptsChangeEl) attemptsChangeEl.textContent = `+${growthPercentage}%`;
            if (scoreChangeEl) scoreChangeEl.textContent = `${avgScore}%`;
            
            this.statsCache.attempts = { 
                total: totalAttempts, 
                avgScore: avgScore, 
                growth: growthPercentage 
            };
            
        } catch (error) {
            console.error('Error loading attempt stats:', error);
        }
    }

    async loadRecentActivities() {
        try {
            const activitiesContainer = document.getElementById('recent-activities');
            if (!activitiesContainer) return;
            
            // Show loading message
            activitiesContainer.innerHTML = '<p style="color: #666; text-align: center; padding: 20px;">Loading recent activities...</p>';
            
            // Get recent quiz results (limit to prevent large queries)
            const recentResults = await firebase.firestore()
                .collection('quizResults')
                .orderBy('completedAt', 'desc')
                .limit(5)
                .get();
            
            // Get recent user registrations
            const recentUsers = await firebase.firestore()
                .collection('users')
                .orderBy('createdAt', 'desc')
                .limit(3)
                .get();
            
            let activitiesHTML = '';
            
            // Add recent quiz completions
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
                            <p style="margin: 0; font-size: 14px;"><strong>${data.userName || 'Anonymous'}</strong> completed <strong>${data.quizTitle || 'Quiz'}</strong></p>
                            <span class="activity-time" style="font-size: 12px; color: #666;">${timeAgo}</span>
                        </div>
                        <div class="activity-score" style="background: #f0f9ff; color: #0369a1; padding: 4px 8px; border-radius: 12px; font-size: 12px; font-weight: 500;">
                            ${data.score || 0}%
                        </div>
                    </div>
                `;
            });
            
            // Add recent user registrations
            recentUsers.forEach(doc => {
                const data = doc.data();
                const createdAt = data.createdAt?.toDate() || new Date();
                const timeAgo = this.getTimeAgo(createdAt);
                
                activitiesHTML += `
                    <div class="activity-item" style="display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #f0f0f0;">
                        <div class="activity-icon" style="width: 40px; height: 40px; background: #3B82F6; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 12px;">
                            <i class="fas fa-user-plus" style="color: white; font-size: 16px;"></i>
                        </div>
                        <div class="activity-content" style="flex: 1;">
                            <p style="margin: 0; font-size: 14px;"><strong>${data.firstName || 'New user'}</strong> registered</p>
                            <span class="activity-time" style="font-size: 12px; color: #666;">${timeAgo}</span>
                        </div>
                    </div>
                `;
            });
            
            activitiesContainer.innerHTML = activitiesHTML || '<p class="no-activities" style="color: #666; text-align: center; padding: 20px;">No recent activities</p>';
            
        } catch (error) {
            console.error('Error loading recent activities:', error);
            const activitiesContainer = document.getElementById('recent-activities');
            if (activitiesContainer) {
                activitiesContainer.innerHTML = '<p style="color: #dc2626; text-align: center; padding: 20px;">Error loading activities</p>';
            }
        }
    }

    initializeCharts() {
        // Skip charts for now to avoid complexity
        console.log('Charts initialization skipped - will be implemented in next phase');
    }

    setupRealTimeUpdates() {
        // Listen for real-time user count updates
        const usersListener = firebase.firestore()
            .collection('users')
            .onSnapshot(() => {
                if (this.firebaseReady) {
                    this.loadUserStats();
                }
            }, error => console.error('Users listener error:', error));
        
        // Listen for real-time quiz updates
        const quizzesListener = firebase.firestore()
            .collection('quizzes')
            .onSnapshot(() => {
                if (this.firebaseReady) {
                    this.loadQuizStats();
                }
            }, error => console.error('Quizzes listener error:', error));
        
        // Listen for real-time quiz results
        const resultsListener = firebase.firestore()
            .collection('quizResults')
            .onSnapshot(() => {
                if (this.firebaseReady) {
                    this.loadAttemptStats();
                    this.loadRecentActivities();
                }
            }, error => console.error('Results listener error:', error));
        
        this.realTimeListeners = [usersListener, quizzesListener, resultsListener];
    }

    loadSectionData(sectionId) {
        // Load data specific to each section
        switch (sectionId) {
            case 'dashboard':
                if (this.firebaseReady) {
                    this.loadDashboardData();
                }
                break;
            case 'quiz-management':
                // Will be implemented in next step
                break;
            case 'user-management':
                // Will be implemented in next step
                break;
            default:
                console.log(`No specific loader for section: ${sectionId}`);
        }
    }

    handleSearch(query) {
        // Basic search functionality
        console.log('Searching for:', query);
        // Implementation will be expanded in future steps
    }

    getTimeAgo(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) {
            return 'Just now';
        } else if (diffInSeconds < 3600) {
            const minutes = Math.floor(diffInSeconds / 60);
            return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
        } else if (diffInSeconds < 86400) {
            const hours = Math.floor(diffInSeconds / 3600);
            return `${hours} hour${hours > 1 ? 's' : ''} ago`;
        } else {
            const days = Math.floor(diffInSeconds / 86400);
            return `${days} day${days > 1 ? 's' : ''} ago`;
        }
    }

    showNotification(message, type = 'info') {
        // Create and show notification
        const notification = document.createElement('div');
        notification.className = `admin-toast toast-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            background: ${type === 'success' ? '#10B981' : type === 'error' ? '#DC2626' : '#3B82F6'};
            box-shadow: 0 10px 25px rgba(0,0,0,0.2);
            transform: translateX(100%);
            transition: transform 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 4000);
    }

    // Cleanup method
    destroy() {
        // Remove real-time listeners
        this.realTimeListeners.forEach(listener => {
            if (typeof listener === 'function') {
                listener();
            }
        });
        
        // Cleanup chart instances
        Object.values(this.chartInstances).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
    }
}

// Global functions for button actions
window.switchSection = function(sectionId) {
    if (window.adminDashboard) {
        window.adminDashboard.switchSection(sectionId);
    }
};

window.exportAllData = function() {
    console.log('Exporting all data...');
    // Will be implemented in future steps
};

// Initialize dashboard when DOM is ready - but wait for Firebase
document.addEventListener('DOMContentLoaded', () => {
    // Small delay to ensure Firebase config is loaded
    setTimeout(() => {
        window.adminDashboard = new AdminDashboard();
    }, 500);
});
