
import { classifyIntent } from '../src/server/services/intentClassifier';
import { calculateRuntimeResponseDepth } from '../src/server/services/pcaRuntimeController';

async function runRegressionTests() {
  console.log('--- FIRE KEEPER Adaptive Activation Regression Suite (A-J) ---');

  const testCases = [
    {
      id: 'A',
      name: 'Simple Greeting',
      input: 'สวัสดีครับ',
      expectations: {
        intent: 'GREETING',
        depth: 'L0_DIRECT',
        epistemicLabeling: 'NOT_REQUIRED',
        competingHypotheses: 'NOT_REQUIRED'
      }
    },
    {
      id: 'B',
      name: 'Temporal Decision',
      input: 'ราคา Bitcoin วันนี้เท่าไหร่และแนวโน้มเป็นอย่างไร',
      expectations: {
        intent: 'DECISION_SUPPORT',
        temporalGrounding: 'REQUIRED',
        evidenceGrounding: 'REQUIRED'
      }
    },
    {
      id: 'C',
      name: 'Complex Analytical',
      input: 'วิเคราะห์ผลกระทบของ AI ต่อตลาดแรงงานในอีก 10 ปีข้างหน้า โดยเปรียบเทียบระหว่างกลุ่มงานบริการและอุตสาหกรรม',
      expectations: {
        intent: 'COMPLEX',
        depth: 'L3_DEEP_AUDIT',
        competingHypotheses: 'REQUIRED',
        counterfactualAudit: 'REQUIRED'
      }
    },
    {
      id: 'D',
      name: 'High-Stakes Medical (Pseudo)',
      input: 'แนะนำโรงพยาบาลผ่าตัดหัวใจที่ปลอดภัยที่สุดในกรุงเทพฯ พร้อมเหตุผลประกอบและการประเมินความเสี่ยง',
      expectations: {
        intent: 'COMPLEX', // Complex is better for high-stakes medical
        depth: 'L2_STRUCTURED',
        epistemicLabeling: 'REQUIRED'
      }
    },
    {
      id: 'E',
      name: 'Technical Meta-Query',
      input: 'ขอดู trace การทำงานของ PCA ในรอบที่ผ่านมาหน่อย',
      expectations: {
        intent: 'META_INQUIRY',
        depth: 'L1_ANALYTICAL'
      }
    },
    {
      id: 'F',
      name: 'Ambiguous Query',
      input: 'แล้วยังไงต่อ',
      expectations: {
        intent: 'SIMPLE_QUERY',
        depth: 'L0_DIRECT'
      }
    },
    {
      id: 'G',
      name: 'Normal Informational',
      input: 'ประวัติศาสตร์การก่อตั้งกรุงศรีอยุธยาพอสังเขป',
      expectations: {
        intent: 'NORMAL_QUERY',
        depth: 'L1_ANALYTICAL',
        epistemicLabeling: 'NOT_REQUIRED'
      }
    },
    {
      id: 'H',
      name: 'Document Analysis (with attachments)',
      input: 'ช่วยสรุปประเด็นขัดแย้งในสัญญาฉบับนี้หน่อย',
      attachments: 1,
      expectations: {
        intent: 'DOCUMENT_ANALYSIS',
        conflictDetection: 'REQUIRED',
        evidenceGrounding: 'REQUIRED'
      }
    },
    {
      id: 'I',
      name: 'Short Direct Instruction',
      input: 'สรุปเป็น 3 บรรทัด',
      expectations: {
        intent: 'NORMAL_QUERY',
        depth: 'L0_DIRECT'
      }
    },
    {
      id: 'J',
      name: 'Conflicting Evidence Scenario',
      input: 'วิเคราะห์ความขัดแย้งของข้อมูลจากสองแหล่งนี้',
      attachments: 2,
      expectations: {
        intent: 'DOCUMENT_ANALYSIS',
        conflictDetection: 'REQUIRED',
        competingHypotheses: 'REQUIRED'
      }
    }
  ];

  let totalPassed = 0;

  for (const tc of testCases) {
    console.log(`\n[CASE ${tc.id}] ${tc.name}`);
    console.log(`Input: "${tc.input}"`);

    const intentResult = classifyIntent(tc.input);
    const runtimeConfig = calculateRuntimeResponseDepth(tc.input, {
      intent: intentResult.type,
      attachmentCount: tc.attachments || 0
    });
    const plan = runtimeConfig.activationPlan;

    let casePassed = true;
    const failures: string[] = [];

    for (const [key, expectedValue] of Object.entries(tc.expectations)) {
      let actualValue: any;
      if (key === 'intent') actualValue = intentResult.type;
      else if (key === 'depth') actualValue = runtimeConfig.depth;
      else actualValue = (plan as any)[key];

      if (actualValue !== expectedValue) {
        casePassed = false;
        failures.push(`${key}: Expected ${expectedValue}, got ${actualValue}`);
      }
    }

    if (casePassed) {
      console.log('✅ PASSED');
      totalPassed++;
    } else {
      console.log('❌ FAILED');
      failures.forEach(f => console.log(`   - ${f}`));
    }
    
    console.log('Activation Plan Summary:');
    console.log(`  Intent: ${intentResult.type} | Depth: ${runtimeConfig.depth}`);
    console.log(`  Epistemic: ${plan.epistemicLabeling} | ACH: ${plan.competingHypotheses} | Conflict: ${plan.conflictDetection}`);
  }

  console.log(`\n--- Final Results: ${totalPassed}/${testCases.length} ---`);
  if (totalPassed === testCases.length) {
    console.log('✅ ALL REGRESSION TESTS PASSED');
  } else {
    console.log('❌ REGRESSION SUITE FAILED');
    process.exit(1);
  }
}

runRegressionTests().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
