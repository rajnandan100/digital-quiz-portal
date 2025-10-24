// Admin Authentication and Role Management System - Updated for Firestore

class AdminAuthManager {
    constructor() {
        this.currentAdmin = null;
        this.adminRoles = {
            SUPER_ADMIN: 'superAdmin',
            ADMIN: 'admin',
            MODERATOR: 'moderator'
        };
        this.init();
    }

    init() {
        // Wait for Firebase to be ready
        if (typeof firebase !== 'undefined') {
            this.setupAdminAuth();
        } else {
            setTimeout(() => this.init(), 100);
        }
    }

    setupAdminAuth() {
        // Listen for authentication state changes
        firebase.auth().onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    // Check admin privileges from Firestore database
                    const adminDoc = await firebase.firestore()
                        .collection('adminUsers')
                        .doc(user.uid)
                        .get();
                    
                    if (adminDoc.exists) {
                        const adminData = adminDoc.data();
                        const roles = adminData.roles || {};
                        
                        // Check if user has any admin privileges
                        if (roles.admin || roles.superAdmin || roles.moderator) {
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
                            
                            this.updateAdminUI(this.currentAdmin);
                            this.logAdminLogin();
                            this.showAdminPanel();
                        } else {
                            // User doesn't have admin privileges
                            this.handleUnauthorizedAccess();
                        }
                    } else {
                        // No admin record found
                        this.handleUnauthorizedAccess();
                    }
                } catch (error) {
                    console.error('Error checking admin privileges:', error);
                    this.handleAuthError(error);
                }
            } else {
                // User is not signed in
                this.currentAdmin = null;
                this.redirectToLogin();
            }
        });
    }

    // Show admin panel (hide loading screen)
    showAdminPanel() {
        const loading = document.getElementById('admin-loading');
        const panel = document.getElementById('admin-panel');
        
        if (loading) loading.style.display = 'none';
        if (panel) panel.style.display = 'flex';
        
        // Initialize admin dashboard
        if (window.adminDashboard) {
            window.adminDashboard.init();
        }
    }

    // Check if current user has specific admin role
    hasRole(role) {
        if (!this.currentAdmin) return false;
        return this.currentAdmin.roles[role] === true;
    }

    // Check if current user can perform specific action
    canPerform(action) {
        const permissions = {
            'manage_quizzes': ['admin', 'superAdmin'],
            'manage_users': ['admin', 'superAdmin'],
            'manage_admins': ['superAdmin'],
            'view_analytics': ['admin', 'superAdmin', 'moderator'],
            'manage_site_config': ['superAdmin'],
            'manage_categories': ['admin', 'superAdmin'],
            'moderate_content': ['moderator', 'admin', 'superAdmin'],
            'export_data': ['admin', 'superAdmin'],
            'delete_data': ['superAdmin']
        };

        if (!this.currentAdmin || !permissions[action]) return false;

        return permissions[action].some(role => this.currentAdmin.roles[role]);
    }

    // Log admin actions for audit trail
    async logAdminAction(action, data) {
        try {
            const logEntry = {
                action: action,
                adminId: this.currentAdmin?.uid || null,
                adminEmail: this.currentAdmin?.email || null,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                data: data,
                userAgent: navigator.userAgent
            };

            await firebase.firestore()
                .collection('adminLogs')
                .add(logEntry);
        } catch (error) {
            console.error('Error logging admin action:', error);
        }
    }

    // Log admin login for security tracking
    async logAdminLogin() {
        await this.logAdminAction('admin_session_start', {
            loginMethod: 'firestore_check',
            roles: this.currentAdmin.roles
        });
    }

    // Handle unauthorized access attempts
    handleUnauthorizedAccess() {
        console.log('Access denied: No admin privileges found');
        this.showMessage('Access denied. Admin privileges required.', 'error');
        setTimeout(() => {
            window.location.href = '/index.html?error=access_denied';
        }, 2000);
    }

    // Handle authentication errors
    handleAuthError(error) {
        console.error('Admin authentication error:', error);
        this.showMessage('Authentication error. Please try again.', 'error');
        this.redirectToLogin();
    }

    // Redirect to login page
    redirectToLogin() {
        window.location.href = '/index.html?redirect=admin';
    }

    // Update admin UI based on roles
    updateAdminUI(admin) {
        // Update admin info display
        const adminInfo = document.getElementById('admin-info');
        if (adminInfo) {
            adminInfo.innerHTML = `
                <div class="admin-profile">
                    <img src="${admin.photoURL || this.generateAvatar(admin.email)}" alt="Admin Avatar" class="admin-avatar">
                    <div class="admin-details">
                        <span class="admin-name">${admin.displayName || admin.email}</span>
                        <span class="admin-role">${this.getRoleDisplay(admin.roles)}</span>
                    </div>
                </div>
            `;
        }

        // Show/hide admin sections based on permissions
        this.updateAdminMenu();
    }

    // Update admin menu based on permissions
    updateAdminMenu() {
        const menuItems = {
            'dashboard': true, // All admins can view dashboard
            'quiz-management': this.canPerform('manage_quizzes'),
            'user-management': this.canPerform('manage_users'),
            'admin-management': this.canPerform('manage_admins'),
            'analytics': this.canPerform('view_analytics'),
            'site-config': this.canPerform('manage_site_config'),
            'categories': this.canPerform('manage_categories'),
            'content-moderation': this.canPerform('moderate_content'),
            'data-export': this.canPerform('export_data')
        };

        Object.entries(menuItems).forEach(([menuId, hasPermission]) => {
            const menuElement = document.getElementById(`menu-${menuId}`);
            if (menuElement) {
                menuElement.style.display = hasPermission ? 'block' : 'none';
            }
        });
    }

    // Get role display name
    getRoleDisplay(roles) {
        if (roles.superAdmin) return 'Super Admin';
        if (roles.admin) return 'Admin';
        if (roles.moderator) return 'Moderator';
        return 'User';
    }

    // Generate avatar for admin
    generateAvatar(email) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=4F46E5&color=fff&size=40`;
    }

    // Admin logout with logging
    async adminLogout() {
        try {
            await this.logAdminAction('admin_session_end', {
                sessionDuration: Date.now() - (this.currentAdmin?.loginTime || Date.now())
            });
            
            await firebase.auth().signOut();
            this.showMessage('Logged out successfully!', 'success');
            
            setTimeout(() => {
                window.location.href = '/index.html';
            }, 1000);
        } catch (error) {
            this.showMessage('Error logging out: ' + error.message, 'error');
        }
    }

    // Utility methods
    showLoading(show) {
        const loader = document.getElementById('admin-loading');
        if (loader) {
            loader.style.display = show ? 'flex' : 'none';
        }
    }

    showMessage(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `admin-toast toast-${type}`;
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
    window.adminAuth = new AdminAuthManager();
});
