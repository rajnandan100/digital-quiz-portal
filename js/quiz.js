// ===== COMPLETE REAL FIREBASE QUIZ SYSTEM ===== 
console.log('🚀 Loading Real Firebase Quiz System...');

class QuizManager {
    constructor() {
        this.currentUser = null;
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = {};
        this.markedQuestions = new Set();
        this.questionStates = {}; 
        this.timer = null;
        this.timeRemaining = 0;
        this.quizStartTime = null;
        this.selectedQuote = null;
        this.userFirstName = '';
        this.isPaletteExpanded = false;
        this.init();
    }

    init() {
        if (typeof firebase !== 'undefined' && document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else if (typeof firebase !== 'undefined') {
            this.setup();
        } else {
            setTimeout(() => this.init(), 100);
        }
    }

    setup() {
        console.log('🔧 Setting up real Firebase quiz system...');
        
        // Check authentication
        firebase.auth().onAuthStateChanged((user) => {
            this.currentUser = user;
            if (user) {
                this.extractUserFirstName(user);
                this.updateUserUI(user);
                this.loadRealQuizFromFirebase(); // Load real quiz from Firebase
            } else {
                console.log('❌ User not authenticated, redirecting...');
                alert('🔐 Please login to access quizzes.');
                window.location.href = '../index.html';
            }
        });

        this.setupEventListeners();
        this.setupQuestionPaletteToggle();
        this.selectMotivationalQuote();
    }

    // ===== REAL FIREBASE QUIZ LOADING =====
    async loadRealQuizFromFirebase() {
        const urlParams = new URLSearchParams(window.location.search);
        const quizId = urlParams.get('id');
        
        if (!quizId) {
            console.error('❌ No quiz ID provided');
            alert('❌ Quiz not found!\n\nReturning to homepage...');
            window.location.href = '../index.html';
            return;
        }

        console.log('📡 Loading real quiz from Firebase:', quizId);
        this.showLoading(true, 'Loading your quiz from database...');

        try {
            // Fetch quiz from Firebase
            const quizDoc = await firebase.firestore()
                .collection('quizzes')
                .doc(quizId)
                .get();

            if (!quizDoc.exists) {
                throw new Error('Quiz not found in database');
            }

            const quizData = quizDoc.data();
            console.log('✅ Quiz loaded from Firebase:', quizData.title);

            // Transform Firebase quiz data to internal format
            this.currentQuiz = {
                id: quizDoc.id,
                title: quizData.title || 'Untitled Quiz',
                category: quizData.category || 'general-knowledge',
                description: quizData.description || '',
                duration: quizData.timeLimit || 30,
                totalQuestions: quizData.questions?.length || 0,
                questions: quizData.questions || [],
                createdAt: quizData.createdAt,
                difficulty: quizData.difficulty || 'medium'
            };

            // Validate quiz has questions
            if (this.currentQuiz.totalQuestions === 0) {
                throw new Error('This quiz has no questions');
            }

            console.log(`🎯 Quiz "${this.currentQuiz.title}" ready with ${this.currentQuiz.totalQuestions} questions`);
            
            // Initialize quiz interface
            this.initializeQuiz();
            this.showLoading(false);

        } catch (error) {
            console.error('❌ Error loading quiz:', error);
            this.showLoading(false);
            
            alert(`❌ Quiz Loading Error\n\n${error.message}\n\nReturning to homepage...`);
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 2000);
        }
    }

    // ===== QUIZ INITIALIZATION =====
    initializeQuiz() {
        console.log('🎮 Initializing quiz interface...');
        
        // Initialize quiz data
        this.timeRemaining = this.currentQuiz.duration * 60; // Convert to seconds
        this.quizStartTime = new Date();
        this.currentQuestionIndex = 0;
        this.userAnswers = {};
        this.markedQuestions = new Set();
        this.questionStates = {};

        // Initialize question states
        this.currentQuiz.questions.forEach((_, index) => {
            this.questionStates[index] = index === 0 ? 'current' : 'not-visited';
        });

        // Update UI components
        this.updateQuizHeader();
        this.generateQuestionPalette();
        this.displayCurrentQuestion();
        this.startTimer();
        this.updateAllProgressBars();
        this.showPersonalizedGreeting();

        console.log('✅ Quiz interface initialized successfully');
    }

    // ===== USER INTERFACE UPDATES =====
    extractUserFirstName(user) {
        if (user.displayName) {
            this.userFirstName = user.displayName.split(' ')[0];
        } else if (user.email) {
            const emailName = user.email.split('@')[0];
            this.userFirstName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
        } else {
            this.userFirstName = 'Champion';
        }
    }

    updateUserUI(user) {
        // Update user greeting
        document.getElementById('user-greeting').textContent = `Hello, ${this.userFirstName}!`;
    }

    showPersonalizedGreeting() {
        const greeting = document.getElementById('user-greeting');
        if (greeting) {
            greeting.innerHTML = `
                <i class="fas fa-user-circle"></i>
                Good luck, ${this.userFirstName}!
            `;
        }
    }

    updateQuizHeader() {
        document.getElementById('quiz-title').textContent = this.currentQuiz.title;
        document.getElementById('total-questions').textContent = this.currentQuiz.totalQuestions;
        this.updateTimer();
    }

    // ===== TIMER SYSTEM =====
    startTimer() {
        this.timer = setInterval(() => {
            this.timeRemaining--;
            this.updateTimer();

            // Auto-submit when time is up
            if (this.timeRemaining <= 0) {
                clearInterval(this.timer);
                this.autoSubmitQuiz();
            }

            // Warning at 5 minutes
            if (this.timeRemaining === 300) {
                this.showTimerWarning();
            }

            // Critical warning at 1 minute
            if (this.timeRemaining === 60) {
                this.showToast('⏰ Only 1 minute remaining!', 'error');
            }
        }, 1000);
    }

    updateTimer() {
        const minutes = Math.floor(this.timeRemaining / 60);
        const seconds = this.timeRemaining % 60;
        const display = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        
        document.getElementById('timer-display').textContent = display;

        // Change timer color based on time remaining
        const timerContainer = document.querySelector('.timer-container');
        if (this.timeRemaining <= 300) { // 5 minutes
            timerContainer.style.background = 'rgba(220, 38, 38, 0.2)';
            timerContainer.style.borderColor = 'rgba(220, 38, 38, 0.4)';
        } else if (this.timeRemaining <= 600) { // 10 minutes
            timerContainer.style.background = 'rgba(245, 158, 11, 0.2)';
            timerContainer.style.borderColor = 'rgba(245, 158, 11, 0.4)';
        }
    }

    showTimerWarning() {
        this.showToast('⚠️ Only 5 minutes remaining!', 'warning');
        
        // Flash timer
        const timer = document.getElementById('timer-display');
        timer.style.animation = 'flash 1s ease-in-out 3';
    }

    // ===== QUESTION DISPLAY SYSTEM =====
    displayCurrentQuestion() {
        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        
        if (!question) {
            console.error('❌ Question not found at index:', this.currentQuestionIndex);
            return;
        }

        // Update question info
        document.getElementById('current-question-number').textContent = this.currentQuestionIndex + 1;
        document.getElementById('question-text').textContent = question.text || question.question || 'Question text not available';

        // Create enhanced options
        const optionsContainer = document.getElementById('options-container');
        optionsContainer.innerHTML = '';
        
        const options = question.options || question.choices || [];
        
        if (options.length === 0) {
            optionsContainer.innerHTML = '<p class="no-options">No options available for this question.</p>';
            return;
        }

        options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option-item enhanced-option';
            
            const isSelected = this.userAnswers[this.currentQuestionIndex] === index;
            if (isSelected) {
                optionDiv.classList.add('selected');
            }

            optionDiv.innerHTML = `
                <div class="option-radio">
                    <input type="radio" 
                           id="option-${index}" 
                           name="question-${question.id || this.currentQuestionIndex}" 
                           value="${index}" 
                           ${isSelected ? 'checked' : ''}>
                    <div class="radio-custom"></div>
                </div>
                <div class="option-content">
                    <label for="option-${index}" class="option-label">${option}</label>
                </div>
                <div class="option-indicator">
                    <i class="fas fa-check"></i>
                </div>
            `;

            // Add click event to entire option div
            optionDiv.addEventListener('click', () => {
                this.selectAnswer(index);
            });

            optionsContainer.appendChild(optionDiv);
        });

        // Update other UI elements
        this.updateNavigationButtons();
        this.updateMarkButton();
        this.updateAllProgressBars();
    }

    // ===== ANSWER SELECTION SYSTEM =====
    selectAnswer(optionIndex) {
        console.log(`✅ Answer selected: Q${this.currentQuestionIndex + 1} -> Option ${optionIndex + 1}`);
        
        this.userAnswers[this.currentQuestionIndex] = optionIndex;
        this.questionStates[this.currentQuestionIndex] = 'answered';

        // Update radio button
        const radio = document.getElementById(`option-${optionIndex}`);
        if (radio) {
            radio.checked = true;
        }

        // Update option styling
        document.querySelectorAll('.option-item').forEach((item, index) => {
            item.classList.remove('selected');
            if (index === optionIndex) {
                item.classList.add('selected');
            }
        });

        // Update UI
        this.updateQuestionPalette();
        this.updatePaletteStats();
        this.updateAllProgressBars();

        // Auto-advance after selection (optional - can be disabled)
        setTimeout(() => {
            if (this.currentQuestionIndex < this.currentQuiz.totalQuestions - 1) {
                // this.nextQuestion(); // Uncomment to auto-advance
            }
        }, 800);
    }

    // ===== QUESTION PALETTE SYSTEM =====
    generateQuestionPalette() {
        const paletteGrid = document.getElementById('palette-grid');
        paletteGrid.innerHTML = '';

        this.currentQuiz.questions.forEach((_, index) => {
            const questionBtn = document.createElement('button');
            questionBtn.className = `question-number ${this.questionStates[index]}`;
            questionBtn.textContent = index + 1;
            questionBtn.title = `Question ${index + 1}`;
            questionBtn.addEventListener('click', () => this.goToQuestion(index));
            paletteGrid.appendChild(questionBtn);
        });

        this.updatePaletteStats();
    }

    updateQuestionPalette() {
        const paletteButtons = document.querySelectorAll('.question-number');
        paletteButtons.forEach((btn, index) => {
            btn.className = `question-number ${this.questionStates[index]}`;
        });
    }

    updatePaletteStats() {
        const answered = Object.keys(this.userAnswers).length;
        const marked = this.markedQuestions.size;
        const total = this.currentQuiz.totalQuestions;
        const remaining = total - answered;

        document.getElementById('answered-count').textContent = answered;
        document.getElementById('marked-count').textContent = marked;
        document.getElementById('remaining-count').textContent = remaining;
    }

    setupQuestionPaletteToggle() {
        const toggleBtn = document.getElementById('palette-toggle');
        const palette = document.getElementById('question-palette');
        const toggleIcon = document.getElementById('toggle-icon');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => {
                this.isPaletteExpanded = !this.isPaletteExpanded;
                
                if (this.isPaletteExpanded) {
                    palette.classList.remove('collapsed');
                    palette.classList.add('expanded');
                    toggleIcon.style.transform = 'rotate(90deg)';
                } else {
                    palette.classList.remove('expanded');
                    palette.classList.add('collapsed');
                    toggleIcon.style.transform = 'rotate(0deg)';
                }
            });
        }
    }

    // ===== NAVIGATION SYSTEM =====
    goToQuestion(questionIndex) {
        if (questionIndex >= 0 && questionIndex < this.currentQuiz.totalQuestions) {
            // Update previous question state
            if (this.questionStates[this.currentQuestionIndex] === 'current') {
                if (this.userAnswers.hasOwnProperty(this.currentQuestionIndex)) {
                    this.questionStates[this.currentQuestionIndex] = 'answered';
                } else if (this.markedQuestions.has(this.currentQuestionIndex)) {
                    this.questionStates[this.currentQuestionIndex] = 'marked';
                } else {
                    this.questionStates[this.currentQuestionIndex] = 'not-visited';
                }
            }

            // Update to new question
            this.currentQuestionIndex = questionIndex;
            
            // Set current question state
            if (this.userAnswers.hasOwnProperty(this.currentQuestionIndex)) {
                this.questionStates[this.currentQuestionIndex] = 'answered';
            } else if (this.markedQuestions.has(this.currentQuestionIndex)) {
                this.questionStates[this.currentQuestionIndex] = 'marked';
            } else {
                this.questionStates[this.currentQuestionIndex] = 'current';
            }

            this.displayCurrentQuestion();
            this.updateQuestionPalette();
            
            console.log(`📍 Navigated to Question ${questionIndex + 1}`);
        }
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.goToQuestion(this.currentQuestionIndex - 1);
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.currentQuiz.totalQuestions - 1) {
            this.goToQuestion(this.currentQuestionIndex + 1);
        } else {
            // Last question - show submit confirmation
            this.showSubmitModal();
        }
    }

    // ===== QUESTION ACTIONS =====
    toggleMarkForReview() {
        const markBtn = document.getElementById('btn-mark');
        
        if (this.markedQuestions.has(this.currentQuestionIndex)) {
            this.markedQuestions.delete(this.currentQuestionIndex);
            markBtn.classList.remove('active');
            markBtn.innerHTML = '<i class="fas fa-bookmark"></i> Mark for Review';
            
            // Update state
            if (this.userAnswers.hasOwnProperty(this.currentQuestionIndex)) {
                this.questionStates[this.currentQuestionIndex] = 'answered';
            } else {
                this.questionStates[this.currentQuestionIndex] = 'current';
            }
            
            this.showToast('📌 Question unmarked', 'info');
        } else {
            this.markedQuestions.add(this.currentQuestionIndex);
            markBtn.classList.add('active');
            markBtn.innerHTML = '<i class="fas fa-bookmark"></i> Marked for Review';
            this.questionStates[this.currentQuestionIndex] = 'marked';
            
            this.showToast('📌 Question marked for review', 'success');
        }

        this.updateQuestionPalette();
        this.updatePaletteStats();
    }

    clearResponse() {
        if (this.userAnswers.hasOwnProperty(this.currentQuestionIndex)) {
            delete this.userAnswers[this.currentQuestionIndex];

            // Update question state
            if (this.markedQuestions.has(this.currentQuestionIndex)) {
                this.questionStates[this.currentQuestionIndex] = 'marked';
            } else {
                this.questionStates[this.currentQuestionIndex] = 'current';
            }

            // Clear radio buttons and styling
            document.querySelectorAll(`input[name="question-${this.currentQuiz.questions[this.currentQuestionIndex].id || this.currentQuestionIndex}"]`)
                .forEach(radio => radio.checked = false);

            document.querySelectorAll('.option-item').forEach(item => {
                item.classList.remove('selected');
            });

            this.updateQuestionPalette();
            this.updatePaletteStats();
            this.updateAllProgressBars();
            
            this.showToast('🗑️ Response cleared', 'info');
        }
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('btn-previous');
        const nextBtn = document.getElementById('btn-next');

        prevBtn.disabled = this.currentQuestionIndex === 0;

        if (this.currentQuestionIndex === this.currentQuiz.totalQuestions - 1) {
            nextBtn.innerHTML = '<i class="fas fa-flag-checkered"></i> Finish Quiz';
            nextBtn.classList.add('finish-btn');
        } else {
            nextBtn.innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
            nextBtn.classList.remove('finish-btn');
        }
    }

    updateMarkButton() {
        const markBtn = document.getElementById('btn-mark');
        
        if (this.markedQuestions.has(this.currentQuestionIndex)) {
            markBtn.classList.add('active');
            markBtn.innerHTML = '<i class="fas fa-bookmark"></i> Marked for Review';
        } else {
            markBtn.classList.remove('active');
            markBtn.innerHTML = '<i class="fas fa-bookmark"></i> Mark for Review';
        }
    }

    // ===== PROGRESS TRACKING =====
    updateAllProgressBars() {
        const answered = Object.keys(this.userAnswers).length;
        const total = this.currentQuiz.totalQuestions;
        const percentage = (answered / total) * 100;

        // Update main progress bar
        document.getElementById('progress-fill').style.width = `${percentage}%`;
        
        // Update progress text
        document.getElementById('progress-answered').textContent = answered;
        document.getElementById('progress-marked').textContent = this.markedQuestions.size;
        document.getElementById('progress-remaining').textContent = total - answered;
    }

    // ===== QUIZ SUBMISSION SYSTEM =====
    showSubmitModal() {
        const modal = document.getElementById('submit-modal');
        const answered = Object.keys(this.userAnswers).length;
        const notAnswered = this.currentQuiz.totalQuestions - answered;
        const marked = this.markedQuestions.size;

        document.getElementById('submit-answered').textContent = answered;
        document.getElementById('submit-not-answered').textContent = notAnswered;
        document.getElementById('submit-marked').textContent = marked;

        modal.classList.add('show');
    }

    hideSubmitModal() {
        document.getElementById('submit-modal').classList.remove('show');
    }

    async submitQuiz() {
        console.log('📤 Submitting quiz to Firebase...');
        
        this.hideSubmitModal();
        this.showLoading(true, 'Submitting your quiz responses...');

        // Stop timer
        if (this.timer) {
            clearInterval(this.timer);
        }

        try {
            // Calculate results
            const results = this.calculateResults();
            console.log('📊 Quiz results calculated:', results);

            // Save to Firebase
            await this.saveQuizResultsToFirebase(results);
            
            console.log('✅ Quiz results saved to Firebase');
            
            // Show success and redirect to results
            setTimeout(() => {
                this.showInterstitialAd(() => {
                    const resultsUrl = `../pages/results.html?quizId=${results.quizId}&resultId=${results.resultId}&score=${results.score}&total=${results.total}&percentage=${results.percentage}`;
                    window.location.href = resultsUrl;
                });
            }, 1000);

        } catch (error) {
            console.error('❌ Error submitting quiz:', error);
            this.showLoading(false);
            alert('❌ Error submitting quiz.\n\nPlease check your connection and try again.');
        }
    }

    autoSubmitQuiz() {
        this.showToast('⏰ Time\'s up! Submitting quiz automatically...', 'warning');
        setTimeout(() => {
            this.submitQuiz();
        }, 3000);
    }

    // ===== FIREBASE RESULTS SAVING =====
    calculateResults() {
        let correctAnswers = 0;
        const totalQuestions = this.currentQuiz.totalQuestions;
        const detailedResults = {};

        this.currentQuiz.questions.forEach((question, index) => {
            const userAnswer = this.userAnswers[index];
            const correctAnswer = question.correctAnswer;
            const isCorrect = userAnswer === correctAnswer;
            
            if (isCorrect) {
                correctAnswers++;
            }

            detailedResults[index] = {
                questionId: question.id || index,
                questionText: question.text || question.question,
                userAnswer: userAnswer,
                correctAnswer: correctAnswer,
                isCorrect: isCorrect,
                isMarked: this.markedQuestions.has(index),
                category: question.category || 'general'
            };
        });

        const percentage = Math.round((correctAnswers / totalQuestions) * 100);
        const timeTaken = this.currentQuiz.duration * 60 - this.timeRemaining;

        return {
            quizId: this.currentQuiz.id,
            quizTitle: this.currentQuiz.title,
            quizCategory: this.currentQuiz.category,
            userId: this.currentUser.uid,
            userEmail: this.currentUser.email,
            userName: this.currentUser.displayName || this.userFirstName,
            userFirstName: this.userFirstName,
            score: correctAnswers,
            total: totalQuestions,
            percentage: percentage,
            timeTaken: timeTaken, // in seconds
            timeLimit: this.currentQuiz.duration * 60,
            answers: this.userAnswers,
            detailedResults: detailedResults,
            markedQuestions: Array.from(this.markedQuestions),
            selectedQuote: this.selectedQuote,
            startTime: this.quizStartTime,
            endTime: new Date(),
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            resultId: null // Will be set after saving
        };
    }

    async saveQuizResultsToFirebase(results) {
        try {
            // Save quiz result to 'quizResults' collection
            console.log('💾 Saving quiz results to Firebase...');
            
            const resultDoc = await firebase.firestore()
                .collection('quizResults')
                .add(results);

            results.resultId = resultDoc.id;
            console.log('✅ Quiz result saved with ID:', resultDoc.id);

            // Update user statistics
            const userRef = firebase.firestore()
                .collection('users')
                .doc(this.currentUser.uid);

            await userRef.set({
                uid: this.currentUser.uid,
                email: this.currentUser.email,
                displayName: this.currentUser.displayName || this.userFirstName,
                firstName: this.userFirstName,
                quizzesTaken: firebase.firestore.FieldValue.increment(1),
                totalScore: firebase.firestore.FieldValue.increment(results.score),
                totalQuestions: firebase.firestore.FieldValue.increment(results.total),
                lastQuizDate: firebase.firestore.FieldValue.serverTimestamp(),
                lastQuizId: this.currentQuiz.id,
                lastQuizTitle: this.currentQuiz.title,
                bestScore: results.percentage, // This would need more logic in a real app
                averageScore: results.percentage, // This would need calculation
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            console.log('✅ User statistics updated');

            // Save to leaderboard entry
            await firebase.firestore()
                .collection('leaderboard')
                .doc(this.currentUser.uid + '_' + this.currentQuiz.id)
                .set({
                    userId: this.currentUser.uid,
                    userName: this.currentUser.displayName || this.userFirstName,
                    firstName: this.userFirstName,
                    email: this.currentUser.email,
                    quizId: this.currentQuiz.id,
                    quizTitle: this.currentQuiz.title,
                    score: results.score,
                    total: results.total,
                    percentage: results.percentage,
                    timeTaken: results.timeTaken,
                    timestamp: firebase.firestore.FieldValue.serverTimestamp()
                });

            console.log('✅ Leaderboard entry created');

        } catch (error) {
            console.error('❌ Error saving to Firebase:', error);
            throw error;
        }
    }

    // ===== MOTIVATIONAL QUOTES =====
    selectMotivationalQuote() {
        if (!this.selectedQuote) {
            const quotes = this.getMotivationalQuotes();
            this.selectedQuote = quotes[Math.floor(Math.random() * quotes.length)];
        }
        this.displaySelectedMotivationalQuote();
    }

    getMotivationalQuotes() {
        return [
            { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Anonymous" },
            { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
            { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
            { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
            { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
            { text: "The expert in anything was once a beginner.", author: "Anonymous" },
            { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
            { text: "Knowledge is power, but enthusiasm pulls the switch.", author: "Ivern Ball" },
            { text: "The beautiful thing about learning is nobody can take it away from you.", author: "B.B. King" },
            { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
            { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
            { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
            { text: "In learning you will teach, and in teaching you will learn.", author: "Phil Collins" },
            { text: "Your education is a gift that no one can take away from you.", author: "Anonymous" },
            { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
            { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
            { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
            { text: "Dream bigger. Do bigger.", author: "Anonymous" },
            { text: "Champions keep playing until they get it right.", author: "Billie Jean King" },
            { text: "Success is liking yourself, liking what you do, and liking how you do it.", author: "Maya Angelou" }
        ];
    }

    displaySelectedMotivationalQuote() {
        if (this.selectedQuote) {
            document.getElementById('motivation-text').textContent = this.selectedQuote.text;
            document.getElementById('motivation-author').textContent = `- ${this.selectedQuote.author}`;
        }
    }

    // ===== UI HELPER FUNCTIONS =====
    setupEventListeners() {
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft' && this.currentQuestionIndex > 0) {
                this.previousQuestion();
            } else if (e.key === 'ArrowRight' && this.currentQuestionIndex < this.currentQuiz.totalQuestions - 1) {
                this.nextQuestion();
            } else if (e.key >= '1' && e.key <= '4') {
                const optionIndex = parseInt(e.key) - 1;
                this.selectAnswer(optionIndex);
            } else if (e.key === 'M' || e.key === 'm') {
                this.toggleMarkForReview();
            } else if (e.key === 'C' || e.key === 'c') {
                this.clearResponse();
            }
        });

        // Prevent accidental page close
        window.addEventListener('beforeunload', (e) => {
            if (this.timer) {
                e.preventDefault();
                e.returnValue = 'Your quiz progress will be lost. Are you sure you want to leave?';
            }
        });
    }

    showLoading(show, text = 'Loading...') {
        const overlay = document.getElementById('loading-overlay');
        const loadingText = document.getElementById('loading-text');
        
        if (show) {
            loadingText.textContent = text;
            overlay.classList.add('show');
        } else {
            overlay.classList.remove('show');
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        toast.innerHTML = `
            <i class="${icons[type]}"></i>
            <span>${message}</span>
        `;
        
        container.appendChild(toast);
        
        // Show toast
        setTimeout(() => toast.classList.add('show'), 100);
        
        // Auto remove
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => container.removeChild(toast), 300);
        }, 3000);
    }

    showInterstitialAd(callback) {
        const adOverlay = document.createElement('div');
        adOverlay.className = 'interstitial-ad';
        adOverlay.innerHTML = `
            <div class="ad-content">
                <div class="ad-header">
                    <i class="fas fa-trophy"></i>
                    <h2>Quiz Completed!</h2>
                    <p>Loading your results...</p>
                </div>
                <div class="ad-placeholder">
                    <i class="fas fa-ad"></i>
                    <p>Advertisement</p>
                    <div class="ad-timer">Results in <span id="ad-countdown">5</span>s</div>
                </div>
            </div>
        `;
        
        document.body.appendChild(adOverlay);
        
        // Countdown and auto-redirect
        let countdown = 5;
        const timer = setInterval(() => {
            countdown--;
            const countdownEl = document.getElementById('ad-countdown');
            if (countdownEl) {
                countdownEl.textContent = countdown;
            }
            
            if (countdown <= 0) {
                clearInterval(timer);
                document.body.removeChild(adOverlay);
                callback();
            }
        }, 1000);
    }
}

// ===== GLOBAL FUNCTIONS =====
function hideMotivation() {
    const card = document.getElementById('motivation-card');
    card.style.display = 'none';
}

// ===== INITIALIZE QUIZ MANAGER =====
let quizManager;

// Wait for DOM and Firebase
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        quizManager = new QuizManager();
    });
} else {
    quizManager = new QuizManager();
}

console.log('🎉 Real Firebase Quiz System loaded successfully!');
