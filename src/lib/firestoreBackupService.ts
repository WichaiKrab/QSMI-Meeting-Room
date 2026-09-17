import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';

export interface DatabaseBackupPackage {
  version: string;
  exportedAt: string;
  systemName: string;
  collections: {
    rooms: Record<string, any>;
    bookings: Record<string, any>;
    users: Record<string, any>;
    departments: Record<string, any>;
    auditLogs: Record<string, any>;
    emailNotifications: Record<string, any>;
    mail: Record<string, any>;
    userNotificationStates: Record<string, any>;
  };
  metadata: {
    totalDocuments: number;
    roomsCount: number;
    bookingsCount: number;
    usersCount: number;
    departmentsCount: number;
    auditLogsCount: number;
    emailNotificationsCount: number;
    mailCount: number;
    userNotificationStatesCount: number;
  };
}

const COLLECTIONS_TO_BACKUP = [
  'rooms',
  'bookings',
  'users',
  'departments',
  'auditLogs',
  'emailNotifications',
  'mail',
  'userNotificationStates'
] as const;

/**
 * Exports all 8 Firestore collections as a single JSON backup object.
 */
export async function exportFirestoreDatabaseBackup(): Promise<DatabaseBackupPackage> {
  const resultCollections: Record<string, Record<string, any>> = {
    rooms: {},
    bookings: {},
    users: {},
    departments: {},
    auditLogs: {},
    emailNotifications: {},
    mail: {},
    userNotificationStates: {}
  };

  let totalDocs = 0;

  for (const colName of COLLECTIONS_TO_BACKUP) {
    try {
      const colRef = collection(db, colName);
      const snap = await getDocs(colRef);
      const colDocs: Record<string, any> = {};
      snap.forEach((docSnap) => {
        colDocs[docSnap.id] = docSnap.data();
        totalDocs++;
      });
      resultCollections[colName] = colDocs;
    } catch (err) {
      console.warn(`Warning while fetching collection "${colName}":`, err);
      resultCollections[colName] = {};
    }
  }

  const backupPackage: DatabaseBackupPackage = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    systemName: 'QSMI Meeting Room Reservation System (สถานเสาวภา สภากาชาดไทย)',
    collections: resultCollections as any,
    metadata: {
      totalDocuments: totalDocs,
      roomsCount: Object.keys(resultCollections.rooms || {}).length,
      bookingsCount: Object.keys(resultCollections.bookings || {}).length,
      usersCount: Object.keys(resultCollections.users || {}).length,
      departmentsCount: Object.keys(resultCollections.departments || {}).length,
      auditLogsCount: Object.keys(resultCollections.auditLogs || {}).length,
      emailNotificationsCount: Object.keys(resultCollections.emailNotifications || {}).length,
      mailCount: Object.keys(resultCollections.mail || {}).length,
      userNotificationStatesCount: Object.keys(resultCollections.userNotificationStates || {}).length
    }
  };

  return backupPackage;
}

/**
 * Triggers a browser download for the JSON backup package.
 */
export function downloadBackupPackageAsJson(backupData: DatabaseBackupPackage) {
  const dateStr = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const fileName = `QSMI_Firestore_Backup_${dateStr}.json`;
  const jsonStr = JSON.stringify(backupData, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface RestoreProgress {
  currentCollection: string;
  currentDocIndex: number;
  totalDocs: number;
  completedDocs: number;
  percentage: number;
}

/**
 * Restores all collections from a valid JSON backup package into Firestore.
 * Uses chunked Firestore Batches (up to 400 operations per batch) for efficiency and atomicity.
 */
export async function restoreFirestoreDatabaseBackup(
  backupData: DatabaseBackupPackage,
  onProgress?: (progress: RestoreProgress) => void
): Promise<{ success: boolean; totalRestored: number; message: string }> {
  if (!backupData || !backupData.collections) {
    throw new Error('รูปแบบไฟล์สำรองข้อมูล (JSON) ไม่ถูกต้อง หรือไม่พบข้อมูล collections');
  }

  // Calculate total documents to restore
  let totalDocsToRestore = 0;
  for (const colName of COLLECTIONS_TO_BACKUP) {
    const colData = backupData.collections[colName];
    if (colData && typeof colData === 'object') {
      totalDocsToRestore += Object.keys(colData).length;
    }
  }

  if (totalDocsToRestore === 0) {
    return {
      success: true,
      totalRestored: 0,
      message: 'ไม่มีรายการข้อมูลในไฟล์สำรองนี้'
    };
  }

  let completedDocs = 0;
  const BATCH_LIMIT = 400; // Firestore limit is 500 operations per batch

  for (const colName of COLLECTIONS_TO_BACKUP) {
    const colData = backupData.collections[colName];
    if (!colData || typeof colData !== 'object') continue;

    const docEntries = Object.entries(colData);
    if (docEntries.length === 0) continue;

    // Process in batches
    for (let i = 0; i < docEntries.length; i += BATCH_LIMIT) {
      const chunk = docEntries.slice(i, i + BATCH_LIMIT);
      const batch = writeBatch(db);

      for (const [docId, docPayload] of chunk) {
        if (!docId) continue;
        const docRef = doc(db, colName, docId);
        batch.set(docRef, docPayload, { merge: true });
      }

      await batch.commit();

      completedDocs += chunk.length;
      if (onProgress) {
        onProgress({
          currentCollection: colName,
          currentDocIndex: Math.min(i + chunk.length, docEntries.length),
          totalDocs: totalDocsToRestore,
          completedDocs,
          percentage: Math.round((completedDocs / totalDocsToRestore) * 100)
        });
      }
    }
  }

  // Also remove the local seeding flag so new database gets fresh awareness
  try {
    localStorage.removeItem('meeting_app_firestore_seeded');
  } catch (_) {}

  return {
    success: true,
    totalRestored: completedDocs,
    message: `กู้คืนข้อมูลสำเร็จทั้งหมด ${completedDocs.toLocaleString()} รายการ`
  };
}
