import { Booking, Room, EmailNotification, UserAccount } from '../types';
import { OWNER_EMAILS } from '../data/initialData';
import { formatThaiDate, formatThaiTime } from './thaiDate';
import { saveEmailNotificationToFirestore } from '../lib/firestoreService';

export const buildEmailHtml = (data: {
  statusBadgeText: string;
  statusBadgeColor: string;
  statusBadgeBg: string;
  topic: string;
  roomName: string;
  dateDisplay: string;
  timeDisplay: string;
  requesterName: string;
  department: string;
  phone: string;
  email: string;
  participants: number;
  institute: string;
  meetingFormat: string;
  equipment: string;
  cateringInfo: string;
  seatingSetup?: string;
  note?: string;
  extraMessage?: string;
  isAdminNotice: boolean;
  approvalLink?: string;
  bookingId?: string;
}): string => {
  const {
    statusBadgeText,
    statusBadgeColor,
    statusBadgeBg,
    topic,
    roomName,
    dateDisplay,
    timeDisplay,
    requesterName,
    department,
    phone,
    email,
    participants,
    institute,
    meetingFormat,
    equipment,
    cateringInfo,
    seatingSetup,
    note,
    extraMessage,
    isAdminNotice,
    approvalLink,
    bookingId
  } = data;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin: 0; padding: 20px; font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; color: #1f2937;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e5e7eb;">
      
      <!-- Header -->
      <tr>
        <td style="background-color: #C8102E; padding: 24px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">ระบบจองห้องประชุมออนไลน์</h1>
          <div style="color: rgba(255,255,255,0.85); font-size: 13px; margin-top: 4px;">สถานเสาวภา สภากาชาดไทย (QSMI)</div>
          ${isAdminNotice ? '<span style="display: inline-block; background: rgba(255,255,255,0.25); color: #fff; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 8px;">🔔 แจ้งเตือนสำหรับผู้ดูแลระบบ (Super Admin / Admin)</span>' : ''}
        </td>
      </tr>

      <!-- Status Bar -->
      <tr>
        <td style="padding: 20px 30px 10px 30px; text-align: center;">
          <div style="display: inline-block; padding: 8px 20px; border-radius: 25px; background-color: ${statusBadgeBg}; color: ${statusBadgeColor}; font-size: 15px; font-weight: 700; border: 1px solid ${statusBadgeColor}33;">
            ${statusBadgeText}
          </div>
        </td>
      </tr>

      <!-- Main Info Box -->
      <tr>
        <td style="padding: 10px 30px;">
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
            <div style="font-size: 13px; color: #6b7280; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">หัวข้อการประชุม</div>
            <div style="font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 12px;">${topic}</div>
            
            <table width="100%" border="0" cellspacing="0" cellpadding="4" style="font-size: 14px;">
              <tr>
                <td width="30%" style="color: #6b7280; font-weight: 600;">ห้องประชุม:</td>
                <td style="color: #111827; font-weight: 700;">${roomName}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; font-weight: 600;">วันที่:</td>
                <td style="color: #111827; font-weight: 600;">📅 ${dateDisplay}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; font-weight: 600;">เวลา:</td>
                <td style="color: #111827; font-weight: 600;">⏰ ${timeDisplay}</td>
              </tr>
            </table>
          </div>
        </td>
      </tr>

      <!-- Details Table -->
      <tr>
        <td style="padding: 0 30px 20px 30px;">
          <h3 style="font-size: 15px; color: #374151; margin: 0 0 12px 0; border-bottom: 2px solid #e5e7eb; padding-bottom: 6px;">รายละเอียดผู้จองและการประชุม</h3>
          <table width="100%" border="0" cellspacing="0" cellpadding="8" style="font-size: 14px; border-collapse: collapse;">
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td width="35%" style="color: #6b7280; font-weight: 600;">ผู้จอง / ฝ่าย:</td>
              <td style="color: #111827; font-weight: 600;">${requesterName} / ${department || '-'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="color: #6b7280; font-weight: 600;">เบอร์โทรศัพท์:</td>
              <td style="color: #111827;">${phone || '-'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="color: #6b7280; font-weight: 600;">อีเมล:</td>
              <td style="color: #111827;">${email || '-'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="color: #6b7280; font-weight: 600;">จำนวนผู้เข้าร่วม:</td>
              <td style="color: #111827;">${participants} ท่าน</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="color: #6b7280; font-weight: 600;">สถาบันที่เข้าร่วม:</td>
              <td style="color: #111827;">${institute || '-'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="color: #6b7280; font-weight: 600;">รูปแบบการประชุม:</td>
              <td style="color: #111827; font-weight: 600;">${meetingFormat}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="color: #6b7280; font-weight: 600;">อุปกรณ์ที่ขอใช้:</td>
              <td style="color: #111827;">${equipment || '-'}</td>
            </tr>
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="color: #6b7280; font-weight: 600;">อาหารและเครื่องดื่ม:</td>
              <td style="color: #111827;">${cateringInfo}</td>
            </tr>
            ${
              note
                ? `
            <tr style="border-bottom: 1px solid #f3f4f6;">
              <td style="color: #6b7280; font-weight: 600;">หมายเหตุ:</td>
              <td style="color: #111827;">${note}</td>
            </tr>
            `
                : ''
            }
            ${
              seatingSetup
                ? `
            <tr>
              <td style="color: #6b7280; font-weight: 600;">การจัดโต๊ะประชุม:</td>
              <td style="color: #111827;">${seatingSetup}</td>
            </tr>
            `
                : ''
            }
          </table>

          ${
            extraMessage
              ? `
            <div style="margin-top: 16px; padding: 12px 16px; background-color: #fee2e2; border-left: 4px solid #ef4444; border-radius: 4px; font-size: 14px; color: #991b1b;">
              <strong>หมายเหตุ / เหตุผล:</strong> ${extraMessage}
            </div>
          `
              : ''
          }

          ${
            isAdminNotice && approvalLink
              ? `
            <div style="margin-top: 24px; margin-bottom: 8px; text-align: center;">
              <a href="${approvalLink}" data-booking-id="${bookingId || ''}" class="booking-approval-btn" style="display: inline-block; padding: 14px 32px; background-color: #C8102E; color: #ffffff !important; text-decoration: none; font-size: 15px; font-weight: 700; border-radius: 10px; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(200,16,46,0.25); cursor: pointer; text-align: center;">
                📋 คลิกเพื่อดูรายละเอียดและอนุมัติการจอง
              </a>
              <div style="margin-top: 10px; font-size: 12px; color: #6b7280;">
                กดปุ่มด้านบนเพื่อเข้าสู่ระบบจองห้องประชุมและดำเนินการอนุมัติ
              </div>
            </div>
          `
              : ''
          }
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
          อีเมลนี้เป็นการแจ้งเตือนอัตโนมัติจาก <strong>ระบบจองห้องประชุมออนไลน์ สถานเสาวภา สภากาชาดไทย</strong><br>
          หากมีข้อสงสัย กรุณาติดต่อผู้ดูแลระบบห้องประชุม โทร. 02-252-0161-4
        </td>
      </tr>

    </table>
  </body>
  </html>
  `;
};

// Send real email via Vercel Serverless Function or Backend API endpoint
export async function sendEmailViaApi(payload: {
  to: string;
  from?: string;
  subject: string;
  text: string;
  html: string;
}) {
  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...payload,
        from: payload.from || 'ระบบจองห้องประชุม <wsritangkum@gmail.com>',
      }),
    });
    if (res.ok) {
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('API send-email notice:', err);
  }
  return null;
}

export function getAdminEmailRecipients(users?: UserAccount[]): string[] {
  let adminRecipients: string[] = [];
  let effectiveUsers = users;
  if ((!effectiveUsers || effectiveUsers.length === 0) && typeof window !== 'undefined') {
    try {
      const saved =
        localStorage.getItem('meeting_app_users') ||
        localStorage.getItem('meeting_rooms_corporate_users');
      if (saved) effectiveUsers = JSON.parse(saved);
    } catch (e) {
      // ignore
    }
  }

  if (effectiveUsers && effectiveUsers.length > 0) {
    const subscribedAdmins = effectiveUsers.filter((u) => {
      const isAdminRole = u.role === 'admin' || u.role === 'manager';
      const isApproved = !u.status || u.status === 'approved';
      const hasEmail = !!u.email?.trim();
      // If receiveEmailNotifications is explicitly false, do not receive
      // If undefined, default to true for existing admins with email
      const isSubscribed = u.receiveEmailNotifications !== false;
      return isAdminRole && isApproved && hasEmail && isSubscribed;
    });

    const uniqueEmails = new Set<string>();
    subscribedAdmins.forEach((u) => {
      if (u.email?.trim()) uniqueEmails.add(u.email.trim());
    });
    adminRecipients = Array.from(uniqueEmails);
  }

  if (adminRecipients.length === 0) {
    adminRecipients = [...OWNER_EMAILS];
  }

  return adminRecipients;
}

/**
 * ดึงรายชื่ออีเมลเฉพาะของผู้ดูแลระบบสูงสุด (Super Admin: role === 'admin')
 * ที่เปิดรับอีเมลแจ้งเตือน (receiveEmailNotifications !== false)
 * ไม่รวม Admin ทั่วไป (role === 'manager') ตามข้อกำหนด
 */
export function getSuperAdminEmailRecipients(users?: UserAccount[]): string[] {
  let superAdminRecipients: string[] = [];
  let effectiveUsers = users;
  if ((!effectiveUsers || effectiveUsers.length === 0) && typeof window !== 'undefined') {
    try {
      const saved =
        localStorage.getItem('meeting_app_users') ||
        localStorage.getItem('meeting_rooms_corporate_users');
      if (saved) effectiveUsers = JSON.parse(saved);
    } catch (e) {
      // ignore
    }
  }

  if (effectiveUsers && effectiveUsers.length > 0) {
    const subscribedSuperAdmins = effectiveUsers.filter((u) => {
      const isSuperAdminRole = u.role === 'admin'; // เฉพาะ Super Admin เท่านั้น ไม่ส่งหา Admin ทั่วไป
      const isApproved = !u.status || u.status === 'approved';
      const hasEmail = !!u.email?.trim();
      const isSubscribed = u.receiveEmailNotifications !== false;
      return isSuperAdminRole && isApproved && hasEmail && isSubscribed;
    });

    const uniqueEmails = new Set<string>();
    subscribedSuperAdmins.forEach((u) => {
      if (u.email?.trim()) uniqueEmails.add(u.email.trim());
    });
    superAdminRecipients = Array.from(uniqueEmails);
  }

  if (superAdminRecipients.length === 0) {
    superAdminRecipients = [...OWNER_EMAILS];
  }

  return superAdminRecipients;
}

export const createEmailNotifications = (
  booking: Booking,
  type: 'RECEIVED' | 'APPROVED' | 'REJECTED' | 'CANCELLED',
  rooms: Room[],
  reason?: string,
  users?: UserAccount[]
): EmailNotification[] => {
  if (booking.isBlocked) return [];

  const room = rooms.find((r) => r.id === booking.roomId);
  const roomName = room ? room.name : 'ไม่ระบุ';

  const startD = new Date(booking.startTime);
  const endD = new Date(booking.endTime);
  const startDateStr = formatThaiDate(startD, { day: 'numeric', month: 'short', year: 'numeric' });
  const endDateStr = formatThaiDate(endD, { day: 'numeric', month: 'short', year: 'numeric' });
  const dateDisplay = startDateStr === endDateStr ? startDateStr : `${startDateStr} ถึง ${endDateStr}`;
  const timeDisplay = `${formatThaiTime(startD, { hour: '2-digit', minute: '2-digit' })} - ${formatThaiTime(endD, { hour: '2-digit', minute: '2-digit' })} น.`;

  const meetingFormat =
    booking.meetingType === 'Online'
      ? `Online ${booking.meetingLink ? `(Link: ${booking.meetingLink})` : ''}`
      : booking.meetingType === 'Hybrid'
        ? `Hybrid (ผสมผสาน) ${booking.meetingLink ? `(Link: ${booking.meetingLink})` : ''}`
        : 'Onsite';

  const cateringInfo = `อาหารว่าง: ${booking.snacks || '-'} ชุด, กลางวัน: ${booking.lunch || '-'} กล่อง, เครื่องดื่ม: ${booking.drinks || '-'} ขวด`;
  const equipmentStr = Array.isArray(booking.equipment)
    ? booking.equipment.join(', ')
    : booking.equipment || '-';

  let subject = '';
  let statusBadgeText = '';
  let statusBadgeColor = '#2563eb';
  let statusBadgeBg = '#dbeafe';
  let userLeadText = '';

  switch (type) {
    case 'RECEIVED':
      subject = `[รออนุมัติ] คำขอจองห้องประชุม: ${booking.topic}`;
      statusBadgeText = '⏳ คำขอจองห้องประชุม (รอการอนุมัติ)';
      statusBadgeColor = '#d97706';
      statusBadgeBg = '#fef3c7';
      userLeadText =
        'ระบบได้รับคำขอจองห้องประชุมของท่านแล้ว (สถานะ: รอการอนุมัติจากผู้ดูแลระบบ)\nโปรดรออีเมลแจ้งผลการอนุมัติอีกครั้ง';
      break;

    case 'APPROVED':
      subject = `✅ [อนุมัติแล้ว] การจองห้องประชุม: ${booking.topic}`;
      statusBadgeText = '✅ ได้รับการอนุมัติแล้ว (Approved)';
      statusBadgeColor = '#059669';
      statusBadgeBg = '#d1fae5';
      userLeadText = 'คำขอจองห้องประชุมของท่านได้รับการ "อนุมัติ" เรียบร้อยแล้ว';
      break;

    case 'REJECTED':
      subject = `❌ [ไม่อนุมัติ] การจองห้องประชุม: ${booking.topic}`;
      statusBadgeText = '❌ คำขอจองไม่ได้รับการอนุมัติ';
      statusBadgeColor = '#dc2626';
      statusBadgeBg = '#fee2e2';
      userLeadText = `ขออภัย คำขอจองห้องประชุมของท่านไม่ได้รับการอนุมัติ\nเหตุผล: ${reason || 'ไม่ระบุเหตุผล'}`;
      break;

    case 'CANCELLED':
      subject = `🚫 [ยกเลิกการจอง] การจองห้องประชุม: ${booking.topic}`;
      statusBadgeText = '🚫 การจองถูกยกเลิกแล้ว';
      statusBadgeColor = '#4b5563';
      statusBadgeBg = '#f3f4f6';
      userLeadText = 'การจองห้องประชุมของท่านได้ถูก "ยกเลิก" เรียบร้อยแล้ว';
      break;
  }

  const requesterInfo = `${booking.requesterName || '-'} / ${booking.department || '-'}`;
  const footer = '\n\nขอบคุณครับ\nระบบจองห้องประชุมออนไลน์ (สถานเสาวภา สภากาชาดไทย)';

  const userPlainBody =
    `เรียนคุณ ${requesterInfo},\n\n` +
    `${userLeadText}\n` +
    `--------------------------------------------------\n` +
    `รายละเอียดการจอง:\n` +
    `- หัวข้อ: ${booking.topic}\n` +
    `- ห้อง: ${roomName}\n` +
    `- วันที่: ${dateDisplay}\n` +
    `- เวลา: ${timeDisplay}\n` +
    `- ผู้เข้าร่วม: ${booking.participants || '-'} ท่าน\n` +
    `- สถาบันเข้าร่วม: ${booking.institute || '-'}\n` +
    `- รูปแบบ: ${meetingFormat}\n` +
    `- อุปกรณ์: ${equipmentStr}\n` +
    `- ${cateringInfo}\n` +
    (booking.note ? `- หมายเหตุ: ${booking.note}\n` : '') +
    (booking.seatingSetup ? `- การจัดโต๊ะ: ${booking.seatingSetup}\n` : '') +
    (reason ? `- เหตุผล: ${reason}\n` : '') +
    `--------------------------------------------------` +
    footer;

  const notifications: EmailNotification[] = [];
  const nowStr = new Date().toISOString();

  // 1. Email for User
  if (booking.email) {
    const userHtml = buildEmailHtml({
      statusBadgeText,
      statusBadgeColor,
      statusBadgeBg,
      topic: booking.topic,
      roomName,
      dateDisplay,
      timeDisplay,
      requesterName: booking.requesterName,
      department: booking.department,
      phone: booking.phone,
      email: booking.email,
      participants: booking.participants,
      institute: booking.institute || '-',
      meetingFormat,
      equipment: equipmentStr,
      cateringInfo,
      seatingSetup: booking.seatingSetup,
      note: booking.note,
      extraMessage: reason,
      isAdminNotice: false
    });

    const userNotif: EmailNotification = {
      id: `mail-user-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      bookingId: booking.id,
      recipient: booking.email,
      subject,
      bodyText: userPlainBody,
      htmlBody: userHtml,
      type,
      sentAt: nowStr,
      isRead: false,
      isAdminNotice: false
    };

    notifications.push(userNotif);

    // Save to Firestore & send via API asynchronously
    saveEmailNotificationToFirestore(userNotif).catch(console.warn);
    sendEmailViaApi({
      to: userNotif.recipient,
      subject: userNotif.subject,
      text: userNotif.bodyText,
      html: userNotif.htmlBody,
    }).catch(console.warn);
  }

  // 2. Email for Admin Accounts (Configured by Super Admin)
  const adminRecipients = getAdminEmailRecipients(users);

  // Approval button is ONLY generated for Admin notifications when the status is pending / type is RECEIVED
  const isPendingStatus = type === 'RECEIVED' || booking.status === 'pending';
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://qsmi-meeting-room.web.app';
  const approvalLink = isPendingStatus ? `${baseUrl}/#bookingId=${booking.id}` : undefined;
  const adminSubject = `[แจ้งเตือน Super Admin/Admin] ${subject}`;
  const adminHtml = buildEmailHtml({
    statusBadgeText,
    statusBadgeColor,
    statusBadgeBg,
    topic: booking.topic,
    roomName,
    dateDisplay,
    timeDisplay,
    requesterName: booking.requesterName,
    department: booking.department,
    phone: booking.phone,
    email: booking.email,
    participants: booking.participants,
    institute: booking.institute || '-',
    meetingFormat,
    equipment: equipmentStr,
    cateringInfo,
    seatingSetup: booking.seatingSetup,
    note: booking.note,
    extraMessage: reason,
    isAdminNotice: true,
    approvalLink,
    bookingId: booking.id
  });

  adminRecipients.forEach((ownerEmail) => {
    const adminNotif: EmailNotification = {
      id: `mail-admin-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      bookingId: booking.id,
      recipient: ownerEmail,
      subject: adminSubject,
      bodyText: userPlainBody,
      htmlBody: adminHtml,
      type,
      sentAt: nowStr,
      isRead: false,
      isAdminNotice: true
    };

    notifications.push(adminNotif);

    // Save to Firestore & send via API asynchronously
    saveEmailNotificationToFirestore(adminNotif).catch(console.warn);
    sendEmailViaApi({
      to: adminNotif.recipient,
      subject: adminNotif.subject,
      text: adminNotif.bodyText,
      html: adminNotif.htmlBody,
    }).catch(console.warn);
  });

  return notifications;
};

/**
 * สร้าง HTML Template สำหรับอีเมลแจ้งเตือนเกี่ยวกับการลงทะเบียนและอนุมัติผู้ใช้งาน
 */
export const buildUserEmailHtml = (data: {
  statusBadgeText: string;
  statusBadgeColor: string;
  statusBadgeBg: string;
  userName: string;
  username: string;
  role: string;
  department: string;
  title: string;
  email: string;
  phone: string;
  dateDisplay: string;
  isAdminNotice: boolean;
  actionLink?: string;
  actionButtonText?: string;
  approvedBy?: string;
  approvedAt?: string;
  rejectionReason?: string;
  extraMessage?: string;
}): string => {
  const {
    statusBadgeText,
    statusBadgeColor,
    statusBadgeBg,
    userName,
    username,
    role,
    department,
    title,
    email,
    phone,
    dateDisplay,
    isAdminNotice,
    actionLink,
    actionButtonText,
    approvedBy,
    approvedAt,
    rejectionReason,
    extraMessage
  } = data;

  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
  </head>
  <body style="margin: 0; padding: 20px; font-family: 'Sarabun', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6; color: #1f2937;">
    <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.08); border: 1px solid #e5e7eb;">
      
      <!-- Header -->
      <tr>
        <td style="background-color: #C8102E; padding: 24px 30px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 700; letter-spacing: 0.5px;">ระบบจองห้องประชุมออนไลน์</h1>
          <div style="color: rgba(255,255,255,0.85); font-size: 13px; margin-top: 4px;">สถานเสาวภา สภากาชาดไทย (QSMI)</div>
          ${isAdminNotice ? '<span style="display: inline-block; background: rgba(255,255,255,0.25); color: #fff; padding: 3px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; margin-top: 8px;">🔔 แจ้งเตือนสำหรับผู้ดูแลระบบสูงสุด (Super Admin)</span>' : ''}
        </td>
      </tr>

      <!-- Status Bar -->
      <tr>
        <td style="padding: 20px 30px 10px 30px; text-align: center;">
          <div style="display: inline-block; padding: 8px 20px; border-radius: 25px; background-color: ${statusBadgeBg}; color: ${statusBadgeColor}; font-size: 15px; font-weight: 700; border: 1px solid ${statusBadgeColor}33;">
            ${statusBadgeText}
          </div>
        </td>
      </tr>

      <!-- Main Info Box -->
      <tr>
        <td style="padding: 10px 30px;">
          <div style="background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 18px; margin-bottom: 20px;">
            <div style="font-size: 13px; color: #6b7280; font-weight: 600; text-transform: uppercase; margin-bottom: 4px;">ข้อมูลบัญชีผู้ใช้งาน / ผู้สมัคร</div>
            <div style="font-size: 18px; font-weight: 700; color: #111827; margin-bottom: 12px;">${userName} <span style="font-size: 14px; font-weight: normal; color: #6b7280;">(@${username})</span></div>
            
            <table width="100%" border="0" cellspacing="0" cellpadding="5" style="font-size: 14px;">
              <tr>
                <td width="35%" style="color: #6b7280; font-weight: 600;">ชื่อ - นามสกุล:</td>
                <td style="color: #111827; font-weight: 700;">${userName}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; font-weight: 600;">ชื่อผู้ใช้งาน (Username):</td>
                <td style="color: #111827; font-family: monospace; font-weight: 700;">@${username}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; font-weight: 600;">ระดับสิทธิ์:</td>
                <td style="color: #111827; font-weight: 600;">${role}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; font-weight: 600;">ฝ่าย / หน่วยงาน:</td>
                <td style="color: #111827; font-weight: 600;">🏢 ${department}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; font-weight: 600;">ตำแหน่งงาน:</td>
                <td style="color: #111827;">${title || '-'}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; font-weight: 600;">อีเมล:</td>
                <td style="color: #111827;">${email || '-'}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; font-weight: 600;">เบอร์โทรศัพท์:</td>
                <td style="color: #111827;">${phone || '-'}</td>
              </tr>
              <tr>
                <td style="color: #6b7280; font-weight: 600;">วันที่ทำรายการ:</td>
                <td style="color: #111827;">📅 ${dateDisplay}</td>
              </tr>
              ${
                approvedBy
                  ? `
              <tr>
                <td style="color: #6b7280; font-weight: 600;">ผู้อนุมัติ:</td>
                <td style="color: #059669; font-weight: 700;">✓ ${approvedBy}</td>
              </tr>`
                  : ''
              }
              ${
                approvedAt
                  ? `
              <tr>
                <td style="color: #6b7280; font-weight: 600;">วันที่อนุมัติ:</td>
                <td style="color: #111827;">${approvedAt}</td>
              </tr>`
                  : ''
              }
              ${
                rejectionReason
                  ? `
              <tr>
                <td style="color: #dc2626; font-weight: 600;">เหตุผลที่ไม่อนุมัติ:</td>
                <td style="color: #dc2626; font-weight: 600;">${rejectionReason}</td>
              </tr>`
                  : ''
              }
            </table>
          </div>
        </td>
      </tr>

      ${
        extraMessage
          ? `
      <tr>
        <td style="padding: 0 30px 10px 30px;">
          <div style="padding: 14px 18px; background-color: ${rejectionReason ? '#fee2e2' : '#eff6ff'}; border-left: 4px solid ${rejectionReason ? '#ef4444' : '#3b82f6'}; border-radius: 6px; font-size: 13.5px; color: ${rejectionReason ? '#991b1b' : '#1e40af'}; line-height: 1.6;">
            <strong>ข้อความแจ้งเตือน:</strong> ${extraMessage}
          </div>
        </td>
      </tr>`
          : ''
      }

      ${
        actionLink
          ? `
      <tr>
        <td style="padding: 15px 30px 25px 30px; text-align: center;">
          <a href="${actionLink}" data-booking-id="${isAdminNotice ? 'USER-REGISTRATION' : 'USER-APPROVAL'}" class="booking-approval-btn" style="display: inline-block; padding: 13px 30px; background-color: #C8102E; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 700; border-radius: 10px; letter-spacing: 0.5px; box-shadow: 0 4px 12px rgba(200,16,46,0.25); cursor: pointer; text-align: center;">
            ${actionButtonText || (isAdminNotice ? '📋 คลิกเพื่อตรวจสอบและอนุมัติผู้ใช้งาน' : '🚀 เข้าสู่ระบบจองห้องประชุม')}
          </a>
          <div style="margin-top: 10px; font-size: 12px; color: #6b7280;">
            กดปุ่มด้านบนเพื่อเข้าสู่ระบบงานสถานเสาวภา
          </div>
        </td>
      </tr>`
          : ''
      }

      <!-- Footer -->
      <tr>
        <td style="background-color: #f9fafb; padding: 20px 30px; text-align: center; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280;">
          อีเมลนี้เป็นการแจ้งเตือนอัตโนมัติจาก <strong>ระบบจองห้องประชุมออนไลน์ สถานเสาวภา สภากาชาดไทย</strong><br>
          หากมีข้อสงสัย กรุณาติดต่อผู้ดูแลระบบห้องประชุม โทร. 02-252-0161-4
        </td>
      </tr>

    </table>
  </body>
  </html>
  `;
};

/**
 * สร้างและส่งอีเมลแจ้งเตือนเมื่อมีการลงทะเบียนผู้ใช้งานใหม่:
 * 1. อีเมลตอบรับคำขอลงทะเบียนไปยังผู้สมัคร (แจ้งว่าได้รับคำขอแล้ว รออนุมัติ)
 * 2. อีเมลแจ้งเตือนเฉพาะผู้ดูแลระบบสูงสุด (Super Admin) ที่เปิดรับอีเมลแจ้งเตือน เพื่อตรวจสอบและอนุมัติสิทธิ์ (ไม่แจ้งเตือน Admin ทั่วไป)
 */
export function createUserRegistrationEmails(
  user: UserAccount,
  users?: UserAccount[]
): EmailNotification[] {
  const notifications: EmailNotification[] = [];
  const now = new Date();
  const nowIso = now.toISOString();
  const dateDisplay = `${formatThaiDate(now, { day: 'numeric', month: 'short', year: 'numeric' })} เวลา ${formatThaiTime(now, { hour: '2-digit', minute: '2-digit' })} น.`;

  const roleDisplay =
    user.role === 'admin'
      ? 'ผู้ดูแลระบบสูงสุด (Super Admin)'
      : user.role === 'manager'
      ? 'ผู้ดูแลระบบ (Admin)'
      : 'ผู้ใช้งานทั่วไป (User)';

  const baseUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://qsmi-meeting-room.web.app';

  // 1. Email ถึง ผู้สมัคร (User)
  const userRecipient = user.email?.trim() || `${user.username.trim()}@qsmi.or.th`;
  const userSubject = `[รออนุมัติ] ได้รับคำขอลงทะเบียนเข้าใช้งานระบบ: ${user.name}`;
  const userPlainBody =
    `เรียน คุณ ${user.name},\n\n` +
    `ระบบได้รับคำขอลงทะเบียนสมัครใช้งานระบบจองห้องประชุมออนไลน์ สถานเสาวภา สภากาชาดไทย ของท่านเรียบร้อยแล้ว\n` +
    `(สถานะ: รอการตรวจสอบและอนุมัติจากผู้ดูแลระบบสูงสุด Super Admin)\n` +
    `โปรดรออีเมลแจ้งผลการอนุมัติอีกครั้งเมื่อผู้ดูแลระบบพิจารณาอนุมัติสิทธิ์เรียบร้อย\n\n` +
    `--------------------------------------------------\n` +
    `รายละเอียดข้อมูลผู้สมัคร:\n` +
    `- ชื่อ - นามสกุล: ${user.name}\n` +
    `- ชื่อผู้ใช้งาน (Username): @${user.username}\n` +
    `- ระดับสิทธิ์ที่ขอใช้งาน: ${roleDisplay}\n` +
    `- ฝ่าย / หน่วยงาน: ${user.department || '-'}\n` +
    `- ตำแหน่งงาน: ${user.title || 'เจ้าหน้าที่'}\n` +
    `- อีเมล: ${user.email || '-'}\n` +
    `- เบอร์โทรศัพท์: ${user.phone || '-'}\n` +
    `- วันที่และเวลาส่งคำขอ: ${dateDisplay}\n` +
    `--------------------------------------------------\n\n` +
    `ขอบคุณครับ\nระบบจองห้องประชุมออนไลน์ สถานเสาวภา สภากาชาดไทย\nโทร. 02-252-0161-4`;

  const userHtml = buildUserEmailHtml({
    statusBadgeText: '⏳ คำขอลงทะเบียนสมัครใช้งาน (รอ Super Admin อนุมัติ)',
    statusBadgeColor: '#d97706',
    statusBadgeBg: '#fef3c7',
    userName: user.name,
    username: user.username,
    role: roleDisplay,
    department: user.department || '-',
    title: user.title || 'เจ้าหน้าที่',
    email: user.email || '-',
    phone: user.phone || '-',
    dateDisplay,
    isAdminNotice: false,
    extraMessage:
      'ระบบได้รับคำขอลงทะเบียนสมัครใช้งานของท่านเรียบร้อยแล้ว โดยคำขอจะถูกส่งต่อไปยังผู้ดูแลระบบสูงสุด (Super Admin) เพื่อทำการตรวจสอบข้อมูล เมื่อได้รับการอนุมัติเรียบร้อย ระบบจะส่งอีเมลตอบรับยืนยันแจ้งผลการอนุมัติให้ท่านทราบอีกครั้ง เพื่อให้ท่านสามารถเข้าสู่ระบบและจองห้องประชุมได้ทันที'
  });

  const userNotif: EmailNotification = {
    id: `mail-user-reg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    bookingId: 'USER-REGISTRATION',
    recipient: userRecipient,
    subject: userSubject,
    bodyText: userPlainBody,
    htmlBody: userHtml,
    type: 'RECEIVED',
    sentAt: nowIso,
    isRead: false,
    isAdminNotice: false
  };

  notifications.push(userNotif);

  // Save to Firestore & send via API asynchronously
  saveEmailNotificationToFirestore(userNotif).catch(console.warn);
  sendEmailViaApi({
    to: userNotif.recipient,
    subject: userNotif.subject,
    text: userNotif.bodyText,
    html: userNotif.htmlBody
  }).catch(console.warn);

  // 2. Email ถึง ผู้ดูแลระบบสูงสุด (Super Admin เท่านั้น ไม่ส่งหา Admin ทั่วไป)
  const superAdminRecipients = getSuperAdminEmailRecipients(users);
  const adminSubject = `[แจ้งเตือน Super Admin] มีคำขอลงทะเบียนผู้ใช้งานใหม่: ${user.name}`;
  const adminPlainBody =
    `เรียน ผู้ดูแลระบบสูงสุด (Super Admin),\n\n` +
    `มีคำขอลงทะเบียนผู้ใช้งานใหม่เข้าสู่ระบบจองห้องประชุมออนไลน์ สถานเสาวภา สภากาชาดไทย\n` +
    `(สถานะ: รอการตรวจสอบและอนุมัติสิทธิ์)\n\n` +
    `--------------------------------------------------\n` +
    `รายละเอียดผู้สมัครใช้งาน:\n` +
    `- ชื่อ - นามสกุล: ${user.name}\n` +
    `- ชื่อผู้ใช้งาน (Username): @${user.username}\n` +
    `- ระดับสิทธิ์ที่ขอใช้งาน: ${roleDisplay}\n` +
    `- ฝ่าย / หน่วยงาน: ${user.department || '-'}\n` +
    `- ตำแหน่งงาน: ${user.title || 'เจ้าหน้าที่'}\n` +
    `- อีเมล: ${user.email || '-'}\n` +
    `- เบอร์โทรศัพท์: ${user.phone || '-'}\n` +
    `- วันที่ส่งคำขอ: ${dateDisplay}\n` +
    `--------------------------------------------------\n\n` +
    `กรุณาเข้าสู่ระบบในแท็บ "จัดการผู้ใช้งาน" เพื่อพิจารณาอนุมัติคำขอ\n` +
    `ลิงก์ดำเนินการ: ${baseUrl}/#tab=users\n\n` +
    `ขอบคุณครับ\nระบบจองห้องประชุมออนไลน์ สถานเสาวภา สภากาชาดไทย`;

  const adminHtml = buildUserEmailHtml({
    statusBadgeText: '🔔 คำขอลงทะเบียนผู้ใช้งานใหม่ (รอ Super Admin อนุมัติ)',
    statusBadgeColor: '#7c3aed',
    statusBadgeBg: '#ede9fe',
    userName: user.name,
    username: user.username,
    role: roleDisplay,
    department: user.department || '-',
    title: user.title || 'เจ้าหน้าที่',
    email: user.email || '-',
    phone: user.phone || '-',
    dateDisplay,
    isAdminNotice: true,
    actionLink: `${baseUrl}/#tab=users`,
    actionButtonText: '📋 คลิกเพื่อตรวจสอบและอนุมัติผู้ใช้งาน',
    extraMessage:
      'มีผู้ใช้งานยื่นคำขอสมัครสมาชิกใหม่ กรุณาตรวจสอบข้อมูลและพิจารณาอนุมัติสิทธิ์การเข้าใช้งาน (ระบบแจ้งเตือนเฉพาะผู้ดูแลระบบสูงสุด Super Admin ที่เปิดรับอีเมล)'
  });

  superAdminRecipients.forEach((adminEmail) => {
    const adminNotif: EmailNotification = {
      id: `mail-admin-reg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      bookingId: 'USER-REGISTRATION',
      recipient: adminEmail,
      subject: adminSubject,
      bodyText: adminPlainBody,
      htmlBody: adminHtml,
      type: 'RECEIVED',
      sentAt: nowIso,
      isRead: false,
      isAdminNotice: true
    };

    notifications.push(adminNotif);

    // Save to Firestore & send via API asynchronously
    saveEmailNotificationToFirestore(adminNotif).catch(console.warn);
    sendEmailViaApi({
      to: adminNotif.recipient,
      subject: adminNotif.subject,
      text: adminNotif.bodyText,
      html: adminNotif.htmlBody
    }).catch(console.warn);
  });

  return notifications;
}

/**
 * สร้างและส่งอีเมลตอบรับยืนยันการอนุมัติบัญชีผู้ใช้งาน (Approval Confirmation Email)
 * 1. ส่งไปยังอีเมลของผู้ใช้งานที่ได้รับการอนุมัติ
 * 2. ส่งแจ้งเตือนไปยังผู้ดูแลระบบสูงสุด (Super Admin) ที่เปิดรับอีเมลแจ้งเตือน (ไม่แจ้งเตือน Admin ทั่วไป)
 */
export function createUserApprovalEmails(
  user: UserAccount,
  approvedBy: string = 'ผู้ดูแลระบบ',
  users?: UserAccount[]
): EmailNotification[] {
  const notifications: EmailNotification[] = [];
  const now = new Date();
  const nowIso = now.toISOString();
  const dateDisplay = `${formatThaiDate(now, { day: 'numeric', month: 'short', year: 'numeric' })} เวลา ${formatThaiTime(now, { hour: '2-digit', minute: '2-digit' })} น.`;

  const roleDisplay =
    user.role === 'admin'
      ? 'ผู้ดูแลระบบสูงสุด (Super Admin)'
      : user.role === 'manager'
      ? 'ผู้ดูแลระบบ (Admin)'
      : 'ผู้ใช้งานทั่วไป (User)';

  const baseUrl =
    typeof window !== 'undefined' ? window.location.origin : 'https://qsmi-meeting-room.web.app';
  const userRecipient = user.email?.trim() || `${user.username.trim()}@qsmi.or.th`;
  const subject = `✅ [อนุมัติแล้ว] บัญชีผู้ใช้งานของคุณได้รับการอนุมัติ: ระบบจองห้องประชุม สถานเสาวภา สภากาชาดไทย`;

  const plainBody =
    `เรียน คุณ ${user.name},\n\n` +
    `ยินดีต้อนรับสู่ระบบจองห้องประชุมออนไลน์ สถานเสาวภา สภากาชาดไทย!\n` +
    `บัญชีผู้ใช้งานของท่านได้รับการ "อนุมัติ" เรียบร้อยแล้ว โดย ${approvedBy}\n\n` +
    `ขณะนี้ท่านสามารถเข้าสู่ระบบด้วยชื่อผู้ใช้งาน (@${user.username}) และรหัสผ่านที่ท่านตั้งไว้ เพื่อตรวจสอบตารางและเริ่มดำเนินการจองห้องประชุมได้ทันที\n\n` +
    `--------------------------------------------------\n` +
    `รายละเอียดบัญชีผู้ใช้งานที่ได้รับการอนุมัติ:\n` +
    `- ชื่อ - นามสกุล: ${user.name}\n` +
    `- ชื่อผู้ใช้งาน (Username): @${user.username}\n` +
    `- ระดับสิทธิ์การใช้งาน: ${roleDisplay}\n` +
    `- ฝ่าย / หน่วยงาน: ${user.department || '-'}\n` +
    `- ตำแหน่งงาน: ${user.title || 'เจ้าหน้าที่'}\n` +
    `- อีเมล: ${user.email || '-'}\n` +
    `- เบอร์โทรศัพท์: ${user.phone || '-'}\n` +
    `- ผู้อนุมัติ: ${approvedBy}\n` +
    `- วันที่อนุมัติ: ${dateDisplay}\n` +
    `--------------------------------------------------\n\n` +
    `เข้าสู่ระบบได้ที่: ${baseUrl}\n\n` +
    `ขอบคุณครับ\nระบบจองห้องประชุมออนไลน์ สถานเสาวภา สภากาชาดไทย\nโทร. 02-252-0161-4`;

  const html = buildUserEmailHtml({
    statusBadgeText: '✅ บัญชีได้รับการอนุมัติแล้ว (Approved)',
    statusBadgeColor: '#059669',
    statusBadgeBg: '#d1fae5',
    userName: user.name,
    username: user.username,
    role: roleDisplay,
    department: user.department || '-',
    title: user.title || 'เจ้าหน้าที่',
    email: user.email || '-',
    phone: user.phone || '-',
    dateDisplay,
    approvedBy,
    approvedAt: dateDisplay,
    isAdminNotice: false,
    actionLink: `${baseUrl}/#action=login`,
    actionButtonText: '🚀 เข้าสู่ระบบจองห้องประชุม (Login)',
    extraMessage:
      'ยินดีต้อนรับสู่ระบบจองห้องประชุม สถานเสาวภา สภากาชาดไทย บัญชีของท่านได้รับการอนุมัติเปิดสิทธิ์การใช้งานเรียบร้อยแล้ว ท่านสามารถเข้าสู่ระบบด้วยชื่อผู้ใช้งานและรหัสผ่านที่ตั้งไว้ เพื่อตรวจสอบตารางห้องประชุมและเริ่มดำเนินการจองได้ทันที'
  });

  const approvalNotif: EmailNotification = {
    id: `mail-user-appr-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    bookingId: 'USER-APPROVAL',
    recipient: userRecipient,
    subject,
    bodyText: plainBody,
    htmlBody: html,
    type: 'APPROVED',
    sentAt: nowIso,
    isRead: false,
    isAdminNotice: false
  };

  saveEmailNotificationToFirestore(approvalNotif).catch(console.warn);
  sendEmailViaApi({
    to: approvalNotif.recipient,
    subject: approvalNotif.subject,
    text: approvalNotif.bodyText,
    html: approvalNotif.htmlBody
  }).catch(console.warn);

  notifications.push(approvalNotif);

  // แจ้งเตือนเฉพาะผู้ดูแลระบบสูงสุด (Super Admin) ที่เปิดรับอีเมลแจ้งเตือน ไม่ส่งหา Admin ทั่วไป
  const superAdminRecipients = getSuperAdminEmailRecipients(users);
  const adminSubject = `[แจ้งเตือน Super Admin] อนุมัติสิทธิ์ผู้ใช้งานใหม่แล้ว: ${user.name}`;
  const adminPlainBody =
    `เรียน ผู้ดูแลระบบสูงสุด (Super Admin),\n\n` +
    `มีการอนุมัติบัญชีผู้ใช้งานใหม่ในระบบจองห้องประชุมออนไลน์ สถานเสาวภา สภากาชาดไทย เรียบร้อยแล้ว โดย ${approvedBy}\n\n` +
    `--------------------------------------------------\n` +
    `รายละเอียดบัญชีผู้ใช้งานที่ได้รับการอนุมัติ:\n` +
    `- ชื่อ - นามสกุล: ${user.name}\n` +
    `- ชื่อผู้ใช้งาน (Username): @${user.username}\n` +
    `- ระดับสิทธิ์ที่ได้รับ: ${roleDisplay}\n` +
    `- ฝ่าย / หน่วยงาน: ${user.department || '-'}\n` +
    `- ตำแหน่งงาน: ${user.title || 'เจ้าหน้าที่'}\n` +
    `- อีเมล: ${user.email || '-'}\n` +
    `- เบอร์โทรศัพท์: ${user.phone || '-'}\n` +
    `- ผู้อนุมัติ: ${approvedBy}\n` +
    `- วันที่อนุมัติ: ${dateDisplay}\n` +
    `--------------------------------------------------\n\n` +
    `ขอบคุณครับ\nระบบจองห้องประชุมออนไลน์ สถานเสาวภา สภากาชาดไทย`;

  const adminHtml = buildUserEmailHtml({
    statusBadgeText: '✅ บัญชีได้รับการอนุมัติแล้ว (Approved)',
    statusBadgeColor: '#059669',
    statusBadgeBg: '#d1fae5',
    userName: user.name,
    username: user.username,
    role: roleDisplay,
    department: user.department || '-',
    title: user.title || 'เจ้าหน้าที่',
    email: user.email || '-',
    phone: user.phone || '-',
    dateDisplay,
    approvedBy,
    approvedAt: dateDisplay,
    isAdminNotice: true,
    actionLink: `${baseUrl}/#tab=users`,
    actionButtonText: '👥 ดูรายชื่อผู้ใช้งานทั้งหมด',
    extraMessage:
      `บัญชีผู้ใช้งานได้รับการอนุมัติสิทธิ์การเข้าใช้งานโดย ${approvedBy} เรียบร้อยแล้ว (ระบบแจ้งเตือนเฉพาะผู้ดูแลระบบสูงสุด Super Admin ที่เปิดรับอีเมล)`
  });

  superAdminRecipients.forEach((adminEmail) => {
    const adminNotif: EmailNotification = {
      id: `mail-admin-appr-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      bookingId: 'USER-APPROVAL',
      recipient: adminEmail,
      subject: adminSubject,
      bodyText: adminPlainBody,
      htmlBody: adminHtml,
      type: 'APPROVED',
      sentAt: nowIso,
      isRead: false,
      isAdminNotice: true
    };

    saveEmailNotificationToFirestore(adminNotif).catch(console.warn);
    sendEmailViaApi({
      to: adminNotif.recipient,
      subject: adminNotif.subject,
      text: adminNotif.bodyText,
      html: adminNotif.htmlBody
    }).catch(console.warn);

    notifications.push(adminNotif);
  });

  return notifications;
}

export function createUserApprovalEmail(
  user: UserAccount,
  approvedBy: string = 'ผู้ดูแลระบบ',
  users?: UserAccount[]
): EmailNotification {
  const list = createUserApprovalEmails(user, approvedBy, users);
  return list[0];
}

/**
 * สร้างและส่งอีเมลแจ้งผลปฏิเสธคำขอลงทะเบียนใช้งาน
 */
export function createUserRejectionEmail(
  user: UserAccount,
  reason: string = 'ข้อมูลไม่ผ่านเกณฑ์การอนุมัติ'
): EmailNotification {
  const now = new Date();
  const nowIso = now.toISOString();
  const dateDisplay = `${formatThaiDate(now, { day: 'numeric', month: 'short', year: 'numeric' })} เวลา ${formatThaiTime(now, { hour: '2-digit', minute: '2-digit' })} น.`;

  const roleDisplay =
    user.role === 'admin'
      ? 'ผู้ดูแลระบบสูงสุด (Super Admin)'
      : user.role === 'manager'
      ? 'ผู้ดูแลระบบ (Admin)'
      : 'ผู้ใช้งานทั่วไป (User)';

  const userRecipient = user.email?.trim() || `${user.username.trim()}@qsmi.or.th`;
  const subject = `❌ [ไม่อนุมัติ] แจ้งผลคำขอลงทะเบียนเข้าใช้งาน: ระบบจองห้องประชุม สถานเสาวภา`;

  const plainBody =
    `เรียน คุณ ${user.name},\n\n` +
    `ขออภัย คำขอลงทะเบียนเข้าใช้งานระบบจองห้องประชุมออนไลน์ สถานเสาวภา สภากาชาดไทย ของท่าน "ไม่ได้รับการอนุมัติ"\n\n` +
    `--------------------------------------------------\n` +
    `รายละเอียดคำขอ:\n` +
    `- ชื่อผู้ใช้งาน (Username): @${user.username}\n` +
    `- เหตุผล: ${reason}\n` +
    `- วันที่แจ้งผล: ${dateDisplay}\n` +
    `--------------------------------------------------\n\n` +
    `หากมีข้อสงสัยหรือต้องการสอบถามข้อมูลเพิ่มเติม กรุณาติดต่อผู้ดูแลระบบห้องประชุม โทร. 02-252-0161-4\n\n` +
    `ขอบคุณครับ\nระบบจองห้องประชุมออนไลน์ สถานเสาวภา สภากาชาดไทย`;

  const html = buildUserEmailHtml({
    statusBadgeText: '❌ คำขอลงทะเบียนไม่ผ่านการอนุมัติ',
    statusBadgeColor: '#dc2626',
    statusBadgeBg: '#fee2e2',
    userName: user.name,
    username: user.username,
    role: roleDisplay,
    department: user.department || '-',
    title: user.title || 'เจ้าหน้าที่',
    email: user.email || '-',
    phone: user.phone || '-',
    dateDisplay,
    rejectionReason: reason,
    isAdminNotice: false,
    extraMessage: `เหตุผลการไม่อนุมัติ: ${reason} (หากมีข้อสงสัย กรุณาติดต่อผู้ดูแลระบบ โทร. 02-252-0161-4)`
  });

  const rejectionNotif: EmailNotification = {
    id: `mail-user-rej-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
    bookingId: 'USER-REJECTION',
    recipient: userRecipient,
    subject,
    bodyText: plainBody,
    htmlBody: html,
    type: 'REJECTED',
    sentAt: nowIso,
    isRead: false,
    isAdminNotice: false
  };

  saveEmailNotificationToFirestore(rejectionNotif).catch(console.warn);
  sendEmailViaApi({
    to: rejectionNotif.recipient,
    subject: rejectionNotif.subject,
    text: rejectionNotif.bodyText,
    html: rejectionNotif.htmlBody
  }).catch(console.warn);

  return rejectionNotif;
}

