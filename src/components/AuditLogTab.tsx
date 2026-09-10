import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Search,
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Copy,
  Check,
  LogIn,
  LogOut,
  Timer,
  CalendarPlus,
  CheckCircle2,
  XCircle,
  Ban,
  UserCheck,
  Building,
  Laptop,
  Smartphone,
  Tablet,
  Globe,
  X,
  Eye,
  Info,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown
} from 'lucide-react';
import { AuditLog, AuditActionType } from '../types';
import { formatThaiDate, formatThaiTime } from '../utils/thaiDate';

interface AuditLogTabProps {
  logs: AuditLog[];
  onRefreshLogs?: () => void;
}

export const AuditLogTab: React.FC<AuditLogTabProps> = ({ logs, onRefreshLogs }) => {
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [actionCategory, setActionCategory] = useState<
    'all' | 'login_logout' | 'auto_logout' | 'booking' | 'user_mgmt' | 'system'
  >('all');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [copiedIp, setCopiedIp] = useState<string | null>(null);
  const [copiedUa, setCopiedUa] = useState<boolean>(false);
  const [rowsPerPage, setRowsPerPage] = useState<number>(20);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Quick Date Filter presets
  const applyDatePreset = (preset: 'all' | 'today' | '7days' | '30days') => {
    setCurrentPage(1);
    const now = new Date();
    if (preset === 'all') {
      setStartDate('');
      setEndDate('');
      return;
    }

    const formatYMD = (d: Date) => {
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const todayStr = formatYMD(now);
    setEndDate(todayStr);

    if (preset === 'today') {
      setStartDate(todayStr);
    } else if (preset === '7days') {
      const past = new Date(now);
      past.setDate(past.getDate() - 7);
      setStartDate(formatYMD(past));
    } else if (preset === '30days') {
      const past = new Date(now);
      past.setDate(past.getDate() - 30);
      setStartDate(formatYMD(past));
    }
  };

  // Trigger manual refresh
  const handleRefresh = () => {
    setIsRefreshing(true);
    if (onRefreshLogs) onRefreshLogs();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // Copy IP Address helper
  const handleCopyIp = (ip: string) => {
    navigator.clipboard.writeText(ip);
    setCopiedIp(ip);
    setTimeout(() => setCopiedIp(null), 2000);
  };

  // Copy full User Agent helper
  const handleCopyUa = (ua: string) => {
    navigator.clipboard.writeText(ua);
    setCopiedUa(true);
    setTimeout(() => setCopiedUa(false), 2000);
  };

  // Filter logs logic
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Search filter: Username, Full Name, IP, Action, or Department
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase().trim();
        const matchUser = log.username?.toLowerCase().includes(query);
        const matchName = log.userFullName?.toLowerCase().includes(query);
        const matchIp = log.ipAddress?.toLowerCase().includes(query);
        const matchAction = log.actionPerformed?.toLowerCase().includes(query);
        const matchDept = log.department?.toLowerCase().includes(query);
        if (!matchUser && !matchName && !matchIp && !matchAction && !matchDept) {
          return false;
        }
      }

      // 2. Date Range Filter
      if (startDate) {
        const logDateStr = log.timestamp.substring(0, 10);
        if (logDateStr < startDate) return false;
      }
      if (endDate) {
        const logDateStr = log.timestamp.substring(0, 10);
        if (logDateStr > endDate) return false;
      }

      // 3. Action Category Filter
      if (actionCategory === 'login_logout') {
        if (log.actionType !== 'LOGIN' && log.actionType !== 'LOGOUT' && log.actionType !== 'AUTO_LOGOUT') {
          return false;
        }
      } else if (actionCategory === 'auto_logout') {
        if (log.actionType !== 'AUTO_LOGOUT') return false;
      } else if (actionCategory === 'booking') {
        if (
          log.actionType !== 'CREATE_BOOKING' &&
          log.actionType !== 'UPDATE_BOOKING' &&
          log.actionType !== 'CANCEL_BOOKING' &&
          log.actionType !== 'APPROVE_BOOKING' &&
          log.actionType !== 'REJECT_BOOKING'
        ) {
          return false;
        }
      } else if (actionCategory === 'user_mgmt') {
        if (log.actionType !== 'USER_MANAGEMENT') return false;
      } else if (actionCategory === 'system') {
        if (log.actionType !== 'ROOM_MANAGEMENT' && log.actionType !== 'SYSTEM') return false;
      }

      return true;
    });
  }, [logs, searchTerm, startDate, endDate, actionCategory]);

  // Statistics
  const stats = useMemo(() => {
    const todayStr = new Date().toISOString().substring(0, 10);
    let todayLogins = 0;
    let autoLogouts = 0;
    const uniqueUsers = new Set<string>();

    logs.forEach((log) => {
      if (log.username) uniqueUsers.add(log.username);
      if (log.timestamp.startsWith(todayStr) && log.actionType === 'LOGIN') {
        todayLogins++;
      }
      if (log.actionType === 'AUTO_LOGOUT') {
        autoLogouts++;
      }
    });

    return {
      total: logs.length,
      todayLogins,
      autoLogouts,
      uniqueUsers: uniqueUsers.size
    };
  }, [logs]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / rowsPerPage));
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * rowsPerPage;
    return filteredLogs.slice(start, start + rowsPerPage);
  }, [filteredLogs, currentPage, rowsPerPage]);

  // Export to CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;

    const headers = [
      'ลำดับ',
      'ชื่อผู้ใช้งาน (Username)',
      'ชื่อ-นามสกุล',
      'ฝ่าย/หน่วยงาน',
      'สิทธิ์ (Role)',
      'เวลา (Timestamp)',
      'ประเภทกิจกรรม (Action Type)',
      'กิจกรรมที่ทำ (Action Performed)',
      'ที่อยู่ไอพี (IP Address)',
      'อุปกรณ์/เบราว์เซอร์',
      'User Agent ฉบับเต็ม'
    ];

    const rows = filteredLogs.map((log, index) => [
      String(index + 1),
      `"${(log.username || '').replace(/"/g, '""')}"`,
      `"${(log.userFullName || '').replace(/"/g, '""')}"`,
      `"${(log.department || '').replace(/"/g, '""')}"`,
      `"${(log.userRole || '').replace(/"/g, '""')}"`,
      `"${formatThaiDate(log.timestamp)} ${formatThaiTime(log.timestamp)} น."`,
      `"${log.actionType}"`,
      `"${(log.actionPerformed || '').replace(/"/g, '""')}"`,
      `"${log.ipAddress || ''}"`,
      `"${(log.browserDevice || '').replace(/"/g, '""')}"`,
      `"${(log.userAgent || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Audit_Logs_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper for formatting relative time
  const getRelativeTime = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'เมื่อสักครู่';
      if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays} วันที่แล้ว`;
    } catch {
      return '';
    }
  };

  // Helper to render action type badge
  const renderActionBadge = (type: AuditActionType, text: string) => {
    switch (type) {
      case 'LOGIN':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <LogIn size={13} className="text-emerald-600" />
            <span>เข้าสู่ระบบ (Login)</span>
          </span>
        );
      case 'LOGOUT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-gray-100 text-gray-700 border border-gray-200">
            <LogOut size={13} className="text-gray-500" />
            <span>ออกจากระบบ (Logout)</span>
          </span>
        );
      case 'AUTO_LOGOUT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <Timer size={13} className="text-amber-600" />
            <span>ออกจากระบบอัตโนมัติ (1 นาที)</span>
          </span>
        );
      case 'CREATE_BOOKING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <CalendarPlus size={13} className="text-blue-600" />
            <span>สร้างการจองห้อง</span>
          </span>
        );
      case 'APPROVE_BOOKING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
            <CheckCircle2 size={13} className="text-green-600" />
            <span>อนุมัติการจอง</span>
          </span>
        );
      case 'REJECT_BOOKING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
            <XCircle size={13} className="text-rose-600" />
            <span>ปฏิเสธการจอง</span>
          </span>
        );
      case 'CANCEL_BOOKING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
            <Ban size={13} className="text-red-600" />
            <span>ยกเลิกการจอง</span>
          </span>
        );
      case 'USER_MANAGEMENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
            <UserCheck size={13} className="text-purple-600" />
            <span>จัดการผู้ใช้งาน</span>
          </span>
        );
      case 'ROOM_MANAGEMENT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800 border border-indigo-200">
            <Building size={13} className="text-indigo-600" />
            <span>จัดการห้องประชุม</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <Info size={13} className="text-slate-500" />
            <span>กิจกรรมระบบ</span>
          </span>
        );
    }
  };

  // Helper for Device Icon
  const getDeviceIcon = (browserDevice?: string, ua?: string) => {
    const text = (browserDevice || ua || '').toLowerCase();
    if (text.includes('iphone') || text.includes('android') || text.includes('mobile')) {
      return <Smartphone size={14} className="text-amber-500" />;
    }
    if (text.includes('ipad') || text.includes('tablet')) {
      return <Tablet size={14} className="text-purple-500" />;
    }
    return <Laptop size={14} className="text-blue-500" />;
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-5 sm:p-7 rounded-3xl shadow-sm border border-slate-700/50">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
              <ShieldCheck size={26} />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  ประวัติการเข้าใช้งานระบบ (Audit Log / Activity Log)
                </h2>
                <span className="px-2.5 py-0.5 text-[11px] font-extrabold uppercase bg-amber-500 text-slate-950 rounded-full tracking-wider shadow-xs">
                  Super Admin Only
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                บันทึกการเข้าสู่ระบบ ออกจากระบบ ที่อยู่ไอพี อุปกรณ์ และกิจกรรมการดำเนินงานทั้งหมดในระบบแบบ Real-time
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 self-start md:self-auto flex-wrap">
            <button
              type="button"
              onClick={handleRefresh}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold bg-white/10 hover:bg-white/20 text-white border border-white/15 transition cursor-pointer"
              title="รีเฟรชข้อมูลบันทึก"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin text-amber-400' : ''} />
              <span>รีเฟรช</span>
            </button>

            <button
              type="button"
              onClick={handleExportCSV}
              disabled={filteredLogs.length === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={15} />
              <span>ส่งออกไฟล์ CSV ({filteredLogs.length})</span>
            </button>
          </div>
        </div>

        {/* Statistical Summary Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-700/60">
          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
            <div className="text-[11px] font-medium text-slate-400">กิจกรรมทั้งหมดที่บันทึก</div>
            <div className="text-xl sm:text-2xl font-black text-white mt-1">{stats.total.toLocaleString()}</div>
            <div className="text-[10px] text-slate-400 mt-0.5">รายการทั้งหมดในฐานข้อมูล</div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
            <div className="text-[11px] font-medium text-slate-400">เข้าสู่ระบบวันนี้</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">{stats.todayLogins.toLocaleString()}</div>
            <div className="text-[10px] text-emerald-400/80 mt-0.5">การ Login สำเร็จวันนี้</div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
            <div className="text-[11px] font-medium text-slate-400">ออกจากระบบอัตโนมัติ (1 นาที)</div>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-1">{stats.autoLogouts.toLocaleString()}</div>
            <div className="text-[10px] text-amber-400/80 mt-0.5">ตรวจจับไม่มีการใช้งาน</div>
          </div>

          <div className="bg-white/5 rounded-2xl p-3.5 border border-white/10">
            <div className="text-[11px] font-medium text-slate-400">ผู้ใช้งานที่มีประวัติเข้าใช้งาน</div>
            <div className="text-xl sm:text-2xl font-black text-indigo-300 mt-1">{stats.uniqueUsers.toLocaleString()}</div>
            <div className="text-[10px] text-indigo-300/80 mt-0.5">บัญชีผู้ใช้งานไม่ซ้ำกัน</div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-gray-50 p-4 sm:p-5 rounded-3xl border border-gray-200 space-y-4">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[280px]">
            <Search size={17} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="ค้นหาตามชื่อผู้ใช้งาน (Username), ชื่อ-นามสกุล, ที่อยู่ IP, หรือกิจกรรม..."
              className="w-full pl-10 pr-10 py-2.5 bg-white border border-gray-300 rounded-2xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:border-transparent transition shadow-2xs"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Action Category Filter */}
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={15} className="text-gray-500 hidden sm:block" />
            <select
              value={actionCategory}
              onChange={(e) => {
                setActionCategory(e.target.value as any);
                setCurrentPage(1);
              }}
              className="px-3.5 py-2.5 bg-white border border-gray-300 rounded-2xl text-xs sm:text-sm font-semibold text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#C8102E] shadow-2xs cursor-pointer"
            >
              <option value="all">กิจกรรมทั้งหมด (All Actions)</option>
              <option value="login_logout">เฉพาะเข้าสู่ระบบ / ออกจากระบบ (Login & Logout)</option>
              <option value="auto_logout">เฉพาะออกจากระบบอัตโนมัติ (Auto-Logout 1 min)</option>
              <option value="booking">เฉพาะการจองห้องประชุม (Bookings)</option>
              <option value="user_mgmt">เฉพาะการจัดการผู้ใช้งาน (User Management)</option>
              <option value="system">เฉพาะการจัดการห้องและระบบ (System)</option>
            </select>
          </div>
        </div>

        {/* Date Range & Presets */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-3 border-t border-gray-200">
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            <span className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
              <Calendar size={14} className="text-gray-400" />
              <span>ช่วงวันที่:</span>
            </span>

            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
            />
            <span className="text-xs text-gray-400">ถึง</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#C8102E]"
            />

            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                  setCurrentPage(1);
                }}
                className="text-xs text-red-600 hover:text-red-700 font-bold ml-1 flex items-center gap-1"
              >
                <X size={13} />
                <span>ล้างวันที่</span>
              </button>
            )}
          </div>

          {/* Quick Date Presets */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-semibold text-gray-400 mr-1 hidden md:inline">ทางลัด:</span>
            <button
              type="button"
              onClick={() => applyDatePreset('all')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                !startDate && !endDate ? 'bg-[#1a1a1a] text-white shadow-2xs' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              ทั้งหมด
            </button>
            <button
              type="button"
              onClick={() => applyDatePreset('today')}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                startDate === endDate && startDate ? 'bg-[#1a1a1a] text-white shadow-2xs' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              วันนี้
            </button>
            <button
              type="button"
              onClick={() => applyDatePreset('7days')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 whitespace-nowrap transition cursor-pointer"
            >
              7 วันล่าสุด
            </button>
            <button
              type="button"
              onClick={() => applyDatePreset('30days')}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-white text-gray-600 hover:bg-gray-100 border border-gray-200 whitespace-nowrap transition cursor-pointer"
            >
              30 วันล่าสุด
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-3xl border border-gray-200 shadow-2xs overflow-hidden">
        {/* Table info bar */}
        <div className="px-5 py-3.5 bg-gray-50/80 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-600">
          <div>
            แสดง <span className="font-bold text-gray-900">{filteredLogs.length > 0 ? (currentPage - 1) * rowsPerPage + 1 : 0}</span> ถึง{' '}
            <span className="font-bold text-gray-900">
              {Math.min(currentPage * rowsPerPage, filteredLogs.length)}
            </span>{' '}
            จากทั้งหมด <span className="font-bold text-gray-900">{filteredLogs.length.toLocaleString()}</span> รายการ
            {(searchTerm || startDate || endDate || actionCategory !== 'all') && (
              <span className="ml-2 text-amber-600 font-semibold">(กำลังกรองข้อมูล)</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <span>แสดงต่อหน้า:</span>
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-2.5 py-1 bg-white border border-gray-300 rounded-lg text-xs font-semibold text-gray-700"
            >
              <option value={10}>10 รายการ</option>
              <option value={20}>20 รายการ</option>
              <option value={50}>50 รายการ</option>
              <option value={100}>100 รายการ</option>
            </select>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-100/70 border-b border-gray-200 text-[11px] font-black uppercase text-gray-600 tracking-wider">
                <th className="py-3.5 px-4 w-12 text-center">#</th>
                <th className="py-3.5 px-4 min-w-[170px]">1. ชื่อผู้ใช้งาน (Username)</th>
                <th className="py-3.5 px-4 min-w-[170px]">2. เวลาที่บันทึก (Timestamp)</th>
                <th className="py-3.5 px-4 min-w-[150px]">3. ที่อยู่ไอพี (IP Address)</th>
                <th className="py-3.5 px-4 min-w-[200px]">4. อุปกรณ์หรือเบราว์เซอร์ (User Agent)</th>
                <th className="py-3.5 px-4 min-w-[260px]">5. กิจกรรมในระบบ (Action Performed)</th>
                <th className="py-3.5 px-4 w-20 text-center">รายละเอียด</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs sm:text-sm">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center">
                    <div className="max-w-md mx-auto space-y-3">
                      <div className="w-12 h-12 mx-auto rounded-full bg-gray-100 flex items-center justify-center text-gray-400">
                        <Search size={22} />
                      </div>
                      <h4 className="text-base font-bold text-gray-800">ไม่พบข้อมูลประวัติการเข้าใช้งาน</h4>
                      <p className="text-xs text-gray-500">
                        ไม่พบบันทึกที่ตรงกับเงื่อนไขการค้นหาหรือตัวกรองที่เลือก โปรดลองปรับเปลี่ยนคำค้นหาหรือช่วงเวลา
                      </p>
                      {(searchTerm || startDate || endDate || actionCategory !== 'all') && (
                        <button
                          type="button"
                          onClick={() => {
                            setSearchTerm('');
                            setStartDate('');
                            setEndDate('');
                            setActionCategory('all');
                            setCurrentPage(1);
                          }}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
                        >
                          ล้างตัวกรองทั้งหมด
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log, idx) => {
                  const globalIndex = (currentPage - 1) * rowsPerPage + idx + 1;
                  const isCopied = copiedIp === log.ipAddress;

                  return (
                    <tr
                      key={log.id || idx}
                      className="hover:bg-slate-50/70 transition-colors group cursor-pointer"
                      onClick={() => setSelectedLog(log)}
                    >
                      {/* Index */}
                      <td className="py-3.5 px-4 text-center text-xs font-mono text-gray-400">
                        {globalIndex}
                      </td>

                      {/* 1. Username */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-200">
                            {(log.username || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-gray-900 flex items-center gap-1.5">
                              <span>{log.username}</span>
                              {log.userRole === 'admin' && (
                                <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-purple-100 text-purple-700 rounded-md border border-purple-200">
                                  Super Admin
                                </span>
                              )}
                              {log.userRole === 'manager' && (
                                <span className="px-1.5 py-0.2 text-[9px] font-extrabold bg-blue-100 text-blue-700 rounded-md border border-blue-200">
                                  Manager
                                </span>
                              )}
                            </div>
                            <div className="text-xs text-gray-600 font-medium">
                              {log.userFullName || log.username}
                            </div>
                            {log.department && log.department !== '-' && (
                              <div className="text-[11px] text-gray-400 truncate max-w-[170px]">
                                {log.department}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* 2. Login/Logout Timestamp */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-gray-900">
                          {formatThaiDate(log.timestamp)}
                        </div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">
                          {formatThaiTime(log.timestamp)} น.
                        </div>
                        <div className="text-[10px] text-indigo-600 font-medium mt-0.5">
                          {getRelativeTime(log.timestamp)}
                        </div>
                      </td>

                      {/* 3. IP Address */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
                          <Globe size={13} className="text-slate-500" />
                          <span className="font-mono text-xs font-semibold text-slate-800">
                            {log.ipAddress || '127.0.0.1'}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyIp(log.ipAddress);
                            }}
                            className="text-slate-400 hover:text-slate-700 ml-1 p-0.5 rounded transition"
                            title="คัดลอก IP"
                          >
                            {isCopied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                          </button>
                        </div>
                        {isCopied && (
                          <div className="text-[10px] text-emerald-600 font-bold mt-0.5">คัดลอก IP แล้ว</div>
                        )}
                      </td>

                      {/* 4. User Agent */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-2 max-w-[280px]">
                          <div className="mt-0.5 shrink-0">
                            {getDeviceIcon(log.browserDevice, log.userAgent)}
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 text-xs truncate max-w-[220px]">
                              {log.browserDevice || 'Chrome (Windows)'}
                            </div>
                            <div
                              className="text-[11px] text-gray-400 font-mono truncate max-w-[220px] mt-0.5"
                              title={log.userAgent}
                            >
                              {log.userAgent}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 5. Action Performed */}
                      <td className="py-3.5 px-4">
                        <div className="space-y-1 max-w-[340px]">
                          <div>{renderActionBadge(log.actionType, log.actionPerformed)}</div>
                          <p className="text-xs text-gray-800 font-medium leading-snug">
                            {log.actionPerformed}
                          </p>
                        </div>
                      </td>

                      {/* Detail View Button */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition"
                          title="ดูรายละเอียดเชิงลึก"
                        >
                          <Eye size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredLogs.length > 0 && (
          <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
            <div>
              หน้า <span className="font-bold text-gray-900">{currentPage}</span> จากทั้งหมด{' '}
              <span className="font-bold text-gray-900">{totalPages}</span> หน้า
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
              >
                <ChevronLeft size={14} />
                <span>ก่อนหน้า</span>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum = i + 1;
                  if (totalPages > 5) {
                    if (currentPage > 3) {
                      pageNum = Math.min(totalPages - 4 + i, Math.max(1, currentPage - 2 + i));
                    }
                  }
                  return (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 rounded-lg text-xs font-bold transition ${
                        currentPage === pageNum
                          ? 'bg-[#C8102E] text-white shadow-2xs'
                          : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                type="button"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-gray-700 hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition flex items-center gap-1"
              >
                <span>ถัดไป</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Deep Detail Modal */}
      {selectedLog && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedLog(null)}
        >
          <div
            className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 p-6 space-y-5 animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600">
                  <ShieldCheck size={22} />
                </div>
                <div>
                  <h3 className="text-base font-black text-gray-900">รายละเอียดประวัติกิจกรรม (Audit Detail)</h3>
                  <p className="text-xs text-gray-500 font-mono mt-0.5">ID: {selectedLog.id}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Content Sections */}
            <div className="space-y-4 text-xs sm:text-sm">
              {/* Action Banner */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                  กิจกรรมที่ดำเนินการ (Action Performed)
                </div>
                <div>{renderActionBadge(selectedLog.actionType, selectedLog.actionPerformed)}</div>
                <div className="text-sm font-bold text-gray-900">{selectedLog.actionPerformed}</div>
              </div>

              {/* User Details */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-[11px] font-bold text-gray-500">ชื่อผู้ใช้งาน (Username)</div>
                  <div className="font-bold text-gray-900 mt-1">{selectedLog.username}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{selectedLog.userFullName}</div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-[11px] font-bold text-gray-500">สิทธิ์ & ฝ่าย (Role & Dept)</div>
                  <div className="font-bold text-gray-900 mt-1 uppercase">{selectedLog.userRole || 'employee'}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{selectedLog.department || '-'}</div>
                </div>
              </div>

              {/* Timestamp & IP */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-[11px] font-bold text-gray-500">วันเวลาที่บันทึก (Timestamp)</div>
                  <div className="font-bold text-gray-900 mt-1">{formatThaiDate(selectedLog.timestamp)}</div>
                  <div className="text-xs text-gray-600 font-mono mt-0.5">
                    {formatThaiTime(selectedLog.timestamp)} น.
                  </div>
                  <div className="text-[10px] text-gray-400 font-mono mt-1 truncate">
                    {selectedLog.timestamp}
                  </div>
                </div>

                <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                  <div className="text-[11px] font-bold text-gray-500">ที่อยู่ไอพี (IP Address)</div>
                  <div className="font-bold font-mono text-gray-900 mt-1 flex items-center justify-between">
                    <span>{selectedLog.ipAddress}</span>
                    <button
                      type="button"
                      onClick={() => handleCopyIp(selectedLog.ipAddress)}
                      className="text-indigo-600 hover:text-indigo-700 p-1"
                      title="คัดลอก IP"
                    >
                      {copiedIp === selectedLog.ipAddress ? <Check size={14} /> : <Copy size={14} />}
                    </button>
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">เครือข่ายเชื่อมต่อ</div>
                </div>
              </div>

              {/* Browser / Device & Raw User Agent */}
              <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    อุปกรณ์และเบราว์เซอร์ (User Agent)
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyUa(selectedLog.userAgent)}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                  >
                    {copiedUa ? <Check size={12} /> : <Copy size={12} />}
                    <span>{copiedUa ? 'คัดลอก UA แล้ว' : 'คัดลอก UA'}</span>
                  </button>
                </div>
                <div className="font-bold text-gray-900 flex items-center gap-2">
                  {getDeviceIcon(selectedLog.browserDevice, selectedLog.userAgent)}
                  <span>{selectedLog.browserDevice}</span>
                </div>
                <div className="p-2.5 bg-white rounded-xl border border-gray-200 text-[11px] font-mono text-gray-600 break-all select-all">
                  {selectedLog.userAgent}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedLog(null)}
                className="px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-bold text-xs transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
