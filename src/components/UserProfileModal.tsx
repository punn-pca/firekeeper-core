import React, { useState, useEffect } from 'react';
import { X, User as UserIcon, Mail, Building, Briefcase, Zap, Shield, Sparkles, CheckCircle2, CreditCard, RefreshCw, BarChart2, Lock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { ReasoningProfile, ToneMode } from '../types';

export const UserProfileModal: React.FC = () => {
  const {
    user,
    isProfileModalOpen,
    closeProfileModal,
    updateProfile,
    openPricingModal,
    resetTokenQuota,
    logout,
  } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [organization, setOrganization] = useState('');
  const [toneMode, setToneMode] = useState<ToneMode>('Formal Architect');
  const [defaultReasoning, setDefaultReasoning] = useState<ReasoningProfile>('Auto');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'tokens' | 'subscription'>('profile');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setRole(user.role || 'Executive Risk Analyst');
      setOrganization(user.organization || 'PUNN Cognitive OS');
      setToneMode(user.preferences?.toneMode || 'Formal Architect');
      setDefaultReasoning(user.preferences?.defaultReasoningProfile || 'Auto');
    }
  }, [user, isProfileModalOpen]);

  if (!isProfileModalOpen || !user) return null;

  const membership = user.membership || {
    tier: 'free',
    tierName: 'Free Starter Tier',
    priceMonthlyThb: 0,
    tokenQuotaMonthly: 50000,
    tokensUsedThisMonth: 12450,
    resetDate: '2026-09-01',
    status: 'active',
    billingCycle: 'monthly',
  };

  const tokensUsed = membership.tokensUsedThisMonth || 0;
  const tokenQuota = membership.tokenQuotaMonthly || 50000;
  const usagePercentage = Math.min(100, Math.round((tokensUsed / tokenQuota) * 100));

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await updateProfile({
        name,
        email,
        role,
        organization,
        preferences: {
          ...user.preferences,
          toneMode,
          defaultReasoningProfile: defaultReasoning,
        },
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to update profile', err);
    } finally {
      setIsSaving(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'enterprise':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'academic':
        return 'bg-sky-500/20 text-sky-300 border-sky-500/30';
      case 'pro':
        return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-2xl bg-[#0B0F17] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-slate-900/80 to-[#0B0F17] border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-lg shadow-inner">
              {name.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-bold text-white font-sans">{name || 'User Profile'}</h3>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold border ${getTierColor(membership.tier)}`}>
                  {membership.tierName.toUpperCase()}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">{email} • {role}</p>
            </div>
          </div>
          <button
            onClick={closeProfileModal}
            className="p-2 rounded-xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800/80 bg-slate-950/50 px-6 pt-2 space-x-2">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 text-xs font-mono font-bold rounded-t-xl transition-all flex items-center space-x-2 border-b-2 ${
              activeTab === 'profile'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>แก้ไขข้อมูลสมาชิก</span>
          </button>
          <button
            onClick={() => setActiveTab('tokens')}
            className={`px-4 py-2.5 text-xs font-mono font-bold rounded-t-xl transition-all flex items-center space-x-2 border-b-2 ${
              activeTab === 'tokens'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>การใช้งาน Credits ({tokensUsed.toLocaleString()} / {tokenQuota.toLocaleString()})</span>
          </button>
          <button
            onClick={() => setActiveTab('subscription')}
            className={`px-4 py-2.5 text-xs font-mono font-bold rounded-t-xl transition-all flex items-center space-x-2 border-b-2 ${
              activeTab === 'subscription'
                ? 'border-emerald-500 text-emerald-400 bg-slate-900/60'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-purple-400" />
            <span>แพ็กเกจสมาชิก</span>
          </button>
        </div>

        {/* Tab Contents */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-slate-300">
          {/* TAB 1: EDIT PROFILE */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              {saveSuccess && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-mono flex items-center space-x-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>บันทึกการแก้ไขข้อมูลส่วนตัวและสิทธิ์เรียบร้อยแล้ว</span>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">ชื่อ-นามสกุล / Display Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none font-sans"
                      placeholder="ชื่อผู้ใช้งาน"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">อีเมลสมาชิก / Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none font-sans"
                      placeholder="email@example.com"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">ตำแหน่ง / Role & Title</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none font-sans"
                      placeholder="เช่น Senior Risk Auditor"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">องค์กร / Organization</label>
                  <div className="relative">
                    <Building className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
                    <input
                      type="text"
                      value={organization}
                      onChange={(e) => setOrganization(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none font-sans"
                      placeholder="เช่น FireKeeper Forensic Lab"
                    />
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div className="pt-3 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-mono font-bold text-slate-200 uppercase tracking-wider">
                  การตั้งค่า AI Reasoning Preferences
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">ระดับน้ำเสียงการสื่อสาร (Tone Mode)</label>
                    <select
                      value={toneMode}
                      onChange={(e) => setToneMode(e.target.value as ToneMode)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none font-sans"
                    >
                      <option value="Formal Architect">Formal Architect (ทางการ/สถาปัตยกรรม)</option>
                      <option value="Direct Expert">Direct Expert (ตรงประเด็น/ผู้เชี่ยวชาญ)</option>
                      <option value="Empathetic Guide">Empathetic Guide (ผู้ช่วยแนะนำเชิงลึก)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-mono text-slate-400 mb-1">โปรไฟล์การลงเหตุผลเริ่มต้น</label>
                    <select
                      value={defaultReasoning}
                      onChange={(e) => setDefaultReasoning(e.target.value as ReasoningProfile)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:border-emerald-500 focus:outline-none font-sans"
                    >
                      <option value="Auto">Auto Intelligent Selection</option>
                      <option value="Investigation">Investigation (การสืบสวนและนิติวิทยาศาสตร์)</option>
                      <option value="Business">Business Strategy (ยุทธศาสตร์ธุรกิจ)</option>
                      <option value="Legal">Legal & Regulatory (กฎหมายและข้อบังคับ)</option>
                      <option value="Medical">Medical Science (วิทยาศาสตร์การแพทย์)</option>
                      <option value="Engineering">Engineering System (วิศวกรรมระบบ)</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-between border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    closeProfileModal();
                    logout();
                  }}
                  className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-mono transition-colors"
                >
                  ออกจากระบบ (Logout)
                </button>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs font-mono rounded-xl shadow-lg shadow-emerald-900/30 transition-all flex items-center space-x-2 disabled:opacity-50"
                >
                  {isSaving ? 'กำลังบันทึก...' : 'บันทึกข้อมูลส่วนตัว'}
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: TOKEN USAGE & METER */}
          {activeTab === 'tokens' && (
            <div className="space-y-6">
              {/* Processing Credits Meter Card */}
              <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-900/90 to-slate-950 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm flex items-center space-x-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>สถานะโควตา AI Processing Credits ประจำเดือน</span>
                    </h4>
                    <p className="text-xs text-slate-400 font-mono mt-0.5">
                      รีเซ็ตโควตาถัดไปวันที่: <span className="text-amber-300">{membership.resetDate}</span>
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-extrabold font-mono text-emerald-400">
                      {usagePercentage}%
                    </span>
                    <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Used Ratio</div>
                  </div>
                </div>

                {/* Meter Bar */}
                <div className="space-y-1.5">
                  <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        usagePercentage > 90
                          ? 'bg-gradient-to-r from-amber-500 to-rose-500'
                          : usagePercentage > 75
                          ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                          : 'bg-gradient-to-r from-teal-500 to-emerald-400'
                      }`}
                      style={{ width: `${usagePercentage}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>ใช้ไปแล้ว: <strong className="text-white">{tokensUsed.toLocaleString()}</strong> Credits</span>
                    <span>โควตารวม: <strong className="text-amber-300">{tokenQuota.toLocaleString()}</strong> Credits/เดือน</span>
                  </div>
                </div>

                {/* Quota breakdown box */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px]">
                    <div className="text-slate-500 text-[10px]">Remaining Credits</div>
                    <div className="text-emerald-400 font-bold text-sm mt-0.5">
                      {(tokenQuota - tokensUsed).toLocaleString()}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px]">
                    <div className="text-slate-500 text-[10px]">Avg Credits / Report</div>
                    <div className="text-sky-400 font-bold text-sm mt-0.5">
                      ~60K–90K Credits
                    </div>
                  </div>
                  <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 font-mono text-[11px] col-span-2 sm:col-span-1">
                    <div className="text-slate-500 text-[10px]">Billing Tier</div>
                    <div className="text-amber-300 font-bold text-xs mt-0.5 truncate">
                      {membership.tierName}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-slate-900/60 rounded-xl border border-slate-800">
                <div className="text-xs text-slate-300 font-sans">
                  ต้องการขยายโควตา Token สำหรับการวิเคราะห์เชิงลึกระดับองค์กรหรือไม่?
                </div>
                <div className="flex items-center space-x-2 w-full sm:w-auto">
                  <button
                    onClick={resetTokenQuota}
                    className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-mono transition-colors flex items-center space-x-1"
                    title="จำลองการรีเซ็ตโควตา Token"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>รีเซ็ตโควตา</span>
                  </button>
                  <button
                    onClick={() => {
                      closeProfileModal();
                      openPricingModal();
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-bold rounded-xl text-xs font-mono transition-all shadow-md flex items-center space-x-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>อัปเกรดแพ็กเกจ</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: SUBSCRIPTION & TIERS */}
          {activeTab === 'subscription' && (
            <div className="space-y-5">
              <div className="p-5 bg-gradient-to-br from-slate-900 via-indigo-950/20 to-slate-950 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-widest">Active Plan</span>
                    <h4 className="text-lg font-bold text-white">{membership.tierName}</h4>
                  </div>
                  <div className="text-right">
                    <span className="text-xl font-mono font-bold text-amber-300">
                      {membership.priceMonthlyThb > 0 ? `฿${membership.priceMonthlyThb.toLocaleString()}/เดือน` : 'ฟรี'}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono pt-2 border-t border-slate-800/80">
                  <div className="text-slate-400">
                    โควตา Token: <strong className="text-white">{tokenQuota.toLocaleString()} / เดือน</strong>
                  </div>
                  <div className="text-slate-400">
                    สถานะการชำระเงิน: <strong className="text-emerald-400">{membership.status.toUpperCase()}</strong>
                  </div>
                  <div className="text-slate-400">
                    วันตัดรอบถัดไป: <strong className="text-amber-300">{membership.resetDate}</strong>
                  </div>
                  <div className="text-slate-400">
                    ชำระผ่าน: <strong className="text-sky-300">PromptPay / Card (*{membership.paymentMethodLast4 || '8892'})</strong>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-900/60 rounded-xl border border-slate-800 flex items-center justify-between">
                <div>
                  <h5 className="font-bold text-xs text-white">ต้องการเปลี่ยนแพ็กเกจสมาชิกหรือเพิ่มสิทธิ์?</h5>
                  <p className="text-[11px] text-slate-400">สลับระหว่าง Pro Analyst, Enterprise Forensic และ Academic Tier ได้ทันที</p>
                </div>
                <button
                  onClick={() => {
                    closeProfileModal();
                    openPricingModal();
                  }}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs font-mono rounded-xl shadow-lg transition-all"
                >
                  เปิดหน้าราคาแพ็กเกจ (Pricing)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
