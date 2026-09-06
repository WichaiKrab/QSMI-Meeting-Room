import React, { useState, useMemo } from 'react';
import {
  Building,
  Building2,
  Plus,
  Edit,
  Trash2,
  Search,
  Users,
  CalendarCheck,
  Check,
  X,
  AlertCircle
} from 'lucide-react';
import { Department, UserAccount, Booking } from '../types';

interface DepartmentManagementTabProps {
  departments: Department[];
  users: UserAccount[];
  bookings: Booking[];
  isAdmin: boolean;
  onAddDepartment: (newDept: Omit<Department, 'id'>) => void;
  onUpdateDepartment: (updatedDept: Department) => void;
  onDeleteDepartment: (deptId: string) => void;
}

export const DepartmentManagementTab: React.FC<DepartmentManagementTabProps> = ({
  departments,
  users,
  bookings,
  isAdmin,
  onAddDepartment,
  onUpdateDepartment,
  onDeleteDepartment
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // Form state: ONLY Department Name
  const [departmentName, setDepartmentName] = useState('');
  const [formError, setFormError] = useState('');

  // Search filtering by Department Name
  const filteredDepartments = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return departments;

    return departments.filter((d) => d.name.toLowerCase().includes(term));
  }, [departments, searchTerm]);

  // Open Add Modal
  const handleOpenAdd = () => {
    setDepartmentName('');
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Open Edit Modal
  const handleOpenEdit = (dept: Department) => {
    setEditingDept(dept);
    setDepartmentName(dept.name);
    setFormError('');
  };

  // Save Form Submit (Add or Edit)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const trimmedName = departmentName.trim();
    if (!trimmedName) {
      setFormError('กรุณาระบุชื่อฝ่าย / หน่วยงาน');
      return;
    }

    // Check duplicate name
    const isDuplicate = departments.some(
      (d) =>
        d.name.trim().toLowerCase() === trimmedName.toLowerCase() &&
        d.id !== editingDept?.id
    );
    if (isDuplicate) {
      setFormError(`มีฝ่ายชื่อ "${trimmedName}" อยู่ในระบบแล้ว`);
      return;
    }

    if (editingDept) {
      // Update
      onUpdateDepartment({
        ...editingDept,
        name: trimmedName
      });
      setEditingDept(null);
    } else {
      // Add
      onAddDepartment({
        name: trimmedName,
        createdAt: new Date().toISOString()
      });
      setIsAddModalOpen(false);
    }
  };

  // Safe Delete Handler
  const handleDelete = (dept: Department) => {
    onDeleteDepartment(dept.id);
  };

  return (
    <div className="space-y-5 animate-fade-in">
      {/* Top Header & Overview */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="text-[#C8102E]" size={22} />
            <span>การจัดการข้อมูลฝ่าย (Department Management)</span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            เพิ่ม ลบ และแก้ไขรายชื่อฝ่าย / หน่วยงาน สำหรับใช้งานในระบบจองห้องประชุมและข้อมูลผู้ใช้งาน
          </p>
        </div>

        {isAdmin && (
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#C8102E] hover:bg-[#a00c24] text-white rounded-xl text-xs sm:text-sm font-bold transition shadow-xs self-start sm:self-auto active:scale-95"
          >
            <Plus size={16} />
            <span>เพิ่มฝ่ายใหม่</span>
          </button>
        )}
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
            <Building size={13} className="text-[#C8102E]" />
            <span>จำนวนฝ่ายทั้งหมด</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-gray-900 mt-1">
            {departments.length} <span className="text-xs font-normal text-gray-500">ฝ่าย</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
            <Users size={13} className="text-blue-600" />
            <span>บุคลากรในระบบ</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-blue-600 mt-1">
            {users.length} <span className="text-xs font-normal text-gray-500">คน</span>
          </div>
        </div>

        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
            <CalendarCheck size={13} className="text-emerald-600" />
            <span>คำขอจองห้องทั้งหมด</span>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">
            {bookings.length} <span className="text-xs font-normal text-gray-500">ครั้ง</span>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="ค้นหาชื่อฝ่าย / หน่วยงาน..."
            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#C8102E] shadow-2xs"
          />
        </div>
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-xl text-xs font-semibold"
          >
            ล้างค้นหา
          </button>
        )}
      </div>

      {/* Departments Grid List */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {filteredDepartments.map((dept, idx) => {
          const deptUsers = users.filter(
            (u) => u.department?.toLowerCase() === dept.name.toLowerCase()
          );
          const deptBookings = bookings.filter(
            (b) => b.department?.toLowerCase() === dept.name.toLowerCase()
          );

          return (
            <div
              key={dept.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-2xs hover:shadow-md transition flex flex-col justify-between p-4"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-red-50 text-[#C8102E] border border-red-100 flex items-center justify-center font-bold text-sm shrink-0">
                    <Building size={18} />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-semibold text-gray-400 block">
                      ลำดับที่ {idx + 1}
                    </span>
                    <h4 className="text-sm sm:text-base font-bold text-gray-900 leading-snug truncate" title={dept.name}>
                      {dept.name}
                    </h4>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleOpenEdit(dept)}
                      className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="แก้ไขชื่อฝ่าย"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(dept)}
                      className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="ลบฝ่ายนี้"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                )}
              </div>

              {/* Department Statistics Footer */}
              <div className="mt-3.5 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1.5">
                  <Users size={13} className="text-blue-600" />
                  <span>บุคลากร <strong className="text-gray-800">{deptUsers.length}</strong> คน</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CalendarCheck size={13} className="text-emerald-600" />
                  <span>จอง <strong className="text-gray-800">{deptBookings.length}</strong> ครั้ง</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredDepartments.length === 0 && (
        <div className="py-12 text-center bg-white rounded-2xl border border-gray-200 p-6 space-y-2">
          <Building className="mx-auto text-gray-300" size={36} />
          <div className="text-sm font-bold text-gray-700">ไม่พบฝ่ายที่ตรงกับคำค้นหา</div>
          <p className="text-xs text-gray-500">ลองค้นหาด้วยคำอื่น หรือกดปุ่ม "เพิ่มฝ่ายใหม่" ด้านบน</p>
        </div>
      )}

      {/* ======================================================= */}
      {/* MODAL: ADD / EDIT DEPARTMENT (ONLY ชื่อฝ่าย / หน่วยงาน) */}
      {/* ======================================================= */}
      {(isAddModalOpen || editingDept) && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto custom-scrollbar"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setIsAddModalOpen(false);
              setEditingDept(null);
            }
          }}
        >
          <div className="bg-white rounded-3xl p-5 sm:p-6 max-w-md w-full shadow-2xl border-t-4 border-[#C8102E] animate-fade-in space-y-4 my-auto">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <h4 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Building2 className="text-[#C8102E]" size={20} />
                <span>{editingDept ? `แก้ไขข้อมูลฝ่าย (${editingDept.name})` : 'เพิ่มฝ่าย / หน่วยงานใหม่'}</span>
              </h4>
              <button
                type="button"
                onClick={() => {
                  setIsAddModalOpen(false);
                  setEditingDept(null);
                }}
                className="p-1 text-gray-400 hover:text-gray-700 rounded-lg"
              >
                <X size={18} />
              </button>
            </div>

            {/* Error Message */}
            {formError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-center gap-2 font-medium">
                <AlertCircle size={15} className="shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            {/* Form with ONLY ชื่อฝ่าย / หน่วยงาน */}
            <form onSubmit={handleSaveForm} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-bold text-gray-700 mb-1.5">
                  ชื่อฝ่าย / หน่วยงาน <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="เช่น ฝ่ายบริหารงานทั่วไป"
                  value={departmentName}
                  onChange={(e) => setDepartmentName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-xl text-xs sm:text-sm font-medium text-gray-900 outline-none focus:ring-2 focus:ring-[#C8102E]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setEditingDept(null);
                  }}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs sm:text-sm font-bold transition"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-[#C8102E] hover:bg-[#a00c24] text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-1.5 shadow-xs active:scale-95"
                >
                  <Check size={16} />
                  <span>{editingDept ? 'บันทึกการแก้ไข' : 'เพิ่มฝ่ายใหม่'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
