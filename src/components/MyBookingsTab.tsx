import React, { useState, useMemo } from 'react';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Search,
  ArrowUpDown,
  CheckCircle2,
  AlertCircle,
  Ban,
  CalendarCheck,
  CalendarPlus,
  Download,
  Eye,
  Plus,
  Building,
  UserCheck,
  ShieldCheck,
  X
} from 'lucide-react';
import { Booking, Room, UserAccount } from '../types';
import { formatThaiDate, formatThaiTime } from '../utils/thaiDate';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../utils/calendarSync';

interface MyBookingsTabProps {
  bookings: Booking[];
  rooms: Room[];
  currentUser: UserAccount | null;
  onViewBooking: (booking: Booking) => void;
  onRequestCancel: (booking: Booking) => void;
  onOpenNewBooking?: () => void;
}

export const MyBookingsTab: React.FC<MyBookingsTabProps> = ({
  bookings,
  rooms,
  currentUser,
  onViewBooking,
  onRequestCancel,
  onOpenNewBooking
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'approved' | 'pending' | 'cancelled' | 'rejected'>('all');
  const [sortBy, setSortBy] = useState<'date_asc' | 'date_desc' | 'created_desc'>('date_desc');

  // Filter bookings belonging to the current user
  const userBookings = useMemo(() => {
    if (!currentUser) return [];

    return bookings.filter((b) => {
      // Exclude maintenance blocks
      if (b.isBlocked) return false;

      // Match by username, requester name, email
      const matchUsername = b.username && b.username.toLowerCase() === currentUser.username.toLowerCase();
      const matchName = b.requesterName && b.requesterName.trim().toLowerCase() === currentUser.name.trim().toLowerCase();
      const matchEmail = currentUser.email && b.email && b.email.toLowerCase() === currentUser.email.toLowerCase();

      return matchUsername || matchName || matchEmail;
    });
  }, [bookings, currentUser]);

  // Status counts for tabs
  const stats = useMemo(() => {
    const total = userBookings.length;
    const approved = userBookings.filter((b) => b.status === 'approved').length;
    const pending = userBookings.filter((b) => b.status === 'pending').length;
    const cancelled = userBookings.filter((b) => b.status === 'cancelled').length;
    const rejected = userBookings.filter((b) => b.status === 'rejected').length;
    return { total, approved, pending, cancelled, rejected };
  }, [userBookings]);

  // Apply search, filter, and sorting
  const filteredAndSortedBookings = useMemo(() => {
    return userBookings
      .filter((b) => {
        // Status filter
        if (statusFilter !== 'all' && b.status !== statusFilter) {
          return false;
        }

        // Search filter
        if (searchTerm.trim()) {
          const term = searchTerm.toLowerCase();
          const room = rooms.find((r) => r.id === b.roomId);
          const roomName = room ? room.name.toLowerCase() : '';
          const topic = b.topic.toLowerCase();
          const department = (b.department || '').toLowerCase();
          return topic.includes(term) || roomName.includes(term) || department.includes(term);
        }
        return true;
      })
      .sort((a, b) => {
        const timeStartA = new Date(a.startTime).getTime();
        const timeStartB = new Date(b.startTime).getTime();
        const createdA = new Date(a.createdAt || a.startTime).getTime();
        const createdB = new Date(b.createdAt || b.startTime).getTime();

        if (sortBy === 'date_asc') {
          return timeStartA - timeStartB;
        } else if (sortBy === 'date_desc') {
          return timeStartB - timeStartA;
        } else {
          return createdB - createdA;
        }
      });
  }, [userBookings, rooms, statusFilter, searchTerm, sortBy]);

  // Render role badge
  const renderRoleBadge = () => {
    if (!currentUser) return null;
    if (currentUser.role === 'admin') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
          <ShieldCheck size={12} /> ผู้ดูแลระบบสูงสุด (Super Admin)
        </span>
      );
    }
    if (currentUser.role === 'manager') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
          <ShieldCheck size={12} /> ผู้ดูแลระบบ (Admin)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
        <UserCheck size={12} /> ผู้ใช้งานทั่วไป (User)
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-3">
        <div className="flex items-center gap-3">
          <div className="bg-red-100 p-2.5 rounded-2xl text-[#C8102E] shrink-0 shadow-2xs">
            <CalendarCheck size={22} />
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight flex items-center gap-2">
              <span>ประวัติการจองห้องประชุมของฉัน</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              ตรวจสอบสถานะ ดาวน์โหลดปฏิทิน หรือยกเลิกการจองห้องประชุมของคุณ
            </p>
          </div>
        </div>

        {onOpenNewBooking && (
          <button
            type="button"
            onClick={onOpenNewBooking}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#C8102E] hover:bg-[#a50d26] text-white text-xs sm:text-sm font-bold shadow-xs transition shrink-0"
          >
            <Plus size={15} /> จองห้องประชุมใหม่
          </button>
        )}
      </div>

      {/* User Identity Banner & Summary Cards */}
      <div className="p-4 bg-gradient-to-r from-red-50/70 via-gray-50 to-blue-50/50 rounded-2xl border border-gray-200">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3.5">
          {/* User Info */}
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center text-white font-bold text-base shadow-xs shrink-0 ${
                currentUser?.avatarColor || 'bg-red-600'
              }`}
            >
              {currentUser ? currentUser.name.charAt(0) : 'U'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-bold text-gray-900 text-sm sm:text-base">
                  {currentUser?.name || 'พนักงาน'}
                </span>
                {renderRoleBadge()}
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-600 mt-0.5 flex-wrap">
                <span className="flex items-center gap-1 font-medium">
                  <Building size={12} className="text-gray-400" />
                  {currentUser?.department}
                </span>
                {currentUser?.email && (
                  <>
                    <span>•</span>
                    <span className="text-gray-500 truncate">{currentUser.email}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Quick Stats Pills */}
          <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs">
            <div className="px-3 py-1.5 bg-white rounded-xl border border-gray-200 shadow-2xs font-semibold text-gray-700 flex items-center gap-1.5">
              <span>ทั้งหมด:</span>
              <span className="font-bold text-gray-900 text-sm">{stats.total}</span>
            </div>
            <div className="px-3 py-1.5 bg-green-50 rounded-xl border border-green-200 shadow-2xs font-semibold text-green-800 flex items-center gap-1.5">
              <CheckCircle2 size={13} className="text-green-600" />
              <span>อนุมัติแล้ว:</span>
              <span className="font-bold text-sm">{stats.approved}</span>
            </div>
            <div className="px-3 py-1.5 bg-amber-50 rounded-xl border border-amber-200 shadow-2xs font-semibold text-amber-800 flex items-center gap-1.5">
              <Clock size={13} className="text-amber-600" />
              <span>รออนุมัติ:</span>
              <span className="font-bold text-sm">{stats.pending}</span>
            </div>
            <div className="px-3 py-1.5 bg-gray-100 rounded-xl border border-gray-200 shadow-2xs font-semibold text-gray-700 flex items-center gap-1.5">
              <Ban size={13} className="text-gray-500" />
              <span>ยกเลิกแล้ว:</span>
              <span className="font-bold text-sm">{stats.cancelled}</span>
            </div>
            {stats.rejected > 0 && (
              <div className="px-3 py-1.5 bg-red-50 rounded-xl border border-red-200 shadow-2xs font-semibold text-red-800 flex items-center gap-1.5">
                <AlertCircle size={13} className="text-red-600" />
                <span>ไม่อนุมัติ:</span>
                <span className="font-bold text-sm">{stats.rejected}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Filter Controls & Search */}
      <div className="p-3.5 bg-white rounded-2xl border border-gray-200 space-y-3 shadow-2xs">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="ค้นหาชื่อห้อง, หัวข้อประชุม หรือแผนก..."
              className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:bg-white focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-gray-500 flex items-center gap-1 whitespace-nowrap">
              <ArrowUpDown size={13} /> เรียงตาม:
            </span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="p-2 border border-gray-200 rounded-xl text-xs font-bold bg-white text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
            >
              <option value="date_desc">📅 วันที่ใช้งาน (ใหม่ไปเก่า)</option>
              <option value="date_asc">📅 วันที่ใช้งาน (เก่าไปใหม่)</option>
              <option value="created_desc">⏱️ วันที่ทำรายการ (ล่าสุด)</option>
            </select>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs font-bold">
          <button
            type="button"
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'all'
                ? 'bg-gray-900 text-white shadow-2xs'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <span>ทั้งหมด</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              statusFilter === 'all' ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {stats.total}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('approved')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'approved'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 size={13} />
            <span>ยืนยันแล้ว</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              statusFilter === 'approved' ? 'bg-emerald-700 text-white' : 'bg-emerald-200 text-emerald-900'
            }`}>
              {stats.approved}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('pending')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'pending'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <Clock size={13} />
            <span>รออนุมัติ</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              statusFilter === 'pending' ? 'bg-amber-700 text-white' : 'bg-amber-200 text-amber-900'
            }`}>
              {stats.pending}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter('cancelled')}
            className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
              statusFilter === 'cancelled'
                ? 'bg-gray-700 text-white shadow-2xs'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <Ban size={13} />
            <span>ยกเลิกแล้ว</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
              statusFilter === 'cancelled' ? 'bg-gray-600 text-white' : 'bg-gray-200 text-gray-700'
            }`}>
              {stats.cancelled}
            </span>
          </button>

          {stats.rejected > 0 && (
            <button
              type="button"
              onClick={() => setStatusFilter('rejected')}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap flex items-center gap-1.5 ${
                statusFilter === 'rejected'
                  ? 'bg-red-600 text-white shadow-2xs'
                  : 'bg-red-50 text-red-800 hover:bg-red-100'
              }`}
            >
              <AlertCircle size={13} />
              <span>ไม่อนุมัติ</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                statusFilter === 'rejected' ? 'bg-red-700 text-white' : 'bg-red-200 text-red-900'
              }`}>
                {stats.rejected}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* Bookings List Body */}
      <div className="space-y-3.5">
        {filteredAndSortedBookings.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-2xl border border-gray-200 shadow-2xs space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gray-100 text-gray-400 flex items-center justify-center">
              <CalendarIcon size={28} />
            </div>
            <div>
              <h4 className="text-base font-bold text-gray-800">
                {searchTerm || statusFilter !== 'all'
                  ? 'ไม่พบรายการจองตามเงื่อนไขที่ค้นหา'
                  : 'ยังไม่มีประวัติการจองห้องประชุม'}
              </h4>
              <p className="text-xs text-gray-500 mt-1 max-w-sm mx-auto">
                {searchTerm || statusFilter !== 'all'
                  ? 'ลองปรับเปลี่ยนคำค้นหาหรือเปลี่ยนแท็บสถานะ'
                  : 'คุณสามารถเริ่มต้นจองห้องประชุมสำหรับการสัมมนา ประชุมภายใน หรือกิจกรรมวิชาการได้ทันที'}
              </p>
            </div>
            {onOpenNewBooking && (
              <button
                type="button"
                onClick={onOpenNewBooking}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#C8102E] hover:bg-[#a50d26] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition"
              >
                <Plus size={16} /> จองห้องประชุมใหม่
              </button>
            )}
          </div>
        ) : (
          filteredAndSortedBookings.map((b) => {
            const room = rooms.find((r) => r.id === b.roomId);
            const roomName = room ? room.name : 'ห้องเดิม (ถูกลบ)';

            const startD = new Date(b.startTime);
            const endD = new Date(b.endTime);
            const startDateStr = formatThaiDate(startD, { day: 'numeric', month: 'short', year: 'numeric' });
            const endDateStr = formatThaiDate(endD, { day: 'numeric', month: 'short', year: 'numeric' });
            const dateDisplay = startDateStr === endDateStr ? startDateStr : `${startDateStr} - ${endDateStr}`;
            const timeDisplay = `${formatThaiTime(startD, { hour: '2-digit', minute: '2-digit' })} - ${formatThaiTime(endD, { hour: '2-digit', minute: '2-digit' })} น.`;

            const isPending = b.status === 'pending';
            const isApproved = b.status === 'approved';
            const isCancelled = b.status === 'cancelled';
            const isRejected = b.status === 'rejected';

            const googleCalUrl = isApproved ? generateGoogleCalendarUrl(b, room) : '';

            return (
              <div
                key={b.id}
                className={`bg-white rounded-2xl border transition shadow-2xs hover:shadow-xs overflow-hidden ${
                  isCancelled
                    ? 'border-gray-300 opacity-80'
                    : isPending
                    ? 'border-amber-200'
                    : isApproved
                    ? 'border-green-200'
                    : 'border-red-200'
                }`}
              >
                {/* Card Header: Room + Status */}
                <div className="p-4 sm:p-5 pb-3 sm:pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-gray-100 bg-gray-50/40">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-[#C8102E] shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                          {roomName}
                        </span>
                        {room?.location && (
                          <span className="hidden md:inline-flex items-center gap-0.5 text-[11px] text-gray-500 font-medium">
                            <MapPin size={11} className="text-gray-400" />
                            {room.location}
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-400 font-mono">
                        รหัสการจอง: {b.id}
                      </span>
                    </div>
                  </div>

                  {/* Status Badge */}
                  <div className="shrink-0">
                    {isApproved && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                        <CheckCircle2 size={13} className="text-green-600" /> อนุมัติแล้ว (Approved)
                      </span>
                    )}
                    {isPending && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
                        <Clock size={13} className="text-amber-600 animate-pulse" /> รออนุมัติ (Pending)
                      </span>
                    )}
                    {isCancelled && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-700 border border-gray-300">
                        <Ban size={13} className="text-gray-500" /> ยกเลิกแล้ว (Cancelled)
                      </span>
                    )}
                    {isRejected && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
                        <AlertCircle size={13} className="text-red-600" /> ไม่อนุมัติ (Rejected)
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Body: Topic & Date/Time Details */}
                <div className="p-4 sm:p-5 pt-3.5 space-y-3">
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-gray-900 leading-snug">
                      {b.topic}
                    </h4>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 text-xs text-gray-600">
                    {/* Date */}
                    <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <CalendarIcon size={16} className="text-red-600 shrink-0" />
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold block uppercase">
                          วันที่ประชุม
                        </span>
                        <span className="font-bold text-gray-800">{dateDisplay}</span>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <Clock size={16} className="text-blue-600 shrink-0" />
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold block uppercase">
                          เวลาใช้งาน
                        </span>
                        <span className="font-bold text-gray-800">{timeDisplay}</span>
                      </div>
                    </div>

                    {/* Participants & Format */}
                    <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-100">
                      <Users size={16} className="text-emerald-600 shrink-0" />
                      <div>
                        <span className="text-[10px] text-gray-400 font-bold block uppercase">
                          ผู้เข้าร่วม / รูปแบบ
                        </span>
                        <span className="font-bold text-gray-800">
                          {b.participants} ท่าน • {b.meetingType}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Cancelled Info Notice */}
                  {isCancelled && (
                    <div className="p-2.5 bg-gray-100/90 rounded-xl border border-gray-200 text-xs text-gray-600 space-y-0.5">
                      <div className="font-bold text-gray-700 flex items-center gap-1.5">
                        <Ban size={13} className="text-gray-500" />
                        <span>รายการนี้ถูกยกเลิกแล้ว ช่วงเวลาในห้องถูกปลดล็อกเรียบร้อย</span>
                      </div>
                      {b.cancellationReason && (
                        <div className="text-[11px] text-gray-500 pl-5">
                          เหตุผล: {b.cancellationReason}
                        </div>
                      )}
                      {b.cancelledAt && (
                        <div className="text-[10px] text-gray-400 pl-5">
                          ยกเลิกเมื่อ: {formatThaiDate(b.cancelledAt, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} น.
                        </div>
                      )}
                    </div>
                  )}

                  {/* Rejected Info Notice */}
                  {isRejected && b.rejectionReason && (
                    <div className="p-2.5 bg-red-50 rounded-xl border border-red-200 text-xs text-red-700">
                      <strong>เหตุผลที่ไม่อนุมัติ:</strong> {b.rejectionReason}
                    </div>
                  )}

                  {/* Actions Footer */}
                  <div className="pt-2 border-t border-gray-100 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {/* View Details Button */}
                      <button
                        type="button"
                        onClick={() => onViewBooking(b)}
                        className="px-3 py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-bold transition flex items-center gap-1.5"
                      >
                        <Eye size={14} className="text-gray-500" />
                        <span>ดูรายละเอียด</span>
                      </button>

                      {/* Google Calendar Sync for Approved */}
                      {isApproved && googleCalUrl && (
                        <a
                          href={googleCalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold transition flex items-center gap-1.5 border border-blue-200"
                          title="บันทึกลงใน Google Calendar ทันที"
                        >
                          <CalendarPlus size={14} />
                          <span className="hidden sm:inline">ลง Google Calendar</span>
                          <span className="sm:hidden">G-Cal</span>
                        </a>
                      )}

                      {/* Download .ics */}
                      {isApproved && (
                        <button
                          type="button"
                          onClick={() => downloadIcsFile(b, room)}
                          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs font-semibold transition border border-gray-200"
                          title="ดาวน์โหลดไฟล์ .ics สำหรับ Outlook / iOS Calendar"
                        >
                          <Download size={14} />
                        </button>
                      )}
                    </div>

                    {/* Cancel Booking Action */}
                    {(isPending || isApproved) && (
                      <button
                        type="button"
                        onClick={() => onRequestCancel(b)}
                        className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold transition flex items-center gap-1.5 border border-red-200 shadow-2xs active:scale-95 ml-auto"
                      >
                        <Ban size={14} />
                        <span>ยกเลิกการจอง</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
