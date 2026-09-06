import { Room, UserAccount, Booking, Department } from '../types';

export const DEFAULT_ROOM_COLOR = 'bg-blue-100 border-blue-300 text-blue-800';

export const INITIAL_DEPARTMENTS: Department[] = [
  {
    id: 'dept-1',
    name: 'ฝ่ายบริหารงานทั่วไป',
    code: 'ADMIN',
    headName: 'นายสรวิชญ์ บัญชาการ',
    headUsername: 'mgr3',
    phone: '02-252-0161 ต่อ 110',
    email: 'general.admin@qsmi.or.th',
    building: 'ตึกอำนวยการ ชั้น 1',
    description: 'บริหารจัดการงานสารบรรณ พัสดุ บุคลากร และประสานงานกลางสถานเสาวภา',
    color: 'bg-red-500'
  },
  {
    id: 'dept-2',
    name: 'ฝ่ายบริการและวิจัยคลินิก',
    code: 'CLINIC',
    headName: 'พญ. วรรณภา มั่นคง',
    headUsername: 'mgr1',
    phone: '02-252-0161 ต่อ 120',
    email: 'clinic.service@qsmi.or.th',
    building: 'ตึกสภานายิกา ชั้น 1-2',
    description: 'คลินิกเสริมภูมิคุ้มกันและฉีดวัคซีน คลินิกสัตว์เลี้ยง และงานวิจัยทางคลินิก',
    color: 'bg-blue-500'
  },
  {
    id: 'dept-3',
    name: 'ฝ่ายวิจัยและพัฒนา',
    code: 'RND',
    headName: 'ดร. จินตนา เจริญศิลป์',
    headUsername: 'mgr2',
    phone: '02-252-0161 ต่อ 130',
    email: 'rnd.research@qsmi.or.th',
    building: 'ตึกวิจัย ชั้น 3',
    description: 'วิจัยพัฒนายา ชีววัตถุ แอนติบอดี และเซรุ่มชนิดใหม่',
    color: 'bg-indigo-500'
  },
  {
    id: 'dept-4',
    name: 'สวนงู (Snake Farm)',
    code: 'SNAKE',
    headName: 'นายธนาธิป สวนงู',
    phone: '02-252-0161 ต่อ 140',
    email: 'snakefarm@qsmi.or.th',
    building: 'อาคารเฉลิมพระเกียรติฯ สวนงู',
    description: 'เพาะเลี้ยงงูพิษ รีดพิษงู สาธิตจับงู และให้ความรู้แก่ประชาชน',
    color: 'bg-emerald-500'
  },
  {
    id: 'dept-5',
    name: 'ฝ่ายผลิตเซรุ่มแก้พิษงู',
    code: 'SERUM',
    headName: 'นางสาวพิมพา เลิศไพบูลย์',
    phone: '02-252-0161 ต่อ 150',
    email: 'serum.prod@qsmi.or.th',
    building: 'ตึกผลิตเซรุ่ม',
    description: 'ผลิตเซรุ่มแก้พิษงูระบบประสาทและระบบโลหิตตามมาตรฐาน WHO/GMP',
    color: 'bg-amber-500'
  },
  {
    id: 'dept-6',
    name: 'ฝ่ายผลิตวัคซีน',
    code: 'VACCINE',
    headName: 'ดร. อัมพร ผลิตวัคซีน',
    phone: '02-252-0161 ต่อ 160',
    email: 'vaccine.prod@qsmi.or.th',
    building: 'ตึกผลิตวัคซีน',
    description: 'ผลิตวัคซีนป้องกันโรคพิษสุนัขบ้า และวัคซีนบีซีจีสำหรับป้องกันวัณโรค',
    color: 'bg-teal-500'
  },
  {
    id: 'dept-7',
    name: 'ฝ่ายประกันคุณภาพ',
    code: 'QA',
    headName: 'นายสุรชัย มาตรฐาน',
    phone: '02-252-0161 ต่อ 170',
    email: 'qa.qc@qsmi.or.th',
    building: 'ตึกประกันคุณภาพ ชั้น 2',
    description: 'ควบคุมคุณภาพผลิตภัณฑ์และการรับรองมาตรฐานห้องปฏิบัติการ ISO 17025',
    color: 'bg-purple-500'
  },
  {
    id: 'dept-8',
    name: 'ฝ่ายสนับสนุนอาคารและเครื่องจักรกล',
    code: 'FACILITY',
    headName: 'นายอนุรักษ์ วิศวกรรม',
    phone: '02-252-0161 ต่อ 180',
    email: 'facility@qsmi.or.th',
    building: 'ตึกซ่อมบำรุงและพลังงาน',
    description: 'ดูแลความพร้อมอาคารสถานที่ ระบบไฟฟ้า ปรับอากาศ และเครื่องจักรในโรงงาน',
    color: 'bg-slate-600'
  },
  {
    id: 'dept-9',
    name: 'ฝ่ายการเงินและพัสดุ',
    code: 'FINANCE',
    headName: 'นางกาญจนา เงินทอง',
    phone: '02-252-0161 ต่อ 190',
    email: 'finance@qsmi.or.th',
    building: 'ตึกอำนวยการ ชั้น 2',
    description: 'งบประมาณ การเงิน บัญชี และการจัดซื้อจัดจ้างพัสดุ',
    color: 'bg-cyan-600'
  },
  {
    id: 'dept-10',
    name: 'ฝ่ายเทคโนโลยีสารสนเทศ',
    code: 'IT',
    headName: 'นายเอกชัย สิทธิการ',
    phone: '02-252-0161 ต่อ 101',
    email: 'it.support@qsmi.or.th',
    building: 'ตึกอำนวยการ ชั้น 3',
    description: 'พัฒนาระบบเทคโนโลยีสารสนเทศ เครือข่าย และระบบความปลอดภัยไซเบอร์',
    color: 'bg-rose-500'
  }
];

export const DEFAULT_BOOKING_EQUIPMENT: string[] = [
  'LCD Projector',
  'Computer / Notebook',
  'ถ่ายภาพ'
];

export const PRESET_EQUIPMENT: string[] = [
  'LCD Projector',
  'Computer / Notebook',
  'Smart TV 55-65 นิ้ว',
  'ระบบเครื่องเสียงและไมโครโฟน',
  'กล้องประชุมทางไกล (Video Conference)',
  'WiFi ความเร็วสูง',
  'Whiteboard / ปากกาไวท์บอร์ด',
  'ปลั๊กไฟประจำโต๊ะประชุม',
  'โพเดียมบรรยาย',
  'ถ่ายภาพ',
  'เครื่องปรับอากาศ'
];

export const PRESET_SEATING: string[] = [
  'Classroom (ห้องเรียน)',
  'Theater (โรงละคร/สัมมนา)',
  'Meeting (U) (จัดโต๊ะรูปตัว U)',
  'Boardroom (โต๊ะประชุมผู้บริหาร)',
  'จัดเลี้ยงพระ / งานพิธีการ'
];

export const normalizeSeatingName = (seat?: string | null): string => {
  if (!seat) return '';
  const s = seat.trim();
  if (!s) return '';
  if (s === 'Classroom') return 'Classroom (ห้องเรียน)';
  if (s === 'Theater') return 'Theater (โรงละคร/สัมมนา)';
  if (s === 'Meeting (U)' || s === 'Meeting U' || s === 'U-Shape') return 'Meeting (U) (จัดโต๊ะรูปตัว U)';
  if (s === 'Boardroom') return 'Boardroom (โต๊ะประชุมผู้บริหาร)';
  if (s === 'จัดเลี้ยงพระ') return 'จัดเลี้ยงพระ / งานพิธีการ';
  return s;
};

export const normalizeEquipmentName = (eq?: string | null): string => {
  if (!eq) return '';
  const e = eq.trim();
  if (!e) return '';
  if (e === 'Projector' || e === 'โปรเจคเตอร์') return 'LCD Projector';
  if (e === 'Smart TV' || e === 'ทีวี') return 'Smart TV 55-65 นิ้ว';
  if (e === 'ไมโครโฟน' || e === 'ไมค์') return 'ระบบเครื่องเสียงและไมโครโฟน';
  if (e === 'Video Conference' || e === 'ประชุมทางไกล') return 'กล้องประชุมทางไกล (Video Conference)';
  return e;
};

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'r1',
    name: 'ห้องประชุม ชั้น 2 ตึกอำนวยการ (10 ที่นั่ง)',
    color: 'bg-blue-100 border-blue-300 text-blue-800',
    isActive: true,
    capacity: 10,
    location: 'ตึกอำนวยการ ชั้น 2',
    hasSpecialSeating: true,
    description: 'ห้องประชุมขนาดกะทัดรัด เหมาะสำหรับการประชุมทีมย่อยและการหารือภายใน',
    equipment: ['LCD Projector', 'ระบบเครื่องเสียงและไมโครโฟน', 'WiFi ความเร็วสูง', 'Whiteboard / ปากกาไวท์บอร์ด'],
    seatingOptions: ['Meeting (U) (จัดโต๊ะรูปตัว U)', 'Boardroom (โต๊ะประชุมผู้บริหาร)']
  },
  {
    id: 'r2',
    name: 'ห้องสมุด ตึกอำนวยการ (10 ที่นั่ง)',
    color: 'bg-emerald-100 border-emerald-300 text-emerald-800',
    isActive: true,
    capacity: 10,
    location: 'ตึกอำนวยการ ชั้น 1',
    hasSpecialSeating: false,
    description: 'บรรยากาศเงียบสงบ เหมาะกับการประชุมทางวิชาการและอ่านบทความ',
    equipment: ['Smart TV 55-65 นิ้ว', 'WiFi ความเร็วสูง', 'ปลั๊กไฟประจำโต๊ะประชุม'],
    seatingOptions: ['Classroom (ห้องเรียน)', 'Meeting (U) (จัดโต๊ะรูปตัว U)']
  },
  {
    id: 'r3',
    name: 'ห้องสมุดวิชาการ ตึกอำนวยการ (10 ที่นั่ง)',
    color: 'bg-cyan-100 border-cyan-300 text-cyan-800',
    isActive: true,
    capacity: 10,
    location: 'ตึกอำนวยการ ชั้น 2',
    hasSpecialSeating: false,
    description: 'ห้องประชุมวิชาการ พร้อมระบบเชื่อมต่อเอกสารงานวิจัย',
    equipment: ['LCD Projector', 'Whiteboard / ปากกาไวท์บอร์ด', 'WiFi ความเร็วสูง'],
    seatingOptions: ['Classroom (ห้องเรียน)', 'Meeting (U) (จัดโต๊ะรูปตัว U)']
  },
  {
    id: 'r4',
    name: 'ห้องพระเทพ ตึกอำนวยการ (6 ที่นั่ง)',
    color: 'bg-amber-100 border-amber-300 text-amber-800',
    isActive: true,
    capacity: 6,
    location: 'ตึกอำนวยการ ชั้น 3',
    hasSpecialSeating: false,
    description: 'ห้องรับรองและประชุมผู้บริหารระดับสูง บรรยากาศเป็นทางการและเป็นส่วนตัว',
    equipment: ['Smart TV 55-65 นิ้ว', 'กล้องประชุมทางไกล (Video Conference)', 'ระบบเครื่องเสียงและไมโครโฟน', 'WiFi ความเร็วสูง'],
    seatingOptions: ['Boardroom (โต๊ะประชุมผู้บริหาร)']
  },
  {
    id: 'r5',
    name: 'ห้อง ร.6 ตึกอำนวยการ (6 ที่นั่ง)',
    color: 'bg-purple-100 border-purple-300 text-purple-800',
    isActive: true,
    capacity: 6,
    location: 'ตึกอำนวยการ ชั้น 3',
    hasSpecialSeating: false,
    description: 'ห้องประชุมผู้บริหาร ตกแต่งเรียบหรู พร้อมสิ่งอำนวยความสะดวกครบครัน',
    equipment: ['Smart TV 55-65 นิ้ว', 'WiFi ความเร็วสูง', 'ระบบเครื่องเสียงและไมโครโฟน'],
    seatingOptions: ['Boardroom (โต๊ะประชุมผู้บริหาร)']
  },
  {
    id: 'r6',
    name: 'หอประวัติและนิทรรศการพิษธรรมชาติ ตึกอำนวยการ (20 ที่นั่ง)',
    color: 'bg-teal-100 border-teal-300 text-teal-800',
    isActive: true,
    capacity: 20,
    location: 'ตึกอำนวยการ ชั้น 1',
    hasSpecialSeating: false,
    description: 'ห้องประชุมและจัดกิจกรรมบรรยายพิเศษ รายล้อมด้วยนิทรรศการประวัติศาสตร์',
    equipment: ['LCD Projector', 'ระบบเครื่องเสียงและไมโครโฟน', 'Whiteboard / ปากกาไวท์บอร์ด', 'WiFi ความเร็วสูง'],
    seatingOptions: ['Classroom (ห้องเรียน)', 'Theater (โรงละคร/สัมมนา)', 'Meeting (U) (จัดโต๊ะรูปตัว U)']
  },
  {
    id: 'r7',
    name: 'ห้องประชุม ชั้น 2 ตึกสภานายิกา (20 ที่นั่ง)',
    color: 'bg-indigo-100 border-indigo-300 text-indigo-800',
    isActive: true,
    capacity: 20,
    location: 'ตึกสภานายิกา ชั้น 2',
    hasSpecialSeating: false,
    description: 'ห้องประชุมขนาดกลาง รองรับการประชุมคณะกรรมการและกลุ่มงานใหญ่',
    equipment: ['LCD Projector', 'กล้องประชุมทางไกล (Video Conference)', 'ระบบเครื่องเสียงและไมโครโฟน', 'WiFi ความเร็วสูง'],
    seatingOptions: ['Classroom (ห้องเรียน)', 'Meeting (U) (จัดโต๊ะรูปตัว U)', 'Boardroom (โต๊ะประชุมผู้บริหาร)']
  },
  {
    id: 'r8',
    name: 'ห้องประชุมใหญ่ ชั้น 5 ตึกสภานายิกา (200 ที่นั่ง)',
    color: 'bg-rose-100 border-rose-300 text-rose-800',
    isActive: true,
    capacity: 200,
    location: 'ตึกสภานายิกา ชั้น 5',
    hasSpecialSeating: true,
    description: 'ห้องประชุมใหญ่/หอประชุม รองรับการสัมมนา การฝึกอบรม และพิธีการสำคัญ',
    equipment: ['LCD Projector', 'โพเดียมบรรยาย', 'ระบบเครื่องเสียงและไมโครโฟน', 'กล้องประชุมทางไกล (Video Conference)', 'WiFi ความเร็วสูง'],
    seatingOptions: ['Classroom (ห้องเรียน)', 'Theater (โรงละคร/สัมมนา)', 'Meeting (U) (จัดโต๊ะรูปตัว U)', 'จัดเลี้ยงพระ / งานพิธีการ']
  }
];

export const CORPORATE_USERS: UserAccount[] = [
  // 1. Admin Role (ผู้ดูแลระบบ)
  {
    username: 'admin1',
    name: 'นายเอกชัย สิทธิการ',
    department: 'ฝ่ายบริหารงานทั่วไป',
    role: 'admin',
    title: 'ผู้ดูแลระบบกลาง (Admin)',
    avatarColor: 'bg-purple-600',
    email: 'admin.ekkachai@qsmi.or.th',
    phone: '0810001122'
  },
  // 2. Manager Roles (หัวหน้าฝ่าย)
  {
    username: 'mgr1',
    name: 'พญ. วรรณภา มั่นคง',
    department: 'ฝ่ายบริการและวิจัยคลินิก',
    role: 'manager',
    title: 'หัวหน้าฝ่ายบริการและวิจัยคลินิก',
    avatarColor: 'bg-blue-600',
    email: 'wannapa.m@qsmi.or.th',
    phone: '0812345601'
  },
  {
    username: 'mgr2',
    name: 'ดร. จินตนา เจริญศิลป์',
    department: 'ฝ่ายวิจัยและพัฒนา',
    role: 'manager',
    title: 'หัวหน้าฝ่ายวิจัยและพัฒนา',
    avatarColor: 'bg-indigo-600',
    email: 'jintana.rnd@qsmi.or.th',
    phone: '0865551234'
  },
  {
    username: 'mgr3',
    name: 'นายสรวิชญ์ บัญชาการ',
    department: 'ฝ่ายบริหารงานทั่วไป',
    role: 'manager',
    title: 'หัวหน้าฝ่ายบริหารงานทั่วไป',
    avatarColor: 'bg-emerald-600',
    email: 'sorawit.admin@qsmi.or.th',
    phone: '0823334455'
  },
  // 3. Employee Roles (พนักงานทั่วไป)
  {
    username: 'user1',
    name: 'สมชาย รักงาน',
    department: 'ฝ่ายบริหารงานทั่วไป',
    role: 'employee',
    title: 'เจ้าหน้าที่บริหารงานทั่วไป',
    avatarColor: 'bg-red-500',
    email: 'somchai.admin@qsmi.or.th',
    phone: '0812345678'
  },
  {
    username: 'user2',
    name: 'น.สพ. กิตติพงษ์ สดใส',
    department: 'ฝ่ายบริการและวิจัยคลินิก',
    role: 'employee',
    title: 'สัตวแพทย์ปฏิบัติการ',
    avatarColor: 'bg-teal-500',
    email: 'kittipong.k@qsmi.or.th',
    phone: '0891234567'
  },
  {
    username: 'user3',
    name: 'นายธนาธิป สวนงู',
    department: 'สวนงู',
    role: 'employee',
    title: 'เจ้าหน้าที่ประจำสวนงู',
    avatarColor: 'bg-amber-500',
    email: 'thanatip.s@qsmi.or.th',
    phone: '0854445566'
  },
  {
    username: 'user4',
    name: 'นางสาวพิมพา เลิศไพบูลย์',
    department: 'ฝ่ายผลิตเซรุ่ม',
    role: 'employee',
    title: 'นักวิทยาศาสตร์การแพทย์',
    avatarColor: 'bg-pink-500',
    email: 'pimpa.serum@qsmi.or.th',
    phone: '0867778899'
  },
  {
    username: 'user5',
    name: 'ดร. อัมพร ผลิตวัคซีน',
    department: 'ฝ่ายผลิตวัคซีน',
    role: 'employee',
    title: 'นักวิจัยอาวุโส',
    avatarColor: 'bg-cyan-500',
    email: 'amporn.v@qsmi.or.th',
    phone: '0898765432'
  },
  {
    username: 'user6',
    name: 'นายสุรชัย มาตรฐาน',
    department: 'ฝ่ายประกันคุณภาพ',
    role: 'employee',
    title: 'เจ้าหน้าที่ควบคุมคุณภาพ',
    avatarColor: 'bg-orange-500',
    email: 'surachai.qa@qsmi.or.th',
    phone: '0841112233'
  },
  {
    username: 'user7',
    name: 'นายอนุรักษ์ วิศวกรรม',
    department: 'ฝ่ายสนับสนุนอาคารและเครื่องจักรกล',
    role: 'employee',
    title: 'วิศวกรซ่อมบำรุง',
    avatarColor: 'bg-slate-500',
    email: 'facility@qsmi.or.th',
    phone: '0819998877',
    status: 'approved'
  },
  // 4. Pending Applicants awaiting Admin Approval
  {
    username: 'napa.reg',
    password: '1234',
    name: 'น.ส. นภาภรณ์ สมัครใจ',
    department: 'ฝ่ายวิจัยและพัฒนา',
    role: 'employee',
    title: 'ผู้ช่วยนักวิจัย (ขอสิทธิ์ใช้งานใหม่)',
    avatarColor: 'bg-teal-600',
    email: 'napa.reg@qsmi.or.th',
    phone: '0894567890',
    status: 'pending',
    registeredAt: new Date(Date.now() - 3600000 * 5).toISOString()
  },
  {
    username: 'panu.reg',
    password: '1234',
    name: 'นายภาณุพงศ์ ดวงแก้ว',
    department: 'ฝ่ายบริการและวิจัยคลินิก',
    role: 'manager',
    title: 'รองหัวหน้าฝ่ายคลินิก (ขอสิทธิ์ระดับหัวหน้าฝ่าย)',
    avatarColor: 'bg-indigo-600',
    email: 'panu.clinic@qsmi.or.th',
    phone: '0867891234',
    status: 'pending',
    registeredAt: new Date(Date.now() - 3600000 * 24).toISOString()
  }
];

export const ADMIN_PASSWORD = 'admin123';
export const OWNER_EMAILS = ['qsmimeeting@gmail.com'];

// Generate sample dates relative to today
const getIsoForHour = (daysOffset: number, hour: number, minute: number = 0) => {
  const d = new Date();
  d.setDate(d.getDate() + daysOffset);
  d.setHours(hour, minute, 0, 0);
  return d.toISOString();
};

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'MR-00001',
    roomId: 'r1',
    topic: 'การประชุมสรุปงบประมาณประจำไตรมาส',
    department: 'ฝ่ายบริหารงานทั่วไป',
    requesterName: 'สมชาย รักงาน',
    phone: '0812345678',
    email: 'somchai.admin@qsmi.or.th',
    institute: 'สำนักงานบริหาร สภากาชาดไทย',
    startTime: getIsoForHour(0, 9, 0),
    endTime: getIsoForHour(0, 11, 30),
    participants: 8,
    snacks: 8,
    lunch: 8,
    drinks: 8,
    equipment: ['LCD Projector', 'Computer / Notebook'],
    meetingType: 'Onsite',
    seatingSetup: 'Classroom (ห้องเรียน)',
    createdAt: getIsoForHour(-2, 10, 0),
    status: 'approved',
    isBlocked: false,
    syncedToGoogleCalendar: true
  },
  {
    id: 'MR-00002',
    roomId: 'r7',
    topic: 'สัมมนาการพัฒนาวัคซีนและเซรุ่มแก้พิษงู',
    department: 'ฝ่ายผลิตวัคซีน',
    requesterName: 'ดร. อัมพร ผลิตวัคซีน',
    phone: '0898765432',
    email: 'amporn.v@qsmi.or.th',
    institute: 'คณะแพทยศาสตร์ จุฬาลงกรณ์มหาวิทยาลัย',
    startTime: getIsoForHour(0, 13, 0),
    endTime: getIsoForHour(0, 16, 30),
    participants: 18,
    snacks: 20,
    lunch: 0,
    drinks: 20,
    equipment: ['LCD Projector', 'ถ่ายภาพ / บันทึกภาพกิจกรรม'],
    meetingType: 'Online',
    meetingLink: 'https://meet.google.com/qsm-meet-vaccine',
    createdAt: getIsoForHour(-1, 14, 20),
    status: 'approved',
    isBlocked: false,
    syncedToGoogleCalendar: true
  },
  {
    id: 'MR-00003',
    roomId: 'r8',
    topic: 'ประชุมวิชาการพิษวิทยาและโรคเขตร้อนระดับชาติ',
    department: 'ฝ่ายวิจัยและพัฒนา',
    requesterName: 'ดร. จินตนา เจริญศิลป์',
    phone: '0865551234',
    email: 'jintana.rnd@qsmi.or.th',
    institute: 'กรมวิทยาศาสตร์การแพทย์ กระทรวงสาธารณสุข',
    startTime: getIsoForHour(1, 8, 30),
    endTime: getIsoForHour(2, 17, 0), // Multi-day
    participants: 150,
    snacks: 150,
    lunch: 150,
    drinks: 150,
    equipment: ['LCD Projector', 'Computer / Notebook', 'ถ่ายภาพ / บันทึกภาพกิจกรรม'],
    meetingType: 'Onsite',
    seatingSetup: 'Classroom (ห้องเรียน)',
    createdAt: getIsoForHour(-3, 9, 15),
    status: 'approved',
    isBlocked: false
  },
  {
    id: 'MR-00004',
    roomId: 'r2',
    topic: 'ตรวจสอบรายงานคุณภาพห้องปฏิบัติการ (Audit ISO/IEC 17025)',
    department: 'ฝ่ายประกันคุณภาพ',
    requesterName: 'นายสุรชัย มาตรฐาน',
    phone: '0841112233',
    email: 'surachai.qa@qsmi.or.th',
    startTime: getIsoForHour(0, 14, 0),
    endTime: getIsoForHour(0, 16, 0),
    participants: 6,
    snacks: 6,
    lunch: 0,
    drinks: 6,
    equipment: ['Computer / Notebook'],
    meetingType: 'Onsite',
    createdAt: getIsoForHour(0, 7, 45),
    status: 'pending', // Pending approval for Admin to review
    isBlocked: false
  },
  {
    id: 'MR-00005',
    roomId: 'r4',
    topic: 'ซ่อมบำรุงระบบปรับอากาศและเครื่องเสียง',
    department: 'ฝ่ายสนับสนุนอาคารและเครื่องจักรกล',
    requesterName: 'นายอนุรักษ์ วิศวกรรม',
    phone: '0819998877',
    email: 'facility@qsmi.or.th',
    startTime: getIsoForHour(0, 8, 30),
    endTime: getIsoForHour(0, 12, 0),
    participants: 0,
    meetingType: 'Onsite',
    createdAt: getIsoForHour(-1, 8, 0),
    status: 'approved',
    isBlocked: true // Maintenance Block
  },
  {
    id: 'MR-00006',
    roomId: 'r3',
    topic: 'อบรมเชิงปฏิบัติการการตรวจวิเคราะห์ทางคลินิก',
    department: 'ฝ่ายบริการและวิจัยคลินิก',
    requesterName: 'น.สพ. กิตติพงษ์ สดใส',
    username: 'user2',
    phone: '0891234567',
    email: 'kittipong.k@qsmi.or.th',
    startTime: getIsoForHour(1, 10, 0),
    endTime: getIsoForHour(1, 12, 0),
    participants: 12,
    snacks: 12,
    lunch: 0,
    drinks: 12,
    equipment: ['LCD Projector', 'Computer / Notebook'],
    meetingType: 'Onsite',
    createdAt: getIsoForHour(-1, 16, 0),
    status: 'pending', // Pending department manager approval
    isBlocked: false
  },
  {
    id: 'MR-00007',
    roomId: 'r6',
    topic: 'ประชุมระดมความคิดยุทธศาสตร์แผนกประจำปี 2568',
    department: 'ฝ่ายบริหารงานทั่วไป',
    requesterName: 'สมชาย รักงาน',
    username: 'user1',
    phone: '0812345678',
    email: 'somchai.admin@qsmi.or.th',
    startTime: getIsoForHour(3, 13, 30),
    endTime: getIsoForHour(3, 16, 30),
    participants: 15,
    snacks: 15,
    lunch: 0,
    drinks: 15,
    equipment: ['LCD Projector'],
    meetingType: 'Onsite',
    createdAt: getIsoForHour(-4, 11, 0),
    status: 'cancelled', // Cancelled booking example
    cancelledAt: getIsoForHour(-1, 9, 30),
    cancellationReason: 'เลื่อนกำหนดการประชุมเนื่องจากติดภารกิจตรวจราชการด่วน',
    isBlocked: false
  }
];
