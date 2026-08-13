export interface StructuredExecutiveSummary {
  objective: string;
  keyFindings: string[];
  majorRisks: string[];
  recommendedActions: string[];
  conclusion: string;
}

export function extractExecutiveSummary(content: string, pcaState?: any): StructuredExecutiveSummary {
  const lines = content.split('\n').map(l => l.trim()).filter(Boolean);
  
  // 1. Objective
  let objective = pcaState?.goal || pcaState?.decision || '';
  if (!objective) {
    const firstPara = lines.find(l => !l.startsWith('#') && !l.startsWith('-') && !l.startsWith('*') && l.length > 20);
    objective = firstPara ? (firstPara.length > 150 ? firstPara.substring(0, 147) + '...' : firstPara) : 'วิเคราะห์ประเด็นยุทธศาสตร์และข้อมูลเชิงลึกตามโจทย์ที่ได้รับมอบหมาย';
  }

  // 2. Key Findings
  const keyFindings: string[] = [];
  const riskItems: string[] = [];
  const actionItems: string[] = [];
  let conclusion = '';

  let currentSection = '';

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('finding') || lower.includes('ข้อพบ') || lower.includes('key') || lower.includes('ประเด็นสำคัญ')) {
      currentSection = 'findings';
      continue;
    } else if (lower.includes('risk') || lower.includes('ความเสี่ยง') || lower.includes('hazard')) {
      currentSection = 'risks';
      continue;
    } else if (lower.includes('recommend') || lower.includes('action') || lower.includes('ข้อเสนอแนะ') || lower.includes('แนวทาง')) {
      currentSection = 'actions';
      continue;
    } else if (lower.includes('conclusion') || lower.includes('summary') || lower.includes('สรุป') || lower.includes('บทสรุป')) {
      currentSection = 'conclusion';
      continue;
    }

    if (line.startsWith('-') || line.startsWith('*') || /^\d+\./.test(line)) {
      const cleanText = line.replace(/^[-*]\s*|\d+\.\s*/, '').trim();
      if (cleanText.length > 10) {
        if (currentSection === 'risks' || lower.includes('risk') || lower.includes('เสี่ยง')) {
          if (riskItems.length < 3) riskItems.push(cleanText);
        } else if (currentSection === 'actions' || lower.includes('ควร') || lower.includes('recommend') || lower.includes('action')) {
          if (actionItems.length < 5) actionItems.push(cleanText);
        } else {
          if (keyFindings.length < 5) keyFindings.push(cleanText);
        }
      }
    } else if (currentSection === 'conclusion' && !conclusion) {
      conclusion = line;
    }
  }

  // Fallbacks if lists are empty
  if (keyFindings.length === 0) {
    const bullets = lines.filter(l => (l.startsWith('-') || l.startsWith('*') || /^\d+\./.test(l))).map(l => l.replace(/^[-*]\s*|\d+\.\s*/, '').trim());
    if (bullets.length > 0) {
      keyFindings.push(...bullets.slice(0, 5));
    } else {
      // Take standard paragraphs
      const paras = lines.filter(l => !l.startsWith('#') && l.length > 30);
      for (const p of paras.slice(0, 3)) {
        keyFindings.push(p.length > 120 ? p.substring(0, 117) + '...' : p);
      }
    }
  }

  if (riskItems.length === 0) {
    riskItems.push(
      'ความเสี่ยงจากการขาดการตรวจสอบทานข้อมูลรอบด้านและกรอบธรรมาภิบาล',
      'ข้อจำกัดในการรองรับความเปลี่ยนแปลงของสถานการณ์เฉพาะหน้า'
    );
  }

  if (actionItems.length === 0) {
    actionItems.push(
      'กำหนดตัวชี้วัดความสำเร็จ (KPIs) และกรอบเวลาในการดำเนินงานอย่างชัดเจน',
      'บูรณาการระบบ Human-in-the-Loop เพื่อควบคุมคุณภาพการตัดสินใจขั้นเด็ดขาด',
      'ติดตามและประเมินผลสัมฤทธิ์อย่างต่อเนื่องพร้อมปรับปรุงแผนยุทธศาสตร์'
    );
  }

  if (!conclusion) {
    const lastParas = lines.filter(l => !l.startsWith('#') && !l.startsWith('-') && l.length > 40);
    conclusion = lastParas.length > 0 
      ? lastParas[lastParas.length - 1] 
      : 'การดำเนินงานตามกรอบยุทธศาสตร์ที่วิเคราะห์นี้จะช่วยเพิ่มความแม่นยำและลดความเสี่ยงเชิงปฏิบัติการได้อย่างมีนัยสำคัญ';
  }

  return {
    objective: sanitize(objective),
    keyFindings: keyFindings.slice(0, 5).map(sanitize),
    majorRisks: riskItems.slice(0, 3).map(sanitize),
    recommendedActions: actionItems.slice(0, 5).map(sanitize),
    conclusion: sanitize(conclusion.length > 250 ? conclusion.substring(0, 247) + '...' : conclusion)
  };
}

function sanitize(str: string): string {
  if (!str) return '';
  return str.replace(/\*\*/g, '').replace(/\*/g, '').trim();
}
