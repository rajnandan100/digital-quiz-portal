// Admin Dashboard Management System

class AdminDashboard {
    constructor() {
        this.realTimeListeners = [];
        this.chartInstances = {};
        this.statsCache = {};
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.setupNavigation();
        this.loadDashboardData();
        this.setupRealTimeUpdates();
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
            document.getElementById('total-users').textContent = totalUsers.toLocaleString();
            document.getElementById('users-change').textContent = `+${growthPercentage}%`;
            
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
            document.getElementById('total-quizzes').textContent = totalQuizzes.toLocaleString();
            document.getElementById('active-quizzes').textContent = activeQuizzes.toLocaleString();
            
            // Calculate growth
            const lastMonth = new Date();
            lastMonth.setMonth(lastMonth.getMonth() - 1);
            
            const recentQuizzesSnapshot = await quizzesCollection
                .where('createdAt', '>=', lastMonth)
                .get();
            
            const recentQuizzes = recentQuizzesSnapshot.size;
            const growthPercentage = totalQuizzes > 0 ? ((recentQuizzes / totalQuizzes) * 100).toFixed(1) : 0;
            
            document.getElementById('quizzes-change').textContent = `+${growthPercentage}%`;
            
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
            document.getElementById('quiz-attempts').textContent = totalAttempts.toLocaleString();
            document.getElementById('avg-score').textContent = `${avgScore}%`;
            document.getElementById('attempts-change').textContent = `+${growthPercentage}%`;
            document.getElementById('score-change').textContent = `${avgScore}%`;
            
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
            
            // Get recent quiz results
            const recentResults = await firebase.firestore()
                .collection('quizResults')
                .orderBy('completedAt', 'desc')
                .limit(10)
                .get();
            
            // Get recent user registrations
            const recentUsers = await firebase.firestore()
                .collection('users')
                .orderBy('createdAt', 'desc')
                .limit(5)
                .get();
            
            let activitiesHTML = '';
            
            // Add recent quiz completions
            recentResults.forEach(doc => {
                const data = doc.data();
                const completedAt = data.completedAt?.toDate() || new Date();
                const timeAgo = this.getTimeAgo(completedAt);
                
                activitiesHTML += `
                    <div class="activity-item">
                        <div class="activity-icon quiz-completion">
                            <i class="fas fa-check-circle"></i>
                        </div>
                        <div class="activity-content">
                            <p><strong>${data.userName || 'Anonymous'}</strong> completed <strong>${data.quizTitle}</strong></p>
                            <span class="activity-time">${timeAgo}</span>
                        </div>
                        <div class="activity-score">
                            ${data.score}%
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
                    <div class="activity-item">
                        <div class="activity-icon user-registration">
                            <i class="fas fa-user-plus"></i>
                        </div>
                        <div class="activity-content">
                            <p><strong>${data.firstName || 'New user'}</strong> registered</p>
                            <span class="activity-time">${timeAgo}</span>
                        </div>
                    </div>
                `;
            });
            
            activitiesContainer.innerHTML = activitiesHTML || '<p class="no-activities">No recent activities</p>';
            
        } catch (error) {
            console.error('Error loading recent activities:', error);
        }
    }

    initializeCharts() {
        // Initialize user registration chart
        this.initUserChart();
        
        // Initialize completion rate chart
        this.initCompletionChart();
    }

    async initUserChart() {
        const canvas = document.getElementById('users-chart');
        if (!canvas) return;
        
        try {
            // Get user registration data for last 30 days
            const last30Days = new Date();
            last30Days.setDate(last30Days.getDate() - 30);
            
            const usersSnapshot = await firebase.firestore()
                .collection('users')
                .where('createdAt', '>=', last30Days)
                .get();
            
            // Process data by day
            const dailyData = {};
            const today = new Date();
            
            // Initialize all days with 0
            for (let i = 29; i >= 0; i--) {
                const date = new Date(today);
                date.setDate(date.getDate() - i);
                const dateKey = date.toISOString().split('T')[0];
                dailyData[dateKey] = 0;
            }
            
            // Count registrations per day
            usersSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.createdAt) {
                    const date = data.createdAt.toDate();
                    const dateKey = date.toISOString().split('T')[0];
                    if (dailyData.hasOwnProperty(dateKey)) {
                        dailyData[dateKey]++;
                    }
                }
            });
            
            // Prepare chart data
            const labels = Object.keys(dailyData).map(date => {
                const d = new Date(date);
                return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
            });
            const data = Object.values(dailyData);
            
            // Create chart (you'll need to include Chart.js library)
            const ctx = canvas.getContext('2d');
            
            // Simple canvas drawing since we're keeping it lightweight
            this.drawLineChart(ctx, labels, data, 'User Registrations');
            
        } catch (error) {
            console.error('Error initializing user chart:', error);
        }
    }

    async initCompletionChart() {
        const canvas = document.getElementById('completion-chart');
        if (!canvas) return;
        
        try {
            // Get quiz completion data
            const quizzesSnapshot = await firebase.firestore()
                .collection('quizzes')
                .limit(10)
                .get();
            
            const completionData = [];
            
            for (const quizDoc of quizzesSnapshot.docs) {
                const quizData = quizDoc.data();
                
                // Count total attempts for this quiz
                const attemptsSnapshot = await firebase.firestore()
                    .collection('quizResults')
                    .where('quizId', '==', quizDoc.id)
                    .get();
                
                const totalAttempts = attemptsSnapshot.size;
                const completedAttempts = attemptsSnapshot.docs.filter(doc => 
                    doc.data().isCompleted === true
                ).length;
                
                const completionRate = totalAttempts > 0 ? 
                    (completedAttempts / totalAttempts * 100).toFixed(1) : 0;
                
                completionData.push({
                    name: quizData.title || 'Untitled Quiz',
                    rate: parseFloat(completionRate)
                });
            }
            
            // Draw completion rate chart
            const ctx = canvas.getContext('2d');
            this.drawBarChart(ctx, completionData);
            
        } catch (error) {
            console.error('Error initializing completion chart:', error);
        }
    }

    drawLineChart(ctx, labels, data, title) {
        const canvas = ctx.canvas;
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Set up chart area
        const padding = 50;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        
        // Find max value
        const maxValue = Math.max(...data, 1);
        
        // Draw axes
        ctx.strokeStyle = '#e2e8f0';
        ctx.lineWidth = 1;
        
        // Y-axis
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, height - padding);
        ctx.stroke();
        
        // X-axis
        ctx.beginPath();
        ctx.moveTo(padding, height - padding);
        ctx.lineTo(width - padding, height - padding);
        ctx.stroke();
        
        // Draw data line
        ctx.strokeStyle = '#4f46e5';
        ctx.lineWidth = 3;
        ctx.beginPath();
        
        for (let i = 0; i < data.length; i++) {
            const x = padding + (i / (data.length - 1)) * chartWidth;
            const y = height - padding - (data[i] / maxValue) * chartHeight;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        
        // Draw data points
        ctx.fillStyle = '#4f46e5';
        for (let i = 0; i < data.length; i++) {
            const x = padding + (i / (data.length - 1)) * chartWidth;
            const y = height - padding - (data[i] / maxValue) * chartHeight;
            
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
        }
    }

    drawBarChart(ctx, data) {
        const canvas = ctx.canvas;
        const width = canvas.width;
        const height = canvas.height;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        if (data.length === 0) return;
        
        // Set up chart area
        const padding = 50;
        const chartWidth = width - 2 * padding;
        const chartHeight = height - 2 * padding;
        const barWidth = chartWidth / data.length * 0.8;
        const barSpacing = chartWidth / data.length * 0.2;
        
        // Find max value
        const maxValue = Math.max(...data.map(d => d.rate), 1);
        
        // Draw bars
        ctx.fillStyle = '#4f46e5';
        
        data.forEach((item, i) => {
            const x = padding + i * (barWidth + barSpacing) + barSpacing / 2;
            const barHeight = (item.rate / maxValue) * chartHeight;
            const y = height - padding - barHeight;
            
            ctx.fillRect(x, y, barWidth, barHeight);
            
            // Draw labels
            ctx.fillStyle = '#64748b';
            ctx.font = '12px Inter';
            ctx.textAlign = 'center';
            
            // Quiz name (truncated)
            const truncatedName = item.name.length > 10 ? 
                item.name.substring(0, 10) + '...' : item.name;
            ctx.fillText(truncatedName, x + barWidth / 2, height - padding + 20);
            
            // Percentage
            ctx.fillText(`${item.rate}%`, x + barWidth / 2, y - 10);
            
            ctx.fillStyle = '#4f46e5';
        });
    }

    setupRealTimeUpdates() {
        // Listen for real-time user count updates
        const usersListener = firebase.firestore()
            .collection('users')
            .onSnapshot(() => {
                this.loadUserStats();
            });
        
        // Listen for real-time quiz updates
        const quizzesListener = firebase.firestore()
            .collection('quizzes')
            .onSnapshot(() => {
                this.loadQuizStats();
            });
        
        // Listen for real-time quiz results
        const resultsListener = firebase.firestore()
            .collection('quizResults')
            .onSnapshot(() => {
                this.loadAttemptStats();
                this.loadRecentActivities();
            });
        
        this.realTimeListeners = [usersListener, quizzesListener, resultsListener];
    }

    loadSectionData(sectionId) {
        // Load data specific to each section
        switch (sectionId) {
            case 'dashboard':
                this.loadDashboardData();
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
        
        document.body.appendChild(notification);
        
        // Auto remove after 4 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
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

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.adminDashboard = new AdminDashboard();
});
