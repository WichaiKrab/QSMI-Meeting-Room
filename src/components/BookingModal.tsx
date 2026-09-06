import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Calendar as CalendarIcon,
  AlertTriangle,
  MapPin,
  Lock,
  Building,
  User,
  Phone,
  Mail,
  FileText,
  LayoutGrid,
  Wrench,
  Check,
  Plus
} from 'lucide-react';
import { Room, Booking, UserAccount } from '../types';
import { SELECTABLE_TIMES, formatFullThaiDate } from '../utils/thaiDate';
import { DEFAULT_BOOKING_EQUIPMENT, normalizeEquipmentName, normalizeSeatingName } from '../data/initialData';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (formData: any) => void;
  room?: Room;
  initialDate: Date;
  initialTime?: string | null;
  bookingData?: Booking | null;
  currentUser: UserAccount | null;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  room,
  initialDate,
  initialTime,
  bookingData,
  currentUser
}) => {
  if (!isOpen) return null;

  const [topic, setTopic] = useState('');
  const [name, setName] = useState('');
  const [department, setDepartment] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [participants, setParticipants] = useState<number | ''>('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [hasInstitute, setHasInstitute] = useState<boolean | null>(null);
  const [institute, setInstitute] = useState('');
  const [snacks, setSnacks] = useState<number | ''>('');
  const [lunch, setLunch] = useState<number | ''>('');
  const [drinks, setDrinks] = useState<number | ''>('');
  const [equipment, setEquipment] = useState<string[]>([]);
  const [seatingSetup, setSeatingSetup] = useState<string>('');
  const [meetingType, setMeetingType] = useState<'Onsite' | 'Online'>('Onsite');
  const [note, setNote] = useState('');
  const [warningMessage, setWarningMessage] = useState<string | null>(null);

  // Available seating layout options configured for the room in Room Management
  const roomSeatingOptions = useMemo(() => {
    return (room?.seatingOptions || []).map(normalizeSeatingName).filter(Boolean);
  }, [room]);

  const hasRoomSeating = roomSeatingOptions.length > 0;

  // Available equipment options matching room management:
  // If not selected in room management, show default options: LCD Projector, Computer / Notebook, ถ่ายภาพ
  const hasRoomEquipment = Boolean(room?.equipment && room.equipment.length > 0);

  const availableEquipmentList = useMemo(() => {
    if (hasRoomEquipment) {
      const roomEq = (room?.equipment || []).map(normalizeEquipmentName).filter(Boolean);
      return Array.from(new Set(roomEq));
    }
    return DEFAULT_BOOKING_EQUIPMENT;
  }, [room, hasRoomEquipment]);

  // Date range
  const formatDateISO = (d: Date | string): string => {
    const date = new Date(d);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const now = new Date();
  const todayIso = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;

  const [startDateStr, setStartDateStr] = useState('');
  const [endDateStr, setEndDateStr] = useState('');

  const refTopic = useRef<HTMLInputElement>(null);
  const refParticipants = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (bookingData) {
      setTopic(bookingData.topic);
      setName(bookingData.requesterName || currentUser?.name || '');
      setDepartment(bookingData.department || currentUser?.department || '');
      setEmail(bookingData.email || currentUser?.email || (currentUser?.username ? `${currentUser.username}@qsmi.or.th` : ''));
      setPhone(bookingData.phone || currentUser?.phone || '');
      setParticipants(bookingData.participants || '');
      setInstitute(bookingData.institute || '');
      setHasInstitute(Boolean(bookingData.institute));
      setSnacks(bookingData.snacks || '');
      setLunch(bookingData.lunch || '');
      setDrinks(bookingData.drinks || '');
      if (bookingData.equipment) {
        const rawEq = Array.isArray(bookingData.equipment)
          ? bookingData.equipment
          : bookingData.equipment.split(', ');
        setEquipment(rawEq.map(normalizeEquipmentName).filter(Boolean));
      } else {
        setEquipment([]);
      }
      const initialSeat = bookingData.seatingSetup
        ? normalizeSeatingName(bookingData.seatingSetup)
        : hasRoomSeating
        ? roomSeatingOptions[0]
        : '';
      setSeatingSetup(initialSeat);
      setMeetingType(bookingData.meetingType || 'Onsite');
      setNote(bookingData.note || '');

      const start = new Date(bookingData.startTime);
      const end = new Date(bookingData.endTime);
      const fTime = (d: Date) =>
        d
          .toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Bangkok'
          })
          .replace(/^24/, '00');
      setStartTime(fTime(start));
      setEndTime(fTime(end));
      setStartDateStr(formatDateISO(start));
      setEndDateStr(formatDateISO(end));
    } else {
      const defaultDateStr = formatDateISO(initialDate);
      setStartDateStr(defaultDateStr);
      setEndDateStr(defaultDateStr);

      if (initialTime) {
        setStartTime(initialTime);
        const [h, m] = initialTime.split(':').map(Number);
        const endD = new Date();
        endD.setHours(h + 1, m, 0, 0);
        setEndTime(
          `${endD.getHours().toString().padStart(2, '0')}:${endD.getMinutes().toString().padStart(2, '0')}`
        );
      } else {
        setStartTime('09:00');
        setEndTime('10:30');
      }

      setTopic('');
      setParticipants('');
      setInstitute('');
      setHasInstitute(null);
      setSnacks('');
      setLunch('');
      setDrinks('');
      setEquipment([]);
      const defaultSeat = hasRoomSeating ? roomSeatingOptions[0] : '';
      setSeatingSetup(defaultSeat);
      setMeetingType('Onsite');
      setNote('');

      if (currentUser) {
        setName(currentUser.name || '');
        setDepartment(currentUser.department || '');
        setPhone(currentUser.phone || '');
        setEmail(currentUser.email || (currentUser.username ? `${currentUser.username}@qsmi.or.th` : ''));
      } else {
        setName('');
        setDepartment('');
        setPhone('');
        setEmail('');
      }
    }
  }, [bookingData, initialDate, initialTime, currentUser, isOpen, room]);

  const handleEquipmentChange = (item: string) => {
    setEquipment((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setWarningMessage(null);

    if (!startDateStr || !endDateStr) {
      setWarningMessage('กรุณาระบุวันเริ่มต้นและวันที่สิ้นสุดการจอง');
      return;
    }

    const startD = new Date(startDateStr);
    startD.setHours(0, 0, 0, 0);
    const todayD = new Date();
    todayD.setHours(0, 0, 0, 0);
    if (startD < todayD && !bookingData) {
      setWarningMessage('ไม่สามารถจองห้องประชุมย้อนหลังได้ กรุณาเลือกวันที่ปัจจุบันหรือล่วงหน้า');
      return;
    }

    if (new Date(endDateStr) < new Date(startDateStr)) {
      setWarningMessage('วันที่สิ้นสุดต้องไม่เกิดขึ้นก่อนวันที่เริ่มต้น');
      return;
    }
    if (!topic.trim()) {
      setWarningMessage('กรุณาระบุหัวข้อการประชุม');
      refTopic.current?.focus();
      return;
    }
    if (!name.trim()) {
      setWarningMessage('ไม่พบชื่อผู้จองจากข้อมูลผู้ใช้งาน กรุณาเข้าสู่ระบบใหม่');
      return;
    }
    if (!department.trim()) {
      setWarningMessage('ไม่พบข้อมูลฝ่าย/หน่วยงาน กรุณาอัปเดตในข้อมูลผู้ใช้งาน');
      return;
    }
    if (!phone.trim()) {
      setWarningMessage('ไม่พบเบอร์โทรศัพท์ผู้จอง กรุณาอัปเดตเบอร์โทรศัพท์ในหน้าโปรไฟล์ผู้ใช้งาน');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setWarningMessage('ไม่พบอีเมลผู้จองที่ถูกต้องสำหรับรับผลการจอง กรุณาอัปเดตในหน้าโปรไฟล์');
      return;
    }
    if (hasInstitute === null) {
      setWarningMessage('กรุณาเลือกข้อมูลสถาบันที่เข้าร่วม (มี หรือ ไม่มี)');
      return;
    }
    if (hasInstitute && !institute.trim()) {
      setWarningMessage('กรุณาระบุชื่อสถาบันหรือหน่วยงานภายนอกที่เข้าร่วม');
      return;
    }
    if (!participants || Number(participants) <= 0) {
      setWarningMessage('กรุณาระบุจำนวนผู้เข้าร่วมอย่างน้อย 1 ท่าน');
      refParticipants.current?.focus();
      return;
    }

    onSubmit({
      topic: topic.trim(),
      requesterName: name.trim(),
      department: department.trim() || 'ฝ่ายบริหารงานทั่วไป',
      email: email.trim(),
      phone: phone.trim(),
      participants: Number(participants),
      institute: hasInstitute ? institute.trim() : '',
      startTime,
      endTime,
      bookingStartDate: startDateStr,
      bookingEndDate: endDateStr,
      snacks: Number(snacks || 0),
      lunch: Number(lunch || 0),
      drinks: Number(drinks || 0),
      equipment,
      seatingSetup: hasRoomSeating ? (seatingSetup || roomSeatingOptions[0] || '') : '',
      meetingType,
      meetingLink: '',
      note: note.trim()
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-3 sm:p-4 pt-8 sm:pt-4 overflow-y-auto custom-scrollbar"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl p-5 sm:p-7 border-t-4 border-[#C8102E] my-auto max-h-[92dvh] overflow-y-auto custom-scrollbar">
        {/* Modal Header */}
        <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              {bookingData ? 'แก้ไขการจองห้องประชุม' : 'แบบฟอร์มจองห้องประชุม'}
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              ระบบจองออนไลน์ สถานเสาวภา สภากาชาดไทย (พร้อมแจ้งเตือนอีเมลอัตโนมัติ)
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
          >
            <X size={22} />
          </button>
        </div>

        {/* Warning Callout */}
        {warningMessage && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-300 rounded-xl text-xs sm:text-sm text-amber-800 font-bold flex items-center gap-2">
            <AlertTriangle size={18} className="text-amber-600 shrink-0" />
            <span>{warningMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Room Banner */}
          <div className="bg-gray-50 p-3 sm:p-3.5 rounded-2xl border border-gray-200 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-9 h-9 rounded-xl bg-red-100 text-[#C8102E] flex items-center justify-center font-bold text-sm shrink-0">
                <MapPin size={18} />
              </div>
              <div className="min-w-0">
                <span className="text-xs text-gray-500 font-medium block">ห้องประชุมที่เลือก</span>
                <span className="font-bold text-sm text-gray-900 truncate block">
                  {room?.name}
                </span>
              </div>
            </div>
            {room?.capacity && (
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100 whitespace-nowrap">
                ความจุ {room.capacity} ที่นั่ง
              </span>
            )}
          </div>

          {/* Date Range Box with Header */}
          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 space-y-3">
            <div className="text-center font-bold text-xs sm:text-sm text-blue-900 flex items-center justify-center gap-1.5">
              <CalendarIcon size={16} className="text-blue-700" />
              <span>
                {startDateStr === endDateStr
                  ? formatFullThaiDate(new Date(startDateStr))
                  : `${formatFullThaiDate(new Date(startDateStr))} ถึง ${formatFullThaiDate(new Date(endDateStr))}`}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  วันที่เริ่มต้น <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={bookingData ? undefined : todayIso}
                  value={startDateStr}
                  onChange={(e) => {
                    const newStart = e.target.value;
                    setStartDateStr(newStart);
                    if (!endDateStr || new Date(newStart) > new Date(endDateStr)) {
                      setEndDateStr(newStart);
                    }
                  }}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-600 mb-1">
                  วันที่สิ้นสุด <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  required
                  min={startDateStr}
                  value={endDateStr}
                  onChange={(e) => setEndDateStr(e.target.value)}
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
                />
              </div>
            </div>
          </div>

          {/* Meeting Topic */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">
              หัวข้อการประชุม <span className="text-red-500">*</span>
            </label>
            <input
              ref={refTopic}
              type="text"
              required
              placeholder="เช่น การประชุมวางแผนยุทธศาสตร์ประจำปี, Weekly Sync"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
            />
          </div>

          {/* Read-Only User Information Fields (Auto-filled from user profile) */}
          <div className="bg-slate-50/80 p-3.5 sm:p-4 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between pb-1 border-b border-slate-200/80">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <User size={14} className="text-slate-500" />
                <span>ข้อมูลผู้จอง (ดึงจากบัญชีผู้ใช้งาน)</span>
              </span>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-200/70 px-2 py-0.5 rounded-md flex items-center gap-1">
                <Lock size={10} /> อ่านอย่างเดียว
              </span>
            </div>

            {/* Department & Requester Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <Building size={12} className="text-gray-400" />
                  <span>ชื่อฝ่าย / หน่วยงาน</span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={department || '-'}
                  tabIndex={-1}
                  className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 cursor-not-allowed select-none outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <User size={12} className="text-gray-400" />
                  <span>ชื่อ-นามสกุล ผู้จอง</span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={name || '-'}
                  tabIndex={-1}
                  className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 cursor-not-allowed select-none outline-none"
                />
              </div>
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <Phone size={12} className="text-gray-400" />
                  <span>เบอร์โทรศัพท์ (ติดต่อ)</span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={phone || '-'}
                  tabIndex={-1}
                  className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 cursor-not-allowed select-none outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1 flex items-center gap-1">
                  <Mail size={12} className="text-gray-400" />
                  <span>อีเมล (สำหรับรับผลอนุมัติ)</span>
                </label>
                <input
                  type="text"
                  readOnly
                  value={email || '-'}
                  tabIndex={-1}
                  className="w-full p-2.5 bg-gray-100 border border-gray-200 rounded-xl text-xs sm:text-sm font-semibold text-gray-700 cursor-not-allowed select-none outline-none"
                />
              </div>
            </div>
          </div>

          {/* Participating External Institute */}
          <div className="bg-gray-50 p-3.5 rounded-2xl border border-gray-200 space-y-2">
            <label className="block text-xs sm:text-sm font-bold text-gray-700">
              สถาบันหรือบุคคลภายนอกเข้าร่วม <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-semibold text-gray-700">
                <input
                  type="radio"
                  name="hasInstitute"
                  checked={hasInstitute === false}
                  onChange={() => setHasInstitute(false)}
                  className="w-4 h-4 text-[#C8102E] focus:ring-[#C8102E]"
                />
                <span>ไม่มี (ภายในเท่านั้น)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs sm:text-sm font-semibold text-gray-700">
                <input
                  type="radio"
                  name="hasInstitute"
                  checked={hasInstitute === true}
                  onChange={() => setHasInstitute(true)}
                  className="w-4 h-4 text-[#C8102E] focus:ring-[#C8102E]"
                />
                <span>มีสถาบันภายนอก</span>
              </label>
            </div>
            {hasInstitute && (
              <input
                type="text"
                required
                value={institute}
                onChange={(e) => setInstitute(e.target.value)}
                placeholder="ระบุชื่อสถาบันหรือหน่วยงานภายนอก"
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E] animate-fade-in"
                autoFocus
              />
            )}
          </div>

          {/* Time & Participants (Keyboard numeric typing) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">
                เวลาเริ่มต้น (วันแรก) <span className="text-red-500">*</span>
              </label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
              >
                {SELECTABLE_TIMES.map((t) => (
                  <option key={`start-${t}`} value={t}>
                    {t} น.
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">
                เวลาสิ้นสุด (วันสุดท้าย) <span className="text-red-500">*</span>
              </label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
              >
                {SELECTABLE_TIMES.map((t) => (
                  <option key={`end-${t}`} value={t}>
                    {t} น.
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1">
                ผู้เข้าร่วม (ท่าน) <span className="text-red-500">*</span>
              </label>
              <input
                ref={refParticipants}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                required
                value={participants}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, '');
                  setParticipants(val === '' ? '' : parseInt(val, 10));
                }}
                placeholder="พิมพ์จำนวนคน เช่น 10"
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
              />
            </div>
          </div>

          {/* Catering: Snacks, Lunch, Drinks (Keyboard-typeable) */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5">
              อาหารและเครื่องดื่ม (สามารถพิมพ์ระบุจำนวนที่ต้องการจากแป้นพิมพ์)
            </label>
            <div className="grid grid-cols-3 gap-2 sm:gap-3">
              <div>
                <span className="text-xs text-gray-600 font-semibold block mb-1">อาหารว่าง (ชุด)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={snacks}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setSnacks(val === '' ? '' : parseInt(val, 10));
                  }}
                  placeholder="0"
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
                />
              </div>
              <div>
                <span className="text-xs text-gray-600 font-semibold block mb-1">อาหารกลางวัน (กล่อง)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={lunch}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setLunch(val === '' ? '' : parseInt(val, 10));
                  }}
                  placeholder="0"
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
                />
              </div>
              <div>
                <span className="text-xs text-gray-600 font-semibold block mb-1">เครื่องดื่ม (ขวด)</span>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={drinks}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '');
                    setDrinks(val === '' ? '' : parseInt(val, 10));
                  }}
                  placeholder="0"
                  className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
                />
              </div>
            </div>
          </div>

          {/* Seating Layout (รูปแบบการจัดโต๊ะประชุม) - แสดงเฉพาะห้องที่มีการเลือกไว้ในจัดการข้อมูล */}
          {hasRoomSeating && (
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs sm:text-sm font-bold text-gray-700 flex items-center gap-1.5">
                  <LayoutGrid size={15} className="text-[#C8102E]" />
                  <span>รูปแบบการจัดโต๊ะประชุม</span>
                  <span className="text-red-500">*</span>
                </label>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  ห้องนี้รองรับ {roomSeatingOptions.length} รูปแบบ
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {roomSeatingOptions.map((seatOption) => {
                  const isSelected = seatingSetup === seatOption;
                  return (
                    <label
                      key={seatOption}
                      className={`flex items-center justify-between p-2.5 sm:p-3 rounded-xl border cursor-pointer transition text-xs sm:text-sm ${
                        isSelected
                          ? 'bg-red-50/80 border-[#C8102E] text-red-950 font-bold shadow-2xs'
                          : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <input
                          type="radio"
                          name="seatingSetup"
                          value={seatOption}
                          checked={isSelected}
                          onChange={() => setSeatingSetup(seatOption)}
                          className="w-4 h-4 text-[#C8102E] focus:ring-[#C8102E] accent-[#C8102E] shrink-0"
                        />
                        <span className="leading-snug">{seatOption}</span>
                      </div>
                      <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 shrink-0 ml-2">
                        รองรับประจำห้อง
                      </span>
                    </label>
                  );
                })}

                {/* Any additional custom seating layout already selected */}
                {seatingSetup && !roomSeatingOptions.includes(seatingSetup) && (
                  <label
                    key={seatingSetup}
                    className="flex items-center justify-between p-2.5 sm:p-3 rounded-xl border cursor-pointer transition text-xs sm:text-sm bg-red-50/80 border-[#C8102E] text-red-950 font-bold shadow-2xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <input
                        type="radio"
                        name="seatingSetup"
                        value={seatingSetup}
                        checked={true}
                        onChange={() => {}}
                        className="w-4 h-4 text-[#C8102E] focus:ring-[#C8102E] accent-[#C8102E] shrink-0"
                      />
                      <span className="leading-snug">{seatingSetup}</span>
                    </div>
                    <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200 shrink-0 ml-2">
                      ระบุเดิม
                    </span>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Equipment Checkboxes matching Room Management */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs sm:text-sm font-bold text-gray-700 flex items-center gap-1.5">
                <Wrench size={15} className="text-[#C8102E]" />
                <span>อุปกรณ์ที่ขอใช้</span>
              </label>
              {hasRoomEquipment ? (
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                  อุปกรณ์ประจำห้อง {availableEquipmentList.length} รายการ
                </span>
              ) : (
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  ตัวเลือกเริ่มต้น 3 รายการ
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {availableEquipmentList.map((item) => {
                const isRoomInstalled = hasRoomEquipment;
                const isChecked = equipment.includes(item);
                return (
                  <label
                    key={item}
                    className={`flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition text-xs sm:text-sm ${
                      isChecked
                        ? 'bg-red-50/80 border-[#C8102E] text-red-950 font-bold shadow-2xs'
                        : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleEquipmentChange(item)}
                      className="rounded text-[#C8102E] focus:ring-[#C8102E] w-4 h-4 mt-0.5 accent-[#C8102E] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="leading-tight block">{item}</span>
                      {isRoomInstalled ? (
                        <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200 inline-block mt-0.5">
                          มีประจำห้อง
                        </span>
                      ) : (
                        <span className="text-[10px] text-blue-700 font-normal bg-blue-50 px-1.5 py-0.2 rounded border border-blue-200 inline-block mt-0.5">
                          ตัวเลือกเริ่มต้น
                        </span>
                      )}
                    </div>
                  </label>
                );
              })}

              {/* Any additional custom equipment already added by the user */}
              {equipment
                .filter((item) => !availableEquipmentList.includes(item))
                .map((customItem) => (
                  <label
                    key={customItem}
                    className="flex items-start gap-2 p-2.5 rounded-xl border cursor-pointer transition text-xs sm:text-sm bg-red-50/80 border-[#C8102E] text-red-950 font-bold shadow-2xs"
                  >
                    <input
                      type="checkbox"
                      checked={true}
                      onChange={() => handleEquipmentChange(customItem)}
                      className="rounded text-[#C8102E] focus:ring-[#C8102E] w-4 h-4 mt-0.5 accent-[#C8102E] shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <span className="leading-tight block">{customItem}</span>
                      <span className="text-[10px] text-amber-700 font-medium bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200 inline-block mt-0.5">
                        ระบุเพิ่มเติม
                      </span>
                    </div>
                  </label>
                ))}
            </div>
          </div>

          {/* Meeting Format (Onsite / Online - without link input) */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5">
              รูปแบบการประชุม <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-4 sm:gap-6 bg-gray-50 p-3 sm:p-3.5 rounded-2xl border border-gray-200">
              <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-bold text-gray-700 hover:text-gray-900 transition">
                <input
                  type="radio"
                  name="meetingType"
                  value="Onsite"
                  checked={meetingType === 'Onsite'}
                  onChange={() => setMeetingType('Onsite')}
                  className="w-4 h-4 text-[#C8102E] focus:ring-[#C8102E]"
                />
                <span>Onsite (ที่ห้องประชุม)</span>
              </label>
              <label className="flex items-center gap-2.5 cursor-pointer text-xs sm:text-sm font-bold text-gray-700 hover:text-gray-900 transition">
                <input
                  type="radio"
                  name="meetingType"
                  value="Online"
                  checked={meetingType === 'Online'}
                  onChange={() => setMeetingType('Online')}
                  className="w-4 h-4 text-[#C8102E] focus:ring-[#C8102E]"
                />
                <span>Online (ประชุมทางไกล)</span>
              </label>
            </div>
          </div>

          {/* Notes / Other details field with responsive width */}
          <div>
            <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1 flex items-center gap-1.5">
              <FileText size={14} className="text-gray-400" />
              <span>หมายเหตุ หรือรายละเอียดอื่นๆ เพิ่มเติม (ถ้ามี)</span>
            </label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="ระบุหมายเหตุ หรือรายละเอียดอื่นๆ ที่ต้องการแจ้งเพิ่มเติม..."
              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E] resize-y min-h-[56px]"
            />
          </div>

          {/* Submit Actions */}
          <div className="pt-3 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-2xl transition text-sm"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-2 py-3 bg-[#C8102E] hover:bg-[#a00c24] text-white font-bold rounded-2xl transition text-sm shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <span>{bookingData ? 'บันทึกการแก้ไข' : 'ส่งคำขอจองห้องประชุม'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
