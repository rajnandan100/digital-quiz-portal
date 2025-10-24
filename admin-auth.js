// Admin Authentication and Role Management System

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
                    // Get fresh ID token to check custom claims
                    const tokenResult = await user.getIdTokenResult();
                    const customClaims = tokenResult.claims;
                    
                    // Check if user has admin privileges
                    if (customClaims.admin || customClaims.superAdmin || customClaims.moderator) {
                        this.currentAdmin = {
                            uid: user.uid,
                            email: user.email,
                            displayName: user.displayName,
                            roles: customClaims,
                            isSuperAdmin: customClaims.superAdmin || false,
                            isAdmin: customClaims.admin || false,
                            isModerator: customClaims.moderator || false
                        };
                        
                        this.updateAdminUI(this.currentAdmin);
                        this.logAdminLogin();
                    } else {
                        // User doesn't have admin privileges
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

    // Admin login with enhanced security
    async adminLogin(email, password) {
        try {
            this.showLoading(true);
            
            // Basic email/password authentication
            const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
            const user = userCredential.user;
            
            // Get ID token to check custom claims
            const tokenResult = await user.getIdTokenResult();
            const customClaims = tokenResult.claims;
            
            // Verify admin privileges
            if (!customClaims.admin && !customClaims.superAdmin && !customClaims.moderator) {
                await firebase.auth().signOut();
                throw new Error('Access denied. Admin privileges required.');
            }
            
            // Log successful admin login
            await this.logAdminAction('admin_login', {
                adminId: user.uid,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                ip: await this.getClientIP(),
                userAgent: navigator.userAgent
            });
            
            this.showMessage('Admin login successful!', 'success');
            return user;
            
        } catch (error) {
            this.showMessage(this.getErrorMessage(error.code || error.message), 'error');
            
            // Log failed login attempt
            await this.logAdminAction('admin_login_failed', {
                email: email,
                error: error.message,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                ip: await this.getClientIP()
            });
            
            throw error;
        } finally {
            this.showLoading(false);
        }
    }

    // Request admin privileges for existing user
    async requestAdminAccess(justification) {
        if (!firebase.auth().currentUser) {
            throw new Error('Must be logged in to request admin access');
        }

        const request = {
            userId: firebase.auth().currentUser.uid,
            email: firebase.auth().currentUser.email,
            displayName: firebase.auth().currentUser.displayName,
            justification: justification,
            status: 'pending',
            requestedAt: firebase.firestore.FieldValue.serverTimestamp(),
            ip: await this.getClientIP()
        };

        await firebase.firestore().collection('adminRequests').add(request);
        this.showMessage('Admin access request submitted for review.', 'info');
    }

    // Grant admin privileges (Super Admin only)
    async grantAdminAccess(userId, roles = {}) {
        if (!this.hasRole(this.adminRoles.SUPER_ADMIN)) {
            throw new Error('Only super admins can grant admin access');
        }

        try {
            // This would typically be done via a Cloud Function
            // For now, we'll create an admin user record
            const adminUserData = {
                uid: userId,
                roles: roles,
                grantedBy: this.currentAdmin.uid,
                grantedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await firebase.firestore()
                .collection('adminUsers')
                .doc(userId)
                .set(adminUserData);

            await this.logAdminAction('admin_access_granted', {
                targetUserId: userId,
                roles: roles,
                grantedBy: this.currentAdmin.uid
            });

            this.showMessage('Admin access granted successfully!', 'success');
        } catch (error) {
            this.showMessage('Error granting admin access: ' + error.message, 'error');
            throw error;
        }
    }

    // Revoke admin privileges (Super Admin only)
    async revokeAdminAccess(userId) {
        if (!this.hasRole(this.adminRoles.SUPER_ADMIN)) {
            throw new Error('Only super admins can revoke admin access');
        }

        try {
            await firebase.firestore()
                .collection('adminUsers')
                .doc(userId)
                .delete();

            await this.logAdminAction('admin_access_revoked', {
                targetUserId: userId,
                revokedBy: this.currentAdmin.uid
            });

            this.showMessage('Admin access revoked successfully!', 'success');
        } catch (error) {
            this.showMessage('Error revoking admin access: ' + error.message, 'error');
            throw error;
        }
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
                ip: await this.getClientIP(),
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
            loginMethod: 'email_password',
            roles: this.currentAdmin.roles
        });
    }

    // Handle unauthorized access attempts
    handleUnauthorizedAccess() {
        this.showMessage('Access denied. Admin privileges required.', 'error');
        setTimeout(() => {
            window.location.href = '/login.html?redirect=admin';
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
        window.location.href = '/login.html?redirect=admin';
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

    // Get client IP (for logging purposes)
    async getClientIP() {
        try {
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            return data.ip;
        } catch (error) {
            return 'unknown';
        }
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
                window.location.href = '/login.html';
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
                document.body.removeChild(toast);
            }, 300);
        }, 4000);
    }

    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'No admin account found with this email',
            'auth/wrong-password': 'Incorrect password',
            'auth/invalid-email': 'Please enter a valid email address',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later',
            'auth/network-request-failed': 'Network error. Please check your connection',
            'Access denied. Admin privileges required.': 'Access denied. This account does not have admin privileges.',
            'default': 'An error occurred. Please try again'
        };
        return errorMessages[errorCode] || errorMessages.default;
    }
}

// Initialize Admin Authentication
document.addEventListener('DOMContentLoaded', () => {
    window.adminAuth = new AdminAuthManager();
});
