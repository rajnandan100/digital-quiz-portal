// ===== ENHANCED ADMIN FEATURES - COMPLETE CORRECTED IMPLEMENTATION =====

console.log('Loading Enhanced Admin Features...');

// Global variables
let currentQuizzes = [];
let currentUsers = [];

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    console.log('Admin Features DOM loaded');
    
    // Add first question by default in quiz creation
    setTimeout(() => {
        if (document.getElementById('questionsList')) {
            addQuestion();
        }
    }, 500);
});

// ===== QUIZ MANAGEMENT FUNCTIONS =====

// Enhanced Load Quizzes with Better Display
async function loadQuizzes() {
    console.log('Loading quizzes...');
    const quizList = document.getElementById('quizList');
    
    if (!quizList) {
        console.log('Quiz list element not found');
        return;
    }

    // Show loading state
    quizList.innerHTML = `
        <div class="loading-message">
            <i class="fas fa-spinner fa-spin"></i>
            Loading quizzes...
        </div>
    `;

    try {
        if (typeof firebase === 'undefined' || !firebase.apps.length) {
            throw new Error('Firebase not initialized');
        }

        const quizzesRef = firebase.firestore().collection('quizzes');
        const snapshot = await quizzesRef.orderBy('createdAt', 'desc').get();

        currentQuizzes = [];

        if (snapshot.empty) {
            quizList.innerHTML = `
                <div class="no-quizzes">
                    <i class="fas fa-quiz"></i>
                    <h3>No quizzes found</h3>
                    <p>Start by creating your first quiz!</p>
                </div>
            `;
            return;
        }

        let quizHtml = '';
        snapshot.forEach((doc) => {
            const quiz = { id: doc.id, ...doc.data() };
            currentQuizzes.push(quiz);

            const createdDate = quiz.createdAt ? 
                quiz.createdAt.toDate().toLocaleDateString() : 
                'Unknown date';

            const statusColor = quiz.status === 'active' ? '#10b981' : '#f59e0b';
            const statusIcon = quiz.status === 'active' ? 'play' : 'pause';

            quizHtml += `
                <div class="quiz-card" data-quiz-id="${quiz.id}">
                    <div class="quiz-header">
                        <div class="quiz-title">
                            <h3>${quiz.title}</h3>
                            <span class="quiz-status" style="color: ${statusColor}">
                                <i class="fas fa-${statusIcon}"></i> 
                                ${quiz.status || 'active'}
                            </span>
                        </div>
                        <div class="quiz-actions">
                            <button class="action-btn preview" onclick="previewQuiz('${quiz.id}')" title="Preview">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-btn edit" onclick="editQuiz('${quiz.id}')" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-btn duplicate" onclick="duplicateQuiz('${quiz.id}')" title="Duplicate">
                                <i class="fas fa-copy"></i>
                            </button>
                            <button class="action-btn export" onclick="exportQuiz('${quiz.id}')" title="Export">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="action-btn stats" onclick="viewQuizStats('${quiz.id}')" title="Statistics">
                                <i class="fas fa-chart-bar"></i>
                            </button>
                            <button class="action-btn toggle" onclick="toggleQuizStatus('${quiz.id}')" title="Toggle Status">
                                <i class="fas fa-${quiz.status === 'active' ? 'pause' : 'play'}"></i>
                            </button>
                        </div>
                    </div>
                    <div class="quiz-meta">
                        <div class="quiz-description">
                            ${quiz.description || 'No description provided'}
                        </div>
                        <div class="quiz-stats">
                            <span><i class="fas fa-question-circle"></i> ${quiz.questions?.length || 0} questions</span>
                            <span><i class="fas fa-clock"></i> ${quiz.timeLimit || 30} minutes</span>
                            <span><i class="fas fa-tag"></i> ${quiz.category || 'general'}</span>
                            <span><i class="fas fa-calendar"></i> ${createdDate}</span>
                        </div>
                    </div>
                </div>
            `;
        });

        quizList.innerHTML = quizHtml;
        console.log(`Loaded ${currentQuizzes.length} quizzes`);

    } catch (error) {
        console.error('Error loading quizzes:', error);
        quizList.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle"></i>
                <h3>Error loading quizzes</h3>
                <p>${error.message}</p>
                <button onclick="loadQuizzes()" class="retry-btn">
                    <i class="fas fa-redo"></i> Try again
                </button>
            </div>
        `;
    }
}

// Search and filter quizzes
function searchQuizzes() {
    const searchTerm = document.getElementById('quizSearch')?.value.toLowerCase() || '';
    const filterStatus = document.getElementById('statusFilter')?.value || 'all';
    
    const filteredQuizzes = currentQuizzes.filter(quiz => {
        const matchesSearch = quiz.title.toLowerCase().includes(searchTerm) ||
                            (quiz.description && quiz.description.toLowerCase().includes(searchTerm));
        
        const matchesStatus = filterStatus === 'all' || quiz.status === filterStatus;
        
        return matchesSearch && matchesStatus;
    });

    displayFilteredQuizzes(filteredQuizzes);
}

function displayFilteredQuizzes(quizzes) {
    const quizList = document.getElementById('quizList');
    
    if (quizzes.length === 0) {
        quizList.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search"></i>
                <h3>No quizzes found</h3>
                <p>Try adjusting your search criteria</p>
            </div>
        `;
        return;
    }

    let quizHtml = '';
    quizzes.forEach(quiz => {
        const createdDate = quiz.createdAt ? 
            quiz.createdAt.toDate().toLocaleDateString() : 
            'Unknown date';

        const statusColor = quiz.status === 'active' ? '#10b981' : '#f59e0b';
        const statusIcon = quiz.status === 'active' ? 'play' : 'pause';

        quizHtml += `
            <div class="quiz-card" data-quiz-id="${quiz.id}">
                <div class="quiz-header">
                    <div class="quiz-title">
                        <h3>${quiz.title}</h3>
                        <span class="quiz-status" style="color: ${statusColor}">
                            <i class="fas fa-${statusIcon}"></i> 
                            ${quiz.status || 'active'}
                        </span>
                    </div>
                    <div class="quiz-actions">
                        <button class="action-btn preview" onclick="previewQuiz('${quiz.id}')" title="Preview">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="action-btn edit" onclick="editQuiz('${quiz.id}')" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="action-btn duplicate" onclick="duplicateQuiz('${quiz.id}')" title="Duplicate">
                            <i class="fas fa-copy"></i>
                        </button>
                        <button class="action-btn export" onclick="exportQuiz('${quiz.id}')" title="Export">
                            <i class="fas fa-download"></i>
                        </button>
                        <button class="action-btn stats" onclick="viewQuizStats('${quiz.id}')" title="Statistics">
                            <i class="fas fa-chart-bar"></i>
                        </button>
                        <button class="action-btn toggle" onclick="toggleQuizStatus('${quiz.id}')" title="Toggle Status">
                            <i class="fas fa-${quiz.status === 'active' ? 'pause' : 'play'}"></i>
                        </button>
                    </div>
                </div>
                <div class="quiz-meta">
                    <div class="quiz-description">
                        ${quiz.description || 'No description provided'}
                    </div>
                    <div class="quiz-stats">
                        <span><i class="fas fa-question-circle"></i> ${quiz.questions?.length || 0} questions</span>
                        <span><i class="fas fa-clock"></i> ${quiz.timeLimit || 30} minutes</span>
                        <span><i class="fas fa-tag"></i> ${quiz.category || 'general'}</span>
                        <span><i class="fas fa-calendar"></i> ${createdDate}</span>
                    </div>
                </div>
            </div>
        `;
    });

    quizList.innerHTML = quizHtml;
}

// Handle search input with debounce
let searchTimeout;
function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(searchQuizzes, 300);
}

// Bulk operations
function selectAllQuizzes() {
    const checkboxes = document.querySelectorAll('.quiz-checkbox');
    const selectAllBtn = document.getElementById('selectAll');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = selectAllBtn.checked;
    });
    
    updateBulkOperations();
}

function updateBulkOperations() {
    const selectedQuizzes = document.querySelectorAll('.quiz-checkbox:checked');
    const bulkActions = document.getElementById('bulkActions');
    
    if (selectedQuizzes.length > 0) {
        bulkActions.style.display = 'flex';
        document.getElementById('selectedCount').textContent = selectedQuizzes.length;
    } else {
        bulkActions.style.display = 'none';
    }
}

// Handle no results
function showNoResults(message) {
    const quizList = document.getElementById('quizList');
    const noResultsMsg = document.createElement('div');
    noResultsMsg.className = 'no-results-message';
    noResultsMsg.innerHTML = `
        <div class="no-results-content">
            <i class="fas fa-search"></i>
            <h3>No quizzes found</h3>
            <p>${message}</p>
            <p>Try adjusting your search criteria</p>
        </div>
    `;
    quizList.appendChild(noResultsMsg);
}

// ===== ENHANCED ADMIN CONTROL FUNCTIONS =====

// Toggle quiz active/inactive status
async function toggleQuizStatus(quizId) {
    try {
        const quizRef = firebase.firestore().collection('quizzes').doc(quizId);
        const doc = await quizRef.get();
        
        if (doc.exists) {
            const currentStatus = doc.data().status || 'active';
            const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
            
            await quizRef.update({
                status: newStatus,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            alert(`✅ Quiz ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
            loadQuizzes(); // Refresh the list
        }
    } catch (error) {
        console.error('Error toggling quiz status:', error);
        alert('❌ Error updating quiz status. Please try again.');
    }
}

// Preview quiz function
async function previewQuiz(quizId) {
    try {
        const doc = await firebase.firestore().collection('quizzes').doc(quizId).get();
        
        if (doc.exists) {
            const quiz = doc.data();
            const questions = quiz.questions || [];
            
            let previewText = `📋 QUIZ PREVIEW\n\n`;
            previewText += `Title: ${quiz.title}\n`;
            previewText += `Category: ${quiz.category}\n`;
            previewText += `Difficulty: ${quiz.difficulty}\n`;
            previewText += `Time Limit: ${quiz.timeLimit} minutes\n`;
            previewText += `Total Questions: ${questions.length}\n`;
            previewText += `Status: ${quiz.status || 'active'}\n\n`;
            
            if (questions.length > 0) {
                previewText += `SAMPLE QUESTIONS:\n\n`;
                questions.slice(0, 3).forEach((q, index) => {
                    previewText += `${index + 1}. ${q.question}\n`;
                    if (q.options) {
                        q.options.forEach((opt, i) => {
                            const marker = i === q.correctAnswer ? '✅' : ' ';
                            previewText += `${marker} ${String.fromCharCode(65 + i)}) ${opt}\n`;
                        });
                    }
                    if (q.explanation) {
                        previewText += `💡 Explanation: ${q.explanation}\n`;
                    }
                    previewText += `Points: ${q.points || 10}\n\n`;
                });
                
                if (questions.length > 3) {
                    previewText += `... and ${questions.length - 3} more questions`;
                }
            }
            
            alert(previewText);
        }
    } catch (error) {
        console.error('Error previewing quiz:', error);
        alert('❌ Error loading quiz preview.');
    }
}

// Duplicate quiz function
async function duplicateQuiz(quizId) {
    if (!confirm('🔄 Create a copy of this quiz?')) return;
    
    try {
        const quizRef = firebase.firestore().collection('quizzes').doc(quizId);
        const doc = await quizRef.get();
        
        if (doc.exists) {
            const originalQuiz = doc.data();
            const duplicatedQuiz = {
                ...originalQuiz,
                title: `${originalQuiz.title} (Copy)`,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'active'
            };
            
            const newDocRef = await firebase.firestore().collection('quizzes').add(duplicatedQuiz);
            
            alert(`✅ Quiz duplicated successfully!\n\nNew Quiz: "${duplicatedQuiz.title}"\nID: ${newDocRef.id}`);
            loadQuizzes(); // Refresh the list
        }
    } catch (error) {
        console.error('Error duplicating quiz:', error);
        alert('❌ Error duplicating quiz. Please try again.');
    }
}

// Export quiz function
async function exportQuiz(quizId) {
    try {
        const doc = await firebase.firestore().collection('quizzes').doc(quizId).get();
        
        if (doc.exists) {
            const quizData = doc.data();
            const exportData = {
                ...quizData,
                exportedAt: new Date().toISOString(),
                exportedBy: 'Admin',
                quizId: quizId
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `${quizData.title || 'quiz'}-${quizId}.json`;
            link.click();
            
            alert('✅ Quiz exported successfully!');
        }
    } catch (error) {
        console.error('Error exporting quiz:', error);
        alert('❌ Error exporting quiz. Please try again.');
    }
}

// View quiz statistics
async function viewQuizStats(quizId) {
    try {
        // Get quiz data
        const quizDoc = await firebase.firestore().collection('quizzes').doc(quizId).get();
        if (!quizDoc.exists) {
            alert('Quiz not found');
            return;
        }
        
        const quiz = quizDoc.data();
        
        // Get quiz results
        const resultsSnapshot = await firebase.firestore()
            .collection('quizResults')
            .where('quizId', '==', quizId)
            .get();
            
        const results = [];
        resultsSnapshot.forEach(doc => {
            results.push(doc.data());
        });
        
        // Calculate statistics
        const totalAttempts = results.length;
        const scores = results.map(r => r.percentage || r.score || 0);
        const averageScore = totalAttempts > 0 ? (scores.reduce((a, b) => a + b, 0) / totalAttempts).toFixed(1) : 0;
        const highestScore = totalAttempts > 0 ? Math.max(...scores) : 0;
        const lowestScore = totalAttempts > 0 ? Math.min(...scores) : 0;
        
        let statsText = `📊 QUIZ STATISTICS\n\n`;
        statsText += `Quiz: ${quiz.title}\n`;
        statsText += `Total Attempts: ${totalAttempts}\n`;
        statsText += `Average Score: ${averageScore}%\n`;
        statsText += `Highest Score: ${highestScore}%\n`;
        statsText += `Lowest Score: ${lowestScore}%\n`;
        statsText += `Total Questions: ${quiz.questions?.length || 0}\n`;
        statsText += `Status: ${quiz.status || 'active'}\n`;
        
        if (totalAttempts > 0) {
            statsText += `\n📈 RECENT ATTEMPTS:\n`;
            results.slice(0, 5).forEach((result, index) => {
                const date = result.completedAt ? 
                    new Date(result.completedAt.toDate()).toLocaleDateString() : 
                    'Unknown';
                const score = result.percentage || result.score || 0;
                statsText += `${index + 1}. Score: ${score}% - ${date}\n`;
            });
        }
        
        alert(statsText);
    } catch (error) {
        console.error('Error loading quiz stats:', error);
        alert('❌ Error loading quiz statistics.');
    }
}

// ===== QUIZ CREATION FUNCTIONS =====

// Switch between upload tabs
function switchUploadTab(tabName) {
    // Hide all tabs
    document.getElementById('manual-upload').style.display = 'none';
    document.getElementById('json-upload').style.display = 'none';
    
    // Remove active class from all buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab and activate button
    document.getElementById(tabName + '-upload').style.display = 'block';
    document.querySelector(`[onclick="switchUploadTab('${tabName}')"]`).classList.add('active');
}

// Add question to manual creation (WITH EXPLANATIONS)
function addQuestion() {
    const questionsList = document.getElementById('questionsList');
    const questionNumber = questionsList.children.length + 1;
    
    const questionHtml = `
        <div class="question-item" id="question-${questionNumber}">
            <div class="question-header">
                <h4>Question ${questionNumber}</h4>
                <button type="button" class="remove-question-btn" onclick="removeQuestion(${questionNumber})">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
            
            <div class="form-group">
                <label for="question-text-${questionNumber}" class="required">Question Text:</label>
                <textarea 
                    id="question-text-${questionNumber}" 
                    name="question-text-${questionNumber}" 
                    placeholder="Enter your question here..." 
                    required
                    rows="3"
                ></textarea>
            </div>

            <div class="form-group">
                <label class="required">Answer Options:</label>
                <div class="options-container">
                    <div class="option-input">
                        <input type="text" name="option-${questionNumber}-1" placeholder="Option A" required>
                        <input type="radio" name="correct-${questionNumber}" value="0" required>
                        <label>Correct</label>
                    </div>
                    <div class="option-input">
                        <input type="text" name="option-${questionNumber}-2" placeholder="Option B" required>
                        <input type="radio" name="correct-${questionNumber}" value="1" required>
                        <label>Correct</label>
                    </div>
                    <div class="option-input">
                        <input type="text" name="option-${questionNumber}-3" placeholder="Option C" required>
                        <input type="radio" name="correct-${questionNumber}" value="2" required>
                        <label>Correct</label>
                    </div>
                    <div class="option-input">
                        <input type="text" name="option-${questionNumber}-4" placeholder="Option D" required>
                        <input type="radio" name="correct-${questionNumber}" value="3" required>
                        <label>Correct</label>
                    </div>
                </div>
            </div>

            <!-- ✅ EXPLANATION FIELD - MANDATORY -->
            <div class="form-group">
                <label for="explanation-${questionNumber}" class="required">Explanation:</label>
                <textarea 
                    id="explanation-${questionNumber}" 
                    name="explanation-${questionNumber}" 
                    placeholder="Provide a detailed explanation for the correct answer. This will help students understand the topic better." 
                    required
                    rows="4"
                ></textarea>
                <small class="help-text">
                    <i class="fas fa-info-circle"></i> 
                    Write a clear explanation that helps students understand why this is the correct answer and learn from any mistakes.
                </small>
            </div>

            <div class="form-group">
                <label for="points-${questionNumber}">Points:</label>
                <input 
                    type="number" 
                    id="points-${questionNumber}" 
                    name="points-${questionNumber}" 
                    value="10" 
                    min="1" 
                    max="100"
                >
            </div>
        </div>
    `;
    
    questionsList.insertAdjacentHTML('beforeend', questionHtml);
    
    // Update question counter
    updateQuestionCounter();
}

// Remove question
function removeQuestion(questionNumber) {
    if (confirm('Are you sure you want to remove this question?')) {
        const questionItem = document.getElementById(`question-${questionNumber}`);
        if (questionItem) {
            questionItem.remove();
            renumberQuestions();
            updateQuestionCounter();
        }
    }
}

// Renumber questions after removal
function renumberQuestions() {
    const questionItems = document.querySelectorAll('.question-item');
    questionItems.forEach((item, index) => {
        const newNumber = index + 1;
        item.id = `question-${newNumber}`;
        
        // Update question header
        const header = item.querySelector('h4');
        if (header) header.textContent = `Question ${newNumber}`;
        
        // Update remove button onclick
        const removeBtn = item.querySelector('.remove-question-btn');
        if (removeBtn) removeBtn.setAttribute('onclick', `removeQuestion(${newNumber})`);
        
        // Update all form field names and IDs
        const fields = item.querySelectorAll('input, textarea, select');
        fields.forEach(field => {
            const name = field.name;
            const id = field.id;
            
            if (name) {
                field.name = name.replace(/question-\d+/, `question-${newNumber}`)
                                .replace(/option-\d+-/, `option-${newNumber}-`)
                                .replace(/correct-\d+/, `correct-${newNumber}`)
                                .replace(/explanation-\d+/, `explanation-${newNumber}`)
                                .replace(/points-\d+/, `points-${newNumber}`);
            }
            
            if (id) {
                field.id = id.replace(/question-text-\d+/, `question-text-${newNumber}`)
                            .replace(/explanation-\d+/, `explanation-${newNumber}`)
                            .replace(/points-\d+/, `points-${newNumber}`);
            }
        });
        
        // Update labels
        const labels = item.querySelectorAll('label[for]');
        labels.forEach(label => {
            const forAttr = label.getAttribute('for');
            if (forAttr) {
                label.setAttribute('for', forAttr.replace(/\d+/, newNumber));
            }
        });
    });
}

// Update question counter
function updateQuestionCounter() {
    const count = document.querySelectorAll('.question-item').length;
    const counter = document.getElementById('questionCount');
    if (counter) {
        counter.textContent = `${count} question${count !== 1 ? 's' : ''}`;
    }
}

// Collect quiz data with explanations
function collectQuizData() {
    const form = document.getElementById('quizCreationForm');
    const formData = new FormData(form);
    
    // Get basic quiz info
    const quizData = {
        title: formData.get('quiz-title')?.trim(),
        description: formData.get('quiz-description')?.trim(),
        category: formData.get('quiz-category'),
        difficulty: formData.get('quiz-difficulty'),
        timeLimit: parseInt(formData.get('quiz-time-limit')) || 30,
        status: 'active',
        questions: [],
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
        createdBy: firebase.auth().currentUser?.uid
    };

    // Validate basic info
    if (!quizData.title || !quizData.description) {
        throw new Error('Please fill in all required quiz information');
    }

    // Collect questions with explanations
    const questionItems = document.querySelectorAll('.question-item');
    
    if (questionItems.length === 0) {
        throw new Error('Please add at least one question');
    }

    questionItems.forEach((questionItem, index) => {
        const questionNum = index + 1;
        
        // Get question text
        const questionText = formData.get(`question-text-${questionNum}`)?.trim();
        if (!questionText) {
            throw new Error(`Question ${questionNum}: Question text is required`);
        }

        // Get options
        const options = [
            formData.get(`option-${questionNum}-1`)?.trim(),
            formData.get(`option-${questionNum}-2`)?.trim(),
            formData.get(`option-${questionNum}-3`)?.trim(),
            formData.get(`option-${questionNum}-4`)?.trim()
        ];

        // Validate options
        if (options.some(option => !option)) {
            throw new Error(`Question ${questionNum}: All four options are required`);
        }

        // Get correct answer
        const correctAnswer = parseInt(formData.get(`correct-${questionNum}`));
        if (isNaN(correctAnswer)) {
            throw new Error(`Question ${questionNum}: Please select the correct answer`);
        }

        // ✅ Get explanation - MANDATORY
        const explanation = formData.get(`explanation-${questionNum}`)?.trim();
        if (!explanation) {
            throw new Error(`Question ${questionNum}: Explanation is required`);
        }

        // Get points
        const points = parseInt(formData.get(`points-${questionNum}`)) || 10;

        // Add complete question object
        quizData.questions.push({
            question: questionText,
            options: options,
            correctAnswer: correctAnswer,
            explanation: explanation, // ✅ MANDATORY FIELD
            points: points
        });
    });

    return quizData;
}

// Enhanced create manual quiz function
async function createManualQuiz() {
    console.log('Creating manual quiz...');
    
    try {
        // Collect and validate quiz data
        const quizData = collectQuizData();
        
        console.log('Quiz data collected:', quizData);

        // Show loading state
        const submitBtn = document.querySelector('.submit-quiz-btn');
        if (!submitBtn) {
            console.error('Submit button not found');
            return;
        }

        const originalText = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating Quiz...';
        submitBtn.disabled = true;

        // Save to Firebase
        const docRef = await firebase.firestore()
            .collection('quizzes')
            .add(quizData);

        console.log('Quiz created successfully with ID:', docRef.id);

        // Show success message
        alert(`✅ Quiz created successfully!\n\nQuiz ID: ${docRef.id}\nTitle: ${quizData.title}\nQuestions: ${quizData.questions.length}\nAll questions include explanations!`);

        // Reset form
        document.getElementById('quizCreationForm').reset();
        document.getElementById('questionsList').innerHTML = '';
        
        // Add first question again
        addQuestion();

        // Refresh quiz list if visible
        if (typeof loadQuizzes === 'function') {
            loadQuizzes();
        }

    } catch (error) {
        console.error('Error creating quiz:', error);
        alert(`❌ Error creating quiz:\n\n${error.message}\n\nPlease check all required fields and try again.`);
    } finally {
        // Restore button
        const submitBtn = document.querySelector('.submit-quiz-btn');
        if (submitBtn) {
            submitBtn.innerHTML = 'Create Quiz';
            submitBtn.disabled = false;
        }
    }
}

// ✅ FIXED: Upload JSON quiz with explanation validation
async function uploadJsonQuiz() {
    const jsonInput = document.getElementById('jsonQuizData');
    
    if (!jsonInput) {
        alert('❌ JSON input field not found');
        return;
    }

    const jsonData = jsonInput.value.trim();
    
    if (!jsonData) {
        alert('Please enter quiz JSON data');
        return;
    }
    
    try {
        const quizData = JSON.parse(jsonData);
        
        // Validate required fields
        if (!quizData.title || !quizData.questions || !Array.isArray(quizData.questions)) {
            throw new Error('Invalid quiz format. Title and questions array are required.');
        }

        // ✅ Validate each question has explanation
        for (let i = 0; i < quizData.questions.length; i++) {
            const question = quizData.questions[i];
            
            if (!question.explanation || question.explanation.trim() === '') {
                throw new Error(`Question ${i + 1}: Explanation is required for all questions.`);
            }
            
            // Also validate other required fields
            if (!question.question || question.question.trim() === '') {
                throw new Error(`Question ${i + 1}: Question text is required.`);
            }
            if (!question.options || !Array.isArray(question.options) || question.options.length < 4) {
                throw new Error(`Question ${i + 1}: Must have at least 4 options.`);
            }
            if (question.correctAnswer === undefined || question.correctAnswer === null) {
                throw new Error(`Question ${i + 1}: Correct answer is required.`);
            }
            if (question.correctAnswer < 0 || question.correctAnswer >= question.options.length) {
                throw new Error(`Question ${i + 1}: Correct answer index is invalid.`);
            }
        }
        
        // Show loading state
        const uploadBtn = document.querySelector('.upload-json-btn') || document.querySelector('button[onclick="uploadJsonQuiz()"]');
        let originalText = 'Upload Quiz';
        
        if (uploadBtn) {
            originalText = uploadBtn.innerHTML;
            uploadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uploading...';
            uploadBtn.disabled = true;
        }
        
        // Add metadata
        quizData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        quizData.createdBy = firebase.auth().currentUser?.uid;
        quizData.status = quizData.status || 'active';
        
        // Save to Firebase
        const docRef = await firebase.firestore()
            .collection('quizzes')
            .add(quizData);
            
        alert(`✅ Quiz uploaded successfully!\n\nQuiz ID: ${docRef.id}\nTitle: ${quizData.title}\nQuestions: ${quizData.questions.length}\nAll questions include explanations!`);
        
        // Clear form
        jsonInput.value = '';
        
        // Refresh quiz list
        if (typeof loadQuizzes === 'function') {
            loadQuizzes();
        }
        
    } catch (error) {
        console.error('Error uploading quiz:', error);
        let errorMessage = error.message;
        
        // Provide helpful error messages
        if (error.message.includes('JSON')) {
            errorMessage = 'Invalid JSON format. Please check your JSON syntax.';
        }
        
        alert(`❌ Error uploading quiz:\n\n${errorMessage}`);
    } finally {
        // Restore button
        const uploadBtn = document.querySelector('.upload-json-btn') || document.querySelector('button[onclick="uploadJsonQuiz()"]');
        if (uploadBtn) {
            uploadBtn.innerHTML = 'Upload Quiz';
            uploadBtn.disabled = false;
        }
    }
}

// ===== USER MANAGEMENT FUNCTIONS =====

// Load users
async function loadUsers() {
    const usersList = document.getElementById('usersList');
    
    if (!usersList) return;
    
    try {
        const usersSnapshot = await firebase.firestore().collection('users').get();
        currentUsers = [];
        
        let usersHtml = `
            <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Joined</th>
                <th>Quizzes Taken</th>
                <th>Status</th>
                <th>Actions</th>
            </tr>
        `;
        
        usersSnapshot.forEach(doc => {
            const user = { id: doc.id, ...doc.data() };
            currentUsers.push(user);
            
            const joinDate = user.createdAt ? 
                user.createdAt.toDate().toLocaleDateString() : 
                'Unknown';
                
            usersHtml += `
                <tr>
                    <td>${user.displayName || 'N/A'}</td>
                    <td>${user.email}</td>
                    <td>${joinDate}</td>
                    <td>${user.quizzesTaken || 0}</td>
                    <td>
                        <span class="status ${user.status || 'active'}">
                            ${user.status || 'active'}
                        </span>
                    </td>
                    <td>
                        <button onclick="viewUserDetails('${user.id}')" class="btn-sm">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        
        usersList.innerHTML = usersHtml;
        
    } catch (error) {
        console.error('Error loading users:', error);
        usersList.innerHTML = '<tr><td colspan="6">Error loading users</td></tr>';
    }
}

// ===== UTILITY FUNCTIONS =====

// Initialize admin features when page loads
if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
        // Auto-load quizzes if on quiz management tab
        if (document.getElementById('quizList')) {
            loadQuizzes();
        }
        
        // Auto-load users if on user management tab
        if (document.getElementById('usersList')) {
            loadUsers();
        }
    });
}

console.log('Enhanced Admin Features with Complete Functionality loaded successfully!');
