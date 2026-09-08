import * as XLSX from 'xlsx';
import { Booking, Room } from '../types';
import { checkBookingOverlap } from './thaiDate';
import { formatThaiPhone } from './phoneUtils';

export interface ParsedImportRow {
  rowIndex: number;
  raw: Record<string, any>;
  isValid: boolean;
  errors: string[];
  booking?: Partial<Booking>;
}

export interface ImportValidationResult {
  totalRows: number;
  validCount: number;
  errorCount: number;
  rows: ParsedImportRow[];
  readyBookings: Booking[];
}

export interface ImportValidationOptions {
  disallowPastBookings?: boolean;
}

/**
 * Thai month mappings for parsing Thai date strings
 */
const THAI_MONTH_MAP: Record<string, string> = {
  'ม.ค.': '01',
  'มกราคม': '01',
  'ก.พ.': '02',
  'กุมภาพันธ์': '02',
  'มี.ค.': '03',
  'มีนาคม': '03',
  'เม.ย.': '04',
  'เมษายน': '04',
  'พ.ค.': '05',
  'พฤษภาคม': '05',
  'มิ.ย.': '06',
  'มิถุนายน': '06',
  'ก.ค.': '07',
  'กรกฎาคม': '07',
  'ส.ค.': '08',
  'สิงหาคม': '08',
  'ก.ย.': '09',
  'กันยายน': '09',
  'ต.ค.': '10',
  'ตุลาคม': '10',
  'พ.ย.': '11',
  'พฤศจิกายน': '11',
  'ธ.ค.': '12',
  'ธันวาคม': '12',
  'jan': '01',
  'feb': '02',
  'mar': '03',
  'apr': '04',
  'may': '05',
  'jun': '06',
  'jul': '07',
  'aug': '08',
  'sep': '09',
  'oct': '10',
  'nov': '11',
  'dec': '12'
};

/**
 * Normalizes Thai date strings such as "15/09/2569", "2026-09-15", "15 ก.ย. 2569", or Excel serial date
 */
export const parseExcelDate = (val: any): string | null => {
  if (val === null || val === undefined || val === '') return null;

  // 1. If val is a Date object (SheetJS with cellDates: true)
  if (val instanceof Date && !isNaN(val.getTime())) {
    const y = val.getFullYear();
    const m = String(val.getMonth() + 1).padStart(2, '0');
    const d = String(val.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  // 2. If val is a number (Excel Serial Date code, e.g. 45678)
  if (typeof val === 'number' && val > 1000 && val < 100000) {
    try {
      // Excel serial date to JavaScript Date: days since 1899-12-30
      const date = new Date(Math.round((val - 25569) * 86400 * 1000));
      if (!isNaN(date.getTime())) {
        const y = date.getUTCFullYear();
        const m = String(date.getUTCMonth() + 1).padStart(2, '0');
        const d = String(date.getUTCDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    } catch {
      // ignore
    }
  }

  const str = String(val).trim();
  if (!str) return null;

  // Pattern YYYY-MM-DD
  const isoMatch = str.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})$/);
  if (isoMatch) {
    let year = parseInt(isoMatch[1], 10);
    // Convert Thai Buddhist Era if year > 2400
    if (year > 2400) year -= 543;
    const month = String(parseInt(isoMatch[2], 10)).padStart(2, '0');
    const day = String(parseInt(isoMatch[3], 10)).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Pattern DD/MM/YYYY or D/M/YYYY
  const dmyMatch = str.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{2,4})$/);
  if (dmyMatch) {
    let year = parseInt(dmyMatch[3], 10);
    if (year < 100) {
      // 2-digit year (e.g. 69 -> 2569 -> 2026, or 26 -> 2026)
      if (year >= 50) year += 2500 - 543;
      else year += 2000;
    } else if (year > 2400) {
      year -= 543;
    }
    const month = String(parseInt(dmyMatch[2], 10)).padStart(2, '0');
    const day = String(parseInt(dmyMatch[1], 10)).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Pattern with Thai Month name, e.g. "15 ก.ย. 2569", "15 กันยายน 2569"
  for (const [thMonth, mNum] of Object.entries(THAI_MONTH_MAP)) {
    if (str.includes(thMonth)) {
      const parts = str.split(/[\s,.-]+/);
      const dayCandidate = parts.find((p) => /^\d{1,2}$/.test(p));
      const yearCandidate = parts.find((p) => /^\d{2,4}$/.test(p) && p !== dayCandidate);
      if (dayCandidate && yearCandidate) {
        let year = parseInt(yearCandidate, 10);
        if (year < 100) {
          if (year >= 50) year += 2500 - 543;
          else year += 2000;
        } else if (year > 2400) {
          year -= 543;
        }
        const day = String(parseInt(dayCandidate, 10)).padStart(2, '0');
        return `${year}-${mNum}-${day}`;
      }
    }
  }

  // Fallback: try parsing standard Date string
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    let year = parsed.getFullYear();
    if (year > 2400) year -= 543;
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    const d = String(parsed.getDate()).padStart(2, '0');
    return `${year}-${m}-${d}`;
  }

  return null;
};

/**
 * Normalizes time strings e.g. "09:00", "9:00", "09.30", "9.30", "09:00:00", or Excel fractional day number (e.g. 0.375)
 */
export const parseExcelTime = (val: any): string | null => {
  if (val === null || val === undefined || val === '') return null;

  // 1. If val is a Date object (SheetJS)
  if (val instanceof Date && !isNaN(val.getTime())) {
    const h = String(val.getHours()).padStart(2, '0');
    const m = String(val.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
  }

  // 2. If val is an Excel fractional day number (e.g. 0.375 = 09:00, 0.5 = 12:00)
  if (typeof val === 'number') {
    if (val >= 0 && val < 1) {
      const totalSeconds = Math.round(val * 86400);
      const h = Math.floor(totalSeconds / 3600);
      const m = Math.floor((totalSeconds % 3600) / 60);
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
    // If entered as integer e.g. 900 (09:00) or 1330 (13:30)
    if (val >= 100 && val <= 2400) {
      const h = Math.floor(val / 100);
      const m = val % 100;
      if (h < 24 && m < 60) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
    }
  }

  let str = String(val).trim();
  // Strip formula wrapper if exported as `="09:00"`
  str = str.replace(/^="?|"?$/g, '');
  str = str.replace(/\s*น\.?$/i, ''); // Strip trailing 'น.'

  // Replace dot with colon for Thai time e.g. "09.30" -> "09:30"
  if (str.includes('.') && !str.includes(':')) {
    str = str.replace('.', ':');
  }

  const match = str.match(/^(\d{1,2}):(\d{2})(?::\d{2})?$/);
  if (match) {
    const h = parseInt(match[1], 10);
    const m = parseInt(match[2], 10);
    if (h >= 0 && h < 24 && m >= 0 && m < 60) {
      return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }
  }

  return null;
};

/**
 * Helper to safely save a Blob to a file in browser/iframe environments
 */
const saveBlobToFile = (blob: Blob, filename: string) => {
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }, 1000);
};

/**
 * Download standard Excel Template (.xlsx) for importing bookings
 */
export const downloadBookingTemplate = (rooms: Room[]) => {
  const wb = XLSX.utils.book_new();

  // 1. Template Headers and Sample Rows
  const headers = [
    'หัวข้อการประชุม',
    'ห้องประชุม',
    'ชื่อ-นามสกุล ผู้ขอจอง',
    'ฝ่าย/กลุ่มงาน',
    'เบอร์โทรศัพท์',
    'อีเมล',
    'หน่วยงานภายนอก/สถาบันเข้าร่วม',
    'วันที่เริ่มต้น (YYYY-MM-DD)',
    'วันที่สิ้นสุด (YYYY-MM-DD)',
    'เวลาเริ่มต้น (HH:mm)',
    'เวลาสิ้นสุด (HH:mm)',
    'จำนวนผู้เข้าร่วม (คน)',
    'อาหารว่าง (ชุด)',
    'อาหารกลางวัน (กล่อง/ชุด)',
    'เครื่องดื่ม (แก้ว/ขวด)',
    'อุปกรณ์ที่ขอใช้',
    'รูปแบบการจัดโต๊ะ',
    'รูปแบบการประชุม (Onsite/Online)',
    'หมายเหตุ/รายละเอียดเพิ่มเติม'
  ];

  // Prepare dates in the future for sample data
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const sampleYear = tomorrow.getFullYear();
  const sampleMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const sampleDay = String(tomorrow.getDate()).padStart(2, '0');
  const sampleDateStr = `${sampleYear}-${sampleMonth}-${sampleDay}`;

  const defaultRoom1 = rooms[0]?.name || 'ห้องประชุม 1 อาคารเฉลิมพระเกียรติฯ ชั้น 2';
  const defaultRoom2 = rooms[1]?.name || 'ห้องประชุม 2 อาคารเฉลิมพระเกียรติฯ ชั้น 2';

  const sampleRows = [
    [
      'การประชุมวางแผนงานยุทธศาสตร์ประจำปี 2570',
      defaultRoom1,
      'นายกิตติศักดิ์ ศรีวิชัย',
      'ฝ่ายบริหารงานทั่วไป',
      '02-256-4214',
      'kitti.s@qsmi.or.th',
      '',
      sampleDateStr,
      sampleDateStr,
      '09:00',
      '12:00',
      25,
      25,
      0,
      25,
      'LCD Projector, Computer / Notebook',
      'แบบห้องเรียน (Classroom)',
      'Onsite',
      'ขอความอนุเคราะห์เปิดเครื่องปรับอากาศก่อนเวลา 15 นาที'
    ],
    [
      'อบรมเชิงปฏิบัติการการใช้ระบบเทคโนโลยีสารสนเทศ',
      defaultRoom2,
      'นางสาวกาญจนา มณีรัตน์',
      'ศูนย์สารสนเทศและเทคโนโลยี',
      '089-123-4567',
      'kanjana.m@qsmi.or.th',
      'สำนักงานสารสนเทศสภากาชาดไทย',
      sampleDateStr,
      sampleDateStr,
      '13:30',
      '16:30',
      15,
      15,
      15,
      15,
      'LCD Projector, Computer / Notebook, ถ่ายภาพ',
      'แบบตัวยู (U-Shape)',
      'Onsite',
      'มีวิทยากรภายนอกเข้าร่วม'
    ]
  ];

  const wsData = [headers, ...sampleRows];
  const ws = XLSX.utils.aoa_to_sheet(wsData);

  // Set column widths for readability
  ws['!cols'] = [
    { wch: 35 }, // หัวข้อ
    { wch: 34 }, // ห้องประชุม
    { wch: 22 }, // ผู้จอง
    { wch: 22 }, // ฝ่าย
    { wch: 15 }, // เบอร์โทร
    { wch: 24 }, // อีเมล
    { wch: 25 }, // หน่วยงานภายนอก
    { wch: 24 }, // วันที่เริ่มต้น
    { wch: 24 }, // วันที่สิ้นสุด
    { wch: 18 }, // เวลาเริ่มต้น
    { wch: 18 }, // เวลาสิ้นสุด
    { wch: 18 }, // ผู้เข้าร่วม
    { wch: 14 }, // อาหารว่าง
    { wch: 18 }, // อาหารกลางวัน
    { wch: 18 }, // เครื่องดื่ม
    { wch: 30 }, // อุปกรณ์
    { wch: 22 }, // รูปแบบโต๊ะ
    { wch: 24 }, // รูปแบบการประชุม
    { wch: 35 }  // หมายเหตุ
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'ข้อมูลการจอง (Template)');

  // 2. Guide Sheet: Available Rooms in System
  const guideHeaders = ['รหัสห้อง', 'ชื่อห้องประชุมในระบบ', 'สถานที่ตั้ง/อาคาร', 'ความจุ (คน)', 'สถานะห้อง'];
  const roomRows = rooms.map((r) => [
    r.id,
    r.name,
    r.location || '-',
    r.capacity || '-',
    r.isActive ? 'เปิดใช้งานปกติ' : 'ปิดปรับปรุง'
  ]);

  const guideWsData = [
    ['รายชื่อห้องประชุมที่เปิดใช้งานในระบบสถานเสาวภา (โปรดคัดลอกชื่อห้องไปใส่ในคอลัมน์ "ห้องประชุม")'],
    [],
    guideHeaders,
    ...roomRows,
    [],
    ['คำแนะนำการกรอกข้อมูล:'],
    ['1. คอลัมน์ที่จำเป็น: หัวข้อการประชุม, ห้องประชุม, ชื่อ-นามสกุล ผู้ขอจอง, วันที่เริ่มต้น, วันที่สิ้นสุด, เวลาเริ่มต้น, เวลาสิ้นสุด'],
    ['2. รูปแบบวันที่แนะนำ: YYYY-MM-DD เช่น 2026-09-15 หรือ DD/MM/YYYY เช่น 15/09/2026'],
    ['3. รูปแบบเวลา: HH:mm เช่น 09:00, 13:30 (ต้องไม่จองเวลาย้อนหลัง และเวลาสิ้นสุดต้องมากกว่าเวลาเริ่มต้น)'],
    ['4. ระบบจะตรวจสอบความถูกต้องและเวลาทับซ้อนกับรายการจองเดิมในระบบให้อัตโนมัติก่อนบันทึกจริง']
  ];

  const guideWs = XLSX.utils.aoa_to_sheet(guideWsData);
  guideWs['!cols'] = [{ wch: 15 }, { wch: 38 }, { wch: 28 }, { wch: 14 }, { wch: 18 }];
  XLSX.utils.book_append_sheet(wb, guideWs, 'รายชื่อห้องประชุม (Rooms Reference)');

  // Generate binary output and save using native Blob (works 100% reliably in browser & iframe)
  const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
  const blob = new Blob([wbout], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8'
  });
  saveBlobToFile(blob, 'meeting_room_booking_template.xlsx');
};

/**
 * Download CSV Template (.csv) with UTF-8 BOM so Excel opens Thai characters seamlessly
 */
export const downloadBookingCsvTemplate = (rooms: Room[]) => {
  const headers = [
    'หัวข้อการประชุม',
    'ห้องประชุม',
    'ชื่อ-นามสกุล ผู้ขอจอง',
    'ฝ่าย/กลุ่มงาน',
    'เบอร์โทรศัพท์',
    'อีเมล',
    'หน่วยงานภายนอก/สถาบันเข้าร่วม',
    'วันที่เริ่มต้น (YYYY-MM-DD)',
    'วันที่สิ้นสุด (YYYY-MM-DD)',
    'เวลาเริ่มต้น (HH:mm)',
    'เวลาสิ้นสุด (HH:mm)',
    'จำนวนผู้เข้าร่วม (คน)',
    'อาหารว่าง (ชุด)',
    'อาหารกลางวัน (กล่อง/ชุด)',
    'เครื่องดื่ม (แก้ว/ขวด)',
    'อุปกรณ์ที่ขอใช้',
    'รูปแบบการจัดโต๊ะ',
    'รูปแบบการประชุม (Onsite/Online)',
    'หมายเหตุ/รายละเอียดเพิ่มเติม'
  ];

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const sampleYear = tomorrow.getFullYear();
  const sampleMonth = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const sampleDay = String(tomorrow.getDate()).padStart(2, '0');
  const sampleDateStr = `${sampleYear}-${sampleMonth}-${sampleDay}`;

  const defaultRoom1 = rooms[0]?.name || 'ห้องประชุม 1 อาคารเฉลิมพระเกียรติฯ ชั้น 2';
  const defaultRoom2 = rooms[1]?.name || 'ห้องประชุม 2 อาคารเฉลิมพระเกียรติฯ ชั้น 2';

  const sampleRows = [
    [
      'การประชุมวางแผนงานยุทธศาสตร์ประจำปี 2570',
      defaultRoom1,
      'นายกิตติศักดิ์ ศรีวิชัย',
      'ฝ่ายบริหารงานทั่วไป',
      '02-256-4214',
      'kitti.s@qsmi.or.th',
      '',
      sampleDateStr,
      sampleDateStr,
      '09:00',
      '12:00',
      25,
      25,
      0,
      25,
      'LCD Projector, Computer / Notebook',
      'แบบห้องเรียน (Classroom)',
      'Onsite',
      'ขอความอนุเคราะห์เปิดเครื่องปรับอากาศก่อนเวลา 15 นาที'
    ],
    [
      'อบรมเชิงปฏิบัติการการใช้ระบบเทคโนโลยีสารสนเทศ',
      defaultRoom2,
      'นางสาวกาญจนา มณีรัตน์',
      'ศูนย์สารสนเทศและเทคโนโลยี',
      '089-123-4567',
      'kanjana.m@qsmi.or.th',
      'สำนักงานสารสนเทศสภากาชาดไทย',
      sampleDateStr,
      sampleDateStr,
      '13:30',
      '16:30',
      15,
      15,
      15,
      15,
      'LCD Projector, Computer / Notebook, ถ่ายภาพ',
      'แบบตัวยู (U-Shape)',
      'Onsite',
      'มีวิทยากรภายนอกเข้าร่วม'
    ]
  ];

  const ws = XLSX.utils.aoa_to_sheet([headers, ...sampleRows]);
  const csvStr = XLSX.utils.sheet_to_csv(ws);
  // Prepend UTF-8 BOM so Thai characters are properly recognized in Excel
  const blob = new Blob(['\uFEFF' + csvStr], { type: 'text/csv;charset=utf-8;' });
  saveBlobToFile(blob, 'meeting_room_booking_template.csv');
};

/**
 * Smarter room string matching to existing system rooms
 */
export const findMatchingRoom = (roomStr: string, rooms: Room[]): Room | null => {
  if (!roomStr) return null;
  const clean = roomStr.trim().toLowerCase();
  const cleanNoSpace = clean.replace(/[\s\-_]/g, '');

  // 1. Exact ID match
  const byId = rooms.find((r) => r.id.toLowerCase() === clean);
  if (byId) return byId;

  // 2. Exact Name match
  const byExactName = rooms.find((r) => r.name.toLowerCase() === clean);
  if (byExactName) return byExactName;

  // 3. Name match ignoring spaces, dashes, underscores
  const byNoSpace = rooms.find(
    (r) => r.name.toLowerCase().replace(/[\s\-_]/g, '') === cleanNoSpace
  );
  if (byNoSpace) return byNoSpace;

  // 4. Substring / Includes match
  const byIncludes = rooms.find(
    (r) => {
      const rNameNoSpace = r.name.toLowerCase().replace(/[\s\-_]/g, '');
      return rNameNoSpace.includes(cleanNoSpace) || cleanNoSpace.includes(rNameNoSpace);
    }
  );
  if (byIncludes) return byIncludes;

  // 5. Room number check e.g. "ห้อง 1", "ห้อง 2", "ห้องประชุม 1"
  const matchNum = clean.match(/ห้อง(?:ประชุม)?\s*([0-9]+)/) || clean.match(/^([0-9]+)$/);
  if (matchNum) {
    const num = matchNum[1];
    const byNum = rooms.find((r) => r.name.includes(`ห้องประชุม ${num}`) || r.name.includes(`ห้อง ${num}`));
    if (byNum) return byNum;
  }

  return null;
};

/**
 * Parse Excel / CSV File and Validate Rows
 */
export const parseAndValidateImportFile = async (
  file: File,
  rooms: Room[],
  existingBookings: Booking[],
  options: ImportValidationOptions = {}
): Promise<ImportValidationResult> => {
  const disallowPast = options.disallowPastBookings !== false; // default: true
  const buffer = await file.arrayBuffer();

  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(buffer, { type: 'array', cellDates: true });
  } catch (err: any) {
    // If standard read fails (e.g. malformed CSV), try text decode
    try {
      const text = new TextDecoder('utf-8').decode(buffer);
      wb = XLSX.read(text, { type: 'string', cellDates: true });
    } catch {
      throw new Error(`ไม่สามารถอ่านไฟล์ได้ (${err?.message || 'รูปแบบไฟล์ไม่ถูกต้อง'})`);
    }
  }

  const firstSheetName = wb.SheetNames[0];
  if (!firstSheetName) {
    throw new Error('ไม่พบข้อมูล Sheet ในไฟล์ Excel ที่เลือก');
  }

  const ws = wb.Sheets[firstSheetName];
  let rawRows: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' });

  if (!rawRows || rawRows.length < 2) {
    throw new Error('ไฟล์ว่างเปล่าหรือไม่พบแถวข้อมูล (ต้องมีหัวตารางและข้อมูลอย่างน้อย 1 แถว)');
  }

  // Auto-detect CSV semicolon (;) delimiter if sheet was imported as a single column with semicolons
  if (rawRows.length > 1 && rawRows[0].length === 1 && String(rawRows[0][0]).includes(';')) {
    rawRows = rawRows.map((r) => String(r[0] || '').split(';'));
  }

  // Find header row (first row with keywords)
  let headerRowIndex = 0;
  for (let i = 0; i < Math.min(6, rawRows.length); i++) {
    const row = rawRows[i];
    if (
      row.some(
        (cell: any) =>
          String(cell).includes('หัวข้อ') ||
          String(cell).includes('ห้อง') ||
          String(cell).includes('วันที่') ||
          String(cell).toLowerCase().includes('topic')
      )
    ) {
      headerRowIndex = i;
      break;
    }
  }

  const headerCells = rawRows[headerRowIndex].map((c) => String(c).trim());

  // Map header column indices
  const getColIdx = (...keywords: string[]): number => {
    return headerCells.findIndex((h) =>
      keywords.some((kw) => h.toLowerCase().includes(kw.toLowerCase()))
    );
  };

  const colIdx = {
    topic: getColIdx('หัวข้อ', 'topic', 'เรื่อง'),
    room: getColIdx('ห้องประชุม', 'ห้อง', 'room'),
    requesterName: getColIdx('ชื่อ-นามสกุล', 'ผู้ขอจอง', 'ผู้จอง', 'name', 'requester'),
    department: getColIdx('ฝ่าย', 'กลุ่มงาน', 'แผนก', 'department', 'dept'),
    phone: getColIdx('เบอร์', 'โทร', 'phone', 'tel'),
    email: getColIdx('อีเมล', 'email', 'mail'),
    institute: getColIdx('ภายนอก', 'สถาบัน', 'หน่วยงานภายนอก', 'institute'),
    startDate: getColIdx('วันที่เริ่มต้น', 'วันเริ่มต้น', 'start date', 'date start', 'วันที่'),
    endDate: getColIdx('วันที่สิ้นสุด', 'วันสิ้นสุด', 'end date', 'date end'),
    startTime: getColIdx('เวลาเริ่มต้น', 'เริ่มเวลา', 'start time', 'time start', 'เวลาเริ่ม'),
    endTime: getColIdx('เวลาสิ้นสุด', 'สิ้นสุดเวลา', 'end time', 'time end', 'เวลาสิ้นสุด'),
    participants: getColIdx('จำนวนผู้เข้าร่วม', 'ผู้เข้าร่วม', 'participants', 'จำนวนคน'),
    snacks: getColIdx('อาหารว่าง', 'snack', 'เบรก'),
    lunch: getColIdx('อาหารกลางวัน', 'lunch', 'ข้าวกล่อง'),
    drinks: getColIdx('เครื่องดื่ม', 'drink'),
    equipment: getColIdx('อุปกรณ์', 'equipment'),
    seatingSetup: getColIdx('จัดโต๊ะ', 'รูปแบบโต๊ะ', 'seating', 'โต๊ะ'),
    meetingType: getColIdx('รูปแบบการประชุม', 'onsite', 'online', 'type'),
    note: getColIdx('หมายเหตุ', 'รายละเอียดเพิ่มเติม', 'note', 'detail')
  };

  const dataRows = rawRows.slice(headerRowIndex + 1);
  const parsedRows: ParsedImportRow[] = [];
  const validBatchBookings: Booking[] = [];

  const now = new Date();
  const oneMinuteGrace = new Date(now.getTime() - 60 * 1000);

  // Compute next ID counter
  let nextNum =
    existingBookings.reduce((max, b) => {
      if (b.id && b.id.startsWith('MR-')) {
        const n = parseInt(b.id.split('-')[1], 10);
        return !isNaN(n) && n > max ? n : max;
      }
      return max;
    }, 0) + 1;

  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    // Skip completely empty row
    if (!row || row.every((c) => c === '' || c === null || c === undefined)) {
      continue;
    }

    const rowNum = headerRowIndex + 2 + i;
    const errors: string[] = [];

    const getVal = (idx: number): string => (idx >= 0 && row[idx] !== undefined ? String(row[idx]).trim() : '');

    const topic = getVal(colIdx.topic);
    const roomStr = getVal(colIdx.room);
    const requesterName = getVal(colIdx.requesterName);
    const department = getVal(colIdx.department) || 'ฝ่ายบริหารงานทั่วไป';
    const phone = formatThaiPhone(getVal(colIdx.phone), '');
    const email = getVal(colIdx.email);
    const institute = getVal(colIdx.institute);
    const rawStartDate = colIdx.startDate >= 0 ? row[colIdx.startDate] : null;
    const rawEndDate = colIdx.endDate >= 0 ? row[colIdx.endDate] : rawStartDate;
    const rawStartTime = colIdx.startTime >= 0 ? row[colIdx.startTime] : null;
    const rawEndTime = colIdx.endTime >= 0 ? row[colIdx.endTime] : null;
    const participantsVal = parseInt(getVal(colIdx.participants), 10);
    const participants = !isNaN(participantsVal) && participantsVal > 0 ? participantsVal : 1;
    const snacks = parseInt(getVal(colIdx.snacks), 10) || 0;
    const lunch = parseInt(getVal(colIdx.lunch), 10) || 0;
    const drinks = parseInt(getVal(colIdx.drinks), 10) || 0;
    const equipmentStr = getVal(colIdx.equipment);
    const seatingSetup = getVal(colIdx.seatingSetup);
    const meetingType = getVal(colIdx.meetingType).toLowerCase().includes('online') ? 'Online' : 'Onsite';
    const note = getVal(colIdx.note);

    // Validation 1: Required Topic
    if (!topic) {
      errors.push('ไม่ได้ระบุหัวข้อการประชุม');
    }

    // Validation 2: Room Match
    const matchedRoom = findMatchingRoom(roomStr, rooms);
    if (!matchedRoom) {
      errors.push(`ไม่พบห้องประชุม "${roomStr || 'ว่าง'}" ในระบบ`);
    } else if (!matchedRoom.isActive) {
      errors.push(`ห้องประชุม "${matchedRoom.name}" อยู่ระหว่างปิดปรับปรุง`);
    }

    // Validation 3: Requester Name
    if (!requesterName) {
      errors.push('ไม่ได้ระบุชื่อ-นามสกุล ผู้ขอจอง');
    }

    // Validation 4: Dates
    const startDate = parseExcelDate(rawStartDate);
    const endDate = parseExcelDate(rawEndDate) || startDate;

    if (!startDate) {
      errors.push('รูปแบบวันที่เริ่มต้นไม่ถูกต้อง (ตัวอย่าง: YYYY-MM-DD หรือ DD/MM/YYYY)');
    }
    if (!endDate) {
      errors.push('รูปแบบวันที่สิ้นสุดไม่ถูกต้อง');
    }
    if (startDate && endDate && endDate < startDate) {
      errors.push('วันที่สิ้นสุดต้องไม่เกิดขึ้นก่อนวันที่เริ่มต้น');
    }

    // Validation 5: Times
    const startTime = parseExcelTime(rawStartTime);
    const endTime = parseExcelTime(rawEndTime);

    if (!startTime) {
      errors.push('รูปแบบเวลาเริ่มต้นไม่ถูกต้อง (ตัวอย่าง: 09:00 หรือ 13:30)');
    }
    if (!endTime) {
      errors.push('รูปแบบเวลาสิ้นสุดไม่ถูกต้อง (ตัวอย่าง: 10:30 หรือ 16:30)');
    }

    let startDateTime: Date | null = null;
    let endDateTime: Date | null = null;

    if (startDate && endDate && startTime && endTime) {
      const [sH, sM] = startTime.split(':').map(Number);
      const [eH, eM] = endTime.split(':').map(Number);

      startDateTime = new Date(startDate);
      startDateTime.setHours(sH, sM, 0, 0);

      endDateTime = new Date(endDate);
      endDateTime.setHours(eH, eM, 0, 0);

      // Validation 6: Check past date/time (Requirement: ตรวจสอบไม่ให้จองย้อนหลัง)
      if (disallowPast && startDateTime < oneMinuteGrace) {
        errors.push(`ช่วงเวลาเริ่มต้น (${startDate} ${startTime} น.) เป็นช่วงเวลาย้อนหลังในอดีต`);
      }

      // Validation 7: End must be after start
      if (endDateTime <= startDateTime) {
        errors.push(`เวลาสิ้นสุด (${endTime} น.) ต้องมากกว่าเวลาเริ่มต้น (${startTime} น.)`);
      }

      // Validation 8: Overlap check with existing bookings AND other rows in the same import file
      if (matchedRoom && errors.length === 0) {
        const overlapResult = checkBookingOverlap(
          [...existingBookings, ...validBatchBookings],
          matchedRoom.id,
          startDateTime,
          endDateTime
        );

        if (overlapResult.overlap) {
          errors.push(
            `เวลาทับซ้อนกับการจอง "${overlapResult.conflictWith?.topic}" ในห้อง ${matchedRoom.name}`
          );
        }
      }
    }

    const isValid = errors.length === 0;

    let bookingObj: Booking | undefined;
    if (isValid && matchedRoom && startDateTime && endDateTime) {
      const newId = `MR-${String(nextNum++).padStart(5, '0')}`;
      bookingObj = {
        id: newId,
        roomId: matchedRoom.id,
        topic,
        department,
        requesterName,
        phone,
        email,
        institute,
        startTime: startDateTime.toISOString(),
        endTime: endDateTime.toISOString(),
        participants,
        snacks,
        lunch,
        drinks,
        equipment: equipmentStr ? equipmentStr.split(',').map((s) => s.trim()) : [],
        seatingSetup: seatingSetup || (matchedRoom.seatingOptions && matchedRoom.seatingOptions[0]) || '',
        meetingType,
        meetingLink: '',
        note,
        status: 'approved', // imported by admin directly as approved
        isBlocked: false,
        isImported: true,
        suppressEmail: true,
        createdAt: new Date().toISOString()
      };
      validBatchBookings.push(bookingObj);
    }

    parsedRows.push({
      rowIndex: rowNum,
      raw: {
        topic,
        roomStr,
        requesterName,
        department,
        startDate: startDate || String(rawStartDate || ''),
        endDate: endDate || String(rawEndDate || ''),
        startTime: startTime || String(rawStartTime || ''),
        endTime: endTime || String(rawEndTime || ''),
        participants,
        note
      },
      isValid,
      errors,
      booking: bookingObj
    });
  }

  return {
    totalRows: parsedRows.length,
    validCount: validBatchBookings.length,
    errorCount: parsedRows.length - validBatchBookings.length,
    rows: parsedRows,
    readyBookings: validBatchBookings
  };
};

