import React from 'react';
import {
  Shield,
  HeartPulse,
  Bell,
  Scale,
  AlertTriangle,
  CheckCircle,
  FileText,
  Landmark,
  Users,
  Brain,
  Sparkles,
  MapPin,
  Clock,
  Briefcase,
  Smile,
  Search,
  Check,
} from 'lucide-react';
import { ContextualAwarenessLayer } from '../types';

interface ContextualAwarenessViewerProps {
  layer?: ContextualAwarenessLayer;
}

export const ContextualAwarenessViewer: React.FC<ContextualAwarenessViewerProps> = ({ layer }) => {
  // Fallback default layer if not provided in current state
  const data: ContextualAwarenessLayer = layer || {
    activeDomain: 'THAI_SOCIO_LEGAL',
    confidenceBreakdown: {
      overall: 96,
      language: 100,
      intent: 94,
      reference: 88,
      cultural: 98,
      legalSafety: 96,
    },
    languageLayer: {
      segmentationStatus: 'THAI_WORD_CUT_ACTIVE (PyThaiNLP / Dictionary-Assisted Tokenizer)',
      ambiguityDetected: false,
      ambiguousTerms: [],
      registerLevel: 'Consultative / Professional',
    },
    semanticIntent: {
      primaryIntent: 'ยุทธศาสตร์วิเคราะห์และตัดสินใจ (Strategic Analysis)',
      implicitGoal: 'ประมวลผลคำตอบด้วยยุทธศาสตร์ PUNN PCA v2.0 พร้อมกรอบอ้างอิงบริบทประเทศไทยครบถ้วน',
      urgencyLevel: 'Strategic Planning',
    },
    culturalContext: {
      idiomsDetected: [],
      socialNuance: 'โครงสร้างสังคมไทยเน้นลำดับอาวุโส ฝ่ายปกครองท้องที่ และการเข้าถึงด้วยความเคารพสิทธิรายบุคคล',
      culturalMetaphor: 'การผสมผสานกลไกทางสังคมไทย (เครือข่ายชุมชน/อสม.) เข้ากับหลัก Threat Assessment มาตรฐานสากล',
    },
    honorifics: {
      markersFound: ['ครับ'],
      politenessLevel: 'สุภาพนอบน้อม (Polite & Respectful)',
      relationshipContext: 'ลูกค้า (Client)',
      personaMode: 'Analyst Mode',
    },
    temporalContext: {
      timeExpressions: ['ปีปัจจุบัน'],
      beConversionNote: 'ใช้ปีปัจจุบัน (2569 BE / 2026 CE)',
      timeframeScope: 'การประมวลผลอ้างอิงกรอบเวลา พ.ศ. / ค.ศ. ตามมาตรฐานบริบทไทย',
    },
    locationContext: {
      geographicEntities: ['ขอบเขตระดับประเทศ (Thailand National Level)'],
      transitNodes: ['โครงข่ายคมนาคมหลัก'],
      regionScope: 'ประเทศไทย (ราชอาณาจักรไทย)',
    },
    legalContext: {
      pdpaCompliance: 'COMPLIANT',
      pdpaRiskNotes: [],
      governingStatutes: [
        'พ.ร.บ. อาวุธปืน เครื่องกระสุนปืน สิ่งเทียมอาวุธปืนฯ พ.ศ. 2490',
        'พ.ร.บ. คุ้มครองข้อมูลส่วนบุคคล พ.ศ. 2562 (PDPA)',
      ],
      governmentAgencies: ['กรมการปกครอง', 'สำนักงานตำรวจแห่งชาติ', 'กรมสุขภาพจิต'],
    },
    businessContext: {
      financialTaxNote: 'การคำนวณภาษีอ้างอิงอัตราภาษีมูลค่าเพิ่ม 7% (VAT 7%) และระเบียบกรมสรรพากร',
      documentTypes: ['หนังสือราชการ', 'รายงานผลการวิเคราะห์ยุทธศาสตร์'],
      corporateProtocol: 'ขั้นตอนการเสนอเรื่องและรับรองเอกสารตามระเบียบสารบรรณไทย',
    },
    emotionSafety: {
      perceivedSentiment: 'สุภาพ/ทางการ',
      safetyFlags: {
        hateSpeech: false,
        defamationRisk: false,
        politicalSensitivity: false,
        pdpaViolationRisk: false,
        illegalWeaponsRisk: false,
      },
      safetyRating: 'SAFE_FOR_PCA',
    },
    thaiRagAdapter: {
      provider: 'OpenThaiRAG Adapter v2.1 & Official Knowledge Vector Index',
      retrievedSources: [
        'พ.ร.บ. อาวุธปืน พ.ศ. 2490 (กรมการปกครอง)',
        'แนวทางป้องปรามเหตุความรุนแรง SMI-V (กรมสุขภาพจิต)',
      ],
      citationConfidence: 0.95,
    },
    firearmsLegalFramework: {
      statute: 'พ.ร.บ. อาวุธปืน เครื่องกระสุนปืน สิ่งเทียมอาวุธปืนฯ พ.ศ. 2490 (และฉบับแก้ไขเพิ่มเติม)',
      licensingAuthority: 'กรมการปกครอง กระทรวงมหาดไทย (ระบบใบอนุญาต ป.3 ซื้อ/รับโอน และ ป.4 มี/ใช้)',
      screeningProcess: 'การตรวจสอบประวัติอาชญากรรม (สตช.), ใบรับรองแพทย์ประเมินสภาวะจิตใจ, และการสอบประวัติความประพฤติ',
      illicitControl: 'การควบคุมและกวาดล้างแบลงค์กัน (Blank Guns), BB Guns ดัดแปลง และการค้าอาวุธปืนออนไลน์',
      governmentWeapons: 'มาตรการจัดเก็บ กำกับดูแล และคัดกรองสภาพจิตใจผู้ถือครองอาวุธปืนสวัสดิการข้าราชการ/เจ้าหน้าที่',
    },
    communityMentalHealth: {
      governingBody: 'กรมสุขภาพจิต กระทรวงสาธารณสุข & สายด่วนสุขภาพจิต 1323',
      grassrootsNetwork: 'โรงพยาบาลส่งเสริมสุขภาพตำบล (รพ.สต.) และอาสาสมัครสาธารณสุขประจำหมู่บ้าน (อสม.) คัดกรองกลุ่มเสี่ยง SMI-V',
      referralPathway: 'เครือข่ายส่งต่อระดับพื้นที่: รพ.สต. -> รพ.ชุมชน (รพช.) -> รพ.ศูนย์/จิตเวช ร่วมกับฝ่ายปกครอง',
      deStigmatizationNote: 'เน้น Threat Assessment รายบุคคล เพื่อลดการตีตรา (Stigmatization) ผู้ป่วยจิตเวชทั่วไปในสังคม',
    },
    earlyWarningMechanisms: {
      emergencyHotlines: 'ศูนย์รับแจ้งเหตุฉุกเฉิน 191 / 1599 (สตช.) และ ศูนย์ดำรงธรรม 1567 (กระทรวงมหาดไทย)',
      localGovernance: 'เครือข่ายฝ่ายปกครองท้องที่: กำนัน, ผู้ใหญ่บ้าน, ผู้นำชุมชน และ คณะกรรมการหมู่บ้าน (กม.) ในการสังเกตพฤติกรรมเสี่ยง',
      institutionalReporting: 'ระบบเฝ้าระวังและการรับแจ้งเบาะแสนิรนาม (Anonymous Reporting System) ในสถานศึกษาและหน่วยงานองค์กร',
      protocolApproach: 'Threat Assessment Protocol (สังเกตพฤติกรรมเสี่ยงและสัญญาณรั่วไหล - Leakage) แทนการใช้ Profiling',
    },
    statusNote: 'เปิดใช้งาน Contextual Intelligence Layer (กรอบบริบทไทย 10 โมดูล) สำหรับประมวลผลยุทธศาสตร์ PUNN PCA v2.0 เรียบร้อยแล้ว',
  };

  const scores = data.confidenceBreakdown || {
    overall: 96,
    language: 100,
    intent: 94,
    reference: 88,
    cultural: 98,
    legalSafety: 96,
  };

  return (
    <div id="contextual-awareness-viewer" className="bg-slate-900/80 backdrop-blur-md rounded-xl border border-indigo-500/30 p-5 shadow-xl text-slate-100 space-y-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-base text-slate-100 flex items-center gap-2">
              PCA Context Processing & Semantic Awareness Engine
              <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 font-mono">
                {data.activeDomain}
              </span>
            </h3>
            <p className="text-xs text-slate-400">
              วิเคราะห์บริบทข้อความและประเด็นเชิงลึก พร้อมการประเมินความมั่นใจแบบ 5 แกน
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 rounded-md">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Active Intelligence Pipeline</span>
        </div>
      </div>

      {/* 5-Axis Context Confidence Score Cards */}
      <div className="bg-slate-950/70 rounded-xl p-4 border border-indigo-500/20 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-300 text-xs font-bold uppercase font-mono">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Context Confidence Matrix (ดัชนีความเข้าใจบริบท)</span>
          </div>
          <div className="text-xs font-bold text-emerald-400 font-mono">
            เข้าใจบริบทโดยรวม: {scores.overall}%
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">ภาษา (Language)</div>
            <div className="text-base font-extrabold text-indigo-400 font-mono mt-0.5">{scores.language}%</div>
          </div>
          <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">เจตนา (Intent)</div>
            <div className="text-base font-extrabold text-purple-400 font-mono mt-0.5">{scores.intent}%</div>
          </div>
          <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">อ้างอิง (Reference)</div>
            <div className="text-base font-extrabold text-cyan-400 font-mono mt-0.5">{scores.reference}%</div>
          </div>
          <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 text-center">
            <div className="text-[10px] text-slate-400">วัฒนธรรม (Culture)</div>
            <div className="text-base font-extrabold text-amber-400 font-mono mt-0.5">{scores.cultural}%</div>
          </div>
          <div className="bg-slate-900/90 rounded-lg p-2.5 border border-slate-800 text-center col-span-2 sm:col-span-1">
            <div className="text-[10px] text-slate-400">กฎหมาย/PDPA</div>
            <div className="text-base font-extrabold text-emerald-400 font-mono mt-0.5">{scores.legalSafety}%</div>
          </div>
        </div>
      </div>

      {/* 10 Intelligence Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
        {/* Module 1: Language & Honorifics */}
        <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800 space-y-2">
          <div className="flex items-center gap-1.5 text-indigo-400 font-bold">
            <Brain className="w-3.5 h-3.5" />
            <span>1. Language & Honorifics Layer</span>
          </div>
          <div className="space-y-1 text-slate-300">
            <div><span className="text-slate-400">ระดับภาษา:</span> {data.languageLayer?.registerLevel || 'Consultative'}</div>
            <div><span className="text-slate-400">คำลงท้าย/Politeness:</span> {data.honorifics?.politenessLevel || 'สุภาพ'}</div>
            <div><span className="text-slate-400">บริบทความสัมพันธ์:</span> {data.honorifics?.relationshipContext || 'ลูกค้า'}</div>
            <div><span className="text-slate-400">โหมด Persona:</span> <span className="text-indigo-300 font-mono">{data.honorifics?.personaMode || 'Analyst Mode'}</span></div>
          </div>
        </div>

        {/* Module 2: Semantic Intent & Urgency */}
        <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800 space-y-2">
          <div className="flex items-center gap-1.5 text-purple-400 font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>2. Intent & Urgency Resolver</span>
          </div>
          <div className="space-y-1 text-slate-300">
            <div><span className="text-slate-400">เจตนาหลัก:</span> {data.semanticIntent?.primaryIntent || 'Strategic Analysis'}</div>
            <div><span className="text-slate-400">ระดับความเร่งด่วน:</span> <span className="text-amber-300 font-mono">{data.semanticIntent?.urgencyLevel || 'Strategic Planning'}</span></div>
            <div><span className="text-slate-400">คำกำกวม:</span> {data.languageLayer?.ambiguityDetected ? data.languageLayer.ambiguousTerms.join(', ') : 'ไม่พบคำกำกวมวิกฤต'}</div>
          </div>
        </div>

        {/* Module 3: Cultural & Social Nuances */}
        <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800 space-y-2">
          <div className="flex items-center gap-1.5 text-amber-400 font-bold">
            <Users className="w-3.5 h-3.5" />
            <span>3. Cultural Nuance & Idioms</span>
          </div>
          <div className="space-y-1 text-slate-300">
            <div><span className="text-slate-400">สำนวนไทย:</span> {data.culturalContext?.idiomsDetected?.length ? data.culturalContext.idiomsDetected.join(', ') : 'ไม่มีสำนวนซ้อนทับ'}</div>
            <div><span className="text-slate-400">มิติทางสังคม:</span> {data.culturalContext?.socialNuance || 'ระบบอาวุธปืน/ฝ่ายปกครอง'}</div>
          </div>
        </div>

        {/* Module 4: Temporal & Location Entities */}
        <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800 space-y-2">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold">
            <MapPin className="w-3.5 h-3.5" />
            <span>4. Temporal & Location Entities</span>
          </div>
          <div className="space-y-1 text-slate-300">
            <div><span className="text-slate-400">ปี พ.ศ. / ค.ศ.:</span> {data.temporalContext?.beConversionNote}</div>
            <div><span className="text-slate-400">ขอบเขตพื้นที่:</span> {data.locationContext?.geographicEntities?.join(', ')}</div>
            <div><span className="text-slate-400">โหนดคมนาคม:</span> {data.locationContext?.transitNodes?.join(', ')}</div>
          </div>
        </div>

        {/* Module 5: Legal, PDPA & Regulations */}
        <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800 space-y-2">
          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <Scale className="w-3.5 h-3.5" />
            <span>5. Legal Context & PDPA Compliance</span>
          </div>
          <div className="space-y-1 text-slate-300">
            <div>
              <span className="text-slate-400">สถานะ PDPA:</span>{' '}
              <span className={`font-mono font-bold ${data.legalContext?.pdpaCompliance === 'COMPLIANT' ? 'text-emerald-400' : 'text-amber-400'}`}>
                {data.legalContext?.pdpaCompliance || 'COMPLIANT'}
              </span>
            </div>
            <div><span className="text-slate-400">กฎหมายที่เกี่ยวข้อง:</span> {data.legalContext?.governingStatutes?.slice(0, 2).join(', ')}</div>
            <div><span className="text-slate-400">หน่วยงานกำกับ:</span> {data.legalContext?.governmentAgencies?.slice(0, 2).join(', ')}</div>
          </div>
        </div>

        {/* Module 6: Thai Safety & RAG Adapter */}
        <div className="bg-slate-950/60 rounded-lg p-3.5 border border-slate-800 space-y-2">
          <div className="flex items-center gap-1.5 text-rose-400 font-bold">
            <Shield className="w-3.5 h-3.5" />
            <span>6. Thai Safety & OpenThaiRAG</span>
          </div>
          <div className="space-y-1 text-slate-300">
            <div><span className="text-slate-400">ระดับความปลอดภัย:</span> <span className="text-emerald-400 font-mono font-bold">{data.emotionSafety?.safetyRating || 'SAFE_FOR_PCA'}</span></div>
            <div><span className="text-slate-400">น้ำเสียงอารมณ์:</span> {data.emotionSafety?.perceivedSentiment || 'สุภาพ/ทางการ'}</div>
            <div><span className="text-slate-400">Thai RAG Adapter:</span> {data.thaiRagAdapter?.provider || 'OpenThaiRAG Adapter v2.1'}</div>
          </div>
        </div>
      </div>

      {/* Domain Specific Context: Firearms, Mental Health, Early Warning */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-slate-800 text-xs">
        <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
          <div className="text-indigo-400 font-bold mb-1 flex items-center gap-1">
            <Scale className="w-3 h-3" /> กฎหมายอาวุธปืนไทย (พ.ร.บ. 2490)
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {data.firearmsLegalFramework?.statute} • ใบอนุญาต ป.3/ป.4 โดยกรมการปกครอง
          </p>
        </div>

        <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
          <div className="text-rose-400 font-bold mb-1 flex items-center gap-1">
            <HeartPulse className="w-3 h-3" /> สุขภาพจิตชุมชน (สายด่วน 1323)
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {data.communityMentalHealth?.governingBody} • คัดกรองผู้ป่วยกลุ่มเสี่ยง SMI-V โดย รพ.สต. และ อสม.
          </p>
        </div>

        <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-800/80">
          <div className="text-amber-400 font-bold mb-1 flex items-center gap-1">
            <Bell className="w-3 h-3" /> สายด่วนฉุกเฉิน (191 / 1599 / 1567)
          </div>
          <p className="text-slate-300 text-[11px] leading-relaxed">
            {data.earlyWarningMechanisms?.emergencyHotlines} • ฝ่ายปกครองท้องที่ & Threat Assessment Protocol
          </p>
        </div>
      </div>

      <div className="pt-2 flex items-center justify-between text-xs text-slate-400 border-t border-slate-800/80">
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-indigo-400" />
          <span>{data.statusNote}</span>
        </div>
        <span className="font-mono text-[10px] text-slate-500">PUNN-PCA-THAI-ENGINE-V2.5</span>
      </div>
    </div>
  );
};
