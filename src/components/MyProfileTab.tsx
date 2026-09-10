import React, { useState, useEffect } from 'react';
import {
  User,
  Building,
  Briefcase,
  Mail,
  Phone,
  Lock,
  ShieldCheck,
  CheckCircle2,
  CalendarCheck,
  Clock,
  Sparkles,
  Save,
  Key,
  Eye,
  EyeOff,
  Palette,
  AlertCircle
} from 'lucide-react';
import { UserAccount, UserRole, Booking, Room } from '../types';
import { formatThaiDate, formatThaiTime } from '../utils/thaiDate';
import { formatThaiPhone } from '../utils/phoneUtils';

interface MyProfileTabProps {
  currentUser: UserAccount;
  bookings: Booking[];
  rooms: Room[];
  onUpdateProfile: (updatedUser: UserAccount) => void;
  onViewBooking?: (booking: Booking) => void;
}

const QSMI_DEPARTMENTS = [
  'ฝ่ายบริหารงานทั่วไป',
  'ฝ่ายบริการและวิจัยคลินิก',
  'ฝ่ายวิจัยและพัฒนา',
  'สวนงู (Snake Farm)',
  'ฝ่ายผลิตเซรุ่มแก้พิษงู',
  'ฝ่ายผลิตวัคซีน',
  'ฝ่ายประกันคุณภาพ',
  'ฝ่ายสนับสนุนอาคารและเครื่องจักรกล',
  'ฝ่ายการเงินและพัสดุ',
  'ฝ่ายเทคโนโลยีสารสนเทศ'
];

const AVATAR_COLORS = [
  { name: 'แดงชาด (QSMI Red)', bg: 'bg-[#C8102E]', ring: 'ring-[#C8102E]' },
  { name: 'ม่วงเข้ม (Royal Purple)', bg: 'bg-purple-600', ring: 'ring-purple-600' },
  { name: 'น้ำเงินกรม (Navy Blue)', bg: 'bg-blue-600', ring: 'ring-blue-600' },
  { name: 'เขียวมรกต (Emerald)', bg: 'bg-emerald-600', ring: 'ring-emerald-600' },
  { name: 'ส้มอำพัน (Amber)', bg: 'bg-amber-600', ring: 'ring-amber-600' },
  { name: 'กุหลาบ (Rose)', bg: 'bg-rose-600', ring: 'ring-rose-600' },
  { name: 'ฟ้าคราม (Cyan)', bg: 'bg-cyan-600', ring: 'ring-cyan-600' },
  { name: 'เทาสเลท (Slate)', bg: 'bg-slate-700', ring: 'ring-slate-700' }
];

export const MyProfileTab: React.FC<MyProfileTabProps> = ({
  currentUser,
  bookings,
  rooms,
  onUpdateProfile,
  onViewBooking
}) => {
  // Form State initialized with current user
  const [name, setName] = useState(currentUser.name || '');
  const [department, setDepartment] = useState(currentUser.department || QSMI_DEPARTMENTS[0]);
  const [title, setTitle] = useState(currentUser.title || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [phone, setPhone] = useState(formatThaiPhone(currentUser.phone || '', ''));
  const [avatarColor, setAvatarColor] = useState(currentUser.avatarColor || 'bg-[#C8102E]');
  const [password, setPassword] = useState(currentUser.password || '1234');
  const [confirmPassword, setConfirmPassword] = useState(currentUser.password || '1234');
  const [showPassword, setShowPassword] = useState(false);
  const [isSavedRecently, setIsSavedRecently] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync if currentUser prop changes
  useEffect(() => {
    setName(currentUser.name || '');
    setDepartment(currentUser.department || QSMI_DEPARTMENTS[0]);
    setTitle(currentUser.title || '');
    setEmail(currentUser.email || '');
    setPhone(formatThaiPhone(currentUser.phone || '', ''));
    setAvatarColor(currentUser.avatarColor || 'bg-[#C8102E]');
    setPassword(currentUser.password || '1234');
    setConfirmPassword(currentUser.password || '1234');
  }, [currentUser]);

  // Compute stats for current user
  const myBookings = bookings.filter((b) => {
    if (b.username && b.username.toLowerCase() === currentUser.username.toLowerCase()) return true;
    if (currentUser.name && b.requesterName.trim().toLowerCase() === currentUser.name.trim().toLowerCase()) return true;
    return false;
  });

  const totalBookingsCount = myBookings.length;
  const approvedBookingsCount = myBookings.filter((b) => b.status === 'approved').length;
  const pendingBookingsCount = myBookings.filter((b) => b.status === 'pending').length;
  const cancelledBookingsCount = myBookings.filter((b) => b.status === 'cancelled' || b.status === 'rejected').length;

  // Upcoming approved bookings
  const now = new Date();
  const upcomingBooking = myBookings
    .filter((b) => b.status === 'approved' && new Date(b.endTime) >= now)
    .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())[0];

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('กรุณากรอกชื่อ-นามสกุล');
      return;
    }

    if (password && password !== (currentUser.password || '1234') && password.length < 8) {
      setErrorMsg('รหัสผ่านต้องมีความยาวไม่น้อยกว่า 8 ตัวอักษร');
      return;
    }

    if (password && password !== confirmPassword) {
      setErrorMsg('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    const updated: UserAccount = {
      ...currentUser,
      name: name.trim(),
      department: department.trim(),
      title: title.trim(),
      email: email.trim(),
      phone: formatThaiPhone(phone.trim(), '') || phone.trim(),
      avatarColor,
      password: password || currentUser.password || '1234'
    };

    onUpdateProfile(updated);
    setIsSavedRecently(true);
    setTimeout(() => {
      setIsSavedRecently(false);
    }, 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header / Intro */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-gray-100 pb-4">
        <div>
          <h3 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            <User className="text-[#C8102E]" size={22} />
            <span>จัดการข้อมูลส่วนตัว (My Profile)</span>
          </h3>
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
            ดูและแก้ไขข้อมูลส่วนตัว ตำแหน่ง สังกัดฝ่าย ช่องทางติดต่อ และรหัสผ่านของคุณ
          </p>
        </div>

        {/* Role Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
              currentUser.role === 'admin'
                ? 'bg-purple-50 text-purple-800 border-purple-200'
                : currentUser.role === 'manager'
                ? 'bg-blue-50 text-blue-800 border-blue-200'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
          >
            <ShieldCheck size={14} />
            <span>
              {currentUser.role === 'admin'
                ? 'ระดับ: ผู้ดูแลระบบสูงสุด (Super Admin)'
                : currentUser.role === 'manager'
                ? 'ระดับ: ผู้ดูแลระบบ (Admin)'
                : 'ระดับ: ผู้ใช้งานทั่วไป (User)'}
            </span>
          </span>
        </div>
      </div>

      {/* Grid: Left Column (Profile & Editable Form), Right Column (Stats & Role Permissions Info) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Profile Card + Edit Form (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Identity Header Card */}
          <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl p-5 shadow-sm border border-gray-800 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-44 h-44 bg-red-600/10 rounded-full blur-2xl pointer-events-none" />
            <div className="flex items-center gap-4 relative z-10">
              <div
                className={`w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center text-white font-extrabold text-2xl sm:text-3xl shadow-md shrink-0 ring-4 ring-white/10 ${avatarColor}`}
              >
                {(name || currentUser?.name || currentUser?.username || 'U').charAt(0).toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-lg sm:text-xl font-bold truncate text-white">{name || currentUser?.name || currentUser?.username || 'ผู้ใช้งาน'}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 size={10} /> บัญชีได้รับการอนุมัติแล้ว
                  </span>
                </div>
                <div className="text-xs text-gray-300 mt-1 flex flex-wrap items-center gap-2">
                  <span className="flex items-center gap-1">
                    <Building size={12} className="text-gray-400" />
                    {department}
                  </span>
                  {title && (
                    <span className="flex items-center gap-1">
                      <Briefcase size={12} className="text-gray-400" />
                      {title}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-gray-400 mt-1 font-mono">
                  ชื่อผู้ใช้งาน: <strong className="text-gray-200">@{currentUser.username}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSave} className="bg-white border border-gray-200 rounded-2xl p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <h4 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
                <Sparkles size={18} className="text-[#C8102E]" />
                <span>แก้ไขข้อมูลส่วนตัว</span>
              </h4>
              <span className="text-[11px] text-gray-400">* บันทึกแล้วจะมีผลทันที</span>
            </div>

            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-start gap-2">
                <AlertCircle size={15} className="shrink-0 mt-0.5 text-red-500" />
                <span>{errorMsg}</span>
              </div>
            )}

            {isSavedRecently && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2 animate-fade-in">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span className="font-semibold">บันทึกข้อมูลส่วนตัวและรหัสผ่านเรียบร้อยแล้ว</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Name */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ชื่อ - นามสกุล <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="เช่น นพ. สมชาย ใจดี"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E] focus:bg-white"
                  />
                </div>
              </div>

              {/* Department */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ฝ่าย / สังกัดหน่วยงาน <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E] focus:bg-white cursor-pointer"
                  >
                    {QSMI_DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ตำแหน่งงาน
                </label>
                <div className="relative">
                  <Briefcase size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="เช่น หัวหน้าฝ่าย, นักวิจัยชำนาญการ"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E] focus:bg-white"
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  อีเมล (สำหรับรับข้อความแจ้งเตือน)
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="somchai@qsmi.or.th"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E] focus:bg-white"
                  />
                </div>
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  เบอร์โทรศัพท์ / เบอร์ภายใน
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => setPhone((prev) => (prev ? formatThaiPhone(prev, '') || prev : ''))}
                    placeholder="02-252-0161 ต่อ 123"
                    className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E] focus:bg-white"
                  />
                </div>
              </div>
            </div>

            {/* Avatar Theme Color */}
            <div className="pt-2">
              <label className="block text-xs font-bold text-gray-700 mb-1.5 flex items-center gap-1.5">
                <Palette size={14} className="text-gray-500" />
                <span>เลือกสีรูปประจำตัว (Avatar Color):</span>
              </label>
              <div className="flex flex-wrap gap-2.5 items-center">
                {AVATAR_COLORS.map((col) => (
                  <button
                    key={col.bg}
                    type="button"
                    onClick={() => setAvatarColor(col.bg)}
                    className={`w-7 h-7 rounded-full ${col.bg} transition transform hover:scale-110 flex items-center justify-center text-white text-xs ${
                      avatarColor === col.bg ? 'ring-3 ring-offset-2 ring-gray-900 shadow-xs' : 'opacity-80'
                    }`}
                    title={col.name}
                  >
                    {avatarColor === col.bg && <CheckCircle2 size={14} />}
                  </button>
                ))}
              </div>
            </div>

            {/* Change Password Section */}
            <div className="pt-4 border-t border-gray-100 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
                  <Key size={14} className="text-amber-500" />
                  <span>เปลี่ยนรหัสผ่าน (Password)</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-[11px] text-gray-500 hover:text-gray-800 flex items-center gap-1"
                >
                  {showPassword ? <EyeOff size={13} /> : <Eye size={13} />}
                  <span>{showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      minLength={8}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)"
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E] focus:bg-white"
                    />
                  </div>
                </div>

                <div>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      minLength={8}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="ยืนยันรหัสผ่านใหม่"
                      className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E] focus:bg-white"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 bg-[#C8102E] hover:bg-[#a60d26] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition flex items-center justify-center gap-2"
              >
                <Save size={16} />
                <span>บันทึกการเปลี่ยนแปลงข้อมูลส่วนตัว</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Role Permissions Breakdown & Personal Activity (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Role Permissions Card */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs space-y-3">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <ShieldCheck size={18} className="text-[#C8102E]" />
              <span>สรุปสิทธิ์การใช้งาน 3 ระดับในระบบ</span>
            </h4>

            <div className="space-y-2.5 text-xs">
              {/* Level 1: Super Admin */}
              <div
                className={`p-3 rounded-xl border transition ${
                  currentUser.role === 'admin'
                    ? 'bg-purple-50/80 border-purple-300 ring-1 ring-purple-300'
                    : 'bg-gray-50 border-gray-200 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-purple-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-600" />
                    ผู้ดูแลระบบสูงสุด (Super Admin)
                  </span>
                  {currentUser.role === 'admin' && (
                    <span className="text-[10px] font-bold bg-purple-600 text-white px-2 py-0.2 rounded-full">
                      สิทธิ์ปัจจุบันของคุณ
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  จัดการการตั้งค่าทั้งหมด, เพิ่ม/ลบ/แก้ไขจัดการผู้ใช้งาน, จัดการห้องประชุม & ปิดกั้น, อนุมัติการจองทุกฝ่าย และดูรายงานสถิติทั้งหมด
                </p>
              </div>

              {/* Level 2: Admin (Manager) */}
              <div
                className={`p-3 rounded-xl border transition ${
                  currentUser.role === 'manager'
                    ? 'bg-blue-50/80 border-blue-300 ring-1 ring-blue-300'
                    : 'bg-gray-50 border-gray-200 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-blue-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    ผู้ดูแลระบบ (Admin)
                  </span>
                  {currentUser.role === 'manager' && (
                    <span className="text-[10px] font-bold bg-blue-600 text-white px-2 py-0.2 rounded-full">
                      สิทธิ์ปัจจุบันของคุณ
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  สามารถตรวจรับรองและอนุมัติคำขอจองห้องประชุมของ User ทุกคนได้, ดูหน้าสถิติและรายงาน, จัดการรายการจอง และจัดการข้อมูลส่วนตัว
                </p>
              </div>

              {/* Level 3: User */}
              <div
                className={`p-3 rounded-xl border transition ${
                  currentUser.role === 'employee'
                    ? 'bg-emerald-50/80 border-emerald-300 ring-1 ring-emerald-300'
                    : 'bg-gray-50 border-gray-200 opacity-70'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600" />
                    ผู้ใช้งานทั่วไป (User)
                  </span>
                  {currentUser.role === 'employee' && (
                    <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.2 rounded-full">
                      สิทธิ์ปัจจุบันของคุณ
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  สามารถจองห้องประชุมและดูสถานะห้อง, รายการจองของฉัน, และจัดการข้อมูลส่วนตัว ได้เท่านั้น
                </p>
              </div>
            </div>
          </div>

          {/* Personal Booking Stats */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-2xs space-y-3">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-2.5">
              <CalendarCheck size={18} className="text-[#C8102E]" />
              <span>สถิติการจองห้องประชุมของคุณ</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl text-center">
                <div className="text-lg sm:text-xl font-extrabold text-gray-900">{totalBookingsCount}</div>
                <div className="text-[10px] text-gray-500 font-semibold mt-0.5">จองทั้งหมด</div>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                <div className="text-lg sm:text-xl font-extrabold text-emerald-700">{approvedBookingsCount}</div>
                <div className="text-[10px] text-emerald-700 font-semibold mt-0.5">อนุมัติแล้ว</div>
              </div>
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                <div className="text-lg sm:text-xl font-extrabold text-amber-700">{pendingBookingsCount}</div>
                <div className="text-[10px] text-amber-700 font-semibold mt-0.5">รอพิจารณา</div>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-center">
                <div className="text-lg sm:text-xl font-extrabold text-red-700">{cancelledBookingsCount}</div>
                <div className="text-[10px] text-red-700 font-semibold mt-0.5">ยกเลิก/ปฏิเสธ</div>
              </div>
            </div>

            {/* Upcoming Meeting Card */}
            {upcomingBooking && (
              <div className="mt-3 p-3.5 bg-red-50/60 border border-red-200/80 rounded-xl">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[11px] font-bold text-[#C8102E] flex items-center gap-1">
                    <Clock size={12} /> การประชุมที่กำลังจะมาถึง
                  </span>
                  <span className="text-[10px] font-mono text-gray-500">{upcomingBooking.id}</span>
                </div>
                <div className="font-bold text-xs text-gray-900 line-clamp-1">{upcomingBooking.topic}</div>
                <div className="text-[11px] text-gray-600 mt-1 flex items-center gap-2 flex-wrap">
                  <span>
                    ห้อง: <strong>{rooms.find((r) => r.id === upcomingBooking.roomId)?.name || upcomingBooking.roomId}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    {formatThaiDate(new Date(upcomingBooking.startTime), { day: 'numeric', month: 'short' })} (
                    {formatThaiTime(new Date(upcomingBooking.startTime), { hour: '2-digit', minute: '2-digit' })} -{' '}
                    {formatThaiTime(new Date(upcomingBooking.endTime), { hour: '2-digit', minute: '2-digit' })})
                  </span>
                </div>
                {onViewBooking && (
                  <div className="mt-2 text-right">
                    <button
                      type="button"
                      onClick={() => onViewBooking(upcomingBooking)}
                      className="text-xs font-bold text-[#C8102E] hover:underline"
                    >
                      ดูรายละเอียดการจอง →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
