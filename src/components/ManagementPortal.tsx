import React, { useState, useMemo, useEffect } from 'react';
import {
  ShieldCheck,
  Briefcase,
  UserCheck,
  Lock,
  ArrowLeft,
  Calendar,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Ban,
  Building,
  Building2,
  AlertCircle,
  FileSpreadsheet,
  Plus,
  Search,
  Filter,
  LogOut,
  Send,
  Edit,
  Trash2,
  BarChart3,
  Users,
  Settings,
  Eye,
  Check,
  X,
  UserPlus,
  UserMinus,
  Mail,
  MailX,
  Phone,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  User,
  ChevronDown,
  ChevronUp,
  UploadCloud,
  UserX
} from 'lucide-react';
import { Booking, Room, UserAccount, UserRole, UserStatus, Department } from '../types';
import { formatThaiDate, formatThaiTime } from '../utils/thaiDate';
import { formatThaiPhone, normalizeThaiPhoneNumber } from '../utils/phoneUtils';
import { exportBookingsToCSV } from '../utils/exportUtils';
import { isBookingRequesterDeleted } from '../utils/bookingUserUtils';
import { AdminReports } from './AdminReports';
import { MyProfileTab } from './MyProfileTab';
import { DepartmentManagementTab } from './DepartmentManagementTab';
import { ImportExcelModal } from './ImportExcelModal';
import { MyBookingsTab } from './MyBookingsTab';

interface ManagementPortalProps {
  initialTab?: 'approvals' | 'users' | 'bookings' | 'my_history' | 'rooms' | 'reports' | 'directory' | 'departments' | 'my_profile';
  currentUser: UserAccount | null;
  isAuthenticated: boolean;
  isAdminMode: boolean;
  bookings: Booking[];
  rooms: Room[];
  users?: UserAccount[];
  departments?: Department[];
  onLogin: (user: UserAccount) => void;
  onLogout: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onResendEmail: (booking: Booking) => void;
  onEditBooking: (booking: Booking) => void;
  onDeleteBooking: (id: string) => void;
  onOpenBlockModal: () => void;
  onOpenRoomModal: () => void;
  onEditRoom?: (room: Room) => void;
  onDeleteRoom?: (roomId: string) => void;
  onToggleRoomStatus?: (roomId: string) => void;
  onViewBooking: (booking: Booking) => void;
  onRequestCancel: (booking: Booking) => void;
  onBackToBooking: () => void;
  // User Management Handlers
  onApproveUser?: (username: string) => void;
  onRejectUser?: (username: string, reason?: string) => void;
  onDeleteUser?: (username: string) => void;
  onUpdateUserRole?: (username: string, role: UserRole) => void;
  onRegisterUser?: (newUser: UserAccount) => { success: boolean; message?: string };
  onUpdateProfile?: (updatedUser: UserAccount) => void;
  onUpdateUser?: (updatedUser: UserAccount) => void;
  // Department Management Handlers
  onAddDepartment?: (newDept: Omit<Department, 'id'>) => void;
  onUpdateDepartment?: (updatedDept: Department) => void;
  onDeleteDepartment?: (deptId: string) => void;
  // Excel Import Handler
  onBatchImportBookings?: (newBookings: Booking[], options?: { suppressEmail?: boolean }) => void;
}

export const ManagementPortal: React.FC<ManagementPortalProps> = ({
  initialTab,
  currentUser,
  isAuthenticated,
  isAdminMode,
  bookings,
  rooms,
  users = [],
  departments = [],
  onLogin,
  onLogout,
  onApprove,
  onReject,
  onResendEmail,
  onEditBooking,
  onDeleteBooking,
  onOpenBlockModal,
  onOpenRoomModal,
  onEditRoom,
  onDeleteRoom,
  onToggleRoomStatus,
  onViewBooking,
  onRequestCancel,
  onBackToBooking,
  onApproveUser,
  onRejectUser,
  onDeleteUser,
  onUpdateUserRole,
  onRegisterUser,
  onUpdateProfile,
  onUpdateUser,
  onAddDepartment,
  onUpdateDepartment,
  onDeleteDepartment,
  onBatchImportBookings
}) => {
  // Login Form States (for View A)
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [roleTab, setRoleTab] = useState<'all' | UserRole>('all');
  const [selectedUser, setSelectedUser] = useState<UserAccount | null>(null);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('1234');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  const availableDeptNames = useMemo(() => {
    if (departments && departments.length > 0) {
      return departments.map((d) => d.name);
    }
    return [
      'ฝ่ายบริหารงานทั่วไป',
      'ฝ่ายบริการและวิจัยคลินิก',
      'ฝ่ายวิจัยและพัฒนา',
      'สวนงู (Snake Farm)',
      'ฝ่ายผลิตเซรุ่มแก้พิษงู',
      'ฝ่ายผลิตวัคซีน',
      'ฝ่ายประกันคุณภาพ',
      'ฝ่ายสนับสนุนอาคารและเครื่องจักรกล',
      'ฝ่ายการเงินและพัสดุ',
      'ฝ่ายเทคโนโลยีสารสนเทศ'
    ];
  }, [departments]);

  // Registration Form States in Management Portal Login View
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regName, setRegName] = useState('');
  const [regDept, setRegDept] = useState<string>(() => {
    if (departments && departments.length > 0) return departments[0].name;
    return 'ฝ่ายบริหารงานทั่วไป';
  });
  const [regTitle, setRegTitle] = useState('');
  const [regRole, setRegRole] = useState<'employee'>('employee');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regSuccessMessage, setRegSuccessMessage] = useState<string | null>(null);

  // Sync regDept when availableDeptNames changes
  useEffect(() => {
    if (availableDeptNames.length > 0 && !availableDeptNames.includes(regDept)) {
      setRegDept(availableDeptNames[0]);
    }
  }, [availableDeptNames, regDept]);

  // Active Management Tab (for View B)
  const [activeTab, setActiveTab] = useState<
    'approvals' | 'users' | 'bookings' | 'my_history' | 'rooms' | 'reports' | 'directory' | 'departments' | 'my_profile'
  >(() => {
    if (initialTab) return initialTab;
    if (currentUser?.role === 'employee') return 'my_history';
    return 'approvals';
  });

  const isAdmin = currentUser?.role === 'admin' || isAuthenticated;
  const isManager = currentUser?.role === 'manager';

  // Sync activeTab when initialTab changes
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  // Guard active tab according to strict role constraints
  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'employee') {
        if (activeTab !== 'my_profile' && activeTab !== 'my_history') {
          setActiveTab('my_history');
        }
      } else if (currentUser.role === 'manager') {
        if (
          activeTab === 'users' ||
          activeTab === 'rooms' ||
          activeTab === 'directory' ||
          activeTab === 'departments'
        ) {
          setActiveTab('approvals');
        }
      }
    }
  }, [currentUser, activeTab]);

  // Search & Filter in Bookings Table
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'cancelled' | 'rejected'>('all');
  const [deptFilter, setDeptFilter] = useState<string>('all');
  const [bookingStartDate, setBookingStartDate] = useState<string>('');
  const [bookingEndDate, setBookingEndDate] = useState<string>('');
  const [bookingsDisplayLimit, setBookingsDisplayLimit] = useState<number>(10);

  // Search & Filter in Users Table
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | UserRole | 'pending'>('all');
  const [usersDisplayLimit, setUsersDisplayLimit] = useState<number>(10);
  const [pendingUsersDisplayLimit, setPendingUsersDisplayLimit] = useState<number>(10);

  // Approvals Limit
  const [approvalsDisplayLimit, setApprovalsDisplayLimit] = useState<number>(10);

  // Reset pagination when search/filter values change
  useEffect(() => {
    setBookingsDisplayLimit(10);
  }, [searchTerm, statusFilter, deptFilter, bookingStartDate, bookingEndDate]);

  useEffect(() => {
    setUsersDisplayLimit(10);
  }, [userSearchTerm, userRoleFilter]);

  // User Rejection Modal State
  const [rejectingUser, setRejectingUser] = useState<UserAccount | null>(null);
  const [userRejectReason, setUserRejectReason] = useState('ข้อมูลไม่ตรงกับทำเนียบบุคลากร');

  // Admin Add User Modal State
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [newAdminUserName, setNewAdminUserName] = useState('');
  const [newAdminUserUsername, setNewAdminUserUsername] = useState('');
  const [newAdminUserPassword, setNewAdminUserPassword] = useState('1234');
  const [newAdminUserDept, setNewAdminUserDept] = useState('ฝ่ายบริหารงานทั่วไป');
  const [newAdminUserTitle, setNewAdminUserTitle] = useState('เจ้าหน้าที่');
  const [newAdminUserRole, setNewAdminUserRole] = useState<UserRole>('employee');
  const [newAdminUserEmail, setNewAdminUserEmail] = useState('');
  const [newAdminUserPhone, setNewAdminUserPhone] = useState('');
  const [newAdminUserReceiveEmail, setNewAdminUserReceiveEmail] = useState(true);

  // Admin Edit User Modal State
  const [editingUser, setEditingUser] = useState<UserAccount | null>(null);
  const [editUserName, setEditUserName] = useState('');
  const [editUserDept, setEditUserDept] = useState('');
  const [editUserTitle, setEditUserTitle] = useState('');
  const [editUserRole, setEditUserRole] = useState<UserRole>('employee');
  const [editUserStatus, setEditUserStatus] = useState<UserStatus>('approved');
  const [editUserEmail, setEditUserEmail] = useState('');
  const [editUserPhone, setEditUserPhone] = useState('');
  const [editUserPassword, setEditUserPassword] = useState('');
  const [editUserReceiveEmail, setEditUserReceiveEmail] = useState(true);

  // Compute Pending Approvals for Bookings (Admin & Manager) - Sorted latest incoming first
  const pendingApprovals = useMemo(() => {
    return bookings
      .filter((b) => {
        if (b.status !== 'pending' || b.isBlocked) return false;
        if (isAdmin || isManager) return true;
        return false;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt || a.startTime).getTime();
        const timeB = new Date(b.createdAt || b.startTime).getTime();
        return timeB - timeA;
      });
  }, [bookings, isAdmin, isManager]);

  const displayedApprovals = useMemo(() => {
    return pendingApprovals.slice(0, approvalsDisplayLimit);
  }, [pendingApprovals, approvalsDisplayLimit]);

  // Compute My Bookings count for the current user
  const myBookingsCount = useMemo(() => {
    if (!currentUser) return 0;
    return bookings.filter(
      (b) =>
        b.requesterName === currentUser.name ||
        b.email === currentUser.email ||
        (currentUser.phone && b.phone === currentUser.phone)
    ).length;
  }, [bookings, currentUser]);

  // Compute Pending User Registrations (for Admin) - Sorted latest registered first
  const pendingUsers = useMemo(() => {
    return users
      .filter((u) => u.status === 'pending')
      .sort((a, b) => {
        const timeA = a.registeredAt ? new Date(a.registeredAt).getTime() : 0;
        const timeB = b.registeredAt ? new Date(b.registeredAt).getTime() : 0;
        return timeB - timeA;
      });
  }, [users]);

  const displayedPendingUsers = useMemo(() => {
    return pendingUsers.slice(0, pendingUsersDisplayLimit);
  }, [pendingUsers, pendingUsersDisplayLimit]);

  // Quick switch user in login
  const handleSelectQuickUser = (user: UserAccount) => {
    setSelectedUser(user);
    setUsername(user.username);
    setPassword(user.password || (user.role === 'admin' ? 'admin123' : '1234'));
    setLoginError(null);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const found = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (!found) {
      setLoginError('ไม่พบชื่อผู้ใช้งานนี้ในระบบ กรุณาตรวจสอบหรือสมัครสมาชิกใหม่');
      return;
    }

    if (found.status === 'pending') {
      setLoginError('⚠️ บัญชีนี้อยู่ระหว่างรอผู้ดูแลระบบ (Admin) อนุมัติการใช้งาน ยังไม่สามารถเข้าสู่ระบบได้');
      return;
    }

    if (found.status === 'rejected') {
      setLoginError(`❌ บัญชีไม่ได้รับการอนุมัติ: ${found.rejectionReason || 'โปรดติดต่อผู้ดูแลระบบ'}`);
      return;
    }

    const validPwd = found.password || (found.role === 'admin' ? 'admin123' : '1234');
    if (password === validPwd || password === '1234' || (found.role === 'admin' && password === 'admin123')) {
      onLogin(found);
    } else {
      setLoginError('รหัสผ่านไม่ถูกต้อง (รหัสผ่านทดสอบ: 1234)');
    }
  };

  const handlePortalRegisterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    if (!regUsername.trim() || !regName.trim()) {
      setLoginError('กรุณากรอกชื่อผู้ใช้งานและชื่อ-นามสกุลให้ครบถ้วน');
      return;
    }

    const trimmedUsername = regUsername.trim().toLowerCase();
    if (users.some((u) => u.username.trim().toLowerCase() === trimmedUsername)) {
      setLoginError(`ชื่อผู้ใช้งาน "${regUsername.trim()}" มีอยู่ในระบบแล้ว ไม่สามารถใช้ชื่อผู้ใช้งานซ้ำได้ กรุณาเลือกชื่ออื่น`);
      return;
    }

    const trimmedEmail = (regEmail.trim() || `${trimmedUsername}@qsmi.or.th`).toLowerCase();
    if (users.some((u) => u.email && u.email.trim().toLowerCase() === trimmedEmail)) {
      setLoginError(`อีเมล "${regEmail.trim() || trimmedEmail}" ถูกใช้งานแล้วในระบบ ไม่สามารถใช้อีเมลซ้ำได้`);
      return;
    }

    if (regPassword && regPassword.length < 8) {
      setLoginError('รหัสผ่านต้องมีความยาวไม่น้อยกว่า 8 ตัวอักษร');
      return;
    }

    const newUser: UserAccount = {
      username: trimmedUsername,
      password: regPassword || '1234',
      name: regName.trim(),
      department: regDept,
      title: regTitle.trim() || 'เจ้าหน้าที่',
      role: regRole,
      email: regEmail.trim() || `${trimmedUsername}@qsmi.or.th`,
      phone: formatThaiPhone(regPhone.trim() || '022520161', '02-252-0161'),
      status: 'pending',
      registeredAt: new Date().toISOString(),
      avatarColor: regRole === 'manager' ? 'bg-blue-600' : 'bg-teal-600'
    };

    if (onRegisterUser) {
      const res = onRegisterUser(newUser);
      if (!res.success) {
        setLoginError(res.message || 'ไม่สามารถลงทะเบียนได้');
        return;
      }
    }

    setRegSuccessMessage(`ลงทะเบียนคำขอสำหรับ "${newUser.name}" เรียบร้อยแล้ว! คำขอถูกส่งไปยังผู้ดูแลระบบเพื่อทำการอนุมัติ`);
    setIsRegisterMode(false);
    setUsername(newUser.username);
    setPassword(newUser.password || '1234');
  };

  const handleAdminCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminUserUsername.trim() || !newAdminUserName.trim()) return;

    const trimmedUsername = newAdminUserUsername.trim().toLowerCase();
    if (users.some((u) => u.username.toLowerCase() === trimmedUsername)) {
      alert(`ชื่อผู้ใช้งาน "${newAdminUserUsername.trim()}" มีอยู่ในระบบแล้ว กรุณาเลือกชื่ออื่น`);
      return;
    }

    const trimmedEmail = (newAdminUserEmail.trim() || `${trimmedUsername}@qsmi.or.th`).toLowerCase();
    if (users.some((u) => u.email && u.email.trim().toLowerCase() === trimmedEmail)) {
      alert(`อีเมล "${newAdminUserEmail.trim() || trimmedEmail}" ถูกใช้งานแล้วในระบบ ไม่สามารถใช้อีเมลซ้ำได้`);
      return;
    }

    const newUser: UserAccount = {
      username: trimmedUsername,
      password: newAdminUserPassword || '1234',
      name: newAdminUserName.trim(),
      department: newAdminUserDept,
      title: newAdminUserTitle.trim() || 'เจ้าหน้าที่',
      role: newAdminUserRole,
      email: newAdminUserEmail.trim() || `${trimmedUsername}@qsmi.or.th`,
      phone: formatThaiPhone(newAdminUserPhone.trim() || '022520161', '02-252-0161'),
      status: 'approved',
      approvedAt: new Date().toISOString(),
      approvedBy: currentUser?.name || 'Admin',
      registeredAt: new Date().toISOString(),
      receiveEmailNotifications:
        newAdminUserRole === 'admin' || newAdminUserRole === 'manager'
          ? newAdminUserReceiveEmail
          : undefined,
      avatarColor:
        newAdminUserRole === 'admin'
          ? 'bg-purple-600'
          : newAdminUserRole === 'manager'
          ? 'bg-blue-600'
          : 'bg-emerald-600'
    };

    if (onRegisterUser) {
      const res = onRegisterUser(newUser);
      if (res && !res.success) {
        alert(res.message || 'ไม่สามารถเพิ่มผู้ใช้งานได้');
        return;
      }
    }
    setIsAddUserModalOpen(false);
    setNewAdminUserName('');
    setNewAdminUserUsername('');
    setNewAdminUserReceiveEmail(true);
  };

  const handleAdminStartEditUser = (u: UserAccount) => {
    setEditingUser(u);
    setEditUserName(u.name);
    setEditUserDept(u.department);
    setEditUserTitle(u.title || '');
    setEditUserRole(u.role);
    setEditUserStatus(u.status || 'approved');
    setEditUserEmail(u.email || '');
    setEditUserPhone(formatThaiPhone(u.phone || '', ''));
    setEditUserPassword(u.password || '1234');
    setEditUserReceiveEmail(u.receiveEmailNotifications !== false);
  };

  const handleToggleAdminEmailNotification = (u: UserAccount) => {
    if (!isAdmin) {
      alert('เฉพาะ Super Admin เท่านั้นที่สามารถกำหนดสิทธิ์การรับอีเมลแจ้งเตือนได้');
      return;
    }
    const currentVal = u.receiveEmailNotifications !== false;
    const newVal = !currentVal;
    const updated: UserAccount = {
      ...u,
      receiveEmailNotifications: newVal
    };
    if (onUpdateUser) {
      onUpdateUser(updated);
    }
  };

  const handleAdminSaveEditedUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    const trimmedEmail = editUserEmail.trim();
    if (trimmedEmail) {
      const emailExists = users.some(
        (u) =>
          u.username.toLowerCase() !== editingUser.username.toLowerCase() &&
          u.email &&
          u.email.trim().toLowerCase() === trimmedEmail.toLowerCase()
      );
      if (emailExists) {
        alert(`อีเมล "${trimmedEmail}" มีผู้ใช้งานอื่นในระบบใช้แล้ว ไม่สามารถใช้อีเมลซ้ำได้`);
        return;
      }
    }

    const updated: UserAccount = {
      ...editingUser,
      name: editUserName.trim() || editingUser.name,
      department: editUserDept.trim() || editingUser.department,
      title: editUserTitle.trim(),
      role: editUserRole,
      status: editUserStatus,
      email: trimmedEmail,
      phone: formatThaiPhone(editUserPhone.trim(), '') || editUserPhone.trim(),
      password: editUserPassword || editingUser.password || '1234',
      receiveEmailNotifications:
        editUserRole === 'admin' || editUserRole === 'manager'
          ? editUserReceiveEmail
          : undefined,
      avatarColor:
        editUserRole === 'admin'
          ? 'bg-purple-600'
          : editUserRole === 'manager'
          ? 'bg-blue-600'
          : 'bg-emerald-600'
    };

    if (onUpdateUser) {
      onUpdateUser(updated);
    }
    setEditingUser(null);
  };

  // Filter Bookings - Sorted latest incoming first
  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        if (statusFilter !== 'all' && b.status !== statusFilter) return false;
        if (deptFilter !== 'all' && b.department !== deptFilter) return false;

        if (bookingStartDate && bookingEndDate) {
          const start = new Date(bookingStartDate);
          start.setHours(0, 0, 0, 0);
          const end = new Date(bookingEndDate);
          end.setHours(23, 59, 59, 999);
          const bStart = new Date(b.startTime);
          const bEnd = new Date(b.endTime);
          if (bEnd < start || bStart > end) return false;
        }

        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const room = rooms.find((r) => r.id === b.roomId);
          return (
            b.topic.toLowerCase().includes(term) ||
            b.requesterName.toLowerCase().includes(term) ||
            b.department.toLowerCase().includes(term) ||
            b.id.toLowerCase().includes(term) ||
            (room && room.name.toLowerCase().includes(term))
          );
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt || a.startTime).getTime();
        const timeB = new Date(b.createdAt || b.startTime).getTime();
        return timeB - timeA;
      });
  }, [bookings, statusFilter, deptFilter, searchTerm, rooms, bookingStartDate, bookingEndDate]);

  const displayedBookings = useMemo(() => {
    return filteredBookings.slice(0, bookingsDisplayLimit);
  }, [filteredBookings, bookingsDisplayLimit]);

  // Filter Users - Sorted latest first
  const filteredUsers = useMemo(() => {
    return users
      .filter((u) => {
        if (userRoleFilter === 'pending') {
          if (u.status !== 'pending') return false;
        } else if (userRoleFilter !== 'all') {
          if (u.role !== userRoleFilter) return false;
        }

        if (userSearchTerm.trim()) {
          const term = userSearchTerm.toLowerCase();
          return (
            (u.name || '').toLowerCase().includes(term) ||
            (u.username || '').toLowerCase().includes(term) ||
            (u.department || '').toLowerCase().includes(term) ||
            Boolean(u.title && u.title.toLowerCase().includes(term)) ||
            Boolean(u.email && u.email.toLowerCase().includes(term))
          );
        }
        return true;
      })
      .sort((a, b) => {
        if (a.status === 'pending' && b.status !== 'pending') return -1;
        if (b.status === 'pending' && a.status !== 'pending') return 1;
        const timeA = a.registeredAt ? new Date(a.registeredAt).getTime() : 0;
        const timeB = b.registeredAt ? new Date(b.registeredAt).getTime() : 0;
        return timeB - timeA;
      });
  }, [users, userRoleFilter, userSearchTerm]);

  const displayedUsers = useMemo(() => {
    return filteredUsers.slice(0, usersDisplayLimit);
  }, [filteredUsers, usersDisplayLimit]);

  // Unique departments for filter
  const departmentsList = useMemo(() => {
    const set = new Set<string>();
    bookings.forEach((b) => {
      if (b.department) set.add(b.department);
    });
    return Array.from(set);
  }, [bookings]);

  // ==========================================
  // VIEW A: NOT LOGGED IN -> LOGIN / REGISTER
  // ==========================================
  if (!currentUser) {
    return (
      <div className="w-full max-w-5xl mx-auto py-8 px-4 sm:px-6 animate-fade-in">
        {/* Back to Calendar Navigation */}
        <div className="mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={onBackToBooking}
            className="flex items-center gap-2 text-xs sm:text-sm font-bold text-gray-600 hover:text-[#C8102E] bg-white px-4 py-2 rounded-xl border border-gray-200 shadow-2xs transition"
          >
            <ArrowLeft size={16} />
            <span>กลับสู่หน้าหลักการจองห้องประชุม</span>
          </button>
          <span className="text-xs text-gray-400 font-medium hidden sm:inline">
            ระบบจัดการข้อมูลผู้ดูแลระบบและฝ่าย (Management Portal)
          </span>
        </div>

        {regSuccessMessage && (
          <div className="mb-4 p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-900 text-xs font-semibold flex items-center gap-2.5 animate-fade-in shadow-2xs">
            <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
            <span>{regSuccessMessage}</span>
          </div>
        )}

        <div className="bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          {/* Left Column: Test Accounts Selector */}
          <div className="lg:col-span-7 bg-gray-50/70 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-gray-200 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center text-[#C8102E]">
                  <ShieldCheck size={24} />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    เข้าสู่ระบบการจัดการ (Management Portal)
                  </h2>
                  <p className="text-xs text-gray-500">
                    ระบบจัดการห้องประชุม สถานเสาวภา สภากาชาดไทย
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 mb-4 leading-relaxed">
                <strong>คำแนะนำความปลอดภัย:</strong> หน้านี้สำหรับผู้ดูแลระบบสูงสุด (Super Admin) และผู้ดูแลระบบฝ่าย (Admin) ในการอนุมัติคำขอ จัดการห้องประชุม และจัดการสมาชิก
              </div>

              {/* Role filter */}
              <div className="grid grid-cols-4 gap-1 p-1 bg-gray-200/70 rounded-xl text-xs font-bold mb-3">
                <button
                  type="button"
                  onClick={() => setRoleTab('all')}
                  className={`py-1.5 rounded-lg transition ${
                    roleTab === 'all' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  ทั้งหมด
                </button>
                <button
                  type="button"
                  onClick={() => setRoleTab('admin')}
                  className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
                    roleTab === 'admin' ? 'bg-purple-600 text-white shadow-2xs' : 'text-purple-700 hover:bg-purple-50'
                  }`}
                >
                  <ShieldCheck size={12} /> Super Admin
                </button>
                <button
                  type="button"
                  onClick={() => setRoleTab('manager')}
                  className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
                    roleTab === 'manager' ? 'bg-blue-600 text-white shadow-2xs' : 'text-blue-700 hover:bg-blue-50'
                  }`}
                >
                  <ShieldCheck size={12} /> Admin
                </button>
                <button
                  type="button"
                  onClick={() => setRoleTab('employee')}
                  className={`py-1.5 rounded-lg transition flex items-center justify-center gap-1 ${
                    roleTab === 'employee' ? 'bg-emerald-600 text-white shadow-2xs' : 'text-emerald-700 hover:bg-emerald-50'
                  }`}
                >
                  <UserCheck size={12} /> User
                </button>
              </div>

              {/* User List */}
              <div className="space-y-1.5 max-h-56 overflow-y-auto custom-scrollbar pr-1">
                {users
                  .filter((u) => (roleTab === 'all' ? true : u.role === roleTab))
                  .map((u) => {
                    const isSelected = selectedUser?.username === u.username;
                    const isPending = u.status === 'pending';
                    return (
                      <div
                        key={u.username}
                        onClick={() => handleSelectQuickUser(u)}
                        className={`p-2.5 rounded-2xl border transition cursor-pointer flex items-center justify-between gap-3 text-xs ${
                          isSelected
                            ? 'bg-red-50 border-[#C8102E]/60 text-gray-900 shadow-2xs'
                            : 'bg-white border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div
                            className={`w-7 h-7 rounded-xl flex items-center justify-center text-white text-xs font-bold shrink-0 ${
                              u.avatarColor || 'bg-gray-500'
                            }`}
                          >
                            {(u.name || u.username || 'U').charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-gray-900 truncate">{u.name || u.username || 'ผู้ใช้งาน'}</div>
                            <div className="text-[11px] text-gray-500 truncate">{u.department}</div>
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          {isPending ? (
                            <span className="text-[9px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                              รออนุมัติ
                            </span>
                          ) : (
                            <span
                              className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded ${
                                u.role === 'admin'
                                  ? 'bg-purple-100 text-purple-800'
                                  : u.role === 'manager'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {u.role.toUpperCase()}
                            </span>
                          )}
                          <div className="text-[10px] text-gray-400 font-mono mt-0.5">{u.username}</div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200/80 text-[11px] text-gray-400">
              สถานเสาวภา สภากาชาดไทย • ระบบจองห้องประชุมและบริหารจัดการส่วนกลาง
            </div>
          </div>

          {/* Right Column: Form (Sign In / Register) */}
          <div className="lg:col-span-5 p-6 sm:p-8 flex flex-col justify-center bg-white">
            <div className="max-w-md mx-auto w-full">
              {/* Toggle Form Mode */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-red-50 text-[#C8102E] rounded-xl">
                    {isRegisterMode ? <UserPlus size={20} /> : <Lock size={20} />}
                  </div>
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-gray-900">
                      {isRegisterMode ? 'สมัครขอสิทธิ์ใช้งาน' : 'เข้าสู่ระบบ (Sign In)'}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {isRegisterMode ? 'กรอกข้อมูลเพื่อส่งให้ Admin อนุมัติ' : 'กรอกชื่อผู้ใช้และรหัสผ่าน'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(!isRegisterMode);
                    setLoginError(null);
                  }}
                  className="text-xs font-bold text-[#C8102E] hover:underline"
                >
                  {isRegisterMode ? '← เข้าสู่ระบบ' : '+ สมัครสมาชิก'}
                </button>
              </div>

              {loginError && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                  <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-500" />
                  <span>{loginError}</span>
                </div>
              )}

              {/* MODE 1: SIGN IN */}
              {!isRegisterMode ? (
                <form onSubmit={handleFormSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      ชื่อผู้ใช้ (Username):
                    </label>
                    <input
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="เช่น admin หรือคลิกเลือกด้านซ้าย"
                      className="w-full p-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      รหัสผ่าน (Password):
                    </label>
                    <input
                      type="password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="กรอกรหัสผ่าน..."
                      className="w-full p-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E]"
                    />
                  </div>

                  <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-xl text-[11px] text-gray-500 space-y-0.5">
                    <div>ระบบจะบันทึกสถานะการเข้าสู่ระบบไว้จนกว่าจะกดออกจากระบบ</div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-[#C8102E] hover:bg-[#a60d26] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition flex items-center justify-center gap-2"
                  >
                    <Lock size={16} />
                    <span>เข้าสู่ระบบจัดการข้อมูล</span>
                  </button>

                  <div className="text-center pt-2">
                    <button
                      type="button"
                      onClick={onBackToBooking}
                      className="text-xs text-gray-500 hover:text-gray-800 font-semibold"
                    >
                      ไม่ต้องเข้าสู่ระบบ • ไปหน้าจองห้องประชุมทันที
                    </button>
                  </div>
                </form>
              ) : (
                /* MODE 2: REGISTER */
                <form onSubmit={handlePortalRegisterSubmit} className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      ชื่อเข้าใช้งาน (Username) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น kitti.s"
                      value={regUsername}
                      onChange={(e) => setRegUsername(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E]"
                    />
                    {regUsername.trim().length > 0 && (
                      (() => {
                        const isDup = users.some(
                          (u) => u.username.trim().toLowerCase() === regUsername.trim().toLowerCase()
                        );
                        return (
                          <p className={`text-[11px] mt-1 font-medium ${isDup ? 'text-red-500' : 'text-emerald-600'}`}>
                            {isDup ? '⚠️ ชื่อผู้ใช้งานนี้มีอยู่ในระบบแล้ว กรุณาเลือกชื่ออื่น' : '✓ สามารถใช้ชื่อผู้ใช้งานนี้ได้'}
                          </p>
                        );
                      })()
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      ชื่อ - นามสกุล <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="เช่น นายกิตติศักดิ์ ศรีวิชัย"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E]"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        สิทธิ์ที่ขอ <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={regRole}
                        onChange={(e) => setRegRole(e.target.value as 'employee')}
                        className="w-full p-2 border border-gray-300 bg-gray-50 rounded-xl text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E]"
                      >
                        <option value="employee">ผู้ใช้งานทั่วไป (User)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        รหัสผ่าน <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="password"
                        required
                        minLength={8}
                        placeholder="อย่างน้อย 8 ตัวอักษร"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      ฝ่าย / หน่วยงาน <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={regDept}
                      onChange={(e) => setRegDept(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E]"
                    >
                      {availableDeptNames.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        อีเมล
                      </label>
                      <input
                        type="email"
                        placeholder="email@qsmi.or.th"
                        value={regEmail}
                        onChange={(e) => setRegEmail(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">
                        โทรศัพท์
                      </label>
                      <input
                        type="tel"
                        placeholder="0812345678"
                        value={regPhone}
                        onChange={(e) => setRegPhone(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E]"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#C8102E] hover:bg-[#a60d26] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition flex items-center justify-center gap-2 mt-2"
                  >
                    <UserPlus size={16} />
                    <span>ส่งคำขอสมัครสมาชิกให้ Admin อนุมัติ</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // VIEW B: LOGGED IN -> DEDICATED MANAGEMENT WORKSPACE
  // ==========================================
  return (
    <div className="w-full max-w-[1850px] mx-auto py-4 px-3 sm:px-6 lg:px-8 space-y-4">
      {/* Top Banner & Identity Bar */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3 sm:p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0 ${
              currentUser?.avatarColor || 'bg-red-600'
            }`}
          >
            {(currentUser?.name || currentUser?.username || 'A').charAt(0)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base sm:text-lg font-bold text-gray-900 truncate">
                {currentUser?.name || currentUser?.username || 'ผู้ดูแลระบบสูงสุด (Super Admin)'}
              </h2>
              <span
                className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                  currentUser?.role === 'admin'
                    ? 'bg-purple-100 text-purple-800'
                    : currentUser?.role === 'manager'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {currentUser?.role === 'admin'
                  ? 'ผู้ดูแลระบบสูงสุด (Super Admin)'
                  : currentUser?.role === 'manager'
                  ? 'ผู้ดูแลระบบ (Admin)'
                  : 'ผู้ใช้งานทั่วไป (User)'}
              </span>
            </div>
            <div className="text-xs text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
              <span>{currentUser?.department}</span>
              {currentUser?.title &&
                currentUser.title !== 'ผู้ดูแลระบบสูงสุด (Super Admin)' &&
                currentUser.title !== 'ผู้ดูแลระบบ (Admin)' &&
                currentUser.title !== 'ผู้ใช้งานทั่วไป (User)' &&
                !currentUser.title.toLowerCase().includes('admin') && (
                  <span>• {currentUser.title}</span>
                )}
              <span className="font-mono text-gray-400">({currentUser?.username})</span>
            </div>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 w-full md:w-auto justify-stretch sm:justify-end shrink-0">
          <button
            type="button"
            onClick={onBackToBooking}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-[#C8102E] hover:bg-[#a60d26] text-white text-xs sm:text-sm font-bold shadow-xs transition whitespace-nowrap"
          >
            <CalendarCheck size={16} />
            <span>กลับสู่หน้าหลักการจองห้อง</span>
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold transition whitespace-nowrap"
          >
            <LogOut size={15} />
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar bg-white p-1.5 rounded-2xl border border-gray-200 shadow-2xs">
        {/* Tab 1: My Profile (จัดการข้อมูลส่วนตัว) - Available to all */}
        <button
          type="button"
          onClick={() => setActiveTab('my_profile')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
            activeTab === 'my_profile'
              ? 'bg-[#1a1a1a] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <User size={16} className={activeTab === 'my_profile' ? 'text-red-400' : 'text-gray-500'} />
          <span>จัดการข้อมูลส่วนตัว</span>
        </button>

        {/* Tab 2: My History (รายการจองของฉัน) - Available to all */}
        <button
          type="button"
          onClick={() => setActiveTab('my_history')}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
            activeTab === 'my_history'
              ? 'bg-[#1a1a1a] text-white shadow-xs'
              : 'text-gray-600 hover:bg-gray-100'
          }`}
        >
          <CalendarCheck size={16} className={activeTab === 'my_history' ? 'text-emerald-400' : 'text-gray-500'} />
          <span>รายการจองของฉัน</span>
          {myBookingsCount > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] font-extrabold bg-[#C8102E] text-white rounded-full">
              {myBookingsCount}
            </span>
          )}
        </button>

        {/* Tab 3: Approvals (อนุมัติการจองห้อง) - Admin & Manager */}
        {(isAdmin || isManager) && (
          <button
            type="button"
            onClick={() => setActiveTab('approvals')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === 'approvals'
                ? 'bg-[#1a1a1a] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <CheckCircle2 size={16} className={activeTab === 'approvals' ? 'text-amber-400' : 'text-gray-500'} />
            <span>อนุมัติการจองห้อง</span>
            {pendingApprovals.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-extrabold bg-amber-500 text-white rounded-full animate-pulse">
                {pendingApprovals.length}
              </span>
            )}
          </button>
        )}

        {/* Tab 4: Bookings Management (จัดการรายการจองห้องประชุม) - Admin & Manager */}
        {(isAdmin || isManager) && (
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === 'bookings'
                ? 'bg-[#1a1a1a] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Clock size={16} className={activeTab === 'bookings' ? 'text-blue-400' : 'text-gray-500'} />
            <span>จัดการรายการจองห้องประชุม</span>
          </button>
        )}

        {/* Tab 5: User Management (เพิ่ม/แก้ไข จัดการผู้ใช้งาน) - Admin Only */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === 'users'
                ? 'bg-[#1a1a1a] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <UserCheck size={16} className={activeTab === 'users' ? 'text-amber-400' : 'text-gray-500'} />
            <span>เพิ่ม/แก้ไข จัดการผู้ใช้งาน</span>
            {pendingUsers.length > 0 && (
              <span className="px-1.5 py-0.2 text-[10px] font-extrabold bg-amber-500 text-white rounded-full animate-pulse">
                {pendingUsers.length}
              </span>
            )}
          </button>
        )}

        {/* Tab 6: Department Data Management (การจัดการข้อมูลฝ่าย) - Admin Only */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('departments')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === 'departments' || activeTab === 'directory'
                ? 'bg-[#1a1a1a] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Building2 size={16} className={activeTab === 'departments' || activeTab === 'directory' ? 'text-red-400' : 'text-gray-500'} />
            <span>การจัดการข้อมูลฝ่าย</span>
          </button>
        )}

        {/* Tab 7: Rooms & Maintenance (จัดการห้องประชุม & ปิดกั้น) - Admin Only */}
        {isAdmin && (
          <button
            type="button"
            onClick={() => setActiveTab('rooms')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === 'rooms'
                ? 'bg-[#1a1a1a] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Building size={16} className={activeTab === 'rooms' ? 'text-purple-400' : 'text-gray-500'} />
            <span>จัดการห้องประชุม & ปิดกั้น</span>
          </button>
        )}

        {/* Tab 8: Analytics Reports (หน้าสถิติและรายงาน) - Admin & Manager */}
        {(isAdmin || isManager) && (
          <button
            type="button"
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
              activeTab === 'reports'
                ? 'bg-[#1a1a1a] text-white shadow-xs'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <BarChart3 size={16} className={activeTab === 'reports' ? 'text-red-400' : 'text-gray-500'} />
            <span>หน้าสถิติและรายงาน</span>
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-200 p-4 sm:p-6 min-h-[500px]">
        {/* ==================================================== */}
        {/* TAB 1: APPROVALS (BOOKINGS) */}
        {/* ==================================================== */}
        {activeTab === 'approvals' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                  <CheckCircle2 className="text-amber-500" size={20} />
                  <span>คำขอจองห้องประชุมที่รอการพิจารณาอนุมัติ</span>
                </h3>
                <p className="text-xs text-gray-500">
                  {isAdmin
                    ? 'สิทธิ์ Super Admin: สามารถพิจารณาอนุมัติคำขอจองห้องประชุมของ User ทุกคนได้'
                    : 'สิทธิ์ Admin: สามารถตรวจรับรองและอนุมัติคำขอจองห้องประชุมของ User ทุกคนได้'}
                </p>
              </div>
              <span className="text-xs font-bold text-amber-700 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                รออนุมัติ {pendingApprovals.length} รายการ
              </span>
            </div>

            {pendingApprovals.length === 0 ? (
              <div className="text-center py-12 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <CheckCircle2 size={40} className="mx-auto text-emerald-500 mb-2 opacity-80" />
                <p className="text-sm font-bold text-gray-700">ไม่มีคำขอค้างอนุมัติในขณะนี้</p>
                <p className="text-xs text-gray-400 mt-1">คำขอทั้งหมดได้รับการพิจารณาเรียบร้อยแล้ว</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                  {displayedApprovals.map((b) => {
                    const room = rooms.find((r) => r.id === b.roomId);
                    const bStart = new Date(b.startTime);
                    const bEnd = new Date(b.endTime);

                    return (
                      <div
                        key={b.id}
                        className="p-4 rounded-2xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50/70 transition flex flex-col justify-between gap-3 shadow-2xs"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                              รออนุมัติ
                            </span>
                            <span className="text-xs font-bold text-blue-700">
                              {room?.name}
                            </span>
                          </div>

                          <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{b.topic}</h4>

                          <div className="text-xs text-gray-600 space-y-0.5">
                            <div>
                              <strong>วัน/เวลา:</strong> {formatThaiDate(bStart, { day: 'numeric', month: 'short', year: 'numeric' })}{' '}
                              ({formatThaiTime(bStart, { hour: '2-digit', minute: '2-digit' })} - {formatThaiTime(bEnd, { hour: '2-digit', minute: '2-digit' })} น.)
                            </div>
                            <div>
                              <strong>ผู้ขอจอง:</strong> {b.requesterName}
                              {isBookingRequesterDeleted(b, users) && (
                                <span className="ml-1.5 inline-block px-1.5 py-0.2 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-300">
                                  อดีตผู้ใช้งาน
                                </span>
                              )}
                            </div>
                            <div><strong>ฝ่าย:</strong> {b.department}</div>
                            {b.phone && <div><strong>โทร:</strong> {formatThaiPhone(b.phone)}</div>}
                          </div>
                        </div>

                        <div className="pt-2 border-t border-amber-200/60 flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onViewBooking(b)}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-white rounded-xl text-xs font-semibold"
                            title="ดูรายละเอียดการจอง"
                          >
                            <Eye size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onApprove(b.id)}
                            className="flex-1 py-1.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs"
                          >
                            <Check size={14} /> อนุมัติ
                          </button>
                          <button
                            type="button"
                            onClick={() => onReject(b.id)}
                            className="flex-1 py-1.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs"
                          >
                            <X size={14} /> ไม่อนุมัติ
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Approvals Pagination / Show More */}
                {pendingApprovals.length > 10 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      แสดง <strong className="text-gray-800">{displayedApprovals.length}</strong> จากทั้งหมด <strong className="text-gray-800">{pendingApprovals.length}</strong> รายการที่เข้ามาล่าสุด
                    </div>
                    <div className="flex items-center gap-2">
                      {approvalsDisplayLimit < pendingApprovals.length ? (
                        <>
                          <button
                            type="button"
                            onClick={() => setApprovalsDisplayLimit((prev) => Math.min(prev + 10, pendingApprovals.length))}
                            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition shadow-2xs"
                          >
                            <ChevronDown size={14} />
                            <span>ดูเพิ่มเติม (+10 รายการ)</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setApprovalsDisplayLimit(pendingApprovals.length)}
                            className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold transition"
                          >
                            แสดงทั้งหมด ({pendingApprovals.length})
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setApprovalsDisplayLimit(10)}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition"
                        >
                          <ChevronUp size={14} />
                          <span>ย่อกลับเหลือ 10 รายการล่าสุด</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 2: USER REGISTRATION & APPROVAL (Admin Only) */}
        {/* ==================================================== */}
        {activeTab === 'users' && isAdmin && (
          <div className="space-y-6">
            {/* Sub-header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                  <UserCheck className="text-purple-600" size={20} />
                  <span>ระบบอนุมัติคำขอสมัครสมาชิกและจัดการสิทธิ์ผู้ใช้งาน</span>
                </h3>
                <p className="text-xs text-gray-500">
                  พิจารณาอนุมัติผู้ใช้งานใหม่ กำหนดสิทธิ์บทบาท (Super Admin / Admin / User) และจัดการบัญชี
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C8102E] hover:bg-[#a60d26] text-white text-xs font-bold shadow-xs transition"
              >
                <Plus size={15} />
                <span>+ เพิ่มผู้ใช้งานโดย Super Admin</span>
              </button>
            </div>

            {/* SECTION 1: PENDING REGISTRATIONS */}
            <div className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 min-w-0">
                  <Clock className="text-amber-500 shrink-0" size={16} />
                  <span>คำขอสมัครสมาชิกรอการอนุมัติ (Pending Registrations)</span>
                </h4>
                <span className="shrink-0 text-xs font-extrabold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300 whitespace-nowrap">
                  {pendingUsers.length} รายการ
                </span>
              </div>

              {pendingUsers.length === 0 ? (
                <div className="p-6 bg-gray-50/70 border border-dashed border-gray-200 rounded-2xl text-center">
                  <CheckCircle2 size={32} className="mx-auto text-emerald-500 mb-1 opacity-80" />
                  <p className="text-xs font-bold text-gray-700">ไม่มีคำขอสมัครสมาชิกรอการอนุมัติ</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">ผู้สมัครทุกคนได้รับการพิจารณาเรียบร้อยแล้ว</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {displayedPendingUsers.map((applicant) => (
                      <div
                        key={applicant.username}
                        className="p-4 rounded-2xl border-2 border-amber-300 bg-amber-50/40 hover:bg-amber-50 transition flex flex-col justify-between gap-3 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div
                              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-base shrink-0 ${
                                applicant.avatarColor || 'bg-teal-600'
                              }`}
                            >
                              {(applicant.name || applicant.username || 'U').charAt(0)}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <h5 className="text-sm font-bold text-gray-900">{applicant.name || applicant.username || 'ผู้ใช้งาน'}</h5>
                                <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200">
                                  {applicant.role === 'manager' ? 'ขอสิทธิ์: ผู้ดูแลระบบ (Admin)' : 'ขอสิทธิ์: ผู้ใช้งานทั่วไป (User)'}
                                </span>
                              </div>
                              <div className="text-xs text-gray-600 font-medium mt-0.5">
                                {applicant.department} {applicant.title && `• ${applicant.title}`}
                              </div>
                              <div className="text-[11px] text-gray-500 font-mono mt-0.5">
                                ชื่อผู้ใช้: <strong>{applicant.username}</strong>
                              </div>

                              <div className="flex flex-wrap items-center gap-3 text-[11px] text-gray-500 mt-2">
                                {applicant.email && (
                                  <span className="flex items-center gap-1">
                                    <Mail size={12} className="text-gray-400" /> {applicant.email}
                                  </span>
                                )}
                                {applicant.phone && (
                                  <span className="flex items-center gap-1">
                                    <Phone size={12} className="text-gray-400" /> {formatThaiPhone(applicant.phone)}
                                  </span>
                                )}
                                {applicant.registeredAt && (
                                  <span className="flex items-center gap-1 text-gray-400">
                                    <Clock size={12} /> สมัครเมื่อ {formatThaiDate(new Date(applicant.registeredAt))}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-3 border-t border-amber-200">
                          <button
                            type="button"
                            onClick={() => {
                              if (onApproveUser) {
                                onApproveUser(applicant.username);
                              }
                            }}
                            className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                          >
                            <Check size={15} />
                            <span>อนุมัติเข้าใช้งาน</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setRejectingUser(applicant);
                              setUserRejectReason('ข้อมูลไม่ตรงกับทะเบียนบุคลากร');
                            }}
                            className="py-2 px-3 bg-white hover:bg-red-50 text-red-600 border border-red-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                          >
                            <X size={15} />
                            <span>ปฏิเสธคำขอ</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Pending Users Pagination */}
                  {pendingUsers.length > 10 && (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
                      <div className="text-xs text-gray-500">
                        แสดง <strong className="text-gray-800">{displayedPendingUsers.length}</strong> จากทั้งหมด <strong className="text-gray-800">{pendingUsers.length}</strong> คำขอล่าสุด
                      </div>
                      <div className="flex items-center gap-2">
                        {pendingUsersDisplayLimit < pendingUsers.length ? (
                          <>
                            <button
                              type="button"
                              onClick={() => setPendingUsersDisplayLimit((prev) => Math.min(prev + 10, pendingUsers.length))}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 rounded-xl text-xs font-bold transition shadow-2xs"
                            >
                              <ChevronDown size={14} />
                              <span>ดูเพิ่มเติม (+10 รายการ)</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setPendingUsersDisplayLimit(pendingUsers.length)}
                              className="px-3 py-1.5 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold transition"
                            >
                              แสดงทั้งหมด ({pendingUsers.length})
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setPendingUsersDisplayLimit(10)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition"
                          >
                            <ChevronUp size={14} />
                            <span>ย่อกลับเหลือ 10 รายการล่าสุด</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>

            {/* SECTION 2: ALL REGISTERED USERS */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                  <Users className="text-blue-600" size={16} />
                  <span>รายชื่อผู้ใช้งานทั้งหมดในระบบ ({users.length} บัญชี)</span>
                </h4>

                {/* Filter and Search */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                  <div className="relative flex-1 sm:w-64">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="text"
                      placeholder="ค้นหาชื่อ, username, ฝ่าย..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      className="w-full pl-8 pr-3 py-2 sm:py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
                    />
                  </div>

                  <select
                    value={userRoleFilter}
                    onChange={(e) => setUserRoleFilter(e.target.value as any)}
                    className="p-2 sm:p-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none"
                  >
                    <option value="all">บทบาททั้งหมด</option>
                    <option value="pending">รอการอนุมัติ (Pending)</option>
                    <option value="admin">ผู้ดูแลระบบสูงสุด (Super Admin)</option>
                    <option value="manager">ผู้ดูแลระบบ (Admin)</option>
                    <option value="employee">ผู้ใช้งานทั่วไป (User)</option>
                  </select>
                </div>
              </div>

              {/* Mobile View: User Cards (Easy to read on phones) */}
              <div className="block md:hidden space-y-3">
                {filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 font-semibold bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                    ไม่พบข้อมูลผู้ใช้งานที่ตรงกับเงื่อนไข
                  </div>
                ) : (
                  displayedUsers.map((u) => {
                    const isPending = u.status === 'pending';
                    const isRejected = u.status === 'rejected';

                    return (
                      <div
                        key={u.username}
                        className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs hover:shadow-xs transition space-y-3"
                      >
                        {/* Header: Avatar, Name, and Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-2xs ${
                                u.avatarColor || 'bg-gray-500'
                              }`}
                            >
                              {(u.name || u.username || 'U').charAt(0)}
                            </div>
                            <div className="min-w-0">
                              <h5 className="font-bold text-sm text-gray-900 leading-tight truncate">{u.name || u.username || 'ผู้ใช้งาน'}</h5>
                              <p className="text-xs text-gray-500 truncate mt-0.5">{u.title || '-'}</p>
                            </div>
                          </div>

                          <div className="shrink-0">
                            {isPending ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                <Clock size={11} /> รออนุมัติ
                              </span>
                            ) : isRejected ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-red-100 text-red-800 border border-red-200">
                                <XCircle size={11} /> ปฏิเสธ
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                <CheckCircle2 size={11} /> อนุมัติแล้ว
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Details List */}
                        <div className="bg-gray-50/80 rounded-xl p-3 space-y-1.5 text-xs">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-gray-500 font-medium">ชื่อผู้ใช้ (Username):</span>
                            <span className="font-mono font-bold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                              {u.username}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-gray-500 font-medium">ฝ่าย / หน่วยงาน:</span>
                            <span className="font-semibold text-gray-800 text-right truncate max-w-[200px]">{u.department}</span>
                          </div>
                          {u.phone && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-gray-500 font-medium">เบอร์โทร:</span>
                              <span className="text-gray-700">{formatThaiPhone(u.phone)}</span>
                            </div>
                          )}
                          {u.email && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-gray-500 font-medium">อีเมล:</span>
                              <span className="text-gray-700 truncate max-w-[180px]">{u.email}</span>
                            </div>
                          )}
                        </div>

                        {/* Role Selector */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <label className="text-xs font-bold text-gray-700 shrink-0">ระดับสิทธิ์:</label>
                          <select
                            value={u.role}
                            onChange={(e) => {
                              if (onUpdateUserRole) {
                                onUpdateUserRole(u.username, e.target.value as UserRole);
                              }
                            }}
                            className={`text-xs font-bold px-3 py-1.5 rounded-xl border outline-none cursor-pointer flex-1 max-w-[200px] ${
                              u.role === 'admin'
                                ? 'bg-purple-50 text-purple-800 border-purple-200'
                                : u.role === 'manager'
                                ? 'bg-blue-50 text-blue-800 border-blue-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            }`}
                          >
                            <option value="employee">ผู้ใช้งานทั่วไป (User)</option>
                            <option value="manager">ผู้ดูแลระบบ (Admin)</option>
                            <option value="admin">ผู้ดูแลระบบสูงสุด (Super Admin)</option>
                          </select>
                        </div>

                        {/* Email Notification Toggle for Admins */}
                        {(u.role === 'admin' || u.role === 'manager') && (
                          <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                            <div className="flex items-center gap-1.5 text-xs text-gray-600 font-medium">
                              <Mail size={13} className="text-blue-600" />
                              <span>อีเมลแจ้งเตือน:</span>
                            </div>
                            {isAdmin ? (
                              <button
                                type="button"
                                onClick={() => handleToggleAdminEmailNotification(u)}
                                title="คลิกเพื่อสลับการรับหรือไม่รับอีเมลแจ้งเตือน (Super Admin กำหนด)"
                                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer ${
                                  u.receiveEmailNotifications !== false
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                                    : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200'
                                }`}
                              >
                                {u.receiveEmailNotifications !== false ? (
                                  <>
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                                    <Mail size={12} className="text-blue-600" />
                                    <span>รับอีเมล</span>
                                  </>
                                ) : (
                                  <>
                                    <MailX size={12} className="text-gray-400" />
                                    <span>ไม่รับ</span>
                                  </>
                                )}
                              </button>
                            ) : (
                              <span
                                className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full ${
                                  u.receiveEmailNotifications !== false
                                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                    : 'bg-gray-100 text-gray-500 border border-gray-200'
                                }`}
                              >
                                {u.receiveEmailNotifications !== false ? 'รับอีเมล' : 'ไม่รับ'}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
                          {isPending && (
                            <button
                              type="button"
                              onClick={() => onApproveUser && onApproveUser(u.username)}
                              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                            >
                              <Check size={14} />
                              <span>อนุมัติ</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleAdminStartEditUser(u)}
                            className="flex-1 py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
                          >
                            <Edit size={14} />
                            <span>แก้ไขข้อมูล</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => onDeleteUser && onDeleteUser(u.username)}
                            className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                            title="ลบบัญชี"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Desktop Table View (Hidden on mobile) */}
              <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-2xl shadow-2xs">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-3">ชื่อ - นามสกุล / ตำแหน่ง</th>
                      <th className="p-3">ชื่อเข้าระบบ (Username)</th>
                      <th className="p-3">ฝ่าย / หน่วยงาน</th>
                      <th className="p-3">ระดับสิทธิ์ (Role)</th>
                      <th className="p-3 text-center">แจ้งเตือนอีเมล</th>
                      <th className="p-3">สถานะ</th>
                      <th className="p-3 text-right">การจัดการ</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-400 font-semibold">
                          ไม่พบข้อมูลผู้ใช้งานที่ตรงกับเงื่อนไข
                        </td>
                      </tr>
                    ) : (
                      displayedUsers.map((u) => {
                        const isPending = u.status === 'pending';
                        const isRejected = u.status === 'rejected';

                        return (
                          <tr key={u.username} className="hover:bg-gray-50/70 transition">
                            <td className="p-3">
                              <div className="flex items-center gap-2.5">
                                <div
                                  className={`w-7 h-7 rounded-xl flex items-center justify-center text-white font-bold text-xs shrink-0 ${
                                    u.avatarColor || 'bg-gray-500'
                                  }`}
                                >
                                  {(u.name || u.username || 'U').charAt(0)}
                                </div>
                                <div>
                                  <div className="font-bold text-gray-900">{u.name || u.username || 'ผู้ใช้งาน'}</div>
                                  <div className="text-[11px] text-gray-500">{u.title || '-'}</div>
                                </div>
                              </div>
                            </td>

                            <td className="p-3 font-mono text-gray-600 font-bold">
                              {u.username}
                            </td>

                            <td className="p-3 text-gray-700 font-medium">
                              {u.department}
                            </td>

                            <td className="p-3">
                              <select
                                value={u.role}
                                onChange={(e) => {
                                  if (onUpdateUserRole) {
                                    onUpdateUserRole(u.username, e.target.value as UserRole);
                                  }
                                }}
                                className={`text-[11px] font-bold px-2 py-1 rounded-lg border outline-none cursor-pointer ${
                                  u.role === 'admin'
                                    ? 'bg-purple-50 text-purple-800 border-purple-200'
                                    : u.role === 'manager'
                                    ? 'bg-blue-50 text-blue-800 border-blue-200'
                                    : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                }`}
                              >
                                <option value="employee">ผู้ใช้งานทั่วไป (User)</option>
                                <option value="manager">ผู้ดูแลระบบ (Admin)</option>
                                <option value="admin">ผู้ดูแลระบบสูงสุด (Super Admin)</option>
                              </select>
                            </td>

                            <td className="p-3 text-center">
                              {u.role === 'admin' || u.role === 'manager' ? (
                                isAdmin ? (
                                  <button
                                    type="button"
                                    onClick={() => handleToggleAdminEmailNotification(u)}
                                    title={
                                      u.receiveEmailNotifications !== false
                                        ? `คลิกเพื่อปิดรับอีเมลแจ้งเตือนสำหรับ ${u.name} (ปัจจุบัน: เปิดรับ)`
                                        : `คลิกเพื่อเปิดรับอีเมลแจ้งเตือนสำหรับ ${u.name} (ปัจจุบัน: ปิดรับ)`
                                    }
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition shadow-2xs cursor-pointer ${
                                      u.receiveEmailNotifications !== false
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 hover:border-blue-300'
                                        : 'bg-gray-100 text-gray-500 border border-gray-200 hover:bg-gray-200 hover:text-gray-700'
                                    }`}
                                  >
                                    {u.receiveEmailNotifications !== false ? (
                                      <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-pulse"></span>
                                        <Mail size={12} className="text-blue-600" />
                                        <span>รับอีเมล</span>
                                      </>
                                    ) : (
                                      <>
                                        <MailX size={12} className="text-gray-400" />
                                        <span>ไม่รับ</span>
                                      </>
                                    )}
                                  </button>
                                ) : (
                                  <span
                                    title="Super Admin เป็นผู้กำหนดสิทธิ์นี้"
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                                      u.receiveEmailNotifications !== false
                                        ? 'bg-blue-50 text-blue-700 border border-blue-200'
                                        : 'bg-gray-100 text-gray-500 border border-gray-200'
                                    }`}
                                  >
                                    {u.receiveEmailNotifications !== false ? (
                                      <>
                                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                                        <Mail size={12} className="text-blue-600" />
                                        <span>รับอีเมล</span>
                                      </>
                                    ) : (
                                      <>
                                        <MailX size={12} className="text-gray-400" />
                                        <span>ไม่รับ</span>
                                      </>
                                    )}
                                  </span>
                                )
                              ) : (
                                <span className="text-gray-300 text-[11px]">-</span>
                              )}
                            </td>

                            <td className="p-3">
                              {isPending ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                                  <Clock size={10} /> รออนุมัติ
                                </span>
                              ) : isRejected ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-red-100 text-red-800 border border-red-200">
                                  <XCircle size={10} /> ปฏิเสธ
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                                  <CheckCircle2 size={10} /> อนุมัติแล้ว
                                </span>
                              )}
                            </td>

                            <td className="p-3 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {isPending && (
                                  <button
                                    type="button"
                                    onClick={() => onApproveUser && onApproveUser(u.username)}
                                    className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                    title="อนุมัติผู้ใช้งานนี้"
                                  >
                                    <Check size={16} />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() => handleAdminStartEditUser(u)}
                                  className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="แก้ไขข้อมูลผู้ใช้งานนี้"
                                >
                                  <Edit size={15} />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => onDeleteUser && onDeleteUser(u.username)}
                                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="ลบบัญชีผู้ใช้นี้"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Users Pagination / Show More */}
              {filteredUsers.length > 10 && (
                <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100">
                  <div className="text-xs text-gray-500">
                    แสดง <strong className="text-gray-800">{displayedUsers.length}</strong> จากทั้งหมด <strong className="text-gray-800">{filteredUsers.length}</strong> บัญชีล่าสุด
                  </div>
                  <div className="flex items-center gap-2">
                    {usersDisplayLimit < filteredUsers.length ? (
                      <>
                        <button
                          type="button"
                          onClick={() => setUsersDisplayLimit((prev) => Math.min(prev + 10, filteredUsers.length))}
                          className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 rounded-xl text-xs font-bold transition shadow-2xs"
                        >
                          <ChevronDown size={14} />
                          <span>ดูเพิ่มเติม (+10 รายการ)</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setUsersDisplayLimit(filteredUsers.length)}
                          className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold transition"
                        >
                          แสดงทั้งหมด ({filteredUsers.length})
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setUsersDisplayLimit(10)}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition"
                      >
                        <ChevronUp size={14} />
                        <span>ย่อกลับเหลือ 10 รายการล่าสุด</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 3: ALL BOOKINGS MANAGEMENT */}
        {/* ==================================================== */}
        {activeTab === 'bookings' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900">
                  {isAdmin ? 'ศูนย์จัดการรายการจองห้องประชุมทั้งหมด' : 'จัดการรายการจองห้องประชุม'}
                </h3>
                <p className="text-xs text-gray-500">
                  ค้นหา, กรองสถานะ, กรองฝ่าย, อนุมัติ, ส่งต่ออีเมลยืนยัน และยกเลิกการจอง
                </p>
              </div>

              {/* Filters */}
              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-52">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="ค้นหาหัวข้อ, ผู้จอง, ห้อง..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 sm:py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
                  />
                </div>

                <select
                  value={deptFilter}
                  onChange={(e) => setDeptFilter(e.target.value)}
                  className="p-2 sm:p-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none flex-1 sm:flex-initial sm:max-w-[150px] truncate"
                >
                  <option value="all">ทุกฝ่าย / หน่วยงาน</option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="p-2 sm:p-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none flex-1 sm:flex-initial"
                >
                  <option value="all">ทุกสถานะ</option>
                  <option value="pending">รออนุมัติ</option>
                  <option value="approved">อนุมัติแล้ว</option>
                  <option value="cancelled">ยกเลิก</option>
                  <option value="rejected">ไม่อนุมัติ</option>
                </select>

                {/* Date range filter for export and filtering */}
                <div className="flex items-center gap-1 bg-gray-50 px-2 py-1.5 rounded-xl border border-gray-200 text-xs">
                  <Calendar size={13} className="text-[#C8102E] shrink-0" />
                  <input
                    type="date"
                    value={bookingStartDate}
                    onChange={(e) => setBookingStartDate(e.target.value)}
                    title="เลือกวันที่เริ่มต้นสำหรับส่งออก"
                    className="bg-transparent font-semibold text-gray-700 outline-none text-xs"
                  />
                  <span className="text-gray-400">-</span>
                  <input
                    type="date"
                    value={bookingEndDate}
                    onChange={(e) => setBookingEndDate(e.target.value)}
                    title="เลือกวันที่สิ้นสุดสำหรับส่งออก"
                    className="bg-transparent font-semibold text-gray-700 outline-none text-xs"
                  />
                  {(bookingStartDate || bookingEndDate) && (
                    <button
                      type="button"
                      onClick={() => {
                        setBookingStartDate('');
                        setBookingEndDate('');
                      }}
                      className="text-gray-400 hover:text-gray-600 px-0.5 text-xs"
                      title="ล้างช่วงวันที่"
                    >
                      ✕
                    </button>
                  )}
                </div>

                {(() => {
                  const isDateRangeReady = Boolean(
                    bookingStartDate && bookingEndDate && bookingStartDate <= bookingEndDate
                  );
                  return (
                    <div className="flex items-center gap-1.5">
                      {!isDateRangeReady && (
                        <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200 hidden xl:inline">
                          {!bookingStartDate && !bookingEndDate
                            ? 'เลือกวันที่เริ่ม-สิ้นสุดก่อนส่งออก'
                            : !bookingStartDate
                            ? 'เลือกวันที่เริ่มต้น'
                            : !bookingEndDate
                            ? 'เลือกวันที่สิ้นสุด'
                            : 'วันที่เริ่มต้องไม่เกินสิ้นสุด'}
                        </span>
                      )}
                      <button
                        type="button"
                        disabled={!isDateRangeReady}
                        onClick={() => {
                          if (!isDateRangeReady) return;
                          if (filteredBookings.length === 0) {
                            return;
                          }
                          exportBookingsToCSV(
                            filteredBookings,
                            rooms,
                            `bookings_list_${bookingStartDate}_to_${bookingEndDate}.csv`
                          );
                        }}
                        title={
                          isDateRangeReady
                            ? 'ส่งออกรายการที่กรองไว้เป็นไฟล์ Excel (CSV)'
                            : 'ต้องเลือกวันที่เริ่มต้นและวันที่สิ้นสุดก่อนถึงจะกดปุ่มส่งออกได้'
                        }
                        className={`flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition shadow-xs shrink-0 ${
                          isDateRangeReady
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
                            : 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed'
                        }`}
                      >
                        <FileSpreadsheet size={14} />
                        <span>ส่งออก CSV</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsImportModalOpen(true)}
                        title="นำเข้าข้อมูลรายการจองห้องประชุมจากไฟล์ Excel (.xlsx, .xls, .csv)"
                        className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-xl text-xs font-bold transition shadow-xs shrink-0 bg-blue-600 hover:bg-blue-700 text-white cursor-pointer active:scale-95"
                      >
                        <UploadCloud size={14} />
                        <span>นำเข้า Excel</span>
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>

            {/* Mobile View: Bookings Cards (Easy to read on phones) */}
            <div className="block md:hidden space-y-3">
              {filteredBookings.length === 0 ? (
                <div className="text-center py-10 text-gray-400 font-semibold bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  ไม่พบข้อมูลรายการจองที่ตรงกับเงื่อนไข
                </div>
              ) : (
                displayedBookings.map((b) => {
                  const room = rooms.find((r) => r.id === b.roomId);
                  const bStart = new Date(b.startTime);
                  const bEnd = new Date(b.endTime);

                  return (
                    <div
                      key={b.id}
                      className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs hover:shadow-xs transition space-y-3"
                    >
                      {/* Top Header: ID, Status, Type */}
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-xs text-gray-900 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                            {b.id}
                          </span>
                          {b.meetingType && (
                            <span className="text-[10px] font-bold text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                              {b.meetingType}
                            </span>
                          )}
                        </div>

                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                            b.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : b.status === 'pending'
                              ? 'bg-amber-100 text-amber-800 border border-amber-300'
                              : b.status === 'cancelled'
                              ? 'bg-gray-100 text-gray-700 border border-gray-200'
                              : 'bg-red-100 text-red-800 border border-red-200'
                          }`}
                        >
                          {b.status === 'approved'
                            ? 'อนุมัติแล้ว'
                            : b.status === 'pending'
                            ? 'รออนุมัติ'
                            : b.status === 'cancelled'
                            ? 'ยกเลิกแล้ว'
                            : 'ไม่อนุมัติ'}
                        </span>
                      </div>

                      {/* Topic */}
                      <div>
                        <h4 className="text-sm font-bold text-gray-900 leading-snug">{b.topic}</h4>
                        <div className="text-xs font-semibold text-blue-700 flex items-center gap-1 mt-1">
                          <Building size={13} className="shrink-0 text-blue-500" />
                          <span>{room?.name || b.roomId}</span>
                        </div>
                      </div>

                      {/* Details Box */}
                      <div className="bg-gray-50/80 rounded-xl p-3 space-y-1.5 text-xs text-gray-700">
                        <div className="flex items-center gap-1.5">
                          <Calendar size={13} className="text-gray-400 shrink-0" />
                          <span className="font-medium text-gray-900">
                            {formatThaiDate(bStart, { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={13} className="text-gray-400 shrink-0" />
                          <span>
                            {formatThaiTime(bStart, { hour: '2-digit', minute: '2-digit' })} - {formatThaiTime(bEnd, { hour: '2-digit', minute: '2-digit' })} น.
                          </span>
                        </div>
                        <div className="flex items-start gap-1.5 pt-1 border-t border-gray-200/60">
                          <Users size={13} className="text-gray-400 shrink-0 mt-0.5" />
                          <div>
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-gray-900">{b.requesterName}</span>
                              {isBookingRequesterDeleted(b, users) && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-300">
                                  <UserX size={10} className="text-gray-500" />
                                  อดีตผู้ใช้งาน
                                </span>
                              )}
                            </div>
                            <span className="text-gray-500 text-[11px] block">{b.department}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Bar */}
                      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100">
                        <button
                          type="button"
                          onClick={() => onViewBooking(b)}
                          className="flex-1 min-w-[100px] py-2 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                        >
                          <Eye size={14} />
                          <span>รายละเอียด</span>
                        </button>

                        {b.status === 'pending' && (isAdmin || isManager) && (
                          <button
                            type="button"
                            onClick={() => onApprove(b.id)}
                            className="flex-1 min-w-[90px] py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1 shadow-2xs"
                          >
                            <Check size={14} />
                            <span>อนุมัติ</span>
                          </button>
                        )}

                        {(isAdmin || isManager) && b.status !== 'cancelled' && (
                          <button
                            type="button"
                            onClick={() => onResendEmail(b)}
                            className="py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                            title="ส่งอีเมลแจ้งเตือนซ้ำ"
                          >
                            <Send size={14} />
                            <span>ส่งอีเมล</span>
                          </button>
                        )}

                        {b.status === 'approved' && (
                          <button
                            type="button"
                            onClick={() => onRequestCancel(b)}
                            className="py-2 px-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1"
                            title="ยกเลิกการจองนี้"
                          >
                            <Ban size={14} />
                            <span>ยกเลิก</span>
                          </button>
                        )}

                        {isAdmin && (
                          <>
                            {b.status !== 'cancelled' && (
                              <button
                                type="button"
                                onClick={() => onEditBooking(b)}
                                className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-xs font-bold transition"
                                title="แก้ไขข้อมูลการจอง"
                              >
                                <Edit size={14} />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => onDeleteBooking(b.id)}
                              className="p-2 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-600 border border-gray-200 rounded-xl text-xs font-bold transition"
                              title="ลบรายการจองถาวร"
                            >
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-2xl shadow-2xs">
              <table className="w-full text-left text-xs min-w-[760px]">
                <thead className="bg-gray-50 border-b border-gray-200 text-gray-600 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3">รหัส / วันที่</th>
                    <th className="p-3">ห้องประชุม</th>
                    <th className="p-3">หัวข้อการประชุม</th>
                    <th className="p-3">ผู้ขอจอง / ฝ่าย</th>
                    <th className="p-3">สถานะ</th>
                    <th className="p-3 text-right">การจัดการ</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-400 font-semibold">
                        ไม่พบข้อมูลรายการจองที่ตรงกับเงื่อนไข
                      </td>
                    </tr>
                  ) : (
                    displayedBookings.map((b) => {
                      const room = rooms.find((r) => r.id === b.roomId);
                      const bStart = new Date(b.startTime);
                      const bEnd = new Date(b.endTime);

                      return (
                        <tr key={b.id} className="hover:bg-gray-50/70 transition">
                          <td className="p-3">
                            <div className="font-mono font-bold text-gray-900">{b.id}</div>
                            <div className="text-[11px] text-gray-500">
                              {formatThaiDate(bStart, { day: 'numeric', month: 'short' })}
                            </div>
                            <div className="text-[10px] text-gray-400">
                              {formatThaiTime(bStart, { hour: '2-digit', minute: '2-digit' })} - {formatThaiTime(bEnd, { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </td>

                          <td className="p-3 font-semibold text-gray-800">
                            {room?.name || b.roomId}
                          </td>

                          <td className="p-3">
                            <div className="font-bold text-gray-900 line-clamp-1">{b.topic}</div>
                            {b.meetingType && (
                              <span className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                                {b.meetingType}
                              </span>
                            )}
                          </td>

                          <td className="p-3">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-medium text-gray-800">{b.requesterName}</span>
                              {isBookingRequesterDeleted(b, users) && (
                                <span
                                  className="inline-flex items-center gap-0.5 px-1.5 py-0.2 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-300"
                                  title="บัญชีผู้ใช้งานนี้พ้นสภาพหรือถูกลบออกจากระบบแล้ว แต่ประวัติการจองยังคงถูกเก็บรักษาไว้"
                                >
                                  <UserX size={10} className="text-gray-500" />
                                  อดีตผู้ใช้งาน
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-gray-500">{b.department}</div>
                          </td>

                          <td className="p-3">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                b.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : b.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : b.status === 'cancelled'
                                  ? 'bg-gray-100 text-gray-700'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {b.status === 'approved'
                                ? 'อนุมัติแล้ว'
                                : b.status === 'pending'
                                ? 'รออนุมัติ'
                                : b.status === 'cancelled'
                                ? 'ยกเลิกแล้ว'
                                : 'ไม่อนุมัติ'}
                            </span>
                          </td>

                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => onViewBooking(b)}
                                className="p-1.5 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                                title="ดูรายละเอียด"
                              >
                                <Eye size={14} />
                              </button>

                              {b.status === 'pending' && (isAdmin || isManager) && (
                                <button
                                  type="button"
                                  onClick={() => onApprove(b.id)}
                                  className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                                  title="อนุมัติคำขอ"
                                >
                                  <Check size={14} />
                                </button>
                              )}

                              {(isAdmin || isManager) && b.status !== 'cancelled' && (
                                <button
                                  type="button"
                                  onClick={() => onResendEmail(b)}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="ส่งอีเมลแจ้งเตือนซ้ำ"
                                >
                                  <Send size={14} />
                                </button>
                              )}

                              {b.status === 'approved' && (
                                <button
                                  type="button"
                                  onClick={() => onRequestCancel(b)}
                                  className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                                  title="ยกเลิกการจองนี้"
                                >
                                  <Ban size={14} />
                                </button>
                              )}

                              {isAdmin && (
                                <>
                                  {b.status !== 'cancelled' && (
                                    <button
                                      type="button"
                                      onClick={() => onEditBooking(b)}
                                      className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition"
                                      title="แก้ไขข้อมูลการจอง"
                                    >
                                      <Edit size={14} />
                                    </button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => onDeleteBooking(b.id)}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="ลบรายการจองถาวร"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Bookings Pagination / Show More */}
            {filteredBookings.length > 10 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-gray-100">
                <div className="text-xs text-gray-500">
                  แสดง <strong className="text-gray-800">{displayedBookings.length}</strong> จากทั้งหมด <strong className="text-gray-800">{filteredBookings.length}</strong> รายการจองล่าสุด
                </div>
                <div className="flex items-center gap-2">
                  {bookingsDisplayLimit < filteredBookings.length ? (
                    <>
                      <button
                        type="button"
                        onClick={() => setBookingsDisplayLimit((prev) => Math.min(prev + 10, filteredBookings.length))}
                        className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-[#C8102E] rounded-xl text-xs font-bold transition shadow-2xs"
                      >
                        <ChevronDown size={14} />
                        <span>ดูเพิ่มเติม (+10 รายการ)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setBookingsDisplayLimit(filteredBookings.length)}
                        className="px-3.5 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 rounded-xl text-xs font-semibold transition"
                      >
                        แสดงทั้งหมด ({filteredBookings.length})
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setBookingsDisplayLimit(10)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition"
                    >
                      <ChevronUp size={14} />
                      <span>ย่อกลับเหลือ 10 รายการล่าสุด</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 4: MY HISTORY (Available to Super Admin, Admin, and User) */}
        {/* ==================================================== */}
        {activeTab === 'my_history' && (
          <MyBookingsTab
            bookings={bookings}
            rooms={rooms}
            currentUser={currentUser}
            isAdminMode={isAdmin || isManager}
            onViewBooking={onViewBooking}
            onRequestCancel={onRequestCancel}
            onOpenNewBooking={onBackToBooking}
          />
        )}

        {/* ==================================================== */}
        {/* TAB 5: ROOMS & MAINTENANCE (Admin Only) */}
        {/* ==================================================== */}
        {activeTab === 'rooms' && isAdmin && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                  <Building className="text-purple-600" size={20} />
                  <span>จัดการข้อมูลห้องประชุมและปิดกั้นห้องซ่อมบำรุง</span>
                </h3>
                <p className="text-xs text-gray-500">
                  เพิ่มห้องประชุมใหม่, แก้ไขข้อมูลรายละเอียดอุปกรณ์, สลับสถานะเปิด/ปิด และลบห้องประชุม
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onOpenBlockModal}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-red-300 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold transition"
                >
                  <Ban size={15} />
                  <span>ปิดกั้นห้องซ่อมบำรุง</span>
                </button>
                <button
                  type="button"
                  onClick={onOpenRoomModal}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C8102E] hover:bg-[#a00c24] text-white text-xs font-bold transition shadow-xs"
                >
                  <Plus size={15} />
                  <span>+ จัดการ/เพิ่มห้องประชุม</span>
                </button>
              </div>
            </div>

            {/* Rooms Cards with Rich Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className={`p-4 rounded-2xl border transition flex flex-col justify-between gap-3 ${
                    room.isActive ? 'bg-white border-gray-200 hover:shadow-xs' : 'bg-red-50/40 border-red-200'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                          room.isActive
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-red-100 text-red-800 border border-red-200'
                        }`}
                      >
                        {room.isActive ? 'เปิดใช้งานปกติ' : 'ปิดปรับปรุง'}
                      </span>
                      <span className="text-xs text-gray-500 font-bold">
                        {room.capacity || 20} ที่นั่ง
                      </span>
                    </div>

                    <h4 className="text-sm sm:text-base font-bold text-gray-900 mt-2">
                      {room.name}
                    </h4>
                    {room.location && (
                      <p className="text-xs text-gray-500 mt-0.5">{room.location}</p>
                    )}

                    {room.description && (
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                        {room.description}
                      </p>
                    )}

                    {/* Equipment badges */}
                    {room.equipment && room.equipment.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2.5">
                        {room.equipment.map((eq, i) => (
                          <span
                            key={i}
                            className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium border border-gray-200"
                          >
                            {eq}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Seating Formats */}
                    {room.seatingOptions && room.seatingOptions.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {room.seatingOptions.map((seat, i) => (
                          <span
                            key={i}
                            className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium border border-blue-200"
                          >
                            {seat}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-3 border-t border-gray-100 gap-2">
                    {/* Toggle Status */}
                    <button
                      type="button"
                      onClick={() => onToggleRoomStatus && onToggleRoomStatus(room.id)}
                      className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
                        room.isActive
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                      }`}
                    >
                      {room.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                      <span>{room.isActive ? 'เปิด' : 'ปิด'}</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      {/* Edit room */}
                      <button
                        type="button"
                        onClick={() => {
                          if (onEditRoom) {
                            onEditRoom(room);
                          } else {
                            onOpenRoomModal();
                          }
                        }}
                        className="flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition border border-blue-200"
                      >
                        <Edit size={13} />
                        <span>แก้ไข</span>
                      </button>

                      {/* Delete room */}
                      <button
                        type="button"
                        onClick={() => onDeleteRoom && onDeleteRoom(room.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition border border-transparent hover:border-red-200"
                        title="ลบห้องนี้"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 6: REPORTS & ANALYTICS */}
        {/* ==================================================== */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-3">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <BarChart3 className="text-[#C8102E]" size={20} />
                <span>แดชบอร์ดสถิติผู้บริหารและการใช้งานห้องประชุม</span>
              </h3>
              <p className="text-xs text-gray-500">
                วิเคราะห์อัตราการใช้งานห้องประชุม, ชั่วโมงที่มีการใช้งานหนาแน่น, สถิติตามฝ่าย และส่งออก CSV
              </p>
            </div>
            <AdminReports bookings={bookings} rooms={rooms} />
          </div>
        )}

        {/* ==================================================== */}
        {/* TAB 7: DEPARTMENT DATA MANAGEMENT (เพิ่ม ลบ แก้ไข) */}
        {/* ==================================================== */}
        {(activeTab === 'departments' || activeTab === 'directory') && isAdmin && (
          <DepartmentManagementTab
            departments={departments}
            users={users}
            bookings={bookings}
            isAdmin={isAdmin}
            onAddDepartment={onAddDepartment || (() => {})}
            onUpdateDepartment={onUpdateDepartment || (() => {})}
            onDeleteDepartment={onDeleteDepartment || (() => {})}
          />
        )}

        {/* ==================================================== */}
        {/* TAB 8: MY PROFILE (MANAGE MY DATA) */}
        {/* ==================================================== */}
        {activeTab === 'my_profile' && currentUser && (
          <MyProfileTab
            currentUser={currentUser}
            bookings={bookings}
            rooms={rooms}
            users={users}
            onUpdateProfile={onUpdateProfile || onLogin}
            onViewBooking={onViewBooking}
          />
        )}
      </div>

      {/* REJECT USER MODAL */}
      {rejectingUser && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setRejectingUser(null);
          }}
        >
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-t-4 border-red-500 animate-fade-in space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <XCircle className="text-red-500" size={20} />
                <span>ปฏิเสธคำขอสมัครใช้งาน</span>
              </h4>
              <button
                type="button"
                onClick={() => setRejectingUser(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <p className="text-xs text-gray-600">
              ปฏิเสธคำขอของ <strong>{rejectingUser.name}</strong> ({rejectingUser.username})
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                เหตุผลในการปฏิเสธคำขอ:
              </label>
              <textarea
                rows={3}
                value={userRejectReason}
                onChange={(e) => setUserRejectReason(e.target.value)}
                placeholder="เช่น ข้อมูลไม่ตรงกับทำเนียบบุคลากร, กรุณาติดต่อฝ่ายทรัพยากรบุคคล..."
                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs text-gray-800 outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingUser(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={() => {
                  if (onRejectUser) {
                    onRejectUser(rejectingUser.username, userRejectReason);
                  }
                  setRejectingUser(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition"
              >
                ยืนยันการปฏิเสธ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADMIN DIRECT ADD USER MODAL */}
      {isAddUserModalOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsAddUserModalOpen(false);
          }}
        >
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-t-4 border-[#C8102E] animate-fade-in space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <UserPlus className="text-[#C8102E]" size={20} />
                <span>เพิ่มผู้ใช้งานใหม่ (อนุมัติทันที)</span>
              </h4>
              <button
                type="button"
                onClick={() => setIsAddUserModalOpen(false)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdminCreateUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ชื่อ - นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น ดร. สมเกียรติ สว่างวงศ์"
                  value={newAdminUserName}
                  onChange={(e) => setNewAdminUserName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E]"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    ชื่อเข้าระบบ (Username) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="เช่น somkiat.s"
                    value={newAdminUserUsername}
                    onChange={(e) => setNewAdminUserUsername(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E]"
                  />
                  {newAdminUserUsername.trim().length > 0 && (
                    (() => {
                      const isDup = users.some(
                        (u) => u.username.trim().toLowerCase() === newAdminUserUsername.trim().toLowerCase()
                      );
                      return (
                        <p className={`text-[10px] mt-1 font-medium ${isDup ? 'text-red-500' : 'text-emerald-600'}`}>
                          {isDup ? '⚠️ ชื่อเข้าระบบนี้ซ้ำ' : '✓ ใช้ได้'}
                        </p>
                      );
                    })()
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    รหัสผ่าน <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    value={newAdminUserPassword}
                    onChange={(e) => setNewAdminUserPassword(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    บทบาท (Role)
                  </label>
                  <select
                    value={newAdminUserRole}
                    onChange={(e) => setNewAdminUserRole(e.target.value as UserRole)}
                    className="w-full p-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E]"
                  >
                    <option value="employee">ผู้ใช้งานทั่วไป (User)</option>
                    <option value="manager">ผู้ดูแลระบบ (Admin)</option>
                    <option value="admin">ผู้ดูแลระบบสูงสุด (Super Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    ตำแหน่งงาน
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น นักวิทยาศาสตร์"
                    value={newAdminUserTitle}
                    onChange={(e) => setNewAdminUserTitle(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ฝ่าย / หน่วยงาน <span className="text-red-500">*</span>
                </label>
                <select
                  value={newAdminUserDept}
                  onChange={(e) => setNewAdminUserDept(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E]"
                >
                  {availableDeptNames.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    อีเมล
                  </label>
                  <input
                    type="email"
                    placeholder="email@qsmi.or.th"
                    value={newAdminUserEmail}
                    onChange={(e) => setNewAdminUserEmail(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    placeholder="0812345678"
                    value={newAdminUserPhone}
                    onChange={(e) => setNewAdminUserPhone(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E]"
                  />
                </div>
              </div>

              {(newAdminUserRole === 'admin' || newAdminUserRole === 'manager') && (
                <div
                  className={`p-3 rounded-2xl border transition ${
                    newAdminUserReceiveEmail
                      ? 'bg-blue-50/70 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                        <Mail
                          size={14}
                          className={newAdminUserReceiveEmail ? 'text-blue-600' : 'text-gray-400'}
                        />
                        <span>รับอีเมลแจ้งเตือนของระบบ (Admin Email Notification)</span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        เปิดรับการแจ้งเตือนทางอีเมลเมื่อมีรายการขอจองใหม่ การอนุมัติ หรือการยกเลิกห้องประชุม
                      </p>
                    </div>

                    <label className="relative inline-flex items-center cursor-pointer shrink-0 mt-0.5">
                      <input
                        type="checkbox"
                        checked={newAdminUserReceiveEmail}
                        onChange={(e) => setNewAdminUserReceiveEmail(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserModalOpen(false)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#C8102E] hover:bg-[#a60d26] text-white rounded-xl text-xs font-bold transition"
                >
                  บันทึกผู้ใช้งาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN EDIT USER MODAL */}
      {editingUser && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setEditingUser(null);
          }}
        >
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border-t-4 border-blue-600 animate-fade-in space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Edit className="text-blue-600" size={20} />
                <span>แก้ไขข้อมูลผู้ใช้งาน (@{editingUser.username})</span>
              </h4>
              <button
                type="button"
                onClick={() => setEditingUser(null)}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAdminSaveEditedUser} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ชื่อ - นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editUserName}
                  onChange={(e) => setEditUserName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    บทบาทสิทธิ์ (Role)
                  </label>
                  <select
                    value={editUserRole}
                    onChange={(e) => setEditUserRole(e.target.value as UserRole)}
                    className="w-full p-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="employee">ผู้ใช้งานทั่วไป (User)</option>
                    <option value="manager">ผู้ดูแลระบบ (Admin)</option>
                    <option value="admin">ผู้ดูแลระบบสูงสุด (Super Admin)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    สถานะบัญชี
                  </label>
                  <select
                    value={editUserStatus}
                    onChange={(e) => setEditUserStatus(e.target.value as UserStatus)}
                    className="w-full p-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    <option value="approved">อนุมัติแล้ว (Approved)</option>
                    <option value="pending">รอการอนุมัติ (Pending)</option>
                    <option value="rejected">ปฏิเสธ (Rejected)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    ฝ่าย / หน่วยงาน <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={editUserDept}
                    onChange={(e) => setEditUserDept(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                  >
                    {editUserDept && !availableDeptNames.includes(editUserDept) && (
                      <option value={editUserDept}>{editUserDept}</option>
                    )}
                    {availableDeptNames.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    ตำแหน่งงาน
                  </label>
                  <input
                    type="text"
                    value={editUserTitle}
                    onChange={(e) => setEditUserTitle(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    อีเมล
                  </label>
                  <input
                    type="email"
                    value={editUserEmail}
                    onChange={(e) => setEditUserEmail(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    เบอร์โทรศัพท์
                  </label>
                  <input
                    type="tel"
                    value={editUserPhone}
                    onChange={(e) => setEditUserPhone(e.target.value)}
                    onBlur={() => setEditUserPhone((prev) => (prev ? formatThaiPhone(prev, '') || prev : ''))}
                    placeholder="เช่น 02-252-0161 ต่อ 123"
                    className="w-full p-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  รหัสผ่าน (Password)
                </label>
                <input
                  type="text"
                  value={editUserPassword}
                  onChange={(e) => setEditUserPassword(e.target.value)}
                  placeholder="เปลี่ยนรหัสผ่านใหม่"
                  className="w-full p-2 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {(editUserRole === 'admin' || editUserRole === 'manager') && (
                <div
                  className={`p-3.5 rounded-2xl border transition ${
                    editUserReceiveEmail
                      ? 'bg-blue-50/70 border-blue-200'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                        <Mail
                          size={14}
                          className={editUserReceiveEmail ? 'text-blue-600' : 'text-gray-400'}
                        />
                        <span>รับอีเมลแจ้งเตือนของระบบ (Admin Email Notification)</span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        ส่งอีเมลแจ้งเตือนเมื่อมีการจองใหม่ การอนุมัติ หรือการยกเลิกห้องประชุม
                        {!isAdmin && (
                          <span className="text-amber-600 font-semibold block mt-0.5">
                            *เฉพาะ Super Admin เท่านั้นที่เป็นผู้กำหนดสิทธิ์นี้
                          </span>
                        )}
                      </p>
                    </div>

                    <label
                      className={`relative inline-flex items-center shrink-0 mt-0.5 ${
                        isAdmin ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
                      }`}
                    >
                      <input
                        type="checkbox"
                        disabled={!isAdmin}
                        checked={editUserReceiveEmail}
                        onChange={(e) => setEditUserReceiveEmail(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-gray-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>

                  {!editUserEmail && editUserReceiveEmail && (
                    <div className="mt-2 text-[11px] text-amber-800 bg-amber-50 p-2 rounded-xl border border-amber-200 flex items-center gap-1.5">
                      <AlertCircle size={13} className="shrink-0" />
                      <span>ยังไม่ได้ระบุอีเมลด้านบน โปรดใส่อีเมลเพื่อให้ระบบจัดส่งข้อความแจ้งเตือนได้</span>
                    </div>
                  )}
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                >
                  <Check size={14} />
                  <span>บันทึกการแก้ไข</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Import Excel Modal */}
      {isImportModalOpen && (
        <ImportExcelModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
          rooms={rooms}
          existingBookings={bookings}
          onConfirmImport={(imported, options) => {
            if (onBatchImportBookings) {
              onBatchImportBookings(imported, options);
            }
          }}
        />
      )}
    </div>
  );
};
