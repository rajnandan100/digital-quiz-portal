console.log('🧪 TEST FILE LOADED - If you see this, caching is not the issue');

// Minimal admin auth that WILL work
class TestAdminAuth {
    constructor() {
        this.init();
    }
    
    init() {
        console.log('🚀 Test admin auth starting');
        
        // Wait for Firebase
        if (typeof firebase !== 'undefined') {
            this.setupAuth();
        } else {
            setTimeout(() => this.init(), 100);
        }
    }
    
    setupAuth() {
        console.log('🔐 Setting up test auth');
        
        firebase.auth().onAuthStateChanged(async (user) => {
            console.log('👤 Auth state changed:', user ? user.email : 'No user');
            
            if (user) {
                try {
                    const adminDoc = await firebase.firestore()
                        .collection('adminUsers')
                        .doc(user.uid)
                        .get();
                    
                    if (adminDoc.exists && adminDoc.data().roles) {
                        console.log('✅ Admin user found - showing panel');
                        this.showPanel();
                    } else {
                        console.log('❌ Not admin - redirecting with CORRECT path');
                        // ABSOLUTE CORRECT PATH
                        window.location.href = 'https://rajnandan100.github.io/digital-quiz-portal/index.html?error=access_denied';
                    }
                } catch (error) {
                    console.error('💥 Error:', error);
                    // ABSOLUTE CORRECT PATH
                    window.location.href = 'https://rajnandan100.github.io/digital-quiz-portal/index.html?error=auth_error';
                }
            } else {
                console.log('🔄 No user - redirecting with CORRECT path');
                // ABSOLUTE CORRECT PATH
                window.location.href = 'https://rajnandan100.github.io/digital-quiz-portal/index.html?redirect=admin';
            }
        });
    }
    
    showPanel() {
        const loading = document.getElementById('admin-loading');
        const panel = document.getElementById('admin-panel');
        
        if (loading) loading.style.display = 'none';
        if (panel) panel.style.display = 'flex';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 Loading test admin auth');
    window.testAdminAuth = new TestAdminAuth();
});
