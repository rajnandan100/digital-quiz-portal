// ===== QUIZ SYSTEM WITH TIMER & MOTIVATIONAL QUOTES =====

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
        this.currentQuote = null;
        
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
                this.updateUserUI(user);
                this.loadQuizFromURL();
            } else {
                // Redirect to home if not authenticated
                window.location.href = '../index.html';
            }
        });

        // Setup event listeners
        this.setupEventListeners();
        this.showPersonalizedGreeting();
        this.displayMotivationalQuote();
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
            { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
            { text: "If you believe it will work out, you'll see opportunities. If you believe it won't, you will see obstacles.", author: "Wayne Dyer" },
            { text: "Challenges are what make life interesting and overcoming them is what makes life meaningful.", author: "Joshua J. Marine" },
            { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
            { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
            { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
            { text: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
            { text: "The future belongs to those who prepare for it today.", author: "Malcolm X" },
            { text: "It is never too late to be what you might have been.", author: "George Eliot" },
            { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
            { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
            { text: "I have learned throughout my life as a composer chiefly through my mistakes and pursuits of false assumptions, not by my exposure to founts of wisdom and knowledge.", author: "Igor Stravinsky" },
            { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
            { text: "Go confidently in the direction of your dreams. Live the life you have imagined.", author: "Henry David Thoreau" },
            { text: "When I was 5 years old, my mother always told me that happiness was the key to life. When I went to school, they asked me what I wanted to be when I grew up. I wrote down 'happy'. They told me I didn't understand the assignment, and I told them they didn't understand life.", author: "John Lennon" },
            { text: "Thirty years from now, you will be more disappointed by the things that you didn't do than by the ones you did do.", author: "Mark Twain" },
            { text: "Born to be real, not to be perfect.", author: "Anonymous" },
            { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
            { text: "I'm not a product of my circumstances. I am a product of my decisions.", author: "Stephen Covey" },
            { text: "Every child is an artist. The problem is how to remain an artist once he grows up.", author: "Pablo Picasso" },
            { text: "You can never cross the ocean until you have the courage to lose sight of the shore.", author: "Christopher Columbus" },
            { text: "I've learned that people will forget what you said, people will forget what you did, but people will never forget how you made them feel.", author: "Maya Angelou" },
            { text: "Either you run the day, or the day runs you.", author: "Jim Rohn" },
            { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
            { text: "The two most important days in your life are the day you are born and the day you find out why.", author: "Mark Twain" },
            { text: "Whatever you can do, or dream you can, begin it. Boldness has genius, power and magic in it.", author: "Johann Wolfgang von Goethe" },
            { text: "The best time to plant a tree was 20 years ago. The second best time is now.", author: "Chinese Proverb" },
            { text: "Your education is a gift that no one can take away from you.", author: "Anonymous" },
            { text: "An investment in knowledge pays the best interest.", author: "Benjamin Franklin" },
            { text: "I am always doing that which I cannot do, in order that I may learn how to do it.", author: "Pablo Picasso" },
            { text: "Live as if you were to die tomorrow. Learn as if you were to live forever.", author: "Mahatma Gandhi" },
            { text: "In learning you will teach, and in teaching you will learn.", author: "Phil Collins" },
            { text: "The beautiful thing about learning is nobody can take it away from you.", author: "B.B. King" },
            { text: "Learning never exhausts the mind.", author: "Leonardo da Vinci" },
            { text: "The more you learn, the more you earn.", author: "Frank Clark" },
            { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
            { text: "The expert in anything was once a beginner.", author: "Anonymous" },
            { text: "Success is the sum of small efforts repeated day in and day out.", author: "Robert Collier" },
            { text: "Don't let yesterday take up too much of today.", author: "Will Rogers" },
            { text: "You learn more from failure than from success. Don't let it stop you. Failure builds character.", author: "Anonymous" },
            { text: "It's not whether you get knocked down, it's whether you get up.", author: "Vince Lombardi" },
            { text: "If you are working on something that you really care about, you don't have to be pushed. The vision pulls you.", author: "Steve Jobs" },
            { text: "People who are crazy enough to think they can change the world, are the ones who do.", author: "Rob Siltanen" },
            { text: "Failure will never overtake me if my determination to succeed is strong enough.", author: "Og Mandino" },
            { text: "Entrepreneurs are great at dealing with uncertainty and also very good at minimizing risk. That's the classic entrepreneur.", author: "Mohnish Pabrai" },
            { text: "We may encounter many defeats but we must not be defeated.", author: "Maya Angelou" },
            { text: "Knowing is not enough; we must apply. Wishing is not enough; we must do.", author: "Johann Wolfgang von Goethe" },
            { text: "Imagine your life is perfect in every respect; what would it look like?", author: "Brian Tracy" },
            { text: "We generate fears while we sit. We overcome them by action.", author: "Dr. Henry Link" },
            { text: "What seems impossible today will one day become your warm-up.", author: "Anonymous" },
            { text: "Turn your wounds into wisdom.", author: "Oprah Winfrey" },
            { text: "The difference between ordinary and extraordinary is that little extra.", author: "Jimmy Johnson" },
            { text: "The successful warrior is the average man with laser-like focus.", author: "Bruce Lee" },
            { text: "Developing excellence is a lifelong journey of continuous improvement.", author: "Anonymous" },
            { text: "There are no shortcuts to any place worth going.", author: "Beverly Sills" },
            { text: "If you don't design your own life plan, chances are you'll fall into someone else's plan.", author: "Jim Rohn" },
            { text: "You are what you do, not what you say you'll do.", author: "Anonymous" },
            { text: "A goal is a dream with a deadline.", author: "Napoleon Hill" },
            { text: "You don't have to be great to get started, but you have to get started to be great.", author: "Les Brown" },
            { text: "A year from now you may wish you had started today.", author: "Karen Lamb" },
            { text: "Creativity is intelligence having fun.", author: "Albert Einstein" },
            { text: "What we think, we become.", author: "Buddha" },
            { text: "The mind is everything. What you think you become.", author: "Buddha" },
            { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
            { text: "You can't fall if you don't climb. But there's no joy in living your whole life on the ground.", author: "Anonymous" },
            { text: "We must believe that we are gifted for something, and that this thing, at whatever cost, must be attained.", author: "Marie Curie" },
            { text: "Too many of us are not living our dreams because we are living our fears.", author: "Les Brown" },
            { text: "The way to achieve your own success is to be willing to help somebody else get it first.", author: "Iyanla Vanzant" },
            { text: "Don't be pushed around by the fears in your mind. Be led by the dreams in your heart.", author: "Roy T. Bennett" },
            { text: "Champions keep playing until they get it right.", author: "Billie Jean King" },
            { text: "The difference between a stumbling block and a stepping stone is how high you raise your foot.", author: "Benny Lewis" },
            { text: "What lies behind you and what lies in front of you, pales in comparison to what lies inside of you.", author: "Ralph Waldo Emerson" },
            { text: "Success is liking yourself, liking what you do, and liking how you do it.", author: "Maya Angelou" },
            { text: "As we look ahead into the next century, leaders will be those who empower others.", author: "Bill Gates" },
            { text: "A person who never made a mistake never tried anything new.", author: "Albert Einstein" },
            { text: "The person who says it cannot be done should not interrupt the person who is doing it.", author: "Chinese Proverb" },
            { text: "There are no traffic jams along the extra mile.", author: "Roger Staubach" },
            { text: "It is never too late to be what you might have been.", author: "George Eliot" },
            { text: "You become what you believe.", author: "Oprah Winfrey" },
            { text: "I would rather die of passion than of boredom.", author: "Vincent van Gogh" },
            { text: "A truly rich man is one whose children run into his arms when his hands are empty.", author: "Anonymous" },
            { text: "It is not what you do for your children, but what you have taught them to do for themselves, that will make them successful human beings.", author: "Ann Landers" },
            { text: "Build your own dreams, or someone else will hire you to build theirs.", author: "Farrah Gray" },
            { text: "The battles that count aren't the ones for gold medals. The struggles within yourself–the invisible battles inside all of us–that's where it's at.", author: "Jesse Owens" },
            { text: "Education costs money. But then so does ignorance.", author: "Sir Claus Moser" },
            { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas A. Edison" }
        ];
    }

    // Sample Quiz Data (This would normally come from Firebase)
    getSampleQuiz() {
        return {
            id: 'gk-001',
            title: 'General Knowledge Challenge 2024',
            category: 'General Knowledge',
            duration: 30, // minutes
            totalQuestions: 30,
            questions: [
                {
                    id: 1,
                    text: "What is the capital of Australia?",
                    options: ["Sydney", "Melbourne", "Canberra", "Perth"],
                    correctAnswer: 2,
                    category: "Geography"
                },
                {
                    id: 2,
                    text: "Who painted the Mona Lisa?",
                    options: ["Vincent van Gogh", "Leonardo da Vinci", "Pablo Picasso", "Michelangelo"],
                    correctAnswer: 1,
                    category: "Art"
                },
                {
                    id: 3,
                    text: "What is the largest planet in our solar system?",
                    options: ["Earth", "Mars", "Jupiter", "Saturn"],
                    correctAnswer: 2,
                    category: "Science"
                },
                {
                    id: 4,
                    text: "Which year did World War II end?",
                    options: ["1944", "1945", "1946", "1947"],
                    correctAnswer: 1,
                    category: "History"
                },
                {
                    id: 5,
                    text: "What is the chemical symbol for gold?",
                    options: ["Go", "Gd", "Au", "Ag"],
                    correctAnswer: 2,
                    category: "Science"
                },
                // Add more sample questions (we'll use 30 total)
                {
                    id: 6,
                    text: "Who wrote 'Romeo and Juliet'?",
                    options: ["Charles Dickens", "William Shakespeare", "Mark Twain", "Jane Austen"],
                    correctAnswer: 1,
                    category: "Literature"
                },
                {
                    id: 7,
                    text: "What is the smallest country in the world?",
                    options: ["Monaco", "San Marino", "Vatican City", "Liechtenstein"],
                    correctAnswer: 2,
                    category: "Geography"
                },
                {
                    id: 8,
                    text: "Which element has the atomic number 1?",
                    options: ["Helium", "Hydrogen", "Oxygen", "Carbon"],
                    correctAnswer: 1,
                    category: "Science"
                },
                {
                    id: 9,
                    text: "In which year did the Berlin Wall fall?",
                    options: ["1987", "1988", "1989", "1990"],
                    correctAnswer: 2,
                    category: "History"
                },
                {
                    id: 10,
                    text: "What is the currency of Japan?",
                    options: ["Yuan", "Won", "Yen", "Ringgit"],
                    correctAnswer: 2,
                    category: "Geography"
                },
                // Adding more questions to reach 30
                ...Array.from({ length: 20 }, (_, i) => ({
                    id: i + 11,
                    text: `Sample Question ${i + 11}: This is a placeholder question for testing the quiz system functionality.`,
                    options: [`Option A${i + 11}`, `Option B${i + 11}`, `Option C${i + 11}`, `Option D${i + 11}`],
                    correctAnswer: Math.floor(Math.random() * 4),
                    category: ["General Knowledge", "Science", "History", "Geography", "Literature"][Math.floor(Math.random() * 5)]
                }))
            ]
        };
    }

    loadQuizFromURL() {
        // In a real app, you'd get quiz ID from URL params and load from Firebase
        // For now, we'll use sample data
        const urlParams = new URLSearchParams(window.location.search);
        const quizId = urlParams.get('id') || 'gk-001';
        
        this.showLoading(true);
        
        // Simulate loading delay
        setTimeout(() => {
            this.currentQuiz = this.getSampleQuiz();
            this.initializeQuiz();
            this.showLoading(false);
        }, 1500);
    }

    initializeQuiz() {
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
        
        // Update UI
        this.updateQuizHeader();
        this.generateQuestionPalette();
        this.displayCurrentQuestion();
        this.startTimer();
        this.updateProgressBar();
    }

    updateQuizHeader() {
        document.getElementById('quiz-title-header').textContent = this.currentQuiz.title;
        document.getElementById('total-questions').textContent = this.currentQuiz.totalQuestions;
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
        
        // Change color based on time remaining
        const timer = document.getElementById('timer-display').parentElement;
        if (this.timeRemaining <= 300) { // 5 minutes
            timer.style.background = 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)';
        } else if (this.timeRemaining <= 600) { // 10 minutes
            timer.style.background = 'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)';
        }
    }

    showTimerWarning() {
        // Show warning toast
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
        const notVisited = this.currentQuiz.totalQuestions - new Set([
            ...Object.keys(this.userAnswers).map(Number),
            ...Array.from(this.markedQuestions),
            this.currentQuestionIndex
        ]).size;
        
        document.getElementById('answered-count').textContent = answered;
        document.getElementById('marked-count').textContent = marked;
        document.getElementById('remaining-count').textContent = Math.max(0, notVisited);
    }

    displayCurrentQuestion() {
        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        
        // Update question info
        document.getElementById('current-question-number').textContent = this.currentQuestionIndex + 1;
        document.getElementById('question-category').textContent = question.category;
        document.getElementById('question-text').textContent = question.text;
        
        // Create options
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
                <input type="radio" 
                       name="question-${question.id}" 
                       value="${index}" 
                       id="option-${index}" 
                       class="option-input"
                       ${isSelected ? 'checked' : ''}
                       onchange="quizManager.selectAnswer(${index})">
                <label for="option-${index}" class="option-text">${option}</label>
            `;
            
            optionsContainer.appendChild(optionDiv);
        });
        
        // Update navigation buttons
        this.updateNavigationButtons();
        
        // Update mark button state
        const markBtn = document.getElementById('btn-mark');
        if (this.markedQuestions.has(this.currentQuestionIndex)) {
            markBtn.classList.add('active');
            markBtn.innerHTML = '<i class="fas fa-bookmark"></i> Marked for Review';
        } else {
            markBtn.classList.remove('active');
            markBtn.innerHTML = '<i class="fas fa-bookmark"></i> Mark for Review';
        }
        
        this.updateProgressBar();
    }

    selectAnswer(optionIndex) {
        this.userAnswers[this.currentQuestionIndex] = optionIndex;
        this.questionStates[this.currentQuestionIndex] = 'answered';
        
        // Update option styling
        document.querySelectorAll('.option-item').forEach(item => {
            item.classList.remove('selected');
        });
        document.querySelectorAll('.option-item')[optionIndex].classList.add('selected');
        
        // Update palette
        this.updateQuestionPalette();
        this.updatePaletteStats();
        this.updateProgressBar();
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
        
        if (this.currentQuestionIndex === this.currentQuiz.totalQuestions - 1) {
            nextBtn.innerHTML = '<i class="fas fa-flag-checkered"></i> Finish';
        } else {
            nextBtn.innerHTML = 'Next <i class="fas fa-chevron-right"></i>';
        }
    }

    goToQuestion(questionIndex) {
        if (questionIndex >= 0 && questionIndex < this.currentQuiz.totalQuestions) {
            // Update previous question state
            if (this.questionStates[this.currentQuestionIndex] === 'current' && 
                !this.userAnswers.hasOwnProperty(this.currentQuestionIndex)) {
                this.questionStates[this.currentQuestionIndex] = 'not-visited';
            }
            
            this.currentQuestionIndex = questionIndex;
            this.questionStates[this.currentQuestionIndex] = 'current';
            
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
        if (this.currentQuestionIndex < this.currentQuiz.totalQuestions - 1) {
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
            markBtn.innerHTML = '<i class="fas fa-bookmark"></i> Mark for Review';
            
            // Update state if not answered
            if (!this.userAnswers.hasOwnProperty(this.currentQuestionIndex)) {
                this.questionStates[this.currentQuestionIndex] = 'current';
            } else {
                this.questionStates[this.currentQuestionIndex] = 'answered';
            }
        } else {
            this.markedQuestions.add(this.currentQuestionIndex);
            markBtn.classList.add('active');
            markBtn.innerHTML = '<i class="fas fa-bookmark"></i> Marked for Review';
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
            document.querySelectorAll(`input[name="question-${this.currentQuiz.questions[this.currentQuestionIndex].id}"]`)
                .forEach(radio => radio.checked = false);
            
            // Remove selection styling
            document.querySelectorAll('.option-item').forEach(item => {
                item.classList.remove('selected');
            });
            
            this.updateQuestionPalette();
            this.updatePaletteStats();
            this.updateProgressBar();
        }
    }

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
        this.hideSubmitModal();
        this.showLoading(true);
        
        // Stop timer
        if (this.timer) {
            clearInterval(this.timer);
        }
        
        // Calculate results
        const results = this.calculateResults();
        
        // Save to Firebase (simulation)
        try {
            await this.saveQuizResults(results);
            
            // Show interstitial ad (simulation)
            setTimeout(() => {
                this.showInterstitialAd(() => {
                    // Redirect to results page
                    window.location.href = `../pages/results.html?score=${results.score}&total=${results.total}&percentage=${results.percentage}`;
                });
            }, 1000);
        } catch (error) {
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

    calculateResults() {
        let correctAnswers = 0;
        const totalQuestions = this.currentQuiz.totalQuestions;
        
        this.currentQuiz.questions.forEach((question, index) => {
            if (this.userAnswers[index] === question.correctAnswer) {
                correctAnswers++;
            }
        });
        
        const percentage = Math.round((correctAnswers / totalQuestions) * 100);
        
        return {
            quizId: this.currentQuiz.id,
            userId: this.currentUser.uid,
            userName: this.currentUser.displayName,
            score: correctAnswers,
            total: totalQuestions,
            percentage: percentage,
            timeTaken: this.currentQuiz.duration * 60 - this.timeRemaining,
            answers: this.userAnswers,
            markedQuestions: Array.from(this.markedQuestions),
            timestamp: firebase.firestore.FieldValue.serverTimestamp()
        };
    }

    async saveQuizResults(results) {
        // Save to Firestore
        await firebase.firestore()
            .collection('quizResults')
            .add(results);
        
        // Update user stats
        const userRef = firebase.firestore()
            .collection('users')
            .doc(this.currentUser.uid);
        
        await userRef.update({
            quizzesTaken: firebase.firestore.FieldValue.increment(1),
            totalScore: firebase.firestore.FieldValue.increment(results.score),
            lastQuizDate: firebase.firestore.FieldValue.serverTimestamp()
        });
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
                <i class="fas fa-ad" style="font-size: 4rem; margin-bottom: 20px; opacity: 0.8;"></i>
                <h2 style="margin-bottom: 16px;">Great Job! 🎉</h2>
                <p style="margin-bottom: 30px; font-size: 1.1rem; opacity: 0.9;">
                    You've completed the quiz! Loading your results...
                </p>
                <div style="width: 300px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; margin: 0 auto;">
                    <div style="width: 0%; height: 100%; background: rgba(255,255,255,0.8); border-radius: 2px; animation: loading 3s ease-in-out forwards;"></div>
                </div>
                <p style="margin-top: 20px; font-size: 0.9rem; opacity: 0.7;">
                    Advertisement • Support our platform
                </p>
            </div>
        `;
        
        // Add loading animation
        const style = document.createElement('style');
        style.textContent = `
            @keyframes loading {
                0% { width: 0%; }
                100% { width: 100%; }
            }
        `;
        document.head.appendChild(style);
        
        document.body.appendChild(adOverlay);
        
        // Remove after 3 seconds and execute callback
        setTimeout(() => {
            document.body.removeChild(adOverlay);
            document.head.removeChild(style);
            callback();
        }, 3000);
    }

    updateProgressBar() {
        const answered = Object.keys(this.userAnswers).length;
        const progress = (answered / this.currentQuiz.totalQuestions) * 100;
        document.getElementById('progress-fill').style.width = `${progress}%`;
        
        // Update progress text
        const progressText = document.getElementById('progress-text');
        if (progress === 100) {
            progressText.textContent = 'Amazing! You\'ve answered all questions! 🎉';
        } else if (progress >= 75) {
            progressText.textContent = 'You\'re almost there! Keep going! 💪';
        } else if (progress >= 50) {
            progressText.textContent = 'Great progress! You\'re halfway there! 🚀';
        } else if (progress >= 25) {
            progressText.textContent = 'You\'re doing great! Keep it up! ⭐';
        } else {
            progressText.textContent = 'You\'re doing great! Keep it up!';
        }
    }

    displayMotivationalQuote() {
        const quotes = this.getMotivationalQuotes();
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        this.currentQuote = randomQuote;
        
        document.getElementById('motivational-text').textContent = `"${randomQuote.text}"`;
        document.getElementById('quote-author').textContent = `- ${randomQuote.author}`;
        
        // Change quote every 2 minutes
        setTimeout(() => {
            this.displayMotivationalQuote();
        }, 120000);
    }

    showPersonalizedGreeting() {
        if (!this.currentUser) return;
        
        const userName = this.currentUser.displayName || 'Champion';
        const timeOfDay = new Date().getHours();
        
        let greeting;
        if (timeOfDay < 12) {
            greeting = `Good morning, ${userName}! 🌅`;
        } else if (timeOfDay < 17) {
            greeting = `Good afternoon, ${userName}! ☀️`;
        } else {
            greeting = `Good evening, ${userName}! 🌙`;
        }
        
        const greetings = [
            `${greeting} You've got this!`,
            `Keep going, ${userName}! 🌟`,
            `You're amazing, ${userName}! ⭐`,
            `Stay focused, ${userName}! 💪`,
            `Believe in yourself, ${userName}! 🚀`,
            `You're doing great, ${userName}! 🎯`
        ];
        
        const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
        document.getElementById('greeting-text').textContent = randomGreeting;
        
        // Change greeting every 3 minutes
        setTimeout(() => {
            this.showPersonalizedGreeting();
        }, 180000);
    }

    setupEventListeners() {
        // Navigation buttons
        document.getElementById('btn-previous')?.addEventListener('click', () => this.previousQuestion());
        document.getElementById('btn-next')?.addEventListener('click', () => this.nextQuestion());
        
        // Action buttons
        document.getElementById('btn-mark')?.addEventListener('click', () => this.toggleMarkForReview());
        document.getElementById('btn-clear')?.addEventListener('click', () => this.clearResponse());
        document.getElementById('btn-submit')?.addEventListener('click', () => this.showSubmitModal());
        
        // Modal buttons
        document.getElementById('submit-cancel')?.addEventListener('click', () => this.hideSubmitModal());
        document.getElementById('submit-modal-close')?.addEventListener('click', () => this.hideSubmitModal());
        document.getElementById('confirm-submit')?.addEventListener('click', () => this.submitQuiz());
        
        // Logout button
        document.getElementById('btn-logout')?.addEventListener('click', () => {
            firebase.auth().signOut().then(() => {
                window.location.href = '../index.html';
            });
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') {
                this.previousQuestion();
            } else if (e.key === 'ArrowRight') {
                this.nextQuestion();
            } else if (e.key === 'Enter' && e.ctrlKey) {
                this.showSubmitModal();
            }
        });
        
        // Prevent accidental page refresh
        window.addEventListener('beforeunload', (e) => {
            if (this.timer) {
                e.preventDefault();
                e.returnValue = 'You have an active quiz. Are you sure you want to leave?';
            }
        });
    }

    updateUserUI(user) {
        const userInfo = document.getElementById('user-info');
        const userName = document.getElementById('user-name');
        const userAvatar = document.getElementById('user-avatar');
        
        if (user && userInfo && userName && userAvatar) {
            userInfo.style.display = 'flex';
            userName.textContent = user.displayName || user.email;
            userAvatar.src = user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email)}&background=4F46E5&color=fff`;
        }
    }

    showLoading(show) {
        const spinner = document.getElementById('loading-spinner');
        if (spinner) {
            spinner.classList.toggle('show', show);
        }
    }

    showToast(message, type = 'info') {
        const toast = document.createElement('div');
        toast.className = `quiz-toast ${type}`;
        
        const bgColor = {
            'info': '#4f46e5',
            'success': '#10b981',
            'warning': '#f59e0b',
            'error': '#ef4444'
        }[type] || '#4f46e5';
        
        toast.style.cssText = `
            position: fixed;
            top: 120px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
            z-index: 10001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 350px;
            font-weight: 500;
        `;
        
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 100);
        
        setTimeout(() => {
            toast.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (document.body.contains(toast)) {
                    document.body.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }
}

// Initialize quiz manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.quizManager = new QuizManager();
});

// Make selectAnswer globally accessible for radio button onchange
window.selectAnswer = (optionIndex) => {
    if (window.quizManager) {
        window.quizManager.selectAnswer(optionIndex);
    }
};
