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

    // 100 Motivational Quotes Array (same as before)
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
            { text: "Your limitationâ€”it's only your imagination.", author: "Anonymous" },
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
            // Adding 50 more quotes to reach 100...
            { text: "Don't be afraid to give up the good to go for the great.", author: "John D. Rockefeller" },
            { text: "If you believe it will work out, you'll see opportunities.", author: "Wayne Dyer" },
            { text: "You are never too old to set another goal or to dream a new dream.", author: "C.S. Lewis" },
            { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
            { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
            { text: "Life is what happens to you while you're busy making other plans.", author: "John Lennon" },
            { text: "The future belongs to those who prepare for it today.", author: "Malcolm X" },
            { text: "You miss 100% of the shots you don't take.", author: "Wayne Gretzky" },
            { text: "Whether you think you can or you think you can't, you're right.", author: "Henry Ford" },
            { text: "The only person you are destined to become is the person you decide to be.", author: "Ralph Waldo Emerson" },
            { text: "Go confidently in the direction of your dreams.", author: "Henry David Thoreau" },
            { text: "Born to be real, not to be perfect.", author: "Anonymous" },
            { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
            { text: "I'm not a product of my circumstances. I am a product of my decisions.", author: "Stephen Covey" },
            { text: "Every child is an artist. The problem is how to remain an artist once he grows up.", author: "Pablo Picasso" },
            { text: "You can never cross the ocean until you have the courage to lose sight of the shore.", author: "Christopher Columbus" },
            { text: "Either you run the day, or the day runs you.", author: "Jim Rohn" },
            { text: "The two most important days in your life are the day you are born and the day you find out why.", author: "Mark Twain" },
            { text: "Whatever you can do, or dream you can, begin it.", author: "Johann Wolfgang von Goethe" },
            { text: "Failure will never overtake me if my determination to succeed is strong enough.", author: "Og Mandino" },
            { text: "We may encounter many defeats but we must not be defeated.", author: "Maya Angelou" },
            { text: "Imagine your life is perfect in every respect; what would it look like?", author: "Brian Tracy" },
            { text: "We generate fears while we sit. We overcome them by action.", author: "Dr. Henry Link" },
            { text: "What seems impossible today will one day become your warm-up.", author: "Anonymous" },
            { text: "Turn your wounds into wisdom.", author: "Oprah Winfrey" },
            { text: "The successful warrior is the average man with laser-like focus.", author: "Bruce Lee" },
            { text: "Developing excellence is a lifelong journey of continuous improvement.", author: "Anonymous" },
            { text: "There are no shortcuts to any place worth going.", author: "Beverly Sills" },
            { text: "You are what you do, not what you say you'll do.", author: "Anonymous" },
            { text: "A goal is a dream with a deadline.", author: "Napoleon Hill" },
            { text: "You don't have to be great to get started, but you have to get started to be great.", author: "Les Brown" },
            { text: "A year from now you may wish you had started today.", author: "Karen Lamb" },
            { text: "Creativity is intelligence having fun.", author: "Albert Einstein" },
            { text: "What we think, we become.", author: "Buddha" },
            { text: "The mind is everything. What you think you become.", author: "Buddha" },
            { text: "The best way to predict the future is to create it.", author: "Peter Drucker" },
            { text: "You can't fall if you don't climb. But there's no joy in living your whole life on the ground.", author: "Anonymous" },
            { text: "We must believe that we are gifted for something.", author: "Marie Curie" },
            { text: "Too many of us are not living our dreams because we are living our fears.", author: "Les Brown" },
            { text: "The way to achieve your own success is to be willing to help somebody else get it first.", author: "Iyanla Vanzant" },
            { text: "Don't be pushed around by the fears in your mind. Be led by the dreams in your heart.", author: "Roy T. Bennett" },
            { text: "The difference between a stumbling block and a stepping stone is how high you raise your foot.", author: "Benny Lewis" },
            { text: "As we look ahead into the next century, leaders will be those who empower others.", author: "Bill Gates" },
            { text: "There are no traffic jams along the extra mile.", author: "Roger Staubach" },
            { text: "I would rather die of passion than of boredom.", author: "Vincent van Gogh" },
            { text: "The battles that count aren't the ones for gold medals.", author: "Jesse Owens" },
            { text: "Education costs money. But then so does ignorance.", author: "Sir Claus Moser" },
            { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas A. Edison" },
            { text: "Strive not to be a success, but rather to be of value.", author: "Albert Einstein" },
            { text: "Two roads diverged in a wood, and I took the one less traveled by.", author: "Robert Frost" },
            { text: "The only way to make sense out of change is to plunge into it, move with it, and join the dance.", author: "Alan Watts" },
            { text: "Happiness is not something readymade. It comes from your own actions.", author: "Dalai Lama" },
            { text: "If you want to lift yourself up, lift up someone else.", author: "Booker T. Washington" },
            { text: "The greatest glory in living lies not in never falling, but in rising every time we fall.", author: "Nelson Mandela" },
            { text: "If life were predictable it would cease to be life, and be without flavor.", author: "Eleanor Roosevelt" },
            { text: "Life is really simple, but we insist on making it complicated.", author: "Confucius" },
            { text: "May you live all the days of your life.", author: "Jonathan Swift" },
            { text: "Life itself is the most wonderful fairy tale.", author: "Hans Christian Andersen" },
            { text: "Do not go where the path may lead, go instead where there is no path and leave a trail.", author: "Ralph Waldo Emerson" }
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

    // Sample Quiz Data
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
                    text: `Sample Question ${i + 11}: This is a placeholder question for testing the quiz system functionality with various topics and complexity levels.`,
                    options: [`Option A${i + 11}`, `Option B${i + 11}`, `Option C${i + 11}`, `Option D${i + 11}`],
                    correctAnswer: Math.floor(Math.random() * 4),
                    category: ["General Knowledge", "Science", "History", "Geography", "Literature"][Math.floor(Math.random() * 5)]
                }))
            ]
        };
    }

    loadQuizFromURL() {
        // In a real app, you'd get quiz ID from URL params and load from Firebase
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
        this.showToast('âš ï¸ Only 5 minutes remaining!', 'warning');
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
        const notVisited = this.currentQuiz.totalQuestions - visited;
        
        document.getElementById('answered-count').textContent = answered;
        document.getElementById('marked-count').textContent = marked;
        document.getElementById('remaining-count').textContent = Math.max(0, notVisited);
    }

    displayCurrentQuestion() {
        const question = this.currentQuiz.questions[this.currentQuestionIndex];
        
        // Update question info
        document.getElementById('current-question-number').textContent = this.currentQuestionIndex + 1;
        document.getElementById('question-text').textContent = question.text;
        
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
                <input type="radio" 
                       name="question-${question.id}" 
                       value="${index}" 
                       id="option-${index}" 
                       class="option-input"
                       ${isSelected ? 'checked' : ''}>
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
            markBtn.innerHTML = '<i class="fas fa-bookmark"></i> Marked for Review';
        } else {
            markBtn.classList.remove('active');
            markBtn.innerHTML = '<i class="fas fa-bookmark"></i> Mark for Review';
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
            
            // Update state
            if (this.userAnswers.hasOwnProperty(this.currentQuestionIndex)) {
                this.questionStates[this.currentQuestionIndex] = 'answered';
            } else {
                this.questionStates[this.currentQuestionIndex] = 'current';
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
            this.updateAllProgressBars();
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
            userFirstName: this.userFirstName,
            score: correctAnswers,
            total: totalQuestions,
            percentage: percentage,
            timeTaken: this.currentQuiz.duration * 60 - this.timeRemaining,
            answers: this.userAnswers,
            markedQuestions: Array.from(this.markedQuestions),
            selectedQuote: this.selectedQuote,
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
                <i class="fas fa-trophy" style="font-size: 4rem; margin-bottom: 20px; color: gold;"></i>
                <h2 style="margin-bottom: 16px;">Congratulations ${this.userFirstName}! ðŸŽ‰</h2>
                <p style="margin-bottom: 30px; font-size: 1.1rem; opacity: 0.9;">
                    You've completed the quiz! Loading your results...
                </p>
                <div style="width: 300px; height: 4px; background: rgba(255,255,255,0.3); border-radius: 2px; margin: 0 auto;">
                    <div style="width: 0%; height: 100%; background: rgba(255,255,255,0.8); border-radius: 2px; animation: loading 3s ease-in-out forwards;"></div>
                </div>
                <p style="margin-top: 20px; font-size: 0.9rem; opacity: 0.7;">
                    Advertisement â€¢ Support our platform
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

    updateAllProgressBars() {
        const answered = Object.keys(this.userAnswers).length;
        const progress = (answered / this.currentQuiz.totalQuestions) * 100;
        
        // Update main progress bar
        document.getElementById('quiz-progress-fill').style.width = `${progress}%`;
        document.getElementById('progress-percentage').textContent = `${Math.round(progress)}%`;
        
        // Update motivation progress bar
        document.getElementById('motivation-progress-fill').style.width = `${progress}%`;
        
        // Update motivation progress text
        const progressText = document.getElementById('motivation-progress-text');
        if (progress === 100) {
            progressText.textContent = `Amazing ${this.userFirstName}! You've answered all questions! ðŸŽ‰`;
        } else if (progress >= 75) {
            progressText.textContent = `You're almost there ${this.userFirstName}! Keep going! ðŸ’ª`;
        } else if (progress >= 50) {
            progressText.textContent = `Great progress ${this.userFirstName}! You're halfway there! ðŸš€`;
        } else if (progress >= 25) {
            progressText.textContent = `You're doing great ${this.userFirstName}! Keep it up! â­`;
        } else {
            progressText.textContent = `You've got this ${this.userFirstName}! Keep going! ðŸ’ª`;
        }
    }

    displaySelectedMotivationalQuote() {
        if (this.selectedQuote) {
            document.getElementById('motivational-text').textContent = `"${this.selectedQuote.text}"`;
            document.getElementById('quote-author').textContent = `- ${this.selectedQuote.author}`;
        }
        
        // Note: This quote will NOT change during the entire quiz session
    }

    showPersonalizedGreeting() {
        if (!this.currentUser) return;
        
        const timeOfDay = new Date().getHours();
        let greeting;
        
        if (timeOfDay < 12) {
            greeting = `Good morning, ${this.userFirstName}! ðŸŒ…`;
        } else if (timeOfDay < 17) {
            greeting = `Good afternoon, ${this.userFirstName}! â˜€ï¸`;
        } else {
            greeting = `Good evening, ${this.userFirstName}! ðŸŒ™`;
        }
        
        const greetings = [
            `${greeting} You've got this!`,
            `Keep going, ${this.userFirstName}! ðŸŒŸ`,
            `You're amazing, ${this.userFirstName}! â­`,
            `Stay focused, ${this.userFirstName}! ðŸ’ª`,
            `Believe in yourself, ${this.userFirstName}! ðŸš€`,
            `You're doing great, ${this.userFirstName}! ðŸŽ¯`
        ];
        
        const randomGreeting = greetings[Math.floor(Math.random() * greetings.length)];
        document.getElementById('greeting-text').textContent = randomGreeting;
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
            border-radius: 12px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
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

// Make selectAnswer globally accessible for option clicks
window.selectAnswer = (optionIndex) => {
    if (window.quizManager) {
        window.quizManager.selectAnswer(optionIndex);
    }
};
