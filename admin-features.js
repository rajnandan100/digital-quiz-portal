// ===== ENHANCED ADMIN FEATURES - COMPLETE IMPLEMENTATION =====
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
                <div class="empty-state">
                    <i class="fas fa-question-circle" style="font-size: 48px; color: #ddd; margin-bottom: 15px;"></i>
                    <h3>No quizzes found</h3>
                    <p>Start by creating your first quiz!</p>
                </div>
            `;
            return;
        }

        let quizzesHtml = '';
        
        snapshot.forEach(doc => {
            const quiz = doc.data();
            currentQuizzes.push({id: doc.id, ...quiz});
            
            // Get quiz status (active/inactive)
            const status = quiz.status || 'active';
            const statusColor = status === 'active' ? '#10B981' : '#EF4444';
            const statusText = status === 'active' ? 'Active' : 'Inactive';
            
            // Calculate quiz stats
            const questionCount = quiz.questions?.length || 0;
            const timeLimit = quiz.timeLimit || 30;
            const createdDate = quiz.createdAt ? quiz.createdAt.toDate().toLocaleDateString() : 'Unknown';
            
            quizzesHtml += `
                <div class="quiz-item ${status}" data-quiz-id="${doc.id}">
                    <div class="quiz-header">
                        <div class="quiz-title-section">
                            <h3>${quiz.title || 'Untitled Quiz'}</h3>
                            <div class="quiz-status">
                                <span class="status-badge status-${status}" style="background-color: ${statusColor}20; color: ${statusColor}; border: 1px solid ${statusColor}40;">
                                    <i class="fas fa-${status === 'active' ? 'play' : 'pause'}-circle"></i>
                                    ${statusText}
                                </span>
                            </div>
                        </div>
                        <div class="quiz-id">ID: ${doc.id}</div>
                    </div>
                    
                    <div class="quiz-details">
                        <div class="quiz-info-grid">
                            <div class="info-item">
                                <i class="fas fa-folder"></i>
                                <span>Category: ${quiz.category || 'Unknown'}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-question-circle"></i>
                                <span>Questions: ${questionCount}</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-clock"></i>
                                <span>Time: ${timeLimit} min</span>
                            </div>
                            <div class="info-item">
                                <i class="fas fa-signal"></i>
                                <span>Level: ${quiz.difficulty || 'Medium'}</span>
                            </div>
                        </div>
                        
                        <div class="quiz-description">
                            <p><i class="fas fa-info-circle"></i> ${quiz.description || 'No description provided'}</p>
                        </div>
                        
                        <div class="quiz-meta">
                            <small><i class="fas fa-calendar"></i> Created: ${createdDate}</small>
                            <small><i class="fas fa-user"></i> By: Admin</small>
                        </div>
                    </div>

                    <div class="quiz-actions">
                        <div class="action-group primary-actions">
                            <button class="btn-sm btn-primary" onclick="editQuiz('${doc.id}')" title="Edit Quiz">
                                <i class="fas fa-edit"></i> Edit
                            </button>
                            <button class="btn-sm ${status === 'active' ? 'btn-warning' : 'btn-success'}" 
                                    onclick="toggleQuizStatus('${doc.id}')" 
                                    title="${status === 'active' ? 'Deactivate' : 'Activate'} Quiz">
                                <i class="fas fa-${status === 'active' ? 'pause' : 'play'}"></i> 
                                ${status === 'active' ? 'Deactivate' : 'Activate'}
                            </button>
                            <button class="btn-sm btn-info" onclick="previewQuiz('${doc.id}')" title="Preview Quiz">
                                <i class="fas fa-eye"></i> Preview
                            </button>
                        </div>
                        
                        <div class="action-group secondary-actions">
                            <button class="btn-sm btn-secondary" onclick="duplicateQuiz('${doc.id}')" title="Duplicate Quiz">
                                <i class="fas fa-copy"></i> Copy
                            </button>
                            <button class="btn-sm btn-secondary" onclick="exportQuiz('${doc.id}')" title="Export Quiz">
                                <i class="fas fa-download"></i> Export
                            </button>
                            <button class="btn-sm btn-success" onclick="viewQuizStats('${doc.id}')" title="View Statistics">
                                <i class="fas fa-chart-bar"></i> Stats
                            </button>
                            <button class="btn-sm btn-danger" onclick="deleteQuiz('${doc.id}')" title="Delete Quiz">
                                <i class="fas fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                </div>
            `;
        });

        quizList.innerHTML = quizzesHtml;
        console.log(`Loaded ${currentQuizzes.length} quizzes`);


 // ADD THESE NEW LINES:
        // Add checkboxes to quiz items
        setTimeout(() => {
            addCheckboxesToQuizItems();
            updateQuizStats();
        }, 100);




        
    } catch (error) {
        console.error('Error loading quizzes:', error);
        quizList.innerHTML = `
            <div class="error-state">
                <i class="fas fa-exclamation-triangle" style="color: #dc2626; font-size: 48px; margin-bottom: 15px;"></i>
                <h3>Error Loading Quizzes</h3>
                <p>${error.message}</p>
                <button class="btn-primary" onclick="loadQuizzes()">
                    <i class="fas fa-refresh"></i> Try Again
                </button>
            </div>
        `;
    }
}

// Filter quizzes function
function filterQuizzes() {
    const searchTerm = document.getElementById('quizSearch')?.value.toLowerCase() || '';
    const categoryFilter = document.getElementById('categoryFilter')?.value || 'all';
    const statusFilter = document.getElementById('statusFilter')?.value || 'all';

    const quizItems = document.querySelectorAll('.quiz-item');
    let visibleCount = 0;

    quizItems.forEach(item => {
        const quizId = item.dataset.quizId;
        const quiz = currentQuizzes.find(q => q.id === quizId);
        
        if (quiz) {
            const matchesSearch = quiz.title.toLowerCase().includes(searchTerm) || 
                                quiz.description?.toLowerCase().includes(searchTerm);
            const matchesCategory = categoryFilter === 'all' || quiz.category === categoryFilter;
            const matchesStatus = statusFilter === 'all' || (quiz.status || 'active') === statusFilter;

            if (matchesSearch && matchesCategory && matchesStatus) {
                item.style.display = 'block';
                visibleCount++;
            } else {
                item.style.display = 'none';
            }
        }
    });

    // Show no results message if needed
    const quizList = document.getElementById('quizList');
    if (visibleCount === 0 && currentQuizzes.length > 0) {
        const noResultsMsg = document.createElement('div');
        noResultsMsg.className = 'empty-state';
        noResultsMsg.innerHTML = `
            <i class="fas fa-search" style="font-size: 48px; color: #ddd; margin-bottom: 15px;"></i>
            <h3>No quizzes match your filters</h3>
            <p>Try adjusting your search criteria</p>
        `;
        quizList.appendChild(noResultsMsg);
    }
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
                            const marker = i === q.correct ? '✅' : '   ';
                            previewText += `${marker} ${String.fromCharCode(65 + i)}) ${opt}\n`;
                        });
                    }
                    previewText += `Points: ${q.points || 1}\n\n`;
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
        const scores = results.map(r => r.score || 0);
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
                const date = result.completedAt ? new Date(result.completedAt.toDate()).toLocaleDateString() : 'Unknown';
                statsText += `${index + 1}. Score: ${result.score}% - ${date}\n`;
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

// Add question to manual creation
function addQuestion() {
    const questionsList = document.getElementById('questionsList');
    const questionNumber = questionsList.children.length + 1;
    
    const questionHtml = `
        <div class="question-block" id="question-${questionNumber}">
            <div class="question-header">
                <h4>Question ${questionNumber}</h4>
                <button type="button" class="btn-danger btn-sm" onclick="removeQuestion(${questionNumber})">
                    <i class="fas fa-trash"></i> Remove
                </button>
            </div>
            
            <div class="form-group">
                <label>Question Text:</label>
                <textarea class="form-control" placeholder="Enter your question..." required></textarea>
            </div>
            
            <div class="form-group">
                <label>Question Type:</label>
                <select class="form-control" onchange="updateQuestionType(this, ${questionNumber})">
                    <option value="multiple-choice">Multiple Choice</option>
                    <option value="true-false">True/False</option>
                </select>
            </div>
            
            <div class="options-section" id="options-${questionNumber}">
                <div class="form-group">
                    <label>Option A:</label>
                    <input type="text" class="form-control" placeholder="Option A" required>
                </div>
                <div class="form-group">
                    <label>Option B:</label>
                    <input type="text" class="form-control" placeholder="Option B" required>
                </div>
                <div class="form-group">
                    <label>Option C:</label>
                    <input type="text" class="form-control" placeholder="Option C" required>
                </div>
                <div class="form-group">
                    <label>Option D:</label>
                    <input type="text" class="form-control" placeholder="Option D" required>
                </div>
            </div>
            
            <div class="form-group">
                <label>Correct Answer:</label>
                <select class="form-control" required>
                    <option value="0">Option A</option>
                    <option value="1">Option B</option>
                    <option value="2">Option C</option>
                    <option value="3">Option D</option>
                </select>
            </div>
            
            <div class="form-group">
                <label>Points:</label>
                <input type="number" class="form-control" value="1" min="1" max="10" required>
            </div>
        </div>
    `;
    
    questionsList.insertAdjacentHTML('beforeend', questionHtml);
}

// Remove question from manual creation
function removeQuestion(questionNumber) {
    const questionBlock = document.getElementById(`question-${questionNumber}`);
    if (questionBlock) {
        questionBlock.remove();
        
        // Renumber remaining questions
        const questions = document.querySelectorAll('.question-block');
        questions.forEach((block, index) => {
            const newNumber = index + 1;
            block.id = `question-${newNumber}`;
            block.querySelector('h4').textContent = `Question ${newNumber}`;
        });
    }
}

// Create quiz from manual form
async function createQuiz() {
    try {
        // Get basic quiz info
        const title = document.getElementById('quizTitle').value.trim();
        const description = document.getElementById('quizDescription').value.trim();
        const category = document.getElementById('quizCategory').value;
        const difficulty = document.getElementById('quizDifficulty').value;
        const timeLimit = parseInt(document.getElementById('quizTimeLimit').value);

        if (!title) {
            alert('Please enter a quiz title');
            return;
        }

        // Get questions
        const questions = [];
        const questionBlocks = document.querySelectorAll('.question-block');

        if (questionBlocks.length === 0) {
            alert('Please add at least one question');
            return;
        }

        questionBlocks.forEach((block, index) => {
            const questionText = block.querySelector('textarea').value.trim();
            const questionType = block.querySelector('select').value;
            const options = Array.from(block.querySelectorAll('.options-section input')).map(input => input.value.trim());
            const correctAnswer = parseInt(block.querySelector('.form-group:last-child select').value);
            const points = parseInt(block.querySelector('input[type="number"]').value);

            if (!questionText) {
                throw new Error(`Question ${index + 1} is missing text`);
            }

            if (questionType === 'multiple-choice' && options.some(opt => !opt)) {
                throw new Error(`Question ${index + 1} has empty options`);
            }

            questions.push({
                question: questionText,
                type: questionType,
                options: questionType === 'true-false' ? ['True', 'False'] : options,
                correct: correctAnswer,
                points: points
            });
        });

        // Create quiz object
        const quizData = {
            title,
            description,
            category,
            difficulty,
            timeLimit,
            questions,
            status: 'active',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        // Save to Firestore
        const docRef = await firebase.firestore().collection('quizzes').add(quizData);
        
        alert(`✅ Quiz created successfully!\n\nQuiz ID: ${docRef.id}\nTitle: ${title}\nQuestions: ${questions.length}`);
        
        // Reset form
        document.getElementById('createQuizForm').reset();
        document.getElementById('questionsList').innerHTML = '';
        addQuestion(); // Add one default question
        
        // Refresh quiz list
        loadQuizzes();

    } catch (error) {
        console.error('Error creating quiz:', error);
        alert(`❌ Error creating quiz: ${error.message}`);
    }
}

// Upload quiz from JSON
async function uploadJSON() {
    const jsonInput = document.getElementById('jsonInput').value.trim();
    
    if (!jsonInput) {
        alert('Please paste JSON data');
        return;
    }

    try {
        const quizData = JSON.parse(jsonInput);
        
        // Validate required fields
        if (!quizData.title || !quizData.questions || !Array.isArray(quizData.questions)) {
            throw new Error('Invalid JSON format. Missing title or questions array.');
        }

        // Add metadata
        quizData.status = 'active';
        quizData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
        quizData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();

        // Save to Firestore
        const docRef = await firebase.firestore().collection('quizzes').add(quizData);
        
        alert(`✅ Quiz uploaded successfully!\n\nQuiz ID: ${docRef.id}\nTitle: ${quizData.title}\nQuestions: ${quizData.questions.length}`);
        
        // Clear input
        document.getElementById('jsonInput').value = '';
        
        // Refresh quiz list
        loadQuizzes();

    } catch (error) {
        console.error('Error uploading quiz:', error);
        alert(`❌ Error uploading quiz: ${error.message}`);
    }
}

// ===== USER MANAGEMENT FUNCTIONS =====

// Load users
async function loadUsers() {
    console.log('Loading users...');
    const usersList = document.getElementById('usersList');
    
    if (!usersList) {
        console.log('Users list element not found');
        return;
    }

    usersList.innerHTML = '<tr><td colspan="4">Loading users...</td></tr>';

    try {
        const usersRef = firebase.firestore().collection('users');
        const snapshot = await usersRef.orderBy('createdAt', 'desc').get();

        currentUsers = [];
        let usersHtml = '';

        if (snapshot.empty) {
            usersHtml = '<tr><td colspan="4">No users found</td></tr>';
        } else {
            snapshot.forEach(doc => {
                const user = doc.data();
                currentUsers.push({id: doc.id, ...user});

                const joinDate = user.createdAt ? user.createdAt.toDate().toLocaleDateString() : 'Unknown';
                const status = user.status || 'active';

                usersHtml += `
                    <tr>
                        <td>
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="width: 40px; height: 40px; border-radius: 50%; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">
                                    ${(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                                </div>
                                <div>
                                    <strong>${user.displayName || 'Unknown'}</strong><br>
                                    <small style="color: #666;">${user.email}</small>
                                </div>
                            </div>
                        </td>
                        <td>${joinDate}</td>
                        <td>
                            <span class="status-badge status-${status}" style="background: ${status === 'active' ? '#10B981' : '#EF4444'}20; color: ${status === 'active' ? '#10B981' : '#EF4444'}; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                                ${status.charAt(0).toUpperCase() + status.slice(1)}
                            </span>
                        </td>
                        <td>
                            <button class="btn-sm btn-primary" onclick="viewUser('${doc.id}')">
                                <i class="fas fa-eye"></i> View
                            </button>
                            <button class="btn-sm btn-${status === 'active' ? 'warning' : 'success'}" onclick="toggleUserStatus('${doc.id}')">
                                <i class="fas fa-${status === 'active' ? 'ban' : 'check'}"></i>
                                ${status === 'active' ? 'Ban' : 'Unban'}
                            </button>
                        </td>
                    </tr>
                `;
            });
        }

        usersList.innerHTML = usersHtml;
        console.log(`Loaded ${currentUsers.length} users`);

    } catch (error) {
        console.error('Error loading users:', error);
        usersList.innerHTML = '<tr><td colspan="4">Error loading users</td></tr>';
    }
}

// View user details
async function viewUser(userId) {
    try {
        const userDoc = await firebase.firestore().collection('users').doc(userId).get();
        if (!userDoc.exists) {
            alert('User not found');
            return;
        }

        const user = userDoc.data();
        
        // Get user's quiz results
        const resultsSnapshot = await firebase.firestore()
            .collection('quizResults')
            .where('userId', '==', userId)
            .orderBy('completedAt', 'desc')
            .limit(10)
            .get();

        let userInfo = `👤 USER PROFILE\n\n`;
        userInfo += `Name: ${user.displayName || 'Not set'}\n`;
        userInfo += `Email: ${user.email}\n`;
        userInfo += `Status: ${user.status || 'active'}\n`;
        userInfo += `Joined: ${user.createdAt ? user.createdAt.toDate().toLocaleDateString() : 'Unknown'}\n`;
        
        if (!resultsSnapshot.empty) {
            userInfo += `\n📊 RECENT QUIZ RESULTS:\n`;
            resultsSnapshot.forEach((doc, index) => {
                const result = doc.data();
                const date = result.completedAt ? result.completedAt.toDate().toLocaleDateString() : 'Unknown';
                userInfo += `${index + 1}. Score: ${result.score || 0}% - ${date}\n`;
            });
        } else {
            userInfo += `\n📊 No quiz attempts yet`;
        }
        
        alert(userInfo);
        
    } catch (error) {
        console.error('Error loading user details:', error);
        alert('❌ Error loading user details.');
    }
}

// ===== UTILITY FUNCTIONS =====

// Export all data
async function exportAllData() {
    if (!confirm('📥 Export all quizzes and user data?')) return;
    
    try {
        const [quizzesSnapshot, usersSnapshot, resultsSnapshot] = await Promise.all([
            firebase.firestore().collection('quizzes').get(),
            firebase.firestore().collection('users').get(),
            firebase.firestore().collection('quizResults').get()
        ]);

        const exportData = {
            exportedAt: new Date().toISOString(),
            exportedBy: 'Admin',
            data: {
                quizzes: [],
                users: [],
                results: []
            }
        };

        quizzesSnapshot.forEach(doc => {
            exportData.data.quizzes.push({id: doc.id, ...doc.data()});
        });

        usersSnapshot.forEach(doc => {
            exportData.data.users.push({id: doc.id, ...doc.data()});
        });

        resultsSnapshot.forEach(doc => {
            exportData.data.results.push({id: doc.id, ...doc.data()});
        });

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `digiquiz-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        alert(`✅ All data exported successfully!\n\nQuizzes: ${exportData.data.quizzes.length}\nUsers: ${exportData.data.users.length}\nResults: ${exportData.data.results.length}`);

    } catch (error) {
        console.error('Error exporting data:', error);
        alert('❌ Error exporting data. Please try again.');
    }
}

// Edit quiz (placeholder - can be enhanced)
async function editQuiz(quizId) {
    alert(`🔧 Edit functionality for Quiz ID: ${quizId}\n\nThis feature will be implemented in the next update.\n\nFor now, you can:\n- Duplicate the quiz\n- Delete and recreate\n- Export and modify JSON`);
}

// Delete quiz
async function deleteQuiz(quizId) {
    if (!confirm('⚠️ Are you sure you want to delete this quiz?\n\nThis action cannot be undone!')) return;
    
    try {
        await firebase.firestore().collection('quizzes').doc(quizId).delete();
        alert('✅ Quiz deleted successfully!');
        loadQuizzes();
    } catch (error) {
        console.error('Error deleting quiz:', error);
        alert('❌ Error deleting quiz. Please try again.');
    }
}

// Clear all sample data (DANGEROUS)
async function clearAllData() {
    if (!confirm('⚠️ DANGER: This will delete ALL quizzes!\n\nThis action cannot be undone. Are you absolutely sure?')) return;
    if (!confirm('⚠️ FINAL WARNING: All quizzes will be permanently deleted!\n\nType "DELETE" in the next prompt to confirm.')) return;
    
    const confirmation = prompt('Type "DELETE" to confirm:');
    if (confirmation !== 'DELETE') {
        alert('Deletion cancelled.');
        return;
    }
    
    try {
        const snapshot = await firebase.firestore().collection('quizzes').get();
        const batch = firebase.firestore().batch();
        
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        alert('✅ All quizzes have been deleted!');
        loadQuizzes();
    } catch (error) {
        console.error('Error clearing data:', error);
        alert('❌ Error clearing data. Please try again.');
    }
}








// ===== BULK ACTIONS SYSTEM =====

let selectedQuizzes = new Set(); // Track selected quiz IDs

// Update quiz display to include checkboxes
function addCheckboxesToQuizItems() {
    const quizItems = document.querySelectorAll('.quiz-item');
    quizItems.forEach(item => {
        const quizId = item.dataset.quizId;
        
        // Check if checkbox already exists
        if (!item.querySelector('.quiz-checkbox')) {
            const checkboxHtml = `
                <div class="quiz-checkbox">
                    <input type="checkbox" id="quiz-${quizId}" data-quiz-id="${quizId}" 
                           onchange="toggleQuizSelection('${quizId}')">
                    <label for="quiz-${quizId}"></label>
                </div>
            `;
            
            // Add checkbox to the beginning of quiz header
            const header = item.querySelector('.quiz-header');
            header.insertAdjacentHTML('afterbegin', checkboxHtml);
        }
    });
    
    updateBulkActionButtons();
}

// Toggle individual quiz selection
function toggleQuizSelection(quizId) {
    const checkbox = document.getElementById(`quiz-${quizId}`);
    
    if (checkbox.checked) {
        selectedQuizzes.add(quizId);
    } else {
        selectedQuizzes.delete(quizId);
    }
    
    updateSelectionCount();
    updateBulkActionButtons();
}

// Select all quizzes
function selectAllQuizzes() {
    const checkboxes = document.querySelectorAll('.quiz-checkbox input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = true;
        selectedQuizzes.add(checkbox.dataset.quizId);
    });
    
    updateSelectionCount();
    updateBulkActionButtons();
}

// Clear all selections
function clearSelection() {
    const checkboxes = document.querySelectorAll('.quiz-checkbox input[type="checkbox"]');
    
    checkboxes.forEach(checkbox => {
        checkbox.checked = false;
    });
    
    selectedQuizzes.clear();
    updateSelectionCount();
    updateBulkActionButtons();
}

// Update selection counter
function updateSelectionCount() {
    const count = selectedQuizzes.size;
    document.getElementById('selected-count').textContent = count;
    document.getElementById('selected-quiz-count').textContent = count;
}

// Update bulk action button states
function updateBulkActionButtons() {
    const hasSelection = selectedQuizzes.size > 0;
    
    // Enable/disable buttons based on selection
    const bulkButtons = [
        'bulk-activate', 'bulk-deactivate', 'bulk-export', 
        'bulk-delete', 'bulk-category', 'bulk-category-btn'
    ];
    
    bulkButtons.forEach(buttonId => {
        const button = document.getElementById(buttonId);
        if (button) {
            button.disabled = !hasSelection;
        }
    });
}

// Update quiz statistics
function updateQuizStats() {
    const totalQuizzes = currentQuizzes.length;
    const activeQuizzes = currentQuizzes.filter(q => (q.status || 'active') === 'active').length;
    const inactiveQuizzes = totalQuizzes - activeQuizzes;
    
    document.getElementById('total-quiz-count').textContent = totalQuizzes;
    document.getElementById('active-quiz-count').textContent = activeQuizzes;
    document.getElementById('inactive-quiz-count').textContent = inactiveQuizzes;
}

// ===== BULK OPERATIONS =====

// Bulk activate quizzes
async function bulkActivateQuizzes() {
    if (selectedQuizzes.size === 0) {
        alert('Please select quizzes to activate');
        return;
    }
    
    if (!confirm(`Activate ${selectedQuizzes.size} selected quiz(es)?`)) return;
    
    try {
        const batch = firebase.firestore().batch();
        
        selectedQuizzes.forEach(quizId => {
            const quizRef = firebase.firestore().collection('quizzes').doc(quizId);
            batch.update(quizRef, {
                status: 'active',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        
        await batch.commit();
        
        alert(`✅ ${selectedQuizzes.size} quiz(es) activated successfully!`);
        clearSelection();
        loadQuizzes();
        
    } catch (error) {
        console.error('Error bulk activating quizzes:', error);
        alert('❌ Error activating quizzes. Please try again.');
    }
}

// Bulk deactivate quizzes
async function bulkDeactivateQuizzes() {
    if (selectedQuizzes.size === 0) {
        alert('Please select quizzes to deactivate');
        return;
    }
    
    if (!confirm(`Deactivate ${selectedQuizzes.size} selected quiz(es)?`)) return;
    
    try {
        const batch = firebase.firestore().batch();
        
        selectedQuizzes.forEach(quizId => {
            const quizRef = firebase.firestore().collection('quizzes').doc(quizId);
            batch.update(quizRef, {
                status: 'inactive',
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        
        await batch.commit();
        
        alert(`✅ ${selectedQuizzes.size} quiz(es) deactivated successfully!`);
        clearSelection();
        loadQuizzes();
        
    } catch (error) {
        console.error('Error bulk deactivating quizzes:', error);
        alert('❌ Error deactivating quizzes. Please try again.');
    }
}

// Bulk update category
async function bulkUpdateCategory() {
    if (selectedQuizzes.size === 0) {
        alert('Please select quizzes to update');
        return;
    }
    
    const newCategory = document.getElementById('bulk-category').value;
    if (!newCategory) {
        alert('Please select a category');
        return;
    }
    
    if (!confirm(`Update category to "${newCategory}" for ${selectedQuizzes.size} selected quiz(es)?`)) return;
    
    try {
        const batch = firebase.firestore().batch();
        
        selectedQuizzes.forEach(quizId => {
            const quizRef = firebase.firestore().collection('quizzes').doc(quizId);
            batch.update(quizRef, {
                category: newCategory,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        });
        
        await batch.commit();
        
        alert(`✅ Category updated for ${selectedQuizzes.size} quiz(es)!`);
        clearSelection();
        loadQuizzes();
        
        // Reset category selector
        document.getElementById('bulk-category').value = '';
        
    } catch (error) {
        console.error('Error bulk updating category:', error);
        alert('❌ Error updating category. Please try again.');
    }
}

// Bulk export quizzes
async function bulkExportQuizzes() {
    if (selectedQuizzes.size === 0) {
        alert('Please select quizzes to export');
        return;
    }
    
    try {
        const exportData = {
            exportedAt: new Date().toISOString(),
            exportedBy: 'Admin',
            exportType: 'bulk_selection',
            totalQuizzes: selectedQuizzes.size,
            quizzes: []
        };
        
        // Get selected quiz data
        for (const quizId of selectedQuizzes) {
            const doc = await firebase.firestore().collection('quizzes').doc(quizId).get();
            if (doc.exists) {
                exportData.quizzes.push({
                    id: quizId,
                    ...doc.data()
                });
            }
        }
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `bulk-quizzes-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        alert(`✅ ${selectedQuizzes.size} quiz(es) exported successfully!`);
        
    } catch (error) {
        console.error('Error bulk exporting quizzes:', error);
        alert('❌ Error exporting quizzes. Please try again.');
    }
}

// Export all quizzes
async function exportAllQuizzes() {
    if (currentQuizzes.length === 0) {
        alert('No quizzes to export');
        return;
    }
    
    if (!confirm(`Export all ${currentQuizzes.length} quizzes?`)) return;
    
    try {
        const exportData = {
            exportedAt: new Date().toISOString(),
            exportedBy: 'Admin',
            exportType: 'all_quizzes',
            totalQuizzes: currentQuizzes.length,
            quizzes: currentQuizzes
        };
        
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        
        const link = document.createElement('a');
        link.href = URL.createObjectURL(dataBlob);
        link.download = `all-quizzes-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        alert(`✅ All ${currentQuizzes.length} quizzes exported successfully!`);
        
    } catch (error) {
        console.error('Error exporting all quizzes:', error);
        alert('❌ Error exporting quizzes. Please try again.');
    }
}

// Bulk delete quizzes
async function bulkDeleteQuizzes() {
    if (selectedQuizzes.size === 0) {
        alert('Please select quizzes to delete');
        return;
    }
    
    if (!confirm(`⚠️ DELETE ${selectedQuizzes.size} selected quiz(es)?\n\nThis action cannot be undone!`)) return;
    
    const confirmation = prompt(`Type "DELETE" to confirm deletion of ${selectedQuizzes.size} quizzes:`);
    if (confirmation !== 'DELETE') {
        alert('Deletion cancelled.');
        return;
    }
    
    try {
        const batch = firebase.firestore().batch();
        
        selectedQuizzes.forEach(quizId => {
            const quizRef = firebase.firestore().collection('quizzes').doc(quizId);
            batch.delete(quizRef);
        });
        
        await batch.commit();
        
        alert(`✅ ${selectedQuizzes.size} quiz(es) deleted successfully!`);
        clearSelection();
        loadQuizzes();
        
    } catch (error) {
        console.error('Error bulk deleting quizzes:', error);
        alert('❌ Error deleting quizzes. Please try again.');
    }
}

// Clear all quizzes (DANGEROUS)
async function clearAllQuizzes() {
    if (currentQuizzes.length === 0) {
        alert('No quizzes to delete');
        return;
    }
    
    if (!confirm(`⚠️ DANGER: Delete ALL ${currentQuizzes.length} quizzes?\n\nThis will permanently delete every quiz in your database!\n\nThis action cannot be undone!`)) return;
    
    if (!confirm('⚠️ FINAL WARNING: ALL QUIZZES WILL BE DELETED!\n\nAre you absolutely certain?')) return;
    
    const confirmation = prompt('Type "DELETE ALL" to confirm complete deletion:');
    if (confirmation !== 'DELETE ALL') {
        alert('Deletion cancelled.');
        return;
    }
    
    try {
        const snapshot = await firebase.firestore().collection('quizzes').get();
        const batch = firebase.firestore().batch();
        
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        alert(`✅ All ${snapshot.size} quizzes have been deleted!`);
        clearSelection();
        loadQuizzes();
        
    } catch (error) {
        console.error('Error clearing all quizzes:', error);
        alert('❌ Error clearing quizzes. Please try again.');
    }
}
















// ===== MAKE FUNCTIONS GLOBALLY AVAILABLE =====
window.loadQuizzes = loadQuizzes;
window.filterQuizzes = filterQuizzes;
window.editQuiz = editQuiz;
window.viewQuizStats = viewQuizStats;
window.deleteQuiz = deleteQuiz;
window.toggleQuizStatus = toggleQuizStatus;
window.previewQuiz = previewQuiz;
window.duplicateQuiz = duplicateQuiz;
window.exportQuiz = exportQuiz;
window.switchUploadTab = switchUploadTab;
window.addQuestion = addQuestion;
window.removeQuestion = removeQuestion;
window.createQuiz = createQuiz;
window.uploadJSON = uploadJSON;
window.loadUsers = loadUsers;
window.viewUser = viewUser;
window.exportAllData = exportAllData;
window.clearAllData = clearAllData;

console.log('✅ Enhanced Admin Features loaded successfully!');
