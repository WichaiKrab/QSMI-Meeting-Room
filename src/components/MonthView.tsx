import React, { useState } from 'react';
import { Plus, Ban, Clock, Calendar as CalendarIcon, ChevronRight } from 'lucide-react';
import { Room, Booking } from '../types';
import {
  WEEK_DAY_NAMES,
  getMonthDays,
  isSameDay,
  formatThaiDate,
  formatThaiTime
} from '../utils/thaiDate';

interface MonthViewProps {
  currentDate: Date;
  rooms: Room[];
  bookings: Booking[];
  isAdminMode: boolean;
  onSlotClick: (room: Room, time: string, customDate: Date) => void;
  onViewBooking: (booking: Booking) => void;
  onSelectDay?: (date: Date) => void;
  onEditBooking?: (booking: Booking) => void;
  onDeleteBooking?: (id: string) => void;
}

export const MonthView: React.FC<MonthViewProps> = ({
  currentDate,
  rooms,
  bookings,
  isAdminMode,
  onSlotClick,
  onViewBooking,
  onSelectDay,
  onEditBooking,
  onDeleteBooking
}) => {
  const [selectedRoomId, setSelectedRoomId] = useState<string>('all');
  const [selectedCellDate, setSelectedCellDate] = useState<Date>(currentDate);

  const monthDays = getMonthDays(currentDate);
  const isAllRooms = selectedRoomId === 'all';
  const targetRoom = isAllRooms ? null : rooms.find((r) => r.id === selectedRoomId);
  const bookableRoom = targetRoom || rooms.find((r) => r.isActive) || rooms[0];

  // Filter bookings for the selected cell date
  const cellStart = new Date(selectedCellDate);
  cellStart.setHours(0, 0, 0, 0);
  const cellEnd = new Date(selectedCellDate);
  cellEnd.setHours(23, 59, 59, 999);

  const selectedDayBookings = bookings
    .filter((b) => {
      if (b.status === 'rejected' || b.status === 'cancelled') return false;
      if (selectedRoomId !== 'all' && b.roomId !== selectedRoomId) return false;
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return bEnd >= cellStart && bStart <= cellEnd;
    })
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return (
    <div className="space-y-3 sm:space-y-4 flex-1 min-h-0 flex flex-col overflow-y-auto no-scrollbar">
      {/* Filter Bar */}
      <div className="bg-white p-2.5 sm:p-4 rounded-2xl shadow-sm border border-gray-200 flex items-center justify-between gap-2 sm:gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto min-w-0">
          <label htmlFor="month-room-select" className="text-xs font-bold text-gray-700 whitespace-nowrap shrink-0">
            เลือกห้องประชุม:
          </label>
          <select
            id="month-room-select"
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="flex-1 sm:w-auto p-2 px-2.5 sm:px-3 border border-gray-300 rounded-xl text-xs sm:text-sm font-bold bg-white text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E] min-w-0 truncate"
          >
            <option value="all">ทุกห้องประชุม (แสดงภาพรวมทั้งเดือน)</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} {!r.isActive ? '(ปิดปรับปรุง)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="text-xs font-medium text-gray-500 hidden sm:block whitespace-nowrap shrink-0">
          คลิกวันที่เพื่อดูรายละเอียดรายการจองทั้งหมด
        </div>
      </div>

      {/* Month Calendar Matrix */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {/* Days of Week Header */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-100/80 text-center text-xs font-bold text-gray-600 py-2.5">
          {WEEK_DAY_NAMES.map((name, i) => (
            <div key={i} className={i === 0 || i === 6 ? 'text-red-600' : ''}>
              {name}
            </div>
          ))}
        </div>

        {/* Days Cells Grid */}
        <div className="grid grid-cols-7 border-collapse">
          {monthDays.map((dayItem, idx) => {
            const { date: cellDate, isCurrentMonth } = dayItem;
            const isToday = isSameDay(cellDate, new Date());
            const isSelected = isSameDay(cellDate, selectedCellDate);

            const dStart = new Date(cellDate);
            dStart.setHours(0, 0, 0, 0);
            const dEnd = new Date(cellDate);
            dEnd.setHours(23, 59, 59, 999);

            const dayBookings = bookings.filter((b) => {
              if (b.status === 'rejected' || b.status === 'cancelled') return false;
              if (selectedRoomId !== 'all' && b.roomId !== selectedRoomId) return false;
              const bStart = new Date(b.startTime);
              const bEnd = new Date(b.endTime);
              return bEnd >= dStart && bStart <= dEnd;
            });

            const hasPending = dayBookings.some((b) => b.status === 'pending');
            const hasBlocked = dayBookings.some((b) => b.isBlocked);
            const hasApproved = dayBookings.some((b) => (!b.status || b.status === 'approved') && !b.isBlocked);

            const maxVisible = 2;
            const visibleBookings = dayBookings.slice(0, maxVisible);
            const overflow = dayBookings.length - maxVisible;

            return (
              <div
                key={idx}
                onClick={() => setSelectedCellDate(cellDate)}
                className={`min-h-[75px] sm:min-h-[110px] p-1 sm:p-2 border-b border-r border-gray-200 flex flex-col transition group relative ${
                  !isCurrentMonth ? 'bg-gray-50/50 text-gray-400' : 'bg-white hover:bg-red-50/20 cursor-pointer'
                } ${isSelected ? 'ring-2 ring-inset ring-[#C8102E]/40 bg-red-50/30' : ''}`}
              >
                {/* Day Number and Badges */}
                <div className="flex items-center justify-between mb-1">
                  <span
                    className={`text-xs font-bold inline-flex items-center justify-center w-6 h-6 rounded-full ${
                      isToday
                        ? 'bg-[#C8102E] text-white shadow-xs'
                        : isSelected
                          ? 'text-[#C8102E] font-extrabold'
                          : isCurrentMonth
                            ? 'text-gray-800'
                            : 'text-gray-400'
                    }`}
                  >
                    {cellDate.getDate()}
                  </span>

                  {/* Dot Indicators for Mobile */}
                  <div className="flex sm:hidden items-center gap-0.5">
                    {hasApproved && <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />}
                    {hasPending && <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />}
                    {hasBlocked && <span className="w-1.5 h-1.5 rounded-full bg-red-500" />}
                  </div>

                  {/* Quick Add Button on Desktop */}
                  {isCurrentMonth && targetRoom && targetRoom.isActive && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSlotClick(targetRoom, '09:00', cellDate);
                      }}
                      className="hidden sm:inline-flex opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-[#C8102E] hover:bg-red-50 rounded transition text-[11px] items-center gap-0.5"
                      title="จองห้องนี้ในวันนี้"
                    >
                      <Plus size={12} /> <span className="font-semibold">จอง</span>
                    </button>
                  )}
                </div>

                {/* Desktop Booking Pills */}
                <div className="hidden sm:flex flex-col gap-1 flex-1 overflow-hidden">
                  {visibleBookings.map((b) => {
                    const room = rooms.find((r) => r.id === b.roomId);
                    const bStart = new Date(b.startTime);
                    const timeText = formatThaiTime(bStart, { hour: '2-digit', minute: '2-digit' });

                    let pillClass = 'bg-blue-50 text-blue-900 border-blue-200 hover:bg-blue-100';
                    if (b.isBlocked) {
                      pillClass = 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
                    } else if (b.status === 'pending') {
                      pillClass = 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100';
                    }

                    return (
                      <div
                        key={b.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isAdminMode && onEditBooking) onEditBooking(b);
                          else onViewBooking(b);
                        }}
                        className={`text-[11px] p-1 px-1.5 rounded-lg border truncate cursor-pointer transition font-semibold flex items-center gap-1 ${pillClass}`}
                        title={`${timeText} ${room ? `[${room.name}]` : ''} ${b.topic}`}
                      >
                        <span className="font-bold shrink-0">{timeText}</span>
                        <span className="truncate">{b.topic}</span>
                      </div>
                    );
                  })}

                  {overflow > 0 && (
                    <span className="text-[10px] font-bold text-gray-500 hover:text-[#C8102E] block pt-0.5">
                      + อีก {overflow} รายการ
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Day Bookings Detail Panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-3.5 sm:p-5 space-y-3">
        <div className="flex items-center justify-between border-b border-gray-100 pb-2.5 sm:pb-3 gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="font-bold text-xs sm:text-base text-gray-900 flex items-center gap-1.5 truncate whitespace-nowrap">
              <CalendarIcon size={16} className="text-[#C8102E] shrink-0" />
              <span className="truncate">
                {formatThaiDate(selectedCellDate, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </span>
            </h3>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 truncate whitespace-nowrap">
              {selectedDayBookings.length > 0
                ? `พบรายการจองทั้งหมด ${selectedDayBookings.length} รายการ`
                : 'ไม่มีรายการจองห้องประชุมในวันนี้ (ห้องว่าง)'}
            </p>
          </div>

          <div className="shrink-0 flex items-center">
            {isAllRooms ? (
              <button
                type="button"
                onClick={() => onSelectDay?.(selectedCellDate)}
                className="text-xs sm:text-sm flex items-center gap-1 text-gray-700 bg-gray-100 hover:bg-gray-200 px-3 sm:px-3.5 py-1.5 sm:py-2 rounded-xl font-bold border border-gray-200 shadow-2xs transition whitespace-nowrap shrink-0"
              >
                <span>เปิดมุมมองวัน</span>
                <ChevronRight size={14} className="shrink-0" />
              </button>
            ) : (
              targetRoom && targetRoom.isActive && (
                <button
                  type="button"
                  onClick={() => onSlotClick(targetRoom, '09:00', selectedCellDate)}
                  className="text-xs sm:text-sm flex items-center gap-1 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl font-bold bg-[#C8102E] hover:bg-[#a00c24] shadow-xs transition whitespace-nowrap shrink-0"
                >
                  <Plus size={14} className="shrink-0" />
                  <span>จองวันนี้</span>
                </button>
              )
            )}
          </div>
        </div>

        {/* Selected Day Bookings Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {selectedDayBookings.length > 0 ? (
            selectedDayBookings.map((b) => {
              const room = rooms.find((r) => r.id === b.roomId);
              const bStart = new Date(b.startTime);
              const bEnd = new Date(b.endTime);
              const isPending = b.status === 'pending';
              const isBlocked = b.isBlocked;
              const isMultiDay = bStart.getDate() !== bEnd.getDate();

              const timeText = isMultiDay
                ? 'ตลอดวัน'
                : `${formatThaiTime(bStart, { hour: '2-digit', minute: '2-digit' })} - ${formatThaiTime(bEnd, { hour: '2-digit', minute: '2-digit' })}`;

              if (isBlocked) {
                return (
                  <div
                    key={b.id}
                    onClick={() => {
                      if (isAdminMode && onDeleteBooking) onDeleteBooking(b.id);
                    }}
                    className="text-xs bg-red-50 p-3 rounded-xl border border-red-200 text-red-700 font-bold flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-1.5 truncate min-w-0">
                      <Ban size={15} className="text-red-500 shrink-0" />
                      <span className="truncate">{b.topic}</span>
                    </div>
                    <span className="text-[10px] bg-red-200 text-red-800 px-2 py-0.5 rounded shrink-0 whitespace-nowrap">
                      ปิดปรับปรุง
                    </span>
                  </div>
                );
              }

              return (
                <div
                  key={b.id}
                  onClick={() => {
                    if (isAdminMode && onEditBooking) onEditBooking(b);
                    else onViewBooking(b);
                  }}
                  className={`p-3 rounded-xl border transition cursor-pointer hover:shadow-xs flex flex-col justify-between gap-2 ${
                    isPending ? 'bg-amber-50/70 border-amber-200' : 'bg-blue-50/40 border-blue-200'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-xs sm:text-sm text-gray-800 truncate flex items-center gap-1 min-w-0">
                        {isPending && <Clock size={12} className="text-amber-600 shrink-0" />}
                        <span className="truncate">{b.topic}</span>
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap shrink-0 ${
                          isPending ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {isPending ? 'รออนุมัติ' : 'อนุมัติ'}
                      </span>
                    </div>
                    <div className="text-xs text-blue-700 font-medium truncate">
                      {room?.name}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1.5 border-t border-black/5 gap-2">
                    <span className="truncate min-w-0">{b.requesterName} ({b.department || '-'})</span>
                    <span className="font-bold text-gray-700 shrink-0 bg-white px-2 py-0.5 rounded border border-gray-200 whitespace-nowrap">
                      {timeText}
                    </span>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="col-span-full py-6 text-center text-gray-400 text-xs sm:text-sm">
              ไม่มีรายการจองห้องประชุมในวันนี้
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
