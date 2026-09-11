import React, { useState, useEffect } from 'react';
import {
  X,
  Layout,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  MapPin,
  Users,
  Edit2,
  Check,
  AlertTriangle,
  Monitor,
  Wifi,
  Tv,
  Mic,
  Video,
  FileText,
  Search,
  Eye,
  EyeOff,
  Info
} from 'lucide-react';
import { Room, Booking } from '../types';
import { PRESET_EQUIPMENT, PRESET_SEATING, normalizeEquipmentName, normalizeSeatingName } from '../data/initialData';

interface RoomManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  bookings?: Booking[];
  initialEditRoom?: Room | null;
  onAddRoom: (room: {
    name: string;
    capacity?: number;
    location?: string;
    description?: string;
    equipment?: string[];
    seatingOptions?: string[];
    color?: string;
    isActive?: boolean;
    isRetired?: boolean;
    hasSpecialSeating?: boolean;
  }) => void;
  onUpdateRoom: (room: Room) => void;
  onDeleteRoom: (roomId: string) => void;
  onToggleRoomStatus: (roomId: string) => void;
  onToggleRoomRetired?: (roomId: string) => void;
}

const PRESET_COLORS = [
  { label: 'น้ำเงิน (Blue)', value: 'bg-blue-100 border-blue-300 text-blue-800' },
  { label: 'เขียวมรกต (Emerald)', value: 'bg-emerald-100 border-emerald-300 text-emerald-800' },
  { label: 'ฟ้าคราม (Cyan)', value: 'bg-cyan-100 border-cyan-300 text-cyan-800' },
  { label: 'ม่วง (Purple)', value: 'bg-purple-100 border-purple-300 text-purple-800' },
  { label: 'อำพัน/ส้ม (Amber)', value: 'bg-amber-100 border-amber-300 text-amber-800' },
  { label: 'กุหลาบ (Rose)', value: 'bg-rose-100 border-rose-300 text-rose-800' },
  { label: 'ครามเข้ม (Indigo)', value: 'bg-indigo-100 border-indigo-300 text-indigo-800' },
  { label: 'เขียวหัวเป็ด (Teal)', value: 'bg-teal-100 border-teal-300 text-teal-800' }
];

export const RoomManagementModal: React.FC<RoomManagementModalProps> = ({
  isOpen,
  onClose,
  rooms,
  bookings = [],
  initialEditRoom,
  onAddRoom,
  onUpdateRoom,
  onDeleteRoom,
  onToggleRoomStatus,
  onToggleRoomRetired
}) => {
  if (!isOpen) return null;

  // View mode: 'list' | 'create' | 'edit'
  const [formMode, setFormMode] = useState<'list' | 'create' | 'edit'>('list');
  const [editingRoomId, setEditingRoomId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  // Form states
  const [name, setName] = useState('');
  const [capacity, setCapacity] = useState<number | ''>(20);
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [customEqInput, setCustomEqInput] = useState('');
  const [selectedSeating, setSelectedSeating] = useState<string[]>([]);
  const [customSeatingInput, setCustomSeatingInput] = useState('');
  const [colorClass, setColorClass] = useState(PRESET_COLORS[0].value);
  const [isActive, setIsActive] = useState(true);
  const [isRetired, setIsRetired] = useState(false);

  // Equipment Options Catalog (Add, Delete, Edit)
  const [equipmentCatalog, setEquipmentCatalog] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('meeting_app_equipment_catalog');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return PRESET_EQUIPMENT;
  });

  // Seating Options Catalog (Add, Delete, Edit)
  const [seatingCatalog, setSeatingCatalog] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('meeting_app_seating_catalog');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.error(e);
    }
    return PRESET_SEATING;
  });

  // Inline editing states
  const [editingEqItem, setEditingEqItem] = useState<string | null>(null);
  const [editingEqText, setEditingEqText] = useState('');
  const [editingSeatItem, setEditingSeatItem] = useState<string | null>(null);
  const [editingSeatText, setEditingSeatText] = useState('');

  // Delete confirm state
  const [deleteConfirmRoom, setDeleteConfirmRoom] = useState<Room | null>(null);

  useEffect(() => {
    if (initialEditRoom) {
      handleOpenEdit(initialEditRoom);
    }
  }, [initialEditRoom]);

  // Synchronize options from rooms into catalogs if any custom room has options
  useEffect(() => {
    const roomEqs = rooms.flatMap((r) => r.equipment || []).map(normalizeEquipmentName).filter(Boolean);
    setEquipmentCatalog((prev) => {
      const merged = Array.from(new Set([...prev, ...roomEqs]));
      if (merged.length !== prev.length) {
        localStorage.setItem('meeting_app_equipment_catalog', JSON.stringify(merged));
        return merged;
      }
      return prev;
    });

    const roomSeats = rooms.flatMap((r) => r.seatingOptions || []).map(normalizeSeatingName).filter(Boolean);
    setSeatingCatalog((prev) => {
      const merged = Array.from(new Set([...prev, ...roomSeats]));
      if (merged.length !== prev.length) {
        localStorage.setItem('meeting_app_seating_catalog', JSON.stringify(merged));
        return merged;
      }
      return prev;
    });
  }, [rooms]);

  const handleOpenCreate = () => {
    setName('');
    setCapacity(20);
    setLocation('ตึกอำนวยการ');
    setDescription('');
    setSelectedEquipment(['LCD Projector', 'WiFi ความเร็วสูง', 'ระบบเครื่องเสียงและไมโครโฟน']);
    setSelectedSeating(['Classroom (ห้องเรียน)', 'Meeting (U) (จัดโต๊ะรูปตัว U)']);
    setColorClass(PRESET_COLORS[0].value);
    setIsActive(true);
    setIsRetired(false);
    setCustomEqInput('');
    setCustomSeatingInput('');
    setEditingEqItem(null);
    setEditingSeatItem(null);
    setFormMode('create');
  };

  const handleOpenEdit = (room: Room) => {
    setEditingRoomId(room.id);
    setName(room.name);
    setCapacity(room.capacity || 20);
    setLocation(room.location || '');
    setDescription(room.description || '');
    const currentEqs = (room.equipment || []).map(normalizeEquipmentName).filter(Boolean);
    const currentSeats = (room.seatingOptions || []).map(normalizeSeatingName).filter(Boolean);
    setSelectedEquipment(currentEqs);
    setSelectedSeating(currentSeats);

    // Merge into catalog if not already present
    setEquipmentCatalog((prev) => {
      const merged = Array.from(new Set([...prev, ...currentEqs]));
      if (merged.length !== prev.length) {
        localStorage.setItem('meeting_app_equipment_catalog', JSON.stringify(merged));
        return merged;
      }
      return prev;
    });
    setSeatingCatalog((prev) => {
      const merged = Array.from(new Set([...prev, ...currentSeats]));
      if (merged.length !== prev.length) {
        localStorage.setItem('meeting_app_seating_catalog', JSON.stringify(merged));
        return merged;
      }
      return prev;
    });

    setColorClass(room.color || PRESET_COLORS[0].value);
    setIsActive(room.isActive);
    setIsRetired(room.isRetired ?? false);
    setCustomEqInput('');
    setCustomSeatingInput('');
    setEditingEqItem(null);
    setEditingSeatItem(null);
    setFormMode('edit');
  };

  // Equipment Handlers
  const handleToggleEquipment = (eq: string) => {
    setSelectedEquipment((prev) =>
      prev.includes(eq) ? prev.filter((item) => item !== eq) : [...prev, eq]
    );
  };

  const handleAddCustomEquipment = () => {
    const text = customEqInput.trim();
    if (!text) return;
    const normalized = normalizeEquipmentName(text);
    if (!equipmentCatalog.includes(normalized)) {
      const updated = [...equipmentCatalog, normalized];
      setEquipmentCatalog(updated);
      localStorage.setItem('meeting_app_equipment_catalog', JSON.stringify(updated));
    }
    if (!selectedEquipment.includes(normalized)) {
      setSelectedEquipment((prev) => [...prev, normalized]);
    }
    setCustomEqInput('');
  };

  const handleStartEditEquipment = (item: string) => {
    setEditingEqItem(item);
    setEditingEqText(item);
  };

  const handleSaveEditEquipment = (oldItem: string) => {
    const newText = editingEqText.trim();
    if (!newText || newText === oldItem) {
      setEditingEqItem(null);
      return;
    }
    const updated = equipmentCatalog.map((eq) => (eq === oldItem ? newText : eq));
    setEquipmentCatalog(updated);
    localStorage.setItem('meeting_app_equipment_catalog', JSON.stringify(updated));

    // Update selected list in current form
    setSelectedEquipment((prev) => prev.map((eq) => (eq === oldItem ? newText : eq)));

    setEditingEqItem(null);
    setEditingEqText('');
  };

  const handleCancelEditEquipment = () => {
    setEditingEqItem(null);
    setEditingEqText('');
  };

  const handleDeleteEquipment = (item: string) => {
    const updated = equipmentCatalog.filter((eq) => eq !== item);
    setEquipmentCatalog(updated);
    localStorage.setItem('meeting_app_equipment_catalog', JSON.stringify(updated));
    setSelectedEquipment((prev) => prev.filter((eq) => eq !== item));
  };

  // Seating Handlers
  const handleToggleSeating = (seat: string) => {
    setSelectedSeating((prev) =>
      prev.includes(seat) ? prev.filter((item) => item !== seat) : [...prev, seat]
    );
  };

  const handleAddCustomSeating = () => {
    const text = customSeatingInput.trim();
    if (!text) return;
    const normalized = normalizeSeatingName(text);
    if (!seatingCatalog.includes(normalized)) {
      const updated = [...seatingCatalog, normalized];
      setSeatingCatalog(updated);
      localStorage.setItem('meeting_app_seating_catalog', JSON.stringify(updated));
    }
    if (!selectedSeating.includes(normalized)) {
      setSelectedSeating((prev) => [...prev, normalized]);
    }
    setCustomSeatingInput('');
  };

  const handleStartEditSeating = (item: string) => {
    setEditingSeatItem(item);
    setEditingSeatText(item);
  };

  const handleSaveEditSeating = (oldItem: string) => {
    const newText = editingSeatText.trim();
    if (!newText || newText === oldItem) {
      setEditingSeatItem(null);
      return;
    }
    const updated = seatingCatalog.map((s) => (s === oldItem ? newText : s));
    setSeatingCatalog(updated);
    localStorage.setItem('meeting_app_seating_catalog', JSON.stringify(updated));

    // Update selected list in current form
    setSelectedSeating((prev) => prev.map((s) => (s === oldItem ? newText : s)));

    setEditingSeatItem(null);
    setEditingSeatText('');
  };

  const handleCancelEditSeating = () => {
    setEditingSeatItem(null);
    setEditingSeatText('');
  };

  const handleDeleteSeating = (item: string) => {
    const updated = seatingCatalog.filter((s) => s !== item);
    setSeatingCatalog(updated);
    localStorage.setItem('meeting_app_seating_catalog', JSON.stringify(updated));
    setSelectedSeating((prev) => prev.filter((s) => s !== item));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const hasMonkSeating = selectedSeating.some((s) => s.includes('จัดเลี้ยงพระ') || s.includes('พิธีการ') || s.includes('พิธีสงฆ์'));

    if (formMode === 'create') {
      onAddRoom({
        name: name.trim(),
        capacity: capacity ? Number(capacity) : 20,
        location: location.trim() || 'ตึกอำนวยการ',
        description: description.trim(),
        equipment: selectedEquipment,
        seatingOptions: selectedSeating,
        color: colorClass,
        isActive,
        isRetired,
        hasSpecialSeating: hasMonkSeating
      });
      setFormMode('list');
    } else if (formMode === 'edit' && editingRoomId) {
      onUpdateRoom({
        id: editingRoomId,
        name: name.trim(),
        capacity: capacity ? Number(capacity) : 20,
        location: location.trim() || 'ตึกอำนวยการ',
        description: description.trim(),
        equipment: selectedEquipment,
        seatingOptions: selectedSeating,
        color: colorClass,
        isActive,
        isRetired,
        hasSpecialSeating: hasMonkSeating
      });
      setFormMode('list');
      setEditingRoomId(null);
    }
  };

  const getBookingCountForRoom = (roomId: string) => {
    return bookings.filter((b) => b.roomId === roomId && b.status !== 'cancelled' && b.status !== 'rejected').length;
  };

  const filteredRooms = rooms.filter((r) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      r.name.toLowerCase().includes(term) ||
      (r.location && r.location.toLowerCase().includes(term)) ||
      (r.description && r.description.toLowerCase().includes(term))
    );
  });

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-5 overflow-y-auto custom-scrollbar"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl max-h-[92dvh] flex flex-col relative border-t-4 border-[#C8102E] overflow-hidden my-auto animate-fade-in">
        {/* Header */}
        <div className="flex justify-between items-center px-5 sm:px-6 py-4 border-b border-gray-100 bg-gray-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-100 text-[#C8102E] rounded-2xl">
              <Layout size={22} />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-gray-900">
                {formMode === 'list'
                  ? 'ระบบจัดการห้องประชุม'
                  : formMode === 'create'
                  ? 'เพิ่มห้องประชุมใหม่'
                  : 'แก้ไขรายละเอียดห้องประชุม'}
              </h2>
              <p className="text-xs text-gray-500">
                {formMode === 'list'
                  ? `จัดการข้อมูล เพิ่ม ลบ และแก้ไขรายละเอียดห้องประชุม (${rooms.length} ห้อง)`
                  : 'กำหนดชื่อห้อง ความจุ สิ่งอำนวยความสะดวก และสถานะ'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200/60 rounded-xl transition"
          >
            <X size={20} />
          </button>
        </div>

        {/* Delete Confirmation Overlay */}
        {deleteConfirmRoom && (
          <div className="p-5 bg-red-50 border-b border-red-200 animate-fade-in">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-red-100 text-red-700 rounded-xl shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-red-900">
                  ยืนยันการลบห้องประชุม &quot;{deleteConfirmRoom.name}&quot;?
                </h4>
                <p className="text-xs text-red-700 mt-1">
                  การดำเนินการนี้จะไม่สามารถย้อนกลับได้
                  {getBookingCountForRoom(deleteConfirmRoom.id) > 0 && (
                    <span className="font-bold block mt-0.5">
                      ⚠️ มีรายการจองค้างอยู่สำหรับห้องนี้จำนวน {getBookingCountForRoom(deleteConfirmRoom.id)} รายการ
                    </span>
                  )}
                </p>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteRoom(deleteConfirmRoom.id);
                      setDeleteConfirmRoom(null);
                    }}
                    className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                  >
                    ยืนยันลบห้องนี้
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmRoom(null)}
                    className="px-3.5 py-1.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl text-xs font-bold transition"
                  >
                    ยกเลิก
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* VIEW 1: ROOMS LIST */}
        {formMode === 'list' && (
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input
                  type="text"
                  placeholder="ค้นหาชื่อห้องประชุม, อาคาร, ชั้น..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
                />
              </div>
              <button
                type="button"
                onClick={handleOpenCreate}
                className="flex items-center justify-center gap-1.5 px-4 py-2 bg-[#C8102E] hover:bg-[#a00c24] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition active:scale-95 shrink-0"
              >
                <Plus size={16} />
                <span>เพิ่มห้องประชุมใหม่</span>
              </button>
            </div>

            {/* Room Cards */}
            <div className="space-y-3">
              {filteredRooms.length === 0 ? (
                <div className="text-center py-10 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <Layout size={32} className="mx-auto text-gray-300 mb-2" />
                  <p className="text-sm font-bold text-gray-500">ไม่พบห้องประชุมที่ตรงกับคำค้นหา</p>
                </div>
              ) : (
                filteredRooms.map((room) => {
                  const bookingCount = getBookingCountForRoom(room.id);
                  return (
                    <div
                      key={room.id}
                      className={`p-4 rounded-2xl border transition flex flex-col gap-3 ${
                        room.isRetired
                          ? 'border-amber-300 bg-amber-50/40 ring-1 ring-amber-200'
                          : room.isActive
                          ? 'border-gray-200 bg-white hover:shadow-xs'
                          : 'border-red-200 bg-red-50/40'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-bold text-sm sm:text-base text-gray-900 leading-snug">
                              {room.name}
                            </h3>
                            {room.isRetired ? (
                              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                                <EyeOff size={11} />
                                <span>เลิกใช้งาน (ซ่อนอยู่)</span>
                              </span>
                            ) : (
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                                  room.isActive
                                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                    : 'bg-red-100 text-red-800 border border-red-200'
                                }`}
                              >
                                {room.isActive ? 'เปิดใช้งานปกติ' : 'ปิดปรับปรุง'}
                              </span>
                            )}
                            {bookingCount > 0 && (
                              <span className="text-[10px] font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-md border border-blue-200">
                                การจอง {bookingCount} รายการ
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-gray-500 flex flex-wrap items-center gap-3 mt-1.5">
                            {room.location && (
                              <span className="flex items-center gap-1 font-medium">
                                <MapPin size={12} className="text-gray-400" /> {room.location}
                              </span>
                            )}
                            <span className="flex items-center gap-1 font-medium">
                              <Users size={12} className="text-gray-400" /> {room.capacity || 20} ที่นั่ง
                            </span>
                            {room.hasSpecialSeating && (
                              <span className="text-[11px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                รองรับจัดเลี้ยงพระ
                              </span>
                            )}
                          </div>

                          {room.description && (
                            <p className="text-xs text-gray-600 mt-1.5 line-clamp-2">
                              {room.description}
                            </p>
                          )}

                          {room.isRetired && (
                            <div className="mt-2 text-[11px] font-medium text-amber-900 bg-amber-100/70 p-2 rounded-xl border border-amber-200 flex items-start gap-1.5">
                              <Info size={13} className="text-amber-700 shrink-0 mt-0.5" />
                              <span>ห้องนี้ถูกซ่อนจากหน้าจองใหม่แล้ว แต่ประวัติการจองและรายงานย้อนหลังยังคงอยู่ครบถ้วน</span>
                            </div>
                          )}

                          {/* Facilities badges */}
                          {room.equipment && room.equipment.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {room.equipment.map((eq, i) => (
                                <span
                                  key={i}
                                  className="text-[10px] bg-gray-100 text-gray-700 px-2 py-0.5 rounded font-medium border border-gray-200"
                                >
                                  {eq}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-1.5 shrink-0 flex-wrap justify-end">
                          {/* Toggle status for non-retired rooms */}
                          {!room.isRetired && (
                            <button
                              type="button"
                              onClick={() => onToggleRoomStatus(room.id)}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
                                room.isActive
                                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                              }`}
                              title="สลับสถานะเปิด/ปิดปรับปรุงห้อง"
                            >
                              {room.isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                              <span className="hidden sm:inline">
                                {room.isActive ? 'เปิดใช้งาน' : 'ปิดปรับปรุง'}
                              </span>
                            </button>
                          )}

                          {/* Hide / Unhide button */}
                          {onToggleRoomRetired && (
                            <button
                              type="button"
                              onClick={() => onToggleRoomRetired(room.id)}
                              className={`flex items-center gap-1 p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-xs font-bold transition border ${
                                room.isRetired
                                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600 shadow-xs'
                                  : 'bg-amber-50 hover:bg-amber-100 text-amber-800 border-amber-200'
                              }`}
                              title={room.isRetired ? 'ยกเลิกการซ่อน นำห้องนี้กลับมาเปิดให้จอง' : 'ซ่อนห้องนี้สำหรับห้องที่เลิกใช้งานแล้ว'}
                            >
                              {room.isRetired ? <Eye size={14} /> : <EyeOff size={14} />}
                              <span className="hidden sm:inline">
                                {room.isRetired ? 'ยกเลิกซ่อน' : 'ซ่อนห้อง'}
                              </span>
                            </button>
                          )}

                          {/* Edit button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(room)}
                            className="flex items-center gap-1 p-2 sm:px-2.5 sm:py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition border border-blue-200"
                            title="แก้ไขรายละเอียดห้องประชุมนี้"
                          >
                            <Edit2 size={14} />
                            <span className="hidden sm:inline">แก้ไข</span>
                          </button>

                          {/* Delete button */}
                          <button
                            type="button"
                            onClick={() => setDeleteConfirmRoom(room)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition border border-transparent hover:border-red-200"
                            title="ลบห้องประชุมนี้"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* VIEW 2: ADD / EDIT ROOM FORM */}
        {(formMode === 'create' || formMode === 'edit') && (
          <form onSubmit={handleFormSubmit} className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <span className="text-xs font-extrabold uppercase text-gray-500">
                {formMode === 'create' ? 'กรอกข้อมูลห้องประชุมใหม่' : 'แก้ไขข้อมูลห้องประชุม'}
              </span>
              <button
                type="button"
                onClick={() => setFormMode('list')}
                className="text-xs font-bold text-gray-600 hover:text-gray-900 underline"
              >
                ← กลับไปยังรายการห้อง
              </button>
            </div>

            {/* Room Name */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                ชื่อห้องประชุม <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="เช่น ห้องประชุม ชั้น 2 ตึกอำนวยการ (15 ที่นั่ง)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E]"
              />
            </div>

            {/* Capacity & Location */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  ความจุ (จำนวนที่นั่ง) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max="1000"
                  required
                  placeholder="เช่น 20"
                  value={capacity}
                  onChange={(e) => setCapacity(e.target.value ? Number(e.target.value) : '')}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  อาคาร / สถานที่ตั้ง
                </label>
                <input
                  type="text"
                  placeholder="เช่น ตึกอำนวยการ ชั้น 2, ตึกสภานายิกา ชั้น 5"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E]"
                />
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                คำอธิบาย / รายละเอียดจุดเด่นของห้อง
              </label>
              <textarea
                rows={2}
                placeholder="ระบุวัตถุประสงค์การใช้งานหรือข้อแนะนำเกี่ยวกับห้องนี้..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full p-2.5 bg-gray-50 border border-gray-300 rounded-xl text-xs sm:text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E]"
              />
            </div>

            {/* Equipment & Facilities */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  อุปกรณ์และสิ่งอำนวยความสะดวกในห้อง
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500">
                    เลือกแล้ว {selectedEquipment.length} / {equipmentCatalog.length} รายการ
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEquipmentCatalog(PRESET_EQUIPMENT);
                      localStorage.setItem('meeting_app_equipment_catalog', JSON.stringify(PRESET_EQUIPMENT));
                    }}
                    className="text-[10px] text-gray-400 hover:text-gray-700 underline"
                    title="คืนค่าตัวเลือกเริ่มต้น"
                  >
                    รีเซ็ตค่าเริ่มต้น
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-200 max-h-56 overflow-y-auto">
                {equipmentCatalog.map((eq) => {
                  const isChecked = selectedEquipment.includes(eq);
                  const isEditing = editingEqItem === eq;

                  if (isEditing) {
                    return (
                      <div
                        key={eq}
                        className="flex items-center gap-1.5 p-1.5 bg-white border-2 border-blue-500 rounded-xl shadow-xs"
                      >
                        <input
                          type="text"
                          value={editingEqText}
                          onChange={(e) => setEditingEqText(e.target.value)}
                          className="flex-1 px-2 py-0.5 text-xs text-gray-900 font-medium outline-none bg-transparent"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveEditEquipment(eq);
                            } else if (e.key === 'Escape') {
                              handleCancelEditEquipment();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditEquipment(eq)}
                          className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shrink-0"
                          title="บันทึก"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditEquipment}
                          className="p-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition shrink-0"
                          title="ยกเลิก"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={eq}
                      className={`group flex items-center justify-between gap-1.5 p-1.5 px-2.5 rounded-xl text-xs transition border ${
                        isChecked
                          ? 'bg-red-50/90 text-red-950 font-bold border-red-200 shadow-2xs'
                          : 'bg-white text-gray-700 hover:bg-gray-100/90 border-gray-200/80'
                      }`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0 pr-1 py-0.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleEquipment(eq)}
                          className="rounded text-[#C8102E] focus:ring-[#C8102E] w-4 h-4 cursor-pointer accent-[#C8102E] shrink-0"
                        />
                        <span className="truncate select-none">{eq}</span>
                      </label>
                      <div className="flex items-center gap-0.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEditEquipment(eq);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                          title="แก้ไขชื่ออุปกรณ์"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteEquipment(eq);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                          title="ลบตัวเลือกนี้"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Equipment */}
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  placeholder="พิมพ์ชื่ออุปกรณ์เพื่อเพิ่ม เช่น กล้องถ่ายทอดสด 360 องศา"
                  value={customEqInput}
                  onChange={(e) => setCustomEqInput(e.target.value)}
                  className="flex-1 p-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomEquipment();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomEquipment}
                  className="px-3.5 py-2 bg-gray-800 hover:bg-black text-white text-xs font-bold rounded-xl transition shrink-0 flex items-center gap-1"
                >
                  <Plus size={14} /> เพิ่มอุปกรณ์
                </button>
              </div>
            </div>

            {/* Seating Formats */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-gray-700">
                  รูปแบบการจัดโต๊ะเก้าอี้ที่รองรับ
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] text-gray-500">
                    เลือกแล้ว {selectedSeating.length} / {seatingCatalog.length} รูปแบบ
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setSeatingCatalog(PRESET_SEATING);
                      localStorage.setItem('meeting_app_seating_catalog', JSON.stringify(PRESET_SEATING));
                    }}
                    className="text-[10px] text-gray-400 hover:text-gray-700 underline"
                    title="คืนค่าตัวเลือกเริ่มต้น"
                  >
                    รีเซ็ตค่าเริ่มต้น
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-200 max-h-56 overflow-y-auto">
                {seatingCatalog.map((seat) => {
                  const isChecked = selectedSeating.includes(seat);
                  const isEditing = editingSeatItem === seat;

                  if (isEditing) {
                    return (
                      <div
                        key={seat}
                        className="flex items-center gap-1.5 p-1.5 bg-white border-2 border-blue-500 rounded-xl shadow-xs"
                      >
                        <input
                          type="text"
                          value={editingSeatText}
                          onChange={(e) => setEditingSeatText(e.target.value)}
                          className="flex-1 px-2 py-0.5 text-xs text-gray-900 font-medium outline-none bg-transparent"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleSaveEditSeating(seat);
                            } else if (e.key === 'Escape') {
                              handleCancelEditSeating();
                            }
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditSeating(seat)}
                          className="p-1 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition shrink-0"
                          title="บันทึก"
                        >
                          <Check size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={handleCancelEditSeating}
                          className="p-1 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-md transition shrink-0"
                          title="ยกเลิก"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={seat}
                      className={`group flex items-center justify-between gap-1.5 p-1.5 px-2.5 rounded-xl text-xs transition border ${
                        isChecked
                          ? 'bg-red-50/90 text-red-950 font-bold border-red-200 shadow-2xs'
                          : 'bg-white text-gray-700 hover:bg-gray-100/90 border-gray-200/80'
                      }`}
                    >
                      <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0 pr-1 py-0.5">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSeating(seat)}
                          className="rounded text-[#C8102E] focus:ring-[#C8102E] w-4 h-4 cursor-pointer accent-[#C8102E] shrink-0"
                        />
                        <span className="truncate select-none">{seat}</span>
                      </label>
                      <div className="flex items-center gap-0.5 shrink-0 opacity-70 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStartEditSeating(seat);
                          }}
                          className="p-1 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition"
                          title="แก้ไขชื่อรูปแบบจัดโต๊ะ"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteSeating(seat);
                          }}
                          className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition"
                          title="ลบตัวเลือกนี้"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add Custom Seating Layout */}
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  placeholder="พิมพ์รูปแบบจัดโต๊ะเพื่อเพิ่ม เช่น จัดโต๊ะกลม (Round Table)"
                  value={customSeatingInput}
                  onChange={(e) => setCustomSeatingInput(e.target.value)}
                  className="flex-1 p-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-800 outline-none focus:ring-2 focus:ring-[#C8102E]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddCustomSeating();
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={handleAddCustomSeating}
                  className="px-3.5 py-2 bg-gray-800 hover:bg-black text-white text-xs font-bold rounded-xl transition shrink-0 flex items-center gap-1"
                >
                  <Plus size={14} /> เพิ่มรูปแบบ
                </button>
              </div>
            </div>

            {/* Initial Status */}
            <div className="pt-1">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                สถานะห้องประชุม
              </label>
              <button
                type="button"
                onClick={() => setIsActive(!isActive)}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition ${
                  isActive
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                    : 'bg-red-50 border-red-300 text-red-800'
                }`}
              >
                <span>{isActive ? 'เปิดใช้งานปกติ (พร้อมจอง)' : 'ปิดปรับปรุง (ห้ามจอง)'}</span>
                {isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
              </button>
            </div>

            {/* Retired / Hide Room for Decommissioned Rooms */}
            <div className="pt-1">
              <label className="block text-xs font-bold text-gray-700 mb-1">
                การซ่อนห้องประชุม (สำหรับห้องที่เลิกใช้งานแล้ว)
              </label>
              <button
                type="button"
                onClick={() => setIsRetired(!isRetired)}
                className={`w-full p-2.5 rounded-xl border flex items-center justify-between text-xs font-bold transition ${
                  isRetired
                    ? 'bg-amber-50 border-amber-300 text-amber-800 ring-1 ring-amber-200'
                    : 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
                }`}
              >
                <div className="flex items-center gap-2 text-left">
                  <EyeOff size={16} className={isRetired ? 'text-amber-600' : 'text-gray-400'} />
                  <div>
                    <span className="block font-bold">
                      {isRetired ? 'ซ่อนห้องประชุมนี้ (เลิกใช้งานแล้ว)' : 'แสดงห้องประชุมตามปกติ'}
                    </span>
                    <span className="block text-[11px] font-normal text-gray-500 mt-0.5">
                      {isRetired
                        ? 'ห้องนี้จะไม่แสดงในหน้าจองใหม่ แต่ข้อมูลประวัติการจองและรายงานย้อนหลังยังคงอยู่ครบถ้วน'
                        : 'แสดงในหน้าจองห้องใหม่ตามปกติ'}
                    </span>
                  </div>
                </div>
                {isRetired ? <ToggleRight size={20} className="text-amber-600 shrink-0" /> : <ToggleLeft size={20} className="text-gray-400 shrink-0" />}
              </button>
            </div>

            {/* Footer Buttons */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setFormMode('list')}
                className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="px-6 py-2.5 bg-[#C8102E] hover:bg-[#a00c24] text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95"
              >
                {formMode === 'create' ? 'บันทึกและเพิ่มห้องประชุม' : 'บันทึกการแก้ไขข้อมูล'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
