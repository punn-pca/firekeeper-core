import React, { useState } from 'react';
import { X, Check, Sparkles, Shield, Zap, CreditCard, QrCode, Lock, CheckCircle2, Award, HelpCircle, FileText, ChevronDown, ChevronUp, Layers, Plus, Minus } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { MembershipTier } from '../types';

export const PricingModal: React.FC = () => {
  const { user, isPricingModalOpen, closePricingModal, updateSubscriptionTier } = useAuth();
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [selectedTier, setSelectedTier] = useState<MembershipTier | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'promptpay' | 'card'>('promptpay');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [showComparisonTable, setShowComparisonTable] = useState(false);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  if (!isPricingModalOpen) return null;

  const currentTier = user?.membership?.tier || 'free';

  const toggleExpandCard = (planId: string) => {
    setExpandedCards((prev) => ({ ...prev, [planId]: !prev[planId] }));
  };

  const plans = [
    {
      id: 'free' as MembershipTier,
      name: 'Free Trial',
      categoryTag: 'PERSONAL',
      thbMonthly: 0,
      thbYearly: 0,
      targetGroup: 'ผู้ทดลองใช้งาน & นักเรียนนักศึกษา',
      estimatedWorkload: '✓ 2 Executive Reports หรือ 10 งานขนาดเล็ก',
      processingCredits: '150K Processing Credits',
      description: 'ทดลองใช้งานกระบวนการคิด 12 ขั้นตอนผ่านรายงานจริง',
      isPopular: false,
      cardBorder: 'border-slate-800 bg-slate-900/60 hover:border-slate-700',
      buttonClass: 'bg-slate-800 text-slate-200 hover:bg-slate-700 hover:text-white',
      coreFeatures: [
        '12-Stage Reasoning Engine เบื้องต้น',
        'Memory Bank (สูงสุด 10 รายการ)',
        'วิเคราะห์เอกสารส่วนตัวสั้นๆ',
      ],
      additionalFeatures: [
        'ส่งออกผลลัพธ์ผ่าน Markdown & Plain Text',
      ],
    },
    {
      id: 'starter' as MembershipTier,
      name: 'Solo Analyst',
      categoryTag: 'ESSENTIAL',
      thbMonthly: 199,
      thbYearly: 159,
      targetGroup: 'Freelancer, Solo Consultant & SME Strategist',
      estimatedWorkload: '≈ 3–5 Executive Reports / เดือน',
      processingCredits: '300K Processing Credits',
      description: 'วิเคราะห์รวดเร็วสำหรับรายงานยุทธศาสตร์ประจำสัปดาห์',
      isPopular: false,
      cardBorder: 'border-teal-500/30 bg-gradient-to-b from-slate-900 via-teal-950/10 to-slate-900 hover:border-teal-500/50',
      buttonClass: 'bg-teal-600 hover:bg-teal-500 text-white font-bold shadow-md shadow-teal-950/50',
      coreFeatures: [
        '3 Reasoning Profiles (Auto, Business, Risk)',
        'Uncertainty Disambiguation Matrix เบื้องต้น',
        'รองรับเอกสารหนาถึง ~300 หน้า/รายงาน',
      ],
      additionalFeatures: [
        'ส่งออกรายงานรูปแบบ Markdown & Plain Text',
      ],
    },
    {
      id: 'pro' as MembershipTier,
      name: 'Pro Analyst',
      categoryTag: 'PROFESSIONAL',
      thbMonthly: 490,
      thbYearly: 390,
      targetGroup: 'Management Consultant, Risk Officer, Analyst',
      estimatedWorkload: '≈ 12–18 Executive Reports / เดือน',
      processingCredits: '1M Processing Credits',
      description: 'ชุดวิเคราะห์เชิงลึกสำหรับที่ปรึกษาและผู้บริหารยุทธศาสตร์',
      isPopular: true,
      cardBorder: 'border-2 border-emerald-500 shadow-2xl shadow-emerald-500/20 bg-gradient-to-b from-slate-900 via-emerald-950/25 to-slate-900 relative sm:scale-[1.02] hover:sm:scale-[1.04] transition-transform duration-300 z-10',
      buttonClass: 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold shadow-lg shadow-emerald-500/30',
      coreFeatures: [
        'Team Workspace & Collaborative Audit Logs',
        'Saved Reasoning Templates & Custom Profiles',
        'Cryptographic Audit Package (.zip)',
      ],
      additionalFeatures: [
        'Uncertainty & Evidence Matrix เต็มรูปแบบ',
        'Priority Queue Fast-Track Engine',
        'ส่งออก Executive PDF / Word / JSON',
      ],
    },
    {
      id: 'academic' as MembershipTier,
      name: 'Academic & Peer-Audit',
      categoryTag: 'RESEARCH',
      thbMonthly: 990,
      thbYearly: 790,
      targetGroup: 'Professors, AI Researchers, Compliance Auditors',
      estimatedWorkload: '≈ 30–50 Research Audits / เดือน',
      processingCredits: '3M Processing Credits',
      description: 'เครื่องมือตรวจสอบความน่าเชื่อถือทางวิชาการและงานวิจัยเชิงลึก',
      isPopular: false,
      cardBorder: 'border-sky-500/40 bg-gradient-to-b from-slate-900 via-sky-950/15 to-slate-900 hover:border-sky-500/60',
      buttonClass: 'bg-sky-600 hover:bg-sky-500 text-white font-bold shadow-md shadow-sky-950/50',
      coreFeatures: [
        'Research Integrity & Explainability Report',
        'Peer-Review Citation & Source Provenance ID',
        'Deep Hallucination & Misinformation Scan',
      ],
      additionalFeatures: [
        'รายงานประเมิน ISO/IEC 42001 & NIST AI RMF',
        'ส่งออกรายงานวิชาการ PDF / LaTeX / JSON',
      ],
    },
    {
      id: 'enterprise' as MembershipTier,
      name: 'Enterprise Sovereign',
      categoryTag: 'SOVEREIGN',
      thbMonthly: 2490,
      thbYearly: 1990,
      targetGroup: 'Enterprise Legal Teams, Banks, Government',
      estimatedWorkload: '≈ 100+ Forensic Reports / เดือน',
      processingCredits: '10M Processing Credits (FUP)',
      description: 'สถาปัตยกรรมระดับองค์กร sovereign ควบคุมความปลอดภัยระดับสูงสุด',
      isPopular: false,
      cardBorder: 'border-purple-500/40 bg-gradient-to-b from-slate-900 via-purple-950/15 to-slate-900 hover:border-purple-500/60',
      buttonClass: 'bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-md shadow-purple-950/50',
      coreFeatures: [
        'Sovereign Isolation Vault & Governance',
        'Dedicated Cloud Run Container Instance',
        'RSA-PSS Custom Key Management Vault',
      ],
      additionalFeatures: [
        'Unlimited WORM Audit Logs & Storage Sinks',
        'ทีมงานสนับสนุนและวิศวกรสายตรงตลอด 24/7',
      ],
    },
  ];

  const faqs = [
    {
      question: 'Processing Credits คืออะไร?',
      answer:
        'Processing Credits คือหน่วยคำนวณการประมวลผลของ Cognitive OS โดย 1 Executive Report จะใช้ประมาณ 60,000–90,000 Processing Credits คุณไม่จำเป็นต้องคำนวณ Credits เอง ระบบจะคำนวณและบริหารจัดการให้อัตโนมัติในทุกขั้นตอนวิเคราะห์',
    },
    {
      question: 'สามารถเปลี่ยนหรือยกเลิกแพ็กเกจได้เมื่อใด?',
      answer:
        'คุณสามารถอัปเกรด สลับรอบบิล หรือยกเลิกแพ็กเกจได้ตลอดเวลาโดยไม่มีสัญญาผูกมัด เครดิตประมวลผลจะปรับเพิ่มตามสิทธิ์แพ็กเกจใหม่ทันทีหลังยืนยันรายการ',
    },
    {
      question: 'ข้อมูลและการประมวลผลได้รับการคุ้มครองอย่างไร?',
      answer:
        'ข้อมูลทั้งหมดถูกส่งผ่าน SSL 256-bit และประมวลผลในสถิตภาวะความปลอดภัยสูง ไม่มีการนำข้อมูลผู้ใช้ไปเทรนโมเดลภายนอก พร้อม Cryptographic WORM Audit Trail ยืนยันความถูกต้องและไม่สามารถแก้ไขได้',
    },
    {
      question: 'หาก Processing Credits หมดระหว่างเดือนทำอย่างไรได้บ้าง?',
      answer:
        'หากเครดิตหมดก่อนวันตัดรอบบิล คุณสามารถเลือกกดเติม Credits เพิ่มเติม (Top-up) หรือเลือกอัปเกรดเป็นแพ็กเกจถัดไปเพื่อขยายโควตาประมวลผลได้ทันที',
    },
  ];

  const handleSelectPlan = (tierId: MembershipTier) => {
    setSelectedTier(tierId);
    setPaymentSuccess(false);
  };

  const handleConfirmPayment = async () => {
    if (!selectedTier) return;
    setIsProcessingPayment(true);

    setTimeout(async () => {
      try {
        await updateSubscriptionTier(selectedTier, billingCycle, '8892');
        setIsProcessingPayment(false);
        setPaymentSuccess(true);
        setTimeout(() => {
          setSelectedTier(null);
          setPaymentSuccess(false);
          closePricingModal();
        }, 2200);
      } catch (err) {
        setIsProcessingPayment(false);
      }
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-6xl bg-[#0B0F17] border border-slate-800 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[94vh]">
        
        {/* Header Section */}
        <div className="p-5 sm:p-6 bg-gradient-to-r from-slate-900 via-slate-900 to-[#0B0F17] border-b border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-amber-400 shrink-0" />
              <h3 className="text-lg sm:text-xl font-extrabold text-white font-sans tracking-tight">
                แพ็กเกจระดับพลังวิเคราะห์ (Cognitive OS Tiers)
              </h3>
            </div>
            <p className="text-xs text-slate-300 font-sans mt-1 leading-normal">
              เลือกแพ็กเกจที่เหมาะกับรูปแบบการใช้งานและเป้าหมายยุทธศาสตร์ของคุณ
            </p>
          </div>

          <div className="flex items-center space-x-3 self-end sm:self-auto shrink-0">
            {/* Prominent Monthly / Yearly Billing Toggle */}
            <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-xl transition-all cursor-pointer font-bold ${
                  billingCycle === 'monthly' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                รายเดือน
              </button>
              <button
                onClick={() => setBillingCycle('yearly')}
                className={`px-4 py-2 rounded-xl transition-all flex items-center space-x-1.5 cursor-pointer font-bold ${
                  billingCycle === 'yearly' ? 'bg-emerald-500/20 text-emerald-300' : 'text-slate-400 hover:text-white'
                }`}
              >
                <span>รายปี</span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-500/25 text-emerald-300 text-[10px] font-extrabold">
                  ประหยัด 20%
                </span>
              </button>
            </div>

            <button
              onClick={closePricingModal}
              className="p-2.5 rounded-2xl bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {!selectedTier ? (
            <>
              {/* Plans Grid (5 cards) */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 items-stretch">
                {plans.map((plan) => {
                  const isCurrent = currentTier === plan.id;
                  const price = billingCycle === 'yearly' ? plan.thbYearly : plan.thbMonthly;
                  const isExpanded = expandedCards[plan.id] || false;

                  return (
                    <div
                      key={plan.id}
                      className={`p-4 rounded-2xl border flex flex-col justify-between transition-all relative ${plan.cardBorder}`}
                    >
                      {/* Floating MOST POPULAR Badge on Pro Analyst Card only */}
                      {plan.isPopular && (
                        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-gradient-to-r from-emerald-400 to-teal-400 text-slate-950 text-[10px] font-mono font-extrabold uppercase tracking-wider shadow-lg shadow-emerald-500/30 whitespace-nowrap">
                          MOST POPULAR
                        </div>
                      )}

                      <div className="space-y-3">
                        {/* 1. Title & Subtitle Category Tag */}
                        <div>
                          <div className="text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                            {plan.categoryTag}
                          </div>
                          <h4 className="text-base font-extrabold text-white font-sans mt-0.5">{plan.name}</h4>
                          <p className="text-[11px] text-slate-200 font-sans mt-1 leading-snug min-h-[32px]">
                            {plan.description}
                          </p>
                        </div>

                        {/* 2. Price */}
                        <div className="py-2.5 border-y border-slate-800/80 space-y-1.5">
                          <div className="flex items-baseline space-x-1">
                            <span className="text-2xl font-extrabold text-white font-mono">
                              {price === 0 ? '฿0' : `฿${price.toLocaleString()}`}
                            </span>
                            <span className="text-xs text-slate-400 font-mono">/เดือน</span>
                          </div>

                          {/* 3. Suitable for / Target Group */}
                          <div className="text-[10px] font-sans text-slate-200 bg-slate-950/80 px-2.5 py-1.5 rounded-lg border border-slate-800 truncate">
                            <span className="text-sky-400 font-semibold font-mono">เหมาะสำหรับ:</span> {plan.targetGroup}
                          </div>

                          {/* 4. Primary Outcome / Estimated Workload */}
                          <div className="p-2 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-[10px] font-mono text-emerald-300 font-bold flex items-center space-x-1.5">
                            <FileText className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <span className="truncate">{plan.estimatedWorkload}</span>
                          </div>
                        </div>

                        {/* 5. Core Features Checklist with generous line spacing */}
                        <div className="space-y-2">
                          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
                            Core Capabilities
                          </div>
                          <ul className="space-y-2.5 text-xs text-slate-200 font-sans">
                            {plan.coreFeatures.map((feat, idx) => (
                              <li key={idx} className="flex items-start space-x-2">
                                <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                                <span className="text-[11px] leading-snug font-medium text-slate-200">{feat}</span>
                              </li>
                            ))}

                            {/* Additional features when expanded */}
                            {isExpanded &&
                              plan.additionalFeatures.map((feat, idx) => (
                                <li key={`add-${idx}`} className="flex items-start space-x-2 pt-1 border-t border-slate-800/40">
                                  <Check className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
                                  <span className="text-[11px] leading-snug text-slate-300">{feat}</span>
                                </li>
                              ))}
                          </ul>

                          {/* Expandable toggle button */}
                          {plan.additionalFeatures.length > 0 && (
                            <button
                              type="button"
                              onClick={() => toggleExpandCard(plan.id)}
                              className="text-[10px] font-mono text-amber-400/90 hover:text-amber-300 flex items-center space-x-1 cursor-pointer pt-1 transition-colors"
                            >
                              {isExpanded ? <Minus className="w-3 h-3" /> : <Plus className="w-3 h-3" />}
                              <span>{isExpanded ? 'ซ่อนรายละเอียดรอง' : '+ ดูรายละเอียดฟีเจอร์เพิ่มเติม'}</span>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Card Footer: Secondary Technical Spec (Token/Credits) & Action Button */}
                      <div className="pt-3 mt-3 border-t border-slate-800/60 space-y-2">
                        {/* 6. Technical Spec (Small, un-intrusive) */}
                        <div className="text-[9px] font-mono text-slate-400 flex items-center justify-center space-x-1 text-center">
                          <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                          <span>สเปกคำนวณ: <strong className="text-slate-300">{plan.processingCredits}</strong></span>
                        </div>

                        {/* Action Button */}
                        {isCurrent ? (
                          <button
                            disabled
                            className="w-full py-2.5 rounded-xl bg-slate-800/80 text-slate-400 font-mono text-xs font-bold border border-slate-700/80 cursor-default"
                          >
                            แพ็กเกจปัจจุบัน
                          </button>
                        ) : (
                          <button
                            onClick={() => handleSelectPlan(plan.id)}
                            className={`w-full py-2.5 rounded-xl text-xs font-mono transition-all cursor-pointer ${plan.buttonClass}`}
                          >
                            {price === 0 ? 'ทดลองใช้งานฟรี' : 'เลือกแพ็กเกจนี้'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Enterprise Sovereign Governance & SLA Box */}
              <div className="p-4 bg-slate-900/80 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs text-slate-300">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-purple-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white font-sans text-sm">Sovereign Governance & Fair Use Policy (FUP)</strong>
                    <p className="text-[11px] text-slate-300 font-sans mt-0.5">
                      แพ็กเกจ Enterprise ให้โควตาสูงสุด 10M Processing Credits/เดือน พร้อมระบบคุมภาระประมวลผลอัตโนมัติ (Throttle Shield) และ Dedicated Cloud Run Container เพื่อรักษา SLA 99.9%
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowComparisonTable(!showComparisonTable)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold flex items-center space-x-1.5 shrink-0 transition-all cursor-pointer"
                >
                  <Layers className="w-4 h-4" />
                  <span>{showComparisonTable ? 'ซ่อนตารางเปรียบเทียบ' : 'ดูตารางเปรียบเทียบฟีเจอร์เชิงลึก'}</span>
                  {showComparisonTable ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>

              {/* Detailed Feature Comparison Matrix Table */}
              {showComparisonTable && (
                <div className="p-5 bg-slate-950 rounded-2xl border border-slate-800 space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white font-sans flex items-center space-x-2">
                      <Award className="w-4 h-4 text-emerald-400" />
                      <span>ตารางเปรียบเทียบศักยภาพระบบ (Feature Comparison Matrix)</span>
                    </h4>
                    <span className="text-[10px] font-mono text-slate-400">เปรียบเทียบรายละเอียด 5 Tiers</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left font-mono text-xs text-slate-300 divide-y divide-slate-800">
                      <thead>
                        <tr className="bg-slate-900/80 text-white text-[11px]">
                          <th className="p-3">ฟีเจอร์ / ศักยภาพระบบ</th>
                          <th className="p-3 text-center text-slate-400">Free Trial</th>
                          <th className="p-3 text-center text-teal-300">Solo Analyst</th>
                          <th className="p-3 text-center text-emerald-400">Pro Analyst</th>
                          <th className="p-3 text-center text-sky-300">Academic</th>
                          <th className="p-3 text-center text-purple-300">Enterprise</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/60 text-[11px]">
                        <tr>
                          <td className="p-3 font-semibold text-slate-200">12-Stage Cognitive OS Pipeline</td>
                          <td className="p-3 text-center text-emerald-400">✓</td>
                          <td className="p-3 text-center text-emerald-400">✓</td>
                          <td className="p-3 text-center text-emerald-400">✓</td>
                          <td className="p-3 text-center text-emerald-400">✓</td>
                          <td className="p-3 text-center text-emerald-400">✓</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-200">ประมาณการงานวิเคราะห์ / เดือน</td>
                          <td className="p-3 text-center text-slate-400">2 รายงาน / 10 งานเล็ก</td>
                          <td className="p-3 text-center text-teal-300">3–5 รายงาน</td>
                          <td className="p-3 text-center text-emerald-400 font-bold">12–18 รายงาน</td>
                          <td className="p-3 text-center text-sky-300 font-bold">30–50 รายงาน</td>
                          <td className="p-3 text-center text-purple-300 font-bold">100+ รายงาน</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-200">Team Workspace & Custom Templates</td>
                          <td className="p-3 text-center text-slate-600">✗</td>
                          <td className="p-3 text-center text-slate-600">✗</td>
                          <td className="p-3 text-center text-emerald-400 font-bold">✓ (แชร์ทีม)</td>
                          <td className="p-3 text-center text-sky-300">✓</td>
                          <td className="p-3 text-center text-purple-300">✓</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-200">Cryptographic WORM Audit Zip</td>
                          <td className="p-3 text-center text-slate-600">✗</td>
                          <td className="p-3 text-center text-slate-600">✗</td>
                          <td className="p-3 text-center text-emerald-400 font-bold">✓</td>
                          <td className="p-3 text-center text-sky-300">✓</td>
                          <td className="p-3 text-center text-purple-300">✓</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-200">Uncertainty Disambiguation Matrix</td>
                          <td className="p-3 text-center text-slate-600">✗</td>
                          <td className="p-3 text-center text-slate-400">เบื้องต้น</td>
                          <td className="p-3 text-center text-emerald-400">เต็มรูปแบบ</td>
                          <td className="p-3 text-center text-sky-300">เต็มรูปแบบ</td>
                          <td className="p-3 text-center text-purple-300">เต็มรูปแบบ</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-200">Research Integrity Engine & Peer Citation</td>
                          <td className="p-3 text-center text-slate-600">✗</td>
                          <td className="p-3 text-center text-slate-600">✗</td>
                          <td className="p-3 text-center text-slate-600">✗</td>
                          <td className="p-3 text-center text-sky-300 font-bold">✓ (เฉพาะทาง)</td>
                          <td className="p-3 text-center text-purple-300">✓</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-200">AI Explainability & Hallucination Scan</td>
                          <td className="p-3 text-center text-slate-600">✗</td>
                          <td className="p-3 text-center text-slate-600">✗</td>
                          <td className="p-3 text-center text-slate-400">Standard</td>
                          <td className="p-3 text-center text-sky-300 font-bold">Deep Scan</td>
                          <td className="p-3 text-center text-purple-300">Deep Scan</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-200">ISO/IEC 42001 & NIST AI RMF Governance</td>
                          <td className="p-3 text-center text-slate-600">✗</td>
                          <td className="p-3 text-center text-slate-600">✗</td>
                          <td className="p-3 text-center text-slate-600">✗</td>
                          <td className="p-3 text-center text-sky-300">✓</td>
                          <td className="p-3 text-center text-purple-300">✓</td>
                        </tr>
                        <tr>
                          <td className="p-3 font-semibold text-slate-200">Dedicated Container & SLA 99.9%</td>
                          <td className="p-3 text-center text-slate-600">Shared</td>
                          <td className="p-3 text-center text-slate-600">Shared</td>
                          <td className="p-3 text-center text-slate-600">Shared</td>
                          <td className="p-3 text-center text-slate-600">Shared Priority</td>
                          <td className="p-3 text-center text-purple-300 font-bold">Dedicated Cloud Run</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Frequently Asked Questions (FAQ) Section */}
              <div className="p-5 bg-slate-900/60 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center space-x-2">
                  <HelpCircle className="w-5 h-5 text-amber-400" />
                  <h4 className="text-base font-bold text-white font-sans">Frequently Asked Questions (FAQ)</h4>
                </div>

                <div className="space-y-2">
                  {faqs.map((faq, index) => {
                    const isOpen = openFaqIndex === index;
                    return (
                      <div
                        key={index}
                        className="bg-slate-950/80 border border-slate-800 rounded-xl overflow-hidden transition-all"
                      >
                        <button
                          onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                          className="w-full p-3.5 text-left flex items-center justify-between text-xs sm:text-sm font-bold text-slate-200 hover:text-white font-sans cursor-pointer"
                        >
                          <span>{faq.question}</span>
                          {isOpen ? <ChevronUp className="w-4 h-4 text-amber-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                        </button>
                        {isOpen && (
                          <div className="px-3.5 pb-3.5 pt-0 text-xs text-slate-300 font-sans leading-relaxed border-t border-slate-800/40">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            /* STREAMLINED 3-STEP PAYMENT CHECKOUT STEP */
            <div className="max-w-xl mx-auto p-6 bg-slate-900/90 border border-slate-800 rounded-2xl space-y-6">
              {/* Checkout Progress Stepper */}
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 font-mono text-xs">
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center font-bold text-[11px]">
                    1
                  </span>
                  <span className="text-slate-400">เลือกแพ็กเกจ</span>
                </div>
                <div className="w-8 h-[1px] bg-slate-700" />
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-emerald-500 text-slate-950 font-bold flex items-center justify-center text-[11px]">
                    2
                  </span>
                  <span className="text-white font-bold">ชำระเงิน</span>
                </div>
                <div className="w-8 h-[1px] bg-slate-700" />
                <div className="flex items-center space-x-2">
                  <span className="w-6 h-6 rounded-full bg-slate-800 text-slate-500 flex items-center justify-center font-bold text-[11px]">
                    3
                  </span>
                  <span className="text-slate-500">เปิดใช้งานทันที</span>
                </div>
              </div>

              {paymentSuccess ? (
                <div className="py-8 text-center space-y-4 animate-fade-in">
                  <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-900/40">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <h4 className="text-xl font-bold text-white">ชำระเงินและอัปเกรดสำเร็จแล้ว!</h4>
                  <p className="text-xs text-slate-300 font-mono">
                    แพ็กเกจสมาชิกของคุณเปลี่ยนเป็น <strong className="text-emerald-400">{selectedTier.toUpperCase()}</strong> และระบบทำการปรับเติมเครดิตการประมวลผลทันที
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest">Instant Activation Checkout</span>
                      <h4 className="text-lg font-bold text-white">
                        ยืนยันสมัครสมาชิก {plans.find((p) => p.id === selectedTier)?.name}
                      </h4>
                    </div>
                    <button
                      onClick={() => setSelectedTier(null)}
                      className="text-xs text-slate-400 hover:text-white font-mono underline cursor-pointer"
                    >
                      ย้อนกลับ
                    </button>
                  </div>

                  {/* Summary Box */}
                  <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-2 font-mono text-xs">
                    <div className="flex justify-between text-slate-300">
                      <span>แพ็กเกจที่เลือก:</span>
                      <strong className="text-white">{plans.find((p) => p.id === selectedTier)?.name}</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>ประมาณการผลลัพธ์:</span>
                      <strong className="text-emerald-300">{plans.find((p) => p.id === selectedTier)?.estimatedWorkload}</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>สเปก Processing Credits:</span>
                      <strong className="text-amber-300">{plans.find((p) => p.id === selectedTier)?.processingCredits}</strong>
                    </div>
                    <div className="flex justify-between text-slate-300">
                      <span>รอบบิล:</span>
                      <strong className="text-sky-300">{billingCycle === 'yearly' ? 'รายปี (ส่วนลด 20%)' : 'รายเดือน'}</strong>
                    </div>
                    <div className="flex justify-between text-slate-100 text-sm font-bold pt-2 border-t border-slate-800">
                      <span>ยอดชำระสุทธิ:</span>
                      <span className="text-emerald-400">
                        ฿
                        {(
                          (billingCycle === 'yearly'
                            ? plans.find((p) => p.id === selectedTier)?.thbYearly
                            : plans.find((p) => p.id === selectedTier)?.thbMonthly) || 0
                        ).toLocaleString()}{' '}
                        THB
                      </span>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-3">
                    <label className="block text-xs font-mono text-slate-400">เลือกช่องทางการชำระเงิน (Stripe / PromptPay Gateway)</label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('promptpay')}
                        className={`p-3 rounded-xl border font-mono text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                          paymentMethod === 'promptpay'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <QrCode className="w-4 h-4" />
                        <span>PromptPay QR</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`p-3 rounded-xl border font-mono text-xs flex items-center justify-center space-x-2 transition-all cursor-pointer ${
                          paymentMethod === 'card'
                            ? 'bg-emerald-500/10 border-emerald-500 text-emerald-300 font-bold'
                            : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                        }`}
                      >
                        <CreditCard className="w-4 h-4" />
                        <span>Credit / Debit Card (Stripe)</span>
                      </button>
                    </div>

                    {paymentMethod === 'promptpay' ? (
                      <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 text-center space-y-2 font-mono text-xs">
                        <div className="w-32 h-32 bg-white p-2 rounded-xl mx-auto flex items-center justify-center shadow-md">
                          <QrCode className="w-28 h-28 text-slate-950" />
                        </div>
                        <p className="text-[11px] text-slate-400">
                          สแกนด้วยแอปพลิเคชันธนาคารเพื่อทำรายการชำระเงิน ระบบจะปรับเพิ่ม Processing Credits อัตโนมัติทันที
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <input
                          type="text"
                          placeholder="Card Number (xxxx-xxxx-xxxx-8892)"
                          defaultValue="4111 2222 3333 8892"
                          className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                        />
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="MM/YY (12/28)"
                            defaultValue="12/28"
                            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                          />
                          <input
                            type="text"
                            placeholder="CVC (882)"
                            defaultValue="882"
                            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white font-mono"
                          />
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={handleConfirmPayment}
                    disabled={isProcessingPayment}
                    className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-extrabold text-xs font-mono rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50 cursor-pointer"
                  >
                    <Lock className="w-4 h-4" />
                    <span>
                      {isProcessingPayment ? 'กำลังประมวลผลผ่านระบบชำระเงิน...' : 'ยืนยันการชำระเงินและเปิดใช้งานทันที'}
                    </span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
