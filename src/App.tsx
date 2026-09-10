import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  Check,
  AlertCircle,
  Mail as MailIcon,
  BarChart3,
  Settings,
  CalendarDays
} from 'lucide-react';
import { Room, Booking, UserAccount, EmailNotification, CalendarView, UserRole, Department, AuditLog } from './types';
import {
  INITIAL_ROOMS,
  INITIAL_BOOKINGS,
  CORPORATE_USERS,
  INITIAL_DEPARTMENTS,
  normalizeSeatingName,
  normalizeEquipmentName
} from './data/initialData';
import {
  createEmailNotifications,
  createUserRegistrationEmails,
  createUserApprovalEmail,
  createUserApprovalEmails,
  createUserRejectionEmail
} from './utils/emailService';
import { checkBookingOverlap, formatThaiDate, formatThaiTime, isBookingInPast, SELECTABLE_TIMES } from './utils/thaiDate';
import { subscribeToAuditLogs, logActivity, getInitialHistoricalLogs } from './lib/auditLogService';
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
  saveBookingWithConcurrencyCheck,
  subscribeToUserNotificationState,
  saveUserNotificationStateToFirestore
} from './lib/firestoreService';

// Components
import { Header } from './components/Header';
import { CalendarHeader } from './components/CalendarHeader';
import { DayView } from './components/DayView';
import { WeekView } from './components/WeekView';
import { MonthView } from './components/MonthView';
import { BookingModal } from './components/BookingModal';
import { BookingDetailModal } from './components/BookingDetailModal';
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
      const lastActStr = localStorage.getItem('meeting_app_last_activity');
      if (lastActStr) {
        const lastAct = parseInt(lastActStr, 10);
        if (!isNaN(lastAct) && Date.now() - lastAct >= 60 * 1000) {
          sessionStorage.removeItem('meeting_app_sso_user');
          localStorage.removeItem('meeting_app_sso_user');
          localStorage.removeItem('meeting_app_last_activity');
          return null;
        }
      }
      const sessionUser = sessionStorage.getItem('meeting_app_sso_user');
      if (sessionUser) {
        const u = JSON.parse(sessionUser);
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
        rawUsers = rawUsers
          .filter((u: UserAccount) => Boolean(u && u.username && !legacyMockUsers.has(u.username)))
          .map((u: UserAccount) => ({
            ...u,
            name: u.name || u.username || 'ผู้ใช้งาน',
            username: u.username || 'user',
            department: u.department || 'ทั่วไป',
            role: u.role || 'employee',
            status: u.status || 'approved',
          }));
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
      const lastActStr = localStorage.getItem('meeting_app_last_activity');
      if (lastActStr) {
        const lastAct = parseInt(lastActStr, 10);
        if (!isNaN(lastAct) && Date.now() - lastAct >= 60 * 1000) return false;
      }
      const sessionUser = sessionStorage.getItem('meeting_app_sso_user');
      if (sessionUser) {
        const u = JSON.parse(sessionUser);
        if (u && u.role === 'admin') return true;
      }
      return false;
    } catch {
      return false;
    }
  });

  const [isAdminMode, setIsAdminMode] = useState<boolean>(() => {
    try {
      const lastActStr = localStorage.getItem('meeting_app_last_activity');
      if (lastActStr) {
        const lastAct = parseInt(lastActStr, 10);
        if (!isNaN(lastAct) && Date.now() - lastAct >= 60 * 1000) return false;
      }
      const sessionUser = sessionStorage.getItem('meeting_app_sso_user');
      if (sessionUser) {
        const u = JSON.parse(sessionUser);
        if (u && u.role === 'admin') return true;
      }
      return false;
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
  const [managementInitialTab, setManagementInitialTab] = useState<
    'approvals' | 'users' | 'bookings' | 'my_history' | 'rooms' | 'reports' | 'directory' | 'departments' | 'my_profile' | 'audit_logs'
  >('approvals');

  // Audit Logs for Super Admin
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    try {
      const cached = localStorage.getItem('meeting_app_audit_logs');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (_) {}
    return getInitialHistoricalLogs();
  });
  const [isSsoModalOpen, setIsSsoModalOpen] = useState<boolean>(() => {
    try {
      const lastActStr = localStorage.getItem('meeting_app_last_activity');
      if (lastActStr) {
        const lastAct = parseInt(lastActStr, 10);
        if (!isNaN(lastAct) && Date.now() - lastAct >= 60 * 1000) return true;
      }
      const sessionUser = sessionStorage.getItem('meeting_app_sso_user');
      return !sessionUser;
    } catch {
      return true;
    }
  });
  const [pendingBookingSlot, setPendingBookingSlot] = useState<{
    room: Room;
    time: string;
    date?: Date;
  } | null>(null);
  const [loginModalReason, setLoginModalReason] = useState<string | null>(() => {
    try {
      const lastActStr = localStorage.getItem('meeting_app_last_activity');
      if (lastActStr) {
        const lastAct = parseInt(lastActStr, 10);
        if (!isNaN(lastAct) && Date.now() - lastAct >= 60 * 1000) {
          return 'ออกจากระบบอัตโนมัติเนื่องจากไม่มีการใช้งานเกิน 1 นาที';
        }
      }
      const sessionUser = sessionStorage.getItem('meeting_app_sso_user');
      return !sessionUser ? 'เข้าสู่ระบบเพื่อเข้าสู่ระบบจัดการข้อมูลและสิทธิ์' : null;
    } catch {
      return 'เข้าสู่ระบบเพื่อเข้าสู่ระบบจัดการข้อมูลและสิทธิ์';
    }
  });
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
    notice?: React.ReactNode;
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
    type: 'success' | 'error' | 'info' | 'warning';
  } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4500);
  };

  const currentUserRef = useRef<UserAccount | null>(currentUser);
  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const recordLoginLog = useCallback((u: UserAccount, source: string) => {
    logActivity({
      username: u.username,
      userFullName: u.name,
      userRole: u.role,
      department: u.department,
      actionType: 'LOGIN',
      actionPerformed:
        u.role === 'admin'
          ? `เข้าสู่ระบบสำเร็จ (Super Admin) ผ่าน ${source}`
          : u.role === 'manager'
          ? `เข้าสู่ระบบสำเร็จ (Manager) ผ่าน ${source}`
          : `เข้าสู่ระบบสำเร็จ (ผู้ใช้งาน) ผ่าน ${source}`
    });
  }, []);

  // Centralized Logout Handler
  const handleLogout = useCallback((reason: string = 'ออกจากระบบเรียบร้อยแล้ว', isAuto: boolean = false) => {
    const userLoggingOut = currentUserRef.current;
    if (userLoggingOut) {
      logActivity({
        username: userLoggingOut.username,
        userFullName: userLoggingOut.name,
        userRole: userLoggingOut.role,
        department: userLoggingOut.department,
        actionType: isAuto ? 'AUTO_LOGOUT' : 'LOGOUT',
        actionPerformed: isAuto
          ? 'ออกจากระบบอัตโนมัติ (ไม่มีการใช้งานระบบเกิน 1 นาที)'
          : 'ออกจากระบบโดยผู้ใช้งาน (Sign Out)'
      });
    }

    setCurrentUser(null);
    setIsAuthenticated(false);
    setIsAdminMode(false);
    try {
      sessionStorage.removeItem('meeting_app_sso_user');
      localStorage.removeItem('meeting_app_sso_user');
      localStorage.removeItem('meeting_app_admin_auth');
      localStorage.removeItem('meeting_app_last_activity');
      localStorage.setItem(
        'meeting_app_auth_signal',
        JSON.stringify({
          type: 'LOGOUT',
          timestamp: Date.now(),
          reason,
          isAuto
        })
      );
    } catch (_) {}
    setActivePage('booking');
    setIsBookingModalOpen(false);
    setIsBlockModalOpen(false);
    setEditingBooking(null);
    setViewingBooking(null);

    if (isAuto) {
      setLoginModalReason('ออกจากระบบอัตโนมัติเนื่องจากไม่มีการใช้งานเกิน 1 นาที');
      setIsSsoModalOpen(true);
      showToast('ออกจากระบบอัตโนมัติ เนื่องจากไม่มีการใช้งานระบบเกิน 1 นาที', 'warning');
    } else {
      setLoginModalReason('เข้าสู่ระบบเพื่อเข้าสู่ระบบจัดการข้อมูลและสิทธิ์');
      setIsSsoModalOpen(true);
      showToast(reason, 'info');
    }
  }, []);

  // --- Auto-logout after 1 minute (60 seconds) of inactivity ---
  const INACTIVITY_TIMEOUT_MS = 60 * 1000;
  const lastActivityTimeRef = useRef<number>(Date.now());
  const lastStorageWriteRef = useRef<number>(Date.now());

  useEffect(() => {
    if (!currentUser) return;

    // Reset last activity time when currentUser is logged in
    const startNow = Date.now();
    lastActivityTimeRef.current = startNow;
    lastStorageWriteRef.current = startNow;
    try {
      localStorage.setItem('meeting_app_last_activity', String(startNow));
    } catch (_) {}

    const markUserActivity = () => {
      const now = Date.now();
      lastActivityTimeRef.current = now;

      // Throttle localStorage updates to once every 2 seconds
      if (now - lastStorageWriteRef.current > 2000) {
        lastStorageWriteRef.current = now;
        try {
          localStorage.setItem('meeting_app_last_activity', String(now));
        } catch (_) {}
      }
    };

    const activityEvents: (keyof WindowEventMap)[] = [
      'mousemove',
      'mousedown',
      'keydown',
      'keyup',
      'input',
      'change',
      'focusin',
      'touchstart',
      'scroll',
      'click',
      'wheel'
    ];

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, markUserActivity, { passive: true });
    });

    // Check inactivity every 1 second
    const intervalTimer = setInterval(() => {
      let lastAct = lastActivityTimeRef.current;
      try {
        const stored = localStorage.getItem('meeting_app_last_activity');
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (!isNaN(parsed) && parsed > lastAct) {
            lastAct = parsed;
            lastActivityTimeRef.current = parsed;
          }
        }
      } catch (_) {}

      const idleDuration = Date.now() - lastAct;
      if (idleDuration >= INACTIVITY_TIMEOUT_MS) {
        handleLogout('ออกจากระบบอัตโนมัติ เนื่องจากไม่มีการใช้งานระบบเกิน 1 นาที', true);
      }
    }, 1000);

    // Also check immediately when window / tab gains focus or visibility
    const handleVisibilityOrFocus = () => {
      if (document.visibilityState === 'visible') {
        let lastAct = lastActivityTimeRef.current;
        try {
          const stored = localStorage.getItem('meeting_app_last_activity');
          if (stored) {
            const parsed = parseInt(stored, 10);
            if (!isNaN(parsed) && parsed > lastAct) {
              lastAct = parsed;
              lastActivityTimeRef.current = parsed;
            }
          }
        } catch (_) {}

        if (Date.now() - lastAct >= INACTIVITY_TIMEOUT_MS) {
          handleLogout('ออกจากระบบอัตโนมัติ เนื่องจากไม่มีการใช้งานระบบเกิน 1 นาที', true);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityOrFocus);
    window.addEventListener('focus', handleVisibilityOrFocus);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, markUserActivity);
      });
      clearInterval(intervalTimer);
      document.removeEventListener('visibilitychange', handleVisibilityOrFocus);
      window.removeEventListener('focus', handleVisibilityOrFocus);
    };
  }, [currentUser, handleLogout]);

  // --- Multi-Tab State Synchronization (Auth, Inactivity & Notifications) ---
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      // 1. Cross-Tab Auth Signal (Login / Logout across tabs)
      if (e.key === 'meeting_app_auth_signal' && e.newValue) {
        try {
          const payload = JSON.parse(e.newValue);
          if (payload.type === 'LOGOUT') {
            if (currentUserRef.current) {
              setCurrentUser(null);
              setIsAuthenticated(false);
              setIsAdminMode(false);
              setIsBookingModalOpen(false);
              setIsBlockModalOpen(false);
              setEditingBooking(null);
              setViewingBooking(null);
              if (payload.isAuto) {
                setLoginModalReason('ออกจากระบบอัตโนมัติเนื่องจากไม่มีการใช้งานเกิน 1 นาที (ซิงค์จากแท็บอื่น)');
                setIsSsoModalOpen(true);
                showToast('ออกจากระบบอัตโนมัติเนื่องจากไม่มีการใช้งานระบบเกิน 1 นาที (ซิงค์จากแท็บอื่น)', 'warning');
              } else {
                setLoginModalReason('เข้าสู่ระบบเพื่อเข้าสู่ระบบจัดการข้อมูลและสิทธิ์');
                setIsSsoModalOpen(true);
                showToast(payload.reason || 'ออกจากระบบแล้ว (ซิงค์จากแท็บอื่น)', 'info');
              }
            }
          } else if (payload.type === 'LOGIN' && payload.user) {
            const newUser: UserAccount = payload.user;
            if (!currentUserRef.current || currentUserRef.current.username.toLowerCase() !== newUser.username.toLowerCase()) {
              setCurrentUser(newUser);
              if (newUser.role === 'admin') {
                setIsAuthenticated(true);
                setIsAdminMode(true);
              }
              setIsSsoModalOpen(false);
              setLoginModalReason(null);
              showToast(`เข้าสู่ระบบสำเร็จ: ${newUser.name} (ซิงค์จากแท็บอื่น)`, 'success');
            }
          }
        } catch (_) {}
      }

      // 2. Cross-Tab Keep-Alive (Activity in any tab resets idle timer in other tabs)
      if (e.key === 'meeting_app_last_activity' && e.newValue) {
        const parsed = parseInt(e.newValue, 10);
        if (!isNaN(parsed) && parsed > lastActivityTimeRef.current) {
          lastActivityTimeRef.current = parsed;
        }
      }

      // 3. Cross-Tab Notification Badge Synchronization
      if (e.key === 'meeting_app_notif_sync' && e.newValue && currentUserRef.current) {
        try {
          const payload = JSON.parse(e.newValue);
          if (payload.username === currentUserRef.current.username.toLowerCase()) {
            if (Array.isArray(payload.readNotificationIds)) {
              setReadNotificationIds(payload.readNotificationIds);
            }
            if (Array.isArray(payload.deletedNotificationIds)) {
              setDeletedNotificationIds(payload.deletedNotificationIds);
            }
          }
        } catch (_) {}
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

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

        setCurrentUser((prev) => {
          if (!prev) return null;
          const updatedSelf = cloudUsers.find(
            (u) => u.username.toLowerCase() === prev.username.toLowerCase()
          );
          if (updatedSelf) {
            const merged: UserAccount = {
              ...prev,
              ...updatedSelf,
              name: updatedSelf.name || prev.name || prev.username || 'ผู้ใช้งาน',
              role: updatedSelf.role || prev.role || 'employee',
            };
            try {
              localStorage.setItem('meeting_app_sso_user', JSON.stringify(merged));
            } catch (_) {}
            return merged;
          }
          return prev;
        });
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

    const unsubAuditLogs = subscribeToAuditLogs((cloudLogs) => {
      if (cloudLogs && cloudLogs.length > 0) {
        setAuditLogs(cloudLogs);
        try {
          localStorage.setItem('meeting_app_audit_logs', JSON.stringify(cloudLogs));
        } catch (_) {}
      }
    });

    return () => {
      unsubRooms();
      unsubBookings();
      unsubUsers();
      unsubDepts();
      unsubEmails();
      unsubAuditLogs();
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
        sessionStorage.setItem('meeting_app_sso_user', JSON.stringify(currentUser));
        localStorage.setItem('meeting_app_sso_user', JSON.stringify(currentUser));
      } else {
        sessionStorage.removeItem('meeting_app_sso_user');
        localStorage.removeItem('meeting_app_sso_user');
      }
    } catch (_) {}
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('meeting_app_admin_auth', isAuthenticated ? 'true' : 'false');
  }, [isAuthenticated]);

  const [pendingHashBookingId, setPendingHashBookingId] = useState<string | null>(null);

  useEffect(() => {
    // Capture the hash on initial load
    if (window.location.hash && window.location.hash.includes('bookingId=')) {
      const id = window.location.hash.split('bookingId=')[1]?.replace(/[^a-zA-Z0-9_-]/g, '');
      if (id) {
        setPendingHashBookingId(id);
      }
      try {
        window.history.replaceState(
          null,
          '',
          window.location.pathname + window.location.search
        );
      } catch (_) {}
    }

    // Handle active in-session hash change
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash && hash.includes('bookingId=')) {
        const id = hash.split('bookingId=')[1]?.replace(/[^a-zA-Z0-9_-]/g, '');
        if (id) {
          setPendingHashBookingId(id);
        }
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
  }, []);

  // Open the modal when bookings are loaded and we have a pending hash
  useEffect(() => {
    if (pendingHashBookingId && bookings.length > 0) {
      const found = bookings.find((b) => String(b.id) === pendingHashBookingId);
      if (found) {
        setViewingBooking(found);
        setIsDetailModalOpen(true);
      } else {
        // Optionally show toast if not found, but it might just be loading still.
        // If we only show toast when we are sure it doesn't exist, we need to know when fetching is done.
        // For now, if not found, maybe just wait. Or clear it.
        // Actually, if it's not found in initial bookings, it might be an invalid id. Let's assume bookings is loaded.
        showToast(`ไม่พบรายการจองรหัส ${pendingHashBookingId} ในระบบ`, 'error');
      }
      setPendingHashBookingId(null);
    }
  }, [pendingHashBookingId, bookings]);

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

  // Pending bookings count for Super Admin & Admin (all pending bookings)
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

  // Sync readNotificationIds and deletedNotificationIds with Firestore & localStorage
  useEffect(() => {
    if (!currentUser?.username) {
      setReadNotificationIds([]);
      setDeletedNotificationIds([]);
      return;
    }

    const uname = currentUser.username.toLowerCase().trim();

    // 1. Initial hydration from local cache for instant UI rendering
    try {
      const savedRead = localStorage.getItem(`meeting_app_read_notifs_${uname}`);
      if (savedRead) setReadNotificationIds(JSON.parse(savedRead));
      const savedDeleted = localStorage.getItem(`meeting_app_deleted_notifs_${uname}`);
      if (savedDeleted) setDeletedNotificationIds(JSON.parse(savedDeleted));
    } catch (_) {}

    // 2. Real-time subscription to Firestore so changes from any device sync immediately
    const unsubscribe = subscribeToUserNotificationState(uname, (cloudState) => {
      if (cloudState) {
        setReadNotificationIds((prev) => {
          const merged = Array.from(new Set([...prev, ...(cloudState.readNotificationIds || [])]));
          try {
            localStorage.setItem(`meeting_app_read_notifs_${uname}`, JSON.stringify(merged));
          } catch (_) {}
          return merged;
        });

        setDeletedNotificationIds((prev) => {
          const merged = Array.from(new Set([...prev, ...(cloudState.deletedNotificationIds || [])]));
          try {
            localStorage.setItem(`meeting_app_deleted_notifs_${uname}`, JSON.stringify(merged));
          } catch (_) {}
          return merged;
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser?.username]);

  const handleMarkNotificationsRead = (idsToMark: string[]) => {
    if (!currentUser?.username || idsToMark.length === 0) return;
    const uname = currentUser.username.toLowerCase().trim();
    setReadNotificationIds((prev) => {
      const combined = Array.from(new Set([...prev, ...idsToMark]));
      try {
        localStorage.setItem(`meeting_app_read_notifs_${uname}`, JSON.stringify(combined));
        localStorage.setItem(
          'meeting_app_notif_sync',
          JSON.stringify({
            username: uname,
            readNotificationIds: combined,
            timestamp: Date.now()
          })
        );
      } catch (e) {
        console.error('Error saving read notifications locally', e);
      }
      // Persist to Firestore across all devices
      saveUserNotificationStateToFirestore(uname, { readNotificationIds: combined }).catch((err) => {
        console.warn('Failed to sync read notifications to Firestore:', err);
      });
      return combined;
    });
  };

  const handleDeleteNotifications = (idsToDelete: string[]) => {
    if (!currentUser?.username || idsToDelete.length === 0) return;
    const uname = currentUser.username.toLowerCase().trim();
    setDeletedNotificationIds((prev) => {
      const combined = Array.from(new Set([...prev, ...idsToDelete]));
      try {
        localStorage.setItem(`meeting_app_deleted_notifs_${uname}`, JSON.stringify(combined));
        localStorage.setItem(
          'meeting_app_notif_sync',
          JSON.stringify({
            username: uname,
            deletedNotificationIds: combined,
            timestamp: Date.now()
          })
        );
      } catch (e) {
        console.error('Error saving deleted notifications locally', e);
      }
      // Persist to Firestore across all devices
      saveUserNotificationStateToFirestore(uname, { deletedNotificationIds: combined }).catch((err) => {
        console.warn('Failed to sync deleted notifications to Firestore:', err);
      });
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
        if (isMine) checkAndIncrement(`booking_approved_${b.id}`);
      } else if (b.status === 'rejected') {
        if (isMine) checkAndIncrement(`booking_rejected_${b.id}`);
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
        logActivity({
          username: currentUser?.username || formData.username || 'user',
          userFullName: currentUser?.name || formData.requesterName || 'ผู้ใช้งาน',
          userRole: currentUser?.role || 'employee',
          department: currentUser?.department || formData.department || '-',
          actionType: 'UPDATE_BOOKING',
          actionPerformed: `แก้ไขข้อมูลการจองห้อง: ${formData.topic} (${room.name})`
        });
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
          username: currentUser?.username || formData.username || '',
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
        const newMails = createEmailNotifications(newBooking, 'RECEIVED', rooms, undefined, users);
        setEmailNotifications((prev) => [...newMails, ...prev]);

        logActivity({
          username: currentUser?.username || formData.username || 'user',
          userFullName: currentUser?.name || formData.requesterName || 'ผู้ใช้งาน',
          userRole: currentUser?.role || 'employee',
          department: currentUser?.department || formData.department || '-',
          actionType: 'CREATE_BOOKING',
          actionPerformed: `ส่งคำขอจองห้องประชุม: ${formData.topic} (${room.name})`
        });

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

  const handleBatchImportBookings = async (
    newBookings: Booking[],
    options?: { suppressEmail?: boolean }
  ) => {
    if (!newBookings || newBookings.length === 0) return;

    // Stamp bookings with isImported and suppressEmail flags (default: true per user request)
    const sanitizedBookings = newBookings.map((b) => ({
      ...b,
      isImported: true,
      suppressEmail: options?.suppressEmail !== false
    }));

    setBookings((prev) => [...sanitizedBookings, ...prev]);

    for (const b of sanitizedBookings) {
      saveBookingToFirestore(b).catch((err) =>
        console.warn('Error saving imported booking to Firestore:', b.id, err)
      );
    }

    // Explicitly NO email notifications are generated or sent for Excel imports
    showToast(
      `นำเข้าข้อมูลรายการจองสำเร็จทั้งหมด ${sanitizedBookings.length} รายการ (ไม่ส่งอีเมลแจ้งเตือน)`,
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
    const newMails = createEmailNotifications(updated, 'APPROVED', rooms, undefined, users);
    setEmailNotifications((prev) => [...newMails, ...prev]);

    logActivity({
      username: currentUser?.username || 'admin',
      userFullName: currentUser?.name || 'ผู้ดูแลระบบ',
      userRole: currentUser?.role || 'admin',
      department: currentUser?.department || '-',
      actionType: 'APPROVE_BOOKING',
      actionPerformed: `อนุมัติคำขอจองห้อง: ${target.topic}`
    });

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
    const newMails = createEmailNotifications(updated, 'REJECTED', rooms, reason, users);
    setEmailNotifications((prev) => [...newMails, ...prev]);

    logActivity({
      username: currentUser?.username || 'admin',
      userFullName: currentUser?.name || 'ผู้ดูแลระบบ',
      userRole: currentUser?.role || 'admin',
      department: currentUser?.department || '-',
      actionType: 'REJECT_BOOKING',
      actionPerformed: `ปฏิเสธคำขอจองห้อง: ${target.topic} (เหตุผล: ${reason || 'ไม่ได้ระบุ'})`
    });

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

    const isUserAdmin = isAdminMode || currentUser?.role === 'admin' || currentUser?.role === 'manager';
    if (!isUserAdmin && isBookingInPast(b)) {
      throw new Error('บัญชี User ไม่สามารถยกเลิกการจองในวันที่และเวลาที่ผ่านมาแล้วได้');
    }

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
    const newMails = createEmailNotifications(updated, 'CANCELLED', rooms, reason, users);
    setEmailNotifications((prev) => [...newMails, ...prev]);

    logActivity({
      username: currentUser?.username || b.username || 'user',
      userFullName: currentUser?.name || b.requesterName || 'ผู้ใช้งาน',
      userRole: currentUser?.role || 'employee',
      department: currentUser?.department || b.department || '-',
      actionType: 'CANCEL_BOOKING',
      actionPerformed: `ยกเลิกการจองห้อง: ${b.topic} (เหตุผล: ${reason || 'ไม่ได้ระบุ'})`
    });

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
    const newMails = createEmailNotifications(targetResendBooking, emailType, rooms, undefined, users);
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
      phone: '02-252-0161',
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
    const trimmedUsername = newUser.username.trim().toLowerCase();
    const exists = users.some(
      (u) => u.username.trim().toLowerCase() === trimmedUsername
    );
    if (exists) {
      return {
        success: false,
        message: `ชื่อผู้ใช้งาน "${newUser.username.trim()}" มีอยู่ในระบบแล้ว ไม่สามารถใช้ชื่อผู้ใช้งานซ้ำได้ กรุณาเลือกชื่ออื่น`
      };
    }

    if (newUser.email) {
      const emailExists = users.some(
        (u) => u.email && u.email.trim().toLowerCase() === newUser.email!.trim().toLowerCase()
      );
      if (emailExists) {
        return {
          success: false,
          message: `อีเมล "${newUser.email}" มีอยู่ในระบบแล้ว ไม่สามารถใช้อีเมลซ้ำได้`
        };
      }
    }

    const userToSave = { ...newUser, username: trimmedUsername, id: newUser.id || trimmedUsername };
    setUsers((prev) => [userToSave, ...prev]);
    saveUserToFirestore(userToSave).catch(console.warn);

    // Trigger registration emails:
    // 1) When user registers with pending approval: email to user + email to admins
    // 2) When user is registered with approved status (e.g. by admin): approval welcome email
    if (userToSave.status === 'pending') {
      const regEmails = createUserRegistrationEmails(userToSave, users);
      setEmailNotifications((prev) => [...regEmails, ...prev]);
      logActivity({
        username: userToSave.username,
        userFullName: userToSave.name,
        userRole: userToSave.role,
        department: userToSave.department,
        actionType: 'USER_MANAGEMENT',
        actionPerformed: `ยื่นคำขอลงทะเบียนผู้ใช้งานใหม่: ${userToSave.name} (@${userToSave.username}) ฝ่าย: ${userToSave.department || '-'}`
      });
      showToast(`ลงทะเบียนคำขอสำหรับ "${newUser.name}" เรียบร้อยแล้ว ระบบได้ส่งอีเมลตอบรับไปยังคุณและส่งอีเมลแจ้งเตือนไปยัง Super Admin`, 'success');
    } else if (userToSave.status === 'approved') {
      const apprEmails = createUserApprovalEmails(userToSave, currentUser?.name || 'ผู้ดูแลระบบ', users);
      setEmailNotifications((prev) => [...apprEmails, ...prev]);
      logActivity({
        username: currentUser?.username || 'admin',
        userFullName: currentUser?.name || 'Super Admin',
        userRole: currentUser?.role || 'admin',
        department: currentUser?.department || '-',
        actionType: 'USER_MANAGEMENT',
        actionPerformed: `เพิ่มบัญชีผู้ใช้งานใหม่โดยตรง: ${userToSave.name} (@${userToSave.username}) สิทธิ์: ${userToSave.role}`
      });
      showToast(`เพิ่มผู้ใช้งาน "${newUser.name}" และส่งอีเมลยืนยันการอนุมัติเรียบร้อยแล้ว`, 'success');
    } else {
      showToast(`บันทึกข้อมูลผู้ใช้งาน "${newUser.name}" เรียบร้อยแล้ว`, 'success');
    }

    return { success: true };
  };

  const handleApproveUser = (username: string) => {
    const target = users.find((u) => u.username === username);
    if (!target) return;

    const approvedAt = new Date().toISOString();
    const approvedBy = currentUser?.name || 'ผู้ดูแลระบบ';

    const updatedUser: UserAccount = {
      ...target,
      status: 'approved',
      approvedAt,
      approvedBy
    };

    setUsers((prev) =>
      prev.map((u) => (u.username === username ? updatedUser : u))
    );
    saveUserToFirestore(updatedUser).catch(console.warn);

    // Create system notification email for the approved user & Super Admin
    const approvalEmails = createUserApprovalEmails(updatedUser, approvedBy, users);
    setEmailNotifications((prev) => [...approvalEmails, ...prev]);

    logActivity({
      username: currentUser?.username || 'admin',
      userFullName: currentUser?.name || 'Super Admin',
      userRole: currentUser?.role || 'admin',
      department: currentUser?.department || '-',
      actionType: 'USER_MANAGEMENT',
      actionPerformed: `อนุมัติคำขอลงทะเบียนผู้ใช้งาน: ${target.name} (@${target.username})`
    });

    showToast(`อนุมัติคำขอใช้งานของ "${target.name}" เรียบร้อยแล้ว ระบบส่งอีเมลตอบรับยืนยันเรียบร้อย`, 'success');
  };

  const handleRejectUser = (username: string, reason?: string) => {
    const target = users.find((u) => u.username === username);
    if (!target) return;
    const rejectionReason = reason || 'ข้อมูลไม่ผ่านเกณฑ์การอนุมัติ';
    const updatedUser: UserAccount = {
      ...target,
      status: 'rejected',
      rejectionReason
    };
    setUsers((prev) =>
      prev.map((u) => (u.username === username ? updatedUser : u))
    );
    saveUserToFirestore(updatedUser).catch(console.warn);

    // Send rejection email to user
    const rejEmail = createUserRejectionEmail(updatedUser, rejectionReason);
    setEmailNotifications((prev) => [rejEmail, ...prev]);

    logActivity({
      username: currentUser?.username || 'admin',
      userFullName: currentUser?.name || 'Super Admin',
      userRole: currentUser?.role || 'admin',
      department: currentUser?.department || '-',
      actionType: 'USER_MANAGEMENT',
      actionPerformed: `ปฏิเสธคำขอลงทะเบียนผู้ใช้: ${target.name} (@${target.username}) (เหตุผล: ${rejectionReason})`
    });

    showToast(`ปฏิเสธคำขอสมัครของ "${target.name || username}" และส่งอีเมลแจ้งผลเรียบร้อยแล้ว`, 'info');
  };

  const handleDeleteUser = (username: string) => {
    const target = users.find((u) => u.username === username);
    if (!target) return;

    // หาประวัติการจองทั้งหมดของผู้ใช้งานท่านนี้
    const userBookings = bookings.filter(
      (b) =>
        (b.username && b.username.toLowerCase() === username.toLowerCase()) ||
        (!b.username && b.requesterName && b.requesterName.trim().toLowerCase() === target.name.trim().toLowerCase())
    );

    const nowIso = new Date().toISOString();
    const upcomingBookings = userBookings.filter(
      (b) => b.endTime >= nowIso && b.status !== 'cancelled' && b.status !== 'rejected'
    );

    setDeleteModalState({
      isOpen: true,
      title: 'ยืนยันการลบบัญชีผู้ใช้งาน',
      description: 'คุณต้องการลบบัญชีผู้ใช้นี้ออกจากระบบใช่หรือไม่? ผู้ใช้งานจะไม่สามารถเข้าสู่ระบบได้อีกต่อไป',
      itemDetails: [
        { label: 'ชื่อ - นามสกุล', value: target.name },
        { label: 'ชื่อผู้ใช้งาน (Username)', value: target.username },
        { label: 'ฝ่าย / หน่วยงาน', value: target.department || '-' },
        {
          label: 'ระดับสิทธิ์',
          value:
            target.role === 'admin'
              ? 'ผู้ดูแลระบบสูงสุด (Super Admin)'
              : target.role === 'manager'
                ? 'ผู้ดูแลระบบ (Admin)'
                : 'ผู้ใช้งานทั่วไป (User)'
        },
        {
          label: 'ประวัติการจองห้องประชุม',
          value:
            userBookings.length > 0
              ? `${userBookings.length} รายการ ${upcomingBookings.length > 0 ? `(ในอนาคต: ${upcomingBookings.length} รายการ)` : ''}`
              : 'ไม่มีประวัติการจอง'
        }
      ],
      notice: (
        <div>
          <div className="font-bold text-emerald-950">
            ระบบคงประวัติการจองห้องประชุมไว้ในระบบ 100% (ข้อมูลไม่สูญหาย)
          </div>
          <div className="text-[11px] text-emerald-800 mt-0.5 leading-relaxed">
            {userBookings.length > 0
              ? `รายการจองทั้งหมด ${userBookings.length} รายการจะยังคงอยู่ครบถ้วนในปฏิทินและรายงานสถิติ โดยระบบจะระบุสถานะเป็น "อดีตผู้ใช้งาน / พ้นสภาพ" เพื่อให้ผู้ดูแลระบบตรวจสอบย้อนหลังได้`
              : 'การลบบัญชีนี้จะไม่ส่งผลกระทบต่อรายการจองห้องประชุมหรือข้อมูลอื่นใดในระบบ'}
          </div>
        </div>
      ),
      onConfirm: () => {
        // 1. ลบบัญชีผู้ใช้จาก users state และ Firestore
        setUsers((prev) => prev.filter((u) => u.username !== username));
        deleteUserFromFirestore(target.id || target.username).catch(console.warn);

        logActivity({
          username: currentUser?.username || 'admin',
          userFullName: currentUser?.name || 'Super Admin',
          userRole: currentUser?.role || 'admin',
          department: currentUser?.department || '-',
          actionType: 'USER_MANAGEMENT',
          actionPerformed: `ลบบัญชีผู้ใช้งานออกจากระบบ: ${target.name} (@${target.username})`
        });

        // 2. คงประวัติการจองทั้งหมด และทำเครื่องหมาย requesterAccountStatus: 'deleted'
        if (userBookings.length > 0) {
          const userBookingIds = new Set(userBookings.map((b) => b.id));
          setBookings((prev) =>
            prev.map((b) => {
              if (userBookingIds.has(b.id)) {
                const updatedBooking: Booking = {
                  ...b,
                  requesterAccountStatus: 'deleted'
                };
                saveBookingToFirestore(updatedBooking).catch(console.warn);
                return updatedBooking;
              }
              return b;
            })
          );
        }

        showToast(
          `ลบบัญชีผู้ใช้งาน "${target.name}" เรียบร้อยแล้ว (คงประวัติการจอง ${userBookings.length} รายการไว้ในระบบ)`,
          'info'
        );
      }
    });
  };

  const handleUpdateUserRole = (username: string, role: UserRole) => {
    const target = users.find((u) => u.username === username);
    if (!target) return;

    const avatarColor =
      role === 'admin'
        ? 'bg-purple-600'
        : role === 'manager'
        ? 'bg-blue-600'
        : 'bg-emerald-600';

    const updatedUser: UserAccount = {
      ...target,
      role,
      avatarColor: target.avatarColor || avatarColor,
      receiveEmailNotifications:
        role === 'admin' || role === 'manager'
          ? (target.receiveEmailNotifications !== false)
          : undefined,
    };

    setUsers((prev) =>
      prev.map((u) => (u.username === username ? updatedUser : u))
    );

    saveUserToFirestore(updatedUser).catch(console.warn);

    if (currentUser?.username === username) {
      setCurrentUser(updatedUser);
      try {
        localStorage.setItem('meeting_app_sso_user', JSON.stringify(updatedUser));
      } catch (_) {}
    }

    const roleName = role === 'admin' ? 'Super Admin' : role === 'manager' ? 'Admin' : 'User';
    logActivity({
      username: currentUser?.username || 'admin',
      userFullName: currentUser?.name || 'Super Admin',
      userRole: currentUser?.role || 'admin',
      department: currentUser?.department || '-',
      actionType: 'USER_MANAGEMENT',
      actionPerformed: `ปรับระดับสิทธิ์ของ ${target.name || username} เป็น ${roleName}`
    });
    showToast(`ปรับระดับสิทธิ์ของ "${target.name || username}" เป็น ${roleName} เรียบร้อยแล้ว`, 'success');
  };

  const handleUpdateUser = (updatedUser: UserAccount) => {
    const existing = users.find((u) => u.username === updatedUser.username);

    setUsers((prev) =>
      prev.map((u) => (u.username === updatedUser.username ? updatedUser : u))
    );
    saveUserToFirestore(updatedUser).catch(console.warn);
    if (currentUser?.username === updatedUser.username) {
      setCurrentUser(updatedUser);
    }

    // If user's approval status changed:
    if (existing && existing.status !== 'approved' && updatedUser.status === 'approved') {
      const apprEmail = createUserApprovalEmail(updatedUser, currentUser?.name || 'ผู้ดูแลระบบ');
      setEmailNotifications((prev) => [apprEmail, ...prev]);
    } else if (existing && existing.status !== 'rejected' && updatedUser.status === 'rejected') {
      const rejEmail = createUserRejectionEmail(
        updatedUser,
        updatedUser.rejectionReason || 'ข้อมูลไม่ผ่านเกณฑ์'
      );
      setEmailNotifications((prev) => [rejEmail, ...prev]);
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

  // Authentication Gate: If user is not logged in, they CANNOT see the main booking page
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-100 flex flex-col justify-between relative overflow-x-hidden font-sans text-gray-900">
        {/* Subtle decorative background gradient circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-red-100/60 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-red-100/50 rounded-full blur-3xl pointer-events-none" />

        {/* Toast Alert */}
        {toast && (
          <div className="fixed top-4 right-4 z-[100] animate-fade-in pointer-events-none">
            <div
              className={`px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs sm:text-sm font-bold text-white pointer-events-auto border border-white/20 ${
                toast.type === 'error'
                  ? 'bg-red-600'
                  : toast.type === 'warning'
                    ? 'bg-amber-600'
                    : toast.type === 'info'
                      ? 'bg-blue-600'
                      : 'bg-emerald-600'
              }`}
            >
              {toast.type === 'error' || toast.type === 'warning' ? (
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

        {/* Top Minimal Branding Header */}
        <header className="w-full bg-white border-b border-gray-200 sticky top-0 shadow-2xs px-4 sm:px-6 py-2.5 sm:py-3 z-30">
          <div className="max-w-7xl mx-auto flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src="https://lh3.googleusercontent.com/d/1og-QqwMnWYP1g9iJXKiARJJmBZ07NJHN"
                alt="QSMI Logo"
                className="h-8 sm:h-10 w-auto object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 leading-tight">
              ระบบจองห้องประชุม สถานเสาวภา สภากาชาดไทย
            </h1>
          </div>
        </header>

        {/* Centered Login & Registration Gate Card */}
        <main className="flex-1 flex items-center justify-center p-4 sm:p-6 z-10">
          <SsoLoginModal
            isOpen={true}
            isMandatory={true}
            asCard={true}
            onClose={() => {}}
            users={users}
            departments={departments}
            onRegisterUser={handleRegisterUser}
            reason={loginModalReason || 'เข้าสู่ระบบเพื่อเข้าสู่ระบบจัดการข้อมูลและสิทธิ์'}
            onLoginSuccess={(u) => {
              const now = Date.now();
              lastActivityTimeRef.current = now;
              try {
                localStorage.setItem('meeting_app_last_activity', String(now));
              } catch (_) {}
              setCurrentUser(u);
              try {
                sessionStorage.setItem('meeting_app_sso_user', JSON.stringify(u));
                localStorage.setItem('meeting_app_sso_user', JSON.stringify(u));
              } catch (_) {}
              if (u.role === 'admin') {
                setIsAuthenticated(true);
                setIsAdminMode(true);
              }
              recordLoginLog(u, 'หน้าเข้าสู่ระบบหลัก (Portal Login)');
              setIsSsoModalOpen(false);
              showToast(`ยินดีต้อนรับคุณ ${u.name} (${u.department})`, 'success');
              setLoginModalReason(null);
              setActivePage('booking');
            }}
          />
        </main>
      </div>
    );
  }

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
                : toast.type === 'warning'
                  ? 'bg-amber-600'
                  : toast.type === 'info'
                    ? 'bg-blue-600'
                    : 'bg-emerald-600'
            }`}
          >
            {toast.type === 'error' || toast.type === 'warning' ? (
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
        onOpenMyBookings={() => {
          if (!currentUser) {
            setPendingBookingSlot(null);
            setLoginModalReason('กรุณาเข้าสู่ระบบก่อน เพื่อดูรายการจองของฉัน');
            setIsSsoModalOpen(true);
            return;
          }
          setManagementInitialTab('my_history');
          setActivePage('management');
        }}
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
          handleLogout('ออกจากระบบเรียบร้อยแล้ว');
        }}
      />

      {/* SEPARATED PAGE ROUTING (Management is ONLY visible when user is logged in) */}
      {activePage === 'management' && currentUser ? (
        /* PAGE 2: USER & ADMIN MANAGEMENT / PORTAL */
        <main className="flex-1 overflow-y-auto w-full no-scrollbar">
          <ManagementPortal
            initialTab={managementInitialTab}
            currentUser={currentUser}
            isAuthenticated={isAuthenticated}
            isAdminMode={isAdminMode}
            bookings={bookings}
            rooms={rooms}
            users={users}
            departments={departments}
            auditLogs={auditLogs}
            onRefreshAuditLogs={() => {
              subscribeToAuditLogs((fresh) => {
                if (fresh && fresh.length > 0) setAuditLogs(fresh);
              });
            }}
            onAddDepartment={handleAddDepartment}
            onUpdateDepartment={handleUpdateDepartment}
            onDeleteDepartment={handleDeleteDepartment}
            onLogin={(user) => {
              const now = Date.now();
              lastActivityTimeRef.current = now;
              try {
                localStorage.setItem('meeting_app_last_activity', String(now));
              } catch (_) {}
              setCurrentUser(user);
              if (user.role === 'admin') {
                setIsAuthenticated(true);
                setIsAdminMode(true);
              }
              recordLoginLog(user, 'หน้าจัดการระบบ (Management Portal)');
              showToast(`ยินดีต้อนรับคุณ ${user.name} (${user.role.toUpperCase()})`, 'success');
            }}
            onLogout={() => {
              handleLogout('ออกจากระบบเรียบร้อยแล้ว');
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
              const isUserAdmin = isAdminMode || currentUser?.role === 'admin' || currentUser?.role === 'manager';
              if (!isUserAdmin && isBookingInPast(b)) {
                showToast('บัญชี User ไม่สามารถยกเลิกการจองในวันที่และเวลาที่ผ่านมาแล้วได้', 'error');
                return;
              }
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
        users={users}
        onApprove={handleApprove}
        onReject={handleRejectClick}
        onEditClick={(b) => {
          setIsDetailModalOpen(false);
          setViewingBooking(null);
          setEditingBooking(b);
          setSelectedSlotRoom(rooms.find((r) => r.id === b.roomId));
          setIsBookingModalOpen(true);
        }}
        onCancelClick={(b) => {
          const isUserAdmin = isAdminMode || currentUser?.role === 'admin' || currentUser?.role === 'manager';
          if (!isUserAdmin && isBookingInPast(b)) {
            showToast('บัญชี User ไม่สามารถยกเลิกการจองในวันที่และเวลาที่ผ่านมาแล้วได้', 'error');
            return;
          }
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
          const now = Date.now();
          lastActivityTimeRef.current = now;
          try {
            localStorage.setItem('meeting_app_last_activity', String(now));
          } catch (_) {}
          setCurrentUser(u);
          try {
            sessionStorage.setItem('meeting_app_sso_user', JSON.stringify(u));
            localStorage.setItem('meeting_app_sso_user', JSON.stringify(u));
          } catch (_) {}
          if (u.role === 'admin') {
            setIsAuthenticated(true);
            setIsAdminMode(true);
          }
          recordLoginLog(u, 'หน้าต่างเข้าสู่ระบบ (Login Modal)');
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
            setActivePage('booking');
          }
        }}
      />

      {/* 4. Admin Login Modal */}
      <AdminLoginModal
        isOpen={isAdminLoginModalOpen}
        onClose={() => setIsAdminLoginModalOpen(false)}
        users={users}
        onSuccess={(adminUser) => {
          const now = Date.now();
          lastActivityTimeRef.current = now;
          try {
            localStorage.setItem('meeting_app_last_activity', String(now));
          } catch (_) {}
          setIsAuthenticated(true);
          setIsAdminMode(true);
          const targetAdmin = adminUser || users.find((u) => u.role === 'admin') || CORPORATE_USERS[0];
          setCurrentUser(targetAdmin);
          recordLoginLog(targetAdmin, 'Admin Login Modal');
          showToast(`เข้าสู่ระบบผู้ดูแลระบบ (Admin) สำเร็จ: ${targetAdmin.name}`, 'success');
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
          if (bId.startsWith('USER-')) {
            setIsEmailModalOpen(false);
            if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager')) {
              setManagementInitialTab('users');
              setActivePage('management');
              showToast('เปิดหน้าจัดการบัญชีผู้ใช้งาน', 'info');
            } else {
              setLoginModalReason('กรุณาเข้าสู่ระบบเพื่อจัดการผู้ใช้งานหรือเริ่มใช้งานระบบ');
              setIsSsoModalOpen(true);
            }
            return;
          }
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

      {/* 13. Universal Delete Confirmation Modal (Theme-Consistent Custom Modal) */}
      <DeleteConfirmModal
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState((prev) => ({ ...prev, isOpen: false }))}
        title={deleteModalState.title}
        description={deleteModalState.description}
        itemDetails={deleteModalState.itemDetails}
        notice={deleteModalState.notice}
        onConfirm={deleteModalState.onConfirm}
      />
    </div>
  );
}
