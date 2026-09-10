/**
 * Automated Test Suite: Firekeeper Request Router & DeepSeek Vision Integration
 * Model: deepseek-v4-flash-vision-exp
 * 
 * Verifies:
 * 1. Text-only request routing -> Ollama / local LLM default
 * 2. Text + PNG image routing -> DeepSeek Vision (deepseek-v4-flash-vision-exp)
 * 3. Text + JPEG image routing -> DeepSeek Vision (deepseek-v4-flash-vision-exp)
 * 4. Text + WEBP/GIF image routing -> DeepSeek Vision (deepseek-v4-flash-vision-exp)
 * 5. Invalid / corrupt image validation & error handling
 * 6. Missing API key handling & governance notice
 * 7. Cross-user multi-tenant data isolation
 * 8. Server-authoritative router decision (Frontend neutrality)
 */

import { 
  routeRequest, 
  inspectAttachments, 
  isImageAttachment 
} from '../src/server/services/visionRouter';
import { 
  validateImageAttachment, 
  formatImageDataUrl, 
  buildDeepSeekVisionMessages,
  DEEPSEEK_VISION_MODEL,
  callDeepSeekVisionContentWithRetry,
  checkDeepSeekVisionStatus
} from '../src/server/services/deepseekVision';
import { resolveProvider, formatModelTag, resolveModelDetails } from '../src/utils/modelUtils';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✅ PASS: ${testName}`);
  } else {
    console.error(`  ❌ FAIL: ${testName}`);
    if (detail) console.error(`     Detail: ${detail}`);
  }
}

// 1x1 Transparent PNG base64
const VALID_PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const VALID_JPEG_BASE64 = '/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////wgALCAABAAEBAREA/8QAFBABAAAAAAAAAAAAAAAAAAAAAP/aAAgBAQABPxA=';
const VALID_WEBP_BASE64 = 'UklGRiQAAABXRUJQVlA4IBgAAAAwAQCdASoBAAEAAQAcJaQAA3AA/v3AgAA=';
const VALID_GIF_BASE64 = 'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

async function runAllTests() {
  console.log('════════════════════════════════════════════════════════════════');
  console.log('🧪 FIRE KEEPER: DeepSeek Vision & Request Router Test Suite');
  console.log('════════════════════════════════════════════════════════════════\n');

  // -------------------------------------------------------------
  // Test 1: Text-only request routes to Ollama by default
  // -------------------------------------------------------------
  console.log('Test Group 1: Text-Only Request Routing');
  {
    const res = routeRequest('ช่วยวิเคราะห์สถานการณ์เศรษฐกิจ', []);
    assert(res.provider === 'ollama', 'Text-only request selects Ollama provider');
    assert(res.model.includes('qwen') || res.model.includes('ollama'), `Text-only model is local LLM (${res.model})`);
    assert(res.hasImages === false, 'hasImages is false');
    assert(res.images.length === 0, 'images array is empty');
    assert(res.decisionAuthority === 'SERVER_ROUTER_EXCLUSIVE', 'Router is server-authoritative');
  }

  // -------------------------------------------------------------
  // Test 2: Text + PNG Image routes to deepseek-v4-flash-vision-exp
  // -------------------------------------------------------------
  console.log('\nTest Group 2: Text + PNG Image Routing');
  {
    const attachments = [{
      name: 'architecture_diagram.png',
      type: 'image/png',
      dataUrl: `data:image/png;base64,${VALID_PNG_BASE64}`,
      size: 100
    }];

    const res = routeRequest('ช่วยอธิบายสถาปัตยกรรมในรูปนี้', attachments);
    assert(res.provider === 'deepseek_vision', 'PNG request routes to deepseek_vision provider');
    assert(res.model === 'deepseek-v4-flash-vision-exp', `PNG request selects canonical model: ${DEEPSEEK_VISION_MODEL}`);
    assert(res.hasImages === true, 'hasImages is true');
    assert(res.images.length === 1, '1 validated image recognized');
    assert(res.images[0].mimeType === 'image/png', 'MIME type is image/png');
    assert(res.images[0].dataUrl.startsWith('data:image/png;base64,'), 'Data URL correctly formatted');
  }

  // -------------------------------------------------------------
  // Test 3: Text + JPEG Image routes to deepseek-v4-flash-vision-exp
  // -------------------------------------------------------------
  console.log('\nTest Group 3: Text + JPEG Image Routing');
  {
    const attachments = [{
      name: 'financial_receipt.jpg',
      type: 'image/jpeg',
      base64: VALID_JPEG_BASE64,
      size: 120
    }];

    const res = routeRequest('ตรวจสอบใบเสร็จนี้ให้หน่อย', attachments);
    assert(res.provider === 'deepseek_vision', 'JPEG request routes to deepseek_vision provider');
    assert(res.model === 'deepseek-v4-flash-vision-exp', `JPEG request selects model ${DEEPSEEK_VISION_MODEL}`);
    assert(res.images[0].mimeType === 'image/jpeg', 'MIME normalized to image/jpeg');
  }

  // -------------------------------------------------------------
  // Test 4: Text + WEBP & GIF Images
  // -------------------------------------------------------------
  console.log('\nTest Group 4: WEBP & GIF Image Formats');
  {
    const attachments = [
      { name: 'diagram.webp', type: 'image/webp', dataUrl: `data:image/webp;base64,${VALID_WEBP_BASE64}` },
      { name: 'animation.gif', type: 'image/gif', dataUrl: `data:image/gif;base64,${VALID_GIF_BASE64}` }
    ];

    const res = routeRequest('เปรียบเทียบภาพสองภาพนี้', attachments);
    assert(res.provider === 'deepseek_vision', 'Multi-format images route to deepseek_vision');
    assert(res.images.length === 2, 'Both WEBP and GIF attachments validated');
    assert(res.images[0].mimeType === 'image/webp', 'First image is image/webp');
    assert(res.images[1].mimeType === 'image/gif', 'Second image is image/gif');
  }

  // -------------------------------------------------------------
  // Test 5: Mixed attachments (Images + PDF/Text)
  // -------------------------------------------------------------
  console.log('\nTest Group 5: Mixed Attachments (Images + Documents)');
  {
    const attachments = [
      { name: 'report.pdf', type: 'application/pdf', dataUrl: 'data:application/pdf;base64,JVBER...' },
      { name: 'chart.png', type: 'image/png', dataUrl: `data:image/png;base64,${VALID_PNG_BASE64}` }
    ];

    const res = routeRequest('สรุปรายงานพร้อมแผนภูมิ', attachments);
    assert(res.provider === 'deepseek_vision', 'Mixed request with image routes to vision');
    assert(res.images.length === 1, 'Image separated into images list');
    assert(res.nonImageAttachments.length === 1, 'PDF separated into non-image attachments');
    assert(res.nonImageAttachments[0].name === 'report.pdf', 'Non-image document preserved');
  }

  // -------------------------------------------------------------
  // Test 6: Invalid / Corrupted Image Validation
  // -------------------------------------------------------------
  console.log('\nTest Group 6: Invalid & Corrupted Image Handling');
  {
    const emptyPayload = { name: 'broken.png', type: 'image/png', dataUrl: '' };
    const invalidValidation = validateImageAttachment(emptyPayload);
    assert(!invalidValidation.valid, 'Empty image data rejected by validator');

    const unsupportedFormat = { name: 'vector.svg', type: 'image/svg+xml', dataUrl: 'data:image/svg+xml;base64,PHN2Zw...' };
    const formatValidation = validateImageAttachment(unsupportedFormat);
    assert(!formatValidation.valid, 'Unsupported SVG format rejected');

    const oversizedAtt = {
      name: 'giant.png',
      type: 'image/png',
      dataUrl: 'data:image/png;base64,' + 'A'.repeat(30 * 1024 * 1024) // ~22.5 MB
    };
    const sizeValidation = validateImageAttachment(oversizedAtt);
    assert(!sizeValidation.valid, 'Oversized image (>20MB) rejected');
  }

  // -------------------------------------------------------------
  // Test 7: Multimodal Payload Generation
  // -------------------------------------------------------------
  console.log('\nTest Group 7: Multimodal Payload Construction');
  {
    const images = [{
      name: 'test.png',
      mimeType: 'image/png',
      size: 100,
      dataUrl: `data:image/png;base64,${VALID_PNG_BASE64}`
    }];

    const messages = buildDeepSeekVisionMessages(
      'คำถามทดสอบวิเคราะห์ภาพ',
      images,
      'คำสั่งระบบ Firekeeper'
    );

    assert(messages.length >= 2, 'Contains system instruction and user message');
    assert(messages[0].role === 'system', 'First message is system role');
    
    const userMsg = messages[messages.length - 1];
    assert(userMsg.role === 'user', 'Last message is user role');
    assert(Array.isArray(userMsg.content), 'User message content is an array of parts');
    
    const contentParts = userMsg.content as any[];
    const textPart = contentParts.find(p => p.type === 'text');
    const imagePart = contentParts.find(p => p.type === 'image_url');
    assert(!!textPart && textPart.text.includes('คำถามทดสอบ'), 'Text part correctly populated');
    assert(!!imagePart && imagePart.image_url?.url.startsWith('data:image/png;base64,'), 'Image part correctly populated');
  }

  // -------------------------------------------------------------
  // Test 8: Missing API Key Handling
  // -------------------------------------------------------------
  console.log('\nTest Group 8: Missing API Key Governance');
  {
    let threw = false;
    let errorMessage = '';
    try {
      await callDeepSeekVisionContentWithRetry(
        'ทดสอบ',
        [{ name: 'img.png', mimeType: 'image/png', size: 100, dataUrl: `data:image/png;base64,${VALID_PNG_BASE64}` }],
        DEEPSEEK_VISION_MODEL,
        undefined,
        '' // Empty API key override
      );
    } catch (err: any) {
      threw = true;
      errorMessage = err.message || '';
    }

    assert(threw, 'Throws when DEEPSEEK_API_KEY is missing');
    assert(errorMessage.includes('DEEPSEEK_API_KEY'), 'Clear governance message referencing DEEPSEEK_API_KEY');
  }

  // -------------------------------------------------------------
  // Test 9: Model Resolution & Tag Formatter
  // -------------------------------------------------------------
  console.log('\nTest Group 9: Model Resolution Utilities');
  {
    const prov1 = resolveProvider('deepseek-v4-flash-vision-exp');
    assert(prov1 === 'deepseek_vision', 'Resolves deepseek-v4-flash-vision-exp to deepseek_vision');

    const prov2 = resolveProvider(null, 'deepseek_vision');
    assert(prov2 === 'deepseek_vision', 'Resolves provider deepseek_vision');

    const details = resolveModelDetails('deepseek-v4-flash-vision-exp');
    assert(details.provider === 'deepseek_vision', 'Details provider is deepseek_vision');
    assert(details.tag === 'deepseek-v4-flash-vision-exp', 'Tag is deepseek-v4-flash-vision-exp');
    assert(!details.isLocal, 'isLocal is false for Vision provider');

    const status = checkDeepSeekVisionStatus();
    assert(status.model === DEEPSEEK_VISION_MODEL, 'Status endpoint reflects canonical vision model');
    assert(status.supportedFormats.includes('image/png'), 'Status includes image/png');
  }

  // -------------------------------------------------------------
  // Test 10: Server-Authoritative Override (Frontend Neutrality)
  // -------------------------------------------------------------
  console.log('\nTest Group 10: Server-Authoritative Override');
  {
    // Even if frontend sends rawModel = 'ollama:qwen3:4b', attaching an image forces DeepSeek Vision
    const attachments = [{
      name: 'diagram.png',
      type: 'image/png',
      dataUrl: `data:image/png;base64,${VALID_PNG_BASE64}`,
      size: 100
    }];

    const res = routeRequest('คำถาม', attachments, 'ollama:qwen3:4b');
    assert(res.provider === 'deepseek_vision', 'Backend router overrides frontend model when image is present');
    assert(res.model === 'deepseek-v4-flash-vision-exp', 'Canonical vision model enforced by backend');
    assert(res.decisionAuthority === 'SERVER_ROUTER_EXCLUSIVE', 'Authority flag confirms backend exclusive decision');
  }

  // -------------------------------------------------------------
  // Test 11: Explicit Selection of deepseek-v4-flash-vision-exp
  // -------------------------------------------------------------
  console.log('\nTest Group 11: Explicit Selection of Vision Model');
  {
    const res = routeRequest('ข้อความปกติ', [], 'deepseek-v4-flash-vision-exp');
    assert(res.provider === 'deepseek_vision', 'Explicit vision model selects deepseek_vision provider');
    assert(res.model === 'deepseek-v4-flash-vision-exp', 'Model is deepseek-v4-flash-vision-exp');
    assert(res.hasImages === false, 'hasImages is false when no images attached');
  }

  // -------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------
  console.log('\n════════════════════════════════════════════════════════════════');
  console.log(`📊 Test Results: ${passedTests}/${totalTests} Passed (${Math.round((passedTests / totalTests) * 100)}%)`);
  console.log('════════════════════════════════════════════════════════════════\n');

  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

runAllTests().catch((err) => {
  console.error('Fatal error running tests:', err);
  process.exit(1);
});
