#!/usr/bin/env node
/**
 * copy-apk.js — Firekeeper APK Pipeline
 * ──────────────────────────────────────
 * Copies the Gradle release output to the location expected by serve-apk.js
 * 
 * Source : android/app/build/outputs/apk/release/app-release.apk
 * Target : firekeeper-standalone.apk  (mobile root, serve-apk.js APK_PATH)
 *
 * Usage:
 *   node scripts/copy-apk.js
 *   npm run copy-apk
 */

const fs   = require('fs');
const path = require('path');
const crypto = require('crypto');

// ── Paths ──────────────────────────────────────────────────────────────────
const ROOT       = path.resolve(__dirname, '..');
const SOURCE_APK = path.join(ROOT, 'android', 'app', 'build', 'outputs', 'apk', 'release', 'app-release.apk');
const DEST_APK   = path.join(ROOT, 'firekeeper-standalone.apk');

// ── Helpers ────────────────────────────────────────────────────────────────
function formatBytes(bytes) {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(2)} MB (${bytes.toLocaleString()} bytes)`;
}

function sha256File(filePath) {
  return new Promise((resolve, reject) => {
    const hash   = crypto.createHash('sha256');
    const stream = fs.createReadStream(filePath);
    stream.on('data', chunk => hash.update(chunk));
    stream.on('end',  ()    => resolve(hash.digest('hex')));
    stream.on('error', reject);
  });
}

function formatDate(date) {
  return date.toLocaleString('th-TH', {
    year:   'numeric',
    month:  '2-digit',
    day:    '2-digit',
    hour:   '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

// ── Main ───────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n🔥 Firekeeper APK Copy Pipeline');
  console.log('═'.repeat(50));

  // 1. Check source exists
  if (!fs.existsSync(SOURCE_APK)) {
    console.error(`\n❌ Source APK not found:\n   ${SOURCE_APK}`);
    console.error('\n   Build the APK first:\n   cd android && ./gradlew assembleRelease\n');
    process.exit(1);
  }

  const srcStat = fs.statSync(SOURCE_APK);
  console.log(`\n📦 Source APK`);
  console.log(`   Path  : ${SOURCE_APK}`);
  console.log(`   Size  : ${formatBytes(srcStat.size)}`);
  console.log(`   Built : ${formatDate(srcStat.mtime)}`);

  // 2. Copy
  console.log(`\n📋 Copying...`);
  fs.copyFileSync(SOURCE_APK, DEST_APK);

  // 3. Verify destination
  const dstStat = fs.statSync(DEST_APK);
  if (dstStat.size !== srcStat.size) {
    console.error(`\n❌ Size mismatch after copy! Source=${srcStat.size} Dest=${dstStat.size}`);
    process.exit(1);
  }

  // 4. Compute checksum
  console.log(`   Computing SHA-256...`);
  const checksum = await sha256File(DEST_APK);

  // 5. Report
  console.log(`\n✅ APK ready for serving`);
  console.log(`   Destination : ${DEST_APK}`);
  console.log(`   Size        : ${formatBytes(dstStat.size)}`);
  console.log(`   SHA-256     : ${checksum}`);
  console.log(`   Timestamp   : ${formatDate(new Date())}`);

  // 6. Write manifest (optional — useful for CI/CD)
  const manifest = {
    name:       'firekeeper-standalone.apk',
    sourcePath: SOURCE_APK,
    destPath:   DEST_APK,
    sizeBytes:  dstStat.size,
    sha256:     checksum,
    builtAt:    srcStat.mtime.toISOString(),
    copiedAt:   new Date().toISOString(),
  };
  const manifestPath = path.join(ROOT, 'apk-manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n');
  console.log(`\n📝 Manifest written: ${manifestPath}`);
  console.log('\n🚀 Run "npm run serve" to start the download server on :8080\n');
}

main().catch(err => {
  console.error('\n❌ Unexpected error:', err.message);
  process.exit(1);
});
