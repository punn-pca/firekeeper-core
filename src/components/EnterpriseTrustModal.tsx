import React, { useState } from 'react';
import { 
  Building2, 
  Shield, 
  FileText, 
  Mail, 
  X, 
  CheckCircle2, 
  ExternalLink, 
  Lock, 
  AlertCircle, 
  Copy, 
  Check, 
  Download, 
  Scale, 
  Sparkles, 
  Brain, 
  Server, 
  ShieldCheck, 
  Flame,
  Search,
  BookOpen,
  Video
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { copyToClipboard } from '../utils/fileUtils';
import { FireKeeperHistorySection } from './FireKeeperHistorySection';

export type TrustTab = 'about' | 'history' | 'privacy' | 'terms' | 'contact';

interface EnterpriseTrustModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: TrustTab;
}

export const EnterpriseTrustModal: React.FC<EnterpriseTrustModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'about',
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const [activeTab, setActiveTab] = useState<TrustTab>(initialTab);
  const [copiedPgp, setCopiedPgp] = useState(false);
  const [copiedEmail, setCopiedEmail] = useState(false);

  // Sync initial tab when changed
  React.useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const handleCopyEmail = async () => {
    const success = await copyToClipboard('punn.firekeeper@proton.me');
    if (success) {
      setCopiedEmail(true);
      setTimeout(() => setCopiedEmail(false), 2000);
    }
  };

  const handleCopyPgp = async () => {
    const pgpKey = `-----BEGIN PGP PUBLIC KEY BLOCK-----
Version: FIRE KEEPER Security Key 2026.1
Comment: punn.firekeeper@proton.me
Fingerprint: F17E-BEE9-2026-PUNN-PCA12-SEC-KEY

mQGNBF/firekeeper-sec-2026-audit-key-rsa4096-fingerprint-sha256...
-----END PGP PUBLIC KEY BLOCK-----`;
    const success = await copyToClipboard(pgpKey);
    if (success) {
      setCopiedPgp(true);
      setTimeout(() => setCopiedPgp(false), 2000);
    }
  };

  const navItems: { id: TrustTab; label: string; subLabel: string; icon: any; badge?: string }[] = [
    { id: 'about', label: 'เกี่ยวกับองค์กร', subLabel: 'About Platform', icon: Building2 },
    { id: 'history', label: 'ประวัติศาสตร์ & ปรัชญา', subLabel: 'Origin & History', icon: Flame, badge: 'PUNN' },
    { id: 'privacy', label: 'ความเป็นส่วนตัว', subLabel: 'Privacy Policy', icon: Shield, badge: 'PDPA/GDPR' },
    { id: 'terms', label: 'ข้อตกลงการใช้งาน', subLabel: 'Terms of Service', icon: FileText, badge: 'Governance' },
    { id: 'contact', label: 'ติดต่อ & สนับสนุน', subLabel: 'Contact & Patreon', icon: Mail, badge: 'Support' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div 
        className={`relative w-full max-w-5xl h-[92vh] max-h-[860px] flex flex-col rounded-2xl shadow-2xl border overflow-hidden ${
          isLight 
            ? 'bg-white border-slate-200 text-slate-900' 
            : 'bg-[#0B1220] border-slate-700/60 text-slate-100'
        }`}
      >
        {/* Modal Header */}
        <div className={`flex items-center justify-between px-4 sm:px-6 py-3.5 border-b shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#07090D] border-slate-800'
        }`}>
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#FF8A00] flex items-center justify-center shadow-md shrink-0">
              <Flame className="w-4 h-4 text-slate-950" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base md:text-lg font-bold tracking-tight truncate">
                  FIRE KEEPER Trust, Governance & Legal Center
                </h2>
                <span className="px-2 py-0.5 text-[10px] font-mono font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                  Governance Center
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans hidden sm:block truncate">
                เอกสารรับรองมาตรฐานความโปร่งใส ความปลอดภัย และกรอบธรรมาภิบาลปัญญาประดิษฐ์ระดับองค์กร
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            type="button"
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/60 transition-all cursor-pointer shrink-0 ml-2"
            title="ปิดหน้าต่าง (Close)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation - Grid 5 Columns for Smooth Layout */}
        <div className={`grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-1.5 p-2 sm:px-4 sm:py-2 border-b shrink-0 ${
          isLight ? 'bg-slate-100/70 border-slate-200' : 'bg-[#0F172A]/80 border-slate-800'
        }`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                type="button"
                className={`flex items-center justify-between gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer min-w-0 ${
                  isActive
                    ? isLight
                      ? 'bg-white text-[#FF8A00] shadow-xs border border-slate-200'
                      : 'bg-[#FF8A00]/15 text-[#FF8A00] border border-[#FF8A00]/40'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-[#FF8A00]' : 'text-slate-400'}`} />
                  <div className="text-left min-w-0">
                    <div className="truncate leading-tight font-bold">{item.label}</div>
                    <div className={`text-[10px] truncate leading-tight ${isActive ? 'text-[#FF8A00]/80' : 'text-slate-400'}`}>
                      {item.subLabel}
                    </div>
                  </div>
                </div>
                {item.badge && (
                  <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded shrink-0 hidden sm:inline-block ${
                    isActive ? 'bg-[#FF8A00]/20 text-[#FF8A00]' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 text-sm leading-relaxed">
          {/* TAB 1: ABOUT */}
          {activeTab === 'about' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-transparent to-orange-500/5 border border-amber-500/20">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-5 h-5 text-[#FF8A00]" />
                    <h3 className="text-base sm:text-lg font-bold text-[#FF8A00]">
                      เกี่ยวกับ FIRE KEEPER Executive Decision Intelligence Platform
                    </h3>
                  </div>
                  <button
                    onClick={() => setActiveTab('history')}
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-all cursor-pointer w-fit"
                  >
                    <Flame className="w-3.5 h-3.5 text-amber-400" />
                    <span>อ่านประวัติศาสตร์ & ปรัชญา →</span>
                  </button>
                </div>
                <p className="text-xs sm:text-sm text-slate-300">
                  FIRE KEEPER คือโครงสร้างพื้นฐานทางปัญญาประดิษฐ์เพื่อการตัดสินใจเชิงยุทธศาสตร์ระดับองค์กร (Enterprise Decision Intelligence Infrastructure) พัฒนาขึ้นเพื่อแก้ปัญหาภาวะกล่องดำ (Black-Box AI) และอคติการพึ่งพาอัตโนมัติ (Automation Bias) โดยแปลงการวิเคราะห์ข้อมูลให้เป็นกระบวนการทางวิทยาศาสตร์ที่มีหลักฐานประจักษ์รองรับและตรวจสอบย้อนกลับได้ 100%
                </p>
              </div>

              {/* Core Pillars */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-sky-500/10 text-sky-400 flex items-center justify-center font-bold mb-2.5 text-xs">
                    01
                  </div>
                  <h4 className="font-bold text-sky-400 mb-1 text-sm">12-Stage PUNN Architecture</h4>
                  <p className="text-xs text-slate-400 leading-normal">
                    การแบ่งกระบวนการคิดออกเป็น 12 สเตจโปร่งใส (White-Box) ตั้งแต่การรับรู้ (Perceive) การคัดแยกและทดสอบสมมติฐาน (Cognize) สู่แผนปฏิบัติการ (Act)
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center font-bold mb-2.5 text-xs">
                    02
                  </div>
                  <h4 className="font-bold text-amber-400 mb-1 text-sm">Epistemic Humility & ACH</h4>
                  <p className="text-xs text-slate-400 leading-normal">
                    การบังคับใช้ Analysis of Competing Hypotheses (ACH) และทีมทดสอบมุมกลับ (Red Team Counter-Evidence) เพื่อหักล้างจุดบอดทางความคิด
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800">
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-bold mb-2.5 text-xs">
                    03
                  </div>
                  <h4 className="font-bold text-emerald-400 mb-1 text-sm">Human Agency 100%</h4>
                  <p className="text-xs text-slate-400 leading-normal">
                    ระบบทำหน้าที่เป็นผู้ช่วยจัดเตรียมข้อมูลและประเมินทางเลือกเชิงกลยุทธ์ โดยคงอำนาจการอนุมัติขั้นเด็ดขาดไว้ที่ผู้บริหาร (Human-in-the-Loop)
                  </p>
                </div>
              </div>

              {/* Standards Alignment */}
              <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/40 border border-slate-800 space-y-3">
                <h4 className="font-bold text-slate-200 flex items-center gap-2 text-xs sm:text-sm">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  มาตรฐานและการกำกับดูแลที่สอดคล้อง (Standards Alignment)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="font-bold text-emerald-400 block mb-1">ISO/IEC 42001:2023 Reference</span>
                    <span className="text-slate-400">
                      กรอบการจัดการปัญญาประดิษฐ์ระดับสากล: ควบคุมความเสี่ยง, จัดทำ Audit Trail บน WORM Ledger, และตรวจสอบย้อนกลับ (Traceability)
                    </span>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
                    <span className="font-bold text-sky-400 block mb-1">NIST AI RMF 1.0 Alignment</span>
                    <span className="text-slate-400">
                      ขับเคลื่อน 4 ฟังก์ชันหลัก: GOVERN (ธรรมาภิบาล), MAP (จำแนกบริบท), MEASURE (วัดความเชื่อมั่น Bayesian), MANAGE (บรรเทาความเสี่ยง)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: HISTORY & PHILOSOPHY */}
          {activeTab === 'history' && (
            <div className="space-y-5 animate-fadeIn">
              <FireKeeperHistorySection />
            </div>
          )}

          {/* TAB 2: PRIVACY POLICY */}
          {activeTab === 'privacy' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <div className="flex items-center gap-3">
                  <Shield className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div>
                    <h3 className="font-bold text-emerald-400 text-sm sm:text-base">นโยบายการคุ้มครองข้อมูลส่วนบุคคล (Privacy Policy)</h3>
                    <p className="text-xs text-slate-300">สอดคล้องตาม พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA) และ EU GDPR</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-emerald-400 hidden sm:inline">อัปเดต: 15 ส.ค. 2569</span>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-300">
                <section className="space-y-1 p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                  <h4 className="font-bold text-white text-sm">1. ข้อมูลที่เราประมวลผลและการเก็บรักษาขั้นต่ำ (Data Minimization)</h4>
                  <p className="text-slate-400 leading-normal text-xs sm:text-sm">
                    FIRE KEEPER ยึดหลักการจัดเก็บข้อมูลเท่าที่จำเป็นสำหรับการประมวลผลเชิงยุทธศาสตร์เท่านั้น ระบบจะทำการตรวจจับและ Masking หมายเลขโทรศัพท์ และเลขประจำตัวประชาชน 13 หลักโดยอัตโนมัติก่อนส่งประมวลผลใน Cognitive Pipeline
                  </p>
                </section>

                <section className="space-y-1 p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                  <h4 className="font-bold text-white text-sm">2. ความโปร่งใสของโมเดล AI (Zero Data Retention for Training)</h4>
                  <p className="text-slate-400 leading-normal text-xs sm:text-sm">
                    คำสั่งและข้อมูลข้อเท็จจริงของผู้ใช้ผ่านการประมวลผลผ่าน Enterprise API endpoints ที่มีนโยบาย <strong className="text-emerald-400">Zero Retention</strong> โดยไม่มีการนำข้อมูลส่วนบุคคลหรือข้อมูลความลับขององค์กรไปใช้เพื่อการฝึกฝนโมเดลสาธารณะ (No Model Training on Customer Data)
                  </p>
                </section>

                <section className="space-y-1 p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                  <h4 className="font-bold text-white text-sm">3. สิทธิของเจ้าของข้อมูลส่วนบุคคล (Data Subject Rights)</h4>
                  <p className="text-slate-400 leading-normal text-xs sm:text-sm">
                    ผู้ใช้มีสิทธิสมบูรณ์ในการเข้าถึง (Access), ขอรับสำเนา (Data Portability via Export), แก้ไข (Rectify), หรือขอลบข้อมูลประวัติการสนทนาและ Memory Bank ได้ตลอดเวลาผ่านหน้าต่างจัดการภายในแอปพลิเคชัน
                  </p>
                </section>

                <section className="space-y-1 p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                  <h4 className="font-bold text-white text-sm">4. การรักษาความมั่นคงปลอดภัยของข้อมูล (Security Safeguards)</h4>
                  <p className="text-slate-400 leading-normal text-xs sm:text-sm">
                    การเข้ารหัสข้อมูลขณะส่งผ่าน (Encryption in Transit) ด้วย TLS 1.3, การเข้ารหัสข้อมูลที่บันทึก (Encryption at Rest) ด้วย AES-256, และการบันทึก Audit Trail บนระบบจัดเก็บแบบเขียนครั้งเดียว (WORM Ledger) ป้องกันการแก้ไขย้อนหลัง
                  </p>
                </section>
              </div>
            </div>
          )}

          {/* TAB 3: TERMS OF SERVICE */}
          {activeTab === 'terms' && (
            <div className="space-y-5 animate-fadeIn">
              <div className="flex items-center justify-between p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-[#FF8A00] shrink-0" />
                  <div>
                    <h3 className="font-bold text-[#FF8A00] text-sm sm:text-base">ข้อตกลงและเงื่อนไขการใช้บริการ (Terms of Service)</h3>
                    <p className="text-xs text-slate-300">กรอบการกำกับดูแลความรับผิดชอบและการรักษาสิทธิของมนุษย์ (Human Agency)</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-[#FF8A00] hidden sm:inline">เวอร์ชัน 2.4</span>
              </div>

              <div className="space-y-4 text-xs sm:text-sm text-slate-300">
                <section className="space-y-1.5 p-3.5 rounded-xl bg-slate-900/60 border border-amber-500/30">
                  <h4 className="font-bold text-amber-400 text-sm flex items-center gap-2">
                    <Scale className="w-4 h-4" />
                    1. ข้อสงวนสิทธิทางวิชาชีพและลักษณะการให้คำปรึกษา (Advisory Nature Disclaimer)
                  </h4>
                  <p className="text-slate-300 leading-normal text-xs sm:text-sm">
                    ผลการวิเคราะห์และข้อเสนอแนะจากระบบ FIRE KEEPER จัดทำขึ้นเพื่อเป็นเครื่องมือสนับสนุนการตัดสินใจเชิงยุทธศาสตร์ (Strategic Decision Support) มิใช่คำวินิจฉัยทางกฎหมาย การแพทย์ นิติกรรม หรือข้อบังคับทางการเงินขั้นเด็ดขาด ผู้มีอำนาจตัดสินใจขององค์กร (Human Gatekeeper) ต้องใช้วิจารณญาณทางวิชาชีพประกอบเสมอ
                  </p>
                </section>

                <section className="space-y-1 p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                  <h4 className="font-bold text-white text-sm">2. ความเป็นเจ้าของผลลัพธ์และทรัพย์สินทางปัญญา (Intellectual Property)</h4>
                  <p className="text-slate-400 leading-normal text-xs sm:text-sm">
                    รายงาน Dossier, กราฟการตัดสินใจ (Decision Graphs), และชุดข้อมูลที่สร้างขึ้นผ่านแพลตฟอร์มถือเป็นกรรมสิทธิ์ของผู้ใช้งานและองค์กรผู้ว่าจ้าง 100% โดยผู้ใช้มีสิทธิ์ในการเผยแพร่ ส่งออก หรือประยุกต์ใช้ในองค์กรได้อย่างอิสระ
                  </p>
                </section>

                <section className="space-y-1 p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                  <h4 className="font-bold text-white text-sm">3. นโยบายการใช้งานที่ยอมรับได้ (Acceptable Use Policy)</h4>
                  <p className="text-slate-400 leading-normal text-xs sm:text-sm">
                    ห้ามมิให้ใช้งานระบบเพื่อกิจกรรมที่ขัดต่อกฎหมายความมั่นคง, การสร้างข้อมูลเท็จเพื่อสร้างความเสียหายต่อบุคคลภายนอก (Disinformation), หรือการพยายามเจาะระบบและทำลายความต่อเนื่องของบริการ
                  </p>
                </section>

                <section className="space-y-1 p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                  <h4 className="font-bold text-white text-sm">4. กฎหมายที่ใช้บังคับ (Governing Law)</h4>
                  <p className="text-slate-400 leading-normal text-xs sm:text-sm">
                    ข้อตกลงนี้อยู่ภายใต้การบังคับใช้และตีความตามกฎหมายแห่งราชอาณาจักรไทย โดยข้อพิพาทใดๆ จะได้รับการพิจารณาภายใต้เขตอำนาจศาลไทย
                  </p>
                </section>
              </div>
            </div>
          )}

          {/* TAB 4: CONTACT & SUPPORT & PATREON */}
          {activeTab === 'contact' && (
            <div className="space-y-4 sm:space-y-5 animate-fadeIn">
              {/* Header Banner */}
              <div className="p-3.5 sm:p-4 rounded-xl bg-gradient-to-r from-sky-500/10 via-amber-500/10 to-orange-500/10 border border-sky-500/20 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sky-400 text-sm sm:text-base">ช่องทางติดต่อทางการ ชุมชน และการสนับสนุน</h3>
                    <p className="text-xs text-slate-300">Official Contact, TikTok, ReadAWrite, Patreon & Security Disclosure</p>
                  </div>
                </div>
              </div>

              {/* Cards Grid: Contact & Social + Security Disclosure */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* 1. Official Contact & Social */}
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-[#FF8A00]" />
                      ช่องทางติดต่อทางการ (Official Contact & Social)
                    </h4>

                    <div className="space-y-2.5 text-xs text-slate-300">
                      {/* Email */}
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                        <div className="min-w-0">
                          <span className="text-[11px] text-slate-400 block font-medium">อีเมลติดต่อฝ่ายประสานงาน & DPO:</span>
                          <a 
                            href="mailto:punn.firekeeper@proton.me" 
                            className="font-mono text-xs sm:text-sm text-sky-400 hover:underline font-bold truncate block"
                          >
                            punn.firekeeper@proton.me
                          </a>
                        </div>
                        <button
                          onClick={handleCopyEmail}
                          type="button"
                          className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] font-mono font-bold text-slate-300 flex items-center gap-1 transition-all cursor-pointer shrink-0"
                          title="คัดลอกอีเมล"
                        >
                          {copiedEmail ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          <span>{copiedEmail ? 'คัดลอกแล้ว' : 'คัดลอก'}</span>
                        </button>
                      </div>

                      {/* Social Handle X / Twitter */}
                      <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[11px] text-slate-400 block font-medium">ช่องทางโซเชียล (Social / X):</span>
                          <span className="font-mono text-xs sm:text-sm text-amber-400 font-bold">@punn_firekeeper</span>
                        </div>
                        <a
                          href="https://x.com/punn_firekeeper"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-2.5 py-1 rounded-md bg-[#FF8A00]/10 hover:bg-[#FF8A00]/20 text-[#FF8A00] border border-[#FF8A00]/30 text-[10px] font-bold flex items-center gap-1 transition-all"
                        >
                          <span>ติดตาม</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>

                      {/* SLA Info */}
                      <div className="text-[11px] text-slate-400 leading-snug pt-1">
                        ⏱️ <span className="text-slate-300">เวลาทำการสนับสนุน:</span> จันทร์ - ศุกร์ (08:30 - 17:30 น. GMT+7) / 24x7 สำหรับ P1 Critical Incidents
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Security Disclosure & PGP */}
                <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-3 flex flex-col justify-between">
                  <div className="space-y-2.5">
                    <h4 className="font-bold text-white text-sm flex items-center gap-2">
                      <Lock className="w-4 h-4 text-emerald-400" />
                      การรายงานความปลอดภัย (Security Disclosure)
                    </h4>
                    <p className="text-xs text-slate-400 leading-normal">
                      หากตรวจพบช่องโหว่ โปรดรายงานผ่านช่องทาง Proton Mail เข้ารหัส (PGP Encrypted) เพื่อการตรวจสอบตามกรอบ Coordinated Disclosure
                    </p>

                    <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <span className="text-[10px] text-slate-500 block">Proton Encrypted Security:</span>
                        <div className="text-xs font-mono text-emerald-400 truncate font-semibold">
                          punn.firekeeper@proton.me
                        </div>
                      </div>
                      <button
                        onClick={handleCopyPgp}
                        type="button"
                        className="px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-[10px] font-mono font-bold text-slate-300 flex items-center gap-1 transition-all cursor-pointer shrink-0"
                      >
                        {copiedPgp ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                        <span>{copiedPgp ? 'คัดลอกแล้ว' : 'PGP Key'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="text-[11px] text-slate-400 leading-snug pt-1">
                    🛡️ <span className="text-slate-300">มาตรฐานการตอบสนอง:</span> รับทราบรายงานภายใน 24 ชม. และอัปเดตสถานะการแก้ไขอย่างต่อเนื่อง
                  </div>
                </div>
              </div>

              {/* TikTok & ReadAWrite Literary / Theory Community Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {/* TikTok Channel */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5 flex flex-col justify-between hover:border-pink-500/30 transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-pink-500/20 text-pink-400 flex items-center justify-center font-bold text-xs">
                          🔥
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-xs sm:text-sm">TikTok · FIRE 🔥 KEEPPER</h4>
                          <span className="text-[10px] font-mono text-pink-400">@punn_firekeeper</span>
                        </div>
                      </div>
                      <a
                        href="https://www.tiktok.com/@punn_firekeeper"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-md bg-pink-500/15 hover:bg-pink-500/25 text-pink-300 border border-pink-500/30 text-[10px] font-bold flex items-center gap-1 transition-all shrink-0"
                      >
                        <span>เปิด TikTok</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      <strong className="text-amber-400">ปุญญ์ ปรเมษฐ์ ปุญภัสโชติ</strong> — Founder of Firekeeper Theory • Keeper of Inner Light
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-pink-400" />
                    <span>ผู้ติดตามกว่า 1.1K คน · Community & Theory</span>
                  </div>
                </div>

                {/* ReadAWrite Article / Book */}
                <div className="p-3.5 sm:p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2.5 flex flex-col justify-between hover:border-cyan-500/30 transition-all">
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center font-bold text-xs">
                          <BookOpen className="w-3.5 h-3.5" />
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-xs sm:text-sm">The Firekeeper | ผู้พิทักษ์ไฟ</h4>
                          <span className="text-[10px] font-mono text-cyan-400">ReadAWrite · สาระความรู้</span>
                        </div>
                      </div>
                      <a
                        href="https://www.readawrite.com/?action=user_page&user_id_publisher=895199&author=44a0046f2d41a1a43b09e2de536296d0"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 rounded-md bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 border border-cyan-500/30 text-[10px] font-bold flex items-center gap-1 transition-all shrink-0"
                      >
                        <span>อ่านผลงาน</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed italic font-sans">
                      &ldquo;The Firekeeper ไม่ใช่นิยายปลอบใจแต่คือโครงสร้างสำหรับคนที่รู้แล้วว่าตัวตนเดิมไปต่อไม่ได้&rdquo;
                    </p>
                  </div>
                  <div className="text-[10px] font-mono text-slate-400 flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                    <span>บทความ & ทฤษฎีต้นแบบแห่งผู้เฝ้าไฟ</span>
                  </div>
                </div>
              </div>

              {/* Patreon Sponsor & Community Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-rose-500/15 via-orange-500/10 to-amber-500/15 border border-rose-500/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center font-bold shrink-0 shadow-inner text-lg">
                    🧡
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-white text-sm">ร่วมสนับสนุนการพัฒนา FIRE KEEPER ผ่าน Patreon</h4>
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        Official Patreon
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-normal">
                      สนับสนุนงานวิจัยสถาปัตยกรรม PUNN PCA และระบบการตัดสินใจโปร่งใสแบบ White-Box
                    </p>
                  </div>
                </div>

                <a
                  href="https://www.patreon.com/punnfirekeeper"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white text-xs font-bold font-mono tracking-wide shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition-all shrink-0 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>patreon.com/punnfirekeeper</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Active Web Security Measures */}
              <div className="p-3 rounded-xl bg-slate-900/40 border border-slate-800">
                <h4 className="font-bold text-slate-400 text-[10px] uppercase tracking-wider mb-1.5 font-mono">
                  Active Web Security & Compliance Measures
                </h4>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    ✓ CSP Active
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    ✓ HSTS Preload
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    ✓ X-Content-Type-Options
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                    ✓ Permissions-Policy
                  </span>
                  <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/30">
                    ✓ robots.txt & sitemap.xml
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className={`flex items-center justify-between px-4 sm:px-6 py-2.5 sm:py-3 border-t shrink-0 ${
          isLight ? 'bg-slate-50 border-slate-200' : 'bg-[#07090D] border-slate-800'
        }`}>
          <div className="flex items-center gap-2 text-xs text-slate-400 truncate">
            <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            <span className="truncate">FIRE KEEPER Operating System v2.4 (Enterprise Production)</span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onClose}
              type="button"
              className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all cursor-pointer"
            >
              ปิดหน้าต่าง (Close)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

