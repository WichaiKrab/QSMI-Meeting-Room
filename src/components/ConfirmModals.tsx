import React, { useState } from 'react';
import { X, Lock, AlertCircle, Ban, AlertTriangle, Send, Check } from 'lucide-react';
import { Booking, Room, UserAccount } from '../types';

/* 1. ADMIN LOGIN MODAL */
interface AdminLoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const AdminLoginModal: React.FC<AdminLoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  if (!isOpen) return null;
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim() === 'admin123') {
      onSuccess();
      onClose();
    } else {
      setError('รหัสผ่านผู้ดูแลระบบไม่ถูกต้อง (รหัสผ่านคือ admin123)');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center z-[70] p-3 sm:p-4 pt-10 sm:pt-4 overflow-y-auto custom-scrollbar"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-5 sm:p-6 border-t-4 border-gray-900 my-auto animate-fade-in">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gray-100 text-gray-900 rounded-xl">
              <Lock size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">เข้าสู่ระบบ Admin</h3>
              <p className="text-[11px] text-gray-500">สำหรับผู้ดูแลระบบห้องประชุม</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-1.5">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              รหัสผ่านผู้ดูแลระบบ (Admin Password)
            </label>
            <input
              type="password"
              autoFocus
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="กรอกรหัสผ่าน Admin..."
              className="w-full p-2.5 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium outline-none focus:ring-2 focus:ring-gray-900"
            />
            <span className="text-[10px] text-gray-400 mt-1 block">รหัสผ่านเริ่มต้น: admin123</span>
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-xs shadow-xs transition"
            >
              ยืนยัน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* 2. CANCEL BOOKING MODAL */
interface CancelBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  rooms?: Room[];
  currentUser?: UserAccount | null;
  isAdminMode?: boolean;
  onConfirm: (bookingId: string, reason: string) => Promise<void> | void;
}

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  isOpen,
  onClose,
  booking,
  rooms = [],
  currentUser,
  isAdminMode,
  onConfirm
}) => {
  if (!isOpen || !booking) return null;

  const [reasonCategory, setReasonCategory] = useState('เลื่อนกำหนดการประชุม');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const room = rooms.find((r) => r.id === booking.roomId);
  const roomName = room ? room.name : 'ห้องประชุม';

  const finalReason = reasonCategory === 'อื่นๆ' ? (customReason.trim() || 'เหตุผลส่วนบุคคล') : reasonCategory;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await onConfirm(booking.id, finalReason);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'เกิดข้อผิดพลาดในการยกเลิก');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center z-[70] p-3 sm:p-4 pt-10 sm:pt-4 overflow-y-auto custom-scrollbar"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-5 sm:p-6 border-t-4 border-[#C8102E] my-auto animate-fade-in">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-100 text-red-600 rounded-xl">
              <Ban size={20} />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-900">ยืนยันการยกเลิกการจองห้อง</h3>
              <p className="text-[11px] text-gray-500">คืนสิทธิ์ห้องว่างและส่งอีเมลแจ้งเตือน</p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition">
            <X size={18} />
          </button>
        </div>

        {/* Booking Summary Box */}
        <div className="bg-red-50/70 p-3.5 rounded-2xl border border-red-100 text-xs mb-3 space-y-1 text-gray-800">
          <div className="font-bold text-red-900 text-sm mb-1">
            {booking.topic}
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span>ห้องประชุม:</span>
            <strong className="text-gray-900">{roomName}</strong>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span>ฝ่ายผู้จอง:</span>
            <span className="font-medium text-gray-800">{booking.department}</span>
          </div>
          <div className="flex items-center justify-between text-gray-600">
            <span>ผู้ติดต่อ:</span>
            <span className="font-medium text-gray-800">{booking.requesterName}</span>
          </div>
        </div>

        {/* Info Note */}
        <div className="p-2.5 mb-3 bg-amber-50 rounded-xl border border-amber-200 text-[11px] text-amber-900 flex items-start gap-2">
          <AlertTriangle size={15} className="text-amber-600 shrink-0 mt-0.5" />
          <div>
            <strong>ผลของการยกเลิก:</strong> สถานะจะเปลี่ยนเป็น "ยกเลิกแล้ว (Cancelled)" ระบบจะปลดล็อกช่วงเวลาในปฏิทินให้ผู้อื่นจองได้ทันที และส่งอีเมลแจ้งเตือนไปยังผู้จองและ Admin
          </div>
        </div>

        {error && (
          <div className="mb-3 p-2 bg-red-100 text-red-700 rounded-xl text-xs font-bold flex items-center gap-1.5">
            <AlertCircle size={14} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1.5">
              สาเหตุการยกเลิกการจอง:
            </label>
            <div className="grid grid-cols-2 gap-1.5 mb-2">
              {[
                'เลื่อนกำหนดการประชุม',
                'เปลี่ยนสถานที่/จัดออนไลน์',
                'ยกเลิกกิจกรรม',
                'อื่นๆ'
              ].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  onClick={() => setReasonCategory(reason)}
                  className={`p-2 rounded-xl text-xs font-semibold border text-left transition ${
                    reasonCategory === reason
                      ? 'border-[#C8102E] bg-red-50 text-[#C8102E]'
                      : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {reason}
                </button>
              ))}
            </div>

            {reasonCategory === 'อื่นๆ' && (
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="ระบุเหตุผลในการยกเลิกเพิ่มเติม..."
                rows={2}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-[#C8102E]"
                required
              />
            )}
          </div>

          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
            >
              ย้อนกลับ
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-[#C8102E] hover:bg-[#a00c24] text-white font-bold rounded-xl text-xs shadow-xs transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <Ban size={14} />
              <span>{loading ? 'กำลังยกเลิก...' : 'ยืนยันการยกเลิก'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* 3. REJECT REASON MODAL */
interface RejectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export const RejectModal: React.FC<RejectModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;
  const [reason, setReason] = useState('ห้องประชุมมีความจำเป็นต้องใช้สำหรับงานด่วนขององค์กร');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) return;
    onConfirm(reason.trim());
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-3 sm:p-4 overflow-y-auto custom-scrollbar"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-5 sm:p-6 border-t-4 border-red-600 my-auto animate-fade-in">
        <div className="flex justify-between items-center pb-2 border-b border-gray-100 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-red-100 text-red-600 rounded-xl">
              <AlertTriangle size={18} />
            </div>
            <h3 className="text-base font-bold text-gray-900">ระบุเหตุผลที่ปฏิเสธ</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              เหตุผล (จะส่งให้ผู้จองทางอีเมล) <span className="text-red-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 border border-gray-300 rounded-xl text-xs font-medium outline-none focus:ring-2 focus:ring-red-600"
              placeholder="กรุณาระบุเหตุผล..."
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-xs"
            >
              ยืนยันปฏิเสธ
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* 4. CONFIRM RESEND EMAIL MODAL */
interface ResendEmailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onConfirm: () => void;
}

export const ResendEmailModal: React.FC<ResendEmailModalProps> = ({
  isOpen,
  onClose,
  booking,
  onConfirm
}) => {
  if (!isOpen || !booking) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-3 sm:p-4 overflow-y-auto custom-scrollbar"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm p-5 sm:p-6 border-t-4 border-blue-600 my-auto animate-fade-in text-center space-y-3">
        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto">
          <Send size={22} />
        </div>
        <div>
          <h3 className="text-base font-bold text-gray-900">ส่งอีเมลแจ้งเตือนซ้ำ</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            ระบบจะส่งอีเมลแจ้งเตือนไปยัง <strong>{booking.email}</strong> อีกครั้ง
          </p>
        </div>

        <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-100 text-xs text-left text-blue-900 font-medium space-y-0.5">
          <div>
            <strong>หัวข้อ:</strong> {booking.topic}
          </div>
          <div>
            <strong>ผู้รับ:</strong> {booking.requesterName}
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-xs"
          >
            ส่งอีเมลทันที
          </button>
        </div>
      </div>
    </div>
  );
};

/* 5. UNIVERSAL DELETE CONFIRMATION MODAL */
export interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: string;
  itemDetails?: {
    label: string;
    value: string;
  }[];
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  title,
  description,
  itemDetails = [],
  confirmText = 'ยืนยันการลบข้อมูล',
  cancelText = 'ยกเลิก',
  onConfirm
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-3 sm:p-4 overflow-y-auto custom-scrollbar"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-5 sm:p-6 border-t-4 border-[#C8102E] my-auto animate-fade-in space-y-4">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 text-[#C8102E] rounded-2xl shrink-0">
              <AlertTriangle size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight">
                {title}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">การกระทำนี้เป็นการลบข้อมูลถาวร</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
          >
            <X size={18} />
          </button>
        </div>

        <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
          {description}
        </p>

        {itemDetails.length > 0 && (
          <div className="bg-red-50/70 p-3.5 rounded-2xl border border-red-100 text-xs space-y-1.5 text-gray-800">
            {itemDetails.map((item, idx) => (
              <div key={idx} className="flex items-start justify-between gap-2">
                <span className="text-gray-500 shrink-0">{item.label}:</span>
                <span className="font-bold text-gray-900 text-right break-words">{item.value}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs sm:text-sm transition"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className="flex-1 py-2.5 bg-[#C8102E] hover:bg-[#a00c24] text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition active:scale-95"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
