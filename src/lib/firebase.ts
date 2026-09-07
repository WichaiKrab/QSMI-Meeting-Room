import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

// Fallback configuration values if env variables are not present
const defaultEnv = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'qsmi-meeting-room.firebaseapp.com',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'qsmi-meeting-room',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || 'qsmi-meeting-room.firebasestorage.app',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || '827350421276',
  appId: import.meta.env.VITE_FIREBASE_APP_ID || '1:827350421276:web:4c0f9ca55e3261dc9cb4d9',
};

const firebaseConfig = {
  apiKey: defaultEnv.apiKey,
  authDomain: defaultEnv.authDomain,
  projectId: defaultEnv.projectId,
  storageBucket: defaultEnv.storageBucket,
  messagingSenderId: defaultEnv.messagingSenderId,
  appId: defaultEnv.appId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

const databaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || 
  import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID || 
  '(default)';

export const db = getFirestore(app, databaseId);

export default app;
