import React, { useRef } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus } from 'lucide-react';
import { CalendarView } from '../types';
import {
  WEEK_DAY_NAMES,
  THAI_MONTHS_SHORT,
  THAI_MONTHS_FULL,
  getWeekDays
} from '../utils/thaiDate';

interface CalendarHeaderProps {
  currentDate: Date;
  viewMode: CalendarView;
  onChangeDate: (date: Date) => void;
  onChangeViewMode: (mode: CalendarView) => void;
  onQuickBook?: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  currentDate,
  viewMode,
  onChangeDate,
  onChangeViewMode,
  onQuickBook
}) => {
  const dateInputRef = useRef<HTMLInputElement>(null);

  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'day') {
      next.setDate(next.getDate() - 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() - 7);
    } else {
      next.setMonth(next.getMonth() - 1);
    }
    onChangeDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'day') {
      next.setDate(next.getDate() + 1);
    } else if (viewMode === 'week') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setMonth(next.getMonth() + 1);
    }
    onChangeDate(next);
  };

  const handleToday = () => {
    onChangeDate(new Date());
  };

  const handleNativeDateInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value) {
      const [y, m, d] = e.target.value.split('-').map(Number);
      const chosen = new Date(y, m - 1, d);
      onChangeDate(chosen);
    }
  };

  const handleTriggerPicker = () => {
    if (dateInputRef.current) {
      try {
        if (typeof dateInputRef.current.showPicker === 'function') {
          dateInputRef.current.showPicker();
        } else {
          dateInputRef.current.focus();
          dateInputRef.current.click();
        }
      } catch {
        dateInputRef.current.focus();
        dateInputRef.current.click();
      }
    }
  };

  const getTitle = (): string => {
    const yearBE = currentDate.getFullYear() + 543;
    if (viewMode === 'day') {
      const dayName = WEEK_DAY_NAMES[currentDate.getDay()];
      const day = currentDate.getDate();
      const month = THAI_MONTHS_FULL[currentDate.getMonth()];
      return `วัน${dayName}ที่ ${day} ${month} ${yearBE}`;
    }

    if (viewMode === 'week') {
      const week = getWeekDays(currentDate);
      const start = week[0];
      const end = week[6];
      const sYear = start.getFullYear() + 543;
      const eYear = end.getFullYear() + 543;

      if (start.getFullYear() !== end.getFullYear()) {
        return `${start.getDate()} ${THAI_MONTHS_SHORT[start.getMonth()]} ${sYear} - ${end.getDate()} ${THAI_MONTHS_SHORT[end.getMonth()]} ${eYear}`;
      }
      if (start.getMonth() !== end.getMonth()) {
        return `${start.getDate()} ${THAI_MONTHS_SHORT[start.getMonth()]} - ${end.getDate()} ${THAI_MONTHS_SHORT[end.getMonth()]} ${sYear}`;
      }
      return `${start.getDate()} - ${end.getDate()} ${THAI_MONTHS_FULL[start.getMonth()]} ${sYear}`;
    }

    return `เดือน${THAI_MONTHS_FULL[currentDate.getMonth()]} ${yearBE}`;
  };

  const isoDate = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;

  return (
    <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-2.5 sm:p-3 md:p-3.5 rounded-2xl shadow-sm border border-gray-200 gap-2.5 shrink-0 w-full">
      {/* Navigation: Prev / Today / Next */}
      <div className="flex items-center gap-1.5 w-full sm:w-auto justify-between sm:justify-start">
        <button
          type="button"
          onClick={handlePrev}
          className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-700 border border-gray-200 shadow-xs"
          title="ก่อนหน้า"
        >
          <ChevronLeft size={20} />
        </button>
        <button
          type="button"
          onClick={handleToday}
          className="px-3.5 py-1.5 text-xs sm:text-sm font-bold bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl transition border border-gray-200"
          title="กลับมายังวันนี้"
        >
          วันนี้
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-700 border border-gray-200 shadow-xs"
          title="ถัดไป"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      {/* Center: Current Date Header & Clickable Calendar */}
      <button
        type="button"
        onClick={handleTriggerPicker}
        className="relative group cursor-pointer flex flex-col items-center select-none text-center px-3 py-1 rounded-xl hover:bg-gray-50 transition border border-transparent hover:border-gray-200"
        title="คลิกเพื่อเลือกวันที่จากปฏิทิน"
      >
        <h2 className="text-base sm:text-lg md:text-xl font-bold flex items-center justify-center space-x-2 text-gray-900 group-hover:text-[#C8102E] transition">
          <CalendarIcon size={20} className="text-[#C8102E] shrink-0" />
          <span>{getTitle()}</span>
        </h2>
        {/* Hidden HTML date input */}
        <input
          ref={dateInputRef}
          type="date"
          value={isoDate}
          onChange={handleNativeDateInput}
          onClick={(e) => e.stopPropagation()}
          className="sr-only pointer-events-none"
          tabIndex={-1}
          aria-hidden="true"
        />
        <span className="text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition whitespace-nowrap pointer-events-none mt-0.5">
          คลิกเพื่อเลือกวันที่
        </span>
      </button>

      {/* Right: View Mode Selector & Quick Booking Button */}
      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
        <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
          {(['day', 'week', 'month'] as CalendarView[]).map((mode) => {
            const label = mode === 'day' ? 'วัน' : mode === 'week' ? 'สัปดาห์' : 'เดือน';
            const isActive = viewMode === mode;
            return (
              <button
                key={mode}
                type="button"
                onClick={() => onChangeViewMode(mode)}
                className={`px-3 sm:px-3.5 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition flex items-center justify-center ${
                  isActive ? 'bg-white text-[#C8102E] shadow-xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>

        {onQuickBook && (
          <button
            type="button"
            onClick={onQuickBook}
            className="flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-[#C8102E] hover:bg-[#a00c24] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 shrink-0"
            title="กดเพื่อจองห้องประชุมทันที"
          >
            <Plus size={16} />
            <span>จองห้องประชุม</span>
          </button>
        )}
      </div>
    </div>
  );
};
