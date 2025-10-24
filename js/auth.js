// Authentication JavaScript
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.init();
    }

    init() {
        // Wait for Firebase to be ready
        if (typeof firebase !== 'undefined') {
            this.setupAuth();
        } else {
            // Wait for Firebase to load
            setTimeout(() => this.init(), 100);
        }
    }

    setupAuth() {
        // Listen for authentication state changes
        firebase.auth().onAuthStateChanged((user) => {
            this.currentUser = user;
            this.updateUI(user);
        });

        // Setup event listeners
        this.setupEventListeners();
    }

    setupEventListeners() {
        // Login button
        const loginBtn = document.getElementById('btn-login');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showAuthModal());
        }

        // Logout button
        const logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Modal close button
        const authModal = document.getElementById('auth-modal');
        const authClose = document.getElementById('auth-close');
        if (authClose) {
            authClose.addEventListener('click', () => this.hideAuthModal());
        }

        // Click outside modal to close
        if (authModal) {
            authModal.addEventListener('click', (e) => {
                if (e.target === authModal) {
                    this.hideAuthModal();
                }
            });
        }

        // Auth tabs
        const authTabs = document.querySelectorAll('.auth-tab');
        authTabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
        });

        // Form submissions
        const loginForm = document.getElementById('login-form');
        const signupForm = document.getElementById('signup-form');

        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        // Google sign-in buttons
        const googleButtons = document.querySelectorAll('.auth-btn-google');
        googleButtons.forEach(btn => {
            btn.addEventListener('click', () => this.signInWithGoogle());
        });

        // Password toggle buttons
        const passwordToggles = document.querySelectorAll('.password-toggle');
        passwordToggles.forEach(toggle => {
            toggle.addEventListener('click', (e) => this.togglePassword(e.target));
        });
    }

    showAuthModal() {
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    hideAuthModal() {
        const authModal = document.getElementById('auth-modal');
        if (authModal) {
            authModal.classList.remove('show');
            document.body.style.overflow = '';
            this.clearMessages();
        }
    }

    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.auth-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');

        // Update forms
        document.querySelectorAll('.auth-form').forEach(form => {
            form.classList.remove('active');
        });
        document.getElementById(`${tabName}-form`).classList.add('active');

        this.clearMessages();
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value;
        const password = document.getElementById('login-password').value;

        if (!this.validateEmail(email)) {
            this.showError('login-email', 'Please enter a valid email address');
            return;
        }

        if (!password) {
            this.showError('login-password', 'Password is required');
            return;
        }

        this.showLoading(true);
        this.clearMessages();

        try {
            await firebase.auth().signInWithEmailAndPassword(email, password);
            this.showMessage('Welcome back!', 'success');
            setTimeout(() => this.hideAuthModal(), 1500);
        } catch (error) {
            this.showMessage(this.getErrorMessage(error.code), 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;

        // Validation
        if (!name.trim()) {
            this.showError('signup-name', 'Name is required');
            return;
        }

        if (!this.validateEmail(email)) {
            this.showError('signup-email', 'Please enter a valid email address');
            return;
        }

        if (password.length < 6) {
            this.showError('signup-password', 'Password must be at least 6 characters');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('signup-confirm-password', 'Passwords do not match');
            return;
        }

        this.showLoading(true);
        this.clearMessages();

        try {
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
            
            // Update user profile with name
            await userCredential.user.updateProfile({
                displayName: name
            });

            // Save user data to Firestore
            await this.saveUserToFirestore(userCredential.user, name);
            
            this.showMessage('Account created successfully! Welcome!', 'success');
            setTimeout(() => this.hideAuthModal(), 1500);
        } catch (error) {
            this.showMessage(this.getErrorMessage(error.code), 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async signInWithGoogle() {
        this.showLoading(true);
        this.clearMessages();

        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');
            
            const result = await firebase.auth().signInWithPopup(provider);
            
            // Save user data to Firestore if new user
            if (result.additionalUserInfo?.isNewUser) {
                await this.saveUserToFirestore(result.user, result.user.displayName);
            }
            
            this.showMessage(`Welcome ${result.user.displayName}!`, 'success');
            setTimeout(() => this.hideAuthModal(), 1500);
        } catch (error) {
            if (error.code !== 'auth/popup-closed-by-user') {
                this.showMessage(this.getErrorMessage(error.code), 'error');
            }
        } finally {
            this.showLoading(false);
        }
    }

    async logout() {
        try {
            await firebase.auth().signOut();
            this.showGlobalMessage('You have been logged out successfully', 'success');
        } catch (error) {
            this.showGlobalMessage('Error logging out. Please try again.', 'error');
        }
    }

    async saveUserToFirestore(user, displayName) {
        try {
            const userData = {
                uid: user.uid,
                email: user.email,
                displayName: displayName || user.displayName || '',
                photoURL: user.photoURL || '',
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
                quizzesTaken: 0,
                totalScore: 0,
                averageScore: 0
            };

            await firebase.firestore()
                .collection('users')
                .doc(user.uid)
                .set(userData, { merge: true });
        } catch (error) {
            console.error('Error saving user data:', error);
        }
    }

    updateUI(user) {
        const userInfo = document.getElementById('user-info');
        const loginBtn = document.getElementById('btn-login');
        const userName = document.getElementById('user-name');
        const userAvatar = document.getElementById('user-avatar');

        if (user) {
            // User is signed in
            if (userInfo) userInfo.style.display = 'flex';
            if (loginBtn) loginBtn.style.display = 'none';
            if (userName) userName.textContent = user.displayName || user.email;
            if (userAvatar) {
                userAvatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=4F46E5&color=fff`;
            }
        } else {
            // User is signed out
            if (userInfo) userInfo.style.display = 'none';
            if (loginBtn) loginBtn.style.display = 'flex';
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showError(fieldId, message) {
        const field = document.getElementById(fieldId);
        const errorElement = field.parentElement.querySelector('.form-error');
        
        field.classList.add('error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.add('show');
        }
    }

    clearErrors() {
        document.querySelectorAll('.form-input.error').forEach(input => {
            input.classList.remove('error');
        });
        document.querySelectorAll('.form-error.show').forEach(error => {
            error.classList.remove('show');
        });
    }

    showMessage(message, type = 'info') {
        const messageElement = document.getElementById('auth-message');
        if (messageElement) {
            messageElement.textContent = message;
            messageElement.className = `auth-message ${type} show`;
        }
    }

    showGlobalMessage(message, type = 'info') {
        // Create a global message toast
        const toast = document.createElement('div');
        toast.className = `global-message ${type}`;
        toast.textContent = message;
        
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? '#10B981' : '#DC2626'};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 10001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
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
        }, 3000);
    }

    clearMessages() {
        const messageElement = document.getElementById('auth-message');
        if (messageElement) {
            messageElement.classList.remove('show');
        }
        this.clearErrors();
    }

    showLoading(show) {
        const loadingElement = document.getElementById('auth-loading');
        if (loadingElement) {
            loadingElement.classList.toggle('show', show);
        }
    }

    togglePassword(toggleBtn) {
        const passwordInput = toggleBtn.parentElement.querySelector('.form-input');
        const icon = toggleBtn.querySelector('i');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    getErrorMessage(errorCode) {
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email address',
            'auth/wrong-password': 'Incorrect password',
            'auth/email-already-in-use': 'An account with this email already exists',
            'auth/weak-password': 'Password should be at least 6 characters',
            'auth/invalid-email': 'Please enter a valid email address',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later',
            'auth/network-request-failed': 'Network error. Please check your connection',
            'auth/popup-blocked': 'Please allow popups for this website',
            'auth/popup-closed-by-user': 'Sign-in cancelled',
            'default': 'An error occurred. Please try again'
        };
        
        return errorMessages[errorCode] || errorMessages.default;
    }
}

// Initialize authentication when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});
