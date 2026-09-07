import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  Bell,
  Mail,
  CheckCircle2,
  Clock,
  Ban,
  AlertTriangle,
  Calendar,
  ExternalLink,
  Trash2,
  CheckCheck,
  Filter,
  Search,
  UserCheck,
  Building,
  Info
} from 'lucide-react';
import { Booking, EmailNotification, UserAccount } from '../types';
import { formatThaiDate, formatThaiTime } from '../utils/thaiDate';

export interface AppNotification {
  id: string;
  type: 'booking_approved' | 'booking_rejected' | 'booking_pending' | 'booking_cancelled' | 'user_pending' | 'system' | 'email';
  title: string;
  message: string;
  timestamp: string;
  bookingId?: string;
  roomName?: string;
  department?: string;
  requesterName?: string;
  isRead: boolean;
  severity: 'success' | 'warning' | 'error' | 'info';
  emailData?: EmailNotification;
}

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserAccount | null;
  bookings: Booking[];
  users: UserAccount[];
  emailNotifications: EmailNotification[];
  readNotificationIds?: string[];
  deletedNotificationIds?: string[];
  onMarkNotificationsRead?: (ids: string[]) => void;
  onDeleteNotifications?: (ids: string[]) => void;
  onOpenBooking: (bookingId: string) => void;
  onClearEmailNotifications: () => void;
  onOpenManagement?: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  bookings,
  users,
  emailNotifications,
  readNotificationIds = [],
  deletedNotificationIds = [],
  onMarkNotificationsRead,
  onDeleteNotifications,
  onOpenBooking,
  onClearEmailNotifications,
  onOpenManagement,
  onUnreadCountChange
}) => {
  const [activeTab, setActiveTab] = useState<'bookings' | 'system'>('bookings');
  const [filterType, setFilterType] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [localReadIds, setLocalReadIds] = useState<Set<string>>(() => new Set());
  const [localDeletedIds, setLocalDeletedIds] = useState<Set<string>>(() => new Set());
  const [showConfirmDeleteAll, setShowConfirmDeleteAll] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState<EmailNotification | null>(
    emailNotifications.length > 0 ? emailNotifications[0] : null
  );

  const readIdsSet = useMemo(() => {
    const combined = new Set(readNotificationIds);
    localReadIds.forEach((id) => combined.add(id));
    return combined;
  }, [readNotificationIds, localReadIds]);

  const deletedIdsSet = useMemo(() => {
    const combined = new Set(deletedNotificationIds);
    localDeletedIds.forEach((id) => combined.add(id));
    return combined;
  }, [deletedNotificationIds, localDeletedIds]);

  // Build unified notifications list
  const notifications: AppNotification[] = useMemo(() => {
    const list: AppNotification[] = [];

    // 1. Pending member registrations (for Admin & Super Admin)
    if (currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager')) {
      const pendingUsers = users.filter((u) => u.status === 'pending');
      pendingUsers.forEach((u) => {
        list.push({
          id: `user_pending_${u.username}`,
          type: 'user_pending',
          title: 'คำขอสมัครสมาชิกใหม่รอการอนุมัติ',
          message: `${u.name} (${u.department}) ได้ลงทะเบียนเข้าใช้งานระบบ รอการตรวจสอบสิทธิ์`,
          timestamp: u.registeredAt || new Date().toISOString(),
          department: u.department,
          requesterName: u.name,
          isRead: readIdsSet.has(`user_pending_${u.username}`),
          severity: 'warning'
        });
      });
    }

    // 2. Booking notifications
    bookings.forEach((b) => {
      const isMine = currentUser && (
        b.username?.toLowerCase() === currentUser.username.toLowerCase() ||
        b.requesterName.trim().toLowerCase() === currentUser.name.trim().toLowerCase() ||
        (currentUser.email && b.email && b.email.toLowerCase() === currentUser.email.toLowerCase())
      );
      const isAdmin = currentUser && (currentUser.role === "admin" || currentUser.role === "manager");

      // Skip irrelevant bookings for non-admin
      if (!isAdmin && !isMine) return;

      if (b.status === 'pending') {
        list.push({
          id: `booking_pending_${b.id}`,
          type: 'booking_pending',
          title: isMine ? 'คำขอจองห้องของคุณกำลังรอการอนุมัติ' : `คำขอจองห้องใหม่รอการพิจารณา (${b.department})`,
          message: `หัวข้อ "${b.topic}" วันที่ ${formatThaiDate(b.startTime, { day: 'numeric', month: 'short' })} เวลา ${formatThaiTime(b.startTime)} - ${formatThaiTime(b.endTime)} น. โดย ${b.requesterName}`,
          timestamp: b.createdAt || b.startTime,
          bookingId: b.id,
          department: b.department,
          requesterName: b.requesterName,
          isRead: readIdsSet.has(`booking_pending_${b.id}`),
          severity: 'warning'
        });
      } else if (b.status === 'approved') {
        list.push({
          id: `booking_approved_${b.id}`,
          type: 'booking_approved',
          title: isMine ? 'คำขอจองห้องประชุมได้รับการอนุมัติแล้ว 🎉' : `การจองห้องประชุมได้รับการอนุมัติ (${b.department})`,
          message: `หัวข้อ "${b.topic}" ได้รับการอนุมัติเรียบร้อยแล้ว เข้าใช้งานได้ตามวันและเวลาที่ระบุ`,
          timestamp: b.createdAt || b.startTime,
          bookingId: b.id,
          department: b.department,
          requesterName: b.requesterName,
          isRead: readIdsSet.has(`booking_approved_${b.id}`),
          severity: 'success'
        });
      } else if (b.status === 'rejected') {
        list.push({
          id: `booking_rejected_${b.id}`,
          type: 'booking_rejected',
          title: isMine ? 'คำขอจองห้องประชุมไม่ได้รับอนุมัติ' : `คำขอจองห้องไม่ได้รับอนุมัติ (${b.department})`,
          message: `หัวข้อ "${b.topic}" ${b.rejectionReason ? `(เหตุผล: ${b.rejectionReason})` : ''}`,
          timestamp: b.createdAt || b.startTime,
          bookingId: b.id,
          department: b.department,
          requesterName: b.requesterName,
          isRead: readIdsSet.has(`booking_rejected_${b.id}`),
          severity: 'error'
        });
      } else if (b.status === 'cancelled') {
        list.push({
          id: `booking_cancelled_${b.id}`,
          type: 'booking_cancelled',
          title: `การจองห้องประชุมถูกยกเลิก`,
          message: `หัวข้อ "${b.topic}" ${b.cancellationReason ? `(เหตุผล: ${b.cancellationReason})` : ''}`,
          timestamp: b.cancelledAt || b.createdAt || b.startTime,
          bookingId: b.id,
          department: b.department,
          requesterName: b.requesterName,
          isRead: readIdsSet.has(`booking_cancelled_${b.id}`),
          severity: 'info'
        });
      }
    });

    // Filter out deleted notifications and sort newest first
    return list
      .filter((item) => !deletedIdsSet.has(item.id))
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [bookings, users, emailNotifications, currentUser, readIdsSet, deletedIdsSet]);

  // Auto mark all visible notifications as read on opening
  useEffect(() => {
    if (isOpen && notifications.length > 0) {
      const allIds = notifications.map((n) => n.id);
      setLocalReadIds((prev) => new Set([...prev, ...allIds]));
      if (onMarkNotificationsRead) {
        onMarkNotificationsRead(allIds);
      }
    }
  }, [isOpen, notifications.length, onMarkNotificationsRead]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter((n) => {
      // Tab filter
      if (activeTab === 'bookings' && !n.type.startsWith('booking_')) return false;
      if (activeTab === 'system' && n.type.startsWith('booking_')) return false;

      // Status/Type filter
      if (filterType === 'pending' && n.type !== 'booking_pending' && n.type !== 'user_pending') return false;
      if (filterType === 'approved' && n.type !== 'booking_approved') return false;
      if (filterType === 'rejected' && n.type !== 'booking_rejected') return false;
      if (filterType === 'unread' && n.isRead) return false;

      // Search filter
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        return (
          n.title.toLowerCase().includes(query) ||
          n.message.toLowerCase().includes(query) ||
          (n.department && n.department.toLowerCase().includes(query)) ||
          (n.requesterName && n.requesterName.toLowerCase().includes(query)) ||
          (n.bookingId && n.bookingId.toLowerCase().includes(query))
        );
      }

      return true;
    });
  }, [notifications, activeTab, filterType, searchTerm]);

  // Auto-call parent update when unread count changes
  const unreadCount = useMemo(() => {
    return notifications.filter((n) => !n.isRead).length;
  }, [notifications]);

  useEffect(() => {
    if (onUnreadCountChange) {
      onUnreadCountChange(unreadCount);
    }
  }, [unreadCount, onUnreadCountChange]);

  const handleMarkAllAsRead = () => {
    const allIds = notifications.map((n) => n.id);
    setLocalReadIds((prev) => new Set([...prev, ...allIds]));
    if (onMarkNotificationsRead) {
      onMarkNotificationsRead(allIds);
    }
  };

  const handleDeleteSingle = (id: string) => {
    setLocalDeletedIds((prev) => new Set([...prev, id]));
    if (onDeleteNotifications) {
      onDeleteNotifications([id]);
    }
  };

  const handleConfirmDeleteAll = () => {
    const allIds = notifications.map((n) => n.id);
    setLocalDeletedIds((prev) => new Set([...prev, ...allIds]));
    if (onDeleteNotifications) {
      onDeleteNotifications(allIds);
    }
    setShowConfirmDeleteAll(false);
  };

  const handleItemClick = (n: AppNotification) => {
    setLocalReadIds((prev) => new Set([...prev, n.id]));
    if (onMarkNotificationsRead) {
      onMarkNotificationsRead([n.id]);
    }
    if (n.bookingId) {
      onOpenBooking(n.bookingId);
      onClose();
    } else if (n.type === "user_pending" && onOpenManagement) {
      onOpenManagement();
      onClose();
    }
  };

  if (!isOpen || !currentUser) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-5 overflow-y-auto custom-scrollbar"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[90dvh] flex flex-col relative border-t-4 border-[#C8102E] overflow-hidden my-auto animate-fade-in font-sans">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white shrink-0 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-[#C8102E] flex items-center justify-center shadow-xs shrink-0">
              <Bell size={22} className="animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base sm:text-lg font-bold text-gray-900">
                  ศูนย์การแจ้งเตือนระบบ (Notification Center)
                </h2>
                {unreadCount > 0 && (
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-[#C8102E] text-white animate-pulse">
                    {unreadCount} รายการใหม่
                  </span>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                ติดตามผลการอนุมัติคำขอจองห้องประชุม และสถานะการแจ้งเตือนภายในระบบ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap justify-end">
            {unreadCount > 0 && (
              <button
                type="button"
                onClick={handleMarkAllAsRead}
                className="flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 transition shadow-2xs"
                title="ทำเครื่องหมายว่าอ่านแล้วทั้งหมด"
              >
                <CheckCheck size={14} className="text-blue-600" />
                <span>อ่านทั้งหมดแล้ว</span>
              </button>
            )}
            {notifications.length > 0 && (
              showConfirmDeleteAll ? (
                <div className="flex items-center gap-1 bg-red-50 p-0.5 rounded-xl border border-red-200 animate-fade-in">
                  <button
                    type="button"
                    onClick={handleConfirmDeleteAll}
                    className="flex items-center gap-1 text-xs font-bold text-white bg-red-600 hover:bg-red-700 px-2.5 py-1 rounded-lg transition shadow-2xs"
                    title="ยืนยันการลบข้อความแจ้งเตือนทั้งหมด"
                  >
                    <Trash2 size={12} />
                    <span>ยืนยันลบทั้งหมด</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowConfirmDeleteAll(false)}
                    className="text-xs font-semibold text-gray-500 hover:text-gray-800 px-2 py-1 rounded-lg transition"
                  >
                    ยกเลิก
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setShowConfirmDeleteAll(true)}
                  className="flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-red-600 px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-red-50/70 transition shadow-2xs"
                  title="ลบข้อความการแจ้งเตือนทั้งหมด"
                >
                  <Trash2 size={14} className="text-red-500" />
                  <span>ลบข้อความทั้งหมด</span>
                </button>
              )
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
              title="ปิดหน้าต่าง"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Navigation Tabs & Filters */}
        <div className="px-5 sm:px-6 py-3 border-b border-gray-200 bg-gray-50/70 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shrink-0">
          {/* Main Tabs */}
          <div className="flex items-center bg-gray-200/70 p-1 rounded-2xl gap-1 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => setActiveTab('bookings')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                activeTab === 'bookings' ? 'bg-white text-[#C8102E] shadow-2xs' : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calendar size={14} />
              <span>การจองห้อง</span>
            </button>
            {currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager') && (
              <button
                type="button"
                onClick={() => setActiveTab('system')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  activeTab === 'system' ? 'bg-white text-purple-700 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <UserCheck size={14} />
                <span>สมาชิก/ระบบ</span>
              </button>
            )}
          </div>

          {/* Search and Status Dropdown */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:w-56">
              <Search size={14} className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="ค้นหาการแจ้งเตือน..."
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 outline-none focus:ring-2 focus:ring-[#C8102E]"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm('')}
                  className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                >
                  <X size={13} />
                </button>
              )}
            </div>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-gray-700 outline-none focus:ring-2 focus:ring-[#C8102E]"
            >
              <option value="all">สถานะทั้งหมด</option>
              <option value="unread">เฉพาะที่ยังไม่อ่าน</option>
              <option value="pending">รอการอนุมัติ</option>
              <option value="approved">อนุมัติแล้ว</option>
              <option value="rejected">ไม่อนุมัติ</option>
            </select>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-4 sm:p-6 overflow-y-auto custom-scrollbar space-y-3 bg-gray-50/40">
              {filteredNotifications.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="w-14 h-14 rounded-3xl bg-gray-100 text-gray-400 flex items-center justify-center mx-auto mb-3">
                    <Bell size={24} />
                  </div>
                  <h4 className="text-sm font-bold text-gray-700">ไม่มีรายการแจ้งเตือน</h4>
                  <p className="text-xs text-gray-400 mt-1">
                    เมื่อมีคำขอจองห้อง อนุมัติ หรือสถานะเปลี่ยนแปลง ระบบจะแจ้งเตือนให้คุณทราบที่นี่
                  </p>
                </div>
              ) : (
                filteredNotifications.map((item) => {
                  let icon = <Info size={18} className="text-blue-600" />;
                  let bgCard = 'bg-white hover:bg-gray-50/80 border-gray-200';

                  if (item.type === 'booking_approved') {
                    icon = <CheckCircle2 size={18} className="text-emerald-600" />;
                    bgCard = 'bg-emerald-50/30 hover:bg-emerald-50/60 border-emerald-200';
                  } else if (item.type === 'booking_rejected') {
                    icon = <Ban size={18} className="text-red-600" />;
                    bgCard = 'bg-red-50/30 hover:bg-red-50/60 border-red-200';
                  } else if (item.type === 'booking_pending' || item.type === 'user_pending') {
                    icon = <Clock size={18} className="text-amber-600" />;
                    bgCard = 'bg-amber-50/30 hover:bg-amber-50/60 border-amber-200';
                  } else if (item.type === 'email') {
                    icon = <Mail size={18} className="text-blue-600" />;
                    bgCard = 'bg-blue-50/20 hover:bg-blue-50/50 border-blue-200';
                  }

                  return (
                    <div
                      key={item.id}
                      onClick={() => handleItemClick(item)}
                      className={`p-4 rounded-2xl border transition shadow-2xs cursor-pointer flex items-start justify-between gap-3.5 ${bgCard}`}
                    >
                      <div className="flex items-start gap-3.5 min-w-0">
                        <div className="p-2.5 rounded-2xl bg-white shadow-2xs border border-gray-100 shrink-0 mt-0.5">
                          {icon}
                        </div>

                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="text-xs sm:text-sm font-bold text-gray-900 leading-snug">
                              {item.title}
                            </h4>
                            {!item.isRead && (
                              <span className="w-2 h-2 rounded-full bg-[#C8102E] shrink-0" />
                            )}
                          </div>

                          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                            {item.message}
                          </p>

                          <div className="flex items-center gap-3 text-[11px] text-gray-400 mt-2 flex-wrap font-medium">
                            {item.department && (
                              <span className="flex items-center gap-1">
                                <Building size={12} />
                                <span>{item.department}</span>
                              </span>
                            )}
                            {item.requesterName && (
                              <span>ผู้ขอ: {item.requesterName}</span>
                            )}
                            <span>•</span>
                            <span>
                              {formatThaiDate(item.timestamp, { day: 'numeric', month: 'short' })}{' '}
                              {formatThaiTime(item.timestamp, { hour: '2-digit', minute: '2-digit' })}{' '}
                              น.
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-center sm:self-auto">
                        {item.bookingId && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleItemClick(item);
                            }}
                            className="flex items-center gap-1 text-[11px] font-bold text-[#C8102E] bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-xl border border-red-200 transition shrink-0"
                            title="เปิดดูรายละเอียดการจอง"
                          >
                            <span>เปิดดู</span>
                            <ExternalLink size={12} />
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSingle(item.id);
                          }}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl border border-transparent hover:border-red-200 transition shrink-0"
                          title="ลบข้อความแจ้งเตือนนี้"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-gray-200 bg-gray-50 flex items-center justify-between text-xs text-gray-500 shrink-0">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>ระบบเชื่อมต่อการแจ้งเตือนแบบเรียลไทม์ (QSMI Notification Hub)</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-gray-200 hover:bg-gray-300 font-bold text-gray-800 rounded-xl transition"
          >
            ปิด
          </button>
        </div>
      </div>
    </div>
  );
};
