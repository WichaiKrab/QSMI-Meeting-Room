import React, { useState, useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from 'recharts';
import {
  Calendar as CalendarIcon,
  BarChart3,
  Users,
  Download,
  Building2,
  Award,
  TrendingUp,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  X
} from 'lucide-react';
import { Room, Booking } from '../types';
import { formatThaiDate, formatThaiTime } from '../utils/thaiDate';
import { exportBookingsToCSV } from '../utils/exportUtils';

const CHART_COLORS = [
  '#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8',
  '#82ca9d', '#ffc658', '#d0ed57', '#a4de6c', '#ef4444', '#06b6d4'
];

interface AdminReportsProps {
  bookings: Booking[];
  rooms: Room[];
}

export const AdminReports: React.FC<AdminReportsProps> = ({ bookings, rooms }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const hasDateRange = Boolean(startDate && endDate && startDate <= endDate);
  const isExportReady = hasDateRange;

  // 1. Stat: Total usage per room
  const roomStats = useMemo(() => {
    const map: Record<string, { id: string; name: string; count: number; people: number }> = {};
    rooms.forEach((r) => {
      map[r.id] = { id: r.id, name: r.name, count: 0, people: 0 };
    });

    let start: Date | null = null;
    let end: Date | null = null;
    if (startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    }

    bookings.forEach((b) => {
      if (b.status === 'rejected' || b.isBlocked) return;
      const bDate = new Date(b.startTime);
      if (start && end) {
        if (bDate < start || bDate > end) return;
      }
      if (!map[b.roomId]) {
        map[b.roomId] = { id: b.roomId, name: 'ห้องเดิม (ถูกลบ)', count: 0, people: 0 };
      }
      map[b.roomId].count += 1;
      map[b.roomId].people += b.participants || 0;
    });

    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [bookings, rooms, startDate, endDate]);

  // 2. Stat: Department usage for Stacked Chart
  const deptStats = useMemo(() => {
    let start: Date | null = null;
    let end: Date | null = null;
    if (startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    }

    const depts = new Set<string>();
    const dataMap: Record<string, any> = {};
    rooms.forEach((r) => {
      dataMap[r.id] = { name: r.name.split(' (')[0] };
    });

    bookings.forEach((b) => {
      if (b.status === 'rejected' || b.isBlocked) return;
      const bDate = new Date(b.startTime);
      if (start && end) {
        if (bDate < start || bDate > end) return;
      }
      if (!dataMap[b.roomId]) {
        dataMap[b.roomId] = { name: 'ห้องเดิม (ถูกลบ)' };
      }
      const deptName = b.department || 'ไม่ระบุ';
      depts.add(deptName);
      if (!dataMap[b.roomId][deptName]) dataMap[b.roomId][deptName] = 0;
      dataMap[b.roomId][deptName] += 1;
    });

    // Ensure the order of rooms matches Chart 1 (roomStats) exactly
    const sortedData = roomStats.map((r) => dataMap[r.id]).filter(Boolean);
    return { data: sortedData, departments: Array.from(depts) };
  }, [bookings, rooms, startDate, endDate, roomStats]);

  // 3. Stat: Department usage aggregated table
  const deptTableData = useMemo(() => {
    let start: Date | null = null;
    let end: Date | null = null;
    if (startDate && endDate) {
      start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    }

    const map: Record<string, { deptName: string; count: number; people: number }> = {};

    bookings.forEach((b) => {
      if (b.status === 'rejected' || b.isBlocked) return;
      const bDate = new Date(b.startTime);
      if (start && end) {
        if (bDate < start || bDate > end) return;
      }
      const deptName = b.department || 'ไม่ระบุ';
      if (!map[deptName]) {
        map[deptName] = { deptName, count: 0, people: 0 };
      }
      map[deptName].count += 1;
      map[deptName].people += b.participants || 0;
    });

    return Object.values(map).sort((a, b) => b.count - a.count);
  }, [bookings, startDate, endDate]);

  const totalCount = roomStats.reduce((sum, item) => sum + item.count, 0);
  const totalPeople = roomStats.reduce((sum, item) => sum + item.people, 0);
  const topRoom = roomStats.length > 0 && roomStats[0].count > 0 ? roomStats[0] : null;
  const topDept = deptTableData.length > 0 && deptTableData[0].count > 0 ? deptTableData[0] : null;

  const [exportNotice, setExportNotice] = useState<{ message: string; type: 'info' | 'error' | 'success' } | null>(null);

  // Export CSV with updated form fields and BOM encoding
  const handleExportCSV = () => {
    setExportNotice(null);
    if (!startDate || !endDate) {
      setExportNotice({
        message: 'กรุณาเลือกวันที่เริ่มต้นและวันที่สิ้นสุดก่อนกดส่งออก',
        type: 'error'
      });
      return;
    }
    if (startDate > endDate) {
      setExportNotice({
        message: 'วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด กรุณาเลือกช่วงเวลาใหม่',
        type: 'error'
      });
      return;
    }

    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);

    const filtered = bookings.filter((b) => {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      return bEnd >= start && bStart <= end;
    });

    if (filtered.length === 0) {
      setExportNotice({
        message: 'ไม่พบข้อมูลการจองในช่วงวันที่เลือก กรุณาเลือกช่วงเวลาใหม่',
        type: 'error'
      });
      return;
    }

    const result = exportBookingsToCSV(
      filtered,
      rooms,
      `executive_meeting_report_${startDate}_to_${endDate}.csv`
    );

    if (result.success) {
      setExportNotice({
        message: `ส่งออกไฟล์ Excel (CSV) เรียบร้อยแล้ว จำนวน ${result.count} รายการ (หัวตารางตรงตามแบบฟอร์มใหม่)`,
        type: 'success'
      });
      setTimeout(() => setExportNotice(null), 5000);
    }
  };

  const chartData = roomStats.map((r) => ({
    name: r.name.split(' (')[0],
    fullName: r.name,
    count: r.count,
    people: r.people
  }));

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Notice Banner */}
      {exportNotice && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 text-xs sm:text-sm font-bold shadow-xs animate-fade-in ${
            exportNotice.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-700'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {exportNotice.type === 'error' ? (
              <AlertCircle size={18} className="shrink-0 text-red-600" />
            ) : (
              <CheckCircle2 size={18} className="shrink-0 text-emerald-600" />
            )}
            <span>{exportNotice.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setExportNotice(null)}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X size={16} />
          </button>
        </div>
      )}

      {/* Filter & Export Top Bar */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp size={22} className="text-[#C8102E]" />
            <span>แดชบอร์ดสถิติการใช้งานห้องประชุม (สำหรับฝ่ายบริหาร)</span>
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            วิเคราะห์ประสิทธิภาพและวางแผนปรับปรุงการใช้พื้นที่ภายในองค์กรให้เกิดประโยชน์สูงสุด
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2.5 w-full md:w-auto">
          <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-xl border border-gray-200 text-xs">
            <CalendarIcon size={14} className="text-[#C8102E] shrink-0" />
            <span className="text-gray-500 font-medium text-[11px]">ช่วงวันที่:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="เลือกวันที่เริ่มต้น"
              className="bg-transparent font-semibold text-gray-700 outline-none"
            />
            <span className="text-gray-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="เลือกวันที่สิ้นสุด"
              className="bg-transparent font-semibold text-gray-700 outline-none"
            />
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-gray-400 hover:text-gray-600 ml-1 text-xs"
                title="ล้างช่วงวันที่"
              >
                ✕
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {!isExportReady && (
              <span className="text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl border border-amber-200">
                {!startDate && !endDate
                  ? 'กรุณาเลือกวันที่เริ่มต้นและสิ้นสุดก่อนส่งออก'
                  : !startDate
                  ? 'กรุณาเลือกวันที่เริ่มต้น'
                  : !endDate
                  ? 'กรุณาเลือกวันที่สิ้นสุด'
                  : 'วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด'}
              </span>
            )}
            <button
              type="button"
              disabled={!isExportReady}
              onClick={handleExportCSV}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold shadow-xs transition ${
                isExportReady
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white active:scale-95 cursor-pointer'
                  : 'bg-gray-200 text-gray-400 border border-gray-300 cursor-not-allowed'
              }`}
              title={
                isExportReady
                  ? 'ส่งออก Excel (CSV)'
                  : 'ต้องเลือกวันที่เริ่มต้นและวันที่สิ้นสุดก่อนถึงจะกดปุ่มส่งออกได้'
              }
            >
              <FileSpreadsheet size={16} />
              <span>ส่งออก Excel (CSV)</span>
            </button>
          </div>
        </div>
      </div>

      {/* 4 Executive KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase">
            <span>จำนวนการใช้งานทั้งหมด</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <BarChart3 size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-gray-900">{totalCount}</span>
            <span className="text-xs font-bold text-gray-500">ครั้ง</span>
          </div>
          <span className="text-[11px] text-gray-400 mt-1">ในช่วงเวลาที่เลือก</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase">
            <span>ผู้เข้าร่วมประชุมรวม</span>
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Users size={18} />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-black text-gray-900">
              {totalPeople.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-gray-500">คน</span>
          </div>
          <span className="text-[11px] text-gray-400 mt-1">เฉลี่ย {totalCount > 0 ? Math.round(totalPeople / totalCount) : 0} คน/ครั้ง</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase">
            <span>ห้องที่ใช้งานสูงสุด</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Award size={18} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm sm:text-base font-bold text-gray-900 line-clamp-1">
              {topRoom ? topRoom.name.split(' (')[0] : '-'}
            </span>
            <span className="text-xs font-bold text-amber-600">
              {topRoom ? `${topRoom.count} ครั้ง (${topRoom.people.toLocaleString()} คน)` : '-'}
            </span>
          </div>
          <span className="text-[11px] text-gray-400 mt-1">อัตราการใช้งานสูงสุด</span>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-xs font-bold text-gray-500 uppercase">
            <span>ฝ่ายที่จองมากที่สุด</span>
            <div className="p-2 bg-red-50 text-[#C8102E] rounded-xl">
              <Building2 size={18} />
            </div>
          </div>
          <div className="mt-2">
            <span className="text-sm sm:text-base font-bold text-gray-900 line-clamp-1">
              {topDept ? topDept.deptName : '-'}
            </span>
            <span className="text-xs font-bold text-[#C8102E]">
              {topDept ? `${topDept.count} ครั้ง (${topDept.people.toLocaleString()} คน)` : '-'}
            </span>
          </div>
          <span className="text-[11px] text-gray-400 mt-1">ผู้จัดกิจกรรมหลัก</span>
        </div>
      </div>

      {/* Chart 1: Room Usage Bar Chart */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 space-y-3">
        <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
          <BarChart3 size={18} className="text-[#C8102E]" />
          <span>สถิติจำนวนครั้งและผู้เข้าร่วมแยกตามห้องประชุม</span>
        </h3>

        <div className="h-[320px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                formatter={(val: any, name: any, item: any) => {
                  const dataKey = item?.dataKey || '';
                  const isCount = dataKey === 'count' || name === 'จำนวนครั้ง' || name === 'count';
                  if (isCount) {
                    return [`${Number(val).toLocaleString()} ครั้ง`, 'จำนวนครั้ง'];
                  }
                  return [`${Number(val).toLocaleString()} คน`, 'จำนวนคน'];
                }}
              />
              <Legend verticalAlign="top" height={36} />
              <Bar dataKey="count" name="จำนวนครั้ง" fill="#C8102E" radius={[6, 6, 0, 0]} />
              <Bar dataKey="people" name="จำนวนคน" fill="#0284c7" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Chart 2: Department Usage Stacked per Room */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-200 space-y-3">
        <h3 className="text-sm sm:text-base font-bold text-gray-900 flex items-center gap-2">
          <Building2 size={18} className="text-[#C8102E]" />
          <span>การกระจายตัวการใช้งานตามฝ่ายในแต่ละห้องประชุม (Stacked)</span>
        </h3>

        <div className="h-[340px] w-full pt-2">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={deptStats.data} margin={{ top: 10, right: 20, left: 0, bottom: 25 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
              <YAxis tick={{ fontSize: 11 }} />
              <Tooltip
                contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                formatter={(val: any, name: any) => [`${Number(val).toLocaleString()} ครั้ง`, name]}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ overflowX: 'auto', maxWidth: '100%' }} />
              {deptStats.departments.map((dept, index) => (
                <Bar
                  key={dept}
                  dataKey={dept}
                  stackId="a"
                  fill={CHART_COLORS[index % CHART_COLORS.length]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Table 1: Room Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900">สรุปการใช้งานแยกตามห้อง</h3>
            <span className="text-xs font-semibold text-gray-500">{roomStats.length} ห้อง</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100/70 text-gray-600 font-bold border-b border-gray-200">
                  <th className="p-3">ห้องประชุม</th>
                  <th className="p-3 text-center">ใช้งาน (ครั้ง)</th>
                  <th className="p-3 text-center">ผู้เข้าร่วม (คน)</th>
                  <th className="p-3 text-center">สัดส่วน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {roomStats.map((item) => {
                  const pct = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
                  return (
                    <tr key={item.id} className="hover:bg-gray-50/80 transition">
                      <td className="p-3 font-semibold text-gray-800">{item.name}</td>
                      <td className="p-3 text-center font-bold text-blue-700">{item.count}</td>
                      <td className="p-3 text-center text-gray-700">{item.people.toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Table 2: Department Breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-sm text-gray-900">สรุปการใช้งานแยกตามฝ่าย/หน่วยงาน</h3>
            <span className="text-xs font-semibold text-gray-500">{deptTableData.length} ฝ่าย</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="bg-gray-100/70 text-gray-600 font-bold border-b border-gray-200">
                  <th className="p-3">ฝ่าย/หน่วยงาน</th>
                  <th className="p-3 text-center">ใช้งาน (ครั้ง)</th>
                  <th className="p-3 text-center">ผู้เข้าร่วม (คน)</th>
                  <th className="p-3 text-center">สัดส่วน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {deptTableData.map((item, idx) => {
                  const pct = totalCount > 0 ? Math.round((item.count / totalCount) * 100) : 0;
                  return (
                    <tr key={idx} className="hover:bg-gray-50/80 transition">
                      <td className="p-3 font-semibold text-gray-800">{item.deptName}</td>
                      <td className="p-3 text-center font-bold text-[#C8102E]">{item.count}</td>
                      <td className="p-3 text-center text-gray-700">{item.people.toLocaleString()}</td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-100 text-gray-700">
                          {pct}%
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
