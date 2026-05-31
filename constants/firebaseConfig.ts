import { initializeApp, getApps, getApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || 'MISSING_API_KEY',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'MISSING_AUTH_DOMAIN',
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || 'MISSING_DB_URL',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'MISSING_PROJECT_ID',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'MISSING_STORAGE',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || 'MISSING_MESSAGING',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || 'MISSING_APP_ID',
};

let app;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
} catch (error) {
  console.warn("Firebase initialization failed:", error);
}

export const database = app ? getDatabase(app) : null as any;
export default app;
