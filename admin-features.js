// Admin Features - Complete Implementation
console.log('Loading Admin Features...');

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

// Quiz Management Functions
async function loadQuizzes() {
    console.log('Loading quizzes...');
    const quizList = document.getElementById('quizList');
    
    if (!quizList) {
        console.log('Quiz list element not found');
        return;
    }
    
    quizList.innerHTML = '<div class="loading-message"><i class="fas fa-spinner fa-spin"></i> Loading quizzes...</div>';
    
    try {
        if (typeof firebase === 'undefined' || !firebase.apps.length) {
            throw new Error('Firebase not initialized');
        }
        
        const quizzesRef = firebase.firestore().collection('quizzes');
        const snapshot = await quizzesRef.get();
        
        currentQuizzes = [];
        
        if (snapshot.empty) {
            quizList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-question-circle" style="font-size: 48px; color: #ddd; margin-bottom: 15px;"></i>
                    <h3>No quizzes found</h3>
                    <p>Start by creating your first quiz!</p>
                    <button onclick="switchSection('quiz-upload')" class="btn-primary">
                        <i class="fas fa-plus"></i> Create Quiz
                    </button>
                </div>
            `;
            return;
        }
        
        let quizzesHtml = '';
        snapshot.forEach(doc => {
            const quiz = doc.data();
            currentQuizzes.push({ id: doc.id, ...quiz });
            
            quizzesHtml += `
                <div class="quiz-item">
                    <div class="quiz-info">
                        <h3>${quiz.title || 'Untitled Quiz'}</h3>
                        <p>Category: ${quiz.category || 'Unknown'} | Questions: ${quiz.questions?.length || 0} | Difficulty: ${quiz.difficulty || 'Medium'}</p>
                        <small>Created: ${quiz.createdAt ? new Date(quiz.createdAt.toDate()).toLocaleDateString() : 'Unknown'}</small>
                    </div>
                    <div class="quiz-actions">
                        <button class="btn-sm btn-primary" onclick="editQuiz('${doc.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-sm btn-success" onclick="viewQuizStats('${doc.id}')">
                            <i class="fas fa-chart-bar"></i> Stats
                        </button>
                        <button class="btn-sm btn-danger" onclick="deleteQuiz('${doc.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        });
        
        quizList.innerHTML = quizzesHtml;
        console.log(`Loaded ${currentQuizzes.length} quizzes`);
        
    } catch (error) {
        console.error('Error loading quizzes:', error);
        quizList.innerHTML = `
            <div class="error-message">
                <i class="fas fa-exclamation-triangle" style="color: #dc2626; margin-right: 10px;"></i>
                Unable to load quizzes. ${error.message}
            </div>
        `;
    }
}

function filterQuizzes() {
    const categoryFilter = document.getElementById('categoryFilter')?.value;
    const searchTerm = document.getElementById('searchQuiz')?.value.toLowerCase();
    
    console.log('Filtering quizzes:', { categoryFilter, searchTerm });
    
    const filteredQuizzes = currentQuizzes.filter(quiz => {
        const matchesCategory = !categoryFilter || quiz.category === categoryFilter;
        const matchesSearch = !searchTerm || quiz.title.toLowerCase().includes(searchTerm);
        return matchesCategory && matchesSearch;
    });
    
    displayFilteredQuizzes(filteredQuizzes);
}

function displayFilteredQuizzes(quizzes) {
    const quizList = document.getElementById('quizList');
    if (!quizList) return;
    
    if (quizzes.length === 0) {
        quizList.innerHTML = '<div class="empty-state"><p>No quizzes match your filters</p></div>';
        return;
    }
    
    let quizzesHtml = '';
    quizzes.forEach(quiz => {
        quizzesHtml += `
            <div class="quiz-item">
                <div class="quiz-info">
                    <h3>${quiz.title || 'Untitled Quiz'}</h3>
                    <p>Category: ${quiz.category || 'Unknown'} | Questions: ${quiz.questions?.length || 0} | Difficulty: ${quiz.difficulty || 'Medium'}</p>
                </div>
                <div class="quiz-actions">
                    <button class="btn-sm btn-primary" onclick="editQuiz('${quiz.id}')">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn-sm btn-success" onclick="viewQuizStats('${quiz.id}')">
                        <i class="fas fa-chart-bar"></i> Stats
                    </button>
                    <button class="btn-sm btn-danger" onclick="deleteQuiz('${quiz.id}')">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    });
    
    quizList.innerHTML = quizzesHtml;
}

function editQuiz(quizId) {
    console.log('Editing quiz:', quizId);
    alert('Quiz editing feature will be available soon!');
}

function viewQuizStats(quizId) {
    console.log('Viewing stats for quiz:', quizId);
    alert('Quiz statistics feature will be available soon!');
}

async function deleteQuiz(quizId) {
    if (!confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
        return;
    }
    
    try {
        await firebase.firestore().collection('quizzes').doc(quizId).delete();
        console.log('Quiz deleted:', quizId);
        alert('Quiz deleted successfully!');
        loadQuizzes(); // Refresh the list
    } catch (error) {
        console.error('Error deleting quiz:', error);
        alert('Error deleting quiz. Please try again.');
    }
}

// Quiz Upload Functions
function switchUploadTab(tabName) {
    console.log('Switching to tab:', tabName);
    
    // Remove active class from all tabs
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.upload-tab').forEach(tab => tab.classList.remove('active'));
    
    // Add active class to selected tab
    const tabButton = document.querySelector(`[onclick="switchUploadTab('${tabName}')"]`);
    const tabContent = document.getElementById(`${tabName}-upload`);
    
    if (tabButton) tabButton.classList.add('active');
    if (tabContent) tabContent.classList.add('active');
}

function addQuestion() {
    const questionsList = document.getElementById('questionsList');
    if (!questionsList) {
        console.log('Questions list not found');
        return;
    }
    
    const questionCount = questionsList.children.length + 1;
    console.log('Adding question:', questionCount);
    
    const questionHtml = `
        <div class="question-item" id="question-${questionCount}">
            <div class="question-header">
                <h4>Question ${questionCount}</h4>
                <button type="button" onclick="removeQuestion(${questionCount})" class="btn-sm btn-danger">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
            
            <div class="form-group">
                <label>Question Text *</label>
                <input type="text" name="question_${questionCount}" required placeholder="Enter your question">
            </div>
            
            <div class="options-grid">
                <div class="form-group">
                    <label>Option A *</label>
                    <input type="text" name="option_${questionCount}_0" required placeholder="Option A">
                </div>
                <div class="form-group">
                    <label>Option B *</label>
                    <input type="text" name="option_${questionCount}_1" required placeholder="Option B">
                </div>
                <div class="form-group">
                    <label>Option C *</label>
                    <input type="text" name="option_${questionCount}_2" required placeholder="Option C">
                </div>
                <div class="form-group">
                    <label>Option D *</label>
                    <input type="text" name="option_${questionCount}_3" required placeholder="Option D">
                </div>
            </div>
            
            <div class="form-grid">
                <div class="form-group">
                    <label>Correct Answer *</label>
                    <select name="correct_${questionCount}" required>
                        <option value="">Select correct option</option>
                        <option value="0">Option A</option>
                        <option value="1">Option B</option>
                        <option value="2">Option C</option>
                        <option value="3">Option D</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Points</label>
                    <input type="number" name="points_${questionCount}" value="1" min="1" max="10">
                </div>
            </div>
        </div>
    `;
    
    questionsList.insertAdjacentHTML('beforeend', questionHtml);
}

function removeQuestion(questionNum) {
    const questionItem = document.getElementById(`question-${questionNum}`);
    if (questionItem) {
        questionItem.remove();
        console.log('Removed question:', questionNum);
    }
}

async function createQuiz(event) {
    event.preventDefault();
    console.log('Creating quiz...');
    
    try {
        // Collect quiz data
        const quizData = {
            title: document.getElementById('quizTitle')?.value,
            category: document.getElementById('quizCategory')?.value,
            difficulty: document.getElementById('quizDifficulty')?.value,
            timeLimit: parseInt(document.getElementById('timeLimit')?.value) || 10,
            description: document.getElementById('quizDescription')?.value,
            questions: [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: firebase.auth().currentUser?.uid,
            status: 'active'
        };
        
        // Validate required fields
        if (!quizData.title || !quizData.category) {
            alert('Please fill in all required fields');
            return;
        }
        
        // Collect questions
        const questionItems = document.querySelectorAll('.question-item');
        console.log('Found questions:', questionItems.length);
        
        if (questionItems.length === 0) {
            alert('Please add at least one question');
            return;
        }
        
        let validQuestions = 0;
        questionItems.forEach((item, index) => {
            const questionNum = index + 1;
            
            const questionText = item.querySelector(`[name="question_${questionNum}"]`)?.value;
            const option0 = item.querySelector(`[name="option_${questionNum}_0"]`)?.value;
            const option1 = item.querySelector(`[name="option_${questionNum}_1"]`)?.value;
            const option2 = item.querySelector(`[name="option_${questionNum}_2"]`)?.value;
            const option3 = item.querySelector(`[name="option_${questionNum}_3"]`)?.value;
            const correct = item.querySelector(`[name="correct_${questionNum}"]`)?.value;
            const points = parseInt(item.querySelector(`[name="points_${questionNum}"]`)?.value) || 1;
            
            if (questionText && option0 && option1 && option2 && option3 && correct !== '') {
                const question = {
                    question: questionText,
                    options: [option0, option1, option2, option3],
                    correct: parseInt(correct),
                    points: points
                };
                quizData.questions.push(question);
                validQuestions++;
            }
        });
        
        if (validQuestions === 0) {
            alert('Please complete all question fields');
            return;
        }
        
        console.log('Quiz data:', quizData);
        
        // Save to Firebase
        const docRef = await firebase.firestore().collection('quizzes').add(quizData);
        console.log('Quiz created with ID:', docRef.id);
        
        alert(`Quiz created successfully! Added ${validQuestions} questions.`);
        
        // Reset form
        event.target.reset();
        document.getElementById('questionsList').innerHTML = '';
        addQuestion(); // Add one empty question
        
        // Switch to quiz management
        switchSection('quiz-management');
        loadQuizzes();
        
    } catch (error) {
        console.error('Error creating quiz:', error);
        alert('Error creating quiz: ' + error.message);
    }
}

async function uploadJSON() {
    const jsonInput = document.getElementById('jsonInput')?.value;
    if (!jsonInput) {
        alert('Please paste JSON data first');
        return;
    }
    
    try {
        const quizData = JSON.parse(jsonInput);
        
        // Validate JSON structure
        if (!quizData.title || !quizData.questions || !Array.isArray(quizData.questions)) {
            throw new Error('Invalid JSON format');
        }
        
        // Add metadata
        quizData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        quizData.createdBy = firebase.auth().currentUser?.uid;
        quizData.status = 'active';
        
        // Save to Firebase
        const docRef = await firebase.firestore().collection('quizzes').add(quizData);
        console.log('Quiz uploaded with ID:', docRef.id);
        
        alert('Quiz uploaded successfully from JSON!');
        document.getElementById('jsonInput').value = '';
        
        switchSection('quiz-management');
        loadQuizzes();
        
    } catch (error) {
        console.error('Error uploading JSON:', error);
        alert('Error uploading quiz: ' + error.message);
    }
}

// User Management Functions
async function loadUsers() {
    console.log('Loading users...');
    const tbody = document.getElementById('usersTableBody');
    
    if (!tbody) {
        console.log('Users table body not found');
        return;
    }
    
    tbody.innerHTML = '<tr><td colspan="5" class="loading-cell"><i class="fas fa-spinner fa-spin"></i> Loading users...</td></tr>';
    
    try {
        if (typeof firebase === 'undefined' || !firebase.apps.length) {
            throw new Error('Firebase not initialized');
        }
        
        const usersRef = firebase.firestore().collection('users');
        const snapshot = await usersRef.get();
        
        currentUsers = [];
        
        if (snapshot.empty) {
            tbody.innerHTML = '<tr><td colspan="5" class="loading-cell">No users found</td></tr>';
            return;
        }
        
        let usersHtml = '';
        snapshot.forEach(doc => {
            const user = doc.data();
            currentUsers.push({ id: doc.id, ...user });
            
            usersHtml += `
                <tr>
                    <td>
                        <div class="user-info">
                            <img src="https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || 'User')}&background=4F46E5&color=fff&size=32" 
                                 alt="${user.displayName || user.email}" class="user-avatar">
                            <span>${user.displayName || user.email || 'Unknown User'}</span>
                        </div>
                    </td>
                    <td>${user.email || 'N/A'}</td>
                    <td>${user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString() : 'Unknown'}</td>
                    <td><span class="status-badge status-active">Active</span></td>
                    <td>
                        <button class="btn-sm btn-warning" onclick="viewUser('${doc.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                    </td>
                </tr>
            `;
        });
        
        tbody.innerHTML = usersHtml;
        console.log(`Loaded ${currentUsers.length} users`);
        
    } catch (error) {
        console.error('Error loading users:', error);
        tbody.innerHTML = `<tr><td colspan="5" class="loading-cell">Error loading users: ${error.message}</td></tr>`;
    }
}

function viewUser(userId) {
    console.log('Viewing user:', userId);
    const user = currentUsers.find(u => u.id === userId);
    if (user) {
        alert(`User Details:\nName: ${user.displayName || 'N/A'}\nEmail: ${user.email || 'N/A'}\nJoined: ${user.createdAt ? new Date(user.createdAt.toDate()).toLocaleDateString() : 'Unknown'}`);
    }
}

// Export function for data
function exportAllData() {
    console.log('Exporting data...');
    alert('Data export feature will be available soon!');
}

// Make functions globally available
window.loadQuizzes = loadQuizzes;
window.filterQuizzes = filterQuizzes;
window.editQuiz = editQuiz;
window.viewQuizStats = viewQuizStats;
window.deleteQuiz = deleteQuiz;
window.switchUploadTab = switchUploadTab;
window.addQuestion = addQuestion;
window.removeQuestion = removeQuestion;
window.createQuiz = createQuiz;
window.uploadJSON = uploadJSON;
window.loadUsers = loadUsers;
window.viewUser = viewUser;
window.exportAllData = exportAllData;

console.log('Admin Features loaded successfully');





// Enhanced Admin Controls - ADD THESE FUNCTIONS

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
            
            alert(`Quiz ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully!`);
            loadQuizzes(); // Refresh the list
        }
    } catch (error) {
        console.error('Error toggling quiz status:', error);
        alert('Error updating quiz status. Please try again.');
    }
}

// Duplicate quiz function
async function duplicateQuiz(quizId) {
    if (!confirm('Create a copy of this quiz?')) return;
    
    try {
        const quizRef = firebase.firestore().collection('quizzes').doc(quizId);
        const doc = await quizRef.get();
        
        if (doc.exists) {
            const originalQuiz = doc.data();
            const duplicatedQuiz = {
                ...originalQuiz,
                title: `${originalQuiz.title} (Copy)`,
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            
            const newDocRef = await firebase.firestore().collection('quizzes').add(duplicatedQuiz);
            alert(`Quiz duplicated successfully! New Quiz ID: ${newDocRef.id}`);
            loadQuizzes(); // Refresh the list
        }
    } catch (error) {
        console.error('Error duplicating quiz:', error);
        alert('Error duplicating quiz. Please try again.');
    }
}

// Clear all sample data
async function clearSampleData() {
    if (!confirm('⚠️ WARNING: This will delete ALL quizzes in the database. This action cannot be undone.\n\nAre you absolutely sure?')) return;
    
    try {
        const snapshot = await firebase.firestore().collection('quizzes').get();
        const batch = firebase.firestore().batch();
        
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        alert('All quizzes have been deleted successfully!');
        loadQuizzes(); // Refresh the list
    } catch (error) {
        console.error('Error clearing data:', error);
        alert('Error clearing data. Please try again.');
    }
}

// Export quiz data
async function exportQuiz(quizId) {
    try {
        const doc = await firebase.firestore().collection('quizzes').doc(quizId).get();
        if (doc.exists) {
            const quizData = doc.data();
            const dataStr = JSON.stringify(quizData, null, 2);
            const dataBlob = new Blob([dataStr], {type: 'application/json'});
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(dataBlob);
            link.download = `${quizData.title || 'quiz'}-export.json`;
            link.click();
        }
    } catch (error) {
        console.error('Error exporting quiz:', error);
        alert('Error exporting quiz. Please try again.');
    }
}

// Make functions globally available
window.toggleQuizStatus = toggleQuizStatus;
window.duplicateQuiz = duplicateQuiz;
window.clearSampleData = clearSampleData;
window.exportQuiz = exportQuiz;






