import React, { useState, useRef } from 'react';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  FileJson,
  Layers,
  ArrowRight,
  ShieldAlert,
  Info,
  Clock,
  Sparkles,
  Archive,
  Check
} from 'lucide-react';
import {
  DatabaseBackupPackage,
  exportFirestoreDatabaseBackup,
  downloadBackupPackageAsJson,
  restoreFirestoreDatabaseBackup,
  RestoreProgress
} from '../lib/firestoreBackupService';

interface DatabaseBackupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRestoreComplete?: () => void;
}

export const DatabaseBackupModal: React.FC<DatabaseBackupModalProps> = ({
  isOpen,
  onClose,
  onRestoreComplete
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'export' | 'import'>('export');

  // Export States
  const [isExporting, setIsExporting] = useState(false);
  const [exportedData, setExportedData] = useState<DatabaseBackupPackage | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Import / Restore States
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedPackage, setParsedPackage] = useState<DatabaseBackupPackage | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState<RestoreProgress | null>(null);
  const [restoreSuccessResult, setRestoreSuccessResult] = useState<{
    totalRestored: number;
    message: string;
  } | null>(null);

  if (!isOpen) return null;

  // Handle Export Click
  const handleStartExport = async () => {
    setIsExporting(true);
    setExportError(null);
    setExportedData(null);
    try {
      const backup = await exportFirestoreDatabaseBackup();
      setExportedData(backup);
      // Automatically download file
      downloadBackupPackageAsJson(backup);
    } catch (err: any) {
      console.error('Export backup failed:', err);
      setExportError(err?.message || 'เกิดข้อผิดพลาดในการดึงข้อมูลจาก Firestore');
    } finally {
      setIsExporting(false);
    }
  };

  // Handle File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setParseError(null);
    setParsedPackage(null);
    setRestoreSuccessResult(null);

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (!file.name.toLowerCase().endsWith('.json')) {
      setParseError('กรุณาเลือกไฟล์สำรองข้อมูลนามสกุล .json เท่านั้น');
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text) as DatabaseBackupPackage;

        if (!parsed || !parsed.collections || typeof parsed.collections !== 'object') {
          throw new Error('โครงสร้างไฟล์ JSON ไม่ตรงกับรูปแบบสำรองข้อมูลของระบบ (ไม่พบ collections)');
        }

        setParsedPackage(parsed);
      } catch (err: any) {
        setParseError(`ไม่สามารถอ่านไฟล์ JSON ได้: ${err?.message || 'รูปแบบไฟล์ไม่ถูกต้อง'}`);
        setParsedPackage(null);
      }
    };
    reader.onerror = () => {
      setParseError('เกิดข้อผิดพลาดในการอ่านไฟล์จากเครื่องของคุณ');
    };
    reader.readAsText(file);
  };

  // Handle Restore Execution
  const handleExecuteRestore = async () => {
    if (!parsedPackage) return;

    const confirmMsg = `ยืนยันการนำเข้าข้อมูลกู้คืนทั้งหมดลง Firebase ใช่หรือไม่?\n\nข้อมูลในไฟล์สำรองมีทั้งหมด ${parsedPackage.metadata.totalDocuments.toLocaleString()} รายการ\nการกู้คืนจะอัปเดต/บันทึกลง Database ของ Firebase ทันที`;
    if (!window.confirm(confirmMsg)) return;

    setIsRestoring(true);
    setParseError(null);
    setRestoreSuccessResult(null);

    try {
      const result = await restoreFirestoreDatabaseBackup(parsedPackage, (progress) => {
        setRestoreProgress(progress);
      });

      setRestoreSuccessResult({
        totalRestored: result.totalRestored,
        message: result.message
      });

      if (onRestoreComplete) {
        onRestoreComplete();
      }
    } catch (err: any) {
      console.error('Restore failed:', err);
      setParseError(err?.message || 'เกิดข้อผิดพลาดในการนำเข้าข้อมูลลง Firestore');
    } finally {
      setIsRestoring(false);
    }
  };

  const collectionLabels: Record<string, string> = {
    rooms: 'rooms (ห้องประชุม)',
    bookings: 'bookings (รายการจอง)',
    users: 'users (ผู้ใช้งานและสิทธิ์)',
    departments: 'departments (ฝ่าย/หน่วยงาน)',
    auditLogs: 'auditLogs (ประวัติการใช้งาน)',
    emailNotifications: 'emailNotifications (แจ้งเตือนอีเมล)',
    mail: 'mail (คิวอีเมลระบบ)',
    userNotificationStates: 'userNotificationStates (สถานะการอ่าน)'
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isRestoring && !isExporting) {
          onClose();
        }
      }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl border-t-4 border-[#C8102E] my-auto max-h-[92dvh] flex flex-col overflow-hidden animate-fade-in">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 bg-linear-to-r from-slate-900 via-slate-800 to-gray-900 text-white flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-red-500/20 border border-red-500/30 text-red-400 rounded-2xl">
              <Database size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black text-white">
                  สำรองและกู้คืนฐานข้อมูล (Backup & Restore)
                </h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-red-600/80 text-white uppercase tracking-wider">
                  Super Admin
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                ย้ายหรือสำรองข้อมูลครบทั้ง 8 Collections ของ Firebase ได้ง่ายๆ ด้วยไฟล์ JSON
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={isRestoring || isExporting}
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition disabled:opacity-30"
          >
            ✕
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-5 pt-3 gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab('export')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition ${
              activeSubTab === 'export'
                ? 'border-[#C8102E] text-[#C8102E] bg-white rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Download size={16} />
            <span>1. ส่งออกข้อมูล (Backup to JSON)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubTab('import')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-bold border-b-2 transition ${
              activeSubTab === 'import'
                ? 'border-[#C8102E] text-[#C8102E] bg-white rounded-t-xl'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            <Upload size={16} />
            <span>2. กู้คืน / นำเข้าข้อมูล (Restore from JSON)</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar flex-1 space-y-4">
          {/* ==================================================== */}
          {/* TAB 1: EXPORT (BACKUP) */}
          {/* ==================================================== */}
          {activeSubTab === 'export' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 text-xs text-amber-900 flex items-start gap-2.5">
                <Info size={18} className="text-amber-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold block">คำแนะนำในการเปลี่ยน Environment Variables:</span>
                  <span>
                    ก่อนจะเปลี่ยนค่าตัวแปรใน Firebase ให้กดปุ่ม <b>"ดาวน์โหลดไฟล์สำรองข้อมูล (JSON)"</b> ด้านล่างนี้เพื่อเก็บไฟล์สำรองไว้ในเครื่องก่อน จากนั้นเมื่อเปลี่ยนตัวแปร Firebase ใหม่เรียบร้อยแล้ว ให้เปิดแท็บ <b>"กู้คืน / นำเข้าข้อมูล"</b> เพื่อโหลดไฟล์นี้ขึ้นไปใส่ใน Firebase ตัวใหม่ได้ทันที
                  </span>
                </div>
              </div>

              {/* Collections Covered */}
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4">
                <div className="text-xs font-bold text-gray-700 mb-2.5 flex items-center gap-1.5">
                  <Layers size={15} className="text-gray-500" />
                  <span>Collections ที่จะถูกสำรองทั้งหมด (8 Collections):</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {Object.entries(collectionLabels).map(([key, label]) => (
                    <div
                      key={key}
                      className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-gray-200 text-gray-700 font-mono text-[11px]"
                    >
                      <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                      <span className="truncate">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {exportError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-xs text-red-800 flex items-start gap-2">
                  <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <span>{exportError}</span>
                </div>
              )}

              {exportedData && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 space-y-2">
                  <div className="flex items-center gap-2 font-bold text-emerald-800">
                    <Check size={18} className="text-emerald-600" />
                    <span>ดึงข้อมูลและเริ่มดาวน์โหลดไฟล์เรียบร้อยแล้ว!</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-slate-700">
                    <div className="bg-white p-2 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-gray-400 block">เอกสารรวม</span>
                      <span className="font-bold text-sm text-gray-900">
                        {exportedData.metadata.totalDocuments.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-gray-400 block">ห้องประชุม</span>
                      <span className="font-bold text-sm text-gray-900">
                        {exportedData.metadata.roomsCount}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-gray-400 block">รายการจอง</span>
                      <span className="font-bold text-sm text-gray-900">
                        {exportedData.metadata.bookingsCount}
                      </span>
                    </div>
                    <div className="bg-white p-2 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-gray-400 block">ผู้ใช้งาน</span>
                      <span className="font-bold text-sm text-gray-900">
                        {exportedData.metadata.usersCount}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={isExporting}
                  onClick={handleStartExport}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-[#C8102E] hover:bg-[#a60d26] text-white font-bold text-sm shadow-md transition disabled:opacity-50"
                >
                  {isExporting ? (
                    <>
                      <RefreshCw size={17} className="animate-spin" />
                      <span>กำลังดึงข้อมูลจาก Cloud Firestore...</span>
                    </>
                  ) : (
                    <>
                      <Download size={18} />
                      <span>สำรองและดาวน์โหลดไฟล์ JSON (Backup Database)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: IMPORT / RESTORE */}
          {/* ==================================================== */}
          {activeSubTab === 'import' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 text-xs text-blue-900 flex items-start gap-2.5">
                <Info size={18} className="text-blue-600 shrink-0 mt-0.5" />
                <div className="leading-relaxed">
                  <span className="font-bold block">วิธีนำเข้าข้อมูลสู่ Firebase ตัวใหม่:</span>
                  <span>
                    เมื่อเปลี่ยน Environment Variables แล้ว ให้เลือกไฟล์สำรองข้อมูล JSON ที่เคยดาวน์โหลดไว้ จากนั้นกดยืนยัน ระบบจะเขียนข้อมูลคืนเข้าสู่ Cloud Firestore ให้อัตโนมัติทันที
                  </span>
                </div>
              </div>

              {/* File Upload Dropzone */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-300 hover:border-[#C8102E] rounded-3xl p-6 text-center cursor-pointer transition bg-gray-50/60 hover:bg-red-50/20"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".json"
                  className="hidden"
                />
                <div className="w-12 h-12 mx-auto rounded-full bg-red-100 text-[#C8102E] flex items-center justify-center mb-3">
                  <FileJson size={26} />
                </div>
                <div className="text-sm font-bold text-gray-800">
                  {selectedFile ? selectedFile.name : 'คลิกเพื่อเลือกไฟล์สำรองข้อมูล (.json)'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  รองรับไฟล์ JSON ที่ได้จากการสำรองข้อมูลของระบบนี้
                </div>
              </div>

              {parseError && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-3 text-xs text-red-800 flex items-start gap-2">
                  <AlertTriangle size={16} className="text-red-600 shrink-0 mt-0.5" />
                  <span>{parseError}</span>
                </div>
              )}

              {/* Parsed Package Preview */}
              {parsedPackage && (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <Archive size={15} className="text-indigo-600" />
                      <span>สรุปข้อมูลที่จะกู้คืนจากไฟล์</span>
                    </span>
                    <span className="text-[11px] text-gray-500">
                      สำรองเมื่อ: {new Date(parsedPackage.exportedAt).toLocaleString('th-TH')}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200 text-center">
                      <span className="text-[10px] text-gray-400 block">เอกสารรวม</span>
                      <span className="font-extrabold text-sm text-indigo-600">
                        {parsedPackage.metadata.totalDocuments.toLocaleString()}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200 text-center">
                      <span className="text-[10px] text-gray-400 block">ห้องประชุม</span>
                      <span className="font-bold text-sm text-gray-800">
                        {parsedPackage.metadata.roomsCount}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200 text-center">
                      <span className="text-[10px] text-gray-400 block">รายการจอง</span>
                      <span className="font-bold text-sm text-gray-800">
                        {parsedPackage.metadata.bookingsCount}
                      </span>
                    </div>
                    <div className="bg-white p-2.5 rounded-xl border border-gray-200 text-center">
                      <span className="text-[10px] text-gray-400 block">ผู้ใช้งาน</span>
                      <span className="font-bold text-sm text-gray-800">
                        {parsedPackage.metadata.usersCount}
                      </span>
                    </div>
                  </div>

                  {/* Collections mini list */}
                  <div className="text-[11px] text-gray-500 flex flex-wrap gap-x-3 gap-y-1 pt-1">
                    <span>ฝ่าย/หน่วยงาน: {parsedPackage.metadata.departmentsCount}</span>
                    <span>•</span>
                    <span>Audit Logs: {parsedPackage.metadata.auditLogsCount}</span>
                    <span>•</span>
                    <span>อีเมลแจ้งเตือน: {parsedPackage.metadata.emailNotificationsCount}</span>
                  </div>
                </div>
              )}

              {/* Progress Indicator */}
              {isRestoring && restoreProgress && (
                <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-indigo-900">
                    <span className="flex items-center gap-1.5">
                      <RefreshCw size={14} className="animate-spin text-indigo-600" />
                      <span>กำลังเขียนข้อมูลลง Firestore: {restoreProgress.currentCollection}</span>
                    </span>
                    <span>{restoreProgress.percentage}%</span>
                  </div>
                  <div className="w-full bg-indigo-200 rounded-full h-2.5 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-2.5 rounded-full transition-all duration-300"
                      style={{ width: `${restoreProgress.percentage}%` }}
                    />
                  </div>
                  <div className="text-[11px] text-indigo-700 text-right">
                    เสร็จสิ้น {restoreProgress.completedDocs} จาก {restoreProgress.totalDocs} เอกสาร
                  </div>
                </div>
              )}

              {/* Success Result */}
              {restoreSuccessResult && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-xs text-emerald-900 flex items-start gap-2.5">
                  <CheckCircle2 size={20} className="text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-sm">กู้คืนข้อมูลสำเร็จเรียบร้อยแล้ว!</span>
                    <span className="text-emerald-800">
                      ข้อมูลทั้งหมด {restoreSuccessResult.totalRestored.toLocaleString()} รายการถูกนำเข้าสู่ Cloud Firestore เรียบร้อยแล้ว ระบบจะซิงค์ข้อมูลบนหน้าจอให้อัตโนมัติ
                    </span>
                  </div>
                </div>
              )}

              {/* Action Button */}
              <div className="pt-2">
                <button
                  type="button"
                  disabled={!parsedPackage || isRestoring}
                  onClick={handleExecuteRestore}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isRestoring ? (
                    <>
                      <RefreshCw size={17} className="animate-spin" />
                      <span>กำลังนำเข้าข้อมูลลง Cloud Firestore...</span>
                    </>
                  ) : (
                    <>
                      <Upload size={18} />
                      <span>เริ่มกู้คืนข้อมูลลง Firebase (Restore Now)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
          <div className="text-[11px] text-gray-500 flex items-center gap-1.5">
            <ShieldAlert size={14} className="text-amber-500" />
            <span>สงวนสิทธิ์เฉพาะ Super Admin ในการจัดการฐานข้อมูล</span>
          </div>
          <button
            type="button"
            disabled={isRestoring || isExporting}
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition disabled:opacity-30"
          >
            ปิดหน้าต่าง
          </button>
        </div>
      </div>
    </div>
  );
};
