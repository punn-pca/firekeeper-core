import { AttachedFile } from '../types';

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function getFileCategory(mimeType: string, filename: string): 'image' | 'pdf' | 'code' | 'data' | 'text' | 'doc' {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType === 'application/pdf' || ext === 'pdf') return 'pdf';
  if (['csv', 'json', 'xlsx', 'xls', 'tsv', 'xml'].includes(ext) || mimeType.includes('csv') || mimeType.includes('json')) return 'data';
  if (['js', 'ts', 'tsx', 'jsx', 'py', 'java', 'cpp', 'c', 'cs', 'go', 'rs', 'php', 'rb', 'html', 'css', 'sql', 'sh', 'yaml', 'yml'].includes(ext)) return 'code';
  if (['doc', 'docx', 'ppt', 'pptx'].includes(ext)) return 'doc';
  return 'text';
}

export async function readFileAsAttachedFile(file: File): Promise<AttachedFile> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    const isTextOrCode =
      file.type.startsWith('text/') ||
      file.type === 'application/json' ||
      file.type === 'application/javascript' ||
      file.type === 'application/xml' ||
      ['.txt', '.md', '.csv', '.json', '.js', '.ts', '.tsx', '.jsx', '.py', '.html', '.css', '.sql', '.yaml', '.yml', '.log'].some((ext) =>
        file.name.toLowerCase().endsWith(ext)
      );

    if (isTextOrCode) {
      reader.readAsText(file, 'UTF-8');
      reader.onload = () => {
        const textContent = reader.result as string;
        // Also generate base64 for consistency
        const base64 = btoa(unescape(encodeURIComponent(textContent)));
        resolve({
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'text/plain',
          dataUrl: `data:${file.type || 'text/plain'};base64,${base64}`,
          base64,
          textContent,
        });
      };
      reader.onerror = (error) => reject(error);
    } else {
      reader.readAsDataURL(file);
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64Parts = dataUrl.split(',');
        const base64 = base64Parts.length > 1 ? base64Parts[1] : dataUrl;
        resolve({
          id: `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          name: file.name,
          size: file.size,
          type: file.type || 'application/octet-stream',
          dataUrl,
          base64,
        });
      };
      reader.onerror = (error) => reject(error);
    }
  });
}

export const SAMPLE_ATTACHMENTS: Array<{
  id: string;
  title: string;
  description: string;
  file: AttachedFile;
}> = [
  {
    id: 'sample-report-pdf',
    title: '📊 รายงานกลยุทธ์ AI Enterprise Q3/2026',
    description: 'เอกสารข้อเสนอแนะเชิงยุทธศาสตร์การลงทุนระบบ Cloud & AI Guardrail',
    file: {
      id: 'att-sample-report-01',
      name: 'AI_Enterprise_Strategy_Report_Q3_2026.pdf',
      size: 485200,
      type: 'application/pdf',
      textContent: `[EXECUTIVE SUMMARY - STRATEGIC REPORT Q3/2026]
องค์กร: Global Tech Enterprises Thailand
หัวข้อ: ยุทธศาสตร์การประยุกต์ใช้ AI Governance & Sovereign Cloud
ข้อสรุปสำคัญ:
1. การเปลี่ยนผ่านจาก Legacy On-Premise สู่ Multi-Cloud Architecture ช่วยลด OpEx ลง 24%
2. การปรับใช้ PUNN Cognitive Architecture (PCA) ทำให้ระดับ Human Trust คะแนนพุ่งสูงขึ้น 94.2%
3. ความเสี่ยงหลัก: ขาดแคลนบุคลากรผู้เชี่ยวชาญ AI Engineering & Data Security Compliance
ข้อเสนอแนะ: จัดสรรงบประมาณ 12.5 ล้านบาท เพื่อพัฒนา Internal Prompt Guardrail และ LTM Memory Bank Engine`,
    },
  },
  {
    id: 'sample-code-ts',
    title: '💻 ซอร์สโค้ด PCA Decision Engine',
    description: 'โค้ดคำนวณ Bayesian Confidence & Ensemble Weighting',
    file: {
      id: 'att-sample-code-02',
      name: 'pcaDecisionEngine.ts',
      size: 14200,
      type: 'text/typescript',
      textContent: `// PUNN Cognitive Architecture (PCA) - Bayesian & Ensemble Confidence Engine
export interface CalibratedMetrics {
  priorScore: number;
  likelihood: number;
  marginalProb: number;
  posteriorProb: number;
  eceScore: number;
}

export function calculateEnsembleConfidence(
  semanticScore: number,
  crossEncoderScore: number,
  selfEvalScore: number,
  conflictPenalty: number
): CalibratedMetrics {
  // Ensemble Formula: 0.25 * Semantic + 0.35 * CrossEncoder + 0.40 * SelfEval
  const rawEnsemble = (semanticScore * 0.25) + (crossEncoderScore * 0.35) + (selfEvalScore * 0.40);
  const priorScore = 0.65;
  const likelihood = Math.min(0.98, rawEnsemble);
  const marginalProb = 0.72;
  const posteriorProb = Number(((likelihood * priorScore) / marginalProb).toFixed(3));
  
  return {
    priorScore,
    likelihood,
    marginalProb,
    posteriorProb: Math.max(0.1, posteriorProb - conflictPenalty),
    eceScore: 0.032 // Expected Calibration Error on 1,200 Benchmark Scenarios
  };
}`,
    },
  },
  {
    id: 'sample-data-csv',
    title: '📈 ตารางข้อมูลผลตอบแทนโครงการ (CSV)',
    description: 'ชุดข้อมูลเปรียบเทียบ ROI & Latency ของระบบ AI ต่างๆ',
    file: {
      id: 'att-sample-csv-03',
      name: 'AI_Vendor_Benchmark_ROI_2026.csv',
      size: 8900,
      type: 'text/csv',
      textContent: `Vendor_Name,Architecture_Type,Accuracy_Pct,Latency_Ms,Cost_Per_1k_Tokens_USD,Human_Agency_Compliance
PUNN FIRE Keeper,12-Stage Hybrid Matrix,96.8%,320,0.00015,100% (Mandatory Preserved)
Vendor Alpha Direct,Vanilla Direct Prompt,82.1%,850,0.00045,45% (Autonomous Override)
Vendor Beta RAG,Standard Vector Search,88.4%,620,0.00030,70% (Advisory Guard)
Vendor Gamma Agent,ReAct Loop Agent,84.0%,1250,0.00080,60% (Partial Human Loop)`,
    },
  },
];

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator?.clipboard && typeof navigator.clipboard.writeText === 'function') {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch (clipErr) {
        // Suppress clipboard API error (e.g., The operation is insecure)
      }
    }
  } catch (err) {
    // Suppress general errors
  }

  // Fallback for iframe/restricted context where clipboard API is blocked
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      return !!successful;
    } catch (execErr) {
      if (textArea.parentNode) {
        document.body.removeChild(textArea);
      }
      return false;
    }
  } catch (fallbackErr) {
    // Suppress fallback clipboard copy failure in restricted iframe
    return false;
  }
}

