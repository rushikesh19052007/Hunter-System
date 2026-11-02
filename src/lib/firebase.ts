import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

// Shared Firebase Project Options matching Flutter Source of Truth (hunter-x-guild)
export const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || 'AIzaSyBk16inYpN3ZtISnJicrkujEgUVg5jbsFc',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'hunter-x-guild.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'hunter-x-guild',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'hunter-x-guild.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '693350757736',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:693350757736:web:8457b2f2bfc95e759812dd',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || 'G-VDFP7VG6N2',
};

// Singleton initialization
export const app: FirebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth: Auth = getAuth(app);
export const firestore: Firestore = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// Google OAuth scopes / parameters
googleProvider.setCustomParameters({
  prompt: 'select_account',
});
