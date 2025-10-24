// Firebase Configuration and Initialization (v8 Compatibility)

// Your Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBiS1wFqB5dHjn6UiRhheSLhOekkLBlfmw",
  authDomain: "digi-quiz-portal.firebaseapp.com",
  projectId: "digi-quiz-portal",
  storageBucket: "digi-quiz-portal.firebasestorage.app",
  messagingSenderId: "260707974367",
  appId: "1:260707974367:web:82ba41b8a8f84508b47d6a",
  measurementId: "G-78W1YHEG93"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = firebase.auth();
const db = firebase.firestore();

// Firestore Collections Structure
const COLLECTIONS = {
  USERS: 'users',
  QUIZZES: 'quizzes',
  QUIZ_RESULTS: 'quizResults',
  LEADERBOARD: 'leaderboard',
  ADMIN_USERS: 'adminUsers'
};

// Quiz Categories
const QUIZ_CATEGORIES = {
  'general-knowledge': {
    name: 'General Knowledge',
    color: '#4F46E5',
    icon: 'fas fa-globe'
  },
  'english': {
    name: 'English',
    color: '#059669',
    icon: 'fas fa-language'
  },
  'science': {
    name: 'Science',
    color: '#DC2626',
    icon: 'fas fa-flask'
  },
  'mathematics': {
    name: 'Mathematics',
    color: '#7C3AED',
    icon: 'fas fa-calculator'
  }
};

// Export for use in other files
if (typeof window !== 'undefined') {
  window.firebaseConfig = firebaseConfig;
  window.COLLECTIONS = COLLECTIONS;
  window.QUIZ_CATEGORIES = QUIZ_CATEGORIES;
}

console.log('Firebase initialized successfully!');
