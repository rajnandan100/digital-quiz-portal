// ===== ENHANCED MAIN.JS WITH ALL FEATURES =====
console.log('🚀 Loading Complete Enhanced Main.js...');

// Global variables
let allQuizzes = [];
let displayedQuizzes = [];
let currentUser = null;
let currentPage = 0;
const QUIZZES_PER_PAGE = 2;

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing homepage...');
    
    initFirebase();
    initParticles();
    initBubbleEffects();
    initNavigation();
    initMobileNavigation();
    initButtons();
    initFilters();
    initScrollEffects();
    
    // Load quizzes after Firebase is ready
    setTimeout(() => {
        console.log('Starting quiz loading...');
        initQuizLoading();
    }, 2000);
});

// ===== FIREBASE INTEGRATION =====
function initFirebase() {
    if (typeof firebase !== 'undefined') {
        firebase.auth().onAuthStateChanged((user) => {
            currentUser = user;
            console.log('Auth state:', user ? `Logged in as ${user.email}` : 'Not logged in');
            updateAuthUI(user);
        });
        console.log('✅ Firebase authentication listener set up');
    } else {
        console.warn('⚠️ Firebase not available');
    }
}

// ===== QUIZ LOADING WITH PAGINATION =====
async function initQuizLoading() {
    console.log('🔄 Loading quizzes...');
    const quizGrid = document.getElementById('quiz-grid');
    
    if (!quizGrid) {
        console.error('❌ Quiz grid element not found');
        return;
    }

    quizGrid.innerHTML = `
        <div class="quiz-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading quizzes from database...</p>
        </div>
    `;

    try {
        if (typeof firebase === 'undefined' || !firebase.apps.length) {
            console.warn('⚠️ Firebase not available, loading sample quizzes');
            loadSampleQuizzes();
            return;
        }

        console.log('📡 Fetching quizzes from Firebase...');
        
        // Simple query (no index required)
        const quizzesRef = firebase.firestore().collection('quizzes');
        const snapshot = await quizzesRef.get();
        
        const tempQuizzes = [];

        // Filter and process quizzes
        snapshot.forEach(doc => {
            const quiz = doc.data();
            // Only include active quizzes
            if ((quiz.status || 'active') === 'active') {
                tempQuizzes.push({
                    id: doc.id,
                    title: quiz.title || 'Untitled Quiz',
                    description: quiz.description || 'No description available',
                    category: quiz.category || 'general-knowledge',
                    questions: quiz.questions?.length || 0,
                    duration: quiz.timeLimit || 30,
                    date: quiz.createdAt ? quiz.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                    difficulty: quiz.difficulty || 'medium',
                    isReal: true
                });
            }
        });

        // Sort by creation date (newest first)
        allQuizzes = tempQuizzes.sort((a, b) => new Date(b.date) - new Date(a.date));
        
        if (allQuizzes.length === 0) {
            console.log('📭 No active quizzes found');
            showEmptyState();
            return;
        }

        console.log(`✅ Successfully loaded ${allQuizzes.length} real quizzes from Firebase`);
        displayQuizzesPaginated();

    } catch (error) {
        console.error('❌ Error loading quizzes from Firebase:', error);
        console.log('🔄 Falling back to sample quizzes...');
        loadSampleQuizzes();
    }
}

// ===== PAGINATION SYSTEM =====
function displayQuizzesPaginated(reset = true) {
    const quizGrid = document.getElementById('quiz-grid');
    const paginationControls = document.getElementById('pagination-controls');
    
    if (reset) {
        currentPage = 0;
        displayedQuizzes = [];
        quizGrid.innerHTML = '';
    }
    
    const startIndex = currentPage * QUIZZES_PER_PAGE;
    const endIndex = startIndex + QUIZZES_PER_PAGE;
    const quizzesToShow = allQuizzes.slice(startIndex, endIndex);
    
    // Add new quizzes to displayed array
    displayedQuizzes = [...displayedQuizzes, ...quizzesToShow];
    
    // Create and append quiz cards
    quizzesToShow.forEach((quiz, index) => {
        const quizCard = createQuizCard(quiz);
        quizCard.style.animationDelay = `${index * 0.2}s`;
        quizCard.classList.add('animate-fadeIn');
        quizGrid.appendChild(quizCard);
    });
    
    // Update pagination controls
    const totalQuizzes = allQuizzes.length;
    const currentCount = displayedQuizzes.length;
    const hasMore = currentCount < totalQuizzes;
    
    document.getElementById('current-count').textContent = currentCount;
    document.getElementById('total-count').textContent = totalQuizzes;
    
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (hasMore) {
        loadMoreBtn.style.display = 'flex';
        loadMoreBtn.innerHTML = `
            <i class="fas fa-plus"></i>
            Load More (${Math.min(QUIZZES_PER_PAGE, totalQuizzes - currentCount)} more)
        `;
    } else {
        loadMoreBtn.style.display = 'none';
    }
    
    paginationControls.style.display = totalQuizzes > 0 ? 'flex' : 'none';
    
    // Update statistics
    updateStats();
    
    console.log(`📊 Displayed ${currentCount}/${totalQuizzes} quizzes`);
}

function loadMoreQuizzes() {
    currentPage++;
    displayQuizzesPaginated(false);
}

// ===== ENHANCED QUIZ CARD CREATION (NO PREVIEW BUTTON) =====
function createQuizCard(quiz) {
    const card = document.createElement('div');
    card.className = `quiz-card ${quiz.isSample ? 'sample-quiz' : ''} enhanced-card`;
    card.setAttribute('data-category', quiz.category);

    const categories = {
        'general-knowledge': { name: 'General Knowledge', color: '#4F46E5', icon: 'fas fa-globe' },
        'english': { name: 'English', color: '#059669', icon: 'fas fa-language' },
        'science': { name: 'Science', color: '#DC2626', icon: 'fas fa-flask' },
        'mathematics': { name: 'Mathematics', color: '#7C3AED', icon: 'fas fa-calculator' },
        'history': { name: 'History', color: '#EA580C', icon: 'fas fa-landmark' },
        'geography': { name: 'Geography', color: '#059669', icon: 'fas fa-map-marked-alt' }
    };

    const categoryInfo = categories[quiz.category] || { name: quiz.category, color: '#4F46E5', icon: 'fas fa-question' };
    const formattedDate = new Date(quiz.date).toLocaleDateString('en-US', { 
        month: 'short', day: 'numeric', year: 'numeric' 
    });

    card.innerHTML = `
        <div class="quiz-card-glow"></div>
        <div class="quiz-header">
            <div class="quiz-category" style="color: ${categoryInfo.color};">
                <i class="${categoryInfo.icon}"></i>
                <span>${categoryInfo.name}</span>
            </div>
            <div class="quiz-date">
                <i class="fas fa-calendar-alt"></i>
                <span>${formattedDate}</span>
            </div>
        </div>

        <h3 class="quiz-title">${quiz.title}</h3>
        <p class="quiz-description">${quiz.description}</p>

        <div class="quiz-meta">
            <div class="quiz-info">
                <div class="info-item">
                    <i class="fas fa-question-circle"></i>
                    <span>${quiz.questions} Questions</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-clock"></i>
                    <span>${quiz.duration} min</span>
                </div>
                <div class="info-item">
                    <i class="fas fa-signal"></i>
                    <span>${quiz.difficulty}</span>
                </div>
            </div>
        </div>

        <div class="quiz-actions">
            <button class="btn-quiz-start ${quiz.isSample ? 'sample-btn' : ''}" 
                    onclick="startQuiz('${quiz.id}', ${quiz.isSample || false})" 
                    title="${quiz.isSample ? 'Sample Quiz - Login to create real quizzes' : 'Start this quiz'}">
                <i class="fas fa-play"></i>
                <span>${quiz.isSample ? 'Sample Quiz' : 'Start Quiz'}</span>
            </button>
        </div>
    `;

    return card;
}

// ===== BUBBLE EFFECTS SYSTEM =====
function initBubbleEffects() {
    const bubbleContainer = document.getElementById('bubble-container');
    if (!bubbleContainer) return;

    function createBubble() {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        
        const size = Math.random() * 40 + 10; // 10-50px
        const left = Math.random() * 100; // 0-100%
        const duration = Math.random() * 3 + 4; // 4-7 seconds
        
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${left}%`;
        bubble.style.animationDuration = `${duration}s`;
        
        bubbleContainer.appendChild(bubble);
        
        // Remove bubble after animation
        setTimeout(() => {
            if (bubble.parentNode) {
                bubble.parentNode.removeChild(bubble);
            }
        }, duration * 1000);
    }
    
    // Create bubbles continuously
    setInterval(createBubble, 800);
    console.log('🫧 Bubble effects initialized');
}

// ===== MOBILE NAVIGATION =====
function initMobileNavigation() {
    const mobileNav = document.getElementById('mobile-nav');
    if (mobileNav) {
        // Set initial state based on screen size
        if (window.innerWidth <= 768) {
            mobileNav.classList.add('show');
        }
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                mobileNav.classList.add('show');
            } else {
                mobileNav.classList.remove('show');
            }
        });
    }
    
    console.log('📱 Mobile navigation initialized');
}

function toggleMobileNav() {
    const mobileNav = document.getElementById('mobile-nav');
    const navIcon = document.getElementById('mobile-nav-icon');
    
    mobileNav.classList.toggle('minimized');
    
    if (mobileNav.classList.contains('minimized')) {
        navIcon.className = 'fas fa-chevron-up';
    } else {
        navIcon.className = 'fas fa-chevron-down';
    }
}

// ===== USER PROFILE MANAGEMENT =====
function toggleProfileMenu() {
    const dropdown = document.getElementById('profile-dropdown');
    dropdown.classList.toggle('show');
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-profile') && !e.target.closest('.profile-dropdown')) {
            dropdown.classList.remove('show');
        }
    });
}

function updateAuthUI(user) {
    const userInfo = document.getElementById('user-info');
    const loginBtn = document.getElementById('btn-login');
    
    if (user) {
        // User is logged in
        userInfo.style.display = 'flex';
        loginBtn.style.display = 'none';
        
        // Update user info
        const userName = user.displayName || user.email || 'User';
        const shortName = userName.length > 8 ? userName.substring(0, 8) + '...' : userName;
        
        document.getElementById('user-name').textContent = shortName;
        document.getElementById('profile-name').textContent = user.displayName || 'User';
        document.getElementById('profile-email').textContent = user.email;
        
        // Set avatar
        const avatarUrl = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(userName)}&background=4F46E5&color=fff&size=128`;
        document.getElementById('user-avatar').src = avatarUrl;
        document.getElementById('dropdown-avatar').src = avatarUrl;
        
    } else {
        // User is not logged in
        userInfo.style.display = 'none';
        loginBtn.style.display = 'flex';
    }
}

function goToAdmin() {
    window.location.href = 'admin.html';
}

function logoutUser() {
    if (firebase && firebase.auth) {
        firebase.auth().signOut().then(() => {
            console.log('User logged out successfully');
            window.location.reload();
        }).catch((error) => {
            console.error('Logout error:', error);
        });
    }
}

// ===== ENHANCED QUIZ INTERACTION =====
function startQuiz(quizId, isSample = false) {
    console.log('🎯 Starting quiz:', quizId, 'Sample:', isSample);

    if (isSample) {
        alert('🎯 Sample Quiz Demo\n\n' +
              'This is a demonstration quiz.\n\n' +
              '📝 To access real quizzes:\n' +
              '1. Login to your account\n' +
              '2. Real quizzes created by admin appear here\n' +
              '3. Click "Start Quiz" on real quizzes\n\n' +
              '🎓 Ready to try real quizzes?');
        
        if (window.authManager && typeof window.authManager.showAuthModal === 'function') {
            window.authManager.showAuthModal();
        }
        return;
    }

    // For real quizzes, check authentication
    if (!currentUser) {
        alert('🔐 Login Required\n\nPlease login to take quizzes.');
        
        if (window.authManager && typeof window.authManager.showAuthModal === 'function') {
            window.authManager.showAuthModal();
        }
        return;
    }

    // User is authenticated, proceed to quiz
    console.log('✅ User authenticated, redirecting to quiz...');
    window.location.href = `quiz.html?id=${quizId}`;
}

// ===== HERO SECTION ENHANCEMENTS =====
function initButtons() {
    console.log('🔘 Initializing enhanced buttons...');

    // Enhanced Start Quiz button (finds latest quiz)
    const startQuizBtn = document.getElementById('start-quiz-btn');
    if (startQuizBtn) {
        startQuizBtn.addEventListener('click', () => {
            if (allQuizzes.length > 0) {
                // Find the latest real quiz or use first available
                const latestQuiz = allQuizzes.find(q => !q.isSample) || allQuizzes[0];
                startQuiz(latestQuiz.id, latestQuiz.isSample);
            } else {
                alert('📭 No quizzes available.\n\nPlease check back later!');
                refreshQuizzes();
            }
        });
    }

    // Enhanced View Rankings button (goes to latest rankings)
    const leaderboardBtn = document.getElementById('view-leaderboard-btn');
    if (leaderboardBtn) {
        leaderboardBtn.addEventListener('click', () => {
            console.log('🏆 Redirecting to latest rankings...');
            window.location.href = 'leaderboard.html';
        });
    }

    // Enhanced Load More button
    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', loadMoreQuizzes);
    }

    console.log('✅ Enhanced buttons initialized');
}

// ===== ENHANCED FILTER SYSTEM =====
function initFilters() {
    const applyFiltersBtn = document.getElementById('apply-filters');
    const subjectFilter = document.getElementById('subject-filter');
    const dateFilter = document.getElementById('date-filter');
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    if (subjectFilter) {
        subjectFilter.addEventListener('change', applyFilters);
    }
    
    if (dateFilter) {
        dateFilter.addEventListener('change', applyFilters);
    }
}

function applyFilters() {
    const subjectFilter = document.getElementById('subject-filter')?.value;
    const dateFilter = document.getElementById('date-filter')?.value;

    let filteredQuizzes = [...allQuizzes];

    // Apply filters
    if (subjectFilter && subjectFilter !== 'all') {
        filteredQuizzes = filteredQuizzes.filter(quiz => quiz.category === subjectFilter);
    }

    if (dateFilter) {
        filteredQuizzes = filteredQuizzes.filter(quiz => quiz.date === dateFilter);
    }

    // Update global quiz array and reset pagination
    const originalQuizzes = [...allQuizzes];
    allQuizzes = filteredQuizzes;
    
    displayQuizzesPaginated(true);
    
    // Show filter results
    const resultText = filteredQuizzes.length === originalQuizzes.length ? 
        'All quizzes' : `${filteredQuizzes.length} of ${originalQuizzes.length} quizzes`;
    
    console.log(`🔍 Filter applied: ${resultText} shown`);
    
    // Reset filters and restore data after showing results
    setTimeout(() => {
        allQuizzes = originalQuizzes;
    }, 100);
}

// ===== FALLBACK SAMPLES =====
function loadSampleQuizzes() {
    console.log('📝 Loading enhanced sample quizzes...');
    
    allQuizzes = [
        {
            id: 'sample-1',
            title: '🎯 Welcome to DigiQuiz!',
            description: 'Sample quiz to demonstrate the platform. Create your own quizzes through the Admin Panel.',
            category: 'general-knowledge',
            questions: 5,
            duration: 10,
            date: new Date().toISOString().split('T')[0],
            difficulty: 'easy',
            isSample: true
        },
        {
            id: 'sample-2',
            title: '🧪 Science Demo Quiz',
            description: 'Experience our quiz interface. Your admin-created quizzes will replace samples automatically.',
            category: 'science',
            questions: 8,
            duration: 15,
            date: new Date().toISOString().split('T')[0],
            difficulty: 'medium',
            isSample: true
        }
    ];

    displayQuizzesPaginated();
    showSampleNotice();
}

function showSampleNotice() {
    setTimeout(() => {
        const quizGrid = document.getElementById('quiz-grid');
        const notice = document.createElement('div');
        notice.className = 'sample-notice';
        notice.innerHTML = `
            <div class="sample-info-card">
                <div class="info-icon">
                    <i class="fas fa-lightbulb"></i>
                </div>
                <div class="info-content">
                    <h3>These are Demo Quizzes</h3>
                    <p>🎯 <strong>To add real quizzes:</strong> Login → Admin Panel → Create Quiz</p>
                    <p>Real quizzes will automatically appear here and replace samples!</p>
                    <button class="btn-primary" onclick="showLoginForAdmin()">
                        <i class="fas fa-user-cog"></i> Access Admin Panel
                    </button>
                </div>
            </div>
        `;
        quizGrid.appendChild(notice);
    }, 1000);
}

// ===== BUBBLE EFFECTS =====
function initBubbleEffects() {
    const bubbleContainer = document.getElementById('bubble-container');
    if (!bubbleContainer) return;

    function createBubble() {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        
        const size = Math.random() * 60 + 20; // 20-80px
        const left = Math.random() * 100; // 0-100%
        const duration = Math.random() * 4 + 6; // 6-10 seconds
        const opacity = Math.random() * 0.3 + 0.1; // 0.1-0.4
        
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${left}%`;
        bubble.style.animationDuration = `${duration}s`;
        bubble.style.opacity = opacity;
        
        bubbleContainer.appendChild(bubble);
        
        setTimeout(() => {
            if (bubble.parentNode) {
                bubble.parentNode.removeChild(bubble);
            }
        }, duration * 1000);
    }
    
    // Create initial bubbles
    for (let i = 0; i < 5; i++) {
        setTimeout(() => createBubble(), i * 500);
    }
    
    // Continue creating bubbles
    setInterval(createBubble, 1200);
    console.log('🫧 Enhanced bubble effects initialized');
}

// ===== NAVIGATION ENHANCEMENTS =====
function initNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }

    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu) navMenu.classList.remove('active');
            if (navToggle) navToggle.classList.remove('active');
        });
    });

    console.log('🧭 Enhanced navigation initialized');
}

// ===== PARTICLES.JS ENHANCED =====
function initParticles() {
    if (window.particlesJS) {
        particlesJS('particles-js', {
            "particles": {
                "number": { "value": 80, "density": { "enable": true, "value_area": 800 } },
                "color": { "value": "#ffffff" },
                "shape": { "type": "circle" },
                "opacity": { "value": 0.5, "anim": { "enable": true, "speed": 1 } },
                "size": { "value": 3, "random": true, "anim": { "enable": true, "speed": 2 } },
                "line_linked": { "enable": true, "distance": 150, "color": "#ffffff", "opacity": 0.4, "width": 1 },
                "move": { "enable": true, "speed": 6, "direction": "none", "out_mode": "out" }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": { 
                    "onhover": { "enable": true, "mode": "repulse" }, 
                    "onclick": { "enable": true, "mode": "push" } 
                }
            },
            "retina_detect": true
        });
        console.log('✨ Enhanced particles background initialized');
    }
}

// ===== SCROLL EFFECTS =====
function initScrollEffects() {
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar?.classList.add('scrolled');
        } else {
            navbar?.classList.remove('scrolled');
        }
    });
}

// ===== UTILITY FUNCTIONS =====
function updateStats() {
    const totalQuizzesEl = document.getElementById('total-quizzes');
    const totalQuestionsEl = document.getElementById('total-questions');

    if (totalQuizzesEl) {
        totalQuizzesEl.textContent = allQuizzes.length || '0';
    }

    if (totalQuestionsEl) {
        const totalQuestions = allQuizzes.reduce((sum, quiz) => sum + (quiz.questions || 0), 0);
        totalQuestionsEl.textContent = totalQuestions || '0';
    }
}

function refreshQuizzes() {
    console.log('🔄 Refreshing quizzes...');
    allQuizzes = [];
    displayedQuizzes = [];
    currentPage = 0;
    initQuizLoading();
}

function showEmptyState() {
    const quizGrid = document.getElementById('quiz-grid');
    quizGrid.innerHTML = `
        <div class="empty-state">
            <div class="empty-icon">
                <i class="fas fa-graduation-cap"></i>
            </div>
            <h3>No Quizzes Available Yet</h3>
            <p>Quizzes created by administrators will appear here.</p>
            <div class="empty-actions">
                <button class="btn-primary" onclick="refreshQuizzes()">
                    <i class="fas fa-refresh"></i> Refresh Page
                </button>
                <button class="btn-secondary" onclick="showLoginForAdmin()">
                    <i class="fas fa-user-cog"></i> Admin Access
                </button>
            </div>
        </div>
    `;
}

function showLoginForAdmin() {
    if (window.authManager && typeof window.authManager.showAuthModal === 'function') {
        window.authManager.showAuthModal();
    } else {
        alert('🔐 Please use the Login button to access admin features.');
    }
}

// ===== SMOOTH SCROLLING =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    });
});

// ===== GLOBAL FUNCTIONS =====
window.startQuiz = startQuiz;
window.previewQuiz = previewQuiz;
window.applyFilters = applyFilters;
window.refreshQuizzes = refreshQuizzes;
window.showLoginForAdmin = showLoginForAdmin;
window.toggleMobileNav = toggleMobileNav;
window.toggleProfileMenu = toggleProfileMenu;
window.goToAdmin = goToAdmin;
window.logoutUser = logoutUser;
window.loadMoreQuizzes = loadMoreQuizzes;

console.log('🎉 Complete Enhanced Main.js loaded successfully!');
