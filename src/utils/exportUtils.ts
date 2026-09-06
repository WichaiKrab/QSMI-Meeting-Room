import { Booking, Room } from '../types';
import { formatThaiDate, formatThaiTime } from './thaiDate';

/**
 * Export bookings to CSV file matching the updated booking form fields
 * with UTF-8 BOM for full Microsoft Excel Thai language compatibility.
 */
export const exportBookingsToCSV = (
  bookings: Booking[],
  rooms: Room[],
  fileName = 'meeting_bookings_export.csv'
): { success: boolean; message?: string; count?: number } => {
  if (!bookings || bookings.length === 0) {
    return { success: false, message: 'ไม่พบข้อมูลรายการจองสำหรับการส่งออก' };
  }

  // Updated headers matching all fields of the new booking form
  const headers = [
    'รหัสการจอง',
    'หัวข้อการประชุม',
    'ห้องประชุม',
    'สถานที่/อาคาร',
    'ฝ่าย/กลุ่มงาน',
    'ชื่อ-นามสกุล ผู้ขอจอง',
    'เบอร์โทรศัพท์',
    'อีเมล',
    'หน่วยงานภายนอก/สถาบันเข้าร่วม',
    'วันที่เริ่มต้น',
    'วันที่สิ้นสุด',
    'เวลาเริ่มต้น',
    'เวลาสิ้นสุด',
    'จำนวนผู้เข้าร่วม (คน)',
    'อาหารว่าง (ชุด)',
    'อาหารกลางวัน (กล่อง/ชุด)',
    'เครื่องดื่ม (แก้ว/ขวด)',
    'อุปกรณ์ที่ขอใช้',
    'รูปแบบการจัดโต๊ะ',
    'รูปแบบการประชุม',
    'หมายเหตุ/รายละเอียดเพิ่มเติม',
    'สถานะการจอง',
    'เหตุผลการไม่อนุมัติ/ยกเลิก',
    'วันที่ยื่นคำขอ',
    'วันที่ยกเลิก'
  ];

  const rows = bookings.map((b) => {
    const room = rooms.find((r) => r.id === b.roomId);
    const roomName = room ? room.name : 'ไม่ระบุห้อง';
    const roomLocation = room?.location || '-';
    const bStart = new Date(b.startTime);
    const bEnd = new Date(b.endTime);

    const startDateThai = formatThaiDate(bStart, { day: '2-digit', month: '2-digit', year: 'numeric' });
    const endDateThai = formatThaiDate(bEnd, { day: '2-digit', month: '2-digit', year: 'numeric' });
    const startTimeVal = formatThaiTime(bStart, { hour: '2-digit', minute: '2-digit' }).replace(':', '.');
    const endTimeVal = formatThaiTime(bEnd, { hour: '2-digit', minute: '2-digit' }).replace(':', '.');

    let statusThai = 'อนุมัติแล้ว';
    if (b.isBlocked) statusThai = 'ปิดกั้น/ปรับปรุง';
    else if (b.status === 'pending') statusThai = 'รออนุมัติ';
    else if (b.status === 'approved') statusThai = 'อนุมัติแล้ว';
    else if (b.status === 'rejected') statusThai = 'ไม่อนุมัติ';
    else if (b.status === 'cancelled') statusThai = 'ยกเลิกแล้ว';

    const eqStr = Array.isArray(b.equipment)
      ? b.equipment.join(', ')
      : (b.equipment || '-');

    const externalInst = b.institute && b.institute.trim() !== '' ? b.institute.trim() : 'ไม่มี';

    const seatingStr = b.seatingSetup && b.seatingSetup.trim() !== '' ? b.seatingSetup : 'ตามมาตรฐานห้อง';

    const noteStr = b.note && b.note.trim() !== '' ? b.note.replace(/"/g, '""') : '-';

    const reasonStr = (b.rejectionReason || b.cancellationReason || '-').replace(/"/g, '""');

    const createdDateThai = formatThaiDate(new Date(b.createdAt), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const cancelDateThai = b.cancelledAt
      ? formatThaiDate(new Date(b.cancelledAt), {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric'
        })
      : '-';

    // Format fields with quotes, and preserve leading zeroes for phone & time in Excel
    return [
      `"${b.id}"`,
      `"${(b.topic || '').replace(/"/g, '""')}"`,
      `"${roomName.replace(/"/g, '""')}"`,
      `"${roomLocation.replace(/"/g, '""')}"`,
      `"${(b.department || '').replace(/"/g, '""')}"`,
      `"${(b.requesterName || '').replace(/"/g, '""')}"`,
      `"=""${b.phone || ''}"""`,
      `"${(b.email || '').replace(/"/g, '""')}"`,
      `"${externalInst.replace(/"/g, '""')}"`,
      `"${startDateThai}"`,
      `"${endDateThai}"`,
      `"=""${startTimeVal}"""`,
      `"=""${endTimeVal}"""`,
      b.participants || 0,
      b.snacks || 0,
      b.lunch || 0,
      b.drinks || 0,
      `"${eqStr.replace(/"/g, '""')}"`,
      `"${seatingStr.replace(/"/g, '""')}"`,
      `"${(b.meetingType || 'Onsite').replace(/"/g, '""')}"`,
      `"${noteStr}"`,
      `"${statusThai}"`,
      `"${reasonStr}"`,
      `"${createdDateThai}"`,
      `"${cancelDateThai}"`
    ].join(',');
  });

  // UTF-8 BOM for Microsoft Excel Thai language compatibility
  const BOM = '\uFEFF';
  const csvContent = 'data:text/csv;charset=utf-8,' + BOM + [headers.join(','), ...rows].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  return { success: true, count: bookings.length };
};
