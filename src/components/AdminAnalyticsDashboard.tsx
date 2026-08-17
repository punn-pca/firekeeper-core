import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Activity,
  UserPlus,
  Calendar,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  FileText,
  Clock,
  TrendingUp,
  UserCheck,
  Database,
  ArrowUpRight,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  Legend
} from 'recharts';
import { auth, onAuthStateChanged } from '../lib/firebase';
import { verifyAdminStatusAsync, checkIsAdminSync } from '../config/adminConfig';
import { fetchAdminAnalyticsSummary, AdminAnalyticsSummary } from '../services/usageTracker';
import type { User as FirebaseUser } from 'firebase/auth';

interface AdminAnalyticsDashboardProps {
  onNavigateHome?: () => void;
}

export const AdminAnalyticsDashboard: React.FC<AdminAnalyticsDashboardProps> = ({
  onNavigateHome,
}) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(auth.currentUser);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isVerifyingAuth, setIsVerifyingAuth] = useState<boolean>(true);

  const [summary, setSummary] = useState<AdminAnalyticsSummary | null>(null);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'active' | 'inactive'>('all');

  // Verify Admin Authentication securely
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsVerifyingAuth(true);
      if (user) {
        const verified = await verifyAdminStatusAsync(user);
        setIsAdmin(verified);
      } else {
        setIsAdmin(false);
      }
      setIsVerifyingAuth(false);
    });

    return () => unsubscribe();
  }, []);

  // Load summary metrics when verified admin
  const loadData = useCallback(async () => {
    if (!isAdmin) return;
    setIsLoadingData(true);
    setErrorMessage(null);
    try {
      const data = await fetchAdminAnalyticsSummary();
      setSummary(data);
    } catch (err: any) {
      console.error('Error fetching admin analytics:', err);
      setErrorMessage(err.message || 'ไม่สามารถโหลดข้อมูล Analytics ได้ กรุณาตรวจสอบสิทธิ์ Firestore');
    } finally {
      setIsLoadingData(false);
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin, loadData]);

  // If verifying authentication
  if (isVerifyingAuth) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-6 text-center space-y-4">
        <div className="w-10 h-10 border-3 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
        <p className="text-sm font-mono text-slate-400">กำลังตรวจสอบสิทธิ์การเข้าถึงระดับผู้ดูแลระบบ (Verifying Admin ABAC)...</p>
      </div>
    );
  }

  // Access Denied Screen (Strict Security Gatekeeper)
  if (!currentUser || !isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-12 p-6 sm:p-8 bg-[#0F131A] border border-rose-500/30 rounded-2xl shadow-2xl text-center space-y-5 animate-fadeIn">
        <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-400 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg sm:text-xl font-bold text-white tracking-wide">
            403 Forbidden: สิทธิ์การเข้าถึงถูกจำกัด (Access Restricted)
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            หน้า Analytics Dashboard นี้เปิดให้เข้าถึงได้เฉพาะบัญชีผู้ดูแลระบบ (Admin) ที่ผ่านการตรวจสอบสิทธิ์ Firebase Authentication เท่านั้น
          </p>
        </div>

        <div className="p-3.5 bg-slate-900/80 rounded-xl border border-white/5 text-left text-xs font-mono space-y-1 text-slate-400">
          <div>• บัญชีปัจจุบัน: <span className="text-slate-200">{currentUser?.email || 'ยังไม่ได้เข้าสู่ระบบ (Guest)'}</span></div>
          <div>• UID: <span className="text-slate-200">{currentUser?.uid || 'none'}</span></div>
          <div>• สถานะสิทธิ์: <span className="text-rose-400 font-bold">Unauthorized / Non-Admin</span></div>
        </div>

        <div className="pt-2 flex justify-center gap-3">
          {onNavigateHome && (
            <button
              type="button"
              onClick={onNavigateHome}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-all cursor-pointer"
            >
              กลับสู่หน้าหลัก (Back to Home)
            </button>
          )}
        </div>
      </div>
    );
  }

  // Filtered users
  const filteredUsers = summary?.recentUsers.filter((u) => {
    const matchesSearch =
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.uid.toLowerCase().includes(searchTerm.toLowerCase());

    if (filterType === 'active') return matchesSearch && u.isActive;
    if (filterType === 'inactive') return matchesSearch && !u.isActive;
    return matchesSearch;
  }) || [];

  return (
    <div className="max-w-[1400px] mx-auto w-full px-2 sm:px-6 py-4 space-y-6 animate-fadeIn text-slate-100">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-[#0C1017] border border-white/10 shadow-xl">
        <div className="flex items-center space-x-3.5 min-w-0">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-xl font-bold tracking-tight text-white truncate">
                Fire Keeper · Executive Analytics & Usage Telemetry
              </h1>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold">
                <ShieldCheck className="w-3 h-3" /> Admin Verified
              </span>
            </div>
            <p className="text-xs text-slate-400">
              ระบบติดตามสถิติการใช้งานจริงและปริมาณการประมวลผลคำสั่งยุทธศาสตร์ (GA4 + Firestore Real-Time)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-auto">
          {summary?.lastRefreshedAt && (
            <span className="text-[11px] font-mono text-slate-400 hidden md:inline">
              อัปเดตล่าสุด: {summary.lastRefreshedAt}
            </span>
          )}
          <button
            type="button"
            onClick={loadData}
            disabled={isLoadingData}
            className="px-3 py-1.5 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 text-amber-400 border border-amber-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingData ? 'animate-spin' : ''}`} />
            <span>{isLoadingData ? 'กำลังโหลด...' : 'รีเฟรชสถิติ (Refresh)'}</span>
          </button>
        </div>
      </div>

      {/* Error alert if any */}
      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="font-mono text-rose-400 hover:underline">
            [Dismiss]
          </button>
        </div>
      )}

      {/* 8 Core Metrics Cards Grid (Direct User Request Fulfillment) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: TOTAL MEMBERS */}
        <div className="p-4 rounded-2xl bg-[#0F131A] border border-white/10 shadow-lg relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-slate-400 uppercase tracking-wider">
              TOTAL MEMBERS
            </span>
            <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-white">
              {summary ? summary.totalMembers.toLocaleString() : '—'}
            </span>
            <span className="text-[11px] text-slate-400">บัญชี</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 truncate">สมาชิกทั้งหมดที่ลงทะเบียนในระบบ</p>
        </div>

        {/* Metric 2: ACTIVE USERS */}
        <div className="p-4 rounded-2xl bg-[#0F131A] border border-emerald-500/20 shadow-lg relative overflow-hidden group hover:border-emerald-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
              ACTIVE USERS
            </span>
            <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-emerald-300">
              {summary ? summary.activeUsers.toLocaleString() : '—'}
            </span>
            <span className="text-[11px] text-slate-400">คน</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 truncate">มีกิจกรรมวิเคราะห์หรือส่งคำถามจริง</p>
        </div>

        {/* Metric 3: NEW MEMBERS TODAY */}
        <div className="p-4 rounded-2xl bg-[#0F131A] border border-white/10 shadow-lg relative overflow-hidden group hover:border-cyan-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
              NEW MEMBERS TODAY
            </span>
            <div className="p-1.5 rounded-lg bg-cyan-500/10 text-cyan-400">
              <UserPlus className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-white">
              +{summary ? summary.newMembersToday.toLocaleString() : '—'}
            </span>
            <span className="text-[11px] text-slate-400">คนวันนี้</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 truncate">สมัครสมาชิกใหม่ใน 24 ชม.</p>
        </div>

        {/* Metric 4: NEW MEMBERS THIS WEEK */}
        <div className="p-4 rounded-2xl bg-[#0F131A] border border-white/10 shadow-lg relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-indigo-400 uppercase tracking-wider">
              NEW THIS WEEK
            </span>
            <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-white">
              +{summary ? summary.newMembersThisWeek.toLocaleString() : '—'}
            </span>
            <span className="text-[11px] text-slate-400">คนใน 7 วัน</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 truncate">สมัครสมาชิกใหม่ใน 7 วันที่ผ่านมา</p>
        </div>

        {/* Metric 5: ANALYSES TODAY */}
        <div className="p-4 rounded-2xl bg-[#0F131A] border border-amber-500/20 shadow-lg relative overflow-hidden group hover:border-amber-500/50 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-amber-400 uppercase tracking-wider">
              ANALYSES TODAY
            </span>
            <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-amber-300">
              {summary ? summary.analysesToday.toLocaleString() : '—'}
            </span>
            <span className="text-[11px] text-slate-400">ครั้ง</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 truncate">จำนวนการรัน PCA วันนี้</p>
        </div>

        {/* Metric 6: ANALYSES THIS WEEK */}
        <div className="p-4 rounded-2xl bg-[#0F131A] border border-white/10 shadow-lg relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-purple-400 uppercase tracking-wider">
              ANALYSES THIS WEEK
            </span>
            <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-white">
              {summary ? summary.analysesThisWeek.toLocaleString() : '—'}
            </span>
            <span className="text-[11px] text-slate-400">ครั้ง</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 truncate">ปริมาณการวิเคราะห์ใน 7 วัน</p>
        </div>

        {/* Metric 7: TOTAL ANALYSES */}
        <div className="p-4 rounded-2xl bg-[#0F131A] border border-white/10 shadow-lg relative overflow-hidden group hover:border-orange-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-orange-400 uppercase tracking-wider">
              TOTAL ANALYSES
            </span>
            <div className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
              <Database className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-white">
              {summary ? summary.totalAnalyses.toLocaleString() : '—'}
            </span>
            <span className="text-[11px] text-slate-400">ครั้งสะสม</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 truncate">จำนวนการวิเคราะห์สะสมทั้งหมด</p>
        </div>

        {/* Metric 8: RETURNING USERS */}
        <div className="p-4 rounded-2xl bg-[#0F131A] border border-white/10 shadow-lg relative overflow-hidden group hover:border-teal-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono font-bold text-teal-400 uppercase tracking-wider">
              RETURNING USERS
            </span>
            <div className="p-1.5 rounded-lg bg-teal-500/10 text-teal-400">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black font-mono text-white">
              {summary ? summary.returningUsers.toLocaleString() : '—'}
            </span>
            <span className="text-[11px] text-slate-400">คน</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400 truncate">ผู้ใช้ที่กลับมาใช้งานซ้ำ (&gt;1 ครั้ง)</p>
        </div>
      </div>

      {/* Chart Section: 7-Day Activity Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 p-4 sm:p-5 rounded-2xl bg-[#0F131A] border border-white/10 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">แนวโน้มการใช้งานรายวัน (7-Day Daily Trends)</h3>
              <p className="text-xs text-slate-400">เปรียบเทียบจำนวนการวิเคราะห์และสมาชิกใหม่ในแต่ละวัน</p>
            </div>
          </div>

          <div className="h-[240px] w-full pt-2">
            {summary && summary.dailyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={summary.dailyTrends}>
                  <defs>
                    <linearGradient id="analysesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#FF8A00" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#FF8A00" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="date" stroke="#64748B" tick={{ fontSize: 11 }} />
                  <YAxis stroke="#64748B" tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0A0D14',
                      borderColor: 'rgba(255,255,255,0.1)',
                      borderRadius: '12px',
                      fontSize: '12px',
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="analyses"
                    name="จำนวนการวิเคราะห์ (Analyses)"
                    stroke="#FF8A00"
                    fillOpacity={1}
                    fill="url(#analysesGrad)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="newUsers"
                    name="สมาชิกใหม่ (New Members)"
                    stroke="#10B981"
                    fillOpacity={1}
                    fill="url(#usersGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-500 text-xs font-mono">
                ยังไม่มีข้อมูลแนวโน้มประวัติเพียงพอ
              </div>
            )}
          </div>
        </div>

        {/* User Status & Activity Ratios */}
        <div className="p-4 sm:p-5 rounded-2xl bg-[#0F131A] border border-white/10 shadow-xl space-y-4">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">สัดส่วนผู้ใช้งาน (User Engagement Ratios)</h3>
            <p className="text-xs text-slate-400">อัตราส่วนการมีส่วนร่วมในระบบ</p>
          </div>

          <div className="space-y-3.5 pt-1">
            {/* Active Ratio */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">อัตราการใช้งานจริง (Active Rate)</span>
                <span className="font-mono font-bold text-emerald-400">
                  {summary && summary.totalMembers > 0
                    ? `${Math.round((summary.activeUsers / summary.totalMembers) * 100)}%`
                    : '0%'}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      summary && summary.totalMembers > 0
                        ? Math.min(100, Math.round((summary.activeUsers / summary.totalMembers) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Retention Ratio */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-300">อัตรากลับมาใช้ซ้ำ (Retention Rate)</span>
                <span className="font-mono font-bold text-teal-400">
                  {summary && summary.totalMembers > 0
                    ? `${Math.round((summary.returningUsers / summary.totalMembers) * 100)}%`
                    : '0%'}
                </span>
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-teal-500 rounded-full transition-all duration-500"
                  style={{
                    width: `${
                      summary && summary.totalMembers > 0
                        ? Math.min(100, Math.round((summary.returningUsers / summary.totalMembers) * 100))
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Privacy & Security Telemetry */}
            <div className="mt-4 p-3 rounded-xl bg-slate-900/90 border border-white/5 space-y-2 text-[11px] font-mono text-slate-400">
              <div className="flex items-center gap-1.5 text-amber-400 font-bold">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Zero-PII Compliance Verified</span>
              </div>
              <p className="text-[10px] text-slate-400 leading-normal">
                ไม่มีการส่งคำถามฉบับเต็ม, เนื้อหา PDF, ผลวิเคราะห์ หรือรหัสผ่านไปยัง Google Analytics 4
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* User Usage Registry Table */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0F131A] border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-white">ตารางข้อมูลการใช้งานรายสมาชิก (User Usage Directory)</h3>
            <p className="text-xs text-slate-400">ตรวจสอบความถี่การวิเคราะห์และประวัติการเข้าใช้งานล่าสุด</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                placeholder="ค้นหา UID หรือ Email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-slate-900 border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 w-48 sm:w-56"
              />
            </div>

            {/* Filter buttons */}
            <div className="flex rounded-xl bg-slate-900 border border-white/10 p-0.5 text-xs">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterType === 'all' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                ทั้งหมด ({summary?.recentUsers.length || 0})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('active')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterType === 'active' ? 'bg-emerald-500/20 text-emerald-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Active ({summary?.recentUsers.filter(u => u.isActive).length || 0})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('inactive')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterType === 'inactive' ? 'bg-slate-700 text-slate-200 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                ยังไม่รัน ({summary?.recentUsers.filter(u => !u.isActive).length || 0})
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-white/5">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#0A0D14] text-slate-400 font-mono text-[11px] border-b border-white/10 uppercase tracking-wider">
              <tr>
                <th className="px-3.5 py-2.5">ผู้ใช้งาน (User / UID)</th>
                <th className="px-3.5 py-2.5">สถานะ (Status)</th>
                <th className="px-3.5 py-2.5 text-center">วิเคราะห์ (Total)</th>
                <th className="px-3.5 py-2.5 text-center">PDF</th>
                <th className="px-3.5 py-2.5">เข้าสู่ระบบล่าสุด</th>
                <th className="px-3.5 py-2.5">วิเคราะห์ล่าสุด</th>
                <th className="px-3.5 py-2.5">วันที่สมัคร</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300 font-mono">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => (
                  <tr key={u.uid} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-3.5 py-2.5">
                      <div className="font-semibold text-slate-200 truncate max-w-[200px]">{u.email}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[180px]">{u.uid}</div>
                    </td>
                    <td className="px-3.5 py-2.5">
                      {u.isActive ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                          <CheckCircle2 className="w-3 h-3" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-800 border border-slate-700 text-slate-400 text-[10px]">
                          Registered Only
                        </span>
                      )}
                    </td>
                    <td className="px-3.5 py-2.5 text-center font-bold text-amber-400">
                      {u.analysisCount}
                    </td>
                    <td className="px-3.5 py-2.5 text-center text-slate-300">
                      {u.pdfAnalysisCount}
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-400 text-[11px]">
                      {u.lastLoginText}
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-400 text-[11px]">
                      {u.lastAnalysisText}
                    </td>
                    <td className="px-3.5 py-2.5 text-slate-500 text-[11px]">
                      {u.createdAtText}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    {isLoadingData ? 'กำลังโหลดข้อมูล...' : 'ไม่พบข้อมูลผู้ใช้ตามเงื่อนไขที่ระบุ'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
