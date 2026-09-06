import { Booking, Room } from '../types';

/**
 * Format Date to UTC ISO string formatted for Google Calendar (YYYYMMDDTHHmmSSZ)
 */
const formatGoogleCalendarDate = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toISOString().replace(/-|:|\.\d+/g, '');
};

/**
 * Generates direct Google Calendar Web URL to add meeting in one click
 */
export const generateGoogleCalendarUrl = (booking: Booking, room?: Room): string => {
  const roomName = room ? room.name : 'ห้องประชุม';
  const start = formatGoogleCalendarDate(booking.startTime);
  const end = formatGoogleCalendarDate(booking.endTime);

  const title = encodeURIComponent(`[การประชุม] ${booking.topic}`);
  const location = encodeURIComponent(`${roomName} ${room?.location ? `(${room.location})` : ''}`);

  const detailsText = [
    `หัวข้อ: ${booking.topic}`,
    `ห้องประชุม: ${roomName}`,
    `ผู้จอง: ${booking.requesterName} (${booking.department || '-'})`,
    `เบอร์โทรศัพท์: ${booking.phone || '-'}`,
    `อีเมล: ${booking.email || '-'}`,
    `จำนวนผู้เข้าร่วม: ${booking.participants || 1} ท่าน`,
    booking.institute ? `สถาบันเข้าร่วม: ${booking.institute}` : '',
    booking.meetingType === 'Online' && booking.meetingLink ? `ลิงก์การประชุม: ${booking.meetingLink}` : '',
    booking.seatingSetup ? `การจัดโต๊ะ: ${booking.seatingSetup}` : '',
    '---',
    'สร้างโดย: ระบบจองห้องประชุมออนไลน์ (สถานเสาวภา สภากาชาดไทย)'
  ]
    .filter(Boolean)
    .join('\n');

  const details = encodeURIComponent(detailsText);

  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${start}/${end}&details=${details}&location=${location}`;
};

/**
 * Generates and triggers download of RFC-5545 iCalendar (.ics) file
 * Compatible with iOS (Apple Calendar), Android (Google Calendar / Samsung Calendar), and Outlook
 */
export const downloadIcsFile = (booking: Booking, room?: Room) => {
  const roomName = room ? room.name : 'ห้องประชุม';
  const start = formatGoogleCalendarDate(booking.startTime);
  const end = formatGoogleCalendarDate(booking.endTime);
  const now = formatGoogleCalendarDate(new Date().toISOString());

  const description = [
    `หัวข้อ: ${booking.topic}`,
    `ห้องประชุม: ${roomName}`,
    `ผู้จอง: ${booking.requesterName} (${booking.department || '-'})`,
    `เบอร์โทร: ${booking.phone || '-'}`,
    booking.meetingType === 'Online' && booking.meetingLink ? `ลิงก์: ${booking.meetingLink}` : ''
  ]
    .filter(Boolean)
    .join('\\n');

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//QSMI//Meeting Room Booking System//TH',
    'CALSCALE:GREGORIAN',
    'METHOD:REQUEST',
    'BEGIN:VEVENT',
    `UID:${booking.id}@meeting.qsmi.or.th`,
    `DTSTAMP:${now}`,
    `DTSTART:${start}`,
    `DTEND:${end}`,
    `SUMMARY:[การประชุม] ${booking.topic}`,
    `DESCRIPTION:${description}`,
    `LOCATION:${roomName}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-PT15M',
    'ACTION:DISPLAY',
    'DESCRIPTION:เตือนความจำก่อนการประชุม 15 นาที',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR'
  ].join('\r\n');

  const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `meeting_${booking.id}.ics`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};
