import React, { useState } from 'react';
import { X, HelpCircle, ExternalLink, RotateCcw } from 'lucide-react';

interface BookingGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BookingGuideModal: React.FC<BookingGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const [imgLoaded, setImgLoaded] = useState(false);
  const [cacheKey, setCacheKey] = useState(Date.now());
  const BASE_IMAGE_URL = 'https://lh3.googleusercontent.com/d/1IIUWu35tt1w63iG7pfTEqlcELJvsHecO';
  const imageUrl = `${BASE_IMAGE_URL}?t=${cacheKey}`;

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-5 overflow-y-auto custom-scrollbar"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92dvh] flex flex-col relative border-t-4 border-[#C8102E] overflow-hidden my-auto animate-fade-in">
        {/* Header */}
        <div className="flex items-center justify-between gap-2 px-4 sm:px-6 py-3.5 sm:py-4 border-b border-gray-200 bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0 flex-1">
            <div className="bg-red-100 p-2 rounded-xl text-[#C8102E] shrink-0">
              <HelpCircle size={20} />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-gray-900 truncate">
                ขั้นตอนการจองห้องประชุม
              </h3>
              <p className="text-[11px] sm:text-xs text-gray-500 truncate">
                สถานเสาวภา สภากาชาดไทย (QSMI)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                setImgLoaded(false);
                setCacheKey(Date.now());
              }}
              className="hidden sm:flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-[#C8102E] bg-white px-2.5 sm:px-3 py-1.5 rounded-lg border border-gray-200 transition whitespace-nowrap"
              title="โหลดรูปภาพใหม่"
            >
              <RotateCcw size={13} />
              <span>โหลดใหม่</span>
            </button>
            <a
              href={imageUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-xs font-bold text-[#C8102E] bg-red-50 hover:bg-red-100 px-2.5 sm:px-3 py-1.5 rounded-lg border border-red-100 transition whitespace-nowrap shrink-0"
              title="เปิดดูรูปภาพต้นฉบับ"
            >
              <ExternalLink size={13} className="shrink-0" />
              <span className="whitespace-nowrap">เปิดรูปเต็ม</span>
            </a>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition shrink-0"
              aria-label="ปิดหน้าต่าง"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-4 bg-white">
          {/* Flowchart Diagram Image */}
          <div className="bg-gray-100 rounded-2xl p-3 sm:p-4 border border-gray-200 flex flex-col items-center justify-center relative min-h-[300px]">
            {!imgLoaded && (
              <div className="flex flex-col items-center justify-center gap-2 text-gray-400 py-12">
                <div className="w-8 h-8 border-3 border-gray-300 border-t-[#C8102E] rounded-full animate-spin" />
                <span className="text-xs font-semibold">กำลังโหลดแผนผังขั้นตอนการจอง...</span>
              </div>
            )}
            <img
              src={imageUrl}
              alt="แผนผังขั้นตอนการจองห้องประชุม"
              onLoad={() => setImgLoaded(true)}
              className={`max-w-full max-h-[68vh] object-contain rounded-xl shadow-xs transition-opacity duration-300 ${
                imgLoaded ? 'opacity-100' : 'opacity-0 absolute'
              }`}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 border-t border-gray-200 bg-gray-50 flex justify-between items-center shrink-0">
          <span className="text-xs text-gray-500 font-medium hidden sm:inline">
            * หากต้องการดูภาพขนาดต้นฉบับ สามารถกดปุ่ม &quot;เปิดรูปเต็ม&quot; ได้
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 bg-[#C8102E] hover:bg-[#a00c24] text-white font-bold rounded-xl text-xs sm:text-sm transition shadow-xs active:scale-95 ml-auto"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
