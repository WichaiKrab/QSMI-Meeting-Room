import React, { useState, useMemo } from 'react';
import {
  X,
  Check,
  Ban,
  Clock,
  Users,
  Building,
  Calendar,
  AlertCircle,
  TrendingUp,
  Search,
  Eye,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { Booking, Room, UserAccount } from '../types';
import { formatThaiDate, formatThaiTime } from '../utils/thaiDate';

interface ManagerApprovalModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookings: Booking[];
  rooms: Room[];
  currentUser: UserAccount | null;
  onApproveBooking: (booking: Booking) => void;
  onRejectBooking: (booking: Booking) => void;
  onViewBooking: (booking: Booking) => void;
}

export const ManagerApprovalModal: React.FC<ManagerApprovalModalProps> = ({
  isOpen,
  onClose,
  bookings,
  rooms,
  currentUser,
  onApproveBooking,
  onRejectBooking,
  onViewBooking
}) => {
  if (!isOpen || !currentUser) return null;

  const [tab, setTab] = useState<'pending' | 'stats' | 'all'>('pending');
  const [searchTerm, setSearchTerm] = useState('');

  const deptBookings = useMemo(() => {
    return bookings.filter(
      (b) =>
        !b.isBlocked &&
        (currentUser.role === 'admin' ||
          currentUser.role === 'manager' ||
          b.department?.toLowerCase() === currentUser.department?.toLowerCase())
    );
  }, [bookings, currentUser]);

  const pendingDeptBookings = useMemo(() => {
    return deptBookings.filter((b) => b.status === 'pending');
  }, [deptBookings]);

  // Department statistics
  const deptStats = useMemo(() => {
    const total = deptBookings.length;
    const approved = deptBookings.filter((b) => b.status === 'approved');
    const totalAttendees = approved.reduce((acc, curr) => acc + (curr.participants || 0), 0);

    // Calculate total hours
    let totalMinutes = 0;
    approved.forEach((b) => {
      const s = new Date(b.startTime).getTime();
      const e = new Date(b.endTime).getTime();
      totalMinutes += Math.max(0, (e - s) / (1000 * 60));
    });
    const totalHours = (totalMinutes / 60).toFixed(1);

    // Most used rooms
    const roomCounts: Record<string, number> = {};
    approved.forEach((b) => {
      roomCounts[b.roomId] = (roomCounts[b.roomId] || 0) + 1;
    });

    const topRooms = Object.entries(roomCounts)
      .map(([roomId, count]) => {
        const r = rooms.find((x) => x.id === roomId);
        return { name: r ? r.name : 'ห้องเดิม', count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);

    return {
      total,
      approvedCount: approved.length,
      pendingCount: pendingDeptBookings.length,
      totalAttendees,
      totalHours,
      topRooms
    };
  }, [deptBookings, pendingDeptBookings, rooms]);

  const filteredDeptList = useMemo(() => {
    return deptBookings.filter((b) => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      const room = rooms.find((r) => r.id === b.roomId);
      const roomName = room ? room.name.toLowerCase() : '';
      return (
        b.topic.toLowerCase().includes(term) ||
        b.requesterName.toLowerCase().includes(term) ||
        roomName.includes(term)
      );
    });
  }, [deptBookings, searchTerm, rooms]);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-3 sm:p-4 pt-6 sm:pt-4 overflow-y-auto custom-scrollbar"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[90dvh] flex flex-col relative border-t-4 border-blue-600 overflow-hidden my-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="bg-blue-100 p-2.5 rounded-2xl text-blue-700 shrink-0">
              <Building size={22} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight truncate">
                  ระบบหัวหน้าฝ่าย (Manager Portal)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                  Manager
                </span>
              </div>
              <p className="text-xs text-gray-500 truncate mt-0.5">
                {currentUser.department} • อนุมัติคำขอและตรวจสอบสถิติของฝ่าย
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="px-5 sm:px-6 border-b border-gray-200 bg-white flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setTab('pending')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
              tab === 'pending'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Clock size={15} />
            <span>คำขอรออนุมัติของฝ่าย</span>
            {pendingDeptBookings.length > 0 && (
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-amber-500 text-white animate-pulse">
                {pendingDeptBookings.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setTab('stats')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
              tab === 'stats'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <TrendingUp size={15} />
            <span>สถิติการใช้งานของฝ่าย</span>
          </button>

          <button
            type="button"
            onClick={() => setTab('all')}
            className={`py-3 px-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-1.5 ${
              tab === 'all'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <FileText size={15} />
            <span>ประวัติของคนในฝ่าย ({deptBookings.length})</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 bg-gray-50/50">
          {/* 1. Pending Department Requests Tab */}
          {tab === 'pending' && (
            <div className="space-y-3">
              {pendingDeptBookings.length === 0 ? (
                <div className="text-center py-12 px-4 bg-white rounded-2xl border border-gray-200">
                  <CheckCircle2 size={36} className="mx-auto text-emerald-500 mb-2" />
                  <h4 className="text-base font-bold text-gray-800">
                    ไม่มีคำขอรออนุมัติในฝ่ายขณะนี้
                  </h4>
                  <p className="text-xs text-gray-500 mt-1">
                    เมื่อพนักงานในฝ่าย "{currentUser.department}" ทำรายการจอง จะปรากฏที่นี่เพื่อให้ท่านอนุมัติ
                  </p>
                </div>
              ) : (
                pendingDeptBookings.map((b) => {
                  const room = rooms.find((r) => r.id === b.roomId);
                  const startD = new Date(b.startTime);
                  const endD = new Date(b.endTime);

                  return (
                    <div
                      key={b.id}
                      className="bg-white rounded-2xl border border-amber-200 p-4 sm:p-5 shadow-2xs space-y-3"
                    >
                      <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                              รอหัวหน้าฝ่ายอนุมัติ
                            </span>
                            <span className="text-xs text-gray-400 font-mono">รหัส {b.id}</span>
                          </div>
                          <h4 className="text-sm sm:text-base font-bold text-gray-900 mt-1">
                            {b.topic}
                          </h4>
                          <p className="text-xs text-gray-500 mt-0.5">
                            ผู้ขอจอง: <strong className="text-gray-800">{b.requesterName}</strong> ({b.phone || '-'})
                          </p>
                        </div>
                        <div className="text-xs font-semibold text-gray-700 bg-gray-50 p-2 rounded-xl border border-gray-100 shrink-0">
                          <div>📍 {room ? room.name : 'ห้องประชุม'}</div>
                          <div className="text-blue-600 font-bold mt-0.5">
                            📅 {formatThaiDate(startD, { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                          <div className="text-gray-500">
                            ⏰ {formatThaiTime(startD, { hour: '2-digit', minute: '2-digit' })} - {formatThaiTime(endD, { hour: '2-digit', minute: '2-digit' })} น.
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons for Manager */}
                      <div className="pt-2 border-t border-gray-100 flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onViewBooking(b)}
                          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition flex items-center gap-1"
                        >
                          <Eye size={13} /> ดูรายละเอียด
                        </button>
                        <button
                          type="button"
                          onClick={() => onRejectBooking(b)}
                          className="px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl text-xs transition border border-red-200 flex items-center gap-1"
                        >
                          <Ban size={13} /> ปฏิเสธคำขอ
                        </button>
                        <button
                          type="button"
                          onClick={() => onApproveBooking(b)}
                          className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition shadow-xs flex items-center gap-1 active:scale-95"
                        >
                          <Check size={14} /> อนุมัติการจอง
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* 2. Department Statistics Tab */}
          {tab === 'stats' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
                  <span className="text-[11px] text-gray-400 font-bold block uppercase">การจองทั้งหมด</span>
                  <span className="text-xl font-extrabold text-gray-900 mt-1 block">{deptStats.total}</span>
                  <span className="text-[10px] text-gray-500">ครั้ง</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
                  <span className="text-[11px] text-gray-400 font-bold block uppercase">อนุมัติใช้งาน</span>
                  <span className="text-xl font-extrabold text-emerald-600 mt-1 block">{deptStats.approvedCount}</span>
                  <span className="text-[10px] text-gray-500">ครั้ง</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
                  <span className="text-[11px] text-gray-400 font-bold block uppercase">ชั่วโมงการใช้รวม</span>
                  <span className="text-xl font-extrabold text-blue-600 mt-1 block">{deptStats.totalHours}</span>
                  <span className="text-[10px] text-gray-500">ชั่วโมง</span>
                </div>
                <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
                  <span className="text-[11px] text-gray-400 font-bold block uppercase">ผู้เข้าร่วมรวม</span>
                  <span className="text-xl font-extrabold text-purple-600 mt-1 block">{deptStats.totalAttendees}</span>
                  <span className="text-[10px] text-gray-500">คน</span>
                </div>
              </div>

              {/* Top Rooms by Department */}
              <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-2xs">
                <h4 className="text-xs font-bold text-gray-500 uppercase mb-3">
                  ห้องประชุมที่ฝ่ายนิยมใช้งานมากที่สุด
                </h4>
                {deptStats.topRooms.length === 0 ? (
                  <p className="text-xs text-gray-400">ยังไม่มีสถิติห้องประชุมที่อนุมัติ</p>
                ) : (
                  <div className="space-y-2.5">
                    {deptStats.topRooms.map((r, i) => (
                      <div key={i} className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50 border border-gray-100 text-xs">
                        <span className="font-bold text-gray-800">{r.name}</span>
                        <span className="font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-lg border border-blue-100">
                          {r.count} ครั้ง
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* 3. Department History Tab */}
          {tab === 'all' && (
            <div className="space-y-3">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  placeholder="ค้นหาตามหัวข้อประชุม หรือชื่อพนักงาน..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              <div className="space-y-2">
                {filteredDeptList.map((b) => {
                  const room = rooms.find((r) => r.id === b.roomId);
                  const startD = new Date(b.startTime);
                  return (
                    <div
                      key={b.id}
                      onClick={() => onViewBooking(b)}
                      className="bg-white p-3 sm:p-3.5 rounded-xl border border-gray-200 hover:border-blue-300 transition cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                    >
                      <div>
                        <div className="font-bold text-gray-900">{b.topic}</div>
                        <div className="text-gray-500 mt-0.5">
                          ผู้ขอ: {b.requesterName} • ห้อง: {room ? room.name : '-'}
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-gray-600 font-medium">
                          {formatThaiDate(startD, { day: 'numeric', month: 'short' })}
                        </span>
                        {b.status === 'approved' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                            อนุมัติแล้ว
                          </span>
                        )}
                        {b.status === 'pending' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                            รออนุมัติ
                          </span>
                        )}
                        {b.status === 'cancelled' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700">
                            ยกเลิกแล้ว
                          </span>
                        )}
                        {b.status === 'rejected' && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                            ไม่อนุมัติ
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 sm:px-6 py-3 border-t border-gray-200 bg-white flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs sm:text-sm font-bold rounded-xl transition"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
