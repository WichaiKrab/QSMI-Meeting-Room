import React, { useState, useMemo } from 'react';
import {
  Search,
  Check,
  X,
  Send,
  Edit,
  Trash2,
  Phone,
  Clock,
  Ban,
  Filter,
  Plus,
  FileSpreadsheet
} from 'lucide-react';
import { Booking, Room } from '../types';
import { formatThaiDate, formatThaiTime } from '../utils/thaiDate';

interface AdminManageTableProps {
  bookings: Booking[];
  rooms: Room[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onResendEmail: (booking: Booking) => void;
  onEdit: (booking: Booking) => void;
  onDelete: (id: string) => void;
  onOpenBlockModal: () => void;
  onOpenRoomModal: () => void;
  onExportCSV: () => void;
}

export const AdminManageTable: React.FC<AdminManageTableProps> = ({
  bookings,
  rooms,
  onApprove,
  onReject,
  onResendEmail,
  onEdit,
  onDelete,
  onOpenBlockModal,
  onOpenRoomModal,
  onExportCSV
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchDate, setSearchDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [visibleCount, setVisibleCount] = useState(10);

  const filteredBookings = useMemo(() => {
    return bookings
      .filter((b) => {
        const room = rooms.find((r) => r.id === b.roomId);
        const roomName = room ? room.name : '';
        const term = searchTerm.toLowerCase();
        const matchesTerm =
          b.topic.toLowerCase().includes(term) ||
          b.requesterName.toLowerCase().includes(term) ||
          (b.department && b.department.toLowerCase().includes(term)) ||
          (b.phone && b.phone.includes(term)) ||
          roomName.toLowerCase().includes(term);

        const bDateStr = new Date(b.startTime).toISOString().split('T')[0];
        const matchesDate = searchDate ? bDateStr === searchDate : true;
        const matchesStatus = statusFilter === 'all' ? true : b.status === statusFilter;

        return matchesTerm && matchesDate && matchesStatus;
      })
      .sort((a, b) => {
        const timeA = new Date(a.createdAt || a.startTime).getTime();
        const timeB = new Date(b.createdAt || b.startTime).getTime();
        return timeB - timeA;
      });
  }, [bookings, searchTerm, searchDate, statusFilter, rooms]);

  const visibleList = filteredBookings.slice(0, visibleCount);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Top Filter & Actions */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-3">
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          {/* Search Input */}
          <div className="relative flex-1 sm:flex-initial min-w-[200px]">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              placeholder="ค้นหาหัวข้อ ผู้จอง แผนก หรือห้อง..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#C8102E]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="p-2 px-3 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-[#C8102E]"
          >
            <option value="all">สถานะ: ทั้งหมด</option>
            <option value="pending">⏳ รออนุมัติ (Pending)</option>
            <option value="approved">✅ อนุมัติแล้ว (Approved)</option>
            <option value="rejected">❌ ปฏิเสธแล้ว (Rejected)</option>
          </select>

          {/* Date Picker */}
          <input
            type="date"
            value={searchDate}
            onChange={(e) => setSearchDate(e.target.value)}
            className="p-2 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-[#C8102E]"
          />

          {searchDate && (
            <button
              type="button"
              onClick={() => setSearchDate('')}
              className="text-xs text-gray-500 hover:text-red-600 underline"
            >
              ล้างวันที่
            </button>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto justify-end">
          <button
            type="button"
            onClick={onOpenBlockModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-red-100 hover:bg-red-200 text-red-700 rounded-xl text-xs sm:text-sm font-bold transition border border-red-200"
          >
            <Ban size={15} />
            <span>ปิดกั้นวัน</span>
          </button>

          <button
            type="button"
            onClick={onOpenRoomModal}
            className="flex items-center gap-1.5 px-3 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-xs"
          >
            <span>จัดการห้อง ({rooms.length})</span>
          </button>

          <button
            type="button"
            onClick={onExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-xs"
          >
            <FileSpreadsheet size={15} />
            <span>Excel (CSV)</span>
          </button>
        </div>
      </div>

      {/* MOBILE LIST VIEW */}
      <div className="md:hidden space-y-3">
        {visibleList.length === 0 ? (
          <div className="py-12 text-center text-gray-400 text-xs">
            ไม่พบรายการจองตามเงื่อนไขค้นหา
          </div>
        ) : (
          visibleList.map((b) => {
            const room = rooms.find((r) => r.id === b.roomId);
            const isPending = b.status === 'pending' && !b.isBlocked;
            const isApproved = b.status === 'approved' && !b.isBlocked;
            const isRejected = b.status === 'rejected';

            const startD = new Date(b.startTime);
            const endD = new Date(b.endTime);
            const dateStr = formatThaiDate(startD, { day: 'numeric', month: 'short', year: 'numeric' });
            const timeStr = `${formatThaiTime(startD, { hour: '2-digit', minute: '2-digit' })} - ${formatThaiTime(endD, { hour: '2-digit', minute: '2-digit' })} น.`;

            return (
              <div
                key={b.id}
                className={`bg-white rounded-2xl shadow-sm border p-4 space-y-2.5 transition ${
                  isPending
                    ? 'border-amber-300 border-l-4'
                    : b.isBlocked
                      ? 'border-red-300 bg-red-50/50'
                      : 'border-gray-200'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {b.isBlocked && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-200 text-red-800">
                        ปิดกั้น
                      </span>
                    )}
                    {isPending && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1">
                        <Clock size={10} /> รออนุมัติ
                      </span>
                    )}
                    {isApproved && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                        อนุมัติแล้ว
                      </span>
                    )}
                    {isRejected && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-700">
                        ปฏิเสธแล้ว
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-gray-400 font-mono">#{b.id}</span>
                </div>

                <div>
                  <div className="font-bold text-sm text-gray-900 leading-snug">{b.topic}</div>
                  <div className="text-xs text-blue-700 font-semibold mt-0.5">
                    {room?.name || 'ห้องถูกลบ'}
                  </div>
                </div>

                <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-2.5 rounded-xl">
                  <div>
                    <strong>ผู้จอง:</strong> {b.requesterName} ({b.department || '-'})
                  </div>
                  <div>
                    <strong>เวลา:</strong> {dateStr} • {timeStr}
                  </div>
                  {b.participants > 0 && (
                    <div>
                      <strong>ผู้เข้าร่วม:</strong> {b.participants} ท่าน ({b.meetingType})
                    </div>
                  )}
                </div>

                {/* Mobile Action Buttons */}
                <div className="pt-1 flex flex-wrap gap-2 justify-end items-center">
                  {isPending && (
                    <>
                      <button
                        type="button"
                        onClick={() => onApprove(b.id)}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1"
                      >
                        <Check size={14} /> อนุมัติ
                      </button>
                      <button
                        type="button"
                        onClick={() => onReject(b.id)}
                        className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-1"
                      >
                        <X size={14} /> ปฏิเสธ
                      </button>
                    </>
                  )}

                  {!b.isBlocked && b.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => onResendEmail(b)}
                      className="p-2 text-blue-700 hover:bg-blue-50 rounded-xl transition"
                      title="ส่งอีเมลแจ้งเตือนซ้ำ"
                    >
                      <Send size={15} />
                    </button>
                  )}

                  {!b.isBlocked && b.status !== 'cancelled' && (
                    <button
                      type="button"
                      onClick={() => onEdit(b)}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition"
                      title="แก้ไขข้อมูล"
                    >
                      <Edit size={15} />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onDelete(b.id)}
                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition"
                    title="ลบรายการ"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden md:block bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-100/80 text-gray-700 font-bold border-b border-gray-200">
                <th className="p-3">สถานะ</th>
                <th className="p-3">รหัส / บันทึกเมื่อ</th>
                <th className="p-3">ห้องประชุม</th>
                <th className="p-3">หัวข้อการประชุม</th>
                <th className="p-3">ผู้จอง / แผนก</th>
                <th className="p-3">วันและเวลา</th>
                <th className="p-3">จำนวน / รูปแบบ</th>
                <th className="p-3 text-center">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {visibleList.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-12 text-center text-gray-400">
                    ไม่พบรายการจองห้องประชุม
                  </td>
                </tr>
              ) : (
                visibleList.map((b) => {
                  const room = rooms.find((r) => r.id === b.roomId);
                  const isPending = b.status === 'pending' && !b.isBlocked;
                  const isApproved = b.status === 'approved' && !b.isBlocked;
                  const isRejected = b.status === 'rejected';

                  const startD = new Date(b.startTime);
                  const endD = new Date(b.endTime);
                  const isMultiDay = startD.getDate() !== endD.getDate();

                  return (
                    <tr
                      key={b.id}
                      className={`hover:bg-gray-50/70 transition ${
                        b.isBlocked ? 'bg-red-50/40' : ''
                      }`}
                    >
                      {/* Status */}
                      <td className="p-3">
                        {b.isBlocked ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-200 text-red-800">
                            ปิดกั้น
                          </span>
                        ) : isPending ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 flex items-center gap-1 w-fit">
                            <Clock size={10} /> รออนุมัติ
                          </span>
                        ) : isApproved ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-100 text-green-800">
                            อนุมัติแล้ว
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-gray-200 text-gray-700">
                            ปฏิเสธ
                          </span>
                        )}
                      </td>

                      {/* Code / Created At */}
                      <td className="p-3 font-mono">
                        <div className="font-bold text-gray-900">{b.id}</div>
                        <div className="text-[10px] text-gray-400">
                          {formatThaiDate(b.createdAt, { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </div>
                      </td>

                      {/* Room */}
                      <td className="p-3 font-semibold text-blue-800 max-w-[140px] truncate">
                        {room?.name || 'ห้องถูกลบ'}
                      </td>

                      {/* Topic */}
                      <td className="p-3 font-bold text-gray-900 max-w-[180px] truncate" title={b.topic}>
                        {b.topic}
                      </td>

                      {/* Requester / Dept */}
                      <td className="p-3">
                        <div className="font-semibold text-gray-800">{b.requesterName}</div>
                        <div className="text-[11px] text-gray-500">{b.department || '-'}</div>
                      </td>

                      {/* DateTime */}
                      <td className="p-3">
                        <div className="font-semibold text-gray-800">
                          {formatThaiDate(startD, { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          {isMultiDay
                            ? `ถึง ${formatThaiDate(endD, { day: 'numeric', month: 'short', year: 'numeric' })}`
                            : `${formatThaiTime(startD, { hour: '2-digit', minute: '2-digit' })} - ${formatThaiTime(endD, { hour: '2-digit', minute: '2-digit' })} น.`}
                        </div>
                      </td>

                      {/* Participants & Format */}
                      <td className="p-3">
                        <span className="font-semibold">{b.participants} คน</span>
                        <span className="text-[10px] text-gray-400 block">{b.meetingType}</span>
                      </td>

                      {/* Actions */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isPending && (
                            <>
                              <button
                                type="button"
                                onClick={() => onApprove(b.id)}
                                className="p-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-700 rounded-lg transition"
                                title="อนุมัติการจอง"
                              >
                                <Check size={15} />
                              </button>
                              <button
                                type="button"
                                onClick={() => onReject(b.id)}
                                className="p-1.5 bg-red-100 hover:bg-red-200 text-red-700 rounded-lg transition"
                                title="ปฏิเสธการจอง"
                              >
                                <X size={15} />
                              </button>
                            </>
                          )}

                          {!b.isBlocked && b.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => onResendEmail(b)}
                              className="p-1.5 text-blue-700 hover:bg-blue-50 rounded-lg transition"
                              title="ส่งอีเมลแจ้งเตือนซ้ำ"
                            >
                              <Send size={14} />
                            </button>
                          )}

                          {!b.isBlocked && b.status !== 'cancelled' && (
                            <button
                              type="button"
                              onClick={() => onEdit(b)}
                              className="p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                              title="แก้ไข"
                            >
                              <Edit size={14} />
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onDelete(b.id)}
                            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="ลบรายการ"
                          >
                            <Trash2 size={14} />
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

        {/* Load More Button */}
        {filteredBookings.length > visibleCount && (
          <div className="p-3 text-center border-t border-gray-100 bg-gray-50/50">
            <button
              type="button"
              onClick={() => setVisibleCount((prev) => prev + 10)}
              className="px-4 py-1.5 text-xs font-bold text-gray-700 hover:text-black bg-white hover:bg-gray-100 border border-gray-200 rounded-xl shadow-2xs transition"
            >
              แสดงเพิ่ม (+10 รายการ)
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
