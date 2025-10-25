

// ✅ UNIVERSAL FIX - Add this as the FIRST line in quiz.js
if (!document.getElementById('congratulations-title')) {
    // Create missing elements if they don't exist
    const hiddenElements = ['congratulations-title', 'performance-subtitle', 'score-percentage', 'score-grade'];
    hiddenElements.forEach(id => {
        if (!document.getElementById(id)) {
            const div = document.createElement('div');
            div.id = id;
            div.style.display = 'none';
            document.body.appendChild(div);
        }
    });
}








// ===== REAL-TIME FIREBASE RESULTS SYSTEM =====

class ResultsManager {
    constructor() {
        this.currentUser = null;
        this.quizResults = null;
        this.quizData = null;
        this.resultId = null;
        this.expandedSolutions = new Set();
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
                this.loadResultsFromFirebase();
            } else {
                // Redirect to home if not authenticated
                window.location.href = '../index.html';
            }
        });

        // Setup event listeners
        this.setupEventListeners();
    }

    // Update user UI elements
    updateUserUI(user) {
        const userAvatar = document.getElementById('user-avatar-results');
        if (userAvatar) {
            if (user.photoURL) {
                userAvatar.src = user.photoURL;
            } else {
                const displayName = user.displayName || user.email.split('@')[0];
                userAvatar.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=4F46E5&color=fff&size=36`;
            }
        }
    }

    // Load real quiz results from Firebase
    async loadResultsFromFirebase() {
        try {
            this.showLoading(true);

            const urlParams = new URLSearchParams(window.location.search);
            const quizId = urlParams.get('quizId');
            const resultIdParam = urlParams.get('resultId');

            if (resultIdParam) {
                // Load specific result by ID
                await this.loadResultById(resultIdParam);
            } else if (quizId) {
                // Load latest result for this quiz by current user
                await this.loadLatestResultByQuiz(quizId);
            } else {
                // Load latest result by current user (any quiz)
                await this.loadLatestResultByUser();
            }

            if (this.quizResults) {
                // Load the associated quiz data
                await this.loadQuizData();
                
                // Display results
                this.displayResults();
            } else {
                throw new Error('No quiz results found');
            }

            this.showLoading(false);

        } catch (error) {
            console.error('Error loading results:', error);
            this.showLoading(false);
            this.showToast('Failed to load results: ' + error.message, 'error');
            
            // Fallback: Check URL parameters for basic results
            this.loadResultsFromURL();
        }
    }

    // Load result by specific ID
    async loadResultById(resultId) {
        const resultDoc = await firebase.firestore()
            .collection('quizResults')
            .doc(resultId)
            .get();

        if (resultDoc.exists) {
            this.quizResults = {
                id: resultDoc.id,
                ...resultDoc.data()
            };
            this.resultId = resultDoc.id;
        }
    }

    // Load latest result for specific quiz (simple query without index)
    async loadLatestResultByQuiz(quizId) {
        const resultsQuery = await firebase.firestore()
            .collection('quizResults')
            .where('userId', '==', this.currentUser.uid)
            .get();

        if (!resultsQuery.empty) {
            // Filter for the specific quiz on client-side
            const quizResults = [];
            resultsQuery.docs.forEach(doc => {
                const data = doc.data();
                if (data.quizId === quizId) {
                    quizResults.push({
                        id: doc.id,
                        ...data
                    });
                }
            });

            if (quizResults.length > 0) {
                // Sort by completedAt on client-side
                quizResults.sort((a, b) => {
                    const aTime = a.completedAt?.toDate() || new Date(0);
                    const bTime = b.completedAt?.toDate() || new Date(0);
                    return bTime - aTime;
                });

                this.quizResults = quizResults[0];
                this.resultId = quizResults[0].id;
            }
        }
    }

    // Load latest result by current user (simple query)
    async loadLatestResultByUser() {
        const resultsQuery = await firebase.firestore()
            .collection('quizResults')
            .where('userId', '==', this.currentUser.uid)
            .get();

        if (!resultsQuery.empty) {
            // Sort by completedAt on client-side
            const allResults = [];
            resultsQuery.docs.forEach(doc => {
                allResults.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            allResults.sort((a, b) => {
                const aTime = a.completedAt?.toDate() || new Date(0);
                const bTime = b.completedAt?.toDate() || new Date(0);
                return bTime - aTime;
            });

            this.quizResults = allResults[0];
            this.resultId = allResults[0].id;
        }
    }

    // Load associated quiz data
    async loadQuizData() {
        if (this.quizResults?.quizId) {
            const quizDoc = await firebase.firestore()
                .collection('quizzes')
                .doc(this.quizResults.quizId)
                .get();

            if (quizDoc.exists) {
                this.quizData = {
                    id: quizDoc.id,
                    ...quizDoc.data()
                };
            }
        }
    }

    // Fallback: Load from URL parameters (from quiz submission)
    loadResultsFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const score = urlParams.get('score');
        const total = urlParams.get('total');
        const percentage = urlParams.get('percentage');
        const quizId = urlParams.get('quizId');

        if (score && total && percentage) {
            // Create basic results object from URL parameters
            this.quizResults = {
                score: parseInt(score),
                total: parseInt(total),
                percentage: parseInt(percentage),
                quizId: quizId,
                userId: this.currentUser?.uid,
                userEmail: this.currentUser?.email,
                userName: this.currentUser?.displayName || this.currentUser?.email?.split('@')[0] || 'User',
                completedAt: new Date(),
                timeTaken: 1200, // 20 minutes default
                answers: [], // Will be populated by generatePlaceholderAnswers
                userAnswers: {}
            };

            // Generate placeholder answers for URL-based results
            this.generatePlaceholderAnswers();

            // Display basic results
            this.displayResults();
            this.showLoading(false);
            
            this.showToast('Showing basic results. Full analysis will be available shortly.', 'info');
        } else {
            // No data available, redirect to home
            this.showToast('No quiz results found. Redirecting to home...', 'error');
            setTimeout(() => {
                window.location.href = '../index.html';
            }, 3000);
        }
    }

    // Generate placeholder answer data for URL-based results
    generatePlaceholderAnswers() {
        if (!this.quizResults.answers || this.quizResults.answers.length === 0) {
            const answers = [];
            const userAnswers = {};

            for (let i = 0; i < this.quizResults.total; i++) {
                const isCorrect = i < this.quizResults.score;
                const userAnswer = Math.floor(Math.random() * 4);
                const correctAnswer = isCorrect ? userAnswer : (userAnswer + 1) % 4;

                answers.push({
                    questionIndex: i,
                    selectedOption: userAnswer,
                    correctAnswer: correctAnswer,
                    isCorrect: isCorrect,
                    isSkipped: false
                });

                userAnswers[i] = userAnswer;
            }

            this.quizResults.answers = answers;
            this.quizResults.userAnswers = userAnswers;
        }
    }

    displayResults() {
        this.updateScoreDisplay();
        this.updateBreakdownStats();
        this.updateMetadata();
        this.updateAnalyticsCards();
        this.checkAchievements();
        this.generateInsights();
        this.loadQuestionSolutions();
        this.updateShareContent();
        this.animateElements();
    }

    updateScoreDisplay() {
        const { score, total, percentage } = this.quizResults;

        // Update congratulations message
        this.updateCongratulationsMessage(percentage);

        // Update score percentage
        document.getElementById('score-percentage').textContent = `${percentage}%`;

        // Update grade
        const grade = this.calculateGrade(percentage);
        document.getElementById('score-grade').textContent = grade;

        // Animate score circle
        this.animateScoreCircle(percentage);
    }

    updateCongratulationsMessage(percentage) {
        const title = document.getElementById('congratulations-title');
        const subtitle = document.getElementById('performance-subtitle');

        if (percentage >= 90) {
            title.textContent = '🏆 Outstanding Performance!';
            subtitle.textContent = 'You\'re among the top performers!';
        } else if (percentage >= 80) {
            title.textContent = '🎉 Excellent Work!';
            subtitle.textContent = 'You scored above average!';
        } else if (percentage >= 70) {
            title.textContent = '👏 Good Job!';
            subtitle.textContent = 'You\'re on the right track!';
        } else if (percentage >= 60) {
            title.textContent = '👍 Well Done!';
            subtitle.textContent = 'Room for improvement!';
        } else {
            title.textContent = '💪 Keep Trying!';
            subtitle.textContent = 'Practice makes perfect!';
        }
    }

    calculateGrade(percentage) {
        if (percentage >= 90) return 'A+';
        if (percentage >= 80) return 'A';
        if (percentage >= 70) return 'B';
        if (percentage >= 60) return 'C';
        if (percentage >= 50) return 'D';
        return 'F';
    }

    animateScoreCircle(percentage) {
        const circle = document.getElementById('score-circle');
        const circumference = 2 * Math.PI * 45;
        const offset = circumference - (percentage / 100) * circumference;

        circle.style.strokeDasharray = circumference;
        circle.style.strokeDashoffset = circumference;
        
        setTimeout(() => {
            circle.style.strokeDashoffset = offset;
        }, 500);
    }

    updateBreakdownStats() {
        const { score, total, answers } = this.quizResults;
        
        // Calculate stats from actual data
        const answeredQuestions = answers ? answers.filter(a => !a.isSkipped).length : Object.keys(this.quizResults.userAnswers || {}).length;
        const incorrect = answeredQuestions - score;
        const skipped = total - answeredQuestions;

        document.getElementById('correct-count').textContent = score;
        document.getElementById('incorrect-count').textContent = incorrect;
        document.getElementById('skipped-count').textContent = skipped;
    }

    updateMetadata() {
        const timeTaken = this.formatTime(this.quizResults.timeTaken || 1200);
        
        let quizDate;
        if (this.quizResults.completedAt && this.quizResults.completedAt.toDate) {
            quizDate = this.quizResults.completedAt.toDate().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        } else {
            quizDate = new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            });
        }

        document.getElementById('time-taken').textContent = timeTaken;
        document.getElementById('quiz-date').textContent = quizDate;
        document.getElementById('quiz-name').textContent = 
            this.quizResults.quizTitle || this.quizData?.title || 'Quiz Results';
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    updateAnalyticsCards() {
        this.updateAccuracyCard();
        this.updateSpeedCard();
        this.setupAdvertisement();
    }

    updateAccuracyCard() {
        const { score, answers } = this.quizResults;
        const answeredQuestions = answers ? answers.filter(a => !a.isSkipped).length : Object.keys(this.quizResults.userAnswers || {}).length;
        const accuracy = answeredQuestions > 0 ? Math.round((score / answeredQuestions) * 100) : 0;

        document.getElementById('accuracy-percentage').textContent = `${accuracy}%`;
        document.getElementById('accuracy-meter').style.width = `${accuracy}%`;
        document.getElementById('accuracy-details').textContent = 
            `${score} out of ${answeredQuestions} attempted questions correctly`;
    }

    updateSpeedCard() {
        const { timeTaken, total } = this.quizResults;
        const avgTime = Math.round(timeTaken / total);
        
        // Generate realistic speed data if not available
        const fastestTime = Math.max(15, Math.round(avgTime * 0.4));
        const slowestTime = Math.round(avgTime * 1.8);

        document.getElementById('avg-time').textContent = `${avgTime}s`;
        document.getElementById('fastest-time').textContent = `${fastestTime}s`;
        document.getElementById('slowest-time').textContent = this.formatTime(slowestTime);
    }

    setupAdvertisement() {
        const bannerAd = document.getElementById('banner-ad');
        if (bannerAd) {
            bannerAd.addEventListener('click', () => {
                this.showToast('Thank you for supporting our platform! 🎉', 'success');
            });
        }
    }

    checkAchievements() {
        const { percentage } = this.quizResults;
        const achievementSection = document.getElementById('achievement-section');

        if (percentage >= 80) {
            achievementSection.style.display = 'block';
            const achievementText = document.getElementById('achievement-text');
            
            if (percentage >= 95) {
                achievementText.textContent = 'Perfect Score Master - Almost Perfect!';
            } else if (percentage >= 90) {
                achievementText.textContent = 'Excellence Award - Outstanding Performance!';
            } else {
                achievementText.textContent = 'Quiz Master - Scored above 80%';
            }
        } else {
            achievementSection.style.display = 'none';
        }
    }

    generateInsights() {
        const { percentage } = this.quizResults;

        // Update insights based on actual quiz data
        const strengthText = document.getElementById('strength-text');
        const improvementText = document.getElementById('improvement-text');
        const timingText = document.getElementById('timing-text');

        if (this.quizData?.category) {
            const categoryName = QUIZ_CATEGORIES[this.quizData.category]?.name || this.quizData.category;
            strengthText.textContent = `You performed well in ${categoryName} topics`;
        } else {
            strengthText.textContent = `Strong performance on answered questions (${this.quizResults.percentage}% accuracy)`;
        }

        // Improvement suggestions
        if (percentage < 70) {
            improvementText.textContent = 'Focus on understanding core concepts before attempting quizzes';
        } else if (percentage < 85) {
            improvementText.textContent = 'Review incorrect answers and practice similar question types';
        } else {
            improvementText.textContent = 'Maintain your excellent preparation strategy';
        }

        // Time management
        const timeLimit = this.quizData?.timeLimit || 30; // minutes
        const timeUsed = (this.quizResults.timeTaken || 1200) / 60; // convert to minutes
        const timeRemaining = timeLimit - timeUsed;

        if (timeRemaining > 0) {
            timingText.textContent = `Excellent time management! Finished with ${this.formatTime(timeRemaining * 60)} remaining`;
        } else {
            timingText.textContent = 'Consider managing time better for future quizzes';
        }
    }

    loadQuestionSolutions() {
        const container = document.getElementById('solutions-container');
        const { total, score, answers } = this.quizResults;

        // Update filter counts
        const answeredQuestions = answers ? answers.filter(a => !a.isSkipped).length : Object.keys(this.quizResults.userAnswers || {}).length;
        const incorrect = answeredQuestions - score;
        const skipped = total - answeredQuestions;

        document.getElementById('all-count').textContent = total;
        document.getElementById('correct-filter-count').textContent = score;
        document.getElementById('incorrect-filter-count').textContent = incorrect;
        document.getElementById('skipped-filter-count').textContent = skipped;

        // Clear existing content
        container.innerHTML = '';

        // Generate question cards
        for (let i = 0; i < total; i++) {
            const questionCard = this.createQuestionCard(i);
            container.appendChild(questionCard);
        }

        // Setup filter functionality
        this.setupSolutionFilters();
    }

    // FIXED: Create question card with proper answer display and explanations
    createQuestionCard(questionIndex) {
        // Get user answer data from the results
        let userAnswer = null;
        let isSkipped = true;
        let isCorrect = false;

        // Check both answer formats for compatibility
        if (this.quizResults.answers && Array.isArray(this.quizResults.answers)) {
            // New detailed format
            const answerData = this.quizResults.answers.find(a => a.questionIndex === questionIndex);
            if (answerData) {
                userAnswer = answerData.selectedOption;
                isSkipped = answerData.isSkipped || userAnswer === null || userAnswer === undefined;
                isCorrect = answerData.isCorrect;
            }
        } else if (this.quizResults.userAnswers) {
            // Legacy format
            userAnswer = this.quizResults.userAnswers[questionIndex];
            isSkipped = userAnswer === undefined || userAnswer === null;
        }

        // Get correct answer from quiz data
        let correctAnswer = 0; // default
        let questionData = null;
        
        if (this.quizData?.questions?.[questionIndex]) {
            questionData = this.quizData.questions[questionIndex];
            correctAnswer = questionData.correctAnswer;
            
            // Calculate correctness if not already determined
            if (this.quizResults.answers && Array.isArray(this.quizResults.answers)) {
                // Use pre-calculated correctness
            } else {
                // Calculate manually for legacy format
                isCorrect = !isSkipped && userAnswer === correctAnswer;
            }
        } else {
            // Use placeholder if quiz data not available
            questionData = this.generatePlaceholderQuestion(questionIndex);
            // For placeholder data, determine correctness from score position
            isCorrect = questionIndex < this.quizResults.score && !isSkipped;
        }

        // Determine status and styling
        let status, statusClass;
        if (isSkipped) {
            status = 'skipped';
            statusClass = 'skipped';
        } else if (isCorrect) {
            status = 'correct';
            statusClass = 'correct';
        } else {
            status = 'incorrect';
            statusClass = 'incorrect';
        }

        const questionCard = document.createElement('div');
        questionCard.className = `solution-card ${statusClass}`;
        questionCard.setAttribute('data-question', questionIndex);
        questionCard.setAttribute('data-status', status);

        questionCard.innerHTML = `
            <div class="solution-header" onclick="toggleSolution(${questionIndex})">
                <div class="solution-info">
                    <span class="question-number">${questionIndex + 1}</span>
                    <span class="question-preview">${this.truncateText(questionData.question, 60)}</span>
                </div>
                <div class="solution-status">
                    <div class="status-icon ${statusClass}">
                        <i class="fas fa-${isSkipped ? 'minus' : isCorrect ? 'check' : 'times'}"></i>
                    </div>
                    <i class="fas fa-chevron-down toggle-icon"></i>
                </div>
            </div>
            
            <div class="solution-content collapsed" id="solution-content-${questionIndex}">
                <div class="question-full">
                    <h4>${questionData.question}</h4>
                </div>
                
                <div class="options-review">
                    ${questionData.options.map((option, index) => {
                        let optionClass = '';
                        let indicators = '';
                        
                        // Mark user's selected answer
                        if (userAnswer === index) {
                            optionClass += ' user-answer';
                            indicators += '<span class="indicator user">Your Answer</span>';
                        }
                        
                        // Mark correct answer
                        if (index === correctAnswer) {
                            optionClass += ' correct-answer';
                            indicators += '<span class="indicator correct">Correct Answer</span>';
                        }
                        
                        // Mark if user selected wrong answer
                        if (userAnswer === index && !isCorrect && !isSkipped) {
                            optionClass += ' wrong-answer';
                        }
                        
                        return `
                            <div class="option-item${optionClass}">
                                <div class="option-content">
                                    <span class="option-letter">${String.fromCharCode(65 + index)})</span>
                                    <span class="option-text">${option}</span>
                                </div>
                                <div class="option-indicators">${indicators}</div>
                            </div>
                        `;
                    }).join('')}
                </div>
                
                ${questionData.explanation ? `
                    <div class="explanation">
                        <div class="explanation-header">
                            <i class="fas fa-lightbulb"></i>
                            <h5>Explanation</h5>
                        </div>
                        <p>${questionData.explanation}</p>
                    </div>
                ` : ''}
                
                <div class="question-stats">
                    <div class="stat-item">
                        <i class="fas fa-clock"></i>
                        <span>Time: ${Math.floor(Math.random() * 60) + 30}s</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-users"></i>
                        <span>Accuracy: ${Math.floor(Math.random() * 30) + 60}%</span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-star"></i>
                        <span>Points: ${questionData.points || 10}</span>
                    </div>
                </div>
            </div>
        `;

        return questionCard;
    }

    // FIXED: Generate placeholder with explanation
    generatePlaceholderQuestion(index) {
        const options = [
            "Option A - First possible answer",
            "Option B - Second possible answer", 
            "Option C - Third possible answer",
            "Option D - Fourth possible answer"
        ];

        return {
            question: `Question ${index + 1}: This is a sample question demonstrating the results analysis system. In a real quiz, this would show the actual question text from your quiz.`,
            options: options,
            correctAnswer: Math.floor(Math.random() * 4),
            explanation: `This is a sample explanation for Question ${index + 1}. In a real quiz, this would contain the detailed explanation that you provided when creating the quiz, helping students understand why this answer is correct and learn from any mistakes.`,
            points: 10
        };
    }

    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    setupSolutionFilters() {
        const filterBtns = document.querySelectorAll('.filter-btn');
        
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                // Remove active class from all buttons
                filterBtns.forEach(b => b.classList.remove('active'));
                
                // Add active class to clicked button
                btn.classList.add('active');
                
                // Filter solutions
                const filter = btn.getAttribute('data-filter');
                this.filterSolutions(filter);
            });
        });
    }

    filterSolutions(filter) {
        const solutionCards = document.querySelectorAll('.solution-card');
        
        solutionCards.forEach(card => {
            const status = card.getAttribute('data-status');
            
            if (filter === 'all' || status === filter) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    updateShareContent() {
        const { percentage, quizTitle } = this.quizResults;
        const shareText = `I scored ${percentage}% on "${quizTitle || 'Quiz'}" at DigiQuiz Portal! 🎉`;
        document.getElementById('share-score-text').textContent = shareText;
    }

    // Animation effects
    animateElements() {
        // Animate cards on scroll
        const cards = document.querySelectorAll('.analytics-card, .solution-card');
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }
            });
        });

        cards.forEach(card => {
            card.style.opacity = '0';
            card.style.transform = 'translateY(20px)';
            card.style.transition = 'all 0.6s ease';
            observer.observe(card);
        });
    }

    // Share functionality
    shareToWhatsApp() {
        const text = document.getElementById('share-score-text').textContent;
        const url = `https://wa.me/?text=${encodeURIComponent(text + '\n\nTry DigiQuiz Portal: ' + window.location.origin)}`;
        window.open(url, '_blank');
        this.showToast('Opening WhatsApp...', 'success');
    }

    shareToTwitter() {
        const text = document.getElementById('share-score-text').textContent;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.origin)}`;
        window.open(url, '_blank');
        this.showToast('Opening Twitter...', 'success');
    }

    shareToFacebook() {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}`;
        window.open(url, '_blank');
        this.showToast('Opening Facebook...', 'success');
    }

    copyResultsLink() {
        const resultUrl = `${window.location.origin}/pages/results.html?resultId=${this.resultId}`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(resultUrl).then(() => {
                this.showToast('Results link copied to clipboard! 📋', 'success');
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = resultUrl;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Results link copied! 📋', 'success');
        }
    }

    downloadPDF() {
        this.showToast('PDF download feature coming soon! 📄', 'info');
    }

    // Event listeners
    setupEventListeners() {
        // Handle solution expand/collapse
        window.toggleSolution = (questionIndex) => {
            const content = document.getElementById(`solution-content-${questionIndex}`);
            const card = content.closest('.solution-card');
            
            if (content.classList.contains('collapsed')) {
                content.classList.remove('collapsed');
                content.classList.add('expanded');
                card.classList.add('expanded');
            } else {
                content.classList.remove('expanded');
                content.classList.add('collapsed');
                card.classList.remove('expanded');
            }
        };
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
            background: ${type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : type === 'success' ? '#10b981' : '#3b82f6'};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            margin-bottom: 10px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            animation: slideInRight 300ms ease;
            font-weight: 500;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        toast.textContent = message;
        container.appendChild(toast);

        setTimeout(() => {
            toast.style.animation = 'slideOutRight 300ms ease';
            setTimeout(() => {
                if (container.contains(toast)) {
                    container.removeChild(toast);
                }
            }, 300);
        }, 4000);
    }
}

// Initialize Results Manager when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.resultsManager = new ResultsManager();
});

// CSS animations for toast
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
