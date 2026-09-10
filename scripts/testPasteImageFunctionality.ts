import { extractImagesFromClipboardEvent, normalizePastedImageFile, MAX_ATTACHMENT_SIZE_BYTES, formatFileSize } from '../src/utils/fileUtils';

let passed = 0;
let failed = 0;

function assert(condition: boolean, message: string) {
  if (condition) {
    console.log(`  ✅ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL: ${message}`);
    failed++;
  }
}

console.log('════════════════════════════════════════════════════════════════');
console.log('🧪 FIRE KEEPER: Paste Image Clipboard Functionality Tests');
console.log('════════════════════════════════════════════════════════════════');

// Test Group 1: normalizePastedImageFile
console.log('Test Group 1: normalizePastedImageFile');
{
  const genericPng = new File(['mock data'], 'image.png', { type: 'image/png' });
  const normalizedPng = normalizePastedImageFile(genericPng, 0);
  assert(normalizedPng.name.startsWith('pasted-image-') && normalizedPng.name.endsWith('.png'), 'Normalizes generic image.png to timestamped name');
  assert(normalizedPng.type === 'image/png', 'Preserves image/png type');

  const genericJpg = new File(['mock data'], 'blob', { type: 'image/jpeg' });
  const normalizedJpg = normalizePastedImageFile(genericJpg, 1);
  assert(normalizedJpg.name.startsWith('pasted-image-') && normalizedJpg.name.endsWith('-2.jpg'), 'Normalizes blob JPEG with index offset');

  const customNamed = new File(['mock data'], 'my-screenshot-2026.png', { type: 'image/png' });
  const normalizedCustom = normalizePastedImageFile(customNamed, 0);
  assert(normalizedCustom.name === 'my-screenshot-2026.png', 'Preserves already customized file names');
}

// Test Group 2: extractImagesFromClipboardEvent with items
console.log('Test Group 2: extractImagesFromClipboardEvent with items');
{
  const mockImageFile = new File(['image-bytes'], 'image.png', { type: 'image/png' });
  const mockTextItem = {
    kind: 'string',
    type: 'text/plain',
    getAsFile: () => null,
  };
  const mockImageItem = {
    kind: 'file',
    type: 'image/png',
    getAsFile: () => mockImageFile,
  };

  const mockClipboardEvent = {
    clipboardData: {
      items: [mockTextItem, mockImageItem],
    },
  } as unknown as ClipboardEvent;

  const extracted = extractImagesFromClipboardEvent(mockClipboardEvent);
  assert(extracted.length === 1, 'Extracts 1 image file from clipboard items');
  assert(extracted[0].type === 'image/png', 'Extracted file is image/png');
  assert(extracted[0].name.startsWith('pasted-image-'), 'Filename normalized');
}

// Test Group 3: extractImagesFromClipboardEvent with text-only clipboard
console.log('Test Group 3: extractImagesFromClipboardEvent with text-only clipboard');
{
  const mockTextItem = {
    kind: 'string',
    type: 'text/plain',
    getAsFile: () => null,
  };

  const mockClipboardEvent = {
    clipboardData: {
      items: [mockTextItem],
    },
  } as unknown as ClipboardEvent;

  const extracted = extractImagesFromClipboardEvent(mockClipboardEvent);
  assert(extracted.length === 0, 'Returns empty array when clipboard has text only (allowing default text paste)');
}

// Test Group 4: extractImagesFromClipboardEvent with multiple images (e.g. multi-selection paste)
console.log('Test Group 4: Multi-image paste');
{
  const mockPng = new File(['png-bytes'], 'image.png', { type: 'image/png' });
  const mockJpg = new File(['jpg-bytes'], 'photo.jpg', { type: 'image/jpeg' });
  const mockClipboardEvent = {
    clipboardData: {
      items: [
        { kind: 'file', type: 'image/png', getAsFile: () => mockPng },
        { kind: 'file', type: 'image/jpeg', getAsFile: () => mockJpg },
      ],
    },
  } as unknown as ClipboardEvent;

  const extracted = extractImagesFromClipboardEvent(mockClipboardEvent);
  assert(extracted.length === 2, 'Extracts multiple image items');
  assert(extracted[0].type === 'image/png', 'First is PNG');
  assert(extracted[1].type === 'image/jpeg', 'Second is JPEG');
}

// Test Group 5: Size validation
console.log('Test Group 5: Size limits and formatting');
{
  assert(MAX_ATTACHMENT_SIZE_BYTES === 20 * 1024 * 1024, 'Max attachment size limit is 20MB');
  assert(formatFileSize(20 * 1024 * 1024) === '20 MB', 'formatFileSize renders 20 MB correctly');
}

console.log('════════════════════════════════════════════════════════════════');
console.log(`📊 Test Results: ${passed}/${passed + failed} Passed (${Math.round((passed / (passed + failed)) * 100)}%)`);
console.log('════════════════════════════════════════════════════════════════');

if (failed > 0) {
  process.exit(1);
}
