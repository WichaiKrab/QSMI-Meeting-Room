import {
  collection,
  doc,
  setDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  limit,
  deleteDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { AuditLog, AuditActionType } from '../types';

const AUDIT_LOGS_COL = 'auditLogs';
const LOCAL_STORAGE_KEY = 'meeting_app_audit_logs';

// In-memory cache for audit logs (avoids persisting sensitive admin logs in DevTools / LocalStorage)
let inMemoryAuditLogs: AuditLog[] = [];

// Cleanup any legacy audit logs stored in localStorage
if (typeof window !== 'undefined') {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (_) {}
}

/**
 * Parse raw User-Agent string into human-friendly device & browser description
 */
export function parseUserAgent(ua?: string): string {
  if (!ua) {
    ua = typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown';
  }

  let browser = 'Unknown Browser';
  let os = 'Unknown OS';
  let device = 'Desktop';

  // Mobile / Tablet check
  if (/mobile/i.test(ua)) {
    device = 'Mobile';
  } else if (/tablet|ipad/i.test(ua)) {
    device = 'Tablet';
  }

  // OS detection
  if (/windows nt 10\.0/i.test(ua)) os = 'Windows 10/11';
  else if (/windows nt 6\.3/i.test(ua)) os = 'Windows 8.1';
  else if (/windows nt 6\.1/i.test(ua)) os = 'Windows 7';
  else if (/windows/i.test(ua)) os = 'Windows';
  else if (/iphone|ipad|ipod/i.test(ua)) {
    const match = ua.match(/os (\d+[._]\d+)/i);
    os = match ? `iOS ${match[1].replace('_', '.')}` : 'iOS';
    if (/iphone/i.test(ua)) device = 'iPhone';
    if (/ipad/i.test(ua)) device = 'iPad';
  } else if (/mac os x/i.test(ua)) {
    const match = ua.match(/mac os x (\d+[._]\d+)/i);
    os = match ? `macOS ${match[1].replace('_', '.')}` : 'macOS';
  } else if (/android/i.test(ua)) {
    const match = ua.match(/android (\d+(\.\d+)?)/i);
    os = match ? `Android ${match[1]}` : 'Android';
  } else if (/linux/i.test(ua)) os = 'Linux';

  // Browser detection (order matters due to userAgent tokens)
  if (/edg\/([0-9.]+)/i.test(ua)) {
    const ver = ua.match(/edg\/([0-9]+)/i)?.[1] || '';
    browser = `MS Edge ${ver}`.trim();
  } else if (/chrome\/([0-9.]+)/i.test(ua) && !/edg/i.test(ua)) {
    const ver = ua.match(/chrome\/([0-9]+)/i)?.[1] || '';
    browser = `Chrome ${ver}`.trim();
  } else if (/safari\/([0-9.]+)/i.test(ua) && !/chrome/i.test(ua)) {
    const ver = ua.match(/version\/([0-9]+)/i)?.[1] || '';
    browser = `Safari ${ver}`.trim();
  } else if (/firefox\/([0-9.]+)/i.test(ua)) {
    const ver = ua.match(/firefox\/([0-9]+)/i)?.[1] || '';
    browser = `Firefox ${ver}`.trim();
  } else if (/opera|opr\/([0-9.]+)/i.test(ua)) {
    browser = 'Opera';
  }

  return `${browser} (${os} - ${device})`;
}

// In-memory / session cached IP address
let cachedClientIp: string | null = null;

// Eagerly initiate IP resolution in background
if (typeof window !== 'undefined') {
  try {
    const stored = sessionStorage.getItem('meeting_app_client_ip');
    if (stored) {
      cachedClientIp = stored;
    } else {
      setTimeout(() => {
        getClientIp().catch(() => {});
      }, 500);
    }
  } catch (_) {}
}

/**
 * Resolve client public/internal IP address with short timeout and caching
 */
export async function getClientIp(): Promise<string> {
  if (cachedClientIp) return cachedClientIp;

  try {
    const stored = sessionStorage.getItem('meeting_app_client_ip');
    if (stored) {
      cachedClientIp = stored;
      return stored;
    }
  } catch (_) {}

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 1200);

    const res = await fetch('https://api.ipify.org?format=json', {
      signal: controller.signal
    });
    clearTimeout(timeoutId);

    if (res.ok) {
      const data = await res.json();
      if (data && data.ip) {
        cachedClientIp = String(data.ip).trim();
        try {
          sessionStorage.setItem('meeting_app_client_ip', cachedClientIp);
        } catch (_) {}
        return cachedClientIp;
      }
    }
  } catch (_) {
    // Silently fall back
  }

  // Fallback internal / intranet simulated IP
  const fallbackIp = '192.168.1.' + Math.floor(10 + Math.random() * 80);
  cachedClientIp = fallbackIp;
  try {
    sessionStorage.setItem('meeting_app_client_ip', fallbackIp);
  } catch (_) {}
  return fallbackIp;
}

/**
 * Seed historical audit logs if empty
 */
export function getInitialHistoricalLogs(): AuditLog[] {
  const now = Date.now();
  const subMinutes = (mins: number) => new Date(now - mins * 60 * 1000).toISOString();
  const subHours = (hours: number) => new Date(now - hours * 3600 * 1000).toISOString();
  const subDays = (days: number, hours: number) => new Date(now - (days * 24 + hours) * 3600 * 1000).toISOString();

  return [
    {
      id: 'log_seed_1',
      username: 'admin',
      userFullName: 'นายวิชัย ศรีต่างคำ',
      userRole: 'admin',
      department: 'ฝ่ายบริหารงานทั่วไป',
      timestamp: subMinutes(5),
      actionType: 'LOGIN',
      actionPerformed: 'เข้าสู่ระบบสำเร็จ (Super Admin Panel)',
      ipAddress: '171.96.182.42',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36',
      browserDevice: parseUserAgent()
    },
    {
      id: 'log_seed_2',
      username: 'somchai',
      userFullName: 'นายสมชาย มั่นคง',
      userRole: 'employee',
      department: 'ฝ่ายบริหารงานทั่วไป',
      timestamp: subMinutes(18),
      actionType: 'AUTO_LOGOUT',
      actionPerformed: 'ออกจากระบบอัตโนมัติ (ไม่มีการใช้งานระบบเกิน 1 นาที)',
      ipAddress: '171.96.182.42',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
      browserDevice: 'Chrome 127 (Windows 10/11 - Desktop)'
    },
    {
      id: 'log_seed_3',
      username: 'somchai',
      userFullName: 'นายสมชาย มั่นคง',
      userRole: 'employee',
      department: 'ฝ่ายบริหารงานทั่วไป',
      timestamp: subMinutes(20),
      actionType: 'LOGIN',
      actionPerformed: 'เข้าสู่ระบบสำเร็จ (SSO บัญชีผู้ใช้งาน)',
      ipAddress: '171.96.182.42',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/127.0.0.0 Safari/537.36',
      browserDevice: 'Chrome 127 (Windows 10/11 - Desktop)'
    },
    {
      id: 'log_seed_4',
      username: 'mgr1',
      userFullName: 'พญ. วรรณภา มั่นคง',
      userRole: 'manager',
      department: 'ฝ่ายบริการและวิจัยคลินิก',
      timestamp: subHours(1),
      actionType: 'APPROVE_BOOKING',
      actionPerformed: 'อนุมัติการจองห้อง: ประชุมเตรียมความพร้อมการฉีดวัคซีนไข้หวัดใหญ่ (ห้องประชุม ชั้น 2 ตึกสภานายิกา)',
      ipAddress: '182.52.201.15',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
      browserDevice: 'Safari 17 (macOS - Desktop)'
    },
    {
      id: 'log_seed_5',
      username: 'mgr1',
      userFullName: 'พญ. วรรณภา มั่นคง',
      userRole: 'manager',
      department: 'ฝ่ายบริการและวิจัยคลินิก',
      timestamp: subHours(2),
      actionType: 'LOGIN',
      actionPerformed: 'เข้าสู่ระบบสำเร็จ (Manager Portal)',
      ipAddress: '182.52.201.15',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15',
      browserDevice: 'Safari 17 (macOS - Desktop)'
    },
    {
      id: 'log_seed_6',
      username: 'supaporn',
      userFullName: 'นางสาวสุภาพร ใจดี',
      userRole: 'employee',
      department: 'ฝ่ายวิจัยและพัฒนา',
      timestamp: subHours(3),
      actionType: 'CREATE_BOOKING',
      actionPerformed: 'ยื่นคำขอจองห้องประชุม: การตรวจประเมินคุณภาพเซรุ่มแก้พิษงู (ห้องสมุดวิชาการ ตึกอำนวยการ)',
      ipAddress: '110.164.72.90',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      browserDevice: 'Safari 17 (iOS 17.4 - iPhone)'
    },
    {
      id: 'log_seed_7',
      username: 'supaporn',
      userFullName: 'นางสาวสุภาพร ใจดี',
      userRole: 'employee',
      department: 'ฝ่ายวิจัยและพัฒนา',
      timestamp: subHours(3.5),
      actionType: 'LOGIN',
      actionPerformed: 'เข้าสู่ระบบสำเร็จ (SSO)',
      ipAddress: '110.164.72.90',
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
      browserDevice: 'Safari 17 (iOS 17.4 - iPhone)'
    },
    {
      id: 'log_seed_8',
      username: 'admin',
      userFullName: 'นายวิชัย ศรีต่างคำ',
      userRole: 'admin',
      department: 'ฝ่ายบริหารงานทั่วไป',
      timestamp: subDays(1, 2),
      actionType: 'USER_MANAGEMENT',
      actionPerformed: 'อนุมัติการสมัครสมาชิกของผู้ใช้งาน: supaporn (นางสาวสุภาพร ใจดี)',
      ipAddress: '171.96.182.42',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36',
      browserDevice: 'Chrome 128 (Windows 10/11 - Desktop)'
    },
    {
      id: 'log_seed_9',
      username: 'somchai',
      userFullName: 'นายสมชาย มั่นคง',
      userRole: 'employee',
      department: 'ฝ่ายบริหารงานทั่วไป',
      timestamp: subDays(1, 4),
      actionType: 'LOGOUT',
      actionPerformed: 'ออกจากระบบโดยผู้ใช้ (Sign Out)',
      ipAddress: '171.96.182.42',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/127.0.0.0 Safari/537.36',
      browserDevice: 'Chrome 127 (Windows 10/11 - Desktop)'
    },
    {
      id: 'log_seed_10',
      username: 'admin',
      userFullName: 'นายวิชัย ศรีต่างคำ',
      userRole: 'admin',
      department: 'ฝ่ายบริหารงานทั่วไป',
      timestamp: subDays(2, 5),
      actionType: 'ROOM_MANAGEMENT',
      actionPerformed: 'ปรับปรุงข้อมูลและอุปกรณ์ห้องประชุม: ห้องประชุม ชั้น 2 ตึกสภานายิกา',
      ipAddress: '171.96.182.42',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/128.0.0.0 Safari/537.36',
      browserDevice: 'Chrome 128 (Windows 10/11 - Desktop)'
    }
  ];
}

/**
 * Record a new Audit / Activity Log
 */
export async function logActivity(params: {
  username: string;
  userFullName?: string;
  userRole?: string;
  department?: string;
  actionType: AuditActionType;
  actionPerformed: string;
  ipAddress?: string;
  userAgent?: string;
  details?: Record<string, any>;
}): Promise<AuditLog> {
  const timestamp = new Date().toISOString();
  const id = `log_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  const userAgent = params.userAgent || (typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown');
  const browserDevice = parseUserAgent(userAgent);
  const ipAddress = params.ipAddress || (await getClientIp());

  const auditEntry: AuditLog = {
    id,
    username: params.username || 'unknown',
    userFullName: params.userFullName || params.username || 'ไม่ระบุชื่อ',
    userRole: params.userRole || 'employee',
    department: params.department || '-',
    timestamp,
    actionType: params.actionType,
    actionPerformed: params.actionPerformed,
    ipAddress,
    userAgent,
    browserDevice,
    details: params.details || {}
  };

  // 1. Save to in-memory cache immediately
  inMemoryAuditLogs = [auditEntry, ...inMemoryAuditLogs.filter((item) => item.id !== id)].slice(0, 500);

  // 2. Persist to Firestore
  try {
    const docRef = doc(db, AUDIT_LOGS_COL, id);
    await setDoc(docRef, auditEntry);
  } catch (err) {
    console.warn('Firestore logActivity error (saved to memory backup):', err);
  }

  return auditEntry;
}

/**
 * Subscribe to Audit Logs in Real-Time
 */
export function subscribeToAuditLogs(callback: (logs: AuditLog[]) => void) {
  // Read in-memory cache first if available for instant render
  if (inMemoryAuditLogs.length > 0) {
    callback(inMemoryAuditLogs);
  }

  // Real-time Firestore subscription (limit to 50 to conserve Firestore read quota)
  try {
    const q = query(collection(db, AUDIT_LOGS_COL), orderBy('timestamp', 'desc'), limit(50));
    const unsubscribe = onSnapshot(
      q,
      async (snapshot) => {
        if (snapshot.empty) {
          // If empty in Firestore, seed initial historical logs
          const seeds = getInitialHistoricalLogs();
          for (const s of seeds) {
            try {
              await setDoc(doc(db, AUDIT_LOGS_COL, s.id), s);
            } catch (_) {}
          }
          inMemoryAuditLogs = seeds;
          callback(seeds);
        } else {
          const logs: AuditLog[] = [];
          snapshot.forEach((docSnap) => {
            logs.push(docSnap.data() as AuditLog);
          });
          inMemoryAuditLogs = logs;
          callback(logs);
        }
      },
      (err) => {
        console.warn('Audit logs subscription fallback to in-memory cache:', err);
        if (inMemoryAuditLogs.length > 0) {
          callback(inMemoryAuditLogs);
        } else {
          const seeds = getInitialHistoricalLogs();
          inMemoryAuditLogs = seeds;
          callback(seeds);
        }
      }
    );

    return unsubscribe;
  } catch (err) {
    console.warn('Failed to start Firestore audit logs subscription:', err);
    callback(getInitialHistoricalLogs());
    return () => {};
  }
}

/**
 * Fetch latest audit logs once on-demand without maintaining continuous real-time listener
 */
export async function fetchLatestAuditLogs(limitCount = 50): Promise<AuditLog[]> {
  try {
    const q = query(collection(db, AUDIT_LOGS_COL), orderBy('timestamp', 'desc'), limit(limitCount));
    const snap = await getDocs(q);
    const logs: AuditLog[] = [];
    snap.forEach((d) => logs.push(d.data() as AuditLog));
    if (logs.length > 0) {
      inMemoryAuditLogs = logs;
    }
    return logs;
  } catch (err) {
    console.warn('Failed to fetch latest audit logs:', err);
    return inMemoryAuditLogs;
  }
}

/**
 * Clear or reset all audit logs in Firestore & memory (Super Admin only)
 */
export async function clearAllAuditLogs(): Promise<void> {
  try {
    inMemoryAuditLogs = [];
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } catch (_) {}
    const snap = await getDocs(collection(db, AUDIT_LOGS_COL));
    const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
    await Promise.all(deletePromises);
  } catch (err) {
    console.warn('Error clearing audit logs:', err);
  }
}
