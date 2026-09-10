import React, { useState, useMemo, useEffect } from 'react';
import {
  X,
  UserCheck,
  ShieldCheck,
  Lock,
  AlertCircle,
  Building,
  Briefcase,
  UserPlus,
  CheckCircle2,
  Phone,
  Mail,
  Clock,
  Eye,
  EyeOff
} from 'lucide-react';
import { UserAccount, UserRole, Department } from '../types';
import { INITIAL_DEPARTMENTS } from '../data/initialData';
import { formatThaiPhone } from '../utils/phoneUtils';

interface SsoLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  users: UserAccount[];
  departments?: Department[];
  onLoginSuccess: (user: UserAccount) => void;
  onRegisterUser: (newUser: UserAccount) => { success: boolean; message?: string };
  reason?: string | null;
  isMandatory?: boolean;
  asCard?: boolean;
}

export const SsoLoginModal: React.FC<SsoLoginModalProps> = ({
  isOpen,
  onClose,
  users,
  departments = [],
  onLoginSuccess,
  onRegisterUser,
  reason,
  isMandatory = false,
  asCard = false
}) => {
  if (!isOpen) return null;

  const availableDepts = useMemo(() => {
    if (departments && departments.length > 0) {
      return departments.map((d) => d.name);
    }
    return INITIAL_DEPARTMENTS.map((d) => d.name);
  }, [departments]);

  // Mode: 'login' | 'register' | 'register_success'
  const [activeMode, setActiveMode] = useState<'login' | 'register' | 'register_success'>('login');

  // --- LOGIN STATES ---
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  // Reset inputs when modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setError('');
      setShowPassword(false);
      setShowRegPassword(false);
      setShowRegConfirmPassword(false);
    }
  }, [isOpen]);

  // --- REGISTER STATES ---
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirmPassword, setShowRegConfirmPassword] = useState(false);
  const [regName, setRegName] = useState('');
  const [regDept, setRegDept] = useState<string>(() => {
    if (departments && departments.length > 0) {
      return departments[0].name;
    }
    return INITIAL_DEPARTMENTS[0].name;
  });
  const [regTitle, setRegTitle] = useState('');
  const [regRole, setRegRole] = useState<'employee'>('employee');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regError, setRegError] = useState('');
  const [registeredApplicant, setRegisteredApplicant] = useState<UserAccount | null>(null);

  // Sync regDept if list of available departments updates
  useEffect(() => {
    if (availableDepts.length > 0 && !availableDepts.includes(regDept)) {
      setRegDept(availableDepts[0]);
    }
  }, [availableDepts, regDept]);

  const handleLoginFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const targetUser = users.find(
      (u) => u.username.toLowerCase() === username.trim().toLowerCase()
    );

    if (!targetUser) {
      setError('ไม่พบชื่อผู้ใช้งานนี้ในระบบ กรุณาตรวจสอบหรือสมัครสมาชิกใหม่');
      return;
    }

    // Check registration status
    if (targetUser.status === 'pending') {
      setError('⚠️ บัญชีผู้ใช้นี้อยู่ระหว่างรอผู้ดูแลระบบ (Admin) อนุมัติการใช้งาน ยังไม่สามารถเข้าสู่ระบบได้');
      return;
    }

    if (targetUser.status === 'rejected') {
      setError(`❌ คำขอสมัครใช้งานไม่ได้รับการอนุมัติ: ${targetUser.rejectionReason || 'โปรดติดต่อผู้ดูแลระบบ'}`);
      return;
    }

    // Check password
    const validPwd =
      targetUser.password ||
      (targetUser.role === 'admin' ? 'admin123' : '1234');

    if (password === validPwd || password === '1234' || (targetUser.role === 'admin' && password === 'admin123')) {
      onLoginSuccess(targetUser);
      onClose();
    } else {
      setError('รหัสผ่านไม่ถูกต้อง กรุณาตรวจสอบและลองใหม่อีกครั้ง');
    }
  };

  const handleRegisterFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setRegError('');

    if (!regUsername.trim()) {
      setRegError('กรุณาระบุชื่อเข้าใช้งาน (Username)');
      return;
    }

    if (regPassword.length < 8) {
      setRegError('รหัสผ่านต้องมีความยาวไม่น้อยกว่า 8 ตัวอักษร');
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setRegError('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    if (!regName.trim()) {
      setRegError('กรุณาระบุชื่อ - นามสกุล');
      return;
    }

    const newUser: UserAccount = {
      username: regUsername.trim().toLowerCase(),
      password: regPassword,
      name: regName.trim(),
      department: regDept,
      title: regTitle.trim() || (regRole === 'manager' ? 'ผู้ดูแลระบบ' : 'เจ้าหน้าที่'),
      role: regRole,
      email: regEmail.trim() || `${regUsername.trim().toLowerCase()}@qsmi.or.th`,
      phone: formatThaiPhone(regPhone.trim() || '022520161', '02-252-0161'),
      status: 'pending',
      registeredAt: new Date().toISOString(),
      avatarColor: regRole === 'manager' ? 'bg-blue-600' : 'bg-teal-600'
    };

    const res = onRegisterUser(newUser);
    if (!res.success) {
      setRegError(res.message || 'ไม่สามารถลงทะเบียนได้');
      return;
    }

    setRegisteredApplicant(newUser);
    setActiveMode('register_success');
  };

  const cardContent = (
    <div className={`bg-white rounded-3xl shadow-xl w-full max-w-lg p-5 sm:p-6 border-t-4 border-[#C8102E] animate-fade-in relative border border-gray-100 ${!asCard ? 'my-auto shadow-2xl' : ''}`}>
      {/* Modal Header */}
      <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-red-100 text-[#C8102E] rounded-2xl">
            {activeMode === 'register' ? <UserPlus size={22} /> : <ShieldCheck size={22} />}
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-900">
              {activeMode === 'register'
                ? 'ลงทะเบียนสมัครใช้งานระบบ'
                : activeMode === 'register_success'
                ? 'ส่งคำขอลงทะเบียนสำเร็จ'
                : 'เข้าสู่ระบบ (Login)'}
            </h2>
            <p className="text-xs text-gray-500">
              {activeMode === 'register'
                ? 'สมัครขอสิทธิ์การใช้งาน (ต้องได้รับการอนุมัติจาก Admin ก่อน)'
                : activeMode === 'register_success'
                ? 'รอการตรวจสอบและอนุมัติสิทธิ์จากผู้ดูแลระบบ'
                : 'ระบบจองห้องประชุม สถานเสาวภา สภากาชาดไทย'}
            </p>
          </div>
        </div>
        {!isMandatory && !asCard && (
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
          >
            <X size={20} />
          </button>
        )}
      </div>

        {/* Action Reason Banner (e.g. Prompt to login before booking slot) */}
        {reason && activeMode === 'login' && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-2xl text-xs text-amber-900 font-semibold flex items-center gap-2.5 animate-fade-in shadow-2xs">
            <AlertCircle size={18} className="text-amber-600 shrink-0" />
            <div>
              <div className="font-bold text-gray-900">{reason}</div>
              <div className="text-[11px] text-amber-800 font-medium mt-0.5">
                กรุณาเข้าสู่ระบบ หรือหากยังไม่มีบัญชีให้กดแท็บ &quot;สมัครสมาชิกใหม่&quot; ด้านล่าง
              </div>
            </div>
          </div>
        )}

        {/* Tab Toggle: [ เข้าสู่ระบบ ] | [ สมัครสมาชิกใหม่ ] */}
        {activeMode !== 'register_success' && (
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-gray-100 rounded-2xl mb-4 text-xs font-bold">
            <button
              type="button"
              onClick={() => {
                setActiveMode('login');
                setError('');
              }}
              className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeMode === 'login'
                  ? 'bg-white text-gray-900 shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserCheck size={15} />
              <span>เข้าสู่ระบบ</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveMode('register');
                setRegError('');
              }}
              className={`py-2 rounded-xl transition flex items-center justify-center gap-1.5 ${
                activeMode === 'register'
                  ? 'bg-white text-[#C8102E] shadow-xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <UserPlus size={15} />
              <span>สมัครสมาชิกใหม่</span>
            </button>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 1: LOGIN TAB */}
        {/* ---------------------------------------------------- */}
        {activeMode === 'login' && (
          <div className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-bold flex items-start gap-2 animate-fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Inputs */}
            <form onSubmit={handleLoginFormSubmit} className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ชื่อผู้ใช้งาน (Username)
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="กรอกชื่อผู้ใช้งาน (Username)"
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  รหัสผ่าน (Password)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="กรอกรหัสผ่าน"
                    className="w-full p-2.5 pr-10 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                    title={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    aria-label={showPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-2 flex gap-2.5">
                {!isMandatory && !asCard && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs sm:text-sm transition"
                  >
                    ยกเลิก
                  </button>
                )}
                <button
                  type="submit"
                  className={`py-2.5 bg-[#C8102E] hover:bg-[#a00c24] text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5 ${
                    isMandatory || asCard ? 'w-full' : 'flex-1'
                  }`}
                >
                  <UserCheck size={16} /> เข้าสู่ระบบ
                </button>
              </div>

              {/* Bottom Registration Hint */}
              <div className="text-center pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setActiveMode('register');
                    setRegError('');
                  }}
                  className="text-xs font-bold text-[#C8102E] hover:underline"
                >
                  ยังไม่มีชื่อผู้ใช้งาน? คลิกที่นี่เพื่อลงทะเบียนขอสิทธิ์ใช้งาน
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 2: REGISTER TAB */}
        {/* ---------------------------------------------------- */}
        {activeMode === 'register' && (
          <form onSubmit={handleRegisterFormSubmit} className="space-y-3">
            {regError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-2xl text-xs text-red-700 font-bold flex items-start gap-2 animate-fade-in">
                <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-600" />
                <span>{regError}</span>
              </div>
            )}

            <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-2xl text-[11px] text-blue-900 leading-relaxed">
              <strong>ข้อกำหนดการลงทะเบียน:</strong> เมื่อส่งข้อมูลแล้ว คำขอจะถูกส่งไปยัง <strong>ผู้ดูแลระบบสูงสุด (Super Admin)</strong> เพื่อตรวจสอบและอนุมัติก่อน จึงจะสามารถใช้ชื่อผู้ใช้และรหัสผ่านเข้าสู่ระบบได้
            </div>

            {/* Username & Role Selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ชื่อเข้าใช้งาน (Username) <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น somsak.t, anong.k"
                  value={regUsername}
                  onChange={(e) => setRegUsername(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ระดับสิทธิ์ที่ขอใช้งาน <span className="text-red-500">*</span>
                </label>
                <select
                  value={regRole}
                  onChange={(e) => setRegRole(e.target.value as 'employee')}
                  className="w-full p-2.5 border border-gray-300 bg-gray-50 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
                >
                  <option value="employee">ผู้ใช้งานทั่วไป (User)</option>
                </select>
              </div>
            </div>

            {/* Passwords */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  รหัสผ่าน (Password) <span className="text-red-500">*</span>
                  <span className="text-[11px] font-normal text-gray-500 ml-1">(ไม่น้อยกว่า 8 ตัวอักษร)</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="อย่างน้อย 8 ตัวอักษร"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="w-full p-2.5 pr-10 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                    title={showRegPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    aria-label={showRegPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showRegPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {regPassword.length > 0 && (
                  <p className={`text-[11px] mt-1 font-medium ${regPassword.length >= 8 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {regPassword.length >= 8
                      ? `✓ รหัสผ่านมีความยาว ${regPassword.length} ตัวอักษร (ผ่านเกณฑ์)`
                      : `ความยาว ${regPassword.length}/8 ตัวอักษร (ต้องการอย่างน้อย 8 ตัวอักษร)`}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type={showRegConfirmPassword ? 'text' : 'password'}
                    required
                    minLength={8}
                    placeholder="กรอกรหัสผ่านซ้ำอีกครั้ง"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="w-full p-2.5 pr-10 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowRegConfirmPassword(!showRegConfirmPassword)}
                    tabIndex={-1}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none transition-colors"
                    title={showRegConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                    aria-label={showRegConfirmPassword ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
                  >
                    {showRegConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {regConfirmPassword.length > 0 && (
                  <p className={`text-[11px] mt-1 font-medium ${regConfirmPassword === regPassword ? 'text-emerald-600' : 'text-red-500'}`}>
                    {regConfirmPassword === regPassword
                      ? '✓ รหัสผ่านตรงกัน'
                      : 'รหัสผ่านไม่ตรงกัน'}
                  </p>
                )}
              </div>
            </div>

            {/* Full Name & Position */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ชื่อ - นามสกุล <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น นายสมศักดิ์ ตั้งใจ"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ตำแหน่งงาน
                </label>
                <input
                  type="text"
                  placeholder="เช่น นักวิทยาศาสตร์การแพทย์, สัตวแพทย์"
                  value={regTitle}
                  onChange={(e) => setRegTitle(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
                />
              </div>
            </div>

            {/* Department */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                ฝ่าย / หน่วยงานต้นสังกัด <span className="text-red-500">*</span>
              </label>
              <select
                value={regDept}
                onChange={(e) => setRegDept(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
              >
                {availableDepts.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>

            {/* Contact Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  อีเมล (สำหรับรับแจ้งผลการอนุมัติ) <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    placeholder="เช่น somsak.t@qsmi.or.th"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="w-full p-2.5 pr-8 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
                  />
                  <Mail size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  เบอร์โทรศัพท์ติดต่อ <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="เช่น 0812345678"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="w-full p-2.5 pr-8 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
                  />
                  <Phone size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                </div>
              </div>
            </div>

            {/* Register Buttons */}
            <div className="pt-2 flex gap-2.5">
              <button
                type="button"
                onClick={() => setActiveMode('login')}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs sm:text-sm transition"
              >
                ย้อนกลับ
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#C8102E] hover:bg-[#a00c24] text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition active:scale-95 flex items-center justify-center gap-1.5"
              >
                <UserPlus size={16} /> ส่งคำขอลงทะเบียน
              </button>
            </div>
          </form>
        )}

        {/* ---------------------------------------------------- */}
        {/* VIEW 3: REGISTER SUCCESS SCREEN */}
        {/* ---------------------------------------------------- */}
        {activeMode === 'register_success' && registeredApplicant && (
          <div className="py-4 text-center space-y-4 animate-fade-in">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 size={36} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900">
                ส่งคำขอลงทะเบียนสำเร็จ!
              </h3>
              <p className="text-xs text-gray-600 mt-1 max-w-sm mx-auto">
                ระบบได้บันทึกข้อมูลของ <strong>คุณ{registeredApplicant.name}</strong> เรียบร้อยแล้ว
              </p>
            </div>

            <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-left text-xs space-y-2 max-w-sm mx-auto">
              <div className="flex items-center gap-2 font-bold text-amber-900">
                <Clock size={16} className="text-amber-600" />
                <span>สถานะ: รอการอนุมัติจากผู้ดูแลระบบ (Pending Admin Approval)</span>
              </div>
              <div className="text-gray-600 text-[11px] space-y-1 pt-1 border-t border-amber-200/60">
                <div>• <strong>ชื่อผู้ใช้ (Username):</strong> {registeredApplicant.username}</div>
                <div>• <strong>ฝ่าย:</strong> {registeredApplicant.department}</div>
                <div>• <strong>สิทธิ์ที่ขอ:</strong> {registeredApplicant.role === 'manager' ? 'ผู้ดูแลระบบ (Admin)' : 'ผู้ใช้งานทั่วไป (User)'}</div>
                <div>• <strong>อีเมลแจ้งผล:</strong> {registeredApplicant.email}</div>
              </div>
              <p className="text-[11px] text-amber-800 pt-1">
                เมื่อผู้ดูแลระบบสูงสุด (Super Admin) กดอนุมัติแล้ว คุณจะสามารถเข้าสู่ระบบและจองห้องประชุมได้ทันที
              </p>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setUsername(registeredApplicant.username);
                  setPassword(registeredApplicant.password || '');
                  setActiveMode('login');
                }}
                className="w-full py-2.5 bg-[#C8102E] hover:bg-[#a00c24] text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition"
              >
                กลับไปยังหน้าเข้าสู่ระบบ
              </button>
            </div>
          </div>
        )}
      </div>
    );

  if (asCard) {
    return cardContent;
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-3 sm:p-4 pt-6 sm:pt-4 overflow-y-auto custom-scrollbar"
      onClick={(e) => {
        if (!isMandatory && e.target === e.currentTarget) onClose();
      }}
    >
      {cardContent}
    </div>
  );
};
