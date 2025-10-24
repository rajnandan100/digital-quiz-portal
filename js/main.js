// Main JavaScript File
document.addEventListener('DOMContentLoaded', function() {
    // Initialize particles background
    initParticles();
    
    // Initialize navigation
    initNavigation();
    
    // Initialize quiz loading
    initQuizLoading();
    
    // Initialize scroll effects
    initScrollEffects();
    
    // Initialize filters
    initFilters();
});

// Particles.js Configuration
function initParticles() {
    if (window.particlesJS) {
        particlesJS('particles-js', {
            "particles": {
                "number": {
                    "value": 80,
                    "density": {
                        "enable": true,
                        "value_area": 800
                    }
                },
                "color": {
                    "value": "#ffffff"
                },
                "shape": {
                    "type": "circle",
                    "stroke": {
                        "width": 0,
                        "color": "#000000"
                    }
                },
                "opacity": {
                    "value": 0.5,
                    "random": false,
                    "anim": {
                        "enable": false,
                        "speed": 1,
                        "opacity_min": 0.1,
                        "sync": false
                    }
                },
                "size": {
                    "value": 3,
                    "random": true,
                    "anim": {
                        "enable": false,
                        "speed": 40,
                        "size_min": 0.1,
                        "sync": false
                    }
                },
                "line_linked": {
                    "enable": true,
                    "distance": 150,
                    "color": "#ffffff",
                    "opacity": 0.4,
                    "width": 1
                },
                "move": {
                    "enable": true,
                    "speed": 6,
                    "direction": "none",
                    "random": false,
                    "straight": false,
                    "out_mode": "out",
                    "bounce": false,
                    "attract": {
                        "enable": false,
                        "rotateX": 600,
                        "rotateY": 1200
                    }
                }
            },
            "interactivity": {
                "detect_on": "canvas",
                "events": {
                    "onhover": {
                        "enable": true,
                        "mode": "repulse"
                    },
                    "onclick": {
                        "enable": true,
                        "mode": "push"
                    },
                    "resize": true
                },
                "modes": {
                    "grab": {
                        "distance": 400,
                        "line_linked": {
                            "opacity": 1
                        }
                    },
                    "bubble": {
                        "distance": 400,
                        "size": 40,
                        "duration": 2,
                        "opacity": 8,
                        "speed": 3
                    },
                    "repulse": {
                        "distance": 200,
                        "duration": 0.4
                    },
                    "push": {
                        "particles_nb": 4
                    },
                    "remove": {
                        "particles_nb": 2
                    }
                }
            },
            "retina_detect": true
        });
    }
}

// Navigation functionality
function initNavigation() {
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');

    // Mobile menu toggle
    if (navToggle) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            navToggle.classList.toggle('active');
        });
    }

    // Close mobile menu when clicking on a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
        });
    });

    // Active link highlighting
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            navLinks.forEach(l => l.classList.remove('active'));
            e.target.closest('.nav-link').classList.add('active');
        });
    });
}

// Quiz loading simulation
function initQuizLoading() {
    const quizGrid = document.getElementById('quiz-grid');
    
    // Simulate loading quizzes
    setTimeout(() => {
        loadSampleQuizzes();
    }, 2000);
}

// Load sample quizzes
let allQuizzes = [];

function loadSampleQuizzes() {
    const quizGrid = document.getElementById('quiz-grid');
    
    const sampleQuizzes = [
        {
            id: 1,
            title: "General Knowledge Challenge 2024",
            description: "Test your knowledge across various topics including current affairs, history, geography, and science.",
            category: "general-knowledge",
            questions: 30,
            duration: 30,
            date: "2024-10-25"
        },
        {
            id: 2,
            title: "English Grammar Mastery",
            description: "Perfect your English grammar skills with comprehensive questions covering tenses, vocabulary, and sentence structure.",
            category: "english",
            questions: 25,
            duration: 25,
            date: "2024-10-24"
        },
        {
            id: 3,
            title: "World Knowledge Quiz",
            description: "Explore fascinating facts about countries, cultures, landmarks, and global events in this comprehensive quiz.",
            category: "general-knowledge",
            questions: 35,
            duration: 35,
            date: "2024-10-26"
        },
        {
            id: 4,
            title: "English Literature & Comprehension",
            description: "Dive deep into English literature, reading comprehension, and advanced language skills.",
            category: "english",
            questions: 40,
            duration: 40,
            date: "2024-10-23"
        },
        {
            id: 5,
            title: "Current Affairs 2024",
            description: "Stay updated with the latest happenings around the world with our current affairs quiz.",
            category: "general-knowledge",
            questions: 20,
            duration: 20,
            date: "2024-10-27"
        }
    ];
    
    allQuizzes = sampleQuizzes;
    displayQuizzes(allQuizzes);
}

function displayQuizzes(quizzes) {
    const quizGrid = document.getElementById('quiz-grid');
    quizGrid.innerHTML = '';
    
    if (quizzes.length === 0) {
        quizGrid.innerHTML = `
            <div class="quiz-loading">
                <i class="fas fa-search"></i>
                <p>No quizzes found matching your criteria</p>
            </div>
        `;
        return;
    }
    
    quizzes.forEach((quiz, index) => {
        const quizCard = createQuizCard(quiz);
        quizCard.style.animationDelay = `${index * 0.1}s`;
        quizCard.classList.add('animate-fadeInUp');
        quizGrid.appendChild(quizCard);
    });
}

// Create quiz card element
function createQuizCard(quiz) {
    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.setAttribute('data-category', quiz.category);
    
    const category = {
        'general-knowledge': {
            name: 'General Knowledge',
            color: '#4F46E5',
            icon: 'fas fa-globe'
        },
        'english': {
            name: 'English',
            color: '#059669', 
            icon: 'fas fa-language'
        }
    };
    
    const categoryInfo = category[quiz.category] || {
        name: quiz.category,
        color: '#4F46E5',
        icon: 'fas fa-question'
    };
    
    // Format date
    const dateObj = new Date(quiz.date);
    const formattedDate = dateObj.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: 'numeric'
    });
    
    card.innerHTML = `
        <div class="quiz-header">
            <div class="quiz-category">
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
            </div>
        </div>
        
        <div class="quiz-actions">
            <button class="btn-quiz-start" onclick="startQuiz(${quiz.id})">
                <i class="fas fa-play"></i>
                Start Quiz
            </button>
            <button class="btn-quiz-preview" onclick="previewQuiz(${quiz.id})" title="Preview Quiz">
                <i class="fas fa-eye"></i>
            </button>
        </div>
    `;
    
    return card;
}

// Initialize filters
function initFilters() {
    const applyFiltersBtn = document.getElementById('apply-filters');
    const subjectFilter = document.getElementById('subject-filter');
    const dateFilter = document.getElementById('date-filter');
    
    if (applyFiltersBtn) {
        applyFiltersBtn.addEventListener('click', applyFilters);
    }
}

// Apply filters function
function applyFilters() {
    const subjectFilter = document.getElementById('subject-filter').value;
    const dateFilter = document.getElementById('date-filter').value;
    
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
}

// Scroll effects
function initScrollEffects() {
    const navbar = document.getElementById('navbar');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// Quiz functions (placeholders)
function startQuiz(quizId) {
    console.log('Starting quiz:', quizId);
    // This will be implemented in later steps
    alert('Quiz functionality will be implemented in the next steps!');
}

function previewQuiz(quizId) {
    console.log('Previewing quiz:', quizId);
    // This will be implemented in later steps
    alert('Quiz preview will be implemented in the next steps!');
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});
