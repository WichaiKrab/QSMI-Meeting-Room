import React, { useState } from 'react';
import { Plus, Ban, Clock, Users, ChevronRight } from 'lucide-react';
import { Room, Booking } from '../types';
import {
  START_HOUR,
  START_MINUTE,
  END_HOUR,
  END_MINUTE,
  SLOT_HEIGHT,
  TIME_SLOTS,
  WEEK_DAY_NAMES,
  THAI_MONTHS_SHORT,
  getWeekDays,
  isSameDay,
  formatThaiTime,
  getPositionStyles
} from '../utils/thaiDate';

interface WeekViewProps {
  currentDate: Date;
  rooms: Room[];
  bookings: Booking[];
  isAdminMode: boolean;
  onSlotClick: (room: Room, time: string, customDate: Date) => void;
  onViewBooking: (booking: Booking) => void;
  onSelectDay: (date: Date) => void;
  onEditBooking?: (booking: Booking) => void;
  onDeleteBooking?: (id: string) => void;
}

export const WeekView: React.FC<WeekViewProps> = ({
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
  const weekDays = getWeekDays(currentDate);

  const weekStart = new Date(weekDays[0]);
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekDays[6]);
  weekEnd.setHours(23, 59, 59, 999);

  const filteredBookings = bookings.filter((b) => {
    if (b.status === 'rejected' || b.status === 'cancelled') return false;
    if (selectedRoomId !== 'all' && b.roomId !== selectedRoomId) return false;
    const bStart = new Date(b.startTime);
    const bEnd = new Date(b.endTime);
    return bEnd >= weekStart && bStart <= weekEnd;
  });

  const isAllRooms = selectedRoomId === 'all';
  const targetRoom = isAllRooms ? null : rooms.find((r) => r.id === selectedRoomId);

  return (
    <div className="space-y-3 sm:space-y-4 flex-1 min-h-0 flex flex-col">
      {/* Filter Bar */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl shadow-sm border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs font-bold uppercase text-gray-500 whitespace-nowrap">
            เลือกห้องประชุม:
          </span>
          <select
            value={selectedRoomId}
            onChange={(e) => setSelectedRoomId(e.target.value)}
            className="w-full sm:w-auto p-2 px-3 border border-gray-300 rounded-xl text-xs sm:text-sm font-bold bg-white text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
          >
            <option value="all">ทุกห้องประชุม (แสดงภาพรวม)</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} {!r.isActive ? '(ปิดปรับปรุง)' : ''}
              </option>
            ))}
          </select>
        </div>
        <div className="text-xs font-medium text-gray-500 hidden sm:block">
          {isAllRooms ? (
            <span>คลิกวันด้านบนเพื่อดูภาพรวมทุกห้องในมุมมองวัน</span>
          ) : (
            <span>คลิกช่องว่างเพื่อจองห้อง {targetRoom?.name} ในวันและเวลาที่เลือก</span>
          )}
        </div>
      </div>

      {/* MOBILE WEEK VIEW (7-Day List) */}
      <div className="md:hidden space-y-3">
        {weekDays.map((dayDate, dayIdx) => {
          const isTodayDate = isSameDay(dayDate, new Date());
          const dStart = new Date(dayDate);
          dStart.setHours(0, 0, 0, 0);
          const dEnd = new Date(dayDate);
          dEnd.setHours(23, 59, 59, 999);

          const dayBookings = filteredBookings
            .filter((b) => {
              const bStart = new Date(b.startTime);
              const bEnd = new Date(b.endTime);
              return bEnd >= dStart && bStart <= dEnd;
            })
            .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

          return (
            <div
              key={dayIdx}
              className={`bg-white rounded-2xl shadow-sm border overflow-hidden transition ${
                isTodayDate ? 'border-[#C8102E]/50 ring-1 ring-[#C8102E]/20' : 'border-gray-200'
              }`}
            >
              {/* Day Header */}
              <div
                className={`p-3.5 border-b flex items-center justify-between transition ${
                  isTodayDate ? 'bg-red-50/70 border-red-100' : 'bg-gray-50/80 border-gray-100'
                } ${isAllRooms ? 'cursor-pointer hover:bg-red-50/40' : ''}`}
                onClick={() => {
                  if (isAllRooms) onSelectDay(dayDate);
                }}
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${
                      isTodayDate
                        ? 'bg-[#C8102E] text-white shadow-xs'
                        : dayIdx === 0 || dayIdx === 6
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    {dayDate.getDate()}
                  </span>
                  <div>
                    <span
                      className={`text-xs font-bold ${dayIdx === 0 || dayIdx === 6 ? 'text-red-600' : 'text-gray-800'}`}
                    >
                      วัน{WEEK_DAY_NAMES[dayIdx]}
                    </span>
                    <span className="text-xs text-gray-500 ml-1.5 font-medium">
                      {dayDate.getDate()} {THAI_MONTHS_SHORT[dayDate.getMonth()]}{' '}
                      {dayDate.getFullYear() + 543}
                    </span>
                    {isTodayDate && (
                      <span className="ml-2 text-[10px] font-bold bg-red-100 text-[#C8102E] px-2 py-0.5 rounded-full">
                        วันนี้
                      </span>
                    )}
                  </div>
                </div>

                {isAllRooms ? (
                  <span className="text-xs text-gray-500 font-bold flex items-center gap-0.5 hover:text-[#C8102E]">
                    ดูมุมมองวัน <ChevronRight size={14} />
                  </span>
                ) : (
                  targetRoom &&
                  targetRoom.isActive && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSlotClick(targetRoom, undefined, dayDate);
                      }}
                      className="text-xs flex items-center gap-1 text-white px-2.5 py-1 rounded-xl shadow-xs transition font-bold bg-[#1a1a1a] hover:bg-black"
                    >
                      <Plus size={12} /> จอง
                    </button>
                  )
                )}
              </div>

              {/* Day Bookings */}
              <div className="p-3 space-y-2">
                {dayBookings.length > 0 ? (
                  dayBookings.map((b) => {
                    const room = rooms.find((r) => r.id === b.roomId);
                    const bStart = new Date(b.startTime);
                    const bEnd = new Date(b.endTime);
                    const isPending = b.status === 'pending';
                    const isBlocked = b.isBlocked;
                    const isMultiDay = bStart.getDate() !== bEnd.getDate();

                    const timeText = isMultiDay
                      ? 'ตลอดวัน (ต่อเนื่อง)'
                      : `${formatThaiTime(bStart, { hour: '2-digit', minute: '2-digit' })} - ${formatThaiTime(bEnd, { hour: '2-digit', minute: '2-digit' })}`;

                    if (isBlocked) {
                      return (
                        <div
                          key={b.id}
                          onClick={() => {
                            if (isAdminMode && onDeleteBooking) onDeleteBooking(b.id);
                          }}
                          className="text-xs bg-red-50 p-2.5 rounded-xl border border-red-200 text-red-700 font-bold flex items-center justify-between gap-2"
                        >
                          <div className="flex items-center gap-1.5 truncate">
                            <Ban size={14} className="text-red-500 shrink-0" />
                            <span className="truncate">
                              {b.topic} ({room?.name})
                            </span>
                          </div>
                          <span className="text-[10px] bg-red-200 text-red-800 px-2 py-0.5 rounded shrink-0">
                            ปิดกั้น
                          </span>
                        </div>
                      );
                    }

                    return (
                      <div
                        key={b.id}
                        onClick={() => {
                          onViewBooking(b);
                        }}
                        className={`p-2.5 rounded-xl border transition cursor-pointer hover:bg-gray-50 flex flex-col gap-1 ${
                          isPending
                            ? 'bg-amber-50/70 border-amber-200'
                            : 'bg-blue-50/40 border-blue-200'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="font-bold text-xs text-gray-800 flex items-center gap-1 truncate">
                            {isPending && <Clock size={12} className="text-amber-600 shrink-0" />}
                            <span className="truncate">{b.topic}</span>
                          </div>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded whitespace-nowrap ${
                              isPending
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-green-100 text-green-800'
                            }`}
                          >
                            {isPending ? 'รออนุมัติ' : 'อนุมัติ'}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-gray-500">
                          <span className="text-blue-700 font-medium truncate">
                            {room?.name.split(' (')[0]}
                          </span>
                          <span className="bg-white px-2 py-0.5 rounded-md border border-gray-200 font-semibold text-gray-700 shrink-0">
                            {timeText}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-center text-gray-400 font-medium py-2">
                    ว่าง ไม่มีรายการจอง
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP WEEK VIEW (7-COL TIMELINE) */}
      <div className="hidden md:flex bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200 flex-col flex-1 min-h-0 w-full">
        <div className="overflow-y-auto overflow-x-hidden no-scrollbar h-full w-full">
          <div className="w-full min-w-full">
            {/* Header: 7 Days */}
            <div
              className="grid border-b border-gray-200 bg-gray-50 sticky top-0 z-20 shadow-xs"
              style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}
            >
              <div className="p-3 border-r border-gray-200 text-gray-500 text-center font-bold text-xs flex flex-col justify-center bg-gray-50 sticky left-0 z-30 shadow-[4px_0_12px_-2px_rgba(0,0,0,0.06)]">
                เวลา / วัน
              </div>
              {weekDays.map((dayDate, idx) => {
                const isTodayDate = isSameDay(dayDate, new Date());
                return (
                  <div
                    key={idx}
                    className={`p-3 border-r border-gray-200 last:border-r-0 text-center cursor-pointer transition hover:bg-gray-100 ${
                      isTodayDate ? 'bg-red-50/70' : 'bg-gray-50'
                    }`}
                    onClick={() => onSelectDay(dayDate)}
                    title="คลิกเพื่อเปิดมุมมองวัน"
                  >
                    <div
                      className={`text-xs font-semibold ${idx === 0 || idx === 6 ? 'text-red-600' : 'text-gray-500'}`}
                    >
                      วัน{WEEK_DAY_NAMES[idx]}
                    </div>
                    <div
                      className={`text-sm font-bold inline-flex items-center justify-center w-7 h-7 rounded-full my-0.5 ${
                        isTodayDate ? 'bg-[#C8102E] text-white shadow-xs' : 'text-gray-900'
                      }`}
                    >
                      {dayDate.getDate()}
                    </div>
                    <div className="text-[11px] text-gray-400 font-medium">
                      {THAI_MONTHS_SHORT[dayDate.getMonth()]}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Time Slot Rows for Week */}
            <div className="relative">
              {TIME_SLOTS.map((time) => (
                <div
                  key={time}
                  className="grid border-b border-gray-100 last:border-b-0"
                  style={{ height: `${SLOT_HEIGHT}px`, gridTemplateColumns: '80px repeat(7, 1fr)' }}
                >
                  <div className="border-r border-gray-200 px-2 py-1 text-xs text-gray-400 font-semibold text-right bg-gray-50/80 sticky left-0 z-10 shadow-[4px_0_12px_-2px_rgba(0,0,0,0.04)] select-none">
                    {time}
                  </div>
                  {weekDays.map((dayDate, dayIdx) => {
                    const slotTime = new Date(dayDate);
                    const [h, m] = time.split(':');
                    slotTime.setHours(parseInt(h), parseInt(m), 0, 0);
                    const isPast = slotTime < new Date();
                    const isRoomActive = isAllRooms ? true : targetRoom ? targetRoom.isActive : false;

                    return (
                      <div
                        key={dayIdx}
                        className={`border-r border-gray-100 last:border-r-0 relative transition group ${
                          !isRoomActive
                            ? 'bg-gray-100/50 cursor-not-allowed'
                            : isPast
                              ? 'bg-gray-50/30 cursor-not-allowed'
                              : 'hover:bg-blue-50/30 cursor-pointer'
                        }`}
                        onClick={() => {
                          if (isPast || !isRoomActive) return;
                          if (isAllRooms) {
                            onSelectDay(dayDate);
                          } else if (targetRoom) {
                            onSlotClick(targetRoom, time, dayDate);
                          }
                        }}
                      >
                        {!isPast && isRoomActive && !isAllRooms && targetRoom && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                            <div className="rounded-full p-1 text-white shadow bg-[#C8102E]">
                              <Plus size={13} />
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}

              {/* Render Booking Blocks on Week Grid */}
              {(() => {
                const timeColWidth = 80;

                return filteredBookings.flatMap((booking) => {
                  const bStart = new Date(booking.startTime);
                  const bEnd = new Date(booking.endTime);
                  const room = rooms.find((r) => r.id === booking.roomId);
                  const isPending = booking.status === 'pending';
                  const isBlocked = booking.isBlocked;

                  return weekDays.map((dayDate, dayIdx) => {
                    const dayViewStart = new Date(dayDate);
                    dayViewStart.setHours(START_HOUR, START_MINUTE, 0, 0);
                    const dayViewEnd = new Date(dayDate);
                    dayViewEnd.setHours(END_HOUR, END_MINUTE, 0, 0);

                    const effectiveStart = bStart < dayViewStart ? dayViewStart : bStart;
                    const effectiveEnd = bEnd > dayViewEnd ? dayViewEnd : bEnd;
                    if (effectiveStart >= effectiveEnd) return null;

                    const dayStartZero = new Date(dayDate);
                    dayStartZero.setHours(0, 0, 0, 0);
                    const dayEndMax = new Date(dayDate);
                    dayEndMax.setHours(23, 59, 59, 999);
                    if (bEnd < dayStartZero || bStart > dayEndMax) return null;

                    const { topPx, heightPx } = getPositionStyles(effectiveStart, effectiveEnd);
                    const isMultiDay = bStart.getDate() !== bEnd.getDate();

                    if (isBlocked) {
                      return (
                        <div
                          key={`${booking.id}-${dayIdx}`}
                          className="absolute p-2 rounded-xl border text-xs overflow-hidden flex flex-col items-center justify-center text-center z-10 font-bold shadow-xs"
                          style={{
                            top: `${topPx}px`,
                            height: `${heightPx}px`,
                            left: `calc(${timeColWidth}px + ((100% - ${timeColWidth}px) / 7) * ${dayIdx} + 3px)`,
                            width: `calc(((100% - ${timeColWidth}px) / 7) - 6px)`,
                            background:
                              'repeating-linear-gradient(45deg, #fee2e2, #fee2e2 10px, #fecaca 10px, #fecaca 20px)',
                            borderColor: '#f87171',
                            color: '#991b1b',
                            cursor: isAdminMode ? 'pointer' : 'not-allowed'
                          }}
                          title={`ปิดปรับปรุง: ${booking.topic}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (isAdminMode && onDeleteBooking) onDeleteBooking(booking.id);
                          }}
                        >
                          <Ban size={14} className="mb-0.5 shrink-0" />
                          <span className="truncate w-full">{booking.topic}</span>
                        </div>
                      );
                    }

                    const pillBg = isPending
                      ? 'bg-amber-50 border-amber-300 text-amber-900'
                      : 'bg-blue-50 border-blue-300 text-blue-950';

                    return (
                      <div
                        key={`${booking.id}-${dayIdx}`}
                        className={`absolute p-2 rounded-xl shadow-xs border text-xs overflow-hidden cursor-pointer hover:shadow-md transition z-10 flex flex-col justify-between ${pillBg}`}
                        style={{
                          top: `${topPx}px`,
                          height: `${heightPx}px`,
                          left: `calc(${timeColWidth}px + ((100% - ${timeColWidth}px) / 7) * ${dayIdx} + 3px)`,
                          width: `calc(((100% - ${timeColWidth}px) / 7) - 6px)`
                        }}
                        title={`${booking.topic} (${room ? room.name : ''}) โดย ${booking.requesterName}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          onViewBooking(booking);
                        }}
                      >
                        <div>
                          {isAllRooms && room && (
                            <div className="text-[10px] font-bold text-blue-900 bg-blue-200/80 px-1.5 py-0.5 rounded-md w-fit truncate mb-0.5 max-w-full">
                              {room.name.split(' (')[0]}
                            </div>
                          )}
                          <div className="font-bold truncate flex items-center gap-1">
                            {isPending && <Clock size={10} className="text-amber-600 shrink-0" />}
                            <span>{booking.topic}</span>
                          </div>
                          <div className="truncate text-[10px] opacity-75 mt-0.5">
                            {booking.department || booking.requesterName}
                          </div>
                        </div>

                        <div className="mt-1 flex items-center justify-between text-[9px] font-semibold opacity-75 pt-0.5 border-t border-black/5">
                          <span>
                            {isMultiDay
                              ? 'ต่อเนื่อง'
                              : `${formatThaiTime(bStart, { hour: '2-digit', minute: '2-digit' })} - ${formatThaiTime(bEnd, { hour: '2-digit', minute: '2-digit' })}`}
                          </span>
                          {booking.participants > 0 && <span>{booking.participants} คน</span>}
                        </div>
                      </div>
                    );
                  });
                });
              })()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
