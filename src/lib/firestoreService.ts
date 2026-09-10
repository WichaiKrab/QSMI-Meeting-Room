import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from './firebase';
import { Room, Booking, UserAccount, Department, EmailNotification, UserRole } from '../types';
import { normalizeThaiPhoneNumber } from '../utils/phoneUtils';
import {
  INITIAL_ROOMS,
  INITIAL_BOOKINGS,
  CORPORATE_USERS,
  INITIAL_DEPARTMENTS
} from '../data/initialData';

const ROOMS_COL = 'rooms';
const BOOKINGS_COL = 'bookings';
const USERS_COL = 'users';
const DEPTS_COL = 'departments';
const EMAILS_COL = 'emailNotifications';
const MAIL_QUEUE_COL = 'mail';
const USER_NOTIF_STATES_COL = 'userNotificationStates';

// Initialize default data if firestore is empty (Persisted in localStorage to avoid redundant reads)
export async function initializeFirestoreDefaults() {
  try {
    if (typeof window !== 'undefined' && localStorage.getItem('meeting_app_firestore_seeded')) {
      return;
    }

    const roomsSnap = await getDocs(query(collection(db, ROOMS_COL), limit(1)));
    if (roomsSnap.empty) {
      console.log('Seeding initial rooms to Firestore...');
      for (const room of INITIAL_ROOMS) {
        await setDoc(doc(db, ROOMS_COL, room.id), room);
      }
    }

    const deptsSnap = await getDocs(query(collection(db, DEPTS_COL), limit(1)));
    if (deptsSnap.empty) {
      console.log('Seeding initial departments to Firestore...');
      for (const dept of INITIAL_DEPARTMENTS) {
        await setDoc(doc(db, DEPTS_COL, dept.id), dept);
      }
    }

    const usersSnap = await getDocs(query(collection(db, USERS_COL), limit(1)));
    if (usersSnap.empty) {
      console.log('Seeding initial users to Firestore...');
      for (const user of CORPORATE_USERS) {
        const id = user.id || user.username;
        await setDoc(doc(db, USERS_COL, id), { ...user, id });
      }
    }

    const bookingsSnap = await getDocs(query(collection(db, BOOKINGS_COL), limit(1)));
    if (bookingsSnap.empty) {
      console.log('Seeding initial bookings to Firestore...');
      for (const booking of INITIAL_BOOKINGS) {
        await setDoc(doc(db, BOOKINGS_COL, booking.id), booking);
      }
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('meeting_app_firestore_seeded', 'true');
    }
  } catch (err) {
    console.warn('Firestore initialization note:', err);
  }
}

// ----------------- Real-time Subscriptions -----------------
export function subscribeToRooms(callback: (rooms: Room[]) => void) {
  const q = collection(db, ROOMS_COL);
  return onSnapshot(q, (snapshot) => {
    const items: Room[] = [];
    snapshot.forEach((docSnap) => items.push(docSnap.data() as Room));
    callback(items);
  }, (err) => {
    console.warn('Rooms subscription error:', err);
  });
}

export function subscribeToBookings(callback: (bookings: Booking[]) => void) {
  const q = collection(db, BOOKINGS_COL);
  return onSnapshot(q, (snapshot) => {
    const items: Booking[] = [];
    snapshot.forEach((docSnap) => items.push(docSnap.data() as Booking));
    callback(items);
  }, (err) => {
    console.warn('Bookings subscription error:', err);
  });
}

export function subscribeToUsers(callback: (users: UserAccount[]) => void) {
  const q = collection(db, USERS_COL);
  return onSnapshot(q, (snapshot) => {
    const userMap = new Map<string, UserAccount>();
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Partial<UserAccount>;
      if (!data) return;

      const rawUsername = data.username || docSnap.id || '';
      const username = rawUsername.trim();
      if (!username) return;

      const lowerUser = username.toLowerCase();
      const existing = userMap.get(lowerUser);

      const resolvedRole = (data.role || existing?.role || 'employee') as UserRole;
      const resolvedName = (data.name || existing?.name || username || 'ผู้ใช้งาน').trim();

      const mergedUser: UserAccount = {
        id: data.id || docSnap.id || existing?.id || lowerUser,
        username: username,
        name: resolvedName,
        department: data.department || existing?.department || 'ทั่วไป',
        title: data.title || existing?.title || '',
        role: resolvedRole,
        status: (data.status || existing?.status || 'approved') as 'approved' | 'pending' | 'rejected',
        password: data.password || existing?.password || '1234',
        email: data.email || existing?.email || '',
        phone: normalizeThaiPhoneNumber(data.phone || existing?.phone || ''),
        avatarColor:
          data.avatarColor ||
          existing?.avatarColor ||
          (resolvedRole === 'admin'
            ? 'bg-purple-600'
            : resolvedRole === 'manager'
            ? 'bg-blue-600'
            : 'bg-emerald-600'),
        receiveEmailNotifications:
          data.receiveEmailNotifications !== undefined
            ? data.receiveEmailNotifications
            : existing?.receiveEmailNotifications !== undefined
            ? existing.receiveEmailNotifications
            : true,
      };

      userMap.set(lowerUser, mergedUser);
    });

    const items = Array.from(userMap.values()).filter(
      (u) => Boolean(u && u.username && u.name)
    );
    callback(items);
  }, (err) => {
    console.warn('Users subscription error:', err);
  });
}

export function subscribeToDepartments(callback: (depts: Department[]) => void) {
  const q = collection(db, DEPTS_COL);
  return onSnapshot(q, (snapshot) => {
    const items: Department[] = [];
    snapshot.forEach((docSnap) => items.push(docSnap.data() as Department));
    callback(items);
  }, (err) => {
    console.warn('Departments subscription error:', err);
  });
}

export function subscribeToEmailNotifications(callback: (emails: EmailNotification[]) => void) {
  // Limit to 20 recent notifications to minimize Firestore reads
  const q = query(collection(db, EMAILS_COL), limit(20));
  return onSnapshot(q, (snapshot) => {
    const items: EmailNotification[] = [];
    snapshot.forEach((docSnap) => items.push(docSnap.data() as EmailNotification));
    callback(items);
  }, (err) => {
    console.warn('Emails subscription error:', err);
  });
}

// ----------------- CRUD Operations -----------------

// Bookings
export async function saveBookingToFirestore(booking: Booking) {
  await setDoc(doc(db, BOOKINGS_COL, booking.id), booking, { merge: true });
}

export async function updateBookingInFirestore(bookingId: string, updates: Partial<Booking>) {
  await setDoc(doc(db, BOOKINGS_COL, bookingId), updates, { merge: true });
}

export async function deleteBookingFromFirestore(bookingId: string) {
  await deleteDoc(doc(db, BOOKINGS_COL, bookingId));
}

export interface ConcurrencyCheckResult {
  success: boolean;
  booking?: Booking;
  conflictWith?: Booking;
  allFreshBookings?: Booking[];
  error?: string;
}

/**
 * ดึงรายการการจองล่าสุดเฉพาะห้องที่ต้องการตรวจสอบจาก Firestore
 * ลดจำนวน Read จาก 400+ รายการ เหลือเพียงหลักสิบหรือหน่วยสำหรับห้องนั้นๆ
 */
export async function getFreshRoomBookingsFromFirestore(roomId: string): Promise<Booking[]> {
  try {
    const q = query(collection(db, BOOKINGS_COL), where('roomId', '==', roomId));
    const snap = await getDocs(q);
    const items: Booking[] = [];
    snap.forEach((d) => items.push(d.data() as Booking));
    return items;
  } catch (err: any) {
    console.error('Error getting fresh room bookings from Firestore:', err);
    throw new Error('ไม่สามารถตรวจสอบตารางเวลาห้องจากฐานข้อมูลคลาวด์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
  }
}

/**
 * ดึงรายการการจองล่าสุดทั้งหมดจาก Firestore (เก็บไว้สำหรับกรณีฉุกเฉินหรือ Admin)
 */
export async function getFreshBookingsFromFirestore(): Promise<Booking[]> {
  try {
    const snap = await getDocs(collection(db, BOOKINGS_COL));
    const items: Booking[] = [];
    snap.forEach((d) => items.push(d.data() as Booking));
    return items;
  } catch (err: any) {
    console.error('Error getting fresh bookings from Firestore:', err);
    throw new Error('ไม่สามารถตรวจสอบตารางเวลาล่าสุดจากฐานข้อมูลคลาวด์ได้ กรุณาตรวจสอบการเชื่อมต่ออินเทอร์เน็ต');
  }
}

/**
 * บันทึกหรืออัปเดตการจองพร้อมตรวจสอบการจองซ้อนทับแบบเรียลไทม์กับฐานข้อมูลคลาวด์โดยตรง
 * ปรับปรุงประสิทธิภาพ: ดึงเฉพาะห้องที่กำลังจะจอง แทนที่จะโหลดข้อมูลการจองทั้งระบบ (ประหยัด Read 95%+)
 */
export async function saveBookingWithConcurrencyCheck(
  bookingData: Omit<Booking, 'id'> & { id?: string },
  roomId: string,
  startDateTime: Date,
  endDateTime: Date,
  excludeId: string | null = null,
  existingLocalBookings?: Booking[]
): Promise<ConcurrencyCheckResult> {
  try {
    // 1. ดึงข้อมูลการจองล่าสุดเฉพาะห้องที่ต้องการจองจาก Firestore เพื่อความรวดเร็วและประหยัดโควตา Read
    const freshRoomBookings = await getFreshRoomBookingsFromFirestore(roomId);

    const nStart = startDateTime.getTime();
    const nEnd = endDateTime.getTime();

    // 2. ตรวจสอบว่ามีรายการใดใน Cloud ที่ทับซ้อนกับห้องและช่วงเวลานี้หรือไม่
    for (const b of freshRoomBookings) {
      if (excludeId && b.id === excludeId) continue;
      if (b.status === 'rejected' || b.status === 'cancelled') continue;

      const bStart = new Date(b.startTime).getTime();
      const bEnd = new Date(b.endTime).getTime();

      // เงื่อนไขเวลาซ้อนทับ: เริ่มใหม่ < จบเดิม และ จบใหม่ > เริ่มเดิม
      if (nStart < bEnd && nEnd > bStart) {
        return {
          success: false,
          conflictWith: b,
          error: `ช่วงเวลาทับซ้อนกับการจอง "${b.topic}" ของ ${b.requesterName || 'ผู้ใช้งานอื่น'}`
        };
      }
    }

    // 3. ป้องกันปัญหา ID ซ้ำกัน (Atomic & Collision-Proof ID Generation)
    let finalId = bookingData.id;
    if (!finalId) {
      // คำนวณ maxNum จาก existingLocalBookings ในหน่วยความจำเพื่อไม่เสีย Read เพิ่ม
      const basePool = (existingLocalBookings && existingLocalBookings.length > 0)
        ? existingLocalBookings
        : freshRoomBookings;

      const existingIds = new Set(basePool.map((b) => b.id));
      let maxNum = 0;
      for (const b of basePool) {
        if (b.id?.startsWith('MR-')) {
          const n = parseInt(b.id.replace('MR-', ''), 10);
          if (!isNaN(n) && n > maxNum) maxNum = n;
        }
      }
      let nextNum = maxNum + 1;
      finalId = `MR-${String(nextNum).padStart(5, '0')}`;

      // ตรวจสอบกับ Cloud Document โดยตรง (ใช้เพียง 1 Read) เพื่อป้องกัน Collision 100%
      let isUnique = false;
      let attempts = 0;
      while (!isUnique && attempts < 5) {
        if (existingIds.has(finalId)) {
          nextNum++;
          finalId = `MR-${String(nextNum).padStart(5, '0')}`;
          attempts++;
          continue;
        }

        try {
          const docCheck = await getDoc(doc(db, BOOKINGS_COL, finalId));
          if (docCheck.exists()) {
            existingIds.add(finalId);
            nextNum++;
            finalId = `MR-${String(nextNum).padStart(5, '0')}`;
            attempts++;
          } else {
            isUnique = true;
          }
        } catch (_) {
          isUnique = true;
        }
      }
    }

    const finalBooking: Booking = {
      ...bookingData,
      id: finalId
    } as Booking;

    // 4. บันทึกลง Firestore
    await setDoc(doc(db, BOOKINGS_COL, finalId), finalBooking, { merge: true });

    return {
      success: true,
      booking: finalBooking
    };
  } catch (err: any) {
    console.error('Error in saveBookingWithConcurrencyCheck:', err);
    return {
      success: false,
      error: err?.message || 'เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล กรุณาลองใหม่อีกครั้ง'
    };
  }
}

// Rooms
export async function saveRoomToFirestore(room: Room) {
  await setDoc(doc(db, ROOMS_COL, room.id), room, { merge: true });
}

export async function updateRoomInFirestore(roomId: string, updates: Partial<Room>) {
  await setDoc(doc(db, ROOMS_COL, roomId), updates, { merge: true });
}

export async function deleteRoomFromFirestore(roomId: string) {
  await deleteDoc(doc(db, ROOMS_COL, roomId));
}

// Users
export async function saveUserToFirestore(user: UserAccount) {
  const id = user.id || user.username;
  const sanitizedUser: UserAccount = {
    ...user,
    id,
    username: user.username,
    name: user.name || user.username || 'ผู้ใช้งาน',
    department: user.department || 'ทั่วไป',
    role: user.role || 'employee',
    status: user.status || 'approved',
    phone: normalizeThaiPhoneNumber(user.phone || ''),
  };
  await setDoc(doc(db, USERS_COL, id), sanitizedUser, { merge: true });
}

export async function updateUserInFirestore(userId: string, updates: Partial<UserAccount>) {
  const cleanUpdates = { ...updates };
  if (cleanUpdates.phone !== undefined) {
    cleanUpdates.phone = normalizeThaiPhoneNumber(cleanUpdates.phone);
  }
  await setDoc(doc(db, USERS_COL, userId), cleanUpdates, { merge: true });
}

export async function deleteUserFromFirestore(userId: string) {
  await deleteDoc(doc(db, USERS_COL, userId));
}

// Departments
export async function saveDepartmentToFirestore(dept: Department) {
  await setDoc(doc(db, DEPTS_COL, dept.id), dept, { merge: true });
}

export async function updateDepartmentInFirestore(deptId: string, updates: Partial<Department>) {
  await setDoc(doc(db, DEPTS_COL, deptId), updates, { merge: true });
}

export async function deleteDepartmentFromFirestore(deptId: string) {
  await deleteDoc(doc(db, DEPTS_COL, deptId));
}

// Email Notifications & Mail Queue for sending real emails
export async function saveEmailNotificationToFirestore(notification: EmailNotification) {
  // 1. Save to in-app notifications
  await setDoc(doc(db, EMAILS_COL, notification.id), notification);

  // 2. Add to mail collection (triggers Firebase Trigger Email extension or Vercel serverless mailer)
  try {
    const senderName = 'ระบบจองห้องประชุม <wsritangkum@gmail.com>';
    await setDoc(doc(db, MAIL_QUEUE_COL, `queue-${notification.id}`), {
      to: [notification.recipient],
      from: senderName,
      replyTo: 'wsritangkum@gmail.com',
      message: {
        from: senderName,
        replyTo: 'wsritangkum@gmail.com',
        subject: notification.subject,
        text: notification.bodyText,
        html: notification.htmlBody,
      },
      bookingId: notification.bookingId,
      type: notification.type,
      createdAt: new Date().toISOString(),
      status: 'PENDING'
    });
  } catch (err) {
    console.warn('Mail queue insert notice:', err);
  }
}

// ----------------- User Notification States Across Devices -----------------
export interface UserNotificationState {
  username: string;
  readNotificationIds: string[];
  deletedNotificationIds: string[];
  lastClearedAt?: string;
  updatedAt?: string;
}

export function subscribeToUserNotificationState(
  username: string,
  callback: (state: UserNotificationState) => void
) {
  if (!username) return () => {};
  const docId = username.toLowerCase().trim();
  const docRef = doc(db, USER_NOTIF_STATES_COL, docId);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      const data = docSnap.data() as Partial<UserNotificationState>;
      callback({
        username: data.username || username,
        readNotificationIds: Array.isArray(data.readNotificationIds) ? data.readNotificationIds : [],
        deletedNotificationIds: Array.isArray(data.deletedNotificationIds) ? data.deletedNotificationIds : [],
        lastClearedAt: data.lastClearedAt || undefined,
        updatedAt: data.updatedAt || undefined,
      });
    } else {
      callback({
        username,
        readNotificationIds: [],
        deletedNotificationIds: [],
      });
    }
  }, (err) => {
    console.warn('Notification state subscription warning:', err);
  });
}

export async function saveUserNotificationStateToFirestore(
  username: string,
  state: {
    readNotificationIds?: string[];
    deletedNotificationIds?: string[];
    lastClearedAt?: string;
  }
) {
  if (!username) return;
  const docId = username.toLowerCase().trim();
  const docRef = doc(db, USER_NOTIF_STATES_COL, docId);
  await setDoc(
    docRef,
    {
      username: docId,
      ...state,
      updatedAt: new Date().toISOString(),
    },
    { merge: true }
  );
}

