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
    { name: 'favicon-512x512.png', size: 512 }
  ];

  for (const t of targets) {
    const outPath = path.join(publicDir, t.name);
    await sharp(svgBuffer)
      .resize(t.size, t.size)
      .png()
      .toFile(outPath);
    console.log(`Generated ${t.name} (${t.size}x${t.size})`);
  }

  // The in-page logo must have a transparent canvas in both themes.
  // Keep the dark squircle for favicons and app icons only.
  const transparentLogoSvg = svgBuffer.toString('utf8')
    .replace(/<rect\s+width="512"\s+height="512"\s+rx="116"\s+fill="#070A11"\s*\/>/, '')
    .replace(/<rect\s+x="2"\s+y="2"\s+width="508"\s+height="508"\s+rx="114"[^>]*\/>/, '');
  if (transparentLogoSvg === svgBuffer.toString('utf8') || transparentLogoSvg.includes('fill="#070A11"')) {
    throw new Error('Unable to remove logo background from favicon SVG');
  }
  await sharp(Buffer.from(transparentLogoSvg))
    .resize(512, 512)
    .ensureAlpha()
    .png()
    .toFile(path.join(publicDir, 'logo.png'));
  console.log('Generated logo.png (512x512, transparent background)');

  // Generate favicon.ico (using 32x32 or 48x48 PNG format or direct ICO fallback)
  // Sharp can output png, and standard modern browsers & Googlebot accept 48x48/32x32 PNG as favicon.ico or multi-size
  const ico32Buffer = await sharp(svgBuffer).resize(32, 32).png().toBuffer();
  fs.writeFileSync(path.join(publicDir, 'favicon.ico'), ico32Buffer);
  console.log('Generated favicon.ico');
}

generateFavicons().catch((error) => { console.error(error); process.exitCode = 1; });
