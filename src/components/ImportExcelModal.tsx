import React, { useState, useRef } from 'react';
import {
  X,
  FileSpreadsheet,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  Trash2,
  Info,
  FileDown,
  BellOff
} from 'lucide-react';
import { Booking, Room } from '../types';
import {
  downloadBookingCsvTemplate,
  parseAndValidateImportFile,
  ImportValidationResult
} from '../utils/excelImportService';

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  existingBookings: Booking[];
  onConfirmImport: (newBookings: Booking[], options?: { suppressEmail?: boolean }) => void;
}

export const ImportExcelModal: React.FC<ImportExcelModalProps> = ({
  isOpen,
  onClose,
  rooms,
  existingBookings,
  onConfirmImport
}) => {
  if (!isOpen) return null;

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDownloadingCsv, setIsDownloadingCsv] = useState(false);
  const [downloadSuccessMsg, setDownloadSuccessMsg] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [validationResult, setValidationResult] = useState<ImportValidationResult | null>(null);
  const [activeFilter, setActiveFilter] = useState<'all' | 'valid' | 'invalid'>('all');
  const [showGuide, setShowGuide] = useState(false);
  const [copiedRoomName, setCopiedRoomName] = useState<string | null>(null);
  const [disallowPastBookings, setDisallowPastBookings] = useState(true);
  const [suppressEmailNotifications, setSuppressEmailNotifications] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDownloadCsv = () => {
    setIsDownloadingCsv(true);
    setDownloadSuccessMsg(null);
    try {
      downloadBookingCsvTemplate(rooms);
      setDownloadSuccessMsg('ดาวน์โหลดไฟล์ Template (.csv) สำเร็จแล้ว (รองรับภาษาไทย)');
      setTimeout(() => setDownloadSuccessMsg(null), 5000);
    } catch (err: any) {
      alert(`ไม่สามารถดาวน์โหลดไฟล์ได้: ${err?.message || 'ข้อผิดพลาดระบบ'}`);
    } finally {
      setIsDownloadingCsv(false);
    }
  };

  const handleFileChange = async (file: File, disallowPast = disallowPastBookings) => {
    if (!file) return;

    // Check file extension
    const validExts = ['.xlsx', '.xls', '.csv', '.tsv'];
    const lowerName = file.name.toLowerCase();
    const hasValidExt = validExts.some((ext) => lowerName.endsWith(ext));
    if (!hasValidExt) {
      setParseError('รูปแบบไฟล์ไม่ถูกต้อง รองรับเฉพาะไฟล์นามสกุล .xlsx, .xls และ .csv เท่านั้น');
      setSelectedFile(null);
      setValidationResult(null);
      return;
    }

    setSelectedFile(file);
    setParseError(null);
    setValidationResult(null);
    setIsProcessing(true);

    try {
      const result = await parseAndValidateImportFile(file, rooms, existingBookings, {
        disallowPastBookings: disallowPast
      });
      setValidationResult(result);
    } catch (err: any) {
      setParseError(err.message || 'ไม่สามารถอ่านข้อมูลจากไฟล์ได้ กรุณาตรวจสอบรูปแบบไฟล์');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetFile = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSelectedFile(null);
    setValidationResult(null);
    setParseError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      handleFileChange(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleCopyRoom = (roomName: string) => {
    navigator.clipboard.writeText(roomName);
    setCopiedRoomName(roomName);
    setTimeout(() => setCopiedRoomName(null), 2000);
  };

  const handleTogglePastCheck = (checked: boolean) => {
    setDisallowPastBookings(checked);
    if (selectedFile) {
      handleFileChange(selectedFile, checked);
    }
  };

  const handleConfirm = () => {
    if (!validationResult || validationResult.readyBookings.length === 0) return;
    setIsImporting(true);
    try {
      const sanitizedBookings = validationResult.readyBookings.map((b) => ({
        ...b,
        isImported: true,
        suppressEmail: suppressEmailNotifications
      }));
      onConfirmImport(sanitizedBookings, { suppressEmail: suppressEmailNotifications });
      onClose();
    } finally {
      setIsImporting(false);
    }
  };

  const filteredRows = (validationResult?.rows || []).filter((r) => {
    if (activeFilter === 'valid' && !r.isValid) return false;
    if (activeFilter === 'invalid' && r.isValid) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTopic = (r.raw.topic || '').toLowerCase().includes(q);
      const matchRoom = (r.raw.roomStr || '').toLowerCase().includes(q);
      const matchUser = (r.raw.requesterName || '').toLowerCase().includes(q);
      return matchTopic || matchRoom || matchUser;
    }
    return true;
  });

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto custom-scrollbar animate-fade-in"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isImporting) onClose();
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[92dvh] flex flex-col border border-gray-100 overflow-hidden my-auto">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-900 to-teal-900 text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 backdrop-blur-xs flex items-center justify-center text-emerald-300 shadow-inner">
              <FileSpreadsheet size={22} />
            </div>
            <div>
              <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                นำเข้าข้อมูลการจองจากไฟล์ Excel
              </h3>
              <p className="text-xs text-emerald-200">
                รองรับไฟล์ .xlsx, .xls และ .csv พร้อมระบบตรวจสอบความถูกต้องและเวลาทับซ้อน
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-xl transition cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4 sm:space-y-5">
          {/* Step 1: Download Template Box */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 shadow-xs">
                  <FileText size={20} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="text-xs sm:text-sm font-bold text-emerald-950">
                    ดาวน์โหลดแบบฟอร์มต้นแบบ (Template .csv)
                  </h4>
                  <p className="text-xs text-emerald-800 leading-relaxed">
                    ดาวน์โหลดไฟล์เทมเพลตมาตรฐาน (.csv) พร้อมเปิดแก้ไขด้วย Microsoft Excel ได้ทันทีโดยภาษาไทยไม่เพี้ยน
                  </p>
                </div>
              </div>

              {/* Action Button for Download (CSV only) */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  disabled={isDownloadingCsv}
                  title="ดาวน์โหลดไฟล์ Template (.csv) สำหรับเปิดด้วย Microsoft Excel"
                  className="flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  {isDownloadingCsv ? (
                    <RefreshCw size={14} className="animate-spin" />
                  ) : (
                    <FileDown size={15} />
                  )}
                  <span>ดาวน์โหลด Template (.csv)</span>
                </button>
              </div>
            </div>

            {/* Download Success Notice */}
            {downloadSuccessMsg && (
              <div className="p-2.5 bg-emerald-100/80 border border-emerald-300 rounded-xl text-xs text-emerald-900 font-bold flex items-center gap-2 animate-fade-in">
                <CheckCircle2 size={16} className="text-emerald-700 shrink-0" />
                <span>{downloadSuccessMsg}</span>
              </div>
            )}

            {/* Column Guide Collapsible Accordion */}
            <div className="pt-2 border-t border-emerald-200/60">
              <button
                type="button"
                onClick={() => setShowGuide(!showGuide)}
                className="flex items-center gap-2 text-xs font-bold text-emerald-900 hover:text-emerald-700 cursor-pointer transition"
              >
                <Info size={14} />
                <span>ดูโครงสร้างคอลัมน์และรายชื่อห้องประชุมที่เปิดใช้งานในระบบ</span>
                {showGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {showGuide && (
                <div className="mt-3 p-3.5 bg-white/90 rounded-xl border border-emerald-200 space-y-3 text-xs animate-fade-in">
                  <div>
                    <span className="font-bold text-gray-900 block mb-1">
                      1. คอลัมน์ที่จำเป็นต้องมีข้อมูล (Required Columns):
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-gray-700">
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        <strong>หัวข้อการประชุม</strong> (เช่น การประชุมวางแผนยุทธศาสตร์)
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        <strong>ห้องประชุม</strong> (ชื่อหรือหมายเลขห้องในระบบ)
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        <strong>ชื่อ-นามสกุล ผู้ขอจอง</strong>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        <strong>วันที่เริ่มต้น & สิ้นสุด</strong> (รูปแบบ: YYYY-MM-DD หรือ DD/MM/YYYY)
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                        <strong>เวลาเริ่มต้น & สิ้นสุด</strong> (รูปแบบ: HH:mm เช่น 09:00, 13:30)
                      </div>
                    </div>
                  </div>

                  <div>
                    <span className="font-bold text-gray-900 block mb-1.5">
                      2. รายชื่อห้องประชุมในระบบ (คลิกที่ชื่อเพื่อคัดลอก):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {rooms.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => handleCopyRoom(r.name)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition cursor-pointer ${
                            copiedRoomName === r.name
                              ? 'bg-emerald-600 text-white font-bold'
                              : r.isActive
                              ? 'bg-gray-100 hover:bg-emerald-100 text-gray-800 border border-gray-200'
                              : 'bg-amber-50 text-amber-800 border border-amber-200 opacity-60'
                          }`}
                        >
                          {copiedRoomName === r.name ? (
                            <>
                              <Check size={12} />
                              <span>คัดลอกแล้ว!</span>
                            </>
                          ) : (
                            <>
                              <span>{r.name}</span>
                              <Copy size={11} className="text-gray-400" />
                            </>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 2: Upload Area */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <label className="text-xs font-bold text-gray-700">
                เลือกหรือลากไฟล์ Excel ที่ต้องการนำเข้า <span className="text-red-500">*</span>
              </label>

              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                {/* Validation Option: Disallow past bookings */}
                <label className="flex items-center gap-1.5 text-xs text-gray-600 font-semibold cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={disallowPastBookings}
                    onChange={(e) => handleTogglePastCheck(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span>ไม่อนุญาตให้จองย้อนหลังในอดีต</span>
                </label>

                {/* Email Option: Suppress email notifications (Checked by default) */}
                <label className="flex items-center gap-1.5 text-xs text-emerald-900 font-semibold cursor-pointer select-none bg-emerald-50/90 px-2.5 py-1 rounded-lg border border-emerald-200">
                  <input
                    type="checkbox"
                    checked={suppressEmailNotifications}
                    onChange={(e) => setSuppressEmailNotifications(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                  />
                  <span className="flex items-center gap-1">
                    <BellOff size={13} className="text-emerald-700" />
                    <span>ไม่ส่งอีเมลแจ้งเตือน</span>
                  </span>
                </label>
              </div>
            </div>

            {/* Notification Information Banner */}
            {suppressEmailNotifications && (
              <div className="mb-2.5 flex items-center gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-600">
                <BellOff size={14} className="text-slate-500 shrink-0" />
                <span>
                  <strong>การแจ้งเตือน:</strong> ไม่มีการส่งอีเมลแจ้งเตือนสำหรับการนำเข้าจากไฟล์ Excel (ข้อมูลจะถูกบันทึกและแสดงในปฏิทินทันที)
                </span>
              </div>
            )}

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => {
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                  fileInputRef.current.click();
                }
              }}
              className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition cursor-pointer relative ${
                selectedFile
                  ? 'border-emerald-500 bg-emerald-50/40'
                  : 'border-gray-300 hover:border-emerald-500 hover:bg-gray-50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx, .xls, .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileChange(e.target.files[0]);
                  }
                }}
              />

              <div className="flex flex-col items-center justify-center gap-2">
                <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-2xs">
                  <UploadCloud size={24} />
                </div>
                {selectedFile ? (
                  <div className="space-y-1">
                    <span className="font-bold text-sm text-gray-900 block">{selectedFile.name}</span>
                    <span className="text-xs text-gray-500 block">
                      ขนาด: {(selectedFile.size / 1024).toFixed(1)} KB
                    </span>
                    <div className="pt-2 flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={handleResetFile}
                        className="inline-flex items-center gap-1 px-3 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold transition cursor-pointer"
                      >
                        <Trash2 size={12} />
                        <span>ล้างไฟล์ / เลือกไฟล์ใหม่</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-gray-800 block">
                      ลากไฟล์มาวางที่นี่ หรือคลิกเพื่อเปิดหาไฟล์
                    </span>
                    <span className="text-xs text-gray-500">
                      รองรับไฟล์ .xlsx, .xls และ .csv (UTF-8)
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Loading Indicator */}
          {isProcessing && (
            <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex items-center justify-center gap-2.5 text-xs font-bold text-gray-600 animate-pulse">
              <RefreshCw size={16} className="animate-spin text-emerald-600" />
              <span>กำลังอ่านและตรวจสอบความถูกต้องของข้อมูลในไฟล์...</span>
            </div>
          )}

          {/* Parsing Error Callout */}
          {parseError && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs sm:text-sm text-red-700 flex items-start gap-2.5 animate-fade-in">
              <AlertCircle size={18} className="text-red-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">เกิดข้อผิดพลาดในการอ่านไฟล์</span>
                <span>{parseError}</span>
              </div>
            </div>
          )}

          {/* Validation Result & Preview */}
          {validationResult && (
            <div className="space-y-3 animate-fade-in">
              {/* Summary Badges */}
              <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
                <div
                  onClick={() => setActiveFilter('all')}
                  className={`p-3 rounded-2xl border transition cursor-pointer text-center ${
                    activeFilter === 'all'
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <span className="text-[11px] font-bold block opacity-80">ทั้งหมดในไฟล์</span>
                  <span className="text-lg font-black">{validationResult.totalRows} แถว</span>
                </div>

                <div
                  onClick={() => setActiveFilter('valid')}
                  className={`p-3 rounded-2xl border transition cursor-pointer text-center ${
                    activeFilter === 'valid'
                      ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
                  }`}
                >
                  <span className="text-[11px] font-bold block opacity-80">พร้อมนำเข้า</span>
                  <span className="text-lg font-black">{validationResult.validCount} รายการ</span>
                </div>

                <div
                  onClick={() => setActiveFilter('invalid')}
                  className={`p-3 rounded-2xl border transition cursor-pointer text-center ${
                    activeFilter === 'invalid'
                      ? 'bg-red-700 text-white border-red-700 shadow-xs'
                      : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                  }`}
                >
                  <span className="text-[11px] font-bold block opacity-80">มีข้อผิดพลาด (ข้าม)</span>
                  <span className="text-lg font-black">{validationResult.errorCount} แถว</span>
                </div>
              </div>

              {/* Warning note if there are invalid rows */}
              {validationResult.errorCount > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-start gap-2">
                  <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
                  <span>
                    พบข้อมูล {validationResult.errorCount} แถวที่ไม่ผ่านเกณฑ์ (เช่น จองย้อนหลัง, เวลาทับซ้อน, หรือระบุห้องไม่ตรง)
                    ระบบจะนำเข้าเฉพาะรายการที่ถูกต้องจำนวน{' '}
                    <strong>{validationResult.validCount}</strong> รายการเท่านั้น
                  </span>
                </div>
              )}

              {/* Preview Table */}
              <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-2xs">
                <div className="bg-gray-50/90 px-3.5 py-2 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-gray-600 font-bold">
                  <span>ตัวอย่างข้อมูล ({filteredRows.length} รายการ)</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="ค้นหาในตาราง..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-2.5 py-1 bg-white border border-gray-300 rounded-lg text-xs font-normal focus:outline-emerald-500"
                    />
                  </div>
                </div>

                <div className="max-h-60 overflow-y-auto custom-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-gray-100 text-gray-700 font-bold sticky top-0 border-b border-gray-200">
                      <tr>
                        <th className="p-2.5 text-center w-12">แถว</th>
                        <th className="p-2.5">หัวข้อการประชุม</th>
                        <th className="p-2.5">ห้องประชุม</th>
                        <th className="p-2.5">ผู้ขอจอง</th>
                        <th className="p-2.5">วันและเวลา</th>
                        <th className="p-2.5 text-center w-36">สถานะ</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 bg-white">
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-gray-400">
                            ไม่พบรายการตามตัวกรองหรือคำค้นหาที่เลือก
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map((r) => (
                          <tr
                            key={r.rowIndex}
                            className={`hover:bg-gray-50/80 transition ${
                              !r.isValid ? 'bg-red-50/40' : ''
                            }`}
                          >
                            <td className="p-2.5 text-center font-mono font-bold text-gray-500">
                              {r.rowIndex}
                            </td>
                            <td className="p-2.5 font-bold text-gray-900 max-w-[180px] truncate" title={r.raw.topic}>
                              {r.raw.topic || <span className="text-red-400 italic">ไม่ระบุ</span>}
                            </td>
                            <td className="p-2.5 text-gray-700 max-w-[140px] truncate" title={r.raw.roomStr}>
                              {r.raw.roomStr || <span className="text-red-400 italic">ไม่ระบุ</span>}
                            </td>
                            <td className="p-2.5 text-gray-700 max-w-[120px] truncate">
                              {r.raw.requesterName || '-'}
                            </td>
                            <td className="p-2.5 text-gray-700 whitespace-nowrap">
                              <div>{r.raw.startDate}</div>
                              <div className="text-[11px] text-gray-500">
                                {r.raw.startTime} - {r.raw.endTime} น.
                              </div>
                            </td>
                            <td className="p-2.5 text-center">
                              {r.isValid ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                                  <CheckCircle2 size={11} /> พร้อมนำเข้า
                                </span>
                              ) : (
                                <div className="space-y-0.5 text-left">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-100 text-red-800 border border-red-300">
                                    <AlertCircle size={11} /> ไม่ผ่าน
                                  </span>
                                  <div className="text-[10px] text-red-600 font-medium leading-tight">
                                    {r.errors.join(', ')}
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            disabled={isImporting}
            className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-xs sm:text-sm border border-gray-300 transition cursor-pointer"
          >
            ยกเลิก
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleConfirm}
              disabled={
                isImporting ||
                !validationResult ||
                validationResult.validCount === 0
              }
              className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition shadow-xs ${
                validationResult && validationResult.validCount > 0 && !isImporting
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
                  : 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed'
              }`}
            >
              {isImporting ? (
                <>
                  <RefreshCw size={14} className="animate-spin" />
                  <span>กำลังบันทึกข้อมูล...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={15} />
                  <span>
                    ยืนยันนำเข้า ({validationResult?.validCount || 0} รายการ)
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

