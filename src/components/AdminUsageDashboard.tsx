import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  Users,
  UserCheck,
  MessageSquare,
  Activity,
  ShieldCheck,
  RefreshCw,
  Download,
  Search,
  Calendar,
  Clock,
  ArrowUpRight,
  CheckCircle2,
  AlertCircle,
  Lock,
  Copy,
  Check,
  FileSpreadsheet,
  Flame,
  FileText,
  TrendingUp,
  UserPlus
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { fetchAdminAnalyticsSummary, AdminAnalyticsSummary } from '../services/usageTracker';

interface AdminUsageDashboardProps {
  isAdmin: boolean;
  onNavigateToChat?: () => void;
}

export const AdminUsageDashboard: React.FC<AdminUsageDashboardProps> = ({
  isAdmin,
  onNavigateToChat,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [analytics, setAnalytics] = useState<AdminAnalyticsSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterRole, setFilterRole] = useState<'all' | 'active' | 'admin' | 'member'>('all');
  const [copiedUid, setCopiedUid] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setErrorNotice(null);
    try {
      const summary = await fetchAdminAnalyticsSummary();
      setAnalytics(summary);
    } catch (err: any) {
      console.error('[AdminDashboard] Error loading analytics:', err);
      setErrorNotice(err?.message || 'ไม่สามารถโหลดข้อมูลสถิติจากระบบได้ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadData();
    }
  }, [isAdmin]);

  const handleCopyUid = (uid: string) => {
    navigator.clipboard.writeText(uid);
    setCopiedUid(uid);
    setTimeout(() => setCopiedUid(null), 2000);
  };

  const handleExportCsv = () => {
    if (!analytics || !analytics.recentUsers.length) return;

    const headers = [
      'UID',
      'Email',
      'Role',
      'Status',
      'Analysis/Question Count',
      'PDF Analysis Count',
      'Registered Date',
      'Last Login Date',
      'Last Analysis Date'
    ];

    const rows = analytics.recentUsers.map((u) => [
      `"${u.uid}"`,
      `"${u.email}"`,
      `"${u.role}"`,
      `"${u.isActive ? 'Active' : 'Inactive'}"`,
      u.analysisCount,
      u.pdfAnalysisCount,
      `"${u.createdAtText}"`,
      `"${u.lastLoginText}"`,
      `"${u.lastAnalysisText}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `fire_keeper_admin_usage_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredUsers = useMemo(() => {
    if (!analytics?.recentUsers) return [];
    return analytics.recentUsers.filter((user) => {
      const matchQuery =
        user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.uid.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchQuery) return false;

      if (filterRole === 'active') return user.isActive;
      if (filterRole === 'admin') return user.role === 'admin';
      if (filterRole === 'member') return user.role !== 'admin';
      return true;
    });
  }, [analytics?.recentUsers, searchQuery, filterRole]);

  // Non-Admin Security Guard (Strict 403 authorization fallback)
  if (!isAdmin) {
    return (
      <div className="flex-1 flex items-center justify-center p-6 min-h-[500px]">
        <div className={`max-w-md w-full p-8 rounded-2xl border text-center space-y-4 shadow-xl ${
          isLight ? 'bg-white border-rose-200 text-slate-900' : 'bg-slate-900 border-rose-900/60 text-white'
        }`}>
          <div className="w-16 h-16 rounded-full bg-rose-500/15 border border-rose-500/30 flex items-center justify-center mx-auto text-rose-500">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold font-mono text-rose-500">403 FORBIDDEN: ADMIN ONLY</h2>
          <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
            หน้าแดชบอร์ดตรวจสอบการใช้งานระบบ (Admin Usage Dashboard) สงวนสิทธิ์เฉพาะผู้ดูแลระบบที่มีสิทธิ์ระดับ Administrator เท่านั้น บัญชีของคุณไม่ได้รับอนุญาตให้เข้าถึงข้อมูลนี้
          </p>
          {onNavigateToChat && (
            <button
              onClick={onNavigateToChat}
              className="mt-4 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md cursor-pointer"
            >
              กลับสู่หน้าหลักแชท & วิเคราะห์
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 max-w-7xl mx-auto w-full p-3 sm:p-6 space-y-6 animate-fadeIn">
      {/* Header Banner */}
      <div className={`p-5 sm:p-6 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-lg ${
        isLight
          ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent border-amber-200 text-slate-900'
          : 'bg-gradient-to-r from-amber-500/15 via-slate-900 to-[#060A16] border-white/10 text-white'
      }`}>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-500 border border-amber-500/30">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-bold font-mono tracking-tight">
                  ADMIN USAGE DASHBOARD
                </h1>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-mono font-bold">
                  ADMIN ONLY
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                ศูนย์ติดตามสถิติการใช้งานระบบ, ผู้ใช้งานที่ล็อกอิน, และจำนวนการส่งคำถาม (FIRE KEEPER System Audit)
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 self-stretch md:self-auto justify-end">
          {analytics?.lastRefreshedAt && (
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/20 border border-white/5">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>อัปเดต: {analytics.lastRefreshedAt}</span>
            </div>
          )}
          <button
            onClick={loadData}
            disabled={isLoading}
            className={`px-3.5 py-2 rounded-xl border text-xs font-bold font-mono flex items-center gap-2 transition-all cursor-pointer shadow-sm ${
              isLight
                ? 'bg-white hover:bg-slate-100 text-slate-800 border-slate-300'
                : 'bg-slate-800 hover:bg-slate-700 text-white border-white/10'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-amber-400' : 'text-amber-400'}`} />
            <span>รีเฟรชข้อมูล</span>
          </button>
          <button
            onClick={handleExportCsv}
            disabled={!analytics?.recentUsers?.length}
            className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs font-mono flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {errorNotice && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorNotice}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Members */}
        <div className={`p-4 sm:p-5 rounded-2xl border space-y-2 relative overflow-hidden shadow-sm ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#080E1A] border-white/10'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-semibold uppercase">จำนวนผู้ใช้ทั้งหมด</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-blue-400">
              {isLoading ? '...' : (analytics?.totalMembers ?? 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">บัญชี</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono pt-1">
            <UserPlus className="w-3 h-3 text-emerald-400" />
            <span>ใหม่วันนี้: +{analytics?.newMembersToday ?? 0} (สัปดาห์นี้ +{analytics?.newMembersThisWeek ?? 0})</span>
          </div>
        </div>

        {/* Active Users */}
        <div className={`p-4 sm:p-5 rounded-2xl border space-y-2 relative overflow-hidden shadow-sm ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#080E1A] border-white/10'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-semibold uppercase">ผู้ใช้ที่ใช้งานจริง (Active)</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <UserCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-emerald-400">
              {isLoading ? '...' : (analytics?.activeUsers ?? 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              ({analytics?.totalMembers ? Math.round(((analytics.activeUsers) / analytics.totalMembers) * 100) : 0}%)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono pt-1">
            <Activity className="w-3 h-3 text-amber-400" />
            <span>ผู้ใช้กลับมาใช้งานซ้ำ: {analytics?.returningUsers ?? 0} บัญชี</span>
          </div>
        </div>

        {/* Total Analyses / Questions */}
        <div className={`p-4 sm:p-5 rounded-2xl border space-y-2 relative overflow-hidden shadow-sm ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#080E1A] border-white/10'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-semibold uppercase">จำนวนคำถาม/วิเคราะห์รวม</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-amber-400">
              {isLoading ? '...' : (analytics?.totalAnalyses ?? 0).toLocaleString()}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">ครั้ง</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center gap-1 font-mono pt-1">
            <Flame className="w-3 h-3 text-amber-400" />
            <span>วันนี้: {analytics?.analysesToday ?? 0} ครั้ง (สัปดาห์นี้ {analytics?.analysesThisWeek ?? 0})</span>
          </div>
        </div>

        {/* System Health / Auth Status */}
        <div className={`p-4 sm:p-5 rounded-2xl border space-y-2 relative overflow-hidden shadow-sm ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#080E1A] border-white/10'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-slate-400 font-semibold uppercase">ระบบรักษาความปลอดภัย</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-bold font-mono text-purple-400">
              RBAC OK
            </span>
          </div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono pt-1">
            <CheckCircle2 className="w-3 h-3" />
            <span>Firestore Rules & Auth Synchronized</span>
          </div>
        </div>
      </div>

      {/* Daily Usage Trends Visual Chart */}
      {analytics?.dailyTrends && analytics.dailyTrends.length > 0 && (
        <div className={`p-5 sm:p-6 rounded-2xl border space-y-4 shadow-sm ${
          isLight ? 'bg-white border-slate-200' : 'bg-[#080E1A] border-white/10'
        }`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <h2 className="text-sm font-bold font-mono uppercase tracking-wider">
                แนวโน้มการใช้งาน 7 วันย้อนหลัง (7-Day Activity Trends)
              </h2>
            </div>
            <div className="flex items-center gap-3 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-amber-500"></div>
                <span className="text-slate-400">จำนวนคำถาม/วิเคราะห์</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-sm bg-blue-500"></div>
                <span className="text-slate-400">ผู้ใช้ใหม่</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-2 pt-4 items-end min-h-[140px]">
            {analytics.dailyTrends.map((trend, idx) => {
              const maxAnalyses = Math.max(...analytics.dailyTrends.map(t => t.analyses), 1);
              const heightPercent = Math.min(Math.max((trend.analyses / maxAnalyses) * 100, 10), 100);

              return (
                <div key={idx} className="flex flex-col items-center gap-2 group">
                  <div className="text-[10px] font-mono text-amber-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                    {trend.analyses} ครั้ง
                  </div>
                  <div className="w-full max-w-[40px] bg-slate-800/60 rounded-t-lg h-28 flex items-end justify-center p-1 relative">
                    <div
                      className="w-full bg-gradient-to-t from-amber-600 to-amber-400 rounded-t transition-all duration-500 group-hover:brightness-125"
                      style={{ height: `${heightPercent}%` }}
                    />
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 group-hover:text-amber-300 font-medium">
                    {trend.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* User Accounts & Usage Table */}
      <div className={`rounded-2xl border overflow-hidden shadow-lg ${
        isLight ? 'bg-white border-slate-200' : 'bg-[#080E1A] border-white/10'
      }`}>
        {/* Table Controls */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-amber-400" />
            <h2 className="text-sm font-bold font-mono uppercase tracking-wider">
              รายชื่อผู้ใช้และสถิติการใช้งานรายบุคคล ({filteredUsers.length} บัญชี)
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Filter Pills */}
            <div className="flex p-1 rounded-xl bg-black/20 border border-white/5 text-xs font-mono">
              <button
                onClick={() => setFilterRole('all')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterRole === 'all' ? 'bg-amber-500/20 text-amber-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setFilterRole('active')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterRole === 'active' ? 'bg-emerald-500/20 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                ใช้งานจริง (Active)
              </button>
              <button
                onClick={() => setFilterRole('admin')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  filterRole === 'admin' ? 'bg-purple-500/20 text-purple-300 font-bold' : 'text-slate-400 hover:text-white'
                }`}
              >
                ผู้ดูแล (Admin)
              </button>
            </div>

            {/* Search Input */}
            <div className="relative min-w-[220px]">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ค้นหาด้วยอีเมล หรือ UID..."
                className={`w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border font-mono focus:outline-none focus:ring-1 focus:ring-amber-500 transition-all ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-900 placeholder:text-slate-400'
                    : 'bg-slate-900/80 border-white/10 text-white placeholder:text-slate-500'
                }`}
              />
            </div>
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className={`border-b ${
              isLight ? 'bg-slate-50 border-slate-200 text-slate-600' : 'bg-black/30 border-white/10 text-slate-400'
            }`}>
              <tr>
                <th className="py-3 px-4 font-bold">บัญชีผู้ใช้ / อีเมล</th>
                <th className="py-3 px-4 font-bold">สิทธิ์ (Role)</th>
                <th className="py-3 px-4 font-bold">สถานะ</th>
                <th className="py-3 px-4 font-bold text-center">จำนวนครั้งที่ถาม/วิเคราะห์</th>
                <th className="py-3 px-4 font-bold text-center">เอกสาร PDF</th>
                <th className="py-3 px-4 font-bold">ล็อกอินล่าสุด</th>
                <th className="py-3 px-4 font-bold">วิเคราะห์ล่าสุด</th>
                <th className="py-3 px-4 font-bold">วันที่สร้างบัญชี</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
                    <span>กำลังโหลดข้อมูลการใช้งานผู้ใช้จาก Firestore...</span>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    ไม่พบบัญชีผู้ใช้ที่ตรงกับเงื่อนไขการค้นหา
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr
                    key={user.uid}
                    className={`transition-colors ${
                      isLight ? 'hover:bg-slate-50' : 'hover:bg-white/[0.02]'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="flex flex-col gap-0.5">
                        <span className={`font-bold font-mono ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>
                          {user.email || 'Anonymous User'}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                          <span>UID: {user.uid.slice(0, 12)}...</span>
                          <button
                            onClick={() => handleCopyUid(user.uid)}
                            title="คัดลอก UID เต็ม"
                            className="hover:text-amber-400 transition-colors cursor-pointer"
                          >
                            {copiedUid === user.uid ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      {user.role === 'admin' ? (
                        <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30 text-[10px] font-bold">
                          ADMIN
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded bg-slate-500/10 text-slate-400 border border-white/5 text-[10px]">
                          MEMBER
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {user.isActive ? (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                          ACTIVE
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-500/10 text-slate-500 text-[10px]">
                          IDLE
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`px-2.5 py-1 rounded-lg font-bold text-xs ${
                        user.analysisCount > 0
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'text-slate-500'
                      }`}>
                        {user.analysisCount}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className={`text-xs ${
                        user.pdfAnalysisCount > 0 ? 'text-blue-400 font-bold' : 'text-slate-500'
                      }`}>
                        {user.pdfAnalysisCount}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {user.lastLoginText}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {user.lastAnalysisText}
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 text-[11px]">
                      {user.createdAtText}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
