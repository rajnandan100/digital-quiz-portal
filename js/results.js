// ===== RESULTS PAGE - COMPLETE FUNCTIONALITY =====

class ResultsManager {
    constructor() {
        this.currentUser = null;
        this.quizResults = null;
        this.quizData = null;
        this.chartInstances = {};
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
                this.loadResultsFromURL();
            } else {
                // Redirect to home if not authenticated
                window.location.href = '../index.html';
            }
        });

        // Setup event listeners
        this.setupEventListeners();
    }

    // Get results data from URL parameters or Firebase
    loadResultsFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const score = urlParams.get('score');
        const total = urlParams.get('total');
        const percentage = urlParams.get('percentage');
        
        this.showLoading(true);
        
        if (score && total && percentage) {
            // Create results object from URL parameters
            this.quizResults = {
                score: parseInt(score),
                total: parseInt(total),
                percentage: parseInt(percentage),
                timeTaken: 1112, // 18:32 in seconds
                quizId: 'gk-001',
                quizTitle: 'General Knowledge Challenge 2024',
                userName: this.currentUser?.displayName || 'User',
                userAnswers: this.generateSampleAnswers(total),
                correctAnswers: this.generateCorrectAnswers(total),
                questionTimings: this.generateQuestionTimings(total),
                categoryBreakdown: this.generateCategoryBreakdown()
            };
            
            setTimeout(() => {
                this.displayResults();
                this.showLoading(false);
            }, 1500);
        } else {
            // Load from Firebase (for future implementation)
            this.loadFromFirebase();
        }
    }

    generateSampleAnswers(totalQuestions) {
        const answers = {};
        const correctCount = Math.floor(totalQuestions * (this.quizResults?.percentage || 85) / 100);
        
        for (let i = 0; i < totalQuestions; i++) {
            if (i < correctCount) {
                answers[i] = Math.floor(Math.random() * 4); // Correct answers
            } else if (i < correctCount + 3) {
                answers[i] = Math.floor(Math.random() * 4); // Incorrect answers
            }
            // Rest are skipped (no entry in answers)
        }
        return answers;
    }

    generateCorrectAnswers(totalQuestions) {
        const correctAnswers = {};
        for (let i = 0; i < totalQuestions; i++) {
            correctAnswers[i] = Math.floor(Math.random() * 4);
        }
        return correctAnswers;
    }

    generateQuestionTimings(totalQuestions) {
        const timings = {};
        for (let i = 0; i < totalQuestions; i++) {
            timings[i] = Math.floor(Math.random() * 90) + 15; // 15-105 seconds
        }
        return timings;
    }

    generateCategoryBreakdown() {
        return {
            'Science': { correct: 5, total: 8 },
            'History': { correct: 3, total: 6 },
            'Geography': { correct: 4, total: 5 },
            'Mathematics': { correct: 3, total: 4 },
            'Literature': { correct: 2, total: 4 },
            'General Knowledge': { correct: 0, total: 3 }
        };
    }

    async loadFromFirebase() {
        try {
            // Implementation for loading from Firebase
            // This would fetch the latest quiz result for the current user
            this.showLoading(false);
        } catch (error) {
            console.error('Error loading results:', error);
            this.showLoading(false);
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
        
        // Add gradient definition to SVG
        const svg = circle.closest('svg');
        if (!svg.querySelector('defs')) {
            const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
            const gradient = document.createElementNS('http://www.w3.org/2000/svg', 'linearGradient');
            gradient.id = 'scoreGradient';
            gradient.setAttribute('x1', '0%');
            gradient.setAttribute('y1', '0%');
            gradient.setAttribute('x2', '100%');
            gradient.setAttribute('y2', '0%');
            
            const stop1 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop1.setAttribute('offset', '0%');
            stop1.setAttribute('stop-color', '#4F46E5');
            
            const stop2 = document.createElementNS('http://www.w3.org/2000/svg', 'stop');
            stop2.setAttribute('offset', '100%');
            stop2.setAttribute('stop-color', '#10b981');
            
            gradient.appendChild(stop1);
            gradient.appendChild(stop2);
            defs.appendChild(gradient);
            svg.appendChild(defs);
        }
        
        circle.style.strokeDasharray = circumference;
        circle.style.strokeDashoffset = circumference;
        
        setTimeout(() => {
            circle.style.strokeDashoffset = offset;
        }, 500);
    }

    updateBreakdownStats() {
        const { score, total } = this.quizResults;
        const incorrect = Object.keys(this.quizResults.userAnswers).length - score;
        const skipped = total - Object.keys(this.quizResults.userAnswers).length;
        
        document.getElementById('correct-count').textContent = score;
        document.getElementById('incorrect-count').textContent = incorrect;
        document.getElementById('skipped-count').textContent = skipped;
    }

    updateMetadata() {
        const timeTaken = this.formatTime(this.quizResults.timeTaken);
        const quizDate = new Date().toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'short', 
            day: 'numeric' 
        });
        
        document.getElementById('time-taken').textContent = timeTaken;
        document.getElementById('quiz-date').textContent = quizDate;
        document.getElementById('quiz-name').textContent = this.quizResults.quizTitle;
    }

    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    updateAnalyticsCards() {
        this.updateAccuracyCard();
        this.updateSpeedCard();
        this.createCategoryChart();
    }

    updateAccuracyCard() {
        const answered = Object.keys(this.quizResults.userAnswers).length;
        const accuracy = answered > 0 ? Math.round((this.quizResults.score / answered) * 100) : 0;
        
        document.getElementById('accuracy-percentage').textContent = `${accuracy}%`;
        document.getElementById('accuracy-meter').style.width = `${accuracy}%`;
    }

    updateSpeedCard() {
        const answered = Object.keys(this.quizResults.userAnswers).length;
        const totalTime = this.quizResults.timeTaken;
        const avgTime = answered > 0 ? Math.round(totalTime / answered) : 0;
        
        const timings = Object.values(this.quizResults.questionTimings);
        const fastestTime = Math.min(...timings);
        const slowestTime = Math.max(...timings);
        
        document.getElementById('avg-time').textContent = `${avgTime}s`;
        document.getElementById('fastest-time').textContent = `${fastestTime}s`;
        document.getElementById('slowest-time').textContent = this.formatTime(slowestTime);
    }

    createCategoryChart() {
        const ctx = document.getElementById('categoryChart');
        if (!ctx) return;
        
        const categories = Object.keys(this.quizResults.categoryBreakdown);
        const accuracies = categories.map(cat => {
            const data = this.quizResults.categoryBreakdown[cat];
            return data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0;
        });
        
        const colors = [
            '#4F46E5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'
        ];
        
        if (this.chartInstances.categoryChart) {
            this.chartInstances.categoryChart.destroy();
        }
        
        this.chartInstances.categoryChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: categories,
                datasets: [{
                    data: accuracies,
                    backgroundColor: colors,
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            padding: 20,
                            usePointStyle: true
                        }
                    }
                }
            }
        });
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
        const { categoryBreakdown, percentage } = this.quizResults;
        
        // Find strongest and weakest categories
        let strongest = { name: '', accuracy: 0 };
        let weakest = { name: '', accuracy: 100 };
        
        Object.entries(categoryBreakdown).forEach(([category, data]) => {
            if (data.total > 0) {
                const accuracy = (data.correct / data.total) * 100;
                if (accuracy > strongest.accuracy) {
                    strongest = { name: category, accuracy };
                }
                if (accuracy < weakest.accuracy && accuracy > 0) {
                    weakest = { name: category, accuracy };
                }
            }
        });
        
        // Update insights
        document.getElementById('strength-text').textContent = 
            `You excelled in ${strongest.name} with ${Math.round(strongest.accuracy)}% accuracy`;
        
        document.getElementById('improvement-text').textContent = 
            `Focus more on ${weakest.name} topics for better results`;
        
        // Time management insight
        const timeRemaining = (30 * 60) - this.quizResults.timeTaken;
        if (timeRemaining > 0) {
            document.getElementById('timing-text').textContent = 
                `Great time management! Finished with ${this.formatTime(timeRemaining)} remaining`;
        } else {
            document.getElementById('timing-text').textContent = 
                'Consider managing time better for future quizzes';
        }
    }

    loadQuestionSolutions() {
        const container = document.getElementById('solutions-container');
        const { total } = this.quizResults;
        
        // Update filter counts
        const answered = Object.keys(this.quizResults.userAnswers).length;
        const incorrect = answered - this.quizResults.score;
        const skipped = total - answered;
        
        document.getElementById('all-count').textContent = total;
        document.getElementById('correct-filter-count').textContent = this.quizResults.score;
        document.getElementById('incorrect-filter-count').textContent = incorrect;
        document.getElementById('skipped-filter-count').textContent = skipped;
        
        // Clear existing content
        container.innerHTML = '';
        
        // Generate question cards
        for (let i = 0; i < total; i++) {
            const questionCard = this.createQuestionCard(i);
            container.appendChild(questionCard);
        }
    }

    createQuestionCard(questionIndex) {
        const userAnswer = this.quizResults.userAnswers[questionIndex];
        const correctAnswer = this.quizResults.correctAnswers[questionIndex];
        const isSkipped = userAnswer === undefined;
        const isCorrect = userAnswer === correctAnswer;
        
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
        
        const questions = this.getSampleQuestions();
        const question = questions[questionIndex] || {
            text: `Sample Question ${questionIndex + 1}: This is a placeholder question for testing the quiz system functionality.`,
            options: [`Option A`, `Option B`, `Option C`, `Option D`],
            explanation: "This is a sample explanation for the question. In a real implementation, this would contain the actual explanation for the question."
        };
        
        questionCard.innerHTML = `
            <div class="solution-header" onclick="toggleSolution(${questionIndex})">
                <div class="solution-info">
                    <span class="question-number">Q${questionIndex + 1}</span>
                    <span class="question-preview">${this.truncateText(question.text, 80)}</span>
                </div>
                <div class="solution-status">
                    <div class="status-icon ${statusClass}">
                        <i class="fas fa-${status === 'correct' ? 'check' : status === 'incorrect' ? 'times' : 'minus'}"></i>
                    </div>
                    <i class="fas fa-chevron-down toggle-icon"></i>
                </div>
            </div>
            
            <div class="solution-content collapsed" id="solution-${questionIndex}">
                <div class="question-full">
                    <h4>${question.text}</h4>
                </div>
                
                <div class="options-review">
                    ${question.options.map((option, index) => {
                        let classes = 'option-item';
                        let indicators = '';
                        
                        if (userAnswer === index) {
                            classes += ' user-answer';
                            indicators += '<span class="indicator user">Your Answer</span>';
                        }
                        
                        if (correctAnswer === index) {
                            classes += ' correct-answer';
                            indicators += '<span class="indicator correct">Correct Answer</span>';
                        }
                        
                        return `
                            <div class="${classes}">
                                <input type="radio" ${userAnswer === index ? 'checked' : ''} disabled>
                                <span>${String.fromCharCode(65 + index)}) ${option}</span>
                                ${indicators ? `<div class="option-indicators">${indicators}</div>` : ''}
                            </div>
                        `;
                    }).join('')}
                </div>
                
                <div class="explanation">
                    <div class="explanation-header">
                        <i class="fas fa-info-circle"></i>
                        <h5>Explanation</h5>
                    </div>
                    <p>${question.explanation}</p>
                </div>
                
                <div class="question-stats">
                    <div class="stat-item">
                        <i class="fas fa-clock"></i>
                        <span>Your Time: <strong>${this.quizResults.questionTimings[questionIndex] || 0}s</strong></span>
                    </div>
                    <div class="stat-item">
                        <i class="fas fa-users"></i>
                        <span>${Math.floor(Math.random() * 30) + 60}% got this right</span>
                    </div>
                </div>
            </div>
        `;
        
        return questionCard;
    }

    getSampleQuestions() {
        return [
            {
                text: "What is the capital of Australia?",
                options: ["Sydney", "Melbourne", "Canberra", "Perth"],
                explanation: "Canberra is the capital city of Australia. While Sydney and Melbourne are larger cities, Canberra was specifically planned and built to serve as the national capital in 1908."
            },
            {
                text: "Who painted the Mona Lisa?",
                options: ["Vincent van Gogh", "Leonardo da Vinci", "Pablo Picasso", "Michelangelo"],
                explanation: "Leonardo da Vinci painted the Mona Lisa between 1503-1519. It's one of the most famous paintings in the world and is housed in the Louvre Museum in Paris."
            },
            {
                text: "What is the largest planet in our solar system?",
                options: ["Earth", "Mars", "Jupiter", "Saturn"],
                explanation: "Jupiter is the largest planet in our solar system. It's so massive that it could contain all the other planets combined and still have room left over."
            },
            // Add more sample questions as needed
        ];
    }

    truncateText(text, maxLength) {
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    animateElements() {
        // Animate trophy icon
        const trophy = document.getElementById('trophy-icon');
        if (trophy) {
            setTimeout(() => {
                trophy.style.animation = 'bounce 2s infinite';
            }, 500);
        }
        
        // Animate breakdown items
        const breakdownItems = document.querySelectorAll('.breakdown-item');
        breakdownItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, 1000 + (index * 200));
        });
    }

    setupEventListeners() {
        // Filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const filter = e.target.getAttribute('data-filter');
                this.filterQuestions(filter);
                
                // Update active state
                filterBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
            });
        });
        
        // Share button
        const shareBtn = document.querySelector('.share-btn');
        if (shareBtn) {
            shareBtn.addEventListener('click', () => this.showShareModal());
        }
    }

    filterQuestions(filter) {
        const questionCards = document.querySelectorAll('.solution-card');
        
        questionCards.forEach(card => {
            const status = card.getAttribute('data-status');
            
            if (filter === 'all' || status === filter) {
                card.style.display = 'block';
            } else {
                card.style.display = 'none';
            }
        });
    }

    showShareModal() {
        const modal = document.getElementById('share-modal');
        const sharePercentage = document.getElementById('share-percentage');
        sharePercentage.textContent = `${this.quizResults.percentage}%`;
        modal.classList.add('show');
    }

    closeShareModal() {
        const modal = document.getElementById('share-modal');
        modal.classList.remove('show');
    }

    shareToWhatsApp() {
        const text = `I scored ${this.quizResults.percentage}% in the ${this.quizResults.quizTitle}! 🎉 Try it yourself at ${window.location.origin}`;
        const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    }

    shareToTwitter() {
        const text = `I scored ${this.quizResults.percentage}% in the ${this.quizResults.quizTitle}! 🎉 #QuizChallenge`;
        const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(window.location.origin)}`;
        window.open(url, '_blank');
    }

    shareToFacebook() {
        const url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(window.location.origin)}`;
        window.open(url, '_blank');
    }

    copyResultLink() {
        const text = `I scored ${this.quizResults.percentage}% in the ${this.quizResults.quizTitle}! Check it out: ${window.location.origin}`;
        
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                this.showToast('Link copied to clipboard!', 'success');
            });
        } else {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showToast('Link copied to clipboard!', 'success');
        }
    }

    updateUserUI(user) {
        const userAvatar = document.getElementById('user-avatar');
        if (userAvatar && user) {
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
        toast.className = `toast ${type}`;
        
        const bgColor = {
            'info': '#4f46e5',
            'success': '#10b981',
            'warning': '#f59e0b',
            'error': '#ef4444'
        }[type] || '#4f46e5';
        
        toast.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${bgColor};
            color: white;
            padding: 16px 24px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            z-index: 10001;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
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
        }, 3000);
    }
}

// Global functions for HTML onclick handlers
function toggleSolution(questionIndex) {
    const solution = document.getElementById(`solution-${questionIndex}`);
    const card = solution.closest('.solution-card');
    
    if (solution.classList.contains('collapsed')) {
        solution.classList.remove('collapsed');
        solution.classList.add('expanded');
        card.classList.add('expanded');
    } else {
        solution.classList.add('collapsed');
        solution.classList.remove('expanded');
        card.classList.remove('expanded');
    }
}

function viewLeaderboard() {
    window.location.href = '../pages/leaderboard.html?quiz=gk-001';
}

function shareResults() {
    if (window.resultsManager) {
        window.resultsManager.showShareModal();
    }
}

function closeShareModal() {
    if (window.resultsManager) {
        window.resultsManager.closeShareModal();
    }
}

function shareToWhatsApp() {
    if (window.resultsManager) {
        window.resultsManager.shareToWhatsApp();
    }
}

function shareToTwitter() {
    if (window.resultsManager) {
        window.resultsManager.shareToTwitter();
    }
}

function shareToFacebook() {
    if (window.resultsManager) {
        window.resultsManager.shareToFacebook();
    }
}

function copyResultLink() {
    if (window.resultsManager) {
        window.resultsManager.copyResultLink();
    }
}

function downloadCertificate() {
    if (window.resultsManager) {
        window.resultsManager.showToast('Certificate download feature coming soon!', 'info');
    }
}

function retakeQuiz() {
    window.location.href = '../pages/quiz.html?id=gk-001';
}

function exploreQuizzes() {
    window.location.href = '../index.html#quizzes';
}

// Initialize results manager when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.resultsManager = new ResultsManager();
});
