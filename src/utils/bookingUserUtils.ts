import { Booking, UserAccount } from '../types';

/**
 * ตรวจสอบว่าผู้ขอจองในการจองห้องประชุมนี้ เป็นบัญชีที่ถูกลบออกจากระบบหรือพ้นสภาพแล้วหรือไม่
 * 1. ตรวจสอบจาก flag requesterAccountStatus === 'deleted'
 * 2. ตรวจสอบจาก username: หากเคยมี username ผูกไว้ แต่ไม่พบบัญชีใน users แสดงว่าบัญชีถูกลบแล้ว
 */
export function isBookingRequesterDeleted(
  booking: Booking,
  users?: UserAccount[]
): boolean {
  if (booking.requesterAccountStatus === 'deleted') {
    return true;
  }

  // หากไม่มีข้อมูล users ให้ถือตาม flag ใน booking
  if (!users || users.length === 0) {
    return false;
  }

  // หากการจองนี้ระบุ username ของบัญชี SSO ไว้ แต่ไม่พบบัญชีนี้ในฐานข้อมูล users แล้ว
  if (booking.username && booking.username.trim() !== '') {
    const foundUser = users.find(
      (u) => u.username.toLowerCase() === booking.username!.trim().toLowerCase()
    );
    if (!foundUser) {
      return true;
    }
  }

  return false;
}

/**
 * ดึงข้อความสถานะบัญชีของผู้ขอจอง เช่น "อดีตผู้ใช้งาน / พ้นสภาพ" หรือ null
 */
export function getRequesterAccountLabel(
  booking: Booking,
  users?: UserAccount[]
): string | null {
  if (isBookingRequesterDeleted(booking, users)) {
    return 'อดีตผู้ใช้งาน / พ้นสภาพ';
  }
  return null;
}
