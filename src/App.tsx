import React, { useState, useEffect, useMemo } from 'react';
import {
  Check,
  AlertCircle,
  Mail as MailIcon,
  BarChart3,
  Settings,
  CalendarDays
} from 'lucide-react';
import { Room, Booking, UserAccount, EmailNotification, CalendarView, UserRole, Department } from './types';
import {
  INITIAL_ROOMS,
  INITIAL_BOOKINGS,
  CORPORATE_USERS,
  INITIAL_DEPARTMENTS,
  normalizeSeatingName,
  normalizeEquipmentName
} from './data/initialData';
import { createEmailNotifications } from './utils/emailService';
import { checkBookingOverlap, formatThaiDate, formatThaiTime, SELECTABLE_TIMES } from './utils/thaiDate';
import {
  initializeFirestoreDefaults,
  subscribeToRooms,
  subscribeToBookings,
  subscribeToUsers,
  subscribeToDepartments,
  subscribeToEmailNotifications,
  saveBookingToFirestore,
  updateBookingInFirestore,
  deleteBookingFromFirestore,
  saveRoomToFirestore,
  updateRoomInFirestore,
  deleteRoomFromFirestore,
  saveUserToFirestore,
  updateUserInFirestore,
  deleteUserFromFirestore,
  saveDepartmentToFirestore,
  updateDepartmentInFirestore,
  deleteDepartmentFromFirestore,
  saveBookingWithConcurrencyCheck
} from './lib/firestoreService';

// Components
import { Header } from './components/Header';
import { CalendarHeader } from './components/CalendarHeader';
import { DayView } from './components/DayView';
import { WeekView } from './components/WeekView';
import { MonthView } from './components/MonthView';
import { BookingModal } from './components/BookingModal';
import { BookingDetailModal } from './components/BookingDetailModal';
import { MyBookingsModal } from './components/MyBookingsModal';
import { ManagerApprovalModal } from './components/ManagerApprovalModal';
import { AdminReports } from './components/AdminReports';
import { AdminManageTable } from './components/AdminManageTable';
import { SsoLoginModal } from './components/SsoLoginModal';
import { BookingGuideModal } from './components/BookingGuideModal';
import { EmailNotificationModal } from './components/EmailNotificationModal';
import { NotificationCenterModal } from './components/NotificationCenterModal';
import { RoomManagementModal } from './components/RoomManagementModal';
import { BlockRoomModal } from './components/BlockRoomModal';
import { ManagementPortal } from './components/ManagementPortal';
import {
  AdminLoginModal,
  CancelBookingModal,
  RejectModal,
  ResendEmailModal,
  DeleteConfirmModal
} from './components/ConfirmModals';

export default function App() {
  // --- Page Navigation State (Separated Booking vs Login/Management) ---
  const [activePage, setActivePage] = useState<'booking' | 'management'>('booking');

  // --- Persistent Storage State ---
  const [rooms, setRooms] = useState<Room[]>(() => {
    try {
      const saved = localStorage.getItem('meeting_app_rooms');
      const rawRooms: Room[] = saved ? JSON.parse(saved) : INITIAL_ROOMS;
      if (Array.isArray(rawRooms) && rawRooms.length > 0) {
        return rawRooms.map((r: Room) => ({
          ...r,
          equipment: (r.equipment || []).map(normalizeEquipmentName).filter(Boolean),
          seatingOptions: (r.seatingOptions || []).map(normalizeSeatingName).filter(Boolean)
        }));
      }
      return INITIAL_ROOMS;
    } catch {
      return INITIAL_ROOMS;
    }
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    try {
      const saved = localStorage.getItem('meeting_app_bookings');
      let rawBookings: Booking[] = saved ? JSON.parse(saved) : INITIAL_BOOKINGS;
      if (Array.isArray(rawBookings) && rawBookings.length > 0) {
        // Automatically purge legacy mock items (e.g. MR-00001 to MR-00007 from old mock data)
        const mockIds = new Set(['MR-00001', 'MR-00002', 'MR-00003', 'MR-00004', 'MR-00005', 'MR-00006', 'MR-00007']);
        rawBookings = rawBookings.filter((b: Booking) => !mockIds.has(b.id));
        return rawBookings.map((b: Booking) => ({
          ...b,
          seatingSetup: b.seatingSetup ? normalizeSeatingName(b.seatingSetup) : b.seatingSetup,
          equipment: Array.isArray(b.equipment)
            ? b.equipment.map(normalizeEquipmentName).filter(Boolean)
            : typeof b.equipment === 'string' && b.equipment
            ? (b.equipment as string).split(', ').map(normalizeEquipmentName).filter(Boolean)
            : []
        }));
      }
      return INITIAL_BOOKINGS;
    } catch {
      return INITIAL_BOOKINGS;
    }
  });

  const [emailNotifications, setEmailNotifications] = useState<EmailNotification[]>(() => {
    try {
      const saved = localStorage.getItem('meeting_app_emails');
      if (saved) return JSON.parse(saved);
      if (INITIAL_BOOKINGS.length > 0 && INITIAL_BOOKINGS[0]) {
        return createEmailNotifications(INITIAL_BOOKINGS[0], 'APPROVED', INITIAL_ROOMS);
      }
      return [];
    } catch {
      return [];
    }
  });

  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    try {
      const saved = localStorage.getItem('meeting_app_sso_user');
      if (saved) {
        const u = JSON.parse(saved);
        if (u && (!u.status || u.status === 'approved')) return u;
      }
      return null;
    } catch {
      return null;
    }
  });

  const [users, setUsers] = useState<UserAccount[]>(() => {
    try {
      const saved = localStorage.getItem('meeting_app_users');
      let rawUsers: UserAccount[] = saved ? JSON.parse(saved) : CORPORATE_USERS;
      if (Array.isArray(rawUsers) && rawUsers.length > 0) {
        const legacyMockUsers = new Set(['admin1', 'mgr1', 'mgr2', 'mgr3', 'user1', 'user2', 'user3', 'user4', 'user5', 'user6', 'user7', 'napa.reg', 'panu.reg']);
        rawUsers = rawUsers.filter((u: UserAccount) => !legacyMockUsers.has(u.username));
        if (rawUsers.length === 0) return CORPORATE_USERS;
        return rawUsers;
      }
      return CORPORATE_USERS;
    } catch {
      return CORPORATE_USERS;
    }
  });

  const [departments, setDepartments] = useState<Department[]>(() => {
    try {
      const saved = localStorage.getItem('meeting_app_departments');
      return saved ? JSON.parse(saved) : INITIAL_DEPARTMENTS;
    } catch {
      return INITIAL_DEPARTMENTS;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      const savedAuth = localStorage.getItem('meeting_app_admin_auth');
      const savedUser = localStorage.getItem('meeting_app_sso_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u && u.role === 'admin') return true;
      }
      return savedAuth === 'true';
    } catch {
      return false;
    }
  });

  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    try {
      const savedUser = localStorage.getItem('meeting_app_sso_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u && u.role === 'admin') return true;
      }
      return localStorage.getItem('meeting_app_admin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarView>('day');
  const [adminTab, setAdminTab] = useState<'manage' | 'reports'>('manage');

  // Selected state for modals
  const [selectedSlotRoom, setSelectedSlotRoom] = useState<Room | undefined>(undefined);
  const [selectedSlotTime, setSelectedSlotTime] = useState<string | null>(null);
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [viewingBooking, setViewingBooking] = useState<Booking | null>(null);
  const [targetCancelBooking, setTargetCancelBooking] = useState<Booking | null>(null);
  const [targetRejectBookingId, setTargetRejectBookingId] = useState<string | null>(null);
  const [targetResendBooking, setTargetResendBooking] = useState<Booking | null>(null);
  const [editingRoomForModal, setEditingRoomForModal] = useState<Room | null>(null);

  // Modal open states
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isMyBookingsOpen, setIsMyBookingsOpen] = useState(false);
  const [isManagerPortalOpen, setIsManagerPortalOpen] = useState(false);
  const [isSsoModalOpen, setIsSsoModalOpen] = useState(false);
  const [pendingBookingSlot, setPendingBookingSlot] = useState<{
    room: Room;
    time: string;
    date?: Date;
  } | null>(null);
  const [loginModalReason, setLoginModalReason] = useState<string | null>(null);
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState(false);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [isNotificationModalOpen, setIsNotificationModalOpen] = useState(false);
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [isResendModalOpen, setIsResendModalOpen] = useState(false);

  // Universal Delete Confirmation Modal State
  const [deleteModalState, setDeleteModalState] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    itemDetails?: { label: string; value: string }[];
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {}
  });

  // Toast feedback
  const [toast, setToast] = useState<{
    message: string;
    type: 'success' | 'error' | 'info';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 3500);
  };

  // --- Firestore Real-time Subscriptions & Default Data Initialization ---
  useEffect(() => {
    // Seed initial data if empty
    initializeFirestoreDefaults();

    // Subscribe to Firestore collections
    const unsubRooms = subscribeToRooms((cloudRooms) => {
      if (cloudRooms && cloudRooms.length > 0) {
        setRooms(cloudRooms);
      }
    });

    const unsubBookings = subscribeToBookings((cloudBookings) => {
      setBookings(cloudBookings || []);
      try {
        localStorage.setItem('meeting_app_bookings', JSON.stringify(cloudBookings || []));
      } catch (_) {}
    });

    const unsubUsers = subscribeToUsers((cloudUsers) => {
      if (cloudUsers && cloudUsers.length > 0) {
        setUsers(cloudUsers);
        try {
          localStorage.setItem('meeting_app_users', JSON.stringify(cloudUsers));
        } catch (_) {}
      }
    });

    const unsubDepts = subscribeToDepartments((cloudDepts) => {
      if (cloudDepts && cloudDepts.length > 0) {
        setDepartments(cloudDepts);
      }
    });

    const unsubEmails = subscribeToEmailNotifications((cloudEmails) => {
      if (cloudEmails) {
        setEmailNotifications(cloudEmails);
      }
    });

    return () => {
      unsubRooms();
      unsubBookings();
      unsubUsers();
      unsubDepts();
      unsubEmails();
    };
  }, []);

  // Sync to localStorage (Fallback and instant cache)
  useEffect(() => {
    try {
      localStorage.setItem('meeting_app_rooms', JSON.stringify(rooms));
    } catch (_) {}
  }, [rooms]);

  useEffect(() => {
    try {
      localStorage.setItem('meeting_app_bookings', JSON.stringify(bookings));
    } catch (_) {}
  }, [bookings]);

  useEffect(() => {
    try {
      localStorage.setItem('meeting_app_emails', JSON.stringify(emailNotifications));
    } catch (_) {}
  }, [emailNotifications]);

  useEffect(() => {
    try {
      localStorage.setItem('meeting_app_users', JSON.stringify(users));
    } catch (_) {}
  }, [users]);

  useEffect(() => {
    try {
      localStorage.setItem('meeting_app_departments', JSON.stringify(departments));
    } catch (_) {}
  }, [departments]);

  useEffect(() => {
    try {
      if (currentUser) {
        localStorage.setItem('meeting_app_sso_user', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('meeting_app_sso_user');
      }
    } catch (_) {}
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('meeting_app_admin_auth', isAuthenticated ? 'true' : 'false');
  }, [isAuthenticated]);

  // Prevent BookingDetailModal from popping up on initial page load
  // Clean up any lingering or stale hash in URL and only handle explicit user hashchange events
  useEffect(() => {
    // 1. Immediately clear any lingering hash on page load so the main calendar displays cleanly
    if (window.location.hash) {
      try {
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search
        );
      } catch (_) {}
    }

    // 2. Handle active in-session hash change if a user triggers an action
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash && hash.includes('bookingId=')) {
        const id = hash.split('bookingId=')[1]?.replace(/[^a-zA-Z0-9_-]/g, '');
        if (id) {
          const found = bookings.find((b) => b.id === id);
          if (found) {
            setViewingBooking(found);
            setIsDetailModalOpen(true);
          }
        }
        // Clean up hash immediately so refreshing won't reopen the modal
        try {
          window.history.replaceState(
            null,
            '',
            window.location.pathname + window.location.search
          );
        } catch (_) {}
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [bookings]);

  // Unread emails count
  const unreadEmailCount = useMemo(() => {
    return emailNotifications.filter((e) => !e.isRead).length;
  }, [emailNotifications]);

  // Current user's bookings count (active or pending, excluding cancelled)
  const myBookingsCount = useMemo(() => {
    if (!currentUser) return 0;
    return bookings.filter(
      (b) => {
        const matchUsername = b.username?.toLowerCase() === currentUser.username.toLowerCase();
        const matchName = b.requesterName && b.requesterName.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
        const matchEmail = currentUser.email && b.email && b.email.toLowerCase() === currentUser.email.toLowerCase();
        
        return (matchUsername || matchName || matchEmail) && !b.isBlocked && b.status !== 'cancelled';
      }
    ).length;
  }, [bookings, currentUser]);

  // Pending bookings count for Admin & Super Admin (all users)
  const pendingDeptCount = useMemo(() => {
    if (!currentUser || (currentUser.role !== 'manager' && currentUser.role !== 'admin')) return 0;
    return bookings.filter(
      (b) =>
        b.status === 'pending' &&
        !b.isBlocked
    ).length;
  }, [bookings, currentUser]);

  // Persistent read notifications tracking per username
  const [readNotificationIds, setReadNotificationIds] = useState<string[]>(() => {
    try {
      const savedUser = localStorage.getItem('meeting_app_sso_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u?.username) {
          const saved = localStorage.getItem(`meeting_app_read_notifs_${u.username.toLowerCase()}`);
          return saved ? JSON.parse(saved) : [];
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // Persistent deleted notifications tracking per username
  const [deletedNotificationIds, setDeletedNotificationIds] = useState<string[]>(() => {
    try {
      const savedUser = localStorage.getItem('meeting_app_sso_user');
      if (savedUser) {
        const u = JSON.parse(savedUser);
        if (u?.username) {
          const saved = localStorage.getItem(`meeting_app_deleted_notifs_${u.username.toLowerCase()}`);
          return saved ? JSON.parse(saved) : [];
        }
      }
      return [];
    } catch {
      return [];
    }
  });

  // Sync readNotificationIds and deletedNotificationIds on currentUser change
  useEffect(() => {
    if (currentUser?.username) {
      try {
        const savedRead = localStorage.getItem(`meeting_app_read_notifs_${currentUser.username.toLowerCase()}`);
        setReadNotificationIds(savedRead ? JSON.parse(savedRead) : []);
        const savedDeleted = localStorage.getItem(`meeting_app_deleted_notifs_${currentUser.username.toLowerCase()}`);
        setDeletedNotificationIds(savedDeleted ? JSON.parse(savedDeleted) : []);
      } catch {
        setReadNotificationIds([]);
        setDeletedNotificationIds([]);
      }
    } else {
      setReadNotificationIds([]);
      setDeletedNotificationIds([]);
    }
  }, [currentUser?.username]);

  const handleMarkNotificationsRead = (idsToMark: string[]) => {
    if (!currentUser?.username || idsToMark.length === 0) return;
    setReadNotificationIds((prev) => {
      const combined = Array.from(new Set([...prev, ...idsToMark]));
      try {
        localStorage.setItem(`meeting_app_read_notifs_${currentUser.username.toLowerCase()}`, JSON.stringify(combined));
      } catch (e) {
        console.error('Error saving read notifications', e);
      }
      return combined;
    });
  };

  const handleDeleteNotifications = (idsToDelete: string[]) => {
    if (!currentUser?.username || idsToDelete.length === 0) return;
    setDeletedNotificationIds((prev) => {
      const combined = Array.from(new Set([...prev, ...idsToDelete]));
      try {
        localStorage.setItem(`meeting_app_deleted_notifs_${currentUser.username.toLowerCase()}`, JSON.stringify(combined));
      } catch (e) {
        console.error('Error saving deleted notifications', e);
      }
      return combined;
    });
    showToast(
      idsToDelete.length > 1
        ? `ลบข้อความแจ้งเตือนทั้งหมดเรียบร้อยแล้ว`
        : `ลบข้อความแจ้งเตือนเรียบร้อยแล้ว`,
      'info'
    );
  };

  // Pending user registrations count (for Admin badge)
  const pendingUsers = useMemo(() => {
    return users.filter((u) => u.status === 'pending');
  }, [users]);

  // Total notification count for header badge (counting only unread & non-deleted notifications)
  const totalNotificationsCount = useMemo(() => {
    if (!currentUser) return 0;
    const readSet = new Set(readNotificationIds);
    const deletedSet = new Set(deletedNotificationIds);
    let count = 0;

    // 1. Pending member registrations (for Admin & Manager)
    if (currentUser.role === 'admin' || currentUser.role === 'manager') {
      const pendingUsersList = users.filter((u) => u.status === 'pending');
      pendingUsersList.forEach((u) => {
        const id = `user_pending_${u.username}`;
        if (!deletedSet.has(id) && !readSet.has(id)) {
          count++;
        }
      });
    }

    // 2. Booking notifications
    bookings.forEach((b) => {
      const isMine =
        b.username?.toLowerCase() === currentUser.username.toLowerCase() ||
        (b.requesterName && b.requesterName.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) ||
        (currentUser.email && b.email && b.email.toLowerCase() === currentUser.email.toLowerCase());
      const isAdmin = currentUser.role === 'admin' || currentUser.role === 'manager';

      if (!isAdmin && !isMine) return;

      const checkAndIncrement = (id: string) => {
        if (!deletedSet.has(id) && !readSet.has(id)) count++;
      };

      if (b.status === 'pending') {
        checkAndIncrement(`booking_pending_${b.id}`);
      } else if (b.status === 'approved') {
        checkAndIncrement(`booking_approved_${b.id}`);
      } else if (b.status === 'rejected') {
        checkAndIncrement(`booking_rejected_${b.id}`);
      } else if (b.status === 'cancelled') {
        checkAndIncrement(`booking_cancelled_${b.id}`);
      }
    });

    return count;
  }, [currentUser, users, bookings, readNotificationIds, deletedNotificationIds]);

  // --- Handlers ---
  const handleOpenSlot = (room: Room, time?: string, customDate?: Date) => {
    const targetDate = customDate || currentDate;
    const now = new Date();
    const isToday =
      targetDate.getFullYear() === now.getFullYear() &&
      targetDate.getMonth() === now.getMonth() &&
      targetDate.getDate() === now.getDate();

    let chosenTime = time;

    // If time is provided, check if it is in the past
    if (chosenTime) {
      const [h, m] = chosenTime.split(':').map(Number);
      const slotDateTime = new Date(targetDate);
      slotDateTime.setHours(h, m, 0, 0);
      const graceTime = new Date(now.getTime() - 60 * 1000);

      // If requested for today and the requested slot time is in the past, auto-find next upcoming slot
      if (slotDateTime < graceTime) {
        if (isToday) {
          const upcoming = SELECTABLE_TIMES.find((t) => {
            const [th, tm] = t.split(':').map(Number);
            const slotD = new Date();
            slotD.setHours(th, tm, 0, 0);
            return slotD > graceTime;
          });
          if (upcoming) {
            chosenTime = upcoming;
          } else {
            showToast('หมดเวลาทำการจองสำหรับวันนี้แล้ว กรุณาเลือกวันอื่น', 'error');
            return;
          }
        } else if (targetDate < new Date(now.getFullYear(), now.getMonth(), now.getDate())) {
          showToast('ไม่สามารถจองห้องประชุมย้อนหลังได้ กรุณาเลือกช่วงเวลาปัจจุบันหรือล่วงหน้า', 'error');
          return;
        }
      }
    } else {
      // If no time provided (e.g. from general "Book this room" button)
      if (isToday) {
        const upcoming = SELECTABLE_TIMES.find((t) => {
          const [th, tm] = t.split(':').map(Number);
          const slotD = new Date();
          slotD.setHours(th, tm, 0, 0);
          return slotD > new Date(now.getTime() - 60 * 1000);
        });
        chosenTime = upcoming || '09:00';
      } else {
        chosenTime = '09:00';
      }
    }

    if (customDate) setCurrentDate(customDate);
    setSelectedSlotRoom(room);
    setSelectedSlotTime(chosenTime);
    setEditingBooking(null);

    // If not logged in: display login modal first with context
    if (!currentUser) {
      setPendingBookingSlot({ room, time: chosenTime, date: customDate || currentDate });
      setLoginModalReason(`กรุณาเข้าสู่ระบบก่อนทำการจองห้อง "${room.name}" (ช่วงเวลา ${chosenTime})`);
      setIsSsoModalOpen(true);
      return;
    }

    setIsBookingModalOpen(true);
  };

  const handleQuickBook = () => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(currentDate);
    checkDate.setHours(0, 0, 0, 0);
    const targetDate = checkDate < today ? new Date() : currentDate;
    if (checkDate < today) {
      setCurrentDate(targetDate);
    }

    const defaultRoom = rooms[0];
    let defaultTime = '09:00';

    const isToday =
      targetDate.getFullYear() === now.getFullYear() &&
      targetDate.getMonth() === now.getMonth() &&
      targetDate.getDate() === now.getDate();

    if (isToday) {
      const upcoming = SELECTABLE_TIMES.find((t) => {
        const [h, m] = t.split(':').map(Number);
        const slotD = new Date();
        slotD.setHours(h, m, 0, 0);
        return slotD > new Date(Date.now() + 5 * 60 * 1000);
      });
      if (upcoming) defaultTime = upcoming;
    }

    setSelectedSlotRoom(defaultRoom);
    setSelectedSlotTime(defaultTime);
    setEditingBooking(null);

    // If not logged in: display login modal first
    if (!currentUser) {
      setPendingBookingSlot({ room: defaultRoom, time: defaultTime, date: targetDate });
      setLoginModalReason('กรุณาเข้าสู่ระบบก่อนทำการจองห้องประชุม');
      setIsSsoModalOpen(true);
      return;
    }

    setIsBookingModalOpen(true);
  };

  const handleBookingSubmit = async (formData: any) => {
    const room = selectedSlotRoom || rooms.find((r) => r.id === editingBooking?.roomId);
    if (!room) {
      showToast('กรุณาเลือกห้องประชุม', 'error');
      return;
    }

    const [sH, sM] = formData.startTime.split(':').map(Number);
    const [eH, eM] = formData.endTime.split(':').map(Number);

    const startDateTime = new Date(formData.bookingStartDate);
    startDateTime.setHours(sH, sM, 0, 0);

    const endDateTime = new Date(formData.bookingEndDate);
    endDateTime.setHours(eH, eM, 0, 0);

    const now = new Date();
    const graceTime = new Date(now.getTime() - 60 * 1000);

    if (!editingBooking && startDateTime < graceTime) {
      showToast('ไม่สามารถจองห้องประชุมย้อนหลังได้ กรุณาเลือกช่วงเวลาและวันที่เป็นปัจจุบันหรือล่วงหน้า', 'error');
      return;
    }

    if (endDateTime <= startDateTime) {
      showToast('เวลาหรือวันที่สิ้นสุดต้องเกิดขึ้นหลังจากเวลาเริ่มต้น', 'error');
      return;
    }

    // 1. Initial Local Overlap check (Instant feedback)
    const excludeId = editingBooking ? editingBooking.id : null;
    const localOverlapResult = checkBookingOverlap(bookings, room.id, startDateTime, endDateTime, excludeId);
    if (localOverlapResult.overlap) {
      showToast(
        `ไม่สามารถจองได้ เนื่องจากเวลาทับซ้อนกับการจอง "${localOverlapResult.conflictWith?.topic}" (${formatThaiTime(localOverlapResult.conflictWith?.startTime || '')} - ${formatThaiTime(localOverlapResult.conflictWith?.endTime || '')} น.)`,
        'error'
      );
      return;
    }

    setIsSubmittingBooking(true);

    try {
      if (editingBooking) {
        // Update existing booking with Server Concurrency & Fresh Overlap Verification
        const updatedData: Booking = {
          ...editingBooking,
          ...formData,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          roomId: room.id
        };

        const result = await saveBookingWithConcurrencyCheck(
          updatedData,
          room.id,
          startDateTime,
          endDateTime,
          editingBooking.id
        );

        if (!result.success) {
          if (result.conflictWith) {
            showToast(
              `⚠️ ไม่สามารถแก้ไขได้: ช่วงเวลาทับซ้อนกับการจอง "${result.conflictWith.topic}" ของ ${result.conflictWith.requesterName || 'ผู้ใช้อื่น'} (${formatThaiTime(result.conflictWith.startTime)} - ${formatThaiTime(result.conflictWith.endTime)} น.)`,
              'error'
            );
            if (result.allFreshBookings) {
              setBookings(result.allFreshBookings);
            }
          } else {
            showToast(result.error || 'เกิดข้อผิดพลาดในการตรวจสอบข้อมูลกับฐานข้อมูล', 'error');
          }
          return;
        }

        const savedBooking = result.booking || updatedData;
        setBookings((prev) => prev.map((b) => (b.id === savedBooking.id ? savedBooking : b)));
        showToast('บันทึกการแก้ไขข้อมูลเรียบร้อยแล้ว', 'success');
        setIsBookingModalOpen(false);
        setEditingBooking(null);
      } else {
        // Create new booking with Server Concurrency Check & Collision-free ID
        const newBookingData: Omit<Booking, 'id'> = {
          roomId: room.id,
          topic: formData.topic,
          department: formData.department || currentUser?.department || 'ฝ่ายบริหารงานทั่วไป',
          requesterName: formData.requesterName,
          phone: formData.phone,
          email: formData.email,
          institute: formData.institute,
          startTime: startDateTime.toISOString(),
          endTime: endDateTime.toISOString(),
          participants: formData.participants,
          snacks: formData.snacks,
          lunch: formData.lunch,
          drinks: formData.drinks,
          equipment: formData.equipment,
          meetingType: formData.meetingType,
          meetingLink: formData.meetingLink,
          seatingSetup: formData.seatingSetup,
          createdAt: new Date().toISOString(),
          status: 'pending',
          isBlocked: false
        };

        const result = await saveBookingWithConcurrencyCheck(
          newBookingData,
          room.id,
          startDateTime,
          endDateTime,
          null
        );

        if (!result.success) {
          // Race condition caught! Another user booked in this timeslot
          if (result.conflictWith) {
            showToast(
              `⚠️ ไม่สามารถส่งคำขอได้: มีผู้ใช้งานท่านอื่น ("${result.conflictWith.requesterName || result.conflictWith.topic}") เพิ่งส่งคำขอจองห้องนี้ในช่วงเวลาดังกล่าว กรุณาเลือกช่วงเวลาอื่น`,
              'error'
            );
            if (result.allFreshBookings) {
              setBookings(result.allFreshBookings);
            }
          } else {
            showToast(result.error || 'เกิดข้อผิดพลาดในการตรวจสอบคิวว่างกับฐานข้อมูล', 'error');
          }
          return;
        }

        const newBooking = result.booking!;
        setBookings((prev) => [newBooking, ...prev.filter((b) => b.id !== newBooking.id)]);

        // Trigger Email Notification (RECEIVED)
        const newMails = createEmailNotifications(newBooking, 'RECEIVED', rooms);
        setEmailNotifications((prev) => [...newMails, ...prev]);

        showToast(`ส่งคำขอจองเรียบร้อย รหัส ${newBooking.id} (รอการอนุมัติและส่งอีเมลแจ้งเตือนแล้ว)`, 'success');
        setIsBookingModalOpen(false);
        setEditingBooking(null);

        // Open detail modal to show summary & Google Calendar option
        setViewingBooking(newBooking);
        setIsDetailModalOpen(true);
      }
    } catch (err: any) {
      console.error('Error submitting booking:', err);
      showToast('เกิดข้อผิดพลาดในการส่งคำขอจอง กรุณาลองใหม่อีกครั้ง', 'error');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  const handleBatchImportBookings = async (newBookings: Booking[]) => {
    if (!newBookings || newBookings.length === 0) return;

    setBookings((prev) => [...newBookings, ...prev]);

    for (const b of newBookings) {
      saveBookingToFirestore(b).catch((err) =>
        console.warn('Error saving imported booking to Firestore:', b.id, err)
      );
    }

    showToast(
      `นำเข้าข้อมูลรายการจองสำเร็จทั้งหมด ${newBookings.length} รายการ`,
      'success'
    );
  };

  const handleApprove = (idOrBooking: string | Booking) => {
    const targetId = typeof idOrBooking === 'string' ? idOrBooking : idOrBooking.id;
    const target = bookings.find((b) => b.id === targetId);
    if (!target) return;

    const updated: Booking = { ...target, status: 'approved' };
    setBookings((prev) => prev.map((b) => (b.id === targetId ? updated : b)));
    updateBookingInFirestore(targetId, { status: 'approved' }).catch(console.warn);

    // Send email notification (APPROVED)
    const newMails = createEmailNotifications(updated, 'APPROVED', rooms);
    setEmailNotifications((prev) => [...newMails, ...prev]);

    showToast(`อนุมัติการจอง "${target.topic}" เรียบร้อยแล้ว พร้อมส่งอีเมลแจ้งเตือน`, 'success');
    if (viewingBooking?.id === targetId) {
      setViewingBooking(updated);
    }
  };

  const handleRejectClick = (idOrBooking: string | Booking) => {
    const id = typeof idOrBooking === 'string' ? idOrBooking : idOrBooking.id;
    setTargetRejectBookingId(id);
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = (reason: string) => {
    if (!targetRejectBookingId) return;
    const target = bookings.find((b) => b.id === targetRejectBookingId);
    if (!target) return;

    const updated: Booking = {
      ...target,
      status: 'rejected',
      rejectionReason: reason
    };

    setBookings((prev) => prev.map((b) => (b.id === target.id ? updated : b)));
    updateBookingInFirestore(target.id, { status: 'rejected', rejectionReason: reason }).catch(console.warn);

    // Send email notification (REJECTED)
    const newMails = createEmailNotifications(updated, 'REJECTED', rooms, reason);
    setEmailNotifications((prev) => [...newMails, ...prev]);

    showToast(`ปฏิเสธคำขอจอง "${target.topic}" เรียบร้อยแล้ว พร้อมส่งอีเมลแจ้งเหตุผล`, 'info');
    setIsRejectModalOpen(false);
    setTargetRejectBookingId(null);
    if (viewingBooking?.id === target.id) {
      setViewingBooking(updated);
    }
  };

  const handleCancelBooking = async (bookingId: string, reason: string) => {
    const b = bookings.find((item) => item.id === bookingId);
    if (!b) throw new Error('ไม่พบข้อมูลการจอง');

    const updated: Booking = {
      ...b,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason
    };

    setBookings((prev) => prev.map((item) => (item.id === bookingId ? updated : item)));
    updateBookingInFirestore(bookingId, {
      status: 'cancelled',
      cancelledAt: updated.cancelledAt,
      cancellationReason: reason
    }).catch(console.warn);

    // Trigger CANCELLED email
    const newMails = createEmailNotifications(updated, 'CANCELLED', rooms, reason);
    setEmailNotifications((prev) => [...newMails, ...prev]);

    setIsCancelModalOpen(false);
    setTargetCancelBooking(null);

    if (viewingBooking?.id === bookingId) {
      setViewingBooking(updated);
    }
    showToast(`ยกเลิกการจอง "${b.topic}" เรียบร้อยแล้ว (ปลดล็อกช่วงเวลาห้องว่างทันที)`, 'success');
  };

  const handleResendEmail = (b: Booking) => {
    setTargetResendBooking(b);
    setIsResendModalOpen(true);
  };

  const handleConfirmResend = () => {
    if (!targetResendBooking) return;
    const emailType = targetResendBooking.status === 'pending' ? 'RECEIVED' : 'APPROVED';
    const newMails = createEmailNotifications(targetResendBooking, emailType, rooms);
    setEmailNotifications((prev) => [...newMails, ...prev]);
    showToast(`ส่งอีเมลแจ้งเตือนซ้ำให้ ${targetResendBooking.email} เรียบร้อยแล้ว`, 'success');
  };

  const handleDeleteBooking = (id: string) => {
    const booking = bookings.find((b) => b.id === id);
    if (!booking) return;
    const room = rooms.find((r) => r.id === booking.roomId);

    setDeleteModalState({
      isOpen: true,
      title: 'ยืนยันการลบรายการจองห้องประชุม',
      description: 'คุณต้องการลบข้อมูลรายการจองนี้ออกจากระบบถาวรใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้',
      itemDetails: [
        { label: 'หัวข้อการประชุม', value: booking.topic },
        { label: 'ห้องประชุม', value: room ? room.name : 'ห้องประชุม' },
        { label: 'ผู้ขอจอง / ฝ่าย', value: `${booking.requesterName} (${booking.department || '-'})` },
        {
          label: 'วันและเวลา',
          value: `${formatThaiDate(booking.startTime, { day: 'numeric', month: 'short', year: 'numeric' })} ${formatThaiTime(booking.startTime, { hour: '2-digit', minute: '2-digit' })} - ${formatThaiTime(booking.endTime, { hour: '2-digit', minute: '2-digit' })} น.`
        }
      ],
      onConfirm: () => {
        setBookings((prev) => prev.filter((b) => b.id !== id));
        deleteBookingFromFirestore(id).catch(console.warn);
        if (viewingBooking?.id === id) {
          setViewingBooking(null);
          setIsDetailModalOpen(false);
        }
        showToast(`ลบรายการจอง "${booking.topic}" เรียบร้อยแล้ว`, 'info');
      }
    });
  };

  const handleBlockRoom = (data: { roomId: string; startDate: string; endDate: string; reason: string }) => {
    const start = new Date(data.startDate);
    start.setHours(8, 30, 0, 0);
    const end = new Date(data.endDate);
    end.setHours(19, 30, 0, 0);

    const blockBooking: Booking = {
      id: `BLK-${Date.now()}`,
      roomId: data.roomId,
      topic: data.reason || 'ปิดปรับปรุง',
      department: 'ฝ่ายสนับสนุนอาคารและเครื่องจักรกล',
      requesterName: 'ฝ่ายอาคารสถานที่',
      phone: '022520161',
      email: 'facility@qsmi.or.th',
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      participants: 0,
      meetingType: 'Onsite',
      createdAt: new Date().toISOString(),
      status: 'approved',
      isBlocked: true
    };

    setBookings((prev) => [blockBooking, ...prev]);
    saveBookingToFirestore(blockBooking).catch(console.warn);
    setIsBlockModalOpen(false);
    showToast('ปิดกั้นห้องประชุมเรียบร้อยแล้ว', 'success');
  };

  const handleAddRoom = (newRoomData: {
    name: string;
    capacity?: number;
    location?: string;
    description?: string;
    equipment?: string[];
    seatingOptions?: string[];
    color?: string;
    isActive?: boolean;
    hasSpecialSeating?: boolean;
  }) => {
    const newRoom: Room = {
      id: `r${Date.now()}`,
      name: newRoomData.name,
      color: newRoomData.color || 'bg-blue-100 border-blue-300 text-blue-800',
      isActive: newRoomData.isActive ?? true,
      capacity: newRoomData.capacity || 20,
      location: newRoomData.location || 'ตึกอำนวยการ',
      description: newRoomData.description,
      equipment: newRoomData.equipment,
      seatingOptions: newRoomData.seatingOptions,
      hasSpecialSeating: newRoomData.hasSpecialSeating
    };
    setRooms((prev) => [...prev, newRoom]);
    saveRoomToFirestore(newRoom)
      .then(() => {
        showToast(`เพิ่มห้องประชุม "${newRoom.name}" เรียบร้อยแล้ว`, 'success');
      })
      .catch((err) => {
        console.error('Error saving room to Firestore:', err);
        showToast(`เพิ่มห้องประชุมในเครื่องแล้ว (คลาวด์: ${err?.message || 'ข้อผิดพลาดการเชื่อมต่อ'})`, 'error');
      });
  };

  const handleUpdateRoom = (updatedRoom: Room) => {
    setRooms((prev) => prev.map((r) => (r.id === updatedRoom.id ? updatedRoom : r)));
    updateRoomInFirestore(updatedRoom.id, updatedRoom)
      .then(() => {
        showToast(`แก้ไขข้อมูลห้องประชุม "${updatedRoom.name}" สำเร็จและบันทึกลงฐานข้อมูลแล้ว`, 'success');
      })
      .catch((err) => {
        console.error('Error updating room in Firestore:', err);
        showToast(`บันทึกในเครื่องแล้ว แต่บันทึกคลาวด์ไม่สำเร็จ (${err?.message || 'สิทธิ์การเข้าถึงถูกจำกัด'})`, 'error');
      });
  };

  const handleDeleteRoom = (roomId: string) => {
    const room = rooms.find((r) => r.id === roomId);
    if (!room) return;
    const activeBookings = bookings.filter(
      (b) => b.roomId === roomId && b.status !== 'cancelled' && b.status !== 'rejected'
    );

    setDeleteModalState({
      isOpen: true,
      title: 'ยืนยันการลบห้องประชุม',
      description:
        activeBookings.length > 0
          ? `ห้องประชุมนี้มีรายการจองค้างอยู่ ${activeBookings.length} รายการ การลบห้องอาจส่งผลต่อการแสดงผลของรายการจองเดิม คุณแน่ใจหรือไม่ที่จะลบห้องนี้?`
          : 'คุณต้องการลบข้อมูลห้องประชุมนี้ออกจากระบบถาวรใช่หรือไม่?',
      itemDetails: [
        { label: 'ชื่อห้องประชุม', value: room.name },
        { label: 'สถานที่ / อาคาร', value: room.location || 'ตึกอำนวยการ' },
        { label: 'ความจุ', value: `${room.capacity || 20} ที่นั่ง` }
      ],
      onConfirm: () => {
        setRooms((prev) => prev.filter((r) => r.id !== roomId));
        deleteRoomFromFirestore(roomId)
          .then(() => {
            showToast(`ลบห้องประชุม "${room.name}" เรียบร้อยแล้ว`, 'info');
          })
          .catch((err) => {
            console.error('Error deleting room from Firestore:', err);
            showToast(`ลบในเครื่องแล้ว (คลาวด์: ${err?.message || 'ข้อผิดพลาด'})`, 'error');
          });
      }
    });
  };

  const handleToggleRoomStatus = (roomId: string) => {
    const targetRoom = rooms.find((r) => r.id === roomId);
    if (!targetRoom) return;
    const newStatus = !targetRoom.isActive;
    setRooms((prev) =>
      prev.map((r) => (r.id === roomId ? { ...r, isActive: newStatus } : r))
    );
    updateRoomInFirestore(roomId, { isActive: newStatus })
      .then(() => {
        showToast('ปรับปรุงสถานะห้องประชุมเรียบร้อยแล้ว', 'info');
      })
      .catch((err) => {
        console.error('Error toggling room status in Firestore:', err);
        showToast(`ปรับปรุงสถานะในเครื่องแล้ว (คลาวด์: ${err?.message || 'ข้อผิดพลาด'})`, 'error');
      });
  };

  // --- User Account Management Handlers (Admin Approval & Registration) ---
  const handleRegisterUser = (newUser: UserAccount) => {
    const exists = users.some(
      (u) => u.username.toLowerCase() === newUser.username.toLowerCase()
    );
    if (exists) {
      return {
        success: false,
        message: `ชื่อผู้ใช้งาน "${newUser.username}" มีอยู่ในระบบแล้ว กรุณาเลือกชื่ออื่น`
      };
    }
    const userToSave = { ...newUser, id: newUser.id || newUser.username };
    setUsers((prev) => [userToSave, ...prev]);
    saveUserToFirestore(userToSave).catch(console.warn);
    showToast(`ลงทะเบียนคำขอสำหรับ "${newUser.name}" เรียบร้อยแล้ว รอผู้ดูแลระบบอนุมัติ`, 'success');
    return { success: true };
  };

  const handleApproveUser = (username: string) => {
    const target = users.find((u) => u.username === username);
    if (!target) return;

    const approvedAt = new Date().toISOString();
    const approvedBy = currentUser?.name || 'ผู้ดูแลระบบ';

    setUsers((prev) =>
      prev.map((u) =>
        u.username === username
          ? {
              ...u,
              status: 'approved',
              approvedAt,
              approvedBy
            }
          : u
      )
    );
    const targetId = target.id || target.username;
    updateUserInFirestore(targetId, { status: 'approved', approvedAt, approvedBy }).catch(console.warn);

    // Create system notification email for the approved user
    const approvalEmail: EmailNotification = {
      id: `mail-appr-${Date.now()}`,
      bookingId: 'USER-APPROVAL',
      recipient: target.email || `${target.username}@qsmi.or.th`,
      subject: `[สถานเสาวภา] บัญชีผู้ใช้งานของคุณได้รับการอนุมัติเรียบร้อยแล้ว`,
      bodyText: `เรียน ${target.name}, บัญชีของคุณได้รับการอนุมัติเรียบร้อยแล้ว`,
      htmlBody: `
        <div style="font-family: sans-serif; line-height: 1.6; color: #333;">
          <h2 style="color: #059669;">ยินดีต้อนรับสู่ระบบจองห้องประชุม สถานเสาวภา สภากาชาดไทย</h2>
          <p>เรียน <strong>${target.name}</strong>,</p>
          <p>คำขอเปิดใช้งานบัญชีผู้ใช้งานของคุณ (ชื่อผู้ใช้: <strong>${target.username}</strong>, สิทธิ์: <strong>${target.role.toUpperCase()}</strong>, ฝ่าย: <strong>${target.department}</strong>) ได้รับการพิจารณา<strong>อนุมัติ</strong>โดยผู้ดูแลระบบแล้ว</p>
          <p>ขณะนี้คุณสามารถเข้าสู่ระบบและเริ่มจองห้องประชุมได้ทันที</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="font-size: 12px; color: #888;">สถานเสาวภา สภากาชาดไทย • ระบบจองห้องประชุมส่วนกลาง</p>
        </div>
      `,
      type: 'APPROVED',
      sentAt: new Date().toISOString(),
      isRead: false,
      isAdminNotice: false
    };
    setEmailNotifications((prev) => [approvalEmail, ...prev]);
    showToast(`อนุมัติคำขอใช้งานของ "${target.name}" เรียบร้อยแล้ว`, 'success');
  };

  const handleRejectUser = (username: string, reason?: string) => {
    const target = users.find((u) => u.username === username);
    const rejectionReason = reason || 'ข้อมูลไม่ผ่านเกณฑ์การอนุมัติ';
    setUsers((prev) =>
      prev.map((u) =>
        u.username === username
          ? {
              ...u,
              status: 'rejected',
              rejectionReason
            }
          : u
      )
    );
    if (target) {
      updateUserInFirestore(target.id || target.username, { status: 'rejected', rejectionReason }).catch(console.warn);
    }
    showToast(`ปฏิเสธคำขอสมัครของ "${username}" เรียบร้อยแล้ว`, 'info');
  };

  const handleDeleteUser = (username: string) => {
    const target = users.find((u) => u.username === username);
    if (!target) return;

    setDeleteModalState({
      isOpen: true,
      title: 'ยืนยันการลบบัญชีผู้ใช้งาน',
      description: 'คุณต้องการลบบัญชีผู้ใช้นี้ออกจากระบบถาวรใช่หรือไม่? ผู้ใช้งานจะไม่สามารถเข้าสู่ระบบได้อีกต่อไป',
      itemDetails: [
        { label: 'ชื่อ - นามสกุล', value: target.name },
        { label: 'ชื่อผู้ใช้งาน (Username)', value: target.username },
        { label: 'ฝ่าย / หน่วยงาน', value: target.department || '-' },
        {
          label: 'ระดับสิทธิ์',
          value:
            target.role === 'admin'
              ? 'ผู้ดูแลระบบ (Admin)'
              : target.role === 'manager'
                ? 'หัวหน้าฝ่าย (Manager)'
                : 'พนักงานทั่วไป (Employee)'
        }
      ],
      onConfirm: () => {
        setUsers((prev) => prev.filter((u) => u.username !== username));
        deleteUserFromFirestore(target.id || target.username).catch(console.warn);
        showToast(`ลบบัญชีผู้ใช้งาน "${target.name}" (${target.username}) เรียบร้อยแล้ว`, 'info');
      }
    });
  };

  const handleUpdateUserRole = (username: string, role: UserRole) => {
    const target = users.find((u) => u.username === username);
    setUsers((prev) =>
      prev.map((u) => (u.username === username ? { ...u, role } : u))
    );
    if (target) {
      updateUserInFirestore(target.id || target.username, { role }).catch(console.warn);
    }
    showToast(`ปรับระดับสิทธิ์ของ "${username}" เป็น ${role.toUpperCase()} เรียบร้อยแล้ว`, 'success');
  };

  const handleUpdateUser = (updatedUser: UserAccount) => {
    setUsers((prev) =>
      prev.map((u) => (u.username === updatedUser.username ? updatedUser : u))
    );
    saveUserToFirestore(updatedUser).catch(console.warn);
    if (currentUser?.username === updatedUser.username) {
      setCurrentUser(updatedUser);
    }
    showToast(`อัปเดตข้อมูลผู้ใช้งาน "${updatedUser.name}" เรียบร้อยแล้ว`, 'success');
  };

  const handleUpdateProfile = (updatedUser: UserAccount) => {
    setUsers((prev) =>
      prev.map((u) => (u.username === updatedUser.username ? updatedUser : u))
    );
    saveUserToFirestore(updatedUser).catch(console.warn);
    setCurrentUser(updatedUser);
    showToast('บันทึกข้อมูลส่วนตัวเรียบร้อยแล้ว', 'success');
  };

  // --- Department Data Management Handlers ---
  const handleAddDepartment = (newDept: Omit<Department, 'id'>) => {
    const id = `dept-${Date.now()}`;
    const fullDept: Department = {
      ...newDept,
      id
    };
    setDepartments((prev) => [...prev, fullDept]);
    saveDepartmentToFirestore(fullDept).catch(console.warn);
    showToast(`เพิ่มฝ่าย "${fullDept.name}" เรียบร้อยแล้ว`, 'success');
  };

  const handleUpdateDepartment = (updatedDept: Department) => {
    setDepartments((prev) =>
      prev.map((d) => (d.id === updatedDept.id ? updatedDept : d))
    );
    updateDepartmentInFirestore(updatedDept.id, updatedDept).catch(console.warn);
    showToast(`อัปเดตข้อมูลฝ่าย "${updatedDept.name}" เรียบร้อยแล้ว`, 'success');
  };

  const handleDeleteDepartment = (deptId: string) => {
    const target = departments.find((d) => d.id === deptId);
    if (!target) return;
    const memberCount = users.filter(
      (u) => u.department?.toLowerCase() === target.name.toLowerCase()
    ).length;
    const bookingCount = bookings.filter(
      (b) => b.department?.toLowerCase() === target.name.toLowerCase()
    ).length;

    setDeleteModalState({
      isOpen: true,
      title: 'ยืนยันการลบฝ่าย / หน่วยงาน',
      description:
        memberCount > 0 || bookingCount > 0
          ? `ฝ่ายนี้มีบุคลากรในระบบ ${memberCount} คน และประวัติการจอง ${bookingCount} รายการ คุณแน่ใจหรือไม่ที่จะลบฝ่ายนี้ออกจากระบบ?`
          : 'คุณต้องการลบฝ่ายนี้ออกจากระบบถาวรใช่หรือไม่?',
      itemDetails: [
        { label: 'ชื่อฝ่าย / หน่วยงาน', value: target.name },
        { label: 'จำนวนบุคลากร', value: `${memberCount} คน` },
        { label: 'ประวัติการจอง', value: `${bookingCount} รายการ` }
      ],
      onConfirm: () => {
        setDepartments((prev) => prev.filter((d) => d.id !== deptId));
        deleteDepartmentFromFirestore(deptId).catch(console.warn);
        showToast(`ลบฝ่าย "${target.name}" เรียบร้อยแล้ว`, 'info');
      }
    });
  };

  return (
    <div
      className={`min-h-screen ${
        activePage === 'booking' ? 'md:h-screen md:overflow-hidden' : ''
      } bg-gray-50 flex flex-col font-sans text-gray-900`}
    >
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] animate-fade-in pointer-events-none">
          <div
            className={`px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold text-white pointer-events-auto border border-white/20 ${
              toast.type === 'error'
                ? 'bg-red-600'
                : toast.type === 'info'
                  ? 'bg-blue-600'
                  : 'bg-emerald-600'
            }`}
          >
            {toast.type === 'error' ? (
              <AlertCircle size={18} />
            ) : toast.type === 'info' ? (
              <MailIcon size={18} />
            ) : (
              <Check size={18} />
            )}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Top Header */}
      <Header
        activePage={activePage}
        onChangePage={(p) => {
          if (p === 'management' && !currentUser) {
            setPendingBookingSlot(null);
            setLoginModalReason('กรุณาเข้าสู่ระบบก่อนเข้าใช้งานระบบจัดการข้อมูลและสิทธิ์');
            setIsSsoModalOpen(true);
            return;
          }
          setActivePage(p);
        }}
        currentUser={currentUser}
        unreadEmailCount={unreadEmailCount}
        myBookingsCount={myBookingsCount}
        pendingDeptCount={pendingDeptCount}
        pendingUsersCount={pendingUsers.length}
        totalNotificationsCount={totalNotificationsCount}
        onOpenMyBookings={() => setIsMyBookingsOpen(true)}
        onOpenGuide={() => setIsGuideModalOpen(true)}
        onOpenEmailInbox={() => {
          if (!currentUser) {
            setPendingBookingSlot(null);
            setLoginModalReason('กรุณาเข้าสู่ระบบก่อน เพื่อดูการแจ้งเตือน');
            setIsSsoModalOpen(true);
            return;
          }
          setEmailNotifications((prev) => prev.map((e) => ({ ...e, isRead: true })));
          setIsNotificationModalOpen(true);
        }}
        onOpenNotifications={() => {
          if (!currentUser) {
            setPendingBookingSlot(null);
            setLoginModalReason('กรุณาเข้าสู่ระบบก่อน เพื่อดูศูนย์การแจ้งเตือนระบบ');
            setIsSsoModalOpen(true);
            return;
          }
          setEmailNotifications((prev) => prev.map((e) => ({ ...e, isRead: true })));
          setIsNotificationModalOpen(true);
        }}
        onOpenLoginModal={() => {
          setPendingBookingSlot(null);
          setLoginModalReason('เข้าสู่ระบบเพื่อเข้าสู่ระบบจัดการข้อมูลและสิทธิ์');
          setIsSsoModalOpen(true);
        }}
        onLogoutUser={() => {
          setCurrentUser(null);
          setIsAuthenticated(false);
          setIsAdminMode(false);
          localStorage.removeItem('meeting_app_sso_user');
          localStorage.removeItem('meeting_app_admin_auth');
          setActivePage('booking');
          showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
        }}
      />

      {/* SEPARATED PAGE ROUTING (Management is ONLY visible when user is logged in) */}
      {activePage === 'management' && currentUser ? (
        /* PAGE 2: USER & ADMIN MANAGEMENT / PORTAL */
        <main className="flex-1 overflow-y-auto w-full no-scrollbar">
          <ManagementPortal
            currentUser={currentUser}
            isAuthenticated={isAuthenticated}
            isAdminMode={isAdminMode}
            bookings={bookings}
            rooms={rooms}
            users={users}
            departments={departments}
            onAddDepartment={handleAddDepartment}
            onUpdateDepartment={handleUpdateDepartment}
            onDeleteDepartment={handleDeleteDepartment}
            onLogin={(user) => {
              setCurrentUser(user);
              if (user.role === 'admin') {
                setIsAuthenticated(true);
                setIsAdminMode(true);
              }
              showToast(`ยินดีต้อนรับคุณ ${user.name} (${user.role.toUpperCase()})`, 'success');
            }}
            onLogout={() => {
              setCurrentUser(null);
              setIsAuthenticated(false);
              setIsAdminMode(false);
              setActivePage('booking');
              showToast('ออกจากระบบเรียบร้อยแล้ว', 'info');
            }}
            onApprove={handleApprove}
            onReject={handleRejectClick}
            onResendEmail={handleResendEmail}
            onEditBooking={(b) => {
              setEditingBooking(b);
              setSelectedSlotRoom(rooms.find((r) => r.id === b.roomId));
              setIsBookingModalOpen(true);
            }}
            onDeleteBooking={handleDeleteBooking}
            onOpenBlockModal={() => setIsBlockModalOpen(true)}
            onOpenRoomModal={() => {
              setEditingRoomForModal(null);
              setIsRoomModalOpen(true);
            }}
            onEditRoom={(room) => {
              setEditingRoomForModal(room);
              setIsRoomModalOpen(true);
            }}
            onDeleteRoom={handleDeleteRoom}
            onToggleRoomStatus={handleToggleRoomStatus}
            onApproveUser={handleApproveUser}
            onRejectUser={handleRejectUser}
            onDeleteUser={handleDeleteUser}
            onUpdateUserRole={handleUpdateUserRole}
            onRegisterUser={handleRegisterUser}
            onUpdateProfile={handleUpdateProfile}
            onUpdateUser={handleUpdateUser}
            onViewBooking={(b) => {
              setViewingBooking(b);
              setIsDetailModalOpen(true);
            }}
            onRequestCancel={(b) => {
              setTargetCancelBooking(b);
              setIsCancelModalOpen(true);
            }}
            onBackToBooking={() => setActivePage('booking')}
            onBatchImportBookings={handleBatchImportBookings}
          />
        </main>
      ) : (
        /* PAGE 1: MAIN BOOKING CALENDAR (MAXIMIZED DESKTOP WIDTH & NO SCROLLBAR) */
        <main className="flex-1 min-h-0 flex flex-col overflow-hidden mx-auto px-3 sm:px-6 lg:px-8 xl:px-10 py-2 sm:py-2.5 w-full max-w-[1850px] space-y-2.5 sm:space-y-3">
          {/* Calendar Controls Bar */}
          <CalendarHeader
            currentDate={currentDate}
            viewMode={viewMode}
            onChangeDate={setCurrentDate}
            onChangeViewMode={setViewMode}
            onQuickBook={handleQuickBook}
          />

          {/* Calendar Views */}
          {viewMode === 'day' && (
            <DayView
              currentDate={currentDate}
              rooms={rooms}
              bookings={bookings}
              isAdminMode={isAdminMode}
              onSlotClick={handleOpenSlot}
              onViewBooking={(b) => {
                setViewingBooking(b);
                setIsDetailModalOpen(true);
              }}
              onEditBooking={(b) => {
                setEditingBooking(b);
                setSelectedSlotRoom(rooms.find((r) => r.id === b.roomId));
                setIsBookingModalOpen(true);
              }}
              onDeleteBooking={handleDeleteBooking}
            />
          )}

          {viewMode === 'week' && (
            <WeekView
              currentDate={currentDate}
              rooms={rooms}
              bookings={bookings}
              isAdminMode={isAdminMode}
              onSlotClick={handleOpenSlot}
              onViewBooking={(b) => {
                setViewingBooking(b);
                setIsDetailModalOpen(true);
              }}
              onSelectDay={(d) => {
                setCurrentDate(d);
                setViewMode('day');
              }}
              onEditBooking={(b) => {
                setEditingBooking(b);
                setSelectedSlotRoom(rooms.find((r) => r.id === b.roomId));
                setIsBookingModalOpen(true);
              }}
              onDeleteBooking={handleDeleteBooking}
            />
          )}

          {viewMode === 'month' && (
            <MonthView
              currentDate={currentDate}
              rooms={rooms}
              bookings={bookings}
              isAdminMode={isAdminMode}
              onSlotClick={handleOpenSlot}
              onViewBooking={(b) => {
                setViewingBooking(b);
                setIsDetailModalOpen(true);
              }}
              onSelectDay={(d) => {
                setCurrentDate(d);
                setViewMode('day');
              }}
              onEditBooking={(b) => {
                setEditingBooking(b);
                setSelectedSlotRoom(rooms.find((r) => r.id === b.roomId));
                setIsBookingModalOpen(true);
              }}
              onDeleteBooking={handleDeleteBooking}
            />
          )}

          {/* Legend Bar */}
          <div className="bg-white px-4 py-2 rounded-2xl shadow-2xs border border-gray-200 flex items-center justify-center gap-4 sm:gap-7 flex-wrap text-xs text-gray-600 font-semibold shrink-0">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#C8102E]" />
              <span>ว่าง (คลิกเพื่อจอง)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-blue-100 border border-blue-400" />
              <span>อนุมัติแล้ว (Approved)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-amber-100 border border-amber-400" />
              <span>รออนุมัติ (Pending)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-100 border border-red-400" />
              <span>ปิดปรับปรุง / ซ่อมบำรุง</span>
            </div>
          </div>
        </main>
      )}

      {/* MODALS */}
      {/* 1. Booking Form Modal */}
      <BookingModal
        isOpen={isBookingModalOpen}
        onClose={() => {
          setIsBookingModalOpen(false);
          setEditingBooking(null);
        }}
        onSubmit={handleBookingSubmit}
        room={selectedSlotRoom}
        initialDate={currentDate}
        initialTime={selectedSlotTime}
        bookingData={editingBooking}
        currentUser={currentUser}
        bookings={bookings}
        isSubmitting={isSubmittingBooking}
      />

      {/* 2. Booking Detail Modal with Google Calendar Sync & Actions */}
      <BookingDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => {
          setIsDetailModalOpen(false);
          setViewingBooking(null);
          if (window.location.hash) {
            try {
              window.history.replaceState(
                null,
                '',
                window.location.pathname + window.location.search
              );
            } catch (_) {}
          }
        }}
        booking={viewingBooking}
        rooms={rooms}
        isAdminMode={isAdminMode}
        currentUser={currentUser}
        onApprove={handleApprove}
        onReject={handleRejectClick}
        onCancelClick={(b) => {
          setTargetCancelBooking(b);
          setIsCancelModalOpen(true);
        }}
        onResendEmail={handleResendEmail}
        onDeleteClick={(b) => handleDeleteBooking(b.id)}
        onOpenAdminLogin={() => setIsAdminLoginModalOpen(true)}
      />

      {/* 3. SSO Employee Authentication Modal */}
      <SsoLoginModal
        isOpen={isSsoModalOpen}
        onClose={() => {
          setIsSsoModalOpen(false);
          setPendingBookingSlot(null);
          setLoginModalReason(null);
        }}
        users={users}
        departments={departments}
        onRegisterUser={handleRegisterUser}
        reason={loginModalReason}
        onLoginSuccess={(u) => {
          setCurrentUser(u);
          if (u.role === 'admin') {
            setIsAuthenticated(true);
            setIsAdminMode(true);
          }
          setIsSsoModalOpen(false);

          if (pendingBookingSlot) {
            showToast(`เข้าสู่ระบบสำเร็จ กำลังเปิดแบบฟอร์มจองห้อง "${pendingBookingSlot.room.name}"...`, 'success');
            setSelectedSlotRoom(pendingBookingSlot.room);
            setSelectedSlotTime(pendingBookingSlot.time);
            if (pendingBookingSlot.date) {
              setCurrentDate(pendingBookingSlot.date);
            }
            setEditingBooking(null);
            setIsBookingModalOpen(true);
            setPendingBookingSlot(null);
            setLoginModalReason(null);
            setActivePage('booking');
          } else {
            showToast(`ยินดีต้อนรับคุณ ${u.name} (${u.department})`, 'success');
            setLoginModalReason(null);
            setActivePage('management');
          }
        }}
      />

      {/* 4. Admin Password Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        onSuccess={() => {
          setIsAuthenticated(true);
          setIsAdminMode(true);
          const adminUser = users.find((u) => u.role === 'admin') || CORPORATE_USERS[0];
          setCurrentUser(adminUser);
          showToast(`เข้าสู่ระบบผู้ดูแลระบบ (Admin) สำเร็จ: ${adminUser.name}`, 'success');
        }}
      />

      {/* 5. In-App Unified Notification Center Modal (All Users & Admins) */}
      <NotificationCenterModal
        isOpen={isNotificationModalOpen}
        onClose={() => setIsNotificationModalOpen(false)}
        currentUser={currentUser}
        bookings={bookings}
        users={users}
        emailNotifications={emailNotifications}
        readNotificationIds={readNotificationIds}
        deletedNotificationIds={deletedNotificationIds}
        onMarkNotificationsRead={handleMarkNotificationsRead}
        onDeleteNotifications={handleDeleteNotifications}
        onOpenBooking={(bId) => {
          const found = bookings.find((b) => b.id === bId);
          if (found) {
            setIsNotificationModalOpen(false);
            setViewingBooking(found);
            setIsDetailModalOpen(true);
          } else {
            showToast('ไม่พบรายการจองนี้ในระบบ', 'error');
          }
        }}
        onClearEmailNotifications={() => {
          setEmailNotifications([]);
          showToast('ล้างกล่องข้อความอีเมลเรียบร้อย', 'info');
        }}
        onOpenManagement={() => {
          setIsNotificationModalOpen(false);
          setActivePage('management');
        }}
      />

      {/* 5.1 In-App Email Notification Center / Simulator */}
      <EmailNotificationModal
        isOpen={isEmailModalOpen}
        onClose={() => setIsEmailModalOpen(false)}
        notifications={emailNotifications}
        onClearAll={() => {
          setEmailNotifications([]);
          showToast('ล้างกล่องข้อความอีเมลเรียบร้อย', 'info');
        }}
        onOpenBookingFromEmail={(bId) => {
          const found = bookings.find((b) => b.id === bId || String(b.id) === String(bId));
          if (found) {
            setIsEmailModalOpen(false);
            setViewingBooking(found);
            setIsDetailModalOpen(true);
          } else {
            showToast(`ไม่พบรายการจองรหัส ${bId} ในระบบ`, 'error');
          }
        }}
      />

      {/* 6. Booking Guide Modal */}
      <BookingGuideModal
        isOpen={isGuideModalOpen}
        onClose={() => setIsGuideModalOpen(false)}
      />

      {/* 7. Room Management Modal */}
      <RoomManagementModal
        isOpen={isRoomModalOpen}
        onClose={() => {
          setIsRoomModalOpen(false);
          setEditingRoomForModal(null);
        }}
        rooms={rooms}
        bookings={bookings}
        initialEditRoom={editingRoomForModal}
        onAddRoom={handleAddRoom}
        onUpdateRoom={handleUpdateRoom}
        onDeleteRoom={handleDeleteRoom}
        onToggleRoomStatus={handleToggleRoomStatus}
      />

      {/* 8. Block Room for Maintenance Modal */}
      <BlockRoomModal
        isOpen={isBlockModalOpen}
        onClose={() => setIsBlockModalOpen(false)}
        rooms={rooms}
        onBlock={handleBlockRoom}
      />

      {/* 9. Cancel Booking by User with Cancellation Reason */}
      <CancelBookingModal
        isOpen={isCancelModalOpen}
        onClose={() => {
          setIsCancelModalOpen(false);
          setTargetCancelBooking(null);
        }}
        booking={targetCancelBooking}
        rooms={rooms}
        currentUser={currentUser}
        isAdminMode={isAdminMode}
        onConfirm={handleCancelBooking}
      />

      {/* 10. Admin Rejection Reason Modal */}
      <RejectModal
        isOpen={isRejectModalOpen}
        onClose={() => {
          setIsRejectModalOpen(false);
          setTargetRejectBookingId(null);
        }}
        onConfirm={handleConfirmReject}
      />

      {/* 11. Resend Email Confirmation Modal */}
      <ResendEmailModal
        isOpen={isResendModalOpen}
        onClose={() => {
          setIsResendModalOpen(false);
          setTargetResendBooking(null);
        }}
        booking={targetResendBooking}
        onConfirm={handleConfirmResend}
      />

      {/* 12. My Bookings History & Cancellation Portal */}
      <MyBookingsModal
        isOpen={isMyBookingsOpen}
        onClose={() => setIsMyBookingsOpen(false)}
        bookings={bookings}
        rooms={rooms}
        currentUser={currentUser}
        onViewBooking={(b) => {
          setViewingBooking(b);
          setIsDetailModalOpen(true);
        }}
        onRequestCancel={(b) => {
          setTargetCancelBooking(b);
          setIsCancelModalOpen(true);
        }}
        onOpenNewBooking={() => {
          setIsMyBookingsOpen(false);
          setSelectedSlotRoom(undefined);
          setSelectedSlotTime(null);
          setEditingBooking(null);
          setIsBookingModalOpen(true);
        }}
      />

      {/* 13. Department Manager Approval & Usage Statistics Portal */}
      <ManagerApprovalModal
        isOpen={isManagerPortalOpen}
        onClose={() => setIsManagerPortalOpen(false)}
        bookings={bookings}
        rooms={rooms}
        currentUser={currentUser}
        onApprove={handleApprove}
        onReject={handleRejectClick}
        onViewBooking={(b) => {
          setViewingBooking(b);
          setIsDetailModalOpen(true);
        }}
      />

      {/* 14. Universal Delete Confirmation Modal (Theme-Consistent Custom Modal) */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState((prev) => ({ ...prev, isOpen: false }))}
        title={deleteModalState.title}
        description={deleteModalState.description}
        itemDetails={deleteModalState.itemDetails}
        onConfirm={deleteModalState.onConfirm}
      />
    </div>
  );
}
