// Firebase Configuration and Initialization
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

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
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);

// Export the app instance
export default app;

// Firestore Collections Structure
export const COLLECTIONS = {
  USERS: 'users',
  QUIZZES: 'quizzes', 
  QUIZ_RESULTS: 'quizResults',
  LEADERBOARD: 'leaderboard',
  ADMIN_USERS: 'adminUsers'
};

// Quiz Categories
export const QUIZ_CATEGORIES = {
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
  'math': {
    name: 'Mathematics',
    color: '#DC2626',
    icon: 'fas fa-calculator'
  },
  'science': {
    name: 'Science',
    color: '#7C2D12',
    icon: 'fas fa-flask'
  }
};

// Application Constants
export const APP_CONSTANTS = {
  DEFAULT_QUIZ_TIME: 30, // 30 minutes default
  QUESTIONS_PER_PAGE: 10,
  LEADERBOARD_PAGE_SIZE: 50,
  MAX_QUIZ_ATTEMPTS: 3
};
