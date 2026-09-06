import React, { useState } from 'react';
import { X, Mail, CheckCircle2, Clock, Ban, Trash2, Send, ExternalLink, ShieldAlert } from 'lucide-react';
import { EmailNotification } from '../types';
import { formatThaiDate, formatThaiTime } from '../utils/thaiDate';

interface EmailNotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: EmailNotification[];
  onClearAll: () => void;
  onOpenBookingFromEmail: (bookingId: string) => void;
}

export const EmailNotificationModal: React.FC<EmailNotificationModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onClearAll,
  onOpenBookingFromEmail
}) => {
  if (!isOpen) return null;

  const [selectedMail, setSelectedMail] = useState<EmailNotification | null>(
    notifications.length > 0 ? notifications[0] : null
  );
  const [viewHtmlMode, setViewHtmlMode] = useState<boolean>(true);

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-5 overflow-y-auto custom-scrollbar"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl h-[88dvh] flex flex-col relative border-t-4 border-[#C8102E] overflow-hidden my-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-gray-200 bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Mail size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
                <span>กล่องข้อความแจ้งเตือนทางอีเมล (Email Simulator)</span>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                  {notifications.length} ฉบับ
                </span>
              </h2>
              <p className="text-xs text-gray-500">
                ระบบจำลองการส่งอีเมลแจ้งเตือนผู้จองและผู้ดูแลระบบ (ตามสเปกโครงการ)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-white hover:bg-red-50 transition"
                title="ล้างประวัติอีเมลทั้งหมด"
              >
                <Trash2 size={13} />
                <span className="hidden sm:inline">ล้างทั้งหมด</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Two-Column Mail Client Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Mail List */}
          <div className="w-full md:w-80 border-r border-gray-200 overflow-y-auto custom-scrollbar bg-gray-50/50 p-2 space-y-1.5 shrink-0 max-h-[35%] md:max-h-full">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-gray-400 text-xs sm:text-sm">
                ยังไม่มีประวัติการส่งอีเมล
              </div>
            ) : (
              notifications.map((m) => {
                const isSelected = selectedMail?.id === m.id;
                let icon = <Clock size={14} className="text-amber-500" />;
                if (m.type === 'APPROVED') icon = <CheckCircle2 size={14} className="text-emerald-500" />;
                if (m.type === 'REJECTED' || m.type === 'CANCELLED') icon = <Ban size={14} className="text-red-500" />;

                return (
                  <div
                    key={m.id}
                    onClick={() => setSelectedMail(m)}
                    className={`p-3 rounded-2xl cursor-pointer transition text-xs border ${
                      isSelected
                        ? 'bg-white border-[#C8102E]/40 shadow-xs'
                        : 'bg-white/80 border-gray-200/80 hover:bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <div className="flex items-center gap-1.5 min-w-0">
                        {icon}
                        <span className="font-bold text-gray-900 truncate">
                          {m.isAdminNotice ? '🔔 Admin Notice' : '👤 ถึงผู้จอง'}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-400 whitespace-nowrap">
                        {formatThaiTime(m.sentAt, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="font-semibold text-gray-800 line-clamp-1 mb-0.5">
                      {m.subject}
                    </div>
                    <div className="text-[11px] text-gray-500 truncate">{m.recipient}</div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Mail View */}
          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            {selectedMail ? (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Mail Header */}
                <div className="p-4 sm:p-5 border-b border-gray-200 bg-white shrink-0 space-y-2">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-gray-900 leading-snug">
                        {selectedMail.subject}
                      </h3>
                      <div className="text-xs text-gray-500 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                        <span>
                          <strong>ถึง:</strong> {selectedMail.recipient}
                        </span>
                        <span>•</span>
                        <span>
                          <strong>เวลาส่ง:</strong>{' '}
                          {formatThaiDate(selectedMail.sentAt, {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}{' '}
                          {formatThaiTime(selectedMail.sentAt, { hour: '2-digit', minute: '2-digit' })}{' '}
                          น.
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => onOpenBookingFromEmail(selectedMail.bookingId)}
                        className="flex items-center gap-1 text-xs font-bold text-white bg-[#C8102E] hover:bg-[#a00c24] px-3 py-1.5 rounded-xl shadow-xs transition"
                      >
                        <span>เปิดการจอง #{selectedMail.bookingId}</span>
                        <ExternalLink size={12} />
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setViewHtmlMode(true)}
                        className={`text-xs font-bold px-3 py-1 rounded-lg transition ${
                          viewHtmlMode
                            ? 'bg-blue-100 text-blue-800'
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        HTML Email Preview
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewHtmlMode(false)}
                        className={`text-xs font-bold px-3 py-1 rounded-lg transition ${
                          !viewHtmlMode
                            ? 'bg-blue-100 text-blue-800'
                            : 'text-gray-500 hover:bg-gray-100'
                        }`}
                      >
                        Plain Text
                      </button>
                    </div>

                    <span className="text-[11px] text-gray-400 font-medium">
                      Server Email Dispatch: Success 200 OK
                    </span>
                  </div>
                </div>

                {/* Mail Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 bg-gray-100/60">
                  {viewHtmlMode ? (
                    <div
                      className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden max-w-xl mx-auto"
                      onClick={(e) => {
                        const anchor = (e.target as HTMLElement).closest('a');
                        if (anchor) {
                          const href = anchor.getAttribute('href');
                          if (href && href.includes('bookingId=')) {
                            e.preventDefault();
                            const bId = href.split('bookingId=')[1]?.replace(/[^a-zA-Z0-9_-]/g, '');
                            if (bId) {
                              onOpenBookingFromEmail(bId);
                            }
                          }
                        }
                      }}
                      dangerouslySetInnerHTML={{ __html: selectedMail.htmlBody }}
                    />
                  ) : (
                    <pre className="whitespace-pre-wrap font-sans text-xs sm:text-sm text-gray-800 bg-white p-5 rounded-2xl border border-gray-200 max-w-xl mx-auto shadow-xs leading-relaxed">
                      {selectedMail.bodyText}
                    </pre>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
                เลือกอีเมลทางด้านซ้ายเพื่อดูรายละเอียด
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
