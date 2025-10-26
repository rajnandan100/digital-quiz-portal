// ===== UPDATED QUIZ SYSTEM WITH ALL REQUESTED FEATURES =====

class QuizManager {
    constructor() {
        this.currentUser = null;
        this.currentQuiz = null;
        this.currentQuestionIndex = 0;
        this.userAnswers = {};
        this.markedQuestions = new Set();
        this.questionStates = {}; // 'not-visited', 'current', 'answered', 'marked'
        this.timer = null;
        this.timeRemaining = 0;
        this.quizStartTime = null;
        this.selectedQuote = null; // Store selected quote for entire quiz
        this.userFirstName = '';
        this.isPaletteExpanded = false; // Question palette starts minimized
        this.quizId = null;
        this.init();
    }

    init() {
        // Wait for Firebase and DOM to be ready
        if (typeof firebase !== 'undefined' && document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setup());
        } else if (typeof firebase !== 'undefined') {
            this.setup();
        } else {
            setTimeout(() => this.init(), 100);
        }
    }

    setup() {
        // Check authentication
        firebase.auth().onAuthStateChanged((user) => {
            this.currentUser = user;
            if (user) {
                this.extractUserFirstName(user);
                this.updateUserUI(user);
                this.loadQuizFromURL();
            } else {
                // Redirect to home if not authenticated
                window.location.href = '../index.html';
            }
        });

        // Setup event listeners
        this.setupEventListeners();
        this.setupQuestionPaletteToggle();
        this.selectMotivationalQuote(); // Select one quote for entire quiz
    }

    // Extract first name from user data
    extractUserFirstName(user) {
        if (user.displayName) {
            // Extract first name from full name
            this.userFirstName = user.displayName.split(' ')[0];
        } else if (user.email) {
            // Extract name from email (before @)
            const emailName = user.email.split('@')[0];
            this.userFirstName = emailName.charAt(0).toUpperCase() + emailName.slice(1);
        } else {
            this.userFirstName = 'Champion';
        }
    }

    // Update user UI elements
    updateUserUI(user) {
        const userAvatar = document.getElementById('user-avatar-quiz');
        if (userAvatar) {
            if (user.photoURL) {
                userAvatar.src = user.photoURL;
            } else {
                const displayName = user.displayName || user.email.split('@')[0];
                userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4F46E5&color=fff&size=40`;
            }
        }
    }

    // 100 Motivational Quotes Array
    getMotivationalQuotes() {
        return [
            { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Anonymous" },
            { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
            { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" },
            { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
            { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
            { text: "Success is not the key to happiness. Happiness is the key to success.", author: "Albert Schweitzer" },
            { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
            { text: "In the middle of difficulty lies opportunity.", author: "Albert Einstein" },
            { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
            { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
            { text: "Your limitation—it's only your imagination.", author: "Anonymous" },
            { text: "Push yourself, because no one else is going to do it for you.", author: "Anonymous" },
            { text: "Great things never come from comfort zones.", author: "Anonymous" },
            { text: "Dream it. Wish it. Do it.", author: "Anonymous" },
            { text: "Success doesn't just find you. You have to go out and get it.", author: "Anonymous" },
            { text: "The harder you work, the luckier you get.", author: "Gary Player" },
            { text: "Don't stop when you're tired. Stop when you're done.", author: "Anonymous" },
            { text: "Wake up with determination. Go to bed with satisfaction.", author: "Anonymous" },
            { text: "Do something today that your future self will thank you for.", author: "Sean Patrick Flanery" },
            { text: "Little things make big days.", author: "Anonymous" },
            { text: "It's going to be hard, but hard does not mean impossible.", author: "Anonymous" },
            { text: "Don't wait for opportunity. Create it.", author: "Anonymous" },
            { text: "Sometimes we're tested not to show our weaknesses, but to discover our strengths.", author: "Anonymous" },
            { text: "The key to success is to focus on goals, not obstacles.", author: "Anonymous" },
            { text: "Dream bigger. Do bigger.", author: "Anonymous" },
            { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
            { text: "The expert in anything was once a beginner.", author: "Anonymous" },
            { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
            { text: "You learn more from failure than from success. Don't let it stop you.", author: "Anonymous" },
            { text: "Knowledge is power, but enthusiasm pulls the switch.", author: "Ivern Ball" },
            { text: "The beautiful thing about learning is nobody can take it away from you.", author: "B.B. King" },
            { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
            { text: "The more you learn, the more you earn.", author: "Frank Clark" },
            { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
            { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
            { text: "In learning you will teach, and in teaching you will learn.", author: "Phil Collins" },
            { text: "I am always doing that which I cannot do, in order that I may learn how to do it.", author: "Pablo Picasso" },
            { text: "Your education is a gift that no one can take away from you.", author: "Anonymous" },
            { text: "Knowing is not enough; we must apply. Wishing is not enough; we must do.", author: "Johann Wolfgang von Goethe" },
            { text: "The difference between ordinary and extraordinary is that little extra.", author: "Jimmy Johnson" },
            { text: "Champions keep playing until they get it right.", author: "Billie Jean King" },
            { text: "What lies behind you and what lies in front of you, pales in comparison to what lies inside of you.", author: "Ralph Waldo Emerson" },
            { text: "Success is liking yourself, liking what you do, and liking how you do it.", author: "Maya Angelou" },
            { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein" },
            { text: "The person who says it cannot be done should not interrupt the person who is doing it.", author: "Chinese Proverb" },
            { text: "It is never too late to be what you might have been.", author: "George Eliot" },
            { text: "You become what you believe.", author: "Oprah Winfrey" },
            { text: "Build your own dreams, or someone else will hire you to build theirs.", author: "Farrah Gray" },
            { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
            { text: "Challenges are what make life interesting and overcoming them is what makes life meaningful.", author: "Joshua J. Marine" },
            { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" }
        ];
    }

    // Select one motivational quote for the entire quiz session
    selectMotivationalQuote() {
        if (!this.selectedQuote) {
            const quotes = this.getMotivationalQuotes();
            this.selectedQuote = quotes[Math.floor(Math.random() * quotes.length)];
        }
        this.displaySelectedMotivationalQuote();
    }

    // Display the selected motivational quote
    displaySelectedMotivationalQuote() {
        if (this.selectedQuote) {
            document.getElementById('motivational-text').textContent = `"${this.selectedQuote.text}"`;
            document.getElementById('quote-author').textContent = `- ${this.selectedQuote.author}`;
        }
    }

    // Load quiz from Firestore using URL parameter
    async loadQuizFromURL() {
        try {
            const urlParams = new URLSearchParams(window.location.search);
            this.quizId = urlParams.get('id');

            if (!this.quizId) {
                this.showToast('No quiz ID provided', 'error');
                setTimeout(() => {
                    window.location.href = '../index.html';
                }, 2000);
                return;
            }

            this.showLoading(true);

            // Load quiz from Firestore
            const quizDoc = await firebase.firestore()
                .collection('quizzes')
                .doc(this.quizId)
                .get();

            if (!quizDoc.exists) {
                throw new Error('Quiz not found');
            }

            this.currentQuiz = {
                id: quizDoc.id,
                ...quizDoc.data()
            };

            // Check if quiz is active
            if (this.currentQuiz.status !== 'active') {
                throw new Error('Quiz is not available');
            }

            this.initializeQuiz();
            this.showLoading(false);

        } catch (error) {
            console.error('Error loading quiz:', error);
            this.showLoading(false);
            this.showToast('Failed to load quiz: ' + error.message, 'error');
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 3000);
        }
    }

    initializeQuiz() {
        // Initialize quiz data
        this.timeRemaining = this.currentQuiz.timeLimit * 60; // Convert to seconds
        this.quizStartTime = new Date();
        this.currentQuestionIndex = 0;
        this.userAnswers = {};
        this.markedQuestions = new Set();
        this.questionStates = {};

        // Initialize question states - all start as not-visited except first one
        this.currentQuiz.questions.forEach((_, index) => {
            this.questionStates[index] = index === 0 ? 'current' : 'not-visited';
        });

        // Update UI
        this.updateQuizHeader();
        this.generateQuestionPalette();
        this.displayCurrentQuestion();
        this.startTimer();
        this.updateAllProgressBars();
        this.showPersonalizedGreeting();
    }

    // Setup Question Palette Toggle
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
                    toggleBtn.classList.add('expanded');
                    toggleIcon.style.transform = 'rotate(90deg)';
                } else {
                    palette.classList.remove('expanded');
                    palette.classList.add('collapsed');
                    toggleBtn.classList.remove('expanded');
                    toggleIcon.style.transform = 'rotate(0deg)';
                }
            });
        }
    }

    updateQuizHeader() {
        document.getElementById('quiz-title').textContent = this.currentQuiz.title;
        document.getElementById('total-questions').textContent = this.currentQuiz.questions.length;
        this.updateTimer();
    }

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
    }

    generateQuestionPalette() {
        const paletteGrid = document.getElementById('palette-grid');
        paletteGrid.innerHTML = '';

        this.currentQuiz.questions.forEach((_, index) => {
            const questionBtn = document.createElement('button');
            questionBtn.className = `question-number ${this.questionStates[index]}`;
            questionBtn.textContent = index + 1;
            questionBtn.addEventListener('click', () => this.goToQuestion(index));
            paletteGrid.appendChild(questionBtn);
        });

        this.updatePaletteStats();
    }

    updatePaletteStats() {
        const answered = Object.keys(this.userAnswers).length;
        const marked = this.markedQuestions.size;
        const visited = new Set([
            ...Object.keys(this.userAnswers).map(Number),
            ...Array.from(this.markedQuestions),
            this.currentQuestionIndex
        ]).size;
        const notVisited = this.currentQuiz.questions.length - visited;

        document.getElementById('answered-count').textContent = answered;
        document.getElementById('marked-count').textContent = marked;
        document.getElementById('remaining-count').textContent = Math.max(0, notVisited);
    }

    displayCurrentQuestion() {
        const question = this.currentQuiz.questions[this.currentQuestionIndex];

        // Update question info
        document.getElementById('current-question-number').textContent = this.currentQuestionIndex + 1;
        document.getElementById('question-text').textContent = question.question;

        // Create options with click-anywhere functionality
        const optionsContainer = document.getElementById('options-container');
        optionsContainer.innerHTML = '';

        question.options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'option-item';
            
            const isSelected = this.userAnswers[this.currentQuestionIndex] === index;
            if (isSelected) {
                optionDiv.classList.add('selected');
            }

            optionDiv.innerHTML = `
                <input type="radio" class="option-input" name="question-${question.id || this.currentQuestionIndex}" 
                       id="option-${index}" value="${index}" ${isSelected ? 'checked' : ''}>
                <label for="option-${index}" class="option-text">${option}</label>
            `;

            // Add click event to entire option div
            optionDiv.addEventListener('click', () => {
                this.selectAnswer(index);
            });

            optionsContainer.appendChild(optionDiv);
        });

        // Update navigation buttons
        this.updateNavigationButtons();

        // Update mark button state
        const markBtn = document.getElementById('btn-mark');
        if (this.markedQuestions.has(this.currentQuestionIndex)) {
            markBtn.classList.add('active');
            markBtn.innerHTML = '<i class="fas fa-flag"></i> Marked for Review';
        } else {
            markBtn.classList.remove('active');
            markBtn.innerHTML = '<i class="fas fa-flag"></i> Mark for Review';
        }

        this.updateAllProgressBars();
    }

    selectAnswer(optionIndex) {
        this.userAnswers[this.currentQuestionIndex] = optionIndex;
        this.questionStates[this.currentQuestionIndex] = 'answered';

        // Update radio button
        const radio = document.getElementById(`option-${optionIndex}`);
        if (radio) {
            radio.checked = true;
        }

        // Update option styling - Green for selected
        document.querySelectorAll('.option-item').forEach(item => {
            item.classList.remove('selected');
        });
        document.querySelectorAll('.option-item')[optionIndex].classList.add('selected');

        // Update palette
        this.updateQuestionPalette();
        this.updatePaletteStats();
        this.updateAllProgressBars();
    }

    updateQuestionPalette() {
        const paletteButtons = document.querySelectorAll('.question-number');
        paletteButtons.forEach((btn, index) => {
            btn.className = `question-number ${this.questionStates[index]}`;
        });
    }

    updateNavigationButtons() {
        const prevBtn = document.getElementById('btn-previous');
        const nextBtn = document.getElementById('btn-next');
        
        prevBtn.disabled = this.currentQuestionIndex === 0;
        
        if (this.currentQuestionIndex === this.currentQuiz.questions.length - 1) {
            nextBtn.innerHTML = '<i class="fas fa-flag-checkered"></i> Finish';
        } else {
            nextBtn.innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
        }
    }

    goToQuestion(questionIndex) {
        if (questionIndex >= 0 && questionIndex < this.currentQuiz.questions.length) {
            // Update previous question state
            if (this.questionStates[this.currentQuestionIndex] === 'current' && 
                !this.userAnswers.hasOwnProperty(this.currentQuestionIndex) && 
                !this.markedQuestions.has(this.currentQuestionIndex)) {
                this.questionStates[this.currentQuestionIndex] = 'not-visited';
            } else if (this.questionStates[this.currentQuestionIndex] === 'current' && 
                       this.userAnswers.hasOwnProperty(this.currentQuestionIndex)) {
                this.questionStates[this.currentQuestionIndex] = 'answered';
            } else if (this.questionStates[this.currentQuestionIndex] === 'current' && 
                       this.markedQuestions.has(this.currentQuestionIndex)) {
                this.questionStates[this.currentQuestionIndex] = 'marked';
            }

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
        }
    }

    previousQuestion() {
        if (this.currentQuestionIndex > 0) {
            this.goToQuestion(this.currentQuestionIndex - 1);
        }
    }

    nextQuestion() {
        if (this.currentQuestionIndex < this.currentQuiz.questions.length - 1) {
            this.goToQuestion(this.currentQuestionIndex + 1);
        } else {
            // Last question - show submit confirmation
            this.showSubmitModal();
        }
    }

    toggleMarkForReview() {
        const markBtn = document.getElementById('btn-mark');
        
        if (this.markedQuestions.has(this.currentQuestionIndex)) {
            this.markedQuestions.delete(this.currentQuestionIndex);
            markBtn.classList.remove('active');
            markBtn.innerHTML = '<i class="fas fa-flag"></i> Mark for Review';
            
            // Update state
            if (this.userAnswers.hasOwnProperty(this.currentQuestionIndex)) {
                this.questionStates[this.currentQuestionIndex] = 'answered';
            } else {
                this.questionStates[this.currentQuestionIndex] = 'current';
            }
        } else {
            this.markedQuestions.add(this.currentQuestionIndex);
            markBtn.classList.add('active');
            markBtn.innerHTML = '<i class="fas fa-flag"></i> Marked for Review';
            this.questionStates[this.currentQuestionIndex] = 'marked';
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

            // Clear radio buttons
            document.querySelectorAll(`input[name="question-${this.currentQuiz.questions[this.currentQuestionIndex].id || this.currentQuestionIndex}"]`)
                .forEach(radio => radio.checked = false);

            // Remove selection styling
            document.querySelectorAll('.option-item').forEach(item => {
                item.classList.remove('selected');
            });

            this.updateQuestionPalette();
            this.updatePaletteStats();
            this.updateAllProgressBars();
        }
    }

    showSubmitModal() {
        const modal = document.getElementById('submit-modal');
        const answered = Object.keys(this.userAnswers).length;
        const notAnswered = this.currentQuiz.questions.length - answered;
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
        this.hideSubmitModal();
        this.showLoading(true);

        // Stop timer
        if (this.timer) {
            clearInterval(this.timer);
        }

        // Calculate results
        const results = this.calculateResults();

        try {
            // Save to Firebase
            await this.saveQuizResults(results);

            // Show interstitial ad (simulation)
            setTimeout(() => {
                this.showInterstitialAd(() => {
                    // Redirect to results page
                    const params = new URLSearchParams({
                        quizId: this.quizId,
                        resultId: results.resultId || '',
                        score: results.score,
                        total: results.total,
                        percentage: results.percentage
                    });
                    window.location.href = `../pages/results.html?${params.toString()}`;
                });
            }, 1000);

        } catch (error) {
            console.error('Error submitting quiz:', error);
            this.showLoading(false);
            this.showToast('Error submitting quiz. Please try again.', 'error');
        }
    }

    autoSubmitQuiz() {
        this.showToast('Time\'s up! Submitting quiz automatically...', 'warning');
        setTimeout(() => {
            this.submitQuiz();
        }, 3000);
    }

    // FIXED: Calculate results with proper answer format
    calculateResults() {
        let correctAnswers = 0;
        const totalQuestions = this.currentQuiz.questions.length;
        
        // Create detailed answer analysis
        const detailedAnswers = [];
        
        this.currentQuiz.questions.forEach((question, index) => {
            const userAnswer = this.userAnswers[index];
            const isCorrect = userAnswer === question.correctAnswer;
            
            if (isCorrect) {
                correctAnswers++;
            }
            
            // Store detailed answer data for results page
            detailedAnswers.push({
                questionIndex: index,
                selectedOption: userAnswer !== undefined ? userAnswer : null,
                correctAnswer: question.correctAnswer,
                isCorrect: isCorrect,
                isSkipped: userAnswer === undefined
            });
        });

        const percentage = Math.round((correctAnswers / totalQuestions) * 100);

        return {
            quizId: this.quizId,
            quizTitle: this.currentQuiz.title,
            userId: this.currentUser.uid,
            userEmail: this.currentUser.email,
            userName: this.currentUser.displayName || this.currentUser.email.split('@')[0],
            userFirstName: this.userFirstName,
            score: correctAnswers,
            total: totalQuestions,
            percentage: percentage,
           timeTaken: Math.max(0, (this.currentQuiz?.timeLimit || 30) * 60 - this.timeRemaining),

            
            // FIXED: Proper answer format for results analysis
            answers: detailedAnswers,
            
            // Keep simple format for compatibility
            userAnswers: this.userAnswers,
            
            markedQuestions: Array.from(this.markedQuestions),
        selectedQuote: this.selectedQuote || { text: "Great job!", author: "DigiQuiz" },
category: this.currentQuiz?.category || 'general-knowledge',
            completedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
    }

    // FIXED: Save quiz results with proper data structure
    async saveQuizResults(results) {
        try {
            console.log('Saving quiz results:', results);
            
            // Save quiz result to Firebase
            const resultRef = await firebase.firestore()
                .collection('quizResults')
                .add(results);

            console.log('Results saved with ID:', resultRef.id);

            // Save to leaderboard
            await firebase.firestore()
                .collection('leaderboard')
                .add({
                    ...results,
                    resultId: resultRef.id
                });

            // Update user stats
            const userRef = firebase.firestore()
                .collection('users')
                .doc(this.currentUser.uid);

            await userRef.set({
                email: this.currentUser.email,
                displayName: this.currentUser.displayName || this.currentUser.email.split('@')[0],
                quizzesTaken: firebase.firestore.FieldValue.increment(1),
                totalScore: firebase.firestore.FieldValue.increment(results.score),
                totalCorrectAnswers: firebase.firestore.FieldValue.increment(results.score),
                totalQuestionsAttempted: firebase.firestore.FieldValue.increment(results.total),
                lastQuizDate: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });

            console.log('User stats updated successfully');

            // Store result ID for redirect
            results.resultId = resultRef.id;

        } catch (error) {
            console.error('Error saving quiz results:', error);
            throw error;
        }
    }

    showInterstitialAd(callback) {
        // Create interstitial ad overlay
        const adOverlay = document.createElement('div');
        adOverlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            z-index: 10002;
            color: white;
            text-align: center;
        `;

        adOverlay.innerHTML = `
            <div style="max-width: 400px; padding: 40px;">
                <h2 style="margin-bottom: 20px;">🎉 Quiz Completed!</h2>
                <p style="margin-bottom: 30px; font-size: 1.1rem;">
                    You've completed the quiz! Loading your results...
                </p>
                <div style="background: rgba(0,0,0,0.2); padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                    <p style="margin: 0; font-size: 0.9rem; opacity: 0.8;">Advertisement • Support our platform</p>
                </div>
                <div class="spinner" style="margin: 20px 0;">
                    <i class="fas fa-spinner fa-spin" style="font-size: 2rem;"></i>
                </div>
                <p style="font-size: 0.9rem; opacity: 0.7;">Redirecting to results...</p>
            </div>
        `;

        document.body.appendChild(adOverlay);

        // Remove ad and execute callback after 3 seconds
        setTimeout(() => {
            document.body.removeChild(adOverlay);
            callback();
        }, 3000);
    }

    // Progress bar updates
    updateAllProgressBars() {
        const answered = Object.keys(this.userAnswers).length;
        const total = this.currentQuiz ? this.currentQuiz.questions.length : 1;
        const percentage = Math.round((answered / total) * 100);

        // Main progress bar
        const progressFill = document.getElementById('progress-fill');
        const progressPercentage = document.getElementById('progress-percentage');
        
        if (progressFill) {
            progressFill.style.width = percentage + '%';
        }
        if (progressPercentage) {
            progressPercentage.textContent = percentage + '%';
        }

        // Motivation progress bar
        const motivationProgress = document.getElementById('motivation-progress');
        if (motivationProgress) {
            motivationProgress.style.width = percentage + '%';
        }

        this.updateMotivationText(percentage);
    }

    updateMotivationText(percentage) {
        const motivationText = document.getElementById('motivation-text');
        if (!motivationText) return;

        if (percentage === 0) {
            motivationText.textContent = "Let's get started! 🚀";
        } else if (percentage <= 25) {
            motivationText.textContent = "Great start! Keep going! 💪";
        } else if (percentage <= 50) {
            motivationText.textContent = "You're halfway there! 🔥";
        } else if (percentage <= 75) {
            motivationText.textContent = "Excellent progress! 🌟";
        } else if (percentage < 100) {
            motivationText.textContent = "Almost done! Push forward! 🎯";
        } else {
            motivationText.textContent = "Amazing! You're ready to finish! 🏆";
        }
    }

    showPersonalizedGreeting() {
        const greeting = document.getElementById('personalized-greeting');
        if (greeting) {
            const greetings = [
                `You've got this, ${this.userFirstName}! 🌟`,
                `Stay focused, ${this.userFirstName}! 🎯`,
                `Keep pushing, ${this.userFirstName}! 💪`,
                `You're doing great, ${this.userFirstName}! 🚀`,
                `Almost there, ${this.userFirstName}! 🔥`
            ];
            greeting.textContent = greetings[Math.floor(Math.random() * greetings.length)];
        }
    }

    // Event listeners
    setupEventListeners() {
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.previousQuestion();
            } else if (e.key === 'ArrowRight') {
                this.nextQuestion();
            } else if (e.key >= '1' && e.key <= '4') {
                const optionIndex = parseInt(e.key) - 1;
                if (optionIndex < this.currentQuiz?.questions[this.currentQuestionIndex]?.options.length) {
                    this.selectAnswer(optionIndex);
                }
            }
        });

        // Prevent accidental page refresh
        window.addEventListener('beforeunload', (e) => {
            if (this.currentQuiz && this.timer) {
                e.preventDefault();
                e.returnValue = 'Are you sure you want to leave? Your quiz progress will be lost.';
            }
        });
    }

    // Utility functions
    showLoading(show) {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            if (show) {
                spinner.classList.add('show');
            } else {
                spinner.classList.remove('show');
            }
        }
    }

    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container') || document.body;
        const toast = document.createElement('div');
        
        toast.style.cssText = `
            background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#10b981'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideIn 300ms ease;
            font-weight: 500;
        `;
        
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOut 300ms ease';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 3000);
    }
}

// Initialize quiz manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.quizManager = new QuizManager();
});

// CSS animations for toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
