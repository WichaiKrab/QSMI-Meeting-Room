import React, { useState } from 'react';
import {
  Calendar,
  ShieldCheck,
  CalendarCheck,
  Bell,
  HelpCircle,
  LogOut,
  Lock,
  ChevronDown,
  ChevronRight,
  Check
} from 'lucide-react';
import { UserAccount } from '../types';

interface HeaderProps {
  activePage: 'booking' | 'management';
  onChangePage: (page: 'booking' | 'management') => void;
  currentUser: UserAccount | null;
  unreadEmailCount: number;
  myBookingsCount: number;
  pendingDeptCount: number;
  pendingUsersCount?: number;
  totalNotificationsCount?: number;
  onOpenMyBookings: () => void;
  onOpenGuide: () => void;
  onOpenEmailInbox: () => void;
  onOpenNotifications: () => void;
  onOpenLoginModal: () => void;
  onLogoutUser: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activePage,
  onChangePage,
  currentUser,
  unreadEmailCount,
  myBookingsCount,
  pendingDeptCount,
  pendingUsersCount = 0,
  totalNotificationsCount = 0,
  onOpenMyBookings,
  onOpenGuide,
  onOpenNotifications,
  onOpenLoginModal,
  onLogoutUser
}) => {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  const totalPendingBadge =
    pendingDeptCount + (currentUser?.role === 'admin' ? pendingUsersCount : 0);

  return (
    <header className="bg-white shadow-xs border-b border-gray-200 sticky top-0 z-30 shrink-0">
      <div className="mx-auto px-3 sm:px-6 lg:px-8 py-2 sm:py-2.5 flex justify-between items-center w-full max-w-[1850px] gap-2">
        {/* Left: Brand Identity & Logo */}
        <div className="flex items-center space-x-2 sm:space-x-3.5 min-w-0 shrink-0">
          <div className="relative shrink-0">
            <img
              src="https://lh3.googleusercontent.com/d/1og-QqwMnWYP1g9iJXKiARJJmBZ07NJHN"
              alt="QSMI Logo"
              className="h-8 sm:h-10 w-auto object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 leading-tight truncate">
              ระบบจองห้องประชุม
            </h1>
          </div>
        </div>

        {/* Center: Primary Page Navigation Switcher (Desktop & Tablet only - hidden on mobile to prevent overflow) */}
        {currentUser ? (
          <div className="hidden md:flex items-center bg-gray-100/90 p-0.5 sm:p-1 rounded-2xl border border-gray-200 shadow-2xs shrink-0">
            {/* Tab 1: Main Booking Page */}
            <button
              type="button"
              onClick={() => onChangePage('booking')}
              className={`flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                activePage === 'booking'
                  ? 'bg-white text-[#C8102E] shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="หน้าหลักการจองห้องประชุม (ตรวจสอบห้องว่างและจองห้อง)"
            >
              <Calendar size={15} className="shrink-0" />
              <span>หน้าหลักการจองห้อง</span>
            </button>

            {/* Tab 2: User & Admin Management / Portal */}
            <button
              type="button"
              onClick={() => onChangePage('management')}
              className={`relative flex items-center gap-1 sm:gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold whitespace-nowrap transition ${
                activePage === 'management'
                  ? 'bg-white text-gray-900 shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              title="ระบบจัดการข้อมูลผู้ใช้งานและผู้ดูแลระบบ"
            >
              <ShieldCheck
                size={15}
                className={`shrink-0 ${
                  currentUser.role === 'admin'
                    ? 'text-purple-600'
                    : currentUser.role === 'manager'
                    ? 'text-blue-600'
                    : 'text-emerald-600'
                }`}
              />
              <span>
                {currentUser.role === 'admin'
                  ? 'จัดการข้อมูล (Super Admin)'
                  : currentUser.role === 'manager'
                  ? 'จัดการข้อมูล (Admin)'
                  : 'จัดการข้อมูล (User)'}
              </span>
              {totalPendingBadge > 0 && (
                <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-extrabold text-white bg-amber-500 rounded-full animate-pulse">
                  {totalPendingBadge}
                </span>
              )}
            </button>
          </div>
        ) : (
          /* When NOT logged in: Keep center clean */
          <div className="hidden lg:flex items-center gap-2 text-xs text-gray-500 font-semibold bg-gray-50 px-3.5 py-1.5 rounded-full border border-gray-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>ตารางห้องประชุมออนไลน์สถานเสาวภา</span>
          </div>
        )}

        {/* Right: User identity & utility actions */}
        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0">
          {/* Mobile Alternating Switcher: When on booking page -> Show "จัดการข้อมูล", When on management page -> Show "หน้าการจอง" */}
          {currentUser && (
            <div className="md:hidden">
              {activePage === 'booking' ? (
                <button
                  type="button"
                  onClick={() => onChangePage('management')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold transition shadow-2xs active:scale-95 shrink-0"
                  title="ไปที่ระบบจัดการข้อมูล"
                >
                  <ShieldCheck
                    size={15}
                    className={`shrink-0 ${
                      currentUser.role === 'admin'
                        ? 'text-purple-600'
                        : currentUser.role === 'manager'
                        ? 'text-blue-600'
                        : 'text-emerald-600'
                    }`}
                  />
                  <span>จัดการข้อมูล</span>
                  {totalPendingBadge > 0 && (
                    <span className="inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-extrabold text-white bg-amber-500 rounded-full animate-pulse">
                      {totalPendingBadge}
                    </span>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onChangePage('booking')}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-red-200 bg-red-50 text-[#C8102E] hover:bg-red-100 text-xs font-bold transition shadow-2xs active:scale-95 shrink-0"
                  title="กลับสู่หน้าหลักการจองห้อง"
                >
                  <Calendar size={15} className="shrink-0" />
                  <span>หน้าการจอง</span>
                </button>
              )}
            </div>
          )}

              {/* Notification Center Button (Only visible when user is logged in) */}
          {currentUser && (
            <button
              type="button"
              onClick={onOpenNotifications}
              className="hidden md:flex relative items-center justify-center p-2 sm:px-3 sm:py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold transition shadow-2xs group"
              title="ศูนย์การแจ้งเตือนระบบและผลการอนุมัติ"
            >
              <Bell size={16} className="text-amber-600 group-hover:scale-110 transition shrink-0" />
              <span className="hidden lg:inline ml-1.5">การแจ้งเตือน</span>
              {totalNotificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 sm:static sm:ml-1.5 inline-flex items-center justify-center px-1.5 py-0.2 text-[10px] font-bold text-white bg-[#C8102E] rounded-full animate-pulse">
                  {totalNotificationsCount}
                </span>
              )}
            </button>
          )}

          {/* Booking Guide (Visible on mobile & desktop) */}
          <button
            type="button"
            onClick={onOpenGuide}
            className="flex items-center justify-center gap-1 p-2 sm:px-2.5 sm:py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs sm:text-sm font-semibold transition shadow-2xs active:scale-95 shrink-0"
            title="ขั้นตอนการจองห้องประชุม"
            aria-label="ขั้นตอนการจองห้องประชุม"
          >
            <HelpCircle size={16} className="text-gray-600 sm:text-gray-500" />
            <span className="hidden lg:inline">ขั้นตอน</span>
          </button>

          {/* User Profile & Mobile Navigation Dropdown */}
          {currentUser ? (
            <div className="relative">
              {/* Profile Trigger Button */}
              <button
                type="button"
                onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                className="flex items-center gap-1.5 p-1 sm:pl-2 sm:pr-2.5 sm:py-1 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 text-xs transition active:scale-95 group shadow-2xs"
                title="เมนูโปรไฟล์และการนำทาง"
              >
                <div className="relative">
                  <div
                    className={`w-7 h-7 sm:w-7 sm:h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-xs ${
                      currentUser.avatarColor || 'bg-red-600'
                    }`}
                  >
                    {(currentUser.name || currentUser.username || 'U').charAt(0)}
                  </div>
                  {/* Notification badge on mobile avatar if pending items exist */}
                  {(totalPendingBadge > 0 || myBookingsCount > 0) && (
                    <span className="md:hidden absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full ring-2 ring-white animate-pulse" />
                  )}
                </div>

                <div className="hidden sm:block text-left leading-tight max-w-[100px] md:max-w-[130px] truncate">
                  <div className="font-bold text-gray-900 truncate text-xs">
                    {currentUser.name || currentUser.username || 'ผู้ใช้งาน'}
                  </div>
                  <div className="text-[10px] text-gray-500 font-semibold truncate">
                    {currentUser.role === 'admin' ? (
                      <span className="text-purple-700">Super Admin</span>
                    ) : currentUser.role === 'manager' ? (
                      <span className="text-blue-700">Admin</span>
                    ) : (
                      <span className="text-emerald-700">User</span>
                    )}
                  </div>
                </div>

                <ChevronDown
                  size={14}
                  className={`text-gray-400 group-hover:text-gray-700 transition-transform ${
                    isProfileMenuOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Backdrop */}
              {isProfileMenuOpen && (
                <div
                  className="fixed inset-0 z-40 bg-black/20 md:bg-transparent"
                  onClick={() => setIsProfileMenuOpen(false)}
                />
              )}

              {/* Profile & Navigation Dropdown Menu */}
              {isProfileMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 p-3 space-y-2.5 animate-fade-in divide-y divide-gray-100">
                  {/* 1. User Info Header */}
                  <div className="flex items-center gap-3 pb-2.5">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-xs shrink-0 ${
                        currentUser.avatarColor || 'bg-red-600'
                      }`}
                    >
                      {(currentUser.name || currentUser.username || 'U').charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-bold text-gray-900 text-sm truncate">
                        {currentUser.name || currentUser.username || 'ผู้ใช้งาน'}
                      </div>
                      <div className="text-xs text-gray-500 truncate mt-0.5">
                        {currentUser.department || currentUser.username}
                      </div>
                      <div className="mt-1 flex items-center gap-1.5">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            currentUser.role === 'admin'
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : currentUser.role === 'manager'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          {currentUser.role === 'admin'
                            ? 'ผู้ดูแลระบบสูงสุด (Super Admin)'
                            : currentUser.role === 'manager'
                            ? 'ผู้ดูแลฝ่าย (Admin)'
                            : 'ผู้ใช้งานทั่วไป (User)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 2. Main Navigation Switcher (Especially essential on Mobile) */}
                  <div className="pt-2.5 space-y-1">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">
                      เลือกหน้าการทำงาน
                    </div>

                    {/* Go to Booking Page */}
                    <button
                      type="button"
                      onClick={() => {
                        onChangePage('booking');
                        setIsProfileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition ${
                        activePage === 'booking'
                          ? 'bg-red-50 text-[#C8102E]'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-1.5 rounded-lg ${
                            activePage === 'booking'
                              ? 'bg-[#C8102E] text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <Calendar size={15} />
                        </div>
                        <div className="text-left">
                          <div>หน้าหลักการจองห้อง</div>
                          <div className="text-[10px] text-gray-400 font-normal">
                            ตรวจสอบปฏิทินห้องว่างและจองห้อง
                          </div>
                        </div>
                      </div>
                      {activePage === 'booking' && <Check size={16} className="text-[#C8102E]" />}
                    </button>

                    {/* Go to Management Page */}
                    <button
                      type="button"
                      onClick={() => {
                        onChangePage('management');
                        setIsProfileMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-xs font-bold transition ${
                        activePage === 'management'
                          ? 'bg-gray-100 text-gray-900'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`p-1.5 rounded-lg ${
                            activePage === 'management'
                              ? 'bg-gray-900 text-white'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          <ShieldCheck size={15} />
                        </div>
                        <div className="text-left">
                          <div className="flex items-center gap-1.5">
                            <span>จัดการข้อมูล</span>
                            {totalPendingBadge > 0 && (
                              <span className="px-1.5 py-0.2 text-[10px] font-bold text-white bg-amber-500 rounded-full">
                                {totalPendingBadge}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-gray-400 font-normal">
                            {currentUser.role === 'admin'
                              ? 'พอร์ทัลจัดการระบบและสมาชิก'
                              : currentUser.role === 'manager'
                              ? 'อนุมัติคำขอจองและจัดการข้อมูล'
                              : 'โปรไฟล์และประวัติการใช้งาน'}
                          </div>
                        </div>
                      </div>
                      {activePage === 'management' && <Check size={16} className="text-gray-900" />}
                    </button>
                  </div>

                  {/* 3. Quick Actions & Utilities */}
                  <div className="pt-2.5 space-y-1">
                    <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1">
                      เมนูและการแจ้งเตือน
                    </div>

                    {/* My Bookings */}
                    <button
                      type="button"
                      onClick={() => {
                        onOpenMyBookings();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-red-50 text-[#C8102E]">
                          <CalendarCheck size={15} />
                        </div>
                        <span>รายการจองของฉัน</span>
                      </div>
                      {myBookingsCount > 0 ? (
                        <span className="px-1.5 py-0.2 text-[10px] font-bold text-white bg-[#C8102E] rounded-full">
                          {myBookingsCount} รายการ
                        </span>
                      ) : (
                        <ChevronRight size={14} className="text-gray-300" />
                      )}
                    </button>

                    {/* Notifications */}
                    <button
                      type="button"
                      onClick={() => {
                        onOpenNotifications();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                          <Bell size={15} />
                        </div>
                        <span>ศูนย์การแจ้งเตือน</span>
                      </div>
                      {totalNotificationsCount > 0 && (
                        <span className="px-1.5 py-0.2 text-[10px] font-bold text-white bg-[#C8102E] rounded-full">
                          {totalNotificationsCount}
                        </span>
                      )}
                    </button>

                    {/* Booking Guide */}
                    <button
                      type="button"
                      onClick={() => {
                        onOpenGuide();
                        setIsProfileMenuOpen(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-xl text-xs font-semibold text-gray-700 hover:bg-gray-50 transition"
                    >
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600">
                          <HelpCircle size={15} />
                        </div>
                        <span>ขั้นตอนการจองห้อง</span>
                      </div>
                      <ChevronRight size={14} className="text-gray-300" />
                    </button>
                  </div>

                  {/* 4. Logout Section */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProfileMenuOpen(false);
                        onLogoutUser();
                      }}
                      className="w-full flex items-center gap-2.5 p-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition"
                    >
                      <div className="p-1.5 rounded-lg bg-red-100/60 text-red-600">
                        <LogOut size={15} />
                      </div>
                      <span>ออกจากระบบ</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={onOpenLoginModal}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl border border-red-200 bg-red-50 hover:bg-[#C8102E] text-[#C8102E] hover:text-white text-xs sm:text-sm font-bold transition shadow-2xs group"
              title="เข้าสู่ระบบผู้ใช้งานและผู้ดูแล"
            >
              <Lock size={15} className="group-hover:text-white transition" />
              <span>เข้าสู่ระบบ</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
