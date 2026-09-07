import { Booking } from '../types';

export const START_HOUR = 8;
export const START_MINUTE = 30;
export const END_HOUR = 19;
export const END_MINUTE = 30;
export const SLOT_HEIGHT = 64;

export const WEEK_DAY_NAMES = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
export const THAI_MONTHS_SHORT = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
export const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

export const formatThaiDate = (dateInput: string | Date | number, options: Intl.DateTimeFormatOptions = {}): string => {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleDateString('th-TH', { timeZone: 'Asia/Bangkok', ...options });
};

export const formatThaiTime = (dateInput: string | Date | number, options: Intl.DateTimeFormatOptions = {}): string => {
  if (!dateInput) return '-';
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return '-';
  return d.toLocaleTimeString('th-TH', { timeZone: 'Asia/Bangkok', ...options });
};

export const formatFullThaiDate = (date: Date): string => {
  const dayName = WEEK_DAY_NAMES[date.getDay()];
  const day = date.getDate();
  const month = THAI_MONTHS_FULL[date.getMonth()];
  const year = date.getFullYear() + 543;
  return `วัน${dayName}ที่ ${day} ${month} ${year}`;
};

export const isSameDay = (d1: Date | string, d2: Date | string): boolean => {
  if (!d1 || !d2) return false;
  const a = new Date(d1);
  const b = new Date(d2);
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
};

export const generateTimeSlots = (): string[] => {
  const slots: string[] = [];
  const current = new Date();
  current.setHours(START_HOUR, START_MINUTE, 0, 0);
  const end = new Date();
  end.setHours(END_HOUR, END_MINUTE, 0, 0);

  while (current < end) {
    slots.push(
      `${current.getHours().toString().padStart(2, '0')}:${current.getMinutes().toString().padStart(2, '0')}`
    );
    current.setMinutes(current.getMinutes() + 30);
  }
  return slots;
};

export const generateSelectableTimes = (): string[] => {
  const times: string[] = [];
  const current = new Date();
  current.setHours(START_HOUR, START_MINUTE, 0, 0);
  const end = new Date();
  end.setHours(END_HOUR, END_MINUTE, 0, 0);

  while (current <= end) {
    times.push(
      `${current.getHours().toString().padStart(2, '0')}:${current.getMinutes().toString().padStart(2, '0')}`
    );
    current.setMinutes(current.getMinutes() + 30);
  }
  return times;
};

export const TIME_SLOTS = generateTimeSlots();
export const SELECTABLE_TIMES = generateSelectableTimes();

export const getPositionStyles = (start: Date, end: Date) => {
  const startH = start.getHours();
  const startM = start.getMinutes();
  const startTotalMins = startH * 60 + startM;
  const baseTotalMins = START_HOUR * 60 + START_MINUTE;
  const diffMins = Math.max(0, startTotalMins - baseTotalMins);
  const durationMins = Math.max(15, (end.getTime() - start.getTime()) / (1000 * 60));
  const topPx = (diffMins / 30) * SLOT_HEIGHT;
  const heightPx = (durationMins / 30) * SLOT_HEIGHT;
  return { topPx, heightPx };
};

export const getHorizontalStyle = (start: Date, end: Date) => {
  const startH = start.getHours();
  const startM = start.getMinutes();
  const totalStartMins = startH * 60 + startM;
  const dayStartMins = START_HOUR * 60 + START_MINUTE;
  const dayEndMins = END_HOUR * 60 + END_MINUTE;
  const totalDayMins = dayEndMins - dayStartMins;
  const offsetMins = totalStartMins - dayStartMins;
  const durationMins = (end.getTime() - start.getTime()) / (1000 * 60);
  const leftPercent = (offsetMins / totalDayMins) * 100;
  const widthPercent = (durationMins / totalDayMins) * 100;
  return {
    left: `${Math.max(0, leftPercent)}%`,
    width: `${Math.min(100 - Math.max(0, leftPercent), Math.max(4, widthPercent))}%`
  };
};

export const getWeekDays = (baseDate: Date): Date[] => {
  const d = new Date(baseDate);
  const day = d.getDay();
  const diff = d.getDate() - day;
  const sunday = new Date(d.getFullYear(), d.getMonth(), diff);
  sunday.setHours(0, 0, 0, 0);

  const week: Date[] = [];
  for (let i = 0; i < 7; i++) {
    const nextDay = new Date(sunday);
    nextDay.setDate(sunday.getDate() + i);
    week.push(nextDay);
  }
  return week;
};

export const getMonthDays = (baseDate: Date): { date: Date; isCurrentMonth: boolean }[] => {
  const year = baseDate.getFullYear();
  const month = baseDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const lastDayOfMonth = new Date(year, month + 1, 0);
  const leadingDays = firstDayOfMonth.getDay();

  const days: { date: Date; isCurrentMonth: boolean }[] = [];

  const prevMonthLastDay = new Date(year, month, 0).getDate();
  for (let i = leadingDays - 1; i >= 0; i--) {
    const d = new Date(year, month - 1, prevMonthLastDay - i);
    days.push({ date: d, isCurrentMonth: false });
  }

  for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
    const d = new Date(year, month, i);
    days.push({ date: d, isCurrentMonth: true });
  }

  const remaining = 7 - (days.length % 7);
  if (remaining < 7 && remaining > 0) {
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      days.push({ date: d, isCurrentMonth: false });
    }
  }

  return days;
};

export const checkBookingOverlap = (
  bookings: Booking[],
  roomId: string,
  start: Date,
  end: Date,
  excludeId: string | null = null,
  onlyApproved: boolean = false
) => {
  const nStart = start.getTime();
  const nEnd = end.getTime();

  for (const b of bookings) {
    if (excludeId && b.id === excludeId) continue;
    if (b.roomId !== roomId) continue;
    if (b.status === 'rejected' || b.status === 'cancelled') continue;
    if (onlyApproved && b.status === 'pending') continue;

    const bStart = new Date(b.startTime).getTime();
    const bEnd = new Date(b.endTime).getTime();

    if (nStart < bEnd && nEnd > bStart) {
      return {
        overlap: true,
        conflictWith: b
      };
    }
  }
  return { overlap: false, conflictWith: null };
};

export interface AdjacentBookingsResult {
  hasAdjacentBefore: boolean;
  beforeBooking: Booking | null;
  hasAdjacentAfter: boolean;
  afterBooking: Booking | null;
}

/**
 * ตรวจสอบการจองที่มีเวลาต่อเนื่องติดกันหรือใกล้เคียงกันมาก (เช่น ภายใน 15 นาที หรือติดกันพอดี)
 */
export const checkAdjacentBookings = (
  bookings: Booking[],
  roomId: string,
  start: Date,
  end: Date,
  excludeId: string | null = null,
  bufferMinutes: number = 15
): AdjacentBookingsResult => {
  const nStart = start.getTime();
  const nEnd = end.getTime();
  const bufferMs = bufferMinutes * 60 * 1000;

  let beforeBooking: Booking | null = null;
  let afterBooking: Booking | null = null;

  for (const b of bookings) {
    if (excludeId && b.id === excludeId) continue;
    if (b.roomId !== roomId) continue;
    if (b.status === 'rejected' || b.status === 'cancelled') continue;

    const bStart = new Date(b.startTime).getTime();
    const bEnd = new Date(b.endTime).getTime();

    // Directly adjacent or within bufferMinutes before (ends at or shortly before start)
    if (bEnd <= nStart && nStart - bEnd <= bufferMs) {
      if (!beforeBooking || bEnd > new Date(beforeBooking.endTime).getTime()) {
        beforeBooking = b;
      }
    }

    // Directly adjacent or within bufferMinutes after (starts at or shortly after end)
    if (bStart >= nEnd && bStart - nEnd <= bufferMs) {
      if (!afterBooking || bStart < new Date(afterBooking.startTime).getTime()) {
        afterBooking = b;
      }
    }
  }

  return {
    hasAdjacentBefore: beforeBooking !== null,
    beforeBooking,
    hasAdjacentAfter: afterBooking !== null,
    afterBooking
  };
};

