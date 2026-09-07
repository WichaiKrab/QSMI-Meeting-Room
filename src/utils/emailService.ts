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
  // Find all admin accounts (role: admin or manager) who have email and have notifications enabled
  let adminRecipients: string[] = [];
  let effectiveUsers = users;
  if ((!effectiveUsers || effectiveUsers.length === 0) && typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('meeting_rooms_corporate_users');
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
  } else {
    adminRecipients = [...OWNER_EMAILS];
  }

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
