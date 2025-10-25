// ===== FULLY WORKING MAIN.JS =====
console.log('🚀 Loading Enhanced Main.js...');

// Global variables
let allQuizzes = [];
let currentUser = null;

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM loaded, initializing homepage...');
    
    // Initialize features in correct order
    initFirebase();
    initParticles();
    initNavigation();
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
        // Listen for auth changes
        firebase.auth().onAuthStateChanged((user) => {
            currentUser = user;
            console.log('Auth state:', user ? `Logged in as ${user.email}` : 'Not logged in');
            updateAuthButtons(user);
        });
        console.log('✅ Firebase authentication listener set up');
    } else {
        console.warn('⚠️ Firebase not available');
    }
}

// ===== QUIZ LOADING SYSTEM =====
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
        // Check Firebase availability
        if (typeof firebase === 'undefined' || !firebase.apps.length) {
            console.warn('⚠️ Firebase not available, loading sample quizzes');
            loadSampleQuizzes();
            return;
        }

        console.log('📡 Fetching quizzes from Firebase...');
        
        // Get quizzes from Firestore
        const quizzesRef = firebase.firestore().collection('quizzes');
        const snapshot = await quizzesRef.where('status', '==', 'active').orderBy('createdAt', 'desc').get();
        
        allQuizzes = [];

        if (snapshot.empty) {
            console.log('📭 No active quizzes found');
            showEmptyState();
            return;
        }

        // Process Firebase quizzes
        snapshot.forEach(doc => {
            const quiz = doc.data();
            allQuizzes.push({
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
        });

        console.log(`✅ Successfully loaded ${allQuizzes.length} real quizzes from Firebase`);
        displayQuizzes(allQuizzes);

    } catch (error) {
        console.error('❌ Error loading quizzes from Firebase:', error);
        console.log('🔄 Falling back to sample quizzes...');
        loadSampleQuizzes();
    }
}

// ===== SAMPLE QUIZZES FALLBACK =====
function loadSampleQuizzes() {
    console.log('📝 Loading sample quizzes...');
    
    allQuizzes = [
        {
            id: 'sample-1',
            title: '🎯 Sample General Knowledge Quiz',
            description: 'This is a sample quiz. Create real quizzes in the Admin Panel to replace this.',
            category: 'general-knowledge',
            questions: 5,
            duration: 10,
            date: new Date().toISOString().split('T')[0],
            difficulty: 'easy',
            isSample: true
        },
        {
            id: 'sample-2',
            title: '🧪 Sample Science Quiz',
            description: 'Another sample. Your admin-created quizzes will appear here automatically!',
            category: 'science',
            questions: 8,
            duration: 15,
            date: new Date().toISOString().split('T')[0],
            difficulty: 'medium',
            isSample: true
        },
        {
            id: 'sample-3',
            title: '🔢 Sample Math Quiz',
            description: 'Sample math quiz. Login as admin and create real quizzes to see them here.',
            category: 'mathematics',
            questions: 6,
            duration: 12,
            date: new Date().toISOString().split('T')[0],
            difficulty: 'medium',
            isSample: true
        }
    ];

    displayQuizzes(allQuizzes);
    showSampleNotice();
}

function showSampleNotice() {
    setTimeout(() => {
        const quizGrid = document.getElementById('quiz-grid');
        const notice = document.createElement('div');
        notice.className = 'sample-notice';
        notice.innerHTML = `
            <div style="background: linear-gradient(135deg, #fef3c7, #fed7aa); border: 2px solid #f59e0b; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <i class="fas fa-info-circle" style="color: #d97706; font-size: 24px; margin-bottom: 10px;"></i>
                <h3 style="color: #92400e; margin: 10px 0;">These are Sample Quizzes</h3>
                <p style="color: #78350f; margin: 10px 0;">🎯 <strong>To add real quizzes:</strong> Login → Go to Admin Panel → Create Quiz</p>
                <p style="color: #78350f; margin: 10px 0; font-size: 14px;">Real quizzes created by admin will automatically replace these samples!</p>
            </div>
        `;
        quizGrid.appendChild(notice);
    }, 500);
}

function showEmptyState() {
    const quizGrid = document.getElementById('quiz-grid');
    quizGrid.innerHTML = `
        <div class="empty-state" style="text-align: center; padding: 60px 20px;">
            <i class="fas fa-graduation-cap" style="font-size: 64px; color: #cbd5e1; margin-bottom: 20px;"></i>
            <h3 style="color: #1e293b; margin-bottom: 15px;">No Quizzes Available Yet</h3>
            <p style="color: #64748b; margin-bottom: 25px;">Quizzes created by administrators will appear here.</p>
            <div style="display: flex; gap: 15px; justify-content: center; flex-wrap: wrap;">
                <button class="btn-primary" onclick="refreshQuizzes()">
                    <i class="fas fa-refresh"></i> Refresh
                </button>
                <button class="btn-secondary" onclick="showLoginForAdmin()">
                    <i class="fas fa-user-cog"></i> Admin Login
                </button>
            </div>
        </div>
    `;
}

// ===== QUIZ DISPLAY =====
function displayQuizzes(quizzes) {
    const quizGrid = document.getElementById('quiz-grid');
    if (!quizGrid) return;

    quizGrid.innerHTML = '';

    if (quizzes.length === 0) {
        showEmptyState();
        return;
    }

    quizzes.forEach((quiz, index) => {
        const quizCard = createQuizCard(quiz);
        quizCard.style.animationDelay = `${index * 0.1}s`;
        quizCard.classList.add('animate-fadeIn');
        quizGrid.appendChild(quizCard);
    });

    updateStats();
}

function createQuizCard(quiz) {
    const card = document.createElement('div');
    card.className = `quiz-card ${quiz.isSample ? 'sample-quiz' : ''}`;
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
                ${quiz.isSample ? 'Sample Quiz' : 'Start Quiz'}
            </button>
            <button class="btn-quiz-preview" onclick="previewQuiz('${quiz.id}')" title="Preview Quiz">
                <i class="fas fa-eye"></i>
            </button>
        </div>
    `;

    return card;
}

// ===== QUIZ INTERACTION FUNCTIONS =====
function startQuiz(quizId, isSample = false) {
    console.log('🎯 Starting quiz:', quizId, 'Sample:', isSample);

    // Handle sample quizzes
    if (isSample) {
        alert('🎯 Sample Quiz Info\n\n' +
              'This is a demonstration quiz.\n\n' +
              '📝 To create real quizzes:\n' +
              '1. Login to your account\n' +
              '2. Access the Admin Panel\n' +
              '3. Use "Quiz Management" to create quizzes\n' +
              '4. Real quizzes will appear here automatically!\n\n' +
              '🎓 Try creating your first quiz!');
        
        // Show login modal
        if (window.authManager && typeof window.authManager.showAuthModal === 'function') {
            window.authManager.showAuthModal();
        }
        return;
    }

    // Check authentication for real quizzes
    if (!currentUser) {
        alert('🔐 Login Required\n\nPlease login or register to take quizzes.\n\nClick "Login" to get started!');
        
        // Show login modal
        if (window.authManager && typeof window.authManager.showAuthModal === 'function') {
            window.authManager.showAuthModal();
        }
        return;
    }

    // Find and validate quiz
    const quiz = allQuizzes.find(q => q.id === quizId);
    if (!quiz) {
        alert('❌ Quiz not found!\n\nThis quiz may have been removed or is no longer available.');
        refreshQuizzes(); // Refresh to get updated list
        return;
    }

    // Redirect to quiz page
    console.log('✅ Redirecting to quiz page...');
    window.location.href = `quiz.html?id=${quizId}`;
}

async function previewQuiz(quizId) {
    console.log('👁️ Previewing quiz:', quizId);

    const quiz = allQuizzes.find(q => q.id === quizId);
    if (!quiz) {
        alert('❌ Quiz not found');
        return;
    }

    if (quiz.isSample) {
        alert(`📋 SAMPLE QUIZ PREVIEW\n\n` +
              `📚 Title: ${quiz.title}\n` +
              `📝 Description: ${quiz.description}\n` +
              `❓ Questions: ${quiz.questions}\n` +
              `⏱️ Duration: ${quiz.duration} minutes\n` +
              `📊 Difficulty: ${quiz.difficulty}\n\n` +
              `💡 This is a sample quiz for demonstration.\n` +
              `Create real quizzes in the Admin Panel!`);
        return;
    }

    // For real quizzes, get details from Firebase
    try {
        if (typeof firebase !== 'undefined' && firebase.apps.length) {
            const doc = await firebase.firestore().collection('quizzes').doc(quizId).get();
            
            if (doc.exists) {
                const quizData = doc.data();
                const questions = quizData.questions || [];
                
                let previewText = `📋 QUIZ PREVIEW\n\n`;
                previewText += `📚 Title: ${quizData.title}\n`;
                previewText += `📂 Category: ${quizData.category}\n`;
                previewText += `📊 Difficulty: ${quizData.difficulty || 'Medium'}\n`;
                previewText += `⏱️ Time Limit: ${quizData.timeLimit || 30} minutes\n`;
                previewText += `❓ Total Questions: ${questions.length}\n`;
                previewText += `🎯 Status: ${quizData.status || 'Active'}\n\n`;
                
                if (questions.length > 0) {
                    previewText += `📖 SAMPLE QUESTIONS:\n\n`;
                    questions.slice(0, 3).forEach((q, index) => {
                        previewText += `${index + 1}. ${q.question}\n`;
                        if (q.options && q.options.length > 0) {
                            q.options.forEach((opt, i) => {
                                previewText += `   ${String.fromCharCode(65 + i)}) ${opt}\n`;
                            });
                        }
                        previewText += `   💎 Points: ${q.points || 1}\n\n`;
                    });
                    
                    if (questions.length > 3) {
                        previewText += `... and ${questions.length - 3} more questions\n\n`;
                    }
                }
                
                previewText += `🚀 Ready to start? Click "Start Quiz"!`;
                alert(previewText);
            } else {
                alert('❌ Quiz details not available');
            }
        } else {
            // Fallback preview
            alert(`📋 QUIZ PREVIEW\n\n` +
                  `📚 Title: ${quiz.title}\n` +
                  `📝 Description: ${quiz.description}\n` +
                  `❓ Questions: ${quiz.questions}\n` +
                  `⏱️ Duration: ${quiz.duration} minutes\n` +
                  `📊 Difficulty: ${quiz.difficulty}\n\n` +
                  `🚀 Click "Start Quiz" to begin!`);
        }
    } catch (error) {
        console.error('Error loading quiz preview:', error);
        alert('❌ Error loading quiz preview.\n\nPlease try again or contact support if the issue persists.');
    }
}

// ===== BUTTON INITIALIZATION =====
function initButtons() {
    console.log('🔘 Initializing buttons...');

    // Hero section buttons
    const startQuizBtn = document.getElementById('start-quiz-btn');
    if (startQuizBtn) {
        startQuizBtn.addEventListener('click', () => {
            if (allQuizzes.length > 0) {
                startQuiz(allQuizzes[0].id, allQuizzes[0].isSample);
            } else {
                alert('📭 No quizzes available at the moment.\n\nPlease check back later or refresh the page!');
                refreshQuizzes();
            }
        });
    }

    const leaderboardBtn = document.getElementById('view-leaderboard-btn');
    if (leaderboardBtn) {
        leaderboardBtn.addEventListener('click', () => {
            window.location.href = 'leaderboard.html';
        });
    }

    const loadMoreBtn = document.getElementById('load-more-btn');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', () => {
            alert('🔄 Load More Feature\n\nThis feature will be implemented soon!\nFor now, all available quizzes are displayed.');
        });
    }

    console.log('✅ Buttons initialized');
}

// ===== FILTER SYSTEM =====
function initFilters() {
    const applyFiltersBtn = document.getElementById('apply-filters');
    const subjectFilter = document.getElementById('subject-filter');
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
    
    if (subjectFilter) {
        subjectFilter.addEventListener('change', applyFilters);
    }
}

function applyFilters() {
    const subjectFilter = document.getElementById('subject-filter')?.value;
    const dateFilter = document.getElementById('date-filter')?.value;

    let filteredQuizzes = [...allQuizzes];

    // Filter by subject
    if (subjectFilter && subjectFilter !== 'all') {
        filteredQuizzes = filteredQuizzes.filter(quiz => quiz.category === subjectFilter);
    }

    // Filter by date
    if (dateFilter) {
        filteredQuizzes = filteredQuizzes.filter(quiz => quiz.date === dateFilter);
    }

    displayQuizzes(filteredQuizzes);
    
    console.log(`🔍 Filters applied: ${filteredQuizzes.length} quizzes shown`);
}

// ===== UI UPDATES =====
function updateAuthButtons(user) {
    // This will be handled by auth.js, just log the status
    console.log('🔐 Auth UI should update:', user ? 'Show user info' : 'Show login button');
}

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

// ===== UTILITY FUNCTIONS =====
function refreshQuizzes() {
    console.log('🔄 Refreshing quizzes...');
    allQuizzes = [];
    initQuizLoading();
}

function showLoginForAdmin() {
    if (window.authManager && typeof window.authManager.showAuthModal === 'function') {
        window.authManager.showAuthModal();
    } else {
        alert('🔐 Please use the Login button in the navigation to access admin features.');
    }
}

// ===== PARTICLES.JS =====
function initParticles() {
    if (window.particlesJS) {
        particlesJS('particles-js', {
            "particles": {
                "number": { "value": 60, "density": { "enable": true, "value_area": 800 } },
                "color": { "value": "#ffffff" },
                "shape": { "type": "circle" },
                "opacity": { "value": 0.6, "anim": { "enable": false } },
                "size": { "value": 3, "random": true },
                "line_linked": { "enable": true, "distance": 150, "color": "#ffffff", "opacity": 0.4, "width": 1 },
                "move": { "enable": true, "speed": 6, "direction": "none", "out_mode": "out" }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": { "onhover": { "enable": true, "mode": "repulse" }, "onclick": { "enable": true, "mode": "push" } }
            },
            "retina_detect": true
        });
        console.log('✨ Particles background initialized');
    }
}

// ===== NAVIGATION =====
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

    console.log('🧭 Navigation initialized');
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

console.log('🎉 Enhanced Main.js loaded successfully!');
