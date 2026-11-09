/**
 * Firebase Configuration
 * Easily configurable and replaceable at any moment.
 * Supports environment variable overrides with fallback to the primary project config.
 */
export const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY || "AIzaSyBd74PAWc474MuEpOLIkOLzORejXrH2yBs",
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN || "nusukhub.firebaseapp.com",
  projectId: process.env.VITE_FIREBASE_PROJECT_ID || "nusukhub",
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET || "nusukhub.firebasestorage.app",
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1043244933433",
  appId: process.env.VITE_FIREBASE_APP_ID || "1:1043244933433:web:5467e41116b54ea31fc8e8",
  measurementId: process.env.VITE_FIREBASE_MEASUREMENT_ID || "G-43BQ2F8KT8"
};
