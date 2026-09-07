import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import firebaseConfigJson from '../../firebase-applet-config.json';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || firebaseConfigJson.apiKey,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || firebaseConfigJson.authDomain,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || firebaseConfigJson.projectId,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || firebaseConfigJson.storageBucket,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || firebaseConfigJson.messagingSenderId,
  appId: import.meta.env.VITE_FIREBASE_APP_ID || firebaseConfigJson.appId,
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Use custom databaseId if configured, or project-specific databaseId
const customDatabaseId = import.meta.env.VITE_FIREBASE_DATABASE_ID || import.meta.env.VITE_FIREBASE_FIRESTORE_DATABASE_ID;
const isCustomProject = Boolean(import.meta.env.VITE_FIREBASE_PROJECT_ID && import.meta.env.VITE_FIREBASE_PROJECT_ID !== firebaseConfigJson.projectId);

const databaseId = customDatabaseId 
  ? customDatabaseId 
  : (isCustomProject ? '(default)' : (firebaseConfigJson.firestoreDatabaseId || '(default)'));

export const db = getFirestore(app, databaseId);

export default app;
