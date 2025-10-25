// ===== COMPLETE ENHANCED MAIN.JS - ALL FEATURES FIXED =====
console.log('🚀 Loading Complete Enhanced Main.js v2.0...');

// Global variables
let allQuizzes = [];
let displayedQuizzes = [];
let currentUser = null;
let currentPage = 0;
const QUIZZES_PER_PAGE = 2;

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing enhanced homepage...');
    
    initFirebase();
    initParticles();
    initBubbleEffects();
    initNavigation();
    initMobileNavigation();
    initButtons();
    initFilters();
    initScrollEffects();
    initProfileMenu();
    
    // Load quizzes after Firebase is ready
    setTimeout(() => {
        console.log('Starting quiz loading system...');
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

// ===== QUIZ LOADING SYSTEM (NO SAMPLES FOR NEW USERS) =====
async function initQuizLoading() {
    console.log('🔄 Loading quizzes...');
    const quizGrid = document.getElementById('quiz-grid');
    
    if (!quizGrid) {
        console.error('❌ Quiz grid element not found');
        return;
    }

    // Show loading state
    quizGrid.innerHTML = `
        <div class="quiz-loading">
            <i class="fas fa-spinner fa-spin"></i>
            <p>Loading quizzes from database...</p>
        </div>
    `;

    try {
        if (typeof firebase === 'undefined' || !firebase.apps.length) {
            console.warn('⚠️ Firebase not available');
            handleFirebaseUnavailable();
            return;
        }

        console.log('📡 Fetching real quizzes from Firebase...');
        
        // Simple query (no index required for now)
        const quizzesRef = firebase.firestore().collection('quizzes');
        const snapshot = await quizzesRef.get();
        
        const tempQuizzes = [];

        // Filter and process real quizzes only
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
            console.log('📭 No active quizzes found in database');
            showNoQuizzesState();
            return;
        }

        console.log(`✅ Successfully loaded ${allQuizzes.length} real quizzes from Firebase`);
        displayQuizzesPaginated();

    } catch (error) {
        console.error('❌ Error loading quizzes from Firebase:', error);
        
        if (currentUser) {
            // Logged users get helpful message
            console.log('🔄 User is logged in, showing connection issue...');
            showConnectionIssue();
        } else {
            // Non-logged users see login prompt (NO SAMPLES)
            console.log('👤 New user detected, showing quiz access info...');
            showQuizzesRequireLogin();
        }
    }
}

// ===== NO SAMPLES - LOGIN REQUIRED STATES =====
function handleFirebaseUnavailable() {
    if (currentUser) {
        showConnectionIssue();
    } else {
        showQuizzesRequireLogin();
    }
}

function showQuizzesRequireLogin() {
    const quizGrid = document.getElementById('quiz-grid');
    quizGrid.innerHTML = `
        <div class="login-required-state">
            <div class="login-icon">
                <i class="fas fa-lock"></i>
            </div>
            <h3>Real Quizzes Available!</h3>
            <p>Login to access our collection of interactive quizzes created by administrators.</p>
            <div class="login-features">
                <div class="feature-item">
                    <i class="fas fa-check"></i>
                    <span>Multiple subject categories</span>
                </div>
                <div class="feature-item">
                    <i class="fas fa-check"></i>
                    <span>Timed quiz challenges</span>
                </div>
                <div class="feature-item">
                    <i class="fas fa-check"></i>
                    <span>Track your progress</span>
                </div>
            </div>
            <button class="btn-primary login-cta pulse-animation" onclick="showLoginForQuizzes()">
                <i class="fas fa-sign-in-alt"></i>
                Login to Access Quizzes
            </button>
        </div>
    `;
}

function showNoQuizzesState() {
    const quizGrid = document.getElementById('quiz-grid');
    quizGrid.innerHTML = `
        <div class="no-quizzes-state">
            <div class="no-quiz-icon">
                <i class="fas fa-graduation-cap"></i>
            </div>
            <h3>No Quizzes Available Yet</h3>
            <p>New quizzes will appear here once created by administrators.</p>
            <div class="no-quiz-actions">
                <button class="btn-primary" onclick="refreshQuizzes()">
                    <i class="fas fa-refresh"></i> 
                    Check for New Quizzes
                </button>
            </div>
        </div>
    `;
}

function showConnectionIssue() {
    const quizGrid = document.getElementById('quiz-grid');
    quizGrid.innerHTML = `
        <div class="connection-issue">
            <div class="connection-icon">
                <i class="fas fa-wifi"></i>
            </div>
            <h3>Connection Issue</h3>
            <p>Unable to load quizzes. Please check your internet connection.</p>
            <button class="btn-primary" onclick="refreshQuizzes()">
                <i class="fas fa-refresh"></i>
                Retry Loading
            </button>
        </div>
    `;
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
    
    // Create and append quiz cards with staggered animation
    quizzesToShow.forEach((quiz, index) => {
        const quizCard = createEnhancedQuizCard(quiz);
        quizCard.style.animationDelay = `${index * 0.3}s`;
        quizCard.classList.add('animate-slideInUp');
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
        const remaining = totalQuizzes - currentCount;
        const nextBatch = Math.min(QUIZZES_PER_PAGE, remaining);
        
        loadMoreBtn.innerHTML = `
            <i class="fas fa-plus"></i>
            <span>Load ${nextBatch} More Quiz${nextBatch > 1 ? 'es' : ''}</span>
        `;
        loadMoreBtn.style.display = 'flex';
    } else {
        loadMoreBtn.style.display = 'none';
    }
    
    paginationControls.style.display = totalQuizzes > 0 ? 'flex' : 'none';
    updateStats();
    
    console.log(`📊 Displayed ${currentCount}/${totalQuizzes} quizzes`);
}

function loadMoreQuizzes() {
    console.log('📖 Loading more quizzes...');
    currentPage++;
    displayQuizzesPaginated(false);
    
    // Smooth scroll to new content
    setTimeout(() => {
        const newCards = document.querySelectorAll('.quiz-card:nth-last-child(-n+2)');
        if (newCards.length > 0) {
            newCards[0].scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }, 500);
}

// ===== ENHANCED QUIZ CARD CREATION (NO PREVIEW BUTTON) =====
function createEnhancedQuizCard(quiz) {
    const card = document.createElement('div');
    card.className = 'quiz-card enhanced-card';
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
        <div class="card-glow-effect"></div>
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

        <div class="quiz-actions-single">
            <button class="btn-quiz-start-enhanced" onclick="startQuiz('${quiz.id}')">
                <i class="fas fa-play"></i>
                <span>Start Quiz</span>
                <div class="button-shine"></div>
            </button>
        </div>
    `;

    return card;
}

// ===== ENHANCED QUIZ INTERACTION =====
function startQuiz(quizId) {
    console.log('🎯 Starting quiz:', quizId);

    // Always check authentication for all quizzes
    if (!currentUser) {
        alert('🔐 Login Required\n\nPlease login to access quizzes.\n\n✨ All our quizzes require authentication for the best experience!');
        
        if (window.authManager && typeof window.authManager.showAuthModal === 'function') {
            window.authManager.showAuthModal();
        }
        return;
    }

    // User is authenticated, proceed to quiz
    const quiz = allQuizzes.find(q => q.id === quizId);
    if (!quiz) {
        alert('❌ Quiz not found!\n\nThis quiz may no longer be available.');
        refreshQuizzes();
        return;
    }

    console.log('✅ User authenticated, redirecting to quiz...');
    console.log(`🎓 Starting "${quiz.title}" with ${quiz.questions} questions`);
    
    // Add loading feedback
    const startBtn = event.target.closest('button');
    if (startBtn) {
        startBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Loading Quiz...</span>';
        startBtn.disabled = true;
    }
    
    // Redirect to quiz page
    setTimeout(() => {
        window.location.href = `quiz.html?id=${quizId}`;
    }, 500);
}

// ===== ENHANCED HERO BUTTONS =====
function initButtons() {
    console.log('🔘 Initializing enhanced buttons...');

    // Enhanced Start Quiz button (latest quiz priority)
    const startQuizBtn = document.getElementById('start-quiz-btn');
    if (startQuizBtn) {
        startQuizBtn.addEventListener('click', () => {
            if (allQuizzes.length > 0) {
                // Always get the latest quiz (first in sorted array)
                const latestQuiz = allQuizzes[0];
                console.log('🎯 Starting latest quiz:', latestQuiz.title);
                startQuiz(latestQuiz.id);
            } else if (!currentUser) {
                // New users see login prompt
                alert('🔐 Login Required\n\nLogin to access our quiz collection!');
                if (window.authManager) {
                    window.authManager.showAuthModal();
                }
            } else {
                // Logged users see no quizzes message
                alert('📭 No quizzes available.\n\nNew quizzes will appear here once created!');
                refreshQuizzes();
            }
        });
    }

    // Enhanced View Rankings button (direct to leaderboard)
    const leaderboardBtn = document.getElementById('view-leaderboard-btn');
    if (leaderboardBtn) {
        leaderboardBtn.addEventListener('click', () => {
            console.log('🏆 Redirecting to latest rankings...');
            
            // Add loading feedback
            leaderboardBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Loading Rankings...</span>';
            
            setTimeout(() => {
                window.location.href = 'leaderboard.html';
            }, 300);
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
    
    console.log('🔍 Enhanced filters initialized');
}

function applyFilters() {
    const subjectFilter = document.getElementById('subject-filter')?.value;
    const dateFilter = document.getElementById('date-filter')?.value;

    let filteredQuizzes = [...allQuizzes];
    let appliedFilters = [];

    // Apply subject filter
    if (subjectFilter && subjectFilter !== 'all') {
        filteredQuizzes = filteredQuizzes.filter(quiz => quiz.category === subjectFilter);
        appliedFilters.push(`Subject: ${subjectFilter}`);
    }

    // Apply date filter  
    if (dateFilter) {
        filteredQuizzes = filteredQuizzes.filter(quiz => quiz.date === dateFilter);
        appliedFilters.push(`Date: ${dateFilter}`);
    }

    // Store original and update display
    const originalQuizzes = [...allQuizzes];
    allQuizzes = filteredQuizzes;
    
    displayQuizzesPaginated(true);
    
    // Show filter feedback
    console.log(`🔍 Filters applied: ${filteredQuizzes.length} of ${originalQuizzes.length} quizzes`);
    
    if (appliedFilters.length > 0) {
        console.log('Active filters:', appliedFilters.join(', '));
    }
    
    // Restore original data after display
    setTimeout(() => {
        allQuizzes = originalQuizzes;
    }, 100);
}

// ===== ENHANCED BUBBLE EFFECTS =====
function initBubbleEffects() {
    const bubbleContainer = document.getElementById('bubble-container');
    if (!bubbleContainer) return;

    function createEnhancedBubble() {
        const bubble = document.createElement('div');
        bubble.className = 'bubble-enhanced';
        
        const size = Math.random() * 80 + 20; // 20-100px
        const left = Math.random() * 100; // 0-100%
        const duration = Math.random() * 6 + 8; // 8-14 seconds
        const opacity = Math.random() * 0.4 + 0.1; // 0.1-0.5
        const delay = Math.random() * 2; // 0-2s delay
        
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${left}%`;
        bubble.style.animationDuration = `${duration}s`;
        bubble.style.animationDelay = `${delay}s`;
        bubble.style.opacity = opacity;
        
        // Random bubble colors
        const colors = [
            'rgba(255, 255, 255, 0.6)',
            'rgba(79, 70, 229, 0.3)',
            'rgba(124, 58, 237, 0.2)',
            'rgba(245, 158, 11, 0.3)'
        ];
        bubble.style.background = colors[Math.floor(Math.random() * colors.length)];
        
        bubbleContainer.appendChild(bubble);
        
        setTimeout(() => {
            if (bubble.parentNode) {
                bubble.parentNode.removeChild(bubble);
            }
        }, (duration + delay) * 1000);
    }
    
    // Create initial bubbles
    for (let i = 0; i < 8; i++) {
        setTimeout(() => createEnhancedBubble(), i * 200);
    }
    
    // Continue creating bubbles
    setInterval(createEnhancedBubble, 1500);
    console.log('🫧 Enhanced bubble effects with colors initialized');
}

// ===== MOBILE NAVIGATION ENHANCED =====
function initMobileNavigation() {
    const mobileNav = document.getElementById('mobile-nav');
    if (mobileNav) {
        // Show mobile nav only on mobile devices
        if (window.innerWidth <= 768) {
            mobileNav.classList.add('show');
        }
        
        // Handle window resize
        window.addEventListener('resize', () => {
            if (window.innerWidth <= 768) {
                mobileNav.classList.add('show');
            } else {
                mobileNav.classList.remove('show');
                mobileNav.classList.remove('minimized');
            }
        });
    }
    
    console.log('📱 Enhanced mobile navigation initialized');
}

function toggleMobileNav() {
    const mobileNav = document.getElementById('mobile-nav');
    const navIndicator = document.getElementById('mobile-nav-indicator');
    
    mobileNav.classList.toggle('minimized');
    
    if (mobileNav.classList.contains('minimized')) {
        console.log('📱 Mobile nav minimized');
    } else {
        console.log('📱 Mobile nav maximized');
    }
}

// ===== USER PROFILE MANAGEMENT =====
function initProfileMenu() {
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.user-profile') && !e.target.closest('.profile-dropdown')) {
            const dropdown = document.getElementById('profile-dropdown');
            if (dropdown) {
                dropdown.classList.remove('show');
                const arrow = document.getElementById('profile-arrow');
                if (arrow) arrow.classList.remove('rotated');
            }
        }
    });
}

function toggleProfileMenu() {
    const dropdown = document.getElementById('profile-dropdown');
    const arrow = document.getElementById('profile-arrow');
    
    dropdown.classList.toggle('show');
    arrow.classList.toggle('rotated');
    
    console.log('👤 Profile menu toggled');
}

function updateAuthUI(user) {
    const userInfo = document.getElementById('user-info');
    const loginBtn = document.getElementById('btn-login');
    
    if (user) {
        // User is logged in
        userInfo.style.display = 'flex';
        loginBtn.style.display = 'none';
        
        // Update user info with proper display
        const userName = user.displayName || user.email || 'User';
        const displayName = userName.split('@')[0]; // Remove email domain if email
        const shortName = displayName.length > 10 ? displayName.substring(0, 8) + '..' : displayName;
        
        document.getElementById('user-name').textContent = shortName;
        document.getElementById('profile-name').textContent = user.displayName || displayName;
        document.getElementById('profile-email').textContent = user.email;
        
        // Set avatar
        const avatarUrl = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4F46E5&color=fff&size=128&bold=true`;
        document.getElementById('user-avatar').src = avatarUrl;
        document.getElementById('dropdown-avatar').src = avatarUrl;
        
        console.log('👤 Auth UI updated for:', displayName);
        
    } else {
        // User is not logged in
        userInfo.style.display = 'none';
        loginBtn.style.display = 'flex';
        console.log('🔓 Auth UI updated: Show login button');
    }
}

function goToAdmin() {
    console.log('⚙️ Redirecting to admin panel...');
    window.location.href = 'admin.html';
}

function logoutUser() {
    if (confirm('🔓 Are you sure you want to logout?')) {
        if (firebase && firebase.auth) {
            firebase.auth().signOut().then(() => {
                console.log('👋 User logged out successfully');
                setTimeout(() => window.location.reload(), 500);
            }).catch((error) => {
                console.error('Logout error:', error);
                alert('Error logging out. Please try again.');
            });
        }
    }
}

// ===== ENHANCED PARTICLES.JS =====
function initParticles() {
    if (window.particlesJS) {
        particlesJS('particles-js', {
            "particles": {
                "number": { "value": 100, "density": { "enable": true, "value_area": 1000 } },
                "color": { "value": ["#ffffff", "#4F46E5", "#7C3AED"] },
                "shape": { "type": "circle" },
                "opacity": { 
                    "value": 0.6, 
                    "anim": { "enable": true, "speed": 1, "opacity_min": 0.2 } 
                },
                "size": { 
                    "value": 4, 
                    "random": true,
                    "anim": { "enable": true, "speed": 2, "size_min": 1 }
                },
                "line_linked": { 
                    "enable": true, 
                    "distance": 150, 
                    "color": "#ffffff", 
                    "opacity": 0.5, 
                    "width": 1 
                },
                "move": { 
                    "enable": true, 
                    "speed": 8, 
                    "direction": "none", 
                    "out_mode": "out" 
                }
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
        console.log('✨ Enhanced particles with multiple colors initialized');
    }
}

// ===== NAVIGATION ENHANCEMENTS =====
function initNavigation() {
    const navLinks = document.querySelectorAll('.nav-link, .mobile-nav-item');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            // Add active class to clicked link
            e.target.closest('a').classList.add('active');
        });
    });

    console.log('🧭 Enhanced navigation with active states initialized');
}

// ===== SCROLL EFFECTS =====
function initScrollEffects() {
    const navbar = document.getElementById('navbar');
    let lastScrollY = window.scrollY;
    
    window.addEventListener('scroll', () => {
        const currentScrollY = window.scrollY;
        
        if (currentScrollY > 100) {
            navbar?.classList.add('scrolled');
        } else {
            navbar?.classList.remove('scrolled');
        }
        
        // Add scroll direction classes
        if (currentScrollY > lastScrollY) {
            navbar?.classList.add('scroll-down');
            navbar?.classList.remove('scroll-up');
        } else {
            navbar?.classList.add('scroll-up');
            navbar?.classList.remove('scroll-down');
        }
        
        lastScrollY = currentScrollY;
    });
    
    console.log('📜 Enhanced scroll effects initialized');
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
    console.log('🔄 Refreshing quiz system...');
    allQuizzes = [];
    displayedQuizzes = [];
    currentPage = 0;
    initQuizLoading();
}

function showLoginForQuizzes() {
    console.log('🔐 Showing login for quiz access...');
    if (window.authManager && typeof window.authManager.showAuthModal === 'function') {
        window.authManager.showAuthModal();
    } else {
        alert('🔐 Please use the Login button in the top navigation.');
    }
}

// ===== SMOOTH SCROLLING =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start',
                inline: 'nearest'
            });
        }
    });
});

// ===== GLOBAL FUNCTIONS =====
window.startQuiz = startQuiz;
window.applyFilters = applyFilters;
window.refreshQuizzes = refreshQuizzes;
window.showLoginForQuizzes = showLoginForQuizzes;
window.toggleMobileNav = toggleMobileNav;
window.toggleProfileMenu = toggleProfileMenu;
window.goToAdmin = goToAdmin;
window.logoutUser = logoutUser;
window.loadMoreQuizzes = loadMoreQuizzes;

console.log('🎉 Complete Enhanced Main.js v2.0 loaded successfully!');
