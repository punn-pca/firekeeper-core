const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateFavicons() {
  const svgPath = path.join(__dirname, '../public/favicon.svg');
  const publicDir = path.join(__dirname, '../public');
  const svgBuffer = fs.readFileSync(svgPath);

  const targets = [
    { name: 'favicon-16x16.png', size: 16 },
    { name: 'favicon-32x32.png', size: 32 },
    { name: 'favicon-48x48.png', size: 48 }, // Google Recommended 48px
    { name: 'favicon-96x96.png', size: 96 }, // Google Recommended 96px
    { name: 'apple-touch-icon.png', size: 180 },
    { name: 'apple-touch-icon-180x180.png', size: 180 },
    { name: 'android-chrome-192x192.png', size: 192 },
    { name: 'favicon-192x192.png', size: 192 },
    { name: 'android-chrome-512x512.png', size: 512 },
    { name: 'favicon-512x512.png', size: 512 },
    { name: 'logo.png', size: 512 }
  ];

  for (const t of targets) {
    const outPath = path.join(publicDir, t.name);
    await sharp(svgBuffer)
      .resize(t.size, t.size)
      .png()
      .toFile(outPath);
    console.log(`Generated ${t.name} (${t.size}x${t.size})`);
  }

  // Generate favicon.ico (using 32x32 or 48x48 PNG format or direct ICO fallback)
  // Sharp can output png, and standard modern browsers & Googlebot accept 48x48/32x32 PNG as favicon.ico or multi-size
  const ico32Buffer = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico32Buffer);
  console.log('Generated favicon.ico');
}

generateFavicons().catch(console.error);
