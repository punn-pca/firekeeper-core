const http = require('http');
const fs = require('fs');
const path = require('path');

const APK_PATH = path.join(__dirname, 'firekeeper-standalone.apk');

function getLandingHtml(fileSizeMB, lastModified) {
  return `<!DOCTYPE html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ดาวน์โหลด FIRE KEEPER Android APK</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background: #050811;
      color: #f8fafc;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 24px;
      text-align: center;
    }
    .card {
      background: #090e1a;
      border: 1px solid rgba(245, 158, 11, 0.3);
      box-shadow: 0 10px 40px rgba(0,0,0,0.8), 0 0 30px rgba(245, 158, 11, 0.15);
      border-radius: 20px;
      max-width: 460px;
      width: 100%;
      padding: 32px 24px;
    }
    .logo-badge {
      width: 72px;
      height: 72px;
      margin: 0 auto 16px;
      background: linear-gradient(135deg, #f59e0b, #ea580c, #dc2626);
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 36px;
      box-shadow: 0 0 24px rgba(234, 88, 12, 0.5);
    }
    h1 {
      font-size: 22px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 1px;
      margin-bottom: 6px;
    }
    .subtitle {
      font-size: 13px;
      color: #94a3b8;
      margin-bottom: 24px;
      line-height: 1.5;
    }
    .btn-download {
      display: block;
      width: 100%;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      color: #000;
      font-weight: 800;
      font-size: 16px;
      padding: 16px 20px;
      border-radius: 14px;
      text-decoration: none;
      box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4);
      margin-bottom: 16px;
    }
    .meta-box {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 12px;
      padding: 12px;
      font-size: 12px;
      color: #cbd5e1;
      text-align: left;
      margin-bottom: 20px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }
    .meta-row:last-child { margin-bottom: 0; }
    .guide-box {
      background: rgba(245, 158, 11, 0.08);
      border: 1px solid rgba(245, 158, 11, 0.2);
      border-radius: 12px;
      padding: 14px;
      font-size: 11.5px;
      color: #fcd34d;
      text-align: left;
      line-height: 1.6;
    }
    .guide-title {
      font-weight: 700;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="logo-badge">🔥</div>
    <h1>FIRE KEEPER</h1>
    <div class="subtitle">Executive Decision Intelligence & Governance<br>PUNN Cognitive Architecture (PCA v3.0)</div>

    <a href="/firekeeper.apk" class="btn-download" download>
      📥 กดดาวน์โหลด APK (${fileSizeMB} MB)
    </a>

    <div class="meta-box">
      <div class="meta-row"><span>ชื่อไฟล์:</span><b style="font-family: monospace;">firekeeper.apk</b></div>
      <div class="meta-row"><span>ขนาด:</span><b>${fileSizeMB} MB</b></div>
      <div class="meta-row"><span>อัปเดตล่าสุด:</span><b>${lastModified}</b></div>
      <div class="meta-row"><span>แพลตฟอร์ม:</span><b>Android 8.0+</b></div>
    </div>

    <div class="guide-box">
      <div class="guide-title">ℹ️ คำแนะนำการติดตั้งบนมือถือ:</div>
      1. หากระบบแจ้งเตือน <i>"ไฟล์นี้อาจเป็นอันตราย"</i> ให้เลือก <b>"ดาวน์โหลดต่อไป" (Download anyway)</b><br>
      2. เมื่อดาวน์โหลดเสร็จ แตะที่ไฟล์เพื่อทำการ <b>ติดตั้ง (Install)</b><br>
      3. หากมีคำขอสิทธิ์ ให้เลือก <b>"อนุญาตจากแหล่งที่มานี้" (Allow from this source)</b>
    </div>
  </div>
</body>
</html>`;
}

const server = http.createServer((req, res) => {
  const parsedUrl = req.url.split('?')[0];
  console.log(`[${new Date().toLocaleTimeString()}] ${req.method} ${parsedUrl}`);

  if (parsedUrl === '/' || parsedUrl === '/index.html') {
    if (!fs.existsSync(APK_PATH)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('APK not found');
    }
    const stat = fs.statSync(APK_PATH);
    const sizeMB = (stat.size / (1024 * 1024)).toFixed(1);
    const timeStr = stat.mtime.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const html = getLandingHtml(sizeMB, timeStr);
    res.writeHead(200, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': Buffer.byteLength(html),
    });
    return res.end(html);
  }

  if (parsedUrl === '/firekeeper.apk' || parsedUrl === '/firekeeper-standalone.apk') {
    if (!fs.existsSync(APK_PATH)) {
      res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('APK not found');
    }

    const stat = fs.statSync(APK_PATH);
    const totalSize = stat.size;
    const range = req.headers.range;

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1;

      if (start >= totalSize || end >= totalSize) {
        res.writeHead(416, { 'Content-Range': `bytes */${totalSize}` });
        return res.end();
      }

      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(APK_PATH, { start, end });

      res.writeHead(206, {
        'Content-Range': `bytes ${start}-${end}/${totalSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="firekeeper.apk"',
        'Access-Control-Allow-Origin': '*',
      });

      if (req.method === 'HEAD') return res.end();
      return fileStream.pipe(res);
    } else {
      res.writeHead(200, {
        'Content-Length': totalSize,
        'Accept-Ranges': 'bytes',
        'Content-Type': 'application/vnd.android.package-archive',
        'Content-Disposition': 'attachment; filename="firekeeper.apk"',
        'Access-Control-Allow-Origin': '*',
      });

      if (req.method === 'HEAD') return res.end();
      const fileStream = fs.createReadStream(APK_PATH);
      return fileStream.pipe(res);
    }
  }

  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(8080, '0.0.0.0', () => {
  console.log('APK Download server running on http://0.0.0.0:8080');
});
