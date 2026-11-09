import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, Analytics } from 'firebase/analytics';
import { getFirestore, Firestore } from 'firebase/firestore';
import { firebaseConfig } from '../config/firebase';

// Initialize Firebase client app (Singleton pattern)
export const app: FirebaseApp = getApps().length === 0 
  ? initializeApp(firebaseConfig) 
  : getApp();

// Optional Analytics (only runs in browser when supported)
export let analytics: Analytics | null = null;
if (typeof window !== 'undefined') {
  isSupported().then((supported) => {
    if (supported) {
      try {
        analytics = getAnalytics(app);
      } catch (err) {
        console.warn('Firebase Analytics initialization skipped:', err);
      }
    }
  });
}

// Optional direct client-side Firestore instance
export const db: Firestore = getFirestore(app);
