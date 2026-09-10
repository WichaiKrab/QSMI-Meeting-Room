import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeFirestore,
  getFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  Firestore
} from 'firebase/firestore';

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

let dbInstance: Firestore;

try {
  // Initialize Firestore with IndexedDB Multi-Tab Persistent Cache to drastically minimize Read operations
  dbInstance = initializeFirestore(
    app,
    {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager()
      })
    },
    databaseId !== '(default)' ? databaseId : undefined
  );
} catch {
  // Fallback to default instance if already initialized (e.g. during HMR or testing)
  dbInstance = getFirestore(app, databaseId);
}

export const db = dbInstance;

export default app;

