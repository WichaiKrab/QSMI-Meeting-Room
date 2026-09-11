import React from 'react';
import {
  X,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  Video,
  FileText,
  Mail,
  Phone,
  Check,
  Ban,
  CalendarPlus,
  Download,
  Send,
  ExternalLink,
  Trash2,
  Edit3,
  UserX
} from 'lucide-react';
import { Room, Booking, UserAccount } from '../types';
import { formatThaiDate, formatThaiTime, isBookingInPast } from '../utils/thaiDate';
import { generateGoogleCalendarUrl, downloadIcsFile } from '../utils/calendarSync';
import { normalizeEquipmentName, normalizeSeatingName } from '../data/initialData';
import { formatThaiPhone } from '../utils/phoneUtils';
import { isBookingRequesterDeleted } from '../utils/bookingUserUtils';

interface BookingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  rooms: Room[];
  isAdminMode: boolean;
  currentUser: UserAccount | null;
  users?: UserAccount[];
  onApprove?: (booking: Booking) => void;
  onReject?: (booking: Booking) => void;
  onEditClick?: (booking: Booking) => void;
  onCancelClick?: (booking: Booking) => void;
  onResendEmail?: (booking: Booking) => void;
  onDeleteClick?: (booking: Booking) => void;
  onOpenAdminLogin?: () => void;
}

export const BookingDetailModal: React.FC<BookingDetailModalProps> = ({
  isOpen,
  onClose,
  booking,
  rooms,
  isAdminMode,
  currentUser,
  users,
  onApprove,
  onReject,
  onEditClick,
  onCancelClick,
  onResendEmail,
  onDeleteClick,
  onOpenAdminLogin
}) => {
  if (!isOpen || !booking) return null;

  const room = rooms.find((r) => r.id === booking.roomId);
  const roomName = room ? room.name : 'ห้องประชุมเดิม (ถูกลบ)';

  const startD = new Date(booking.startTime);
  const endD = new Date(booking.endTime);
  const startDateStr = formatThaiDate(startD, { day: 'numeric', month: 'short', year: 'numeric' });
  const endDateStr = formatThaiDate(endD, { day: 'numeric', month: 'short', year: 'numeric' });
  const dateStr = startDateStr === endDateStr ? startDateStr : `${startDateStr} - ${endDateStr}`;
  const timeStr = `${formatThaiTime(startD, { hour: '2-digit', minute: '2-digit' })} - ${formatThaiTime(endD, { hour: '2-digit', minute: '2-digit' })} น.`;

  const isPending = booking.status === 'pending';
  const isApproved = booking.status === 'approved';
  const isRejected = booking.status === 'rejected';
  const isCancelled = booking.status === 'cancelled';
  const isBlocked = booking.isBlocked;
  const isDeletedRequester = isBookingRequesterDeleted(booking, users);

  let statusBadge = (
    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
      อนุมัติแล้ว (Approved)
    </span>
  );

  if (isPending) {
    statusBadge = (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 flex items-center gap-1">
        <Clock size={12} /> รออนุมัติ (Pending)
      </span>
    );
  } else if (isCancelled) {
    statusBadge = (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-700 border border-gray-300 flex items-center gap-1">
        <Ban size={12} /> ยกเลิกแล้ว (Cancelled)
      </span>
    );
  } else if (isRejected) {
    statusBadge = (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 text-red-800 border border-red-200">
        ไม่อนุมัติ (Rejected)
      </span>
    );
  } else if (isBlocked) {
    statusBadge = (
      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-gray-200 text-gray-800 border border-gray-300">
        ปิดปรับปรุง (Blocked)
      </span>
    );
  }

  const googleCalUrl = generateGoogleCalendarUrl(booking, room);

  // Can approve: Super Admin OR Admin (role 'admin' or 'manager')
  const canApproveOrReject =
    isPending &&
    !isBlocked &&
    (isAdminMode ||
      (currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager')));

  const isPast = isBookingInPast(booking);
  const isUserAdmin =
    isAdminMode ||
    (currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager'));

  // Determine if current user can cancel:
  // - Super Admin / Admin can cancel any booking.
  // - User account (employee / creator) can ONLY cancel if the booking date & time has NOT passed.
  const isBookingOwner = Boolean(
    currentUser &&
      ((booking.username && currentUser.username?.toLowerCase() === booking.username.toLowerCase()) ||
        currentUser.department === booking.department ||
        currentUser.name === booking.requesterName)
  );

  const canCancel =
    !isBlocked &&
    !isCancelled &&
    !isRejected &&
    (isUserAdmin || (!isPast && isBookingOwner));

  const canEdit =
    !isBlocked &&
    !isCancelled &&
    !isRejected &&
    (isUserAdmin || (!isPast && isBookingOwner));

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-3 sm:p-4 overflow-y-auto custom-scrollbar"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg max-h-[92dvh] flex flex-col relative border-t-4 border-[#C8102E] overflow-hidden my-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/70 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="bg-red-100 p-2 rounded-xl text-[#C8102E] shrink-0">
              <FileText size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-tight truncate">
                รายละเอียดการจองห้องประชุม
              </h3>
              <div className="mt-1">{statusBadge}</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 p-1.5 rounded-xl transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
          {/* Topic */}
          <div>
            <span className="text-xs font-bold text-gray-400 uppercase block mb-1">
              หัวข้อการประชุม
            </span>
            <div className="font-bold text-base sm:text-lg text-gray-900 leading-snug break-words">
              {booking.topic}
            </div>
          </div>

          {/* Room & Time Block */}
          <div className="bg-gray-50 p-4 rounded-2xl border border-gray-200 space-y-2.5">
            <div className="flex items-start gap-2 text-gray-800">
              <MapPin size={16} className="text-[#C8102E] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">{roomName}</span>
                {room?.location && (
                  <span className="text-xs text-gray-500 block">{room.location}</span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <CalendarIcon size={16} className="text-blue-600 shrink-0" />
              <span className="font-semibold">{dateStr}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Clock size={16} className="text-blue-600 shrink-0" />
              <span className="font-semibold">{timeStr}</span>
            </div>
          </div>

          {/* Requester & Department */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase block mb-0.5">
                ผู้จอง / แผนก
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="font-bold text-gray-800">{booking.requesterName}</span>
                {isDeletedRequester && (
                  <span
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-gray-100 text-gray-700 border border-gray-300"
                    title="บัญชีผู้ใช้งานนี้พ้นสภาพหรือถูกลบออกจากระบบแล้ว แต่ประวัติการจองยังคงถูกเก็บรักษาไว้"
                  >
                    <UserX size={10} className="text-gray-500" />
                    อดีตผู้ใช้งาน / พ้นสภาพ
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">{booking.department || '-'}</div>
              {booking.username && (
                <div className="text-[11px] text-gray-400">@{booking.username}</div>
              )}
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase block mb-0.5">
                ติดต่อ
              </span>
              {booking.phone && (
                <div className="flex items-center gap-1 text-gray-700">
                  <Phone size={13} className="text-gray-400" /> {formatThaiPhone(booking.phone)}
                </div>
              )}
              {booking.email && (
                <div className="flex items-center gap-1 text-gray-700 truncate" title={booking.email}>
                  <Mail size={13} className="text-gray-400 shrink-0" />{' '}
                  <span className="truncate">{booking.email}</span>
                </div>
              )}
            </div>
          </div>

          {/* Former User Notice */}
          {isDeletedRequester && (
            <div className="bg-amber-50/80 border border-amber-200/90 rounded-2xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
              <UserX size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div className="leading-relaxed">
                <div className="font-bold text-amber-950">สถานะบัญชีผู้ขอจอง: อดีตผู้ใช้งาน / พ้นสภาพ</div>
                <div className="text-[11px] text-amber-800 mt-0.5">
                  บัญชีผู้ใช้งานนี้ถูกลบออกจากระบบแล้ว แต่ประวัติและรายละเอียดการจองห้องประชุมยังคงถูกเก็บรักษาไว้ในระบบอย่างสมบูรณ์เพื่อการตรวจสอบย้อนหลัง
                </div>
              </div>
            </div>
          )}

          {/* External Institute & Format */}
          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase block mb-0.5">
                จำนวนผู้เข้าร่วม
              </span>
              <div className="font-semibold text-gray-800 flex items-center gap-1">
                <Users size={14} className="text-gray-400" /> {booking.participants} ท่าน
              </div>
            </div>
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase block mb-0.5">
                รูปแบบ
              </span>
              <div className="font-semibold text-gray-800">
                {booking.meetingType === 'Online'
                  ? 'Online (ประชุมทางไกล)'
                  : booking.meetingType === 'Hybrid'
                    ? 'Hybrid (ผสมผสาน)'
                    : 'Onsite (ที่ห้องประชุม)'}
              </div>
            </div>
          </div>

          {booking.institute && (
            <div>
              <span className="text-xs font-bold text-gray-400 uppercase block mb-0.5">
                สถาบัน/หน่วยงานที่เข้าร่วม
              </span>
              <div className="font-semibold text-gray-800">{booking.institute}</div>
            </div>
          )}

          {(booking.meetingType === 'Online' || booking.meetingType === 'Hybrid') && booking.meetingLink && (
            <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
              <span className="text-xs font-bold text-blue-900 block mb-1 flex items-center gap-1">
                <Video size={14} /> ลิงก์ห้องประชุมออนไลน์:
              </span>
              <a
                href={booking.meetingLink}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 font-bold hover:underline break-all flex items-center gap-1"
              >
                <span>{booking.meetingLink}</span>
                <ExternalLink size={12} className="shrink-0" />
              </a>
            </div>
          )}

          {/* Catering & Equipment Details */}
          {(booking.equipment ||
            (booking.snacks ?? 0) > 0 ||
            (booking.lunch ?? 0) > 0 ||
            (booking.drinks ?? 0) > 0 ||
            booking.seatingSetup ||
            booking.note) && (
            <div className="bg-gray-50 p-3 rounded-xl border border-gray-100 space-y-1 text-xs text-gray-600">
              {booking.equipment && (
                <div>
                  <strong>อุปกรณ์:</strong>{' '}
                  {Array.isArray(booking.equipment)
                    ? booking.equipment.map(normalizeEquipmentName).join(', ')
                    : booking.equipment.split(', ').map(normalizeEquipmentName).join(', ')}
                </div>
              )}
              {((booking.snacks ?? 0) > 0 ||
                (booking.lunch ?? 0) > 0 ||
                (booking.drinks ?? 0) > 0) && (
                <div>
                  <strong>อาหาร/เครื่องดื่ม:</strong> ว่าง {booking.snacks || 0} ชุด / กลางวัน{' '}
                  {booking.lunch || 0} กล่อง / เครื่องดื่ม {booking.drinks || 0} ขวด
                </div>
              )}
              {booking.seatingSetup && (
                <div>
                  <strong>การจัดโต๊ะประชุม:</strong> {normalizeSeatingName(booking.seatingSetup)}
                </div>
              )}
              {booking.note && (
                <div>
                  <strong>หมายเหตุ / ข้อมูลเพิ่มเติม:</strong> {booking.note}
                </div>
              )}
            </div>
          )}

          {/* Cancelled Notice */}
          {isCancelled && (
            <div className="p-3 bg-gray-100 rounded-2xl border border-gray-300 text-xs text-gray-700 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-gray-900">
                <Ban size={14} className="text-gray-500" />
                <span>การจองนี้ถูกยกเลิกแล้ว (ช่วงเวลาในห้องถูกปลดล็อกเรียบร้อย)</span>
              </div>
              {booking.cancellationReason && (
                <div className="text-gray-600 pl-5">
                  <strong>เหตุผล:</strong> {booking.cancellationReason}
                </div>
              )}
              {booking.cancelledAt && (
                <div className="text-[11px] text-gray-500 pl-5">
                  <strong>เวลาที่ยกเลิก:</strong> {formatThaiDate(booking.cancelledAt, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })} น.
                </div>
              )}
            </div>
          )}

          {/* Rejected Notice */}
          {isRejected && booking.rejectionReason && (
            <div className="p-3 bg-red-50 rounded-2xl border border-red-200 text-xs text-red-700">
              <strong>เหตุผลที่ไม่อนุมัติ:</strong> {booking.rejectionReason}
            </div>
          )}

          {/* Google Calendar Sync Section */}
          {!isBlocked && !isCancelled && !isRejected && (
            <div className="pt-2 border-t border-gray-200">
              <span className="text-xs font-bold text-gray-500 uppercase block mb-2">
                ซิงค์กับปฏิทินส่วนตัว (Calendar Sync)
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <a
                  href={googleCalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-blue-50 text-blue-700 font-bold rounded-xl border border-blue-200 shadow-2xs transition text-xs"
                >
                  <CalendarPlus size={15} className="text-blue-600" />
                  <span>เพิ่มลง Google Calendar</span>
                </a>
                <button
                  type="button"
                  onClick={() => downloadIcsFile(booking, room)}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-white hover:bg-gray-50 text-gray-700 font-bold rounded-xl border border-gray-200 shadow-2xs transition text-xs"
                  title="ดาวน์โหลดไฟล์ .ics สำหรับ iPhone (iOS), Android, และ Outlook"
                >
                  <Download size={15} className="text-gray-500" />
                  <span>โหลด .ics (มือถือ iOS / Android)</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50/90 space-y-2 shrink-0">
          {/* Prompt to login as Admin/Manager to approve if viewing a pending booking (Only when unauthenticated, NEVER for User accounts) */}
          {isPending && !isBlocked && !canApproveOrReject && !currentUser && onOpenAdminLogin && (
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900 flex items-center justify-between gap-3">
              <div>
                <span className="font-bold block">คำขอนี้รอการอนุมัติ</span>
                <span className="text-[11px] text-amber-700">เข้าสู่ระบบผู้ดูแลระบบเพื่อทำการอนุมัติหรือปฏิเสธคำขอนี้</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenAdminLogin();
                }}
                className="px-3 py-1.5 bg-[#C8102E] hover:bg-[#a00c24] text-white font-bold rounded-xl text-xs shadow-2xs transition shrink-0"
              >
                เข้าสู่ระบบ Admin
              </button>
            </div>
          )}

          {/* Approve & Reject Buttons (Admin or Dept Manager) */}
          {canApproveOrReject && (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onApprove?.(booking)}
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-xs sm:text-sm shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Check size={16} /> อนุมัติการจอง
              </button>
              <button
                type="button"
                onClick={() => onReject?.(booking)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition text-xs sm:text-sm shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Ban size={16} /> ปฏิเสธการจอง
              </button>
            </div>
          )}

          {/* Edit Booking Button (Admin/Manager or Booking Owner) */}
          {canEdit && onEditClick && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onEditClick(booking);
              }}
              className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl transition text-xs sm:text-sm shadow-xs flex items-center justify-center gap-1.5 active:scale-95"
            >
              <Edit3 size={15} /> แก้ไขข้อมูลการจองห้องประชุม
            </button>
          )}

          {/* Resend Confirmation Email - Admin & Manager ONLY */}
          {!isBlocked &&
            onResendEmail &&
            (isPending || isApproved) &&
            (isAdminMode || currentUser?.role === 'admin' || currentUser?.role === 'manager') && (
              <button
                type="button"
                onClick={() => onResendEmail(booking)}
                className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl transition border border-blue-200 flex items-center justify-center gap-1.5 text-xs"
              >
                <Send size={14} /> ส่งอีเมลแจ้งเตือนซ้ำให้ผู้จอง ({booking.email || 'อีเมลผู้จอง'})
              </button>
            )}

          {/* User / Admin Cancel Booking */}
          {canCancel && onCancelClick && (
            <button
              type="button"
              onClick={() => onCancelClick(booking)}
              className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-xl transition border border-red-200 flex items-center justify-center gap-1.5 text-xs"
            >
              <X size={15} /> ยกเลิกการจองห้องนี้
            </button>
          )}

          {/* Past Booking Notice for Regular Users */}
          {!canCancel && isPast && !isUserAdmin && (isPending || isApproved) && isBookingOwner && (
            <div className="w-full p-2.5 bg-gray-100 rounded-xl border border-gray-200 text-gray-500 text-xs flex items-center justify-center gap-2">
              <Clock size={14} className="text-gray-400 shrink-0" />
              <span>พ้นกำหนดวันและเวลาแล้ว บัญชี User ไม่สามารถยกเลิกการจองย้อนหลังได้</span>
            </div>
          )}

          {/* Admin Delete Booking Permanently */}
          {(isAdminMode || currentUser?.role === 'admin') && onDeleteClick && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onDeleteClick(booking);
              }}
              className="w-full py-2 bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 font-bold rounded-xl transition border border-gray-200 hover:border-red-200 flex items-center justify-center gap-1.5 text-xs"
            >
              <Trash2 size={14} /> ลบรายการจองนี้ถาวร (Admin Delete)
            </button>
          )}

          <button
            type="button"
            onClick={onClose}
            className="w-full py-2.5 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-xl transition border border-gray-200 shadow-2xs text-xs sm:text-sm"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
