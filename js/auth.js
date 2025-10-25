// ===== ENHANCED AUTHENTICATION SYSTEM =====
console.log('🔐 Loading Enhanced Authentication System...');

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authModal = null;
        this.init();
    }

    init() {
        this.authModal = document.getElementById('auth-modal');
        this.setupEventListeners();
        this.setupFirebaseAuth();
        console.log('✅ AuthManager initialized');
    }

    setupEventListeners() {
        // Login button
        const loginBtn = document.getElementById('btn-login');
        if (loginBtn) {
            loginBtn.addEventListener('click', () => this.showAuthModal());
        }

        // Modal close button
        const authClose = document.getElementById('auth-close');
        if (authClose) {
            authClose.addEventListener('click', () => this.hideAuthModal());
        }

        // Modal backdrop click
        if (this.authModal) {
            this.authModal.addEventListener('click', (e) => {
                if (e.target === this.authModal) {
                    this.hideAuthModal();
                }
            });
        }

        // Tab switching
        const authTabs = document.querySelectorAll('.auth-tab');
        authTabs.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
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

        // Password toggle buttons
        const passwordToggles = document.querySelectorAll('.password-toggle');
        passwordToggles.forEach(toggle => {
            toggle.addEventListener('click', () => this.togglePassword(toggle));
        });

        // Google login button
        const googleBtn = document.querySelector('.auth-btn-google');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => this.handleGoogleAuth());
        }

        console.log('🎯 Auth event listeners set up');
    }

    setupFirebaseAuth() {
        if (typeof firebase !== 'undefined') {
            firebase.auth().onAuthStateChanged((user) => {
                this.currentUser = user;
                this.updateAuthUI(user);
                
                if (user) {
                    console.log('✅ User authenticated:', user.email);
                    this.hideAuthModal();
                    // Refresh main page content
                    if (typeof refreshQuizzes === 'function') {
                        setTimeout(refreshQuizzes, 1000);
                    }
                } else {
                    console.log('🔓 User logged out');
                }
            });
        }
    }

    showAuthModal() {
        if (this.authModal) {
            this.authModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            
            // Focus first input
            setTimeout(() => {
                const firstInput = this.authModal.querySelector('input[type="email"]');
                if (firstInput) firstInput.focus();
            }, 100);
            
            console.log('📱 Auth modal opened');
        }
    }

    hideAuthModal() {
        if (this.authModal) {
            this.authModal.style.display = 'none';
            document.body.style.overflow = 'auto';
            this.clearForms();
            console.log('✖️ Auth modal closed');
        }
    }

    switchTab(tabType) {
        const tabs = document.querySelectorAll('.auth-tab');
        const forms = document.querySelectorAll('.auth-form');

        tabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabType);
        });

        forms.forEach(form => {
            form.classList.toggle('active', form.id === `${tabType}-form`);
        });

        this.clearMessages();
        console.log('🔄 Switched to', tabType, 'tab');
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('login-email').value.trim();
        const password = document.getElementById('login-password').value;

        if (!email || !password) {
            this.showError('Please fill in all fields');
            return;
        }

        this.showLoading(true);
        
        try {
            console.log('🔐 Attempting login for:', email);
            await firebase.auth().signInWithEmailAndPassword(email, password);
            this.showSuccess('Login successful! Welcome back!');
            
            setTimeout(() => {
                this.hideAuthModal();
                window.location.reload(); // Refresh to update UI
            }, 1500);
            
        } catch (error) {
            console.error('❌ Login error:', error);
            this.handleAuthError(error);
        } finally {
            this.showLoading(false);
        }
    }

    async handleSignup(e) {
        e.preventDefault();
        
        const name = document.getElementById('signup-name').value.trim();
        const email = document.getElementById('signup-email').value.trim();
        const password = document.getElementById('signup-password').value;
        const confirmPassword = document.getElementById('signup-confirm-password').value;

        // Validation
        if (!name || !email || !password || !confirmPassword) {
            this.showError('Please fill in all fields');
            return;
        }

        if (password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            this.showError('Password must be at least 6 characters');
            return;
        }

        this.showLoading(true);

        try {
            console.log('📝 Creating account for:', email);
            const result = await firebase.auth().createUserWithEmailAndPassword(email, password);
            
            // Update user profile
            await result.user.updateProfile({
                displayName: name
            });

            // Save user data to Firestore
            await firebase.firestore().collection('users').doc(result.user.uid).set({
                name: name,
                email: email,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                role: 'user',
                quizzesTaken: 0,
                totalScore: 0
            });

            this.showSuccess('Account created successfully! Welcome to DigiQuiz!');
            
            setTimeout(() => {
                this.hideAuthModal();
                window.location.reload(); // Refresh to update UI
            }, 2000);
            
        } catch (error) {
            console.error('❌ Signup error:', error);
            this.handleAuthError(error);
        } finally {
            this.showLoading(false);
        }
    }

    async handleGoogleAuth() {
        this.showLoading(true);
        
        try {
            console.log('🔐 Attempting Google authentication...');
            const provider = new firebase.auth.GoogleAuthProvider();
            provider.addScope('email');
            provider.addScope('profile');
            
            const result = await firebase.auth().signInWithPopup(provider);
            const user = result.user;
            
            // Check if user document exists, create if not
            const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
            
            if (!userDoc.exists) {
                await firebase.firestore().collection('users').doc(user.uid).set({
                    name: user.displayName,
                    email: user.email,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    role: 'user',
                    quizzesTaken: 0,
                    totalScore: 0,
                    authProvider: 'google'
                });
                console.log('👤 New Google user profile created');
            }

            this.showSuccess('Google login successful! Welcome!');
            
            setTimeout(() => {
                this.hideAuthModal();
                window.location.reload(); // Refresh to update UI
            }, 1500);
            
        } catch (error) {
            console.error('❌ Google auth error:', error);
            
            if (error.code === 'auth/popup-closed-by-user') {
                this.showError('Login cancelled');
            } else {
                this.handleAuthError(error);
            }
        } finally {
            this.showLoading(false);
        }
    }

    handleAuthError(error) {
        const errorMessages = {
            'auth/user-not-found': 'No account found with this email',
            'auth/wrong-password': 'Incorrect password',
            'auth/email-already-in-use': 'Email is already registered',
            'auth/weak-password': 'Password should be at least 6 characters',
            'auth/invalid-email': 'Please enter a valid email address',
            'auth/user-disabled': 'This account has been disabled',
            'auth/too-many-requests': 'Too many failed attempts. Please try again later',
            'auth/network-request-failed': 'Network error. Please check your connection'
        };

        const message = errorMessages[error.code] || `Authentication error: ${error.message}`;
        this.showError(message);
    }

    togglePassword(toggle) {
        const input = toggle.parentElement.querySelector('input');
        const icon = toggle.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    }

    updateAuthUI(user) {
        const userInfo = document.getElementById('user-info');
        const loginBtn = document.getElementById('btn-login');
        
        if (user) {
            // User is logged in
            if (userInfo) userInfo.style.display = 'flex';
            if (loginBtn) loginBtn.style.display = 'none';
            
            // Update user info
            const userName = user.displayName || user.email || 'User';
            const displayName = userName.split('@')[0];
            const shortName = displayName.length > 10 ? displayName.substring(0, 8) + '..' : displayName;
            
            const userNameEl = document.getElementById('user-name');
            const profileNameEl = document.getElementById('profile-name');
            const profileEmailEl = document.getElementById('profile-email');
            
            if (userNameEl) userNameEl.textContent = shortName;
            if (profileNameEl) profileNameEl.textContent = user.displayName || displayName;
            if (profileEmailEl) profileEmailEl.textContent = user.email;
            
            // Set avatars
            const avatarUrl = user.photoURL || 
                `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4F46E5&color=fff&size=128&bold=true&format=png`;
            
            const userAvatar = document.getElementById('user-avatar');
            const dropdownAvatar = document.getElementById('dropdown-avatar');
            
            if (userAvatar) {
                userAvatar.src = avatarUrl;
                userAvatar.onerror = () => {
                    userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName.charAt(0))}&background=4F46E5&color=fff&size=128`;
                };
            }
            
            if (dropdownAvatar) {
                dropdownAvatar.src = avatarUrl;
                dropdownAvatar.onerror = () => {
                    dropdownAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName.charAt(0))}&background=4F46E5&color=fff&size=128`;
                };
            }
            
            console.log('👤 Auth UI updated for:', displayName);
            
        } else {
            // User is not logged in
            if (userInfo) userInfo.style.display = 'none';
            if (loginBtn) loginBtn.style.display = 'flex';
            console.log('🔓 Auth UI updated: Show login button');
        }
    }

    showLoading(show) {
        const loading = document.getElementById('auth-loading');
        if (loading) {
            loading.style.display = show ? 'flex' : 'none';
        }
    }

    showError(message) {
        this.showMessage(message, 'error');
    }

    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    showMessage(message, type) {
        const messageEl = document.getElementById('auth-message');
        if (messageEl) {
            messageEl.textContent = message;
            messageEl.className = `auth-message ${type}`;
            messageEl.style.display = 'block';
            
            // Auto hide after 5 seconds
            setTimeout(() => {
                messageEl.style.display = 'none';
            }, 5000);
        }
    }

    clearMessages() {
        const messageEl = document.getElementById('auth-message');
        if (messageEl) {
            messageEl.style.display = 'none';
            messageEl.textContent = '';
        }
    }

    clearForms() {
        const forms = document.querySelectorAll('.auth-form');
        forms.forEach(form => {
            form.reset();
            const errors = form.querySelectorAll('.form-error');
            errors.forEach(error => {
                error.textContent = '';
                error.style.display = 'none';
            });
        });
        this.clearMessages();
    }

    // Enhanced logout with confirmation
    async logout() {
        if (confirm('🔓 Are you sure you want to logout?')) {
            try {
                await firebase.auth().signOut();
                console.log('👋 User logged out successfully');
                
                // Show logout success message
                const tempMessage = document.createElement('div');
                tempMessage.className = 'logout-success-message';
                tempMessage.innerHTML = `
                    <i class="fas fa-check-circle"></i>
                    <span>Logged out successfully!</span>
                `;
                tempMessage.style.cssText = `
                    position: fixed;
                    top: 100px;
                    right: 20px;
                    background: linear-gradient(135deg, #10B981, #059669);
                    color: white;
                    padding: 1rem 1.5rem;
                    border-radius: 12px;
                    box-shadow: 0 10px 30px rgba(16, 185, 129, 0.3);
                    z-index: 10000;
                    display: flex;
                    align-items: center;
                    gap: 0.5rem;
                    font-weight: 600;
                    animation: slideInRight 0.3s ease;
                `;
                
                document.body.appendChild(tempMessage);
                
                setTimeout(() => {
                    tempMessage.remove();
                    window.location.reload();
                }, 2000);
                
            } catch (error) {
                console.error('Logout error:', error);
                alert('Error logging out. Please try again.');
            }
        }
    }

    // Public method for external access
    showAuthModal() {
        this.authModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Add entrance animation
        const container = this.authModal.querySelector('.auth-container');
        if (container) {
            container.style.transform = 'scale(0.9)';
            container.style.opacity = '0';
            
            setTimeout(() => {
                container.style.transition = 'all 0.3s ease';
                container.style.transform = 'scale(1)';
                container.style.opacity = '1';
            }, 10);
        }
    }

    hideAuthModal() {
        if (this.authModal) {
            const container = this.authModal.querySelector('.auth-container');
            if (container) {
                container.style.transform = 'scale(0.9)';
                container.style.opacity = '0';
                
                setTimeout(() => {
                    this.authModal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                    container.style.transform = 'scale(1)';
                    container.style.opacity = '1';
                }, 200);
            } else {
                this.authModal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        }
    }

    getCurrentUser() {
        return this.currentUser;
    }
}

// Enhanced form validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePassword(password) {
    return password.length >= 6;
}

// Initialize AuthManager
let authManager;

document.addEventListener('DOMContentLoaded', function() {
    authManager = new AuthManager();
    console.log('🎯 Enhanced Auth system ready');
});

// Make AuthManager globally available
window.authManager = authManager;

// CSS Animation for logout message
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    .logout-success-message {
        font-family: var(--font-primary, 'Inter', sans-serif);
    }
`;
document.head.appendChild(style);

console.log('✅ Enhanced Authentication System loaded successfully!');
