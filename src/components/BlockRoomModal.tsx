import React, { useState } from 'react';
import { X, Ban } from 'lucide-react';
import { Room } from '../types';

interface BlockRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  onBlock: (data: { roomId: string; startDate: string; endDate: string; reason: string }) => void;
}

export const BlockRoomModal: React.FC<BlockRoomModalProps> = ({
  isOpen,
  onClose,
  rooms,
  onBlock
}) => {
  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split('T')[0];
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id || '');
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [reason, setReason] = useState('ปิดปรับปรุงประจำรอบ');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;
    if (new Date(endDate) < new Date(startDate)) return;

    onBlock({
      roomId: selectedRoomId,
      startDate,
      endDate,
      reason: reason.trim() || 'ปิดปรับปรุง'
    });
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-3 sm:p-4 pt-8 sm:pt-4 overflow-y-auto custom-scrollbar"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-5 sm:p-7 border-t-4 border-[#C8102E] my-auto animate-fade-in">
        <div className="flex justify-between items-center pb-3 border-b border-gray-100 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-red-100 text-[#C8102E] rounded-xl">
              <Ban size={20} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                ปิดกั้นวันห้องประชุม
              </h2>
              <p className="text-xs text-gray-500">
                สำหรับงานซ่อมบำรุง หรือกิจกรรมส่วนกลางองค์กร
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              เลือกห้องประชุมที่ต้องการปิดกั้น
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                วันที่เริ่มต้น
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => {
                  const s = e.target.value;
                  setStartDate(s);
                  if (!endDate || new Date(s) > new Date(endDate)) {
                    setEndDate(s);
                  }
                }}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                วันที่สิ้นสุด
              </label>
              <input
                type="date"
                required
                min={startDate}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              เหตุผลในการปิดกั้น
            </label>
            <input
              type="text"
              required
              placeholder="เช่น ซ่อมบำรุงเครื่องปรับอากาศ, ทำความสะอาดใหญ่"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full p-2.5 bg-white border border-gray-300 rounded-xl text-xs sm:text-sm font-medium text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
            />
          </div>

          <div className="pt-2 flex gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs sm:text-sm transition"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="flex-1 py-2.5 bg-[#C8102E] hover:bg-[#a00c24] text-white font-bold rounded-xl text-xs sm:text-sm shadow-xs transition active:scale-95"
            >
              ยืนยันการปิดกั้น
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
