import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore';
import { db } from './firebase';
import { Room, Booking, UserAccount, Department, EmailNotification } from '../types';
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

// Initialize default data if firestore is empty
export async function initializeFirestoreDefaults() {
  try {
    const roomsSnap = await getDocs(collection(db, ROOMS_COL));
    if (roomsSnap.empty) {
      console.log('Seeding initial rooms to Firestore...');
      for (const room of INITIAL_ROOMS) {
        await setDoc(doc(db, ROOMS_COL, room.id), room);
      }
    }

    const deptsSnap = await getDocs(collection(db, DEPTS_COL));
    if (deptsSnap.empty) {
      console.log('Seeding initial departments to Firestore...');
      for (const dept of INITIAL_DEPARTMENTS) {
        await setDoc(doc(db, DEPTS_COL, dept.id), dept);
      }
    }

    const usersSnap = await getDocs(collection(db, USERS_COL));
    if (usersSnap.empty) {
      console.log('Seeding initial users to Firestore...');
      for (const user of CORPORATE_USERS) {
        const id = user.id || user.username;
        await setDoc(doc(db, USERS_COL, id), { ...user, id });
      }
    }

    const bookingsSnap = await getDocs(collection(db, BOOKINGS_COL));
    if (bookingsSnap.empty) {
      console.log('Seeding initial bookings to Firestore...');
      for (const booking of INITIAL_BOOKINGS) {
        await setDoc(doc(db, BOOKINGS_COL, booking.id), booking);
      }
    }
  } catch (err) {
    console.warn('Firestore initialization note:', err);
  }
}

// ----------------- Real-time Subscriptions -----------------
export function subscribeToRooms(callback: (rooms: Room[]) => void) {
  const q = collection(db, ROOMS_COL);
  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      const items: Room[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as Room));
      callback(items);
    }
  }, (err) => {
    console.warn('Rooms subscription error:', err);
  });
}

export function subscribeToBookings(callback: (bookings: Booking[]) => void) {
  const q = collection(db, BOOKINGS_COL);
  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      const items: Booking[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as Booking));
      callback(items);
    }
  }, (err) => {
    console.warn('Bookings subscription error:', err);
  });
}

export function subscribeToUsers(callback: (users: UserAccount[]) => void) {
  const q = collection(db, USERS_COL);
  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      const items: UserAccount[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as UserAccount));
      callback(items);
    }
  }, (err) => {
    console.warn('Users subscription error:', err);
  });
}

export function subscribeToDepartments(callback: (depts: Department[]) => void) {
  const q = collection(db, DEPTS_COL);
  return onSnapshot(q, (snapshot) => {
    if (!snapshot.empty) {
      const items: Department[] = [];
      snapshot.forEach((docSnap) => items.push(docSnap.data() as Department));
      callback(items);
    }
  }, (err) => {
    console.warn('Departments subscription error:', err);
  });
}

export function subscribeToEmailNotifications(callback: (emails: EmailNotification[]) => void) {
  const q = collection(db, EMAILS_COL);
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
  await setDoc(doc(db, BOOKINGS_COL, booking.id), booking);
}

export async function updateBookingInFirestore(bookingId: string, updates: Partial<Booking>) {
  await updateDoc(doc(db, BOOKINGS_COL, bookingId), updates);
}

export async function deleteBookingFromFirestore(bookingId: string) {
  await deleteDoc(doc(db, BOOKINGS_COL, bookingId));
}

// Rooms
export async function saveRoomToFirestore(room: Room) {
  await setDoc(doc(db, ROOMS_COL, room.id), room);
}

export async function updateRoomInFirestore(roomId: string, updates: Partial<Room>) {
  await updateDoc(doc(db, ROOMS_COL, roomId), updates);
}

export async function deleteRoomFromFirestore(roomId: string) {
  await deleteDoc(doc(db, ROOMS_COL, roomId));
}

// Users
export async function saveUserToFirestore(user: UserAccount) {
  const id = user.id || user.username;
  await setDoc(doc(db, USERS_COL, id), { ...user, id });
}

export async function updateUserInFirestore(userId: string, updates: Partial<UserAccount>) {
  await updateDoc(doc(db, USERS_COL, userId), updates);
}

export async function deleteUserFromFirestore(userId: string) {
  await deleteDoc(doc(db, USERS_COL, userId));
}

// Departments
export async function saveDepartmentToFirestore(dept: Department) {
  await setDoc(doc(db, DEPTS_COL, dept.id), dept);
}

export async function updateDepartmentInFirestore(deptId: string, updates: Partial<Department>) {
  await updateDoc(doc(db, DEPTS_COL, deptId), updates);
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
    await setDoc(doc(db, MAIL_QUEUE_COL, `queue-${notification.id}`), {
      to: [notification.recipient],
      message: {
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
