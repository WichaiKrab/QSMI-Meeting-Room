import React from 'react';
import { Plus, Ban, Clock, Users, Phone } from 'lucide-react';
import { Room, Booking } from '../types';
import {
  START_HOUR,
  START_MINUTE,
  END_HOUR,
  END_MINUTE,
  SLOT_HEIGHT,
  TIME_SLOTS,
  formatThaiTime,
  getPositionStyles,
  getHorizontalStyle
} from '../utils/thaiDate';

interface DayViewProps {
  currentDate: Date;
  rooms: Room[];
  bookings: Booking[];
  isAdminMode: boolean;
  onSlotClick: (room: Room, time?: string) => void;
  onViewBooking: (booking: Booking) => void;
  onEditBooking?: (booking: Booking) => void;
  onDeleteBooking?: (id: string) => void;
}

export const DayView: React.FC<DayViewProps> = ({
  currentDate,
  rooms,
  bookings,
  isAdminMode,
  onSlotClick,
  onViewBooking,
  onEditBooking,
  onDeleteBooking
}) => {
  // Filter bookings for this day
  const dayStart = new Date(currentDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(currentDate);
  dayEnd.setHours(23, 59, 59, 999);

  const todaysBookings = bookings.filter((b) => {
    if (b.status === 'rejected' || b.status === 'cancelled') return false;
    const bStart = new Date(b.startTime);
    const bEnd = new Date(b.endTime);
    return bEnd >= dayStart && bStart <= dayEnd;
  });

  const gridTemplateColumns = `80px repeat(${rooms.length}, 1fr)`;
  const minTableWidth = `${80 + rooms.length * 150}px`;

  // Calculate current Bangkok time red line
  const now = new Date();
  const isToday =
    now.getFullYear() === currentDate.getFullYear() &&
    now.getMonth() === currentDate.getMonth() &&
    now.getDate() === currentDate.getDate();

  let currentTimeTop: number | null = null;
  if (isToday) {
    const currentTotalMins = now.getHours() * 60 + now.getMinutes();
    const startTotalMins = START_HOUR * 60 + START_MINUTE;
    const endTotalMins = END_HOUR * 60 + END_MINUTE;
    if (currentTotalMins >= startTotalMins && currentTotalMins <= endTotalMins) {
      currentTimeTop = ((currentTotalMins - startTotalMins) / 30) * SLOT_HEIGHT;
    }
  }

  return (
    <div className="space-y-4 md:space-y-0 flex-1 min-h-0 flex flex-col">
      {/* MOBILE DAY VIEW */}
      <div className="md:hidden space-y-3.5">
        {rooms.map((room) => {
          const roomBookings = todaysBookings.filter((b) => b.roomId === room.id);

          return (
            <div
              key={room.id}
              className={`bg-white rounded-2xl shadow-sm border p-4 transition ${
                room.isActive ? 'border-gray-200' : 'border-gray-200 bg-gray-50/70'
              }`}
            >
              {/* Room Header */}
              <div className="flex justify-between items-start mb-3 gap-3">
                <div className={`font-bold text-gray-900 flex-1 min-w-0 ${!room.isActive ? 'opacity-50' : ''}`}>
                  <div className="text-sm leading-snug">{room.name}</div>
                  {room.location && (
                    <span className="text-[11px] text-gray-500 font-normal">{room.location}</span>
                  )}
                </div>
                {room.isActive ? (
                  <button
                    type="button"
                    onClick={() => onSlotClick(room)}
                    className="text-xs flex items-center gap-1 text-white px-3 py-1.5 rounded-xl shadow-xs transition font-bold bg-[#1a1a1a] hover:bg-black whitespace-nowrap shrink-0 active:scale-95"
                  >
                    <Plus size={14} /> จองห้องนี้
                  </button>
                ) : (
                  <span className="text-xs text-red-700 font-bold bg-red-100 px-2.5 py-1 rounded-lg whitespace-nowrap shrink-0">
                    ปิดปรับปรุง
                  </span>
                )}
              </div>

              {/* Visual Timeline Bar */}
              <div
                className={`relative h-7 bg-gray-100 rounded-lg w-full mt-1 mb-1 overflow-hidden border border-gray-200 ${
                  !room.isActive ? 'opacity-40 grayscale' : ''
                }`}
              >
                {[25, 50, 75].map((p) => (
                  <div
                    key={p}
                    className="absolute top-0 bottom-0 border-l border-gray-300"
                    style={{ left: `${p}%` }}
                  />
                ))}

                {roomBookings.map((b) => {
                  const bStart = new Date(b.startTime);
                  const bEnd = new Date(b.endTime);

                  let displayStart = bStart;
                  let displayEnd = bEnd;
                  const dayViewStart = new Date(currentDate);
                  dayViewStart.setHours(START_HOUR, START_MINUTE, 0, 0);
                  const dayViewEnd = new Date(currentDate);
                  dayViewEnd.setHours(END_HOUR, END_MINUTE, 0, 0);

                  if (bStart < dayViewStart) displayStart = dayViewStart;
                  if (bEnd > dayViewEnd) displayEnd = dayViewEnd;
                  if (displayStart >= displayEnd) return null;

                  const { left, width } = getHorizontalStyle(displayStart, displayEnd);

                  let bgStyle = 'bg-blue-500';
                  if (b.isBlocked) {
                    bgStyle = 'bg-red-500';
                  } else if (b.status === 'pending') {
                    bgStyle = 'bg-amber-400';
                  }

                  return (
                    <div
                      key={b.id}
                      className={`absolute top-0 bottom-0 ${bgStyle} opacity-85 border-r border-white`}
                      style={{ left, width }}
                      title={`${b.topic} (${b.status === 'pending' ? 'รออนุมัติ' : 'อนุมัติแล้ว'})`}
                    />
                  );
                })}
              </div>

              {/* Time Indicators */}
              <div className="flex justify-between text-[10px] text-gray-400 font-semibold px-0.5 mb-3">
                <span>08:30</span>
                <span>12:00</span>
                <span>15:30</span>
                <span>19:30</span>
              </div>

              {/* Bookings List for Room */}
              <div className="space-y-2 mt-2">
                {roomBookings.length > 0 ? (
                  roomBookings.map((b) => {
                    const bStart = new Date(b.startTime);
                    const bEnd = new Date(b.endTime);
                    const isMultiDay = bStart.getDate() !== bEnd.getDate();

                    let timeText = '';
                    if (isMultiDay) {
                      timeText = 'ตลอดวัน (ต่อเนื่อง)';
                    } else {
                      timeText = `${formatThaiTime(bStart, { hour: '2-digit', minute: '2-digit' })} - ${formatThaiTime(bEnd, { hour: '2-digit', minute: '2-digit' })}`;
                    }

                    if (b.isBlocked) {
                      return (
                        <div
                          key={b.id}
                          onClick={() => {
                            if (isAdminMode && onDeleteBooking) onDeleteBooking(b.id);
                          }}
                          className="text-xs bg-red-50 p-2.5 rounded-xl border border-red-200 text-red-700 font-bold flex items-center justify-between gap-2 cursor-pointer"
                        >
                          <div className="flex items-center gap-1.5 min-w-0 flex-1">
                            <Ban size={14} className="text-red-500 shrink-0" />
                            <span className="truncate">{b.topic}</span>
                          </div>
                          <span className="text-[10px] bg-red-200 text-red-800 px-2 py-0.5 rounded">
                            ปิดกั้น
                          </span>
                        </div>
                      );
                    }

                    const isPending = b.status === 'pending';

                    return (
                      <div
                        key={b.id}
                        onClick={() => onViewBooking(b)}
                        className={`text-xs p-3 rounded-xl border flex justify-between items-center cursor-pointer hover:bg-gray-50 transition gap-2 ${
                          isPending ? 'bg-amber-50/70 border-amber-200' : 'bg-blue-50/40 border-blue-200'
                        }`}
                      >
                        <div className="flex flex-col min-w-0 flex-1">
                          <div className="flex items-center gap-1 font-bold text-gray-800">
                            {isPending && <Clock size={12} className="text-amber-600 shrink-0" />}
                            <span className="truncate">{b.topic}</span>
                          </div>
                          <div className="text-[11px] text-gray-500 truncate mt-0.5">
                            {b.requesterName} ({b.department || '-'})
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-gray-700 whitespace-nowrap bg-white px-2.5 py-1 rounded-lg border border-gray-200 shadow-2xs">
                          {timeText}
                        </span>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-center text-gray-400 font-medium py-2 bg-gray-50/50 rounded-lg">
                    ห้องว่างตลอดวัน สามารถคลิก "จองห้องนี้" ได้
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* DESKTOP DAY VIEW (TIMELINE MATRIX) */}
      <div className="hidden md:flex bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-200 flex-col flex-1 min-h-0 w-full">
        <div className="overflow-y-auto overflow-x-hidden no-scrollbar h-full w-full">
          <div className="w-full min-w-full">
            {/* Header: Rooms */}
            <div
              className="grid border-b border-gray-200 bg-gray-50/90 sticky top-0 z-20 shadow-xs"
              style={{ gridTemplateColumns }}
            >
              <div className="p-3.5 border-r border-gray-200 text-gray-500 text-center font-bold text-xs flex flex-col justify-center bg-gray-50 sticky left-0 z-30 shadow-[4px_0_12px_-2px_rgba(0,0,0,0.06)]">
                เวลา
              </div>
              {rooms.map((room) => (
                <div
                  key={room.id}
                  className={`p-3 border-r border-gray-200 last:border-r-0 text-center flex flex-col justify-center ${
                    !room.isActive ? 'bg-gray-100/80' : ''
                  }`}
                >
                  <div
                    className={`font-bold text-xs lg:text-sm leading-tight line-clamp-2 ${
                      room.isActive ? 'text-gray-900' : 'text-gray-400'
                    }`}
                  >
                    {room.name}
                  </div>
                  {!room.isActive && (
                    <span className="text-[10px] font-bold mt-1 text-red-600 bg-red-50 py-0.5 px-2 rounded w-fit mx-auto border border-red-100">
                      ปิดปรับปรุง
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Time Slot Rows */}
            <div className="relative">
              {TIME_SLOTS.map((time) => {
                const slotTime = new Date(currentDate);
                const [h, m] = time.split(':');
                slotTime.setHours(parseInt(h), parseInt(m), 0, 0);
                const isPast = slotTime < new Date();

                return (
                  <div
                    key={time}
                    className="grid border-b border-gray-100 last:border-b-0"
                    style={{ height: `${SLOT_HEIGHT}px`, gridTemplateColumns }}
                  >
                    <div className="border-r border-gray-200 px-2 py-1 text-xs text-gray-400 font-semibold text-right bg-gray-50/80 sticky left-0 z-10 shadow-[4px_0_12px_-2px_rgba(0,0,0,0.04)] select-none">
                      {time}
                    </div>
                    {rooms.map((room) => (
                      <div
                        key={room.id}
                        className={`border-r border-gray-100 last:border-r-0 relative transition group ${
                          !room.isActive
                            ? 'bg-gray-100/50 cursor-not-allowed'
                            : isPast
                              ? 'bg-gray-50/30 cursor-not-allowed'
                              : 'hover:bg-blue-50/30 cursor-pointer'
                        }`}
                        onClick={() => {
                          if (isPast || !room.isActive) return;
                          onSlotClick(room, time);
                        }}
                        title={
                          !room.isActive
                            ? 'ห้องปิดปรับปรุง'
                            : isPast
                              ? 'ช่วงเวลาผ่านไปแล้ว'
                              : `คลิกเพื่อจอง ${room.name} เวลา ${time}`
                        }
                      >
                        {!room.isActive && (
                          <div
                            className="absolute inset-0 opacity-10 pointer-events-none"
                            style={{
                              backgroundImage:
                                'linear-gradient(45deg, #000 25%, transparent 25%, transparent 50%, #000 50%, #000 75%, transparent 75%, transparent)',
                              backgroundSize: '10px 10px'
                            }}
                          />
                        )}
                        {!isPast && room.isActive && (
                          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 pointer-events-none">
                            <div className="rounded-full p-1.5 text-white shadow bg-[#C8102E]">
                              <Plus size={14} />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })}

              {/* Bookings Placed Over the Matrix */}
              {todaysBookings.map((booking) => {
                const bStart = new Date(booking.startTime);
                const bEnd = new Date(booking.endTime);

                const viewDayStart = new Date(currentDate);
                viewDayStart.setHours(START_HOUR, START_MINUTE, 0, 0);
                const viewDayEnd = new Date(currentDate);
                viewDayEnd.setHours(END_HOUR, END_MINUTE, 0, 0);

                let effectiveStart = bStart;
                let effectiveEnd = bEnd;
                if (bStart < viewDayStart) effectiveStart = viewDayStart;
                if (bEnd > viewDayEnd) effectiveEnd = viewDayEnd;
                if (effectiveStart >= effectiveEnd) return null;

                const { topPx, heightPx } = getPositionStyles(effectiveStart, effectiveEnd);
                const roomIndex = rooms.findIndex((r) => r.id === booking.roomId);
                if (roomIndex === -1) return null;

                const timeColWidth = 80;
                const isMultiDay = bStart.getDate() !== bEnd.getDate();

                if (booking.isBlocked) {
                  return (
                    <div
                      key={booking.id}
                      className="absolute p-2 rounded-xl border text-xs overflow-hidden flex flex-col items-center justify-center text-center z-10 font-bold shadow-xs transition"
                      style={{
                        top: `${topPx}px`,
                        height: `${heightPx}px`,
                        left: `calc(${timeColWidth}px + ((100% - ${timeColWidth}px) / ${rooms.length}) * ${roomIndex} + 4px)`,
                        width: `calc(((100% - ${timeColWidth}px) / ${rooms.length}) - 8px)`,
                        background:
                          'repeating-linear-gradient(45deg, #fee2e2, #fee2e2 10px, #fecaca 10px, #fecaca 20px)',
                        borderColor: '#f87171',
                        color: '#991b1b',
                        cursor: isAdminMode ? 'pointer' : 'not-allowed'
                      }}
                      title={`ปิดปรับปรุง: ${booking.topic} (คลิกเพื่อยกเลิกการปิดกั้น)`}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (isAdminMode && onDeleteBooking) onDeleteBooking(booking.id);
                      }}
                    >
                      <Ban size={16} className="mb-0.5 text-red-600 shrink-0" />
                      <span className="truncate w-full">{booking.topic}</span>
                    </div>
                  );
                }

                const isPending = booking.status === 'pending';
                const pillBg = isPending
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : 'bg-blue-50 border-blue-300 text-blue-950';

                return (
                  <div
                    key={booking.id}
                    className={`absolute p-2.5 rounded-xl shadow-xs border text-xs overflow-hidden cursor-pointer hover:shadow-md hover:brightness-95 transition z-10 flex flex-col justify-between ${pillBg}`}
                    style={{
                      top: `${topPx}px`,
                      height: `${heightPx}px`,
                      left: `calc(${timeColWidth}px + ((100% - ${timeColWidth}px) / ${rooms.length}) * ${roomIndex} + 4px)`,
                      width: `calc(((100% - ${timeColWidth}px) / ${rooms.length}) - 8px)`
                    }}
                    title={`${booking.topic} โดย ${booking.requesterName} (${isPending ? 'รออนุมัติ' : 'ยืนยัน'})`}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (isAdminMode && onEditBooking) onEditBooking(booking);
                      else onViewBooking(booking);
                    }}
                  >
                    <div>
                      <div className="font-bold text-xs truncate flex items-center gap-1">
                        {isPending && <Clock size={11} className="text-amber-600 shrink-0" />}
                        <span>{booking.topic}</span>
                      </div>
                      <div className="truncate text-[11px] opacity-80 mt-0.5">
                        {booking.requesterName} {booking.department ? `(${booking.department})` : ''}
                      </div>
                    </div>

                    <div className="mt-1 flex items-center justify-between gap-1 text-[10px] font-semibold opacity-75 pt-1 border-t border-black/5">
                      <span className="flex items-center gap-0.5">
                        <Clock size={10} />
                        {isMultiDay
                          ? 'ต่อเนื่อง'
                          : `${formatThaiTime(bStart, { hour: '2-digit', minute: '2-digit' })} - ${formatThaiTime(bEnd, { hour: '2-digit', minute: '2-digit' })}`}
                      </span>
                      {booking.participants > 0 && (
                        <span className="flex items-center gap-0.5">
                          <Users size={10} /> {booking.participants}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}

              {/* Current Time Indicator Red Line */}
              {currentTimeTop !== null && (
                <div
                  className="absolute w-full border-t-2 z-20 pointer-events-none flex items-center border-[#C8102E]"
                  style={{ top: `${currentTimeTop}px` }}
                >
                  <div className="text-white text-[10px] font-bold px-1.5 py-0.5 rounded-r bg-[#C8102E] -mt-[1px] shadow-xs">
                    เวลาปัจจุบัน (Bangkok)
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
