// Admin Authentication - NO REDIRECT ISSUES
class AdminAuthManager {
    constructor() {
        this.currentAdmin = null;
        this.init();
    }

    init() {
        console.log('🚀 Admin Auth Manager starting...');
        if (typeof firebase !== 'undefined') {
            this.setupAdminAuth();
        } else {
            console.log('⏳ Waiting for Firebase...');
            setTimeout(() => this.init(), 100);
        }
    }

    setupAdminAuth() {
        console.log('🔐 Setting up admin authentication...');
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                console.log('👤 User signed in:', user.email);
                try {
                    const adminDoc = await firebase.firestore()
                        .collection('adminUsers')
                        .doc(user.uid)
                        .get();
                    
                    if (adminDoc.exists) {
                        const adminData = adminDoc.data();
                        const roles = adminData.roles || {};
                        
                        console.log('🎯 User roles:', roles);
                        
                        if (roles.admin || roles.superAdmin || roles.moderator) {
                            console.log('✅ Admin access granted!');
                            this.currentAdmin = {
                                uid: user.uid,
                                email: user.email,
                                displayName: user.displayName || adminData.displayName || user.email,
                                roles: roles,
                                isSuperAdmin: roles.superAdmin || false,
                                isAdmin: roles.admin || false,
                                isModerator: roles.moderator || false,
                                adminData: adminData
                            };
                            
                            this.showAdminPanel();
                        } else {
                            console.log('❌ No admin privileges found');
                            this.handleUnauthorizedAccess();
                        }
                    } else {
                        console.log('❌ No admin record found for user');
                        this.handleUnauthorizedAccess();
                    }
                } catch (error) {
                    console.error('💥 Error checking admin privileges:', error);
                    this.handleAuthError(error);
                }
            } else {
                console.log('👤 User not signed in');
                this.currentAdmin = null;
                this.redirectToLogin();
            }
        });
    }

    showAdminPanel() {
        console.log('📊 Showing admin panel...');
        const loading = document.getElementById('admin-loading');
        const panel = document.getElementById('admin-panel');
        
        if (loading) loading.style.display = 'none';
        if (panel) panel.style.display = 'flex';
        
        if (window.adminDashboard) {
            window.adminDashboard.init();
        }
    }

    handleUnauthorizedAccess() {
        console.log('🚫 Redirecting to login - unauthorized access');
        this.showMessage('Access denied. Admin privileges required.', 'error');
        setTimeout(() => {
            window.location.href = '/digital-quiz-portal/index.html?error=access_denied';
        }, 2000);
    }

    handleAuthError(error) {
        console.error('💥 Admin authentication error:', error);
        this.showMessage('Authentication error. Please try again.', 'error');
        this.redirectToLogin();
    }

    redirectToLogin() {
        console.log('🔄 Redirecting to login page');
        window.location.href = '/digital-quiz-portal/index.html?redirect=admin';
    }

    async adminLogout() {
        try {
            console.log('👋 Admin logging out...');
            await firebase.auth().signOut();
            this.showMessage('Logged out successfully!', 'success');
            
            setTimeout(() => {
                window.location.href = '/digital-quiz-portal/index.html';
            }, 1000);
        } catch (error) {
            this.showMessage('Error logging out: ' + error.message, 'error');
        }
    }

    showMessage(message, type = 'info') {
        console.log(`📢 ${type.toUpperCase()}: ${message}`);
        
        const toast = document.createElement('div');
        toast.textContent = message;
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 16px 24px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            background: ${type === 'success' ? '#10B981' : type === 'error' ? '#DC2626' : '#3B82F6'};
            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
        `;
        
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
        }, 4000);
    }
}

// Initialize Admin Authentication
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 Admin Auth Manager initializing...');
    window.adminAuth = new AdminAuthManager();
});

// Global logout function
window.adminLogout = function() {
    if (window.adminAuth) {
        window.adminAuth.adminLogout();
    }
};
