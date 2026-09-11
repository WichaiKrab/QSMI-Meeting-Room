export interface Room {
  id: string;
  name: string;
  color: string;
  isActive: boolean;
  isRetired?: boolean; // ซ่อนห้องประชุมสำหรับห้องที่ได้เลิกใช้งานแล้ว ไม่แสดงในหน้าจองใหม่ แต่เก็บประวัติเดิม
  capacity?: number;
  location?: string;
  hasSpecialSeating?: boolean;
  description?: string;
  equipment?: string[];
  seatingOptions?: string[];
}

export type BookingStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

// User Roles:
// 'admin' = ผู้ดูแลระบบสูงสุด (Super Admin)
// 'manager' = ผู้ดูแลระบบ (Admin)
// 'employee' = ผู้ใช้งานทั่วไป (User)
export type UserRole = 'admin' | 'manager' | 'employee';

export type UserStatus = 'pending' | 'approved' | 'rejected';

export interface Booking {
  id: string;
  roomId: string;
  topic: string;
  department: string;
  requesterName: string;
  phone: string;
  email: string;
  username?: string; // SSO username
  institute?: string;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  participants: number;
  snacks?: number;
  lunch?: number;
  drinks?: number;
  equipment?: string[] | string;
  meetingType: 'Onsite' | 'Online' | 'Hybrid';
  onlineLinkType?: string;
  meetingLink?: string;
  seatingSetup?: 'Classroom' | 'Meeting (U)' | 'จัดเลี้ยงพระ' | '' | string;
  note?: string;
  createdAt: string;
  status: BookingStatus;
  isBlocked?: boolean;
  rejectionReason?: string;
  cancelledAt?: string;
  cancellationReason?: string;
  syncedToGoogleCalendar?: boolean;
  isImported?: boolean;
  suppressEmail?: boolean;
  requesterAccountStatus?: 'active' | 'deleted';
}

export interface UserAccount {
  id?: string;
  username: string;
  password?: string;
  name: string;
  department: string;
  role: UserRole;
  avatarColor?: string;
  email?: string;
  phone?: string;
  title?: string;
  status?: UserStatus;
  registeredAt?: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectionReason?: string;
  receiveEmailNotifications?: boolean;
}

export interface EmailNotification {
  id: string;
  bookingId: string;
  recipient: string;
  subject: string;
  bodyText: string;
  htmlBody: string;
  type: 'RECEIVED' | 'APPROVED' | 'REJECTED' | 'CANCELLED';
  sentAt: string;
  isRead: boolean;
  isAdminNotice: boolean;
}

export type CalendarView = 'day' | 'week' | 'month';

export interface Department {
  id: string;
  name: string;
  code?: string;
  headName?: string;
  headUsername?: string;
  phone?: string;
  email?: string;
  building?: string;
  description?: string;
  color?: string;
  createdAt?: string;
}

export type AuditActionType =
  | 'LOGIN'
  | 'LOGOUT'
  | 'AUTO_LOGOUT'
  | 'CREATE_BOOKING'
  | 'UPDATE_BOOKING'
  | 'CANCEL_BOOKING'
  | 'APPROVE_BOOKING'
  | 'REJECT_BOOKING'
  | 'USER_MANAGEMENT'
  | 'ROOM_MANAGEMENT'
  | 'SYSTEM';

export interface AuditLog {
  id: string;
  username: string;
  userFullName: string;
  userRole?: UserRole | string;
  department?: string;
  timestamp: string; // ISO timestamp
  actionType: AuditActionType;
  actionPerformed: string;
  ipAddress: string;
  userAgent: string;
  browserDevice?: string;
  details?: Record<string, any>;
}
